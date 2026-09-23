// Blood Money in-feature display: one big WANTED poster of the current target on
// the approved oak board. Stamps are shots: muzzle flash at the board's edge, a
// bullet across, a snap of light, paper slivers, and a painted bullet hole with
// depth that stays. On the third hole the finished poster turns up and over its
// nail like a page and the next outlaw is already hanging beneath.
// Presentation only: the bounty resolver owns every value shown here.
import {BLOOD_LADDER} from './blood-bounty.js?v=81';
import {OUTLAW_FILES} from './blood-outlaws.js?v=91art';
const clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>1-(1-clamp(x))**3;
// Hole positions are fixed per poster and stamp so a hole never moves once shot (poster units).
const HOLES=[[[.36,.40],[.62,.33],[.50,.56]],[[.40,.36],[.58,.52],[.46,.45]],[[.34,.48],[.60,.38],[.52,.58]]];
const HOLE_ROT=[-.3,.5,.1];
export const WALL_TIME=Object.freeze({flight:140,impact:760,turn:1300});
const ART={board:'assets/blood-wall/board.webp',hole0:'assets/blood-wall/hole-0.webp',hole1:'assets/blood-wall/hole-1.webp',hole2:'assets/blood-wall/hole-2.webp',puff:'assets/blood-wall/puff.webp',flash:'assets/blood-wall/flash.webp',bullet:'assets/blood-wall/bullet.webp'};
// Board geometry (fractions of the board sprite): where the nail is and where the poster hangs.
const BOARD={w:761,h:1408,nail:[.5,.075],posterW:.74,posterY:.115};

