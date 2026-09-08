const ORACY_ACCESS='https://zmopmjosykiwctrvhsmo.supabase.co/functions/v1/oracy-access';
const ORACY_VOICE='https://zmopmjosykiwctrvhsmo.supabase.co/functions/v1/oracy-voice';
const ASCENT_URL='https://vtqatrhwfvzyodiftvkc.supabase.co';
const ASCENT_KEY='sb_publishable_IJJ9AW79DhOsWlsPK_8pkg_q5Fh7643';
const ADMIN_VALIDATE=ASCENT_URL+'/rest/v1/rpc/ascent_admin_trainer_entry_list';

export default {
  async fetch(request,env){
    const url=new URL(request.url);
    const path=url.pathname;

    if(isPrivateSource(path)) return new Response('Not found',{status:404});

    if(path==='/oracy/session'){
      if(request.method!=='POST') return json({ok:false,message:'Use the ORACY login form.'},405);
      return handleOracySession(request);
    }

    if(path==='/oracy/logout'){
      if(request.method!=='POST') return json({ok:false},405);
      return handleOracyLogout(request);
    }

    if(path==='/oracy/admin-handoff'){
      if(request.method!=='POST') return json({ok:false},405);
      return handleAdminHandoff(request);
    }

    if(path==='/oracy/admin.html'){
      const token=readCookie(request.headers.get('cookie')||'','clarion_admin_session');
      if(!token || !(await validAdmin(token))) return redirect('/ascent/admin-login.html');
      return noStore(await env.ASSETS.fetch(request));
    }

    // Every Unit page and Unit-specific runtime asset is server-gated.
    // Learners need a valid ORACY username/password session AND an active assignment
    // for that exact unit. A validated ASCENT administrator may bypass assignments.
    const unitMatch=path.match(/^\/oracy\/unit-(\d+)(?:[.-][^/]*)?$/i);
    if(unitMatch){
      const cookies=request.headers.get('cookie')||'';
      const learnerToken=readCookie(cookies,'oracy_session');
      const adminToken=readCookie(cookies,'clarion_admin_session');
      const unitNo=Number(unitMatch[1]);
      const adminOk=adminToken ? await validAdmin(adminToken) : false;
      if(!adminOk && (!learnerToken || !(await validLearnerUnit(learnerToken,unitNo)))) return redirect('/oracy/?locked=1');
      return noStore(await env.ASSETS.fetch(request));
    }

    if(path==='/ascent/admin-settings.html'){
      const response=await env.ASSETS.fetch(request);
      if(!response.ok) return response;
      return injectOracyAdminCard(response);
    }

    return env.ASSETS.fetch(request);
  }
};

async function handleOracySession(request){
  const ct=request.headers.get('content-type')||'';
  try{
    if(ct.includes('multipart/form-data')){
      const cookies=request.headers.get('cookie')||'';
      const learnerToken=readCookie(cookies,'oracy_session');
      const adminToken=readCookie(cookies,'clarion_admin_session');
      const form=await request.formData();
      const unitNo=Number(form.get('unit_no')||1);
      const adminOk=adminToken ? await validAdmin(adminToken) : false;
      if(!adminOk && (!learnerToken || !(await validLearnerUnit(learnerToken,unitNo)))) return json({error:'Unit access required'},403);
      form.set('unit_no',String(unitNo));
      if(adminOk){
        form.set('admin_token',adminToken);
        form.delete('session_token');
      }else{
        form.set('session_token',learnerToken);
        form.delete('admin_token');
      }
      const r=await fetch(ORACY_VOICE,{method:'POST',headers:{'x-oracy-client':'oracy-web-v1'},body:form});
      return proxy(r);
    }

    const body=await request.json();
    if(body?.action==='tts'){
      const cookies=request.headers.get('cookie')||'';
      const learnerToken=readCookie(cookies,'oracy_session');
      const adminToken=readCookie(cookies,'clarion_admin_session');
      const unitNo=Number(body.unit_no||1);
      const adminOk=adminToken ? await validAdmin(adminToken) : false;
      if(!adminOk && (!learnerToken || !(await validLearnerUnit(learnerToken,unitNo)))) return json({error:'Unit access required'},403);
      body.unit_no=unitNo;
      if(adminOk){
        body.admin_token=adminToken;
        delete body.session_token;
      }else{
        body.session_token=learnerToken;
        delete body.admin_token;
      }
      const r=await fetch(ORACY_VOICE,{method:'POST',headers:{'x-oracy-client':'oracy-web-v1','content-type':'application/json'},body:JSON.stringify(body)});
      return proxy(r);
    }

    const r=await fetch(ORACY_ACCESS,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'login',login_id:String(body.login_id||''),password:String(body.password||'')})});
    const data=await r.json().catch(()=>({ok:false,message:'Login failed.'}));
    if(!r.ok || data.ok!==true || !data.session_token) return json(data,r.status||401);
    const headers=new Headers({'content-type':'application/json','cache-control':'no-store'});
    headers.append('set-cookie',cookie('oracy_session',data.session_token,12*60*60,'/oracy'));
    return new Response(JSON.stringify({ok:true,learner:data.learner,units:data.units||[],expires_at:data.expires_at}),{status:200,headers});
  }catch(e){
    return json({ok:false,message:'Request could not be completed.',detail:String(e?.message||e).slice(0,300)},400);
  }
}

