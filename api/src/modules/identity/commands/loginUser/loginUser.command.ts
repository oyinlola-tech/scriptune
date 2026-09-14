import { Command } from "@zudojs/cqrs";
import type { SessionContext } from "../../../../services/identity/index.js";

export const LOGIN_USER = "identity.loginUser" as const;

export interface LoginUserInput {
  readonly email: string;
  readonly password: string;
  readonly context?: SessionContext;
}

/** Signs in with email and password. */
export class LoginUserCommand extends Command<typeof LOGIN_USER> {
  public readonly input: LoginUserInput;

  public constructor(input: LoginUserInput) {
    super(LOGIN_USER);
    this.input = input;
  }
}
