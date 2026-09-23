import assert from 'node:assert/strict';
import * as M from '../dist/math.js';

// Check the public calibrated distribution, not just the settings on the card.
const base=M.breakdown('normal'),boost=M.breakdown('boost');
assert.equal(boost.cost,3);
let baseChance=0,boostChance=0;
for(const n of [3,4,5]){
 const a=base.bands.find(r=>r.name===`feature${n}`),b=boost.bands.find(r=>r.name===`feature${n}`);
 assert.ok(Math.abs(b.probability/a.probability-5)<1e-12);
 baseChance+=a.probability;boostChance+=b.probability;
}
assert.ok(Math.abs(boostChance/baseChance-5)<1e-12);
for(const mode of ['normal','boost']){
 const {rows}=M.modelEntries(mode);
 assert.ok(Math.abs(rows.reduce((n,r)=>n+r.prob,0)-1)<1e-12);
 assert.ok(rows.every(r=>r.prob>=0&&r.cdf.at(-1)>1-1e-10));
 for(const row of rows.filter(r=>r.name.startsWith('feature'))){
  // Select the interior of each actual sampler interval, then inspect the
  // returned terminal reels to ensure the advertised trigger is delivered.
  const u=row.until-row.prob/2;let draw=0;
  const outcome=M.rollOutcome(mode,()=>draw++===0?u:.5);
  assert.equal(Math.min(5,M.countScatters(outcome.steps.at(-1).grid)),Number(row.name.at(-1)));
  assert.ok(outcome.trigger);
 }
}
const modes=['normal','boost','trickster','allin','deadbuy','deaderbuy','outlaws','maxfree'];
const returns=modes.map(mode=>{const r=M.theoreticalRTP(mode);assert.ok(Math.abs(r-M.targetRTP(mode))<1e-12);assert.ok(r<=.967+1e-12);return r;});
assert.ok(Math.max(...returns)-Math.min(...returns)<=.005+1e-12);
console.log('PASS: 5× real bonus trigger odds, 3× cost, valid sampler branches, and all mode RTP limits.');
console.log({baseBonusChance:baseChance,boosterBonusChance:boostChance,boosterRTP:boost.rtp});
