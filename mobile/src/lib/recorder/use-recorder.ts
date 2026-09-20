import { RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from "expo-audio";
import { deleteAsync } from "expo-file-system/legacy";
import { useCallback, useEffect, useRef, useState } from "react";

export type RecorderStatus = "idle" | "requesting" | "recording" | "processing" | "denied";

const MAX_DURATION_MS = 15_000;
/** Below this there is nothing to hear, so the clip is dropped instead of sent. */
const MIN_CLIP_SECONDS = 0.5;

/**
 * Records a short clip with expo-audio and hands it to `onClip`, then deletes
 * the file so nothing is left on disk (the Privacy Policy says audio is not
 * kept). Clips stop themselves after fifteen seconds, matching the web recorder.
 */
export function useRecorder(onClip: (file: { uri: string; name: string; type: string }) => Promise<void>) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const state = useAudioRecorderState(recorder, 100);
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // When the microphone actually began, so callers can ask how much was heard
  // without waiting for the polled state to catch up.
  const startedAt = useRef<number | null>(null);
  // Set when a clip is called off while the microphone is still being started.
  const abandoned = useRef(false);

  /** Milliseconds of audio captured so far; zero when nothing is being recorded. */
  const heardMs = useCallback(() => (startedAt.current === null ? 0 : Date.now() - startedAt.current), []);

  const clearTimer = () => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };

  const stop = useCallback(async () => {
    clearTimer();
    startedAt.current = null;
    setStatus("processing");
    let uri: string | null = null;
    try {
      // Read the length before stopping: a clip this short holds no words, and
      // an empty file fails on the way up rather than coming back as no match.
      const heard = recorder.currentTime;
      await recorder.stop();
      uri = recorder.uri;
      if (uri !== null && heard >= MIN_CLIP_SECONDS) await onClip({ uri, name: "clip.m4a", type: "audio/mp4" });
    } catch {
      // A failed stop or upload still returns the button to idle below.
    } finally {
      if (uri !== null) await deleteAsync(uri, { idempotent: true }).catch(() => undefined);
      setStatus("idle");
    }
  }, [onClip, recorder]);

  /** Ends the clip without sending it: for a hold too short to have heard anything. */
  const cancel = useCallback(async () => {
    clearTimer();
    startedAt.current = null;
    // Let go before the microphone was ready: tell `start` below to drop it.
    abandoned.current = true;
    try {
      await recorder.stop();
    } catch {
      // Nothing was recording; the file cleanup below still runs.
    } finally {
      const uri = recorder.uri;
      if (uri !== null) await deleteAsync(uri, { idempotent: true }).catch(() => undefined);
      setStatus("idle");
    }
  }, [recorder]);

  const start = useCallback(async () => {
    // Ignore taps while a clip is being requested, recorded or uploaded.
    if (status === "recording" || status === "requesting" || status === "processing") return;
    abandoned.current = false;
    setStatus("requesting");
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        setStatus("denied");
        return;
      }
      // Each step below waits, and the finger may come off meanwhile; check
      // after every one so an abandoned clip never reaches the microphone.
      if (abandoned.current) { setStatus("idle"); return; }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      if (abandoned.current) { setStatus("idle"); return; }
      await recorder.prepareToRecordAsync();
      if (abandoned.current) { setStatus("idle"); return; }
      recorder.record();
      startedAt.current = Date.now();
      setStatus("recording");
      timer.current = setTimeout(() => void stop(), MAX_DURATION_MS);
    } catch {
      setStatus("idle");
    }
  }, [recorder, status, stop]);

  useEffect(() => () => {
    clearTimer();
    // Release the microphone if the screen unmounts mid-clip.
    void recorder.stop().catch(() => undefined);
  }, [recorder]);

  return { status, start, stop, cancel, heardMs, elapsedMs: state.durationMillis, level: state.metering ?? null };
}
