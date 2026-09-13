(()=>{
'use strict';

const EDGE='/oracy/session';
const path=location.pathname.toLowerCase();
const unitKey=path.endsWith('/unit-1a.html')?'1':String(document.body.dataset.unitNo||'');
const unitNo=unitKey==='1'?1:Number(unitKey||0);
const AUDIO_STYLE='Read as a warm, clear teacher speaking to an intelligent ten-year-old learner. Use simple everyday English, natural pauses, and calm emphasis. Explain, do not lecture. Keep a natural UK-leaning international English voice.';
const cache=new Map();
let guidePlayer=null;

const GUIDES={
'1':[
`<p><b>What to notice:</b> When you meet someone, the first words should make it easy for the other person to answer.</p><p><b>How to do it:</b> Start with a greeting, say who you are, and then use the situation around you. For example: <b>Hi, I’m Neha. I don’t think we’ve spoken before. Are you here for the workshop?</b></p><p><b>Choose the greeting to match the person.</b> <b>Hello</b> works almost everywhere. <b>Hi</b> is friendly and common. <b>Nice to meet you</b> is useful when you meet someone for the first time. <b>Nice to see you</b> is for someone you have met before.</p><p><b>Remember:</b> greet → say who you are → give the other person an easy way to reply.</p>`,
`<p><b>What to notice:</b> Sometimes you talk about what is normal for you. At other times you talk about something happening now or for a short period.</p><p><b>For your normal situation:</b> say it simply: <b>I work in operations. I travel twice a month.</b></p><p><b>For something happening now or only for a short time:</b> use <b>am / is / are</b> with an <b>-ing</b> word: <b>I’m studying data analytics this term. We’re testing a new dashboard this month.</b></p><p><b>Why this matters:</b> The extra detail gives the other person something to ask about.</p><p><b>Remember:</b> normal life = simple statement; happening now or temporary = <b>am / is / are + -ing</b>.</p>`,
`<p><b>What to notice:</b> A good first conversation is not a list of questions. Listen to what the other person says and use it to decide what to say next.</p><p>If the situation is something that normally happens, <b>when</b> is useful: <b>When I meet someone new, I start with the situation around us.</b></p><p>If something may or may not happen, <b>if</b> is useful: <b>If the other person gives a short answer, I ask one easy follow-up.</b></p><p>Before you leave, give a small signal: <b>I’ll let you get back to the group. Good talking to you.</b></p><p><b>Remember:</b> react → ask one connected question → close politely when you need to leave.</p>`
],
'91':[
`<p><b>What to notice:</b> We often talk about life in ready-made word groups. Learn the whole group, not one word at a time.</p><p>Say <b>start school</b>, <b>leave school</b>, <b>go to university</b>, <b>join a company</b>, <b>get promoted</b>, <b>get married</b>, and <b>have children</b>.</p><p>When you tell your background, put the events in an easy order. Use words such as <b>first, then, after that, later</b> and <b>finally</b>.</p><p>For example: <b>I grew up in Jaipur. After school, I went to university in Delhi. Then I joined a company in Gurugram.</b></p><p><b>Remember:</b> learn the event as a complete phrase, then connect the phrases into a story.</p>`,
`<p><b>What to notice:</b> When you talk about something that is finished, use the word that shows it already happened.</p><p>Some words simply add <b>-ed</b>: <b>work → worked, stay → stayed</b>. Other common words change: <b>go → went, take → took, meet → met, see → saw, buy → bought</b>.</p><p>Do not try to remember a long rule while you are speaking. Learn the whole useful piece: <b>went home, took a bus, met a friend, bought a ticket</b>.</p><p>For example: <b>Yesterday I missed the metro, took a cab and reached class late.</b></p><p><b>Remember:</b> finished event = use the word that shows it happened before now.</p>`,
`<p><b>What to notice:</b> A subject can teach you facts, but it can also help you build skills that are useful in many jobs.</p><p>Do not stop at: <b>Maths was useful.</b> Explain what it helped you do: <b>Maths helped me become more comfortable with numbers and problem-solving.</b></p><p>You can do the same with communication, teamwork, judgement, problem-solving and using numbers.</p><p>A strong answer has three parts: <b>what you studied → what it helped you develop → why that matters now.</b></p><p><b>Remember:</b> do not only name the subject. Explain the effect it had on you.</p>`
],
'92':[
`<p><b>What to notice:</b> When you talk about an experience and the exact time is not important, you will often hear <b>have</b> or <b>has</b>.</p><p>For example: <b>I have tried rafting.</b> The important idea is the experience, not the date.</p><p>But when you give a finished time such as <b>yesterday, last year, on Monday</b> or <b>two years ago</b>, use the ordinary past word: <b>I went rafting two years ago.</b></p><p><b>Been to</b> means the person went and came back. <b>Gone to</b> means the person is still there or is on the way.</p><p><b>Remember:</b> no exact finished time → <b>have/has</b> can introduce the experience; finished time given → use the past word.</p>`,
`<p><b>What to notice:</b> These small words tell the listener how far a job or goal has moved.</p><p><b>Already</b> means it is done: <b>I have already finished the research.</b> <b>Yet</b> asks whether an expected job is done, or says it is not done: <b>Have you finished yet? Not yet.</b></p><p><b>Still</b> means something remains: <b>I still have two sections to write.</b> <b>So far</b> means up to now: <b>I have completed four modules so far.</b></p><p>Use <b>for</b> with a length of time: <b>for six weeks</b>. Use <b>since</b> with the starting point: <b>since August</b>.</p><p><b>Remember:</b> choose the word that matches the progress you really want to describe.</p>`,
`<p><b>What to notice:</b> Different competition words do different jobs.</p><p>People or organisations <b>compete with</b> or <b>compete against</b> someone. They <b>compete for</b> something they want: <b>a job, a contract, a prize</b>.</p><p>You <b>beat</b> the other person or team, but you <b>win</b> the match, prize, award or contract.</p><p>A <b>candidate</b> is usually trying to be selected for a role. A <b>competitor</b> is another person or organisation competing with you.</p><p><b>Remember:</b> beat the opponent; win the prize.</p>`
],
'93':[
`<p><b>What to notice:</b> News words often come in families. Learning the family helps you understand and speak about a story more easily.</p><p>For example: <b>politics → political → politician</b>; <b>economy → economic</b>; <b>crime → criminal</b>; <b>rob → robber → robbery</b>.</p><p>Before you explain a news item, first say what kind of story it is. Then say what happened. Then add one important detail.</p><p>For example: <b>This is an economic story. Unemployment has fallen. The report says more young people found work this quarter.</b></p><p><b>Remember:</b> category → main event → one useful detail.</p>`,
`<p><b>What to notice:</b> Words such as <b>recently, lately, just</b> and <b>in the last few days</b> tell us that the news is close to now.</p><p>You can introduce the news with <b>have</b>: <b>I have just started a new job.</b></p><p>Then, when you give a finished day or time, use the normal past word: <b>I started on Monday. I met the team yesterday.</b></p><p>Think of it as two steps: first give the latest news; then give the finished details.</p><p><b>Remember:</b> recent news first → finished-time detail second.</p>`,
`<p><b>What to notice:</b> In a strong memory, one action is often already happening when a shorter event happens.</p><p>For the action already happening, use <b>was / were</b> with an <b>-ing</b> word: <b>I was travelling home.</b></p><p>For the shorter event, use the ordinary past word: <b>my sister called.</b></p><p>Put them together: <b>I was travelling home when my sister called.</b> You can use <b>while</b> before the longer action: <b>While I was waiting for the train, my phone rang.</b></p><p><b>Remember:</b> set the scene first; then say what happened.</p>`
],
'94':[
`<p><b>What to notice:</b> We often need to explain <b>why we do something</b> or <b>what something is used for</b>. English gives us a few easy ways to do this.</p><p><b>1. Use to</b> when you say what you want to do: <b>I use cloud storage to save my files.</b> You can also say <b>in order to</b> when you want to sound a little more formal: <b>I keep another copy in order to protect my work.</b></p><p><b>2. Use for</b> when you explain what something is used for. The action after <b>for</b> usually ends in <b>-ing</b>: <b>Cloud storage is for keeping copies online.</b></p><p><b>3. Use so that</b> when you explain the result you want: <b>I back up my files so that I do not lose my work.</b></p><p><b>4. Use because</b> when you give the reason: <b>I keep two copies because one system can fail.</b></p><p><b>Remember:</b> <b>to</b> = what you want to do; <b>for</b> = what something is used for; <b>so that</b> = the result you want; <b>because</b> = the reason.</p>`,
`<p><b>What to notice:</b> Many computer words sound technical, but you can make them easy by explaining what the thing does.</p><p>A <b>browser</b> is the program you use to open and move around websites. A <b>search engine</b> helps you find information on the web. <b>Hardware</b> means the physical parts of a computer that you can touch.</p><p>Some computer words also have an everyday meaning. A <b>file</b> can be a collection of papers, and on a computer it is a stored item. A <b>mouse</b> is an animal, and it is also a pointing device.</p><p>When you explain a technical word, say <b>what it is → what it does → one example.</b></p><p><b>Remember:</b> if the word sounds difficult, explain its job in simple English.</p>`,
`<p><b>What to notice:</b> A clear professional email normally moves in a simple order.</p><p><b>First, open politely:</b> <b>Hi Riya,</b> or <b>Dear Ms Mehta,</b> depending on the relationship.</p><p><b>Then say why you are writing:</b> <b>I just wanted to let you know that the meeting is at three.</b></p><p><b>Add the useful detail or action:</b> <b>I’ve attached the map.</b></p><p><b>Finish warmly:</b> <b>Looking forward to seeing you.</b> or <b>Best regards.</b></p><p><b>Remember:</b> opening → purpose → useful detail/action → close.</p>`
],
'95':[
`<p><b>What to notice:</b> Travel becomes easier to explain when you put each step in the order it happens.</p><p>For an international flight, a common order is: <b>check the departures screen → check in → go through security → go through passport control → find the gate → board the flight.</b></p><p>At a railway station, you may need the <b>platform, coach</b> and <b>seat number</b>. At an airport, you may need the <b>boarding pass, gate</b> and seat information.</p><p>When you explain a journey, use one action for each stage and connect them with <b>first, then, after that</b> and <b>finally</b>.</p><p><b>Remember:</b> place + action + next step.</p>`,
`<p><b>What to notice:</b> Words such as <b>always, usually, often, sometimes, occasionally, rarely</b> and <b>never</b> tell the listener how often something happens.</p><p>With most action words, put the frequency word before the action: <b>I usually take the metro. I often travel by train.</b></p><p>With <b>am, is</b> or <b>are</b>, put the frequency word after it: <b>I am usually early.</b></p><p>Choose the word that is true. <b>Rarely</b> means not often. <b>Occasionally</b> means sometimes, but not regularly.</p><p><b>Remember:</b> say how often first, then give a reason if it helps the listener understand your choice.</p>`,
`<p><b>What to notice:</b> When something goes wrong while travelling, the listener needs three things from you.</p><p><b>1. Say the problem:</b> <b>My train was delayed.</b></p><p><b>2. Say what the problem caused:</b> <b>So I missed my connection.</b></p><p><b>3. Say what you need now:</b> <b>Can I use this ticket on the next train?</b></p><p>Useful phrases include <b>miss a flight, miss a connection, get stuck in traffic, get lost, break down, be delayed</b> and <b>be cancelled</b>.</p><p><b>Remember:</b> problem → result → request or next action.</p>`
],
'96':[
`<p><b>What to notice:</b> When you connect two future actions, words such as <b>when, as soon as</b> and <b>until</b> help you show the order.</p><p>Say: <b>I’ll call you when I arrive.</b> Do not say: <b>when I will arrive.</b> Say: <b>I’ll message you as soon as I get the answer.</b> Say: <b>Don’t book anything until I confirm the date.</b></p><p>Use <b>Shall I...?</b> when you offer to help: <b>Shall I check the hotel?</b> Use <b>I’ll...</b> when you decide or promise to do something: <b>I’ll send the budget.</b></p><p><b>Remember:</b> after <b>when, as soon as</b> and <b>until</b>, say the future event without <b>will</b>.</p>`,
`<p><b>What to notice:</b> A personal arrangement and a timetable are both about the future, but we speak about them differently.</p><p>For something people have arranged personally, say what the person is doing: <b>I’m meeting a client at 2:30. We’re having dinner with the organisers tonight.</b></p><p>For a fixed timetable, use the normal schedule wording: <b>The train leaves at 11:15. The conference starts at nine.</b></p><p>Ask yourself one question: <b>Did people arrange this for themselves, or is it a fixed schedule?</b></p><p><b>Remember:</b> personal arrangement → what the person is doing; fixed timetable → what the schedule says.</p>`,
`<p><b>What to notice:</b> The words you choose can show <b>when the decision was made</b>.</p><p>If you decide at the moment you speak, <b>I’ll...</b> is natural: <b>The printer has stopped. I’ll call IT.</b></p><p>If you made the plan earlier, <b>I’m going to...</b> is natural: <b>I’m going to buy a new laptop next month. I decided last week.</b></p><p>Do not choose the words because of a grammar label. Ask yourself: <b>Did I decide this now, or had I already decided?</b></p><p><b>Remember:</b> decision now → <b>I’ll...</b>; earlier plan → <b>I’m going to...</b>.</p>`
]
};

function plainText(html){
  const d=document.createElement('div');d.innerHTML=html;
  return d.textContent.replace(/\s+/g,' ').trim();
}
function findTeachBox(kp){
  const acts=[...kp.querySelectorAll(':scope > .activity')];
  return acts.find(a=>/notice the language|language focus|language weave/i.test(a.querySelector('h3')?.textContent||''));
}
function ensurePlayer(){
  if(guidePlayer)return guidePlayer;
  guidePlayer=document.createElement('audio');guidePlayer.hidden=true;document.body.appendChild(guidePlayer);return guidePlayer;
}
async function fetchGuideAudio(index,text){
  const key=`b1a-new-guide-${unitKey}-kp${index+1}-v2`;
  if(cache.has(key))return cache.get(key);
  const res=await fetch(EDGE,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'tts',text,voice:'cedar',instructions:AUDIO_STYLE,unit_no:unitNo,passage_id:key})});
  if(!res.ok)throw new Error('Audio is not ready yet.');
  const blob=await res.blob();
  const url=URL.createObjectURL(blob);cache.set(key,url);return url;
}
function waitForEnd(a){return new Promise((resolve,reject)=>{a.onended=resolve;a.onerror=()=>reject(new Error('Audio could not be played.'));});}

