// The supplied film is played unchanged, once per confirmed Blood Money entry.
// Its media clock never advances spins or credits; Continue advances to the rules poster.
export function createBloodCinematic({canvas,stage,W,H,getAudio,isMuted,onMix=()=>{}}){
 const video=document.createElement('video');video.src='assets/blood-outlaws/intro.mp4';video.preload='metadata';video.playsInline=true;video.loop=false;video.hidden=true;
 const controls=document.createElement('div');controls.hidden=true;controls.setAttribute('role','dialog');controls.setAttribute('aria-label','Blood Money opening film');
 controls.style.cssText='position:absolute;inset:0;z-index:27;pointer-events:none;';
 const skip=document.createElement('button');skip.type='button';skip.textContent='CONTINUE';skip.setAttribute('aria-label','Continue to Blood Money bounty');
 skip.style.cssText='position:absolute;transform:translateX(-50%);pointer-events:auto;width:200px;max-width:calc(100% - 24px);height:48px;padding:10px 18px;background:#21160ff5;border:1px solid #b69b70;box-shadow:0 3px 16px #000b;color:#f0dfbd;font:bold 18px Georgia,serif;letter-spacing:1.5px;cursor:pointer;';
 const sound=document.createElement('button');sound.type='button';sound.style.cssText='position:absolute;right:14px;top:14px;pointer-events:auto;min-height:40px;padding:8px 14px;background:#21160fec;border:1px solid #b69b70;color:#f0dfbd;font:13px Arial;cursor:pointer;';
 const replay=document.createElement('button');replay.type='button';replay.textContent='PLAY INTRO';replay.hidden=true;replay.style.cssText=skip.style.cssText+'left:50%;bottom:48%;';
 controls.append(skip,sound,replay);stage.append(video,controls);
 let state=null,source=null,serial=0,loadingTimer=null;
 function layoutContinue(){
  // Anchor to the visible movie viewport, not the taller stage containing the HUD.
  const viewport=canvas.parentElement.getBoundingClientRect(),bounds=stage.getBoundingClientRect();
  skip.style.left=(viewport.left-bounds.left+viewport.width/2)+'px';
  skip.style.top=(viewport.bottom-bounds.top-60)+'px';
 }
 function syncMute(){video.muted=isMuted();sound.textContent=isMuted()?'SOUND OFF':'SOUND ON';sound.setAttribute('aria-label',isMuted()?'Enable intro sound':'Mute intro sound');}
 function finish(advance=true){
  if(!state)return false;const old=state;state=null;clearTimeout(loadingTimer);video.pause();controls.hidden=true;replay.hidden=true;
  const ctx=canvas.getContext('2d');ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(old.frozen,0,0,canvas.width,canvas.height);ctx.restore();
  old.resolve(advance);if(!advance)onMix(false);return true;
 }
 async function resume(){
  if(!state||state.paused)return;syncMute();
  try{await getAudio()?.context?.resume();await video.play();replay.hidden=true;}catch{if(state)replay.hidden=false;}
 }
 video.addEventListener('ended',()=>finish(true));video.addEventListener('error',()=>finish(true));
 video.addEventListener('playing',()=>clearTimeout(loadingTimer));
 skip.onclick=()=>finish(true);replay.onclick=resume;
 const key=e=>{if(state&&['Escape','Space','Enter'].includes(e.code)&&e.target!==sound&&e.target!==replay){e.preventDefault();e.stopImmediatePropagation();finish(true);}};
 document.addEventListener('keydown',key,true);
 function setPaused(paused){if(!state||state.paused===paused)return;state.paused=paused;if(paused)video.pause();else resume();}
 document.addEventListener('visibilitychange',()=>setPaused(document.hidden));window.addEventListener('pagehide',()=>finish(false));
 function play(options){
  if(state)return Promise.resolve(false);
  const frozen=document.createElement('canvas');frozen.width=W;frozen.height=H;frozen.getContext('2d').drawImage(canvas,0,0,W,H);
  const output=getAudio();if(output?.context&&!source){source=output.context.createMediaElementSource(video);source.connect(output.master||output.context.destination);}
  video.currentTime=0;onMix(true);layoutContinue();controls.hidden=false;syncMute();skip.focus({preventScroll:true});
  return new Promise(resolve=>{state={...options,id:++serial,frozen,resolve,paused:document.hidden};
   // A missing movie must not strand a confirmed feature award.
   loadingTimer=setTimeout(()=>{if(state&&video.readyState<2)finish(true);},8000);resume();
  });
 }
 function draw(ctx){
  if(!state)return false;layoutContinue();ctx.save();ctx.fillStyle='#080604';ctx.fillRect(0,0,W,H);
  const cr=canvas.getBoundingClientRect(),vr=canvas.parentElement.getBoundingClientRect(),left=(vr.left-cr.left)*W/cr.width,width=vr.width*W/cr.width;
  if(video.readyState>=2){const scale=Math.min(width/video.videoWidth,H/video.videoHeight),w=video.videoWidth*scale,h=video.videoHeight*scale;ctx.drawImage(video,left+(width-w)/2,(H-h)/2,w,h);}
  else{ctx.drawImage(state.frozen,0,0,W,H);ctx.fillStyle='#080604b8';ctx.fillRect(0,0,W,H);ctx.fillStyle='#ecd9b7';ctx.textAlign='center';ctx.font='30px Western';ctx.fillText('BLOOD MONEY',left+width/2,H/2);}
  ctx.restore();return true;
 }
 return {play,draw,syncMute,setPaused,cancel:()=>finish(false),skip:()=>finish(true),setMuteToggle:fn=>sound.onclick=fn,
  get active(){return !!state;},get snapshot(){return state?.frozen||null;},
  get state(){return {active:!!state,phase:'film',time:video.currentTime,paused:state?.paused||false,awardedSpins:state?.awardedSpins??null,cells:state?.cells||[],canContinue:!!state,recordedMedia:true,duration:video.duration||56};}};
}
