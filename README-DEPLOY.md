# ASCENT Dialogue Lab — Stage 1

This package is a **private staging application** for the new ASCENT spoken-dialogue module. It does not modify or depend on the live student menu.

## What this package includes

- Three practice modes:
  - Student Q&A
  - Student Interview Dialogue
  - Workplace & Leadership Dialogue
- Profile, level, difficulty and topic selection
- Spoken AI opening using OpenAI `tts-1`
- Learner audio recording in the browser
- Audio transcription and adaptive follow-up using Gemini
- Two- or three-turn dialogue state
- Complete-conversation evaluation
- Transcript, criterion scores, strengths, gaps, improved response and one practice instruction
- Retry Same Scenario and Try a New Version
- Lab-only result history
- A master feature switch
- Separate lab-only database tables
- No student emails, notifications, live scores or leaderboard writes

## Architecture

```text
Cloudflare Access
        ↓
Private Cloudflare Pages project: lab.manuvikraman.com
        ↓
Same-origin Cloudflare Pages Functions
        ├── Gemini API: transcription, follow-up, final evaluation
        ├── OpenAI TTS-1: spoken AI voice
        └── Separate Supabase staging project/branch: lab records only
```

The Cloudflare Function cryptographically verifies the Cloudflare Access JWT, checks its application audience and reads the authenticated email claim. It then checks `LAB_ALLOWED_EMAILS`, providing a second allow-list.

## Required environment variables

Set these as encrypted Pages project variables or secrets:

- `LAB_FEATURE_ENABLED=true`
- `LAB_ALLOWED_EMAILS=manutelw@gmail.com`
- `LAB_ADMIN_EMAILS=manutelw@gmail.com`
- `CLOUDFLARE_ACCESS_TEAM_DOMAIN=YOUR-TEAM.cloudflareaccess.com`
- `CLOUDFLARE_ACCESS_AUD=YOUR_ACCESS_APPLICATION_AUD`
- `SUPABASE_LAB_URL=https://YOUR-LAB-PROJECT.supabase.co`
- `SUPABASE_LAB_SERVICE_ROLE_KEY=...`
- `GEMINI_API_KEY=...`
- `GEMINI_TURN_MODEL=gemini-3.5-flash-lite`
- `GEMINI_EVALUATION_MODEL=gemini-3.6-flash`
- `OPENAI_API_KEY=...`
- `OPENAI_TTS_MODEL=tts-1`
- `OPENAI_TTS_VOICE=alloy`
- `LAB_DAILY_SESSION_LIMIT=25`

Never put service-role or AI API keys in `public/`, GitHub-visible browser code, or SQL tables.

## Deployment order

1. Create a **separate Supabase staging project or persistent branch**. Run `supabase/migrations/20260807_ascent_dialogue_lab.sql` there only.
2. Create a separate Cloudflare Pages project with this folder as its project root. Deploy it to `lab.manuvikraman.com` and add the variables above.
3. Put Cloudflare Access in front of the entire custom hostname and every Pages preview/production URL that can reach the Functions. Restrict access to approved email addresses, copy the Access application AUD into the secret above, disable indexing, and confirm that an unauthorised browser cannot load the site or call `/api/health`.

## Cloudflare Pages settings

- Framework preset: None
- Build command: leave blank
- Build output directory: `public`
- Functions directory: `functions` (detected automatically)
- Production branch: use a dedicated branch such as `ascent-dialogue-lab`, not `main`

## Safety characteristics

- Audio is sent to the backend for the current turn and is not written to Supabase Storage by this package.
- Only transcript, structured dialogue state and evaluation results are saved.
- Every session is bound to the authenticated Cloudflare Access email.
- All database writes go to tables prefixed `ascent_lab_` in the staging database.
- RLS is enabled and no browser-access policies are created. Only the backend service role can access the lab tables.
- The `LAB_FEATURE_ENABLED` switch disables all lab endpoints without deleting code.

## Validation

Before any public release, complete every item in `DEPLOY-CHECKLIST.md`. This Stage 1 package is a deployable staging foundation, not a claim that the final module has passed end-to-end testing.

## Trainer lab visibility

Approved addresses in `LAB_ADMIN_EMAILS` can open `/trainer.html`. Its backend endpoint is separately admin-gated and reads only `ascent_lab_` staging results.
