import {CASCADE_DATA as BASE_CASCADE_DATA} from './cascade-data.js?v=1';
import {SCATTER_PATHS} from './scatter-paths.js?v=1';
import {BOMB_PATHS} from './bomb-paths.js?v=1';
import {BOMB,bombBlast,clearCellsForStep} from './bomb-kernel.js?v=1';
export {BOMB,bombBlast,clearCellsForStep};
export const CASCADE_DATA=[...BASE_CASCADE_DATA,...SCATTER_PATHS,...BOMB_PATHS];
import {collapse,removePayingWilds} from './cascade-kernel.js?v=1';
// Sick & Twisted — game mathematics. Single source of truth for symbol odds,
// the paytable, wild and scatter rules, and the theoretical return to player.
//
// INVARIANT: every paid mode and feature buy returns its configured RTP over its
// complete tumble round and awarded free spins. Run tools/verify-rtp.mjs.
// The finite path model is selected before animation; credits and player
// history are never inputs to its fixed probabilities.
//
// This is the local demo model. It is not a certified RTP and the game is not
// connected to a real-money engine.

export const REELS=6,ROWS=4,CELLS=REELS*ROWS;
export const RTP_LIMITS=Object.freeze({max:.967,maxSpread:.005});
export const TARGET_RTP=.967; // Base target only; use targetRTP(mode) for other modes.
// Fixed release settings, never selected from player history or business results.
// Paid modes stay at/below 96.70%, within 0.50 percentage points of each other.
// Free spins share their buy's distribution; their EV is included when pricing
// natural features in every triggering paid mode. MAX-active free spins have a
// separate per-spin budget because their cap applies to the whole paid round.
export const RTP_TARGETS=Object.freeze({
 normal:TARGET_RTP,boost:.966,trickster:.962,allin:.962,
 deadbuy:.967,deaderbuy:.964,outlaws:.962,maxfree:.964
});
export function validateRTPConfiguration(targets=RTP_TARGETS){
 const values=['normal','boost','trickster','allin','deadbuy','deaderbuy','outlaws','maxfree'].map(mode=>{
  const value=targets[mode];
  if(!Number.isFinite(value)||value<=0||value>RTP_LIMITS.max+1e-12)throw new RangeError('RTP target exceeds configured limits: '+mode);
  return value;
 });
 const min=Math.min(...values),max=Math.max(...values),spread=max-min;
 if(spread>RTP_LIMITS.maxSpread+1e-12)throw new RangeError('RTP targets exceed the 0.50 percentage-point spread');
 return {min,max,spread};
}
validateRTPConfiguration();
export function targetRTP(mode='normal'){
 const key=mode==='free'?'deadbuy':mode==='deaderfree'?'deaderbuy':mode;
 const target=RTP_TARGETS[key];
 if(!(target>0&&target<1))throw new RangeError('Invalid fixed RTP target: '+mode);
 return target;
}

// Atlas order (do not reorder: ash-bone/symbols.png cells are indexed by this).
export const SYMBOLS=['a','k','q','j','ten','bottle','bandit','guns','cuffs','star','skull','scatter'];
export const PAYING=['a','k','q','j','ten','bottle','bandit','guns','cuffs','star'];
export const SUBSTITUTE='skull';   // the marked skull stands in for every paying symbol
export const BOX_WILD='boxedwild';
// A quarter of eligible complete outcomes reveal 2–4 of their single-cell
// substitutes through the gunslinger. This splits an existing outcome into a
// landing board and a conversion, without adding awards or changing its weight.
export const SHOT_WILD_RATE=.25;
export const OUTLAWS_MARK_RATE=.4;
export const SCATTER='scatter';

// Relative reel weights of the non-scatter symbols (one independent draw per cell).
export const WEIGHTS={ten:12,j:12,q:11,k:11,a:10,cuffs:7,bottle:7,guns:6,star:6,bandit:5,skull:2};

// Seed sampler used for development previews and catalog baking. Live rounds
// use the calibrated complete-path distribution below. Free seeds have no scatters.
export const SCATTER_CHANCE={normal:0.019366183777189405,boost:0.028144380876250652,free:0};

