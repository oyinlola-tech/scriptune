import LiveAudioStream from "@fugood/react-native-audio-pcm-stream";
import { requestRecordingPermissionsAsync, setAudioModeAsync } from "expo-audio";
import { useCallback, useEffect, useRef, useState } from "react";
import type { RecorderStatus } from "./use-recorder";
import { transcribeLocally, type LocalTranscript } from "./local-transcriber";

const SAMPLE_RATE = 16_000;
const MAX_DURATION_MS = 15_000;
const MAX_SAMPLES = SAMPLE_RATE * (MAX_DURATION_MS / 1000);

/** Base64 PCM frames from the microphone -> 16-bit samples. */
function decodeFrame(base64: string): Int16Array {
  const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
  return new Int16Array(bytes.buffer, 0, Math.floor(bytes.byteLength / 2));
}

/**
 * The offline twin of `useRecorder`: captures raw audio straight from the
 * microphone and transcribes it on this device with the downloaded Whisper
 * model, so identifying works with no connection. Same fifteen-second cap.
 */
export function useLocalRecorder(onTranscript: (transcript: LocalTranscript) => Promise<void>, onError: (message: string) => void) {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [level, setLevel] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const frames = useRef<Int16Array[]>([]);
  const samples = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedAt = useRef(0);
  const listening = useRef(false);

  const clearTimer = () => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };

  const stop = useCallback(async () => {
    clearTimer();
    if (!listening.current) return;
    listening.current = false;
    setStatus("processing");
    try {
      await LiveAudioStream.stop();
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
    } catch {
      onError("Could not make out the recording on this device. Try again closer to the sound.");
    } finally {
      setLevel(null);
      setStatus("idle");
    }
  }, [onError, onTranscript]);

  const start = useCallback(async () => {
    if (status !== "idle" && status !== "denied") return;
    setStatus("requesting");
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        setStatus("denied");
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      LiveAudioStream.init({ sampleRate: SAMPLE_RATE, channels: 1, bitsPerSample: 16, audioSource: 6, bufferSize: 4096, wavFile: "" });
      frames.current = [];
      samples.current = 0;
      LiveAudioStream.on("data", (data: string) => {
        if (!listening.current) return;
        const frame = decodeFrame(data);
        const room = MAX_SAMPLES - samples.current;
        if (room <= 0) return;
        const kept = frame.length > room ? frame.subarray(0, room) : frame;
        frames.current.push(kept);
        samples.current += kept.length;
        // A rough level for the button's meter: sampled RMS in dBFS.
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
      listening.current = false;
      setStatus("idle");
      onError("The microphone could not be started.");
    }
  }, [onError, status, stop]);

  useEffect(() => {
    if (status !== "recording") return undefined;
    const tick = setInterval(() => setElapsedMs(Date.now() - startedAt.current), 250);
    return () => clearInterval(tick);
  }, [status]);

  useEffect(
    () => () => {
      clearTimer();
      if (listening.current) {
        listening.current = false;
        void LiveAudioStream.stop().catch(() => undefined);
      }
    },
    [],
  );

  return { status, start, stop, elapsedMs, level };
}
