import { existsSync } from "node:fs";
import { defineConfig } from "prisma/config";

if (existsSync(".env")) {
  process.loadEnvFile(".env");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // `prisma generate` (run at Docker build time) never connects, so a placeholder is fine when unset.
    url: process.env["DATABASE_URL"] ?? "postgresql://build:build@localhost:5432/build",
  },
});