// Cost of one spin in bet units per mode.
export const SPIN_COST={normal:1,boost:3,trickster:75,allin:2000};
export const MAX_AWARD=77777,MAX_TOKEN='max';
export const MAX_CHANCE={normal:0,boost:0,free:0,maxfree:1/1000000,trickster:1/750000,allin:1/250000};
export const maxEligible=mode=>(MAX_CHANCE[mode]||0)>0;

// Full-reel wild that claims one random reel after a spin lands, from the top down, one row at a time.
// It spawns with a random multiplier (`spawn`) and DOUBLES it with every row it claims below the first,
// so a 4-row reel gives WILD_STEPS = 3 doublings: the paying multiplier is spawn × 8.
// Seed wild samplers are for offline path construction. Live incidence is
// derived from the weighted complete paths, including their paying wilds.
export const WILD_STEPS=ROWS-1;
export const BASE_WILD={chance:0.015535173993490053,spawn:[1,2]};
export const FREE_WILD={chance:0.073665364837704278,spawn:[1,2,4]};
export function wildMultiplier(spawn){return spawn*Math.pow(2,WILD_STEPS);}
export function wildMultipliers(wild){return wild.spawn.map(wildMultiplier);}

// Scatter trigger: exactly 3 scatters → DEAD SPINS, 4 or more → DEADER SPINS.
export const TRIGGER={min:3,spins:{3:8,4:12,5:12},labels:{3:'DEAD',4:'DEADER',5:'DEADER'}};

// Pays per way, in TENTHS of the bet, for 3/4/5/6 matching reels from the left.
// Preserve tenths of a cent until all ways and tumbles have been evaluated.
export const PAYS={
 ten:[1,1,2,3],
 j:[1,1,2,3],
 q:[1,1,3,5],
 k:[1,2,3,5],
 a:[1,2,4,7],
 cuffs:[2,3,5,10],
 bottle:[2,3,6,12],
 guns:[2,4,8,16],
 star:[2,5,10,20],
 bandit:[3,6,14,30]
};

export function cellProbabilities(mode='normal'){
 const scatter=SCATTER_CHANCE[mode]??0,total=Object.values(WEIGHTS).reduce((a,b)=>a+b,0),p={};
 for(const [s,w] of Object.entries(WEIGHTS))p[s]=(1-scatter)*w/total;
 p[SCATTER]=scatter;
 return p;
}

const cryptoRandom=()=>{const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]/4294967296;};

export function drawSymbol(mode='normal',rng=cryptoRandom){
 const p=cellProbabilities(mode);let u=rng();
 for(const s of SYMBOLS){const q=p[s]||0;if(u<q)return s;u-=q;}
 return SYMBOLS[0];
}
export function drawGrid(mode='normal',rng=cryptoRandom){
 return Array.from({length:REELS},()=>Array.from({length:ROWS},()=>drawSymbol(mode,rng)));
}
// Wild-reel decisions, shared by the game and the simulator so they cannot drift apart.
export function rollBaseWild(rng=cryptoRandom){
 if(rng()>=BASE_WILD.chance)return null;
 const spawn=BASE_WILD.spawn[Math.floor(rng()*BASE_WILD.spawn.length)];
 return {reel:Math.floor(rng()*REELS),spawn,mult:wildMultiplier(spawn)};
}
export function rollFreeWild(rng=cryptoRandom){
 if(rng()>=FREE_WILD.chance)return null;
 const spawn=FREE_WILD.spawn[Math.floor(rng()*FREE_WILD.spawn.length)];
 return {reel:Math.floor(rng()*REELS),spawn,mult:wildMultiplier(spawn)};
}
export function countScatters(grid){let n=0;for(const reel of grid)for(const s of reel)if(s===SCATTER)n++;return n;}
export function triggeredSpins(scatters){
 if(scatters<TRIGGER.min)return null;
 const key=scatters>=5?5:scatters>=4?4:3;return {count:TRIGGER.spins[key],label:TRIGGER.labels[key],scatters,maxEligible:scatters>=5};
}

