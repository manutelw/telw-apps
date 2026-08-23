# ASCENT Live AI Mock Interview — PRODUCTION LOCK

**Status:** FROZEN / KNOWN-GOOD BASELINE  
**Frozen on:** 2026-08-23, 21:45 IST  
**Purpose:** Preserve the exact Live AI Mock Interview behaviour that passed user testing. Do not casually modify, redeploy, or refactor this path.

## Frozen production components

### 1. Live interviewer — Supabase Edge Function
- Function: `ascent-openai-live-interview`
- Project: `vtqatrhwfvzyodiftvkc`
- Frozen active version: **17**
- SHA-256: `7397a69935b1bf16ac3c831702189a094882f1b4dc0936945774693b4b927a9a`
- `verify_jwt`: false (custom ASCENT session authentication is enforced in the function)

### 2. Evaluator — Supabase Edge Function
- Function: `ascent-realtime-mock-interview`
- Project: `vtqatrhwfvzyodiftvkc`
- Frozen active version: **17**
- SHA-256: `b6daf4c069bf997669c2471a50e2510553742891c43bf6fd5493f142edfabbad`
- `verify_jwt`: false (custom ASCENT session authentication is enforced in the function)

### 3. Feedback audio — Supabase Edge Function
- Function: `ascent-feedback-audio`
- Project: `vtqatrhwfvzyodiftvkc`
- Frozen active version: **6**
- SHA-256: `48d27d22c737a05d93a2ad02e1685570157a8fce79bdaf61fcdb73a9b847e7c2`
- `verify_jwt`: false (custom ASCENT session authentication is enforced in the function)

### 4. Learner page — GitHub
- Repository: `manutelw/telw-apps`
- Path: `ascent/live-mock-interview.html`
- Frozen known-good commit: `9e6477cac0169aa20617e5e17798a50251e90a10`
- Frozen content/blob SHA: `f10ade0d2aaef6504956c944d8930a4236c369ec`

## Non-negotiable behaviour contract

### Interview flow
1. The interviewer greets the learner by registered first name and asks the assigned PI opening question orally.
2. The opening question is followed by one adaptive follow-up and one final adaptive follow-up.
3. The interview closes only after **three substantive learner answers**.
4. Clarification, repetition or rephrasing requests do **not** count as substantive answers.
5. A question that has started must be completed before any closing decision. The interviewer must never switch from a question into the closing line mid-turn.
6. A question, clarification, repetition or repair must always be followed by a learner turn before closing is permitted.
7. If the interviewer itself begins a question badly, it may naturally repair and restate the **same underlying question**; the repair is not a new question.
8. The interviewer never coaches, praises, scores or admonishes the learner during the live interview.
9. Closing line before evaluation remains: `Thank you, [first name]. Please wait while I prepare your feedback.`
10. After that closing line, the live interviewer produces no further audio.

### Voice
1. Modern neutral British English with **light RP**.
2. Educated, contemporary, natural and professional.
3. No exaggerated, aristocratic, old-fashioned or caricatured announcer delivery.
4. Avoid strongly American/Canadian vowel colouring where possible.
5. The live interviewer and feedback audio use the same light-RP direction.

### Evaluation and scoring
1. The evaluator uses the fixed five ASCENT PI criteria only, in this exact order:
   - Structure & Clarity
   - Content Depth & Evidence
   - Business Thinking
   - Communication & Professionalism
   - Composure Under Pressure
2. Level-to-score mapping is fixed: 1=0.4, 2=0.8, 3=1.2, 4=1.6, 5=2.0.
3. ASCENT calculates the final total deterministically out of 10.
4. Spoken and written feedback must use the same authoritative final score.
5. The transcript is the sole source of truth for what was actually asked and answered.
6. A cut-off, incomplete, interrupted, missing or never-spoken question is ignored for scoring and feedback.
7. ASCENT must never accuse a learner of failing to answer a question unless the complete question actually appears in the transcript before the learner turn.
8. Feedback never fabricates achievements, employers, systems, metrics, outcomes, qualifications or experience.
9. Written feedback remains the detailed diagnostic record; spoken feedback is the selective coaching interpretation of the same evaluation.
10. Learner-facing feedback never mentions TELW, versions, proprietary frameworks or hidden coaching labels.

### Feedback audio
1. Main coaching audio and sign-off audio are prepared before playback.
2. Browser preloads and validates both audio assets before declaring audio feedback ready.
3. Main feedback plays first.
4. The closing audio contains: `That's the end of the feedback.` → brief pause → `Thank you.`
5. `Thank you.` is generated as its own TTS segment inside the sign-off assembly, followed by a protective silent tail so it is not clipped.
6. `Hear Feedback Again` must replay the same complete sequence.

## Regression checklist — MUST PASS before any future production change

A future change to the live interviewer, evaluator, feedback audio function or learner page is not production-safe until all of these pass:

- [ ] Opening question is spoken completely.
- [ ] First adaptive follow-up is spoken completely.
- [ ] Final adaptive follow-up is spoken completely.
- [ ] Exactly three substantive learner answers are required.
- [ ] Clarification/repetition does not advance the answer count.
- [ ] Interviewer never closes in the middle of a question.
- [ ] Natural repair of a badly started question preserves the same underlying question.
- [ ] No invented/unasked question appears in the feedback.
- [ ] No learner is penalised for an interviewer-side truncation or omission.
- [ ] Fixed five ASCENT PI criteria and deterministic score mapping remain unchanged.
- [ ] Spoken total score exactly matches written total score.
- [ ] Feedback does not invent learner facts or achievements.
- [ ] Main feedback audio loads and plays.
- [ ] `That's the end of the feedback.` is audible.
- [ ] Final `Thank you.` is audible in full.
- [ ] `Hear Feedback Again` replays the complete spoken sequence.
- [ ] Modern neutral British English / light RP remains natural and non-caricatured.
- [ ] Mic denied, network failure, expired session and early manual termination fail safely.
- [ ] Demo/test interviews are not persisted as production results.

## Change-control rule

**DO NOT directly replace this frozen baseline for experiments.**

For any future change:
1. Record the proposed change and why it is needed.
2. Preserve these frozen version numbers/hashes as the rollback reference.
3. Make the smallest possible change.
4. Run the full regression checklist above.
5. Only after the checklist passes should the new state replace this baseline.
6. Update this file with the new approved versions/hashes only after explicit production approval.

If a future deployment regresses behaviour, restore/redeploy the source corresponding to the frozen versions and hashes above rather than attempting multiple speculative fixes in production.
