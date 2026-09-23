import {BLOOD_LADDER} from './blood-bounty.js?v=82';
import {OUTLAW_NAMES} from './blood-outlaws.js?v=91art';
const IVORY='#efe1bf',MUTED='#55432f',RED='#8e1f18',INK='#24180e',BRASS='#c9b48a',PLATE='#2a1a10',BRASS_EDGE='#b8905a',SCORCH='#2a1408';
const clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>1-(1-clamp(x))**3;
const dollars=n=>'$'+n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
export const CONTRACT={width:380,height:760,stampY:556,stampGap:96};   // stampY/gap match the inked circles drawn by marks() in hero()
export const CONTRACT_SURFACE='assets/ink-western/poster-knife.webp';
// OpenArt-generated painted plates (assets/blood-plates), generated blank where the
// game prints live values: portrait, name, crime line, stamp count, next target,
// spins and reward. Static lettering (WANTED, labels, banners) is part of the plate.
export const PLATES=Object.freeze({
 poster:{src:'assets/blood-plates/poster.webp',width:1475,height:2647,
  bands:{portrait:[396,655,680,690],name:[186,1488,1100,120],crime:[186,1608,1100,64],count:[186,2038,1100,88],next:[366,2126,730,68],spins:[136,2335,570,180],reward:[756,2335,610,180]},
  stamps:{centers:[[336,1860],[736,1860],[1126,1860]],radius:130},painted:{}},
 card:{src:'assets/blood-plates/receipt-card.webp',width:857,height:1430,bands:{portrait:[146,321,565,695],name:[81,1086,720,140]},painted:{}},
 ledger:{src:'assets/blood-plates/receipt-ledger.webp',width:1694,height:1427,bands:{amount:[147,540,1350,420]},painted:{}}
});
export function contractStampPoint(box,index){return {x:box.x+(190+(index-1)*CONTRACT.stampGap)*box.w/380,y:box.y+CONTRACT.stampY*box.h/760};}