// Trickster multipliers belong to positions, not symbols. The current values
// pay first; every distinct paying position doubles once for the next board.
export function freshPositionMultipliers(){return Array.from({length:REELS},()=>Array(ROWS).fill(1));}
export function growPositionMultipliers(current,cells){
 const next=current.map(col=>[...col]);
 for(const key of new Set(cells.map(([c,r])=>c+':'+r))){const [c,r]=key.split(':').map(Number);next[c][r]*=2;}
 return next;
}

// Ways evaluation. wilds: {reelIndex:{mult}} — a wild reel matches every row.
// Returns USD values derived from exact integer cents.
export function evaluate(grid,wilds,bet,multiplier,options={}){
 const betCents=Math.round(bet*100),mult=Math.max(1,multiplier||0)*Math.max(1,options.winBoost||1);
 let cents=0,exactTenths=0,waysTotal=0;const cells=[],groups=[];
 for(const sym of PAYING){
  let ways=1,weightedWays=1,n=0;const hit=[];
  for(let c=0;c<REELS;c++){
   const matches=[];
   for(let r=0;r<ROWS;r++)if(wilds[c]||grid[c][r]===sym||grid[c][r]===SUBSTITUTE||grid[c][r]===BOX_WILD||(options.maxEligible&&grid[c][r]===MAX_TOKEN))matches.push([c,r]);
   if(!matches.length)break;
   ways*=matches.length;weightedWays*=matches.reduce((sum,[_c,r])=>sum+(options.positionMultipliers?.[c]?.[r]??1),0);n++;hit.push(...matches);
  }
  if(n>=3&&(!options.requireNatural||hit.some(([c,r])=>!wilds[c]&&grid[c][r]===sym))){
   // Expanding the product of reel sums equals summing every individual
   // paying way's position-multiplier product. Unrelated squares never count.
   const groupTenths=weightedWays*PAYS[sym][n-3]*betCents*mult;
   exactTenths+=groupTenths;const nextCents=Math.round(exactTenths/10),amount=nextCents-cents;
   cents=nextCents;waysTotal+=ways;cells.push(...hit);
   groups.push({symbol:sym,reels:n,ways,value:amount/100,exactTenths:groupTenths,cells:hit,...(options.positionMultipliers?{weightedWays}: {})});
  }
 }
 const maxCell=options.maxEligible?cells.find(([c,r])=>!wilds[c]&&grid[c][r]===MAX_TOKEN):null;
 if(maxCell){const award=betCents*MAX_AWARD,connected=groups.filter(g=>g.cells.some(([c,r])=>!wilds[c]&&grid[c][r]===MAX_TOKEN)),maxCells=[...new Map(connected.flatMap(g=>g.cells).map(p=>[p.join(','),p])).values()],ways=connected.reduce((n,g)=>n+g.ways,0);return {value:award/100,cents:award,exactTenths:award*10,ways,cells:maxCells,maxWin:true,maxCell,groups:[{symbol:MAX_TOKEN,maxHit:true,reels:0,ways,value:award/100,exactTenths:award*10,cells:maxCells,maxCell}]};}
 return {value:cents/100,cents,exactTenths,ways:waysTotal,cells,groups,maxWin:false};
}

