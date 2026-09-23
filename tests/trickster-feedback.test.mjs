import assert from 'node:assert/strict';
import {createPayoutPresentation} from '../dist/payout.js';
const text=[],shots=[],large=[];
const ctx=new Proxy({measureText:s=>({width:s.length*9,actualBoundingBoxAscent:12,actualBoundingBoxDescent:3}),
 createLinearGradient:()=>({addColorStop(){}}),fillText:s=>text.push(s)}, {get:(obj,key)=>obj[key]??(()=>{})});
const G={x:0,y:0,w:720,h:400,cw:120,ch:100};
const crossfire={begin(cells,speed,options){shots.push(options);return {settle:.1,duration:.2};},clear(){},tick(){},complete:true};
const payout=createPayoutPresentation({ctx,G,reduced:false,crossfire,
 largeWin:{begin:cents=>large.push(cents),clear(){},complete:true},onSilence(){}});
const groups=[{symbol:'a',value:37.5,cells:[[0,0]]}];
function start(value,total=value,extra={}){
 text.length=shots.length=large.length=0;
 payout.clear();payout.begin(value,1,[[0,0]],groups,1,0,{bet:1,wager:75,stake:75,cascade:true,
  roundReturn:total,honestFeedback:true,grid:[['a']],...extra});
}
start(37.5);
assert.equal(payout.profitable,false);
assert.equal(shots.length,0,'no gunfire for a half-stake return');
assert.equal(payout.tier,0);
assert.deepEqual(payout.advance(430),[],'no celebratory cues below stake');
assert.equal(payout.reaction(0,0,430),null);
payout.drawSummary(400);
assert.ok(text.includes('RETURN · NET −$37.50 SO FAR'));
start(75);payout.drawSummary(400);
assert.equal(shots.length,0,'break-even stays quiet');
assert.ok(text.includes('RETURN · BREAK EVEN'));
start(37.5,50);assert.equal(shots.length,0,'use cumulative round return, not tumble alone');
start(25,100);
assert.equal(payout.profitable,true);
assert.equal(shots.length,1,'profitable round retains approved gunfire');
assert.equal(shots[0].ratio,25/75,'effect size uses actual purchased spin cost');
start(1500,1500,{cascade:false,summaryOnly:true});
assert.equal(payout.big,true);assert.deepEqual(large,[150000],'20× actual cost retains large celebration');
start(37.5,37.5,{honestFeedback:false});
assert.equal(shots.length,1,'other modes keep their presentation');
console.log('PASS: partial loss, break-even, cumulative return, profit, large win and other-mode feedback.');
