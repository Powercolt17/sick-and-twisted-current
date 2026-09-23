// Presentation only: confirmed captures own every position and multiplier.
const clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
const mix=(a,b,t)=>a+(b-a)*t;
export const GALLOWS_TIMING=Object.freeze({lock:{catch:1450,end:3100},upgrade:{catch:1000,end:2450}});
export function gallowsPose(age,type='lock',reduced=false){
 const timing=GALLOWS_TIMING[type]||GALLOWS_TIMING.lock;
 if(reduced)return {focus:0,arrival:1,lift:1,rope:1,sway:0,kick:0,revealed:true,done:age>=250};
 const at=age-timing.catch,seconds=Math.max(0,at)/1000;
 const focus=smooth(age/350)*(1-smooth((age-(timing.end-500))/500));
 const kick=at>=0&&at<800?Math.sin(seconds*23)*Math.exp(-seconds*6):0;
 return {focus,arrival:type==='lock'?smooth((age-350)/240):1,
  lift:type==='lock'?smooth((age-900)/550):1+.2*Math.sin(Math.PI*clamp((age-400)/600))**2,
  rope:type==='lock'?smooth((age-500)/400):1,
  sway:at>=0?.08*Math.exp(-seconds*2.3)*Math.sin(seconds*9):0,kick,
  revealed:age>=timing.catch,done:age>=timing.end};
}
function lettering(ctx,label,x,y,size,color='#e7d2a9',face='Outlaw'){ctx.font=`${size}px ${face},Georgia,serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=color;ctx.shadowColor='#000';ctx.shadowBlur=4;ctx.fillText(label,x,y);ctx.shadowBlur=0;}
export function createGallows({reduced=false}){
 let frame=null,art=null,boxed=null,clean=null;
 const image=new Image();image.src='assets/hang-em-high/gallows-frame.webp';
 const outlaw=new Image();outlaw.src='assets/hang-em-high/outlaw-clean.webp';
 const ready=Promise.all([image.decode().then(()=>frame=image),outlaw.decode().then(()=>clean=outlaw)]);
 function rope(ctx,x,a,b,width=2){
  if(b<=a)return;ctx.save();ctx.strokeStyle='#21150c';ctx.lineWidth=width+2;ctx.beginPath();ctx.moveTo(x,a);ctx.lineTo(x,b);ctx.stroke();
  ctx.strokeStyle='#baa071';ctx.lineWidth=width;ctx.stroke();ctx.strokeStyle='#675134';ctx.lineWidth=width;ctx.setLineDash([width,width]);ctx.stroke();ctx.restore();
 }
 function actor(ctx,x,neckY,height,angle=0,alpha=1,widthCorrection=1){
  if(!art)return;ctx.save();ctx.globalAlpha*=alpha;ctx.translate(x,neckY);ctx.rotate(angle);
  const w=height*.5*widthCorrection;
  if(clean)ctx.drawImage(clean,-w*475/887,-height*110/1774,w,height);
  ctx.restore();
 }
 function drawStation(ctx,b,{order,locks,event,age,now,payAge}){
  const pose=event?gallowsPose(age,event.type,reduced):null;
  const pulse=!reduced&&payAge>=0&&payAge<850?Math.sin(Math.PI*payAge/850):0;
  ctx.save();ctx.translate(b.x,b.y);ctx.scale(b.w/600,b.h/400);
  // Dark field isolates the real timber artwork from background gallows silhouettes.
  const shade=ctx.createLinearGradient(0,0,0,400);shade.addColorStop(0,'#15120ff5');shade.addColorStop(.6,'#1e1914f2');shade.addColorStop(1,'#080807fa');ctx.fillStyle=shade;ctx.fillRect(43,38,514,330);
  const shake=pose?.kick||0;ctx.translate(shake*1.6,shake*.6);
  for(let i=0;i<3;i++){
   const c=order[i],active=c!==undefined,selected=event?.slot===i;
   const p=selected?pose:null,x=[176,300,426][i],height=218;
   let neck=active?106:137;
   if(p&&event.type==='lock')neck=106+68*(1-p.lift);
   if(p&&event.type==='upgrade')neck=106-85*(p.lift-1);
   neck+=(p?.kick||0)*8;
   const ropeEnd=p&&event.type==='lock'?mix(58,neck,p.rope):neck;
   rope(ctx,x,55,ropeEnd,3);
   if(active){
    const idle=reduced?0:.016*Math.sin(now/850+i*1.7),sway=(p?.sway||0)+idle;
    actor(ctx,x,neck,height,sway,p?.arrival??1,Math.min(1.6,Math.max(1,b.h/b.w*1.5)));
    const shown=selected&&event.type==='upgrade'&&!p.revealed?event.from:locks[c].mult;
    const reveal=!(selected&&event.type==='lock'&&!p.revealed);
    if(reveal){
     ctx.save();ctx.translate(x,323);const s=reduced?1:1+Math.max(0,p?.kick||0)*.17;ctx.scale(s,s);
     ctx.fillStyle='#120d09e8';ctx.fillRect(-43,-21,86,44);ctx.strokeStyle=pulse>0?'#f5d591':'#9c7947';ctx.lineWidth=1;ctx.strokeRect(-43,-21,86,44);
     lettering(ctx,`×${shown}`,0,0,37,pulse>0?'#ffecc5':'#edce8b');ctx.restore();
    }
   }else{
    if(art)ctx.drawImage(art.figureLive,224,226,48,104,x-12,ropeEnd-4,24,48);
    lettering(ctx,'WANTED',x,243,19,'#a38b66');lettering(ctx,`0${i+1}`,x,279,30,'#665339');
   }
  }
  if(frame)ctx.drawImage(frame,0,0,600,400);
  for(let i=0;i<order.length;i++)lettering(ctx,`REEL ${['I','II','III','IV','V','VI'][order[i]]}`,[176,300,426][i],370,14,'#e0cca5','Arial');
  // Sawdust stays local to the cinch, with no screen-wide flash.
  if(pose&&!reduced){const t=(age-GALLOWS_TIMING[event.type].catch)/1000;
   if(t>0&&t<.8){ctx.globalAlpha*=1-t/.8;ctx.fillStyle='#be9c60';const x=[176,300,426][event.slot];for(let i=0;i<17;i++){const dx=Math.sin(i*2.4)*80*t,dy=60+t*t*220-(i%5)*19*t;ctx.fillRect(x+dx,dy,1+i%3,2+i%3);}}}
  ctx.restore();
 }
 return {
  setArt(a,b){art=a;boxed=b;return ready;},
  draw(ctx,now,{order,locks,event,age,mobile=false,header=0,payAge=-1}){
   const activeEvent=event&&GALLOWS_TIMING[event.type]&&age<GALLOWS_TIMING[event.type].end;
   const pose=activeEvent?gallowsPose(age,event.type,reduced):null,f=pose?.focus||0;
   const dock=mobile&&header?{x:300,y:-310,w:600,h:290}:{x:978,y:266,w:232,h:270};
   const hero=mobile&&header?{x:223,y:-186,w:754,h:503}:{x:291,y:100,w:630,h:420};
   const b=Object.fromEntries(['x','y','w','h'].map(k=>[k,mix(dock[k],hero[k],f)]));
   if(f>0){ctx.save();ctx.fillStyle=`rgba(5,4,3,${f*.83})`;ctx.fillRect(0,-header,1212,1208+header);ctx.restore();}
   drawStation(ctx,b,{order,locks,event:activeEvent?event:null,age,now,payAge});
   if(f>.1){ctx.save();ctx.globalAlpha=f;lettering(ctx,event.type==='upgrade'?'TIGHTEN THE NOOSE':'WANTED — CAPTURED',600,b.y-24,mobile?32:28);
    const target=event.type==='upgrade'?(pose.revealed?`×${event.to} — MULTIPLIER DOUBLED`:'THE ROPE TIGHTENS…'):(pose.revealed?`REEL ${['I','II','III','IV','V','VI'][event.reel]} LOCKED · ×${event.to}`:'ONE MORE FOR THE GALLOWS');
    lettering(ctx,target,600,b.y+b.h+31,mobile?28:25,'#eacb8d');ctx.restore();
   }else if(!mobile){lettering(ctx,'THE GALLOWS',1098,240,18);}
   return f;
  },
  drawReel(ctx,c,value,{G,progress=1}={}){
   const x=G.x+c*G.cw;ctx.save();ctx.beginPath();ctx.rect(x,G.y,G.cw,G.h);ctx.clip();
   ctx.fillStyle='#231c13';ctx.fillRect(x,G.y,G.cw,G.h);
   for(let row=0;row<4;row++){const a=reduced?1:smooth(progress*4-row);ctx.globalAlpha=a;
    if(boxed)ctx.drawImage(boxed,x+3,G.y+row*G.ch+3,G.cw-6,G.ch-6);}
   ctx.globalAlpha=1;ctx.strokeStyle='#be9a59';ctx.lineWidth=2;ctx.strokeRect(x+2,G.y+2,G.cw-4,G.h-4);
   ctx.fillStyle='#180f09f5';ctx.fillRect(x+9,G.y+G.h-39,G.cw-18,34);lettering(ctx,`×${value}`,x+G.cw/2,G.y+G.h-21,27,'#f0d6a1');ctx.restore();
  }
 };
}
