import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createDownloadResumable, deleteAsync, documentDirectory, getInfoAsync, makeDirectoryAsync, moveAsync } from "expo-file-system/legacy";

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

export async function hasOfflineModel(): Promise<boolean> {
  const info = await getInfoAsync(offlineModelPath()).catch(() => null);
  return info?.exists === true && (info.size ?? 0) > 1_000_000;
}

/** Downloads to a .part file and only renames it once the whole model has arrived. */
export async function downloadOfflineModel(onProgress: (progress: ModelProgress) => void = () => undefined): Promise<void> {
  await makeDirectoryAsync(dir(), { intermediates: true }).catch(() => undefined);
  const part = `${offlineModelPath()}.part`;
  await deleteAsync(part, { idempotent: true }).catch(() => undefined);
  const task = createDownloadResumable(OFFLINE_MODEL.url, part, {}, (data) => {
    onProgress({ phase: "downloading", done: data.totalBytesWritten, total: data.totalBytesExpectedToWrite > 0 ? data.totalBytesExpectedToWrite : OFFLINE_MODEL.bytes });
  });
  const result = await task.downloadAsync();
  if (result === undefined || result.status !== 200) {
    await deleteAsync(part, { idempotent: true }).catch(() => undefined);
    throw new Error(`The model download stopped (HTTP ${result?.status ?? "?"}).`);
  }
  await moveAsync({ from: part, to: offlineModelPath() });
  onProgress({ phase: "done" });
}

export async function removeOfflineModel(): Promise<void> {
  await deleteAsync(offlineModelPath(), { idempotent: true });
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
