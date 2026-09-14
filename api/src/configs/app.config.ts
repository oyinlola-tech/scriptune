import {
  createConfigManager,
  createDefaultsConfigSource,
  createEnvironmentConfigSource,
} from "@zudojs/config";
import { resolveEnvironment, type Environment } from "@zudojs/constants";
import { APP_NAME } from "../constants/app.constants.js";
import {
  toAbsoluteUrl,
  toDatabaseUrl,
  toInteger,
  toOneOf,
  toOrigins,
  toRequiredString,
} from "./config.parser.js";
import {
  DEFAULT_VALUES,
  pickKnownVariables,
  type EnvironmentMap,
} from "./env.defaults.js";
import {
  readAuthConfig,
  readGoogleOAuthConfig,
  type AuthConfig,
  type GoogleOAuthConfig,
} from "./auth.config.js";
import {
  readRecognitionConfig,
  readTranscriptionConfig,
  type RecognitionConfig,
  type TranscriptionConfig,
} from "./feature.config.js";

export type LogLevelName =
  | "fatal"
  | "error"
  | "warn"
  | "info"
  | "debug"
  | "trace";

export interface RateLimitConfig {
  readonly max: number;
  readonly windowMs: number;
}

/** Immutable, validated application configuration. */
export interface AppConfig {
  readonly environment: Environment;
  readonly host: string;
  readonly port: number;
  readonly publicUrl: string;
  readonly logLevel: LogLevelName;
  readonly databaseUrl: string;
  readonly webOrigins: readonly string[];
  readonly trustProxy: number;
  readonly rateLimit: RateLimitConfig;
  readonly transcription: TranscriptionConfig;
  readonly recognition: RecognitionConfig;
  readonly auth: AuthConfig;
  readonly google: GoogleOAuthConfig | null;
}

const LOG_LEVELS: readonly LogLevelName[] = [
  "fatal",
  "error",
  "warn",
  "info",
  "debug",
  "trace",
];

function resolveAppEnvironment(env: EnvironmentMap): Environment {
  const value = env["NODE_ENV"];
  return value === undefined
    ? "development"
    : resolveEnvironment({ NODE_ENV: value }, { strict: true });
}

/**
 * Loads and validates configuration from environment variables layered over
 * defaults. Throws a ConfigurationError naming the first invalid key.
 */
export async function loadAppConfig(
  env: EnvironmentMap = process.env,
): Promise<AppConfig> {
  const manager = createConfigManager({
    name: APP_NAME,
    sources: [
      createDefaultsConfigSource(DEFAULT_VALUES),
      createEnvironmentConfigSource({
        env: pickKnownVariables(env),
        keyMapper: (name) => name.toLowerCase(),
      }),
    ],
  });
  await manager.load();

  const port = toInteger("PORT", manager.get("port"), { min: 0, max: 65_535 });
  const publicUrl = toAbsoluteUrl(
    "PUBLIC_URL",
    manager.get("public_url") ?? `http://localhost:${port}`,
  );
  const webOrigins = toOrigins("WEB_ORIGIN", manager.get("web_origin"));
  const config: AppConfig = {
    environment: resolveAppEnvironment(env),
    host: toRequiredString("HOST", manager.get("host")),
    port,
    publicUrl,
    logLevel: toOneOf("LOG_LEVEL", manager.get("log_level"), LOG_LEVELS),
    databaseUrl: toDatabaseUrl("DATABASE_URL", manager.get("database_url")),
    webOrigins,
    trustProxy: toInteger("TRUST_PROXY", manager.get("trust_proxy"), {
      min: 0,
      max: 16,
    }),
    rateLimit: Object.freeze({
      max: toInteger("RATE_LIMIT_MAX", manager.get("rate_limit_max"), {
        min: 1,
      }),
      windowMs: toInteger(
        "RATE_LIMIT_WINDOW_MS",
        manager.get("rate_limit_window_ms"),
        {
          min: 1_000,
        },
      ),
    }),
    transcription: readTranscriptionConfig(manager),
    recognition: readRecognitionConfig(manager),
    auth: readAuthConfig(manager),
    google: readGoogleOAuthConfig(
      manager,
      publicUrl,
      webOrigins[0] ?? publicUrl,
    ),
  };
  await manager.dispose();
  return Object.freeze(config);
}
