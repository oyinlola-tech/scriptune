# Scriptune v1 Architecture

Status: in progress. Phases 1 to 6 built (API skeleton, Bible, hymns, recognition, identity and library, web app), plus the shared contracts package and the Expo mobile scaffold. Next: deployment. Locked product decisions are in the table at the end.

## 1. System shape

```
Browser (Next.js on Vercel, web/)
        │  HTTPS, JSON, bearer tokens
        ▼
Zudojs API (Railway, api/)  ──►  Whisper transcriber (transcriber/, local speech to text)
        │
        ├── PostgreSQL (Prisma 7 via @zudojs/database)  ← Bible + hymn corpus, users, library
        ├── Redis (optional in v1; single instance uses in-memory cache/rate limits)
        └── S3-compatible object storage (v2, for audio retention / fingerprint corpus)
```

Repo layout:

```
scriptune/
├── api/        Zudojs modular monolith
├── web/        Next.js application
├── mobile/     Expo (React Native) app; Expo Router, expo-audio, keychain sessions
├── packages/   shared contracts (@scriptune/contracts: DTO types, library keys, fetch client for web and mobile)
├── docker/     api Dockerfile, compose stack for local Postgres + Redis
└── docs/
```

## 2. Backend modules (api/src/modules)

Each module is a `BaseModule` class registered in `app.ts`. In `onInitialize` a module
registers its providers in the container, its handlers on the command/query buses, and its
routes on the shared router. Dependency direction is strictly downward.

| Module          | Owns                                                                                     | Depends on                          |
| --------------- | ---------------------------------------------------------------------------------------- | ----------------------------------- |
| `http`          | HTTP server, router, CORS, security headers, rate limiter, request id, error mapping, `/health`, `/ready`, OpenAPI at `/openapi.json` and `/docs` | –                                   |
| `database`      | Prisma client, `DatabaseClient`, DB health check, container token                        | –                                   |
| `bible`         | Translations, books, verses, passages, verse-level full-text search                       | database                            |
| `hymns`         | Hymns, per-language texts, contributors, hymnals, entries, topics, scripture refs, sources, hymn full-text search | database                            |
| `search`        | Text normalization, unified `/search`, candidate ranking and confidence scoring           | bible, hymns                        |
| `transcription` | `TranscriptionProvider` interface, local Whisper implementation, fake provider for tests | –                                   |
| `recognition`   | `/recognize/audio` and `/recognize/text`, audio validation, pipeline orchestration, attempt logging | transcription, search               |
| `identity`      | Users, password auth, Google OAuth (PKCE), sessions, tokens, `/auth/*`, optional-auth middleware | database                            |
| `library`       | Saved hymns, saved verses, collections, notes, history, guest-history import, `/library/*` | identity, bible, hymns              |

Ingestion (KJV and hymnal importers) is not a runtime module. It lives in `api/src/jobs/`
as source parsers plus a CLI entry (`jobs.cli.ts`) that boots a headless runtime and dispatches
`bible.importTranslation` and `hymns.importHymn` commands. The app never reads GitHub JSON at runtime.

Module folders hold only `index.ts`, `<name>.module.ts`, `commands/` and `queries/`. Everything
else lives in the layer folders zudojs-cli generates: `configs/`, `constants/`, `controllers/`,
`databases/`, `dtos/`, `errors/`, `interfaces/`, `loaders/`, `loggers/`, `middlewares/`, `models/`,
`repositories/`, `routes/`, `services/`, `utils/`, `validators/`.

## 3. Data model (Prisma)

### Bible

- `Translation` — code (`KJV`, `AKJV`, `ASV`, `WEB`, `WEBC`, `DRC`), name, language, rightsStatus, source, sourceUrl, isDefault. `TranslationBook` records which of the 73 known books (66 Protestant + 7 deuterocanonical) a translation contains and its chapter count there (Esther 16 and Daniel 14 in Catholic editions).
- `Book` — canonical, shared across translations: order, name, abbreviation, slug, testament, chapterCount.
- `Verse` — (translationId, bookId, chapter, verse) unique, text, normalizedText, searchVector (tsvector).

Chapter is a number on `Verse`, not a table. Nothing in v1 needs chapter-level attributes and a
chapter table would double the join depth of every verse lookup. Adding one later is additive.

- `CrossReference` — from a verse to a passage, with the votes readers gave the link. Shared by every
  translation, so the text of a linked passage is read from whichever translation is open. Imported
  from OpenBible.info (CC BY 4.0) by `import:xrefs`, about 250,000 rows. The primary key leads with
  the source verse, so reading a verse's links is one index range scan.

### Hymns

