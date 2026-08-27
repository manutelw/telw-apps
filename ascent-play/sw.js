const CACHE='ascent-play-core-v2';
const CORE=['./index.html','./register.html','./home.html','./practice.html','./play-core-guard.js','./manifest.webmanifest'];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).catch(()=>{}));
  self.skipWaiting();
});

self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET') return;

  const url=new URL(request.url);
  if(url.origin!==self.location.origin) return;

  event.respondWith((async()=>{
    try{
      const response=await fetch(request,{cache:'no-store'});
      if(response&&response.ok&&url.pathname.startsWith('/ascent-play/')){
        const copy=response.clone();
        caches.open(CACHE).then(cache=>cache.put(request,copy)).catch(()=>{});
      }
      return response;
    }catch(error){
      const cached=await caches.match(request);
      if(cached) return cached;
      if(request.mode==='navigate'){
        const shell=await caches.match('./index.html');
        if(shell) return shell;
      }
      return new Response('ASCENT is temporarily offline. Reconnect and try again.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
    }
  })());
});