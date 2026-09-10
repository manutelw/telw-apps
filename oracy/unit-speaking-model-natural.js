// ORACY Units 2-30: natural, non-repeating human model conversations for vocabulary drills.
// Runs after unit-speaking-gym-v2.js. It does not alter frozen unit content.
(function(){
'use strict';
const U=window.ORACY_UNIT, EDGE='/oracy/session';
if(!U||Number(U.unitNo)<2||Number(U.unitNo)>30)return;
const UNIT=Number(U.unitNo),LEVEL=String(U.level||'');
const cache=new Map(),seen=new Set();let ctx=null,sources=[];
function norm(v){return String(v||'').toLowerCase().replace(/[’']/g,"'").replace(/[^a-z0-9' ]+/g,' ').replace(/\s+/g,' ').trim()}
function splitSentences(text){return String(text||'').match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map(x=>x.trim()).filter(Boolean)||[]}
function passage(kp){return U.passages?.[`kp${kp+1}`]||[]}
function metaLine(s){return /welcome to|listen for|target language|speaker explains|want to use|what does .* add|practis|main point clearer|complete sentence|organise the explanation|unit \d+ asks|make the meaning|hear or read it in context/i.test(String(s||''))}
function dialogueWindow(kp,item){
 const segs=passage(kp),target=norm(item),hit=segs.findIndex(x=>norm(x?.[2]).includes(target)&&!metaLine(x?.[2]));
 if(hit<0)return null;
 const named=segs.filter(x=>String(x?.[0]||'').trim()).length>=Math.min(2,segs.length);
 if(named&&segs.length>=2){
   for(let offset=-2;offset<=1;offset++){
     const start=Math.max(0,Math.min(hit+offset,segs.length-4)),chunk=segs.slice(start,start+4);
     if(chunk.length<4||chunk.some(x=>metaLine(x?.[2])))continue;
     const names=[];chunk.forEach(x=>{const n=String(x?.[0]||'').trim();if(n&&!names.includes(n))names.push(n)});
     const map=new Map();if(names[0])map.set(names[0],'A');if(names[1])map.set(names[1],'B');
     return chunk.map((x,i)=>`${map.get(String(x?.[0]||'').trim())||(i%2?'B':'A')}: ${String(x?.[2]||'').trim()}`);
   }
 }
 const all=segs.flatMap(x=>splitSentences(x?.[2]||'')).filter(x=>!metaLine(x)),si=all.findIndex(x=>norm(x).includes(target));
 if(si>=0){const first=all[si],next=all[si+1]||all[Math.max(0,si-1)]||'';return [`A: What happened?`,`B: ${first}`,`A: And after that?`,`B: ${next||'That was the important part.'}`]}
 return null;
}
function noteExample(item){const n=norm(item);for(const value of Object.values(U.notes||{})){const t=String(value||'');if(!norm(t).includes(n)||metaLine(t))continue;const m=t.match(/Try:\s*[“"]([^”"]+)/i);if(m&&!metaLine(m[1]))return m[1].trim()}return ''}
const FIXED={
 'once':'I’ve tried it once, and I’d do it again.','several times':'I’ve checked it several times already.','before':'I’ve seen this before.','ever':'Have you ever tried it this way?','never':'I’ve never done that before.','unforgettable':'The whole evening was unforgettable.',
 'book a table':'I’ll book a table for eight o’clock.','available':'The smaller room is available tonight.','set up':'We’ll set up the tables before the guests arrive.','bring along':'Bring along a light jacket in case it gets cold.','confirm':'I’ll confirm the booking this afternoon.','sounds good':'Sounds good. Let’s do that.',
 'so far':'So far, the plan is working well.','already':'We’ve already finished the first part.','just':'I’ve just checked the final details.','yet':'We haven’t finished yet.','since':'I’ve been working on it since Monday.','make progress':'We’re finally starting to make progress.',
 'get through':'I couldn’t get through, so I left a message.','hold on':'Hold on a second while I find the number.','cut off':'We got cut off halfway through the call.','call back':'I’ll call back after lunch.','voicemail':'I left a short voicemail.','somewhere else':'Let’s try somewhere else; it’s too noisy here.',
 'lately':'I’ve been walking more often lately.','recently':'I changed my routine recently.','last time':'Last time, we took a different route.','take up':'I’m thinking of taking up swimming.','give up':'I don’t want to give up after one bad week.','make a habit of':'I’m trying to make a habit of reading before bed.',
 'landmark':'The clock tower is the easiest landmark to spot.','shortcut':'There’s a shortcut behind the library.','entrance':'The main entrance is across from the café.','across from':'The pharmacy is across from the bank.','get around':'The metro is the easiest way to get around.','either way':'Either way, we’ll reach the station before noon.',
 'allowed':'Guests are allowed to use the kitchen.','required':'A photo ID is required at reception.','optional':'The evening session is optional.','considerate':'It’s considerate to keep the music low at night.','disturb':'I don’t want to disturb anyone who is sleeping.','fair enough':'Fair enough. We can try your idea first.',
 'damaged':'The box arrived damaged.','missing':'One of the items is missing.','replace':'Could you replace the broken lid, please?','refund':'I’d prefer a refund this time.','sort out':'I hope we can sort out the problem today.',"i'm afraid":"I’m afraid the order arrived damaged.",
 'quietly':'He closed the door quietly.','suddenly':'The lights suddenly went out.','carefully':'She checked the window carefully.','suspicious':'The open gate looked suspicious.','ordinary':'At first, it looked like an ordinary evening.','to my surprise':'To my surprise, the neighbour knew exactly what had happened.',
 'crowded':'The café is crowded after six.','spacious':'The upstairs room is surprisingly spacious.','affordable':'The lunch menu is affordable.','overrated':'I think that place is overrated.','worth it':'The wait was long, but the food was worth it.','by far':'This is by far the best option.',
 'collect':'We collect the fruit peels in a separate bin every morning.','separate':'We separate the food waste from plastic before processing it.','crush':'After the peels are dry, we crush them into small pieces.','mould':'Then we mould the mixture into small plant pots.','reusable':'The finished pot is reusable, so it does not need to be thrown away.','in order to':'We dry the peels in order to remove extra moisture.',
 'organise':'We’ll organise the volunteers into three small teams.','approve':'The council approved the revised plan this morning.','volunteer':'I’d volunteer for the early shift.','postpone':'We may have to postpone the event until Saturday.','restore':'The team worked overnight to restore the lights.','recommend':'I’d recommend using the covered area if it rains.',
 'welcoming':'The new entrance feels bright and welcoming.','accessible':'The ground floor is fully accessible.','quiet zone':'The top floor has a quiet zone for individual study.','mixed views':'There are mixed views about the new layout.','point out':'Several students pointed out that the signs are hard to see.','according to':'According to the survey, most visitors like the new space.',
 'backup':'We keep a battery backup for power cuts.','power cut':'There was a power cut just after dinner.','charge up':'Charge up your phone before the storm arrives.','manage without':'We can manage without the lift for a few hours.','by yourself':'Don’t move the heavy cabinet by yourself.','as soon as':'I’ll message you as soon as the power returns.',
 'notice':'I noticed a strange sound near the door.','interrupt':'I didn’t want to interrupt the meeting.','freeze':'Everyone froze when the alarm sounded.','spill':'I spilled my coffee when the lights went out.','rush over':'Two people rushed over to help.','all of a sudden':'All of a sudden, the whole room went quiet.',
 'stiff':'My shoulders feel stiff after a long day at the desk.','worn out':'I felt completely worn out by Friday.','hydrated':'I feel better when I stay hydrated.','balanced':'I’m trying to eat a more balanced lunch.','cut down on':'I’m trying to cut down on sugary drinks.','it may help':'It may help to take a short walk after lunch.',
 'traffic-free':'A traffic-free street would be safer for children.','practical':'The idea sounds practical during the weekend.','inconvenient':'It could be inconvenient for people carrying heavy bags.','pedestrian':'The new pedestrian area would need better bus links.','alternative':'Cycling could be a useful alternative.','on the other hand':'On the other hand, some residents still need car access.',
 'in stock':'The blue version is still in stock.','exchange':'Could I exchange this for a larger size?','receipt':'I’ve got the receipt with me.','counter':'You can collect it at the service counter.','delivery slot':'The earliest delivery slot is Thursday morning.','let me check':'Let me check whether another size is available.',
 'work on':'I’ve been working on the presentation all week.','keep at':'Keep at it; the difficult part is nearly finished.','fall behind':'I fell behind when two deadlines arrived together.','catch up':'I stayed late yesterday to catch up.','take shape':'The project is finally starting to take shape.','for ages':'I’ve been thinking about this for ages.',
 'awkward':'The silence felt awkward after that comment.','thoughtful':'That was a thoughtful way to respond.','formal':'The first email sounded too formal.','casual':'The message is friendly and casual.','tactful':'She was tactful when she disagreed.','to be honest':'To be honest, I’d choose the simpler version.',
 'loosen':'Loosen the screw before you remove the cover.','tighten':'Tighten it gently after the parts are lined up.','plug in':'Plug in the cable only after the casing is closed.','take apart':'We may need to take the unit apart.','line up':'Line up the two marks before you tighten the screw.','make sure':'Make sure the power is switched off first.',
 'have in common':'We discovered that we have a lot in common.','keen on':'I’m really keen on street photography.','can\'t stand':'I can’t stand very loud music.','get on with':'I get on with my new neighbour really well.','curious':'I was curious about how she learned it.','no way':'No way! I didn’t expect that.',
 'old-fashioned':'The old radio looks old-fashioned now.','convenient':'Messaging is convenient, but I still like phone calls.','time-consuming':'Writing everything by hand was time-consuming.','keep in touch':'We used letters to keep in touch.','look back':'I sometimes look back at old family photographs.','back then':'Back then, we didn’t carry a screen everywhere.',
 'absorbing':'The puzzle is difficult but completely absorbing.','demanding':'The hobby is demanding when you first start.','rewarding':'Learning the technique is slow but rewarding.','frustrating':'It can be frustrating when one small mistake ruins the result.','satisfying':'Finishing a difficult piece is very satisfying.','what keeps me going':'Seeing small improvements is what keeps me going.',
 'miss a chance':'I missed a chance to leave on the earlier train.','turn out':'The delay turned out to be useful in the end.','make up for':'I tried to make up for the lost time.','overlook':'I overlooked one important detail.','learn the hard way':'I learned the hard way that ten minutes can matter.','looking back':'Looking back, I should have checked the platform earlier.',
 'clue':'The wet footprints were the first useful clue.','likely explanation':'A reflection from a boat is the most likely explanation.','rule out':'We can rule out a plane because the light did not move.','assume':'I don’t want to assume it was a drone without evidence.','evidence':'We need more evidence before we decide.','apparently':'Apparently, three other people saw the same light.',
 'turning point':'That conversation was a turning point for me.','perspective':'The experience changed my perspective.','take away':'The main thing I took away was to ask better questions.','make a difference':'One small change can make a real difference.','put into practice':'I started to put the advice into practice the next day.','even though':'Even though it was difficult, I kept going.'
};
function authoredExample(item){const target=norm(item);for(let kp=0;kp<3;kp++)for(const row of passage(kp)){const text=String(row?.[2]||'');if(norm(text).includes(target)&&!metaLine(text))return text}return ''}
function useSentence(item){return FIXED[norm(item)]||noteExample(item)||authoredExample(item)||`I found a natural way to use ${item} in this situation.`}
const PATTERNS=[
 s=>[`A: Are we ready to start?`,`B: ${s}`,`A: Good. What comes next?`,`B: Let’s check the result before we move on.`],
 s=>[`A: Something doesn’t look right here.`,`B: ${s}`,`A: That should help.`,`B: Yes, let’s see what happens.`],
 s=>[`A: What did you decide?`,`B: ${s}`,`A: That makes sense.`,`B: It should keep things simple.`],
 s=>[`A: Can you show me how this works?`,`B: ${s}`,`A: Got it. What should I watch for?`,`B: The next step should make it clear.`],
 s=>[`A: I wasn’t sure what to do next.`,`B: ${s}`,`A: Okay, that gives us a direction.`,`B: Exactly. Let’s try it.`],
 s=>[`A: We need a practical solution.`,`B: ${s}`,`A: That could work.`,`B: Let’s test it before we decide.`],
 s=>[`A: How did it go this time?`,`B: ${s}`,`A: Better than before?`,`B: Yes, much better.`],
 s=>[`A: What’s the plan for today?`,`B: ${s}`,`A: Fine. Who’s taking the next part?`,`B: I can do that.`],
 s=>[`A: I think we’re missing one step.`,`B: ${s}`,`A: Ah, right.`,`B: Then we’re ready to continue.`],
 s=>[`A: What would you change?`,`B: ${s}`,`A: I like that.`,`B: It makes the process clearer.`],
 s=>[`A: Did anything surprise you?`,`B: ${s}`,`A: Really?`,`B: Yes, I didn’t expect it at first.`],
 s=>[`A: What should we tell the others?`,`B: ${s}`,`A: Keep it that simple?`,`B: Yes. One clear message is enough.`],
 s=>[`A: Shall we leave it as it is?`,`B: ${s}`,`A: Good point.`,`B: We can make the change now.`],
 s=>[`A: What happened after that?`,`B: ${s}`,`A: And did that solve it?`,`B: It moved things in the right direction.`],
 s=>[`A: Before we finish, what matters most?`,`B: ${s}`,`A: Right. Let’s keep that in the final version.`,`B: Agreed.`]
];
function structuralSignature(lines,item){const t=norm(item);return lines.map(x=>norm(x).replaceAll(t,'<target>')).join('|')}
function variedModel(kp,vi,item){const s=useSentence(item),slot=(kp*5+vi)%PATTERNS.length;for(let n=0;n<PATTERNS.length;n++){const lines=PATTERNS[(slot+n)%PATTERNS.length](s),sig=structuralSignature(lines,item);if(!seen.has(sig)){seen.add(sig);return lines}}return PATTERNS[slot](s)}
function linesFor(kp,vi,item){const authored=dialogueWindow(kp,item);if(authored){const sig=structuralSignature(authored,item);if(!seen.has(sig)){seen.add(sig);return authored}}return variedModel(kp,vi,item)}
function speaker(line){const a=/^A:/.test(line);return {voice:a?'marin':'cedar',text:String(line||'').replace(/^[AB]:\s*/,'')}}
function key(kp,vi,si,item){return `oracy-${LEVEL.toLowerCase()}-u${UNIT}-natural-model-${kp}-${vi}-${si}-${norm(item).replace(/\s+/g,'-')}-v3`}
async function blobFor(kp,vi,si,item,line){const k=key(kp,vi,si,item);if(cache.has(k))return cache.get(k);const s=speaker(line),p=(async()=>{const r=await fetch(EDGE,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'tts',text:s.text,voice:s.voice,instructions:'Sound like two real adults having a natural, friendly conversation. Use normal reactions, natural sentence stress and B1/B2-friendly pace. Never sound like a language drill or textbook recital.',unit_no:UNIT,passage_id:k})});if(!r.ok)throw new Error(`Model audio could not be prepared (HTTP ${r.status}).`);return r.blob()})();cache.set(k,p);try{return await p}catch(e){cache.delete(k);throw e}}
async function prepare(kp,vi,item,lines){return Promise.all(lines.map((x,i)=>blobFor(kp,vi,i,item,x)))}
function audioContext(){if(ctx)return ctx;const C=window.AudioContext||window.webkitAudioContext;if(!C)throw new Error('Audio is not supported in this browser.');ctx=new C();return ctx}
function stop(){sources.forEach(s=>{try{s.stop()}catch{}});sources=[]}
async function play(kp,vi,item,lines,btn,status){try{const c=audioContext();await c.resume();stop();btn.disabled=true;status.textContent='Preparing model conversation…';const blobs=await prepare(kp,vi,item,lines),buffers=await Promise.all(blobs.map(b=>b.arrayBuffer().then(a=>c.decodeAudioData(a))));let when=c.currentTime+.05;buffers.forEach((b,i)=>{const s=c.createBufferSource();s.buffer=b;s.connect(c.destination);s.start(when);sources.push(s);when+=b.duration+(i<buffers.length-1?.14:0)});status.textContent='Playing model conversation.';setTimeout(()=>{if(status.textContent==='Playing model conversation.')status.textContent='Ready to replay.'},Math.max(300,(when-c.currentTime)*1000))}catch(e){status.textContent=e.message||'Model audio could not be played.'}finally{btn.disabled=false}}
function upgrade(box){if(box.dataset.naturalModel==='1')return;const kp=Number(box.dataset.kp||0),vi=Number(box.dataset.vi||0),item=box.querySelector('h3')?.textContent?.trim();if(!item)return;const model=box.querySelector('.oracy-v2-model'),oldBtn=model?.querySelector('.v2-listen'),status=model?.querySelector('.v2-audio-status');if(!model||!oldBtn||!status)return;const lines=linesFor(kp,vi,item);[...model.children].filter(x=>x.tagName==='DIV'&&!x.classList.contains('oracy-v2-audio')).forEach(x=>x.remove());const audioWrap=model.querySelector('.oracy-v2-audio');lines.forEach(line=>{const d=document.createElement('div');d.textContent=line;model.insertBefore(d,audioWrap)});const btn=oldBtn.cloneNode(true);oldBtn.replaceWith(btn);btn.addEventListener('click',()=>play(kp,vi,item,lines,btn,status));box.dataset.naturalModel='1';box._oracyNaturalLines=lines}
function install(){const boxes=[...document.querySelectorAll('.oracy-v2-vocab-drill')];if(!boxes.length)return false;boxes.forEach(upgrade);const warm=box=>{const kp=Number(box.dataset.kp||0),vi=Number(box.dataset.vi||0),item=box.querySelector('h3')?.textContent?.trim(),lines=box._oracyNaturalLines;if(item&&lines)prepare(kp,vi,item,lines).catch(()=>{})};if('IntersectionObserver'in window){const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){warm(e.target);io.unobserve(e.target)}}),{rootMargin:'700px 0px'});boxes.forEach(b=>io.observe(b))}else boxes.slice(0,3).forEach(warm);return true}
if(!install()){const mo=new MutationObserver(()=>{if(install())mo.disconnect()});mo.observe(document.body,{childList:true,subtree:true});setTimeout(install,0);setTimeout(install,500)}
})();