- `Source` — provenance for every imported record: name, url, edition, license, rightsStatus, retrievedAt.
- `Hymn` — slug, canonicalTitle, year, meter, tuneName, rightsStatus, sourceId.
- `HymnText` — hymnId, language (`en`, `yo`, `ig`, `ha`, ...), variant label, title, stanzas (JSON), firstLine, normalizedLyrics, searchVector, sourceId, rightsStatus. One hymn can have many texts (languages and editions).
- `HymnAlternateTitle` — hymnId, title, language.
- `Person` and `HymnContributor` — role `AUTHOR | COMPOSER | TRANSLATOR | ARRANGER`.
- `Hymnal` — slug, title, edition, year, publisher, rightsStatus, sourceId.
- `HymnalEntry` — hymnalId, hymnId, number, section. Custom church numbering later becomes a hymnal owned by an organization.
- `Topic` and `HymnTopic`.
- `HymnRelation` — hymn to hymn, with a score and the reason the two are paired. Worked out ahead of
  time by `link:hymns`, which compares the words (terms weighted by how rare they are in the hymnal)
  and adds a bonus for shared scripture, so a request reads a few rows instead of comparing anything.
- `HymnScriptureReference` — hymnId, bookId, chapter, verseStart, verseEnd, origin. This is the hymn ↔
  scripture link in both directions. `origin` is `editorial` for links a hymnal file states and
  `matched` for those `link:scriptures` finds by looking for runs of words a hymn shares with the
  King James Version, scored by how rare those words are, so a stock phrase does not count as a quotation.

### Identity

- `User` — email (unique), name, avatarUrl, roles, active, createdAt, lastLoginAt.
- `Credential` — userId, passwordHash (scrypt via @zudojs/auth). Absent for OAuth-only users.
- `OAuthAccount` — (provider, providerId) unique, userId, email.
- `Session` and `RevokedToken` — Postgres implementations of the framework's `SessionStore` and `TokenRevocationStore`, so logout works across instances.

Reserved for v2 without schema churn: `EmailVerification`, `PasswordReset`.

### Library

- `SavedItem` (userId, targetType `HYMN | VERSE`, targetKey) — one table for both kinds; a verse key looks like `KJV:john:3:16`.
- `Collection` (userId, name, slug, description) and `CollectionItem` (targetType, targetId, position).
- `Note` (userId, targetType, targetKey, body).
- `HistoryEntry` (userId, kind `IDENTIFY | SEARCH | VIEW`, mode, query, targetType, targetKey, attemptId, occurredAt).
- `OAuthSignIn` (state, PKCE verifier, one-time exchange code) — Google sign-in never exposes Google tokens to the browser; the API redirects to the web callback with a one-time code the web app exchanges for Scriptune tokens.

### Recognition

- `RecognitionAttempt` — mode `BIBLE | HYMN`, inputType `AUDIO | TEXT`, transcript, normalizedText,
  provider, providerLatencyMs, candidates (JSON), topResultType, topResultId, confidence,
  totalDurationMs, userId (nullable), createdAt. Audio itself is not stored in v1.

## 4. Recognition pipeline

```
POST /recognize/audio  (multipart: audio, mode=bible|hymn, language=en)
  1. validate: mime in {audio/webm, audio/mp4, audio/ogg, audio/wav}, size ≤ 5 MB, duration ≤ 20 s
  2. transcription.transcribe({ audio, mimeType, language, hints })   → transcript
  3. search.normalize(transcript)                                       → normalized text
  4. search.candidates(mode, normalized)                                → ranked candidates
       - Postgres full-text (websearch_to_tsquery + ts_rank_cd) on verse text / hymn lyrics
       - pg_trgm similarity on normalizedText for misheard words
       - first-line boost for hymns
       - coverage score: fraction of transcript tokens present in the candidate
  5. score → confidence 0..100 = 100 × (½·score/expectedMax + ½·transcript coverage) × √(score/top), return top 5
  6. record RecognitionAttempt, return it with its id (GET /recognize/attempts/:id re-reads it)
```

`POST /recognize/text` runs steps 3 to 6 for typed input. The request is synchronous; a queue is
introduced only when audio fingerprinting arrives in v2. `/recognize/*` is rate-limited per IP
and works without a session. Audio is transcribed by the local Whisper service; it never goes to a third-party vendor.

`TranscriptionProvider` contract:

```ts
interface TranscriptionProvider {
  readonly name: string;
  transcribe(input: TranscriptionInput, signal?: AbortSignal): Promise<TranscriptionResult>;
}
// TranscriptionInput  { audio: Uint8Array; mimeType: string; language: string; hints?: readonly string[] }
// TranscriptionResult { transcript: string; confidence?: number; words?: readonly TranscribedWord[]; latencyMs: number }
```

## 5. HTTP API surface (v1)

Public, no session:

