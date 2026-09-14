import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

/** Upper bound on any single statement, so a pathological search can never pile up on Postgres. */
const STATEMENT_TIMEOUT_MS = 30_000;
/** Connections this process may hold open; searches are short, so a small pool goes a long way. */
const POOL_MAX = 10;

/** Creates a Prisma client backed by the pg driver adapter. */
export function createPrismaClient(databaseUrl: string): PrismaClient {
  const adapter = new PrismaPg({
    connectionString: databaseUrl,
    max: POOL_MAX,
    idleTimeoutMillis: 30_000,
    statement_timeout: STATEMENT_TIMEOUT_MS,
  });
  return new PrismaClient({ adapter });
}
