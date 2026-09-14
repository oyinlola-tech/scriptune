# Security policy

Scriptune handles account credentials, session tokens and short audio clips
recorded by people in church. We take reports about any of that seriously.

## Reporting a vulnerability

Please do not open a public issue for security problems.

- Preferred: use GitHub's private reporting on this repository (Security tab
  → "Report a vulnerability").
- Or email hello@scriptune.app with "Security" in the subject.

Include what you found, where (API, web, mobile, or the shared package), how
to reproduce it, and what impact you believe it has. Proof-of-concept requests
against your own account are welcome; please do not access other people's
data, degrade the service, or send large volumes of traffic.

You will get an acknowledgement within 3 working days, an assessment within
10, and a fix or mitigation plan for confirmed issues as quickly as severity
warrants. We will credit you in the release notes if you want. There is no
bug bounty at this time.

## Scope

- `api/`: the Zudojs API (accounts, sessions, library, recognition, corpus).
- `web/`: the Next.js site.
- `mobile/`: the Expo app, including its widgets and deep links.
- `packages/contracts/`: shared types and the API client.
- The deployed services at scriptune.app once they are live.

Out of scope: the public-domain scripture and hymn text, third-party services
we call (Deepgram, Google sign-in, hosting providers), and vulnerabilities in
dependencies with no reachable path in Scriptune. Dependency reports are still
appreciated so we can update.

## Supported versions

Only the `main` branch and the latest published app builds receive security
fixes.

## How the project is built to stay safe

- Secrets never live in the repository. `.env` files are ignored by git; only
  `.env.example` files are tracked. The Deepgram key, auth signing secrets and
  Google credentials exist solely on the API server.
- Audio is forwarded to the speech-to-text provider and never stored. Only
  the transcript and the matched results are kept, as the Privacy Policy says.
- Passwords are stored as salted scrypt hashes. Sessions use short-lived
  access tokens and rotating refresh tokens; every session can be revoked.
  On mobile the refresh token is kept in the device keychain.
- Auth signing secrets must be at least 32 characters and distinct; the API
  refuses to start otherwise.
- Redirects in the Google sign-in flow accept only relative web paths or the
  single registered app deep link, never arbitrary URLs.
- Rate limits apply to authentication, recognition and the API as a whole.
  Behind a proxy or tunnel, set `TRUST_PROXY` so limits see the real client.
- Accounts can be deleted by their owner from the web and the app, removing
  every record under them.
- Continuous integration runs the test suite against a real database on every
  push; signing material for app builds is held only in GitHub secrets.

## Deploying safely

Before exposing an instance publicly: generate fresh `AUTH_ACCESS_SECRET` and
`AUTH_REFRESH_SECRET` values, set `WEB_ORIGIN` to the real site origin, put
the API behind HTTPS, and keep `TRANSCRIPTION_PROVIDER=fake` out of production
(it echoes uploaded bytes as the transcript and exists for tests only).
