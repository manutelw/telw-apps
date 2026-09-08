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

    const response=await base.fetch(request,env);
    if(path==='/ascent/admin-settings.html' && response.ok){
      return ensureOracyCard(response);
    }
    return response;
  }
};

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
  if(!html.includes('<strong>ORACY</strong>')){
    const marker='<button id="catSimulatorAdminButton" class="app-card ascent" type="button"><strong>CAT Simulator</strong>';
    const card='<a id="oracyAdminHubCard" class="app-card dialogue" href="/oracy/admin-open.html"><strong>ORACY</strong><span>Open B1 Unit 1 and manage learner access</span></a>';
    html=html.replace(marker,card+'\n        '+marker);
  }
  const headers=new Headers(response.headers);
  headers.set('content-type','text/html; charset=UTF-8');
  headers.set('cache-control','no-store, max-age=0');
  return new Response(html,{status:response.status,statusText:response.statusText,headers});
}

function json(body,status=200){
  return new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
}
