# App Store Screenshots (iPhone 6.5")

Generate 10 App Store-ready screenshots of the mobile app at **1242 × 2688 px**, the size Apple's iPhone 6.5" slot accepts, saved to `/mnt/documents/appstore/`.

## Screens to capture

Athlete/parent side (signed in as the athlete test account):
1. Dashboard — identity card, publish status, stat tiles
2. Profile strength / quick actions
3. Profile editor (basics + academics)
4. Public athlete profile as coaches see it
5. My college list
6. Insights
7. Messages / coach conversation

Coach side (signed in as the coach demo account):
8. Athlete directory with search filters open
9. Coach pipeline (saved athletes)
10. Games near me

## How it works

- Playwright at a 414 × 896 CSS viewport with `deviceScaleFactor: 3`, which renders exactly 1242 × 2688 px — no upscaling, no letterboxing.
- Sign in with the existing test accounts (athlete and coach demo) so real UI and real data are shown; no mock-mode bypass is used.
- Each shot is a viewport screenshot (not full-page), scrolled so the screen's most meaningful content is framed.
- Every image is inspected after capture for clipped text, empty states, or layout breaks, and re-shot if it doesn't look presentation-ready.
- Status bar/notch chrome is not part of the capture — Apple accepts clean app screenshots.

## Notes

- If a screen looks thin because the demo data is sparse (e.g. no messages, empty pipeline), I'll flag it and either pick a better-populated screen or note what data would need to exist first.
- Delivered as individual PNGs attached in chat; the older `/mnt/documents/mockups/` set is left untouched.
