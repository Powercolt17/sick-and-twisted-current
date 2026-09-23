import {drawMobileScenery} from './mobile-scenery.js?v=5';
import {createVideoResource,drawMediaFrame} from './media-resource.js?v=1';
const clamp=value=>Math.max(0,Math.min(1,value));
const smooth=value=>{const x=clamp(value);return x*x*(3-2*x);};
export function createModeBackground({reduced=false,isMotionEnabled=()=>true,isMobile=()=>false}){
 const floor=new Image();let footing=null,mode='normal',started=performance.now(),paused=document.hidden,suspended=false;
 const layers=Object.entries({allin:'all-in-last-stand',trickster:'trickster-copper-frontier'}).map(([id,file])=>{
  const video=document.createElement('video'),poster=new Image();
  const resource=createVideoResource(video,`assets/modes/${file}.mp4`);video.preload='none';video.loop=true;video.muted=true;video.playsInline=true;video.setAttribute('playsinline','');video.disablePictureInPicture=true;
  poster.src=`assets/modes/${file}.jpg`;
  return {id,file,video,poster,resource,mobile:false,from:0,to:0,playing:null};
 });
 floor.src='assets/ink-refined/frontier.webp';
 function prepareFooting(){
  // Retain the approved foreground and fixed boot line across paid modes.
  footing=document.createElement('canvas');footing.width=282;footing.height=178;
  const c=footing.getContext('2d');
  c.drawImage(floor,0,570/748*floor.naturalHeight,282/1212*floor.naturalWidth,178/748*floor.naturalHeight,0,0,282,178);
  c.globalCompositeOperation='multiply';c.fillStyle='#b88977';c.fillRect(0,0,282,178);
  c.globalCompositeOperation='source-atop';c.fillStyle='#24000020';c.fillRect(0,0,282,178);
  c.globalCompositeOperation='destination-in';
  const vertical=c.createLinearGradient(0,0,0,178);vertical.addColorStop(0,'#0000');vertical.addColorStop(.22,'#000');vertical.addColorStop(.65,'#000');vertical.addColorStop(1,'#0000');c.fillStyle=vertical;c.fillRect(0,0,282,178);
  const horizontal=c.createLinearGradient(0,0,282,0);horizontal.addColorStop(0,'#000');horizontal.addColorStop(.76,'#000');horizontal.addColorStop(1,'#0000');c.fillStyle=horizontal;c.fillRect(0,0,282,178);
 }
 const alpha=(layer,now)=>layer.from+(layer.to-layer.from)*(reduced?1:smooth((now-started)/900));
 const source=layer=>!reduced&&isMotionEnabled()&&layer.video.readyState>=2?layer.video:layer.poster.complete&&layer.poster.naturalWidth?layer.poster:null;
 function sync(now=performance.now()){
  for(const layer of layers){
   const {video}=layer,mobile=isMobile();
   if(layer.mobile!==mobile){layer.resource.release();layer.mobile=mobile;layer.resource=createVideoResource(video,`assets/modes/${layer.file}${mobile?'-mobile':''}.mp4`);}

   if(suspended||(layer.to===0&&alpha(layer,now)<=.001)){if(layer.resource.attached)layer.resource.release();}
   else if(paused||reduced||!isMotionEnabled())video.pause();
   else if(video.paused)void layer.resource.play();
  }
 }
 function setMode(next,now){
  if(next!==mode){for(const layer of layers){layer.from=alpha(layer,now);layer.to=next===layer.id?1:0;}started=now;mode=next;}
  sync(now);
 }
 function draw(ctx,now,{x=0,y=0,w=1212,h=608,mobile=false}={}){
  const visible=layers.map(layer=>({layer,src:source(layer),weight:alpha(layer,now)})).filter(item=>item.src&&item.weight>.001);
  for(let i=0;i<visible.length;i++){
   const {layer,src,weight}=visible[i];
   // Normalize source-over alpha so direct mode switches never flash the base scene.
   const above=visible.slice(i+1).reduce((sum,item)=>sum+item.weight,0),a=clamp(weight/Math.max(.001,1-above));
   const sw=src.videoWidth||src.naturalWidth,sh=src.videoHeight||src.naturalHeight,k=Math.max(w/sw,h/sh),dw=sw*k,dh=sh*k;
   ctx.save();ctx.globalAlpha=a;if(mobile)drawMobileScenery(ctx,src,{x,y,w,h},layer.poster,layer.id);else drawMediaFrame(ctx,src,x+(w-dw)/2,y+(h-dh)/2,dw,dh);
   const shade=ctx.createLinearGradient(0,y,0,y+h),allin=layer.id==='allin';
   shade.addColorStop(0,allin?'#08000026':'#100a0420');shade.addColorStop(.58,allin?'#18000010':'#1e120609');shade.addColorStop(1,allin?'#09000035':'#09050030');ctx.fillStyle=shade;ctx.fillRect(x,y,w,h);
   if(footing&&y===0&&!mobile)ctx.drawImage(footing,0,570);ctx.restore();
  }
 }
 document.addEventListener('visibilitychange',()=>{paused=document.hidden;sync();});
 return {async load(){
  await Promise.all([floor.decode().then(prepareFooting).catch(()=>null),...layers.map(({poster})=>poster.decode().catch(()=>null))]);sync();
 },get opaque(){const active=layers.filter(layer=>alpha(layer,performance.now())>.001);return active.some(layer=>alpha(layer,performance.now())>=.999&&source(layer));},setMode,draw,setSuspended(value){if(suspended===value)return;suspended=value;sync();},get opacity(){return layers.reduce((sum,layer)=>sum+alpha(layer,performance.now()),0);}};
}
