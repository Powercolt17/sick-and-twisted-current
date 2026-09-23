import assert from 'node:assert/strict';
import {bloodTargetFrame as frame,BLOOD_TARGET_TIME as T} from '../dist/blood-target-motion.js';
import {bloodPromotionFrame,BLOOD_REWARD_DURATION} from '../dist/blood-promotion.js';
import {createBountyTimeline} from '../dist/bounty-timeline.js';
assert.equal(frame(T.impact-1).angle,0);assert.equal(frame(T.fire-1).fire,false);assert.equal(frame(T.fire).fire,true);
assert.ok(frame(T.impact+100).angle>150,'hard fast spin immediately after impact');
let last=0,firstReveal=null;for(let age=T.impact;age<=T.impact+T.fast+T.slow;age++){const f=frame(age);assert.ok(f.angle>=last-1e-8);last=f.angle;if(f.reveal&&firstReveal===null)firstReveal=f.angle;}
assert.ok(firstReveal>=810&&firstReveal<812,'replace front painting while hidden in final revolution');assert.equal(last,1080);assert.equal(frame(T.end).angle,1080);assert.equal(frame(T.end).done,true);
assert.ok(T.reward>T.impact+T.fast+T.slow+T.catch,'extra spins follow target settlement');
for(const age of [0,560,655,1200,2400,3500,5150]){const f=frame(age,true);assert.equal(f.angle,0);assert.equal(f.impact,0);assert.equal(f.recoil,0);assert.equal(f.blur,0);assert.equal(f.latch,0);}
assert.equal(frame(T.impact,true).reveal,true);
const timeline=createBountyTimeline();timeline.start(100);timeline.setPaused(true,1000);const before=frame(timeline.snapshot(1000).entered);assert.deepEqual(frame(timeline.snapshot(10000).entered),before);
assert.equal(bloodPromotionFrame(BLOOD_REWARD_DURATION).done,true);assert.equal(bloodPromotionFrame(1000).opacity,0);assert.equal(bloodPromotionFrame(3500,true).scale,1);assert.equal(bloodPromotionFrame(3500,true).dust,0);
console.log('PASS fast three-turn vertical spin, hidden final face, slow reveal, late reward, pause and reduced motion.');
