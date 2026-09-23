import assert from 'node:assert/strict';
import {hangMotion,HANG_REVEAL} from '../dist/hang-motion.js';
for(const type of ['lock','upgrade']){
 for(let t=-20;t<2200;t+=2){const s=hangMotion(t,type);assert.ok(Object.values(s).every(Number.isFinite));assert.ok(Math.abs(s.pull)<60);assert.ok(Math.abs(s.swing)<.05);assert.ok(s.numberScale>=1&&s.numberScale<1.2);}
 assert.deepEqual(hangMotion(300,type,true),{pull:0,swing:0,numberScale:1,impact:0});
 assert.deepEqual(hangMotion(2000,type),{pull:0,swing:0,numberScale:1,impact:0});
}
assert.ok(hangMotion(HANG_REVEAL/2).pull<-50,'a visible pull precedes the reveal');
assert.ok(Math.abs(hangMotion(HANG_REVEAL-.01).pull-hangMotion(HANG_REVEAL+.01).pull)<.02,'figure position must be continuous through catch');
assert.equal(hangMotion(HANG_REVEAL).impact,1);
assert.ok(hangMotion(HANG_REVEAL+60).numberScale>1.1,'new value punches on catch');
console.log('PASS rope pull, continuous catch, bounded recoil, number reveal, settled and reduced motion.');
