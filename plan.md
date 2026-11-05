# Kairos /admin lead dashboard

Build the CRM inside the existing Lovable-connected TanStack Start application. Preserve the public funnel, user-owned Supabase, signup emails, and existing deployment. Do not connect Lovable Cloud or publish on the user's behalf.

## Implementation

- `/admin`: a passcode gate followed by a responsive private lead workspace. Brand: Kairos Security Total Home Protection Plan. Use existing burgundy, ivory, gold, Plus Jakarta Sans, and Inter in a restrained operations-dashboard design.
- Server-only `KAIROS_ADMIN_PASSCODE`: minimum 12 characters, no default or hardcoded credential. Signed expiring HttpOnly cookies, rotation-sensitive signatures, same-origin mutation checks, and login throttling. All private server functions independently verify the session. No PII in analytics or indexable admin HTML.
- Existing server-only Supabase configuration reads `leads` with explicit selected columns and bounded pagination. Store CRM fields under the existing `attribution.kairos_admin` JSON object, preserving original attribution. No destructive schema changes or new database requirement. Reject concurrent conflicting edits using a revision condition.
- Search, status and assignment filters, due follow-ups, lead details, status changes, assignments to Stephen/Rose, follow-up scheduling, persistent notes, and CSV export of matching leads. No deletes or bulk writes.
- Generate no fictitious leads and perform no production test writes. Missing passcode or database configuration must fail closed with actionable setup messages.

## Project structure

`src/lib/admin.ts` holds shared types; `admin-auth.ts` owns server passcode/session logic; `admin-data.ts` owns authenticated data helpers; `admin.functions.ts` exposes server functions. `src/components/admin` and `src/routes/admin.tsx` implement the UI. Tests cover authentication, database query bounds, concurrent-update handling, CSV safety, and UI behavior. `docs/admin-setup.md` explains the one-time Lovable secret setup and operational security.
