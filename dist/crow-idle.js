import {crowPose} from './scene-motion.js?v=1';

// A small mesh rig over the ORIGINAL painted crow. The skull/post are static;
// claws are pinned, the neck bends, and the tail follows the town's wind.
const ORIGIN=[1245,4],SIZE=[223,225];
const OUTLINE=[[1248,56],[1251,47],[1259,39],[1272,32],[1287,20],[1304,15],[1318,15],[1335,23],[1349,33],[1360,39],[1380,44],[1398,55],[1415,76],[1428,94],[1440,116],[1454,137],[1445,130],[1463,161],[1448,149],[1462,180],[1450,171],[1454,194],[1460,220],[1446,209],[1435,198],[1444,224],[1432,216],[1420,195],[1411,180],[1390,163],[1372,151],[1358,149],[1347,158],[1336,157],[1334,150],[1345,144],[1349,134],[1339,140],[1326,133],[1316,118],[1300,102],[1290,80],[1286,53],[1284,49],[1283,44],[1269,47]];
export function createCrowIdle(image){
 const art=document.createElement('canvas');art.width=SIZE[0];art.height=SIZE[1];
 const c=art.getContext('2d');c.save();c.translate(-ORIGIN[0],-ORIGIN[1]);c.beginPath();OUTLINE.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.clip();c.drawImage(image,0,0);c.restore();
 const nx=12,ny=12,points=[];
 for(let y=0;y<=ny;y++)for(let x=0;x<=nx;x++)points.push([x*SIZE[0]/nx,y*SIZE[1]/ny]);
 const triangles=[];for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){const a=y*(nx+1)+x,b=a+1,d=a+nx+1,e=d+1;triangles.push([a,b,e],[a,e,d]);}
 // A conservative source bound includes the mesh's antialiased overlap.
 // Empty mesh cells cannot contribute pixels, even while the rig deforms.
 const pixels=c.getImageData(0,0,art.width,art.height).data;
 const visibleTriangles=triangles.map(indices=>{
  const src=indices.map(i=>points[i]),pad=8;
  const x=Math.max(0,Math.floor(Math.min(...src.map(p=>p[0])))-pad),y=Math.max(0,Math.floor(Math.min(...src.map(p=>p[1])))-pad);
  const right=Math.min(art.width,Math.ceil(Math.max(...src.map(p=>p[0])))+pad),bottom=Math.min(art.height,Math.ceil(Math.max(...src.map(p=>p[1])))+pad);
  let visible=false;for(let row=y;row<bottom&&!visible;row++)for(let col=x;col<right;col++)if(pixels[(row*art.width+col)*4+3]){visible=true;break;}
  return visible?{indices,src,box:[x,y,right-x,bottom-y]}:null;
 }).filter(Boolean);
 function deform(x,y,p){
  const X=x+ORIGIN[0],Y=y+ORIGIN[1];
  const neck=Math.max(0,Math.min(1,(105-Y)/51)),n=neck*neck*(3-2*neck),a=p.head*n;
  const dx=X-1332,dy=Y-89;
  let ox=(dx*Math.cos(a)-dy*Math.sin(a)-dx),oy=(dx*Math.sin(a)+dy*Math.cos(a)-dy);
  const chest=Math.max(0,1-Math.abs(Y-88)/54)*Math.max(0,1-Math.abs(X-1344)/67);
  ox-=p.breath*chest;oy-=p.breath*chest*.6;
  const tail=Math.max(0,Math.min(1,(X-1368)/73))*Math.max(0,Math.min(1,(Y-102)/67));
  ox-=p.tail*(Y-109)*tail;oy+=p.tail*(X-1370)*tail;
  const wing=Math.max(0,1-Math.abs(X-1381)/45)*Math.max(0,1-Math.abs(Y-89)/49);
  ox+=p.ruffle*wing*1.8;oy-=p.ruffle*wing*.6;
  // Exact planted-claw zone: no translating the bird across its perch.
  const feet=Math.max(0,1-Math.abs(Y-147)/15)*Math.max(0,1-Math.abs(X-1348)/31);
  return [x+ox*(1-feet),y+oy*(1-feet)];
 }
 function triangle(ctx,src,dst,box){
  const [a,b,c]=src,[A,B,C]=dst,det=(b[0]-a[0])*(c[1]-a[1])-(c[0]-a[0])*(b[1]-a[1]);
  const aa=((B[0]-A[0])*(c[1]-a[1])-(C[0]-A[0])*(b[1]-a[1]))/det;
  const bb=((B[1]-A[1])*(c[1]-a[1])-(C[1]-A[1])*(b[1]-a[1]))/det;
  const cc=((C[0]-A[0])*(b[0]-a[0])-(B[0]-A[0])*(c[0]-a[0]))/det;
  const dd=((C[1]-A[1])*(b[0]-a[0])-(B[1]-A[1])*(c[0]-a[0]))/det;
  ctx.save();ctx.beginPath();
  // Tiny overlap removes antialiased mesh seams without changing the silhouette.
  const mx=(A[0]+B[0]+C[0])/3,my=(A[1]+B[1]+C[1])/3;
  for(let i=0;i<3;i++){const p=dst[i],dx=p[0]-mx,dy=p[1]-my,l=Math.hypot(dx,dy),x=p[0]+dx/l*.9,y=p[1]+dy/l*.9;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}
  ctx.closePath();ctx.clip();ctx.transform(aa,bb,cc,dd,A[0]-aa*a[0]-cc*a[1],A[1]-bb*a[0]-dd*a[1]);ctx.drawImage(art,...box,...box);ctx.restore();
 }
 function drawOriginal(ctx,t=0,animate=true){
  ctx.save();ctx.translate(...ORIGIN);
  if(!animate){ctx.drawImage(art,0,0);ctx.restore();return;}
  const p=crowPose(t),mapped=points.map(([x,y])=>deform(x,y,p));
  for(const tri of visibleTriangles)triangle(ctx,tri.src,tri.indices.map(i=>mapped[i]),tri.box);
  if(p.blink>.01){const [x,y]=deform(1294-ORIGIN[0],33-ORIGIN[1],p);ctx.save();ctx.translate(x,y);ctx.rotate(p.head);ctx.fillStyle='#171b1c';ctx.beginPath();ctx.ellipse(0,0,4.3,3.2*p.blink,-.25,0,Math.PI*2);ctx.fill();ctx.restore();}
  ctx.restore();
 }
 // Keep the exact articulated pose, but rasterize its 288 mesh triangles once
 // per ambient tick on phones instead of rebuilding them on the reel canvas.
 let cache=null,cacheContext=null,painted=-Infinity,cachedAnimate=null;
 return {draw(ctx,t=0,animate=true,compact=false){
  if(!compact){drawOriginal(ctx,t,animate);return;}
  const pad=12;
  if(!cache){cache=document.createElement('canvas');cache.width=SIZE[0]+pad*2;cache.height=SIZE[1]+pad*2;cacheContext=cache.getContext('2d');}
  if(cachedAnimate!==animate||Math.abs(t-painted)>=1/24){
   cacheContext.clearRect(0,0,cache.width,cache.height);cacheContext.save();cacheContext.translate(pad-ORIGIN[0],pad-ORIGIN[1]);
   drawOriginal(cacheContext,t,animate);cacheContext.restore();painted=t;cachedAnimate=animate;
  }
  ctx.drawImage(cache,ORIGIN[0]-pad,ORIGIN[1]-pad);
 }};
}