const guides=GUIDES[unitKey];
if(!guides)return;
const kps=[...document.querySelectorAll('.kp')];
kps.forEach((kp,index)=>{
  const html=guides[index];if(!html)return;
  const box=findTeachBox(kp);if(!box)return;
  const heading=box.querySelector('h3');
  box.innerHTML='';
  const h=document.createElement('h3');h.textContent='3 · Notice the language';box.appendChild(h);
  const body=document.createElement('div');body.className='plain-teaching';body.innerHTML=html;box.appendChild(body);
  const btn=document.createElement('button');btn.type='button';btn.className='audio guide-audio';btn.textContent='▶ Listen to this explanation';box.appendChild(btn);
  const status=document.createElement('div');status.className='audio-note status';status.setAttribute('aria-live','polite');status.textContent='Audio is being prepared for quick play.';box.appendChild(status);
  const text=plainText(html);
  let ready=null;
  const preload=()=>{if(!ready)ready=fetchGuideAudio(index,text).then(url=>{status.textContent='Audio ready.';return url;}).catch(()=>{status.textContent='Audio will be prepared when you press Play.';ready=null;return null;});return ready;};
  if('requestIdleCallback' in window)requestIdleCallback(preload,{timeout:1200});else setTimeout(preload,150);
  btn.addEventListener('click',async()=>{
    try{
      btn.disabled=true;status.textContent='Opening the explanation…';
      const url=(await preload())||await fetchGuideAudio(index,text);
      const a=ensurePlayer();a.src=url;await a.play();status.textContent='Playing…';await waitForEnd(a);status.textContent='Finished. You can listen again before you practise.';
    }catch(e){status.textContent=e.message||'Audio could not be played.';}finally{btn.disabled=false;}
  });
});

window.addEventListener('beforeunload',()=>{for(const url of cache.values())try{URL.revokeObjectURL(url)}catch{}cache.clear();});
})();
