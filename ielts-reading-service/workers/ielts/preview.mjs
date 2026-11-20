// A separate Worker for isolated IELTS preview testing. Never import this entry in the production router.
import {handleAuth,reply} from './auth.mjs';
import {handleReading} from './reading.mjs';
import {handleAdmin} from './admin.mjs';
const PREVIEW_ORIGIN='https://telw-ielts-preview-worker.manutelw.workers.dev';
const CANONICAL_ORIGIN='https://manuvikraman.com';
export default {
 async fetch(request,env) {
  const url=new URL(request.url);
  if(url.origin!==PREVIEW_ORIGIN)return new Response('Not found',{status:404});
  if(['/','/ielts/reading','/ielts/reading/'].includes(url.pathname)) {
   if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});
   const asset=new URL(request.url);asset.pathname='/';
   const response=await env.ASSETS.fetch(new Request(asset,request));
   const headers=new Headers(response.headers);headers.set('cache-control','no-store');headers.set('x-robots-tag','noindex, nofollow, noarchive');
   return new Response(response.body,{status:response.status,headers});
  }
  if(!url.pathname.startsWith('/api/ielts/') && !['/ielts/reading/admin','/ielts/reading/admin/'].includes(url.pathname))return new Response('Not found',{status:404});
  // Validate the actual Origin first; the test-only adapter then maps it to the
  // production contract expected by the shared identity and Reading modules.
  if(request.method!=='GET' && request.headers.get('origin')!==PREVIEW_ORIGIN)return reply({error:'Forbidden'},403);
  const headers=new Headers(request.headers);
  if(request.method!=='GET')headers.set('origin',CANONICAL_ORIGIN);
  const target=new URL(request.url);target.host='manuvikraman.com';
  const mapped=new Request(target.toString(),{method:request.method,headers,...(request.body?{body:request.body,duplex:'half'}:{})});
  const previewEnv={...env,IELTS_VERIFICATION_PUBLIC_ORIGIN:PREVIEW_ORIGIN,IELTS_PREVIEW_BANK_IMPORT:PREVIEW_ORIGIN};
  return await handleAdmin(mapped,previewEnv) || await handleAuth(mapped,previewEnv) || await handleReading(mapped,previewEnv) || new Response('Not found',{status:404});
 }
};
