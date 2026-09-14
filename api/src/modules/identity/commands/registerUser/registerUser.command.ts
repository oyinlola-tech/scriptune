import { Command } from "@zudojs/cqrs";
import type { SessionContext } from "../../../../services/identity/index.js";

export const REGISTER_USER = "identity.registerUser" as const;

export interface RegisterUserInput {
  readonly email: string;
  readonly password: string;
  readonly name?: string | null;
  readonly context?: SessionContext;
}

/** Creates an email/password account and signs it in. */
export class RegisterUserCommand extends Command<typeof REGISTER_USER> {
  public readonly input: RegisterUserInput;

  public constructor(input: RegisterUserInput) {
    super(REGISTER_USER);
    this.input = input;
  }
}
