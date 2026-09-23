import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {collectBounty,bountyIndex,bloodOutcome} from '../dist/blood-bounty.js';
import {resolveOutcome,evaluate} from '../dist/math.js';
import {createBountyTimeline,bountySources} from '../dist/bounty-timeline.js';
import {createBloodDuel} from '../dist/blood-duel.js';
import {createBloodRewards} from '../dist/blood-rules.js';
import {BLOOD_CATALOG} from '../dist/blood-catalog.js';

globalThis.fetch=async p=>({json:async()=>JSON.parse(await fs.readFile(new URL('../dist/'+p.split('?')[0],import.meta.url)))});
globalThis.Image=class{async decode(){}};
globalThis.createImageBitmap=async i=>i;
const shooter={assets:{json:{placement:{x:0,y:0,width:100,height:100},width:100,height:100,muzzles:[[50,50]]}},frameIndex:()=>0,startCells:()=>{}};
const targetGrid=target=>Array.from({length:6},()=>[target,'A','K','Q']);
for(const reduced of [false,true])for(const turbo of [false,true]){
 const cues=[],duel=createBloodDuel({shooter,canvas:{style:{filter:''}},reduced,turbo:()=>turbo,onCue:e=>cues.push(e)});
 await duel.load();duel.start(0);duel.update(0);
 const timeline=createBountyTimeline({reduced});timeline.start(0);
 let state={level:0,stamps:0,multiplier:6},now=0;
 for(let hit=0;hit<9;hit++){
  const target=['bottle','guns','bandit'][state.level],grid=targetGrid(target),result=evaluate(grid,{},1,1,{winBoost:6,maxEligible:false});
  const blood=collectBounty(state,result,grid),step={grid,wilds:{},result,blood,bloodBefore:{...state}};
  assert.equal(blood.stamp,true,`real target win ${hit+1} registers`);
  assert.equal(blood.upgraded,hit===2||hit===5);
  assert.equal(duel.hit(state.stamps,state.stamps===2),true,`real win starts duel shot ${hit+1}`);
  assert.equal(duel.hit(state.stamps,state.stamps===2),false,'duplicate shot rejected');
  while(!duel.impacted){duel.update(now+=16);assert.ok(now<120000);}
  const id=`spin-${hit}`,sources=bountySources(step);
  assert.ok(sources.length);assert.equal(timeline.collect(blood,state,now,{id,sources}),true);
  let grants=0;do{duel.update(now+=16);grants+=timeline.advance(now).filter(c=>c.type==='upgrade').length;}while(!timeline.complete(now));
  timeline.finishEvent();assert.equal(timeline.collect(blood,state,now,{id,sources}),false);
  assert.equal(grants,blood.upgraded?1:0,'Ringleader cannot grant another promotion');
  state={...blood.state};assert.deepEqual(timeline.snapshot(now).state,state);
  while(!duel.settled){duel.update(now+=16);assert.ok(now<120000);}
  if(blood.upgraded){duel.next(state.level);for(let i=0;i<150;i++)duel.update(now+=16);}
 }
 assert.equal(state.level,2);assert.equal(state.stamps,3);assert.equal(state.multiplier,6);
 assert.equal(cues.filter(c=>c.type==='shot').length,9);assert.equal(cues.filter(c=>c.type==='impact').length,9);
 const grid=targetGrid('bandit'),fourth=collectBounty(state,evaluate(grid,{},1),grid);
 assert.equal(fourth.stamp,false);assert.deepEqual(fourth.state,state);
 assert.equal(createBloodRewards().claim(fourth),null);
 duel.stop();duel.start(2,3);duel.update(0);assert.equal(duel.debug.state,3,'restoring defeated Ringleader cannot revive him');duel.stop();
}
// Persist final-stage health across independently resolved spins and tumbles.
let state={level:2,stamps:0,multiplier:6},hits=0,rolls=0;
for(const [seed] of BLOOD_CATALOG[6]){
 const out=bloodOutcome(seed,state,()=>{rolls++;return .5;});
 const resolved=resolveOutcome(out);
 for(const step of resolved.steps)if(step.blood.stamp){assert.ok(bountySources(step).length);hits++;}
 state={...out.bloodFinal};if(hits===3)break;
}
assert.equal(hits,3);assert.equal(state.stamps,3);assert.equal(rolls,0);
for(let stamps=0;stamps<=3;stamps++)assert.equal(bountyIndex({level:2,stamps}),6);
assert.throws(()=>bountyIndex({level:2,stamps:4}),RangeError);
// All terminal catalog payouts and symbol trajectories are health-independent.
for(const [seed] of BLOOD_CATALOG[6]){
 const base=bloodOutcome(seed,{level:2,stamps:0,multiplier:6});
 for(const stamps of [1,2,3]){
  const out=bloodOutcome(seed,{level:2,stamps,multiplier:6});
  assert.equal(out.rawCents,base.rawCents);assert.deepEqual(out.steps.map(s=>[s.grid,s.wilds,s.winBoost]),base.steps.map(s=>[s.grid,s.wilds,s.winBoost]));
 }
}
console.log('PASS real resolver → timeline → all nine duel hits; final death, duplicates, normal/Turbo/reduced, persistent health and every terminal catalog payout.');
