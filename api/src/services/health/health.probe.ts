import { TimeoutError } from "@zudojs/errors";
import type { HealthComponent, HealthProbe } from "../../interfaces/index.js";

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, name: string): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new TimeoutError(`Health probe "${name}" timed out after ${timeoutMs}ms.`));
    }, timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => {
    clearTimeout(timer);
  });
}

/**
 * Runs one probe, bounding it by a timeout and converting failures into an
 * unhealthy component instead of letting them escape.
 */
export async function runHealthProbe(
  name: string,
  probe: HealthProbe,
  timeoutMs: number,
): Promise<HealthComponent> {
  const startedAt = performance.now();
  try {
    const result = await withTimeout(Promise.resolve().then(probe), timeoutMs, name);
    return Object.freeze({ name, ...result });
  } catch (error) {
    return Object.freeze({
      name,
      healthy: false,
      latencyMs: Math.round(performance.now() - startedAt),
      message: error instanceof Error ? error.message : "Probe failed.",
    });
  }
}
