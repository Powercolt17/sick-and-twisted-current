import assert from 'node:assert/strict';
import {createWildShots,wildShotTimeline,markPresentationAt} from '../dist/wild-shots.js';
import {gunslingerPose,gunslingerTimeline} from '../dist/gunslinger-motion.js';
import {createCrossfireController} from '../dist/crossfire-controller.js';
import {winShotEvents,WIN_SHOT_DURATION} from '../dist/win-shot-audio.js';
const targets=[[0,0],[1,1],[2,2],[3,3],[4,0],[5,1]],run=wildShotTimeline(targets,{mark:true});
for(const reduced of [false,true]){
 for(let i=0;i<24;i++){
  assert.equal(markPresentationAt(0,run,i,reduced).titleAlpha,0);
  assert.equal(markPresentationAt(0,run,i,reduced).reticleAlpha,0);
  assert.equal(markPresentationAt(.7,run,i,reduced).reticleAlpha,1,'all targets lock before the gunshot');
  const end=markPresentationAt(run.end,run,i,reduced);
  assert.equal(end.titleAlpha,0);assert.equal(end.focusAlpha,0);assert.equal(end.reticleAlpha,0);
  for(let t=0;t<=run.end;t+=1/120){
   const v=markPresentationAt(t,run,i,reduced);assert.ok(Object.values(v).every(Number.isFinite));
   for(const k of ['titleAlpha','focusAlpha','reticleAlpha','trace'])assert.ok(v[k]>=0&&v[k]<=1);
   if(reduced){assert.equal(v.titleY,0);assert.equal(v.reticleScale,1);}
  }
 }
}
for(const speed of [1,1.15]){
 const cues=[],conversions=[];let now=0;
 const shot=createWildShots({G:{},onCue:c=>cues.push(c.type),onConvert:c=>conversions.push({cell:c,time:now})});
 shot.begin(targets,0,speed,{mark:'j'});
 // A missed foreground frame cannot consume the complete presentation.
 now=900;shot.advance(now);assert.ok(shot.elapsed(now)<=.05*speed+.0001);assert.equal(conversions.length,0);
 shot.setPaused(true,now);const before=markPresentationAt(shot.elapsed(now),shot.state);
 now+=10000;shot.advance(now);assert.deepEqual(markPresentationAt(shot.elapsed(now),shot.state),before);
 shot.setPaused(false,now);
 for(;!shot.finished(now);now+=1000/30)shot.advance(now);
 assert.equal(cues.filter(c=>c==='shot').length,1);assert.equal(cues.filter(c=>c==='impact').length,1);
 assert.equal(conversions.length,6);assert.equal(new Set(conversions.map(c=>c.time)).size,1);
 assert.equal(markPresentationAt(shot.elapsed(now),shot.state).titleAlpha,0);shot.clear();assert.equal(shot.active,false);
}
console.log('PASS Mark acquisition, clean fade endpoints, reduced motion, 30 fps/Turbo sync, stalled frame and pause continuity');

// The held recoil is visible at 30 fps and settles before lowering the gun.
const shotAt=run.shots[0];
for(const age of [.035,.050,.075])assert.equal(gunslingerPose(shotAt+age,run).kick,1);
assert.equal(gunslingerPose(run.lowerAt,run).kick,0);
assert.equal(gunslingerPose(run.end,run).draw,0);
assert.ok(run.end-shotAt<.7,'no prolonged idle tail after Mark');
const ordinary=gunslingerTimeline([[0,0],[1,1]]);
assert.equal(gunslingerPose(ordinary.shots[0]+.065,ordinary).kick,1,'ordinary recoil unchanged');
// Caption never draws over the logo or paying grid; source tiles conceal the
// model conversion until the powder wipe opens, then release completely.
const G={x:267,y:157,w:660,h:396,cw:110,ch:99},calls=[],sprites=[];
const ctx=new Proxy({}, {get:(_,k)=>k==='createRadialGradient'?()=>({addColorStop(){}}):(...args)=>calls.push([k,...args]),set:()=>true});
const presentation=createWildShots({G});presentation.begin(targets,0,1,{mark:'j'});
let ms=0;const frame=at=>{for(;ms<at;ms=Math.min(at,ms+10))presentation.advance(ms);presentation.advance(at);calls.length=0;sprites.length=0;presentation.drawBoard(ctx,at,(name)=>sprites.push(name));};
frame(700);
const caption=calls.find(c=>c[0]==='fillText');assert.ok(caption[3]>G.y+G.h);assert.ok(caption[3]<G.y+G.h+50);
assert.ok(!calls.some(c=>c[0]==='fillRect'&&c[2]<G.y),'no title panel above the grid');
frame(950);assert.ok(sprites.includes('j'));assert.ok(!sprites.includes('boxedwild'));
frame(1030);assert.ok(sprites.includes('j')&&sprites.includes('boxedwild'),'source and revealed Wild coexist during wipe');
frame(1250);assert.deepEqual(sprites,[],'complete Wild comes from the board after the wipe');
for(const speed of [1,1.65]){
 const normal=createCrossfireController({width:1212,height:608,grid:G}).begin(targets,speed);
 const quick=createCrossfireController({width:1212,height:608,grid:G}).begin(targets,speed,{followThrough:true});
 assert.ok(Math.abs(quick.shots[0].fire-.06/speed)<1e-9);
 const delta=normal.shots[0].fire-quick.shots[0].fire;
 for(let i=0;i<quick.shots.length;i++){
  assert.ok(Math.abs(normal.shots[i].impact-quick.shots[i].impact-delta)<1e-9);
  assert.equal(quick.shots[i].travel,normal.shots[i].travel);
 }
 assert.equal(winShotEvents(quick).length,1);assert.equal(winShotEvents(quick)[0].at,quick.shots[0].fire);
 assert.ok(quick.duration>=quick.shots[0].fire+WIN_SHOT_DURATION);
}
console.log('PASS held recoil, caption below reels, continuous powder reveal and immediate synchronized win volley');
