# RecruitHoops Solution Document

## Overview
RecruitHoops is a native iPhone application for youth basketball recruiting that helps athletes and parents create structured player profiles while allowing approved coaches to discover, review, and save talent in a controlled private platform. The recommended technical direction is a SwiftUI iPhone app using MVVM plus Coordinators, backed by Supabase for authentication, relational data, storage, and selected server-side workflows.[cite:388][cite:371][cite:54]

The product should support thousands of users by combining direct mobile access for low-risk, user-owned reads and writes with Edge Functions for sensitive, cross-user, or multi-step actions. This hybrid boundary aligns with Supabase guidance on Row Level Security, least-privilege access, and secure function invocation.[cite:392][cite:453][cite:54]

## Product goals
The MVP should focus on four goals:

- Give athletes and parents a simple way to create and manage polished recruiting profiles.
- Give coaches a fast directory and profile-viewing experience for discovering players.
- Protect trust through approval-based access, strict data boundaries, and role-specific permissions.
- Keep the architecture scalable enough to grow into a high-usage production product without a rewrite.[cite:371][cite:377][cite:392]

## Recommended architecture
The recommended app architecture is SwiftUI with MVVM plus Coordinators and dependency injection. This pattern keeps screen state and business logic in ViewModels, centralizes navigation and flow orchestration inside Coordinators, and supports better testability as the app grows across onboarding, athlete, coach, admin, and notification flows.[cite:388][cite:427]

Because the app needs wider device reach, the deployment target should be iOS 16 and newer. Supporting iOS 16 means favoring `ObservableObject` and `@Published` for app state instead of building around the iOS 17 Observation framework, while still preserving a modern SwiftUI structure.[cite:431][cite:437][cite:445]

### App structure
A feature-first project layout is recommended:

| Layer | Responsibility |
|---|---|
| App / Root | App launch, environment setup, session bootstrap, top-level coordinator |
| Features/Auth | Sign in, sign up, role selection, password reset, session recovery |
| Features/Athlete | Dashboard, profile view, profile edit, media, publishing state |
| Features/Coach | Directory, athlete detail, saved athletes, coach onboarding |
| Features/Admin | Approval queues, moderation actions, analytics views |
| Features/Notifications | Notification feed, settings, push permission state |
| Core | Networking, Supabase client, auth/session, keychain, logging, shared models |
| Design System | Colors, typography, spacing, reusable controls, brand assets |

This structure supports modular growth and makes Claude Code less likely to create a tangled file layout.[cite:433][cite:427]

## Backend and data platform
Supabase is the recommended backend for RecruitHoops because the product is relational, permission-heavy, and workflow-driven. Postgres is a better fit than a document-first store for parent-athlete relationships, coach approvals, saved-athlete joins, admin review queues, and analytics queries.[cite:371][cite:54]

The platform stack should be:

- Supabase Auth for account creation and session management.[cite:371]
- Postgres for core application data.[cite:371]
- Supabase Storage for player profile photos and related media.[cite:377]
- Supabase Edge Functions for sensitive workflows, server-side checks, and push orchestration.[cite:397][cite:424]

### Data access boundary
The recommended security boundary is hybrid, not fully client-direct and not function-only. Every client-exposed table should have RLS enabled, with least-privilege policies that limit access to self-owned or explicitly published records.[cite:54][cite:392][cite:373]

The mobile app can directly access:

- Published athlete profiles intended for coach discovery.[cite:54][cite:373]
- The signed-in user’s own profile and draft profile data.[cite:54]
- User-owned saved-athlete records.[cite:54]
- User-owned notification history and device tokens, if tightly scoped by policy.[cite:392]

Edge Functions should own:

- Coach approval workflows.[cite:424][cite:453]
- Parent-athlete linking and verification logic.[cite:424]
- Deletion requests and account offboarding.[cite:424][cite:392]
- Push notification dispatch.[cite:397]
- Analytics rollups and administrative actions.[cite:424][cite:453]
- Any action that changes another user’s access or touches multiple records atomically.[cite:454][cite:453]

This boundary protects the riskiest actions while keeping routine app operations responsive and relatively simple.[cite:392][cite:452]

## Roles and permissions
RecruitHoops should launch with at least four roles: athlete, parent, coach, and admin. These roles should be reflected in application profile data and enforced through RLS and server-side workflow checks rather than only hidden in the UI.[cite:54][cite:392]

A practical permission model is shown below.

| Role | Core capabilities |
|---|---|
| Athlete | Create and edit own profile, upload profile photo, control publish state within allowed rules |
| Parent | Manage or assist linked athlete profile flows, receive account-related notifications |
| Coach | Apply for access, browse approved published profiles, save athletes, manage saved list |
| Admin | Review approvals, moderate records, manage requests, view analytics, trigger system actions |

