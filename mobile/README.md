# Scriptune mobile

The Expo app for Scriptune: identify a hymn or verse by listening, then read the words. It talks to the same API as `web/` and shares its types through `packages/contracts`.

## Stack

- Expo SDK 57, Expo Router (file routes under `src/app`), React Native 0.86, TypeScript.
- `expo-audio` records a clip of up to fifteen seconds and posts it to `/recognize/audio`. The Deepgram key never leaves the API.
- `expo-secure-store` keeps the refresh token in the device keychain. The access token stays in memory. Same split as the web app.
- TanStack Query for server state, Zustand for the session.
- Palette and type mirror the web app: ivory ground, ink text, muted gold accent, DM Serif Display for scripture and hymn moments. Icons are Lucide (`lucide-react-native` on `react-native-svg`), the same set as the web.
- Appearance: Library › Appearance offers Light, Dark or Device. The choice is persisted and applied through React Native's `Appearance.setColorScheme`, so every `useColorScheme()` in the app, including navigation headers and the status bar, follows it.

## Layout

```
src/app/                 routes
  _layout.tsx            fonts, theme, query client, session restore, onboarding guard, root stack
  onboarding.tsx         three welcome screens (Hear it · Know it · Keep it), shown once per device
  legal/[doc].tsx        Terms, Privacy, Licences from @scriptune/contracts (reachable before onboarding)
  (tabs)/                Identify · Bible · Search · Library
  bible/[translation]/[book]/index.tsx            chapter grid, pick before reading
  bible/[translation]/[book]/[chapter]/index.tsx  the chapter, verse by verse
  hymns/[slug].tsx       a hymn's words, hymn board number, save, collections, note
  bible/[translation]/[book]/[chapter]/[verse].tsx
  library/collections/[slug].tsx
  auth/login.tsx         email and password, or Google (modal)
  auth/callback.tsx      cold-start landing for scriptune://auth/callback?code=
src/components/          identify (listening disc, candidate card), library actions, ui primitives
src/lib/api/             client built on @scriptune/contracts, typed endpoints
src/lib/auth/            session store on the keychain, Google auth session
src/lib/history/         guest history on the device, imported on sign in
src/lib/offline/         SQLite copy of downloaded corpora: downloads, readers, FTS5 search, local identification
src/app/offline.tsx      choose which translations and hymnals to keep on the device
src/lib/recorder/        expo-audio recorder hook
src/lib/query.ts         query client persisted to AsyncStorage (hymns and verses read offline for a week)
src/theme/               tokens and the useColors hook
```

## Widgets, shortcuts and auto-listen

Like Shazam, the widgets cannot record on their own (neither platform lets a widget use the microphone). They open the app with a deep link that starts the action:

- `scriptune://listen` lands on Identify and starts recording immediately; `scriptune://search` opens the Search tab.
- **iOS**: `targets/widget/` is a WidgetKit extension built by `@bacons/apple-targets` with a small "Listen" widget (also a lock-screen circular one) and a medium "Search" widget. It compiles only on macOS, so the GitHub iOS job is where it is verified.
- **Android**: `src/widgets/` draws the same two widgets with `react-native-android-widget`; `index.ts` registers the handler before Expo Router starts.
- **App shortcuts**: long-press the app icon for "Listen now" and "Search" on both platforms (`expo-quick-actions`).
- **Auto-listen**: Library › Listening › "Start listening when the app opens" makes the Identify tab start the microphone on every launch and return to the foreground.

None of this native part runs in Expo Go; use a development or release build.

## Works without a connection

Library › Offline copies downloads a whole translation (`GET /export/bible/:code`, about 5 MB) or hymnal (`GET /export/hymnals/:slug`, about 1.5 MB) into SQLite on the device, with FTS5 indexes. Once something is downloaded:

- hymn and verse screens read the device copy first and only call the API for what is missing,
- search runs on the device (instantly, and offline),
- typing the words identifies them on the device with the same coverage-based confidence idea as the API,
- listening still needs a connection, because speech-to-text runs on the API. The identify screen says so when offline and points at the downloads.

Recently opened items are also cached by the query client for a week, even without a download.

## Compliance

- Onboarding ends with, and the sign-in screen carries, a consent line linking to the Terms and Privacy Policy.
- Terms, Privacy Policy and Licences live in `packages/contracts/src/legal.ts` and render identically on the web (`/legal/*`) and in the app. Set the operator name and contact address in `LEGAL_CONTACT` there. Have the text reviewed by counsel before release, and add a governing-law clause for your jurisdiction.
- Account deletion is in-app (Library › Delete account) and on the web (Account), as Apple and Google require for apps with sign-up. It calls `DELETE /auth/me`, which ends every session and removes the user and everything under it.
- Microphone and network usage strings are in `app.json`. Audio is never stored; the Privacy Policy says so.

## Google sign in

The app opens `${API_URL}/auth/google?redirect=scriptune://auth/callback` in an auth session. The API finishes the Google exchange server-side and bounces the browser to that deep link with a one-time code, which the app trades for tokens at `/auth/google/exchange`. The API only honours the deep link named in its `MOBILE_AUTH_CALLBACK_URL` (default `scriptune://auth/callback`); Google credentials never reach the device.

## Builds

### On GitHub, without a Mac or an Apple login

`.github/workflows/mobile-build.yml` builds the apps on GitHub's own runners. Open the repository's Actions tab, choose "Mobile build", pick a platform and the API address, and download the artifacts from the finished run (or push a tag such as `mobile-v0.1.0`).

- **Android**: `scriptune-android-apk` holds `app-release.apk`, signed with the debug key. Copy it to the phone and open it; allow installs from unknown sources when asked.
- **iOS, unsigned** (no secrets set): `scriptune-ios-ipa` holds `Scriptune-unsigned.ipa`. iPhones only run signed apps, so re-sign it with your Apple ID using Sideloadly (Windows or Mac) or AltStore. Free Apple IDs give a 7-day certificate; a paid developer account gives a year.
- **iOS, signed ad hoc**: add the four repository secrets listed at the top of the workflow (a .p12 certificate, its password, an ad-hoc provisioning profile containing your iPhone's UDID, and your team id). The run then produces `Scriptune.ipa`, installable straight from the phone's browser or Finder. Create the certificate and profile at developer.apple.com in a browser; this path never logs in to Apple from the CLI, so it is unaffected by the EAS "service key" outage.

### Through EAS

`eas.json` defines development, preview and production profiles. Before the first build run `eas init` to attach the project, set `EXPO_PUBLIC_API_URL` in the profiles to the deployed API, and add the store metadata to `app.json`.

## Run it

```bash
cd mobile
npm install
npm start          # then press a for Android, i for iOS, or scan with Expo Go
```

The API URL comes from `EXPO_PUBLIC_API_URL` (or `extra.apiUrl` in `app.json`, default `http://localhost:4000`). It can also be changed on the phone under Library › Connection, with a Test button, so a test build keeps working when the tunnel or laptop address changes; the override is stored on the device and applied on launch. On a physical device, point it at your machine's LAN address, and add that origin to the API's `WEB_ORIGIN` list.

`expo-audio` and `expo-secure-store` need a development build rather than Expo Go for full fidelity on iOS. Create one with:

```bash
npx expo prebuild
npx expo run:ios   # or run:android
```

## Done and next

Done: identification by audio and text, hymn and verse reading, search, email and Google sign in, saved items, collections, notes, history (guest history imported on sign in), offline reading of recently opened hymns and verses, brand icon and splash, EAS profiles.

Next: `eas init` and the first development build, store listings and screenshots, a hymnals browser, chapter reading, and melody recognition when the API gains it.
