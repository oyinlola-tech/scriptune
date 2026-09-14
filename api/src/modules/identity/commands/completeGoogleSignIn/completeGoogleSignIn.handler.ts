import { CommandHandler } from "@zudojs/cqrs";
import type { GoogleSignIn } from "../../../../services/identity/index.js";
import { requireGoogle } from "../startGoogleSignIn/startGoogleSignIn.handler.js";
import { COMPLETE_GOOGLE_SIGN_IN, type CompleteGoogleSignInCommand } from "./completeGoogleSignIn.command.js";

export interface GoogleSignInCompletionDto {
  readonly exchangeCode: string;
  readonly redirectTo: string | null;
}

export class CompleteGoogleSignInHandler extends CommandHandler<CompleteGoogleSignInCommand, GoogleSignInCompletionDto> {
  public readonly commandType = COMPLETE_GOOGLE_SIGN_IN;

  private readonly google: GoogleSignIn | null;

  public constructor(google: GoogleSignIn | null) {
    super();
    this.google = google;
  }

  public async execute(command: CompleteGoogleSignInCommand): Promise<GoogleSignInCompletionDto> {
    return requireGoogle(this.google).complete(command.state, command.code);
  }
}
