const TARGETS=new Set(['/module-1-1.html','/module-1-2.html','/module-1-3.html']);
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=='GET'||url.origin!==self.location.origin||!TARGETS.has(url.pathname)) return;
  event.respondWith((async()=>{
    const response=await fetch(event.request);
    const type=response.headers.get('content-type')||'';
    if(!response.ok||!type.includes('text/html')) return response;
    let html=await response.text();
    if(!html.includes('pcl-audio-fallback.js')){
      html=html.replace('</body>','<script src="./pcl-audio-fallback.js"></script></body>');
    }
    const headers=new Headers(response.headers);
    headers.delete('content-length');
    return new Response(html,{status:response.status,statusText:response.statusText,headers});
  })());
});
