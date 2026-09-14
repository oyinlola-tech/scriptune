import type { ConfigValue } from "@zudojs/config";
import { ConfigurationError } from "@zudojs/errors";

/** Builds a configuration error that names the offending key. */
export function configError(key: string, message: string): ConfigurationError {
  return new ConfigurationError(`Invalid configuration for ${key}: ${message}.`, {
    metadata: { key },
  });
}

/** Coerces a raw value into an integer within optional bounds. */
export function toInteger(
  key: string,
  value: ConfigValue | undefined,
  bounds: { readonly min?: number; readonly max?: number } = {},
): number {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string" && /^-?\d+$/.test(value.trim())
        ? Number(value.trim())
        : Number.NaN;
  if (!Number.isSafeInteger(parsed)) {
    throw configError(key, "expected an integer");
  }
  if (bounds.min !== undefined && parsed < bounds.min) {
    throw configError(key, `must be at least ${bounds.min}`);
  }
  if (bounds.max !== undefined && parsed > bounds.max) {
    throw configError(key, `must be at most ${bounds.max}`);
  }
  return parsed;
}

/** Requires a non-empty string. */
export function toRequiredString(key: string, value: ConfigValue | undefined): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw configError(key, "is required");
  }
  return value.trim();
}

/** Restricts a string to a known set of values. */
export function toOneOf<T extends string>(
  key: string,
  value: ConfigValue | undefined,
  allowed: readonly T[],
): T {
  const candidate = toRequiredString(key, value).toLowerCase();
  const match = allowed.find((entry) => entry === candidate);
  if (match === undefined) {
    throw configError(key, `must be one of ${allowed.join(", ")}`);
  }
  return match;
}

/** Validates a PostgreSQL connection string. */
export function toDatabaseUrl(key: string, value: ConfigValue | undefined): string {
  const url = toRequiredString(key, value);
  let protocol: string;
  try {
    protocol = new URL(url).protocol;
  } catch {
    throw configError(key, "must be a valid URL");
  }
  if (protocol !== "postgres:" && protocol !== "postgresql:") {
    throw configError(key, "must use the postgresql:// scheme");
  }
  return url;
}

/** Validates an absolute URL and strips a trailing slash. */
export function toAbsoluteUrl(key: string, value: ConfigValue | undefined): string {
  const url = toRequiredString(key, value);
  try {
    return new URL(url).toString().replace(/\/$/, "");
  } catch {
    throw configError(key, "must be an absolute URL");
  }
}

/** Parses a comma-separated list of exact origins. */
export function toOrigins(key: string, value: ConfigValue | undefined): readonly string[] {
  const raw = toRequiredString(key, value);
  const origins = raw
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry !== "");
  if (origins.length === 0) {
    throw configError(key, "must list at least one origin");
  }
  for (const origin of origins) {
    let parsed: URL;
    try {
      parsed = new URL(origin);
    } catch {
      throw configError(key, `"${origin}" is not a valid origin`);
    }
    if (parsed.origin !== origin) {
      throw configError(key, `"${origin}" must be an origin without a path`);
    }
  }
  return Object.freeze([...new Set(origins)]);
}
