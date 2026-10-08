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

## Lead callback email notifications

Every completed quote request is first saved to the configured Supabase `leads` table, then sent as a branded **Kairos Security Protection Plan** callback alert to `staylor@kariossecurity.com`. The alert includes the prospect's contact details, property answers, recorded contact consent, and one-click call/email actions. Its `Reply-To` is set to the prospect's email address.

Set these **server-only** environment variables in the deployment that runs the TanStack Start server function; never expose them as `VITE_*` variables or commit them to Git:

| Variable | Purpose |
| --- | --- |
| `KAIROS_SUPABASE_URL` | Supabase project URL used to save leads. |
| `KAIROS_SUPABASE_SERVICE_KEY` | Supabase service-role key used only on the server. |
| `KAIROS_RESEND_API_KEY` | Resend API key used only on the server. |
| `KAIROS_RESEND_FROM` | Branded sender, for example `Kairos Security Protection Plan <leads@your-verified-domain.com>`. |

Before enabling live traffic, add and verify the sender domain in Resend. Resend requires a verified domain for production sending. The server uses a unique `Idempotency-Key` for each browser submission, so a retry within 24 hours does not send a duplicate callback email.
