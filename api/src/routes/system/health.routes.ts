import type { SystemController } from "../../controllers/index.js";
import type { RouteSpec } from "../../utils/http/route.helper.js";

/**
 * Liveness (`/health`, always 200 while the process answers) and readiness
 * (`/ready`, 503 until every registered component is healthy).
 */
export function createHealthRoutes(controller: SystemController): readonly RouteSpec[] {
  return [
    {
      method: "GET",
      path: "/health",
      name: "system.health",
      handler: () => controller.health(),
      openapi: {
        summary: "Liveness and component health",
        tags: ["system"],
        responses: { "200": { description: "The process is alive; body lists component health." } },
      },
    },
    {
      method: "GET",
      path: "/ready",
      name: "system.ready",
      handler: () => controller.ready(),
      openapi: {
        summary: "Readiness to receive traffic",
        tags: ["system"],
        responses: {
          "200": { description: "Every component is healthy." },
          "503": { description: "At least one component is unhealthy." },
        },
      },
    },
  ];
}
