import app from './worker-oracy.js';
import {handleAdminGateway,bridgeAdminHtml} from './admin-browser-gateway.js';

export default {
  async fetch(request,env,ctx){
    const gateway=await handleAdminGateway(request);
    if(gateway)return gateway;
    const response=await app.fetch(request,env,ctx);
    return bridgeAdminHtml(request,response);
  }
};
