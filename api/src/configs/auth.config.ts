import type { ConfigManager } from "@zudojs/config";
import { isCustomSchemeUrl } from "../validators/auth.validators.js";
import { configError, toInteger, toRequiredString } from "./config.parser.js";

export interface AuthConfig {
  readonly accessSecret: string;
  readonly refreshSecret: string;
  readonly accessTtlSeconds: number;
  readonly refreshTtlSeconds: number;
  readonly sessionTtlSeconds: number;
  readonly issuer: string;
  readonly audience: string;
}

export interface GoogleOAuthConfig {
  readonly clientId: string;
  readonly clientSecret: string;
  /** Where Google sends the browser back: `${publicUrl}/auth/google/callback`. */
  readonly redirectUri: string;
  /** Where the API sends the browser once signed in: the web app's callback page. */
  readonly webCallbackUrl: string;
  /** The custom-scheme deep link the mobile app may ask to be sent back to instead. */
  readonly mobileCallbackUrl: string;
}

const MIN_SECRET_LENGTH = 32;

function toSecret(key: string, value: unknown): string {
  const secret = toRequiredString(key, value as string | undefined);
  if (secret.length < MIN_SECRET_LENGTH) {
    throw configError(key, `must be at least ${MIN_SECRET_LENGTH} characters`);
  }
  return secret;
}

export function readAuthConfig(manager: ConfigManager): AuthConfig {
  const accessSecret = toSecret("AUTH_ACCESS_SECRET", manager.get("auth_access_secret"));
  const refreshSecret = toSecret("AUTH_REFRESH_SECRET", manager.get("auth_refresh_secret"));
  if (accessSecret === refreshSecret) {
    throw configError("AUTH_REFRESH_SECRET", "must differ from AUTH_ACCESS_SECRET");
  }
  return Object.freeze({
    accessSecret,
    refreshSecret,
    accessTtlSeconds: toInteger("AUTH_ACCESS_TTL_SECONDS", manager.get("auth_access_ttl_seconds"), { min: 60 }),
    refreshTtlSeconds: toInteger("AUTH_REFRESH_TTL_SECONDS", manager.get("auth_refresh_ttl_seconds"), { min: 300 }),
    sessionTtlSeconds: toInteger("AUTH_SESSION_TTL_SECONDS", manager.get("auth_session_ttl_seconds"), { min: 300 }),
    issuer: toRequiredString("AUTH_ISSUER", manager.get("auth_issuer")),
    audience: toRequiredString("AUTH_AUDIENCE", manager.get("auth_audience")),
  });
}

/** Google sign-in is optional; without both credentials the routes answer 404. */
export function readGoogleOAuthConfig(manager: ConfigManager, publicUrl: string, webOrigin: string): GoogleOAuthConfig | null {
  const clientId = manager.get("google_client_id");
  const clientSecret = manager.get("google_client_secret");
  if (typeof clientId !== "string" || clientId.trim() === "" || typeof clientSecret !== "string" || clientSecret.trim() === "") {
    return null;
  }
  const callbackPath = toRequiredString("WEB_AUTH_CALLBACK_PATH", manager.get("web_auth_callback_path"));
  const mobileCallbackUrl = toRequiredString("MOBILE_AUTH_CALLBACK_URL", manager.get("mobile_auth_callback_url"));
  if (!isCustomSchemeUrl(mobileCallbackUrl)) {
    throw configError("MOBILE_AUTH_CALLBACK_URL", "must use the app's own scheme, for example scriptune://auth/callback");
  }
  return Object.freeze({
    clientId: clientId.trim(),
    clientSecret: clientSecret.trim(),
    redirectUri: `${publicUrl}/auth/google/callback`,
    webCallbackUrl: `${webOrigin}${callbackPath.startsWith("/") ? callbackPath : `/${callbackPath}`}`,
    mobileCallbackUrl,
  });
}
