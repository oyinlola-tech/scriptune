# Scriptune Web

Next.js front end for Scriptune. Talks to the Zudojs API over HTTPS with bearer tokens.

```bash
cp .env.example .env.local   # point NEXT_PUBLIC_API_URL at the API (default http://localhost:4000)
npm install
npm run dev                  # http://localhost:3000
```

- `src/app` — routes (App Router). The home page is the identify tool.
- `src/components` — UI: `identify/`, `hymns/`, `bible/`, `library/`, `auth/`, `layout/`, `ui/` (shadcn).
- `src/lib/api` — typed API client and endpoints; `lib/auth` — session store; `lib/recorder` — microphone capture.

Production builds register a service worker (`src/app/sw.ts`) so the app is installable.
