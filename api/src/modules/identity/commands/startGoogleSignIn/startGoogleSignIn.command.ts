import { Command } from "@zudojs/cqrs";

export const START_GOOGLE_SIGN_IN = "identity.startGoogleSignIn" as const;

/** Begins a Google sign-in; the result is the Google page to send the browser to. */
export class StartGoogleSignInCommand extends Command<typeof START_GOOGLE_SIGN_IN> {
  public readonly redirectTo: string | null;

  public constructor(redirectTo: string | null) {
    super(START_GOOGLE_SIGN_IN);
    this.redirectTo = redirectTo;
  }
}
