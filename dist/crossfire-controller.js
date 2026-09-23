import './crossfire.js?v=7';
import {WIN_SHOT_FILES,WIN_SHOT_DURATION,winShotEvents} from './win-shot-audio.js?v=4';
const FX=globalThis.SickTwistedCrossfire;

// The resolver owns these cells. Never infer an award from the displayed symbols.
export function payingCells(cells,groups,{columns=6,rows=4}={}){
 const valid=p=>Array.isArray(p)&&p.length===2&&p.every(Number.isInteger)&&p[0]>=0&&p[0]<columns&&p[1]>=0&&p[1]<rows;
 const awarded=new Set((groups||[]).filter(g=>g.symbol!=='scatter'&&g.value>0).flatMap(g=>(g.cells||[]).filter(valid).map(p=>p.join(':'))));
 return [...new Map((cells||[]).filter(p=>valid(p)&&awarded.has(p.join(':'))).map(p=>[p.join(':'),p.slice()])).values()];
}

// Mark has already supplied the anticipation. Move the whole following volley
// earlier without changing contact spacing, travel or the single audio burst.
export function tightenCrossfireLead(sequence){
 const first=sequence.shots[0];if(!first)return sequence;
 const shift=Math.max(0,first.fire-.06/sequence.speed);
 for(const shot of sequence.shots){shot.fire-=shift;shot.impact-=shift;}
 sequence.last-=shift;sequence.settle-=shift;sequence.duration-=shift;
 sequence.referenceAudio=false;return sequence;
}

// Win-impact events use V2's exact hit times, with seekable sources so hiding,
// skipping or interrupting never leaves an old scheduled volley behind.
export function scheduleCrossfireAudio(context,sequence,buffers,{destination=context.destination,offset=0,muted=false}={}){
 const startAt=context.currentTime+.03,bus=context.createGain(),nodes=new Set();
 bus.gain.value=muted?0:1;
 bus.connect(destination);
 function play(buffer,at,pan,gain,panEnd,travel,endAt=Infinity){
  if(!buffer)return;const rate=panEnd===undefined?1:buffer.duration/travel;
  if(Math.min(at+buffer.duration/rate,endAt)<=offset)return;
  const source=context.createBufferSource(),vol=context.createGain(),p=context.createStereoPanner();
  const seek=Math.max(0,offset-at),when=startAt+Math.max(0,at-offset);
  source.buffer=buffer;source.playbackRate.value=rate;vol.gain.value=gain;
  const position=panEnd===undefined?pan:pan+(panEnd-pan)*Math.min(1,seek/travel);
  p.pan.setValueAtTime(position,when);
  if(panEnd!==undefined)p.pan.linearRampToValueAtTime(panEnd,when+Math.max(0,travel-seek));
  source.connect(vol);vol.connect(p);p.connect(bus);nodes.add(source);
  source.onended=()=>{nodes.delete(source);source.disconnect();vol.disconnect();p.disconnect();};
  if(Number.isFinite(endAt)){
   const endWhen=startAt+endAt-offset,fadeAt=Math.max(when,endWhen-.08);
   vol.gain.setValueAtTime(gain*Math.min(1,Math.max(0,(endWhen-when)/.08)),when);
   if(fadeAt>when)vol.gain.setValueAtTime(gain,fadeAt);
   vol.gain.linearRampToValueAtTime(0,endWhen);
   source.start(when,seek*rate);source.stop(endWhen);
  }else source.start(when,seek*rate);
 }
 // Use the user's isolated gun burst once. Never stack the complete burst
 // per bullet or mix it with the old sounds or a recorded game soundtrack.
 for(const event of winShotEvents(sequence)){
  const bank=buffers[event.kind];
  if(bank?.length)play(bank[event.take%bank.length],event.at,event.pan,event.gain,undefined,undefined,sequence.duration);
 }
 let stopped=false;
 return {time:()=>offset+Math.max(0,context.currentTime-startAt),get pending(){return nodes.size;},
  mute(value){if(!stopped)bus.gain.setTargetAtTime(value?0:1,context.currentTime,.008);},
  stop(){if(stopped)return;stopped=true;bus.gain.cancelScheduledValues(context.currentTime);bus.gain.setValueAtTime(0,context.currentTime);for(const n of nodes){try{n.stop();}catch{}}nodes.clear();bus.disconnect();}};
}

