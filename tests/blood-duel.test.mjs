import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createBloodDuel} from '../dist/blood-duel.js';
import {DUEL_TIMING,planDuelShot,duelClipTime} from '../dist/blood-duel-motion.js';
import {gunslingerTimeline} from '../dist/gunslinger-motion.js';
const meta=JSON.parse(await fs.readFile(new URL('../dist/assets/blood-duel/duel.json',import.meta.url)));
globalThis.fetch=async p=>({json:async()=>JSON.parse(await fs.readFile(new URL('../dist/'+p.split('?')[0],import.meta.url)))});
globalThis.Image=class{async decode(){}};
globalThis.createImageBitmap=async i=>i;
const shooter={assets:{json:{placement:{x:0,y:0,width:100,height:100},width:100,height:100,muzzles:[[50,50]]}},frameIndex:()=>0,startCells:()=>{}};
for(const reduced of [false,true])for(const turbo of [false,true]){
 const events=[],canvas={style:{filter:''}},d=createBloodDuel({shooter,canvas,reduced,turbo:()=>turbo,onCue:e=>events.push(e)});
 await d.load();assert.equal(d.ready,true);
 for(let level=0;level<3;level++){
  d.start(level);let now=0;d.update(now);
  for(let n=0;n<3;n++){
   events.length=0;assert.equal(d.hit(n,n===2),true);assert.equal(d.hit(n,n===2),false,'duplicate shot rejected');
   let lastMoving=null;
   for(let frame=0;frame<700&&!d.settled;frame++){
    now+=1000/60;d.update(now);
    if(n===2&&d.debug.clip)lastMoving=d.debug.clock;
    if(frame===10){d.setPaused(true);const before=d.debug;d.update(now+60000);assert.deepEqual(d.debug,before,'hidden time cannot advance');d.setPaused(false);d.update(now);}
   }
   assert.equal(d.settled,true,`settles without a draw call: ${level}/${n}`);
   if(n===2&&!reduced&&lastMoving!==null)assert.ok(d.debug.clock-lastMoving>=DUEL_TIMING.settleHold,'corpse is held before settlement');
   assert.equal(d.debug.state,n+1);const fire=events.filter(e=>e.type==='shot'),land=events.filter(e=>e.type==='impact');
   assert.equal(fire.length,1);assert.equal(land.length,1);if(!reduced)assert.equal(events.filter(e=>e.type==='fall').length,n===2?1:0,'one body landing per death');assert.ok(land[0].clock>=fire[0].clock);
   assert.ok(land[0].clock-land[0].scheduled<27,'contact stays within one displayed frame');
   assert.ok(land[0].clock-fire[0].clock<120,'no long freeze before contact');
  }
  d.next(level+1);for(let i=0;i<150;i++){now+=1000/60;d.update(now);}
  assert.equal(d.debug.level,level+1);if(level===2)assert.equal(d.debug.away,true);
 }
 d.stop();assert.equal(canvas.style.filter,'');assert.equal(d.active,false);
}
for(const o of Object.values(meta.outlaws))for(const [name,c] of Object.entries(o.clips)){
 const plan=planDuelShot(c,gunslingerTimeline([[0,0]]),name==='kill');
 assert.ok(Math.abs(duelClipTime(plan.land,plan,name==='kill')-c.impact)<1e-6,'first impact frame coincides with contact');
 if(name==='kill'){let prev=c.impact;for(let t=1;t<800;t++){const cur=duelClipTime(plan.land+t,plan,true);assert.ok(cur>prev,'death reaction never freezes');prev=cur;}}
 assert.equal(c.ts.length,c.count);assert.equal(c.m.length,c.count);assert.ok(c.ts.every((t,i)=>i===0||t>c.ts[i-1]));
}
assert.ok(DUEL_TIMING.killRate>.5);
console.log('PASS all nine impacts, sequential shots, duplicate protection, pause/resume, Turbo, reduced motion, death continuity, cleanup and draw-independent settlement.');
const {bloodGunTimeline}=await import('../dist/blood-gunslinger-motion.js');
let continuedRun=null;
const aimedShooter={...shooter,timeline:bloodGunTimeline,startCells:r=>{continuedRun=r;},handoff:()=>({angle:.12,frame:31}),figure:()=>{},idle:()=>true};
const chain=createBloodDuel({shooter:aimedShooter,canvas:{style:{filter:''}}});
await chain.load();chain.start(0,2);chain.update(0);assert.ok(chain.hit(2,true,{continueToTarget:true}));assert.equal(continuedRun.hold,true);
for(let now=16;now<7000;now+=16)chain.update(now);
assert.equal(chain.debug.holdingAim,true,'hold survives corpse/shot cleanup');
assert.equal(chain.drawFigure({},7000,true),true,'the held pose remains rendered');
assert.deepEqual(chain.releaseAim(),{angle:.12,frame:31});assert.equal(chain.releaseAim(),null,'handoff can only be consumed once');
assert.equal(chain.drawFigure({},7000,true),false,'old pose cannot reappear after target holstering');
chain.start(1,2);chain.hit(2,true,{continueToTarget:true});chain.stop();assert.equal(chain.releaseAim(),null,'cancel clears the held gun');
console.log('PASS held gun survives reaction cleanup, transfers once and clears on cancellation.');

for(const reduced of [false,true]){
 const gated=createBloodDuel({shooter:aimedShooter,canvas:{style:{filter:''}},reduced});
 await gated.load();gated.start(0,2);gated.update(0);gated.hit(2,true,{continueToTarget:true});gated.next(1);
 let now=0;for(;now<8000;now+=16)gated.update(now);
 assert.equal(gated.debug.level,0,'new enemy cannot overlap the multiplier or spin reward');
 assert.equal(gated.settled,false,'pending reward blocks the next spin');
 gated.revealNext();assert.equal(gated.settled,false,'release alone must not skip the next entrance');
 gated.update(now+=16);assert.equal(gated.debug.level,1);assert.equal(gated.settled,false,'entrance has its own readable beat');
 for(let i=0;i<40;i++)gated.update(now+=16);
 assert.equal(gated.settled,true);gated.stop();
}
console.log('PASS reward-gated next enemy, complete entrance before spin, normal and reduced motion.');