## Notifications
The MVP should include push notifications and in-app notifications, but use banners only rather than app icon badge counts. Apple’s notification system supports remote delivery through APNs, and Supabase documents a server-side pattern for sending push notifications from Edge Functions.[cite:396][cite:397]

The recommended MVP scope is transactional notifications only, not promotional messaging. Priority events should include approval decisions, account-linking events, important profile-state changes, and security-relevant account activity so users get high-value alerts without noise.[cite:398][cite:402][cite:405]

### Notification pipeline
A clean notification design should work like this:

1. A trusted event occurs, such as a coach approval or parent-athlete link completion.
2. An Edge Function validates the actor, applies business rules, and writes a notification record.[cite:453][cite:424]
3. The function sends the push message through APNs using server-side credentials.[cite:396][cite:397]
4. The iPhone app opens to the relevant destination and fetches current data after the tap.[cite:396]

This avoids putting secret credentials on-device and keeps notification behavior auditable.[cite:392][cite:453]

## Scalability and performance
RecruitHoops should be built for thousands of users from day one, but that does not require overengineering. It does require disciplined schema design, indexed filters, cautious RLS policies, and keeping sensitive workflows centralized.[cite:377][cite:54]

The highest-value scale decisions are:

- Add indexes for common discovery and filtering fields such as graduation year, state, city, position, publish status, and approval state.[cite:54][cite:378]
- Keep coach discovery queries selective and paginated rather than loading broad datasets.[cite:377]
- Use precomputed or summarized analytics tables for admin reporting instead of expensive live aggregations on every dashboard load.[cite:377][cite:395]
- Keep notification payloads lightweight and fetch current detail data on app open.[cite:396]

## Coach discovery direction
The coach directory should be built as a searchable and filterable athlete discovery experience. Since the final ranking formula is not yet locked, the initial MVP should rely on deterministic filters and stable sort rules before introducing more advanced relevance scoring.[cite:377]

A practical first-version approach is:

- Filter by graduation year, location, position, and publication status.
- Sort by a stable default such as most recently updated published profile or admin-approved ordering.
- Add saved-athlete actions directly from list and detail views.
- Reserve advanced ranking heuristics for a later phase once real usage data exists.

This reduces early complexity while still giving coaches a useful discovery workflow.[cite:377][cite:395]

## Security principles
Security should be implemented as a system property, not just a UI choice. Supabase guidance emphasizes enabling RLS on every exposed table and granting the minimum access required for the app to function.[cite:54][cite:392]

The operating rules should be:

- Enable RLS on every client-exposed table.[cite:54]
- Keep service-role secrets out of the mobile app.[cite:392]
- Use signed-in Edge Function invocation for privileged workflows so JWTs can be validated server-side.[cite:453]
- Prefer ownership-based policies for user-managed records.[cite:451][cite:452]
- Maintain audit-friendly records for approvals, moderation actions, and deletion workflows.[cite:424][cite:392]

## Recommended MVP scope
The MVP should include the following end-to-end capabilities:

- Athlete and parent sign-up and sign-in.
- Coach sign-up with approval requirement.
- Athlete profile creation, editing, and viewing.
- Coach athlete directory and athlete detail screens.
- Save and unsave athlete flow for coaches.
- Admin approval and request handling screens.
- Push and in-app transactional notifications.
- Secure media upload for profile photos.
- Basic admin analytics and operational reporting.[cite:397][cite:377][cite:424]

Features that can wait until a later phase include advanced ranking models, deeper highlight-video processing, richer messaging, promotional notification campaigns, and more sophisticated analytics segmentation.[cite:398][cite:377]

## Implementation guidance for Claude Code
Claude Code should be instructed to build RecruitHoops as a native SwiftUI iPhone app for iOS 16+, using MVVM plus Coordinators, a feature-first folder structure, and Supabase as the backend platform. The generated project should use `ObservableObject`-based state management, strict separation between low-risk direct data access and Edge Function-only privileged workflows, and reusable design tokens based on the RecruitHoops brand direction.[cite:388][cite:431][cite:424]

The implementation should assume:

- Native SwiftUI screens and navigation orchestration through Coordinators.[cite:388]
- Supabase Auth, Postgres, Storage, and Edge Functions.[cite:371][cite:397]
- APNs push banners only, no badge counts in MVP.[cite:396]
- RLS-enabled client tables with least-privilege access.[cite:54][cite:392]
- Edge Function ownership of approvals, linking, notification dispatch, deletion handling, and admin workflows.[cite:453][cite:424]

## Open items
A few decisions remain open and should be finalized either before implementation or during the first technical planning pass:

- The exact coach discovery ranking formula.
- Final athlete profile schema details and required versus optional fields.
- Exact onboarding copy and role-selection flows.
- The full notification event matrix and default preferences by role.
- Detailed analytics KPIs for the admin dashboard.

These are important, but they do not block creation of a build-ready first-pass technical specification based on the architecture defined here.
