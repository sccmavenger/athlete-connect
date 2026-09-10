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
