# Kairos /admin setup

The lead workspace is at `/admin` in the existing TanStack Start application. It uses your own Supabase `leads` table and does not connect Lovable Cloud.

## Publishing in Lovable

The team-selected shared passcode is already configured as a salted PBKDF2-SHA-256 verifier on the server. The plaintext passcode is not stored in Git, the browser bundle, or this guide. No new passcode secret is required for the selected code. Stephen and Rose should share it privately using a password manager.

Keep the existing `KAIROS_SUPABASE_URL` and `KAIROS_SUPABASE_SERVICE_KEY` secrets configured on the server. The dashboard uses the server-only service key to derive domain-separated session-signing material; the public verifier alone cannot mint sessions. No new public Supabase key is needed. It reads `id`, `created_at`, `first_name`, `phone`, `email`, `zip`, `call_consent`, `property_type`, `exterior_doors`, `security_type`, and `attribution`.

Publish the latest version, then open `/admin` on the published domain and enter the selected passcode. Missing server signing material or an invalid passcode override keeps the page locked. If the Supabase project or required fields are unavailable, the dashboard reports the problem rather than showing invented leads. The connected Supabase organization in this task did not list the supplied Kairos project, so live lead reads remain unverified.

Keep the Supabase `leads` table private through row-level security; do not grant anonymous or general authenticated users permission to read or update leads. Both the public form and CRM use the server-only service key, not browser database access. Database policies were not modified in this task.

## Using the workspace

Leads appear newest first in pages of 25. Search by name, email, phone, or ZIP and filter by status, assigned person, or due follow-ups. Select a lead to view their answers and contact consent, update their status, assign Stephen or Rose, add notes, or schedule a follow-up. Follow-up inputs use your device's local time and are stored as UTC.

CRM fields live in `attribution.kairos_admin`, preserving existing advertising attribution without a migration. Legacy leads default to New and Unassigned. A save is rejected if another admin edited the lead after you opened it; copy unsaved notes, refresh the lead, and apply your edit again.

CSV export includes all matching leads, not only the visible page, and rejects more than 10,000 results. Narrow the filters for larger collections. Spreadsheet formula prefixes are escaped. Exported customer data must be handled privately.

## Passcode rotation and security

To change the shared passcode later without changing code, set a server-only `KAIROS_ADMIN_PASSCODE` override in Lovable's protected secrets input. It must be 12–256 characters; a random passphrase of at least 24 characters is recommended. Do not place it in a `VITE_*` variable, source file, public URL, or Git. Changing the override, default verifier, or server signing key invalidates existing sessions. Removing an override re-enables the configured team-selected code, so retain an override when retiring the original code.

Sessions are signed HttpOnly cookies, expire after eight hours, and are origin-bound. HTTPS cookies use Secure and SameSite=None for embedded-preview compatibility; mutations additionally require an exact same-origin header. Third-party-cookie restrictions may require opening Preview in a standalone tab. There is no development bypass. Logout clears this browser's cookie and signals other open admin tabs to clear private state. Shared-passcode access does not identify which staff member made an edit; assignments indicate the follow-up owner, not the editor.

Admin pages and interactions are excluded from Meta analytics, and public form submissions cannot supply CRM metadata. Login attempts are limited per IP to eight per 15 minutes and bounded globally within each server instance. On serverless hosts, this is not a durable distributed rate limiter. Add a host/Cloudflare WAF rate-limit rule for the login endpoint before broader staff use; short numeric PINs are not adequate protection.

Technical references: [TanStack authentication primitives](https://tanstack.com/start/latest/docs/framework/react/guide/authentication-server-primitives) and [PostgREST queries and updates](https://docs.postgrest.org/en/stable/references/api/tables_views.html).
