import assert from 'node:assert/strict';
import {gallowsPose,GALLOWS_TIMING} from '../dist/hang-gallows.js';
for(const type of ['lock','upgrade']){
 const {catch:at,end}=GALLOWS_TIMING[type];
 for(let t=0;t<end+300;t+=5){const p=gallowsPose(t,type);assert.ok(Object.values(p).every(x=>typeof x==='boolean'||Number.isFinite(x)));assert.ok(p.focus>=0&&p.focus<=1);assert.ok(Math.abs(p.sway)<.081);}
 assert.equal(gallowsPose(at-1,type).revealed,false);assert.equal(gallowsPose(at,type).revealed,true);
 assert.equal(gallowsPose(end,type).focus,0);assert.equal(gallowsPose(end,type).done,true);
 assert.equal(gallowsPose(10,type,true).focus,0);assert.equal(gallowsPose(250,type,true).done,true);
 const before=gallowsPose(at-.01,type),after=gallowsPose(at+.01,type);assert.ok(Math.abs(before.lift-after.lift)<.001);
}
assert.equal(gallowsPose(300,'lock').arrival,0);assert.equal(gallowsPose(900,'lock').rope,1);assert.equal(gallowsPose(900,'lock').lift,0);assert.equal(gallowsPose(1450,'lock').lift,1);
console.log('PASS capture arrival, rope-before-lift, continuous cinch, delayed value, return to dock, reduced motion.');
