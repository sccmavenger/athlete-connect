# Rebrand to "The HUB" with the new logo

Swap in the new uploaded logo across the whole portal and rename the product from "Summit Hoops" / "Recruiting Hub" to **The HUB**, keeping "Powered by Summit Hoops" as the tagline and organization name.

## Logo assets

- Convert the uploaded PDF logo into high-resolution PNGs:
  - **Primary (blue on transparent)** — for light surfaces and marketing use.
  - **White version** — recolored to white/light for the app's black header and dark surfaces (this is the one the header uses).
  - **Square app-icon lockup** — the mark centered on the brand blue field, padded, for favicon / PWA icons / iOS icon (the wide wordmark can't be stretched into a square).
- Host the wordmark versions as CDN assets; the favicon and PWA/app icons stay real files in `public/`.

## Where the logo appears

| Place | Change |
| --- | --- |
| Site header | New white wordmark, wordmark-only (drop the separate "SUMMIT HOOPS" text since the logo contains the name) |
| Browser favicon | New square icon |
| PWA / home-screen icons (192, 512, apple-touch) | Regenerated from the square lockup |
| Landing hero + footer | New logo and updated brand name |
| Social share image (og/twitter) | Left as the app screenshot; no change needed |
| iOS app icon set | Full 19-size set regenerated for you to drop into Xcode |

## Naming changes

- Header, landing page, dashboard copy, page titles, meta descriptions: "The HUB".
- Terms, Privacy, Support, Account pages: product name becomes "The HUB"; Summit Hoops stays as the operating organization ("operated by Summit Hoops").
- PWA manifest name/short name: "The HUB".
- iOS `appName` in the Capacitor config: "The HUB" (bundle ID unchanged).
- Calendar export name and demo/mock event titles updated to match.

## Notes

- Colors stay as-is: the black/dodger-blue theme already matches the logo's blue family, so no palette change.
- You'll need to update the App Store Connect app name / subtitle and re-run `npx cap sync ios` plus drop in the new icon set on your Mac. I'll list those steps when the code work is done.

## Technical detail

New asset pointers under `src/assets`, updated references in `SiteHeader.tsx`, `__root.tsx` head links/meta, `index.tsx`, `manifest.webmanifest`, `capacitor.config.ts`, `ics.ts`, `mock-data.ts`, and the terms/privacy/support/account/insights/coaches/admin/profile route copy. Regenerated `public/favicon.png`, `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`, and an iOS icon set written to the documents output folder.
