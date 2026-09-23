import assert from 'node:assert/strict';
import {createReelMotion} from '../dist/reel-motion.js';
import {createTumbleMotion} from '../dist/tumble-motion.js';
import {collapse} from '../dist/cascade-kernel.js';
import {createScatterAnticipation} from '../dist/scatter-anticipation.js';
const G={x:0,y:0,w:600,h:400,cw:100,ch:100};
const old=Array.from({length:6},()=>['a','k','q','j']);
for(const total of [2,3,4,5]){
 const target=old.map(c=>[...c]);target[0][0]='scatter';target[0][1]='scatter';
 for(let i=2;i<total;i++)target[i][0]='scatter';
 const m=createReelMotion({old,target,start:0,contacts:[300,400,500,600,700,800],filler:['a','k']});
 let triggerCount=0,observed=new Set();
 for(let t=0;t<=8000;t+=8){
  for(const e of m.advance(t))if(e.trigger)triggerCount++;
  const pending=m.plans.find(p=>!p.landed&&t>=p.start);
  if(pending&&m.landedScatters>=2&&m.landedScatters<5){assert.equal(m.sample(pending,t).anticipating,true);observed.add(m.landedScatters);}
  for(const p of m.plans){assert.ok(Number.isFinite(m.sample(p,t).position));}
 }
 assert.equal(m.landedScatters,total);assert.equal(triggerCount,total>=3?1:0);
 for(let n=2;n<=Math.min(total,4);n++)assert.ok(observed.has(n),`tease persists at ${n} scatters`);
 for(const p of m.plans)for(let r=0;r<4;r++)assert.equal(m.symbol(p,r-p.stop),target[p.reel][r]);
}
for(const initial of [2,3,4]){
 const grid=old.map(c=>[...c]);grid[0][2]=grid[0][3]='scatter';if(initial>=3)grid[1][3]='scatter';if(initial>=4)grid[2][3]='scatter';
 const cells=[[1,0],[2,0],[3,0],[3,1],[5,3]];
 const next=collapse(grid,cells,(c,r)=>c===3&&r===1?'scatter':'ten').grid;
 const tumble=createTumbleMotion({G});tumble.begin(grid,next,cells,0,1,{anticipation:true});
 const window=tumble.anticipationWindow;assert.equal(window.contacts.length,4);assert.equal(window.contacts.find(c=>c.column===3).rows,2);
 assert.equal(tumble.scatterPositions(0).length,initial,'only existing scatters glow before contact');
 const scatterAt=window.contacts.find(c=>c.column===3).at;
 assert.equal(tumble.scatterPositions(scatterAt-1).length,initial);
 assert.equal(tumble.scatterPositions(scatterAt+1).length,initial+1,'fresh scatter joins glow only when landed');
 const before=tumble.scatterPositions(350);tumble.setPaused(true,350);assert.deepEqual(tumble.scatterPositions(2000),before);tumble.setPaused(false,2350);
 assert.deepEqual(tumble.scatterPositions(2350),before);
 const ctx={save(){},restore(){},beginPath(){},rect(){},clip(){},globalAlpha:1};
 const rendered=[];tumble.drawColumn(ctx,3,20000,(name,x,y)=>rendered.push([name,y]));
 assert.deepEqual(rendered.map(p=>p[0]),next[3]);assert.deepEqual(rendered.map(p=>Math.round(p[1])),[0,100,200,300]);
 tumble.quickStop(2500);assert.ok(tumble.finished(30000));
}
const cues=[],a=createScatterAnticipation({G,onCue:c=>cues.push(c)});
assert.equal(a.begin(0,[{column:2,start:0,at:500,end:580}],{scatters:[[0,0]]}),false);
assert.equal(a.begin(0,[{column:2,start:0,at:500,end:580},{column:3,start:580,at:900,end:980}],{scatters:[[0,0],[0,1],[1,0],[1,1]]}),true);
a.updateScatters([[0,0],[0,1],[1,0],[1,1]]);a.land(2,500);a.advance(600);assert.equal(cues.at(-1).type,'reel');a.clear();assert.equal(a.active,false);
console.log('PASS: 2→3→4→5 reel tiers, exact outcomes, cascade gaps/gravity, landed-only scatter highlights, pause, quick stop and cleanup.');

