import {BLOOD_LADDER} from './blood-bounty.js?v=82';
import {OUTLAW_NAMES as BLOOD_NAMES} from './blood-outlaws.js?v=91art';
export const BOUNTY_MATERIAL='assets/ink-western/poster-knife.webp';
export const BOUNTY_REVEAL={cardAt:.28,knifeAt:.70,continueAt:1.55,duration:8};
const clamp=x=>Math.max(0,Math.min(1,x));
export const bountyEase=x=>1-(1-clamp(x))**3;
export function bountyHeroLayout(G,H,visibleWidth=1212){const scale=Math.min(G.w/900,(visibleWidth-12)/1000);return {scale,x:G.x+G.w/2-720*scale,y:H-780*scale};}
export function createBountyPoster({atlas,getTile=()=>null}){
 const ink=new Map();
 function label(ctx,text,x,y,size,color='#21180f',width=300,font='Outlaw'){
  ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=color;const face=font==='GeorgiaItalic'?'Georgia':font==='Slab'||font==='SlabBold'?'Offers':font,style=font==='Western'?'bold ':font==='GeorgiaItalic'?'italic ':font==='Slab'?'900 ':font==='SlabBold'?'700 ':'';ctx.font=`${style}${size}px ${face},Georgia,serif`;const w=ctx.measureText(text).width;if(w>width)ctx.font=`${style}${size*width/w}px ${face},Georgia,serif`;ctx.fillText(text,x,y);ctx.restore();
 }
 function symbol(ctx,name,x,y,size,dead=false,height=size){
  const im=getTile(name,dead);if(!im)return;
  if(BLOOD_NAMES[name]){ctx.save();ctx.globalCompositeOperation='multiply';ctx.drawImage(im,x,y,size,height);ctx.restore();return;}
  if(!ink.has(name)){const c=document.createElement('canvas');c.width=c.height=256;const cc=c.getContext('2d',{willReadFrequently:true});cc.drawImage(im,im.width*.075,im.height*.075,im.width*.85,im.height*.85,0,0,256,256);const p=cc.getImageData(0,0,256,256);for(let i=0;i<p.data.length;i+=4)p.data[i+3]*=1-clamp((Math.min(p.data[i],p.data[i+1],p.data[i+2])-75)/105);cc.putImageData(p,0,0);ink.set(name,c);}
  ctx.save();ctx.globalCompositeOperation='multiply';ctx.drawImage(ink.get(name),x,y,size,size);ctx.restore();
 }
 function sheet(ctx,x,y,w,h){ctx.drawImage(atlas,160,8,742,1000,x,y,w,h);}
 function knife(ctx,x,y,height=140,angle=.35){ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.drawImage(atlas,1088,104,224,808,-height*224/808/2,-height,height*224/808,height);ctx.restore();}
 function stamps(ctx,count,x,y,r=28,gap=95,pulse=0){ctx.save();for(let i=0;i<3;i++){const cx=x+(i-1)*gap;ctx.save();ctx.translate(cx,y);if(i===count-1)ctx.scale(1+pulse*.13,1-pulse*.07);ctx.strokeStyle=i<count?'#8d241c':'#66543b';ctx.lineWidth=i<count?3.5:1.5;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.stroke();if(i<count){ctx.beginPath();ctx.arc(0,0,r-5,0,Math.PI*2);ctx.stroke();symbol(ctx,'skull',-r+6,-r+6,2*r-12);if(i===count-1&&pulse>0){ctx.fillStyle='#8d241c';for(let j=0;j<7;j++){const a=j*2.4;ctx.beginPath();ctx.arc(Math.cos(a)*(r+7+j%3),Math.sin(a)*(r+7),1.3+j%2,0,Math.PI*2);ctx.fill();}}}ctx.restore();}ctx.restore();}
 function closedStamp(ctx,p=1){ctx.save();ctx.translate(180,152);ctx.rotate(-.13);ctx.scale(1+.18*(1-p),1+.18*(1-p));ctx.globalAlpha*=p;ctx.strokeStyle='#711c18';ctx.lineWidth=5;ctx.strokeRect(-153,-34,306,68);ctx.lineWidth=1.2;ctx.strokeRect(-146,-27,292,54);label(ctx,'BOUNTY CLOSED',0,1,36,'#711c18',283,'Western');ctx.restore();}
 // One continuous card: entrance, side dock, upgrades and result all use these coordinates.
 function hero(ctx,state,{x=520,y=91,w=400,h=610,knifeOn=true,knifeFall=0,knifeHeight=145,award=8,boost=4,remaining=award,total=0,intro=false,reveal=Infinity,stampPulse=0,turn=0,nextTarget=null,collected=false,closed=0,result=0,paperAngle=0,shadow=true}={}){
  const target=BLOOD_LADDER[state.level],done=state.level===BLOOD_LADDER.length-1&&state.stamps===3;
  ctx.save();ctx.translate(x,y);ctx.scale(w/360,h/600);
  if(shadow){ctx.save();ctx.shadowColor='#0008';ctx.shadowBlur=17;ctx.shadowOffsetY=9;sheet(ctx,0,0,360,600);ctx.restore();}
  // Paper pivots around the pin; the steel and its shadow never inherit that flex.
  ctx.save();ctx.translate(254,35);ctx.rotate(paperAngle);ctx.transform(1,0,paperAngle*.32,1,0,0);ctx.translate(-254,-35);
  sheet(ctx,0,0,360,600);
  label(ctx,'BLOOD MONEY',180,51,39,'#7e1713',305,'Western');
  label(ctx,done?'TOP BOUNTY':'CURRENT TARGET',180,85,19,'#51422e',300);
  if(reveal>=0){
   ctx.save();ctx.translate(180,190);ctx.scale(1,Math.max(.04,Math.abs(Math.cos(Math.PI*turn)))) ;ctx.translate(-180,-190);
   ctx.strokeStyle='#675236';ctx.lineWidth=1.5;ctx.strokeRect(82,106,196,168);
   if(!nextTarget||turn<.5)symbol(ctx,target,83,107,194,collected,166);
   label(ctx,BLOOD_NAMES[target],180,292,25,'#21180f',306);ctx.restore();
   if(collected&&turn<.4){ctx.save();ctx.translate(180,237);ctx.rotate(-.12);ctx.strokeStyle='#8d241c';ctx.lineWidth=4;ctx.strokeRect(-94,-21,188,42);label(ctx,'COLLECTED',0,0,32,'#8d241c',178,'Western');ctx.restore();}
   if(nextTarget&&turn>0){const p=bountyEase(turn),s=54+(194-54)*p;symbol(ctx,nextTarget,244+(83-244)*p,404+(107-404)*p,s,false,54+(166-54)*p);}
  }
  if(reveal>=1){stamps(ctx,done?3:state.stamps,180,341,29,94,stampPulse);label(ctx,done?'BOUNTY CLAIMED':intro?'3 STAMPS = UPGRADE':`${state.stamps} / 3 STAMPS`,180,388,27,'#6f211a',300);}
  if(!intro||reveal>=1){
   ctx.strokeStyle='#a0875f';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(42,413);ctx.lineTo(220,413);ctx.stroke();
   label(ctx,state.level===2?'FINAL TARGET':'NEXT UPGRADE',137,436,18,'#51422e',190);
   if(state.level<2&&!(nextTarget&&turn>0))symbol(ctx,BLOOD_LADDER[state.level+1],244,404,54);
   if(state.level===2)symbol(ctx,'bandit',244,404,54);
  }
  ctx.save();ctx.globalAlpha*=1-result;
  if(reveal>=2){label(ctx,intro?`${award} FREE SPINS`:`${remaining} SPINS LEFT`,180,484,intro?34:29,'#7e1713',300,'Western');}
  if(reveal>=3){label(ctx,`${boost}× FEATURE WIN BOOST`,180,515,20,'#32271b',300);}
  if(!intro&&result<.001){label(ctx,'FEATURE WON',180,543,16,'#51422e',296);label(ctx,'$'+total.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}),180,568,36,'#281c11',303);}
  if(intro)label(ctx,'PAYING TARGETS EARN STAMPS',180,558,16,'#51422e',284);
  ctx.restore();
  if(closed>0)closedStamp(ctx,closed);
  if(result>0){ctx.save();ctx.globalAlpha*=result;ctx.strokeStyle='#8d7552';ctx.beginPath();ctx.moveTo(47,470);ctx.lineTo(313,470);ctx.stroke();label(ctx,'TOTAL WON',180,494,26,'#6f211a',290);label(ctx,'$'+total.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}),180,543,56,'#21180f',296,'Western');ctx.restore();}
  ctx.restore();
  if(knifeOn){ctx.save();ctx.shadowColor='#0007';ctx.shadowBlur=knifeFall?12:2;ctx.shadowOffsetX=knifeFall*18+2;ctx.shadowOffsetY=knifeFall*25+3;knife(ctx,254-knifeFall*24,35-knifeFall*170,knifeHeight,.34+knifeFall*.32);ctx.restore();}
  ctx.restore();
 }
 return {label,symbol,sheet,knife,stamps,hero};
}
export function createBountyReveal(assets,make,{getTile=()=>null,reduced=false}={}){
 const poster=createBountyPoster({atlas:assets.bountyMaterial,getTile});
 return {draw(ctx,t,award,{compact=false}={}){if(t<BOUNTY_REVEAL.cardAt)return;const p=bountyEase((t-BOUNTY_REVEAL.cardAt)/.30),hit=t-BOUNTY_REVEAL.knifeAt;
  const flex=!reduced&&hit>=0&&hit<.22?Math.sin(hit/.22*Math.PI*2)*Math.exp(-hit*17)*.025:0;
  const reveal=t<.78?0:t<.99?1:t<1.20?2:3;
  ctx.save();ctx.globalAlpha=reduced?1:p;
  poster.hero(ctx,{level:0,stamps:0},{y:(compact?19:91)-(reduced?0:96*(1-p)),knifeHeight:compact?100:145,award:award??8,intro:true,reveal,knifeOn:t>=.58,knifeFall:reduced?0:1-bountyEase((t-.58)/.12),paperAngle:flex});ctx.restore();},dispose(){}};
}
export function createBountyFrame({W,H}){return {draw(ctx,{t,frozen,burn,art,layout,awardedSpins}){ctx.drawImage(frozen,0,0,W,H);const dim=.66*bountyEase((t-.15)/.45);ctx.fillStyle=`rgba(9,6,3,${dim})`;ctx.fillRect(0,0,W,H);if(t<.55)burn.draw(ctx,t);ctx.save();ctx.translate(layout.x,layout.y);ctx.scale(layout.scale,layout.scale);art.draw(ctx,t,awardedSpins,{compact:layout.cropped});ctx.restore();},dispose(){}};}
