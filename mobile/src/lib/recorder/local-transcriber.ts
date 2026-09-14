import { initWhisper, type WhisperContext } from "whisper.rn/index";
import { offlineModelPath } from "../offline/whisper-model";

let context: WhisperContext | null = null;
let loading: Promise<WhisperContext> | null = null;
// Bumped on release, so a load that was in flight when the model was removed is discarded.
let generation = 0;

/** Raised when the model file on disk cannot be loaded (truncated, corrupt, or a captive-portal page). */
export class ModelLoadError extends Error {}

async function getContext(): Promise<WhisperContext> {
  if (context !== null) return context;
  if (loading === null) {
    const mine = generation;
    loading = initWhisper({ filePath: offlineModelPath(), useGpu: true }).then(
      (ready) => {
        loading = null;
        if (mine !== generation) { void ready.release().catch(() => undefined); throw new ModelLoadError("The model was removed while loading."); }
        context = ready;
        return ready;
      },
      (error: unknown) => { loading = null; throw new ModelLoadError(error instanceof Error ? error.message : "The model could not be loaded."); },
    );
  }
  return loading;
}

/** Frees the model; call after removing the file so the next load reads the disk again. */
export async function releaseLocalTranscriber(): Promise<void> {
  generation += 1;
  const pending = loading;
  const current = context;
  context = null;
  if (pending !== null) await pending.catch(() => undefined);
  await current?.release().catch(() => undefined);
}

export interface LocalTranscript { text: string; language: string }

/**
 * Turns 16 kHz mono signed 16-bit PCM into words on this device. whisper.rn
 * reads the buffer as int16 itself, so the samples go in untouched. Whisper
 * detects the language, so Yoruba and English both work.
 */
export async function transcribeLocally(pcm: Int16Array): Promise<LocalTranscript> {
  const whisper = await getContext();
  const bytes = new Int16Array(pcm).buffer as ArrayBuffer;
  const { promise } = whisper.transcribeData(bytes, { language: "auto", maxThreads: 4 });
  const result = await promise;
  return { text: result.result.trim(), language: result.language };
}
