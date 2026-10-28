import {handleAuth} from './server/auth.mjs';
import {handleDiagnostic} from './server/diagnostic.mjs';
const ORIGIN='https://manuvikraman.com',ROOT='/ielts/listening';
export default {async fetch(request,env){
 const url=new URL(request.url);
 if(url.origin!==ORIGIN)return new Response('Not found',{status:404});
 if(url.pathname===ROOT&&['GET','HEAD'].includes(request.method))return new Response(null,{status:308,headers:{location:ROOT+'/'}});
 if(!url.pathname.startsWith(ROOT+'/'))return new Response('Not found',{status:404});
 let response=await handleAuth(request,env)||await handleDiagnostic(request,env);
 if(!response){
  const assets=new Map([[ROOT+'/','/'],[ROOT+'/app.js','/app.js'],[ROOT+'/style.css','/style.css'],[ROOT+'/riverside-plan.svg','/riverside-plan.svg'],[ROOT+'/admin/','/admin.html'],[ROOT+'/admin.js','/admin.js']]);
  if(!['GET','HEAD'].includes(request.method)||!assets.has(url.pathname))response=new Response('Not found',{status:404});
  else {const asset=new URL(request.url);asset.pathname=assets.get(url.pathname);response=await env.ASSETS.fetch(new Request(asset,request));
   // Static Assets may canonicalise admin.html to /admin. Keep this internal.
   if(asset.pathname==='/admin.html'&&[301,302,307,308].includes(response.status)){const target=new URL(response.headers.get('location')||'',asset);if(target.origin===asset.origin&&['/admin','/admin/'].includes(target.pathname))response=await env.ASSETS.fetch(new Request(target,request));else response=new Response('Asset unavailable',{status:503});}}
 }
 const headers=new Headers(response.headers);headers.set('cache-control','private, no-store, max-age=0');headers.set('referrer-policy','same-origin');headers.set('x-content-type-options','nosniff');headers.set('x-frame-options','DENY');headers.set('x-robots-tag','noindex, nofollow, noarchive');
 return new Response(request.method==='HEAD'?null:response.body,{status:response.status,headers});
}};