const quick=createReelMotion({old,target:old,start:0,contacts:[300,400,500,600,700,800],filler:['a']});
const position=quick.sample(quick.plans[0],100).position;quick.shift(1000);assert.equal(quick.sample(quick.plans[0],1100).position,position);
assert.equal(quick.quickStop(1120),true);assert.equal(quick.quickStop(1121),false);quick.advance(10000);assert.ok(quick.plans.every(p=>p.landed));
const reduced=createScatterAnticipation({G,reduced:true});assert.equal(reduced.begin(0,[{column:2,at:400}],{scatters:[[0,0],[0,1],[1,0]]}),false);
// Both textured rails must use in-bounds atlas frames, including pause/end.
const rails=createScatterAnticipation({G}),blits=[];
rails.setAsset({width:1152,height:3960});
rails.begin(0,[{column:3,start:0,at:1000,end:1080}],{scatters:[[0,0],[0,1]]});
const noop=()=>{},context=new Proxy({drawImage:(...args)=>blits.push(args),createLinearGradient:()=>({addColorStop:noop})},{get:(o,k)=>k in o?o[k]:noop});
for(const t of [0,500,999,1079]){
 blits.length=0;rails.draw(context,t);assert.equal(blits.length,2);
 for(const [,sx,sy,w,h] of blits){assert.ok(sx>=0&&sx+w<=1152);assert.ok(sy>=0&&sy+h<=3960);}
 assert.equal(blits[1][1]-blits[0][1],48);
}
rails.setPaused(true,500);blits.length=0;rails.draw(context,900);const paused=blits.map(b=>b.slice(1));blits.length=0;rails.draw(context,1200);assert.deepEqual(blits.map(b=>b.slice(1)),paused);
console.log('PASS: paired rope atlas bounds and paused animation.');
// Winning squares refill concurrently: every active gap gets paired ropes.
const refill=createScatterAnticipation({G});refill.setAsset({width:1152,height:3960});
refill.begin(0,[{column:1,rows:1,start:0,at:1050,end:1140},{column:3,rows:2,start:220,at:1270,end:1360},{column:5,rows:3,start:440,at:1490,end:1580}],{scatters:[[0,0],[0,1]]});
blits.length=0;refill.draw(context,700);assert.equal(blits.length,6,'both ropes on all three active refill lanes');
assert.deepEqual(blits.map(b=>b[8]),[100,100,200,200,300,300],'ropes match vacancy height');
assert.notEqual(blits[0][2],blits[2][2],'each refill lane has its own burn clock');
refill.land(1,1050);blits.length=0;refill.draw(context,1150);assert.equal(blits.length,4,'settled lane retires without hiding later ropes');
console.log('PASS: concurrent refill rope pairs, gap bounds, independent burn clocks and retirement.');
// The supplied fizzle belongs only to a completed miss, never a feature or skip.
for(const [count,cancel] of [[2,false],[3,false],[4,false],[5,false],[2,true]]){
 const events=[],fx=createScatterAnticipation({G,onCue:e=>events.push(e)});
 fx.begin(0,[{column:5,start:0,at:500,end:580}],{scatters:[[0,0],[0,1]]});
 fx.updateScatters(Array.from({length:count},(_,i)=>[Math.floor(i/4),i%4]));
 if(cancel)fx.clear();else{fx.land(5,500);fx.land(5,501);fx.clear();}
 const endings=events.filter(e=>e.fizzle);assert.equal(endings.length,count===2&&!cancel?1:0);
 if(endings.length)assert.equal(endings[0].delayMs,80);
}
console.log('PASS: fizzle once after final settle, excluded for features and cancellation.');
