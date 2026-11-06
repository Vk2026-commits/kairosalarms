# Kairos admin CRM

- [x] Add `/admin` to the existing Lovable-connected application, using Kairos Security Total Home Protection Plan branding and the current visual style. Leave publishing to the user and preserve the public quote funnel and signup email routing.
- [x] Protect the page and every lead read, write, and export with a server-only shared passcode, secure expiring sessions, same-origin mutation checks, and throttled login. Missing configuration must fail closed. Exclude admin URLs and customer data from Meta tracking and indexing.
- [x] Implement real lead reads from the existing user-owned Supabase `leads` table with bounded pagination, search, status/assignee filters, due follow-ups, and contact/property details. Do not use demo data or connect Lovable Cloud. Live database access remains unverified because the connected organization did not list the previously supplied Kairos project.
- [x] Implement persistent New, Contacted, Follow-up, Won, and Lost statuses; Stephen/Rose assignments; notes; and scheduled follow-ups without altering original attribution or silently overwriting another admin's edits. Bounded PATCH requests include unique ordering and an optimistic revision predicate.
- [x] Export matching leads as spreadsheet-safe CSV with a clear bounded limit and provide documented secure passcode setup for Lovable. All 55 tests, TypeScript, changed-file lint, and the production build passed. The delivery is prepared for GitHub/Lovable sync; no live publication is claimed.
- [x] Configure the user-selected passcode as a salted server-only verifier without putting plaintext in Git or browser code. Hidden-input verification passed. Reuse existing server-only signing material, with an optional secret override for later rotation; no additional passcode-secret entry is required.
- [ ] Publish the updated version in Lovable and verify live database access. Publishing remains a user action.

The prior email update was committed as `d217b63`: internal alerts go to Stephen and Rose, and customer confirmations remain separate.

## Privacy disclosure update

- [x] Add an accessible, visible Privacy Policy link to the landing-page footer and next to lead-form contact disclosures, with a real `/privacy` page covering the implemented collection, lead handling, providers, contact consent, browser storage, and Meta tracking. Do not invent business retention promises or claim legal compliance.
- [x] Provide a working browser-local Meta ad-tracking opt-out and disclose its scope, Global Privacy Control handling, and contact choices. Preserve lead submissions, signup emails, the landing-page offer, and the private CRM. All 65 tests, TypeScript, new privacy-file lint, and the production build passed.
- [x] Prepare the validated privacy update for the existing Lovable-connected GitHub branch without republishing or creating ongoing monitoring or reporting. Publication remains a separate user action after sync; business-specific legal and retention details require owner review.
