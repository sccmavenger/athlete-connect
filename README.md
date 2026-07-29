# Recruiting Hub

A regional recruiting platform focused on connecting Midwest youth athletes with college coaches and recruiters. Built as a mobile-first Progressive Web App (PWA) for athletes, parents, coaches, and administrators.

## Features

- **Player Profiles** — athletes can build rich profiles with bio, measurements, academics, highlight videos, social links, and upcoming game schedules.
- **Verified Measurements** — structured fields for height, weight, position, wingspan, and grad year.
- **Academic Information** — GPA, SAT/ACT scores, and high school details.
- **Highlight Videos** — embed video links to showcase skills and game footage.
- **Coach Recommendations** — coaches can review and save athletes to a private shortlist.
- **Camp Results** — track showcase and camp performance.
- **NCAA Contact Information** — structured contact details for recruiting compliance.
- **College Coach Dashboard** — search, filter, and save athletes by state, grad year, position, height, and GPA.

## Tech Stack

- **Framework:** TanStack Start (React 19 + Vite 7)
- **Backend:** Lovable Cloud (Supabase) — auth, database, and storage
- **Styling:** Tailwind CSS v4 with custom Summit Hoops inspired dark theme
- **PWA:** `manifest.webmanifest` with MAYB branding and home-screen icons

## User Roles

1. **Athlete / Parent** — create and manage athlete profiles, schedules, and academic info.
2. **Coach** — search and filter athletes, view full profiles, and save prospects to a shortlist.
3. **Admin** — verify coach requests and manage user access.

## Key Routes

| Route | Description |
|-------|-------------|
| `/` | Marketing landing page |
| `/auth` | Sign in / sign up with role selection |
| `/dashboard` | Role-aware dashboard for athletes and coaches |
| `/profile/edit` | Athlete profile editor |
| `/coaches` | Coach directory with search and filters |
| `/coaches/saved` | Coach's saved athletes |
| `/admin/coach-requests` | Admin approval queue for coach accounts |
| `/a/:athleteId` | Public athlete profile view for recruiters |

## Mock Mode

Add `?mockRole=athlete`, `?mockRole=coach`, or `?mockRole=admin` to any authenticated URL to preview the UI with demo data without signing in. Useful for screenshots and stakeholder demos.

## Branding

- Logo and icons sourced from the Summit Hoops brand.
- Color scheme inspired by Summit Hoops: black background, white text, and dodger blue accents.

## Project Roadmap

The day-to-day GA checklist lives in **[GA-ROADMAP.md](./GA-ROADMAP.md)**. We review and update it daily until launch.

## Project Name

Recruiting Hub

