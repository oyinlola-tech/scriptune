import type { LogMetadata, LogValue } from "@zudojs/logger";

/** Narrows an arbitrary value to something the logger accepts. */
export function toLogValue(value: unknown): LogValue {
  switch (typeof value) {
    case "string":
    case "number":
    case "boolean":
    case "bigint":
    case "undefined":
      return value;
    case "object":
      return value as LogValue;
    default:
      return String(value);
  }
}

/** Converts loosely typed metadata into logger metadata. */
export function toLogMetadata(
  metadata: Readonly<Record<string, unknown>> | undefined,
): LogMetadata | undefined {
  if (metadata === undefined) {
    return undefined;
  }
  const result: Record<string, LogValue> = {};
  for (const [key, value] of Object.entries(metadata)) {
    result[key] = toLogValue(value);
  }
  return result;
}
