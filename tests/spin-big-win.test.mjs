import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {spinBigWin} from '../dist/spin-big-win.js';
import {createPayoutPresentation} from '../dist/payout.js';

// Exercise the actual async spin orchestrator, replacing only drawing/sound
// and the authoritative resolver with deterministic awarded-cent fixtures.
const source=fs.readFileSync(new URL('../dist/game.js',import.meta.url),'utf8');
const run=source.slice(source.indexOf('async function runTumbles('),source.indexOf('async function presentBounty('));
async function play(awards,{feature=false,stake=1,mode='normal',max=false,preview=false}={}){
 const calls=[],credits=[],noop=()=>{},grid=Array.from({length:6},()=>Array(4).fill('a'));
 const resolved={cents:awards.reduce((a,b)=>a+b,0),steps:awards.map(cents=>({grid,wilds:{},clearCells:[],result:{cents,value:cents/100,groups:[],cells:[],ways:0,maxWin:max}})),maxWin:max};
 const context=vm.createContext({spinBigWin,M:{resolveOutcome:()=>resolved},bet:1,roundLedger:{stakeCents:stake*100,remainingCents:1e8},
  sequenceToken:1,tricksterGrid:{reset:noop,cancel:noop,set:noop},roundSerial:1,awardSerial:0,roundMeta:{},
  wilds:{},totalMultiplier:noop,spinReels:async()=>{},revealFullReelWild:async()=>{},wildShotRun:async()=>true,
  defeatedOutlaws:new Map(),OUTLAW_HEAD:{},totalWin:0,cents:v=>Math.round(v*100)/100,bonus:feature,
  showWin:async(value,ways,cells,groups,options)=>{calls.push({value,options});if(!options.summaryOnly&&!options.preview)credits.push(value);},
  tumbleTo:async()=>true,bombFX:{clear:noop},performance,console});
 vm.runInContext(run,context);
 const result=await context.runTumbles({mode},1,{preview});
 return {calls,credits,result};
}
for(const mode of ['normal','boost','trickster','allin','free','deaderfree','outlaws']){
 const feature=['free','deaderfree','outlaws'].includes(mode),stake=feature?200:1;
 const {calls,credits,result}=await play([900,1100],{mode,feature,stake});
 assert.equal(calls.filter(c=>c.options.summaryOnly).length,1,mode+' must celebrate accumulated 20× spin once');
 assert.deepEqual(credits,[9,11],'summary must never credit twice');
 assert.equal(result.bigWinPresented,true);
 assert.equal(calls.at(-1).options.stake,1,'feature buy price must not suppress the spin');
}
assert.equal((await play([1999])).calls.filter(c=>c.options.summaryOnly).length,0);
assert.equal((await play([0])).calls.length,0);
assert.equal((await play([2000],{preview:true})).calls.filter(c=>c.options.summaryOnly).length,0);
assert.equal((await play([2000],{stake:75,mode:'trickster'})).calls.filter(c=>c.options.summaryOnly).length,0,'paid enhanced spins retain their real stake');
assert.equal((await play([150000],{stake:75,mode:'trickster'})).calls.filter(c=>c.options.summaryOnly).length,1);
assert.equal((await play([1e6],{max:true})).calls.length,1,'MAX must not run a second big-win presentation');
for(let i=0;i<2;i++)assert.equal((await play([2200],{feature:true})).calls.filter(c=>c.options.summaryOnly).length,1,'consecutive feature big wins each play');
for(let i=0;i<3;i++)assert.equal((await play([800],{feature:true})).calls.filter(c=>c.options.summaryOnly).length,0,'small spins never accumulate into a fake big spin');

let begins=0;
const payout=createPayoutPresentation({ctx:{},G:{},reduced:true,largeWin:{begin(){begins++;},clear(){},complete:true}});
const request=spinBigWin({cents:2000},{bet:1,stake:200,feature:true});
payout.begin(request.value,0,[],[],1,0,request.options);
assert.equal(begins,1,'approved animation receives qualifying feature spin');
payout.clear();
payout.begin(90,0,[],[],1,0,{bet:1,stake:1,summaryOnly:true,suppressBigWin:true});
assert.equal(begins,1,'final round receipt cannot replay a big-win animation');
assert.equal(payout.big,false);
console.log('PASS: all spin routes, cascade sum, feature stake, thresholds, consecutive spins, no double credit, MAX and receipt deduplication.');
