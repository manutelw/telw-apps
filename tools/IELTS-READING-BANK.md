# Controlled IELTS Reading question bank — foundation

This is an OFFLINE AUTHORING WORKFLOW, not yet a live rotating question bank.

1. Run `OPENAI_API_KEY=... node tools/generate-ielts-reading-bank.mjs general` (or `academic`) in a secure authoring environment. Never put the API key in GitHub, HTML, logs or public assets.
2. The script creates a local JSON draft in `ielts-reading-drafts/`. It does NOT deploy it. Do not place drafts or answer keys in Cloudflare's public static assets.
3. Validation requires four fixed-topic passages, 40 questions, 24 TFNG questions, 16 MC questions, at least eight NOT GIVEN correct answers, coverage of all three TFNG categories in every passage, and evidence rationales.
4. A passing structural check is NOT sufficient. Independently review every answer against the exact passage, verify that NOT GIVEN claims are truly neither stated nor contradicted, check reading level, distractors and reasonable comparability with the other versions. Approve only after human editorial review.
5. Future serving layer must keep answer keys private, select only approved versions, assign a version ID to each learner attempt, and score/report using that SAME immutable version ID. Store assignment, 15-day eligibility and completion in a server-side database. Do not enforce eligibility in browser local storage.
6. Future email protection must include server-side rate limiting and human verification or equivalent abuse prevention; a learner-provided email is not reliable identity by itself.

No current learner-facing route, scoring, TELW email or Worker binding is changed by this PR. The 15-day limit, rotating test assignment, persistent storage and bot protection are NOT implemented here.
