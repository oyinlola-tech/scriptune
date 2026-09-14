// Web build: there is no SQLite here, so nothing is ever downloaded. Every
// screen already falls back to the API when the local readers return null.
import type { CorpusRecord } from "./database";
export type { CorpusRecord } from "./database";

export function openDatabase(): Promise<never> {
  return Promise.reject(new Error("Offline copies are not available in the browser."));
}
export async function listCorpora(): Promise<CorpusRecord[]> {
  return [];
}
export async function hasCorpus(): Promise<boolean> {
  return false;
}
