import { Query } from "@zudojs/cqrs";

export const GET_HEALTH_REPORT = "system.health" as const;

/** Asks for the current health of every registered component. */
export class GetHealthReportQuery extends Query<typeof GET_HEALTH_REPORT> {
  public constructor() {
    super(GET_HEALTH_REPORT);
  }
}
