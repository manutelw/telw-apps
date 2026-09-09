from pathlib import Path
import json, re, subprocess

ROOT=Path(__file__).resolve().parents[2]
LEVELS={'B1A':range(1,8),'B1B':range(8,16),'B2A':range(16,23),'B2B':range(23,31)}

def blob(path): return subprocess.check_output(['git','hash-object',path],cwd=ROOT,text=True).strip()
def load(n):
    raw=(ROOT/f'oracy/unit-{n}-content.js').read_text()
    return json.loads(raw.removeprefix('window.ORACY_UNIT=').removesuffix(';\n'))
def check_lock(path):
    for raw in path.read_text().splitlines():
        if not raw or raw.startswith('#'): continue
        expected,name=raw.split(None,1)
        assert (ROOT/name).exists(),f'Frozen file missing: {name}'
        assert blob(name)==expected,f'FROZEN ORACY CHANGE: {name}'

check_lock(ROOT/'.github/oracy-unit3.lock')
for n in range(4,31):
    h=ROOT/f'oracy/unit-{n}.html'; c=ROOT/f'oracy/unit-{n}-content.js'
    assert h.exists() and c.exists(),f'Unit {n} files missing'
    u=load(n)
    assert u['unitNo']==n and u['level']==next(k for k,v in LEVELS.items() if n in v)
    assert len(u['keyPoints'])==3 and len(u['checks'])==12
    assert set(u['oral'])=={'q5','q10'} and set(u['pron'])=={'q11','q12','q13','q14','q15'}
    assert set(u['speaking'])=={'s1','s2','s3','s4','s5'}
    assert len(u['passages']['kp2'])==15
    assert 'unit-renderer.js' in h.read_text() and 'conversation-shared.js' in h.read_text()
    check_lock(ROOT/f'.github/oracy-unit{n}.lock')

for level,nums in LEVELS.items():
    check_lock(ROOT/f'.github/oracy-level-{level}.lock')
check_lock(ROOT/'.github/oracy-b1a-b2b-package.lock')

worker=(ROOT/'worker.js').read_text(); shared=(ROOT/'oracy/unit-shared.js').read_text(); conv=(ROOT/'oracy/conversation-shared.js').read_text(); voice=(ROOT/'supabase/functions/oracy-voice/index.ts').read_text()
assert r'unit-(\d+)' in worker and 'validLearnerUnit' in worker and "'/oracy/?locked=1'" in worker
assert 'setTimeout(()=>preload()' in shared and 'RTCPeerConnection' in conv and 'silence_duration_ms:350' in voice
print('ORACY Units 1-30, four level freezes and final package lock OK')
