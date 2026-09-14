import { Command } from "@zudojs/cqrs";
import type { TranscriptionInput } from "../../../../interfaces/index.js";

export const TRANSCRIBE_AUDIO = "transcription.transcribeAudio" as const;

/** Sends audio to the configured provider and returns the words it heard. */
export class TranscribeAudioCommand extends Command<typeof TRANSCRIBE_AUDIO> {
  public readonly input: TranscriptionInput;

  public constructor(input: TranscriptionInput) {
    super(TRANSCRIBE_AUDIO);
    this.input = input;
  }
}
