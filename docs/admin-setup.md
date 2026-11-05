# Kairos /admin setup

The lead workspace is at `/admin` in the existing TanStack Start application. It uses your own Supabase `leads` table and does not connect Lovable Cloud.

## Before publishing in Lovable

Add a server-only secret named `KAIROS_ADMIN_PASSCODE`, with a value of 12–256 characters. Use a randomly generated passphrase of at least 24 characters rather than a short numeric PIN. Do not paste it into the Lovable chat, source code, a `VITE_*` variable, a URL, or Git. Use Lovable's protected secrets input. Stephen and Rose share this passcode; share it privately using your password manager.

The existing `KAIROS_SUPABASE_URL` and `KAIROS_SUPABASE_SERVICE_KEY` secrets must remain configured on the server. No new public Supabase key is needed. The dashboard reads the existing fields `id`, `created_at`, `first_name`, `phone`, `email`, `zip`, `call_consent`, `property_type`, `exterior_doors`, `security_type`, and `attribution`.

In Supabase, keep the `leads` table private: enable row-level security and do not grant anonymous or general authenticated users permission to read or update leads. This application writes the public form and accesses the CRM through its server-only service key, so the public browser does not need database access. Database policies were not modified in this task.

Publish the updated version, then open `/admin` on the published domain and enter the passcode. The page is intentionally locked if the passcode is missing or shorter than 12 characters. If the Supabase project or any required field is unavailable, the dashboard reports the connection problem instead of displaying invented leads. The connected Supabase organization available in this task did not list the previously supplied Kairos project, so production lead reads were not verified during development.

## Using the lead workspace

Leads appear newest first in pages of 25. Search by name, email, phone, or ZIP. Filter by status, assigned person, or due follow-ups. Select a lead to see their submitted answers and contact consent, update the status, assign Stephen or Rose, write notes, and schedule a follow-up. Follow-up inputs use your device's local time and are stored as UTC.

CRM fields are saved inside `attribution.kairos_admin`, preserving existing advertising attribution. This reuses the current database without migrations or a new table. Legacy leads default to New and Unassigned. An edit is rejected if another admin saved the same lead after you opened it; copy unsaved notes, refresh the lead, and apply the change again.

CSV export includes matching leads, not just the visible page, and rejects more than 10,000 results. Narrow the filters for larger collections. Spreadsheet formula prefixes are escaped. Exported customer data is private; store and share it appropriately.

## Security and limitations

The server independently verifies a signed HttpOnly session before every read, update, or export. Sessions expire after eight hours and are bound to the site origin. On HTTPS they use Secure and SameSite=None cookies for compatibility with Lovable's embedded preview; mutations additionally require an exact same-origin header. Browser restrictions on third-party cookies may require opening the preview in a standalone tab. There is no development login bypass. Admin pages and explicit admin interactions are excluded from Meta analytics; admin metadata is excluded from public form submissions.

Changing `KAIROS_ADMIN_PASSCODE` invalidates existing session signatures. Signing out clears this browser's session cookie. A shared passcode does not identify which person made an edit and does not provide individual user roles; assignment fields identify the follow-up owner, not the person saving the edit.

The application throttles sign-in attempts per IP to eight per 15 minutes within each running server instance and also applies a bounded per-instance global limit. On distributed or serverless hosts, this is not a global durable rate limiter. Use a strong random passcode and add a host/Cloudflare WAF rate-limit rule for the admin login server function before inviting broader staff access. Do not treat a four- or six-digit PIN as adequate protection for customer information.

Technical references: [TanStack authentication primitives](https://tanstack.com/start/latest/docs/framework/react/guide/authentication-server-primitives) and [PostgREST queries and updates](https://docs.postgrest.org/en/stable/references/api/tables_views.html).
