from pathlib import Path
import re

path = Path('ascent/trainer.html')
text = path.read_text(encoding='utf-8')
original = text

# Ensure Weekly Completion remains directly below Dashboard.
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

# Add the cohort-level performance page as the next reporting link.
if 'cohort-performance.html' not in text:
    weekly = re.search(
        r'(<a\b[^>]*href="\./weekly-completion\.html"[^>]*>\s*Weekly Completion\s*</a>)',
        text,
        re.I | re.S,
    )
    if not weekly:
        raise SystemExit('Weekly Completion navigation link not found')
    link = '\n        <a class="nav-item" href="./cohort-performance.html" style="display:block;text-decoration:none;">Cohort Performance</a>'
    text = text[:weekly.end()] + link + text[weekly.end():]

if 'weekly-completion.html' not in text or '>Weekly Completion</a>' not in text:
    raise SystemExit('Weekly Completion navigation link was not added')
if 'cohort-performance.html' not in text or '>Cohort Performance</a>' not in text:
    raise SystemExit('Cohort Performance navigation link was not added')

if text != original:
    path.write_text(text, encoding='utf-8')
    print('trainer.html patched: Weekly Completion and Cohort Performance navigation added')
else:
    print('trainer.html already has Weekly Completion and Cohort Performance navigation')
