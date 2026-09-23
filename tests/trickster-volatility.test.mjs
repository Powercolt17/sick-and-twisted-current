import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import * as M from '../dist/math.js';
import {bloodModel} from '../dist/blood-math.js';
import {hangModel} from '../dist/hang-math.js';
import {HANG_CATALOG} from '../dist/hang-catalog.js';
import {BLOOD_CATALOG} from '../dist/blood-catalog.js';

const model=M.modelEntries('trickster'),cost=M.SPIN_COST.trickster;
const near=(a,b,label,tol=1e-10)=>assert.ok(Math.abs(a-b)<tol,label+': '+a+' vs '+b);
near(M.targetRTP('trickster'),.962,'unchanged target');
near(model.rows.reduce((s,r)=>s+r.prob,0),1,'ordinary probability mass');
const blood=bloodModel(),hang=hangModel();
assert.ok(Math.max(...BLOOD_CATALOG.flat().map(r=>r[1]/100))*12+cost*3<M.MAX_AWARD);
assert.ok(Math.max(...HANG_CATALOG.map(r=>r[1]/100))+cost*3<M.MAX_AWARD);
// Enumerate actual free-spin payouts instead of trusting the paid model's EV.
const maxfree=M.modelEntries('maxfree');
let freeMean=0;
for(const row of maxfree.rows){
 let previous=0;
 for(let i=0;i<row.ids.length;i++){
  const p=row.cdf[i]-previous;previous=row.cdf[i];
  const resolved=M.resolveOutcome(M.outcomeById(row.ids[i],'maxfree'));
  assert.ok(resolved.value<=M.MODE_RULES.maxfree.pathCeiling);
  freeMean+=row.prob*p*resolved.value;
 }
}
assert.ok(M.MODE_RULES.maxfree.pathCeiling*12+cost*3<M.MAX_AWARD);
const noMax=(1-maxfree.maxProbability)**12;
function completeEV(out,resolved){
 if(!resolved.trigger||resolved.maxWin)return resolved.value;
 const n=resolved.trigger.scatters;
 if(n===3)return resolved.value+blood.value;
 if(n===4)return resolved.value+hang.value;
 return noMax*(resolved.value+12*freeMean)+(1-noMax)*M.MAX_AWARD;
}
let ev=0,dead=0,ordinaryPay=0,feature=0,paths=0;
const payouts=new Map();
for(const row of model.rows){
 assert.ok(Number.isFinite(row.prob)&&row.prob>=0);
 near(row.cdf.at(-1),1,row.name+' CDF');
 let previous=0;
 for(let i=0;i<row.ids.length;i++){
  const conditional=row.cdf[i]-previous;previous=row.cdf[i];
  assert.ok(conditional>=0);
  const id=row.ids[i],out=M.outcomeById(id,'trickster'),resolved=M.resolveOutcome(out);
  const p=(1-model.maxProbability)*row.prob*conditional;
  const complete=completeEV(out,resolved);
  ev+=p*complete;paths++;payouts.set(id,complete);
  if(!resolved.value&&!resolved.trigger)dead+=p;
  if(resolved.value)ordinaryPay+=p;
  if(resolved.trigger)feature+=p;
  assert.ok(resolved.value<=M.MODE_RULES.trickster.pathCeiling);
  if(row.name==='zero'){assert.equal(resolved.value,0);assert.equal(resolved.trigger,null);}
  if(row.name==='tail')assert.ok(resolved.value>24*cost);
  // Currency scaling and the full visible tumble award agree at each supported path.
  near(M.resolveOutcome(out,.1).value,resolved.value*.1,'ten-cent payout scaling');
 }
 // Exercise the real sampler at each positive band's first/middle/last path.
 for(const i of [0,Math.floor(row.ids.length/2),row.ids.length-1]){
  const pathU=((i?row.cdf[i-1]:0)+row.cdf[i])/2;
  const draws=[.5,row.until-row.prob/2,pathU,.999999];let index=0;
  const out=M.rollOutcome('trickster',()=>draws[index++]??.999999);
  assert.equal(out.pathId,row.ids[i]);
 }
}
for(const id of model.maxIds){
 const out=M.outcomeById(id,'trickster'),resolved=M.resolveOutcome(out);
 assert.ok(resolved.maxWin);assert.equal(resolved.value,M.MAX_AWARD);
 ev+=model.maxProbability/model.maxIds.length*resolved.value;
 payouts.set(id,resolved.value);
}
near(ev/cost,.962,'exhaustive complete-round RTP');
near(ev/cost,M.theoreticalRTP('trickster'),'advertised and evaluated RTP');
assert.ok(dead>.79&&dead<.81,'79–81% terminal dead spins');
assert.ok(1-dead>.19&&1-dead<.21,'about one hit/feature in five spins');
near(feature,(.007+.001+.00005)*(1-model.maxProbability),'feature odds preserved');
near(model.maxProbability,1/750000,'MAX odds preserved');
const tail=M.breakdown('trickster').bands.find(r=>r.name==='tail');
assert.ok(tail.probability>.01&&tail.probability<.02);
assert.ok(tail.mean*tail.probability/ev>.5,'rare large wins carry most return');

// Seeded sampler smoke check. Short samples test incidence, not rare-tail RTP.
let seed=0x51c07;const rng=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
let misses=0,streak=0,longest=0;
for(let n=0;n<50000;n++){
 const out=M.rollOutcome('trickster',rng),value=payouts.get(out.pathId);
 assert.notEqual(value,undefined);
 if(!value){misses++;longest=Math.max(longest,++streak);}else streak=0;
 if(n<1000){
  const actual=M.resolveOutcome(out),original=M.resolveOutcome(M.outcomeById(out.pathId,'trickster'));
  assert.equal(actual.cents,original.cents,'Shot Wild reveal preserves payout');
 }
}
assert.ok(Math.abs(misses/50000-dead)<.004,'sampler incidence matches distribution');
const report={rtp:ev/cost,deadSpinProbability:dead,hitOrFeatureProbability:1-dead,
 averageSpinsPerHit:1/(1-dead),largeWinProbability:tail.probability,
 largeWinMeanInSpinCosts:tail.mean/cost,ordinaryPayProbability:ordinaryPay,
 featureProbability:feature,maxProbability:model.maxProbability,enumeratedPaths:paths,
 chance20DeadSpins:dead**20,chance50DeadSpins:dead**50,
 sample:{spins:50000,deadSpins:misses,longestDeadStreak:longest}};
mkdirSync(new URL('../.sites-runtime/',import.meta.url),{recursive:true});
writeFileSync(new URL('../.sites-runtime/trickster-audit.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log('PASS: exhaustive RTP, dead-spin rate, rare wins, feature/MAX odds, sampler and payout invariants.');
console.log(JSON.stringify(report,null,2));
