import base from './worker.js';

const ORACY_ACCESS='https://zmopmjosykiwctrvhsmo.supabase.co/functions/v1/oracy-access';

export default {
  async fetch(request,env){
    const url=new URL(request.url);
    const path=url.pathname;

    if(path==='/oracy/admin-preview'){
      if(request.method!=='POST') return json({ok:false,message:'POST required.'},405);
      return handleAdminPreview(request);
    }

    let response=await base.fetch(request,env);
    if(isAdminSettingsPath(path) && response.ok){
      return ensureOracyCard(response);
    }

    const unitNo=oracyUnitNumber(path);
    if(unitNo && response.ok){
      if(unitNo===1) response=await ensureUnit1MarkerGuidance(response);
      return applyTelwLevelBranding(response,unitNo);
    }
    return response;
  }
};

function isAdminSettingsPath(path){
  return path==='/ascent/admin-settings.html' || path==='/ascent/admin-settings' || path==='/ascent/admin-settings/' || path.endsWith('/ascent/admin-settings.html');
}

function oracyUnitNumber(path){
  const match=path.match(/^\/oracy\/unit-(\d+)(?:\.html|\/)?$/i);
  return match?Number(match[1]):0;
}

function telwLevelForUnit(unitNo){
  if(unitNo>=1&&unitNo<=7)return 'B1A';
  if(unitNo>=8&&unitNo<=15)return 'B1B';
  if(unitNo>=16&&unitNo<=22)return 'B2A';
  if(unitNo>=23&&unitNo<=30)return 'B2B';
  return '';
}

async function handleAdminPreview(request){
  try{
    const body=await request.json();
    const adminToken=String(body?.ascent_session_token||'').trim();
    if(!adminToken) return json({ok:false,message:'Administrator access required.'},403);
    const r=await fetch(ORACY_ACCESS,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'admin_preview',ascent_session_token:adminToken})});
    const data=await r.json().catch(()=>({ok:false,message:'Preview could not be opened.'}));
    if(!r.ok||data.ok!==true||!data.session_token) return json(data,r.status||403);
    const headers=new Headers({'content-type':'application/json','cache-control':'no-store'});
    headers.append('set-cookie',`oracy_session=${encodeURIComponent(data.session_token)}; Path=/oracy; HttpOnly; Secure; SameSite=Lax; Max-Age=${12*60*60}`);
    return new Response(JSON.stringify({ok:true,url:'/oracy/unit-1.html'}),{status:200,headers});
  }catch(e){
    return json({ok:false,message:'Preview could not be opened.',detail:String(e?.message||e).slice(0,200)},400);
  }
}

async function ensureOracyCard(response){
  let html=await response.text();
  if(!html.includes('id="oracyAdminHubCard"')){
    const card='<a id="oracyAdminHubCard" class="app-card dialogue" href="/oracy/admin-open.html"><strong>ORACY</strong><span>Open B1 Unit 1 and manage learner access</span></a>';
    const catMarker='<button id="catSimulatorAdminButton"';
    const idx=html.indexOf(catMarker);
    if(idx>=0){
      html=html.slice(0,idx)+card+'\n        '+html.slice(idx);
    }else{
      const gridClose=html.indexOf('</div>',html.indexOf('class="app-grid"'));
      if(gridClose>=0) html=html.slice(0,gridClose)+card+html.slice(gridClose);
    }
  }
  const headers=new Headers(response.headers);
  headers.set('content-type','text/html; charset=UTF-8');
  headers.set('cache-control','no-store, max-age=0, must-revalidate');
  headers.set('pragma','no-cache');
  headers.set('expires','0');
  return new Response(html,{status:response.status,statusText:response.statusText,headers});
}

async function applyTelwLevelBranding(response,unitNo){
  const level=telwLevelForUnit(unitNo);
  if(!level)return response;
  let html=await response.text();
  html=html.replace(/<small>by TELW · [^<]*<\/small>/i,`<small>by TELW · LEVEL ${level}</small>`);
  const eyebrowPattern=new RegExp(`<div class="eyebrow">[^<]*Unit\\s*${unitNo}[^<]*<\\/div>`,'i');
  html=html.replace(eyebrowPattern,`<div class="eyebrow">LEVEL ${level} · UNIT ${unitNo}</div>`);
  if(!html.includes('src="./level-system.js"')) html=html.replace('</body>','<script src="./level-system.js"></script>\n</body>');
  const headers=new Headers(response.headers);
  headers.set('content-type','text/html; charset=UTF-8');
  headers.set('cache-control','no-store, max-age=0, must-revalidate');
  headers.set('pragma','no-cache');
  headers.set('expires','0');
  return new Response(html,{status:response.status,statusText:response.statusText,headers});
}

