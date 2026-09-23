import assert from 'node:assert/strict';
import {bloodGunTimeline,bloodGunPose} from '../dist/blood-gunslinger-motion.js';
import {planDuelShot,duelClipTime} from '../dist/blood-duel-motion.js';
import fs from 'node:fs';
const run=bloodGunTimeline(),meta=JSON.parse(fs.readFileSync(new URL('../dist/assets/blood-duel/duel.json',import.meta.url)));
assert.equal(bloodGunPose(0).frame,0);assert.equal(bloodGunPose(.5).frame,31);assert.equal(bloodGunPose(run.end).frame,0);
let last=-1;for(let t=0;t<=.5;t+=1/120){const f=bloodGunPose(t).frame;assert.ok(f>=last);last=f;}
assert.equal(bloodGunPose(.559).kick,0);assert.ok(bloodGunPose(.586).kick>.99);assert.equal(bloodGunPose(1.02).kick,0);
assert.deepEqual(bloodGunPose(.6),bloodGunPose(.6),'paused draw/recoil stays exactly still');
for(const outlaw of Object.values(meta.outlaws))for(const [name,c]of Object.entries(outlaw.clips))for(const reduced of [false,true]){
 const p=planDuelShot(c,run,name==='kill',reduced);assert.ok(Math.abs(duelClipTime(p.land,p,name==='kill',reduced)-c.impact)<1e-6);assert.ok(p.fire>=560);assert.ok(p.land>=p.fire);
}
console.log('PASS registered idle/draw/return, recoil clock and all nine enemy contact timings with the shared 560ms shot.');
const held=bloodGunTimeline({hold:true}),continued=bloodGunTimeline({raised:true});
for(let t=.5;t<12;t+=.017)assert.equal(bloodGunPose(t,held).frame,31,'kill retains the drawn pose until the target takes over');
for(let t=0;t<continued.lowerAt;t+=.017)assert.equal(bloodGunPose(t,continued).frame,31,'target continues raised, never redraws from the holster');
assert.equal(bloodGunPose(continued.end,continued).frame,0,'holster once after the target shot');
assert.equal(bloodGunPose(0,continued).phase,'retarget');
const {BLOOD_MOUTHS}=await import('../dist/blood-cigarette.js');
assert.equal(BLOOD_MOUTHS.length,32);assert.deepEqual(BLOOD_MOUTHS[0],[181.25,93.75]);
for(let i=1;i<BLOOD_MOUTHS.length;i++)assert.ok(Math.hypot(...BLOOD_MOUTHS[i].map((v,n)=>v-BLOOD_MOUTHS[i-1][n]))<10,'cigarette tracks consecutive mouth poses');
console.log('PASS kill-to-target raised continuity, single return, and cigarette registration.');
