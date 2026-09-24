import {drawAnnouncement} from './announce.js?v=1';
// One clock owns the complete draw, gunshots, tile conversion and clean return.
// Targets are supplied by the selected mathematical outcome, never by artwork.
import {gunslingerTimeline} from './gunslinger-motion.js?v=2';
const ease=v=>{v=Math.max(0,Math.min(1,v));return v*v*(3-2*v)};
export function wildShotTimeline(targets,{mark=false}={}){
 if(!Array.isArray(targets)||targets.length<(mark?3:2)||targets.length>(mark?24:4))throw new RangeError(mark?'Expected 3–24 marked targets':'Expected 2–4 wild targets');
 const seen=new Set();
 for(const p of targets){if(!Array.isArray(p)||p.length!==2||!p.every(Number.isInteger)||p[0]<0||p[0]>5||p[1]<0||p[1]>3||seen.has(p.join(':')))throw new RangeError('Invalid wild target');seen.add(p.join(':'));}
 if(mark){
  const timeline=gunslingerTimeline([targets[0]]),shot=.88,lowerAt=shot+.32,lowerDuration=.25,restAt=lowerAt+lowerDuration;
  return {...timeline,targets:targets.map(p=>[...p]),shots:[shot],lowerAt,lowerDelay:lowerAt-shot,lowerDuration,restAt,end:restAt+.08,
   recoilAttack:.035,recoilHold:.045,recoilRecovery:.22,recoilWeight:1.7};
 }
 return gunslingerTimeline(targets);
}

