// Blood Money intro: "The Bounty Wall". Presentation only. Plays on the reels, no film.
//  wall slides in over the confirmed board -> the three scatter posters lift off and are nailed to it, one hammer blow
//  each -> a bloody handprint slaps across -> BLOOD MONEY is stamped over them -> the contract slides in with the award.
//  Assets (assets/bounty-wall/): wall.webp, hand.webp, stamp.webp, contract.webp, nail.webp.
const clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{x=clamp(x);return x*x*(3-2*x);},out=x=>1-Math.pow(1-clamp(x),3),back=x=>{x=clamp(x);return 1+2.7*Math.pow(x-1,3)+1.7*Math.pow(x-1,2);};
export const WALL_BEATS=Object.freeze({wall:520,lift:380,liftGap:300,liftMs:330,hand:1650,stamp:2050,contract:2550,ready:3000,auto:12000});
const hash=i=>{let h=(i+1)*2654435761>>>0;h^=h>>>15;h=Math.imul(h,2246822519)>>>0;h^=h>>>13;return (h>>>0)/4294967295;};
const ART_KEYS=['wall','hand','stamp','contract','nail'];
export function createBloodWallIntro({G,W=1212,H=608,reduced=false,sfx=()=>{},kick=()=>{},doc=globalThis.document,force=false}={}){
 const art={};for(const k of ART_KEYS){const i=new Image();i.decoding='async';i.onload=()=>{art[k]=i;};i.onerror=()=>{art[k]=null;};i.src=`assets/bounty-wall/${k}.webp`;}
 // The wall only plays with its painted art; without it the feature keeps its film.
 const ready=()=>force||ART_KEYS.every(k=>art[k]);
 let state=null;
 // view: the canvas' world rect (x,y,w,h); the frozen canvas is a pixel copy of exactly that rect.
 function begin(cells,frozen,awardedSpins,now,view){
  const order=[...cells].sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
  state={cells:order,frozen,view:view||{x:0,y:0,w:W,h:H},spins:awardedSpins||8,start:now,pausedAt:null,fired:new Set(),spatter:null};return state;
 }
 function elapsed(now){return state?((state.pausedAt??now)-state.start):0;}
 function pause(now){if(state&&state.pausedAt===null)state.pausedAt=now;}
 function resume(now){if(state&&state.pausedAt!==null){state.start+=now-state.pausedAt;state.pausedAt=null;}}
 function fire(key,fn){if(!state||state.fired.has(key))return;state.fired.add(key);fn();}
 function end(){state=null;}
 // Frame: the visible part of the world (portrait phones crop the sides).
 function frame(view){return view?.mobile?{x:view.x,y:0,w:view.w,h:H}:{x:0,y:0,w:W,h:H};}
 function drawWall(ctx,F,alpha,dy=0){
  ctx.save();ctx.globalAlpha=alpha;ctx.beginPath();ctx.rect(0,0,W,H);ctx.clip();
  if(art.wall){const iw=art.wall.naturalWidth,ih=art.wall.naturalHeight,s=Math.max(W/iw,H/ih),w=iw*s,h=ih*s;ctx.drawImage(art.wall,(W-w)/2,(H-h)/2+dy,w,h);}
  else{ctx.fillStyle='#2a1c12';ctx.fillRect(0,dy,W,H);ctx.strokeStyle='#1a110a';ctx.lineWidth=2;for(let y=0;y<H;y+=76){ctx.beginPath();ctx.moveTo(0,y+dy);ctx.lineTo(W,y+dy);ctx.stroke();}}
  ctx.restore();
 }
 function posterTargets(F,n){const pw=Math.min(250,F.w*.22),ph=pw*G.ch/G.cw,cx=[.25,.5,.75].map(f=>F.x+F.w*f),cy=F.y+F.h*.36;return Array.from({length:n},(_,i)=>({x:cx[Math.min(i,2)]-pw/2,y:cy-ph/2,w:pw,h:ph,rot:(i-1)*.045+(hash(i)-.5)*.03}));}
 function draw(ctx,now,view){
  if(!state)return false;const t=reduced?WALL_BEATS.ready:elapsed(now),F=frame(view),B=WALL_BEATS;
  ctx.save();
  // 1. the confirmed board, going dark as the wall comes in
  const V=state.view;ctx.drawImage(state.frozen,V.x,V.y,V.w,V.h);
  const wallP=out(t/B.wall);
  ctx.fillStyle=`rgba(8,5,3,${.75*wallP})`;ctx.fillRect(0,0,W,H);
  drawWall(ctx,F,wallP,(1-wallP)*H*.35);
  if(t<B.wall)fire('wall',()=>sfx('vault',.5,.85));
  // 2. the scatters lift off the reels and are nailed to the wall
  const fw=state.frozen.width/V.w,fh=state.frozen.height/V.h,targets=posterTargets(F,state.cells.length);
  state.cells.forEach(([c,r],i)=>{
   const sx=G.x+c*G.cw,sy=G.y+r*G.ch,tg=targets[i],t0=B.lift+i*B.liftGap,p=clamp((t-t0)/B.liftMs);
   if(t<t0&&wallP>=1)return;                                     // covered by the wall until it lifts
   const e=smooth(p),x=sx+(tg.x-sx)*e,y=sy+(tg.y-sy)*e-Math.sin(p*Math.PI)*40,w=G.cw+(tg.w-G.cw)*e,h=G.ch+(tg.h-G.ch)*e;
   const landed=t-t0-B.liftMs,slam=landed>=0?1+.12*Math.exp(-landed/90)*Math.cos(landed/45):1;
   ctx.save();ctx.translate(x+w/2,y+h/2);ctx.rotate(tg.rot*e);ctx.scale(slam,slam);
   ctx.shadowColor='#000c';ctx.shadowBlur=18*e;ctx.shadowOffsetY=10*e;
   ctx.drawImage(state.frozen,(sx-V.x)*fw,(sy-V.y)*fh,G.cw*fw,G.ch*fh,-w/2,-h/2,w,h);ctx.shadowColor='transparent';
   if(landed>=0){if(art.nail){const nw=w*.11,nh=nw*(art.nail.naturalHeight/art.nail.naturalWidth);ctx.drawImage(art.nail,-nw/2,-h/2-nh*.3,nw,nh);}else{ctx.fillStyle='#3a3a3a';ctx.beginPath();ctx.arc(0,-h/2+8,6,0,Math.PI*2);ctx.fill();}}
   ctx.restore();
   if(landed>=0){fire('nail'+i,()=>{sfx('impactw',.8,i===2?.8:.95,(c-2.5)/3.5);kick(i===2?3.2:1.6);});
    // a puff of dust off the wall
    if(landed<260&&!reduced){const k=landed/260,rad=w*(.35+.5*k);ctx.save();ctx.globalAlpha=.28*(1-k);const g=ctx.createRadialGradient(x+w/2,y+h*.9,0,x+w/2,y+h*.9,rad);g.addColorStop(0,'rgba(190,160,120,.8)');g.addColorStop(1,'rgba(190,160,120,0)');ctx.fillStyle=g;ctx.fillRect(x+w/2-rad,y+h*.9-rad,rad*2,rad*2);ctx.restore();}}
  });
  // 3. the bloody hand
  if(t>=B.hand){const p=clamp((t-B.hand)/140),s=1.5-.5*out(p),hw=F.w*.24,hh=art.hand?hw*art.hand.naturalHeight/art.hand.naturalWidth:hw*1.2,hx=F.x+F.w*.38,hy=F.y+F.h*.30;
   fire('hand',()=>{sfx('slam',.65,.8);kick(1.4);});
   ctx.save();ctx.globalAlpha=out(p);ctx.translate(hx,hy);ctx.rotate(-.22);ctx.scale(s,s);
   if(art.hand)ctx.drawImage(art.hand,-hw/2,-hh/2,hw,hh);else{ctx.fillStyle='#7a0e0e';ctx.beginPath();ctx.ellipse(0,0,hw*.3,hh*.28,0,0,Math.PI*2);ctx.fill();}
   ctx.restore();
   // fresh blood running down from it
   if(!reduced){const run=clamp((t-B.hand-120)/900);ctx.save();ctx.strokeStyle='rgba(120,6,10,.9)';ctx.lineCap='round';
    for(let d=0;d<4;d++){const dx=hx-hw*.28+hw*.17*d+(hash(d+7)-.5)*hw*.06,len=hh*(.35+.45*hash(d+3))*out(run*(.7+.3*hash(d+11)));ctx.lineWidth=2.4+hash(d)*1.6;ctx.beginPath();ctx.moveTo(dx,hy+hh*.12);ctx.lineTo(dx,hy+hh*.12+len);ctx.stroke();ctx.fillStyle='rgba(140,8,12,.95)';ctx.beginPath();ctx.arc(dx,hy+hh*.12+len,ctx.lineWidth*.9,0,Math.PI*2);ctx.fill();}
    ctx.restore();}
  }
  // 4. BLOOD MONEY, stamped over the posters
  if(t>=B.stamp){const p=clamp((t-B.stamp)/160),s=2.2-1.2*out(p),sw=F.w*.66,sh=art.stamp?sw*art.stamp.naturalHeight/art.stamp.naturalWidth:sw*.36,sx=F.x+F.w*.5,sy=F.y+F.h*.40;
   fire('stamp',()=>{sfx('stamp',1,.92);kick(2.8);state.spatter=Array.from({length:22},(_,i)=>[hash(i*3)*2*Math.PI,.15+.85*hash(i*3+1),2+4*hash(i*3+2)]);});
   ctx.save();ctx.globalAlpha=Math.min(1,p*1.6);ctx.translate(sx,sy);ctx.rotate(-.10+.05*out(p));ctx.scale(s,s);
   if(art.stamp)ctx.drawImage(art.stamp,-sw/2,-sh/2,sw,sh);else{ctx.font=`700 ${sw*.22}px Western,Georgia,serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#b81212';ctx.fillText('BLOOD MONEY',0,0,sw);}
   ctx.restore();
   if(state.spatter&&!reduced){const k=clamp((t-B.stamp)/380);ctx.save();ctx.fillStyle=`rgba(140,10,12,${.9*(1-k*.4)})`;for(const [a,d,r] of state.spatter){const rr=sw*.55*d*out(k);ctx.beginPath();ctx.arc(sx+Math.cos(a)*rr,sy+Math.sin(a)*rr*.5,r*(1-k*.3),0,Math.PI*2);ctx.fill();}ctx.restore();}
  }
  // 5. the contract slides in with the award
  if(t>=B.contract){const p=clamp((t-B.contract)/380),cw=Math.min(230,F.w*.2),ch=art.contract?cw*art.contract.naturalHeight/art.contract.naturalWidth:cw*1.3,cx=F.x+F.w*.5,cy=F.y+F.h*.80+(1-back(p))*F.h*.6;
   fire('contract',()=>sfx('click',.7,.9));
   ctx.save();ctx.translate(cx,cy);ctx.rotate(.02);ctx.shadowColor='#000c';ctx.shadowBlur=16;ctx.shadowOffsetY=8;
   if(art.contract)ctx.drawImage(art.contract,-cw/2,-ch/2,cw,ch);else{ctx.fillStyle='#d9c59a';ctx.fillRect(-cw/2,-ch/2,cw,ch);}
   ctx.shadowColor='transparent';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#2a1a10';
   ctx.font=`700 ${cw*.2}px Western,Georgia,serif`;ctx.fillText(String(state.spins),0,-ch*.02,cw*.8);
   ctx.font=`700 ${cw*.085}px Western,Georgia,serif`;ctx.fillText('FREE SPINS',0,ch*.13,cw*.8);
   ctx.restore();
  }
  ctx.restore();return true;
 }
 return {begin,draw,elapsed,pause,resume,end,get ready(){return ready();},get active(){return !!state;},get state(){return state;}};
}
