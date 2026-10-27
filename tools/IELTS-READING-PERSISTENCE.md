# Reading persistence — second controlled change

Base: feat/ielts-verified-identity. Intended PR base is that branch until its PR merges; then retarget to main. Do not merge or deploy without Manu's explicit approval.

## Implemented in code
- New /api/ielts/reading/{start,save,submit,feedback-email,enquire} endpoints, verified identity required.
- Only approved, previously unseen versions may be assigned. A current attempt resumes across reloads and track changes. Questions are served from the assigned version, without private keys or reviewer rationales.
- Server-stored drafts, immutable assignment and completed result, atomic single-active-attempt index, database-enforced 15-day completion gap across both tracks.
- Server deadline: after 60 minutes only previously saved answers count. Expired unfinished attempts can be abandoned on a new start without consuming the completion interval. They never cause the same version to be reassigned.
- Deterministic scoring reads the assigned private key, never a submitted score/version/track. Repeated submit returns the saved result.
- Separate candidate and confidential TELW reports from stored evidence. Trainer recipient is fixed to manutelw@gmail.com; candidate recipient is verified identity. HTML is escaped. D1 send leases and stable provider idempotency keys suppress duplicates. Retry payload is frozen. Uncertain sends older than 23 hours require operator review.
- Old stateless Reading APIs return 410 instead of offering a bypass. Both learner page aliases use the new APIs and no longer embed the static question bank.
- Offline import requires a named independent reviewer, exact SHA-256 draft match, approval time and four editorial confirmations. It generates private SQL without applying it. Published versions cannot be changed in place.
- Corrected validator: MC option C is not NOT GIVEN; all TFNG verdicts must match their keys; malformed input returns validation failures rather than throwing.

## Release blockers
- No approved production question bank has been created/imported. The service deliberately returns unavailable if no fresh approved version exists. Synthetic tests are NOT diagnostic content.
- The release contract requires 10–20 independently reviewed versions per track before advertising repeated fresh tests. Factual review, genuine NOT GIVEN reasoning, difficulty and equivalence cannot be established by structural checks.
- Offline OpenAI authoring requires a key made available through a secure runtime. There is no OpenAI key in this workspace. Do not paste it into chat or commit it.
- Apply 0003 only after 0001 and 0002 to the dedicated IELTS database. No database was provisioned, bound or migrated remotely.
- Provider tests are simulated. Cloudflare runtime, live D1, browser/mobile/audio and actual email-delivery tests remain required. Chromium installation in this workspace failed because the download was not a valid archive; no visual/browser test pass is claimed.
- No automatic retention cleanup is configured. Agree retention and an authorized operational deletion process before release.

## Private approval manifest format
Supply author and an independent reviewer, decision='approved', reviewedSha256 of the exact draft bytes, approvedAt as Unix seconds, and checks with allAnswersChecked, notGivenChecked, ambiguityChecked, levelAndComparabilityChecked all true. An author's self-approval is rejected. A name in a file is an editorial attestation, not cryptographic proof of identity; the trusted operator must obtain the actual review.

Run `node tools/ielts-reading-import-bank.mjs draft.json review.json private-ielts-banks/import.sql` only after obtaining that review. The output includes private answers and must remain excluded from Git/static assets. Applying it requires the separately authorized D1 operation.
