# Kairos Security Protection Plan  Landing

please do not connect lovable cloud. I will connect my own supabase to this

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://kairosalarms.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/f59eae9f-adfe-4b5c-8e1c-f11d13279f7e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Lead email notifications

Every completed quote request is first saved to the configured Supabase `leads` table, then sends two branded **Kairos Security Protection Plan** emails:

1. A callback alert to both `staylor@kairossecurity.com` and `rrose@vektiss.com`, including the prospect's contact details, property answers, recorded contact consent, and one-click call/email actions. Its `Reply-To` is set to the prospect's email address.
2. A customer confirmation addressed only to the prospect, thanking them, confirming the request was received, and explaining that a Kairos Security specialist will call soon. Its `Reply-To` is `staylor@kairossecurity.com`.

Set these **server-only** environment variables in the deployment that runs the TanStack Start server function; never expose them as `VITE_*` variables or commit them to Git:

| Variable | Purpose |
| --- | --- |
| `KAIROS_SUPABASE_URL` | Supabase project URL used to save leads. |
| `KAIROS_SUPABASE_SERVICE_KEY` | Supabase service-role key used only on the server. |
| `KAIROS_RESEND_API_KEY` | Resend API key used only on the server. |
| `KAIROS_RESEND_FROM` | Branded sender, for example `Kairos Security Protection Plan <leads@your-verified-domain.com>`. |

Before enabling live traffic, add and verify the sender domain in Resend. Resend requires a verified domain for production sending. The server uses separate `Idempotency-Key` values for each internal alert and customer confirmation, so a retry within 24 hours does not send duplicate emails.

## Private lead dashboard — `/admin`

The **Kairos Security Total Home Protection Plan** dashboard lets the team view and search saved leads, track New/Contacted/Follow-up/Won/Lost statuses, assign Stephen or Rose, save notes, schedule follow-ups, and export matching leads as CSV. It uses the existing Supabase `leads` table; CRM metadata is stored under `attribution.kairos_admin` without changing original attribution or requiring a migration.

The selected shared passcode is already configured as a salted server-side verifier; no new passcode secret is required. The plaintext value is never stored in Git or the browser bundle. Existing server-side Supabase secrets are reused, including domain-separated session signing; sessions expire after eight hours. To change the code later, set a server-only `KAIROS_ADMIN_PASSCODE` override (12–256 characters) through Lovable's protected secret input.

See [admin setup and security notes](docs/admin-setup.md) for the required existing table fields, concurrency behavior, CSV limits, host-level rate-limit recommendation, and publishing steps. Publishing remains a user action in Lovable.
