import * as Linking from "expo-linking";
import { secrets } from "./secret-store";
import * as WebBrowser from "expo-web-browser";
import type { AuthSessionDto } from "@scriptune/contracts";
import { auth } from "../api";
import { getApiUrl } from "../config";

WebBrowser.maybeCompleteAuthSession();

/** The deep link the API sends the browser back to. Must match MOBILE_AUTH_CALLBACK_URL on the API. */
export const GOOGLE_CALLBACK_URL = Linking.createURL("auth/callback");

const PENDING_KEY = "scriptune.googlePending";
const PENDING_TTL_MS = 5 * 60 * 1000;

// True while the in-app auth session owns the exchange, so the cold-start
// callback route knows not to also handle the same code.
let sessionActive = false;
// One exchange per code: on Android the auth-session polyfill and the callback
// route both see the redirect, so both would otherwise POST the one-time code.
const inFlight = new Map<string, Promise<AuthSessionDto>>();

export function isGoogleSignInActive(): boolean {
  return sessionActive;
}

/** True only if this device actually started a Google sign-in recently (CSRF guard). */
export async function hasPendingGoogleSignIn(): Promise<boolean> {
  const value = await secrets.get(PENDING_KEY).catch(() => null);
  if (value === null) return false;
  const startedAt = Number(value);
  return Number.isFinite(startedAt) && Date.now() - startedAt < PENDING_TTL_MS;
}

export async function clearPendingGoogleSignIn(): Promise<void> {
  await secrets.delete(PENDING_KEY).catch(() => undefined);
}

/** Exchanges a one-time code for a session, deduplicated so a code is never spent twice. */
export function exchangeGoogleCode(code: string): Promise<AuthSessionDto> {
  let pending = inFlight.get(code);
  if (pending === undefined) {
    pending = auth.exchangeGoogle(code).finally(() => inFlight.delete(code));
    inFlight.set(code, pending);
  }
  return pending;
}

export type GoogleSignInOutcome = { status: "signed-in"; session: AuthSessionDto } | { status: "cancelled" } | { status: "failed"; reason: string };

/** Reads the one-time exchange code (or error) out of a callback URL. */
export function parseCallbackUrl(url: string): { code: string | null; error: string | null } {
  const { queryParams } = Linking.parse(url);
  const code = typeof queryParams?.code === "string" ? queryParams.code : null;
  const error = typeof queryParams?.error === "string" ? queryParams.error : null;
  return { code, error };
}

/**
 * Opens the API's Google flow in an auth session. The API bounces the browser
 * back to the app's deep link with a one-time code, exchanged here. Google's
 * own tokens never reach the app.
 */
export async function signInWithGoogle(): Promise<GoogleSignInOutcome> {
  sessionActive = true;
  await secrets.set(PENDING_KEY, String(Date.now())).catch(() => undefined);
  try {
    const start = `${getApiUrl()}/auth/google?redirect=${encodeURIComponent(GOOGLE_CALLBACK_URL)}`;
    const result = await WebBrowser.openAuthSessionAsync(start, GOOGLE_CALLBACK_URL);
    if (result.type !== "success") return { status: "cancelled" };
    const { code, error } = parseCallbackUrl(result.url);
    if (code === null) return { status: "failed", reason: error ?? "missing_code" };
    return { status: "signed-in", session: await exchangeGoogleCode(code) };
  } catch {
    return { status: "failed", reason: "exchange_failed" };
  } finally {
    sessionActive = false;
    await clearPendingGoogleSignIn();
  }
}
