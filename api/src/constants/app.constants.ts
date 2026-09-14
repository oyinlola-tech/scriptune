/**
 * Application identity and defaults shared across modules.
 */
export const APP_NAME = "scriptune";
export const APP_VERSION = "0.1.0";
export const API_TITLE = "Scriptune API";
export const API_DESCRIPTION =
  "Recognition and discovery API for the Bible and Christian hymns.";

export const DEFAULT_HOST = "0.0.0.0";
export const DEFAULT_PORT = 4000;
export const DEFAULT_LOG_LEVEL = "info";
export const DEFAULT_RATE_LIMIT_MAX = 300;
export const DEFAULT_RATE_LIMIT_WINDOW_MS = 60_000;

/** Requests per minute per client IP on /search; the fuzzy fallback can cost hundreds of milliseconds each. */
export const SEARCH_RATE_LIMIT_MAX = 60;
export const DEFAULT_WHISPER_URL = "http://localhost:5005";
export const DEFAULT_WHISPER_TIMEOUT_MS = 60_000;
export const DEFAULT_ACCESS_TTL_SECONDS = 15 * 60;
export const DEFAULT_REFRESH_TTL_SECONDS = 30 * 24 * 60 * 60;
export const DEFAULT_SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;
/** How long clients and proxies may keep a corpus export (one day). */
export const EXPORT_CACHE_SECONDS = 86_400;
export const DEFAULT_WEB_AUTH_CALLBACK_PATH = "/auth/callback";
/** Deep link the mobile app registers for finishing Google sign-in. */
export const DEFAULT_MOBILE_AUTH_CALLBACK_URL = "scriptune://auth/callback";
/** How long a Google sign-in may take between redirect and callback. */
export const OAUTH_SIGN_IN_TTL_SECONDS = 10 * 60;
/** Auth endpoints (login, register, refresh) allow this many requests per minute per IP. */
export const AUTH_RATE_LIMIT_MAX = 20;
export const MAX_HISTORY_IMPORT = 200;
export const HISTORY_RETENTION = 500;
export const DEFAULT_RECOGNITION_RATE_LIMIT_MAX = 30;
export const DEFAULT_TRANSLATION_CODE = "KJV";

/** Largest audio clip accepted for recognition. */
export const MAX_AUDIO_BYTES = 5 * 1024 * 1024;
/** Longest transcript or typed text the recognizer will consider. */
export const MAX_RECOGNITION_TEXT_LENGTH = 1_000;
/** Candidates returned per recognition. */
export const RECOGNITION_CANDIDATE_LIMIT = 5;
/** Candidates below this confidence are dropped. */
export const MIN_RECOGNITION_CONFIDENCE = 10;
/** Audio container types the browser's MediaRecorder produces, plus wav/mp3. */
export const ALLOWED_AUDIO_MIME_TYPES = Object.freeze([
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
  "audio/wave",
  "audio/flac",
  "audio/aac",
  "video/webm",
  "video/mp4",
] as const);

/** Largest request body accepted by the HTTP adapter (audio uploads included). */
export const MAX_REQUEST_BODY_BYTES = 6 * 1024 * 1024;
/** How long in-flight requests may finish during shutdown. */
export const SHUTDOWN_TIMEOUT_MS = 15_000;
/** Upper bound for a single health probe. */
export const HEALTH_PROBE_TIMEOUT_MS = 5_000;

/** OpenAPI tags, in the order they appear in the documentation. */
export const OPENAPI_TAGS = Object.freeze([
  { name: "system", description: "Health, readiness and documentation." },
  { name: "bible", description: "Translations, books and verses." },
  { name: "hymns", description: "Hymns, hymnals, contributors and topics." },
  { name: "search", description: "Unified text search." },
  { name: "recognition", description: "Identify what was heard." },
  { name: "auth", description: "Accounts and sessions." },
  { name: "library", description: "Saved items, collections, notes and history." },
  { name: "export", description: "Whole-corpus downloads for offline clients." },
] as const);
