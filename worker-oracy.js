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
  html=html.replace(/<div class="eyebrow">[^<]*Unit\s*${unitNo}[^<]*<\/div>/i,`<div class="eyebrow">LEVEL ${level} · UNIT ${unitNo}</div>`);
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
  const headers=new Headers(response.headers);
  headers.set('content-type','text/html; charset=UTF-8');
  headers.set('cache-control','no-store, max-age=0, must-revalidate');
  headers.set('pragma','no-cache');
  headers.set('expires','0');
  return new Response(html,{status:response.status,statusText:response.statusText,headers});
}

function json(body,status=200){
  return new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
}
