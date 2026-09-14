import { Command } from "@zudojs/cqrs";

export const COMPLETE_GOOGLE_SIGN_IN = "identity.completeGoogleSignIn" as const;

/** Handles Google's callback: verifies state, exchanges the code, finds or creates the user. */
export class CompleteGoogleSignInCommand extends Command<typeof COMPLETE_GOOGLE_SIGN_IN> {
  public readonly state: string;
  public readonly code: string;

  public constructor(state: string, code: string) {
    super(COMPLETE_GOOGLE_SIGN_IN);
    this.state = state;
    this.code = code;
  }
}
