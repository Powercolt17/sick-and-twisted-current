import assert from 'node:assert/strict';
import {bloodReceiptFrame} from '../dist/blood-receipt.js';
import {createBountyTimeline,BOUNTY_TIME} from '../dist/bounty-timeline.js';
const timeline=createBountyTimeline();
timeline.start(100);assert.equal(timeline.beginClose(100,1040),true);
const frame=now=>bloodReceiptFrame(timeline.snapshot(now).closing);
assert.equal(frame(100).amount,'$0.00');
assert.equal(frame(100+BOUNTY_TIME.closeStamp-1).sealed,false);
assert.equal(frame(100+BOUNTY_TIME.closeStamp).sealed,true);
const halfway=100+BOUNTY_TIME.closeTotal+475;
assert.equal(frame(halfway).amount,'$9.10');
timeline.setPaused(true,halfway);
assert.deepEqual(frame(halfway+10000),frame(halfway),'hidden-tab pause freezes the reward');
assert.equal(timeline.continueClose(halfway+10000),false);
timeline.setPaused(false,halfway+10000);
assert.equal(frame(halfway+10000).amount,'$9.10');
const ready=100+BOUNTY_TIME.closeReady+10000;
assert.equal(frame(ready).amount,'$10.40');assert.equal(frame(ready).settled,true);
assert.equal(timeline.continueClose(ready),true);assert.equal(frame(ready).exiting,true);
assert.equal(timeline.continueClose(ready),false,'only one continue can be accepted');
assert.equal(timeline.closeComplete(ready+BOUNTY_TIME.exit),true);
for(const [totalCents,expected] of [[0,'$0.00'],[1,'$0.01'],[3880,'$38.80'],[100000000,'$1,000,000.00']]){
 const s={totalCents,age:BOUNTY_TIME.closeReady,exitAge:null};
 assert.equal(bloodReceiptFrame(s).amount,expected);
 assert.equal(bloodReceiptFrame({...s,age:0},true).amount,expected,'reduced motion reveals exact cents immediately');
}
console.log('Blood Money receipt: count-up, final cents, reduced motion, pause, and exit gate pass.');

const revealTimeline=createBountyTimeline();
revealTimeline.start(0);revealTimeline.beginClose(0,3880);
const glowAt=BOUNTY_TIME.closeTotal+950+240;
const before=bloodReceiptFrame(revealTimeline.snapshot(glowAt).closing);
assert.ok(before.reveal>0&&before.reveal<1);
assert.equal(before.seal,1);
revealTimeline.setPaused(true,glowAt);
assert.deepEqual(bloodReceiptFrame(revealTimeline.snapshot(glowAt+9000).closing),before,'seal and reward light share the pause clock');
revealTimeline.setPaused(false,glowAt+9000);
assert.deepEqual(bloodReceiptFrame(revealTimeline.snapshot(glowAt+9000).closing),before);
assert.equal(bloodReceiptFrame(revealTimeline.snapshot(glowAt+10000).closing).reveal,1);
const reducedFrame=bloodReceiptFrame({age:0,totalCents:3880,exitAge:null},true);
assert.equal(reducedFrame.seal,1);assert.equal(reducedFrame.reveal,1);
console.log('Contract seal and reward reveal: pause and reduced-motion checks pass.');

assert.equal(bloodReceiptFrame({age:BOUNTY_TIME.closeStamp,totalCents:1,exitAge:null}).seal,1,'seal contacts on the existing stamp sound cue');
assert.equal(bloodReceiptFrame({age:BOUNTY_TIME.closeStamp,totalCents:1,exitAge:null}).sealKick,0);
assert.equal(bloodReceiptFrame({age:BOUNTY_TIME.closeStamp-140,totalCents:1,exitAge:null}).seal,0);
