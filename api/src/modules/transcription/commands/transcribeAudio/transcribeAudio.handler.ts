import { CommandHandler } from "@zudojs/cqrs";
import type { TranscriptionProvider, TranscriptionResult } from "../../../../interfaces/index.js";
import { TRANSCRIBE_AUDIO, type TranscribeAudioCommand } from "./transcribeAudio.command.js";

export class TranscribeAudioHandler extends CommandHandler<TranscribeAudioCommand, TranscriptionResult> {
  public readonly commandType = TRANSCRIBE_AUDIO;

  private readonly provider: TranscriptionProvider;

  public constructor(provider: TranscriptionProvider) {
    super();
    this.provider = provider;
  }

  public async execute(command: TranscribeAudioCommand): Promise<TranscriptionResult> {
    return this.provider.transcribe(command.input);
  }
}
