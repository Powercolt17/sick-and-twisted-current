import * as M from './math.js?v=23';
import {BLOOD_STATES,bloodOutcome,bountyIndex} from './blood-bounty.js?v=81';
import {BLOOD_CATALOG} from './blood-catalog.js?v=2';
import {BLOOD_PROFILES} from './blood-profiles.js?v=1';
import {BLOOD_START_SPINS,bloodExtraSpins,bloodMultiplier,BLOOD_MULTIPLIERS,BLOOD_MULTIPLIER_WEIGHTS} from './blood-rules.js?v=2';
const VALUES=BLOOD_MULTIPLIERS,TARGET=M.BUY_COST.dead*M.targetRTP('deadbuy');
export const BLOOD_MODEL_STATES=Object.freeze(BLOOD_STATES.flatMap(s=>VALUES.map(multiplier=>Object.freeze({...s,multiplier}))));
const modelIndex=state=>bountyIndex(state)*VALUES.length+VALUES.indexOf(bloodMultiplier(state));
let calibrated,prices;

// Integrate every possible independent multiplier draw, including a held result.
// Each tuple is {multipliers by stage, final value, exact probability}.
export function bloodRollBranches(level,finalLevel,current){
 let branches=[{values:Array(3).fill(current),value:current,p:1}];
 for(let stage=level+1;stage<=finalLevel;stage++)branches=branches.flatMap(b=>BLOOD_MULTIPLIER_WEIGHTS.map(e=>{
  const value=Math.max(b.value,e.value),values=[...b.values];values[stage]=value;
  return {values,value,p:b.p*e.weight/1000};
 }));
 return branches;
}
function preparePrices(){
 if(prices)return prices;
 return prices=BLOOD_STATES.map((s,i)=>VALUES.map(current=>BLOOD_CATALOG[i].map((row,j)=>{
  const next=row[2],branches=bloodRollBranches(s.level,BLOOD_STATES[next].level,current),base=BLOOD_PROFILES[i][j];
  const mean=branches.reduce((sum,b)=>sum+b.p*Math.round(base.reduce((v,t,k)=>v+t*b.values[k],0)/10)/100,0);
  return {mean,branches};
 })));
}
function distributions(tilt){
 const costs=preparePrices(),models=[];
 BLOOD_CATALOG.forEach((rows,i)=>{
  // One fixed catalog weighting, independent of prior winnings and multiplier.
  const logs=rows.map(([,cents])=>tilt*cents/4000),top=Math.max(...logs),weights=logs.map(l=>Math.exp(l-top)),mass=weights.reduce((a,b)=>a+b,0);
  const probabilities=weights.map(w=>w/mass),cdf=[];let cumulative=0;for(const p of probabilities){cumulative+=p;cdf.push(cumulative);}cdf[cdf.length-1]=1;
  VALUES.forEach((current,vi)=>{
   const transition=Array(BLOOD_MODEL_STATES.length).fill(0);let mean=0;
   rows.forEach((row,j)=>{const p=probabilities[j],price=costs[i][vi][j];mean+=p*price.mean;
    for(const b of price.branches)transition[row[2]*VALUES.length+VALUES.indexOf(b.value)]+=p*b.p;
   });
   models.push({state:{...BLOOD_STATES[i],multiplier:current},mean,transition,cdf});
  });
 });return models;
}
export function bloodExpected(models,spins=BLOOD_START_SPINS,start=0){
 const memo=new Map();
 function value(n,state){
  if(n<=0)return 0;const key=n+':'+state;if(memo.has(key))return memo.get(key);
  const m=models[state],level=m.state.level;
  // n + 2*(2-level) decreases on every spin, including last-spin promotions.
  const total=m.mean+m.transition.reduce((sum,p,next)=>p?sum+p*value(n-1+bloodExtraSpins(level,models[next].state.level),next):sum,0);
  memo.set(key,total);return total;
 }return value(spins,start);
}
export function bloodModel(){
 if(calibrated)return calibrated;
 let low=-128,high=128;
 if(bloodExpected(distributions(low))>TARGET||bloodExpected(distributions(high))<TARGET)throw Error('Blood Money catalog cannot meet its return target');
 for(let i=0;i<56;i++){const mid=(low+high)/2;if(bloodExpected(distributions(mid))<TARGET)low=mid;else high=mid;}
 const tilt=(low+high)/2,models=distributions(tilt),value=bloodExpected(models);
 return calibrated={tilt,models,value,rtp:value/M.BUY_COST.dead,spins:BLOOD_START_SPINS};
}
export function rollBloodOutcome(state,rng=()=>crypto.getRandomValues(new Uint32Array(1))[0]/4294967296){
 const index=bountyIndex(state),model=bloodModel().models[modelIndex(state)],u=rng();if(!(u>=0&&u<1))throw RangeError('Outcome draw must be in [0,1)');let lo=0,hi=model.cdf.length-1;
 while(lo<hi){const mid=(lo+hi)>>1;if(u<model.cdf[mid])hi=mid;else lo=mid+1;}
 const out=bloodOutcome(BLOOD_CATALOG[index][lo][0],state,rng);if(!out)throw Error('Invalid Blood Money path');
 return out.steps.some(s=>s.blood.upgraded)?out:M.withShotWilds(out,rng);
}
export function bloodAudit(){return {states:BLOOD_MODEL_STATES,catalog:BLOOD_CATALOG,...bloodModel()};}
// Explicit no-stake walkthrough; live purchases always use rollBloodOutcome.
export function bloodDemoOutcome(state,spin){
 const index=bountyIndex(state),rows=BLOOD_CATALOG[index];
 const candidates=rows.filter(([,value,next])=>value>0&&value<=1600&&(index===6?next===6:next===index+1));
 if(!candidates.length)throw Error('Missing bounty demonstration');
 return bloodOutcome(candidates[(spin*17)%candidates.length][0],state,()=>state.level===0?.2:.8);
}
