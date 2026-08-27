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
recording_vault = (root / 'ascent' / 'recording-vault.js').read_text(encoding='utf-8')
play_home = (root / 'ascent-play' / 'home.html').read_text(encoding='utf-8')
play_practice = (root / 'ascent-play' / 'practice.html').read_text(encoding='utf-8')
play_guard = (root / 'ascent-play' / 'play-core-guard.js').read_text(encoding='utf-8')
play_sw = (root / 'ascent-play' / 'sw.js').read_text(encoding='utf-8')
android_manifest = (root / 'android-ascent-play' / 'app' / 'src' / 'main' / 'AndroidManifest.xml').read_text(encoding='utf-8')
android_activity = (root / 'android-ascent-play' / 'app' / 'src' / 'main' / 'java' / 'com' / 'telw' / 'ascent' / 'MainActivity.java').read_text(encoding='utf-8')

# 1. Website Practice shell must remain singular and non-recursive.
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

# 2. Add-ons must not be embedded in Basic ASCENT core.
for addon_marker in [
    'live-mock-interview.html',
    'live-mock-info.html',
    'coach.html',
    'conversation',
]:
    require(addon_marker not in practice_core,
            f'Basic practice-core.html must not embed or depend on add-on marker: {addon_marker}')

# 3. Core recorder controls are contractual.
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

# 4. Submission path must retain the protected idempotent primary/fallback routes
#    while preserving compatibility with the proven v2/original endpoints underneath.
for marker, message in [
    ('ascent-submit-safe', 'Protected primary submission route is missing.'),
    ('ascent-submit-safe-fallback', 'Protected fallback submission route is missing.'),
    ('ascent-submit-response-v2', 'Proven v2 submission route compatibility is missing.'),
    ('ascent-submit-response"', 'Original submission route compatibility is missing.'),
    ('client_submission_id', 'Protected client submission id is missing.'),
    ('CLIENT_SUBMISSION_KEY_PREFIX', 'Persistent submission id storage is missing.'),
    ('ensureClientSubmissionId', 'Protected submission id creation is missing.'),
    ('clearSubmissionReferenceWhenConfirmed', 'Protected submission acknowledgement handling is missing.'),
]:
    require(marker in practice_access, message)
require('/ascent/submit-response' not in practice_access,
        'Basic ASCENT must not route submissions through an unverified same-origin proxy.')
require('trySubmitEndpoint' in practice_access and 'protected fallback submission service' in practice_access,
        'Submission retry/fallback protection is missing.')
require('20260827-idempotency1' in practice,
        'Website Practice must load the protected idempotent submission controller version.')
require('20260827-idempotency1' in play_practice,
        'Play core must load the protected idempotent submission controller version.')

# 5. Core context states must remain represented.
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

# 6. Legacy patch workflows are retired. They may remain as manual no-ops only;
#    they must not write or push production files.
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
                f'{workflow} must not auto-run on push.')
        require('contents: read' in text,
                f'{workflow} must remain read-only.')
        for forbidden in ['git push', 'git commit', 'contents: write']:
            require(forbidden not in text,
                    f'{workflow} must remain a retired no-op and may not contain: {forbidden}')

# 7. Access controller may not replace recorder/evaluation functions.
for forbidden_override in [
    'startRecording =',
    'stopRecording =',
    'submitRecording =',
    'renderEvaluationResult =',
]:
    require(forbidden_override not in practice_access,
            f'practice-access-v2.js must not replace core recorder/evaluation function: {forbidden_override}')

# 8. Google Play build is a sealed core-only entrypoint.
require(play_practice.count('id="practiceFrame"') == 1,
        'Play core practice must contain exactly one Practice iframe.')
require('../ascent/practice-core.html' in play_practice,
        'Play core practice must load the protected practice-core.html.')
require('../ascent/practice-access-v2.js' in play_practice,
        'Play core practice must load the protected access/submission controller.')
require('play-core-guard.js' in play_practice,
        'Play core practice must load the Play isolation guard.')
