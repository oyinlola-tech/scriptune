import { defineConfig } from "vitest/config";

/**
 * Integration files share one database and each imports the same fixture
 * translation, so when TEST_DATABASE_URL is set the files run one at a time.
 * Unit-only runs keep the parallel default.
 */
export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    testTimeout: 15_000,
    hookTimeout: 15_000,
    fileParallelism: process.env["TEST_DATABASE_URL"] === undefined,
  },
});
