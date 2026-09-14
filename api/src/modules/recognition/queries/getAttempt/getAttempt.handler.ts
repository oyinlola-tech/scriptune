import { QueryHandler } from "@zudojs/cqrs";
import { NotFoundError } from "@zudojs/errors";
import { toRecognitionResultDto, type RecognitionResultDto } from "../../../../dtos/index.js";
import type { RecognitionAttemptRepository } from "../../../../repositories/index.js";
import { GET_ATTEMPT, type GetAttemptQuery } from "./getAttempt.query.js";

export class GetAttemptHandler extends QueryHandler<GetAttemptQuery, RecognitionResultDto> {
  public readonly queryType = GET_ATTEMPT;

  private readonly attempts: RecognitionAttemptRepository;

  public constructor(attempts: RecognitionAttemptRepository) {
    super();
    this.attempts = attempts;
  }

  public async execute(query: GetAttemptQuery): Promise<RecognitionResultDto> {
    const attempt = await this.attempts.findById(query.id);
    // An attempt made by a signed-in user is theirs alone; anonymous ones stay public.
    if (attempt === null || (attempt.userId !== null && attempt.userId !== query.viewerId)) {
      throw new NotFoundError(`Recognition attempt "${query.id}" was not found.`);
    }
    return toRecognitionResultDto(attempt);
  }
}
