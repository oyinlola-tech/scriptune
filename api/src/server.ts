import { createApp } from "./app.js";

const runtime = await createApp();

await runtime.start();

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    void runtime
      .stop()
      .then(() => {
        process.exit(0);
      })
      .catch((error: unknown) => {
        console.error(error);
        process.exit(1);
      });
  });
}
