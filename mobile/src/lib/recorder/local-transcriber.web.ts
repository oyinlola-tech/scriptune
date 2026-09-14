// Web build: there is no on-device model in the browser.
export interface LocalTranscript { text: string; language: string }
export async function releaseLocalTranscriber(): Promise<void> { return undefined; }
export async function transcribeLocally(): Promise<LocalTranscript> { throw new Error("Offline listening is only available in the Scriptune app."); }
