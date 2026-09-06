from pathlib import Path
import re

path = Path('pi-lab/index.html')
s = path.read_text()

old_open = "function openApp(mode){accessMode=mode;document.getElementById('gate').style.display='none';document.getElementById('app').style.display='block';build()}"
new_open = "function openApp(mode){accessMode=mode;document.getElementById('gate').style.display='none';document.getElementById('app').style.display='block';build();startAudioPreload()}"
if s.count(old_open) != 1:
    raise SystemExit('openApp target not found exactly once')
s = s.replace(old_open, new_open, 1)

marker = "\nasync function playBlob(blob)"
if s.count(marker) != 1:
    raise SystemExit('playBlob marker not found exactly once')
preload = r'''
const audioCache=new Map();
function audioKey(i,kind){return `${i}:${kind}`}
function prepareAudio(i,kind){
  if(i<0||i>=ITEMS.length||!voiceToken)return Promise.resolve(null);
  const key=audioKey(i,kind);
  if(!audioCache.has(key)){
    const item=ITEMS[i];
    const job=speak(kind==='q'?item.q:item.a,kind==='q'?'neeti_student':'arjun_student',kind).catch(e=>{audioCache.delete(key);throw e});
    audioCache.set(key,job)
  }
  return audioCache.get(key)
}
function preloadCard(i){
  if(i<0||i>=ITEMS.length||!voiceToken)return;
  prepareAudio(i,'q').catch(()=>{});
  prepareAudio(i,'a').catch(()=>{})
}
function startAudioPreload(){
  if(!voiceToken)return;
  preloadCard(0);
  setTimeout(()=>preloadCard(1),200);
  const cards=[...document.querySelectorAll('.qcard')];
  if(!('IntersectionObserver' in window))return;
  const observer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(!entry.isIntersecting)return;
      const i=cards.indexOf(entry.target);
      if(i>=0){preloadCard(i);preloadCard(i+1)}
    })
  },{rootMargin:'600px 0px'});
  cards.forEach(card=>observer.observe(card))
}
'''
s = s.replace(marker, '\n' + preload + marker, 1)

pattern = r"async function playText\(i,kind,btn\)\{.*?\}\nasync function toggleRecord"
matches = list(re.finditer(pattern, s, re.S))
if len(matches) != 1:
    raise SystemExit(f'playText target count {len(matches)}')
new_play = """async function playText(i,kind,btn){const status=document.getElementById('s'+i);try{btn.disabled=true;const cached=audioCache.has(audioKey(i,kind));status.textContent=cached?'Playing…':'Preparing audio…';const blob=await prepareAudio(i,kind);status.textContent=kind==='q'?'Interviewer speaking…':'Model candidate speaking…';await playBlob(blob);status.textContent='Ready.';preloadCard(i+1)}catch(e){status.textContent=e.message||'Audio unavailable.'}finally{btn.disabled=false}}\nasync function toggleRecord"""
s = s[:matches[0].start()] + new_play + s[matches[0].end():]

path.write_text(s)
