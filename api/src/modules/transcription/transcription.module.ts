import type { Container } from "@zudojs/container";
import { BaseModule } from "@zudojs/core";
import { APP_VERSION, TOKENS } from "../../constants/index.js";
import { createTranscriptionProvider } from "../../services/transcription/index.js";
import { TRANSCRIBE_AUDIO, TranscribeAudioHandler } from "./commands/index.js";

/**
 * Owns the speech-to-text provider. Nothing else in the API knows what is
 * behind it; by default that is Whisper running in the local transcriber service.
 */
export class TranscriptionModule extends BaseModule {
  public readonly id = "transcription";
  public readonly name = "Transcription";

  private readonly container: Container;

  public constructor(container: Container) {
    super({ version: APP_VERSION });
    this.container = container;
  }

  public override async onInitialize(): Promise<void> {
    const config = this.container.resolve(TOKENS.appConfig);
    const logger = this.container.resolve(TOKENS.logger).child({ name: "transcription" });
    const provider = createTranscriptionProvider(config.transcription);
    this.container.registerValue(TOKENS.transcriptionProvider, provider);
    this.container.resolve(TOKENS.commandBus).register(TRANSCRIBE_AUDIO, new TranscribeAudioHandler(provider));
    logger.info("Transcription provider ready", { provider: provider.name, ...(provider.name === "whisper" ? { url: config.transcription.whisperUrl } : {}) });
  }
}
