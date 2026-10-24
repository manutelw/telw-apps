import clarion from './worker-oracy.js';
import base from './worker.js';
import {onRequestPost as evaluatePiPractice} from './functions/api/pi-practice/evaluate.js';
import {onRequestPost as coachPiStudio} from './functions/api/pi-studio/coach.js';

export default {
  fetch(request,env){
    const url=new URL(request.url);
    const host=url.hostname;
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
