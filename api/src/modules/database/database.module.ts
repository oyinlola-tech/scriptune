import type { Container } from "@zudojs/container";
import { BaseModule } from "@zudojs/core";
import { createDatabaseClient, type DatabaseClient } from "@zudojs/database";
import { APP_VERSION, TOKENS } from "../../constants/index.js";
import {
  createDatabaseProbe,
  createPrismaClient,
  toDatabaseLogger,
} from "../../databases/index.js";

/**
 * Connects Prisma to PostgreSQL, exposes the client through the container
 * and reports its health. Prisma connects lazily, so the module pings the
 * database during initialization to fail fast on bad credentials or hosts.
 */
export class DatabaseModule extends BaseModule {
  public readonly id = "database";
  public readonly name = "Database";

  private readonly container: Container;
  private client: DatabaseClient | undefined;
  private unregisterProbe: (() => void) | undefined;

  public constructor(container: Container) {
    super({ version: APP_VERSION });
    this.container = container;
  }

  public override async onInitialize(): Promise<void> {
    const config = this.container.resolve(TOKENS.appConfig);
    const health = this.container.resolve(TOKENS.healthRegistry);
    const logger = this.container.resolve(TOKENS.logger).child({ name: "database" });

    const prisma = createPrismaClient(config.databaseUrl);
    const client = createDatabaseClient({ prisma, logger: toDatabaseLogger(logger) });
    await client.connect();
    await client.ping();
    this.client = client;

    this.container.registerValue(TOKENS.prismaClient, prisma);
    this.container.registerValue(TOKENS.databaseClient, client);
    this.unregisterProbe = health.register("database", createDatabaseProbe(client));
  }

  public override async onShutdown(): Promise<void> {
    this.unregisterProbe?.();
    this.unregisterProbe = undefined;
    if (this.client !== undefined) {
      await this.client.disconnect();
      this.client = undefined;
    }
  }
}
