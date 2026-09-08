// ORACY shared audio runtime. Keeps audio unlocked across async TTS fetches without changing lesson content.
(function(){
  if(window.ORACY_AUDIO)return;
  let ctx=null;
  let currentSource=null;
  let currentElement=null;

  function getContext(){
    if(ctx)return ctx;
    const Ctx=window.AudioContext||window.webkitAudioContext;
    if(!Ctx)return null;
    ctx=new Ctx();
    return ctx;
  }

  function unlock(){
    const c=getContext();
    if(!c)return Promise.resolve(false);
    if(c.state==='running')return Promise.resolve(true);
    return c.resume().then(()=>c.state==='running').catch(()=>false);
  }

  function stop(){
    if(currentSource){try{currentSource.stop();}catch{} currentSource=null;}
    if(currentElement){try{currentElement.pause();currentElement.currentTime=0;}catch{} currentElement=null;}
  }

  async function playBlob(blob){
    stop();
    const c=getContext();
    if(c){
      await unlock();
      if(c.state==='running'){
        const buffer=await c.decodeAudioData(await blob.arrayBuffer());
        return await new Promise((resolve,reject)=>{
          try{
            const source=c.createBufferSource();
            source.buffer=buffer;source.connect(c.destination);currentSource=source;
            source.onended=()=>{if(currentSource===source)currentSource=null;resolve();};
            source.start();
          }catch(e){reject(e);}
        });
      }
    }
    const url=URL.createObjectURL(blob);
    try{return await playUrl(url);}finally{URL.revokeObjectURL(url);}
  }

  async function playUrl(url){
    stop();
    const c=getContext();
    if(c){
      await unlock();
      if(c.state==='running'){
        const res=await fetch(url);if(!res.ok)throw new Error('Audio could not be loaded.');
        const buffer=await c.decodeAudioData(await res.arrayBuffer());
        return await new Promise((resolve,reject)=>{
          try{
            const source=c.createBufferSource();source.buffer=buffer;source.connect(c.destination);currentSource=source;
            source.onended=()=>{if(currentSource===source)currentSource=null;resolve();};source.start();
          }catch(e){reject(e);}
        });
      }
    }
    return await new Promise((resolve,reject)=>{
      const audio=new Audio(url);currentElement=audio;
      audio.onended=()=>{if(currentElement===audio)currentElement=null;resolve();};
      audio.onerror=()=>reject(new Error('Audio could not be played.'));
      const p=audio.play();if(p&&p.catch)p.catch(reject);
    });
  }

  // Unlock at the earliest real learner gesture, before any TTS request has time to finish.
  const prime=()=>{unlock();};
  document.addEventListener('pointerdown',prime,{capture:true,passive:true});
  document.addEventListener('keydown',prime,{capture:true});
  document.addEventListener('touchstart',prime,{capture:true,passive:true});

  window.ORACY_AUDIO={getContext,unlock,stop,playBlob,playUrl};
})();
