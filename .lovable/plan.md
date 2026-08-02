## Why coaching felt empty

Verified in the database: there is no coach account today — the three accounts are two athletes and one admin. Coach pages (`/coaches`, Games, Saved, Inbox) are gated on the `coach` role, and the header only shows those links to coaches, so an admin login sees nothing but Coach Requests. That's the first thing to fix, then the search itself gets real recruiting filters.

## What I'll build

### 1. Coach access that actually works
- Give admins full coach-side access (nav links + page access on Saved and Inbox, which are coach-only today), so you can test the coach experience from your admin account.
- Create a real approved coach test account for you so you can log in as a coach for external testing.

### 2. Place-based location search (replaces ZIP-only)
- One "Where" box that accepts a city, metro, state, or ZIP: "San Francisco, CA", "Bay Area", "Virginia", "63103".
- Geocoding runs server-side and returns a center point plus, for a state search, the state itself. When a state is recognized, results filter by state instead of a circle (so "Virginia" returns the whole state, not a 50-mile bubble).
- Radius choices become 10 / 20 / 30 / 40 / 50 miles, with 100 and 250 kept for wide sweeps.
- Results show distance from the search center and sort nearest-first; a note explains that athletes without a location on file can't appear in a radius search.

### 3. Position groups instead of free text
- Quick toggles: Perimeter (PG/SG/SF), Guards (PG/SG), Wings (SG/SF), Bigs (PF/C), plus individual positions.
- Matching normalizes the athlete's free-text position field (e.g. "Point Guard", "PG/SG", "guard") so a Perimeter search catches all of them.

### 4. "Playing this weekend" filter
- A When control on the athlete search: Any time / This weekend / Next 7 days / Next 30 days.
- When set, only athletes with a scheduled game in that window appear, and each card shows the next game's date, time and location — so a coach searching "perimeter, within 30 miles of San Francisco, this weekend" gets a list they can actually go watch.

### 5. Search polish
- Filters live in the URL, so a coach can bookmark or share a search (and it plugs into the existing Saved Searches feature).
- Save-search and bookmark actions available directly from result cards.

## Technical notes
- Geocoding: extend `src/lib/geocode.functions.ts` into a general place lookup (city/state/ZIP) using a free no-key geocoder, cached client-side; state names/abbreviations resolved from a local table so state searches need no network call.
- Position normalization lives in a new `src/lib/positions.ts` shared by search and profile display.
- "Playing this weekend" queries `athlete_events` for the date window, then intersects athlete IDs with the directory query; next-game info is attached per card.
- Search state moves to TanStack Router `validateSearch` on `/coaches`.
- No schema changes required. Coach test account and admin access are role/data changes only.

## Testing
- Extend the Playwright suite: coach searches perimeter + 30 miles of a metro + this weekend, confirms the athlete appears, and confirms a narrower radius or wrong position group excludes them.