```
GET  /health, /ready, /openapi.json, /docs
POST /recognize/audio            POST /recognize/text
GET  /search?q=&type=all|hymns|verses&limit=
GET  /bible/translations
GET  /bible/:translation/books
GET  /bible/:translation/:book/:chapter
GET  /bible/:translation/:book/:chapter/:verse?context=2
GET  /bible/:translation/:book/:chapter/:verse/related        (hymns referencing this verse)
GET  /bible/:translation/search?q=&limit=                     (verse search owned by the bible module)
GET  /hymns?hymnal=&topic=&language=&page=&limit=          GET /hymns/search?q=&limit=&language=
GET  /hymns/:slug                  GET /hymns/:slug/related   (paired ahead of time by link:hymns)
GET  /hymnals                      GET /hymnals/:slug           GET /hymnals/:slug/:number
GET  /topics
```

Auth:

```
POST /auth/register   POST /auth/login   POST /auth/refresh   POST /auth/logout   GET /auth/me
GET  /auth/google     GET  /auth/google/callback     POST /auth/google/exchange
```

Library, bearer token required:

```
GET/POST        /library/saved              DELETE /library/saved/:type/:key
CRUD            /library/collections        CRUD /library/collections/:id/items
GET             /library/notes              PUT/DELETE /library/notes/:type/:key
GET/DELETE      /library/history            POST /library/history/import   (guest → account)
```

Public URLs on the web app mirror these: `/hymns/amazing-grace`, `/bible/kjv/john/3/16`.
Slugs are stored, never derived at request time, so shared links survive renames.

## 6. Cross-cutting

- Config from env only: `PORT`, `DATABASE_URL`, `WHISPER_URL`, `AUTH_ACCESS_SECRET`,
  `AUTH_REFRESH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `WEB_ORIGIN`, `REDIS_URL` (optional).
- CORS allowlist is `WEB_ORIGIN`. Security headers on every response. Structured JSON logs with
  redaction. Request id echoed as `x-request-id`.
- Errors come from `@zudojs/errors` and are mapped to `{ code, message, status, requestId }`.
  Internal details are never exposed.
- Tests: vitest unit tests per module with the fake transcription provider; integration tests
  against the compose Postgres.
- Docker: multi-stage `node:24-alpine` image for `api/`; compose stack with Postgres 17 and Redis
  for local development. Railway builds from the same Dockerfile.

## 7. Build order

1. API skeleton: config, `http` module, `database` module, health, OpenAPI, Docker, compose.
2. Bible: schema, KJV importer, endpoints, verse search.
3. Hymns: schema, Sacred Songs and Solos importer (then other public-domain collections), endpoints, hymn search.
4. Recognition: transcription provider, local Whisper service, audio and text endpoints, ranking, attempt logging.
5. Identity and library: email/password, Google, sessions, saved items, collections, history import.
6. Web: Next.js scaffold, design system (ivory / ink / gold, Inter or Geist plus DM Serif Display), identify screen, results, search, explore, library, account, PWA.
7. Deploy: Railway (api) and Vercel (web), environment wiring, CI.
8. Mobile: Expo app on `packages/contracts` (built: identify by audio and text, search, hymn and verse reading, email and Google sign in via the `scriptune://auth/callback` deep link, saved items, collections, notes, history with guest import, offline cache, brand icons, EAS profiles). Offline: `GET /export/bible/:translation` and `GET /export/hymnals/:slug` dump a whole corpus (cacheable a day); the app stores it in SQLite with FTS5 and reads, searches and identifies typed words locally, so only listening needs a connection. Compliance: shared legal documents (`packages/contracts/src/legal.ts`) on web `/legal/*` and mobile `legal/[doc]`, consent lines at sign-up, `DELETE /auth/me` account deletion in both clients, mobile onboarding (3 screens) behind an Expo Router protected route. Bible browsing is book → chapter grid → chapter on both clients. Remaining: `eas init`, store listings, counsel review of legal text.

## 8. Locked decisions

| Area                     | Decision                                                        |
| ------------------------ | --------------------------------------------------------------- |
| Speech to text           | OpenAI Whisper (transcriber/, Python) behind `TranscriptionProvider` |
| Languages                | English in v1; language is first-class on every hymn text        |
| Hymn data                | Public-domain sources via importers; provenance on every record  |
| Initial hymnals          | Sacred Songs and Solos, then other legally usable collections    |
| Bible                    | KJV, imported into PostgreSQL; translation is an entity          |
| Database                 | PostgreSQL, Prisma 7 via `@zudojs/database`                      |
| Search                   | Postgres full-text + pg_trgm; swappable behind `search`          |
| Recognition v1           | speech → text → search → ranked candidates, synchronous          |
| Fingerprinting / humming | v2 / v3                                                          |
| Auth                     | Email/password + Google; guest recognition; verification/reset v2 |
| Tokens                   | Bearer access + refresh tokens; server-side sessions             |
| Frontend                 | Next.js + TypeScript + Tailwind + shadcn/ui + Lucide, in `web/`  |
| Hosting                  | Vercel (web), Railway (api, Postgres, Redis), Docker-ready        |
| Brand                    | Clean, reverent, modern: warm ivory, near-black ink, muted gold   |
