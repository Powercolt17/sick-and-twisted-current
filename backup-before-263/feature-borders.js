import {createVideoResource} from './media-resource.js?v=1';
export function featureBorderKind({mode='normal',bonus=false,label='',feature=null}={}){
 if(feature)return feature==='hell'?'inferno':feature==='hang'?'rope':'normal';
 if(bonus)return label==='HELL'?'inferno':label==='DEAD'?'normal':'rope';
 return mode==='allin'?'inferno':mode==='trickster'?'rope':'normal';
}
// OpenArt footage uses an RGB+matte H.264 so transparency works consistently across browsers.
export function createFeatureBorders({G,reduced=false}){
 let kind='normal',rope=null,poster=null,decoder=null,lastFrame=-1,failed=false,motion=true;
 const video=document.createElement('video');video.muted=true;video.loop=true;video.playsInline=true;video.preload='none';video.setAttribute('playsinline','');
 const resource=createVideoResource(video,'assets/feature-borders/inferno-packed.mp4');
 function makeDecoder(){
  const canvas=document.createElement('canvas');canvas.width=864;canvas.height=496;
  const gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:false,antialias:false});if(!gl)return null;
  const compile=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error('Border shader failed');return s;};
  const program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,'attribute vec2 p;varying vec2 uv;void main(){uv=vec2(p.x*.5+.5,.5-p.y*.5);gl_Position=vec4(p,0.,1.);}'));
  gl.attachShader(program,compile(gl.FRAGMENT_SHADER,'precision mediump float;varying vec2 uv;uniform sampler2D art;void main(){vec3 c=texture2D(art,vec2(uv.x*.5,uv.y)).rgb;float a=texture2D(art,vec2(.5+uv.x*.5,uv.y)).r;gl_FragColor=vec4(c,smoothstep(.025,.98,a));}'));
  gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Border shader link failed');gl.useProgram(program);
  const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const a=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);
  const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);for(const param of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,param,gl.CLAMP_TO_EDGE);for(const param of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,param,gl.LINEAR);gl.viewport(0,0,864,496);
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();failed=true;resource.release();});
  return {canvas,paint(){gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,video);gl.drawArrays(gl.TRIANGLES,0,6);}};
 }
 function sync(){if(kind!=='inferno'||failed){if(resource.attached)resource.release();lastFrame=-1;}else if(reduced||!motion||document.hidden)resource.pause();else if(video.paused)void resource.play();}
 document.addEventListener('visibilitychange',sync);
 function draw(ctx){
  let src=kind==='rope'?rope:kind==='inferno'?poster:null;if(!src)return false;
  if(kind==='inferno'&&!reduced&&motion&&!failed&&video.readyState>=2){try{decoder??=makeDecoder();if(decoder){if(video.currentTime!==lastFrame){decoder.paint();lastFrame=video.currentTime;}src=decoder.canvas;}}catch{failed=true;resource.release();}}
  const w=src.naturalWidth||src.width,h=src.naturalHeight||src.height;
  const opening=kind==='rope'?[252,277,1083,536]:[125,129,599,316];
  const [x,y,iw,ih]=opening,sx=G.w/iw,dx=G.x-x*sx,dw=w*sx;
  ctx.save();ctx.beginPath();ctx.rect(-200,-240,1612,1100);ctx.rect(G.x,G.y,G.w,G.h);ctx.clip('evenodd');
  // Register the opening exactly, retaining the full header and bottom rail in the cabinet bounds.
  ctx.drawImage(src,0,0,w,y,dx,0,dw,G.y);
  ctx.drawImage(src,0,y,w,ih,dx,G.y,dw,G.h);
  ctx.drawImage(src,0,y+ih,w,h-y-ih,dx,G.y+G.h,dw,608-G.y-G.h);
  ctx.restore();return true;
 }
 return {async load(){const acquire=async name=>{const i=new Image();i.src='assets/feature-borders/'+name;await i.decode();return i;};[rope,poster]=await Promise.all([acquire('rope.webp'),acquire('inferno-poster.webp')]);},set(state,enabled=true){kind=featureBorderKind(state);motion=enabled;sync();},draw,get kind(){return kind;},get state(){return {kind,playing:!video.paused,attached:resource.attached,time:video.currentTime,failed};}};
}
