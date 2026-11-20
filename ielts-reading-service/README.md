# IELTS Reading service (telw-ielts-preview-worker)

This folder is the saved source of the live IELTS Reading service. The public Reading page at
`manuvikraman.com/ielts/reading/` is served by the main site (`workers/ielts/learner-portal.mjs`), which
passes every Reading request to this separate Cloudflare Worker.

Recovered on 20 Nov 2026 from branch `feat/ielts-complete-preview-reading-bank` (commit a8110b1). The live
Worker had one later change that was never committed: the WhatsApp number returned after an email is
`9717116831`. With that change applied, an esbuild `--keep-names` build of this folder is identical to the
code that was live on 20 Nov 2026.

## What it does

- Email verification codes and learner sessions (`workers/ielts/auth.mjs`)
- Reading tests: random unseen set, 60-minute timer, saving, scoring, feedback email (`workers/ielts/reading.mjs`)
- Trainer admin page and question-bank upload (`workers/ielts/admin.mjs`, `workers/ielts/admin-bank-import.mjs`)
- The 15-day limit between Reading tests is enforced twice: in `start()` in `reading.mjs`, and by the
  database trigger `ielts_reading_cooldown` in the `telw-ielts-preview` D1 database.

The page HTML in `ielts-preview-assets/index.html` still contains the old phone number. The main site
replaces it with the WhatsApp number before learners see it (`workers/ielts/reading-feedback.mjs`).

## Deploying a change

Run from this folder, signed in to the TELW Cloudflare account:

```
npx wrangler deploy
```

Secrets already stored on the Worker (`IELTS_AUTH_SECRET`, `RESEND_API_KEY`) are kept by a deploy.
Deploying replaces the live Reading service, so check a full Reading test afterwards.
