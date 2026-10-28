# Public Reading page connected to the stored question bank

The public `https://manuvikraman.com/ielts/reading/` route previously served the legacy HTML containing a fixed BANK and used the old unverified scoring endpoints. Loading additional sets through the private admin did not change that public page.

The public route now serves the verified IELTS service page on manuvikraman.com and maps its auth and Reading requests through the same existing service binding that the admin uses. The learner gets a separate secure, HttpOnly session cookie. Trainer and ClarionPrep cookies are never forwarded as learner credentials. Admin-only operations are not in the learner route allowlist. No new bindings, secrets, bank uploads or dashboard settings are needed.

Bank assignment and all attempt state remain server-side:
- A new eligible attempt gets a random, previously unseen version for the selected track.
- Reopening an unfinished attempt resumes that same version and saved answers.
- After completion, the 15-day interval applies across Academic and General.
- After all five versions of a track have been used, the service fails closed until more are added.
- Scoring and feedback use the immutable assigned version.

The existing uncalibrated-diagnostic notice remains. Independent editorial review is still pending as previously agreed. The data service remains the existing isolated IELTS service; this change makes its stored tests reachable from the public candidate page, so merge/deployment is an explicit release decision. Existing candidates using a cached legacy page must reload to use verified attempts. Legacy scoring/email endpoints return 410 rather than bypass the new gate.

Validation:
- 25 same-domain learner/trainer portal checks passed locally.
- Actual private 10-set collection tested locally through the public gateway, real IELTS auth module and D1-shaped SQLite adapter: 5 distinct Academic and 5 distinct General assignments, all 10 scores verified, draft resume, 15-day cross-track blocking, no private key in learner responses, admin/learner cookie separation and exhausted-bank blocking.
- Forged score/version fields did not change server scoring.
- Rewritten full learner-page scripts and production router passed syntax checks.

Cloudflare browser verification follows approved deployment. Other applications and the private admin implementation are unchanged.