for addon_marker in ['live-mock', 'coach.html', 'jd-interview', 'custom-question-pack']:
    require(addon_marker not in play_home.lower(),
            f'Google Play home must not link to add-on: {addon_marker}')
require('isJdAssignment' in play_guard,
        'Play isolation guard must explicitly remove JD assignments.')
require('option.value==="custom"' in play_guard,
        'Play isolation guard must remove custom/purchase practice UI.')

# 9. Google Play WebView is audio-only and path allow-listed.
require('android.permission.CAMERA' not in android_manifest,
        'Google Play core must not request CAMERA permission.')
require('android.permission.RECORD_AUDIO' in android_manifest,
        'Google Play core must retain microphone permission.')
require('RESOURCE_VIDEO_CAPTURE' in android_activity and 'request.deny()' in android_activity,
        'Google Play core must explicitly deny video capture requests.')
require('path.startsWith("/ascent-play/")' in android_activity,
        'Google Play WebView must retain an explicit core path allow-list.')
require('ASCENT-Play-Core/1.0' in android_activity,
        'Google Play core user-agent marker is missing.')

# 10. Service worker must avoid stale cross-version shell behaviour.
require('ascent-play-core-v2' in play_sw,
        'Google Play cache version must be pinned to the core build.')
require("cache:'no-store'" in play_sw,
        'Google Play shell must use network-first no-store fetches.')
require("request.mode==='navigate'" in play_sw,
        'Offline fallback must be limited to navigations, not arbitrary JS/resources.')

# 11. Governance files are part of the protection mechanism and may not disappear.
codeowners_path = root / '.github' / 'CODEOWNERS'
protection_contract_path = root / 'ASCENT_CORE_PROTECTION.md'
require(codeowners_path.exists(), 'ASCENT CODEOWNERS protection file is missing.')
require(protection_contract_path.exists(), 'ASCENT core protection contract is missing.')
if codeowners_path.exists():
    codeowners = codeowners_path.read_text(encoding='utf-8')
    for protected_path in [
        '/ascent/practice-core.html',
        '/ascent/practice-access-v2.js',
        '/ascent/recording-vault.js',
        '/ascent/trainer.html',
        '/ascent/trainer-results-summary.js',
        '/ascent-play/',
        '/android-ascent-play/',
        '/functions/ascent/',
        '/.github/workflows/ascent-integrity.yml',
    ]:
        require(protected_path in codeowners,
                f'CODEOWNERS must retain ownership for protected core path: {protected_path}')
if protection_contract_path.exists():
    protection_contract = protection_contract_path.read_text(encoding='utf-8')
    for marker in [
        'Protected learner core',
        'Protected trainer core',
        'Add-ons are outside core',
        'ascent-core-stable-20260827-v1',
    ]:
        require(marker in protection_contract,
                f'ASCENT protection contract is missing required marker: {marker}')

# 12. Completed recordings must survive an unconfirmed submission or page interruption.
require('recording-vault.js' in practice,
        'Website Practice must load the protected recording recovery vault.')
require('recording-vault.js' in play_practice,
        'Google Play core must load the protected recording recovery vault.')
for marker, message in [
    ('indexedDB.open', 'Recording vault must use persistent IndexedDB storage.'),
    ('audioBlob instanceof Blob', 'Recording vault must capture completed audio blobs.'),
    ('Submission was not confirmed. Your recording remains protected',
     'Recording vault must retain audio after an unconfirmed submission.'),
    ('Your unsent recording was recovered',
     'Recording vault must restore a recoverable recording after interruption.'),
    ('payload.ok === true',
     'Recording vault must clear only after a confirmed successful server response.'),
    ('question_already_answered',
     'Recording vault must recognise a server-confirmed already-saved institutional response.'),
]:
    require(marker in recording_vault, message)

if errors:
    print('ASCENT integrity check FAILED:')
    for error in errors:
        print(f' - {error}')
    sys.exit(1)

print('ASCENT integrity check passed.')
