import {getLearner} from './auth.mjs';
import {importPreviewBanks,PREVIEW_IMPORT_ORIGIN} from './admin-bank-import.mjs';
const TRAINER_EMAIL='manutelw@gmail.com';
const ADMIN='/api/ielts/reading/admin';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const headers={'content-type':'text/html; charset=utf-8','cache-control':'no-store, private','referrer-policy':'no-referrer','x-content-type-options':'nosniff','x-frame-options':'DENY','x-robots-tag':'noindex, nofollow, noarchive','content-security-policy':"default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'"};
const page=(title,body,status=200)=>new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} | TELW The English Workshop</title><style>body{font:16px/1.55 Arial,sans-serif;color:#172c3a;background:#f3f6f8;margin:0}main{max-width:1050px;margin:2rem auto;background:white;padding:1.5rem;border-radius:12px}details{border:1px solid #cad7df;padding:1rem;margin:1rem 0}summary{cursor:pointer;font-weight:bold}li{margin:.65rem 0}.answer{color:#375d35}.note{background:#fff7e8;border-left:4px solid #b78b35;padding:1rem}.stats{display:flex;gap:1rem;flex-wrap:wrap}.stat{background:#edf5f9;padding:1rem;border-radius:8px;min-width:120px}.stat strong{font-size:1.6rem;display:block}button{background:#166581;color:white;border:0;padding:.8rem 1rem;border-radius:6px;font:inherit;cursor:pointer}a{color:#166581}label{display:block;margin:1rem 0}small{display:block}nav{display:flex;gap:1rem;flex-wrap:wrap}h2{margin-top:2rem}input[type=file]{max-width:100%}.evidence{font-size:.95rem;color:#465866}</style></head><body><main><p>TELW THE ENGLISH WORKSHOP · PRIVATE ADMIN</p><h1>${esc(title)}</h1>${body}</main></body></html>`,{status,headers});
const login=()=>page('Reading administration','<p>Verify your trainer email on the <a href="/ielts/reading/">Reading page</a>, then use the “Reading admin” link that appears there.</p>',401);
export async function handleAdmin(request,env){
 const url=new URL(request.url),alias=['/ielts/reading/admin','/ielts/reading/admin/'].includes(url.pathname),index=[ADMIN,ADMIN+'/'].includes(url.pathname),upload=url.pathname===ADMIN+'/import';
 if(!alias&&!index&&!upload)return null;
 if(url.origin!=='https://manuvikraman.com')return new Response('Not found',{status:404});
 if(alias){if(request.method!=='GET')return new Response('Method not allowed',{status:405,headers:{allow:'GET'}});return new Response(null,{status:303,headers:{location:ADMIN,'cache-control':'no-store'}});}
 const method=upload?'POST':'GET';
 if(request.method!==method)return new Response('Method not allowed',{status:405,headers:{allow:method,'cache-control':'no-store'}});
 try{
  const learner=await getLearner(request,env);if(!learner)return login();
  if(learner.email.toLowerCase()!==TRAINER_EMAIL)return page('Access denied','<p>This page is available to the TELW trainer only.</p>',403);
  if(upload){const result=await importPreviewBanks(request,env,learner);return new Response(null,{status:303,headers:{location:ADMIN+'?loaded='+result.loaded+'&unchanged='+result.unchanged,'cache-control':'no-store'}});}
  const versions=(await env.IELTS_DB.prepare("SELECT id,track,approved_at,content_json,private_key_json FROM ielts_test_versions WHERE skill='reading' ORDER BY track,id").all()).results||[];
  const counts={academic:0,general:0};let questions=0;
  for(const v of versions){counts[v.track]++;const data=JSON.parse(v.content_json);if(!Array.isArray(data.passages))throw Error('Invalid bank');questions+=data.passages.reduce((n,p)=>n+p.questions.length,0);}
  const preview=env.IELTS_PREVIEW_BANK_IMPORT===PREVIEW_IMPORT_ORIGIN;
  let body='<nav><a href="/ielts/reading/">Learner app</a><a href="#academic">Academic sets</a><a href="#general">General Training sets</a></nav>';
  if(url.searchParams.has('loaded')&&/^\d{1,2}$/.test(url.searchParams.get('loaded'))&&/^\d{1,2}$/.test(url.searchParams.get('unchanged')||''))body+=`<p class="note" role="status">Collection processed: ${esc(url.searchParams.get('loaded'))} new sets loaded; ${esc(url.searchParams.get('unchanged'))} matching sets already present.</p>`;
  body+=`<p>Signed in as ${esc(learner.email)}. These passages, questions, answers and evidence are private.</p><div class="stats"><div class="stat"><strong>${counts.academic}</strong>Academic sets</div><div class="stat"><strong>${counts.general}</strong>General Training sets</div><div class="stat"><strong>${questions}</strong>questions</div></div>`;
  if(preview)body+='<p class="note">Isolated preview database. The new collection is available for preview testing; independent editorial review is still pending. Candidates receive a random unseen set and cannot choose a set number. The 15-day completion limit remains in place.</p><details><summary>Load the complete private collection</summary><p>Upload the supplied JSON collection once. It contains five sets for each test type. Repeating the same upload will keep matching stored sets unchanged. Existing attempts and results are preserved.</p><form method="post" enctype="multipart/form-data" action="'+ADMIN+'/import"><label>Private question collection <input type="file" name="collection" accept=".json,application/json" required></label><label><input type="checkbox" name="previewConsent" required> Load for preview testing with independent review pending.</label><button type="submit">Load all ten sets together</button></form></details>';
  for(const track of ['academic','general']){
   body+=`<h2 id="${track}">${track==='academic'?'Academic':'General Training'}</h2>`;let number=0;
   for(const v of versions.filter(v=>v.track===track)){
    number++;const data=JSON.parse(v.content_json),key=JSON.parse(v.private_key_json||'{}');if(!Array.isArray(key.keys))throw Error('Invalid bank');let n=0,parts='';
    for(const [i,p] of data.passages.entries()){
     parts+=`<h3>Passage ${i+1}: ${esc(p.title)}</h3>${p.paragraphs.map(x=>`<p>${esc(x)}</p>`).join('')}<ol start="${n+1}">`;
     for(const q of p.questions){const correct=key.keys[n],opts=q[0]==='tf'?['TRUE','FALSE','NOT GIVEN']:q[2];parts+=`<li><strong>${esc(q[1])}</strong><ol type="A">${opts.map(x=>`<li>${esc(x)}</li>`).join('')}</ol><span class="answer">Answer: ${esc(opts[correct])}</span><p class="evidence">${esc(key.evidence?.[n]?.explanation||'Evidence not recorded.')}</p></li>`;n++;}parts+='</ol>';
    }
    const reviewed=key.review?.decision==='approved';
    body+=`<details><summary>Set ${number} · ${n} questions · ${v.approved_at?(preview?'Preview available':'Available'):'Not available'} · ${reviewed?'Review recorded':'Review pending'}</summary><p>Version: ${esc(v.id)}</p>${parts}</details>`;
   }
   if(!number)body+='<p>No sets have been loaded for this type.</p>';
  }
  return page('IELTS Reading admin',body);
 }catch(error){return page('Collection could not be loaded',`<p>${esc(error.status?error.message:'The service is temporarily unavailable. Please try again later.')}</p><p><a href="${ADMIN}">Back to Reading admin</a></p>`,error.status||503);}
}
