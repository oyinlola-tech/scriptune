import {
  APP_NAME,
  DEFAULT_ACCESS_TTL_SECONDS,
  DEFAULT_HOST,
  DEFAULT_LOG_LEVEL,
  DEFAULT_PORT,
  DEFAULT_RATE_LIMIT_MAX,
  DEFAULT_RATE_LIMIT_WINDOW_MS,
  DEFAULT_RECOGNITION_RATE_LIMIT_MAX,
  DEFAULT_REFRESH_TTL_SECONDS,
  DEFAULT_SESSION_TTL_SECONDS,
  DEFAULT_TRANSLATION_CODE,
  DEFAULT_WHISPER_TIMEOUT_MS,
  DEFAULT_WHISPER_URL,
  DEFAULT_WEB_AUTH_CALLBACK_PATH,
  DEFAULT_MOBILE_AUTH_CALLBACK_URL,
} from "../constants/app.constants.js";

export type EnvironmentMap = Readonly<Record<string, string | undefined>>;

/** Environment variables the application reads. Everything else is ignored. */
export const ENV_KEYS = Object.freeze([
  "NODE_ENV",
  "HOST",
  "PORT",
  "PUBLIC_URL",
  "LOG_LEVEL",
  "DATABASE_URL",
  "WEB_ORIGIN",
  "TRUST_PROXY",
  "RATE_LIMIT_MAX",
  "RATE_LIMIT_WINDOW_MS",
  "TRANSCRIPTION_PROVIDER",
  "WHISPER_URL",
  "WHISPER_TIMEOUT_MS",
  "RECOGNITION_RATE_LIMIT_MAX",
  "DEFAULT_TRANSLATION",
  "AUTH_ACCESS_SECRET",
  "AUTH_REFRESH_SECRET",
  "AUTH_ACCESS_TTL_SECONDS",
  "AUTH_REFRESH_TTL_SECONDS",
  "AUTH_SESSION_TTL_SECONDS",
  "AUTH_ISSUER",
  "AUTH_AUDIENCE",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "WEB_AUTH_CALLBACK_PATH",
  "MOBILE_AUTH_CALLBACK_URL",
] as const);

export const DEFAULT_VALUES = Object.freeze({
  host: DEFAULT_HOST,
  port: DEFAULT_PORT,
  log_level: DEFAULT_LOG_LEVEL,
  trust_proxy: 0,
  rate_limit_max: DEFAULT_RATE_LIMIT_MAX,
  rate_limit_window_ms: DEFAULT_RATE_LIMIT_WINDOW_MS,
  whisper_url: DEFAULT_WHISPER_URL,
  whisper_timeout_ms: DEFAULT_WHISPER_TIMEOUT_MS,
  recognition_rate_limit_max: DEFAULT_RECOGNITION_RATE_LIMIT_MAX,
  default_translation: DEFAULT_TRANSLATION_CODE,
  auth_access_ttl_seconds: DEFAULT_ACCESS_TTL_SECONDS,
  auth_refresh_ttl_seconds: DEFAULT_REFRESH_TTL_SECONDS,
  auth_session_ttl_seconds: DEFAULT_SESSION_TTL_SECONDS,
  auth_issuer: APP_NAME,
  auth_audience: `${APP_NAME}-web`,
  web_auth_callback_path: DEFAULT_WEB_AUTH_CALLBACK_PATH,
  mobile_auth_callback_url: DEFAULT_MOBILE_AUTH_CALLBACK_URL,
});

export function pickKnownVariables(env: EnvironmentMap): Record<string, string | undefined> {
  const picked: Record<string, string | undefined> = {};
  for (const key of ENV_KEYS) {
    if (env[key] !== undefined) {
      picked[key] = env[key];
    }
  }
  return picked;
}
