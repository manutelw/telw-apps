# TELW IELTS Diagnostic Programme — development status

2026-10-27. Production is unchanged. Manu approved automatic preview deployments for the two draft PR branches. Neither PR is approved for merge or production deployment.

## Two controlled changes prepared locally

1. feat/ielts-verified-identity: email verification, D1 sessions, compulsory Reading gate, secure recipient binding, additive migration and tests.
2. feat/ielts-reading-persistent-attempts (stacked on 1): stored Reading attempts, drafts/resume, immutable versions, 15-day completion interval, approved unseen-version selection, secure scoring, separate persisted report delivery and independent-review import gate.

The first change is draft PR #486. The second change is a dependent draft PR against its branch. No hosting or internal settings have been changed.

## Validation

- 31 local automated tests: actual SQL migrations exercised in in-memory SQLite through a D1-shaped adapter; auth, concurrency, expiry, throttling, replay, session revocation, route isolation, bank validation/import, attempt ownership, resume, deadlines, cooldown boundary, immutable results, fresh assignment, report privacy, duplicate-send leases and stable retries.
- Both existing ASCENT core/trainer integrity scripts pass.
- Worker modules and all inline learner scripts pass syntax checks; both Reading HTML aliases match; diff whitespace checks pass.
- These are NOT Cloudflare/D1 runtime tests. Email was mocked; no live verification/report email was sent. Browser execution/visual QA did not run: Chromium was unavailable and its download failed.

## Not completed

- Dedicated live D1 provisioning/binding, secrets, migration application, privacy retention operations and edge limits.
- Pre-generated, independently reviewed approved Reading banks; no synthetic fixtures were passed off as learner tests.
- Listening diagnostic and reviewed audio assets.
- Writing diagnostic and expert-sample calibration.
- Speaking diagnostic, private audio storage and audio-based assessment/calibration.
- Full four-skill end-to-end, mobile and production regression tests.

## Access and decisions needed

- Production deployment and merge approval remain separate from preview approval.
- Authenticated Cloudflare access to provision the dedicated IELTS D1 database, bind IELTS_DB, and configure IELTS_AUTH_SECRET; verify existing RESEND_API_KEY and TELW_FROM_EMAIL. No Cloudflare credentials are available in this workspace. Never paste secrets in chat.
- Secure access to the existing OpenAI key for offline bank authoring. No OpenAI key is available in this workspace. Obtain independent editorial approval of generated content before import.

Listening, Writing and Speaking are still pending; the complete programme must not be described as finished or ready for learners.
