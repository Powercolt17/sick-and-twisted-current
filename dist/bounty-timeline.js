// Presentation state only. The resolver supplies every target, stamp and cent.
export const BOUNTY_TIME=Object.freeze({dock:400,land:460,stamp:680,turn:1000,promote:1260,upgrade:2150,closeMove:620,closeStamp:800,closeTotal:1150,closeReady:2450,exit:360});
export function bountySources(step){
 const target=step.blood?.target;if(!step.blood?.stamp)return [];
 return [...new Map((step.result?.groups||[]).filter(g=>g.symbol===target&&g.exactTenths>0).flatMap(g=>g.cells||[]).filter(([c,r])=>!step.wilds?.[c]&&step.grid?.[c]?.[r]===target).map(p=>[p.join(':'),p.slice()])).values()];
}
export function createBountyTimeline({reduced=false}={}){
 let active=false,state={level:0,stamps:0},event=null,closing=null,seen=new Set(),pausedAt=null,paused=0,entered=0;
 const clock=now=>(pausedAt??now)-paused;
 const timings=reduced?{...BOUNTY_TIME,dock:100,land:120,stamp:180,turn:190,promote:280,upgrade:460}:BOUNTY_TIME;
 function advance(now){
  const cues=[],t=clock(now);
  if(event){const age=t-event.at;
   if(!event.landed&&age>=timings.land){event.landed=true;state={...event.before,stamps:event.before.stamps+1};cues.push({type:'stamp',strong:event.data.upgraded});}
   if(event.data.upgraded&&!event.turned&&age>=timings.turn){event.turned=true;cues.push({type:'reveal'});}
   if(event.data.upgraded&&!event.promoted&&age>=timings.promote){event.promoted=true;state={...event.data.state};cues.push({type:'upgrade',...event.data});}
  }
  if(closing&&!closing.stamped&&t-closing.at>=BOUNTY_TIME.closeStamp){closing.stamped=true;cues.push({type:'close'});}
  return cues;
 }
 return {
  start(now){active=true;state={level:0,stamps:0};event=null;closing=null;seen=new Set();pausedAt=null;paused=0;entered=now;},
  collect(data,before,now,{id,sources=[]}={}){
   if(!active||event||closing||!id||seen.has(id)||!data.stamp||!sources.length||before.level!==state.level||before.stamps!==state.stamps)return false;
   seen.add(id);event={data,before:{...before},sources:sources.map(p=>p.slice()),id,at:clock(now),landed:false,promoted:false};return true;
  },
  advance,complete:now=>!event||clock(now)-event.at>=(event.data.upgraded?timings.upgrade:timings.stamp),
  finishEvent(){if(event&&event.landed&&(!event.data.upgraded||event.promoted)){state={...event.data.state};event=null;}},
  beginClose(now,totalCents,{remaining=0,pending=false}={}){if(!active||event||closing||remaining!==0||pending||!Number.isSafeInteger(totalCents)||totalCents<0)return false;closing={at:clock(now),state:{...state},totalCents,stamped:false,exitAt:null};return true;},
  closeReady:now=>!!closing&&clock(now)-closing.at>=BOUNTY_TIME.closeReady&&closing.exitAt===null,
  continueClose(now){if(!closing||pausedAt!==null||clock(now)-closing.at<BOUNTY_TIME.closeReady||closing.exitAt!==null)return false;closing.exitAt=clock(now);return true;},
  closeComplete:now=>!!closing&&closing.exitAt!==null&&clock(now)-closing.exitAt>=BOUNTY_TIME.exit,
  setPaused(hidden,now){if(hidden&&pausedAt===null)pausedAt=now;else if(!hidden&&pausedAt!==null){paused+=now-pausedAt;pausedAt=null;}},
  stop(){active=false;event=null;closing=null;},
  dockingComplete:now=>!active||clock(now)-entered>=timings.dock,
  snapshot(now){const t=clock(now);return {active,state:{...state},event:event?{...event,age:t-event.at}:null,closing:closing?{...closing,age:t-closing.at,exitAge:closing.exitAt===null?null:t-closing.exitAt}:null,entered:t-entered,timings};}
 };
}