export function createBloodWall({now=()=>performance.now(),reduced=false,random=Math.random}={}){
 const images={};let loading=null;
 const jolt={a:0,v:0,last:0};let impact=null,turnCanvas=null;
 function load(){
  if(loading)return loading;
  const one=(key,src)=>new Promise(res=>{const im=new Image();im.decoding='async';im.onload=()=>{images[key]=im;res(im);};im.onerror=()=>res(null);im.src=src;});
  loading=Promise.all([...Object.entries(OUTLAW_FILES).map(([sym,file])=>one(sym,`assets/ink-western/${file}.webp`)),...Object.entries(ART).map(([k,src])=>one(k,src))]);
  return loading;
 }
 // ---- pieces -----------------------------------------------------------------
 function holeAt(c2,x,y,k,rot,s){const im=images['hole'+k];c2.save();c2.translate(x,y);c2.rotate(rot);
  // scorch ring pressed into the paper, the torn rim multiplied in so it darkens rather than lightens, a black puncture at the centre
  let g=c2.createRadialGradient(0,0,s*.16,0,0,s*.52);g.addColorStop(0,'rgba(50,26,12,.85)');g.addColorStop(.45,'rgba(60,32,14,.35)');g.addColorStop(1,'rgba(60,32,14,0)');c2.fillStyle=g;c2.beginPath();c2.arc(0,0,s*.52,0,6.283);c2.fill();
  if(im){c2.save();c2.globalCompositeOperation='multiply';c2.drawImage(im,-s/2,-s/2,s,s);c2.restore();}
  g=c2.createRadialGradient(0,0,0,0,0,s*.26);g.addColorStop(0,'rgba(6,3,2,1)');g.addColorStop(.7,'rgba(6,3,2,.96)');g.addColorStop(1,'rgba(6,3,2,0)');c2.fillStyle=g;c2.beginPath();c2.arc(0,0,s*.26,0,6.283);c2.fill();
  c2.restore();}
 function poster(ctx,sym,x,y,w,h,holes,{alpha=1,shade=0}={}){
  const im=images[sym];ctx.save();ctx.globalAlpha*=alpha;ctx.shadowColor='#000c';ctx.shadowBlur=h*.05;ctx.shadowOffsetY=h*.02;
  if(im)ctx.drawImage(im,x,y,w,h);else{ctx.fillStyle='#d9c7a0';ctx.fillRect(x,y,w,h);}ctx.shadowColor='transparent';
  for(let i=0;i<holes.length;i++){const [hx,hy]=holes[i].p;const age=holes[i].age;const pop=age!==null&&age<70?1.25-.25*ease(age/70):1;holeAt(ctx,x+hx*w,y+hy*h,holes[i].k,holes[i].rot,w*.24*pop);}
  if(shade>0){ctx.fillStyle=`rgba(0,0,0,${shade})`;ctx.fillRect(x,y,w,h);}
  ctx.restore();
 }
 // The finished poster rolls up from the bottom into a shaded tube that climbs to the nail, revealing the next
 // outlaw's poster underneath, then the roll tears off and drops. Stays inside the board, reads at any size.
 function pageRoll(ctx,sym,holes,P,q){
  if(!turnCanvas)turnCanvas=document.createElement('canvas');
  const off=turnCanvas,ow=Math.max(2,Math.round(P.w*2)),oh=Math.max(2,Math.round(P.h*2));if(off.width!==ow||off.height!==oh){off.width=ow;off.height=oh;}
  const oc=off.getContext('2d');oc.clearRect(0,0,ow,oh);if(images[sym])oc.drawImage(images[sym],0,0,ow,oh);
  for(const hle of holes)holeAt(oc,hle.p[0]*ow,hle.p[1]*oh,hle.k,hle.rot,ow*.24);
  const roll=clamp(q/.8),drop=clamp((q-.8)/.2);                 // 80% rolling up, 20% tearing off and falling
  const R=P.h*.075,fold=P.y+P.h*(1-roll);                        // fold line climbs from the foot to the nail
  const flatH=Math.max(0,fold-P.y);
  if(drop<1){
   // the flat part of the page still pinned above the fold
   if(flatH>0.5)ctx.drawImage(off,0,0,ow,oh*(flatH/P.h),P.x,P.y,P.w,flatH);
   // shadow the roll throws on the poster beneath
   const sh=ctx.createLinearGradient(0,fold,0,fold+R*2.2);sh.addColorStop(0,'rgba(0,0,0,.45)');sh.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=sh;ctx.fillRect(P.x-P.w*.02,fold,P.w*1.04,R*2.2);
   // the tube: thicker the more paper is rolled, shaded like a cylinder, with the paper's own image wrapped over its face
   const tube=R*(0.55+0.45*roll),y0=fold-tube*2+ (drop>0?drop*drop*P.h*1.2:0),alpha=1-drop;
   ctx.save();ctx.globalAlpha*=alpha;ctx.translate(0,drop*drop*P.h*1.2);ctx.rotate(0);
   ctx.save();ctx.beginPath();ctx.rect(P.x-P.w*.01,fold-tube*2,P.w*1.02,tube*2);ctx.clip();
   // a slice of the page image stretched around the tube face, then cylinder shading over it
   const srcY=oh*(flatH/P.h);ctx.drawImage(off,0,Math.max(0,srcY-oh*.02),ow,oh*.16,P.x,fold-tube*2,P.w,tube*2);
   const cyl=ctx.createLinearGradient(0,fold-tube*2,0,fold);cyl.addColorStop(0,'rgba(0,0,0,.55)');cyl.addColorStop(.25,'rgba(255,240,210,.22)');cyl.addColorStop(.55,'rgba(0,0,0,.05)');cyl.addColorStop(1,'rgba(0,0,0,.6)');ctx.fillStyle=cyl;ctx.fillRect(P.x-P.w*.01,fold-tube*2,P.w*1.02,tube*2);
   ctx.restore();
   // the tube's ragged ends
   ctx.fillStyle='#d9c8a3';ctx.beginPath();ctx.ellipse(P.x,fold-tube,P.w*.012,tube,0,0,6.283);ctx.fill();ctx.beginPath();ctx.ellipse(P.x+P.w,fold-tube,P.w*.012,tube,0,0,6.283);ctx.fill();
   ctx.restore();
  }
 }
 function beginImpact(tx,ty,scale,t){
  impact={x:tx,y:ty,rot:(random()-.5)*.6,at:t,bits:[]};jolt.v+=16;
  for(let i=0;i<26;i++){const a=-Math.PI/2+(random()-.5)*3.0,sp=(260+random()*520)*scale;impact.bits.push({x:tx,y:ty,vx:Math.cos(a)*sp+(random()-.5)*160*scale,vy:Math.sin(a)*sp,rot:random()*6.28,vr:(random()-.5)*16,len:(6+random()*12)*scale,wid:(2+random()*3.5)*scale,tone:random()<.4?'#c9b58f':'#ead9b5'});}
 }
 function drawImpact(ctx,scale,age,dt,P){
  const q=impact;
  // the whole poster flashes on contact, then the point of impact burns bright for a beat
  if(age<70&&P){ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha*=.32*(1-age/70);ctx.fillStyle='#fff3d0';ctx.fillRect(P.x,P.y,P.w,P.h);ctx.restore();}
  if(age<120){const r=(.14*(1-age/120)+.03)*560*scale;ctx.save();ctx.globalCompositeOperation='lighter';const g=ctx.createRadialGradient(q.x,q.y,0,q.x,q.y,r);g.addColorStop(0,'rgba(255,250,230,.98)');g.addColorStop(.4,'rgba(255,200,120,.6)');g.addColorStop(1,'rgba(255,160,60,0)');ctx.fillStyle=g;ctx.fillRect(q.x-r,q.y-r,r*2,r*2);ctx.restore();}
  if(age<320&&images.puff){const b=images.puff,p=age/320,s=.2*560*scale*(1+1.1*p),bh=s*b.height/b.width;ctx.save();ctx.globalAlpha*=.75*(1-p);ctx.translate(q.x,q.y);ctx.rotate(q.rot*.5);ctx.drawImage(b,-s/2,-bh/2,s,bh);ctx.restore();}
  ctx.save();for(const bt of q.bits){bt.vy+=1500*scale*dt;bt.x+=bt.vx*dt;bt.y+=bt.vy*dt;bt.rot+=bt.vr*dt;const life=clamp(1-(age-300)/380);if(life<=0)continue;
   ctx.save();ctx.globalAlpha*=life;ctx.translate(bt.x,bt.y);ctx.rotate(bt.rot);ctx.fillStyle=bt.tone;ctx.fillRect(-bt.len/2,-bt.wid/2,bt.len,bt.wid);ctx.strokeStyle='rgba(60,40,20,.7)';ctx.lineWidth=1;ctx.strokeRect(-bt.len/2,-bt.wid/2,bt.len,bt.wid);ctx.restore();}
  ctx.restore();
 }
 // ---- layout ------------------------------------------------------------------
 // state: {level,stamps}. opts: turn (0..1 during an upgrade), nextTarget, flight (0..1 while the
 // bullet is on its way), impactAge (ms since the bullet landed, or -1), t.
 function draw(ctx,state,{x,y,w,h,turn=0,nextTarget=null,flight=-1,impactAge=-1,t=now()}={}){
  if(typeof window!=='undefined'&&window.__wallLog)window.__wallLog.push([Math.round(t),+flight.toFixed(2),Math.round(impactAge),+turn.toFixed(2),state.stamps]);
  const wide=w/h>1.6,level=Math.min(2,state.level),target=BLOOD_LADDER[level];
  const dt=Math.min(.05,jolt.last?Math.max(0,t-jolt.last)/1000:.016);jolt.last=t;
  const k=520,cd=2*Math.sqrt(k)*.42;jolt.v+=(-k*jolt.a-cd*jolt.v)*dt;jolt.a+=jolt.v*dt;
  ctx.save();
  // the board and the poster hanging on it
  let bw,bh,bx,by;
  if(wide){const ph=h*.9,pw=ph*.75;bw=pw/BOARD.posterW;bh=bw*BOARD.h/BOARD.w;bx=x+w*.24-bw/2;by=y+(h-ph)/2-bh*BOARD.posterY;}
  else{bh=h;bw=bh*BOARD.w/BOARD.h;if(bw>w*1.12){bw=w*1.12;bh=bw*BOARD.h/BOARD.w;}bx=x+(w-bw)/2-w*.03;by=y+(h-bh)/2;}
  const P={w:bw*BOARD.posterW};P.h=P.w*4/3;P.x=bx+(bw-P.w)/2;P.y=by+bh*BOARD.posterY;const nail={x:bx+bw*BOARD.nail[0],y:by+bh*BOARD.nail[1]};
  const scale=P.w/414;   // effect sizes are tuned for a 414-wide poster
  ctx.save();ctx.beginPath();ctx.rect(x-w*.2,y-h*.02,w*1.4,h*1.04);ctx.clip();
  if(images.board)ctx.drawImage(images.board,bx,by,bw,bh);else{ctx.fillStyle='#1a110c';ctx.fillRect(bx,by,bw,bh);}
  const holes=(count,ageOfLast)=>{const out=[];for(let i=0;i<Math.min(3,count);i++)out.push({p:HOLES[level][i],k:i%3,rot:HOLE_ROT[i],age:i===count-1?ageOfLast:null});return out;};
  ctx.save();ctx.translate(nail.x,nail.y);ctx.rotate(reduced?0:jolt.a*.11);ctx.translate(-nail.x,-nail.y);
  if(turn>0&&nextTarget){const raw=clamp(turn),q=raw<.5?2*raw*raw:1-Math.pow(-2*raw+2,2)/2;
   poster(ctx,nextTarget,P.x,P.y,P.w,P.h,[],{shade:.42*Math.sin(q*Math.PI)});
   if(q<1)pageRoll(ctx,target,holes(3,null),P,q);}
  else poster(ctx,target,P.x,P.y,P.w,P.h,holes(state.stamps,impactAge>=0?impactAge:null));
  ctx.restore();
  // the shot in flight: flash at the board's edge, the bullet crossing to the next hole
  if(flight>=0&&flight<1&&state.stamps<3){const [hx,hy]=HOLES[level][state.stamps];const tx=P.x+hx*P.w,ty=P.y+hy*P.h;
   if(images.flash){const f=images.flash,s=bw*.95,fh=s*f.height/f.width;ctx.save();ctx.globalAlpha*=1-Math.pow(flight,1.6);ctx.drawImage(f,bx-s*.22,ty-fh*.5,s,fh);ctx.restore();}
   // tracer: a bright streak from the muzzle to the hit, brightest at its head
   {const sx=bx-bw*.05,sy=ty+h*.01,hx=sx+(tx-sx)*flight,hy=sy+(ty-sy)*flight,tail=Math.max(0,flight-.45),tx0=sx+(tx-sx)*tail,ty0=sy+(ty-sy)*tail;
    ctx.save();ctx.globalCompositeOperation='lighter';const g=ctx.createLinearGradient(tx0,ty0,hx,hy);g.addColorStop(0,'rgba(255,180,80,0)');g.addColorStop(1,'rgba(255,250,220,.95)');ctx.strokeStyle=g;ctx.lineWidth=Math.max(2,P.w*.014);ctx.lineCap='round';ctx.beginPath();ctx.moveTo(tx0,ty0);ctx.lineTo(hx,hy);ctx.stroke();
    ctx.fillStyle='rgba(255,255,240,.95)';ctx.beginPath();ctx.arc(hx,hy,Math.max(2,P.w*.012),0,6.283);ctx.fill();ctx.restore();}}
  // the impact: begins the frame the bullet lands
  if(impactAge>=0&&state.stamps>0){if(!impact||impact.stamp!==state.stamps||impact.level!==level){const i=state.stamps-1,[hx,hy]=HOLES[level][i];beginImpact(P.x+hx*P.w,P.y+hy*P.h,scale,t);impact.stamp=state.stamps;impact.level=level;}
   if(impactAge<WALL_TIME.impact)drawImpact(ctx,scale,impactAge,dt,P);}
  else if(impactAge<0)impact=null;
  ctx.restore();ctx.restore();
 }
 return {load,draw,get ready(){return !!images[BLOOD_LADDER[0]]&&!!images.board;}};
}
