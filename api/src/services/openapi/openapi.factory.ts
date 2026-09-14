import { createOpenAPIManager, type OpenAPIManager } from "@zudojs/openapi";
import type { AppConfig } from "../../configs/index.js";
import {
  API_DESCRIPTION,
  API_TITLE,
  APP_VERSION,
  OPENAPI_TAGS,
} from "../../constants/app.constants.js";

/** Creates the OpenAPI manager every module registers its routes with. */
export function createAppOpenApi(config: AppConfig): OpenAPIManager {
  return createOpenAPIManager({
    version: "3.1.0",
    info: { title: API_TITLE, version: APP_VERSION, description: API_DESCRIPTION },
    servers: [{ url: config.publicUrl }],
    tags: OPENAPI_TAGS.map((tag) => ({ ...tag })),
    branding: false,
  }).addSecurityScheme("bearerAuth", { type: "http", scheme: "bearer", bearerFormat: "JWT" });
}
