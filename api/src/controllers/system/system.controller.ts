import type { Environment } from "@zudojs/constants";
import type { QueryBus } from "@zudojs/cqrs";
import type { HttpResponseContext } from "@zudojs/http";
import { APP_NAME, APP_VERSION } from "../../constants/app.constants.js";
import type { HealthReport } from "../../interfaces/index.js";
import { GetHealthReportQuery } from "../../modules/http/queries/index.js";
import { jsonResponse } from "../../utils/http/response.helper.js";

export interface SystemControllerOptions {
  readonly queryBus: QueryBus;
  readonly environment: Environment;
  readonly startedAt: number;
}

/** Liveness and readiness endpoints backed by the `system.health` query. */
export class SystemController {
  private readonly queryBus: QueryBus;
  private readonly environment: Environment;
  private readonly startedAt: number;

  public constructor(options: SystemControllerOptions) {
    this.queryBus = options.queryBus;
    this.environment = options.environment;
    this.startedAt = options.startedAt;
  }

  public async health(): Promise<HttpResponseContext> {
    const report = await this.report();
    return jsonResponse({
      name: APP_NAME,
      version: APP_VERSION,
      environment: this.environment,
      uptimeSeconds: Math.round((Date.now() - this.startedAt) / 1000),
      ...report,
    });
  }

  public async ready(): Promise<HttpResponseContext> {
    const report = await this.report();
    return jsonResponse(report, report.healthy ? 200 : 503);
  }

  private report(): Promise<HealthReport> {
    return this.queryBus.execute<GetHealthReportQuery, HealthReport>(new GetHealthReportQuery());
  }
}
