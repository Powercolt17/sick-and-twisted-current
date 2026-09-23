import assert from 'node:assert/strict';
import {createReelMotion,REEL_MOTION,NORMAL_SPIN_MOTION} from '../dist/reel-motion.js';
const old=Array.from({length:6},()=>['a','k','q','j']),target=old.map(c=>[...c]);target[0][0]=target[0][2]=target[1][1]='scatter';
const make=(timing,scale)=>createReelMotion({old,target,start:0,contacts:[500,565,630,695,760,825].map(t=>t*scale),scale,timing,filler:['a','k']});
const original=make(REEL_MOTION,1),normal=make(NORMAL_SPIN_MOTION,1.12),turbo=make(REEL_MOTION,.55);
assert.ok(normal.plans[0].contact>original.plans[0].contact);assert.ok(normal.plans[0].contact-normal.plans[0].start>original.plans[0].contact-original.plans[0].start,'same-column scatter arrival has extra travel time');
assert.ok(normal.plans[1].contact-normal.plans[0].contact>=960,'multi-scatter columns reserve wider gap');assert.ok(normal.end>original.end);assert.ok(turbo.end<normal.end);
for(const m of [normal,turbo]){m.advance(30000);assert.equal(m.landedScatters,3);for(const p of m.plans)for(let r=0;r<4;r++)assert.equal(m.symbol(p,r-p.stop),target[p.reel][r]);}
console.log('PASS: slightly slower normal pace, extra same-column travel, scatter spacing and exact outcomes.');
