import { Query } from "@zudojs/cqrs";

export const GET_ATTEMPT = "recognition.getAttempt" as const;

/** Reads a past identification, for sharing and for "why this result" views. */
export class GetAttemptQuery extends Query<typeof GET_ATTEMPT> {
  public readonly id: string;
  /** Who is asking, if signed in. An attempt made while signed in is private to its owner. */
  public readonly viewerId: string | null;

  public constructor(id: string, viewerId: string | null = null) {
    super(GET_ATTEMPT);
    this.id = id;
    this.viewerId = viewerId;
  }
}
