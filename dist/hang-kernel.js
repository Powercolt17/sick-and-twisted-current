import * as M from './math.js?v=23';
import {collapse} from './cascade-kernel.js?v=1';
export const HANG_RULES=Object.freeze({spins:12,locks:3,firstLockBy:3,initialMultiplier:8,maxMultiplier:64,boost:1,eventChance:.30,tumbleEventChance:.08,scatterChance:.04,retriggerScatters:3,retriggerSpins:3,maxRetriggers:4,maxFeature:60000,stampsRequired:3,finaleStampGain:2,temporaryChance:.08,temporaryMultiplier:8});
export function seededHang(seed){let a=seed>>>0;return ()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};}
const copy=w=>Object.fromEntries(Object.entries(w).map(([c,v])=>[c,{...v}]));
const weights=Object.entries(M.WEIGHTS),mass=weights.reduce((n,[,w])=>n+w,0);
function symbol(rng,scatters){if(scatters&&rng()<HANG_RULES.scatterChance)return 'scatter';let u=rng()*mass;for(const [s,w] of weights){u-=w;if(u<0)return s;}return 'ten';}
// Each contributing permanent reel earns once per winning tumble, not per way.
// Apply only AFTER that award. Its new value belongs to the next board.
export function earnHangStamps(locks,cells,finale=false){
 const next=copy(locks),earned=[];
 for(const reel of [...new Set(cells.map(([c])=>c))].sort((a,b)=>a-b)){
  const w=next[reel];if(!w||w.temporary||w.mult>=HANG_RULES.maxMultiplier)continue;
  const from=w.stamps||0,gain=finale?HANG_RULES.finaleStampGain:1,filled=from+gain,upgrade=filled>=HANG_RULES.stampsRequired;
  const old=w.mult;if(upgrade){w.mult=Math.min(HANG_RULES.maxMultiplier,w.mult*2);w.spawn=w.mult/8;}
  w.stamps=w.mult===HANG_RULES.maxMultiplier?3:filled%HANG_RULES.stampsRequired;
  earned.push({reel,from,to:w.stamps,gain,filled,upgrade,fromMultiplier:old,toMultiplier:w.mult});
 }
 return {locks:next,earned};
}
// A receipt allocation of already credited cents, never another award.
export function splitHangBounty(cents,cells,wilds){
 const reels=[...new Set(cells.map(([c])=>c))].filter(c=>wilds[c]).sort((a,b)=>a-b);
 const result={outlaws:{},temporary:0,other:0};if(!reels.length){result.other=cents;return result;}
 let prior=0;reels.forEach((c,i)=>{const next=Math.round(cents*(i+1)/reels.length),part=next-prior;prior=next;if(wilds[c].temporary)result.temporary+=part;else result.outlaws[c]=part;});return result;
}
export function hangFeature(seed){
 const rng=seededHang(seed),spins=[];let locks={},order=[],prior=null,total=0,upgrades=0,stampUpgrades=0,temporarySpins=0,first=-1,retriggers=0,tumbleEvents=0,remaining=HANG_RULES.spins;
 function capture(spin){
  if(order.length<HANG_RULES.locks){
   const available=Array.from({length:6},(_,c)=>c).filter(c=>!locks[c]),reel=available[Math.floor(rng()*available.length)];
   locks[reel]={mult:HANG_RULES.initialMultiplier,spawn:1,kind:'man',locked:true,stamps:0};order.push(reel);if(first<0)first=spin;
   return {type:'lock',reel,slot:order.length-1,from:0,to:locks[reel].mult,finale:order.length===3};
  }
  const eligible=order.filter(c=>locks[c].mult<HANG_RULES.maxMultiplier);if(!eligible.length)return null;
  const reel=eligible[Math.floor(rng()*eligible.length)],from=locks[reel].mult;
  locks[reel]={...locks[reel],mult:from*2,spawn:from/4,...(from*2===64?{stamps:3}:{})};upgrades++;
  return {type:'upgrade',reel,slot:order.indexOf(reel),from,to:from*2};
 }
 while(remaining>0){
  remaining--;const spin=spins.length,before=copy(locks);
  let event=(rng()<HANG_RULES.eventChance||(!order.length&&spin===HANG_RULES.firstLockBy-1))?capture(spin):null;
  let temporary=null;
  // Eligible only on a fresh spin AFTER three permanent captures; never a fourth lock.
  if(Object.keys(before).length===3&&rng()<HANG_RULES.temporaryChance){const pool=Array.from({length:6},(_,c)=>c).filter(c=>!locks[c]);temporary={reel:pool[Math.floor(rng()*pool.length)],mult:HANG_RULES.temporaryMultiplier,spawn:1,kind:'man',locked:true,temporary:true};temporarySpins++;}
  const draw=()=>symbol(rng,retriggers<HANG_RULES.maxRetriggers);
  let grid=Array.from({length:6},(_,c)=>before[c]&&prior?[...prior[c]]:Array.from({length:4},draw));
  if(rng()<.12){const c=Math.floor(rng()*6),r=Math.floor(rng()*4);if(!locks[c]&&temporary?.reel!==c)grid[c][r]=M.BOMB;}
  const steps=[];let extraSpins=0;
  for(let tumble=0;tumble<=M.TUMBLE_LIMIT;tumble++){
   const wilds={...copy(locks),...(temporary?{[temporary.reel]:{...temporary}}:{})};
   const result=M.evaluate(grid,wilds,1,M.wildTotal(wilds),{winBoost:HANG_RULES.boost,requireNatural:true});
   const bomb=M.bombBlast(grid,wilds),step={grid,wilds,requireNatural:true,hang:{event,locks:copy(locks),order:[...order],finale:order.length===3,temporary:temporary&&{...temporary},temporaryArrival:!!temporary&&tumble===0},...(bomb?{bomb}:{})};steps.push(step);
   total+=result.cents;if(total>HANG_RULES.maxFeature*100)return null;
   if(result.cents>0){const reward=earnHangStamps(locks,result.cells,order.length===3);locks=copy(reward.locks);step.hang.reward=reward;const n=reward.earned.filter(e=>e.upgrade).length;upgrades+=n;stampUpgrades+=n;}
   if(!result.cents&&!bomb){
    const cells=[];grid.forEach((col,c)=>{if(!wilds[c])col.forEach((s,r)=>{if(s==='scatter')cells.push([c,r]);});});
    if(cells.length>=HANG_RULES.retriggerScatters&&retriggers<HANG_RULES.maxRetriggers){retriggers++;extraSpins=HANG_RULES.retriggerSpins;remaining+=extraSpins;step.hangRetrigger={type:'retrigger',spins:extraSpins,cells,remaining,retriggers};}
    break;
   }
   if(tumble===M.TUMBLE_LIMIT)return null;
   const cells=M.clearCellsForStep(step,result).filter(([c])=>!wilds[c]);if(!cells.length)throw Error('Hang outcome cannot clear a locked-only win');
   grid=collapse(grid,cells,draw).grid;event=result.cents>0&&rng()<HANG_RULES.tumbleEventChance?capture(spin):null;if(event)tumbleEvents++;
  }
  prior=grid;
  spins.push({mode:'deaderfree',grid:steps[0].grid,wilds:steps[0].wilds,steps,winBoost:HANG_RULES.boost,maxEligible:false,trigger:null,hang:{before,event:steps[0].hang.event,locks:copy(locks),order:[...order],spin:spin+1,extraSpins,remaining,temporary:temporary&&{...temporary},finale:order.length===3}});
 }
 return {seed,spins,cents:total,locks:order.length,upgrades,stampUpgrades,temporarySpins,first,order,final:copy(locks),retriggers,tumbleEvents};
}
