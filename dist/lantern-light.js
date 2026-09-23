// The oil lantern on the right border post: approved bracket and lantern art
// (assets/lantern), a damped pendulum on the hook with a faint breeze so it
// never quite stops, a flickering flame and warm light on the wood. Every
// camera kick gives it a nudge. Ambience only; it touches no game state.
const clamp=x=>Math.max(0,Math.min(1,x));
const BRACKET={src:'assets/lantern/bracket.webp',w:377,h:520,hook:[351.8,60.3]};
const LANTERN={src:'assets/lantern/lantern.webp',w:352,h:900,pivot:[170.6,59.8],flame:[184.9,631.3]};
export function createLanternLight({G,reduced=false,now=()=>performance.now(),random=Math.random}={}){
 const im={};let loading=null;
 const S={theta:0,omega:0,t:0,last:0,flick:0,flick2:0};
 function load(){if(loading)return loading;const one=(k,src)=>new Promise(res=>{const i=new Image();i.decoding='async';i.onload=()=>{im[k]=i;res(i);};i.onerror=()=>res(null);i.src=src;});loading=Promise.all([one('bracket',BRACKET.src),one('lantern',LANTERN.src)]);return loading;}
 // Mounted on the reel frame's right post, whose rectangle the frame derives from G (see reel-frame.js).
 function mount(){const sx=G.w/1019,postX=G.x+G.w,postW=119*sx;return {x:postX+postW*.28,y:G.y+G.h*.07,bs:(G.h*.30)/BRACKET.h,ls:(G.h*.24)/LANTERN.h};}
 function hook(){const m=mount();return {x:m.x+BRACKET.hook[0]*m.bs,y:m.y+BRACKET.hook[1]*m.bs,m};}
 function nudge(strength=1){if(reduced)return;S.omega+=(.9+random()*.5)*strength*(random()<.5?-1:1);}
 function step(t){const dt=Math.min(.05,S.last?Math.max(0,t-S.last)/1000:.016);S.last=t;S.t+=dt;
  const g=9.81,L=.42,drag=.55,breeze=Math.sin(S.t*.7)*Math.sin(S.t*.23)*.09;
  const acc=-(g/L)*Math.sin(S.theta)-drag*S.omega+breeze;S.omega+=acc*dt;S.theta+=S.omega*dt;
  S.flick+=(random()-.5)*.35;S.flick*=.86;S.flick2=Math.sin(S.t*11)*.5+Math.sin(S.t*23.7)*.3;
  const idle=(3.5*Math.PI/180)*Math.sin(S.t*1.9)*(0.7+0.3*Math.sin(S.t*.31));
  return {theta:reduced?0:S.theta+idle,fl:1+.18*S.flick+.08*S.flick2};}
 function draw(ctx,t=now()){
  if(!im.bracket||!im.lantern)return;
  const {theta,fl}=step(t),{x:hx,y:hy,m}=hook();
  ctx.save();ctx.drawImage(im.bracket,m.x,m.y,BRACKET.w*m.bs,BRACKET.h*m.bs);
  ctx.translate(hx,hy);ctx.rotate(theta);
  const lx=-LANTERN.pivot[0]*m.ls,ly=-LANTERN.pivot[1]*m.ls,fx=lx+LANTERN.flame[0]*m.ls,fy=ly+LANTERN.flame[1]*m.ls;
  // warm spill on the post and the scene, under the metal
  ctx.save();ctx.globalCompositeOperation='lighter';let r=G.h*.36*fl;let gr=ctx.createRadialGradient(fx,fy,3,fx,fy,r);gr.addColorStop(0,'rgba(255,170,70,.34)');gr.addColorStop(.35,'rgba(255,130,40,.14)');gr.addColorStop(1,'rgba(255,100,20,0)');ctx.fillStyle=gr;ctx.fillRect(fx-r,fy-r,r*2,r*2);ctx.restore();
  ctx.shadowColor='#000c';ctx.shadowBlur=G.h*.03;ctx.shadowOffsetY=G.h*.014;ctx.drawImage(im.lantern,lx,ly,LANTERN.w*m.ls,LANTERN.h*m.ls);ctx.shadowColor='transparent';
  // the glass glows and the flame breathes
  ctx.save();ctx.globalCompositeOperation='lighter';r=G.h*.065*fl;gr=ctx.createRadialGradient(fx,fy-G.h*.008,0,fx,fy,r);gr.addColorStop(0,'rgba(255,230,150,.7)');gr.addColorStop(.4,'rgba(255,160,60,.32)');gr.addColorStop(1,'rgba(255,120,30,0)');ctx.fillStyle=gr;ctx.fillRect(fx-r,fy-r,r*2,r*2);ctx.restore();
  ctx.restore();
 }
 return {load,draw,nudge,get ready(){return !!im.lantern;}};
}
