import type { AuthService } from "@zudojs/auth";
import { createToken } from "@zudojs/container";
import type { CommandBus, QueryBus } from "@zudojs/cqrs";
import type { DatabaseClient } from "@zudojs/database";
import type { EventBus } from "@zudojs/events";
import type { HttpMiddlewarePipeline, HttpRouter, HttpServer } from "@zudojs/http";
import type { Logger } from "@zudojs/logger";
import type { OpenAPIManager } from "@zudojs/openapi";
import type { AppConfig } from "../configs/index.js";
import type { PrismaClient } from "../generated/prisma/client.js";
import type { TranscriptionProvider } from "../interfaces/index.js";
import type { UserRepository } from "../repositories/index.js";
import type { HealthRegistry } from "../services/index.js";

/**
 * Container tokens for services shared across modules.
 *
 * Modules resolve what they need from the container by token instead of
 * importing each other's internals.
 */
export const TOKENS = Object.freeze({
  appConfig: createToken<AppConfig>("scriptune.config"),
  logger: createToken<Logger>("scriptune.logger"),
  eventBus: createToken<EventBus>("scriptune.eventBus"),
  commandBus: createToken<CommandBus>("scriptune.commandBus"),
  queryBus: createToken<QueryBus>("scriptune.queryBus"),
  healthRegistry: createToken<HealthRegistry>("scriptune.healthRegistry"),
  httpRouter: createToken<HttpRouter>("scriptune.http.router"),
  httpPipeline: createToken<HttpMiddlewarePipeline>("scriptune.http.pipeline"),
  httpServer: createToken<HttpServer>("scriptune.http.server"),
  openApi: createToken<OpenAPIManager>("scriptune.http.openApi"),
  prismaClient: createToken<PrismaClient>("scriptune.database.prisma"),
  databaseClient: createToken<DatabaseClient>("scriptune.database.client"),
  transcriptionProvider: createToken<TranscriptionProvider>("scriptune.transcription.provider"),
  authService: createToken<AuthService>("scriptune.identity.authService"),
  userRepository: createToken<UserRepository>("scriptune.identity.users"),
});
