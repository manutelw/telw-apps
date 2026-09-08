const TARGETS=new Set(['/module-1-1.html','/module-1-2.html','/module-1-3.html']);
const AUDIO_SCRIPT='./pcl-audio-fallback.js?v=3';
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=='GET'||url.origin!==self.location.origin||!TARGETS.has(url.pathname)) return;
  event.respondWith((async()=>{
    const response=await fetch(event.request,{cache:'no-store'});
    const type=response.headers.get('content-type')||'';
    if(!response.ok||!type.includes('text/html')) return response;
    let html=await response.text();
    if(!html.includes('pcl-audio-fallback.js')){
      html=html.replace('</body>',`<script src="${AUDIO_SCRIPT}"></script></body>`);
    }else{
      html=html.replace(/\.\/pcl-audio-fallback\.js(?:\?v=\d+)?/g,AUDIO_SCRIPT);
    }
    const headers=new Headers(response.headers);
    headers.delete('content-length');
    headers.set('cache-control','no-store');
    return new Response(html,{status:response.status,statusText:response.statusText,headers});
  })());
});
