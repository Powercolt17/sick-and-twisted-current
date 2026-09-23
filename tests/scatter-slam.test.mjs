import assert from 'node:assert/strict';
import {createScatterSlam} from '../dist/scatter-slam.js';
const G={x:0,y:0,w:660,h:396,cw:110,ch:99},impacts=[];
const fx=createScatterSlam({G,onImpact:(...p)=>impacts.push(p)});
fx.land(2,[0,3],100);assert.equal(impacts.length,1);assert.equal(fx.sample(1,0,100),null);assert.ok(fx.sample(2,0,100).scaleY<1);assert.ok(fx.sample(2,0,180).scaleY>1);assert.equal(fx.sample(2,0,340),null);
fx.land(3,[1],500);fx.setPaused(true,530);const pose=fx.sample(3,1,530);assert.deepEqual(fx.sample(3,1,2000),pose);fx.setPaused(false,2030);assert.deepEqual(fx.sample(3,1,2030),pose);fx.clear();assert.equal(fx.sample(3,1,2040),null);
const reduced=createScatterSlam({G,reduced:true,onImpact:()=>assert.fail('reduced motion must not kick')});reduced.land(1,[2],0);assert.equal(reduced.sample(1,2,1),null);
console.log('PASS: contact compression, rebound, expiry, addressed cells, pause, cleanup and reduced motion.');
