import assert from 'node:assert/strict';
import {bloodTargetCameraMatrix} from '../dist/blood-promotion.js';
import {createImpactMotion} from '../dist/impact-motion.js';
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} differs from ${b}`);
// Compare actual target points with the same camera projection used by the
// canvas, at desktop/phone sizes and multiple device rendering resolutions.
for(const renderScale of [.65,1,1.375,2.5])for(const sceneTop of [0,230])for(const k of [.28,.9,1.25]){
 const placement={renderScale,sceneTop,k,x:1006.5*k,y:sceneTop?-180*k:k};
 for(const reduced of [false,true]){
  const impact=createImpactMotion({reduced});impact.kick(6,100);
  for(const now of [100,116,132,180,240,419,420,1000]){
   const kick=impact.sample(now),zoom=1+Math.max(2*Math.abs(kick.x)/1212,2*Math.abs(kick.y)/608);
   const e=606+kick.x-zoom*606,f=304+kick.y-zoom*304;
   const m={a:zoom*renderScale,b:0,c:0,d:zoom*renderScale,e:e*renderScale,f:f*renderScale+Math.round(sceneTop*renderScale)};
   const [a,b,c,d,tx,ty]=bloodTargetCameraMatrix(m,placement);
   for(const [u,v] of [[0,0],[80,95],[175,204]]){
    const worldX=(placement.x+u)/k,worldY=(placement.y+v)/k;
    close(placement.x+a*u+c*v+tx,k*(zoom*worldX+e));
    close(placement.y+b*u+d*v+ty,k*(zoom*worldY+f));
   }
   if(reduced||now>=420){close(tx,0);close(ty,0);close(a,1);close(d,1);}
  }
 }
}
console.log('PASS target/scene pixel alignment throughout each impact, shared zoom, desktop/phone scaling, reduced motion and return to rest.');
