import { CommandHandler } from "@zudojs/cqrs";
import { NotFoundError } from "@zudojs/errors";
import type { GoogleSignIn } from "../../../../services/identity/index.js";
import { START_GOOGLE_SIGN_IN, type StartGoogleSignInCommand } from "./startGoogleSignIn.command.js";

export interface GoogleSignInStartDto {
  readonly url: string;
}

export function requireGoogle(google: GoogleSignIn | null): GoogleSignIn {
  if (google === null) {
    throw new NotFoundError("Google sign-in is not enabled.");
  }
  return google;
}

export class StartGoogleSignInHandler extends CommandHandler<StartGoogleSignInCommand, GoogleSignInStartDto> {
  public readonly commandType = START_GOOGLE_SIGN_IN;

  private readonly google: GoogleSignIn | null;

  public constructor(google: GoogleSignIn | null) {
    super();
    this.google = google;
  }

  public async execute(command: StartGoogleSignInCommand): Promise<GoogleSignInStartDto> {
    const { url } = await requireGoogle(this.google).start(command.redirectTo);
    return { url };
  }
}
