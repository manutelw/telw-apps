# IELTS verified identity — first controlled change

## Implemented
- Mandatory verified email before the existing Reading start button, with server-side enforcement on scoring, candidate feedback and trainer enquiries.
- Short-lived eight-digit codes; keyed hashes in D1, maximum five guesses, atomic single use, per-email rolling resend interval and hourly IP/email limits.
- Random 256-bit sessions, hashed storage, 12-hour absolute expiry, revocation on sign-out. HttpOnly/Secure/SameSite=Strict cookie scoped to /api; never browser storage.
- Candidate email and enquiry reply address come from verified identity. JSON request-size limits, same-origin POST checks, no-store responses and confidential errors.
- Additive migration 0002 and new server-only assets exclusions. No existing application tables or internal settings changed.

## Not claimed by this change
The old Reading attempt and reports are not yet bound to server-owned immutable attempt IDs. This change does not implement rotation, 15-day eligibility, trusted completion, or persistent feedback delivery. Those require the next Reading PR. The old scoring endpoint remains a score oracle for a verified learner until replaced in that PR; do not release the identity change alone as the finished diagnostic.

## Infrastructure required before release (not executed)
1. Create a dedicated Cloudflare D1 database for IELTS and bind it to this Worker's environment as IELTS_DB. Obtain the real database UUID; never insert a placeholder into production wrangler.jsonc.
2. Apply migrations/ielts/0001_diagnostic_state.sql then 0002_verified_identity.sql to that database. Use a separate database for preview/testing. Confirm backup and retention policy.
3. Store a new random secret (at least 32 characters) as IELTS_AUTH_SECRET through Cloudflare secret management. Do not paste it into chat or commit it. Keep it stable: changing it requires a deliberate learner-identity migration because keyed email hashes depend on it.
4. Confirm RESEND_API_KEY and the existing TELW_FROM_EMAIL can deliver from the configured domain. No new credentials are embedded in the repository. Verification email failures fail closed.
5. Confirm Cloudflare exposes CF-Connecting-IP to this Worker. Add edge abuse limits before production. Application rate limits already run in D1, independent of browser state.
6. Manu approved automatic preview deployments for the two draft PR branches on 27 October. That does not authorize merging or production deployment. No unrelated hosting settings should be changed.
7. Production smoke tests need approval for deployment and actual verification emails. Local test email is simulated; no email was sent during automated tests.

## Validation
Run `node --test tests/ielts/*.test.mjs` on Node 24. Uses SQLite with the actual migrations and a D1-compatible adapter, not a SQL string mock. It does not replace a Cloudflare runtime test.

## Operational privacy
Verification challenge rows contain email addresses for delivery. Production requires an agreed retention interval and an approved cleanup schedule for expired challenges, limits and sessions. Do not describe automated deletion as implemented. For individual data access/deletion requests, verify the requester through TELW before an authorized operator processes the related IELTS records. No marketing consent is inferred.
