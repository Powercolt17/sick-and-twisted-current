import './win-controller.js?v=3';
const API=window.SickTwistedWin;
export function createApprovedWin({stage,gameCanvas,winDisplay,G,worldWidth,isMuted,onSoundToggle,onMix=()=>{},onComplete=()=>{}}){
 const layer=document.createElement('section');layer.id='approved-win-layer';layer.hidden=true;layer.setAttribute('aria-label','Win celebration');
 const canvas=document.createElement('canvas');canvas.id='approved-win-canvas';canvas.setAttribute('role','img');canvas.setAttribute('aria-label','Sick & Twisted win celebration');
 const controls=document.createElement('div');controls.className='approved-win-controls';
 const mute=document.createElement('button');mute.type='button';
 const skip=document.createElement('button');skip.type='button';skip.textContent='SKIP';skip.setAttribute('aria-label','Skip win celebration to exact total');
 const status=document.createElement('span');status.className='sr-only';status.setAttribute('role','status');
 controls.append(mute,skip);layer.append(canvas,controls,status);stage.append(layer);
 const audio=new Audio(new URL('assets/approved-win/win-timeline.wav',import.meta.url));audio.preload='auto';audio.muted=isMuted();
 let controller=null,loading=null,active=false,complete=true,layout=null,previousFocus=null,plays=0,finishes=0,amountMinor=0,skipRequested=false;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 function resize(){
  if(!active){canvas.width=canvas.height=1;return;}
  const root=stage.getBoundingClientRect(),scene=gameCanvas.getBoundingClientRect(),target=winDisplay.getBoundingClientRect();
  if(!root.width||!root.height)return;
  const worldScale=scene.width/worldWidth,reelWidth=G.w*worldScale,reelX=scene.left-root.left+(G.x+G.w/2)*worldScale,reelY=scene.top-root.top+(G.y+G.h/2)*worldScale;
  const verticalRoom=2*Math.max(1,Math.min(reelY,root.height-reelY));
  const scale=Math.min(reelWidth/792,verticalRoom*.94/728),x=reelX-665*scale,y=reelY-404*scale;
  layout={width:root.width,height:root.height,scale,x,y,targetX:(target.left-root.left+target.width/2-x)/scale,targetY:(target.top-root.top+target.height/2-y)/scale};
  // Preserve the reference's 1440-pixel master on wide screens; mobile stays crisp at 2x.
  const d=Math.min(2,devicePixelRatio||1,1440/root.width),w=Math.round(root.width*d),h=Math.round(root.height*d);
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
  if(controller)controller.redraw();
 }
 function syncMute(){const value=isMuted();audio.muted=value;controller?.setMuted(value);mute.textContent=value?'SOUND OFF':'SOUND ON';mute.setAttribute('aria-pressed',String(!value));mute.setAttribute('aria-label',value?'Enable sound during win celebration':'Mute win celebration');}
 function load(){
  if(!loading)loading=(async()=>{
   const atlas=new Image();atlas.src=new URL('assets/approved-win/win-cards.webp',import.meta.url);await Promise.all([atlas.decode(),document.fonts.load('40px ApprovedWinOutlaw'),document.fonts.load('40px ApprovedWinWestern')]);
   const response=await fetch(audio.src);if(!response.ok)throw Error('Approved win audio '+response.status);const blob=await response.blob();audio.src=URL.createObjectURL(blob);audio.load();
   controller=API.createController({canvas,atlas,audio,reducedMotion:reduced.matches,getLayout:()=>layout,onFrame:s=>{
    canvas.dataset.amountMinor=String(s.amountMinor);canvas.dataset.multiplier=s.maxMultiplier?String(s.multiplier):'';canvas.dataset.phase=s.phase;canvas.dataset.time=s.time.toFixed(3);
    if(s.amountMinor===amountMinor)status.textContent='Total win '+formatMinor(amountMinor);
   }});syncMute();resize();
  })();return loading;
 }
 function finish(result){
  if(complete)return;complete=true;active=false;finishes++;audio.pause();layer.hidden=true;layer.dataset.active='false';canvas.width=canvas.height=1;onMix(false);onComplete(result);
  if(previousFocus?.isConnected&&!previousFocus.disabled)previousFocus.focus({preventScroll:true});
 }
 async function begin(value,{maxMultiplier=0}={}){
  API.validateAmount(value);API.validateAmount(maxMultiplier);if(active)return;
  active=true;complete=false;skipRequested=false;amountMinor=value;plays++;previousFocus=document.activeElement;onMix(true);layer.hidden=false;layer.dataset.active='true';skip.disabled=false;status.textContent=(maxMultiplier?'77,777× MAX WIN · ':'Win ')+formatMinor(value);layer.dataset.variant=maxMultiplier?'max':'large';canvas.setAttribute('aria-label',maxMultiplier?'77,777 times MAX WIN · '+formatMinor(value):'Sick & Twisted win celebration');resize();
  try{await load();if(!active)return;syncMute();controller.play({amountMinor:value,maxMultiplier,onComplete:finish});if(skipRequested)controller.skip();else skip.focus({preventScroll:true});}
  catch(error){console.error('Approved win could not load',error);status.textContent='Total win '+formatMinor(value);finish({amountMinor:value,reason:'asset-error'});}
 }
 function doSkip(){if(!active)return;skipRequested=true;skip.disabled=true;controller?.skip();}
 skip.addEventListener('click',doSkip);mute.addEventListener('click',()=>{onSoundToggle();syncMute();});
 function key(e){if(!active)return;if(['Space','Escape','Enter'].includes(e.code)){if(e.target===mute&&e.code!=='Escape')return;e.preventDefault();e.stopImmediatePropagation();doSkip();}}
 document.addEventListener('keydown',key,true);
 const observer=new ResizeObserver(resize);observer.observe(stage);observer.observe(gameCanvas);observer.observe(winDisplay);
 function clear(){controller?.cancel();if(active)finish({amountMinor,reason:'cancel'});audio.pause();layer.hidden=true;}
 function destroy(){clear();observer.disconnect();document.removeEventListener('keydown',key,true);window.removeEventListener('pagehide',clear);controller?.destroy();if(audio.src.startsWith('blob:'))URL.revokeObjectURL(audio.src);layer.remove();}
 window.addEventListener('pagehide',clear);
 return {load,begin,clear,destroy,syncMute,skip:doSkip,setPaused(v){v?controller?.pause():controller?.resume();},get active(){return active;},get complete(){return complete;},get canvas(){return canvas;},get audio(){return audio;},get state(){return {active,complete,amountMinor,plays,finishes,muted:audio.muted,audioTime:audio.currentTime,layout,...controller?.state};}};
}
export function formatMinor(value){const n=BigInt(value);return '$'+(n/100n).toLocaleString('en-US')+'.'+String(n%100n).padStart(2,'0');}
