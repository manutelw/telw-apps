# Clarion CAT Simulator

A CAT-style simulator intended for deployment at `cat.clarionprep.com`.

## Included

- VARC, DILR, QA sections
- Sectional timer
- MCQ and TITA handling
- CAT-style question palette and review states
- +3 / -1 MCQ marking, +3 / 0 TITA marking
- Per-attempt paper generation
- Difficulty blueprint to keep attempts comparable
- Server-side AI generation hook
- Fallback question bank

## Cloudflare deployment

From the `cat/` directory:

1. Configure the Worker secrets/variables.
2. Set `AI_API_KEY` as a Worker secret.
3. Set `AI_PROVIDER_URL` and `AI_MODEL` as Worker variables.
4. Deploy with Wrangler.
5. Map custom domain `cat.clarionprep.com` to the Worker.

## Safety of existing apps

This app is isolated under `cat/` and does not alter the protected ASCENT core.

## Positioning

Use `CAT-style`, `CAT-level`, or `CAT-pattern practice`. Do not describe generated content as official CAT questions.
