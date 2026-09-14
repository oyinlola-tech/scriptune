// Web build: on-device speech-to-text needs the native app. Mirrors whisper-model.ts.
import { useQuery, useQueryClient } from "@tanstack/react-query";

export const OFFLINE_MODEL = {
  id: "base-q5_1",
  label: "Whisper base",
  bytes: 60_000_000,
  url: "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base-q5_1.bin",
} as const;

export type ModelProgress = { phase: "downloading"; done: number; total: number } | { phase: "done" };

export const offlineModelKey = ["offline", "whisper-model"] as const;
export const offlineModelPath = () => "";
export async function hasOfflineModel(): Promise<boolean> { return false; }
export async function downloadOfflineModel(): Promise<void> { throw new Error("Offline listening is only available in the Scriptune app."); }
export async function removeOfflineModel(): Promise<void> { return undefined; }
export function useOfflineModel() {
  const query = useQuery({ queryKey: offlineModelKey, queryFn: hasOfflineModel, staleTime: Infinity });
  return { hasModel: false, isLoaded: query.isSuccess };
}
export function useInvalidateOfflineModel() {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: offlineModelKey });
}
