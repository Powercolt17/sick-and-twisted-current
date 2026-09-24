import {crowPose} from './scene-motion.js?v=1';
// The base game's crow rig (crow-idle.js) generalised to any cut-out crow: same 12x12 mesh, same shared
// crowPose clock (head turn, breath, tail in the wind, one ruffle, blinks), but anatomy is given as fractions
// of the cut-out's box instead of pixel coordinates in the original frame painting. Ambience only.
const clamp=x=>Math.max(0,Math.min(1,x));
export const DEFAULT_ANATOMY={neck:[.22,.45],pivot:[.39,.38],chest:[.44,.37,.30,.24],tail:[.55,.44,.56,.47],wing:[.61,.38,.20,.22],feet:[.46,.64,.14,.07],eye:[.22,.13],eyeTilt:-.25};
export function createCrowRig(art,anatomy=DEFAULT_ANATOMY,{reference=223}={}){
 const W=art.naturalWidth||art.width,H=art.naturalHeight||art.height,k=W/reference,A={...DEFAULT_ANATOMY,...anatomy};
 const nx=12,ny=12,points=[];
 for(let y=0;y<=ny;y++)for(let x=0;x<=nx;x++)points.push([x*W/nx,y*H/ny]);
 const triangles=[];for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){const a=y*(nx+1)+x,b=a+1,d=a+nx+1,e=d+1;triangles.push([a,b,e],[a,e,d]);}
 // Only mesh cells that hold pixels are ever drawn (the source stays untouched).
 const probe=document.createElement('canvas');probe.width=W;probe.height=H;const pc=probe.getContext('2d',{willReadFrequently:true});pc.drawImage(art,0,0);
 const pixels=pc.getImageData(0,0,W,H).data;
 const visible=triangles.map(indices=>{
  const src=indices.map(i=>points[i]),pad=8;
  const x=Math.max(0,Math.floor(Math.min(...src.map(p=>p[0])))-pad),y=Math.max(0,Math.floor(Math.min(...src.map(p=>p[1])))-pad);
  const right=Math.min(W,Math.ceil(Math.max(...src.map(p=>p[0])))+pad),bottom=Math.min(H,Math.ceil(Math.max(...src.map(p=>p[1])))+pad);
  let on=false;for(let row=y;row<bottom&&!on;row++)for(let col=x;col<right;col++)if(pixels[(row*W+col)*4+3]){on=true;break;}
  return on?{indices,src,box:[x,y,right-x,bottom-y]}:null;
 }).filter(Boolean);
 function deform(x,y,p){
  const u=x/W,v=y/H;
  const n0=clamp((A.neck[1]-v)/(A.neck[1]-A.neck[0])),n=n0*n0*(3-2*n0),a=p.head*n;
  const px=A.pivot[0]*W,py=A.pivot[1]*H,dx=x-px,dy=y-py;
  let ox=dx*Math.cos(a)-dy*Math.sin(a)-dx,oy=dx*Math.sin(a)+dy*Math.cos(a)-dy;
  const chest=Math.max(0,1-Math.abs(v-A.chest[1])/A.chest[3])*Math.max(0,1-Math.abs(u-A.chest[0])/A.chest[2]);
  ox-=p.breath*k*chest;oy-=p.breath*k*chest*.6;
  const tail=clamp((u-A.tail[0])/.33)*clamp((v-A.tail[1])/.3),tx=A.tail[2]*W,ty=A.tail[3]*H;
  ox-=p.tail*(y-ty)*tail;oy+=p.tail*(x-tx)*tail;
  const wing=Math.max(0,1-Math.abs(u-A.wing[0])/A.wing[2])*Math.max(0,1-Math.abs(v-A.wing[1])/A.wing[3]);
  ox+=p.ruffle*k*wing*1.8;oy-=p.ruffle*k*wing*.6;
  // Planted claws: the bird never slides on its perch.
  const feet=Math.max(0,1-Math.abs(v-A.feet[1])/A.feet[3])*Math.max(0,1-Math.abs(u-A.feet[0])/A.feet[2]);
  return [x+ox*(1-feet),y+oy*(1-feet)];
 }
 function triangle(ctx,src,dst,box){
  const [a,b,c]=src,[P,Q,R]=dst,det=(b[0]-a[0])*(c[1]-a[1])-(c[0]-a[0])*(b[1]-a[1]);
  const aa=((Q[0]-P[0])*(c[1]-a[1])-(R[0]-P[0])*(b[1]-a[1]))/det,bb=((Q[1]-P[1])*(c[1]-a[1])-(R[1]-P[1])*(b[1]-a[1]))/det;
  const cc=((R[0]-P[0])*(b[0]-a[0])-(Q[0]-P[0])*(c[0]-a[0]))/det,dd=((R[1]-P[1])*(b[0]-a[0])-(Q[1]-P[1])*(c[0]-a[0]))/det;
  ctx.save();ctx.beginPath();
  const mx=(P[0]+Q[0]+R[0])/3,my=(P[1]+Q[1]+R[1])/3;
  for(let i=0;i<3;i++){const p=dst[i],ex=p[0]-mx,ey=p[1]-my,l=Math.hypot(ex,ey)||1,x=p[0]+ex/l*.9,y=p[1]+ey/l*.9;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}
  ctx.closePath();ctx.clip();ctx.transform(aa,bb,cc,dd,P[0]-aa*a[0]-cc*a[1],P[1]-bb*a[0]-dd*a[1]);ctx.drawImage(art,...box,...box);ctx.restore();
 }
 function drawOriginal(ctx,t,animate){
  if(!animate){ctx.drawImage(art,0,0);return;}
  const p=crowPose(t),mapped=points.map(([x,y])=>deform(x,y,p));
  for(const tri of visible)triangle(ctx,tri.src,tri.indices.map(i=>mapped[i]),tri.box);
  if(p.blink>.01){const [x,y]=deform(A.eye[0]*W,A.eye[1]*H,p);ctx.save();ctx.translate(x,y);ctx.rotate(p.head+A.eyeTilt);ctx.fillStyle='#171b1c';ctx.beginPath();ctx.ellipse(0,0,4.3*k,3.2*k*p.blink,0,0,Math.PI*2);ctx.fill();ctx.restore();}
 }
 let cache=null,cctx=null,painted=-Infinity,cachedAnimate=null;
 return {width:W,height:H,draw(ctx,t=0,animate=true,compact=false){
  if(!compact){drawOriginal(ctx,t,animate);return;}
  const pad=12;
  if(!cache){cache=document.createElement('canvas');cache.width=W+pad*2;cache.height=H+pad*2;cctx=cache.getContext('2d');}
  if(cachedAnimate!==animate||Math.abs(t-painted)>=1/24){cctx.clearRect(0,0,cache.width,cache.height);cctx.save();cctx.translate(pad,pad);drawOriginal(cctx,t,animate);cctx.restore();painted=t;cachedAnimate=animate;}
  ctx.drawImage(cache,-pad,-pad);
 }};
}
