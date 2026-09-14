import { toSessionId, toUserId, type AuthService } from "@zudojs/auth";
import { CommandHandler } from "@zudojs/cqrs";
import { LOGOUT_SESSION, type LogoutSessionCommand } from "./logoutSession.command.js";

export class LogoutSessionHandler extends CommandHandler<LogoutSessionCommand, void> {
  public readonly commandType = LOGOUT_SESSION;

  private readonly auth: AuthService;

  public constructor(auth: AuthService) {
    super();
    this.auth = auth;
  }

  public async execute(command: LogoutSessionCommand): Promise<void> {
    const { userId, sessionId, refreshToken, everywhere } = command.input;
    if (everywhere === true || sessionId === null) {
      await this.auth.logoutAll(toUserId(userId));
      return;
    }
    await this.auth.logout(toSessionId(sessionId), refreshToken);
  }
}
