// Blood Money's persistent bounty state. All stamps come from real paying
// target combinations; transforms happen between evaluation and gravity.
import * as M from './math.js?v=23';
import {collapse,removePayingWilds} from './cascade-kernel.js?v=1';
import {bloodMultiplier,rollBloodMultiplier} from './blood-rules.js?v=2';

export const BLOOD_LADDER=Object.freeze(['bottle','guns','bandit']);
export const BLOOD_NAMES=Object.freeze({bottle:'POISON BOTTLE',guns:'REVOLVERS',bandit:'OUTLAW'});
export const BLOOD_STATES=Object.freeze([
 {level:0,stamps:0},{level:0,stamps:1},{level:0,stamps:2},
 {level:1,stamps:0},{level:1,stamps:1},{level:1,stamps:2},
 {level:2,stamps:0}
].map(Object.freeze));
export const freshBounty=()=>({level:0,stamps:0,multiplier:1});
export function bountyIndex(state){
 if(!Number.isInteger(state?.level)||state.level<0||state.level>2||!Number.isInteger(state.stamps)||state.stamps<0||state.stamps>(state.level===2?3:2))throw new RangeError('Invalid Blood Money bounty state');
// Final health shares the terminal pricing state: no payout or probability change.
 return state.level===2?6:state.level*3+state.stamps;
}
export function upgradeSymbol(symbol,level){const i=BLOOD_LADDER.indexOf(symbol);return i>=0&&i<level?BLOOD_LADDER[level]:symbol;}
export const upgradeGrid=(grid,level)=>grid.map(col=>col.map(s=>upgradeSymbol(s,level)));
export function collectBounty(state,result,grid,wilds={}){
 bountyIndex(state);const target=BLOOD_LADDER[state.level];
 const paid=!(state.level===2&&state.stamps===3)&&result.groups.some(g=>g.symbol===target&&g.exactTenths>0&&g.cells.some(([c,r])=>!wilds[c]&&grid[c][r]===target));
 if(!paid)return {state:{...state},stamp:false,upgraded:false,target};
 const upgraded=state.level<2&&state.stamps===2;
 return {state:upgraded?{...state,level:state.level+1,stamps:0}:{...state,stamps:state.stamps+1},stamp:true,upgraded,target,next:upgraded?BLOOD_LADDER[state.level+1]:null};
}
export function bloodRandom(seed){let s=seed>>>0;return()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};}

// Deterministic complete trajectories: the catalog stores seeds, never a
// forced win amount. Runtime awards are re-evaluated against the paytable.
export function bloodOutcome(seed,initial=freshBounty(),multiplierRandom=bloodRandom(seed^0x6d2b79f5)){
 bountyIndex(initial);const rng=bloodRandom(seed);let state={...initial,multiplier:bloodMultiplier(initial)};
 const draw=()=>upgradeSymbol(M.drawSymbol('free',rng),state.level);
 let grid=Array.from({length:6},()=>Array.from({length:4},draw));
 const chosen=M.rollFreeWild(rng);let wilds=chosen?{[chosen.reel]:{mult:chosen.mult,spawn:chosen.spawn,kind:'man'}}:{};
 // Seed construction only. Catalog weighting includes these trajectories,
 // their full awards and their bounty transitions in the eight-spin budget.
 if(state.level<2&&rng()<.34)for(let c=0;c<3;c++)grid[c][Math.floor(rng()*4)]=BLOOD_LADDER[state.level];
 if(rng()<.10){const c=Math.floor(rng()*6),r=Math.floor(rng()*4);if(!wilds[c]&&M.PAYING.includes(grid[c][r]))grid[c][r]=M.BOMB;}
 const steps=[];let exact=0;
 for(let i=0;i<=M.TUMBLE_LIMIT;i++){
  const winBoost=bloodMultiplier(state);
  const result=M.evaluate(grid,wilds,1,M.wildTotal(wilds),{winBoost,maxEligible:false});
  const bomb=M.bombBlast(grid,wilds),event=collectBounty(state,result,grid,wilds);
  // A separate random stream preserves the symbol path. This winning tumble
  // pays at the old multiplier; only subsequent tumbles use the new result.
  if(event.upgraded){event.reward=rollBloodMultiplier(winBoost,multiplierRandom());event.state.multiplier=event.reward.multiplier;}
  const step={grid,wilds,winBoost,bloodBefore:{...state},blood:event,...(bomb?{bomb}:{})};steps.push(step);exact+=result.exactTenths;
  // Never reject/reroll a high multiplier. The ledger applies the round cap.
  state=event.state;
  if(!result.exactTenths&&!bomb){
   const first=steps[0];return {mode:'free',blood:true,seed,grid:first.grid,wilds:first.wilds,steps,winBoost:bloodMultiplier(initial),maxEligible:false,trigger:null,bloodInitial:{...initial,multiplier:bloodMultiplier(initial)},bloodFinal:{...state},rawCents:Math.round(exact/10)};
  }
  if(i===M.TUMBLE_LIMIT)return null;
  const transformed=event.upgraded?upgradeGrid(grid,state.level):grid;
  grid=collapse(transformed,M.clearCellsForStep(step,result),draw).grid;
  wilds=removePayingWilds(wilds,result.cells);
 }
 return null;
}
