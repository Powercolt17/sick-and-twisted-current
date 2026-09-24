import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as M from '../dist/math.js';
import {hangDemoFeature,rollHangFeature} from '../dist/hang-math.js';
import {spinBigWin} from '../dist/spin-big-win.js';
const code=fs.readFileSync(new URL('../dist/game.js',import.meta.url),'utf8');
const fn=code.slice(code.indexOf('async function runTumbles('),code.indexOf('async function presentBounty('));
for(const feature of [hangDemoFeature(),rollHangFeature(()=>0),rollHangFeature(()=>.9)]){
 const events=[],credits=new Map(),receipts=[],noop=()=>{},state={finale:false};
 const presentation={state,sync(){},cue(e){events.push(e);if(e.type==='finale')state.finale=true;},duration:()=>0,elapsed:()=>5000,
  recordWin:(cents)=>receipts.push(cents),reward:r=>events.push({type:'stamps',...r}),clearTemporary:()=>events.push({type:'cleared'})};
 const c=vm.createContext({M,spinBigWin,bet:1,roundLedger:{stakeCents:49900,remainingCents:6000000},sequenceToken:1,
  tricksterGrid:{reset:noop,cancel:noop,set:noop},roundSerial:1,awardSerial:0,roundMeta:{},wilds:{},bonus:true,muted:true,reduced:true,
  hangPresentation:presentation,actionFeedback:{upgrade:noop,retrigger:noop},freeSpins:12,turbo:false,document:{hidden:false},$:()=>({textContent:'',animate:noop}),
  totalMultiplier:noop,spinReels:async()=>{},wildShotRun:async()=>true,defeatedOutlaws:new Map(),OUTLAW_HEAD:{},totalWin:0,
  cents:v=>Math.round(v*100)/100,wait:async()=>{},performance,bombFX:{begin:noop,setPaused:noop,readyToRefill:()=>true,release:noop,active:false,clear:noop},queueRender:noop});
 c.revealFullReelWild=async w=>{c.wilds[w.reel]={...w};};
 c.tumbleTo=async next=>{for(const [col,w]of Object.entries(next.wilds))c.wilds[col]??={...w,reel:+col};return true;};
 c.showWin=async(value,ways,cells,groups,opts)=>{if(!opts.summaryOnly){assert.ok(!credits.has(opts.creditId));credits.set(opts.creditId,Math.round(value*100));c.totalWin+=value;c.roundLedger.remainingCents-=Math.round(value*100);}};
 vm.runInContext(fn,c);
 for(const outcome of feature.spins){c.freeSpins--;const result=await c.runTumbles(outcome,1);assert.ok(result);assert.ok(Object.values(c.wilds).every(w=>!w.temporary),'temporary clears before next spin');}
 const paid=[...credits.values()].reduce((a,b)=>a+b,0);assert.equal(paid,feature.cents);assert.equal(receipts.reduce((a,b)=>a+b,0),paid,'receipt records awards once');assert.equal(c.freeSpins,0);
 assert.equal(events.filter(e=>e.type==='finale').length,feature.locks===3?1:0);
 assert.equal(events.filter(e=>e.type==='temporary').length,feature.temporarySpins);
 assert.equal(events.filter(e=>e.type==='cleared').length,feature.temporarySpins);
 assert.equal(events.filter(e=>e.type==='stamps').flatMap(e=>e.earned).filter(e=>e.upgrade).length,feature.stampUpgrades);
}
console.log('PASS actual feature orchestration: single credits, receipt total, stamp upgrades, one finale, temporary arrival/departure, retriggers and completion.');
