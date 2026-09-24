import assert from 'node:assert/strict';
import * as M from '../dist/math.js';
import {collapse} from '../dist/cascade-kernel.js';
import {hangFeature,HANG_RULES,seededHang} from '../dist/hang-kernel.js';
import {HANG_CATALOG} from '../dist/hang-catalog.js';
import {hangModel,hangAudit,hangDemoFeature,rollHangFeature} from '../dist/hang-math.js';
const model=hangModel();
assert.ok(Math.abs(model.rtp-M.targetRTP('deaderbuy'))<1e-12);
assert.ok(Math.abs(M.featureExpected(4)-model.value)<1e-8,'natural and purchased feature must use the same EV');
assert.equal(model.cdf.at(-1),1);assert.ok(model.cdf.every((p,i)=>!i||p>=model.cdf[i-1]));
assert.equal(rollHangFeature(()=>0).seed,HANG_CATALOG[0][0]);
assert.equal(rollHangFeature(()=>1-Number.EPSILON).seed,HANG_CATALOG.at(-1)[0]);
let upgrades=0,shotPaths=0,blastPaths=0;
const samples=[hangDemoFeature(),...HANG_CATALOG.filter((_,i)=>i%29===0).map(r=>hangFeature(r[0]))];
for(const feature of samples){
 assert.equal(feature.spins.length,12+3*feature.retriggers);assert.ok(feature.retriggers<=HANG_RULES.maxRetriggers);assert.ok(feature.first<3);assert.ok(feature.locks>=1&&feature.locks<=3);
 const row=HANG_CATALOG.find(r=>r[0]===feature.seed);assert.equal(feature.cents,row[1]);let sum=0,previous={};
 for(const outcome of feature.spins){
  assert.deepEqual(outcome.hang.before,previous);assert.ok(Object.keys(outcome.wilds).length<=3+(outcome.hang.temporary?1:0));
  for(const [c,w] of Object.entries(previous)){assert.ok(outcome.wilds[c].locked);assert.ok(outcome.wilds[c].mult>=w.mult);}
  const event=outcome.hang.event;
  if(event?.type==='upgrade'){upgrades++;assert.equal(Object.keys(previous).length,3);assert.equal(event.to,event.from*2);assert.ok(event.to<=64);}
  const result=M.resolveOutcome(outcome);sum+=result.cents;
  assert.equal(result.steps.at(-1).result.cents,0,'tumbles must reach a genuinely nonpaying board');
  for(let i=0;i<result.steps.length;i++){
   const step=result.steps[i];if(step.bomb)blastPaths++;
   assert.ok(step.clearCells.every(([c])=>!step.wilds[c]),'locked reels cannot enter gravity');
   assert.deepEqual(Object.fromEntries(Object.entries(step.wilds).filter(([,w])=>!w.temporary)),step.hang.locks);
   if(i)for(const [c,w] of Object.entries(result.steps[i-1].wilds)){assert.ok(step.wilds[c].locked);assert.ok(step.wilds[c].mult>=w.mult);}
   if(step.hang.event?.type==='upgrade'){assert.equal(Object.keys(step.hang.locks).length,3);assert.equal(step.hang.event.to,step.hang.event.from*2);assert.ok(step.hang.event.to<=64);}
   if(step.hangRetrigger){assert.equal(i,result.steps.length-1);assert.ok(step.hangRetrigger.cells.length>=3);assert.ok(step.hangRetrigger.cells.every(([c,r])=>!step.wilds[c]&&step.grid[c][r]==='scatter'));assert.equal(step.hangRetrigger.spins,3);assert.equal(step.hangRetrigger.remaining,outcome.hang.remaining);}
   if(i){const prior=result.steps[i-1],next=collapse(prior.grid,prior.clearCells,(c,r)=>step.grid[c][r]).grid;assert.deepEqual(step.grid,next);}
  }
  const converted=M.withShotWilds(outcome,seededHang(feature.seed));
  if(converted.shotWilds){shotPaths++;assert.equal(M.resolveOutcome(converted).cents,result.cents,'boxed wild reveal must preserve sticky-feature awards');}
  previous=outcome.hang.locks;
 }
 assert.equal(sum,feature.cents);assert.ok(sum<=HANG_RULES.maxFeature*100);
}
assert.ok(upgrades>0&&shotPaths>0&&blastPaths>0);
const dead=Array.from({length:6},()=>Array(4).fill('bomb'));
const locked={0:{mult:8,locked:true},1:{mult:8,locked:true},2:{mult:8,locked:true}};
assert.equal(M.evaluate(dead,locked,1,24,{requireNatural:true}).cents,0,'pure sticky-wild groups cannot loop forever');
assert.ok(M.evaluate(dead,locked,1,24).cents>0,'other modes retain existing pure-wild rules');
const demo=hangDemoFeature();for(const bet of [.01,.05,1,10]){const outcomes=demo.spins.map(o=>M.resolveOutcome(o,bet));assert.ok(Math.abs(outcomes.reduce((n,r)=>n+r.cents,0)-demo.cents*bet)<=demo.spins.length);}
assert.equal(M.resolveOutcome(demo.spins.find(o=>M.resolveOutcome(o).cents>10),1,10).cents,10);
console.log('PASS: complete-feature calibration, lock persistence, upgrades, natural trigger EV, gravity, termination, TNT, shot wild equivalence, caps and currency rounding');
console.log(hangAudit());

assert.ok(demo.retriggers>0&&demo.tumbleEvents>0);
let retriggerPaths=0,tumblePaths=0;
for(const row of HANG_CATALOG){const f=hangFeature(row[0]);assert.ok(f);assert.equal(f.cents,row[1]);assert.equal(f.retriggers,row[5]);assert.equal(f.tumbleEvents,row[6]);assert.equal(f.spins.length,12+f.retriggers*3);let remaining=12,total=0;for(const o of f.spins){remaining--;remaining+=o.hang.extraSpins;assert.equal(remaining,o.hang.remaining);total+=M.resolveOutcome(o).cents;}assert.equal(remaining,0);assert.equal(total,f.cents);retriggerPaths+=f.retriggers>0;tumblePaths+=f.tumbleEvents>0;}
assert.ok(retriggerPaths>0&&tumblePaths>0);console.log({validatedPaths:HANG_CATALOG.length,retriggerPaths,tumblePaths});

const audit=hangAudit();
assert.ok(audit.medianBuyReturn>=.7&&audit.medianBuyReturn<=.8,'typical return remains near three quarters of the buy');
assert.ok(audit.retriggerChance>.15&&audit.retriggerChance<.25);
assert.ok(audit.tumbleEventChancePerFeature>.15);
assert.ok(audit.locks[3]>.2);
assert.ok(audit.bands.fiveBuysPlus>0&&audit.bands.fiveBuysPlus<.02);
assert.ok(HANG_CATALOG.some(r=>r[5]===HANG_RULES.maxRetriggers),'catalog exercises the retrigger limit');
