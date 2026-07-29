# GA Roadmap — Recruiting Hub

A living checklist we review daily until the GA milestone. Update statuses as items move.

## Status key

- `[ ]` — not started
- `[~]` — in progress
- `[x]` — done / verified
- `[–]` — deferred post-launch

## Critical blockers (must be done before GA)

| # | Task | Status | Owner | Notes |
|---|------|--------|-------|-------|
| 1 | End-to-end real-account smoke test (athlete → profile → media → coach → save) | [ ] | | Use real auth, not mock mode |
| 2 | Assign a project admin account in `user_roles` | [x] | | `dguilloryjr@msn.com` granted `admin` |
| 3 | Secure coach approve/reject with `createServerFn` + `has_role()` + `supabaseAdmin` | [x] | | `src/lib/coach-admin.functions.ts`; admin page no longer writes `user_roles` |
| 4 | Audit and verify RLS policies on every table | [x] | | All public tables have RLS enabled; owner + coach/admin policies verified |
| 5 | Verify `athlete-media` storage bucket exists and RLS upload rules work | [x] | | Private bucket, per-user folder policies + coach/admin read verified |
| 6 | Production build passes cleanly (`bun run build`) | [x] | | Build + typecheck clean |
| 7 | Password reset page tested end-to-end | [ ] | | `/reset-password` exists but untested |

## Important before launch

| # | Task | Status | Notes |
|---|------|--------|-------|
| 8 | Mobile responsive audit (390–414 px) | [ ] | Tap targets, spacing, overflow |
| 9 | Decide athlete profile visibility model | [ ] | Currently `/a/:athleteId` is auth-only. Decide public vs coach-only |
| 10 | Add contact info on athlete profile for coaches | [ ] | Email / phone visible only to approved coaches |
| 11 | Action photos upload (up to 6) | [ ] | Currently only profile photo |
| 12 | Form validation and error handling | [ ] | Height, GPA, grad year, URLs, duplicate coach requests |
| 13 | SEO head metadata on all routes | [ ] | Landing done; internal routes need `description`, `og:title`, `og:description`, `twitter:card` |
| 14 | Loading and empty states | [ ] | Replace plain “Loading…” with skeletons or friendly empties |
| 15 | Terms of Service and Privacy Policy pages | [ ] | Required for user-generated content and coach approvals |

## Nice-to-have / post-launch

| # | Task | Status | Notes |
|---|------|--------|-------|
| 16 | iOS Capacitor build on a real Mac | [–] | Config exists; needs Mac + Xcode + TestFlight |
| 17 | Analytics instrumentation | [–] | Sign-ups, profile completions, coach saves |
| 18 | Push notifications | [–] | Coach approvals, saved athlete updates |
| 19 | Summit Hoops event import | [–] | Replace manual event entry with real event data |
| 20 | Verified measurements / camp results workflow | [–] | Listed in original feature set; out of scope for v1 |

## Daily standup format

Each day we check this file and answer:

1. What did we complete since the last review?
2. What is blocked and needs a decision?
3. What are we doing next?

## How to update this file

- Mark a task `[x]` only after it has been tested in the live preview or production build.
- Add new tasks to the bottom of the appropriate section.
- If a task grows, open a sub-checklist under it.
- Keep the file checked into GitHub so the customer and team can see the same state.
