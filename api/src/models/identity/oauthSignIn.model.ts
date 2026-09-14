/** A Google sign-in in flight: PKCE verifier first, then the exchange code. */
export interface OAuthSignInModel {
  readonly state: string;
  readonly provider: string;
  readonly codeVerifier: string;
  readonly redirectTo: string | null;
  readonly exchangeCode: string | null;
  readonly userId: string | null;
  readonly createdAt: Date;
  readonly expiresAt: Date;
  readonly consumedAt: Date | null;
}
