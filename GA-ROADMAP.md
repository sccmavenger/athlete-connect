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
| 1 | End-to-end real-account smoke test (athlete → profile → media → coach → save) | [x] | | Verified 7/29: athlete signup → profile save; coach signup → pending; admin approve → coach directory |
| 2 | Assign a project admin account in `user_roles` | [x] | | `dguilloryjr@msn.com` granted `admin` |
| 3 | Secure coach approve/reject with `createServerFn` + `has_role()` + `supabaseAdmin` | [x] | | `src/lib/coach-admin.functions.ts`; admin page no longer writes `user_roles` |
| 4 | Audit and verify RLS policies on every table | [x] | | All public tables have RLS enabled; owner + coach/admin policies verified |
| 5 | Verify `athlete-media` storage bucket exists and RLS upload rules work | [x] | | Private bucket, per-user folder policies + coach/admin read verified |
| 6 | Production build passes cleanly (`bun run build`) | [x] | | Build + typecheck clean |
| 7 | Password reset page tested end-to-end | [~] | | Needs a real inbox — email delivery can't be verified in the sandbox |

## Important before launch

| # | Task | Status | Notes |
|---|------|--------|-------|
| 8 | Mobile responsive audit (390–414 px) | [x] | Mobile drawer nav in header, no horizontal overflow at 390 px, larger tap targets, responsive hero/dashboard |
| 9 | Decide athlete profile visibility model | [x] | | Public: `/a/:athleteId` is a public SSR route with OG tags. Athletes opt in via a "Publish this profile publicly" toggle (`athletes.is_published`); unpublished profiles stay visible only to the owner, coaches and admins |
| 10 | Add contact info on athlete profile for coaches | [x] | `athlete_contacts` table with RLS; visible only to approved coaches/admins and the owner |
| 11 | Action photos upload (up to 6) | [x] | Uploads to `athlete-media`, stored in `athlete_photos`, gallery on the profile |
| 12 | Form validation and error handling | [x] | Zod validation in the profile editor and sign-up form with inline errors |
| 13 | SEO head metadata on all routes | [x] | Landing, Terms, Privacy have full meta + canonical; authed routes intentionally `noindex` |
| 14 | Loading and empty states | [x] | Skeleton loaders + friendly empty states on dashboard, directory, saved, admin |
| 15 | Terms of Service and Privacy Policy pages | [x] | `/terms` and `/privacy` live, linked from the landing footer |

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
