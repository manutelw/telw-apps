from pathlib import Path
import re

path = Path("ascent/trainer.html")
text = path.read_text(encoding="utf-8")
original = text

text = text.replace(
    '<div class="summary-card"><div class="summary-label" id="diagnosticCompletedLabel">Completed</div><div id="diagnosticAttemptedValue" class="summary-value">—</div></div>',
    '<div class="summary-card"><div class="summary-label" id="diagnosticCompletedLabel">Students Completed</div><div id="diagnosticAttemptedValue" class="summary-value">—</div></div>',
    1,
)
text = text.replace(
    '<div class="summary-card"><div class="summary-label">Not Completed</div><div id="diagnosticNotStartedValue" class="summary-value">—</div></div>',
    '<div class="summary-card"><div class="summary-label">Students Not Completed</div><div id="diagnosticNotStartedValue" class="summary-value">—</div></div>',
    1,
)

text, _ = re.subn(
    r'data-ascent-build="[^"]+"',
    'data-ascent-build="2026-08-24.21"',
    text,
    count=1,
)

checks = {
    "completed_label": '>Students Completed</div><div id="diagnosticAttemptedValue"' in text,
    "not_completed_label": '>Students Not Completed</div><div id="diagnosticNotStartedValue"' in text,
    "build": 'data-ascent-build="2026-08-24.21"' in text,
}
failed = [name for name, ok in checks.items() if not ok]
if failed:
    raise SystemExit("Patch verification failed: " + ", ".join(failed))

if text != original:
    path.write_text(text, encoding="utf-8")
    print("trainer.html patched: dashboard completion labels clarified")
else:
    print("trainer.html already has clarified completion labels")
