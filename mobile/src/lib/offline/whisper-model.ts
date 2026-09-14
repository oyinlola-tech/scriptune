import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createDownloadResumable, deleteAsync, documentDirectory, getInfoAsync, makeDirectoryAsync, moveAsync, readAsStringAsync } from "expo-file-system/legacy";

/**
 * The speech-to-text model kept on the device for listening without a
 * connection. Quantised Whisper "base": multilingual, about 60 MB, the largest
 * that stays quick on a phone. It is fetched on demand, never bundled.
 */
export const OFFLINE_MODEL = {
  id: "base-q5_1",
  label: "Whisper base",
  bytes: 60_000_000,
  url: "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base-q5_1.bin",
} as const;

export type ModelProgress = { phase: "downloading"; done: number; total: number } | { phase: "done" };

const dir = () => `${documentDirectory ?? ""}whisper/`;
export const offlineModelPath = () => `${dir()}${OFFLINE_MODEL.id}.bin`;
export const offlineModelKey = ["offline", "whisper-model"] as const;

/** GGML checkpoints start with the bytes "lmgg" (0x67676d6c little-endian). */
const GGML_MAGIC = "lmgg";

/** True when the file exists, is big enough to be a model and starts with the GGML magic. */
async function looksLikeModel(path: string, minBytes: number): Promise<boolean> {
  const info = await getInfoAsync(path).catch(() => null);
  if (info?.exists !== true || (info.size ?? 0) < minBytes) return false;
  const head = await readAsStringAsync(path, { encoding: "base64", position: 0, length: 4 }).catch(() => "");
  return atob(head) === GGML_MAGIC;
}

export async function hasOfflineModel(): Promise<boolean> {
  return looksLikeModel(offlineModelPath(), OFFLINE_MODEL.bytes * 0.9);
}

let inFlight: Promise<void> | null = null;

/**
 * Downloads to a .part file and only renames it once the whole model has
 * arrived and checks out. A second call while one is running joins it rather
 * than truncating the file under it.
 */
export function downloadOfflineModel(onProgress: (progress: ModelProgress) => void = () => undefined): Promise<void> {
  inFlight ??= (async () => {
    await makeDirectoryAsync(dir(), { intermediates: true }).catch(() => undefined);
    const part = `${offlineModelPath()}.part`;
    await deleteAsync(part, { idempotent: true }).catch(() => undefined);
    let expected: number = OFFLINE_MODEL.bytes;
    const task = createDownloadResumable(OFFLINE_MODEL.url, part, {}, (data) => {
      if (data.totalBytesExpectedToWrite > 0) expected = data.totalBytesExpectedToWrite;
      onProgress({ phase: "downloading", done: data.totalBytesWritten, total: expected });
    });
    const result = await task.downloadAsync();
    if (result === undefined || result.status !== 200) {
      await deleteAsync(part, { idempotent: true }).catch(() => undefined);
      throw new Error(`The model download stopped (HTTP ${result?.status ?? "?"}).`);
    }
    // A captive portal or CDN error page answers 200 with HTML; never install that as a model.
    if (!(await looksLikeModel(part, Math.min(expected, OFFLINE_MODEL.bytes) * 0.9))) {
      await deleteAsync(part, { idempotent: true }).catch(() => undefined);
      throw new Error("What arrived was not a Whisper model. Check the connection and try again.");
    }
    await moveAsync({ from: part, to: offlineModelPath() });
    onProgress({ phase: "done" });
  })().finally(() => { inFlight = null; });
  return inFlight;
}

export async function removeOfflineModel(): Promise<void> {
  await deleteAsync(offlineModelPath(), { idempotent: true });
}

/** Removes a model file that failed to load, so the download can be offered again. */
export async function discardOfflineModel(): Promise<void> {
  await removeOfflineModel();
}

/** Whether the model is on this device; refreshes after download or removal. */
export function useOfflineModel() {
  const query = useQuery({ queryKey: offlineModelKey, queryFn: hasOfflineModel, staleTime: Infinity });
  return { hasModel: query.data === true, isLoaded: query.isSuccess };
}

export function useInvalidateOfflineModel() {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: offlineModelKey });
}
