# The HUB — End-to-end test plan

Covers both product views end to end: the **athlete/family view** and the **college
coach view**. Every case runs against the live app in a real browser (Playwright,
Chromium, 1280×1800) using throwaway accounts that are deleted after the run.

## How to run

```bash
bun run test:e2e:views     # athlete + coach journeys (the plan below)
bun run test:e2e           # everything, incl. abuse/permission matrix
bun run test:e2e:cleanup   # manual sweep of leftover test data
```

Requires `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` and
`SUPABASE_PUBLISHABLE_KEY` in the environment. Target another environment with
`E2E_BASE_URL=https://…`.

## Suite A — Athlete / family view (`e2e/athlete-view.spec.ts`)

| ID  | Case | Expected result |
| --- | --- | --- |
| A1  | Sign in with an athlete account | Lands on the dashboard shell |
| A2  | Fill the profile editor, publish, reload | All values persist after reload |
| A3  | Open the public profile signed out | Name and high school visible |
| A4  | Add a target school | School appears on the list with its logo |
| A5  | Create a guardian invite code, parent redeems it | Parent sees the athlete |
| A6  | Start a conversation with a coach | Message appears in the thread |
| A7  | Report an inbound coach message | "Report sent" confirmation |
| A8  | Open the notifications bell | New-message notification listed |
| A9  | Open profile insights | Insights page renders |
| A10 | Delete the account from Account settings | Redirected out and sign-in fails afterwards |

## Suite C — College coach view (`e2e/coach-view.spec.ts`)

| ID  | Case | Expected result |
| --- | --- | --- |
| C1  | Sign in with an approved coach account | Athlete search opens |
| C2  | Filter by position + min GPA + ZIP radius | Athlete found with distance; raising GPA excludes them |
| C3  | Open an athlete profile from results | Profile detail renders |
| C4  | Bookmark the athlete | Button flips to Saved; shortlist lists them |
| C5  | Games near me by ZIP | Upcoming game listed |
| C6  | Message an athlete from the profile, athlete replies | Both messages visible on both sides |
| C7  | Report an athlete profile | "Report sent" confirmation |
| C8  | Block, then unblock from Account | Composer disappears while blocked; blocked list manages it |

## Suite B — Abuse / permission matrix (`e2e/abuse-matrix.spec.ts`)

Direct Data API probing as each role: reading other people's data, role
escalation, sender impersonation, unpublished-profile access. Everything must be
rejected. Runs with the full suite.

## Cleanup policy

- Each spec deletes its own accounts in `afterAll`.
- Playwright `globalTeardown` then sweeps every `e2e-*@example.com` account and
  any residual reports, blocks or `E2E %` athlete rows.
- Real accounts and the Apple review accounts are never touched.

## Weekly regression cadence

- Runs automatically every Monday 09:00 UTC (`.github/workflows/weekly-regression.yml`),
  and can be started manually from the Actions tab.
- Every run is recorded in `docs/TEST-RUNS.md`: date, suites, pass/fail counts,
  what failed, root cause, fix.
- Failures are triaged immediately: fix the product bug (not the test) unless the
  test itself encodes a stale expectation.

## Suite D — Admin & moderation (`e2e/admin-view.spec.ts`)
- D1 admin signs in and opens the admin console
- D2 admin approves a pending coach request
- D3 admin finds a user and toggles a role
- D4 admin reviews and resolves an open report
- D5 admin hides a reported athlete profile
- D6 a non-admin is denied the admin console

## Suite M — iOS/mobile layout (`e2e/mobile-layout.spec.ts`, 390x844)
Per route it checks: no horizontal scroll, no element past the right edge, tap targets >= 44px
(checkboxes inside a `<label>` are exempt because the label carries the hit area), and no content
permanently hidden behind the fixed bottom tab bar.
- M1 public: `/`, `/auth`, `/support`, `/privacy`, `/terms`
- M2 athlete: dashboard, profile editor, colleges, messages, insights, family, account, public profile
- M3 coach: dashboard, search, saved, games, messages, account, athlete profile
- M4 admin: console, users, coach requests, reports

## Code-review checklist (run with the suites)
- Every mutating server function calls `requireSupabaseAuth`; admin functions assert the admin role.
- Async buttons have disabled/busy states and a success or error toast.
- All primary buttons/links are at least 44px tall on mobile.
- Account deletion still removes rows across all owned tables plus storage folders.

## Commands
- `bun run test:e2e:views` — athlete + coach suites
- `bunx playwright test e2e/admin-view.spec.ts e2e/mobile-layout.spec.ts` — admin + mobile suites
- `bun run test:e2e:cleanup` — remove throwaway data
