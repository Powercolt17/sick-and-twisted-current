import assert from 'node:assert/strict';import {createActionFeedback} from '../dist/action-feedback.js';
const G={x:200,y:100,cw:120,ch:100,h:400};let fills=[],strokes=[];
const ctx={save(){},restore(){},createRadialGradient(){return {addColorStop(){}};},fillRect(...a){fills.push({style:this.fillStyle,args:a});},strokeRect(...a){strokes.push(a);}};
const fx=createActionFeedback({G});fx.shot([1,2],0);fx.shot([2,2],50);assert.equal(fx.count,1);fx.draw(ctx,0);assert.ok(fills.some(x=>x.style==='rgba(255,184,75,0.055)'));fx.setPaused(true,30);fx.draw(ctx,1000);assert.equal(fx.count,1);fx.setPaused(false,1030);fx.draw(ctx,1200);assert.equal(fx.count,0);
for(let i=0;i<100;i++)fx.land(i%6,1300);assert.equal(fx.count,16);fx.draw(ctx,2000);assert.equal(fx.count,0);
fx.upgrade(2,2100);fx.retrigger([[1,1],[2,2],[3,3]],2100);fx.draw(ctx,2200);assert.ok(strokes.length>=4);fx.clear();assert.equal(fx.count,0);
fills=[];strokes=[];const calm=createActionFeedback({G,reduced:true});calm.shot([0,0],0);calm.land(1,0);calm.upgrade(2,0);calm.retrigger([[3,1]],0);calm.draw(ctx,10);assert.equal(fills.length,0,'reduced motion has no screen tint, glow or particles');assert.equal(strokes.length,3);console.log('PASS: bounded accents, shot coalescing, expiry, pause/resume, cleanup and reduced-motion highlights.');

fills=[];const flashFX=createActionFeedback({G});flashFX.shot([0,0],0);
flashFX.draw(ctx,0,{width:1212,top:230,height:1028});
const bright=fills.filter(x=>String(x.style).startsWith('rgba(255,244,220,'));
assert.equal(bright.length,1,'one screen flash per shot');assert.equal(bright[0].style,'rgba(255,244,220,0.34)');assert.deepEqual(bright[0].args,[0,-230,1212,1258]);
fills=[];flashFX.draw(ctx,60);const fading=fills.find(x=>String(x.style).startsWith('rgba(255,244,220,'));assert.ok(fading);assert.ok(Number(fading.style.split(',').at(-1).slice(0,-1))<.1);
fills=[];flashFX.draw(ctx,110);assert.ok(!fills.some(x=>String(x.style).startsWith('rgba(255,244,220,')),'bright flash fully clears before the afterglow ends');
console.log('PASS full-scene firing flash, rapid fade, single pulse and portrait coverage');
