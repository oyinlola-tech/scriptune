import { Command } from "@zudojs/cqrs";

export const REFRESH_SESSION = "identity.refreshSession" as const;

/** Rotates a refresh token into a new token pair. */
export class RefreshSessionCommand extends Command<typeof REFRESH_SESSION> {
  public readonly refreshToken: string;

  public constructor(refreshToken: string) {
    super(REFRESH_SESSION);
    this.refreshToken = refreshToken;
  }
}
