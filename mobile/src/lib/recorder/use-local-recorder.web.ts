import { useCallback, useState } from "react";
import type { LocalTranscript } from "./local-transcriber";
import type { RecorderStatus } from "./use-recorder";

/** Web build: no on-device model, so this recorder only says so. */
export function useLocalRecorder(_onTranscript: (transcript: LocalTranscript) => Promise<void>, onError: (message: string) => void) {
  const [status] = useState<RecorderStatus>("idle");
  const start = useCallback(async () => onError("Offline listening is only available in the Scriptune app."), [onError]);
  const stop = useCallback(async () => undefined, []);
  return { status, start, stop, elapsedMs: 0, level: null as number | null };
}
