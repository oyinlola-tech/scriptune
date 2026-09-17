# Store listing images

Captured from the running app, with a short caption above each screen.
`raw/` holds the untouched captures; the other folders hold the captioned frames to upload.

| Folder / file | Size | Where it goes |
| --- | --- | --- |
| `app-store-iphone-6.9/` | 1320 x 2868 | App Store Connect, iPhone 6.9" slot (Apple scales it down for smaller iPhones) |
| `app-store-ipad-13/` | 2064 x 2752 | App Store Connect, iPad 13" slot. Required only while `ios.supportsTablet` is true |
| `play-store-phone/` | 1080 x 1920 | Play Console, phone screenshots (2 to 8; 9:16 at 1080 px keeps them eligible for promotion) |
| `play-store-feature-graphic.png` | 1024 x 500 | Play Console, feature graphic (required) |

All files are PNG, RGB, no alpha channel, under both stores' size limits.

## Rules these were made to keep

Both stores
- Every frame is a real capture of the app in use. No splash, login or empty screens, no mock-ups of features that do not exist.
- Captions describe what the screen does. No prices or "free", no rankings or awards ("best", "#1"), no "download now", no store badges.
- Only public-domain text is shown: the King James Version, other public-domain translations, and Sacred Songs and Solos. The used-by-permission hymnals (CCC, CAC) are not used as marketing material.
- Nothing suggests endorsement by a church or a Bible publisher.

App Store (Review Guideline 2.3, screenshot specifications)
- No other platform's name, no Apple device artwork, no status bar mock-ups. Up to 10 per device size; these are 6.
- The captions match the app's actual behaviour: listening, typed identification, six translations, hymnals by number, search.

Google Play (Store listing and promotional content policy, preview assets)
- Longest side is not more than twice the shortest, 24-bit PNG, between 320 and 3840 px.
- The feature graphic has no device imagery and keeps its text clear of the edges, where Play crops it.

## Before you submit

- These were rendered from the web build with Geist standing in for the system font. For the final listing, recapture `raw/` on a simulator or device if you want pixel-exact iOS and Android type; the frames and captions can stay.
- The app has no tablet layout yet, so the iPad frames show the phone layout stretched. Setting `ios.supportsTablet` to `false` for the first release removes the iPad screenshot requirement.
- Store forms that go with the images: privacy policy URL, microphone use in Apple's privacy labels and Play's Data safety form (audio is sent for transcription and not stored), account deletion (already in the app under Settings, which both stores require).
- **Giving button:** the Support screen links to an external donation page. Apple (3.1.1 / 3.2.1) and Google Play (Payments policy) both restrict asking for money for the app outside their billing unless the recipient is a registered non-profit. The safest first submission hides "Support Scriptune" giving in the native apps and keeps it on the website; the GitHub links are fine.
