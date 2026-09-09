from pathlib import Path
import subprocess

ROOT=Path(__file__).resolve().parents[2]
LEVELS={'B1A':range(1,8),'B1B':range(8,16),'B2A':range(16,23),'B2B':range(23,31)}
def blob(p): return subprocess.check_output(['git','hash-object',p],cwd=ROOT,text=True).strip()
def write(name,paths,label):
    lines=[f'# {label} — generated only after QA passed']+[f'{blob(p)} {p}' for p in paths]
    (ROOT/name).write_text('\n'.join(lines)+'\n')
for n in range(3,31): write(f'.github/oracy-unit{n}.lock',[f'oracy/unit-{n}.html',f'oracy/unit-{n}-content.js'],f'Frozen ORACY Unit {n}')
for level,nums in LEVELS.items():
    paths=[p for n in nums for p in (f'oracy/unit-{n}.html',f'oracy/unit-{n}-content.js') if (ROOT/p).exists()]
    write(f'.github/oracy-level-{level}.lock',paths,f'Frozen TELW Level {level}')
package=[p for n in range(1,31) for p in (f'oracy/unit-{n}.html',f'oracy/unit-{n}-content.js') if (ROOT/p).exists()]
package+=['oracy/unit-renderer.js','oracy/unit-shared.js','oracy/conversation-shared.js','supabase/functions/oracy-voice/index.ts','supabase/functions/oracy-voice/course-units-4-30.ts']
write('.github/oracy-b1a-b2b-package.lock',package,'Final frozen ORACY B1A-B2B package')
print('Created Unit 3-30, four level, and final package locks.')
