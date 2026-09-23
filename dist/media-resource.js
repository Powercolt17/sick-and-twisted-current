// Keep decoder ownership explicit. Releasing a paused video also frees its buffers.
export function createVideoResource(video,src,{timeout=12000,now=()=>performance.now()}={}){
 let pending=null,cancelLoad=null,playing=null,generation=0,retryAt=0;
 function attach(){if(!video.getAttribute('src')){video.src=src;video.preload='auto';return true;}return false;}
 function load(){
  const fresh=attach();if(video.readyState>=2)return Promise.resolve(true);if(pending)return pending;
  const promise=new Promise(resolve=>{
   let timer;const finish=ok=>{clearTimeout(timer);for(const event of ['loadeddata','canplay'])video.removeEventListener(event,loaded);video.removeEventListener('error',failed);if(cancelLoad===cancel)cancelLoad=null;resolve(ok);};
   const loaded=()=>finish(true),failed=()=>finish(false),cancel=()=>finish(false);cancelLoad=cancel;
   for(const event of ['loadeddata','canplay'])video.addEventListener(event,loaded);
   video.addEventListener('error',failed);timer=setTimeout(failed,timeout);
   if(fresh||video.networkState===0)video.load();
  });
  pending=promise;void promise.then(()=>{if(pending===promise)pending=null;});return promise;
 }
 function play(){
  attach();if(playing)return playing;if(now()<retryAt)return Promise.resolve(false);
  const token=generation;
  const promise=Promise.resolve().then(()=>token===generation?video.play():undefined).then(()=>token===generation&&!video.paused).catch(()=>{if(token===generation)retryAt=now()+1000;return false;});
  playing=promise;void promise.then(()=>{if(playing===promise)playing=null;});return promise;
 }
 function pause(){generation++;playing=null;video.pause();}
 function release(){pause();cancelLoad?.();pending=null;retryAt=0;if(video.getAttribute('src')){video.removeAttribute('src');video.preload='none';video.load();}}
 return {load,play,pause,release,get attached(){return !!video.getAttribute('src');}};
}
// Safari can discard a decoded frame between readyState and drawImage.
export function drawMediaFrame(ctx,source,...args){
 try{ctx.drawImage(source,...args);return true;}
 catch(error){if(error?.name==='InvalidStateError'||error?.name==='NS_ERROR_NOT_AVAILABLE')return false;throw error;}
}
