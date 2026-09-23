import * as M from './math.js?v=23';
import {HANG_RULES,hangFeature} from './hang-kernel.js?v=3';
import {HANG_CATALOG} from './hang-catalog.js?v=2';
// Fixed release weighting: favor returns near the buy, while retaining a large-win tail.
// This is calibrated once to 96.4%; no player or previous-result inputs.
export const HANG_PAYOUT_SHAPE=Object.freeze({shoulder:.75,power:4});
let calibrated;
function distribution(tilt){
 const weights=HANG_CATALOG.map(([,cents])=>Math.pow(Math.min(1,Math.max(.00001,cents/(M.BUY_COST.deader*100*HANG_PAYOUT_SHAPE.shoulder))),HANG_PAYOUT_SHAPE.power)*Math.exp(tilt*Math.log1p(cents/10000))),mass=weights.reduce((a,b)=>a+b,0);
 let value=0,sum=0;const cdf=weights.map((w,i)=>{const p=w/mass;value+=p*HANG_CATALOG[i][1]/100;sum+=p;return sum;});cdf[cdf.length-1]=1;
 return {value,cdf};
}
export function hangModel(){
 if(calibrated)return calibrated;
 const target=M.BUY_COST.deader*M.targetRTP('deaderbuy');let lo=-32,hi=8;
 if(distribution(lo).value>target||distribution(hi).value<target)throw Error('Hang catalog cannot meet its configured return');
 for(let i=0;i<64;i++){const mid=(lo+hi)/2;if(distribution(mid).value<target)lo=mid;else hi=mid;}
 const tilt=(lo+hi)/2,model=distribution(tilt);
 calibrated={...model,tilt,rtp:model.value/M.BUY_COST.deader};return calibrated;
}
export function rollHangFeature(rng=()=>crypto.getRandomValues(new Uint32Array(1))[0]/4294967296){
 const model=hangModel(),u=rng();let lo=0,hi=model.cdf.length-1;
 while(lo<hi){const mid=(lo+hi)>>1;if(u<model.cdf[mid])hi=mid;else lo=mid+1;}
 const row=HANG_CATALOG[lo],feature=hangFeature(row[0]);
 if(!feature||feature.cents!==row[1])throw Error('Hang trajectory does not match its catalog');
 return feature;
}
export function hangDemoFeature(){
 const row=HANG_CATALOG.find(([,cents,locks,upgrades,first,retriggers,tumbles])=>locks===3&&upgrades>=1&&retriggers>=1&&tumbles>=1&&cents>=50000&&cents<150000);
 if(!row)throw Error('Hang walkthrough is missing');return hangFeature(row[0]);
}
export function hangAudit(){
 const m=hangModel(),locks=[0,0,0,0],weighted=[];let upgrades=0,previous=0,retriggerChance=0,tumbleEventChancePerFeature=0,averageSpins=0;
 const bands={belowHalf:0,halfToThreeQuarters:0,threeQuartersToBuy:0,oneToFiveBuys:0,fiveBuysPlus:0};
 HANG_CATALOG.forEach((r,i)=>{const p=m.cdf[i]-previous;previous=m.cdf[i];locks[r[2]]+=p;if(r[3])upgrades+=p;
  retriggerChance+=p*(r[5]>0);tumbleEventChancePerFeature+=p*(r[6]>0);averageSpins+=p*r[7];
  const ratio=r[1]/(M.BUY_COST.deader*100);weighted.push({ratio,p});
  bands[ratio<.5?'belowHalf':ratio<.75?'halfToThreeQuarters':ratio<1?'threeQuartersToBuy':ratio<5?'oneToFiveBuys':'fiveBuysPlus']+=p;
 });
 let medianBuyReturn=0,acc=0;for(const row of weighted.sort((a,b)=>a.ratio-b.ratio)){acc+=row.p;if(acc>=.5){medianBuyReturn=row.ratio;break;}}
 return {rtp:m.rtp,mean:m.value,paths:HANG_CATALOG.length,locks,upgrades,spins:HANG_RULES.spins,retriggerChance,tumbleEventChancePerFeature,averageSpins,medianBuyReturn,bands};
}
