import {createVideoResource,drawMediaFrame} from './media-resource.js?v=1';
import {createStaticRaster} from './static-raster.js?v=1';
// Feature cabinet borders. Presentation only: no outcome, payout or timing changes.
//   Trickster Spins + Hang 'Em High -> rope frame (static art)
//   All In Spins + Hell To Pay      -> OpenArt hell frame, 1080p, keyed from green (RGB|matte packed H.264, 3840x1080)
//   Base, Bounty Booster, Blood Money keep the original reel-frame.js border.
// Opening = [x,y,w,h] of the reel window inside each source image.
// PROVISIONAL until measured on the delivered art; everything else reads from here.
export const FEATURE_BORDER_ART={
 rope:{src:'assets/feature-borders/rope.webp',opening:[252,277,1083,536]},
 inferno:{poster:'assets/feature-borders/inferno-poster.webp',video:'assets/feature-borders/inferno-packed.mp4',size:[1920,1080],opening:[271,303,1326,648]}
};
// Fallback numbers only; the real windows are measured from the art at load time (measureOpening).
export function featureBorderKind({mode='normal',bonus=false,label='',feature=null}={}){
 // A running feature scene outranks the paid mode that was selected before it.
 if(feature)return feature==='hell'?'inferno':feature==='hang'?'rope':'normal';
 if(bonus)return label==='HELL'?'inferno':label==='DEAD'?'normal':'rope';
 return mode==='allin'?'inferno':mode==='trickster'?'rope':'normal';
}
// Measure the reel window straight from the art's alpha channel, so the reels sit against the wood
// with no gap regardless of hand-typed numbers. Scans rows/columns through the middle of the image and
// takes the OUTERMOST solid pixel (2nd percentile), so rope that bulges past the wood is clipped behind
// the reels instead of leaving a notch beside them. Returns [x,y,w,h] or null when there is no window.
export function openingFromAlpha(data,w,h,threshold=160){
 const solid=(x,y)=>data[(y*w+x)*4+3]>=threshold;
 const pick=(arr,lo)=>{arr.sort((a,b)=>a-b);return arr[Math.min(arr.length-1,Math.floor(arr.length*(lo?.02:.98)))];};
 const rows=[],cols=[];for(let y=Math.round(h*.35);y<h*.65;y+=2)rows.push(y);for(let x=Math.round(w*.35);x<w*.65;x+=2)cols.push(x);
 const cx=w>>1,cy=h>>1;if(solid(cx,cy))return null;
 const L=[],R=[],T=[],B=[];
 for(const y of rows){let x=cx;while(x>0&&!solid(x,y))x--;L.push(x+1);x=cx;while(x<w-1&&!solid(x,y))x++;R.push(x);}
 for(const x of cols){let y=cy;while(y>0&&!solid(x,y))y--;T.push(y+1);y=cy;while(y<h-1&&!solid(x,y))y++;B.push(y);}
 const x0=pick(L,true),x1=pick(R,false),y0=pick(T,true),y1=pick(B,false);
 if(x0<=1||y0<=1||x1>=w-1||y1>=h-1||x1-x0<w*.3||y1-y0<h*.3)return null;
 return [x0,y0,x1-x0,y1-y0];
}
export function measureOpening(image,threshold){
 try{const w=image.naturalWidth||image.width,h=image.naturalHeight||image.height,c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(image,0,0);return openingFromAlpha(g.getImageData(0,0,w,h).data,w,h,threshold);}catch{return null;}
}
// Source -> world rectangles. Width scales uniformly so the window's left/right edges land on G.
// Header and footer keep that same scale and hang off the window (so the crow is not stretched or
// pushed off the top); only if they would not fit in the cabinet are they compressed to fit.
// The body is fitted to G.h exactly, which is the only slice that can distort.
export function borderSlices([w,h],[x,y,iw,ih],G,worldH=608){
 const sx=G.w/iw,dx=G.x-x*sx,dw=w*sx,hs=Math.min(sx,G.y/y),fs=Math.min(sx,(worldH-G.y-G.h)/Math.max(1,h-y-ih));
 return [[0,0,w,y,dx,G.y-y*hs,dw,y*hs],[0,y,w,ih,dx,G.y,dw,G.h],[0,y+ih,w,h-y-ih,dx,G.y+G.h,dw,(h-y-ih)*fs]].filter(s=>s[3]>0&&s[7]>0);
}
const VERTEX='attribute vec2 p;varying vec2 uv;void main(){uv=vec2(p.x*.5+.5,.5-p.y*.5);gl_Position=vec4(p,0.,1.);}';
// Left half = straight colour (green screen already removed and edge-padded offline), right half = matte (red channel).
const FRAGMENT='precision mediump float;varying vec2 uv;uniform sampler2D art;void main(){vec3 c=texture2D(art,vec2(uv.x*.5,uv.y)).rgb;float a=texture2D(art,vec2(.5+uv.x*.5,uv.y)).r;gl_FragColor=vec4(c,smoothstep(.03,.97,a));}';
export function createFeatureBorders({G,reduced=false,worldH=608,doc=globalThis.document}={}){
 const ART=FEATURE_BORDER_ART;
 let kind='normal',rope=null,poster=null,decoder=null,failed=false,motion=true,fresh=true,lastTime=-1,frameHook=0;
 let ropeOpening=ART.rope.opening,fireOpening=ART.inferno.opening;
 const size=im=>[im.naturalWidth||im.width,im.naturalHeight||im.height];
 function paint(ctx,src,dims,opening){
  ctx.save();ctx.beginPath();ctx.rect(-400,-400,G.x+G.w+1200,worldH+800);ctx.rect(G.x,G.y,G.w,G.h);ctx.clip('evenodd');
  for(const s of borderSlices(dims,opening,G,worldH))drawMediaFrame(ctx,src,...s);
  ctx.restore();
 }
 const ropeRaster=createStaticRaster({width:1212,height:worldH,paint:ctx=>{if(rope)paint(ctx,rope,size(rope),ropeOpening);}});
 const video=doc.createElement('video');video.muted=true;video.loop=true;video.playsInline=true;video.preload='none';video.setAttribute('playsinline','');
 const resource=createVideoResource(video,ART.inferno.video);
 // Mark only genuinely new frames so phones don't re-upload a 1728x496 texture every render.
 const watchFrames=()=>{if(video.requestVideoFrameCallback&&!frameHook)frameHook=video.requestVideoFrameCallback(()=>{frameHook=0;fresh=true;watchFrames();});};
 function makeDecoder(){
  const [w,h]=ART.inferno.size,canvas=doc.createElement('canvas');canvas.width=w;canvas.height=h;
  // preserveDrawingBuffer: frames are reused between video frames, so the buffer must survive compositing.
  const gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:false,antialias:false,preserveDrawingBuffer:true});if(!gl)return null;
  const compile=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error('Border shader failed');return s;};
  const program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,VERTEX));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,FRAGMENT));
  gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Border shader link failed');gl.useProgram(program);
  const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  const a=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);
  gl.bindTexture(gl.TEXTURE_2D,gl.createTexture());
  for(const p of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,p,gl.CLAMP_TO_EDGE);
  for(const p of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,p,gl.LINEAR);
  gl.viewport(0,0,w,h);
  let disposing=false,painted=false;
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();if(disposing)return;failed=true;resource.release();decoder=null;});
  return {canvas,get painted(){return painted;},
   paint(){try{gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,video);}catch(e){if(e?.name==='InvalidStateError'||e?.name==='SecurityError')return painted;throw e;}gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.drawArrays(gl.TRIANGLES,0,6);painted=true;return true;},
   dispose(){disposing=true;gl.getExtension('WEBGL_lose_context')?.loseContext();}};
 }
 function releaseFire(){
  if(resource.attached)resource.release();
  if(frameHook&&video.cancelVideoFrameCallback)video.cancelVideoFrameCallback(frameHook);frameHook=0;
  decoder?.dispose();decoder=null;lastTime=-1;fresh=true;
 }
 const animated=()=>kind==='inferno'&&!failed&&!reduced&&motion&&!doc.hidden;
 function sync(){
  if(kind!=='inferno'||failed||reduced){releaseFire();return;}
  if(!motion||doc.hidden){if(resource.attached)resource.pause();return;}
  if(video.paused){void resource.play();watchFrames();}
 }
 doc.addEventListener?.('visibilitychange',sync);
 function fireSource(){
  if(!animated()||video.readyState<2)return poster;
  try{
   decoder??=makeDecoder();if(!decoder){failed=true;releaseFire();return poster;}
   const changed=video.requestVideoFrameCallback?fresh:video.currentTime!==lastTime;
   if(changed||!decoder.painted){if(decoder.paint()){fresh=false;lastTime=video.currentTime;}}
   return decoder.painted?decoder.canvas:poster;
  }catch(e){console.warn('Fire border unavailable; poster kept.',e);failed=true;releaseFire();return poster;}
 }
 function draw(ctx,{cacheStatic=false}={}){
  if(kind==='rope'){if(!rope)return false;if(cacheStatic)ropeRaster.draw(ctx,true);else paint(ctx,rope,size(rope),ropeOpening);return true;}
  if(kind==='inferno'){const src=fireSource();if(!src)return false;paint(ctx,src,src===poster?size(poster):ART.inferno.size,fireOpening);return true;}
  return false;
 }
 async function load(){
  const acquire=async src=>{const i=new Image();i.decoding='async';i.src=src;await i.decode();return i;};
  const [r,p]=await Promise.allSettled([acquire(ART.rope.src),acquire(ART.inferno.poster)]);
  if(r.status==='fulfilled'){rope=r.value;ropeOpening=measureOpening(rope,160)||ART.rope.opening;ropeRaster.clear();}else console.warn('Rope border unavailable; original frame kept.',r.reason);
  if(p.status==='fulfilled'){poster=p.value;fireOpening=measureOpening(poster,200)||ART.inferno.opening;}else console.warn('Fire border poster unavailable; original frame kept.',p.reason);
  return {rope:!!rope,inferno:!!poster};
 }
 return {load,draw,
  set(state,enabled=true){const next=featureBorderKind(state);if(next!==kind||enabled!==motion){kind=next;motion=enabled;}sync();},
  // True when the new art replaces the original, so the original crow and lantern must not be drawn.
  get active(){return kind==='rope'?!!rope:kind==='inferno'?!!poster:false;},
  get kind(){return kind;},
  get state(){return {kind,active:this.active,openings:{rope:ropeOpening,inferno:fireOpening},loaded:{rope:!!rope,poster:!!poster},playing:!video.paused,attached:resource.attached,decoder:!!decoder,time:video.currentTime,failed,reduced,motion};}};
}
