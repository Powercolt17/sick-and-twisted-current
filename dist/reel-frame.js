import {createCrowIdle} from './crow-idle.js?v=94perf';
import {createStaticRaster} from './static-raster.js?v=1';
// Illustrated production parts retain the approved source registration.
// Existing clipping, reel opening and articulated crow rig stay unchanged.
export const REEL_FRAME_ART='assets/reel-frame/approved-skull-frame.png';
const FRAME_PARTS=[['frame-left',[176,243,102,612]],['frame-right',[1297,243,119,612]],['frame-bottom',[118,851,1340,97]],['title',[278,63,1020,181]],['skull-hat',[134,54,246,241]],['skull-right',[1270,128,148,202]],['crow',[1245,4,223,225]]];
export const RIGHT_ORNAMENT_ART='assets/reel-frame/knife-skull.png';
export function reelPlaqueText({mode='normal',bonus=false,label='',maxEligible=false,winBoost=1}={}){
 const names={normal:'BASE SPINS',boost:'BOUNTY BOOSTER',trickster:'DOUBLE CROSS SPINS',allin:'ALL IN SPINS',outlaws:'HELL TO PAY',free:'BLOOD MONEY',deaderfree:'HANG ’EM HIGH',maxfree:'HANG ’EM HIGH'};
 const title=bonus?(label==='DEAD'?'BLOOD MONEY':label==='HELL'?'HELL TO PAY':'HANG ’EM HIGH'):(names[mode]||names.normal);
 const detail=[maxEligible&&bonus?'MAX ACTIVE':'',winBoost>1?'WIN BOOST ×'+winBoost:''].filter(Boolean).join(' · ');
 return {title,detail};
}
export function createReelFrame({G}){
 let image=null,plaqueImage=null,rightOrnament=null,crow=null,parts=new Map();
 const borderRaster=createStaticRaster({width:1212,height:608,paint:staticBorder});
 function piece(ctx,source,dest,outline){
  const [sx,sy,sw,sh]=source,[x,y,w,h]=dest;
  ctx.save();ctx.translate(x,y);ctx.scale(w/sw,h/sh);ctx.translate(-sx,-sy);
  if(outline){ctx.beginPath();outline.forEach(([px,py],i)=>i?ctx.lineTo(px,py):ctx.moveTo(px,py));ctx.closePath();ctx.clip();}
  const part=parts.get(source.join(','));
  if(part)ctx.drawImage(part,0,0,sw,sh,sx,sy,sw,sh);
  else ctx.drawImage(image,sx,sy,sw,sh,sx,sy,sw,sh);ctx.restore();
 }
 function staticBorder(ctx){
  if(!image)return false;
  // One common source-to-grid transform preserves the reference's proportions.
  // Clip the original artwork itself; never redraw its crow, skulls or title.
  const sx=G.w/1019,sy=G.h/612;
  function exact(source,outline){const [x,y,w,h]=source;piece(ctx,source,[G.x+(x-278)*sx,G.y+(y-243)*sy,w*sx,h*sy],outline);}
  ctx.save();ctx.beginPath();ctx.rect(0,0,1212,608);ctx.rect(G.x,G.y,G.w,G.h);ctx.clip('evenodd');
  exact([176,243,102,612]);exact([1297,243,119,612]);
  exact([118,851,1340,97],[[118,882],[147,866],[177,854],[1297,854],[1320,849],[1360,854],[1450,868],[1458,895],[1445,923],[1450,948],[118,948]]);
  exact([278,63,1020,181],[[278,179],[319,173],[373,160],[425,148],[474,138],[520,111],[560,98],[603,83],[657,73],[716,65],[768,64],[824,69],[876,80],[929,98],[975,118],[1018,138],[1058,151],[1136,167],[1211,185],[1298,197],[1298,244],[278,244]]);
  exact([134,54,246,241],[[134,142],[139,124],[151,110],[171,97],[195,100],[210,89],[214,73],[223,60],[249,55],[271,58],[296,70],[314,93],[326,113],[339,139],[354,149],[369,147],[376,153],[372,168],[358,181],[331,184],[309,203],[301,228],[287,248],[274,267],[264,294],[174,295],[167,280],[154,281],[155,259],[163,241],[157,223],[164,211],[180,198],[179,180],[165,169],[144,158]]);
  // Original wood/skull remain fixed beneath the articulated crow.
  exact([1270,128,148,202],[[1273,151],[1286,143],[1297,142],[1314,129],[1325,128],[1339,141],[1358,143],[1372,151],[1390,163],[1411,180],[1413,232],[1414,259],[1417,273],[1416,328],[1293,328],[1293,278],[1290,251],[1282,242],[1275,236]]);
  ctx.restore();return true;
 }
 function border(ctx,now=0,animate=false,compact=false,cacheStatic=true){
  if(!image)return false;
  borderRaster.draw(ctx,cacheStatic);
  if(crow){
   const sx=G.w/1019,sy=G.h/612;
   ctx.save();ctx.beginPath();ctx.rect(0,0,1212,608);ctx.rect(G.x,G.y,G.w,G.h);ctx.clip('evenodd');
   ctx.translate(G.x-278*sx,G.y-243*sy);ctx.scale(sx,sy);crow.draw(ctx,now/1000,animate,compact);ctx.restore();
  }
  return true;
 }
 function plaque(ctx,state){
  if(!image||!plaqueImage)return false;
  // No sign or BASE SPINS label in the normal game.
  if(!state.bonus&&(state.mode||'normal')==='normal')return true;
  // The existing mode/boost plaque takes the old title's space. Its content is unchanged.
  const x=8,y=32,w=224,h=58,sx=394,sy=63,sw=610,sh=132,n=24,t=10;
  const sourcesX=[sx,sx+n,sx+sw-n],sourcesY=[sy,sy+n,sy+sh-n],sourceW=[n,sw-2*n,n],sourceH=[n,sh-2*n,n];
  const destX=[x,x+t,x+w-t],destY=[y,y+t,y+h-t],destW=[t,w-2*t,t],destH=[t,h-2*t,t];
  ctx.save();for(let a=0;a<3;a++)for(let b=0;b<3;b++)ctx.drawImage(plaqueImage,sourcesX[a],sourcesY[b],sourceW[a],sourceH[b],destX[a],destY[b],destW[a],destH[b]);
  const {title,detail}=reelPlaqueText(state);ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';ctx.strokeStyle='#100b07';ctx.lineWidth=3;
  ctx.font=`${detail?23:26}px Western,Georgia,serif`;ctx.fillStyle='#eee0bd';const cy=y+(detail?21:30);ctx.strokeText(title,x+w/2,cy,w-26);ctx.fillText(title,x+w/2,cy,w-26);
  if(detail){ctx.font='bold 13px Offers,Georgia,serif';ctx.fillStyle='#d9bc7f';ctx.strokeText(detail,x+w/2,y+43,w-24);ctx.fillText(detail,x+w/2,y+43,w-24);}
  ctx.restore();return true;
 }
 async function load(){
  const acquire=async src=>{const a=new Image();a.src=src;await a.decode();return a;};
  const [paintings,plaque]=await Promise.all([Promise.all(FRAME_PARTS.map(async ([name,box])=>({box,im:await acquire(`assets/ink-western/${name}.webp`)}))),acquire('assets/reel-frame/wood-and-brass.png')]);
  parts=new Map(paintings.map(({box,im})=>[box.join(','),im]));
  const im=document.createElement('canvas');im.width=1659;im.height=948;
  const bird=paintings.at(-1);im.getContext('2d').drawImage(bird.im,bird.box[0],bird.box[1]);
  image=im;plaqueImage=plaque;rightOrnament=null;crow=createCrowIdle(im);borderRaster.clear();
 }
 return {load,border,plaque,setAsset:(im,plaque,ornament)=>{parts=new Map();image=im;plaqueImage=plaque||im;rightOrnament=ornament||null;crow=createCrowIdle(im);borderRaster.clear();},get ready(){return !!image}};
}
