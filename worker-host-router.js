import {handleAuth,getLearner,requireSameOrigin,readJson,reply,limit} from './workers/ielts/auth.mjs';
import {scoreIeltsReading,sendIeltsReadingEnquiry,emailIeltsReadingFeedback} from './ielts-reading-scoring-private.js';
import clarion from './worker-oracy.js';
import base from './worker.js';
import {onRequestPost as evaluatePiPractice} from './functions/api/pi-practice/evaluate.js';
import {onRequestPost as coachPiStudio} from './functions/api/pi-studio/coach.js';

export default {
  async fetch(request,env){
    const url=new URL(request.url);
    const host=url.hostname;
    if(url.pathname.startsWith('/workers/ielts/') || url.pathname.startsWith('/tests/ielts/') || url.pathname.startsWith('/migrations/ielts/')) return new Response('Not found',{status:404});
    const auth=await handleAuth(request,env);
    if(auth) return auth;
    if(host==='manuvikraman.com' && ['/api/ielts-reading/score','/api/ielts-reading/feedback-email','/api/ielts-reading/enquire'].includes(url.pathname)){
      if(request.method!=='POST') return reply({error:'POST required'},405,{allow:'POST'});
      try {
        requireSameOrigin(request);
        const learner=await getLearner(request,env);
        if(!learner) return reply({error:'Please verify your email before taking the diagnostic.'},401);
        await limit(env,'legacy:'+url.pathname+':'+learner.id,3600,url.pathname.endsWith('/score')?60:5,Math.floor(Date.now()/1000));
        const body=await readJson(request,16384);
        // Candidate and enquiry recipients come from verified identity, never form input.
        body.email=learner.email;
        request=new Request(request.url,{method:'POST',headers:request.headers,body:JSON.stringify(body)});
      } catch(error) {
        return reply({error:error.status?error.message:'Verification is temporarily unavailable.'},error.status||503);
      }
    }
    if(url.pathname==='/api/ielts-reading/score'){
      if(host!=='manuvikraman.com')return new Response('Not found',{status:404});
      return scoreIeltsReading(request);
    }
    if(url.pathname==='/api/ielts-reading/feedback-email'){
      if(host!=='manuvikraman.com')return new Response('Not found',{status:404});
      return emailIeltsReadingFeedback(request,env);
    }
    if(url.pathname==='/api/ielts-reading/enquire'){
      if(host!=='manuvikraman.com')return new Response('Not found',{status:404});
      return sendIeltsReadingEnquiry(request,env);
    }
    if(url.pathname==='/ielts-reading-scoring-private.js')return new Response('Not found',{status:404});
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
