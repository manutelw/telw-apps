# TELW IELTS Listening — independent app

A separate Worker for `https://manuvikraman.com/ielts/listening/`, with its own D1 database, private R2 audio bucket, verification cookie and trainer page at `/ielts/listening/admin/`. No Reading files, bindings, routes, database, or settings are changed. The existing site homepage is intentionally unchanged.

## Current scope

The first original 40-question bank is supplied privately to the owner, outside this public repository. It contains four scripts, answer variants and evidence: workshop booking; discovery-centre map and welcome; student research discussion; citizen-science lecture. Academic and General Training use the same Listening format.

This code includes verified access, a sound check, server assignment, autosave, timed playback with recovery checkpoints, server scoring, optional candidate feedback emails and confidential trainer reports. Trainer reports are sent only following a learner's training enquiry and consent. The private admin imports the bank, uploads four recordings, and records an explicit pre-publication review. A draft or incomplete bank cannot start a candidate attempt.

This is original TELW screening content, not an official IELTS test or a calibrated band prediction. Publication review is a trainer attestation; software validation does not replace independent content/audio review.

Only the first set is authored at this stage. Random unseen allocation supports additional immutable versions, but a learner who completes the sole published set must wait for another set to be added, even after the independent 15-day Listening cooldown ends. Opening or reloading a link resumes an unfinished attempt.

## Validate without deploying

Use Node 24 (built-in SQLite; no npm dependencies):

```sh
node --test ielts-listening/tests/*.test.mjs
node ielts-listening/scripts/check-private-bank.mjs /absolute/path/to/listening-set-01.private.json
```

Automated integration tests run the real Worker handlers against in-memory SQLite and fake private storage/email. Their synthetic MP3 bytes are software fixtures, not playable recordings and never learner content. They cover verification, expiry, access control, private/public separation, scoring, concurrent assignment, answer revisions, timing, byte ranges, mail deduplication and the 15-day boundary. Real Cloudflare, browser, mobile and finished-recording tests remain required before release.

## Isolated setup — only after infrastructure approval

Do not edit the root `wrangler.jsonc`, host router, Reading service, or existing Cloudflare project. Do not enable automatic production deployment for this app.

1. Create a **new** D1 database `telw-ielts-listening` and **new private** R2 bucket `telw-ielts-listening-audio`. Keep R2 public access/custom domains disabled. Never use the Reading database.
2. Copy `ielts-listening/wrangler.example.jsonc` to `ielts-listening/wrangler.local.jsonc`; enter only the new Listening database ID. The local file is gitignored. The example is deliberately not a deployment config used by existing pipelines.
3. Add a fresh `LISTENING_AUTH_SECRET` (at least 32 random characters), `RESEND_API_KEY` and the verified sender `TELW_FROM_EMAIL` as secrets on this new Worker. Do not put secrets in git or paste them into chat. Existing approved Resend credentials may be configured directly in Cloudflare; no existing application settings need changing.
4. Apply only this directory's migration to the new database. After explicit deployment approval, deploy the separate Worker using the local config:

```sh
cd ielts-listening
npx wrangler d1 migrations apply LISTENING_DB --remote --config wrangler.local.jsonc
npx wrangler secret put LISTENING_AUTH_SECRET --config wrangler.local.jsonc
npx wrangler secret put RESEND_API_KEY --config wrangler.local.jsonc
npx wrangler secret put TELW_FROM_EMAIL --config wrangler.local.jsonc
npx wrangler deploy --config wrangler.local.jsonc
```

The only route patterns are the exact `/ielts/listening` path and `/ielts/listening/*` on `manuvikraman.com`; do not broaden them. The Worker also rejects every other host and path. If the Cloudflare plan does not permit a more-specific independent Worker route over the existing custom domain, stop and resolve that route separately; do not silently change the Reading host router. The bare path redirects to the trailing-slash page.

## First-set recording and publication

The confidential JSON is imported after verifying `manutelw@gmail.com` on the separate Listening admin page. Never add it, scripts, keys or finished audio to this public repository or the static assets directory.

Produce four fixed MP3 recordings from the private scripts with distinguishable speakers in the two dialogue parts. Measure duration from each final MP3; upload each file and its measured duration (60–1,200 seconds per part, combined maximum 40 minutes, file maximum just under 10 MiB including form overhead). Current scripts are drafts awaiting finished audio and independent review. No paid audio generation is included or automatically invoked by this code.

Check every question against the finished recording, including corrected numbers, accepted spelling, word limits, option distractors and the map. Recordings must match the measured duration within the playback endpoint's two-second tolerance. Complete all four admin review checks only when those reviews actually pass. Published bank/audio versions are immutable; corrections require a new set ID. This release has no delete/unpublish admin feature; emergency withdrawal requires separately reviewed Listening-only database maintenance.

The app gives 30 seconds' question-reading time before each part, then a final two-minute review. The whole-attempt deadline adds nine minutes to the measured recording total for reading/review/recovery. Playback has no normal replay/seek controls and resumes from a server checkpoint. Audio access requires the owner and current active part; like browser-delivered audio generally, this cannot prevent a determined authenticated candidate from recording or downloading it. A brief portion since the last checkpoint may repeat after recovery.

## Release checks

Before opening to candidates, verify real inbox delivery and trainer-only access, all four audio streams and ranges, desktop/mobile sound check and playback, refresh/network recovery, correct and deliberately wrong submissions, cooldown and an unseen second fixture version in a separate test database. Confirm `/ielts/reading/` still routes to the unchanged Reading app and other applications remain unaffected. Keep test learners/fixtures separate from real diagnostics.

No deployment, live resource creation, homepage changes or Reading changes are performed by the test workflow.