async function handleOracyLogout(request){
  const token=readCookie(request.headers.get('cookie')||'','oracy_session');
  if(token){
    await fetch(ORACY_ACCESS,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'logout',session_token:token})}).catch(()=>{});
  }
  const headers=new Headers({'content-type':'application/json','cache-control':'no-store'});
  headers.append('set-cookie','oracy_session=; Path=/oracy; HttpOnly; Secure; SameSite=Lax; Max-Age=0');
  return new Response(JSON.stringify({ok:true}),{status:200,headers});
}

async function handleAdminHandoff(request){
  let token='';
  try{
    const form=await request.formData();
    token=String(form.get('ascent_session_token')||'').trim();
  }catch{}
  if(!token || !(await validAdmin(token))) return new Response('Administrator access required.',{status:403,headers:{'cache-control':'no-store'}});
  const headers=new Headers({location:'/oracy/','cache-control':'no-store'});
  headers.append('set-cookie',cookie('clarion_admin_session',token,60*60,'/'));
  return new Response(null,{status:303,headers});
}

async function validAdmin(token){
  try{
    const r=await fetch(ADMIN_VALIDATE,{method:'POST',headers:{apikey:ASCENT_KEY,authorization:'Bearer '+ASCENT_KEY,'content-type':'application/json'},body:JSON.stringify({p_session_token:token})});
    if(!r.ok) return false;
    const payload=await r.json();
    const result=Array.isArray(payload)?payload[0]:payload;
    return Boolean(result&&result.ok===true);
  }catch{return false;}
}

async function validLearnerUnit(token,unitNo){
  try{
    const r=await fetch(ORACY_ACCESS,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'validate',session_token:token,unit_no:unitNo})});
    if(!r.ok) return false;
    const data=await r.json();
    return Boolean(data&&data.ok===true);
  }catch{return false;}
}

async function injectOracyAdminCard(response){
  let html=await response.text();
  if(!html.includes('id="oracyAdminHubCard"')){
    const card='<button id="oracyAdminHubCard" class="app-card dialogue" type="button"><strong>ORACY</strong><span>Manage spoken-English learners, passwords and assigned units</span></button>';
    html=html.replace('<button id="catSimulatorAdminButton" class="app-card ascent" type="button"><strong>CAT Simulator</strong>',card+'\n        <button id="catSimulatorAdminButton" class="app-card ascent" type="button"><strong>CAT Simulator</strong>');
    const script=`<script>(function(){var b=document.getElementById('oracyAdminHubCard');if(!b)return;b.addEventListener('click',function(){var s=null;for(const k of ['ascent_admin_master_session','ascent_trainer_session']){try{var x=JSON.parse(localStorage.getItem(k)||'null');if(x&&x.sessionToken&&String(x.role||'').toUpperCase()==='ADMIN'){s=x;break}}catch(e){}}if(!s){location.href='/ascent/admin-login.html';return}var f=document.createElement('form');f.method='POST';f.action='/oracy/admin-handoff';var i=document.createElement('input');i.type='hidden';i.name='ascent_session_token';i.value=s.sessionToken;f.appendChild(i);document.body.appendChild(f);f.submit();});})();</script>`;
    html=html.replace('</body>',script+'</body>');
  }
  const headers=new Headers(response.headers);
  headers.set('content-type','text/html; charset=UTF-8');
  headers.set('cache-control','no-store');
  return new Response(html,{status:response.status,statusText:response.statusText,headers});
}

function isPrivateSource(path){
  return path==='/worker.js' || path==='/wrangler.jsonc' || path.startsWith('/functions/') || path.startsWith('/supabase/') || path.startsWith('/.github/');
}

function readCookie(header,name){
  const match=header.match(new RegExp('(?:^|;\\s*)'+name+'=([^;]+)'));
  return match?decodeURIComponent(match[1]):'';
}

function cookie(name,value,maxAge,path){
  return `${name}=${encodeURIComponent(value)}; Path=${path}; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

function redirect(location){
  return new Response(null,{status:302,headers:{location,'cache-control':'no-store'}});
}

function noStore(response){
  const headers=new Headers(response.headers);
  headers.set('cache-control','no-store, max-age=0');
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}

async function proxy(r){
  const headers=new Headers();
  const type=r.headers.get('content-type');if(type)headers.set('content-type',type);
  headers.set('cache-control',r.headers.get('cache-control')||'no-store');
  const x=r.headers.get('x-oracy-audio');if(x)headers.set('x-oracy-audio',x);
  return new Response(r.body,{status:r.status,statusText:r.statusText,headers});
}

function json(body,status=200){
  return new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
}