export function createCrossfireController({width,height,grid,getAudio=()=>null,buffers={},assets={},now=()=>performance.now(),isMuted=()=>true,onMix=()=>{},onChange=()=>{},onSequence=()=>{},reduced=false}){
 let state=null,voice=null,context=null,destination=null,epoch=0,offset=0,plays=0,finishes=0;
 const time=()=>!state?0:state.complete||state.paused?state.time:voice?voice.time():offset+(now()-epoch)/1000;
 function stopVoice(){voice?.stop();voice=null;}
 function startClock(){
  epoch=now();
  if(context?.state==='running')voice=scheduleCrossfireAudio(context,state.sequence,buffers,{destination,offset,muted:isMuted()});
 }
 function finish(reason){if(!state||state.complete)return;state.time=reason==='complete'||reason==='skip'?state.sequence.duration:time();state.complete=true;state.reason=reason;finishes++;stopVoice();onMix(false);onChange(snapshot());}
 function tick(){
  if(!state||state.complete||state.paused)return time();
  // A blocked/interrupted audio context must not strand a muted or visible round.
  if(voice&&context.state!=='running'){offset=voice.time();stopVoice();epoch=now();}
  else if(!voice&&context?.state==='running'){offset=time();startClock();}
  state.time=time();if(state.time>=state.sequence.duration)finish('complete');return state.time;
 }
 function begin(cells,speed=1,options={}){
  clear();const sequence=FX.createSequence(cells,{width,height,grid,speed});if(!sequence.shots.length)return null;
  if(options.followThrough)tightenCrossfireLead(sequence);
  if(options.bountyCells?.length){
   const bountyKeys=new Set(options.bountyCells.map(cell=>cell.join(':')));
   const head=options.head||[.52,.37];
   for(const shot of sequence.shots)if(bountyKeys.has(shot.c+':'+shot.r)){
    shot.bounty=true;shot.x=grid.x+(shot.c+head[0])*grid.cw;shot.y=grid.y+(shot.r+head[1])*grid.ch;
    shot.targetPan=Math.max(0,Math.min(1,shot.x/width))*1.2-.6;
   }
  }
  if(options.compact){
   // Short returns keep the same contact times and original-pitch gun burst.
   // Only the presentation tail changes; its natural audio tail is never cut.
   const ratio=Math.max(0,options.ratio||0);
   sequence.settle=sequence.last+(ratio>=10?.40:.22)/speed;
   sequence.duration=Math.max(sequence.settle+(ratio>=10?.70:.36)/speed,sequence.shots[0].fire+WIN_SHOT_DURATION+.10);
  }
  onSequence(sequence);
  const output=getAudio();context=output?.context;destination=output?.master;
  state={sequence,time:0,paused:false,complete:false,reason:null,localOnly:!!options.compact,intensity:options.compact?Math.max(.95,Math.min(1.12,.95+Math.log2(1+(options.ratio||0))*.055)):1};offset=0;plays++;
  onMix(true);startClock();onChange(snapshot());return sequence;
 }
 function setPaused(paused){if(!state||state.complete||paused===state.paused)return;if(paused){state.time=time();offset=state.time;state.paused=true;stopVoice();}else{state.paused=false;startClock();}onChange(snapshot());}
 function clear(){if(state&&!state.complete)finish('cancel');stopVoice();state=null;onChange(snapshot());}
 function snapshot(){return {active:!!state&&!state.complete,complete:!state||state.complete,paused:!!state?.paused,time:state?Math.min(time(),state.sequence.duration):0,reason:state?.reason,plays,finishes,cells:state?.sequence.cells||[],shots:state?.sequence.shots||[],duration:state?.sequence.duration||0,settle:state?.sequence.settle||0,speed:state?.sequence.speed||1,audioMode:'first-person-loud',audioClock:!!voice,pendingAudio:voice?.pending||0,muted:isMuted()};}
 return {begin,tick,clear,setPaused,skip(){finish('skip');},syncMute(){voice?.mute(isMuted());},
  draw(ctx){if(state&&!state.complete)FX.draw(ctx,tick(),state.sequence,assets,{reducedMotion:reduced,localOnly:state.localOnly,intensity:state.intensity});},
  camera(){if(!state||state.complete)return {x:0,y:0,scale:1};return FX.camera(state.sequence,tick(),reduced,state.intensity);},
  reaction(c,r){return state&&!state.complete?FX.reaction(state.sequence,state.time,c,r,reduced):null;},
  get state(){return snapshot();},get complete(){tick();return !state||state.complete;},get skipped(){return state?.reason==='skip';}};
}

export function createCrossfireHost({stage,...options}){
 const assets={},buffers={},button=document.createElement('button');let loading;
 button.type='button';button.id='crossfire-skip';button.hidden=true;button.textContent='SKIP';button.setAttribute('aria-label','Skip shooting animation');
 button.style.cssText='position:absolute;right:8px;top:8px;z-index:25;min-width:44px;min-height:44px;padding:8px 12px;background:#15110de8;color:#ecdfc0;border:1px solid #8b7459;cursor:pointer';stage.append(button);
 const controller=createCrossfireController({...options,assets,buffers,onChange:s=>{button.hidden=!s.active;stage.dataset.crossfire=s.active?'active':'idle';}});
 button.onclick=e=>{e.stopPropagation();controller.skip();};
 const key=e=>{if(controller.state.active&&['Escape','Space'].includes(e.code)){e.preventDefault();e.stopImmediatePropagation();controller.skip();}};
 document.addEventListener('keydown',key,true);
 const cancel=()=>controller.clear();window.addEventListener('pagehide',cancel);
 function load(){return loading??=(async()=>{
  const root='assets/crossfire-v2/';
  await Promise.all(Object.entries({impact:'impact-atlas.png',blood:'blood-splatter.webp'}).map(async([k,file])=>{const im=new Image();im.src=root+file;await im.decode();assets[k]=im;}));
  const Decoder=window.OfflineAudioContext||window.webkitOfflineAudioContext;
  if(Decoder){
   const decoder=new Decoder(2,1,48000);
   await Promise.all(Object.entries(WIN_SHOT_FILES).map(async([kind,files])=>{
    buffers[kind]=await Promise.all(files.map(async file=>{
     const r=await fetch('assets/win-shots/'+file);if(!r.ok)throw Error('Win shot '+r.status);
     return decoder.decodeAudioData(await r.arrayBuffer());
    }));
   }));
  }
 })();}
 return {...controller,load,get state(){return controller.state;},get complete(){return controller.complete;},get skipped(){return controller.skipped;},destroy(){controller.clear();button.remove();document.removeEventListener('keydown',key,true);window.removeEventListener('pagehide',cancel);}};
}
