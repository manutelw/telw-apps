from pathlib import Path
import sys

errors = []


def require(condition, message):
    if not condition:
        errors.append(message)


root = Path('.')
practice = (root / 'ascent' / 'practice.html').read_text(encoding='utf-8')
practice_core = (root / 'ascent' / 'practice-core.html').read_text(encoding='utf-8')
practice_access = (root / 'ascent' / 'practice-access-v2.js').read_text(encoding='utf-8')

# 1. Practice shell must remain singular and non-recursive.
require(practice.count('class="live-mock-strip"') == 1,
        'practice.html must contain exactly one learner-tools header.')
require(practice.count('id="practiceFrame"') == 1,
        'practice.html must contain exactly one Practice iframe.')
require('live-mock-strip' not in practice_core,
        'practice-core.html must not contain the outer learner-tools header.')
require('src="./practice.html' not in practice_core,
        'practice-core.html must never embed practice.html recursively.')
require('src="./practice.html' not in practice,
        'practice.html must never embed itself.')

# 2. Add-ons may be linked from the shell, but must not be embedded in Basic ASCENT core.
for addon_marker in [
    'live-mock-interview.html',
    'live-mock-info.html',
    'coach.html',
    'conversation',
]:
    require(addon_marker not in practice_core,
            f'Basic practice-core.html must not embed or depend on add-on marker: {addon_marker}')

# 3. Core recorder controls are contractual and must remain present exactly once where IDs are used.
for control_id in [
    'startButton',
    'stopButton',
    'submitButton',
    'audioPlayback',
    'questionBankSelect',
    'assignedTaskSelect',
    'practiceModeSelect',
    'statusMessage',
    'resultPanel',
]:
    require(practice_core.count(f'id="{control_id}"') == 1,
            f'Critical Practice control must exist exactly once: {control_id}')

# 4. Submission path is deliberately pinned to the proven Supabase v2 endpoint.
#    Do not introduce another proxy/hop without first changing this contract and testing on staging.
require('ascent-submit-response-v2' in practice_access,
        'practice-access-v2.js must retain the proven ascent-submit-response-v2 path.')
require('/ascent/submit-response' not in practice_access,
        'Basic ASCENT must not route submissions through an unverified same-origin proxy.')
require('for (let attempt = 1; attempt <= 3; attempt += 1)' in practice_access,
        'Submission network retry protection is missing.')

# 5. 2026-28 bulk-question lock and ordinary-bank paths must remain represented in the controller.
for context_code in [
    'bulk_question_only',
    'bulk_question_complete',
    'institutional_open_bank',
    'institutional_open_bank_with_assigned',
    'diagnostic_required',
    'diagnostic_complete',
]:
    require(context_code in practice_access,
            f'Practice access contract missing state: {context_code}')

# 6. Prevent workflows from silently rewriting production pages on every push.
workflow_files = [
    '.github/workflows/add-jd-link-practice.yml',
    '.github/workflows/patch-practice-bulk-question.yml',
    '.github/workflows/patch-trainer-cache-bust.yml',
    '.github/workflows/patch-trainer-export.yml',
]
for workflow in workflow_files:
    path = root / workflow
    require(path.exists(), f'Expected safety-controlled workflow missing: {workflow}')
    if path.exists():
        text = path.read_text(encoding='utf-8')
        require('workflow_dispatch:' in text,
                f'{workflow} must remain manually triggered.')
        require('\n  push:' not in text and '\npush:' not in text,
                f'{workflow} must not auto-write to main on push.')

# 7. Keep Basic ASCENT pages separate from add-on implementation files.
#    The shell may link to add-ons, but add-on scripts may not replace core recorder functions.
for forbidden_override in [
    'startRecording =',
    'stopRecording =',
    'submitRecording =',
    'renderEvaluationResult =',
]:
    require(forbidden_override not in practice_access,
            f'practice-access-v2.js must not replace core recorder/evaluation function: {forbidden_override}')

if errors:
    print('ASCENT integrity check FAILED:')
    for error in errors:
        print(f' - {error}')
    sys.exit(1)

print('ASCENT integrity check passed.')
