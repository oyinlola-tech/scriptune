# Scriptune

Recognition and discovery platform for the Bible and Christian hymns. Hear a hymn or a
passage, identify it, and see the words, the scripture and everything connected to it.

| Folder      | Contents                                              |
| ----------- | ----------------------------------------------------- |
| `api/`      | Zudojs modular-monolith API (TypeScript, PostgreSQL)  |
| `web/`      | Next.js web application (deployed to Vercel)          |
| `mobile/`   | Expo (React Native) app for iOS and Android           |
| `packages/` | `@scriptune/contracts`: DTO types, keys and API client shared by web and mobile |
| `docker/`   | Dockerfile and local compose stack (Postgres, Redis)  |
| `docs/`     | Architecture and product documentation                |

See `docs/v1-architecture.md` for the v1 design.

## Local development

Requirements: Node 24+, npm 11+, Docker.

```bash
# 1. Environment (once)
cp docker/.env.example docker/.env      # host ports for Postgres/Redis; change if 5432/6379 are taken
cp api/.env.example api/.env            # set AUTH_ACCESS_SECRET / AUTH_REFRESH_SECRET (32+ chars, distinct)
cp web/.env.example web/.env.local      # NEXT_PUBLIC_API_URL, NEXT_PUBLIC_SITE_URL
cp mobile/.env.example mobile/.env.local

# 2. Install and migrate (once, and after pulling dependency changes)
npm run setup             # installs root, packages/contracts, api, web, mobile, and the Python transcriber
npm run infra:up          # Postgres + Redis in Docker
npm run db:migrate        # applies prisma/migrations

# 3. Data (once; downloads the pinned public-domain datasets and imports them)
cd api
npm run import:bible -- --all   # KJV, AKJV, ASV, WEB, WEBC, DRC; or --translation WEB for one
npm run import:hymns            # Sacred Songs and Solos, 1,200 hymns
cd ..

# 4. Run everything from the root
npm run dev               # Docker infra, Whisper transcriber :5005, API :4000 (docs at /docs), web :3000, Expo (Metro :8081)
```

`npm run dev` starts Postgres and Redis, waits until they are healthy, then runs the Whisper
transcriber, the API, the web app and the Expo dev server together with colour-prefixed logs.
Ctrl+C stops everything. Other root commands:

| Command | What it does |
| --- | --- |
| `npm run dev:web-only` | everything except the Expo server |
| `npm run dev:api` / `dev:web` / `dev:mobile` / `dev:transcriber` | one app on its own |
| `npm run setup:transcriber` | (re)creates the Python venv for the transcriber |
| `npm run stop` | stops the Docker containers |
| `npm run typecheck` | typechecks every package |
| `npm run test` | runs the API tests |

If port 3000 is taken, run `WEB_PORT=3001 npm run dev`; ports 4000 and the Docker ports come
from `api/.env` and `docker/.env`.

Audio recognition runs locally: the Python service in `transcriber/` transcribes recordings with
OpenAI Whisper, and the API reaches it at `WHISPER_URL` (default `http://localhost:5005`). It
needs Python 3.10+ and about 2 GB of disk for PyTorch; the first start downloads the `small`
model (480 MB, resumable) and serves the smaller `tiny` model until it has arrived. Whisper detects the language of each recording, so English, Yoruba and the
other languages in the hymnals all work; set `WHISPER_MODEL=medium` for better Yoruba accuracy. If the service is not running the microphone flow answers 502 and the typed
flow still works; set `TRANSCRIPTION_PROVIDER=none` to turn audio off deliberately. Google sign-in needs
`GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` with the redirect URI
`<PUBLIC_URL>/auth/google/callback`.

### Mobile app

```bash
cd mobile
npm install
npm start          # a = Android, i = iOS, or scan the QR code with Expo Go
```

Point it at the API with `EXPO_PUBLIC_API_URL` (see `mobile/.env.example`). Google sign in on mobile needs the API's `MOBILE_AUTH_CALLBACK_URL` (default `scriptune://auth/callback`). Library › Offline copies downloads the KJV and hymnals to the device so reading, search and typed identification work without a connection. Details in `mobile/README.md`.

### Shared contracts

`packages/contracts` ships TypeScript source that both clients import as `@scriptune/contracts` (linked with `file:../packages/contracts`). Next.js reads it through `transpilePackages` with the Turbopack root set to the repo, Metro reads it directly. When a DTO changes in `api/src/dtos`, update `packages/contracts/src/types.ts`.

### Reaching the local API from a phone

`scripts/api-tunnel.sh` opens a free Cloudflare quick tunnel to the API and prints a public HTTPS URL (it changes on every start). Use that URL as `EXPO_PUBLIC_API_URL` when building the app, or paste it into the GitHub workflow's API field. Set `TRUST_PROXY=1` in `api/.env` so rate limits see the real client address behind the tunnel. On the same Wi-Fi or hotspot, the machine's LAN address with port 4000 works without a tunnel.

## Continuous integration

- `.github/workflows/ci.yml` runs on every push to `main` and on pull requests: API typecheck and tests against a PostgreSQL 17 service (migrations applied first), the contracts package typecheck, the web lint, typecheck and production build, and the mobile typecheck, lint and JavaScript bundle.
- `.github/workflows/mobile-build.yml` builds the native apps: the Android APK on every push to `main` that touches `mobile/` or the contracts package, and iOS on demand from the Actions tab or on a `mobile-v*` tag. Artifacts are attached to the run.

## Tests

```bash
cd api && npm test                          # unit tests
TEST_DATABASE_URL=postgresql://scriptune:scriptune@localhost:5440/scriptune_test npm test   # + integration (needs a migrated test database)
cd web && npm run lint && npm run typecheck && npm run build
```

Create the test database once: `docker exec scriptune-postgres-1 psql -U scriptune -d scriptune -c "CREATE DATABASE scriptune_test"`,
then `DATABASE_URL=...scriptune_test npm run db:deploy` inside `api/`.

## Licence

The Scriptune source code is released under the MIT Licence (see `LICENSE`). The scripture and hymn texts it serves are public domain and are credited on the Licences page of the site and app. To report a security issue, see `SECURITY.md`.

## Importing another hymnal

Beyond the public-domain Sacred Songs and Solos, any hymnal (including bilingual ones and collections used by permission) imports from a JSON file:

```bash
cd api && npm run import:hymnal -- --file path/to/hymnal.json
```

The file states the hymnal's own rights status, which is stored and shown on every hymn. See `api/docs/examples/hymnal.example.json` for the shape, including a hymn with both English and Yoruba texts.

The Celestial Church of Christ hymnal is prepared from its PDF with `scripts/parse-ccc-hymnal.py` (needs `pip install pypdf`):

```bash
python3 scripts/parse-ccc-hymnal.py api/data/ccc-hymnal.pdf api/data/ccc-hymnal.json
cd api && npm run import:hymnal -- --file data/ccc-hymnal.json
```

The PDF and generated JSON live in `api/data/` (git-ignored), since the text is used by permission and should not be committed.
