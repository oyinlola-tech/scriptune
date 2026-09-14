import type { CommandBus, QueryBus } from "@zudojs/cqrs";
import { badRequest, type HttpRouterContext, type HttpResponseContext } from "@zudojs/http";
import { ALLOWED_AUDIO_MIME_TYPES, MAX_AUDIO_BYTES } from "../constants/app.constants.js";
import type { RecognitionResultDto } from "../dtos/index.js";
import { getAuthState } from "../middlewares/auth/authState.helper.js";
import { RecognizeAudioCommand, RecognizeTextCommand } from "../modules/recognition/commands/index.js";
import { GetAttemptQuery } from "../modules/recognition/queries/index.js";
import { readJsonBody, readMultipartBody } from "../utils/http/body.helper.js";
import { jsonResponse } from "../utils/http/response.helper.js";
import { parseOrBadRequest } from "../utils/http/validation.helper.js";
import { attemptParamsSchema, recognizeAudioFieldsSchema, recognizeTextBodySchema } from "../validators/recognition.validators.js";

function baseMimeType(contentType: string): string {
  return contentType.split(";")[0]?.trim().toLowerCase() ?? "";
}

/** Translates recognition HTTP requests into commands and queries. */
export class RecognitionController {
  private readonly commandBus: CommandBus;
  private readonly queryBus: QueryBus;

  public constructor(commandBus: CommandBus, queryBus: QueryBus) {
    this.commandBus = commandBus;
    this.queryBus = queryBus;
  }

  public async recognizeText(context: HttpRouterContext): Promise<HttpResponseContext> {
    const body = parseOrBadRequest(recognizeTextBodySchema, readJsonBody(context.request), "body");
    const result = await this.commandBus.execute<RecognizeTextCommand, RecognitionResultDto>(
      new RecognizeTextCommand({ text: body.text, mode: body.mode, language: body.language, userId: getAuthState(context.request)?.userId ?? null }),
    );
    return jsonResponse(result);
  }

  public async recognizeAudio(context: HttpRouterContext): Promise<HttpResponseContext> {
    const form = readMultipartBody(context.request, { maxFileSize: MAX_AUDIO_BYTES, maxFiles: 1 });
    const upload = form.get("audio");
    if (upload === undefined || typeof upload === "string") {
      throw badRequest('Attach the recording as a file field named "audio".', { code: "MISSING_AUDIO" });
    }
    const mimeType = baseMimeType(upload.contentType);
    if (!ALLOWED_AUDIO_MIME_TYPES.includes(mimeType as (typeof ALLOWED_AUDIO_MIME_TYPES)[number])) {
      throw badRequest(`Unsupported audio type "${mimeType}".`, {
        code: "UNSUPPORTED_AUDIO_TYPE",
        details: { allowed: ALLOWED_AUDIO_MIME_TYPES },
      });
    }
    if (upload.size === 0) {
      throw badRequest("The recording is empty.", { code: "EMPTY_AUDIO" });
    }
    const fields = parseOrBadRequest(
      recognizeAudioFieldsSchema,
      { mode: stringField(form.get("mode")), language: stringField(form.get("language")) },
      "form fields",
    );
    const result = await this.commandBus.execute<RecognizeAudioCommand, RecognitionResultDto>(
      new RecognizeAudioCommand({ audio: upload.data, mimeType, mode: fields.mode, language: fields.language, userId: getAuthState(context.request)?.userId ?? null }),
    );
    return jsonResponse(result);
  }

  public async getAttempt(context: HttpRouterContext): Promise<HttpResponseContext> {
    const params = parseOrBadRequest(attemptParamsSchema, context.params, "attempt id");
    return jsonResponse(await this.queryBus.execute<GetAttemptQuery, RecognitionResultDto>(new GetAttemptQuery(params.id, getAuthState(context.request)?.userId ?? null)));
  }
}

function stringField(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}
