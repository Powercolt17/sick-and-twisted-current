// Eight authored gallop poses; scene travel and body motion run continuously.
// Keying happens once on load, never inside a frame or a payout sequence.
export const GALLOP={cols:2,rows:4,frameMs:60,cycleMs:480,start:80,end:2080,rowCuts:[0,374,718,1060,1448]};
const clamp=v=>Math.max(0,Math.min(1,v));
export const HORSE_BEATS=Object.freeze({start:60,skid:780,title:900,land:1060,planted:1430});
export const HORSE_HOOFS=Object.freeze([155,210,335,390,500,550,670,720]);
export function horseScenePose(t,{reduced=false}={}){
 if(reduced)return {phase:'skid',motionTime:1000,x:30,width:620,alpha:1};
 const q=clamp((t-HORSE_BEATS.start)/(HORSE_BEATS.skid-HORSE_BEATS.start));
 if(t<HORSE_BEATS.skid)return {phase:'gallop',motionTime:Math.max(0,t-60)*1.4,
  x:-740+770*q**1.17,width:430+190*q,alpha:clamp((t-60)/60)};
 const braking=clamp((t-HORSE_BEATS.skid)/(HORSE_BEATS.land-HORSE_BEATS.skid));
 return {phase:'skid',motionTime:t-HORSE_BEATS.skid,x:30+52*(1-(1-braking)**2.6),width:620,alpha:1};
}

export function createHorseGallop({makeCanvas=()=>document.createElement('canvas')}={}){
 let sheet=null,frames=[],skidSheet=null,skidFrames=[];
 function prepare(image){
  const result=makeCanvas();result.width=image.width;result.height=image.height;
  const c=result.getContext('2d',{willReadFrequently:true});c.drawImage(image,0,0);
  const p=c.getImageData(0,0,result.width,result.height),d=p.data;
  // Saturated green is reserved for the matte, absent from the approved ink art.
  for(let i=0;i<d.length;i+=4){
   const excess=d[i+1]-Math.max(d[i],d[i+2]),key=clamp((excess-18)/74);
   if(key>0)d[i+3]=Math.round(d[i+3]*(1-key));
   if(excess>9)d[i+1]=Math.max(d[i],d[i+2])+9;
  }
  c.putImageData(p,0,0);sheet=result;frames=[];
  const w=image.width/GALLOP.cols;
  for(let i=0;i<8;i++){
   const row=Math.floor(i/2),sx=(i%2)*w,sy=Math.round(GALLOP.rowCuts[row]/1448*image.height),h=Math.round(GALLOP.rowCuts[row+1]/1448*image.height)-sy;
   // Register the hat's upper band, not the legs' changing bounding box.
   let top=h,lo=w,hi=0;
   for(let y=0;y<h*.4;y++)for(let x=0;x<w;x++)if(d[((Math.floor(sy+y)*image.width+Math.floor(sx+x))*4)+3]>128)top=Math.min(top,y);
   for(let y=top;y<Math.min(h*.4,top+h*.07);y++)for(let x=0;x<w;x++)if(d[((Math.floor(sy+y)*image.width+Math.floor(sx+x))*4)+3]>128){lo=Math.min(lo,x);hi=Math.max(hi,x);}
   frames.push({sx,sy,w,h,anchorX:(lo+hi)/2,anchorY:top});
  }
 }
 function prepareSkid(image){
  const canvas=makeCanvas();canvas.width=image.width;canvas.height=image.height;
  const c=canvas.getContext('2d',{willReadFrequently:true});c.drawImage(image,0,0);
  const p=c.getImageData(0,0,canvas.width,canvas.height),d=p.data;
  for(let i=0;i<d.length;i+=4){
   const excess=d[i+1]-Math.max(d[i],d[i+2]),key=clamp((excess-18)/74);
   if(key>0)d[i+3]=Math.round(d[i+3]*(1-key));
   if(excess>9)d[i+1]=Math.max(d[i],d[i+2])+9;
  }
  c.putImageData(p,0,0);skidSheet=canvas;
  // Source row bands are hand-checked against the actual delivered atlas.
  const cuts=[0,392,785,1254],w=image.width/2;
  skidFrames=Array.from({length:6},(_,i)=>{
   const sx=i%2*w,sy=Math.round(cuts[Math.floor(i/2)]/1254*image.height),end=Math.round(cuts[Math.floor(i/2)+1]/1254*image.height);
   let bottom=0;for(let y=sy;y<end;y++)for(let x=sx;x<sx+w;x++)if(d[(y*image.width+x)*4+3]>128)bottom=Math.max(bottom,y-sy+1);
   return {sx,sy,w,h:end-sy,bottom};
  });
 }
 function drawSkid(ctx,t,x,ground,width){
  if(!skidSheet||!skidFrames.length)return false;
  // Contact pose is deliberately held for 75 ms, then resolves to a true
  // planted horse. No rubber scaling, interpolated legs or frozen run cycle.
  const index=t<95?0:t<205?1:t<355?2:t<450?3:t<550?4:5,f=skidFrames[index],s=width/f.w;
  ctx.drawImage(skidSheet,f.sx,f.sy,f.w,f.h,x,ground-f.bottom*s,width,f.h*s);return true;
 }
 function draw(ctx,t,x,y,width,{still=false}={}){
  if(!sheet||!frames.length)return false;
  const phase=((Math.max(0,t)%GALLOP.cycleMs)/GALLOP.cycleMs),f=frames[still?0:Math.floor(phase*8)],s=width/f.w;
  const anchor=frames[0],dx=(anchor.anchorX-f.anchorX)*s,dy=(anchor.anchorY-f.anchorY)*s;
  const bob=still?0:Math.sin(phase*Math.PI*2)*1.6*s;
  ctx.drawImage(sheet,f.sx,f.sy,f.w,f.h,x+dx,y+dy+bob,width,f.h*s);
  return true;
 }
 return {prepare,prepareSkid,draw,drawSkid,get skidReady(){return !!skidSheet;},get skidFrames(){return skidFrames.map(f=>({...f}));},get ready(){return !!sheet;},get frames(){return frames.map(f=>({...f}));}};
}
