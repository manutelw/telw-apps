import {validAdmin,readAdminCookie,setAdminSessionCookie,clearAdminSessionCookie} from './admin-browser-session.js';

const TARGETS={
  'public-practice':'https://zmopmjosykiwctrvhsmo.supabase.co/functions/v1/clarion-public-practice',
  'public-wct':'https://zmopmjosykiwctrvhsmo.supabase.co/functions/v1/clarion-public-wct',
  'public-live-mock':'https://zmopmjosykiwctrvhsmo.supabase.co/functions/v1/clarion-public-live-mock'
};

export async function handleAdminGateway(request){
  const url=new URL(request.url),path=url.pathname;
  if(path==='/admin/session-start'){
    if(request.method!=='POST')return json({ok:false},405);
    try{
      const body=await request.json();
      const token=String(body?.session_token||'').trim();
      if(!await validAdmin(token))return json({ok:false,message:'Administrator session is not valid.'},403);
      const h=new Headers({'content-type':'application/json','cache-control':'no-store'});
      h.append('set-cookie',setAdminSessionCookie(token));
      return new Response(JSON.stringify({ok:true}),{status:200,headers:h});
    }catch{return json({ok:false,message:'Administrator session could not be started.'},400)}
  }
  if(path==='/admin/session-status'){
    const token=readAdminCookie(request);
    return json({ok:Boolean(token&&await validAdmin(token))});
  }
  if(path==='/admin/session-end'){
    const h=new Headers({'content-type':'application/json','cache-control':'no-store'});
    h.append('set-cookie',clearAdminSessionCookie());
    return new Response(JSON.stringify({ok:true}),{status:200,headers:h});
  }
  if(path.startsWith('/__admin/')){
    if(request.method!=='POST')return json({ok:false},405);
    const target=TARGETS[path.slice('/__admin/'.length)];
    if(!target)return json({ok:false},404);
    const token=readAdminCookie(request);
    if(!token||!(await validAdmin(token)))return json({ok:false,message:'Administrator session required.'},403);
    let body={};try{body=await request.json()}catch{}
    body.admin_token=token;
    const r=await fetch(target,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
    return new Response(r.body,{status:r.status,statusText:r.statusText,headers:{'content-type':r.headers.get('content-type')||'application/json','cache-control':'no-store'}});
  }
  return null;
}

export async function bridgeAdminHtml(request,response){
  const type=response.headers.get('content-type')||'';
  if(!response.ok||!type.includes('text/html'))return response;
  const token=readAdminCookie(request);
  const ok=Boolean(token&&await validAdmin(token));
  let html=await response.text();
  if(ok){for(const [slug,target] of Object.entries(TARGETS))html=html.replaceAll(target,'/__admin/'+slug)}
  const script=`<script id="clarionAdminBrowserBridge">(function(){var active=${ok?'true':'false'};function clearOld(){try{localStorage.removeItem('ascent_admin_master_session');var x=JSON.parse(localStorage.getItem('ascent_trainer_session')||'null');if(x&&String(x.role||'').toUpperCase()==='ADMIN')localStorage.removeItem('ascent_trainer_session');['PI_PRACTICE','GD_PRACTICE','PCL','WCT','LIVE_MOCK'].forEach(function(p){if(localStorage.getItem('clarion_entitlement_'+p)==='ADMIN')localStorage.removeItem('clarion_entitlement_'+p)});if(localStorage.getItem('clarion_device_v1')==='ADMIN')localStorage.removeItem('clarion_device_v1')}catch(e){}}if(active){try{localStorage.setItem('clarion_device_v1','ADMIN');['PI_PRACTICE','GD_PRACTICE','PCL','WCT','LIVE_MOCK'].forEach(function(p){localStorage.setItem('clarion_entitlement_'+p,'ADMIN')})}catch(e){}}else{clearOld()}if(location.pathname.indexOf('/ascent/admin-login')>=0){var original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){original.call(this,k,v);if(k==='ascent_admin_master_session'){try{var s=JSON.parse(v||'null');if(s&&s.sessionToken&&String(s.role||'').toUpperCase()==='ADMIN'){var b=new Blob([JSON.stringify({session_token:s.sessionToken})],{type:'application/json'});navigator.sendBeacon('/admin/session-start',b)}}catch(e){}}};}})();</script>`;
  html=html.replace(/<head([^>]*)>/i,'<head$1>'+script);
  const h=new Headers(response.headers);h.set('content-type','text/html; charset=UTF-8');h.set('cache-control','no-store, max-age=0');
  return new Response(html,{status:response.status,statusText:response.statusText,headers:h});
}

function json(body,status=200){return new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}})}
