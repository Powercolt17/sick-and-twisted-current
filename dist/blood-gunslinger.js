import {createScreenShootout} from './screen-shootout.js?v=116mark';
import {bloodHeroPoint,BLOOD_STAGE} from './blood-duel-stage.js?v=1';
import {bloodGunTimeline,bloodGunPose} from './blood-gunslinger-motion.js?v=2';
import {BLOOD_TARGET_TIME} from './blood-target-motion.js?v=2';
import {drawBloodCigarette} from './blood-cigarette.js?v=1';
import {gunslingerIdle} from './scene-motion.js?v=1';
const clamp=v=>Math.max(0,Math.min(1,v)),smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
let shared;
function loadArt(){return shared??=(async()=>{
 const meta=await fetch('assets/blood-hero/hero-draw.json').then(r=>{if(!r.ok)throw Error('Draw metadata unavailable');return r.json();});
 const load=async src=>{const im=new Image();im.src=src;await im.decode();return im;};
 const [sheet,flash]=await Promise.all([load('assets/blood-hero/hero-draw.webp'),load('assets/blood-wall/flash.webp')]);return {meta,sheet,flash};
})().catch(e=>{shared=null;throw e;});}
export function createBloodGunslinger({reduced=false,getAmbientTime}={}){
 const idle=createScreenShootout({reduced,getAmbientTime});let art=null,run=null,fromAngle=null,target={x:1095,y:355};
 const P={x:8,y:198,width:243,height:435.45},scale=P.width/274/1.25,origin={x:P.x-40*scale,y:P.y-10*scale};
 const shoulder={x:141,y:158},tip={x:412,y:98},barrelAngle=Math.atan2(-8,66);
 const weight=y=>1-smooth((y-240)/155);
 function point(p,angle,dx=0){const a=angle*weight(p.y),c=Math.cos(a),s=Math.sin(a),x=p.x-shoulder.x,y=p.y-shoulder.y;return{x:origin.x+(shoulder.x+x*c-y*s+dx*weight(p.y))*scale,y:origin.y+(shoulder.y+x*s+y*c)*scale};}
 function aim(){
  const h=BLOOD_STAGE.hero,to={x:(target.x-h.x)/h.scale,y:(target.y-h.y)/h.scale};let angle=0;
  for(let i=0;i<4;i++){const p=point(tip,angle);angle=Math.atan2(to.y-p.y,to.x-p.x)-barrelAngle;}
  return Math.max(-.48,Math.min(.48,angle));
 }
 function pose(t){const p=bloodGunPose(t,run||undefined),aimAngle=fromAngle===null?aim()*p.aimWeight:fromAngle+(aim()-fromAngle)*smooth(t/.40);return {...p,angle:aimAngle*(run?.raised&&t>=run.lowerAt?p.aimWeight:1)-p.kick*.064,dx:-p.kick*5};}
 function muzzle(t){const p=pose(t),m=point(tip,p.angle,p.dx);return bloodHeroPoint(m.x,m.y);}
 async function load(){try{art=await loadArt();}catch(e){console.warn('Rightward draw unavailable; original idle retained',e);}}
 function figure(ctx,t,alpha=1,now=0,motion=true){
  if(reduced||!art||!run)return idle.idle(ctx,now,motion);
  const p=pose(t),f=art.meta.frames[p.frame],size=art.meta.frameWidth;
  ctx.save();ctx.globalAlpha*=alpha;
  for(const [x,y,rx,ry,a]of[[129,482,114,12,.25],[53,476,43,5,.75],[192,481,42,5,.75]]){ctx.save();ctx.translate(P.x+x*P.width/274,P.y+y*P.height/491);ctx.scale(rx*P.width/274,ry*P.height/491);const g=ctx.createRadialGradient(0,0,0,0,0,1);g.addColorStop(0,`rgba(19,12,7,${a})`);g.addColorStop(1,'rgba(19,12,7,0)');ctx.fillStyle=g;ctx.fillRect(-1,-1,2,2);ctx.restore();}
  const idleWeight=(run.raised?0:1-smooth(t/.075))+(run.hold?0:smooth((t-run.restAt+.075)/.075));
  if(motion&&idleWeight>0){const feet=P.y+P.height,rest=gunslingerIdle((getAmbientTime?.()??now)/1000);ctx.translate(P.x+P.width/2,feet);ctx.transform(1,0,rest.lean*idleWeight,1+rest.breath*idleWeight,0,0);ctx.translate(-P.x-P.width/2,-feet);}
  // Same feet and placement as the default atlas. Only the upper figure bends
  // toward the actual hit point; all rows below the waist remain pinned.
  if(Math.abs(p.angle)<.00001&&Math.abs(p.dx)<.00001)ctx.drawImage(art.sheet,f.x,f.y,size,size,origin.x,origin.y,size*scale,size*scale);
  else for(let y=0;y<size;y+=3){const h=Math.min(3,size-y),a=p.angle*weight(y+h/2);ctx.save();ctx.translate(origin.x,origin.y);ctx.scale(scale,scale);ctx.translate(shoulder.x+p.dx*weight(y+h/2),shoulder.y);ctx.rotate(a);ctx.drawImage(art.sheet,f.x,f.y+y,size,h,-shoulder.x,y-shoulder.y,size,h+.3);ctx.restore();}
  drawBloodCigarette(ctx,{frame:p.frame,point:v=>point(v,p.angle,p.dx),scale:scale*1.25,now:getAmbientTime?.()??now,animate:motion,reduced});
  ctx.restore();return true;
 }
 function drawFlash(ctx,t){
  if(reduced||!art||!run)return;const age=(t-run.shots[0])*1000;if(age<0||age>1550)return;
  const moving=muzzle(t),fired=muzzle(run.shots[0]),a=Math.atan2(target.y-fired.y,target.x-fired.x);
  ctx.save();
  if(age<78){ctx.translate(moving.x,moving.y);ctx.rotate(a);ctx.globalCompositeOperation='lighter';ctx.globalAlpha=1-age/78;
   ctx.drawImage(art.flash,43,105,340,310,-2,-27,59,54);ctx.restore();ctx.save();}
  // Powder smoke drifts from the actual muzzle without obscuring the reels.
  for(let i=0;i<6;i++){const u=(age-i*28)/1000;if(u<0||u>1.1)continue;const x=fired.x+u*(10+i*3),y=fired.y-u*(25+i*2),r=2+u*12;const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(155,144,125,${.07*(1-u)*Math.min(1,u*12)})`);g.addColorStop(1,'rgba(130,123,112,0)');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}
  ctx.restore();
 }
 return {load,setAssets:(...args)=>idle.setAssets(...args),get assets(){return idle.assets;},get ready(){return !!art;},timeline:bloodGunTimeline,
  startCells(next,aimAt,continuation=null){run=next;fromAngle=continuation?.angle??null;if(aimAt)target={...aimAt};},handoff:t=>({angle:pose(t).angle,frame:pose(t).frame}),figure,idle:idle.idle,muzzle,drawFlash,
  get debug(){return {ready:!!art,target,run};}};
}
export function createBloodTargetGun({getAssets,reduced=false,getAmbientTime}){
 const gun=createBloodGunslinger({reduced,getAmbientTime});let run=null,loaded=null;
 const prepare=()=>{const a=getAssets();if(a?.json&&a.sheets.length&&loaded!==a.json){gun.setAssets(a.json,a.sheets,a.glass);loaded=a.json;}};
 function start(target,continuation=null){prepare();run=bloodGunTimeline({raised:!!continuation});gun.startCells(run,target,continuation);}
 function drawFigure(ctx,age,now,motion){if(age===null||age<0||!run||age>=run.end*1000)return false;prepare();return gun.figure(ctx,age/1000,1,now,motion);}
 function drawOver(ctx,age,target){if(age===null||!run||reduced||!gun.ready)return;gun.drawFlash(ctx,age/1000);const t=age-BLOOD_TARGET_TIME.fire;if(t<0||t>180)return;
  const a=gun.muzzle(run.shots[0]),p=clamp(t/(BLOOD_TARGET_TIME.impact-BLOOD_TARGET_TIME.fire)),tail=Math.max(0,p-.125),fade=1-clamp((t-100)/55),x=a.x+(target.x-a.x)*p,y=a.y+(target.y-a.y)*p,tx=a.x+(target.x-a.x)*tail,ty=a.y+(target.y-a.y)*tail;
  ctx.save();ctx.globalCompositeOperation='lighter';ctx.lineCap='round';for(const [w,c,al]of[[5,'246,155,62',.22],[1.5,'255,238,190',.95]]){const g=ctx.createLinearGradient(tx,ty,x+.01,y+.01);g.addColorStop(0,`rgba(${c},0)`);g.addColorStop(1,`rgba(${c},${al*fade})`);ctx.strokeStyle=g;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(tx,ty);ctx.lineTo(x,y);ctx.stroke();}ctx.restore();
 }
 return {load:gun.load,start,drawFigure,drawOver,get continued(){return !!run?.raised;},get active(){return !!run;},get debug(){return gun.debug;}};
}
