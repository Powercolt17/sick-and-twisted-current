/* Supplied controller hardened for the game lifecycle. No settlement writes. */
import './win-animation.js?v=3';
(function(root){
 'use strict';
 root.SickTwistedWin.createController=function({canvas,atlas,audio=null,reducedMotion=false,onFrame=null,getLayout=()=>null}){
  const api=root.SickTwistedWin,renderer=api.createRenderer({canvas,atlas});
  let running=false,paused=false,raf=0,timer=0,started=0,offset=0,amount=0,maxMultiplier=0,done=null,useAudio=false,muted=true,generation=0;
  let completion=null,resolve=null,skipping=false,skipStarted=0,lastTime=0;
  const now=()=>performance.now()/1000;
  const time=()=>paused?offset:useAudio&&audio?audio.currentTime:offset+now()-started;
  function paint(t){lastTime=t;const state=renderer.draw(t,{amountMinor:amount,maxMultiplier,reducedMotion,transparent:true,layout:getLayout()});if(onFrame)onFrame({...state,time:t,skipping});return state;}
  function unschedule(){cancelAnimationFrame(raf);clearTimeout(timer);raf=timer=0;}
  // Some visible/occluded browser windows throttle RAF while audio keeps playing.
  // Race one timer with RAF, then cancel the loser: one draw, one authoritative clock.
  function schedule(){unschedule();raf=requestAnimationFrame(tick);timer=setTimeout(tick,1000/60);}
  function halt(){unschedule();if(audio)audio.pause();running=false;paused=false;}
  function complete(reason='complete'){
   if(!running)return;const cb=done,once=resolve;done=null;resolve=null;generation++;halt();paint(api.DURATION);
   const result={amountMinor:amount,reason};try{if(cb)cb(result);}finally{if(once)once(result);}
  }
  function tick(){
   unschedule();if(!running||paused)return;const t=time();
   if(skipping){paint(api.TIMES.hold);if(t-skipStarted>=.4){complete('skip');return;}}
   else if(t>=api.DURATION){complete();return;}else paint(t);
   schedule();
  }
  function attemptAudio(token){
   if(!audio||skipping)return;
   Promise.resolve(audio.play()).then(()=>{
    if(token!==generation)return; // An old play promise must never pause a newer win.
    if(!running||paused||skipping){audio.pause();return;}
    audio.currentTime=Math.min(time(),api.DURATION);useAudio=true;
   }).catch(()=>{if(token===generation)useAudio=false;});
  }
  function play({amountMinor,maxMultiplier:requestedMultiplier=0,onComplete}={}){
   api.validateAmount(amountMinor);api.validateAmount(requestedMultiplier);if(running)return completion;
   const token=++generation;amount=amountMinor;maxMultiplier=requestedMultiplier;done=typeof onComplete==='function'?onComplete:null;skipping=false;
   completion=new Promise(r=>{resolve=r;});running=true;paused=false;offset=0;started=now();lastTime=0;useAudio=false;paint(0);
   if(audio){audio.pause();audio.currentTime=0;audio.muted=muted;}
   if(document.hidden){paused=true;return completion;}
   attemptAudio(token);schedule();return completion;
  }
  function pause(){if(!running||paused)return;offset=time();paused=true;unschedule();if(audio)audio.pause();}
  function resume(){if(!running||!paused)return;paused=false;started=now();useAudio=false;attemptAudio(generation);schedule();}
  function ended(){if(running&&useAudio){offset=audio.currentTime;started=now();useAudio=false;}}
  function failed(){if(running&&useAudio){offset=lastTime;started=now();useAudio=false;}}
  if(audio){audio.addEventListener('ended',ended);audio.addEventListener('error',failed);audio.addEventListener('stalled',failed);}
  function skip(){
   if(!running||skipping)return;offset=time();started=now();skipStarted=offset;skipping=true;useAudio=false;
   if(audio)audio.pause();paint(api.TIMES.hold);unschedule();if(!paused)schedule();
  }
  function cancel(){if(running)complete('cancel');canvas.getContext('2d').clearRect(0,0,canvas.width,canvas.height);}
  function destroy(){cancel();if(audio){audio.removeEventListener('ended',ended);audio.removeEventListener('error',failed);audio.removeEventListener('stalled',failed);}}
  return {play,pause,resume,skip,cancel,destroy,redraw(){if(running)paint(skipping?api.TIMES.hold:lastTime);},setMuted(v){muted=!!v;if(audio)audio.muted=muted;},get active(){return running;},get paused(){return paused;},get state(){return {active:running,paused,time:lastTime,amountMinor:amount,maxMultiplier,skipping,clock:useAudio?'audio':'monotonic'};}};
 };
})(window);
