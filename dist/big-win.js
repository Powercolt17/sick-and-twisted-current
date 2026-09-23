// Existing illustrated panels, directed by the payout coordinator's one clock.
// This module has no accounting, timers, randomness or game-state mutations.
import {createHorseGallop,HORSE_BEATS,horseScenePose} from './horse-gallop.js?v=2';
export const WIN_TIERS=Object.freeze({big:20,brutal:100,massacre:500,unholy:2000});
export const BIG_WIN_ASSETS=Object.freeze({
 gunman:'assets/bonus/main.webp',eyes:'assets/bonus/eyes.webp',safe:'assets/bonus/safe.webp',
 eclipse:'assets/bonus-hang/hh-main.webp',deadEyes:'assets/bonus-hang/hh-eyes.webp',
 gallows:'assets/bonus-hang/hh-boots.webp',feather:'assets/bonus-hang/hh-feather1.webp',
 horse:'assets/big-win/gallop-source.png',skid:'assets/big-win/skid-source.png'
});
const clamp=v=>Math.max(0,Math.min(1,v));
const smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
const out=v=>1-(1-clamp(v))**3;
const titles=['','BIG WIN','BRUTAL WIN','MASSACRE','UNHOLY WIN'];
export function bigWinTier(value,stake,roundReturn=value){
 if(!(stake>0)||Math.round(roundReturn*100)<=Math.round(stake*100))return 0;
 const cents=Math.round(value*100),cost=Math.round(stake*100);
 return cents>=cost*2000?4:cents>=cost*500?3:cents>=cost*100?2:cents>=cost*20?1:0;
}
export function bigWinProfile(tier,{cascade=false,reduced=false}={}){
 if(!tier)return null;
 if(cascade)return {tier,title:titles[tier],cascade:true,amountAt:320,landAt:320,
  count:0,hold:[0,740,900,1050,1150][tier],endAt:320+[0,740,900,1050,1150][tier]+200};
 // The exact return hits on the plant. There is no rolling number competing
 // with the physical stop. Keep the existing direct-award credit deadline safe.
 const amountAt=HORSE_BEATS.land,count=0,hold=reduced?1160:[0,1340,1460,1620,1770][tier];
 return {tier,title:titles[tier],cascade:false,hardStop:true,preludeAt:HORSE_BEATS.start,
  skidAt:HORSE_BEATS.skid,landAt:HORSE_BEATS.land,titleAt:HORSE_BEATS.title,
  amountAt,count,hold,finishAt:amountAt,endAt:Math.max(2360,amountAt+hold+240)};
}
export function createBigWinArt({makeCanvas}={}){
 let assets={},loading=null;const horse=createHorseGallop({makeCanvas});
 const setAssets=value=>{assets=value;if(value.horse)horse.prepare(value.horse);if(value.skid)horse.prepareSkid(value.skid);};
 function load(){
  if(!loading)loading=Promise.all(Object.entries(BIG_WIN_ASSETS).map(async([name,path])=>{
   try{const image=new Image();image.src=path;await image.decode();return [name,image];}catch{return [name,null];}
  })).then(items=>setAssets(Object.fromEntries(items))).catch(error=>console.warn('Win panels unavailable; readable typographic finale retained.',error));
  return loading;
 }
 function panel(ctx,name,x,y,width,{dx=0,dy=0,angle=0,alpha=1}={}){
  const image=assets[name];if(!image||alpha<=0)return;
  const height=width*image.height/image.width;
  ctx.save();ctx.globalAlpha*=alpha;ctx.translate(x+width/2+dx,y+height/2+dy);ctx.rotate(angle);
  ctx.drawImage(image,-width/2,-height/2,width,height);ctx.restore();
 }
 // Functional text plate; the established typefaces and illustrated parchment
 // supply its texture. No generated symbols, coin rain or unrelated neon.
 function text(ctx,label,x,y,size,width,fill,stroke='#160d09',edge=2){
  ctx.font=`${size}px Outlaw`;const m=ctx.measureText(label);if(m.width>width){size*=width/m.width;ctx.font=`${size}px Outlaw`;}
  const metrics=ctx.measureText(label),baseline=y+(metrics.actualBoundingBoxAscent-metrics.actualBoundingBoxDescent)/2;
  ctx.lineJoin='round';ctx.strokeStyle=stroke;ctx.lineWidth=edge*2;if(edge)ctx.strokeText(label,x,baseline);
  ctx.fillStyle=fill;ctx.fillText(label,x,baseline);
 }
 function band(ctx,G,y,height,opacity){
  const x=G.x+G.w*.015,w=G.w*.97,g=ctx.createLinearGradient(x,0,x+w,0);
  g.addColorStop(0,'rgba(9,6,4,0)');g.addColorStop(.13,`rgba(9,6,4,${opacity})`);
  g.addColorStop(.87,`rgba(9,6,4,${opacity})`);g.addColorStop(1,'rgba(9,6,4,0)');ctx.fillStyle=g;ctx.fillRect(x,y,w,height);
 }
 function inkPlate(ctx,x,y,w,h){
  ctx.save();ctx.translate(x,y);ctx.fillStyle='#0b0806';ctx.beginPath();
  ctx.moveTo(-w*.52,-h*.37);ctx.lineTo(-w*.43,-h*.51);ctx.lineTo(w*.46,-h*.47);
  ctx.lineTo(w*.51,-h*.29);ctx.lineTo(w*.48,h*.19);ctx.lineTo(w*.52,h*.34);
  ctx.lineTo(w*.37,h*.49);ctx.lineTo(-w*.49,h*.45);ctx.closePath();ctx.fill();
  ctx.fillStyle='#20150f';for(let i=0;i<22;i++)ctx.fillRect(-w*.5+(i*.119%1)*w,(i%2?1:-1)*h*.42,w*.025,1.4);
  ctx.restore();
 }
 function drawDust(ctx,x,ground,unit,t,tier){
  const age=t-HORSE_BEATS.skid;if(age<0||age>1050)return;
  const u=age/1050,spread=1-(1-u)**3,fade=(1-u)**1.7;
  ctx.save();
  for(let i=0;i<18;i++){
   const h=(Math.sin(i*78.233+7)*43758.54)%1,seed=h-Math.floor(h);
   const direction=i%2?1:-1,dx=direction*(25+seed*245)*spread*unit;
   const dy=-(8+seed*63)*Math.sin(spread*Math.PI*.75)*unit,r=(13+seed*36)*(1+spread*.9)*unit;
   const g=ctx.createRadialGradient(x+dx,ground+dy,0,x+dx,ground+dy,r);
   g.addColorStop(0,`rgba(158,125,85,${fade*(.12+tier*.014)})`);g.addColorStop(1,'rgba(80,56,37,0)');
   ctx.fillStyle=g;ctx.fillRect(x+dx-r,ground+dy-r,r*2,r*2);
  }
  for(let i=0;i<70;i++){
   const seed=(i*.61803398875)%1,a=(i*.41421356237)%1;
   const px=x+(seed-.5)*700*spread*unit,py=ground-(14+a*60)*Math.sin(spread*Math.PI)+90*u*u;
   ctx.globalAlpha=fade*(.18+a*.30);ctx.fillStyle=i%3?'#76604a':'#c1a782';
   ctx.fillRect(px,py,(1+a*2.5)*unit,(1+seed)*unit);
  }
  ctx.restore();
 }
 function draw(ctx,G,state,t,reduced=false){
  const p=state.profile;if(!p)return false;
  const fade=1-smooth((t-p.endAt+220)/220);if(fade<=0)return true;
  const unit=G.w/720,cx=G.x+G.w/2,baseY=G.y+G.h*.535;
  ctx.save();ctx.textAlign='center';ctx.textBaseline='alphabetic';ctx.globalAlpha=fade;
  if(p.cascade){
   if(t<p.amountAt){ctx.restore();return true;}
   const u=t-p.amountAt,enter=reduced?1:out(u/110),kick=reduced?0:Math.exp(-u/62)*Math.sin(u/39);
   ctx.globalAlpha*=smooth(u/65);band(ctx,G,baseY-G.h*.18,G.h*.42,.88);
   ctx.save();ctx.translate(cx,baseY);ctx.scale(1+.045*kick,1+.045*kick);
   text(ctx,state.value.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}),0,0,G.h*.197,G.w*.86,'#f2e4c7','#100a07',3.3*unit);ctx.restore();
   text(ctx,p.title,cx,baseY-G.h*.13-7*(1-enter)*unit,26*unit,G.w*.8,'#d5aa88','#1b0c08',1.5*unit);
   text(ctx,`${state.ways.toLocaleString('en-US')} TOTAL WAYS`,cx,baseY+G.h*.125,23*unit,G.w*.8,'#e9d9b9','#130b07',1.5*unit);
   // A separate, fixed readout identifies accumulated return, not net profit.
   text(ctx,`ROUND RETURN  $${state.roundReturn.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}`,cx,G.y+G.h*.89,19*unit,G.w*.9,'#e9d9b9','#100906',2*unit);
   ctx.restore();return true;
  }
  const large=p.tier>=2,assetName=p.tier>=3?'eclipse':'gunman',hasArt=large&&!!assets[assetName];
  const enter=reduced?1:out((t-100)/260),land=reduced?0:Math.exp(-Math.max(0,t-p.landAt)/78)*Math.sin(Math.max(0,t-p.landAt)/24);
  ctx.save();ctx.globalAlpha*=smooth(t/160);ctx.fillStyle=`rgba(7,5,4,${large?.82:.68})`;ctx.fillRect(0,0,G.x+G.w+245*unit,G.y+G.h+7*unit);ctx.restore();
  if(horse.ready){
   const pose=horseScenePose(t,{reduced}),stageW=G.x+G.w+245*unit;
   const horseW=pose.width*unit,hx=pose.x*unit,ground=445*unit;
   // A continuous approach resolves into a six-pose braking action. The
   // register/plant moment belongs to the same clock as the exact amount.
   ctx.save();ctx.beginPath();ctx.rect(0,0,stageW,G.y+G.h+18*unit);ctx.clip();
   const impact=reduced?0:Math.max(0,t-HORSE_BEATS.land);
   const strike=reduced||t<HORSE_BEATS.land?0:Math.exp(-impact/90);
   ctx.translate(-Math.sin(impact/19)*strike*7*unit,Math.sin(impact/23)*strike*3*unit);
   if(!reduced){
    // Dust stays at hoof height and spreads from the braking contact. Seeded
    // grit has no randomness in the timeline and never covers the return.
    drawDust(ctx,hx+horseW*.49,ground,unit,t,p.tier);
   }
   ctx.globalAlpha*=pose.alpha;
   if(pose.phase==='gallop')horse.draw(ctx,pose.motionTime,hx,ground-horseW*.655,horseW);
   else if(!horse.drawSkid(ctx,pose.motionTime,hx,ground,horseW))horse.draw(ctx,0,hx,ground-horseW*.655,horseW,{still:true});
   ctx.restore();
   const titleX=925*unit,titleY=185*unit;
   if(t>=p.titleAt){
    const age=t-p.titleAt,a=reduced?1:out(age/145),angle=reduced?-.025:(-.12*(1-a)-.025);
    ctx.save();ctx.globalAlpha*=a;ctx.translate(titleX,titleY+(1-a)*-45*unit);ctx.rotate(angle);
    const words=p.title==='MASSACRE'?['MASSACRE']:p.title.split(' '),two=words.length===2;
    ctx.scale(1+(1-a)*.28,1+(1-a)*.28);
    for(let i=0;i<words.length;i++){
     const y=two?(i-.5)*82*unit:0,size=(two?86:65)*unit;
     text(ctx,words[i],0,y,size,470*unit,'#160b07','#0b0806',8*unit);
     text(ctx,words[i],0,y,size,470*unit,p.tier>=3?'#9d2419':'#ecddbd','#e1c59f',p.tier>=3?2.5*unit:0);
    }
    ctx.restore();
   }
   if(t>=p.amountAt){
    const age=t-p.amountAt,enter=reduced?1:out(age/100),stamp=reduced?0:Math.exp(-age/82)*Math.cos(age/38);
    // One full-width ink plate lands under the horse. The exact return is
    // readable immediately and its final state never changes size or position.
    ctx.save();ctx.globalAlpha*=enter;ctx.translate(cx,463*unit);
    ctx.scale(1+.16*stamp,1-.06*stamp);inkPlate(ctx,0,0,1040*unit,143*unit);
    text(ctx,'$'+state.value.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}),0,-2*unit,114*unit,1010*unit,'#f0e1c2','#120b07',4.5*unit);ctx.restore();
    ctx.save();ctx.globalAlpha*=reduced?1:smooth((age-130)/110);
    text(ctx,state.summaryOnly?'ROUND RETURN':'WIN RETURN',cx,555*unit,22*unit,800*unit,'#d8c4a4','#0b0705',2*unit);
    text(ctx,`${(state.value/state.stake).toLocaleString('en-US',{maximumFractionDigits:2})}× STAKE`,cx,585*unit,23*unit,800*unit,'#edddbd','#0b0705',2*unit);ctx.restore();
   }
   ctx.restore();return true;
  }
  if(hasArt){
   // Panels move as intact drawings. Faces and figures never mesh-warp.
   const mainX=G.x-88*unit,mainY=G.y-112*unit,mainW=810*unit;
   if(p.tier>=2)panel(ctx,p.tier>=3?'gallows':'safe',G.x+G.w*.75,G.y+40*unit,244*unit,{dx:(1-enter)*75*unit,angle:(1-enter)*.035,alpha:enter});
   panel(ctx,assetName,mainX,mainY,mainW,{dx:-(1-enter)*90*unit,dy:land*3*unit,angle:-(1-enter)*.025,alpha:enter});
   const eyeEnter=reduced?1:out((t-p.preludeAt)/180);
   panel(ctx,p.tier>=3?'deadEyes':'eyes',G.x+G.w*.60,G.y-57*unit,345*unit,{dx:(1-eyeEnter)*95*unit,alpha:eyeEnter});
   if(p.tier===4&&!reduced){
    // Two existing illustrated feathers; no full-screen particle spray.
    const f=clamp((t-p.landAt)/1100);
    for(let i=0;i<2;i++)panel(ctx,'feather',G.x+(38+i*642)*unit,G.y+(205+i*70+f*90)*unit,(37+i*10)*unit,{dx:(i?1:-1)*f*32*unit,angle:(i?-.25:.4)+f*.3,alpha:enter*(1-smooth((f-.65)/.35))});
   }
  }else{
   panel(ctx,p.tier>=3?'deadEyes':'eyes',cx-177*unit,G.y+14*unit,354*unit,{dx:(1-enter)*36*unit,alpha:enter});
   band(ctx,G,baseY-105*unit,267*unit,.95);
  }
  const tx=hasArt?G.x+G.w*.608:cx,ty=hasArt?G.y+G.h*.68:baseY;
  const maxWidth=hasArt?G.w*.67:G.w*.88;
  if(t>=p.titleAt){
   const a=reduced?1:out((t-p.titleAt)/140),scale=reduced?1:1+.09*(1-a);
   ctx.save();ctx.globalAlpha*=a;ctx.translate(tx,ty-83*unit);ctx.scale(scale,scale);
   text(ctx,p.title,0,0,(p.tier===4?50:47)*unit,maxWidth,hasArt?'#770f0b':'#e9d5b0',hasArt?'#eed6ac':'#1a0c08',hasArt?1.3*unit:2*unit);ctx.restore();
  }
  if(t>=p.amountAt){
   const u=t-p.amountAt,progress=reduced||!p.count?1:smooth(u/p.count),v=progress>=1?state.value:Math.min(state.value-.01,Math.floor(state.value*progress*100)/100);
   const complete=t>=p.finishAt,stamp=reduced||!complete?0:Math.exp(-(t-p.finishAt)/70)*Math.sin((t-p.finishAt)/32);
   ctx.save();ctx.globalAlpha*=smooth(u/70);ctx.translate(tx,ty);ctx.scale(1+.028*stamp,1+.028*stamp);
   text(ctx,'$'+v.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}),0,0,(hasArt?85:97)*unit,maxWidth,hasArt?'#19100a':'#f3e5c8',hasArt?'#ebd8b2':'#130c08',hasArt?.8*unit:3*unit);ctx.restore();
   text(ctx,state.summaryOnly?'ROUND RETURN':'WIN RETURN',tx,ty+57*unit,22*unit,maxWidth,hasArt?'#342015':'#e6d5b5',hasArt?'#ead6b0':'#130c08',hasArt?0:1.5*unit);
   if(complete){
    const ratio=state.value/state.stake;
    text(ctx,`${ratio.toLocaleString('en-US',{maximumFractionDigits:2})}× STAKE`,tx,ty+113*unit,21*unit,maxWidth,'#efdec1','#120a07',2.2*unit);
   }
  }
  ctx.restore();return true;
 }
 return {load,setAssets,draw,get mounted(){return horse.ready;},get ready(){return !!assets.gunman&&!!assets.eclipse;}};
}
