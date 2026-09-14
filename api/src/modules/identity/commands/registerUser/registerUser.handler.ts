import type { AuthService } from "@zudojs/auth";
import { CommandHandler } from "@zudojs/cqrs";
import { isConflictError } from "@zudojs/database";
import { ConflictError } from "@zudojs/errors";
import { toTokensDto, toUserDto, type AuthSessionDto } from "../../../../dtos/index.js";
import type { UserRepository } from "../../../../repositories/index.js";
import type { SessionIssuer } from "../../../../services/identity/index.js";
import { REGISTER_USER, type RegisterUserCommand } from "./registerUser.command.js";

export class RegisterUserHandler extends CommandHandler<RegisterUserCommand, AuthSessionDto> {
  public readonly commandType = REGISTER_USER;

  private readonly users: UserRepository;
  private readonly auth: AuthService;
  private readonly issuer: SessionIssuer;

  public constructor(users: UserRepository, auth: AuthService, issuer: SessionIssuer) {
    super();
    this.users = users;
    this.auth = auth;
    this.issuer = issuer;
  }

  public async execute(command: RegisterUserCommand): Promise<AuthSessionDto> {
    const { email, password, name, context } = command.input;
    if ((await this.users.findByEmail(email)) !== null) {
      throw new ConflictError("An account with this email already exists.");
    }
    const passwordHash = await this.auth.hashPassword(password);
    let user;
    try {
      user = await this.users.create({ email, name: name ?? null, passwordHash });
    } catch (error) {
      // Two registrations of the same email can race past the check above.
      if (isConflictError(error)) throw new ConflictError("An account with this email already exists.");
      throw error;
    }
    const session = await this.issuer.issue(user, context);
    return { user: toUserDto(session.user), tokens: toTokensDto(session.tokens), sessionId: session.sessionId };
  }
}
