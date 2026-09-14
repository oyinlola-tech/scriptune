import { Command } from "@zudojs/cqrs";
import type { RecognitionModeName } from "../../../../models/index.js";

export const RECOGNIZE_TEXT = "recognition.recognizeText" as const;

export interface RecognizeTextInput {
  readonly text: string;
  readonly mode: RecognitionModeName;
  /** ISO 639 code, or "auto" to search every language. */
  readonly language: string;
  /** What speech-to-text heard when the language was "auto"; recorded on the attempt. */
  readonly detectedLanguage?: string;
  readonly userId?: string | null;
}

/** Identifies typed or already transcribed words. */
export class RecognizeTextCommand extends Command<typeof RECOGNIZE_TEXT> {
  public readonly input: RecognizeTextInput;

  public constructor(input: RecognizeTextInput) {
    super(RECOGNIZE_TEXT);
    this.input = input;
  }
}
