// Pure presentation clock. Final symbols are embedded once in an extended strip;
// intermediate entries are ordinary artwork, never decorative feature symbols.
import {SCATTER_GAP_MS} from './scatter-audio.js?v=2';
export const REEL_MOTION=Object.freeze({rollRowsPerSecond:16,accelerationMs:65,
 normalTravelMs:210,firstMs:680,middleMs:560,finalMs:780,settleMs:80,
 decelerationFraction:.45,slowFraction:.35,slowRowsPerSecond:4.2,
 contactRowsPerSecond:2.8,overshootRows:.017,triggerTravelMs:240,triggerStaggerMs:38});
export const NORMAL_SPIN_MOTION=Object.freeze({...REEL_MOTION,scatterGapMs:480,multiScatterExtraMs:90});
export const FEATURE_BUY_MOTION=Object.freeze({...REEL_MOTION,leadInMs:550,scatterGapMs:680,
 firstMs:680,middleMs:560,finalMs:780,triggerTravelMs:320,triggerStaggerMs:65});
const clamp=v=>Math.max(0,Math.min(1,v));
const integrate=(a,b,t,d)=>a*t+(b-a)*d*(Math.pow(t/d,3)-Math.pow(t/d,4)/2);
const velocity=(a,b,t,d)=>a+(b-a)*(3*(t/d)**2-2*(t/d)**3);
export function createReelMotion({old,target,hold=[],start,scale=1,contacts,eligible=true,filler,qualifies=n=>n>=3,timing=REEL_MOTION}){
 const C=timing,rows=target[0].length,plans=[],held=new Set(hold),scatterGap=C.scatterGapMs??SCATTER_GAP_MS;
 const speed=C.rollRowsPerSecond/1000/scale,ramp=C.accelerationMs*scale;
 const roll=now=>{const t=Math.max(0,now-start);return t<ramp?speed*t*t/(2*ramp):speed*(t-ramp/2)};
 const rollSpeed=now=>speed*clamp((now-start)/ramp);
 function trajectory(p,at,motionMs,from=roll(at),v0=rollSpeed(at)){
  const D=motionMs*C.decelerationFraction,S=motionMs*C.slowFraction,F=motionMs-D-S;
  const nominal=C.slowRowsPerSecond/1000/scale,v1=C.contactRowsPerSecond/1000/scale;
  const natural=(v0+nominal)*D/2+nominal*S+(nominal+v1)*F/2;
  const stop=Math.max(Math.ceil(from+natural),Math.ceil(from)+rows+1);
  const slow=(stop-from-v0*D/2-v1*F/2)/(D/2+S+F/2);
  Object.assign(p,{start:at,contact:at+motionMs,end:at+motionMs+C.settleMs*scale,from,stop,v0,v1,slow,D,S,F});
 }
 let seen=hold.reduce((n,c)=>n+old[c].filter(s=>s==='scatter').length,0),previousEnd=start,ordinal=0,contactDelay=0,lastScatter=-Infinity;
 for(let c=0;c<target.length;c++){
  if(held.has(c))continue;
  // Scheduling may inspect the supplied outcome; rendering must not. A future
  // second scatter reserves time here but cannot turn on the tease treatment.
  const anticipationPlanned=eligible&&seen>=2;
  const p={reel:c,old:[...old[c]],target:[...target[c]],anticipationPlanned,landed:false,state:'rolling',scatterCount:target[c].filter(s=>s==='scatter').length};
  const total=anticipationPlanned?(c===target.length-1?C.finalMs:ordinal++===0?C.firstMs:C.middleMs):C.normalTravelMs+C.settleMs;
  let at=anticipationPlanned?previousEnd:contacts[c]-C.normalTravelMs*scale+contactDelay+(C.leadInMs||0);
  const travel=(total-C.settleMs+Math.max(0,p.scatterCount-1)*(C.multiScatterExtraMs||0))*scale;
  if(p.scatterCount){const extra=Math.max(0,lastScatter+scatterGap-(at+travel));at+=extra;if(!anticipationPlanned)contactDelay+=extra;}
  trajectory(p,at,travel);previousEnd=p.end;plans.push(p);seen+=p.scatterCount;
  if(p.scatterCount)lastScatter=p.contact+(p.scatterCount-1)*scatterGap;
 }
 let landedCount=hold.reduce((n,c)=>n+old[c].filter(s=>s==='scatter').length,0),triggered=false,quickStopping=false;
 let armedAt=landedCount>=2?start:Infinity;
 function sample(p,now){
  let position,speed,phase;
  if(now<p.start){position=roll(now);speed=rollSpeed(now);phase='rolling';}
  else if(now<p.contact){
   const t=now-p.start;
   if(t<p.D){position=p.from+integrate(p.v0,p.slow,t,p.D);speed=velocity(p.v0,p.slow,t,p.D);phase='deceleration';}
   else if(t<p.D+p.S){position=p.from+(p.v0+p.slow)*p.D/2+p.slow*(t-p.D);speed=p.slow;phase='slow';}
   else{const u=t-p.D-p.S;position=p.from+(p.v0+p.slow)*p.D/2+p.slow*p.S+integrate(p.slow,p.v1,u,p.F);speed=velocity(p.slow,p.v1,u,p.F);phase='landing';}
  }else{const q=clamp((now-p.contact)/(p.end-p.contact));position=p.stop+C.overshootRows*Math.sin(q*Math.PI);speed=0;phase=now<p.end?'settle':'landed';}
  const anticipating=p.anticipationPlanned&&landedCount>=2&&landedCount<5&&now>=armedAt&&now<p.contact;
  return {position,speed,phase,anticipating,blur:phase==='settle'||phase==='landed'?0:Math.min(anticipating?.28:.62,Math.max(0,speed/rollSpeed(start+ramp)*(anticipating?.24:.62)))};
 }
 function symbol(p,index){
  const r=index+p.stop;if(r>=0&&r<rows)return p.target[r];
  if(index>=0&&index<rows)return p.old[index];
  return filler[((-index*7+p.reel*11)%filler.length+filler.length)%filler.length];
 }
 function advance(now){
  const events=[];
  for(const p of plans){
   p.state=sample(p,now).phase;
   if(p.landed||now<p.contact)continue;
   p.landed=true;const before=landedCount;landedCount+=p.scatterCount;
   if(before<2&&landedCount>=2)armedAt=p.contact;
   const trigger=eligible&&!triggered&&qualifies(landedCount)&&!qualifies(before);
   events.push({plan:p,at:p.contact,second:before<2&&landedCount>=2,trigger});
   if(trigger)triggered=true;
   if(eligible&&before<5&&landedCount>=5&&!quickStopping){
    triggered=true;let i=0,previous=p.contact,lastScatter=p.contact+(p.scatterCount-1)*scatterGap;
    for(const later of plans.filter(q=>!q.landed)){
     // Pending strips have not shown their final block yet. Keep their exact
     // position and ordinary speed; only their future landing is shortened.
     const travel=C.triggerTravelMs*scale;
     let contact=Math.max(p.contact+i++*C.triggerStaggerMs*scale+travel,previous);
     if(later.scatterCount)contact=Math.max(contact,lastScatter+scatterGap);
     const at=contact-travel;previous=contact;
     if(later.scatterCount)lastScatter=contact+(later.scatterCount-1)*scatterGap;
     trajectory(later,at,C.triggerTravelMs*scale);later.anticipationPlanned=false;
    }
   }else if(trigger)triggered=true;
  }
  return events;
 }
 function shift(ms){start+=ms;armedAt+=ms;for(const p of plans){p.start+=ms;p.contact+=ms;p.end+=ms;}}
 function quickStop(now){
  if(quickStopping)return false;quickStopping=true;
  let lastScatter=-Infinity,previous=now,ordinal=0;
  for(const p of plans){
   p.anticipationPlanned=false;
   if(!p.landed&&p.contact>now){
    const current=sample(p,now);
    let contact=Math.max(now+145+ordinal++*22,previous);
    if(p.scatterCount)contact=Math.max(contact,lastScatter+scatterGap);
    // A final block already visible keeps its trajectory. Other strips
    // decelerate from their exact current position, never teleport.
    if(contact<p.contact&&p.stop-current.position>rows+1)trajectory(p,now,contact-now,current.position,current.speed);
   }
   previous=p.contact;
   if(p.scatterCount)lastScatter=p.contact+(p.scatterCount-1)*scatterGap;
  }
  return true;
 }
 return {plans,sample,symbol,advance,shift,quickStop,get quickStopping(){return quickStopping},get landedScatters(){return landedCount},get end(){return Math.max(start,...plans.map(p=>p.end))},get triggered(){return triggered}};
}
