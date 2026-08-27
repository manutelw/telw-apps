# ASCENT CORE — Protection Contract

This document defines the production baseline that must not disappear, regress, or be silently replaced by add-on work.

## Protected learner core
- learner login/session/access
- Diagnostic
- PI/GD/LUM bank access
- released ASCENT Tasks and cohort/bulk rules
- microphone recording, stop, playback
- submission retry and fallback paths
- evaluation/scoring
- save/persistence of result data
- learner performance/results
- Google Play core-only entrypoint

## Protected trainer core
- trainer dashboard
- Results page
- Batch/Task/Status filters
- student-level Results summaries
- Batch/Status/Latest Submission sorting
- Sandeep Ascent Task-only Results restriction
- current-week and historical leaderboard
- Excel export, including weekly leaderboard sheets

## Add-ons are outside core
Live Mock Interview, JD Builder/JD Interview Mapper, ASCENT Coach, conversation features, Answer Builder, and future experimental facilities must be built alongside the core. They may consume core services but must not replace or redefine core recorder, submission, evaluation, results, leaderboard, or export behaviour.

## Release rule
1. Build and test new work on `ascent-staging` or another add-on branch.
2. Run ASCENT Integrity Guard successfully.
3. Verify the end-to-end learner and trainer smoke tests.
4. Only then merge/deploy to production.

## Rollback baseline
The branch `ascent-core-stable-20260827-v1` is the frozen rollback snapshot created before the next hardening phase. Do not develop on that branch.

## Failure standard
A transient failure must not cause silent loss or disappearance. Recording, submission, result, leaderboard, and Excel/reporting paths should fail safely, preserve underlying data, and recover or roll back to a known-good state wherever technically possible.
