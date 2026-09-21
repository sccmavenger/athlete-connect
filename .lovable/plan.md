# Reduce The HUB to a simple App Store support site

Strip the project down to a small marketing/support website that satisfies Apple's App Store Connect requirements for the iOS app, and remove the full web portal (accounts, dashboards, coach search, messaging, admin).

## What Apple actually requires as web pages

| App Store Connect field | Required? | Page |
| --- | --- | --- |
| Privacy Policy URL | Required for every app | `/privacy` |
| Support URL | Required for every app | `/support` |
| Marketing URL | Optional but expected | `/` (homepage) |
| Terms of Use (EULA) | Required if you have accounts/subscriptions; reviewers look for it | `/terms` |
| Account deletion path | Required for apps with sign-up — Apple accepts a documented web path | `/delete-account` |
| Data / safety disclosure backing | Not a URL, but the privacy page must match the Privacy Nutrition Labels | covered in `/privacy` |

Apple does not require a security page, a status page, or a cookie banner for this kind of app.

## Pages to build

1. **Homepage `/`** — what The HUB is, who it's for, feature highlights, App Store download callout, footer links to every support page. Doubles as the Marketing URL.
2. **Privacy Policy `/privacy`** — what's collected (name, school, measurements, academics, photos/video links, messages, location for radius search), how it's used, third parties, children/under-13 guardian consent, retention, deletion, contact email.
3. **Support `/support`** — contact email, response time, FAQ (creating a profile, under-13, how coaches find athletes, reporting/blocking, deleting an account).
4. **Terms of Use `/terms`** — eligibility, acceptable use, user content, no-tolerance for objectionable content, termination, disclaimers.
5. **Account Deletion `/delete-account`** — in-app steps plus an email request path, what gets deleted, timeline.
6. **404** — keep the existing one.

Each page gets its own title, description, and social preview tags, plus a shared header and footer.

## What gets deleted

- All authentication and signed-in pages: dashboard, profile editor, coach directory, messages, insights, family, colleges, admin console, public athlete profiles, auth/reset-password.
- Server functions, Supabase client usage, backend tables usage in the site, the E2E test suites and weekly regression workflow, mock/demo data, demo images.
- The database itself is left untouched — the iOS app keeps using it. Only the website stops talking to it.
- All Capacitor config, packages, iOS build scripts, and iOS docs — deleted permanently, not coming back. The native app lives in the separate `sccmavenger/the-hub-ios` repo.

## Design

Keep the current brand exactly: black surfaces, dodger-blue accents, The HUB wordmark, Barlow Condensed headings, "powered by Summit Hoops" tagline. Static pages only — no login button anywhere, since the web app no longer has accounts.

## Technical detail

Delete `src/routes/_authenticated/`, `src/routes/a.$athleteId.tsx`, `src/routes/auth.tsx`, `src/routes/reset-password.tsx`, `src/routes/api/`, `src/lib/*.functions.ts`, `src/lib/mock-*`, `e2e/`, `.github/workflows/weekly-regression.yml`, `capacitor.config.ts`, `IOS_SETUP.md`, and unused components (`BottomTabBar`, `MessageThread`, `ReportDialog`, `NotificationsBell`, etc.). Rewrite `src/components/SiteHeader.tsx` as a static nav, add `src/components/SiteFooter.tsx`, keep `__root.tsx` head defaults and the favicon/manifest assets. Point canonical/og URLs at `https://recruit.gforcedigital.net`.