// ---- Complete-round tumble model ------------------------------------------
export const BUY_COST={dead:99,deader:499,outlaws:799};
// Conditional 0/1/2-scatter mix in non-feature rounds, applied equally to
// paying and nonpaying amount bands. Base two-scatter misses are 3%; booster
// stays at 22%. Actual bonus trigger probabilities are configured separately.
export const SCATTER_PROFILE={normal:[.73,.24,.03],boost:[.40,.38,.22]};
export const BOUNTY_FEATURE_MULTIPLIER=5;
const BASE_FEATURE_CHANCES=Object.freeze([.0032,.00028,.000008]);
export const MODE_RULES={
 normal:{cost:1,boost:1,feature:[...BASE_FEATURE_CHANCES],profile:[.34,.02,.06,.006,.0008]},
 boost:{cost:SPIN_COST.boost,boost:1,feature:BASE_FEATURE_CHANCES.map(p=>p*BOUNTY_FEATURE_MULTIPLIER),profile:[.36,.025,.055,.005,.0007]},
 // High volatility: about 80.09% of paid rounds are terminal misses.
 // Rare complete paths above 24× purchase fund most of the fixed 96.2% RTP.
 // Calibrate the tail after feature/MAX EV; misses take the remaining mass.
 // Each round is independent: never force streaks or trim a won combination.
 trickster:{cost:SPIN_COST.trickster,boost:25,feature:[.007,.001,.00005],profile:[.055,.025,.065,.025,.005],
  evenCeiling:1,pathCeiling:SPIN_COST.trickster*50,tailRatio:24},
 // All In: about 85.37% terminal misses, with most return in larger awards.
 // At a 2,000× purchase the round cap is below 39× cost. Keep the tail
 // threshold inside that range so complete paths can calibrate to its RTP.
 allin:{cost:SPIN_COST.allin,boost:50,feature:[.006,.001,.00005],profile:[.02,.01,.05,.03,.015],tailRatio:24},
 free:{cost:BUY_COST.dead/8,boost:4,feature:[0,0,0],profile:[.58,.04,.12,.025,.001],pathCeiling:200,tailRatio:12},
 deaderfree:{cost:BUY_COST.deader/12,boost:1,feature:[0,0,0],profile:[.15,.65,.075,.002,.0001],pathCeiling:3800,tailRatio:60},
 maxfree:{cost:BUY_COST.deader/12,boost:10,feature:[0,0,0],profile:[.15,.65,.075,.002,.0001],pathCeiling:3800,tailRatio:60},
 outlaws:{cost:BUY_COST.outlaws,boost:1,feature:[0,0,0],profile:[.24,.03,.15,.06,.003]}
};
// Purchase-relative risk is checked across all 8 / 12 / 1 tumble rounds, not
// inferred from these per-spin bands. Ceilings filter supported trajectories;
// they never reduce a displayed combination's paytable award.
export const TUMBLE_SYMBOLS=[...SYMBOLS,MAX_TOKEN,BOX_WILD,BOMB];
export const TUMBLE_LIMIT=24;
export function wildTotal(wilds){return Object.values(wilds).reduce((n,w)=>n+w.mult,0);}
export function terminalTrigger(grid,mode){return MODE_RULES[mode]?.feature.some(p=>p>0)?triggeredSpins(countScatters(grid)):null;}
export function freeMode(label,maxActive=false){return maxActive?'maxfree':label==='DEADER'?'deaderfree':'free';}
export function maxFreeValue(){return MODE_RULES.maxfree.cost*targetRTP('maxfree');}
export function featureExpected(scatters,baseReturn=0){
 const t=triggeredSpins(scatters);if(!t)return baseReturn;
 const mode=freeMode(t.label,t.maxEligible),q=MAX_CHANCE[mode]||0;
 // A connected MAX ends the entire paid round at its cap. Otherwise all
 // awarded free rounds resolve independently with their ordinary means.
 const ordinary=(MODE_RULES[mode].cost*targetRTP(mode)-q*MAX_AWARD)/(1-q),noMax=(1-q)**t.count;
 return noMax*(baseReturn+t.count*ordinary)+(1-noMax)*MAX_AWARD;
}
export function traceTumbles(grid,wilds,fill,{maxActive=false,limit=TUMBLE_LIMIT}={}){
 const steps=[];let current=grid.map(c=>[...c]),active=structuredClone(wilds),sum=0;
 for(let i=0;i<=limit;i++){
  const eligible=maxActive&&countScatters(current)<3,result=evaluate(current,active,1,wildTotal(active),{maxEligible:eligible});
  const bomb=bombBlast(current,active),step={grid:current,wilds:active,result,...(bomb?{bomb}:{})};
  steps.push(step);sum+=result.cents;
  if(result.maxWin||!result.cents&&!bomb)return {steps,rawCents:result.maxWin?MAX_AWARD*100:sum,maxWin:result.maxWin};
  if(i===limit)return null;
  const next=collapse(current,clearCellsForStep(step,result),fill);current=next.grid;active=removePayingWilds(active,result.cells);
 }
 return null;
}
const cache=new Map();
const maxAllowed=mode=>(MAX_CHANCE[mode]||0)>0;
const tricksterEntries=new Map();
function tricksterEntry(id){
 if(!tricksterEntries.has(id)){const r=resolveOutcome(decode(id,'trickster'),1);tricksterEntries.set(id,{value:r.value,maxWin:r.maxWin});}
 return tricksterEntries.get(id);
}
function entryValue(entry,mode,id){const base=mode==='trickster'?tricksterEntry(id).value:entry.t/100*MODE_RULES[mode].boost;return featureExpected(entry.s,base);}
function model(mode){
 if(cache.has(mode))return cache.get(mode);const rule=MODE_RULES[mode];if(!rule)throw new Error('Unknown spin mode: '+mode);
 const cost=rule.cost,cap=rule.pathCeiling??(mode==='normal'||mode==='boost'?5000:MAX_AWARD-.01);
 const groups=Object.fromEntries(['zero','partial','even','profit','medium','big','tail','feature3','feature4','feature5','max'].map(k=>[k,[]]));
 for(let id=0;id<CASCADE_DATA.length;id++){
  const e=CASCADE_DATA[id];if(e.a&&mode!=='normal'&&mode!=='boost')continue;if((mode==='outlaws')!==(e.f===2))continue;
  if((mode==='normal'||mode==='boost')&&e.m)continue;
  if(['normal','boost','trickster','allin'].includes(mode)&&e.w[0].some(([,mult])=>!BASE_WILD.spawn.some(spawn=>wildMultiplier(spawn)===mult)))continue;
  if(e.x){if(maxAllowed(mode)&&(mode==='trickster'?tricksterEntry(id).maxWin:e.p/100*rule.boost<MAX_AWARD))groups.max.push(id);continue;}
  const value=mode==='trickster'?tricksterEntry(id).value:e.t/100*rule.boost;if(value>cap)continue;
  if(e.s>=3){if(value<=cost*3&&rule.feature.some(p=>p>0))groups['feature'+Math.min(5,e.s)].push(id);continue;}
  if(['free','deaderfree','maxfree','outlaws'].includes(mode)&&e.s)continue;
  const ratio=value/cost;
  const group=!value?'zero':ratio<.90?'partial':ratio<=(rule.evenCeiling??1.10)?'even':ratio<=3?'profit':ratio<=10?'medium':ratio<=(rule.tailRatio??80)?'big':'tail';
  groups[group].push(id);
 }
 const rows=[];
 const add=(name,prob)=>{const ids=groups[name];if(prob&&!ids.length)throw new Error(mode+' missing '+name+' tumble paths');if(!ids.length)return null;
  // Favor genuine multi-step paths within each amount band; no fabricated
  // extra wins and no dependency on earlier purchased rounds.
  let weights=ids.map(id=>CASCADE_DATA[id].g.length>2?2:1);
  // Fixed presentation-independent incidence inside each supported amount
  // band. Calibrate the complete bomb trajectories, including refill awards,
  // within the same published per-mode RTP budgets.
  const bombMass=ids.reduce((n,id,i)=>n+(CASCADE_DATA[id].b?weights[i]:0),0),ordinaryMass=weights.reduce((a,b)=>a+b,0)-bombMass;
  if(bombMass&&ordinaryMass)weights=weights.map((w,i)=>w*(CASCADE_DATA[ids[i]].b?.08/bombMass:.92/ordinaryMass));
  const focus=rule.pathFocus?.[name];
  if(focus)weights=weights.map((w,i)=>w*Math.exp(-.5*((entryValue(CASCADE_DATA[ids[i]],mode,ids[i])/cost-focus.center)/focus.spread)**2));
  const profile=SCATTER_PROFILE[mode];
  if(profile&&!name.startsWith('feature')){
   const totals=[0,0,0];ids.forEach((id,i)=>totals[CASCADE_DATA[id].s]+=weights[i]);
   weights=weights.map((w,i)=>w*profile[CASCADE_DATA[ids[i]].s]/totals[CASCADE_DATA[ids[i]].s]);
  }
  const mass=weights.reduce((a,b)=>a+b,0),cdf=[];let n=0,ev=0;
  ids.forEach((id,i)=>{n+=weights[i]/mass;cdf.push(n);ev+=weights[i]/mass*entryValue(CASCADE_DATA[id],mode,id);});
  const row={name,ids,cdf,prob,mean:ev};rows.push(row);return row;
 };
 ['partial','even','profit','medium','big'].forEach((name,i)=>add(name,rule.profile[i]));
 [3,4,5].forEach((n,i)=>add('feature'+n,rule.feature[i]));
 const q=MAX_CHANCE[mode]||0,wanted=(cost*targetRTP(mode)-q*MAX_AWARD)/(1-q),tail=add('tail',rule.tailProbability??0);
 if(!tail)throw new Error(mode+' needs a tail pool');
 if(rule.balanceBand){
  const balance=rows.find(r=>r.name===rule.balanceBand);if(!balance?.mean)throw new Error(mode+' missing calibration band');
  const spent=rows.filter(r=>r!==balance).reduce((n,r)=>n+r.mean*r.prob,0);
  balance.prob=(wanted-spent)/balance.mean;
 }else{
 let feature=rows.filter(r=>r.name.startsWith('feature')).reduce((n,r)=>n+r.mean*r.prob,0),ordinary=rows.filter(r=>!r.name.startsWith('feature')).reduce((n,r)=>n+r.mean*r.prob,0);
 if(feature+ordinary>=wanted){const scale=(wanted-feature)*.94/ordinary;if(!(scale>0))throw new Error('Feature budget exceeds return');for(const r of rows)if(!r.name.startsWith('feature'))r.prob*=scale;}
 const spent=rows.reduce((n,r)=>n+r.mean*r.prob,0);tail.prob=(wanted-spent)/tail.mean;
 }
 const zero=add('zero',0);if(!zero)throw new Error(mode+' needs terminal misses');zero.prob=1-rows.reduce((n,r)=>n+r.prob,0);
 if(rows.some(r=>r.prob<0||!Number.isFinite(r.prob)))throw new Error('Invalid calibrated distribution');
 const ev=rows.reduce((n,r)=>n+r.mean*r.prob,0);let cumulative=0;for(const r of rows){cumulative+=r.prob;r.until=cumulative;}rows[rows.length-1].until=1;
 if(q&&!groups.max.length)throw new Error(mode+' missing connected MAX paths');
 const result={mode,cost,boost:rule.boost,q,rows,max:groups.max,rtp:((1-q)*ev+q*MAX_AWARD)/cost};cache.set(mode,result);return result;
}
function chooseIndex(cdf,u){let lo=0,hi=cdf.length-1;while(lo<hi){const mid=(lo+hi)>>1;if(u<cdf[mid])hi=mid;else lo=mid+1;}return lo;}
function decode(id,mode){
 const e=CASCADE_DATA[id],boost=MODE_RULES[mode].boost,active=maxAllowed(mode);
 const steps=e.g.map((flat,i)=>{
  const grid=Array.from({length:6},(_,c)=>flat.slice(c*4,c*4+4).map(n=>TUMBLE_SYMBOLS[n])),wilds=Object.fromEntries((e.w[i]||[]).map(([c,m])=>[c,{mult:m,spawn:m/8,kind:'man'}]));
  const bomb=bombBlast(grid,wilds);return {grid,wilds,...(bomb?{bomb}:{})};
 });
 const first=steps[0],keys=Object.keys(first.wilds),wild=keys.length===1?{reel:+keys[0],...first.wilds[keys[0]]}:null;
 return {pathId:id,mode,grid:first.grid,wild,wilds:first.wilds,steps,winBoost:boost,maxEligible:active,trigger:terminalTrigger(steps.at(-1).grid,mode)};
}
export function rollOutcome(mode='normal',rng=cryptoRandom){
 const m=model(mode);let id;
 if(m.q&&rng()<m.q)id=m.max[Math.min(m.max.length-1,Math.floor(rng()*m.max.length))];
 else{const u=rng(),row=m.rows.find(r=>u<r.until)||m.rows.at(-1);id=row.ids[chooseIndex(row.cdf,rng())];}
 const out=withOutlawsMark(decode(id,mode),rng);
 return out.outlawsMark?out:withShotWilds(out,rng);
}
export function withShotWilds(out,rng=cryptoRandom,{count}={}){
 if(out.shotWilds||out.outlawsMark)return out;
 const first=out.steps[0],pool=[];
 for(let c=0;c<REELS;c++)for(let r=0;r<ROWS;r++)if(!first.wilds[c]&&first.grid[c][r]===SUBSTITUTE)pool.push([c,r]);
 if(pool.length<2||count===undefined&&rng()>=SHOT_WILD_RATE)return out;
 const max=Math.min(4,pool.length),n=count??(2+Math.min(max-2,Math.floor(rng()*(max-1))));
 if(!Number.isInteger(n)||n<2||n>max)throw new RangeError('Expected 2–4 available single wilds');
 for(let i=pool.length-1;i>0;i--){const j=Math.min(i,Math.floor(rng()*(i+1)));[pool[i],pool[j]]=[pool[j],pool[i]];}
 const targets=pool.slice(0,n),preGrid=first.grid.map(col=>[...col]);
 let grid=first.grid.map(col=>[...col]);
 for(const [c,r] of targets){grid[c][r]=BOX_WILD;preGrid[c][r]=PAYING[Math.min(PAYING.length-1,Math.floor(rng()*PAYING.length))];}
 const steps=[];
 for(let i=0;i<out.steps.length;i++){
  const step=out.steps[i];
  if(i){const prev=steps[i-1],pay=evaluate(prev.grid,prev.wilds,1,wildTotal(prev.wilds),{maxEligible:out.maxEligible&&countScatters(prev.grid)<3,requireNatural:prev.requireNatural});
   // Carry surviving boxed wilds through the same gravity mapping. Refill
   // symbols, full-reel multipliers and terminal scatter/MAX rules stay intact.
   grid=collapse(prev.grid,clearCellsForStep(prev,pay).filter(([c])=>!prev.wilds[c]?.locked),(c,r)=>step.grid[c][r]).grid;
  }
  const bomb=bombBlast(grid,step.wilds);steps.push({...step,grid,...(bomb?{bomb}:{})});
 }
 return {...out,grid:steps[0].grid,steps,shotWilds:{targets,preGrid}};
}
// Mark is a pre-resolved symbol-to-wild route through complete All In paths.
// The pre-conversion board contains every visible instance of the marked
// symbol at these positions. Its converted board uses the calibrated path.
export function outlawsMarkOptions(out){
 if(out.mode!=='allin'||out.shotWilds||out.outlawsMark)return null;
 const first=out.steps[0],targets=[],visible=new Set();
 for(let c=0;c<REELS;c++)for(let r=0;r<ROWS;r++)if(!first.wilds[c]){
  const symbol=first.grid[c][r];if(symbol===SUBSTITUTE)targets.push([c,r]);else visible.add(symbol);
 }
 const symbols=PAYING.filter(symbol=>!visible.has(symbol));
 return targets.length>=3&&symbols.length?{targets,symbols}:null;
}
export function withOutlawsMark(out,rng=cryptoRandom,{force=false,symbol}={}){
 const options=outlawsMarkOptions(out);if(!options||!force&&rng()>=OUTLAWS_MARK_RATE)return out;
 const source=symbol??options.symbols[Math.min(options.symbols.length-1,Math.floor(rng()*options.symbols.length))];
 if(!options.symbols.includes(source))throw new RangeError('Marked symbol must cover every visible matching position');
 const targets=options.targets,preGrid=out.steps[0].grid.map(c=>[...c]);let grid=preGrid.map(c=>[...c]);
 for(const [c,r] of targets){preGrid[c][r]=source;grid[c][r]=BOX_WILD;}
 const steps=[];
 for(let i=0;i<out.steps.length;i++){
  const step=out.steps[i];
  if(i){const prev=steps[i-1],pay=evaluate(prev.grid,prev.wilds,1,wildTotal(prev.wilds),{maxEligible:out.maxEligible&&countScatters(prev.grid)<3,requireNatural:prev.requireNatural});
   grid=collapse(prev.grid,clearCellsForStep(prev,pay).filter(([c])=>!prev.wilds[c]?.locked),(c,r)=>step.grid[c][r]).grid;
  }
  const bomb=bombBlast(grid,step.wilds);steps.push({...step,grid,...(bomb?{bomb}:{})});
 }
 return {...out,grid:steps[0].grid,steps,outlawsMark:{symbol:source,targets,preGrid}};
}
// Allocate a rounded/capped step award across its visible groups so the
// displayed group amounts always sum to the amount credited by the ledger.
function roundedResult(result,cents){
 let prior=0,weight=0;const exact=result.groups.reduce((sum,g)=>sum+g.exactTenths,0);
 const groups=result.groups.map(g=>{weight+=g.exactTenths;const next=exact?Math.round(cents*weight/exact):0,value=(next-prior)/100;prior=next;return {...g,value};});
 return {...result,cents,value:cents/100,groups};
}
export function evaluateStep(step,bet,boost=1,maxActive=false,remainingCents=Math.round(bet*100)*MAX_AWARD,positionMultipliers){
 const result=evaluate(step.grid,step.wilds,bet,wildTotal(step.wilds),{winBoost:boost,maxEligible:maxActive&&countScatters(step.grid)<3,positionMultipliers,requireNatural:step.requireNatural});
 if(result.exactTenths<=remainingCents*10)return result;
 const limit=Math.max(0,remainingCents);
 return {...roundedResult(result,limit),exactTenths:limit*10,capped:true};
}
export function resolveOutcome(out,bet=1,remainingCents=Math.round(bet*100)*MAX_AWARD){
 let left=remainingCents,total=0,exactTotal=0,positions=out.mode==='trickster'?freshPositionMultipliers():null;const steps=[];
 for(const step of out.steps){
  // A kill pays at the stage in which it was earned. The NEXT tumble gets
  // the doubled boost; never retroactively multiply an already-paid win.
  const boost=out.blood?step.winBoost:out.winBoost;
  const raw=evaluateStep(step,bet,boost,out.maxEligible,left,positions);
  exactTotal+=raw.exactTenths;
  const nextTotal=Math.min(remainingCents,Math.round(exactTotal/10));
  const result=roundedResult(raw,nextTotal-total);
  // A sub-cent combination still pays mathematically and must keep its
  // tumble and position growth, even before enough accumulates to credit 1¢.
  const next=positions&&raw.exactTenths>0&&!result.maxWin?growPositionMultipliers(positions,result.cells):positions;
  const clearCells=clearCellsForStep(step,result).filter(([c])=>!step.wilds[c]?.locked);
  steps.push({...step,result,clearCells,...(positions?{positionMultipliers:positions,nextPositionMultipliers:next}:{})});
  positions=next;total=nextTotal;left=remainingCents-total;if(result.maxWin||left<=0)break;
 }
 return {steps,cents:total,value:total/100,maxWin:steps.some(s=>s.result.maxWin),trigger:out.trigger};
}
export function outcomeFromGrid(grid,wilds={},mode='normal',rng=cryptoRandom,boost=1,maxActive=maxAllowed(mode)){
 const allowMax=mode!=='normal'&&mode!=='boost',clean=grid.map(col=>col.map(s=>!allowMax&&s===MAX_TOKEN?'ten':s));
 const traced=traceTumbles(clean,wilds,()=>drawSymbol('free',rng),{maxActive});if(!traced)throw new Error('Development trajectory exceeded tumble limit');
 return {mode,grid:clean,wilds,steps:traced.steps,winBoost:boost,maxEligible:allowMax&&maxActive,trigger:terminalTrigger(traced.steps.at(-1).grid,mode)};
}
export function breakdown(mode='normal'){
 if(mode==='deadbuy')return {mode,cost:BUY_COST.dead,rtp:model('free').rtp};
 if(mode==='deaderbuy')return {mode,cost:BUY_COST.deader,rtp:targetRTP('deaderbuy'),model:'hang-complete-feature'};
 const m=model(mode),hit=1-(m.rows.find(r=>r.name==='zero')?.prob||0)*(1-m.q);
 return {mode,cost:m.cost,rtp:m.rtp,hitChance:hit,winBoost:m.boost,bands:m.rows.map(r=>({name:r.name,probability:r.prob*(1-m.q),mean:r.mean})),maxChance:m.q};
}
export function theoreticalRTP(mode='normal'){return breakdown(mode).rtp;}
export function modelEntries(mode){const m=model(mode);return {maxProbability:m.q,maxIds:[...m.max],rows:m.rows.map(r=>({...r,ids:[...r.ids],cdf:[...r.cdf]}))};}
export function outcomeById(id,mode='normal'){return decode(id,mode);}