async function ensureUnit1MarkerGuidance(response){
  let html=await response.text();
  if(!html.includes('id="oracyMarkerRecordingGuide"')){
    const extra=`
<style id="oracyMarkerRecordingGuide">.marker-recording-guide{margin:10px 0;padding:10px 12px;border:1px solid #d8e2ea;border-radius:10px;background:#fff}.marker-recording-guide b{color:#16324f}.marker-recording-guide .marker-list{margin-top:5px;line-height:1.7}.feedback div{white-space:pre-line}</style>
<script>
(function(){
  const markers=['You bet!','Exactly!','Oh yeah!','Really?','You know what?','By the way','Same here','Anyway'];
  document.querySelectorAll('.speak').forEach(box=>{
    if(box.querySelector('.marker-recording-guide'))return;
    const eyebrow=(box.querySelector('.eyebrow')?.textContent||'').toLowerCase();
    const min=eyebrow.includes('final')?2:1;
    const guide=document.createElement('div');
    guide.className='marker-recording-guide';
    guide.innerHTML='<b>Conversation words to use</b><div class="marker-list">'+markers.join(' · ')+'</div><div style="margin-top:5px">Use at least <b>'+min+'</b> of these in your recording. ORACY will check. If you miss them, it will show you how to use them and ask you to record again.</div>';
    const record=box.querySelector('.record');
    if(record)box.insertBefore(guide,record);
  });
})();
</script>`;
    html=html.replace('</body>',extra+'\n</body>');
  }

  // Force a fresh copy of the Unit 1 scripts. Several of these assets are normally cacheable.
  html=html.replace(/src="\.\/unit-1\.js(?:\?[^\"]*)?"/g,'src="./unit-1.js?v=221"');
  html=html.replace(/src="\.\/unit-1-coach\.js(?:\?[^\"]*)?"/g,'src="./unit-1-coach.js?v=221"');
  html=html.replace(/src="\.\/unit-1-oral-qa\.js(?:\?[^\"]*)?"/g,'src="./unit-1-oral-qa.js?v=221"');
  html=html.replace(/src="\.\/unit-1-feedback-examples\.js(?:\?[^\"]*)?"/g,'src="./unit-1-feedback-examples.js?v=221"');

  if(!html.includes('unit-1-oral-qa.js')) html=html.replace('</body>','<script src="./unit-1-oral-qa.js?v=221"></script>\n</body>');
  if(!html.includes('unit-1-feedback-examples.js')) html=html.replace('</body>','<script src="./unit-1-feedback-examples.js?v=221"></script>\n</body>');

  // Do not depend on a separate audio-controller asset. Put the narrow fallback directly in the HTML response.
  // This removes three possible failure points at once: stale JS, a missing static asset, and script-load ordering.
  if(!html.includes('id="oracyAudioFallback221"')) html=html.replace('</body>',unit1AudioFallback221()+'\n</body>');

  const headers=new Headers(response.headers);
  headers.set('content-type','text/html; charset=UTF-8');
  headers.set('cache-control','no-store, max-age=0, must-revalidate');
  headers.set('pragma','no-cache');
  headers.set('expires','0');
  return new Response(html,{status:response.status,statusText:response.statusText,headers});
}

