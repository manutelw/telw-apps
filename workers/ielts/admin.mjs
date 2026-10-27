import {getLearner} from './auth.mjs';
// Access is bound to TELW's existing verified trainer email. Learner sessions
// alone do not grant access. Never expose the private key as a static asset.
const TRAINER_EMAIL='manutelw@gmail.com';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const headers={'content-type':'text/html; charset=utf-8','cache-control':'no-store, private','x-content-type-options':'nosniff','x-frame-options':'DENY','x-robots-tag':'noindex, nofollow, noarchive','content-security-policy':"default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'"};
const page=(title,body,status=200)=>new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><style>body{font:16px/1.55 Arial,sans-serif;color:#172c3a;background:#f3f6f8;margin:0}main{max-width:900px;margin:2rem auto;background:white;padding:1.5rem}details{border:1px solid #cad7df;padding:1rem;margin:1rem 0}summary{cursor:pointer;font-weight:bold}li{margin:1rem 0}.answer{color:#375d35}</style><main><h1>${esc(title)}</h1>${body}</main></html>`,{status,headers});
export async function handleAdmin(request,env){
 const url=new URL(request.url);if(url.pathname!=='/ielts/reading/admin' && url.pathname!=='/ielts/reading/admin/')return null;
 if(url.origin!=='https://manuvikraman.com')return new Response('Not found',{status:404});
 if(request.method!=='GET')return new Response('Method not allowed',{status:405,headers:{allow:'GET'}});
 try {
  const learner=await getLearner(request,env);
  if(!learner)return page('TELW Reading administration','<p>Verify your trainer email on the <a href="/ielts/reading/">Reading page</a>, then return here.</p>',401);
  if(learner.email.toLowerCase()!==TRAINER_EMAIL)return page('Access denied','<p>This page is available to the TELW trainer only.</p>',403);
  const results=await env.IELTS_DB.prepare("SELECT id,track,approved_at,content_json,private_key_json FROM ielts_test_versions WHERE skill='reading' ORDER BY track,id").all();
  const versions=results.results||[];
  let content=`<p>Private question sets. Keep this page and its answers confidential.</p><p>${versions.length} sets in this database.</p>`;
  for(const v of versions){
   const data=JSON.parse(v.content_json),key=JSON.parse(v.private_key_json);
   if(!Array.isArray(data.passages)||!Array.isArray(key.keys))throw new Error('Invalid bank');
   let n=0;let parts='';
   for(const p of data.passages){parts+=`<h3>${esc(p.title)}</h3>${p.paragraphs.map(x=>`<p>${esc(x)}</p>`).join('')}<ol start="${n+1}">`;
    for(const q of p.questions){const correct=key.keys[n],opts=q[0]==='tf'?['TRUE','FALSE','NOT GIVEN']:q[2];parts+=`<li>${esc(q[1])}<ul>${opts.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><span class="answer">Answer: ${esc(opts[correct])}</span></li>`;n++;}parts+='</ol>';}
   content+=`<details><summary>${esc(v.track)} — ${esc(v.id)} (${v.approved_at?'available':'not available'})</summary>${parts}</details>`;
  }
  return page('IELTS Reading question sets',content);
 }catch{return page('Reading administration unavailable','<p>Please try again later.</p>',503);}
}
