import {handleTrainerPortal} from './workers/ielts/trainer-portal.mjs';
import {handleLearnerPortal} from './workers/ielts/learner-portal.mjs';
import {handlePayments} from './workers/ielts/payments.mjs';
import clarion from './worker-oracy.js';
import {onRequestPost as narrateAudioStudio} from './functions/oracy/audio-studio-narrator.js';
import base from './worker.js';
import {onRequestPost as evaluatePiPractice} from './functions/api/pi-practice/evaluate.js';
import {onRequestPost as coachPiStudio} from './functions/api/pi-studio/coach.js';

// TELW header bar on the ClarionPrep pages that manuvikraman.com links to, so visitors feel they are still on TELW.
const TELW_BAR_PATHS=new Set(['/','/index.html','/account','/account/','/account/index.html','/ascent/institution.html']);
const TELW_BAR_HTML='<div class="telwbar" role="banner"><div class="telwbar-in"><a class="telwbar-brand" href="https://manuvikraman.com/"><img src="https://manuvikraman.com/telw-logo.png" alt="" width="34" height="34"><span><b>TELW</b><small>ClarionPrep is TELW&#8217;s practice platform</small></span></a><nav class="telwbar-nav" aria-label="TELW"><a href="https://manuvikraman.com/#programmes">Programmes</a><a href="https://manuvikraman.com/ielts/">IELTS</a><a href="https://manuvikraman.com/trainer-profile/">Trainer</a><a href="https://manuvikraman.com/#contact">Contact</a></nav><a class="telwbar-back" href="https://manuvikraman.com/">&#8592; Back to TELW</a></div></div>';
const TELW_BAR_CSS='<style id="telwbar-css">.telwbar{background:#f5f4f0;border-bottom:3px solid #c9953a;font-family:Arial,Helvetica,sans-serif;position:relative;z-index:50}.telwbar-in{max-width:1180px;margin:0 auto;padding:8px 20px;display:flex;align-items:center;gap:22px}.telwbar a{text-decoration:none;color:#13233f}.telwbar-brand{display:flex;align-items:center;gap:10px}.telwbar-brand img{width:34px;height:34px;border-radius:50%;background:#fff}.telwbar-brand b{display:block;font:700 18px Georgia,serif;letter-spacing:.02em}.telwbar-brand small{display:block;font-size:12px;color:#5b6676}.telwbar-nav{display:flex;gap:18px;margin-left:auto;font-size:14px}.telwbar-nav a:hover{text-decoration:underline}.telwbar-back{border:1px solid #13233f;border-radius:6px;padding:7px 12px;font-size:14px;font-weight:700;white-space:nowrap}.telwbar-back:hover{background:#13233f;color:#fff!important}@media(max-width:760px){.telwbar-nav{display:none}.telwbar-back{margin-left:auto}.telwbar-brand small{display:none}}</style>';
async function withTelwBar(request,response){
  const url=new URL(request.url);
  if(url.hostname!=='clarionprep.com'&&url.hostname!=='www.clarionprep.com')return response;
  if(!TELW_BAR_PATHS.has(url.pathname)||url.searchParams.has('slug'))return response;
  if(!(response.headers.get('content-type')||'').includes('text/html'))return response;
  return new HTMLRewriter()
    .on('head',{element(e){e.append(TELW_BAR_CSS,{html:true})}})
    .on('body',{element(e){e.prepend(TELW_BAR_HTML,{html:true})}})
    .transform(response);
}

export default {
  async fetch(request,env){
    const url=new URL(request.url);
    const host=url.hostname;
    if(url.pathname.startsWith('/workers/ielts/'))return new Response('Not found',{status:404});
    // The Communication Performance Diagnostic is its own Worker (telw-performance), served at manuvikraman.com/diagnostic/.
    if((host==='manuvikraman.com'||host==='www.manuvikraman.com')&&(url.pathname==='/diagnostic'||url.pathname.startsWith('/diagnostic/'))){
      if(host==='www.manuvikraman.com'||url.pathname==='/diagnostic')return new Response(null,{status:308,headers:{location:'https://manuvikraman.com'+(url.pathname==='/diagnostic'?'/diagnostic/':url.pathname)+url.search}});
      if(!env.PERF_SERVICE?.fetch)return new Response('The diagnostic is not available right now.',{status:503});
      const inner=new URL(request.url);inner.pathname=url.pathname.slice('/diagnostic'.length);
      return env.PERF_SERVICE.fetch(new Request(inner.toString(),request));
    }
    const trainerPortal=await handleTrainerPortal(request,env);
    if(trainerPortal)return trainerPortal;
    const payments=await handlePayments(request,env);
    if(payments)return payments;
    const learnerPortal=await handleLearnerPortal(request,env);
    if(learnerPortal)return learnerPortal;
    if(url.pathname==='/ielts-reading-scoring-private.js')return new Response('Not found',{status:404});
    if(url.pathname==='/oracy/audio-studio-narrator'){
      if(host!=='clarionprep.com'&&host!=='www.clarionprep.com')return new Response('Not found',{status:404});
      if(request.method!=='POST')return new Response('POST required',{status:405});
      return narrateAudioStudio({request,env});
    }
    if(url.pathname==='/api/pi-studio/coach'){
      if(host!=='clarionprep.com'&&host!=='www.clarionprep.com')return new Response('Not found',{status:404});
      if(request.method!=='POST')return new Response(JSON.stringify({error:'POST required'}),{status:405,headers:{'content-type':'application/json'}});
      return coachPiStudio({request,env});
    }
    if(url.pathname==='/api/pi-practice/evaluate'){
      if(host!=='clarionprep.com'&&host!=='www.clarionprep.com')return new Response('Not found',{status:404});
      if(request.method!=='POST')return new Response(JSON.stringify({error:'POST required'}),{status:405,headers:{'content-type':'application/json'}});
      return evaluatePiPractice({request,env});
    }
    if(host==='manuvikraman.com' || host==='www.manuvikraman.com'){
      return base.fetch(request,env);
    }
    return withTelwBar(request,await clarion.fetch(request,env));
  }
};
