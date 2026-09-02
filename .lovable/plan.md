# Apple App Review Rejection — Response Plan

Your screenshot uploaded at 158px wide, so Apple's body text can't be read. The four cited guidelines are legible, and I checked the app against what each one normally requires. Where the app is genuinely missing something, that's confirmed below. Where the fix depends on Apple's exact wording, that's marked as needing your paste of the text.

## What I confirmed in the app

- **No in-app account deletion.** There is no account/settings screen at all. The only deletion path is admin-only (`deleteAdminUser`) plus "email us" text on the Support, Privacy, and Terms pages. This is exactly what guideline 5.1.1(v) rejects for an app that supports account creation.
- **No report or block tools.** The app has coach-to-athlete messaging and user-submitted photos, bios, and video links, but no way for a user to report content or block another user. Apple treats this as required for user-generated content and it is a common "Information Needed" follow-up.

## What to build

### 1. Account screen with self-service deletion (5.1.1(v))

New authenticated route `/account`, reachable from the existing avatar account menu:

- Shows signed-in email and role.
- **Delete my account** with a confirmation step that requires typing DELETE.
- Deletion removes the auth user, profile, athlete records, college interests, bookmarks, messages, notifications, and uploaded media from storage — not a soft flag.
- Parent accounts get a clear note that deleting the parent account also removes the child profiles they manage.
- Update the Support, Privacy, and Terms wording from "contact us to delete" to point at the in-app control.

### 2. Report and block for user content (supports 1.2 / Information Needed)

- Report action on public athlete profiles and inside message threads, with a reason picker, writing to a new `content_reports` table.
- Block action in message threads that hides the thread and prevents further messages between the two users.
- New admin queue at `/admin/reports` to review, dismiss, or act on reports.

### 3. Performance items (2.1(a) x2) — needs Apple's text

Two separate 2.1(a) findings were cited. The likely candidates, in order:

- The iPad orientation mismatch from your earlier archive (remove iPad from Supported Destinations, or declare all four iPad orientations).
- A blank or stuck screen on first launch — reviewers hit a cold webview with no session. I'll verify launch and login on the latest iOS in a mobile viewport, and check for errors on the auth route.
- A flow the reviewer couldn't complete with the demo account (e.g. coach directory empty because the review coach account isn't approved, or location permission never prompted).

I'll confirm the review coach account is approved and that both review accounts land on populated screens.

### 4. Accurate Metadata (2.3.8) — needs Apple's text

Usually one of: app name/subtitle differs from what's shown in the app, screenshots show features or data the reviewer couldn't find, or the description promises something not in the build. This is fixed in App Store Connect, not in code — I'll tell you exactly which field to change once I can read the finding.

## Technical notes

- Deletion runs as a `createServerFn` that verifies the caller owns the account, cascades child rows, empties the athlete media storage prefix, then calls `supabaseAdmin.auth.admin.deleteUser` — admin client loaded inside the handler only after the caller is verified.
- `content_reports` and any block table get GRANTs plus RLS: reporters insert and read their own rows, admins read all via `has_role`.
- Both new screens follow the existing mobile-first shell (bottom tabs, 44px targets, safe areas).

## To finish this

Paste Apple's review message text (or send 3-4 cropped screenshots instead of one tall capture) so items 3 and 4 get real fixes rather than best guesses. Items 1 and 2 are confirmed gaps and can start immediately.
