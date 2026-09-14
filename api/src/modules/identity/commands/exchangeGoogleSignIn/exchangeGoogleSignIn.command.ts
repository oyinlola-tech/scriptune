import { Command } from "@zudojs/cqrs";
import type { SessionContext } from "../../../../services/identity/index.js";

export const EXCHANGE_GOOGLE_SIGN_IN = "identity.exchangeGoogleSignIn" as const;

/** Trades the one-time code the web app received for Scriptune tokens. */
export class ExchangeGoogleSignInCommand extends Command<typeof EXCHANGE_GOOGLE_SIGN_IN> {
  public readonly code: string;
  public readonly context: SessionContext;

  public constructor(code: string, context: SessionContext = {}) {
    super(EXCHANGE_GOOGLE_SIGN_IN);
    this.code = code;
    this.context = context;
  }
}
