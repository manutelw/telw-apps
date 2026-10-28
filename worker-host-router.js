import {handleTrainerPortal} from './workers/ielts/trainer-portal.mjs';
import {scoreIeltsReading,sendIeltsReadingEnquiry,emailIeltsReadingFeedback} from './ielts-reading-scoring-private.js';
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
    const trainerPortal=await handleTrainerPortal(request,env);
    if(trainerPortal)return trainerPortal;
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
