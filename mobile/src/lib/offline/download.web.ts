// Web build: downloads need SQLite, which the browser build does not have.
export type { DownloadProgress } from "./download";

const unavailable = () => Promise.reject(new Error("Offline copies are not available in the browser. Use the Scriptune app to keep the words with you."));
export async function downloadTranslation(): Promise<void> { return unavailable(); }
export async function downloadHymnal(): Promise<void> { return unavailable(); }
export async function removeCorpus(): Promise<void> { return unavailable(); }
