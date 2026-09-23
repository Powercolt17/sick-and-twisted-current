const TAU=Math.PI*2;
async function targetRenderer(host){
 const im=new Image();im.src='assets/blood-wall/multiplier-target.webp?v=2';await im.decode();
 host.innerHTML='<canvas class="blood-target-mount" aria-hidden="true" width="700" height="800"></canvas><canvas class="blood-target-iron" aria-hidden="true" width="700" height="800"></canvas><canvas class="blood-target-fx" aria-hidden="true" width="700" height="800"></canvas><span class="blood-tier-value">Win multiplier: 1 times</span>';
 const mount=host.querySelector('.blood-target-mount'),g=mount.getContext('2d');g.save();g.translate(-30,-70);g.beginPath();
 g.roundRect(91,84,579,94,7);g.rect(116,178,23,224);g.rect(621,179,23,224);g.rect(60,483,28,234);g.rect(660,483,39,234);
 g.roundRect(36,425,20,48,6);g.roundRect(53,399,46,96,7);g.rect(99,416,21,66);g.roundRect(654,399,47,96,7);g.roundRect(699,425,20,48,6);g.rect(640,416,20,66);
 g.moveTo(42,746);g.lineTo(44,721);g.lineTo(61,714);g.lineTo(94,714);g.lineTo(137,711);g.lineTo(138,733);g.lineTo(621,733);g.lineTo(622,713);g.lineTo(700,716);g.lineTo(716,727);g.lineTo(716,850);g.lineTo(42,850);g.closePath();g.clip();g.drawImage(im,0,0);g.restore();
 const canvas=host.querySelector('.blood-target-iron'),gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false,preserveDrawingBuffer:true});
 const atlases=[382,1092,1800,2508].map(x=>{const c=document.createElement('canvas');c.width=518;c.height=508;c.getContext('2d').drawImage(im,x-259,200,518,508,0,0,518,508);return c;});
 const extra=new Image();extra.src='assets/blood-wall/multiplier-extra.webp';await extra.decode();for(const [x,y]of[[512.5,501],[1535.5,501.5],[2551.5,502.5]]){const c=document.createElement('canvas');c.width=518;c.height=508;c.getContext('2d').drawImage(extra,x-451,y-451,902,902,0,0,518,508);atlases.push(c);}

 if(!gl)return fallbackTarget(host,canvas,atlases);
 const vs=`attribute vec3 position;attribute vec2 uv;attribute vec3 normal;uniform float angle;uniform float recoil;varying vec2 vuv;varying vec3 vn;void main(){float c=cos(angle),s=sin(angle);vec3 p=vec3(position.x,position.y*c-position.z*s,position.y*s+position.z*c);vn=vec3(normal.x,normal.y*c-normal.z*s,normal.y*s+normal.z*c);vuv=uv;float w=(1200.-p.z)/1200.;gl_Position=vec4((352./350.-1.)*w+p.x/350.,(1.-384./400.)*w+(p.y-recoil)/400.,-p.z/1000.*w,w);}`;
 const fs=`precision mediump float;varying vec2 vuv;varying vec3 vn;uniform sampler2D tex;uniform float side;uniform float flash;uniform float catchLight;void main(){vec3 n=normalize(vn);vec3 light=normalize(vec3(-.35,.65,1.));float d=max(0.,dot(n,light));vec3 col=texture2D(tex,vuv).rgb;float shade=mix(.78+.22*d,.30+.64*d,side);float glint=pow(max(0.,dot(reflect(-light,n),vec3(0.,0.,1.))),24.)*.13;col=col*shade+vec3(.9,.70,.40)*(glint+flash*.10+catchLight*.06);gl_FragColor=vec4(col,1.);}`;
 function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
 const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vs));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fs));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
 const loc={};for(const n of ['angle','recoil','tex','side','flash','catchLight'])loc[n]=gl.getUniformLocation(program,n);
 const textures=atlases.map(c=>{const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,c);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);return t;});
 const vertices=[],groups=[];let count=0;
 function vertex(x,y,z,u,v,nx,ny,nz){vertices.push(x,y,z,u,v,nx,ny,nz);count++;}
 const N=144;
 function face(back){const first=count,sign=back?-1:1;for(let i=0;i<N;i++){const a=TAU*i/N,b=TAU*(i+1)/N;vertex(0,0,sign*12,.5,.5,0,0,sign);for(const t of back?[b,a]:[a,b]){const x=Math.cos(t),y=Math.sin(t);vertex(x*254,y*249,sign*12,.5+x*.49,.5-y*.49,0,0,sign);}}groups.push({first,count:count-first,side:0,back});}
 face(false);face(true);
 const first=count;for(const [za,ra,zb,rb]of[[12,.98,8,1],[8,1,-8,1],[-8,1,-12,.98]])for(let i=0;i<N;i++){
  const a=TAU*i/N,b=TAU*(i+1)/N;
  for(const [t,z,r]of[[a,za,ra],[a,zb,rb],[b,zb,rb],[a,za,ra],[b,zb,rb],[b,za,ra]]){const x=Math.cos(t),y=Math.sin(t);vertex(x*259*r,y*254*r,z,.5+x*.478,.5-y*.478,x,y,(za===8?0:za>0?.4:-.4));}
 }groups.push({first,count:count-first,side:1,back:true});
 const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);
 for(const [n,size,offset]of[['position',3,0],['uv',2,3],['normal',3,5]]){const l=gl.getAttribLocation(program,n);gl.enableVertexAttribArray(l);gl.vertexAttribPointer(l,size,gl.FLOAT,false,32,offset*4);}
 gl.enable(gl.DEPTH_TEST);gl.enable(gl.CULL_FACE);gl.cullFace(gl.BACK);gl.clearColor(0,0,0,0);gl.viewport(0,0,700,800);
 const fx=host.querySelector('.blood-target-fx').getContext('2d');let level=0,value=1,fallback=null;
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();fallback=fallbackTarget(host,canvas,atlases);fallback.setLevel(value);});
 function draw(f){if(fallback){fallback.draw(f);return;}gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.uniform1f(loc.angle,f.angle*Math.PI/180);gl.uniform1f(loc.recoil,f.recoil);gl.uniform1f(loc.flash,f.impact);gl.uniform1f(loc.catchLight,f.latch);gl.uniform1i(loc.tex,0);for(const group of groups){gl.bindTexture(gl.TEXTURE_2D,textures[group.back?3:level]);gl.uniform1f(loc.side,group.side);gl.drawArrays(gl.TRIANGLES,group.first,group.count);}canvas.style.filter=f.blur>.01?`blur(${f.blur*.7}px)`:'none';host.dataset.angle=f.angle.toFixed(1);
  fx.clearRect(0,0,700,800);const t=f.t/1000;if(!f.reduced&&t>=0&&t<1.3){const x=315,y=280;fx.save();fx.globalCompositeOperation='lighter';for(let i=0;i<32;i++){const a=i*2.3999,velocity=75+(i*47)%220,px=x+Math.cos(a)*velocity*t,py=y+Math.sin(a)*velocity*t+140*t*t,alpha=Math.max(0,1-t/(.24+i%5*.13));fx.strokeStyle=`rgba(255,${170+i%4*20},${70+i%3*25},${alpha})`;fx.lineWidth=i%4===0?2.7:1.5;fx.beginPath();fx.moveTo(px,py);fx.lineTo(px-Math.cos(a)*(5+velocity*.025),py-Math.sin(a)*9);fx.stroke();}const rad=14+80*Math.min(1,t*7),grad=fx.createRadialGradient(x,y,0,x,y,rad);grad.addColorStop(0,`rgba(255,249,217,${f.impact})`);grad.addColorStop(.2,`rgba(255,174,61,${f.impact*.65})`);grad.addColorStop(1,'rgba(255,130,30,0)');fx.fillStyle=grad;fx.fillRect(x-rad,y-rad,rad*2,rad*2);fx.restore();
   for(let i=0;i<7;i++){const u=Math.max(0,t-i*.025),r=8+u*30,px=x+(i-3)*u*24,py=y-u*50-i*2;const grad=fx.createRadialGradient(px,py,0,px,py,r);grad.addColorStop(0,`rgba(179,160,134,${Math.max(0,.075*(1-u))*Math.min(1,t*12)})`);grad.addColorStop(1,'rgba(96,91,83,0)');fx.fillStyle=grad;fx.fillRect(px-r,py-r,r*2,r*2);}
  }
 }
 return {draw,setLevel(n){const index={1:0,2:1,4:2,6:4,8:5,10:6}[n];if(index===undefined)throw Error('Unknown target face');value=n;level=index;fallback?.setLevel(n);host.dataset.level=n;},announce(){host.querySelector('span').textContent=`Win multiplier: ${value} times`;},get level(){return value;},canvas,atlases};
}

