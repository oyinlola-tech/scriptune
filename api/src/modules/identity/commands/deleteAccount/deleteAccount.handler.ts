import { toUserId, type AuthService } from "@zudojs/auth";
import { CommandHandler } from "@zudojs/cqrs";
import type { RecognitionAttemptRepository, UserRepository } from "../../../../repositories/index.js";
import { DELETE_ACCOUNT, type DeleteAccountCommand } from "./deleteAccount.command.js";

/**
 * Ends every session first so no token outlives the account, unlinks the
 * user's recognition attempts (their spoken transcripts), then deletes the
 * user row; the database cascades credentials, OAuth links, sessions, saved
 * items, collections, notes and history.
 */
export class DeleteAccountHandler extends CommandHandler<DeleteAccountCommand, void> {
  public readonly commandType = DELETE_ACCOUNT;

  private readonly auth: AuthService;
  private readonly users: UserRepository;
  private readonly attempts: RecognitionAttemptRepository;

  public constructor(auth: AuthService, users: UserRepository, attempts: RecognitionAttemptRepository) {
    super();
    this.auth = auth;
    this.users = users;
    this.attempts = attempts;
  }

  public async execute(command: DeleteAccountCommand): Promise<void> {
    await this.auth.logoutAll(toUserId(command.userId));
    await this.attempts.detachUser(command.userId);
    await this.users.delete(command.userId);
  }
}
