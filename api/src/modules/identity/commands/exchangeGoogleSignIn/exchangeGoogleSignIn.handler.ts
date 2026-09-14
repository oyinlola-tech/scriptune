import { CommandHandler } from "@zudojs/cqrs";
import { toTokensDto, toUserDto, type AuthSessionDto } from "../../../../dtos/index.js";
import type { GoogleSignIn, SessionIssuer } from "../../../../services/identity/index.js";
import { requireGoogle } from "../startGoogleSignIn/startGoogleSignIn.handler.js";
import { EXCHANGE_GOOGLE_SIGN_IN, type ExchangeGoogleSignInCommand } from "./exchangeGoogleSignIn.command.js";

export class ExchangeGoogleSignInHandler extends CommandHandler<ExchangeGoogleSignInCommand, AuthSessionDto> {
  public readonly commandType = EXCHANGE_GOOGLE_SIGN_IN;

  private readonly google: GoogleSignIn | null;
  private readonly issuer: SessionIssuer;

  public constructor(google: GoogleSignIn | null, issuer: SessionIssuer) {
    super();
    this.google = google;
    this.issuer = issuer;
  }

  public async execute(command: ExchangeGoogleSignInCommand): Promise<AuthSessionDto> {
    const user = await requireGoogle(this.google).exchange(command.code);
    const session = await this.issuer.issue(user, command.context);
    return { user: toUserDto(session.user), tokens: toTokensDto(session.tokens), sessionId: session.sessionId };
  }
}
