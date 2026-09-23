import assert from 'node:assert/strict';import fs from 'node:fs';import * as M from '../dist/math.js';import {collapse} from '../dist/cascade-kernel.js';import {createWildShots,wildShotTimeline} from '../dist/wild-shots.js';
const model=M.modelEntries('allin');let eligible=0,probability=0,count=0,misses=0,winning=0;const sizes=new Set(),symbols=new Set(),samples={};
for(const row of model.rows){let prev=0;for(let i=0;i<row.ids.length;i++){const id=row.ids[i],weight=(row.cdf[i]-prev)*row.prob*(1-model.maxProbability);prev=row.cdf[i];const out=M.outcomeById(id,'allin'),options=M.outlawsMarkOptions(out);if(!options)continue;
eligible++;probability+=weight*M.OUTLAWS_MARK_RATE;const original=M.resolveOutcome(out);
for(const symbol of options.symbols){const marked=M.withOutlawsMark(out,()=>0,{force:true,symbol}),m=marked.outlawsMark,actual=M.resolveOutcome(marked);count++;symbols.add(symbol);sizes.add(m.targets.length);
assert.equal(actual.cents,original.cents);assert.equal(actual.maxWin,original.maxWin);assert.deepEqual(actual.trigger,original.trigger);assert.equal(marked.bounty,undefined);
const matches=[];m.preGrid.forEach((col,c)=>col.forEach((s,r)=>{if(!marked.wilds[c]&&s===symbol)matches.push([c,r]);}));assert.deepEqual(matches,m.targets,'every visible match, and only matching regular symbols, converts');
for(const [c,r] of m.targets){assert.equal(marked.grid[c][r],M.BOX_WILD);assert.equal(out.grid[c][r],M.SUBSTITUTE);}
assert.equal(M.withShotWilds(marked,()=>0),marked,'do not shoot marked group a second time');
for(let j=1;j<actual.steps.length;j++){const previous=actual.steps[j-1],next=actual.steps[j];assert.deepEqual(collapse(previous.grid,previous.clearCells,(c,r)=>next.grid[c][r]).grid,next.grid,'converted wilds preserve gravity');}
for(const bet of [.01,.1,1,10])assert.equal(M.resolveOutcome(marked,bet).cents,M.resolveOutcome(out,bet).cents,'currency payout unchanged');
assert.equal(M.resolveOutcome(marked,1,17).cents,M.resolveOutcome(out,1,17).cents,'shared cap unchanged');
}
if(original.cents){winning++;samples.win??=id;if(options.targets.length>=6)samples.many??=id;}else{misses++;samples.miss??=id;}if(out.steps.length>1)samples.tumble??=id;if(Object.keys(out.wilds).length)samples.fullColumn??=id;
assert.equal(M.withOutlawsMark(out,()=>.99),out);
for(const mode of ['normal','boost','trickster','free','maxfree','outlaws'])assert.equal(M.outlawsMarkOptions(M.outcomeById(id,mode)),null);
}}
for(const id of model.maxIds){const out=M.outcomeById(id,'allin'),options=M.outlawsMarkOptions(out);if(!options)continue;probability+=model.maxProbability/model.maxIds.length*M.OUTLAWS_MARK_RATE;for(const symbol of options.symbols){const marked=M.withOutlawsMark(out,()=>0,{force:true,symbol}),r=M.resolveOutcome(marked);assert.equal(r.value,M.MAX_AWARD,'Mark preserves connected MAX cap');assert.equal(r.maxWin,true);}}
assert.ok(winning&&misses&&samples.many!==undefined);assert.ok(probability>0&&probability<.3);
for(const reduced of [false,true]){const cues=[],converted=[],figure={startCells(t){assert.equal(t.shots.length,1);},end(){}};let now=0;
const shots=createWildShots({G:{x:0,y:0,cw:110,ch:99,w:660,h:396},figureEffect:figure,reduced,onCue:c=>cues.push(c),onConvert:cell=>converted.push({cell,time:now})});
const targets=[[0,0],[1,1],[2,2],[3,3],[4,0],[5,1]];shots.begin(targets,0,1,{mark:'bottle'});
for(now=0;now<=600;now+=16)shots.advance(now);
shots.setPaused(true,600);shots.advance(10000);assert.equal(converted.length,0);shots.setPaused(false,10600);
for(now=10616;now<12800;now+=16)shots.advance(now);
assert.equal(cues.filter(c=>c.type==='shot').length,1);assert.equal(cues.filter(c=>c.type==='impact').length,1);assert.equal(converted.length,targets.length);assert.equal(new Set(converted.map(c=>c.time)).size,1,'all matches convert on the same frame');assert.ok(shots.finished(now));shots.advance(now+16);assert.equal(converted.length,targets.length);shots.clear();assert.equal(shots.active,false);
}
assert.equal(wildShotTimeline([[0,0],[1,0]]).shots.length,2,'ordinary two-shot flow intact');
assert.throws(()=>wildShotTimeline([[0,0]],{mark:true}));
assert.throws(()=>wildShotTimeline([[0,0],[0,0],[1,1]],{mark:true}));
fs.mkdirSync('.sites-runtime',{recursive:true});const report={rtp:M.theoreticalRTP('allin'),eligiblePaths:eligible,validatedSymbolVariants:count,probability,winningPaths:winning,nonpayingPaths:misses,symbols:[...symbols],targetCounts:[...sizes].sort((a,b)=>a-b),samples};fs.writeFileSync('.sites-runtime/outlaws-mark-audit.json',JSON.stringify(report,null,2));console.log('PASS mark conversion, exact original pay, caps, all matching positions, gravity, mode isolation, one shot, simultaneous conversion and pause/resume.',report);

