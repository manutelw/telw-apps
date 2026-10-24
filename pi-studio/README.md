# PI Studio — controlled foundation build

**Status: development PR; not production-approved.** This is a functional first integrated slice, not a finished production PI platform.

## Stages
1. Understand: 20 questions, ASK / TEST / PROVE, existing AI endpoint.
2. Plan: TELW Tell → Engage/Explain → Land/Link → Wrap/Win; shorter/longer selection.
3. Answer: written candidate answer, separate AI coach with a different rubric.
4. Speak: browser microphone recording, replay, retry. Audio is not uploaded or AI-scored.
5. Follow-up: AI-generated probing question and separate response review.
6. Mock: shuffled five-question sequence and browser-local progress export.

## Safety / boundaries
- No changes to frozen ORACY files or existing PI Practice app.
- Existing Cloudflare Worker secret OPENAI_API_KEY is used server-side; never sent to browser.
- No claims of pronunciation or voice scoring.
- No learner login, central database, trainer dashboard, audio persistence, cross-device sync, or interview readiness certification yet.
- No guarantee that model judgements are accurate; intent grading needs independent validation.

## Acceptance gates before merge
- Run JS syntax checks on pi-studio/app.js, functions/api/pi-studio/coach.js, and worker-host-router.js.
- Verify all six stages render, stage and question changes persist, export JSON works, and previous pi-practice data remains untouched.
- Check microphone denied / unsupported / successful / retry flows.
- Check AI endpoint errors and success for answer, follow-up generation, and follow-up evaluation.
- Validate at least 80 meaning-diverse intent cases (20 questions × 4 variants) against a human-reviewed rubric, including alternative correct phrasing.
- Verify Cloudflare Worker deployment in preview, ORACY frozen checks, and existing app routes before production.
- Verify no sensitive audio or OpenAI key is exposed to client.

## Known limitation
The existing intent AI evaluator has demonstrated inconsistent educational grading. The new studio reuses it but must **not** be described as validated until the 80-case assessment gate passes. This PR does not repair that issue.
