import assert from 'node:assert/strict';
import {earnHangStamps,splitHangBounty,hangFeature} from '../dist/hang-kernel.js';
import {hangDemoFeature} from '../dist/hang-math.js';
import * as M from '../dist/math.js';
let locks={0:{mult:8,locked:true,stamps:0},2:{mult:32,locked:true,stamps:2}};
let r=earnHangStamps(locks,[[0,0],[0,1],[0,3]]);
assert.equal(r.locks[0].stamps,1,'one stamp per contributing reel, not per cell/way');
assert.equal(locks[0].stamps,0,'input is immutable');assert.equal(r.locks[2].stamps,2,'noncontributor unchanged');
r=earnHangStamps(r.locks,[[0,0]],true);assert.equal(r.locks[0].mult,16);assert.equal(r.locks[0].stamps,0);
r=earnHangStamps(locks,[[2,0]],true);assert.equal(r.locks[2].mult,64);assert.equal(r.locks[2].stamps,3);
assert.equal(earnHangStamps(r.locks,[[2,0]],true).earned.length,0,'64 cap does not repeatedly award');
assert.equal(earnHangStamps({1:{mult:8,temporary:true}},[[1,0]],true).earned.length,0);
for(const cents of [0,1,2,99,100,10001]){
 const s=splitHangBounty(cents,[[0,0],[0,1],[2,3],[4,1]],{0:{},2:{},4:{temporary:true}});
 assert.equal(Object.values(s.outlaws).reduce((a,b)=>a+b,0)+s.temporary+s.other,cents);
}
const demo=hangDemoFeature();assert.ok(demo.stampUpgrades&&demo.temporarySpins&&demo.retriggers);
let sum=0,stampCount=0,tempCount=0;
for(const [i,o]of demo.spins.entries()){
 const resolved=M.resolveOutcome(o);sum+=resolved.cents;
 if(o.hang.temporary){tempCount++;assert.equal(Object.keys(o.hang.before).length,3);assert.equal(o.hang.temporary.mult,8);assert.equal(o.hang.locks[o.hang.temporary.reel],undefined,'temporary never enters permanent locks');}
 for(const [j,s]of o.steps.entries()){
  const reward=s.hang.reward;if(!reward)continue;
  const paid=M.evaluate(s.grid,s.wilds,1,M.wildTotal(s.wilds),{winBoost:1,requireNatural:true});
  assert.deepEqual(reward,earnHangStamps(s.hang.locks,paid.cells,s.hang.finale));
  for(const e of reward.earned){stampCount++;assert.equal(s.wilds[e.reel].mult,e.fromMultiplier,'current award uses old multiplier');if(o.steps[j+1])assert.ok(o.steps[j+1].wilds[e.reel].mult>=e.toMultiplier);}
 }
 if(i+1<demo.spins.length)assert.deepEqual(demo.spins[i+1].hang.before,o.hang.locks);
}
assert.equal(sum,demo.cents);assert.equal(tempCount,demo.temporarySpins);assert.ok(stampCount>0);
assert.deepEqual(hangFeature(demo.seed),demo,'animation cannot influence seeded results');
console.log('PASS stamp deduplication, double stamps, 64 cap, immutable awards, temporary lifecycle, old/new multiplier timing and exact receipt cents.');
