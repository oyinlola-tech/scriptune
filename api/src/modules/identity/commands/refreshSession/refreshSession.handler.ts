import type { AuthService } from "@zudojs/auth";
import { CommandHandler } from "@zudojs/cqrs";
import { toTokensDto, type TokensDto } from "../../../../dtos/index.js";
import { REFRESH_SESSION, type RefreshSessionCommand } from "./refreshSession.command.js";

export class RefreshSessionHandler extends CommandHandler<RefreshSessionCommand, TokensDto> {
  public readonly commandType = REFRESH_SESSION;

  private readonly auth: AuthService;

  public constructor(auth: AuthService) {
    super();
    this.auth = auth;
  }

  public async execute(command: RefreshSessionCommand): Promise<TokensDto> {
    return toTokensDto(await this.auth.refresh(command.refreshToken));
  }
}
