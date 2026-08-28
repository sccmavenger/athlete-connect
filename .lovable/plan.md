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
- **All content is fake.** No real player, parent, or coach data appears in any screenshot. Screens are captured against dedicated demo accounts holding invented athletes (fictional names, schools, cities, GPAs, videos, games) and an invented college coach. Real accounts (including yours) are never signed into for capture, and any screen that would surface a real athlete is re-shot or replaced.
- Demo records are created solely for the capture and are clearly fictional; I'll confirm nothing real leaked before delivering.
- Each shot is a viewport screenshot (not full-page), scrolled so the screen's most meaningful content is framed.
- Every image is inspected after capture for clipped text, empty states, or layout breaks, and re-shot if it doesn't look presentation-ready.
- Status bar/notch chrome is not part of the capture — Apple accepts clean app screenshots.

## Notes

- Demo data is written to be rich enough that no screen looks empty (messages, pipeline, games, college list all populated with fictional entries).
- Delivered as individual PNGs attached in chat; the older `/mnt/documents/mockups/` set is left untouched.

