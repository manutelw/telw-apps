# ASCENT Core Contract

Basic ASCENT is the protected foundation. Add-on features may link to or consume core services, but they must not redefine the core flows.

## Protected core flows

1. Access: registration, verification, login, logout, session validity and learner/batch identity.
2. Question delivery: Diagnostic, trainer/bulk releases, ordinary PI/GD/LUM bank, JD-derived/assigned questions, and batch-specific rules.
3. Recording: microphone access, start, stop, playback and retry/single-attempt policy.
4. Submission: recording reaches the evaluation service reliably, with retry protection and no duplicate submission caused by client retries.
5. Evaluation and persistence: transcription/evaluation completes and the result is saved.
6. Results: learner feedback and trainer/admin reporting reflect saved submissions correctly.

## Add-on isolation rule

Live Mock Interview, ASCENT Coach, conversation practice, Answer Builder and future features are add-ons. They may be linked from the Basic ASCENT shell or call documented services, but they must not:

- replace recorder functions in `practice-core.html`;
- silently rewrite `practice.html` or `practice-core.html` through GitHub Actions;
- change the submission route without staging verification;
- change Diagnostic or 2026-28 bulk-release policy as a side effect;
- introduce a second Practice wrapper or recursively embed Practice;
- modify results persistence or trainer reporting without regression checks.

## Release discipline

- Build and test on `ascent-staging` first.
- Run the ASCENT Integrity Guard.
- Confirm the regression matrix for representative learner states.
- Only then promote the change to `main`.
- If a production issue appears, roll back to the last known-good commit instead of stacking another untested patch.

## Regression matrix

The minimum acceptance matrix is:

- Diagnostic learner: required -> submit -> complete.
- 2026-28 learner with released bulk question: only released question visible.
- 2026-28 learner after completing released bulk question: no other question visible until a new release.
- Other institutional learner: normal question bank plus own JD/assigned questions where applicable.
- Private learner: entitlement/submission limits and retry policy preserved.
- JD Builder learner: learner-specific JD questions selectable without exposing another learner's questions.
- Demo/admin learner: test access works without changing real learner policy.

For each state, verify login, question visibility, recording, playback, submission, saved evaluation, feedback display and results/reporting.
