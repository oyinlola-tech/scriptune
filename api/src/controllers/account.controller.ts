import type { CommandBus } from "@zudojs/cqrs";
import { createResponseContext, type HttpRouterContext, type HttpResponseContext } from "@zudojs/http";
import { requireAuthState } from "../middlewares/auth/authState.helper.js";
import { DeleteAccountCommand } from "../modules/identity/commands/index.js";

/** Account lifecycle beyond signing in and out. */
export class AccountController {
  private readonly commandBus: CommandBus;

  public constructor(commandBus: CommandBus) {
    this.commandBus = commandBus;
  }

  /** Deletes the signed-in user's account and everything stored under it. */
  public async deleteMe(context: HttpRouterContext): Promise<HttpResponseContext> {
    const auth = requireAuthState(context.request);
    await this.commandBus.execute<DeleteAccountCommand, void>(new DeleteAccountCommand(auth.userId));
    return createResponseContext().setStatus(204);
  }
}
