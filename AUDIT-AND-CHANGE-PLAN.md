# ASCENT Dialogue Module — Audit and Exact Change Plan


## Source-snapshot limitation

The audit used the latest complete repository archive available in the connected file library (`telw-apps-main(8).zip`, created 2 August 2026) plus the later trainer-page patch (`ASCENT_JD_Briefing_Link_Restore.zip`, created 6 August 2026). This is enough to design a safe isolated staging package, but it is not a direct read of the GitHub `main` branch on 7 August 2026. Before eventual production integration, the current GitHub files must be downloaded again and diffed against this plan.

## 1. Current ASCENT structure inspected

The inspected source snapshot is a static multi-page web application hosted from the `manutewl/telw-apps` repository. The relevant live pages are:

- `ascent/index.html`
- `ascent/practice.html`
- `ascent/dashboard.html`
- `ascent/trainer.html`

The browser stores a custom ASCENT session token and calls Supabase RPCs and the `ascent-submit-response` Edge Function. The existing practice page already records learner audio, submits it for transcription/evaluation, displays pressure follow-ups and saves submission results.

The inspected `ascent-submit-response` snapshot:

- accepts common browser audio formats;
- limits audio size;
- uses Gemini to transcribe and evaluate in one pass;
- stores results in the existing `ascent_submissions` system;
- uses a fixed single-answer rubric.

The existing SQL snapshot contains the current ASCENT student, session, task, assignment, question-bank, follow-up and submission structures. These should remain untouched during staging.

## 2. Files changed now

**No current live ASCENT file is changed in Stage 1.**

This package creates a separate project with only new files:

- `public/index.html`
- `public/styles.css`
- `public/app.js`
- `public/trainer.html`
- `public/trainer.js`
- `public/robots.txt`
- `public/_headers`
- `functions/api/health.js`
- `functions/api/session/start.js`
- `functions/api/session/turn.js`
- `functions/api/session/evaluate.js`
- `functions/api/session/history.js`
- `functions/api/admin/results.js`
- `functions/_lib/access.js`
- `functions/_lib/gemini.js`
- `functions/_lib/http.js`
- `functions/_lib/scenarios.js`
- `functions/_lib/supabase.js`
- `functions/_lib/tts.js`
- `functions/_lib/types.js`
- `supabase/migrations/20260807_ascent_dialogue_lab.sql`

## 3. New staging database objects

Created only in the staging Supabase environment:

- `ascent_lab_scenario_templates`
- `ascent_lab_sessions`
- `ascent_lab_turns`
- `ascent_lab_results`
- `ascent_lab_feature_flags`

No foreign keys point to live ASCENT student, assignment, submission, score or leaderboard tables.

## 4. External services

- **Cloudflare Access** — staging authentication and approved-user restriction.
- **Cloudflare Pages Functions** — same-origin protected backend and secret storage.
- **Separate Supabase staging project or branch** — scenario templates, session state, transcript and lab results.
- **Gemini API** — controlled opening generation, audio transcription, adaptive follow-up and complete-dialogue evaluation.
- **OpenAI TTS-1** — professional spoken AI prompts.

The model names are environment variables. They are not embedded in the browser.

## 5. Running-cost estimate

Budget provision for a normal two- or three-answer conversation should initially be **US$0.03–US$0.08 per completed conversation**. This is a planning range, not a guaranteed tariff. It assumes short prompts, roughly two to three minutes of learner audio, concise spoken AI prompts, and one final evaluation. The first 25 controlled test conversations must be measured in the provider usage dashboards before setting learner pricing or volume limits.

The package includes no recurring email, storage or notification cost. Cloudflare and Supabase plan costs depend on the accounts and staging option selected.

## 6. How the staging site remains hidden

- Separate hostname: `lab.manuvikraman.com`
- Separate Cloudflare Pages project and branch
- Cloudflare Access policy requiring an approved email
- Cryptographic Cloudflare Access JWT and audience verification
- Backend `LAB_ALLOWED_EMAILS` check
- No link from the public ASCENT menus
- `robots.txt` disallows all crawling
- `X-Robots-Tag: noindex, nofollow, noarchive`
- Visible `TEST VERSION` label
- Master switch `LAB_FEATURE_ENABLED`

A secret URL is not used as the security control.

## 7. How live student data remains protected

- Separate staging database/branch and credentials
- Lab-specific table prefix
- Service-role access only from the backend
- No browser service key
- No writes to `ascent_submissions`, assignments, tasks, scores or leaderboard data
- No email or notification code
- Test-user email binding on every session
- Daily per-tester session limit
- No persistent audio storage in Stage 1
- Explicit feature switch and API limits

## 8. Files that would change only at final public release

After all three practice modes pass end-to-end testing, production integration will require a separately reviewed release package. The likely touched files are:

- `ascent/practice.html` — add the new practice selector and launch route
- `ascent/dashboard.html` — dialogue result history
- `ascent/trainer.html` — trainer visibility and filters
- production backend functions and a production SQL migration

These files must not be changed until the staging journey passes the full release checklist.
