import { Command } from "@zudojs/cqrs";
import type { RecognitionModeName } from "../../../../models/index.js";

export const RECOGNIZE_AUDIO = "recognition.recognizeAudio" as const;

export interface RecognizeAudioInput {
  readonly audio: Uint8Array;
  readonly mimeType: string;
  readonly mode: RecognitionModeName;
  readonly language: string;
  readonly userId?: string | null;
}

/** Transcribes a recording, then identifies it. */
export class RecognizeAudioCommand extends Command<typeof RECOGNIZE_AUDIO> {
  public readonly input: RecognizeAudioInput;

  public constructor(input: RecognizeAudioInput) {
    super(RECOGNIZE_AUDIO);
    this.input = input;
  }
}
