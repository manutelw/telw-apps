import app from './worker-oracy.js';
import {validAdmin,readAdminCookie} from './admin-browser-session.js';

export default {
  async fetch(request,env){
    const url=new URL(request.url);
    if(isAdminSettingsPath(url.pathname)){
      const token=readAdminCookie(request);
      if(!token || !(await validAdmin(token))) return adminBootstrap();
    }
    return app.fetch(request,env);
  }
};

function isAdminSettingsPath(path){
  return path==='/ascent/admin-settings.html' || path==='/ascent/admin-settings' || path==='/ascent/admin-settings/';
}

function adminBootstrap(){
  const html=`<!doctype html><html><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Opening administrator access…</title><style>body{font-family:Arial,sans-serif;background:#143a60;color:#fff;display:grid;place-items:center;min-height:100vh;margin:0}.box{padding:24px;text-align:center}.box p{opacity:.8}</style></head><body><div class="box"><strong>ClarionPrep Administrator</strong><p>Opening your administrator page…</p></div><script>(async()=>{function session(){for(const k of ['ascent_admin_master_session','ascent_trainer_session']){try{const s=JSON.parse(localStorage.getItem(k)||'null');const exp=new Date(s&&s.expiresAt||s&&s.expires_at||0).getTime();if(s&&s.sessionToken&&String(s.role||'').toUpperCase()==='ADMIN'&&Number.isFinite(exp)&&exp>Date.now())return s}catch(e){}}return null}const s=session();if(!s){location.replace('/ascent/admin-login.html');return}try{const r=await fetch('/admin/session-start',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({session_token:s.sessionToken})});if(r.ok){location.replace('/ascent/admin-settings.html');return}}catch(e){}location.replace('/ascent/admin-login.html')})()</script></body></html>`;
  return new Response(html,{status:200,headers:{'content-type':'text/html; charset=UTF-8','cache-control':'no-store, max-age=0','x-robots-tag':'noindex, nofollow, noarchive'}});
}
