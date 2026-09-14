import { QueryHandler } from "@zudojs/cqrs";
import type { HealthReport } from "../../../../interfaces/index.js";
import type { HealthRegistry } from "../../../../services/index.js";
import { GET_HEALTH_REPORT, type GetHealthReportQuery } from "./getHealthReport.query.js";

/** Runs every registered health probe and returns the aggregate report. */
export class GetHealthReportHandler extends QueryHandler<GetHealthReportQuery, HealthReport> {
  public readonly queryType = GET_HEALTH_REPORT;

  private readonly registry: HealthRegistry;

  public constructor(registry: HealthRegistry) {
    super();
    this.registry = registry;
  }

  public async execute(): Promise<HealthReport> {
    return this.registry.check();
  }
}
