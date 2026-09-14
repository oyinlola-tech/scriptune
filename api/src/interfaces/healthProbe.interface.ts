export type HealthStatus = "healthy" | "degraded" | "unhealthy";

/** Outcome of a single component probe. */
export interface HealthProbeResult {
  readonly healthy: boolean;
  readonly latencyMs: number;
  readonly message?: string;
}

/** A function that checks one component (database, cache, provider). */
export type HealthProbe = () => Promise<HealthProbeResult> | HealthProbeResult;

/** A probe result attributed to its component. */
export interface HealthComponent extends HealthProbeResult {
  readonly name: string;
}

/** Aggregate report across every registered component. */
export interface HealthReport {
  readonly status: HealthStatus;
  readonly healthy: boolean;
  readonly checkedAt: string;
  readonly components: readonly HealthComponent[];
}
