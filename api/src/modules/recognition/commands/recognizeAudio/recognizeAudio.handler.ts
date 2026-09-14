import type { CommandBus } from "@zudojs/cqrs";
import { CommandHandler } from "@zudojs/cqrs";
import { UnprocessableEntityError } from "@zudojs/errors";
import type { RecognitionResultDto } from "../../../../dtos/index.js";
import type { TranscriptionResult } from "../../../../interfaces/index.js";
import { AUTO_LANGUAGE } from "../../../../services/recognition/recognition.engine.js";
import { TranscribeAudioCommand } from "../../../transcription/commands/index.js";
import type { RecognizeTextHandler } from "../recognizeText/recognizeText.handler.js";
import { RECOGNIZE_AUDIO, type RecognizeAudioCommand } from "./recognizeAudio.command.js";

/** Hands the audio to the transcription module, then recognizes the words. */
export class RecognizeAudioHandler extends CommandHandler<RecognizeAudioCommand, RecognitionResultDto> {
  public readonly commandType = RECOGNIZE_AUDIO;

  private readonly commandBus: CommandBus;
  private readonly text: RecognizeTextHandler;

  public constructor(commandBus: CommandBus, text: RecognizeTextHandler) {
    super();
    this.commandBus = commandBus;
    this.text = text;
  }

  public async execute(command: RecognizeAudioCommand): Promise<RecognitionResultDto> {
    const startedAt = performance.now();
    const { audio, mimeType, mode, language, userId } = command.input;
    // With "auto" the provider detects the language itself; the detected code is
    // kept on the attempt, while the hymn search still spans every language so a
    // misdetected clip can still land on the right hymn.
    const transcription = await this.commandBus.execute<TranscribeAudioCommand, TranscriptionResult>(
      new TranscribeAudioCommand({ audio, mimeType, ...(language === AUTO_LANGUAGE ? {} : { language }) }),
    );
    if (transcription.transcript.trim().length < 2) {
      throw new UnprocessableEntityError("No speech was recognized in the recording.");
    }
    return this.text.recognize(
      { text: transcription.transcript, mode, language, userId: userId ?? null, ...(language === AUTO_LANGUAGE && transcription.language !== undefined ? { detectedLanguage: transcription.language } : {}) },
      "AUDIO",
      startedAt,
      { transcription, mimeType, bytes: audio.byteLength },
    );
  }
}
