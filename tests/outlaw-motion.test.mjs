import assert from 'node:assert/strict';
import {motionAt,drawOutlaw,PERIOD,ENTRANCE_DURATION,stepMotionAt,WILD_LANDINGS,WILD_STEPS,WILD_ENTRY_END,HEIGHT} from '../dist/outlaw-motion.js';

function samePose(a,b){for(const k of Object.keys(a))assert.ok(Math.abs(a[k]-b[k])<1e-10,`pose mismatch: ${k}`);}
samePose(motionAt(ENTRANCE_DURATION,'entrance'),motionAt(0,'idle'));
samePose(motionAt(0,'idle'),motionAt(PERIOD*2,'idle'));
assert.equal(motionAt(0,'entrance').visibility,0);
assert.equal(motionAt(.69,'entrance').y,0);
for(let t=0;t<30;t+=.01){const state=motionAt(t,'entrance');assert.ok(Object.values(state).every(Number.isFinite));assert.ok(Math.abs(state.angle)<.05);}

const calls=[],ctx=new Proxy({canvas:{width:110,height:396}},{get(o,k){return k in o?o[k]:(...args)=>calls.push([k,...args]);}});
const art={background:{},figure:{},type:{}};
drawOutlaw(ctx,art,0,'entrance',{multiplier:16,reduced:true,rect:{x:267,y:157,w:110,h:396}});
assert.ok(!calls.some(c=>c[0]==='clearRect'),'must not clear the game canvas');
assert.ok(calls.some(c=>c[0]==='rect'&&c[1]===267&&c[2]===157&&c[3]===110&&c[4]===396),'must clip to reel');
assert.ok(calls.filter(c=>c[0]==='rotate').every(c=>c[1]===0),'reduced motion must not swing');
assert.equal(calls.filter(c=>c[0]==='drawImage').length,3,'static mode shows all three layers');
console.log('Outlaw: entrance/loop continuity, range, reduced motion, reel clipping and shared-canvas safety PASS');

assert.equal(stepMotionAt(0).offset,-HEIGHT,'whole poster must begin above the opening');
assert.equal(stepMotionAt(0).front,0,'no frame visible on the first frame');
for(let row=0;row<4;row++){
 const landing=stepMotionAt(WILD_LANDINGS[row]);
 assert.equal(landing.claimed,row+1);
 assert.ok(Math.abs(landing.offset-(-HEIGHT+(row+1)*HEIGHT/4))<1e-8,'contact must match exact cell boundary');
 assert.equal(stepMotionAt(WILD_LANDINGS[row]-.001).claimed,row,'multiplier must not advance before contact');
 assert.ok(Math.abs(stepMotionAt(WILD_LANDINGS[row]-.000001).offset-landing.offset)<.02,'arrival must be continuous');
 const hold=stepMotionAt(WILD_LANDINGS[row]+WILD_STEPS.hold-.001);
 assert.ok(Math.abs(hold.offset-landing.offset)<1,'each contact has a visible arrest');
}
assert.equal(stepMotionAt(WILD_ENTRY_END).entering,false);
assert.equal(stepMotionAt(WILD_ENTRY_END).offset,0,'settled sprite must occupy the complete reel');
assert.ok(WILD_STEPS.travel/WILD_STEPS.turboRate>=.08,'turbo must preserve visible travel');
console.log('Four contacts, offscreen start, continuous travel, multiplier timing and turbo travel PASS');
