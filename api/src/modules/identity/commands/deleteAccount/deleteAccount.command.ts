import { Command } from "@zudojs/cqrs";

export const DELETE_ACCOUNT = "identity.deleteAccount" as const;

/** Permanently removes a user, their sessions and everything in their library. */
export class DeleteAccountCommand extends Command<typeof DELETE_ACCOUNT> {
  public readonly userId: string;

  public constructor(userId: string) {
    super(DELETE_ACCOUNT);
    this.userId = userId;
  }
}
