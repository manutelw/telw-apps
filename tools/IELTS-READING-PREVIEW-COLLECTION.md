# IELTS Reading: five sets for each test type

The private collection contains 10 pre-generated sets: five Academic and five General Training, 40 questions per set. It contains 40 distinct passages and 400 distinct prompts. The existing TFNG and multiple-choice format is preserved. Independent editorial review is pending; availability here is for the isolated preview only and does not constitute a production release or calibration.

The repository is public. The collection and answer keys must not be committed, placed in public assets or linked from a learner page. The confidential deliverable is `telw-reading-five-sets-per-track-preview.json`.

## Admin access and loading

1. Deploy this change to the existing isolated IELTS preview Worker through the approved pull-request process.
2. Verify the TELW trainer email on the Reading learner page. Use the **Reading admin** link that appears after verification. The actual admin page is `/api/ielts/reading/admin`, within the existing session cookie's `/api` path. The older `/ielts/reading/admin` address redirects there; session scope is unchanged.
3. Open **Load the complete private collection**, choose the private JSON file, confirm preview use, and load all ten sets together.
4. The existing two matching baseline sets remain unchanged; eight new rows are inserted. A repeated upload inserts nothing. Conflicting content under an existing ID is rejected. D1's transactional batch prevents partial loading.
5. The admin dashboard shows five sets per type and 400 questions. Expand any set to inspect all passages, questions, answers and evidence.

Imports are enabled only by the isolated preview entry point, require the verified trainer session and same-origin POST, and enforce a bounded upload. Production does not enable this import route. No secret, credential or migration is required. Existing attempts, results and the 15-day completion limit are preserved.

## Validation performed locally

- 43 automated IELTS tests, including access control, cross-origin protection, transactional rollback, immutable conflicts, safe repeated uploads, expired sessions and existing Reading regressions.
- Actual private collection imported over the two original seeded versions using the D1-shaped SQLite adapter: eight inserted, two retained; repeated upload inserted zero.
- All ten actual sets exercised through start and submit: ten scores of 40/40 when the private correct keys were supplied by the test harness; each track used all five distinct assignments with no repeat; immediate cross-track retakes were blocked; exhaustion failed closed.
- ASCENT core and trainer integrity scripts; module and inline-script syntax; identical learner/preview HTML; diff whitespace.

These local checks are not a claim of Cloudflare runtime verification or independent content review. Verify the live admin counts and learner allocation after the approved preview deployment and private upload. Do not deploy this unreviewed collection to production.
