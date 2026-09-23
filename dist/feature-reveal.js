// Shared time/pose model for the real DOM entrance and the native review.
// All layers, sounds, pause, skip and completion use this single clock.
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
const out=x=>1-(1-clamp(x))**3;
export const FEATURE_REVEAL_TIME={dead:2580,deader:2800,hell:2300,maximum:3060,reduced:1000};
const tracks={
 dead:{main:[200,520,-7,4,-3,.08],eyes:[530,380,13,-9,2,.035],safe:[740,390,13,6,-2,.04],
  blood:[1140,290,0,0,0,.20],money:[1330,290,0,0,0,.20],caption:[1840,230,0,1.2,0,0],button:[2180,260,0,1.6,0,.025]},
 deader:{'hh-main':[250,570,-3,3,0,.09],'hh-rope':[250,570,0,0,0,.09],
  'hh-feather1':[250,570,0,0,0,.09],'hh-feather2':[250,570,0,0,0,.09],
  'hh-eyes':[650,390,12,-8,2,.035],'hh-boots':[810,420,12,5,-2,.04],'hh-hang':[810,420,12,5,-2,.04],
  'hh-poster':[1020,320,4,-5,4,.06],'hh-title':[1400,350,0,0,0,.19],
  'hh-caption':[2020,250,0,1.2,0,0],button:[2390,260,0,1.6,0,.025]}
};
tracks.hell={...tracks.deader,'hh-main':[150,500,-3,3,0,.07],'hh-eyes':[450,360,12,-8,2,.03],
 'hh-boots':[620,380,12,5,-2,.04],'hh-hang':[620,380,12,5,-2,.04],'hh-poster':[850,320,4,-5,4,.06],
 'hell-title':[1110,300,0,0,0,.16],'hh-caption':[1640,250,0,1.2,0,0]};
export function featureRevealPose(name,t,theme='dead',reduced=false,index=0){
 if(name==='dim')return {alpha:smooth(t/240),x:0,y:0,angle:0,scale:1};
 if(name==='hh-wipe'||name==='flash')return {alpha:0,x:0,y:0,angle:0,scale:1};
 if(name==='smoke')return {alpha:reduced?0:.40*smooth((t-500)/320)*(1-smooth((t-1600)/900)),x:0,y:-Math.max(0,t-700)/600,angle:0,scale:1};
 let track=tracks[theme]?.[name];
 if(name==='note')track=[880+index*85,580+index*35,9-index*2,-5-index*2,(index%2?1:-1)*25,-.1];
 if(!track)return {alpha:0,x:0,y:0,angle:0,scale:1};
 const [start,duration,x,y,angle,scale]=track;
 if(reduced){const at=name.includes('caption')?580:name==='button'?740:Math.min(400,start*.25);return {alpha:smooth((t-at)/160),x:0,y:0,angle:0,scale:1};}
 const p=clamp((t-start)/duration);if(p>=1)return {alpha:1,x:0,y:0,angle:0,scale:1};
 const e=out(p/.64),rebound=p<.64?0:Math.sin((p-.64)/.36*Math.PI*2)*Math.exp(-(p-.64)*10);
 return {alpha:smooth(p/.30),x:x*(1-e),y:y*(1-e)+rebound*.55,angle:angle*(1-e),scale:1+scale*(1-e)-rebound*.035};
}
export function featureRevealCues(theme,maxEligible=false){
 const a=theme==='hell'?[[50,'prelude'],[470,'main'],[685,'eyes'],[860,'side'],[1055,'paper'],[1305,'title'],[1800,'award']]:theme==='deader'?
  [[50,'prelude'],[615,'main'],[900,'eyes'],[1080,'side'],[1225,'paper'],[1625,'title'],[2180,'award'],[2560,'button']]:
  [[50,'prelude'],[535,'main'],[775,'eyes'],[990,'side'],[1325,'title'],[1515,'title'],[1990,'award'],[2345,'button']];
 a.unshift([0,'feature-start']);
 if(maxEligible)a.push([2410,'max']);return a.map(([at,type])=>({at,type,theme})).sort((a,b)=>a.at-b.at);
}
export function createFeatureReveal({reduced=false,onCue=()=>{},onComplete=()=>{},onSilence=()=>{}}={}){
 let run=null;
 const elapsed=now=>run?Math.max(0,(run.pausedAt??now)-run.start-run.pausedMs):0;
 function begin(theme,now=performance.now(),maxEligible=false){
  onSilence();run={theme,start:now,pausedMs:0,pausedAt:null,cursor:0,completed:false,maxEligible,
   end:reduced?1000:FEATURE_REVEAL_TIME[maxEligible?'maximum':theme],cues:reduced?[]:featureRevealCues(theme,maxEligible)};
 }
 function advance(now=performance.now()){
  if(!run||run.completed||run.pausedAt!==null)return;const t=elapsed(now);
  while(run.cursor<run.cues.length&&run.cues[run.cursor].at<=t){const cue=run.cues[run.cursor++];if(t-cue.at<100)onCue(cue);}
  if(t>=run.end){run.completed=true;onComplete();}
 }
 function finish(){if(!run||run.completed)return false;run.completed=true;run.cursor=run.cues.length;onSilence();onComplete();return true;}
 function setPaused(paused,now=performance.now()){
  if(!run||run.completed)return;
  if(paused&&run.pausedAt===null){run.pausedAt=now;onSilence();}
  else if(!paused&&run.pausedAt!==null){run.pausedMs+=now-run.pausedAt;run.pausedAt=null;}
 }
 return {begin,advance,finish,setPaused,elapsed,clear(){run=null;onSilence();},
  pose:(name,now,index=0)=>run?featureRevealPose(name,elapsed(now),run.theme,reduced,index):null,
  get active(){return !!run&&!run.completed;},get theme(){return run?.theme;}};
}
