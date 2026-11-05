# TELW IELTS Writing

A separate Worker for `https://manuvikraman.com/ielts/writing/`, with its own D1 database and session cookie. It does not touch Reading, Listening or the main site.

Learners verify their email, choose Academic or General Training, and write two tasks in 60 minutes (Task 1: 150 words, Task 2: 250 words). AI marks each task three times against TELW's private rubric. Learners see an estimated band range and feedback. No trainer marking is required. Results are a TELW diagnostic, not an official IELTS score.

## Safeguards in code

- Word counts, under-length caps, 20-word and blank-answer rules are applied by code. Copied question wording is not counted.
- Under-length caps are TELW policy, because the public descriptors publish no scale: below minimum caps the task score at 6, below two thirds at 5, below one third at 3.
- Every band of 3 or above must quote the learner's actual words, or that marking is rejected.
- Three independent markings use the middle band for each criterion. Disagreement widens the reported range.
- Task 2 counts twice Task 1. The range is never a single band.
- One attempt per learner every 15 days, and a daily limit (`WRITING_DAILY_LIMIT`) caps AI spending. `manutelw@gmail.com` is exempt for testing.
- The rubric stays in the database. It is not in this repository and is never sent to learners.

## Setup

Use only new resources. Never use the Reading or Listening database.

```sh
cd ielts-writing
npx wrangler d1 create telw-ielts-writing
cp wrangler.example.jsonc wrangler.local.jsonc      # then enter the new database ID
npx wrangler d1 migrations apply WRITING_DB --remote --config wrangler.local.jsonc
npx wrangler d1 execute WRITING_DB --remote --config wrangler.local.jsonc --file=/path/outside/repo/rubric.private.sql
npx wrangler secret put WRITING_AUTH_SECRET --config wrangler.local.jsonc   # 32+ random characters
npx wrangler secret put RESEND_API_KEY --config wrangler.local.jsonc
npx wrangler secret put TELW_FROM_EMAIL --config wrangler.local.jsonc
npx wrangler secret put OPENAI_API_KEY --config wrangler.local.jsonc
npx wrangler deploy --config wrangler.local.jsonc
```

The deploy routes are only `/ielts/writing` and `/ielts/writing/*`. Set `OPENAI_MARKING_MODEL` in the config to change the AI model.

## Before opening to learners

The automated tests use a fake AI, so they prove the app's behaviour, not marking accuracy. Run `scripts/calibrate.mjs` against published sample answers with examiner bands, and aim for at least 80% within half a band. Then take a full test from the trainer account and check real email delivery.

To change the rubric, edit it, reload it with the `d1 execute` command and raise its version.

## Tests

```sh
node --test ielts-writing/tests/*.test.mjs
```

Nothing is deployed by the test workflow.
