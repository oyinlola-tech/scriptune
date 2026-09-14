import { Query } from "@zudojs/cqrs";

export const GET_CURRENT_USER = "identity.getCurrentUser" as const;

/** Reads the signed-in user's profile. */
export class GetCurrentUserQuery extends Query<typeof GET_CURRENT_USER> {
  public readonly userId: string;

  public constructor(userId: string) {
    super(GET_CURRENT_USER);
    this.userId = userId;
  }
}
