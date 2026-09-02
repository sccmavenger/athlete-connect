# Fix the four App Store rejections

Apple reviewed on an iPad Air (iPadOS 26.6.1) and flagged four items. Here is what each one means and how we clear it.

## 1. Placeholder app icon (Guideline 2.3.8)

The web/PWA icons already use the Summit Hoops logo, but the iOS app icon inside the Xcode project is still the default Capacitor placeholder — that is the icon the reviewer saw on the iPad home screen. The web manifest also still says "Recruiting Hub", which adds to the naming/branding mismatch.

- Produce a finalized 1024x1024 App Store icon (opaque, no transparency, no rounded corners) from the Summit Hoops logo, plus the full iOS icon size set, delivered as downloadable files.
- Fix the manifest name/short_name/description to Summit Hoops so web, PWA, and iOS icons and names all match.
- You then replace `AppIcon` in Xcode (Assets.xcassets) with the delivered set and rebuild.

## 2. Crash when uploading a profile picture (Guideline 2.1(a))

This is not a code exception — it is the iPad web view being killed for memory. The uploader currently accepts files up to 40 MB and fully decodes the original photo at full resolution before downscaling. A 12–48 MP iPad photo becomes a very large in-memory bitmap and WebKit terminates the process, which reads as an app crash.

Fixes:
- Decode at a reduced size instead of full resolution (request the downscale during decode, not after), and read image dimensions before allocating any canvas.
- Lower the accepted source size and reject oversized files with a clear message rather than attempting to decode them.
- Chunk-free, single-pass encode to JPEG with a hard pixel cap; if decoding fails or the environment cannot decode (older HEIC paths), fall back to uploading the original with a friendly error instead of crashing.
- Wrap the whole pick-and-upload handler so any failure surfaces as a toast, never an unhandled rejection.
- Verify with automated runs against large synthetic photos (very high megapixel JPEG and a HEIC) plus a memory-constrained web view profile.

## 3. No in-app account deletion (Guideline 5.1.1(v))

Required, and currently missing (support/privacy pages only tell users to email).

- New `Account` screen reachable from the header account menu: shows email, role, and a destructive "Delete my account" action.
- Confirmation step: user types DELETE to confirm, sees exactly what gets removed (profile, measurements, media, messages, bookmarks, college list, notifications).
- Server-side deletion that removes the user's rows and the auth user itself, deletes their storage objects, signs them out, and returns them to the landing page. For a parent account, the flow also states that linked child profiles are deleted.
- Deletion is permanent — no "deactivate only" option, no email/phone step.

## 4. Demo account with pre-populated content (Guideline 2.1(a) Information Needed)

The reviewer could not exercise all features because the review accounts are empty and the coach account was never used.

- Seed the two Apple review accounts with realistic fictional content: a complete published athlete profile (measurements, academics, highlight links, schedule, target schools), an approved coach account with a pipeline and bookmarks, and a two-way message thread with several messages on both sides plus notifications.
- Confirm the coach review account is approved so coach search, bookmarking, and messaging all work on first sign-in.
- Provide updated App Review Information text: both accounts, what each can do, and a note that the account deletion flow lives under the avatar menu > Account. You will also need to attach a screen recording of the deletion flow, which Apple explicitly requested.

## Also worth deciding

Apple reviews on iPad because the build declares iPad support. Simplest path to a clean review is to set the target to iPhone only in Xcode (the layout is designed mobile-first anyway); otherwise we keep iPad support and must be sure every screen and the upload flow behaves there.

## Technical notes

- Upload path: `src/lib/image-upload.ts` (decode/downscale) and its call site in `src/routes/_authenticated/profile.edit.tsx`.
- Deletion: new `src/lib/account.functions.ts` server functions (authenticated; admin client used only after verifying the caller deletes themselves), new route `src/routes/_authenticated/account.tsx`, link added in `src/components/SiteHeader.tsx`.
- Seed content applied as data for the two review accounts only; no real athlete data is used anywhere.
- Icons delivered under `/mnt/documents/` for the Xcode drop-in; `public/manifest.webmanifest` and web icons updated in-repo.
