import {drawMediaFrame} from './media-resource.js?v=1';
// One static detailed floor is graded per scene and rasterized only on resize.
// No extra video decoder, per-frame filtering, or procedural texture work.
const floorArt=typeof Image==='function'?new Image():null;
if(floorArt)floorArt.src='assets/mobile-floor-detail.webp';
const floorCache=new Map();
const floorGrades={normal:'sepia(.2) saturate(.8) brightness(.9)',allin:'sepia(.55) saturate(1.1) brightness(.58)',trickster:'sepia(.55) saturate(.85) brightness(.82)',blood:'sepia(.4) saturate(.65) brightness(.54)',hang:'sepia(.4) saturate(.65) brightness(.62)',hell:'sepia(.6) saturate(1.05) brightness(.57)'};
function detailedFloor(ctx,g,tone){
 if(!floorArt?.naturalWidth)return false;
 const h=g.h-(g.groundTop-g.y),key=[tone,g.w,h].join(':');
 let plate=floorCache.get(key);
 if(!plate){
  plate=document.createElement('canvas');plate.width=Math.ceil(g.w);plate.height=Math.ceil(h);
  const c=plate.getContext('2d'),k=Math.max(g.w/floorArt.naturalWidth,h/floorArt.naturalHeight);
  c.filter=floorGrades[tone]||floorGrades.normal;
  c.drawImage(floorArt,(g.w-floorArt.naturalWidth*k)/2,0,floorArt.naturalWidth*k,floorArt.naturalHeight*k);
  c.filter='none';
  c.globalCompositeOperation='multiply';c.fillStyle=({allin:'#cf8b70',hell:'#cd927a',blood:'#a8aaa0',hang:'#b4aa8e',trickster:'#dfbc87',normal:'#eee0c6'})[tone]||'#eee0c6';c.fillRect(0,0,plate.width,plate.height);
  c.globalCompositeOperation='source-over';
  // A small bounded cache covers all modes and the current orientation.
  if(floorCache.size>=8)floorCache.delete(floorCache.keys().next().value);
  floorCache.set(key,plate);
 }
 ctx.drawImage(plate,g.x,g.groundTop,g.w,h);return true;
}
// The complete skyline stays proportional. A proportional crop of the source's
// dirt foreground fills the space behind the cabinet; never stretch landmarks.
export function mobileSceneryGeometry(sw,sh,{x=150,y=-500,w=900,h=1600}){
 const scale=w/sw,upper=sh*scale,fade=upper*.14,groundTop=y+upper-fade;
 const sourceGround=sh*.24,groundScale=Math.max(w/sw,(y+h-groundTop)/sourceGround);
 return {x,y,w,h,upper,fade,groundTop,groundScale,sourceGround,sw,sh};
}
function composeMobileScenery(ctx,source,b,detailSource=source,tone='normal'){
 const sw=source.videoWidth||source.naturalWidth||source.width,sh=source.videoHeight||source.naturalHeight||source.height;
 if(!sw||!sh)return;
 const g=mobileSceneryGeometry(sw,sh,b),alpha=ctx.globalAlpha;
 ctx.save();ctx.beginPath();ctx.rect(g.x,g.y,g.w,g.h);ctx.clip();
 // Sample the original still directly: never magnify a downsampled video crop.
 const dw=detailSource.naturalWidth||detailSource.width||sw,dh=detailSource.naturalHeight||detailSource.height||sh;
 const detailGround=dh*.24,groundHeight=g.h-(g.groundTop-g.y);
 const groundScale=Math.max(g.w/dw,groundHeight/detailGround),cropWidth=g.w/groundScale;
 if(!detailedFloor(ctx,g,tone))drawMediaFrame(ctx,detailSource,(dw-cropWidth)/2,dh-detailGround,cropWidth,detailGround,g.x,g.groundTop,g.w,detailGround*groundScale);
 const split=sh*.86;
 drawMediaFrame(ctx,source,0,0,sw,split,g.x,g.y,g.w,g.upper*.86);
 // Feather only low ground into low ground; no detached subject overlays.
 const bands=24,band=(sh-split)/bands;
 for(let i=0;i<bands;i++){
  ctx.globalAlpha=alpha*(1-i/bands);
  drawMediaFrame(ctx,source,0,split+i*band,sw,band,g.x,g.y+(split+i*band)*g.w/sw,g.w,band*g.w/sw+.5);
 }
 ctx.restore();
}

// A decoded video frame crosses into canvas once, not once per feather band.
// Keep animation work separate from the game RAF and retain only one small
// snapshot and one composition per live source. Weak keys release unused media.
const sceneryCache=new WeakMap();
export function drawMobileScenery(ctx,source,b,detailSource=source,tone='normal'){
 if(!(detailSource?.naturalWidth||detailSource?.width))detailSource=source;
 const sw=source.videoWidth||source.naturalWidth||source.width,sh=source.videoHeight||source.naturalHeight||source.height;
 if(!sw||!sh)return;
 const scale=Math.max(.5,Math.min(1,Math.round((ctx.getTransform?.()?.a||1)*2)/2));
 const width=Math.ceil(b.w*scale),height=Math.ceil(b.h*scale),key=[width,height,b.w,b.h,tone,!!floorArt?.naturalWidth].join(':');
 let cache=sceneryCache.get(source);
 if(!cache){const frame=document.createElement('canvas'),scene=document.createElement('canvas');cache={frame,scene,frameCtx:frame.getContext('2d'),sceneCtx:scene.getContext('2d'),key:null,time:-Infinity,stamp:null};sceneryCache.set(source,cache);}
 const now=performance.now(),video=typeof source.currentTime==='number',live=video||typeof source.getContext==='function';
 const stamp=video?source.currentTime:null;
 const invalid=key!==cache.key||detailSource!==cache.detailSource;
 if(invalid||(live&&(!video||stamp!==cache.stamp)&&now-cache.time>=1000/24)){
  const fw=Math.min(sw,Math.max(960,width)),fh=Math.round(fw*sh/sw);
  if(cache.frame.width!==fw||cache.frame.height!==fh){cache.frame.width=fw;cache.frame.height=fh;}
  if(drawMediaFrame(cache.frameCtx,source,0,0,fw,fh)){
   if(cache.scene.width!==width||cache.scene.height!==height){cache.scene.width=width;cache.scene.height=height;}
   cache.sceneCtx.setTransform(width/b.w,0,0,height/b.h,0,0);
   cache.sceneCtx.clearRect(0,0,b.w,b.h);
   composeMobileScenery(cache.sceneCtx,cache.frame,{x:0,y:0,w:b.w,h:b.h},detailSource===source&&video?cache.frame:detailSource,tone);
   cache.key=key;cache.time=now;cache.stamp=stamp;cache.detailSource=detailSource;
  }
 }
 if(cache.key)ctx.drawImage(cache.scene,b.x,b.y,b.w,b.h);
}
