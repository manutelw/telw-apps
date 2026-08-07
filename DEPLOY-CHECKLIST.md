# Private Staging and Test Checklist

## Access and isolation

- [ ] `lab.manuvikraman.com` is a separate Cloudflare Pages project.
- [ ] Cloudflare Access blocks an incognito browser before the page loads.
- [ ] Only approved test emails can pass Access.
- [ ] `/api/health` also rejects an unapproved email or invalid Access JWT.
- [ ] The Pages preview/production URL cannot bypass Access.
- [ ] The lab uses a separate Supabase project or persistent branch.
- [ ] The staging service-role key is not the production service-role key.
- [ ] No link to the lab exists in live ASCENT.
- [ ] Page source contains no API key or service-role key.
- [ ] “TEST VERSION” is visible on every screen.

## Feature flow

- [ ] Student Q&A completes after one learner answer.
- [ ] Student Interview Dialogue asks a relevant follow-up.
- [ ] Pressure mode can ask one final challenge.
- [ ] Workplace scenarios change by Professional, Manager, Senior Leader and CXO level.
- [ ] The AI opening is audible and has a replay control.
- [ ] Chrome, Edge and Safari can record and submit audio.
- [ ] The transcript matches the recording closely.
- [ ] The follow-up responds to the learner's actual answer.
- [ ] The AI does not become abusive, theatrical or insulting.
- [ ] Final evaluation scores the full exchange rather than one answer.
- [ ] Scores do not reward facts that were not demonstrated.
- [ ] Retry Same Scenario preserves the competency but resets the session.
- [ ] Try a New Version changes surface details without changing the competency.
- [ ] Result history shows only the signed-in tester's lab sessions.
- [ ] `/trainer.html` works only for an email in `LAB_ADMIN_EMAILS`.

## Data protection

- [ ] No rows are added to live `ascent_submissions`.
- [ ] No live score or leaderboard changes.
- [ ] No student email or notification is sent.
- [ ] Learner audio is not stored after the request completes.
- [ ] A tester cannot read another tester's session by changing the session ID.
- [ ] Turning `LAB_FEATURE_ENABLED=false` blocks all new activity.

## Cost and quality gate

- [ ] Run 25 test conversations across all three practice modes.
- [ ] Record actual Gemini and TTS cost per conversation.
- [ ] Review transcription failures, weak follow-ups and scoring anomalies.
- [ ] Confirm average cost and set a per-user test limit.
- [ ] Release only after the complete journey is tested from selection through history.
