import {BOUNTY_MATERIAL,createBountyPoster} from './bounty-poster.js?v=93art';
import {BLOOD_LADDER} from './blood-bounty.js?v=81';
import {OUTLAW_NAMES as BLOOD_NAMES} from './blood-outlaws.js?v=91art';
import {createBountyTimeline,BOUNTY_TIME} from './bounty-timeline.js?v=109';
import {createBloodContract,contractStampPoint,CONTRACT_SURFACE} from './blood-contract.js?v=117';
import {createBloodWall,WALL_TIME} from './blood-wall.js?v=12';
const clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>1-(1-clamp(x))**3;
export function createBloodBank({G,W,H,getTile,reduced=false,getVisibleWidth=()=>1212,isPortrait=()=>false,announce=()=>{}}){
 const timeline=createBountyTimeline({reduced}),wall=createBloodWall({reduced});let art=null,spins=8,award=8,total=0,boost=1,flash=null,briefing=null,stampHit=null,readoutFrom=0,readoutAt=0;
 const portraitDuration=reduced?120:WALL_TIME.turn,flipDuration=540,flipStagger=30;
 const side={x:990,y:117,w:220,h:440};
 const hero=()=>{const small=getVisibleWidth()<1000,w=small?Math.min(620,getVisibleWidth()*.72):670;return {x:G.x+G.w/2-w/2,y:small?-214:65,w,h:small?w*4/3:w*484/760};};
 const mobile=()=>getVisibleWidth()<1000||isPortrait();   // portrait phones get the header, never the dock
 const destination=()=>mobile()?{x:G.x+G.w*.12,y:-255,w:172,h:265}:side;
 const mix=(a,b,p)=>Object.fromEntries(['x','y','w','h'].map(k=>[k,a[k]+(b[k]-a[k])*p]));
 function sync(){const s=timeline.snapshot(performance.now()).state;announce(`Blood Money. Target ${BLOOD_NAMES[BLOOD_LADDER[s.level]]}. ${s.level===2?'Upgrades complete':s.stamps+' of 3 stamps'}. ${spins} free spins remaining. Feature won $${total.toFixed(2)}. ${boost} times feature win boost.`);}
 function appearance(snapshot){const e=snapshot.event,t=snapshot.timings;
  const pulse=stampHit?Math.max(0,1-(snapshot.entered-stampHit.at)/560):0;
  const turn=e?.data.upgraded?clamp((e.age-t.turn)/portraitDuration):0;
  const shown=reduced?total:readoutFrom+(total-readoutFrom)*ease((snapshot.entered-readoutAt)/420);
  const flightStart=Math.max(0,t.land-WALL_TIME.flight);const flight=e&&!e.landed&&!reduced&&e.age>=flightStart?clamp((e.age-flightStart)/WALL_TIME.flight):-1;
  const impactAge=e&&e.landed&&!reduced?e.age-t.land:-1;
  return {award,boost,remaining:spins,total:shown,collected:!!e?.data.upgraded&&e.landed,stampPulse:reduced?0:pulse,paperAngle:reduced?0:Math.sin(pulse*Math.PI)*.009,turn:turn>0&&turn<1?turn:0,nextTarget:turn>0&&turn<1?e.data.next:null,flight,impactAge};
 }
 function wallState(s){const e=s.event;if(!e)return s.state;if(!e.landed)return {...e.before};if(e.data.upgraded&&e.age<s.timings.turn+portraitDuration)return {...e.before,stamps:3};return s.state;}
 function drawWall(ctx,s,box,extra={}){const p=appearance(s);wall.draw(ctx,wallState(s),{...box,...p,...extra});}
 function drawPoster(ctx,now){
  const s=timeline.snapshot(now);if(!s.active||!art||!timeline.dockingComplete(now)||s.closing)return;
  if(!mobile())drawWall(ctx,s,side);
 }
 function drawHighlights(ctx,grid,now,hidden=[]){
  const s=timeline.snapshot(now),e=s.event;if(!e||e.age>s.timings.land)return;
  const a=ease(e.age/70)*(1-clamp((e.age-s.timings.land+100)/100));
  ctx.save();ctx.strokeStyle='#b84c38';ctx.lineWidth=3;ctx.globalAlpha=a;
  // Only contributing, non-wild targets are emphasized. An idle target earns nothing.
  for(const [c,r] of e.sources)if(!hidden.includes(c)){ctx.strokeRect(G.x+c*G.cw+4,G.y+r*G.ch+4,G.cw-8,G.ch-8);ctx.lineWidth=1;ctx.strokeStyle='#ead3a8';ctx.strokeRect(G.x+c*G.cw+8,G.y+r*G.ch+8,G.cw-16,G.ch-16);}
  ctx.restore();
 }
 function drawFlight(ctx,s){return;
  const e=s.event;if(!e||e.age<90||e.age>=s.timings.land||!art)return;
  const [c,r]=e.sources[0],p=clamp((e.age-(reduced?0:90))/(s.timings.land-(reduced?0:90))),u=p*p*(3-2*p);
  const start={x:G.x+(c+.5)*G.cw,y:G.y+(r+.5)*G.ch};
  const dest=mobile()?{x:150+(532+(e.before.stamps-1)*89)*getVisibleWidth()/760,y:-126}:contractStampPoint(side,e.before.stamps);
  const x=start.x+(dest.x-start.x)*u,y=start.y+(dest.y-start.y)*u-(reduced?0:50*Math.sin(p*Math.PI));
  const width=48,height=30;ctx.save();ctx.translate(x,y);ctx.rotate(reduced?0:-.16*Math.sin(p*Math.PI));ctx.shadowColor='#000a';ctx.shadowBlur=8;ctx.fillStyle='#24120e';ctx.fillRect(-width/2,-height/2,width,height);ctx.shadowColor='transparent';ctx.strokeStyle='#c77356';ctx.lineWidth=1.4;ctx.strokeRect(-width/2,-height/2,width,height);ctx.fillStyle='#a82b23';ctx.fillRect(-width/2+3,-height/2+3,width-6,height-6);art.label(ctx,'0'+(e.before.stamps+1),0,1,19,'#f2e9d6',38);ctx.restore();
 }
 function drawUpgrade(ctx,c,r,x,y,w,h,now,drawSprite){
  if(!flash||reduced||!flash.cells.some(p=>p[0]===c&&p[1]===r))return false;
  const s=timeline.snapshot(now),p=clamp((s.entered-flash.at-c*flipStagger)/flipDuration);if(p>=1)return false;
  ctx.save();ctx.translate(x+w/2,y+h/2);const lift=Math.sin(p*Math.PI);ctx.scale(Math.max(.045,Math.abs(Math.cos(Math.PI*p)))*(1+.055*lift),1+.055*lift);drawSprite(p<.5?flash.from:flash.to,-w/2,-h/2,w,h);ctx.restore();
  if(p>.5){ctx.save();ctx.globalAlpha=Math.sin((p-.5)*2*Math.PI)*.75;ctx.strokeStyle='#d5ae79';ctx.lineWidth=2;ctx.strokeRect(x+4,y+4,w-8,h-8);ctx.restore();}return true;
 }
 function drawDocking(ctx,now,{board=true}={}){
  const s=timeline.snapshot(now);if(!s.active||!art)return;
  // with the duel on desktop there is no board to fly into the dock: the outlaw is already standing in the bank doorway
  if(!timeline.dockingComplete(now)){if(!board)return;
   const p=ease(s.entered/s.timings.dock);ctx.save();ctx.fillStyle=`rgba(9,6,3,${.66*(1-p)})`;ctx.fillRect(0,0,W,H);
   drawWall(ctx,s,mix(hero(),destination(),p));ctx.restore();return;
  }
  if(s.closing)return; // The responsive receipt is rendered by blood-receipt.js.
  drawFlight(ctx,s);
 }
 function portraitHeader(ctx,width,height,now,scene,preview=null){
  if(!art)return;
  const snapshot=timeline.snapshot(now),entry=briefing||preview;
  if(entry){wall.draw(ctx,{level:0,stamps:0},{x:0,y:0,w:width,h:height,remaining:entry.awardedSpins??entry.award,award:entry.awardedSpins??entry.award,total:0,boost:1});return;}
  drawWall(ctx,snapshot,{x:0,y:0,w:width,h:height},{remaining:snapshot.closing?award:spins,total:snapshot.closing?snapshot.closing.totalCents/100:appearance(snapshot).total});return;

 }

 return {
  async load(){const im=new Image(),surface=new Image();im.src=BOUNTY_MATERIAL;surface.src=CONTRACT_SURFACE;await Promise.all([im.decode(),surface.decode(),wall.load()]);const paper=createBountyPoster({atlas:im,getTile});art={...paper,...createBloodContract(paper,{surface,getTile})};},
  start(now,options={}){briefing=null;stampHit=null;readoutFrom=0;readoutAt=0;award=options.awardedSpins??8;boost=options.boost??1;spins=award;total=0;flash=null;timeline.start(now-(options.docked?BOUNTY_TIME.dock:0));sync();},
  stop(){timeline.stop();flash=null;briefing=null;stampHit=null;},setReadout(remaining,value,winBoost=boost){const changed=spins!==remaining||total!==value||boost!==winBoost;if(total!==value){const snap=timeline.snapshot(performance.now());readoutFrom=appearance(snap).total;readoutAt=snap.entered;}spins=remaining;total=value;boost=winBoost;if(changed)sync();},
  beginBriefing(options){briefing=options;},endBriefing(){briefing=null;},
  drawBriefing(ctx){if(art&&briefing&&!mobile())wall.draw(ctx,{level:0,stamps:0},{...side,remaining:briefing.awardedSpins,award:briefing.awardedSpins,boost:briefing.boost,total:0});},
  resultBox:hero,
  get presentationTime(){return timeline.snapshot(performance.now()).entered;},
  addSpins(count){award+=count;},
  get receiptSnapshot(){const c=timeline.snapshot(performance.now()).closing;return c?{...c,award,boost}:null;},
  collect:timeline.collect,advance(now){const cues=timeline.advance(now);if(cues.some(c=>c.type==='stamp'))stampHit={at:timeline.snapshot(now).entered};if(cues.length)sync();return cues;},
  get timings(){return timeline.snapshot(performance.now()).timings;},flightMs:WALL_TIME.flight,complete:timeline.complete,finishEvent(){timeline.finishEvent();sync();},
  flash(cells,now,from,to){flash={cells,at:timeline.snapshot(now).entered,from,to};},flashComplete:now=>!flash||timeline.snapshot(now).entered-flash.at>=flipDuration+5*flipStagger,
  beginClose:timeline.beginClose,closeReady:timeline.closeReady,continueClose:timeline.continueClose,closeComplete:timeline.closeComplete,
  setPaused:timeline.setPaused,drawPoster,drawHighlights,drawDocking,portraitHeader,drawUpgrade,dockingComplete:timeline.dockingComplete,
  get active(){return timeline.snapshot(performance.now()).active;},get closing(){return !!timeline.snapshot(performance.now()).closing;},get state(){return timeline.snapshot(performance.now()).state;},get focused(){const s=timeline.snapshot(performance.now());return !!s.event||!!s.closing;},get ready(){return !!art;}
 };
}
