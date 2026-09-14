#!/usr/bin/env node
// Starts the whole local stack from the repository root:
//   Docker (Postgres + Redis) -> API + web + Expo, together, with prefixed logs.
//
//   npm run dev                    everything (Docker, transcriber, API, web, Expo)
//   npm run dev -- --no-mobile     without the Expo server
//   npm run dev -- --only transcriber   one process (api | web | mobile | transcriber)
//
// The Whisper transcriber runs from transcriber/.venv (create it with
// `npm run setup:transcriber`). If the venv is missing it is skipped with a warning
// and audio recognition answers 502 until it exists.
//
// The web port comes from WEB_PORT, else the port in web/.env.local's
// NEXT_PUBLIC_SITE_URL (so it matches the API's CORS WEB_ORIGIN), else 3000.
// If that port is busy the next free one is used and a warning is printed.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createServer } from "node:net";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import concurrently from "concurrently";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const withMobile = !process.argv.includes("--no-mobile");
const onlyIndex = process.argv.indexOf("--only");
const only = onlyIndex === -1 ? null : process.argv[onlyIndex + 1];
const transcriberPort = process.env.TRANSCRIBER_PORT ?? "5005";
const venvPython = join(root, "transcriber", ".venv", "bin", "python");

function portFromSiteUrl() {
  try {
    const env = readFileSync(join(root, "web", ".env.local"), "utf8");
    const line = env.split("\n").find((l) => l.startsWith("NEXT_PUBLIC_SITE_URL="));
    if (!line) return undefined;
    const url = new URL(line.slice("NEXT_PUBLIC_SITE_URL=".length).trim().replace(/^["']|["']$/g, ""));
    return url.port ? Number(url.port) : undefined;
  } catch {
    return undefined;
  }
}

function isFree(port) {
  return new Promise((resolve) => {
    const server = createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => server.close(() => resolve(true)));
    server.listen(port);
  });
}

async function pickWebPort() {
  const wanted = Number(process.env.WEB_PORT) || portFromSiteUrl() || 3000;
  let port = wanted;
  while (!(await isFree(port))) port += 1;
  if (port !== wanted) {
    console.warn(`\n! Port ${wanted} is in use; the web app will start on ${port} instead.`);
    console.warn(`  If sign-in or API calls fail in the browser, add http://localhost:${port} to WEB_ORIGIN in api/.env\n  and set NEXT_PUBLIC_SITE_URL=http://localhost:${port} in web/.env.local.\n`);
  }
  return port;
}

const wants = (name) => only === null || only === name;

if (wants("api")) {
  const infra = spawnSync("docker", ["compose", "-f", "docker/compose.yml", "up", "-d", "--wait"], { cwd: root, stdio: "inherit" });
  if (infra.status !== 0) process.exit(infra.status ?? 1);
}

const webPort = wants("web") ? await pickWebPort() : undefined;
const env = { ...process.env, ...(webPort === undefined ? {} : { WEB_PORT: String(webPort) }) };
const commands = [];
const hasTranscriber = existsSync(venvPython);
if (wants("transcriber")) {
  // Wrapped so a transcriber crash (say, a failed model download) reports itself
  // and exits cleanly instead of taking the API and web down with it.
  const whisper = `${venvPython} -m uvicorn app:app --host 127.0.0.1 --port ${transcriberPort} || echo "! Whisper transcriber stopped (see above). Audio recognition answers 502 until it is back: npm run dev:transcriber"`;
  if (hasTranscriber) commands.push({ name: "whisper", command: whisper, prefixColor: "yellow", cwd: join(root, "transcriber"), env });
  else console.warn("\n! transcriber/.venv not found; skipping the Whisper transcriber. Run `npm run setup:transcriber` to enable audio recognition.\n");
}
if (wants("api")) commands.push({ name: "api", command: "npm --prefix api run dev", prefixColor: "blue", env });
if (wants("web")) commands.push({ name: "web", command: "npm --prefix web run dev", prefixColor: "green", env });
if (wants("mobile") && (withMobile || only === "mobile")) commands.push({ name: "mobile", command: "npm --prefix mobile run start", prefixColor: "magenta", env });
if (commands.length === 0) {
  console.error(`Nothing to start${only === null ? "" : ` for --only ${only}`}.`);
  process.exit(1);
}

const summary = commands.map((c) => ({ whisper: `Whisper http://localhost:${transcriberPort}`, api: `API http://localhost:${process.env.PORT ?? 4000}`, web: `web http://localhost:${webPort}`, mobile: "Expo (Metro :8081)" })[c.name]).join("  ·  ");
console.log(`\nStarting: ${summary}\nCtrl+C stops everything.\n`);
const { commands: running, result } = concurrently(commands, { cwd: root, killOthersOn: ["failure"], prefix: "name" });
// Forward Ctrl+C / SIGTERM to every child so no server is left behind.
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => running.forEach((c) => c.kill(signal)));
result.then(() => process.exit(0), () => process.exit(1));
