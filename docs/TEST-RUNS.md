# Regression run log

One entry per execution of `docs/TEST-PLAN.md`. Weekly cadence: Mondays 09:00 UTC
(automatic) plus any manual run before a release or App Store submission.

Template:

```
## YYYY-MM-DD — <automatic | manual> — <environment>
Suites: A (athlete) x/10, C (coach) x/8
Found: …
Fixed: …
Cleanup: verified — 0 test accounts remaining
```

---

## 2026-09-10 — manual — preview (localhost:8080)

Suites: A (athlete) 10/10 pass, C (coach) 7/7 pass (C3+C4 combined in one case).

Found:
1. Account settings — the athlete deletion check could not identify the page
   heading because "ACCOUNT" and "DELETE ACCOUNT" both matched. Test-side
   ambiguity, not a product defect.
2. Coach inbox — a coach with no existing conversation has nothing to open, so
   the messaging check stalled. Correct product behaviour: coaches must start a
   conversation from an athlete profile.

Fixed:
1. Heading check tightened to an exact match.
2. Coach messaging case now starts the conversation from the athlete profile's
   Message button, matching the real coach flow.

No product bugs found. Athlete registration→profile→publish→discovery→messaging→
reporting/blocking→account deletion and coach search→bookmark→schedule→messaging→
report/block→unblock all behave as designed.

Cleanup: verified — every throwaway account deleted, 0 remaining, no residual
reports, blocks or athlete rows.

## Run 2 — full audit (manual)

Suites: athlete (A1-A10), coach (C1-C8), admin (D1-D6), mobile/iOS layout (M1-M4).
Result: all suites passing after fixes below.

Found and fixed:
- Admin report queue buttons had no in-flight state — added per-report busy state and disabled buttons.
- Account "Unblock" had no busy state — now disables and shows "Unblocking…".
- Coach bookmark toggle on the public profile had no busy state or confirmation — added both.
- Tap targets under 44px (Apple minimum) enlarged: header logo link and guest "Sign in",
  landing footer Terms/Privacy, support/privacy/terms inline links, auth tabs and submit buttons,
  admin user role toggles, family consent checkbox / gender toggle / create + link buttons,
  athlete profile Back, Edit, Report and "Add to calendar" buttons.
- Test helper `seedReport` used an invalid `target_type` ("profile") — corrected to "athlete_profile".
- Admin coach-request row locator in the test was ambiguous — now scopes to the containing card.

Cleanup: global teardown removed all throwaway `e2e-*@example.com` accounts; no seeded data left behind.
