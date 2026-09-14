import { ConflictError } from "@zudojs/errors";
import { HEALTH_PROBE_TIMEOUT_MS } from "../../constants/app.constants.js";
import type { HealthProbe, HealthReport, HealthStatus } from "../../interfaces/index.js";
import { runHealthProbe } from "./health.probe.js";

function summarize(unhealthy: number, total: number): HealthStatus {
  if (unhealthy === 0) {
    return "healthy";
  }
  return unhealthy === total ? "unhealthy" : "degraded";
}

/**
 * Collects health probes from modules and evaluates them on demand.
 *
 * Modules register a probe during initialization and remove it on shutdown,
 * so the report always reflects the components that are actually running.
 */
export class HealthRegistry {
  private readonly probes = new Map<string, HealthProbe>();

  public register(name: string, probe: HealthProbe): () => void {
    if (this.probes.has(name)) {
      throw new ConflictError(`Health probe "${name}" is already registered.`);
    }
    this.probes.set(name, probe);
    return () => {
      if (this.probes.get(name) === probe) {
        this.probes.delete(name);
      }
    };
  }

  public names(): readonly string[] {
    return [...this.probes.keys()];
  }

  public async check(timeoutMs: number = HEALTH_PROBE_TIMEOUT_MS): Promise<HealthReport> {
    const entries = [...this.probes.entries()];
    const components = await Promise.all(
      entries.map(([name, probe]) => runHealthProbe(name, probe, timeoutMs)),
    );
    const unhealthy = components.filter((component) => !component.healthy).length;
    return Object.freeze({
      status: summarize(unhealthy, components.length),
      healthy: unhealthy === 0,
      checkedAt: new Date().toISOString(),
      components,
    });
  }
}
