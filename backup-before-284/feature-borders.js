import {createVideoResource,drawMediaFrame} from './media-resource.js?v=1';
import {createStaticRaster} from './static-raster.js?v=1';
import {createCrowRig} from './crow-rig.js?v=1';
import {createBloodDrips} from './blood-drips.js?v=1';
// Feature cabinet borders. Presentation only: no outcome, payout or timing changes.
//   Hang 'Em High -> bloody rope frame (animated crow + dripping blood)
//   Hell To Pay -> OpenArt hell frame, keyed from green (RGB|matte packed H.264)
//   Base, Bounty Booster, Trickster Spins, All In Spins and Blood Money keep the original reel-frame.js border.
// Opening = [x,y,w,h] of the reel window inside each source image.
// PROVISIONAL until measured on the delivered art; everything else reads from here.
export const FEATURE_BORDER_ART={
 rope:{src:'assets/feature-borders/rope.webp',opening:[260, 297, 1228, 831],bands:[131, 1261],
  // overhang: world px the frame may cover at the top of the reels (the blood drips' roots); below: px it may run past the cabinet bottom
  overhang:18,below:30,
  // soft dark shadow under the whole frame so it separates from red/fiery backgrounds (world px)
  shadow:{color:'rgba(0,0,0,.82)',blur:16,y:4},
  // drip tips found in the art offline: [x,y,run(1)/fall(0),length] in rope.webp pixels
  drips:[[148,858,1,140],[178,666,1,140],[181,443,1,140],[204,1099,1,140],[219,907,1,140],[393,1291,0,60],[589,1292,0,60],[767,265,1,29],[783,1289,0,60],[823,263,1,31],[880,268,1,26],[972,250,1,44],[1068,268,1,26],[1135,1288,0,60],[1355,1300,0,60],[1580,885,1,140],[1590,686,1,140],[1731,584,0,60]],
  crow:{src:'assets/feature-borders/rope-crow.webp',box:[1430,0,284,306],anatomy:{neck:[.15,.32],pivot:[.35,.28],chest:[.5,.5,.3,.25],tail:[.62,.5,.62,.5],wing:[.62,.42,.2,.2],feet:[.5,.69,.15,.07],eye:[.276,.099],eyeTilt:-.2}}},
 inferno:{poster:'assets/feature-borders/inferno-poster.webp',video:'assets/feature-borders/inferno-packed.mp4',size:[1664,1248],opening:[255,287,1110,750],bands:[77,1157]}
};
// Fallback numbers only; the real windows are measured from the art at load time (measureOpening).
export function featureBorderKind({mode='normal',bonus=false,label='',feature=null}={}){
 // A running feature scene outranks the paid mode that was selected before it.
 if(feature)return feature==='hell'?'inferno':feature==='hang'?'rope':'normal';
 if(bonus)return label==='HELL'?'inferno':label==='DEAD'?'normal':'rope';
 // Every paid mode (base, Bounty Booster, Trickster, All In) keeps the normal border; only the features change it.
 return 'normal';
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
// Where the header banner and the bottom rail actually are (rows that are solid right across the window's width),
// so decorations above the banner and below the rail (flames) can hang off the cabinet instead of squashing it.
export function frameBands(data,w,h,[x,y,iw,ih],threshold=160){
 const x0=Math.round(x+iw*.1),x1=Math.round(x+iw*.9),step=Math.max(1,Math.round((x1-x0)/200));
 const cover=row=>{let n=0,t=0;for(let px=x0;px<x1;px+=step){t++;if(data[(row*w+px)*4+3]>=threshold)n++;}return n/t;};
 let top=y;while(top>0&&cover(top-1)>=.85)top--;
 let bottom=y+ih;while(bottom<h&&cover(bottom)>=.85)bottom++;
 return [top,bottom];
}
export function measureOpening(image,threshold){
 try{const w=image.naturalWidth||image.width,h=image.naturalHeight||image.height,c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(image,0,0);
  const data=g.getImageData(0,0,w,h).data,opening=openingFromAlpha(data,w,h,threshold);return opening?{opening,bands:frameBands(data,w,h,opening,threshold)}:null;}catch{return null;}
}
// Source -> world rectangles. Width scales uniformly so the window's left/right edges land on G.
// Header and footer keep that scale and hang off the window; only the banner (window top .. bands[0]) must fit above
// the reels and only the rail (window bottom .. bands[1]) must fit below, so flames above the banner or under the
// rail run past the cabinet edge and are clipped there instead of squashing the wood. The body is fitted to G.h exactly.
export function borderSlices([w,h],[x,y,iw,ih],G,worldH=608,bands=null){
 const [bt,rb]=bands||[0,h],sx=G.w/iw,dx=G.x-x*sx,dw=w*sx;
 const hs=Math.min(sx,G.y/Math.max(1,y-bt)),fs=Math.min(sx,(worldH-G.y-G.h)/Math.max(1,rb-(y+ih)));
 return [[0,0,w,y,dx,G.y-y*hs,dw,y*hs],[0,y,w,ih,dx,G.y,dw,G.h],[0,y+ih,w,h-y-ih,dx,G.y+G.h,dw,(h-y-ih)*fs]].filter(s=>s[3]>0&&s[7]>0);
}
// Source-image point -> world point, following the same three slices as borderSlices (for overlays such as drips).
export function sourceToWorld([w,h],[x,y,iw,ih],G,worldH=608,bands=null){
 const [bt,rb]=bands||[0,h],sx=G.w/iw,dx=G.x-x*sx,hs=Math.min(sx,G.y/Math.max(1,y-bt)),fs=Math.min(sx,(worldH-G.y-G.h)/Math.max(1,rb-(y+ih)));
 return (px,py)=>[dx+px*sx,py<y?G.y-(y-py)*hs:py<=y+ih?G.y+(py-y)*G.h/ih:G.y+G.h+(py-y-ih)*fs];
}
const VERTEX='attribute vec2 p;varying vec2 uv;void main(){uv=vec2(p.x*.5+.5,.5-p.y*.5);gl_Position=vec4(p,0.,1.);}';
// Left half = straight colour (green screen already removed and edge-padded offline), right half = matte (red channel).
const FRAGMENT='precision mediump float;varying vec2 uv;uniform sampler2D art;void main(){vec3 c=texture2D(art,vec2(uv.x*.5,uv.y)).rgb;float a=texture2D(art,vec2(.5+uv.x*.5,uv.y)).r;gl_FragColor=vec4(c,smoothstep(.03,.97,a));}';
export function createFeatureBorders({G,reduced=false,worldH=608,doc=globalThis.document}={}){
 const ART=FEATURE_BORDER_ART;
 let kind='normal',rope=null,poster=null,decoder=null,failed=false,motion=true,fresh=true,lastTime=-1,frameHook=0;
 let ropeOpening=ART.rope.opening,fireOpening=ART.inferno.opening,ropeBands=ART.rope.bands,fireBands=ART.inferno.bands;
 let ropeShadow=null,ropeCrow=null,crowRig=null,ropeDrips=createBloodDrips(ART.rope.drips||[]);
 const size=im=>[im.naturalWidth||im.width,im.naturalHeight||im.height];
 // Everything a border draws shares one clip: the cabinet (plus art.below px under it) minus the reel window
 // (minus art.overhang px at its top, where drips may hang over the reels).
 function clip(ctx,art){const o=art.overhang||0,b=art.below||0;ctx.beginPath();ctx.rect(-400,-400,G.x+G.w+1200,worldH+400+b);ctx.rect(G.x,G.y+o,G.w,G.h-o);ctx.clip('evenodd');}
 function paint(ctx,src,dims,opening,bands,art=ART.inferno){
  ctx.save();clip(ctx,art);
  for(const s of borderSlices(dims,opening,G,worldH,bands))drawMediaFrame(ctx,src,...s);
  ctx.restore();
 }
 // The frame's shadow is built once (shadow-only trick: draw the frame far off-canvas with an equal shadow offset)
 // and drawn under the frame each frame with the same clip, so it only darkens the scene around the cabinet.
 const SHADOW_PAD=48,SHADOW_TOP=40;
 function buildShadow(){
  const sh=ART.rope.shadow;if(!sh||!rope)return null;
  const w=1212+SHADOW_PAD*2,h=worldH+SHADOW_TOP+(ART.rope.below||0)+SHADOW_PAD*2;
  const art=doc.createElement('canvas');art.width=w;art.height=h;const a=art.getContext('2d');
  a.translate(SHADOW_PAD,SHADOW_PAD+SHADOW_TOP);for(const s of borderSlices(size(rope),ropeOpening,G,worldH,ropeBands))a.drawImage(rope,...s);
  const out=doc.createElement('canvas');out.width=w;out.height=h;const o=out.getContext('2d'),off=w+SHADOW_PAD*4;
  o.shadowColor=sh.color;o.shadowBlur=sh.blur;o.shadowOffsetX=off;o.shadowOffsetY=sh.y;o.drawImage(art,-off,0);
  return out;
 }
 function paintShadow(ctx){
  if(!rope||!ART.rope.shadow)return;ropeShadow??=buildShadow();if(!ropeShadow)return;
  ctx.save();clip(ctx,ART.rope);ctx.drawImage(ropeShadow,-SHADOW_PAD,-SHADOW_PAD-SHADOW_TOP);ctx.restore();
 }
 function paintDrips(ctx,time,animate){
  if(!rope||!ropeDrips.count||!animate)return;const dims=size(rope);
  ctx.save();clip(ctx,ART.rope);
  ropeDrips.draw(ctx,time,sourceToWorld(dims,ropeOpening,G,worldH,ropeBands),G.w/ropeOpening[2],true);ctx.restore();
 }
 // The rope frame's crow rides the header slice (same x scale, same header y scale) so it stays on its perch.
 function paintCrow(ctx,time,animate,compact){
  if(!ropeCrow||!rope)return;const [w,h]=size(rope),[x,y,iw]=ropeOpening,[bt]=ropeBands||[0,h],sx=G.w/iw,hs=Math.min(sx,G.y/Math.max(1,y-bt)),b=ART.rope.crow.box;
  ctx.save();clip(ctx,ART.rope);
  ctx.translate(G.x-x*sx+b[0]*sx,G.y-y*hs+b[1]*hs);ctx.scale(sx,hs);
  if(crowRig)crowRig.draw(ctx,time,animate,compact);else ctx.drawImage(ropeCrow,0,0);
  ctx.restore();
 }
 const ropeRaster=createStaticRaster({y:-20,width:1212,height:worldH+20+(ART.rope.below||0),paint:ctx=>{if(rope)paint(ctx,rope,size(rope),ropeOpening,ropeBands,ART.rope);}});
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
 function draw(ctx,{cacheStatic=false,time=0,animate=true,compact=false}={}){
  if(kind==='rope'){if(!rope)return false;paintShadow(ctx);if(cacheStatic)ropeRaster.draw(ctx,true);else paint(ctx,rope,size(rope),ropeOpening,ropeBands,ART.rope);paintDrips(ctx,time,animate&&!reduced);paintCrow(ctx,time,animate,compact);return true;}
  if(kind==='inferno'){const src=fireSource();if(!src)return false;paint(ctx,src,src===poster?size(poster):ART.inferno.size,fireOpening,fireBands);return true;}
  return false;
 }
 async function load(){
  const acquire=async src=>{const i=new Image();i.decoding='async';i.src=src;await i.decode();return i;};
  const [r,p,c]=await Promise.allSettled([acquire(ART.rope.src),acquire(ART.inferno.poster),acquire(ART.rope.crow.src)]);
  if(r.status==='fulfilled'){rope=r.value;ropeShadow=null;const m=measureOpening(rope,160);if(m){ropeOpening=m.opening;ropeBands=m.bands;}ropeRaster.clear();}else console.warn('Rope border unavailable; original frame kept.',r.reason);
  if(c.status==='fulfilled'){ropeCrow=c.value;try{crowRig=createCrowRig(ropeCrow,ART.rope.crow.anatomy);}catch(e){console.warn('Rope crow rig unavailable; crow drawn still.',e);}}else console.warn('Rope crow unavailable.',c.reason);
  if(p.status==='fulfilled'){poster=p.value;const m=measureOpening(poster,200);if(m){fireOpening=m.opening;fireBands=m.bands;}}else console.warn('Fire border poster unavailable; original frame kept.',p.reason);
  return {rope:!!rope,inferno:!!poster,crow:!!ropeCrow};
 }
 return {load,draw,
  set(state,enabled=true){const next=featureBorderKind(state);if(next!==kind||enabled!==motion){kind=next;motion=enabled;}sync();},
  // True when the new art replaces the original, so the original crow and lantern must not be drawn.
  get active(){return kind==='rope'?!!rope:kind==='inferno'?!!poster:false;},
  get kind(){return kind;},
  get state(){return {kind,active:this.active,openings:{rope:ropeOpening,inferno:fireOpening},bands:{rope:ropeBands,inferno:fireBands},loaded:{rope:!!rope,poster:!!poster,crow:!!ropeCrow,rig:!!crowRig,drips:ropeDrips.count},playing:!video.paused,attached:resource.attached,decoder:!!decoder,time:video.currentTime,failed,reduced,motion};}};
}
