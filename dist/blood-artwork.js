import {createHellArtwork} from './hell-artwork.js?v=5';
const clamp=x=>Math.max(0,Math.min(1,x));
// Art remains the supplied painting. Only the loose cloth is rigged; the face,
// weapon, hand, safe, architecture, border and title field never deform.
const CONTOUR=[[716,328],[799,337],[851,362],[963,400],[1066,441],[1121,471],[1177,500],[1196,539],[1147,511],[1114,494],[1145,528],[1080,489],[1104,522],[1044,485],[1049,538],[1000,589],[989,552],[949,587],[941,644],[904,681],[890,620],[849,569],[819,498],[777,443],[735,410]];
function inside(x,y,contour){let yes=false;for(let i=0,j=contour.length-1;i<contour.length;j=i++){const a=contour[i],b=contour[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}
export function createBloodLivingArt(assets,make,rig={}){
 const contour=rig.contour??CONTOUR,anchor=rig.anchor??456,extent=rig.extent??292,mesh=rig.mesh??{x:436,y:196,w:336,h:240};
 const W=960,H=640,original=make(W,H),oc=original.getContext('2d');oc.drawImage(assets.bloodArt,0,0,W,H);
 const cloth=make(W,H),cc=cloth.getContext('2d');cc.drawImage(original,0,0);
 const mask=cc.getImageData(0,0,W,H),pix=mask.data;
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  const k=(y*W+x)*4,r=pix[k],g=pix[k+1],b=pix[k+2];
  if(!inside(x*1.6,y*1.6,contour)||!((r>45&&g<r*.5&&b<r*.55)||(r<72&&g<48&&b<48)))pix[k+3]=0;
 }cc.putImageData(mask,0,0);
 // Replace only the fabric's original silhouette using its aligned clean plate.
 const cut=make(W,H),kc=cut.getContext('2d');kc.drawImage(cloth,0,0);kc.globalCompositeOperation='source-in';kc.fillStyle='#fff';kc.fillRect(0,0,W,H);
 const base=make(W,H),bc=base.getContext('2d');bc.drawImage(original,0,0);
 const patch=make(W,H),pc=patch.getContext('2d');pc.drawImage(assets.bloodClean,0,0,W,H);pc.globalCompositeOperation='destination-in';pc.drawImage(cut,0,0);bc.drawImage(patch,0,0);
 const fire=make(W,H),fc=fire.getContext('2d');fc.drawImage(original,0,0);const flames=fc.getImageData(0,0,W,H),fp=flames.data;
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  const k=(y*W+x)*4,X=x*1.6,Y=y*1.6,r=fp[k],g=fp[k+1],b=fp[k+2];
  const back=rig.fireRegion?rig.fireRegion(X,Y):(X<195&&Y>80&&Y<650)||(X<310&&Y>435&&Y<670)||(X>880&&X<1090&&Y>45&&Y<340);
  fp[k+3]=back?Math.round(190*clamp((r-135)/65)*clamp((g-55)/55)*clamp((135-b)/65)):0;
 }fc.putImageData(flames,0,0);
 const out=make(W,H),ctx=out.getContext('2d');let previous=-1;
 function map(x,y,t){
  const u=clamp((x-anchor)/extent),v=clamp((y-mesh.y)/mesh.h),weight=u*u;
  return [x+weight*(4.5*Math.sin(t*2.1-u*3+v)+2*Math.sin(t*3.9+v*2)),y+weight*(9*Math.sin(t*2.1-u*3+v*.8)+3.5*Math.sin(t*3.9-u*4))];
 }
 function triangle(a,b,c,A,B,C){
  const den=a[0]*(b[1]-c[1])+b[0]*(c[1]-a[1])+c[0]*(a[1]-b[1]);
  const row=(i)=>[(A[i]*(b[1]-c[1])+B[i]*(c[1]-a[1])+C[i]*(a[1]-b[1]))/den,(A[i]*(c[0]-b[0])+B[i]*(a[0]-c[0])+C[i]*(b[0]-a[0]))/den,(A[i]*(b[0]*c[1]-c[0]*b[1])+B[i]*(c[0]*a[1]-a[0]*c[1])+C[i]*(a[0]*b[1]-b[0]*a[1]))/den];
  const X=row(0),Y=row(1),cx=(A[0]+B[0]+C[0])/3,cy=(A[1]+B[1]+C[1])/3;
  // Overlap raster clips by a subpixel to avoid visible mesh seams.
  const clip=p=>{const dx=p[0]-cx,dy=p[1]-cy,k=.8/Math.hypot(dx,dy);return [p[0]+dx*k,p[1]+dy*k];};
  ctx.save();ctx.beginPath();ctx.moveTo(...clip(A));ctx.lineTo(...clip(B));ctx.lineTo(...clip(C));ctx.closePath();ctx.clip();ctx.transform(X[0],Y[0],X[1],Y[1],X[2],Y[2]);ctx.drawImage(cloth,0,0);ctx.restore();
 }
 function get(age){
  const frame=Math.floor(Math.max(0,age)*30);if(frame===previous)return out;previous=frame;const t=frame/30;
  ctx.clearRect(0,0,W,H);ctx.drawImage(base,0,0);
  // Painted flame details rise locally behind fixed scenery, never across the art.
  for(let x=0;x<W;x+=24){const dy=-2.2-2*Math.sin(t*4.1+x*.027);ctx.drawImage(fire,x,0,24,H,x,dy,24,H+1);}
  for(let y=mesh.y;y<mesh.y+mesh.h;y+=30)for(let x=mesh.x;x<mesh.x+mesh.w;x+=42){
   const a=[x,y],b=[x+42,y],c=[x,y+30],d=[x+42,y+30];
   const A=map(...a,t),B=map(...b,t),C=map(...c,t),D=map(...d,t);
   triangle(a,b,c,A,B,C);triangle(b,d,c,B,D,C);
  }
  return out;
 }
 return {get,dispose(){for(const c of [original,cloth,cut,base,patch,fire,out])c.width=c.height=1;}};
}
export function createBloodArtwork(assets,make,options){return createHellArtwork({...assets,liveArt:createBloodLivingArt(assets,make)},make,options);}
