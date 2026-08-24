from pathlib import Path
import re

path = Path('ascent/trainer.html')
text = path.read_text(encoding='utf-8')
original = text

if 'weekly-completion.html' not in text:
    patterns = [
        re.compile(r'(<button\b[^>]*class="[^"]*\bnav-item\b[^"]*"[^>]*>\s*Dashboard\s*</button>)', re.I | re.S),
        re.compile(r'(<button\b[^>]*data-section="dashboard"[^>]*>.*?</button>)', re.I | re.S),
    ]
    match = None
    for pattern in patterns:
        match = pattern.search(text)
        if match:
            break
    if not match:
        raise SystemExit('Dashboard navigation button not found')

    link = '\n        <a class="nav-item" href="./weekly-completion.html" style="display:block;text-decoration:none;">Weekly Completion</a>'
    text = text[:match.end()] + link + text[match.end():]

if 'weekly-completion.html' not in text or '>Weekly Completion</a>' not in text:
    raise SystemExit('Weekly Completion navigation link was not added')

if text != original:
    path.write_text(text, encoding='utf-8')
    print('trainer.html patched: Weekly Completion navigation added')
else:
    print('trainer.html already has Weekly Completion navigation')
