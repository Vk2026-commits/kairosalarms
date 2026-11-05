# Signup notification update

- [x] Send each internal signup callback alert to both `staylor@kairossecurity.com` and `rrose@vektiss.com`, correcting the previous misspelled Stephen address. Preserve the prospect's contact details and selected security options in the alert, keep internal replies directed to the prospect, and keep the separate customer confirmation addressed only to the prospect with replies directed to `staylor@kairossecurity.com`.

Validated with mocked delivery assertions for both exact internal recipients and customer-only confirmation routing. All 17 tests, TypeScript checks, changed-file lint, and the production build passed. Live inbox delivery has not been verified.
