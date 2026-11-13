import {handleTrainerPortal} from './workers/ielts/trainer-portal.mjs';
import {handleLearnerPortal} from './workers/ielts/learner-portal.mjs';
import {handlePayments} from './workers/ielts/payments.mjs';
import clarion from './worker-oracy.js';
import {onRequestPost as narrateAudioStudio} from './functions/oracy/audio-studio-narrator.js';
import base from './worker.js';
import {onRequestPost as evaluatePiPractice} from './functions/api/pi-practice/evaluate.js';
import {onRequestPost as coachPiStudio} from './functions/api/pi-studio/coach.js';

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
    return clarion.fetch(request,env);
  }
};