// One approved texture, the original outlaw artwork and live game values.
// All movement is presentational; only the bounty resolver awards progress.
export function createBloodContract(paper,{surface=null,getTile=null}={}){
 const {label}=paper;
 const surfaces=new Map();
 const plateImages={};
 if(typeof Image!=='undefined')for(const [key,def] of Object.entries(PLATES)){const im=new Image();im.decoding='async';im.src=def.src;im.addEventListener('load',()=>{plateImages[key+':src']=im;});}
 const plateReady=key=>!!plateImages[key+':src'];
 // Fit a plate inside a box (local units), preserving its aspect. Returns the pixel-to-local mapping.
 function drawPlate(ctx,key,x,y,w,h){const def=PLATES[key],im=plateImages[key+':src'];const scale=Math.min(w/def.width,h/def.height),dw=def.width*scale,dh=def.height*scale,dx=x+(w-dw)/2,dy=y+(h-dh)/2;
  ctx.save();ctx.shadowColor='#000b';ctx.shadowBlur=18;ctx.shadowOffsetY=8;ctx.drawImage(im,dx,dy,dw,dh);ctx.restore();return {def,dx,dy,scale};}
 const bandRect=(m,name)=>{const [bx,by,bw,bh]=m.def.bands[name];return {x:m.dx+bx*m.scale,y:m.dy+by*m.scale,w:bw*m.scale,h:bh*m.scale};};
 // Erase the painted lettering of one band by drawing the blank twin's pixels over it.
 function clearBand(){}
 // Bands are blank paper on these plates: every value is printed live.
 function liveBand(ctx,key,m,name,value,draw){if(value===undefined)return;draw(bandRect(m,name));}
 const rule=(ctx,y,left,right)=>{ctx.strokeStyle='#b9a17a55';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(right,y);ctx.stroke();};
 function text(ctx,value,x,y,size=22,color=MUTED,width=330,italic=false){ctx.save();if(italic){ctx.font='';}label(ctx,value,x,y,size,color,width,italic?'GeorgiaItalic':'Georgia');ctx.restore();}
 function title(ctx,value,x,y,size,width,color=IVORY){label(ctx,value,x,y,size,color,width,'Outlaw');}
 function slab(ctx,value,x,y,size,width,color=INK,bold=false){label(ctx,value,x,y,size,color,width,bold?'SlabBold':'Slab');}
 // brass rivet, plate, star rule: the hardware every sheet in the target look carries
 function rivet(ctx,x,y,r=5){const g=ctx.createRadialGradient(x-r*.35,y-r*.35,r*.1,x,y,r);g.addColorStop(0,'#e8cf96');g.addColorStop(.6,'#a5793f');g.addColorStop(1,'#4a3216');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,6.283);ctx.fill();ctx.strokeStyle='#1c1008';ctx.lineWidth=1;ctx.stroke();}
 function plate(ctx,x,y,w,h,{rivets=true}={}){ctx.fillStyle=PLATE;ctx.fillRect(x,y,w,h);ctx.strokeStyle=BRASS_EDGE;ctx.lineWidth=2;ctx.strokeRect(x+3,y+3,w-6,h-6);ctx.strokeStyle='#efe1bf33';ctx.lineWidth=1;ctx.strokeRect(x+7,y+7,w-14,h-14);if(rivets)for(const [rx,ry] of [[x+12,y+12],[x+w-12,y+12],[x+12,y+h-12],[x+w-12,y+h-12]])rivet(ctx,rx,ry,4.5);}
 function starRule(ctx,x,y,width,color=INK){ctx.save();ctx.strokeStyle=color;ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(x-width/2,y);ctx.lineTo(x-14,y);ctx.moveTo(x+14,y);ctx.lineTo(x+width/2,y);ctx.stroke();ctx.fillStyle=color;ctx.font='13px Georgia,serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('\u2605',x,y+1);ctx.restore();}
 function frame(ctx,x,y,w,h){ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.strokeRect(x-1.5,y-1.5,w+3,h+3);ctx.strokeStyle=INK;ctx.lineWidth=1;ctx.strokeRect(x-6.5,y-6.5,w+13,h+13);}
 function paintSurface(ctx,w,h){paper.sheet(ctx,0,0,w,h);
  // burnt edges: darken only where there is paper
  ctx.save();ctx.globalCompositeOperation='source-atop';const m=Math.min(w,h)*.11;
  for(const [x0,y0,x1,y1] of [[0,0,m,0],[w,0,w-m,0],[0,0,0,m],[0,h,0,h-m]]){const g=ctx.createLinearGradient(x0,y0,x1,y1);g.addColorStop(0,SCORCH+'d0');g.addColorStop(.35,SCORCH+'70');g.addColorStop(1,SCORCH+'00');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);}
  ctx.fillStyle='#8a5a2a14';ctx.fillRect(0,0,w,h);ctx.restore();}
 function base(ctx,w,h){
  ctx.save();ctx.shadowColor='#000b';ctx.shadowBlur=18;ctx.shadowOffsetY=8;
  if(surface){const key=w+':'+h;if(!surfaces.has(key)){const c=document.createElement('canvas');c.width=w;c.height=h;paintSurface(c.getContext('2d'),w,h);surfaces.set(key,c);}ctx.drawImage(surfaces.get(key),0,0,w,h);}
  else{ctx.fillStyle='#d5b87d';ctx.fillRect(0,0,w,h);}ctx.restore();
 }
 function picture(ctx,target,x,y,w,h,dead=false){
  const im=getTile?.(target,dead);if(im){const iw=im.width,ih=im.height,scale=Math.max(w/iw,h/ih),sw=w/scale,sh=h/scale;ctx.drawImage(im,(iw-sw)/2,(ih-sh)*.38,sw,sh,x,y,w,h);}
  else{ctx.fillStyle='#d3bd93';ctx.fillRect(x,y,w,h);paper.symbol?.(ctx,target,x,y,w,dead,h);}
 }
 function portrait(ctx,target,x,y,w,h,{turn=0,nextTarget=null,collected=false,shade=true}={}){
  ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();
  if(nextTarget&&turn>0){const p=ease(turn);picture(ctx,target,x-w*.12*p,y,w,h,collected);ctx.save();ctx.beginPath();ctx.rect(x+w*(1-p),y,w*p,h);ctx.clip();picture(ctx,nextTarget,x+w*.08*(1-p),y,w,h);ctx.restore();ctx.fillStyle='#dbb38c';ctx.globalAlpha=.5*Math.sin(p*Math.PI);ctx.fillRect(x+w*(1-p)-1,y,2,h);ctx.globalAlpha=1;}
  else picture(ctx,target,x,y,w,h,collected);
  if(shade){const g=ctx.createLinearGradient(0,y+h*.68,0,y+h);g.addColorStop(0,'#24180e00');g.addColorStop(1,'#24180ebd');ctx.fillStyle=g;ctx.fillRect(x,y,w,h);}
  ctx.restore();ctx.strokeStyle='#4b3420';ctx.lineWidth=2;ctx.strokeRect(x-.5,y-.5,w+1,h+1);
 }
 function marks(ctx,count,x,y,{width=58,height=58,gap=96,pulse=0,fontSize=22}={}){
  const r=Math.min(width,height)/2;
  for(let i=0;i<3;i++){
   const filled=i<count,hit=filled&&i===count-1?pulse:0,cx=x+(i-1)*gap;
   ctx.save();ctx.translate(cx,y+Math.sin(hit*Math.PI*3)*3*hit);ctx.rotate(filled?-.12+i*.06:0);ctx.scale(1+.16*hit,1+.16*hit);
   if(filled){ctx.fillStyle=RED;ctx.beginPath();ctx.arc(0,0,r,0,6.283);ctx.fill();ctx.strokeStyle='#efe1bfaa';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,r-5,0,6.283);ctx.stroke();ctx.strokeStyle=RED;ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,r+3,0,6.283);ctx.stroke();slab(ctx,'0'+(i+1),0,1,fontSize,r*1.6,IVORY);}
   else{ctx.setLineDash([5,4]);ctx.strokeStyle='#3a2a1b';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,r,0,6.283);ctx.stroke();ctx.setLineDash([]);slab(ctx,'0'+(i+1),0,1,fontSize-2,r*1.6,'#6b563d',true);}
   if(hit>0){ctx.globalAlpha=.4*hit;ctx.strokeStyle='#ead0aa';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,r+hit*10,0,6.283);ctx.stroke();}
   ctx.restore();
  }
 }
 function hero(ctx,state,opts={}){if(plateReady('poster'))return heroPlate(ctx,state,opts);return heroVector(ctx,state,opts);}
 function heroPlate(ctx,state,{x,y,w,h,remaining=8,total=0,boost=4,stampPulse=0,turn=0,nextTarget=null,collected=false,briefing=false}={}){
  const done=state.level===2&&state.stamps===3,target=BLOOD_LADDER[state.level],name=nextTarget&&ease(turn)>.5?nextTarget:target;
  ctx.save();ctx.translate(x,y+Math.sin(stampPulse*Math.PI)*1.5);ctx.scale(w/380,h/760);
  const m=drawPlate(ctx,'poster',-14,0,408,760),P=bandRect(m,'portrait');
  ctx.fillStyle=IVORY;ctx.fillRect(P.x,P.y,P.w,P.h);portrait(ctx,target,P.x,P.y,P.w,P.h,{turn,nextTarget,collected,shade:true});
  liveBand(ctx,'poster',m,'name',OUTLAW_NAMES[name],r=>slab(ctx,OUTLAW_NAMES[name],r.x+r.w/2,r.y+r.h/2,r.h*.86,r.w*.96,INK));
  const crime=done?'MOST DANGEROUS OUTLAW':collected?'BOUNTY CLAIMED':'FOR ROBBERY, MURDER & TRAIN HEISTS';
  liveBand(ctx,'poster',m,'crime',crime,r=>text(ctx,crime,r.x+r.w/2,r.y+r.h/2,r.h*.62,'#3a2a1b',r.w*.92,true));
  if(collected&&turn<.1){ctx.save();ctx.translate(P.x+P.w/2,P.y+P.h*.5);ctx.rotate(-.09);ctx.fillStyle='#8f211bef';ctx.fillRect(-P.w*.5,-P.h*.09,P.w,P.h*.18);slab(ctx,'CLAIMED',0,1,P.h*.11,P.w*.9,IVORY);ctx.restore();}
  // earned stamps: a red seal over the painted dashed circle
  const count=done?3:state.stamps,R=m.def.stamps.radius*m.scale;
  for(let i=0;i<count;i++){const [cx,cy]=m.def.stamps.centers[i],hit=i===count-1?stampPulse:0;ctx.save();ctx.translate(m.dx+cx*m.scale,m.dy+cy*m.scale+Math.sin(hit*Math.PI*3)*3*hit);ctx.rotate(-.12+i*.06);ctx.scale(1+.16*hit,1+.16*hit);
   ctx.fillStyle=RED;ctx.beginPath();ctx.arc(0,0,R*.92,0,6.283);ctx.fill();ctx.strokeStyle='#efe1bfaa';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,R*.74,0,6.283);ctx.stroke();slab(ctx,'0'+(i+1),0,1,R*.8,R*1.4,IVORY);
   if(hit>0){ctx.globalAlpha=.4*hit;ctx.strokeStyle='#ead0aa';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,R+hit*10,0,6.283);ctx.stroke();}ctx.restore();}
  const countText=done?'ALL BOUNTIES CLAIMED':state.stamps===2?'ONE MORE STAMP':`${state.stamps} OF 3 STAMPS`;
  liveBand(ctx,'poster',m,'count',countText,r=>slab(ctx,countText,r.x+r.w/2,r.y+r.h/2,r.h*.88,r.w*.96,RED));
  const nextText=state.level===2?'THE RINGLEADER':'NEXT: '+OUTLAW_NAMES[BLOOD_LADDER[state.level+1]];
  liveBand(ctx,'poster',m,'next',nextText,r=>slab(ctx,nextText,r.x+r.w/2,r.y+r.h/2,r.h*.8,r.w*.98,'#2b1a10',true));
  liveBand(ctx,'poster',m,'spins',String(remaining),r=>slab(ctx,String(remaining),r.x+r.w/2,r.y+r.h/2,r.h*.62,r.w*.9,IVORY));
  liveBand(ctx,'poster',m,'reward',dollars(total),r=>slab(ctx,dollars(total),r.x+r.w/2,r.y+r.h/2,r.h*.5,r.w*.94,IVORY));
  ctx.restore();
 }
 function heroVector(ctx,state,{x,y,w,h,remaining=8,total=0,boost=4,stampPulse=0,turn=0,nextTarget=null,collected=false,briefing=false}={}){
  const done=state.level===2&&state.stamps===3,target=BLOOD_LADDER[state.level],name=nextTarget&&ease(turn)>.5?nextTarget:target;
  ctx.save();ctx.translate(x,y+Math.sin(stampPulse*Math.PI)*1.5);ctx.scale(w/380,h/760);base(ctx,380,760);
  slab(ctx,'WANTED',190,64,76,300,INK);
  ctx.strokeStyle=INK;ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(56,104);ctx.lineTo(324,104);ctx.stroke();ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(56,109);ctx.lineTo(324,109);ctx.stroke();
  slab(ctx,'DEAD OR ALIVE',190,129,24,280,INK);
  ctx.fillStyle=IVORY;ctx.fillRect(54,152,272,292);portrait(ctx,target,54,152,272,292,{turn,nextTarget,collected,shade:true});frame(ctx,54,152,272,292);
  ctx.save();ctx.translate(302,160);ctx.rotate(.14);ctx.fillStyle=RED;ctx.fillRect(-54,-15,108,30);ctx.strokeStyle='#efe1bfaa';ctx.lineWidth=1;ctx.strokeRect(-50,-11,100,22);slab(ctx,`${boost}× BOOST`,0,1,17,92,IVORY);ctx.restore();
  slab(ctx,OUTLAW_NAMES[name],190,484,38,320,INK);
  ctx.strokeStyle=INK;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(70,502);ctx.lineTo(310,502);ctx.stroke();
  text(ctx,done?'MOST DANGEROUS OUTLAW':collected?'BOUNTY CLAIMED':'FOR ROBBERY, MURDER & TRAIN HEISTS',190,516,14,'#3a2a1b',262,true);
  if(collected&&turn<.1){ctx.save();ctx.translate(190,300);ctx.rotate(-.09);ctx.fillStyle='#8f211bef';ctx.fillRect(-142,-25,284,50);slab(ctx,'CLAIMED',0,1,33,270,IVORY);ctx.restore();}
  marks(ctx,done?3:state.stamps,190,CONTRACT.stampY,{gap:CONTRACT.stampGap,pulse:stampPulse});
  slab(ctx,done?'ALL BOUNTIES CLAIMED':state.stamps===2?'ONE MORE STAMP':`${state.stamps} OF 3 STAMPS`,190,606,23,320,RED);
  ctx.strokeStyle='#3a2a1b';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(52,631);ctx.lineTo(82,631);ctx.moveTo(298,631);ctx.lineTo(328,631);ctx.stroke();
  slab(ctx,state.level===2?'THE RINGLEADER':'NEXT: '+OUTLAW_NAMES[BLOOD_LADDER[state.level+1]],190,631,15,210,'#3a2a1b',true);
  plate(ctx,22,652,336,94);
  ctx.strokeStyle='#efe1bf33';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(190,668);ctx.lineTo(190,730);ctx.stroke();
  slab(ctx,briefing?'FREE SPINS':'SPINS LEFT',108,676,14,130,BRASS,true);slab(ctx,'REWARD',272,676,14,130,BRASS,true);
  title(ctx,String(remaining),108,712,42,130,IVORY);title(ctx,dollars(total),272,712,36,146,IVORY);
  ctx.restore();
 }
 function closedStamp(ctx,x,y,p,width=334){
  ctx.save();ctx.translate(x,y);ctx.rotate(-.02);ctx.globalAlpha*=clamp(p*3);const scale=1+.38*(1-p);ctx.scale(scale,scale);
  ctx.fillStyle=RED;ctx.fillRect(-width/2,-25,width,50);ctx.strokeStyle=BRASS_EDGE;ctx.lineWidth=2;ctx.strokeRect(-width/2+3,-22,width-6,44);
  rivet(ctx,-width/2+12,0,4);rivet(ctx,width/2-12,0,4);slab(ctx,'CONTRACT CLOSED',0,1,26,width-60,IVORY);ctx.restore();
 }
 function receipt(ctx,state,opts={}){if(!opts.compact&&plateReady('card')&&plateReady('ledger'))return receiptPlate(ctx,state,opts);return receiptVector(ctx,state,opts);}
 function receiptPlate(ctx,state,{x,y,w,h,total=0,award=8,boost=4,closed=1,result=1,arrival=1}={}){
  const target=BLOOD_LADDER[state.level],value=dollars(Math.round(total*100*clamp(result))/100);
  ctx.save();ctx.translate(x,y);ctx.scale(w/760,h/484);ctx.globalAlpha*=ease(arrival*4);
  const enter=ease(arrival),ledger=ease((arrival-.18)/.82);
  ctx.save();ctx.translate(262+54*(1-ledger),98);ctx.globalAlpha*=ledger;const L=drawPlate(ctx,'ledger',0,0,494,340);
  const A=bandRect(L,'amount');slab(ctx,value,A.x+A.w/2,A.y+A.h/2,A.h*.68,A.w*.94,INK);ctx.restore();
  ctx.save();ctx.translate(8-28*(1-enter),34-18*(1-enter));ctx.rotate(-.035-(1-enter)*.07);ctx.globalAlpha*=enter;const C=drawPlate(ctx,'card',0,0,290,416);
  const P=bandRect(C,'portrait');ctx.fillStyle=IVORY;ctx.fillRect(P.x,P.y,P.w,P.h);portrait(ctx,target,P.x,P.y,P.w,P.h,{shade:true});
  liveBand(ctx,'card',C,'name',OUTLAW_NAMES[target],r=>slab(ctx,OUTLAW_NAMES[target],r.x+r.w/2,r.y+r.h/2,r.h*.8,r.w*.96,INK));ctx.restore();
  ctx.save();ctx.shadowColor='#000';ctx.shadowBlur=15;title(ctx,'BLOOD MONEY',505,57,49,457);ctx.fillStyle=BRASS;ctx.font='22px Georgia,serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('\u2605',270,58);ctx.fillText('\u2605',740,58);ctx.restore();
  ctx.restore();
 }
 function receiptVector(ctx,state,{x,y,w,h,total=0,award=8,boost=4,closed=1,result=1,compact=false,arrival=1}={}){
  const target=BLOOD_LADDER[state.level],value=dollars(Math.round(total*100*clamp(result))/100);
  ctx.save();ctx.translate(x,y);ctx.scale(w/(compact?480:760),h/(compact?640:484));ctx.globalAlpha*=ease(arrival*4);
  const enter=ease(arrival),ledger=ease((arrival-.18)/.82);
  if(compact){
   slab(ctx,'WANTED',240,46,52,434,INK);slab(ctx,'DEAD OR ALIVE',240,82,19,380,INK);
   ctx.save();ctx.translate(99-(1-enter)*24,89-(1-enter)*18);ctx.rotate(-.018-(1-enter)*.08);ctx.globalAlpha*=enter;base(ctx,284,255);
   portrait(ctx,target,16,16,252,222);frame(ctx,16,16,252,222);slab(ctx,OUTLAW_NAMES[target],142,219,26,236,IVORY);ctx.restore();
   ctx.save();ctx.globalAlpha*=ledger;ctx.translate(15,326+28*(1-ledger));base(ctx,450,300);
   closedStamp(ctx,225,38,closed,342);slab(ctx,'REWARD PAID',225,96,22,380,INK);starRule(ctx,225,117,120);
   title(ctx,value,225,168,84,414,INK);
   plate(ctx,24,222,402,58);slab(ctx,`${award} FREE SPINS · ${boost}× BOOST`,225,251,20,360,IVORY);ctx.restore();
  }else{
   ctx.save();ctx.translate(265+54*(1-ledger),104);ctx.globalAlpha*=ledger;base(ctx,488,326);
   closedStamp(ctx,244,40,closed,358);slab(ctx,'REWARD PAID',244,102,24,410,INK);starRule(ctx,244,124,120);
   title(ctx,value,244,176,93,430,INK);starRule(ctx,244,226,60);
   plate(ctx,28,242,432,70);slab(ctx,`${award} FREE SPINS COMPLETED`,244,268,22,380,IVORY);slab(ctx,`${boost}× BOUNTY BOOST`,244,293,15,380,BRASS,true);ctx.restore();
   ctx.save();ctx.translate(10-28*(1-enter),38-18*(1-enter));ctx.rotate(-.035-(1-enter)*.07);ctx.globalAlpha*=enter;base(ctx,278,411);
   slab(ctx,'WANTED',139,44,44,228,INK);
   ctx.fillStyle=IVORY;ctx.fillRect(41,72,196,242);portrait(ctx,target,41,72,196,242,{shade:true});frame(ctx,41,72,196,242);
   slab(ctx,OUTLAW_NAMES[target],139,346,25,212,INK);
   starRule(ctx,139,372,150,'#3a2a1b');slab(ctx,'DEAD OR ALIVE',139,372,14,110,'#3a2a1b',true);ctx.restore();
   ctx.save();ctx.shadowColor='#000';ctx.shadowBlur=15;title(ctx,'BLOOD MONEY',505,57,49,457);ctx.fillStyle=BRASS;ctx.font='22px Georgia,serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('\u2605',270,58);ctx.fillText('\u2605',740,58);ctx.restore();
  }
  ctx.restore();
 }
 function upgrade(ctx,target,{x,y,w,h,progress=1,alpha=1,claimed=false,compact=false}={}){
  ctx.save();ctx.translate(x,y);ctx.scale(w/620,h/116);ctx.globalAlpha*=alpha;
  base(ctx,620,116);ctx.fillStyle=RED;ctx.fillRect(14,14,4,88);
  slab(ctx,claimed?'THREE STAMPS · BOUNTY CLAIMED':'TARGET UPGRADED',310,32,compact?26:20,557,claimed?IVORY:'#cb765a',true);
  slab(ctx,OUTLAW_NAMES[target],310,75,compact?44:39,556,INK);
  ctx.fillStyle='#b14632';ctx.fillRect(28,106,564*clamp(progress),2);ctx.restore();
 }
 function compact(ctx,state,{width,height,remaining,total,boost=4,turn=0,nextTarget=null,collected=false,stampPulse=0,briefing=false}={}){
  ctx.save();ctx.setTransform(width/760,0,0,height/230,0,0);ctx.translate(160,3);base(ctx,598,224);
  ctx.fillStyle=IVORY;ctx.fillRect(18,22,152,182);portrait(ctx,BLOOD_LADDER[state.level],18,22,152,182,{turn,nextTarget,collected});frame(ctx,18,22,152,182);
  slab(ctx,'WANTED',372,30,32,380,INK);
  ctx.strokeStyle=INK;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(206,48);ctx.lineTo(538,48);ctx.stroke();
  slab(ctx,OUTLAW_NAMES[nextTarget&&ease(turn)>.5?nextTarget:BLOOD_LADDER[state.level]],372,74,38,380,INK);
  marks(ctx,state.stamps,372,116,{width:44,height:44,gap:80,pulse:stampPulse,fontSize:19});
  slab(ctx,state.level===2&&state.stamps===3?'BOUNTY CLAIMED':state.stamps===2?'ONE MORE STAMP':`${state.stamps} OF 3 STAMPS`,372,156,18,330,RED);
  if(collected&&turn<.1){ctx.save();ctx.translate(94,130);ctx.rotate(-.08);ctx.fillStyle=RED;ctx.fillRect(-79,-18,158,36);slab(ctx,'CLAIMED',0,1,28,148,IVORY);ctx.restore();}
  plate(ctx,196,170,354,46,{rivets:false});
  slab(ctx,briefing?`${remaining} FREE SPINS`:`${remaining} SPINS`,286,193,21,170,IVORY);slab(ctx,dollars(total),464,193,21,170,IVORY);
  ctx.save();ctx.translate(536,172);ctx.rotate(-.12);ctx.fillStyle=RED;ctx.fillRect(-42,-12,84,24);slab(ctx,`${boost}× BOOST`,0,1,13,76,IVORY);ctx.restore();
  ctx.restore();
 }
 return {hero,receipt,compact,upgrade};
}
