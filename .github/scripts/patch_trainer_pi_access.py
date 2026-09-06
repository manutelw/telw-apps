from pathlib import Path

p=Path('ascent/trainer-results-summary.js')
s=p.read_text()
old='''  function addCatTrainerLink(){\n    if(document.getElementById("catSimulatorTrainerLink")) return;'''
new='''  function addPiTrainerLink(){\n    if(document.getElementById("piLabTrainerLink")) return;\n    const nav=document.querySelector(".sidebar .nav-list");\n    if(!nav) return;\n    const link=document.createElement("a");\n    link.id="piLabTrainerLink";\n    link.className="nav-item";\n    link.href="../pi-lab/?trainer=1";\n    link.target="_blank";\n    link.rel="noopener noreferrer";\n    link.style.display="block";\n    link.style.textDecoration="none";\n    link.textContent="PI Question Bank";\n    nav.appendChild(link);\n  }\n\n  function addCatTrainerLink(){\n    if(document.getElementById("catSimulatorTrainerLink")) return;'''
if s.count(old)!=1: raise SystemExit('trainer insertion target not found')
s=s.replace(old,new,1)
old2='''  document.addEventListener("DOMContentLoaded",function(){\n    addCatTrainerLink();'''
new2='''  document.addEventListener("DOMContentLoaded",function(){\n    addPiTrainerLink();\n    addCatTrainerLink();'''
if s.count(old2)!=1: raise SystemExit('trainer DOM target not found')
s=s.replace(old2,new2,1)
p.write_text(s)

p=Path('pi-lab/index.html')
s=p.read_text()
old="const TEST_MODE=new URLSearchParams(location.search).get('test')==='1';"
new="const PARAMS=new URLSearchParams(location.search);\nconst TEST_MODE=PARAMS.get('test')==='1';\nconst FORCE_TRAINER_LOGIN=PARAMS.get('trainer')==='1';"
if s.count(old)!=1: raise SystemExit('PI params target not found')
s=s.replace(old,new,1)
start=s.find('async function init(){')
end=s.find('\nasync function trainerLogin',start)
if start<0 or end<0: raise SystemExit('PI init block not found')
new_init="""async function init(){
  const admin=validSession(ADMIN_KEY)||(()=>{const s=validSession(TRAINER_KEY);return String(s?.role||'').toUpperCase()==='ADMIN'?s:null})();
  if(admin){voiceToken=await adminVoiceToken(admin);openApp('admin');return}
  if(FORCE_TRAINER_LOGIN){
    document.getElementById('gateTitle').textContent='Trainer access';
    document.getElementById('gateText').textContent='Sign in again with the same email address and password you use for the ASCENT Trainer Portal.';
    document.getElementById('trainerLoginForm').style.display='grid';
    return
  }
  const student=validSession(STUDENT_KEY);
  if(student){voiceToken=student.sessionToken;openApp('student');return}
  const trainer=validSession(TRAINER_KEY);
  if(trainer){voiceToken=trainer.sessionToken;openApp('trainer');return}
  if(TEST_MODE){openApp('test');return}
  document.getElementById('gateTitle').textContent='Trainer access';
  document.getElementById('gateText').textContent='Use the same email address and password you use for the ASCENT Trainer Portal.';
  document.getElementById('trainerLoginForm').style.display='grid'
}"""
s=s[:start]+new_init+s[end:]
p.write_text(s)