function fallbackTarget(host,oldCanvas,atlases){
 const canvas=document.createElement('canvas');canvas.width=700;canvas.height=800;canvas.className='blood-target-iron';canvas.setAttribute('aria-hidden','true');oldCanvas.replaceWith(canvas);
 const ctx=canvas.getContext('2d');let value=1,index=0;
 return {setLevel(n){value=n;index={1:0,2:1,4:2,6:4,8:5,10:6}[n];host.dataset.level=n;},announce(){host.querySelector('span').textContent=`Win multiplier: ${value} times`;},draw(f){
  const angle=f.angle*Math.PI/180,c=Math.cos(angle),depth=Math.abs(Math.sin(angle))*12;ctx.clearRect(0,0,700,800);ctx.save();ctx.translate(352,384+f.recoil);
  ctx.fillStyle='#31251c';ctx.beginPath();ctx.ellipse(0,0,259,Math.abs(c)*254+depth,0,0,Math.PI*2);ctx.fill();
  ctx.scale(1,Math.max(.001,Math.abs(c)));ctx.beginPath();ctx.ellipse(0,0,254,249,0,0,Math.PI*2);ctx.clip();ctx.drawImage(atlases[c>=0?index:3],-259,-254,518,508);ctx.restore();host.dataset.angle=f.angle.toFixed(1);
 },get level(){return value;},canvas,atlases};
}
// One lazy renderer; calls made during image loading are retained in order.
export function createBloodTarget(host){
 let renderer=null,value=1,announced=1,last={angle:0,recoil:0,impact:0,latch:0,blur:0,t:-1,reduced:false};
 host.innerHTML='<span class="blood-target-loading">1×</span>';
 const ready=targetRenderer(host).then(r=>{renderer=r;r.setLevel(value);r.draw(last);host.dataset.artReady='true';if(announced===value)r.announce();}).catch(error=>{host.dataset.artReady='false';host.innerHTML=`<strong class="blood-target-loading">${value}×</strong>`;console.warn('Multiplier artwork unavailable',error);});
 return {ready,setLevel(n){value=n;renderer?.setLevel(n);},announce(){announced=value;renderer?.announce();host.setAttribute('aria-label',`Win multiplier: ${value} times`);if(!renderer&&host.dataset.artReady==='false')host.querySelector('strong').textContent=value+'×';},frame(f){last=f;renderer?.draw(f);},reset(){last={angle:0,recoil:0,impact:0,latch:0,blur:0,t:-1,reduced:false};renderer?.draw(last);},get value(){return value;}};
}
