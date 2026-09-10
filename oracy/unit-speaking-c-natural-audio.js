(function(){
'use strict';
const EDGE='/oracy/session',A='marin',B='cedar',RATE=1.13,GAP=.035;
const DIALOGUE_STYLE='Speak like two lively, engaged adults having a real conversation in India, using clear UK English. Sound alert, warm and spontaneous, with crisp reactions and natural sentence stress. Keep the pace energetic but easy to follow. Do not sound tired, slow, flat, formal, robotic or like a textbook reading.';
const QUESTION_STYLE='Ask the question exactly as written, in clear UK English. Sound lively, warm and attentive. Use natural question intonation and a normal conversational pace. Do not add, omit or paraphrase any words.';
const D={
'captivating':['A: That dance was brilliant.','B: It really was — completely captivating.','A: I forgot how long we’d been standing there.','B: Same. I didn’t want it to end.'],
'bewildered':['A: You look lost. Everything all right?','B: I’m a bit bewildered, actually. Which counter is for online tickets?','A: The one on the left, next to the enquiry desk.','B: Ah, got it. Thanks.'],
'reassuring':['A: Mum sounded worried after the call.','B: She did, but the doctor was very reassuring.','A: Good. Did he explain what happens next?','B: Yes, and that calmed her down.'],
'articulate':['A: Riya explained that really well.','B: She’s very articulate when she speaks about something she knows.','A: True. She keeps it simple as well.','B: Exactly — clear, but never dull.'],
'hesitant':['A: Are you ordering the thali?','B: I’m a little hesitant. It looks very spicy.','A: Ask them to make it mild.','B: Good idea. I’ll try it.'],
'pick up':['A: Your Marathi’s getting better.','B: I’ve picked up quite a bit from my neighbours.','A: Without taking classes?','B: Mostly just by listening and using it every day.'],
'brush up on':['A: Ready for the quiz tonight?','B: Almost. I need to brush up on Indian geography.','A: Rivers again?','B: Rivers and state capitals. They always get me.'],
'keep up with':['A: That guide talks fast.','B: I know. I’m struggling to keep up with him.','A: Shall I ask him to slow down?','B: Please do. I’ve already missed two dates.'],
'open up':['A: Dev’s talking a lot more now.','B: Yes, he’s really opened up since he joined the music club.','A: He seems much more relaxed.','B: Finding his kind of people helped.'],
'get by':['A: Do you speak Malayalam?','B: Just enough to get by.','A: So, food, directions, that sort of thing?','B: Exactly. Nothing complicated.'],
'gradually':['A: Was the climb steep from the start?','B: No, it got steeper gradually.','A: That must have helped.','B: Definitely. We had time to get used to it.'],
'noticeably':['A: The market’s quiet today.','B: Noticeably quieter than yesterday.','A: Probably the rain.','B: Most likely. Half the shops opened late as well.'],
'take in':['A: This museum is huge.','B: There’s too much to take in at once.','A: Want to come back tomorrow?','B: Yes. I’d rather enjoy a few sections properly.'],
'work out':['A: Which Metro gate do we need?','B: Give me a second. I’m trying to work it out.','A: I think Gate Three is closest.','B: You’re right. Let’s go.'],
'come across as':['A: Did I sound rude just now?','B: No. You came across as firm, not rude.','A: Good. I didn’t want to sound impatient.','B: You were clear. That’s all.']
};
const C=new Map();let ctx=null,S=[];
const clean=s=>String(s||'').replace(/^\s*[AB]\s*:\s*/i,'').trim();
const who=(s,i)=>((String(s||'').match(/^\s*([AB])\s*:/i)||[])[1]||((i%2)?'B':'A')).toUpperCase();
const hash=s=>{let h=2166136261;for(const ch of String(s||'')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return (h>>>0).toString(36)};
function audioContext(){if(ctx)return ctx;const X=window.AudioContext||window.webkitAudioContext;if(!X)throw new Error('Audio is not supported.');ctx=new X();return ctx}
function stop(){S.forEach(s=>{try{s.stop()}catch{}});S=[]}
async function seg(text,voice,key,style=DIALOGUE_STYLE){const k=key+'|'+voice+'|'+hash(text)+'|'+hash(style);if(C.has(k))return C.get(k);const p=(async()=>{const r=await fetch(EDGE,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'tts',unit_no:31,text,voice,instructions:style,passage_id:'c1a-u1-audio-v3-'+k})});if(!r.ok)throw new Error('Audio is unavailable.');return await r.blob()})();C.set(k,p);try{return await p}catch(e){C.delete(k);throw e}}
async function decode(blob){return audioContext().decodeAudioData(await blob.arrayBuffer())}
async function prep(drill){const rows=[...drill.querySelectorAll('.model > div')].map(x=>x.textContent.trim()).filter(x=>/^\s*[AB]\s*:/i.test(x));return Promise.all(rows.map((row,i)=>seg(clean(row),who(row,i)==='A'?A:B,(drill.dataset.kp||'')+'-'+(drill.dataset.vi||'')+'-'+i)))}
async function playDialogue(btn){const drill=btn.closest('.c-vocab-drill'),status=drill?.querySelector('.c-audio-status');if(!drill)return;btn.disabled=true;if(status)status.textContent='';try{const c=audioContext();await c.resume();stop();const blobs=await prep(drill),buffers=await Promise.all(blobs.map(decode));let at=c.currentTime+.025;buffers.forEach((buffer,i)=>{const src=c.createBufferSource();src.buffer=buffer;src.playbackRate.value=RATE;src.connect(c.destination);src.start(at);S.push(src);at+=buffer.duration/RATE+(i<buffers.length-1?GAP:0)})}catch(e){if(status)status.textContent=e.message||'Model audio is unavailable.'}finally{btn.disabled=false}}
async function playQuestion(btn){const U=window.ORACY_UNIT,id=btn.dataset.questionAudio,text=String(U?.oral?.[id]?.question||'').trim();if(!text)return;btn.disabled=true;try{const c=audioContext();await c.resume();stop();const blob=await seg(text,A,'question-'+id+'-'+hash(text),QUESTION_STYLE),buffer=await decode(blob),src=c.createBufferSource();src.buffer=buffer;src.playbackRate.value=1.08;src.connect(c.destination);src.start(c.currentTime+.02);S=[src]}finally{btn.disabled=false}}
function replace(){const drills=[...document.querySelectorAll('.c-vocab-drill')];if(drills.length<15)return false;drills.forEach(drill=>{const target=(drill.querySelector('h3')?.textContent||'').trim().toLowerCase(),lines=D[target],model=drill.querySelector('.model');if(!lines||!model)return;const controls=[...model.children].find(x=>x.querySelector?.('.c-listen'));[...model.children].filter(x=>x.tagName==='DIV'&&!x.querySelector?.('.c-listen')).forEach(x=>x.remove());let a=model.querySelector('b');lines.forEach(line=>{const d=document.createElement('div');d.textContent=line;a.insertAdjacentElement('afterend',d);a=d});if(controls)model.appendChild(controls)});return true}
let attached=false;
function attach(){if(attached)return true;if(!replace())return false;attached=true;document.addEventListener('click',e=>{const d=e.target.closest('.c-listen');if(d){e.preventDefault();e.stopImmediatePropagation();playDialogue(d);return}const q=e.target.closest('.hear-question');if(q&&Number(window.ORACY_UNIT?.unitNo)===31){e.preventDefault();e.stopImmediatePropagation();playQuestion(q)}},true);const drills=[...document.querySelectorAll('.c-vocab-drill')];if('IntersectionObserver'in window){const o=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;prep(e.target).catch(()=>{});o.unobserve(e.target)}),{rootMargin:'1200px 0px'});drills.forEach(d=>o.observe(d))}return true}
let n=0;const t=setInterval(()=>{n++;if(attach()||n>40)clearInterval(t)},75);
})();
