import { checkDatabaseHealth, type DatabaseClient } from "@zudojs/database";
import { HEALTH_PROBE_TIMEOUT_MS } from "../constants/app.constants.js";
import type { HealthProbe } from "../interfaces/index.js";

/**
 * Health probe that pings the database with a bounded timeout.
 *
 * Only the driver error code is reported, never the driver message, so the
 * public health endpoint cannot leak connection details.
 */
export function createDatabaseProbe(client: DatabaseClient): HealthProbe {
  return async () => {
    const health = await checkDatabaseHealth(client, { timeoutMs: HEALTH_PROBE_TIMEOUT_MS });
    if (health.healthy) {
      return { healthy: true, latencyMs: health.latencyMs };
    }
    const code = health.error?.databaseCode ?? health.error?.code ?? "unavailable";
    return {
      healthy: false,
      latencyMs: health.latencyMs,
      message: `Database check failed (${code}).`,
    };
  };
}
