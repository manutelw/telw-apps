import clarion from './worker-oracy.js';
import base from './worker.js';

export default {
  fetch(request,env){
    const host=new URL(request.url).hostname;
    if(host==='manuvikraman.com' || host==='www.manuvikraman.com'){
      return base.fetch(request,env);
    }
    return clarion.fetch(request,env);
  }
};
