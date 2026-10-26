# TELW IELTS Diagnostic — release contract

## Shared identity and security
- Learner must verify email ownership before beginning any test. Use single-use, short-lived email code or link; store only hashed codes, expire challenges, limit guesses, throttle requests at Cloudflare and server. Never accept an email typed into a result form as proof of identity.
- Track completed tests server-side in D1, not browser storage. Enforce a rolling 15-day gap for Reading on the server. Do not consume an attempt for abandoned or interrupted tests. Explicitly define recovery for an accidentally closed tab.
- Never place answer keys, email secrets, learner submissions, or unpublished test drafts in public assets.
- Bind a specific immutable test version to each attempt; score and report using that exact version.
- Deliver candidate results only to verified email, with consent and a per-attempt send limit. Trainer evidence goes only to the configured TELW inbox. Prevent duplicate email dispatch.
- Add abuse controls on verification, starting, submission and feedback endpoints. Provide reasonable privacy notice, retention and deletion process.

## Reading — release gate
- Both Academic and General Training, 60 minutes, 40 questions. Fixed topic blueprint; at least 10–20 independently reviewed, approved alternative versions per track before advertising a fresh test on every retake.
- Each version contains exactly 4 passages and 40 questions, 24 TFNG and 16 multiple choice, with genuine NOT GIVEN coverage and independent answer review.
- Pre-generate drafts offline. Human approval before publication. Private answer keys. Deterministic score.
- Preserve current learner feedback and TELW evidence reports, now version-specific.
- End-to-end tests: email verification, start, interrupted attempt, submission, cooldown, second learner, bot throttling, candidate email, TELW email, regression of unrelated apps.

## Listening — release gate
- Both tracks; approximately 30 minutes of listening plus clearly defined answer-entry time; 40 questions across four sections. Original audio and transcripts, controlled playback, consistent audio quality and accessible controls.
- Pre-generate and review audio scripts, questions, private keys and audio; do not generate per learner. Verify timing, accent intelligibility and answer tolerance (spelling/word limits) with controlled marking.
- No answers or transcripts leaked to learner during active test.

## Writing — release gate
- Academic and General Training Task 1 appropriate to track; shared Task 2 essay. Time guidance 60 minutes. Preserve exact prompts and submissions.
- Evaluate Task Achievement/Response, Coherence and Cohesion, Lexical Resource, and Grammatical Range and Accuracy with transparent evidence and cautious estimated band. Explicitly label AI estimates as unofficial and allow review/escalation.
- Include word counts, task timing, privacy and fair handling of incomplete submissions. Calibrate scoring against expert-rated samples.

## Speaking — release gate
- Three parts, original prompts, recording permissions, microphone test, clear time guidance, and recoverable uploads. Secure storage and retention rules.
- Assess Fluency and Coherence, Lexical Resource, Grammatical Range and Accuracy, and Pronunciation using audio evidence. No confident pronunciation scoring from transcript alone. Flag unintelligible/failed recordings for retest.
- Show estimated, unofficial feedback with supporting examples; calibrate against expert-rated samples.

## Release policy
- No deployment merely because a PR merges. Cloudflare D1 database/binding, verified Resend configuration, secret management, production rate limits, and production smoke tests must be completed.
- The D1 migration file defines tables only. It does NOT provision a D1 database or wire up a Worker binding.
- Do not declare the four diagnostics complete until their respective acceptance gates pass. Do not modify other ClarionPrep routes or internal pages.