// Every visual uses the conversion clock, including tab pauses and Turbo.
// Stagger acquisition only; the complete marked group still converts at once.
export function markPresentationAt(t,run,index=0,reduced=false){
 const shot=run.shots[0],enter=ease((t-.06-Math.min(index*.026,.18))/.28);
 const leave=ease((t-run.end+.18)/.18),lock=ease((t-.48)/.20);
 return {
  titleAlpha:ease(t/.16)*(1-leave),
  titleY:reduced?0:3*(1-ease(t/.16)),
  focusAlpha:(reduced?.07:.17)*ease(t/.3)*(1-ease((t-shot-.22)/.36)),
  reticleAlpha:enter*(1-ease((t-shot-run.impactDelay)/.085)),
  reticleScale:reduced?1:1+.32*(1-enter)-.07*lock,
  trace:reduced?1:enter,
 };
}
export function createWildShots({G,figureEffect,reduced=false,onCue=()=>{},onConvert=()=>{},makeCanvas=()=>document.createElement('canvas')}){
 let run=null,assets={},loading=null;
 function setAssets(images){
  assets={...images};if(!images.smoke)return;
  // Prepare once, never allocate a canvas during a shot. Retain the engraved
  // smoke curls, darken their chalk tone for parchment, and feather the cut.
  const cut=makeCanvas(),source=images.smoke;cut.width=Math.ceil(source.width*.66);cut.height=source.height;
  const c=cut.getContext('2d');c.drawImage(source,0,0);c.drawImage(source,0,0);
  c.globalCompositeOperation='source-atop';c.fillStyle='rgba(40,34,28,.54)';c.fillRect(0,0,cut.width,cut.height);
  c.globalCompositeOperation='destination-in';const mask=c.createLinearGradient(0,0,cut.width,0);mask.addColorStop(0,'#000');mask.addColorStop(.68,'#000');mask.addColorStop(1,'transparent');c.fillStyle=mask;c.fillRect(0,0,cut.width,cut.height);
  assets.smoke=cut;
 }
 function load(){
  if(!loading)loading=Promise.all(['flash','smoke'].map(async key=>{const im=new Image();im.src=`assets/bonus/${key}.webp`;await im.decode();return [key,im];})).then(entries=>setAssets(Object.fromEntries(entries))).catch(e=>{loading=null;console.warn('Tile impact art unavailable; compact light fallback enabled.',e);});
  return loading;
 }
 function elapsed(now){return run?((run.pausedAt??now)-run.start-run.pausedMs)/1000*run.speed:0;}
 function begin(targets,now,speed=1,{mark=null}={}){
  clear();const timeline=wildShotTimeline(targets,{mark:!!mark});
  run={...timeline,targetMask:new Set(targets.map(([c,r])=>c*4+r)),mark,start:now,lastNow:now,speed,pausedMs:0,pausedAt:null,drawn:false,fired:0,impacted:0,converted:0};
  figureEffect?.startCells(timeline);return timeline;
 }
 function setPaused(paused,now){if(!run)return;if(paused&&run.pausedAt===null)run.pausedAt=now;else if(!paused&&run.pausedAt!==null){run.pausedMs+=now-run.pausedAt;run.pausedAt=null;run.lastNow=now;}}
 function advance(now){
  if(!run||run.pausedAt!==null)return;
  // A stalled foreground frame extends this short presentation instead of
  // playing several gunshots together and jumping straight to four wilds.
  if(now-run.lastNow>50)run.start+=now-run.lastNow-50;run.lastNow=now;
  const t=elapsed(now);
  if(!run.drawn){run.drawn=true;onCue({type:'draw',at:0});}
  while(run.fired<run.shots.length&&t>=run.shots[run.fired]){const i=run.fired++;onCue({type:'shot',index:i,cell:run.targets[i],at:run.shots[i]});}
  if(run.mark){
   if(!run.impacted&&t>=run.shots[0]+run.impactDelay){run.impacted=run.targets.length;onCue({type:'impact',index:0,cell:run.targets[0],at:run.shots[0]+run.impactDelay});}
   if(!run.converted&&t>=run.shots[0]+run.revealDelay){run.converted=run.targets.length;run.targets.forEach((cell,i)=>onConvert(cell,i));onCue({type:'reveal',index:0,cell:run.targets[0],at:run.shots[0]+run.revealDelay});}
  }else{
   while(run.impacted<run.shots.length&&t>=run.shots[run.impacted]+run.impactDelay){const i=run.impacted++;onCue({type:'impact',index:i,cell:run.targets[i],at:run.shots[i]+run.impactDelay});}
   while(run.converted<run.shots.length&&t>=run.shots[run.converted]+run.revealDelay){const i=run.converted++;onConvert(run.targets[i],i);}
  }
 }
 function finished(now){return !!run&&run.converted===run.targets.length&&elapsed(now)>=run.end;}
 function drawFigure(ctx,now,motion=true){
  if(!run)return false;
  if(reduced)return figureEffect?.idle(ctx,now,false)||false;
  if(!figureEffect?.assets.json)return false;
  figureEffect.figure(ctx,elapsed(now),1,now,motion);return true;
 }
 function drawBoard(ctx,now,drawSprite){
  if(!run)return;const t=elapsed(now);
  if(run.mark){
   const visual=markPresentationAt(t,run,0,reduced);
   // Quiet the unmarked cells before the shot, then release the focus gently.
   ctx.save();ctx.fillStyle='rgba(9,7,4,'+visual.focusAlpha+')';
   for(let c=0;c<6;c++)for(let r=0;r<4;r++)if(!run.targetMask.has(c*4+r))ctx.fillRect(G.x+c*G.cw,G.y+r*G.ch,G.cw,G.ch);
   ctx.restore();
   // Letter directly onto the lower timber: logo and paying cells stay clear.
   // Text and its ink outline share one fade, so there is no empty panel tail.
   ctx.save();ctx.globalAlpha=visual.titleAlpha;ctx.translate(0,visual.titleY);
   // Same announcement look as the Blood Money reward, compact enough to sit on the lower timber.
   drawAnnouncement(ctx,{x:G.x+G.w/2,y:G.y+G.h+27,width:300,eyebrow:'OUTLAW’S MARK',lead:String(run.targets.length),headline:run.targets.length===1?'WILD':'WILDS',maxWidth:G.w-44});ctx.restore();
   for(let i=0;i<run.targets.length;i++){
    const v=markPresentationAt(t,run,i,reduced);if(v.reticleAlpha<=0)continue;
    const [c,r]=run.targets[i],x=G.x+(c+.5)*G.cw,y=G.y+(r+.5)*G.ch,radius=Math.min(G.cw,G.ch)*.28*v.reticleScale;
    ctx.save();ctx.globalAlpha=v.reticleAlpha;ctx.lineCap='round';ctx.beginPath();
    // Four inked quadrants close into a stable sight; no perpetual spinning.
    for(let q=0;q<4;q++){
     const a=q*Math.PI/2+.13,b=a+(Math.PI/2-.26)*v.trace;
     ctx.moveTo(x+Math.cos(a)*radius,y+Math.sin(a)*radius);ctx.arc(x,y,radius,a,b);
     const dx=Math.cos(q*Math.PI/2),dy=Math.sin(q*Math.PI/2);
     ctx.moveTo(x+dx*radius*.78,y+dy*radius*.78);ctx.lineTo(x+dx*radius*1.30,y+dy*radius*1.30);
    }
    ctx.strokeStyle='rgba(39,13,7,.72)';ctx.lineWidth=5;ctx.stroke();
    ctx.strokeStyle='#e85b3c';ctx.lineWidth=2.4;ctx.stroke();ctx.restore();
   }
  }else{
   const last=run.shots.at(-1),dim=.13*ease((t-run.shots[0])/.045)*(1-ease((t-last-.13)/.19));
   if(dim>0){
    ctx.save();ctx.fillStyle='rgba(9,7,4,'+dim+')';
    for(let c=0;c<6;c++)for(let r=0;r<4;r++)if(!run.targets.some((p,i)=>i<run.impacted&&p[0]===c&&p[1]===r))ctx.fillRect(G.x+c*G.cw,G.y+r*G.ch,G.cw,G.ch);
    ctx.restore();
   }
  }
  for(let i=0;i<run.impacted;i++){
   const age=t-run.shots[run.mark?0:i]-run.impactDelay,life=run.mark?.48:.29;if(age<0||age>life)continue;
   const [c,r]=run.targets[i],x=G.x+c*G.cw,y=G.y+r*G.ch,w=G.cw,h=G.ch;
   ctx.save();ctx.beginPath();ctx.rect(x+2,y+2,w-4,h-4);ctx.clip();
   const revealAge=t-run.shots[run.mark?0:i]-run.revealDelay,settle=run.mark?.22:.15;
   if(run.mark&&!reduced&&age<.34){
    // Keep the source tile under a growing powder wipe. The authoritative
    // board changes once; its visual reveal is continuous across that frame.
    drawSprite(run.mark,x,y,w,h);
    if(i<run.converted&&revealAge>=0){
     const reveal=ease(revealAge/.22),radius=Math.hypot(w,h)*.55*reveal;
     ctx.save();ctx.beginPath();ctx.arc(x+w/2,y+h/2,radius,0,Math.PI*2);ctx.clip();
     const stamp=1+.075*Math.sin(Math.PI*ease(revealAge/.30))**2;
     drawSprite('boxedwild',x+w*(1-stamp)/2,y+h*(1-stamp)/2,w*stamp,h*stamp);ctx.restore();
    }
   }else if(!run.mark&&!reduced&&i<run.converted&&revealAge>=0&&revealAge<settle){
    const load=Math.sin(Math.min(1,revealAge/settle)*Math.PI)*Math.exp(-revealAge*14),scale=1-(run.mark?.045:.065)*load;
    ctx.fillStyle='#110d08';ctx.fillRect(x+2,y+2,w-4,h-4);
    // A compact depth hit inside the original tile; the complete approved
    // boxed-wild silhouette returns after settling with no frame left behind.
    drawSprite('boxedwild',x+w*(1-scale)/2,y+h*(1-scale)/2,w*scale,h*scale);
   }
   if(!reduced){
    const cx=x+w*.50,cy=y+h*.46,turn=(i%2?1:-1)*.17;
    // Reuse the feature's engraved blast, with its original aspect ratio.
    // Contact precedes conversion by 73 ms; smoke bridges the change of tile.
    const flashLife=run.mark?.095:.075;
    if(age<flashLife){
     const alpha=1-ease(Math.max(0,age-.018)/(flashLife-.018)),size=w*(.57+.26*ease(age/.032));
     ctx.save();ctx.translate(cx,cy);ctx.rotate(turn);ctx.globalAlpha=alpha;
     if(assets.flash){const ah=size*assets.flash.height/assets.flash.width;ctx.drawImage(assets.flash,-size/2,-ah/2,size,ah);}
     else{const light=ctx.createRadialGradient(0,0,0,0,0,size/2);light.addColorStop(0,'#ffefd0');light.addColorStop(.22,'rgba(255,230,179,.75)');light.addColorStop(1,'rgba(239,201,142,0)');ctx.fillStyle=light;ctx.fillRect(-size/2,-size/2,size,size);}
     ctx.restore();
    }
    const smokeLife=run.mark?.42:.27;
    if(assets.smoke&&age<smokeLife){
     // The left of this approved cut is smoke; exclude its bright muzzle core.
     const alpha=.86*ease(age/.022)*(1-ease(Math.max(0,age-.045)/(smokeLife-.045))),size=w*((run.mark?.60:.35)+(run.mark?.32:.22)*ease(age/(smokeLife-.03))),sw=assets.smoke.width,sh=assets.smoke.height,ah=size*sh/sw;
     ctx.save();ctx.globalAlpha=alpha;ctx.translate(cx-w*.035,cy-h*.11*ease(age/smokeLife));ctx.rotate(turn-age*.16);
     ctx.drawImage(assets.smoke,0,0,sw,sh,-size/2,-ah/2,size,ah);ctx.restore();
    }
   }
   ctx.restore();ctx.save();
   const light=(1-ease(age/life))*(reduced?.25:.95);
   ctx.strokeStyle=`rgba(245,224,180,${light})`;ctx.lineWidth=2.6;
   ctx.strokeRect(x+3.5,y+3.5,w-7,h-7);
   if(!reduced&&age<.19){
    ctx.beginPath();ctx.rect(x+3,y+3,w-6,h-6);ctx.clip();
    const alpha=1-ease(age/.19);ctx.globalAlpha=alpha;
    for(let k=0;k<7;k++){
     const a=k*2.399+i*.7,v=4+k%4*5+age*(70+k*17),px=x+w*.5+Math.cos(a)*v,py=y+h*.46+Math.sin(a)*v;
     ctx.strokeStyle=k%3?'#f0d8a5':'#100d08';ctx.lineWidth=k%2?1:1.6;ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px+Math.cos(a)*(2+k%3),py+Math.sin(a)*(2+k%3));ctx.stroke();
    }
   }
   ctx.restore();
  }
 }
 function clear(){run=null;figureEffect?.end();}
 return {load,setAssets,begin,advance,elapsed,setPaused,finished,drawFigure,drawBoard,clear,get active(){return !!run},get state(){return run}};
}

// Approved boxed-wild artwork: preserve its complete border, lettering and
// texture. Fit proportionally into the same cell canvas as the symbol atlas.
export function createBoxWildTile(source,makeCanvas=()=>document.createElement('canvas')){
 const tile=makeCanvas();tile.width=360;tile.height=356;const c=tile.getContext('2d');
 c.fillStyle='#0c0907';c.fillRect(0,0,360,356);
 const scale=Math.min(360/source.width,356/source.height),w=source.width*scale,h=source.height*scale;
 c.drawImage(source,(360-w)/2,(356-h)/2,w,h);return tile;
}

