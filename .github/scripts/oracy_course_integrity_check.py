from pathlib import Path
import json, subprocess

ROOT=Path(__file__).resolve().parents[2]
LEVELS={'B1A':range(1,8),'B1B':range(8,16),'B2A':range(16,23),'B2B':range(23,31)}
SHARED_RUNTIME={
    'worker-oracy.js',
    'oracy/unit-speaking-gym-v2.js',
    'oracy/unit-speaking-model-natural.js',
    'oracy/unit-speaking-model-coherent.js',
    'oracy/unit-speaking-model-target-cued.js',
    'oracy/unit-speaking-model-quality.js',
}

def blob(path): return subprocess.check_output(['git','hash-object',path],cwd=ROOT,text=True).strip()
def load(n):
    raw=(ROOT/f'oracy/unit-{n}-content.js').read_text()
    return json.loads(raw.removeprefix('window.ORACY_UNIT=').removesuffix(';\n'))
def lock_paths(path):
    out=[]
    for raw in path.read_text().splitlines():
        if not raw or raw.startswith('#'): continue
        expected,name=raw.split(None,1)
        assert (ROOT/name).exists(),f'Frozen file missing: {name}'
        assert blob(name)==expected,f'BALLISTIC ORACY LOCK: frozen baseline changed: {name}'
        out.append(name)
    return set(out)

# UNIT-WISE FREEZE: every Unit 1-30 has an exact content/file lock.
for n in range(1,31):
    lock=ROOT/f'.github/oracy-unit{n}.lock'
    assert lock.exists(),f'Unit {n} freeze lock missing'
    lock_paths(lock)

# Structural contract for the generated/shared-engine units.
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

# SHARED RUNTIME FREEZE: speaking gym, model dialogues, audio/rendering and ORACY service path.
runtime_lock=ROOT/'.github/oracy-runtime-units2-30.lock'
assert runtime_lock.exists(),'Units 2-30 runtime lock missing'
runtime_paths=lock_paths(runtime_lock)
assert SHARED_RUNTIME <= runtime_paths,'Approved speaking/model runtime is not fully frozen'

# LEVEL-WISE FREEZE: each B1A/B1B/B2A/B2B manifest must validate its units and shared speaking runtime.
for level,nums in LEVELS.items():
    level_lock=ROOT/f'.github/oracy-level-{level}.lock'
    paths=lock_paths(level_lock)
    for n in nums:
        assert f'oracy/unit-{n}.html' in paths,f'{level} lock missing Unit {n} HTML'
        if n>=2:
            assert f'oracy/unit-{n}-content.js' in paths,f'{level} lock missing Unit {n} content'
    assert SHARED_RUNTIME <= paths,f'{level} lock missing approved shared speaking runtime'

# FINAL PACKAGE FREEZE: whole B1A-B2B release, including the current shared runtime.
package_paths=lock_paths(ROOT/'.github/oracy-b1a-b2b-package.lock')
assert SHARED_RUNTIME <= package_paths,'Final ORACY package missing approved shared runtime'
for n in range(1,31):
    assert f'oracy/unit-{n}.html' in package_paths,f'Final package missing Unit {n} HTML'
    if n>=2: assert f'oracy/unit-{n}-content.js' in package_paths,f'Final package missing Unit {n} content'

# Keep non-exact checks on the multi-app base worker so unrelated apps remain independently maintainable.
worker=(ROOT/'worker.js').read_text(); shared=(ROOT/'oracy/unit-shared.js').read_text(); conv=(ROOT/'oracy/conversation-shared.js').read_text(); voice=(ROOT/'supabase/functions/oracy-voice/index.ts').read_text()
assert r'unit-(\d+)' in worker and 'validLearnerUnit' in worker and "'/oracy/?locked=1'" in worker
assert 'setTimeout(()=>preload()' in shared and 'for(const load of fast)' in shared
assert 'Promise.all(segs.map' not in shared and 'let next=getAudio(segs[0][2]' in shared
assert 'RTCPeerConnection' in conv and 'silence_duration_ms:350' in voice
assert 'for(let attempt=0;attempt<3;attempt++)' in voice and 'r.status===429||r.status>=500' in voice
print('BALLISTIC ORACY FREEZE OK: Units 1-30 unit-wise, B1A-B2B level-wise, shared runtime and final package locked')
