import { Command } from "@zudojs/cqrs";

export const LOGOUT_SESSION = "identity.logoutSession" as const;

export interface LogoutSessionInput {
  readonly userId: string;
  readonly sessionId: string | null;
  readonly refreshToken?: string;
  /** Ends every session of the user instead of just this one. */
  readonly everywhere?: boolean;
}

/** Ends the current session (or all of them), invalidating its tokens at once. */
export class LogoutSessionCommand extends Command<typeof LOGOUT_SESSION> {
  public readonly input: LogoutSessionInput;

  public constructor(input: LogoutSessionInput) {
    super(LOGOUT_SESSION);
    this.input = input;
  }
}
