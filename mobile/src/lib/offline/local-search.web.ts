// Web build: nothing is stored locally, so local search and recognition find nothing.
import type { RecognitionResultDto, SearchAllResultDto } from "@scriptune/contracts";

export function tokenize(text: string): string[] {
  const words = fold(text).replace(/[^\p{L}\p{N}\s']/gu, " ").split(/\s+/).map((word) => word.replace(/^'+|'+$/g, "")).filter((word) => word.length >= 2);
  return [...new Set(words)];
}

export async function searchLocal(query: string): Promise<SearchAllResultDto> {
  return { query, verses: null, hymns: { results: [] } };
}
export async function recognizeLocal(transcript: string, mode: "bible" | "hymn" | "auto" = "auto"): Promise<RecognitionResultDto> {
  return { attemptId: `local-${Date.now()}`, mode: mode.toUpperCase() as RecognitionResultDto["mode"], inputType: "TEXT", transcript, transcription: null, candidates: [], best: null, durationMs: 0, createdAt: new Date().toISOString() };
}
