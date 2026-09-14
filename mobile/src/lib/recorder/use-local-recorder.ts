import LiveAudioStream from "@fugood/react-native-audio-pcm-stream";
import { requestRecordingPermissionsAsync, setAudioModeAsync } from "expo-audio";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, type EmitterSubscription } from "react-native";
import { discardOfflineModel, useInvalidateOfflineModel } from "../offline/whisper-model";
import { ModelLoadError, transcribeLocally, type LocalTranscript } from "./local-transcriber";
import type { RecorderStatus } from "./use-recorder";

const SAMPLE_RATE = 16_000;
const MAX_DURATION_MS = 15_000;
const MAX_SAMPLES = SAMPLE_RATE * (MAX_DURATION_MS / 1000);
/** Android frees the capture thread a moment after stop; starting again inside that window loses the session. */
const RESTART_GAP_MS = 250;

/** Base64 PCM frames from the microphone -> 16-bit samples (copied, so the view owns aligned memory). */
function decodeFrame(base64: string): Int16Array {
  const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
  const samples = new Int16Array(Math.floor(bytes.byteLength / 2));
  new Uint8Array(samples.buffer).set(bytes.subarray(0, samples.length * 2));
  return samples;
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * The offline twin of `useRecorder`: captures raw audio straight from the
 * microphone and transcribes it on this device with the downloaded Whisper
 * model, so identifying works with no connection. Same fifteen-second cap.
 */
export function useLocalRecorder(onTranscript: (transcript: LocalTranscript) => Promise<void>, onError: (message: string) => void) {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [level, setLevel] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const invalidateModel = useInvalidateOfflineModel();
  const frames = useRef<Int16Array[]>([]);
  const samples = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedAt = useRef(0);
  const stoppedAt = useRef(0);
  const lastLevelAt = useRef(0);
  // Refs, not state, guard re-entry: two taps in one frame both see the same state.
  const listening = useRef(false);
  const busy = useRef(false);
  const subscription = useRef<EmitterSubscription | null>(null);

  const clearTimer = () => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };

  /** Stops the capture without transcribing; safe to call at any time. */
  const abandon = useCallback(() => {
    clearTimer();
    listening.current = false;
    subscription.current?.remove();
    subscription.current = null;
    try { LiveAudioStream.stop(); } catch { /* not started */ }
    stoppedAt.current = Date.now();
    frames.current = [];
    samples.current = 0;
  }, []);

  const stop = useCallback(async () => {
    clearTimer();
    if (!listening.current || busy.current) return;
    listening.current = false;
    busy.current = true;
    setStatus("processing");
    try {
      subscription.current?.remove();
      subscription.current = null;
      try { LiveAudioStream.stop(); } catch { /* already stopped */ }
      stoppedAt.current = Date.now();
      const pcm = new Int16Array(samples.current);
      let offset = 0;
      for (const frame of frames.current) {
        pcm.set(frame, offset);
        offset += frame.length;
      }
      frames.current = [];
      samples.current = 0;
      if (pcm.length < SAMPLE_RATE / 2) {
        onError("That was too short to hear. Hold on a little longer next time.");
        return;
      }
      await onTranscript(await transcribeLocally(pcm));
    } catch (error) {
      if (error instanceof ModelLoadError) {
        // The file on disk is not a usable model: drop it so Offline copies offers the download again.
        await discardOfflineModel().catch(() => undefined);
        void invalidateModel();
        onError("The offline listening model on this device is damaged and has been removed. Download it again from Offline copies.");
      } else {
        onError("Could not make out the recording on this device. Try again closer to the sound.");
      }
    } finally {
      await setAudioModeAsync({ allowsRecording: false }).catch(() => undefined);
      setLevel(null);
      setStatus("idle");
      busy.current = false;
    }
  }, [invalidateModel, onError, onTranscript]);

  const start = useCallback(async () => {
    if (listening.current || busy.current) return;
    busy.current = true;
    setStatus("requesting");
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        setStatus("denied");
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      const sinceStop = Date.now() - stoppedAt.current;
      if (sinceStop < RESTART_GAP_MS) await wait(RESTART_GAP_MS - sinceStop);
      await LiveAudioStream.init({ sampleRate: SAMPLE_RATE, channels: 1, bitsPerSample: 16, audioSource: 6, bufferSize: 4096, wavFile: "" });
      frames.current = [];
      samples.current = 0;
      subscription.current?.remove();
      subscription.current = LiveAudioStream.on("data", (data: string) => {
        if (!listening.current) return;
        const frame = decodeFrame(data);
        const room = MAX_SAMPLES - samples.current;
        if (room <= 0) return;
        const kept = frame.length > room ? frame.subarray(0, room) : frame;
        frames.current.push(kept);
        samples.current += kept.length;
        // A rough level for the button's meter, at most a few times a second.
        const now = Date.now();
        if (now - lastLevelAt.current < 120) return;
        lastLevelAt.current = now;
        let sum = 0;
        let count = 0;
        for (let i = 0; i < kept.length; i += 64) {
          const value = kept[i] ?? 0;
          sum += value * value;
          count += 1;
        }
        const rms = Math.sqrt(sum / Math.max(1, count)) / 32768;
        setLevel(Math.round(20 * Math.log10(Math.max(rms, 1e-4))));
      });
      listening.current = true;
      startedAt.current = Date.now();
      setElapsedMs(0);
      LiveAudioStream.start();
      setStatus("recording");
      timer.current = setTimeout(() => void stop(), MAX_DURATION_MS);
    } catch {
      abandon();
      setStatus("idle");
      onError("The microphone could not be started. Close other apps that may be using it and try again.");
    } finally {
      busy.current = false;
    }
  }, [abandon, onError, stop]);

  useEffect(() => {
    if (status !== "recording") return undefined;
    const tick = setInterval(() => setElapsedMs(Date.now() - startedAt.current), 250);
    return () => clearInterval(tick);
  }, [status]);

  // No background audio mode: a clip cut off by the app going to the background is dropped, not transcribed as silence.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      if (next !== "active" && listening.current) {
        abandon();
        setLevel(null);
        setStatus("idle");
      }
    });
    return () => sub.remove();
  }, [abandon]);

  useEffect(() => () => abandon(), [abandon]);

  return { status, start, stop, elapsedMs, level };
}
