<div align="center">

<img src="docs/images/banner.png" alt="Scriptune: hear a hymn or a verse and find out what it is" width="100%">

<br><br>

[![CI](https://github.com/oyinlola-tech/scriptune/actions/workflows/ci.yml/badge.svg)](https://github.com/oyinlola-tech/scriptune/actions/workflows/ci.yml)
[![Mobile build](https://github.com/oyinlola-tech/scriptune/actions/workflows/mobile-build.yml/badge.svg)](https://github.com/oyinlola-tech/scriptune/actions/workflows/mobile-build.yml)
[![Licence: MIT](https://img.shields.io/badge/licence-MIT-c2a24f)](LICENSE)
![Node 24+](https://img.shields.io/badge/node-24%2B-26231f?logo=nodedotjs&logoColor=white)
![Python 3.10+](https://img.shields.io/badge/python-3.10%2B-26231f?logo=python&logoColor=white)

**[How it works](#-how-it-works)** ·
**[Features](#-features)** ·
**[Screens](#-screens)** ·
**[Architecture](#-architecture)** ·
**[Quick start](#-quick-start)** ·
**[Mobile app](#-mobile-app)** ·
**[Support](#-support)**

</div>

---

The choir starts a hymn you half know. The preacher quotes a verse and moves on. **Scriptune
listens, works out what it was, and opens the words**: the full hymn with its number in the
hymnal, or the verse in context, with everything connected to it.

It runs as a website, an iPhone app and an Android app over one API. Speech recognition is
[OpenAI Whisper](https://github.com/openai/whisper) running on your own server, and on the phone
itself when there is no signal. No third-party speech service is involved. Recordings are
discarded once they are transcribed; only the words and the matches are kept, as your history.

## 🎧 How it works

<table>
  <tr>
    <td align="center" width="25%"><img src="docs/images/phone-identify.png" alt="The Identify screen with a large microphone button" width="220"></td>
    <td align="center" width="25%"><img src="docs/images/phone-results.png" alt="Best matches, each with a confidence score" width="220"></td>
    <td align="center" width="25%"><img src="docs/images/phone-hymn.png" alt="Amazing Grace with its hymn board number" width="220"></td>
    <td align="center" width="25%"><img src="docs/images/phone-bible.png" alt="Psalm 23 in the King James Version" width="220"></td>
  </tr>
  <tr>
    <td align="center"><b>1 · Listen</b><br><sub>Tap the microphone for up to fifteen seconds, or type the words you remember.</sub></td>
    <td align="center"><b>2 · Match</b><br><sub>The words are searched across every translation and hymnal, and ranked by how sure the match is.</sub></td>
    <td align="center"><b>3 · Open</b><br><sub>Every stanza, the author, and the number to put on the hymn board.</sub></td>
    <td align="center"><b>4 · Read on</b><br><sub>The verse in its chapter, in six translations, with the hymns that draw on it.</sub></td>
  </tr>
</table>

Behind the button:

```mermaid
flowchart LR
    A(["🎤 Sung or spoken"]) --> W["Whisper<br>speech to text"]
    T(["⌨️ Typed words"]) --> N
    W -->|"transcript + detected language"| N["Normalise<br>the words"]
    N --> S1{"Exact phrase<br>match?"}
    S1 -->|yes| R["Rank and score"]
    S1 -->|no| S2{"Any pair of the<br>rarest words?"}
    S2 -->|yes| R
    S2 -->|no| S3["Fuzzy match<br>trigram similarity"]
    S3 --> R
    R --> O(["📖 Verse or 🎵 hymn,<br>with a confidence score"])
```

The search is staged on purpose. Each later, more expensive stage runs only when the one before it
found nothing, so a clear match answers in tens of milliseconds and the database is never asked to
do fuzzy work it does not need.

## ✨ Features

| | |
| --- | --- |
| 🎤 **Identify by ear** | Sung, spoken or typed. Whisper detects the language of each recording, so English and Yoruba both work without a setting. |
| 📖 **Six Bible translations** | KJV, AKJV, ASV, WEB, WEBC and Douay-Rheims, including the deuterocanonical books. A match names the translation it came from. |
| 🎵 **Hymns and hymnals** | 1,200 public-domain hymns from *Sacred Songs and Solos*. Browse a hymnal or jump straight to a number. Any other hymnal imports from a JSON file that states its own rights. |
| 🔗 **Connected both ways** | A hymn lists the scriptures behind it, and a verse lists the hymns that draw on it. |
| 🔎 **One search for everything** | A phrase, a reference or a first line searches verses and hymns together. |
| ✈️ **Works offline** | Download translations and hymnals to the phone for reading, search and typed identification. Add the 60 MB listening model and the microphone works with no signal too. |
| 📚 **Personal library** | Saved hymns and verses, collections, notes and history. Guests keep history on the device, and it moves into the account on sign-in. |
| 🌗 **Light and dark** | Both apps follow the system theme or a chosen one. |
| 🔐 **Private by design** | Speech is transcribed on hardware you control. Sessions live in the keychain on mobile. See [SECURITY.md](SECURITY.md). |

## 📱 Screens

### Mobile (iOS and Android)

<table>
  <tr>
    <td align="center"><img src="docs/images/phone-hymnal.png" alt="A hymnal, browsed by number" width="200"><br><sub><b>Hymnals</b> · find a hymn by its number</sub></td>
    <td align="center"><img src="docs/images/phone-search.png" alt="Search results across verses and hymns" width="200"><br><sub><b>Search</b> · verses and hymns together</sub></td>
    <td align="center"><img src="docs/images/phone-more.png" alt="The More tab" width="200"><br><sub><b>More</b> · library, offline copies, settings</sub></td>
    <td align="center"><img src="docs/images/phone-offline.png" alt="Offline copies" width="200"><br><sub><b>Offline copies</b> · about 5 MB per translation</sub></td>
  </tr>
</table>

<table>
  <tr>
    <td align="center"><img src="docs/images/phone-identify-dark.png" alt="The Identify screen in the dark theme" width="200"><br><sub><b>Dark theme</b> · Identify</sub></td>
    <td align="center"><img src="docs/images/phone-hymn-dark.png" alt="A hymn in the dark theme" width="200"><br><sub><b>Dark theme</b> · a hymn</sub></td>
  </tr>
</table>

### Web

<img src="docs/images/web-home.png" alt="The website's Identify page" width="100%">

<table>
  <tr>
    <td width="50%"><img src="docs/images/web-search.png" alt="Website search results, Bible on the left and hymns on the right"></td>
    <td width="50%"><img src="docs/images/web-hymn.png" alt="A hymn page on the website"></td>
  </tr>
  <tr>
    <td width="50%"><img src="docs/images/web-bible.png" alt="Psalm 23 on the website"></td>
    <td width="50%"><img src="docs/images/web-home-dark.png" alt="The website in the dark theme"></td>
  </tr>
</table>

<sub>Every picture is a capture of the running apps. The phone screens come from the app's web build, so offline listening shows as unavailable there; it is part of the native apps.</sub>

## 🏗 Architecture

```mermaid
flowchart TB
    subgraph clients["Clients"]
        WEB["🌐 Web<br>Next.js 16 · PWA"]
        MOB["📱 Mobile<br>Expo 57 · React Native"]
    end
    CON[["📦 @scriptune/contracts<br>shared types and API client"]]
    WEB -.-> CON
    MOB -.-> CON

    WEB -->|"HTTPS · JSON · bearer tokens"| API
    MOB -->|"HTTPS · JSON · bearer tokens"| API

    subgraph server["Server"]
        API["⚙️ API<br>Zudojs modular monolith"]
        API -->|audio| WH["🗣 Transcriber<br>FastAPI · openai-whisper"]
        API --> PG[("🐘 PostgreSQL 17<br>full-text + trigram search")]
        API -.->|optional| RD[("Redis 7")]
    end

    subgraph phone["On the phone"]
        LW["whisper.rn<br>60 MB model, downloaded on demand"]
        SQ[("SQLite<br>offline copies")]
    end
    MOB --> LW
    MOB --> SQ
```

| Layer | Built with |
| --- | --- |
| **API** | ![TypeScript](https://img.shields.io/badge/TypeScript-3178c6?logo=typescript&logoColor=white) ![Zudojs](https://img.shields.io/badge/Zudojs-26231f) ![Prisma](https://img.shields.io/badge/Prisma_7-2d3748?logo=prisma&logoColor=white) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL_17-4169e1?logo=postgresql&logoColor=white) ![Redis](https://img.shields.io/badge/Redis_7-dc382d?logo=redis&logoColor=white) ![Vitest](https://img.shields.io/badge/Vitest-6e9f18?logo=vitest&logoColor=white) |
| **Web** | ![Next.js](https://img.shields.io/badge/Next.js_16-000000?logo=nextdotjs&logoColor=white) ![React](https://img.shields.io/badge/React_19-20232a?logo=react&logoColor=61dafb) ![Tailwind CSS](https://img.shields.io/badge/Tailwind_4-06b6d4?logo=tailwindcss&logoColor=white) ![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-000000?logo=shadcnui&logoColor=white) ![PWA](https://img.shields.io/badge/Serwist_PWA-5a0fc8?logo=pwa&logoColor=white) |
| **Mobile** | ![Expo](https://img.shields.io/badge/Expo_57-000020?logo=expo&logoColor=white) ![React Native](https://img.shields.io/badge/React_Native_0.86-20232a?logo=react&logoColor=61dafb) ![SQLite](https://img.shields.io/badge/SQLite-003b57?logo=sqlite&logoColor=white) ![whisper.rn](https://img.shields.io/badge/whisper.rn-26231f) |
| **Speech** | ![Python](https://img.shields.io/badge/Python-3776ab?logo=python&logoColor=white) ![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white) ![PyTorch](https://img.shields.io/badge/PyTorch_CPU-ee4c2c?logo=pytorch&logoColor=white) ![Whisper](https://img.shields.io/badge/openai--whisper-412991?logo=openai&logoColor=white) |
| **Ops** | ![Docker](https://img.shields.io/badge/Docker-2496ed?logo=docker&logoColor=white) ![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088ff?logo=githubactions&logoColor=white) ![CodeQL](https://img.shields.io/badge/CodeQL-26231f?logo=github&logoColor=white) |

```
scriptune/
├── api/           Zudojs modular-monolith API (TypeScript, Prisma, PostgreSQL)
├── web/           Next.js website and installable PWA
├── mobile/        Expo app for iOS and Android, plus the store listing assets
├── transcriber/   Python service that turns audio into words with Whisper
├── packages/      @scriptune/contracts: DTO types, keys and the API client both clients share
├── docker/        Dockerfiles and the compose stack (Postgres, Redis, optional API + transcriber)
├── scripts/       one-command launcher, API tunnel, hymnal parsers
└── docs/          architecture notes and the images on this page
```

The full design, module by module, is in [docs/v1-architecture.md](docs/v1-architecture.md).

## 🚀 Quick start

**You need:** Node 24+, npm 11+, Docker, and Python 3.10+ with about 2 GB of disk for PyTorch.

```bash
# 1. Environment files (once)
cp docker/.env.example docker/.env      # host ports for Postgres/Redis; change if 5432/6379 are taken
cp api/.env.example api/.env            # set AUTH_ACCESS_SECRET / AUTH_REFRESH_SECRET (32+ chars, distinct)
cp web/.env.example web/.env.local      # NEXT_PUBLIC_API_URL, NEXT_PUBLIC_SITE_URL
cp mobile/.env.example mobile/.env.local

# 2. Install and migrate (once, and after pulling dependency changes)
npm run setup             # root, contracts, api, web, mobile, and the Python transcriber
npm run infra:up          # Postgres + Redis in Docker
npm run db:migrate        # applies prisma/migrations

# 3. Load the texts (once; downloads the pinned public-domain datasets)
cd api
npm run import:bible -- --all   # KJV, AKJV, ASV, WEB, WEBC, DRC; or --translation WEB for one
npm run import:hymns            # Sacred Songs and Solos, 1,200 hymns
cd ..

# 4. Run everything
npm run dev
```

`npm run dev` starts Postgres and Redis, waits until they are healthy, then runs the five parts
together with colour-prefixed logs. **Ctrl+C stops everything.**

| Part | Address |
| --- | --- |
| 🗣 Whisper transcriber | `http://localhost:5005` |
| ⚙️ API | `http://localhost:4000` (interactive docs at `/docs`) |
| 🌐 Web | `http://localhost:3000`, or the next free port |
| 📱 Expo (Metro) | `http://localhost:8081` |

### Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | everything: Docker, transcriber, API, web, Expo |
| `npm run dev:web-only` | everything except the Expo server |
| `npm run dev:api` · `dev:web` · `dev:mobile` · `dev:transcriber` | one part on its own |
| `npm run infra:up` · `npm run stop` | start or stop the Docker containers |
| `npm run setup:transcriber` | (re)creates the Python venv for the transcriber |
| `npm run db:migrate` | applies database migrations |
| `npm run typecheck` | typechecks every package |
| `npm run test` | runs the API tests |

The web port comes from `WEB_PORT`, then from `NEXT_PUBLIC_SITE_URL` in `web/.env.local`, then 3000;
if that port is busy the next free one is used. Port 4000 and the Docker ports come from `api/.env`
and `docker/.env`.

## 🗣 Speech recognition

**On the server.** The Python service in [`transcriber/`](transcriber/) transcribes recordings with
OpenAI Whisper, and the API reaches it at `WHISPER_URL` (default `http://localhost:5005`).

- The first start downloads the `small` model (480 MB). The download resumes if it is interrupted,
  and the smaller `tiny` model answers requests until it has arrived.
- Whisper detects the language of each recording. Set `WHISPER_MODEL=medium` for better Yoruba accuracy.
- If the service is down, the microphone flow answers 502 and the typed flow still works.
  Set `TRANSCRIPTION_PROVIDER=none` to turn audio off deliberately.
- Uploads are capped at 25 MB and 60 seconds, one transcription runs at a time, and a busy service
  answers 503 with `Retry-After` instead of queueing without limit.

**On the phone.** In the native apps, **More › Offline copies › Offline listening** downloads a
quantised Whisper `base` model (about 60 MB) with a progress bar, and removes it again on request.
It is never bundled, so the install size stays small. With it, recordings are transcribed on the
device and matched against the downloaded texts, so identifying works with no connection at all.

## 📱 Mobile app

```bash
cd mobile
npm install
npm start          # a = Android, i = iOS, w = web
```

Point it at the API with `EXPO_PUBLIC_API_URL` (see `mobile/.env.example`). Google sign-in on
mobile needs the API's `MOBILE_AUTH_CALLBACK_URL` (default `scriptune://auth/callback`). Offline
listening uses native code, so it needs a development build or a release build, not Expo Go.
More in [mobile/README.md](mobile/README.md).

### Getting an APK or IPA

[`mobile-build.yml`](.github/workflows/mobile-build.yml) builds the native apps on GitHub's
runners, with no Mac or Expo account needed:

| Trigger | Builds |
| --- | --- |
| Push to `main` touching `mobile/` or `packages/contracts/` | Android APK |
| **Actions › Mobile build › Run workflow** | Android, iOS or both, against the API URL you enter |
| A tag like `mobile-v0.1.0` | both |

Download `app-release.apk` from the run's **Artifacts** and install it on any Android phone that
allows installs from unknown sources. The iOS artifact is unsigned unless the Apple signing
secrets listed at the top of the workflow are set.

### Reaching your local API from a phone

On the same Wi-Fi or hotspot, use the machine's LAN address with port 4000. Otherwise
`scripts/api-tunnel.sh` opens a free Cloudflare quick tunnel and prints a public HTTPS URL (it
changes on every start). Use it as `EXPO_PUBLIC_API_URL`, or paste it into the workflow's API
field, and set `TRUST_PROXY=1` in `api/.env` so rate limits see the real client address.

### Store listings

App Store and Play Store screenshots at the exact required sizes, the Play feature graphic and
the rules they keep to are in [mobile/store-assets/](mobile/store-assets/).

## 📚 Texts and hymnals

The scripture and hymn texts that ship with Scriptune are public domain. Importers live in
`api/src/jobs/`, and the app never fetches datasets at runtime.

Any other hymnal, including bilingual ones and collections used by permission, imports from a JSON file:

```bash
cd api && npm run import:hymnal -- --file path/to/hymnal.json
```

The file states the hymnal's own rights status, which is stored and shown on every hymn. See
[`api/docs/examples/hymnal.example.json`](api/docs/examples/hymnal.example.json) for the shape,
including a hymn with both English and Yoruba texts.

<details>
<summary>Preparing a hymnal from a PDF</summary>

<br>

The Celestial Church of Christ hymnal is prepared from its PDF with `scripts/parse-ccc-hymnal.py`
(needs `pip install pypdf`); `scripts/parse-cac-hymnal.py` does the same for the Christ Apostolic
Church Yoruba hymnal.

```bash
python3 scripts/parse-ccc-hymnal.py api/data/ccc-hymnal.pdf api/data/ccc-hymnal.json
cd api && npm run import:hymnal -- --file data/ccc-hymnal.json
```

The PDFs and generated JSON live in `api/data/` (git-ignored). Those texts are used by permission
and must not be committed.

</details>

## 🧩 Shared contracts

`packages/contracts` ships TypeScript source that both clients import as `@scriptune/contracts`
(linked with `file:../packages/contracts`). Next.js reads it through `transpilePackages` with the
Turbopack root set to the repo; Metro reads it directly. When a DTO changes in `api/src/dtos`,
update `packages/contracts/src/types.ts`.

## 🧪 Tests and CI

```bash
npm run test                                # API unit tests
npm run typecheck                           # every package
cd web && npm run lint && npm run build     # website lint and production build

# API integration tests (need a migrated test database)
cd api && TEST_DATABASE_URL=postgresql://scriptune:scriptune@localhost:5440/scriptune_test npm test
```

<details>
<summary>Creating the test database</summary>

<br>

```bash
docker exec scriptune-postgres-1 psql -U scriptune -d scriptune -c "CREATE DATABASE scriptune_test"
cd api && DATABASE_URL=postgresql://scriptune:scriptune@localhost:5440/scriptune_test npm run db:deploy
```

</details>

- [`ci.yml`](.github/workflows/ci.yml) runs on every push to `main` and on pull requests: API
  typecheck and tests against a PostgreSQL 17 service, the contracts typecheck, the web lint,
  typecheck and production build, and the mobile typecheck, lint and JavaScript bundle.
- [`mobile-build.yml`](.github/workflows/mobile-build.yml) builds the native apps, as described above.
- CodeQL scans the JavaScript/TypeScript, Python and workflow code.

## ⚙️ Configuration notes

| Setting | Where | Purpose |
| --- | --- | --- |
| `AUTH_ACCESS_SECRET`, `AUTH_REFRESH_SECRET` | `api/.env` | token signing; 32+ characters, distinct. Placeholder values are refused in production |
| `WEB_ORIGIN` | `api/.env` | comma-separated origins allowed by CORS |
| `WHISPER_URL`, `WHISPER_TIMEOUT_MS` | `api/.env` | where the transcriber is and how long to wait for it |
| `TRANSCRIPTION_PROVIDER` | `api/.env` | `whisper` (default), `fake` for tests, `none` to turn audio off |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | `api/.env` | Google sign-in; redirect URI `<PUBLIC_URL>/auth/google/callback` |
| `TRUST_PROXY` | `api/.env` | number of proxy hops in front of the API |
| `WHISPER_MODEL`, `WHISPER_DEVICE`, `WHISPER_THREADS` | transcriber environment | model size, `cpu` or `cuda`, thread count |
| `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL` | `web/.env.local` | API address and the site's own URL |
| `EXPO_PUBLIC_API_URL` | `mobile/.env.local` | API address baked into the app bundle |

## 🤝 Support

Scriptune is free and open source.

- 🐞 [Report a problem](https://github.com/oyinlola-tech/scriptune/issues/new?labels=bug&title=Something%20went%20wrong)
- 💡 [Suggest a hymnal or a feature](https://github.com/oyinlola-tech/scriptune/issues/new?labels=enhancement&title=Suggestion)
- ⭐ Star the repository, which helps other churches and choirs find it
- 💛 [Help keep it running](https://myhappr.com/oyinlola)
- 🔒 Found a security issue? Please follow [SECURITY.md](SECURITY.md) instead of opening a public issue.

## 📄 Licence

The Scriptune source code is released under the [MIT Licence](LICENSE). The scripture and hymn
texts it ships with are public domain and are credited on the Licences page of the site and app.
Hymnals imported by permission keep the rights status their import file declares.

<div align="center">
<br>
<img src="web/public/icon-192.png" alt="" width="48">
<br>
<sub>Made by <a href="https://github.com/oyinlola-tech">Oluwayemi Oyinlola</a></sub>
</div>
