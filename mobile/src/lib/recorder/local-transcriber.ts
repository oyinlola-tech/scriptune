import { initWhisper, type WhisperContext } from "whisper.rn/index";
import { offlineModelPath } from "../offline/whisper-model";

let context: WhisperContext | null = null;
let loading: Promise<WhisperContext> | null = null;

/** Loads the on-device model once and keeps it warm; call `releaseLocalTranscriber` after the model is removed. */
async function getContext(): Promise<WhisperContext> {
  if (context !== null) return context;
  loading ??= initWhisper({ filePath: offlineModelPath(), useGpu: true }).then(
    (ready) => { context = ready; loading = null; return ready; },
    (error: unknown) => { loading = null; throw error; },
  );
  return loading;
}

export async function releaseLocalTranscriber(): Promise<void> {
  const current = context;
  context = null;
  await current?.release().catch(() => undefined);
}

export interface LocalTranscript { text: string; language: string }

/**
 * Turns 16 kHz mono 16-bit PCM into words on this device. Whisper detects the
 * language itself, so Yoruba and English both work.
 */
export async function transcribeLocally(pcm: Int16Array): Promise<LocalTranscript> {
  const whisper = await getContext();
  const samples = new Float32Array(pcm.length);
  for (let i = 0; i < pcm.length; i += 1) samples[i] = (pcm[i] ?? 0) / 32768;
  const { promise } = whisper.transcribeData(samples.buffer, { language: "auto", maxThreads: 4 });
  const result = await promise;
  return { text: result.result.trim(), language: result.language };
}
