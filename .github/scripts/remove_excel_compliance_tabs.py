from pathlib import Path
import re

path = Path("ascent/trainer.html")
text = path.read_text(encoding="utf-8")
original = text

pattern = re.compile(
    r'''\n      const completeRows=\[\["Students who have submitted all Bulk Questions due through the latest completed week"\].*?\n      output\.push\(\{batchName:"INCOMPLETE RESPONSES",sheet:incompleteSheet\}\);\n''',
    re.DOTALL,
)

text, count = pattern.subn("\n", text, count=1)
if count == 0:
    # If already removed, accept it; otherwise fail loudly.
    if 'batchName:"ALL RESPONSES SUBMITTED"' in text or 'batchName:"INCOMPLETE RESPONSES"' in text:
        raise SystemExit("Compliance-sheet block was found but did not match expected structure")

text, _ = re.subn(
    r'data-ascent-build="[^"]+"',
    'data-ascent-build="2026-08-24.20"',
    text,
    count=1,
)

if 'batchName:"ALL RESPONSES SUBMITTED"' in text or 'batchName:"INCOMPLETE RESPONSES"' in text:
    raise SystemExit("Compliance sheets are still present after patch")

if text != original:
    path.write_text(text, encoding="utf-8")
    print("trainer.html patched: removed ALL RESPONSES SUBMITTED and INCOMPLETE RESPONSES Excel tabs")
else:
    print("trainer.html already has compliance tabs removed")
