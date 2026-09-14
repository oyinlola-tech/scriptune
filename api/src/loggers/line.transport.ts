import { createLoggerTransport, type RegisteredLoggerTransport } from "@zudojs/logger";

/**
 * Writes one formatted line per entry.
 *
 * The framework's console transport prints whole entry objects, which is
 * noisy for humans in development and double-encodes JSON in production.
 * Errors and warnings go to stderr; everything else to stdout.
 */
export function createLineTransport(): RegisteredLoggerTransport {
  return createLoggerTransport({
    name: "line",
    enabled: true,
    write(entry) {
      const stream = entry.level <= 2 ? process.stderr : process.stdout;
      stream.write(`${entry.message}\n`);
    },
  });
}
