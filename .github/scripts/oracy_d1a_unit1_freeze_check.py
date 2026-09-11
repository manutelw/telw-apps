from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[2]
LOCK = ROOT / ".github/oracy-d1a-unit1.lock"
REQUIRED = {
    "oracy/unit-61.html",
    "oracy/unit-61-content.js",
    "oracy/unit-61.js",
}


def git_blob(path: str) -> str:
    return subprocess.check_output(
        ["git", "hash-object", path], cwd=ROOT, text=True
    ).strip()


assert LOCK.exists(), "D1A Unit 1 military freeze lock is missing"
locked = set()
for raw in LOCK.read_text(encoding="utf-8").splitlines():
    line = raw.strip()
    if not line or line.startswith("#"):
        continue
    expected, path = line.split(None, 1)
    target = ROOT / path
    assert target.is_file(), f"D1A Unit 1 frozen file is missing: {path}"
    actual = git_blob(path)
    assert actual == expected, (
        f"D1A UNIT 1 MILITARY LOCK: {path} changed "
        f"(expected {expected}, found {actual}). Explicit unlock required."
    )
    locked.add(path)

assert locked == REQUIRED, "D1A Unit 1 lock does not cover the exact approved package"

# The shared voice source is already hash-frozen by the B/C ballistic package.
# Preserve Unit 1's exact protected routing and conversation identity as an extra guard.
voice = (ROOT / "supabase/functions/oracy-voice/index.ts").read_text(encoding="utf-8")
assert '61:{' in voice and 'level:"D1A"' in voice
assert 'title:"The Story So Far"' in voice
assert 'unitNo===61?"D1A Unit 1"' in voice

print("D1A UNIT 1 MILITARY FREEZE OK: exact approved package unchanged")
