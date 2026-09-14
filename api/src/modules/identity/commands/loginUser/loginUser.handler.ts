import type { AuthService } from "@zudojs/auth";
import { CommandHandler } from "@zudojs/cqrs";
import { UnauthorizedError } from "@zudojs/errors";
import { toTokensDto, toUserDto, type AuthSessionDto } from "../../../../dtos/index.js";
import type { UserRepository } from "../../../../repositories/index.js";
import { LOGIN_USER, type LoginUserCommand } from "./loginUser.command.js";

/** Delegates to the framework's auth service, which throttles and locks out brute force. */
export class LoginUserHandler extends CommandHandler<LoginUserCommand, AuthSessionDto> {
  public readonly commandType = LOGIN_USER;

  private readonly auth: AuthService;
  private readonly users: UserRepository;

  public constructor(auth: AuthService, users: UserRepository) {
    super();
    this.auth = auth;
    this.users = users;
  }

  public async execute(command: LoginUserCommand): Promise<AuthSessionDto> {
    const { email, password, context } = command.input;
    const result = await this.auth.login({ identifier: email.trim().toLowerCase(), password }, context);
    const user = await this.users.findById(result.user.id);
    if (user === null) {
      throw new UnauthorizedError("This account is no longer available.");
    }
    await this.users.touchLogin(user.id);
    return { user: toUserDto(user), tokens: toTokensDto(result.tokens), sessionId: result.sessionId };
  }
}
