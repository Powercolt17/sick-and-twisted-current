import {drawMobileScenery} from './mobile-scenery.js?v=5';
import {createBrushWind} from './brush-wind.js?v=1';
import {createStaticRaster} from './static-raster.js?v=1';
export const BRUSH_CLUMPS=[
 {source:[30,260,910,446],x:17,y:801,w:229,h:138,flex:8.5,delay:0,stiffness:17,damping:7.2},
 {source:[946,20,700,686],x:1354,y:702,w:167,h:157,flex:6.5,delay:.23,stiffness:21,damping:8.3},
 {source:[1680,145,472,561],x:270,y:688,w:112,h:131,flex:8,delay:.41,stiffness:15,damping:6.7}
];
// Ambient artwork is isolated from the reels, outcomes and payout presentation.
export function createGhostTown({ctx,W,H,reduced}){
 let backdrop=null,mist=null,sky=null,ground=null,brush=null,clean=null,grass=null,elapsed=0,previous=null,emphasis=1;
 let motionEnabled=!reduced;
 let phoneWorld=null,phoneWorldContext=null,phoneCache=null,phoneContext=null,phonePaint=-Infinity,phoneKey='';
 const groundRaster=createStaticRaster({width:W,height:H,paint:target=>target.drawImage(ground||backdrop,0,0,W,H)});
 try{const saved=window.localStorage?.getItem('sick-twisted-background-motion');if(saved==='on'||saved==='off')motionEnabled=saved==='on';}catch{}
 const flakes=Array.from({length:22},(_,i)=>({
  x:((i*197+73)%1212)/1212,
  y:((i*137+41)%608)/608,
  speed:8+(i%5)*1.1,
  fall:5+(i%7)*.9,
  radius:.7+(i%4)*.22,
  phase:i*2.399963
 }));
 async function load(){
  const acquire=async path=>{const im=new Image();im.src=path;await im.decode();return im;};
  [backdrop,mist,clean,grass]=await Promise.all([
   acquire('assets/ink-refined/frontier.webp'),
   acquire('assets/ghost-town/mist.webp'),
   acquire('assets/ink-refined/frontier.webp'),
   acquire('assets/ink-western/brush.webp')
  ]);
  prepareAtmosphere();
  prepareBrush();
 }
 function prepareBrush(){
  ground=document.createElement('canvas');ground.width=W;ground.height=H;
  const gc=ground.getContext('2d');gc.drawImage(backdrop,0,0,W,H);
  // The source town remains intact everywhere except the three small places
  // where a plant has been lifted onto its own transparent animation layer.
  for(const [sx,sy,sw,sh] of [[0,781,265,160],[1302,678,230,219],[237,664,181,173]]){
   const x=sx*W/1672,y=sy*H/941,w=Math.ceil(sw*W/1672),h=Math.ceil(sh*H/941),patch=document.createElement('canvas');patch.width=w;patch.height=h;
   const pc=patch.getContext('2d');pc.drawImage(clean,sx/1672*clean.width,sy/941*clean.height,sw/1672*clean.width,sh/941*clean.height,0,0,w,h);
   const pixels=pc.getImageData(0,0,w,h),d=pixels.data,edge=14;
   for(let py=0;py<h;py++)for(let px=0;px<w;px++){
    const left=sx===0?1:smooth(px/edge),bottom=sy+sh>=941?1:smooth((h-1-py)/edge);
    d[(py*w+px)*4+3]=Math.round(255*left*bottom*smooth((w-1-px)/edge)*smooth(py/edge));
   }
   pc.putImageData(pixels,0,0);gc.drawImage(patch,x,y,w,h);
  }
  // Atlas crop and placement are resolved from the isolated painted clumps.
  brush=createBrushWind({atlas:grass,clumps:BRUSH_CLUMPS.map(p=>({...p,x:p.x*W/1672,y:p.y*H/941,w:p.w*W/1672,h:p.h*H/941,flex:p.flex*W/1672}))});
 }
 const smooth=v=>{v=Math.max(0,Math.min(1,v));return v*v*(3-2*v);};
 function prepareAtmosphere(){
  // Keep every roof, cliff and branch fixed. Only the source's painted sky
  // receives a slow drift, with an invisible feather into the original plate.
  sky=document.createElement('canvas');sky.width=W;sky.height=Math.ceil(340*H/608);
  const sc=sky.getContext('2d');sc.drawImage(backdrop,0,0,W,H);
  const pixels=sc.getImageData(0,0,W,sky.height),d=pixels.data;
  const boundary=(y,points)=>{for(let i=1;i<points.length;i++)if(y<=points[i][0]){const a=points[i-1],b=points[i],u=(y-a[0])/(b[0]-a[0]);return a[1]+(b[1]-a[1])*u;}return points.at(-1)[1];};
  const left=[[0,180],[40,214],[100,305],[160,339],[220,440],[280,540],[340,644]];
  const right=[[0,995],[70,1035],[130,1050],[190,1015],[260,930],[340,810]];
  for(let y=0;y<sky.height;y++){const sourceY=y*608/H,l=boundary(sourceY,left),r=boundary(sourceY,right);for(let x=0;x<W;x++)d[(y*W+x)*4+3]=Math.round(255*smooth((x-l)/35)*smooth((r-x)/38)*smooth((340-sourceY)/45));}
  sc.putImageData(pixels,0,0);
 }
 function livingLandscape(time,target=ctx){
  if(!motionEnabled||reduced)return;
  if(sky)for(let y=0;y<sky.height;y+=8){
   const shift=15*Math.sin(time*.055)+4*(Math.sin(time*.12+y*.008)-Math.sin(y*.008));
   target.drawImage(sky,0,y,W,Math.min(8,sky.height-y),shift,y,W,Math.min(8,sky.height-y));
  }
 }
 function fogBand({width,height,y,speed,alpha,phase},time,target=ctx){
  // The texture fades to black at every edge. Screen blending makes each
  // repeated edge invisible while the overlapping wisps drift continuously.
  const offset=((time*speed+phase)%width+width)%width;
  target.globalAlpha=alpha;
  for(let x=offset-width;x<W;x+=width){
   target.drawImage(mist,x,y+Math.sin(time*.12+phase)*6,width,height);
  }
 }
 function draw(now,options={}){
  emphasis+=( (options.emphasis??1)-emphasis)*.08;
  if(!backdrop)return;
  // Resume from the same atmosphere after a hidden tab; never advance game RNG.
  if(previous!==null&&motionEnabled&&!reduced&&!document.hidden)elapsed+=Math.max(0,Math.min(100,now-previous))/1000*emphasis;
  previous=now;
  const time=elapsed;
  if(options.occluded)return; // The feature film fully covers this atmosphere.
  if(options.mobile){
   const top=options.top||0,total=608+top+(options.bottom||140),scale=options.scale||1;
   const key=[top,total,scale,options.sceneX,options.sceneWidth,motionEnabled,reduced].join(':');
   if(!phoneCache){phoneCache=document.createElement('canvas');phoneContext=phoneCache.getContext('2d',{alpha:false});phoneWorld=document.createElement('canvas');phoneWorld.width=W;phoneWorld.height=H;phoneWorldContext=phoneWorld.getContext('2d',{alpha:false});}
   if(key!==phoneKey){phoneKey=key;phoneCache.width=Math.round(W*scale);phoneCache.height=Math.round(total*scale);phonePaint=-Infinity;}
   // Only the secondary atmosphere is cached at 24 Hz. Reels, impacts, sounds,
   // wild conversions and all feature clocks still advance every game frame.
   if(now-phonePaint>=(options.lowPower?100:1000/24)){
    phoneContext.setTransform(scale,0,0,scale,0,0);
    paint(phoneWorldContext,time,false);
    drawMobileScenery(phoneContext,phoneWorld,{x:options.sceneX||0,y:0,w:options.sceneWidth||W,h:total},backdrop);
    phonePaint=now;
   }
   ctx.drawImage(phoneCache,0,-top,W,total);
  }else paint(ctx,time,options.cacheStatic!==false);
 }
 function paint(target,time,cacheStatic){
  target.save();
  groundRaster.draw(target,cacheStatic);
  livingLandscape(time,target);
  brush?.draw(target,time,motionEnabled&&!reduced);
  target.globalCompositeOperation='screen';
  // Brighter, narrower wisps remain readable in the exposed side columns.
  // Far haze drifts gently; the low foreground layer crosses the town faster.
  fogBand({width:910,height:205,y:-103,speed:7,alpha:.06,phase:137},time,target);
  fogBand({width:580,height:245,y:232,speed:12,alpha:.08,phase:199},time,target);
  fogBand({width:430,height:200,y:397,speed:22,alpha:.12,phase:71},time,target);
  if(motionEnabled&&!reduced){
   target.fillStyle='#cfc8b8';
   for(const f of flakes){
    const x=(f.x*(W+30)+time*f.speed+Math.sin(time*.31+f.phase)*7)%(W+30)-15;
    const y=(f.y*(H+24)+time*f.fall)%(H+24)-12;
    const edge=Math.min(1,Math.max(0,y/40),Math.max(0,(H-y)/40));
    target.globalAlpha=(.2+.16*(.5+.5*Math.sin(time*.4+f.phase)))*edge;
    target.beginPath();target.ellipse(x,y,f.radius,f.radius*.65,.45,0,Math.PI*2);target.fill();
   }
  }
  target.restore();
 }
 function setMotion(enabled){
  motionEnabled=Boolean(enabled);previous=null;
  try{window.localStorage?.setItem('sick-twisted-background-motion',motionEnabled?'on':'off');}catch{}
 }
 return {load,draw,setMotion,isMotionEnabled:()=>motionEnabled&&!reduced,get motionTime(){return elapsed*1000;}};
}
