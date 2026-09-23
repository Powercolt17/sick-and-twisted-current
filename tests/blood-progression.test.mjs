import assert from 'node:assert/strict';
import {BLOOD_CATALOG} from '../dist/blood-catalog.js';
import {BLOOD_PROFILES} from '../dist/blood-profiles.js';
import {BLOOD_STATES,bloodOutcome,bountyIndex,freshBounty} from '../dist/blood-bounty.js';
import {bloodExtraSpins,createBloodRewards,rollBloodMultiplier,BLOOD_MULTIPLIERS} from '../dist/blood-rules.js';
import {bloodModel,bloodExpected,bloodDemoOutcome} from '../dist/blood-math.js';
import {resolveOutcome,evaluate,wildTotal,BUY_COST,targetRTP} from '../dist/math.js';
const counts=new Map();for(let i=0;i<1000;i++){const r=rollBloodMultiplier(1,(i+.5)/1000);counts.set(r.rolled,(counts.get(r.rolled)||0)+1);}assert.deepEqual([...counts],[[2,695],[4,200],[6,70],[8,25],[10,10]]);
for(const current of BLOOD_MULTIPLIERS)for(let i=0;i<1000;i++){const r=rollBloodMultiplier(current,(i+.5)/1000);assert.equal(r.multiplier,Math.max(current,r.rolled));assert.equal(r.spins,2);}
for(const u of [-1,1,NaN])assert.throws(()=>rollBloodMultiplier(1,u),RangeError);
const rewardEvent=(level,current,u)=>{const reward=rollBloodMultiplier(current,u);return{upgraded:true,state:{level,stamps:0,multiplier:reward.multiplier},reward};};
const rewards=createBloodRewards();assert.equal(rewards.claim(rewardEvent(2,1,.99)),null);const first=rewardEvent(1,1,.999);assert.equal(rewards.claim(first).multiplier,10);assert.equal(rewards.claim(first),null);assert.equal(rewards.claim(rewardEvent(2,10,.2)).multiplier,10);assert.equal(rewards.claim(rewardEvent(3,10,.2)),null);
assert.equal(bloodExtraSpins(0,2),4);
// Last-spin and double-promotion paths must extend the feature.
const models=[{state:{level:0},mean:1,transition:[0,1,0]},{state:{level:1},mean:2,transition:[0,0,1]},{state:{level:2},mean:4,transition:[0,0,1]}];
assert.equal(bloodExpected(models,1),15);assert.equal(bloodExpected(models,8),43);models[0].transition=[0,0,1];assert.equal(bloodExpected(models,1),17);
let paths=0,promotions=0,mixedOutcome;
for(let i=0;i<BLOOD_STATES.length;i++)for(let j=0;j<BLOOD_CATALOG[i].length;j++){
 const [seed,,next]=BLOOD_CATALOG[i][j],initial={...BLOOD_STATES[i],multiplier:i<3?1:10};let rolls=0;
 const out=bloodOutcome(seed,initial,()=>{rolls++;return i<3?.999:.1;}),resolved=resolveOutcome(out),base=[0,0,0];
 assert.equal(bountyIndex(out.bloodFinal),next);assert.equal(resolved.cents,out.rawCents);let previous=initial.multiplier;
 for(let k=0;k<resolved.steps.length;k++){
  const s=resolved.steps[k];assert.equal(s.winBoost,previous);assert.equal(s.bloodBefore.multiplier,previous);
  base[s.bloodBefore.level]+=evaluate(s.grid,s.wilds,1,wildTotal(s.wilds),{winBoost:1,maxEligible:false}).exactTenths;
  if(s.blood.upgraded){assert.equal(s.blood.reward.fromMultiplier,previous);previous=s.blood.reward.multiplier;promotions++;mixedOutcome??=out;}
  assert.equal(s.blood.state.multiplier,previous);
 }
 assert.equal(rolls,BLOOD_STATES[next].level-initial.level);assert.deepEqual(base,BLOOD_PROFILES[i][j]);
 // Different independent multiplier draws must retain every resolved symbol.
 if(j%100===0){const low=bloodOutcome(seed,initial,()=>.1);assert.deepEqual(low.steps.map(s=>s.grid),out.steps.map(s=>s.grid));}
 paths++;
}
assert.ok(promotions>0);
for(const bet of [.01,.13,.25,2.5]){const exact=mixedOutcome.steps.reduce((n,s)=>n+evaluate(s.grid,s.wilds,bet,wildTotal(s.wilds),{winBoost:s.winBoost,maxEligible:false}).exactTenths,0),result=resolveOutcome(mixedOutcome,bet);assert.equal(result.cents,Math.round(exact/10));assert.equal(result.steps.reduce((n,s)=>n+s.result.cents,0),result.cents);}
assert.equal(resolveOutcome(mixedOutcome,1,1).cents,1);
const model=bloodModel();assert.ok(Math.abs(model.value-BUY_COST.dead*targetRTP('deadbuy'))<1e-9);
// Independently reconstruct each model from CDF intervals, raw stage paytable
// totals and all 25 pairs of draws; no prices or branch helper is reused.
const values=[1,2,4,6,8,10],rolls=[[2,.695],[4,.2],[6,.07],[8,.025],[10,.01]];
const exactModels=model.models.map((m,index)=>{
 const state=m.state,i=Math.floor(index/6),transition=Array(42).fill(0);let mean=0,prev=0;
 BLOOD_CATALOG[i].forEach((row,j)=>{const p=m.cdf[j]-prev;prev=m.cdf[j];assert.ok(p>=0);const next=row[2],end=BLOOD_STATES[next].level,base=BLOOD_PROFILES[i][j];
  const first=end>state.level?rolls:[[state.multiplier,1]],second=end>state.level+1?rolls:[[state.multiplier,1]];
  for(const [a,pa]of first)for(const [b,pb]of second){const mids=Array(3).fill(state.multiplier);if(end>state.level)mids[state.level+1]=Math.max(state.multiplier,a);if(end>state.level+1)mids[state.level+2]=Math.max(state.multiplier,a,b);const q=p*pa*pb;mean+=q*Math.round(base.reduce((sum,v,k)=>sum+v*mids[k],0)/10)/100;transition[next*6+values.indexOf(mids[end])]+=q;}
 });assert.ok(Math.abs(mean-m.mean)<1e-9);transition.forEach((v,k)=>assert.ok(Math.abs(v-m.transition[k])<1e-10));return{state,mean,transition};
});assert.ok(Math.abs(bloodExpected(exactModels)-model.value)<1e-8);
let remaining=8,played=0,state=freshBounty(),total=0,grants=0;const run=createBloodRewards();
while(remaining>0){remaining--;played++;const out=bloodDemoOutcome(state,played),r=resolveOutcome(out);for(const step of r.steps){const reward=run.claim(step.blood);if(reward){remaining+=reward.spins;grants++;}}state=out.bloodFinal;total+=r.cents;assert.ok(played<=12);}
assert.equal(played,12);assert.equal(grants,2);assert.equal(run.multiplier,4);assert.equal(total,4290);
console.log(JSON.stringify({paths,promotions,played,grants,totalCents:total,rtp:model.rtp,exactRollBuckets:[...counts]}));
