import { RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from "expo-audio";
import { deleteAsync } from "expo-file-system/legacy";
import { useCallback, useEffect, useRef, useState } from "react";

export type RecorderStatus = "idle" | "requesting" | "recording" | "processing" | "denied";

const MAX_DURATION_MS = 15_000;

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

  const clearTimer = () => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };

  const stop = useCallback(async () => {
    clearTimer();
    setStatus("processing");
    let uri: string | null = null;
    try {
      await recorder.stop();
      uri = recorder.uri;
      if (uri !== null) await onClip({ uri, name: "clip.m4a", type: "audio/mp4" });
    } catch {
      // A failed stop or upload still returns the button to idle below.
    } finally {
      if (uri !== null) await deleteAsync(uri, { idempotent: true }).catch(() => undefined);
      setStatus("idle");
    }
  }, [onClip, recorder]);

  const start = useCallback(async () => {
    // Ignore taps while a clip is being requested, recorded or uploaded.
    if (status === "recording" || status === "requesting" || status === "processing") return;
    setStatus("requesting");
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        setStatus("denied");
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
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

  return { status, start, stop, elapsedMs: state.durationMillis, level: state.metering ?? null };
}
