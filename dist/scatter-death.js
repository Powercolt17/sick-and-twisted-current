// Feature confirmation: the approved Seedance clip of the scatter outlaw dying
// plays on every confirmed scatter cell, in place, after the confirmed-board
// reading beat and before the feature intro. One clip per feature: Blood Money
// shoots him, Hang 'Em High hangs him, Hell to Pay burns him to the skull.
//
// Presentation only. It never inspects or replaces the resolved grid, and the
// ordinary scatter landing (contact slam, sounds, rope tease) is untouched. One video element feeds
// every cell, so three cells cost one decoder. Hidden-tab time does not
// advance the clip; a spin press skips to the dead frame; the dead frame holds
// until the feature clears it.
import {createVideoResource,drawMediaFrame} from './media-resource.js?v=1';

export const DEATH_CLIPS=Object.freeze({
 blood:Object.freeze({
  mp4:'assets/scatter-death/blood-money.mp4',
  webm:'assets/scatter-death/blood-money.webm',
  durationMs:5040,
  cuesMs:[460,1290,2000,2670],   // the four impacts, measured frame by frame: eye, cheek, nose, final burst
  cues:['shot','shot','shot','shot']
 }),
 hang:Object.freeze({
  mp4:'assets/scatter-death/hang-em-high.mp4?v=2',
  webm:'assets/scatter-death/hang-em-high.webm?v=2',
  durationMs:5040,
  cuesMs:[200,620,2150],          // measured on the thick-rope take: noose enters, the cinch that throws the hat, he goes limp
  cues:['drop','cinch','dead']
 }),
 hell:Object.freeze({
  mp4:'assets/scatter-death/hell-to-pay.mp4',
  webm:'assets/scatter-death/hell-to-pay.webm',
  durationMs:5040,
  cuesMs:[950,1420,2600],         // measured: embers catch on the brim, the flare-up as his eyes ignite, the skull fully through
  cues:['ignite','flare','skull']
 })
});
export const DEATH_CLIP=DEATH_CLIPS.blood;   // kept for existing imports
export const TURBO_RATE=1.5;

export function createScatterDeath({G,reduced=false,onShot=()=>{},onCue=null,now=()=>performance.now(),video=null,videos=null,turbo=()=>false}={}){
 const make=()=>typeof document!=='undefined'?document.createElement('video'):null;
 const slots={};
 for(const key of Object.keys(DEATH_CLIPS)){
  const element=videos?.[key]||(key==='blood'?video:null)||make();
  if(element){element.muted=true;element.playsInline=true;element.setAttribute('playsinline','');element.setAttribute('muted','');element.preload='none';element.loop=false;}
  const def=DEATH_CLIPS[key],src=element?.canPlayType?.('video/mp4; codecs="avc1.4D401F"')?def.mp4:def.webm;
  slots[key]={def,element,resource:element?createVideoResource(element,src,{now}):null};
 }
 let run=null,current=slots.blood;
 const fire=onCue||((name,index,cells,total,key)=>{if(name==='shot')onShot(index,cells,total,key);});
 function preload(key='blood'){const slot=slots[key];return slot?.resource?slot.resource.load():Promise.resolve(false);}
 function clip(){const el=current.element;return Math.max(0,Math.min(current.def.durationMs,(el?.currentTime||0)*1000));}
 // Fire the game's own samples and camera kicks as each measured beat lands.
 function cue(){
  if(!run)return;const t=clip(),def=current.def;
  while(run.fired<def.cuesMs.length&&t>=def.cuesMs[run.fired]){fire(def.cues[run.fired],run.fired,run.cells,def.cuesMs.length,run.key);run.fired++;}
 }
 async function play(cells,{key='blood',token,isCancelled=()=>false}={}){
  const slot=slots[key];if(!slot?.resource||!cells?.length)return false;
  if(run)clear();
  current=slot;const {element,resource}=slot;
  const ok=await preload(key);if(!ok||isCancelled())return false;
  element.playbackRate=turbo()?TURBO_RATE:1;
  try{element.currentTime=0;}catch(error){}
  const started=await resource.play();if(!started||isCancelled()){resource.pause();return false;}
  return new Promise(resolve=>{
   run={key,cells:cells.map(([c,r])=>[c,r]),fired:0,resolve,skipped:false,paused:false,token};
   const finish=()=>{if(!run||run.resolve!==resolve)return;run.resolve=null;resource.pause();resolve(true);};
   const onEnded=()=>{cue();finish();};
   element.addEventListener('ended',onEnded,{once:true});
   const tick=()=>{
    if(!run||run.resolve!==resolve){element.removeEventListener('ended',onEnded);return;}
    if(isCancelled()){element.removeEventListener('ended',onEnded);finish();return;}
    cue();
    if(run.skipped||element.ended||clip()>=current.def.durationMs-40){element.removeEventListener('ended',onEnded);finish();return;}
    setTimeout(tick,16);
   };
   tick();
  });
 }
 // A spin press during the clip jumps to the dead frame; the feature continues.
 function skip(){
  if(!run||run.skipped)return false;run.skipped=true;run.fired=current.def.cuesMs.length;
  try{current.element.currentTime=Math.max(0,current.def.durationMs/1000-.05);}catch(error){}
  current.resource.pause();return true;
 }
 function setPaused(paused){
  if(!run||run.resolve===null)return;
  if(paused&&!run.paused){run.paused=true;current.resource.pause();}
  else if(!paused&&run.paused){run.paused=false;void current.resource.play();}
 }
 function draw(ctx,_now){
  const element=current.element;
  if(!run||!element||element.readyState<2)return;
  ctx.save();
  for(const [c,r] of run.cells){
   const x=G.x+c*G.cw,y=G.y+r*G.ch;
   if(!drawMediaFrame(ctx,element,x,y,G.cw,G.ch))continue;
   // the same dark ring the token tiles carry, so the cell keeps its edge
   ctx.strokeStyle='rgba(6,4,4,.9)';ctx.lineWidth=2;ctx.strokeRect(x+1,y+1,G.cw-2,G.ch-2);
  }
  ctx.restore();
 }
 function clear(){const active=run;run=null;if(active?.resolve){const r=active.resolve;active.resolve=null;r(false);}current.resource?.pause();}
 function release(){clear();for(const slot of Object.values(slots))slot.resource?.release();}
 return {preload,play,skip,setPaused,draw,clear,release,get active(){return !!run&&run.resolve!==null;},get holding(){return !!run&&run.resolve===null;},get key(){return run?.key||null;},get cells(){return run?run.cells.map(c=>[...c]):[];},get element(){return current.element;}};
}
