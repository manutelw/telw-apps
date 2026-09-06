from pathlib import Path
p=Path('pi-lab/index.html')
s=p.read_text()
old="kind==='q'?'neeti':'coach'"
new="kind==='q'?'neeti_student':'arjun_student'"
if old not in s:
    raise SystemExit('Expected PI voice mapping not found')
s=s.replace(old,new,1)
p.write_text(s)
print('PI voices mapped to marin female interviewer and cedar male candidate via existing ASCENT voice roles.')
