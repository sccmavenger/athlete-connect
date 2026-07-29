# Recruiting Hub — MVP Plan

A responsive web app (works great on phones, installable as PWA) that connects Midwest youth basketball athletes with college coaches. Visual style borrows from mayb.com: dark teal + orange accents, bold sporty typography, basketball imagery.

## User roles

1. **Athlete / Parent** — creates and manages an athlete profile.
2. **Coach** — must be approved by an admin before they can browse athletes.
3. **Admin** — the customer; approves coach requests.

Roles live in a separate `user_roles` table (never on profiles) with a `has_role()` security-definer function — standard secure pattern.

## Pages

Public
- `/` — Marketing landing: hero (MAYB-inspired), pitch, "Create athlete profile" and "I'm a coach" CTAs, feature list, footer.
- `/auth` — Sign up / sign in (email + password, plus Google). Role picked at signup (Athlete or Coach). Coaches land on a "pending approval" screen.

Athlete (authenticated)
- `/dashboard` — profile completeness, quick edit, upcoming games.
- `/profile/edit` — full profile editor (fields below).
- `/a/:athleteId` — public-ish profile page viewable by approved coaches (and shareable by the athlete).

Coach (authenticated + approved)
- `/coaches` — searchable athlete directory with filters: grad year, position, height, state, GPA min.
- `/a/:athleteId` — same profile view, plus "Save to my list" and "Contact info."
- `/coaches/saved` — coach's shortlist.

Admin
- `/admin/coach-requests` — approve / reject pending coaches.

## Athlete profile fields (v1)

- **Basics:** name, hometown, high school, grad year, position, height, weight, jersey #
- **Academics:** GPA, SAT/ACT (optional), intended major (optional)
- **Media:** up to 5 highlight video URLs (YouTube/Hudl/Vimeo), profile photo, up to 6 action photos
- **Schedule & socials:** Instagram handle, TikTok handle, upcoming games/events list (date, opponent, location, MAYB event flag)

## Design direction

- Palette pulled from MAYB: dark teal (`#2e5d5f`-ish), orange accent (`#f26722`-ish), off-white background, near-black text. All defined as semantic tokens in `src/styles.css` — no hardcoded colors in components.
- Typography: bold condensed sans for headings (sporty), clean sans for body.
- Basketball hero imagery on landing page (generated).
- Mobile-first layouts; card-based directory.

## Backend (Lovable Cloud)

Tables (all with RLS + grants):
- `profiles` — 1:1 with `auth.users`; display name, avatar.
- `athletes` — the athlete profile (fields above); `user_id` FK.
- `athlete_videos`, `athlete_photos`, `athlete_events` — child rows for media and schedule.
- `user_roles` — `(user_id, role)` where role ∈ `athlete | coach | admin`.
- `coach_requests` — pending/approved/rejected with reviewed_by, reviewed_at.
- `coach_saved_athletes` — coach's shortlist.

Storage bucket: `athlete-media` (public) for photos; videos are external URLs.

RLS summary:
- Athletes: anyone authenticated as athlete can insert/update their own row.
- Athlete profiles readable by the owner and by users with `coach` role (approved) or `admin`.
- Coach requests readable by requester and admins; only admins can update status.
- Trigger on `auth.users` insert creates `profiles` row and, if signup metadata says `role=coach`, creates a `coach_requests` row (pending). Athlete role is auto-granted; coach role is granted only when admin approves.

## Auth details

- Email/password + Google sign-in (via Lovable-managed Google OAuth).
- Signup form asks role. Coaches see "waiting for approval" until admin approves; only then does the `coach` role row get inserted, unlocking `/coaches`.
- Standard `/reset-password` page included.
- Session listener wired in root; sign-out clears cache and redirects to `/auth`.

## Out of scope for v1 (future)

- Verified measurements workflow, in-app messaging, Instagram game-schedule auto-import, coach recommendations, camp results imports, NCAA compliance tooling, native mobile builds, payments.

## Technical section

- TanStack Start (existing template). File-based routes under `src/routes/`; protected routes under `src/routes/_authenticated/`; admin routes under `_authenticated/_admin/` with a role gate via router context.
- Data reads via TanStack Query loaders (`ensureQueryData` + `useSuspenseQuery`).
- Server functions (`createServerFn` + `requireSupabaseAuth`) for privileged reads (coach directory, admin approve/reject). Admin approve uses `supabaseAdmin` after verifying caller has `admin` role via `has_role`.
- Image uploads through Supabase Storage `athlete-media` bucket with per-user folder RLS.
- Google OAuth uses `lovable.auth.signInWithOAuth("google", ...)` with public `/auth/callback`.
- SEO: unique `head()` per route with title/description/OG tags; landing page gets a generated hero as og:image.

## First-turn deliverable after approval

1. Enable Lovable Cloud.
2. Migration: `user_roles` + `has_role` + `profiles` + `athletes` + child tables + `coach_requests` + `coach_saved_athletes` + RLS + grants + triggers.
3. Storage bucket `athlete-media`.
4. Design tokens in `src/styles.css` (Summit Hoops dark palette).
5. Routes: landing, auth, athlete dashboard + profile edit, public athlete page, coach directory + saved, admin coach-requests.
6. Email/password auth wired; coach-approval gate; sign-out hygiene.
7. Generated basketball hero image for landing.

## Ongoing tracking

- See `GA-ROADMAP.md` in the repo root for the daily GA milestone checklist.