function unit1AudioFallback221(){
  return `<script id="oracyAudioFallback221">
(function(){
  if(window.__oracyAudioFallback221)return;
  window.__oracyAudioFallback221=true;
  var EDGE='/oracy/session',UNIT_NO=1,ctx=null,active=[];
  var PASS='Sound natural, lively and warm. Use clear learner-friendly pacing, expressive sentence stress, natural rises and falls, and genuine conversational enthusiasm. Do not sound formal or robotic.';
  var TEACH='Speak as a warm, cheerful female English teacher. Keep it short, clear and encouraging. Use gentle lively intonation. Never sound formal or robotic.';
  var PRON='Speak clearly and naturally for an English pronunciation exercise. Give the target word or phrase only. Use a crisp contrast between w and v. Do not add explanations.';
  var PRON_TEXT={q11:'visit',q12:'weekend',q13:'west. vest.',q14:'We visit every weekend.'};
  var mem={};
  function ac(){if(ctx)return ctx;var C=window.AudioContext||window.webkitAudioContext;if(!C)throw new Error('Audio is not supported in this browser.');ctx=new C();return ctx;}
  function wake(){var c=ac();return c.state==='running'?Promise.resolve(c):c.resume().then(function(){return c;});}
  function stop(){active.forEach(function(s){try{s.stop();}catch(e){}});active=[];}
  function failText(res){return res.text().catch(function(){return '';}).then(function(t){throw new Error('Audio failed (HTTP '+res.status+')'+(t?': '+t.slice(0,160):''));});}
  function tts(text,voice,style,key){
    var ck=key||voice+'|'+text;if(mem[ck])return Promise.resolve(mem[ck]);
    return fetch(EDGE,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'tts',text:text,voice:voice,instructions:style,unit_no:UNIT_NO,passage_id:key||''})}).then(function(r){if(!r.ok)return failText(r);return r.blob();}).then(function(b){return wake().then(function(c){return b.arrayBuffer().then(function(a){return c.decodeAudioData(a);});});}).then(function(buf){mem[ck]=buf;return buf;});
  }
  function play(list,gap){return wake().then(function(c){stop();return new Promise(function(resolve){if(!list.length)return resolve();var at=c.currentTime+.02;list.forEach(function(buf,i){var s=c.createBufferSource();s.buffer=buf;s.connect(c.destination);active.push(s);s.start(at);at+=buf.duration+(gap||.04);if(i===list.length-1)s.onended=resolve;});});}).then(function(){active=[];});}
  function setError(b,msg){var box=b.closest('.activity,.kp,.oral-long-answer,.feedback');var out=box&&box.querySelector('.audio-note,.oral-status,.answer');if(out)out.textContent=msg;}
  function passageParts(b){var id=b.dataset.id,box=b.parentElement,p=box&&box.querySelector('.passage');if(!p)return [];if(id==='kp1'){return Array.prototype.map.call(p.querySelectorAll('p'),function(el,i){var raw=el.textContent.trim(),pos=raw.indexOf(':');return {voice:i%2?'cedar':'marin',text:pos>=0?raw.slice(pos+1).trim():raw};});}return [{voice:id==='kp2'?'cedar':'marin',text:p.textContent.trim()}];}
  function runPassage(b){var old=b.textContent,id=b.dataset.id,parts=passageParts(b);b.textContent='Preparing audio…';b.disabled=true;wake().then(function(){return Promise.all(parts.map(function(s,i){return tts(s.text,s.voice,PASS,'b1-u1-'+id+'-'+i+'-'+s.voice+'-expanded-v4');}));}).then(function(bufs){b.textContent=id==='kp1'?'Playing conversation…':'Playing passage…';return play(bufs,id==='kp1'?.08:.03);}).catch(function(e){setError(b,e.message||'Audio could not be played.');}).finally(function(){b.disabled=false;b.textContent=old;});}
  function runQuestion(b){var old=b.textContent,box=b.closest('.oral-long-answer,.activity'),p=box&&box.querySelector('p b'),text=(p&&p.textContent.trim())||((box&&box.querySelector('p'))?box.querySelector('p').textContent.trim():'');b.textContent='Preparing…';b.disabled=true;wake().then(function(){return tts(text,'marin',TEACH,'question-'+text.slice(0,40));}).then(function(buf){b.textContent='Playing…';return play([buf],.02);}).catch(function(e){setError(b,e.message||'Audio could not be played.');}).finally(function(){b.disabled=false;b.textContent=old;});}
  function runPron(b){var old=b.textContent,box=b.closest('.activity'),check=box&&box.querySelector('.check[data-question]'),id=check&&check.dataset.question,text=PRON_TEXT[id];b.textContent='Preparing…';b.disabled=true;wake().then(function(){if(!text)throw new Error('Pronunciation audio is not available.');return tts(text,'marin',PRON,'pron-'+id);}).then(function(buf){b.textContent='Playing…';return play([buf],.02);}).catch(function(e){setError(b,e.message||'Audio could not be played.');}).finally(function(){b.disabled=false;b.textContent=old;});}
  function runFeedback(b){var old=b.textContent,box=b.closest('.feedback'),copy=box?box.cloneNode(true):null;if(copy){Array.prototype.forEach.call(copy.querySelectorAll('button'),function(x){x.remove();});}var text=copy?copy.textContent.replace(/\\s+/g,' ').trim():'';b.textContent='Preparing…';b.disabled=true;wake().then(function(){if(!text)throw new Error('Teacher feedback is not ready yet.');return tts(text,'marin',TEACH,'');}).then(function(buf){b.textContent='Playing…';return play([buf],.02);}).catch(function(e){setError(b,e.message||'Audio could not be played.');}).finally(function(){b.disabled=false;b.textContent=old;});}
  document.addEventListener('pointerdown',function(e){if(e.target.closest('.audio,.hear-oral-question,.hear-pron-target,.oracy-hear-feedback')){try{wake();}catch(x){}}},true);
  document.addEventListener('click',function(e){var b=e.target.closest('.audio,.hear-oral-question,.hear-pron-target,.oracy-hear-feedback');if(!b)return;e.preventDefault();e.stopImmediatePropagation();if(b.classList.contains('audio'))runPassage(b);else if(b.classList.contains('hear-pron-target'))runPron(b);else if(b.classList.contains('oracy-hear-feedback'))runFeedback(b);else runQuestion(b);},true);
})();
</script>`;
}

function json(body,status=200){
  return new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
}
