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
proxy_path = root / 'functions' / 'ascent' / 'submit-response.js'

# UI structure: exactly one wrapper/header and one practice iframe.
require(practice.count('class="live-mock-strip"') == 1,
        'practice.html must contain exactly one live-mock-strip wrapper.')
require(practice.count('id="practiceFrame"') == 1,
        'practice.html must contain exactly one practiceFrame iframe.')
require('live-mock-strip' not in practice_core,
        'practice-core.html must not contain the outer Practice header.')
require('src="./practice.html' not in practice_core,
        'practice-core.html must never embed practice.html recursively.')

# Submission architecture: if same-origin route is referenced, the route file must exist.
uses_proxy = '/ascent/submit-response' in practice_access
require((not uses_proxy) or proxy_path.exists(),
        'practice-access-v2.js references /ascent/submit-response but the proxy file is missing.')

# Critical learner controls must remain present.
for marker in [
    'Submit Response',
    'Start Recording',
    'Stop Recording',
    'questionBankSelect',
    'assignedTaskSelect',
    'practiceModeSelect',
]:
    require(marker in practice_core, f'Critical Practice marker missing: {marker}')

# Prevent accidental auto-writing workflows from silently modifying production files on every main push.
workflow_files = [
    '.github/workflows/add-jd-link-practice.yml',
    '.github/workflows/patch-practice-bulk-question.yml',
    '.github/workflows/patch-trainer-cache-bust.yml',
    '.github/workflows/patch-trainer-export.yml',
]
for workflow in workflow_files:
    text = (root / workflow).read_text(encoding='utf-8')
    require('workflow_dispatch:' in text,
            f'{workflow} must remain manually triggered.')
    require('\n  push:' not in text and '\npush:' not in text,
            f'{workflow} must not auto-write to main on push.')

if errors:
    print('ASCENT integrity check FAILED:')
    for error in errors:
        print(f' - {error}')
    sys.exit(1)

print('ASCENT integrity check passed.')
