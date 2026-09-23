// The gunfighter on the left panel. He is one illustration kept whole; life comes from things that
// share the scene's wind: the poncho's free edge warped as cloth, a slow breath, ground dust at his
// boots, and a lit cigarillo. (A revolver twirl was tried and removed at Carter's request.)
// Nothing here touches reels, outcomes or credits. Respects reduced motion and the Background Motion
// setting: when animation is off he is drawn exactly as the static artwork.
export function createCharacter({ctx,reduced}){
 let panel=null,layers=null,cells=null;
 const state={dust:[],lastSpawn:0,smoke:[],lastPuff:0,seed:7};
 // Cigarillo at the corner of the mouth (figure coordinates): from the lips to a lit tip.
 const CIG={x0:292,y0:158,x1:330,y1:147,r:2.9};
 const rand=()=>{state.seed=(state.seed*1664525+1013904223)>>>0;return state.seed/4294967296;};
 const smooth=v=>{v=Math.max(0,Math.min(1,v));return v*v*(3-2*v);};
 async function load(brandPanel){
  panel=brandPanel;
  layers=await fetch('assets/character/layers.json').then(r=>r.json());
  prepareCape();
 }
 // Cape cells: small tiles of the poncho's free edge, kept only where the artwork has pixels.
 function prepareCape(){
  const F=layers.figure,C=layers.cape,size=12;
  const off=document.createElement('canvas');off.width=C.w;off.height=C.h;
  const oc=off.getContext('2d',{willReadFrequently:true});oc.drawImage(panel,F.x+C.x,F.y+C.y,C.w,C.h,0,0,C.w,C.h);
  const d=oc.getImageData(0,0,C.w,C.h).data;cells=[];
  for(let cy=0;cy<C.h;cy+=size)for(let cx=0;cx<C.w;cx+=size){
   let any=false;
   for(let y=cy;y<Math.min(C.h,cy+size)&&!any;y+=3)for(let x=cx;x<Math.min(C.w,cx+size);x+=3)if(d[(y*C.w+x)*4+3]>8){any=true;break;}
   if(any)cells.push({fx:C.x+cx,fy:C.y+cy,u:Math.min(1,(cx+size/2)/C.w),v:Math.max(0,Math.min(1,(C.y+cy+size/2-C.anchorY)/(C.h-(C.anchorY-C.y))))});
  }
 }
 // One wind for everything on the panel: slow gusts with a faster flutter riding on top.
 const gust=t=>0.55+0.3*Math.sin(t*0.86)+0.2*Math.sin(t*2.17+1.0)*Math.sin(t*0.29);
 function capeOffset(u,v,t){
  const g=gust(t),A=32;
  const dx=A*Math.pow(u,1.5)*(0.3+0.7*v)*(g+0.45*Math.sin(t*3.7-v*4.5+u*1.5)+0.25*Math.sin(t*7.6+u*3-v*7));
  const dy=A*0.4*Math.pow(u,1.2)*v*Math.sin(t*4.8-v*5.5+u*2);
  return [dx,dy];
 }
 function drawCigarillo(x,y,s,t,now,live){
  const X=fx=>x+fx*s,Y=fy=>y+fy*s,dx=CIG.x1-CIG.x0,dy=CIG.y1-CIG.y0;
  ctx.save();ctx.lineCap='round';
  // Inked outline, then the wrapper, then a grey ash band just behind the coal.
  ctx.strokeStyle='#17120f';ctx.lineWidth=(CIG.r*2+2.2)*s;ctx.beginPath();ctx.moveTo(X(CIG.x0),Y(CIG.y0));ctx.lineTo(X(CIG.x1),Y(CIG.y1));ctx.stroke();
  ctx.strokeStyle='#5b4130';ctx.lineWidth=CIG.r*2*s;ctx.beginPath();ctx.moveTo(X(CIG.x0),Y(CIG.y0));ctx.lineTo(X(CIG.x0+dx*.86),Y(CIG.y0+dy*.86));ctx.stroke();
  ctx.strokeStyle='#8d867c';ctx.lineWidth=CIG.r*1.9*s;ctx.beginPath();ctx.moveTo(X(CIG.x0+dx*.84),Y(CIG.y0+dy*.84));ctx.lineTo(X(CIG.x0+dx*.95),Y(CIG.y0+dy*.95));ctx.stroke();
  // The coal: a breathing ember with a warm halo; steady when animation is off.
  const flicker=live?0.72+0.2*Math.sin(t*2.1)+0.08*Math.sin(t*9.7)*Math.sin(t*3.3):0.85;
  const tx=X(CIG.x1),ty=Y(CIG.y1),R=12*s*(0.8+0.4*flicker);
  const halo=ctx.createRadialGradient(tx,ty,0,tx,ty,R);halo.addColorStop(0,`rgba(255,160,70,${0.8*flicker})`);halo.addColorStop(.4,`rgba(255,90,30,${0.34*flicker})`);halo.addColorStop(1,'rgba(255,60,20,0)');
  ctx.globalCompositeOperation='lighter';ctx.fillStyle=halo;ctx.beginPath();ctx.arc(tx,ty,R,0,Math.PI*2);ctx.fill();ctx.globalCompositeOperation='source-over';
  ctx.fillStyle=`rgba(255,${150+60*flicker|0},${70+40*flicker|0},1)`;ctx.beginPath();ctx.arc(tx,ty,CIG.r*0.95*s,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='rgba(255,235,200,.9)';ctx.beginPath();ctx.arc(tx-0.4*s,ty-0.4*s,CIG.r*0.4*s,0,Math.PI*2);ctx.fill();
  ctx.restore();
  if(!live){state.smoke.length=0;return;}
  // Smoke: thin wisps that lift off the coal, thicken, and lean with the wind.
  if(now-state.lastPuff>110&&state.smoke.length<30){state.lastPuff=now;state.smoke.push({born:now,life:2600+rand()*1400,ph:rand()*6.28,side:rand()-.5});}
  ctx.save();
  for(let i=state.smoke.length-1;i>=0;i--){
   const p=state.smoke[i],age=now-p.born,u=age/p.life;if(u>=1){state.smoke.splice(i,1);continue;}
   const g=gust(t),sec=age/1000;
   const fx=CIG.x1+2+sec*(6+13*g)+Math.sin(t*1.9+p.ph)*6*u+p.side*8*u,fy=CIG.y1-3-sec*30-Math.sin(t*1.1+p.ph)*2,r=(2.2+13*u)*s;
   const a=0.42*(1-u)*Math.min(1,u*7);
   const grad=ctx.createRadialGradient(X(fx),Y(fy),0,X(fx),Y(fy),r);grad.addColorStop(0,`rgba(222,216,206,${a})`);grad.addColorStop(1,'rgba(222,216,206,0)');
   ctx.fillStyle=grad;ctx.beginPath();ctx.arc(X(fx),Y(fy),r,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
 }
 function draw(now,x,y,w,animate){
  if(!panel||!layers)return;
  const F=layers.figure,s=w/F.w,h=F.h*s,t=now/1000,live=animate&&!reduced;
  ctx.save();
  if(live){
   // Breath and a barely-there sway, anchored at the boots.
   const feet=y+h;ctx.translate(x+w/2+0.6*Math.sin(t*1.23),feet);ctx.scale(1,1+0.004*Math.sin(t*1.75));ctx.translate(-(x+w/2),-feet);
  }
  if(!live){ctx.drawImage(panel,F.x,F.y,F.w,F.h,x,y,w,h);drawCigarillo(x,y,s,t,now,false);ctx.restore();return;}
  // Body: the whole figure except the cape rectangle, which the cloth cells redraw.
  const C=layers.cape;
  ctx.save();ctx.beginPath();ctx.rect(x-40,y-20,w+80,h+60);ctx.rect(x+C.x*s,y+C.y*s,C.w*s,C.h*s);ctx.clip('evenodd');ctx.drawImage(panel,F.x,F.y,F.w,F.h,x,y,w,h);ctx.restore();
  // Cape: cloth cells displaced by the wind; the inner edge is pinned so the seam never opens.
  const size=12,pad=2;
  for(const c of cells){
   const [dx,dy]=capeOffset(c.u,c.v,t);
   ctx.drawImage(panel,F.x+c.fx,F.y+c.fy,size+pad,size+pad,x+(c.fx+dx)*s,y+(c.fy+dy)*s,(size+pad)*s+0.5,(size+pad)*s+0.5);
  }
  drawCigarillo(x,y,s,t,now,true);
  ctx.restore();
  // Ground dust drifting with the same wind, in front of the boots.
  if(now-state.lastSpawn>900&&state.dust.length<9){state.lastSpawn=now;state.dust.push({born:now,life:5200+rand()*2200,x0:x+10+rand()*(w-40),y0:y+h-4-rand()*10,wd:22+rand()*26,ht:4+rand()*4,drift:7+rand()*7,ph:rand()*6.28});}
  ctx.save();
  for(let i=state.dust.length-1;i>=0;i--){
   const p=state.dust[i],age=now-p.born,q=age/p.life;if(q>=1){state.dust.splice(i,1);continue;}
   const g=gust(t),dx=(age/1000)*p.drift*(0.6+g),dy=-(age/1000)*1.4+Math.sin(t*1.9+p.ph)*1.5,a=0.13*Math.sin(q*Math.PI);
   ctx.globalAlpha=a;ctx.fillStyle='#c9bda3';ctx.beginPath();ctx.ellipse(p.x0+dx,p.y0+dy,p.wd*(0.7+0.6*q),p.ht,0,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
 }
 return {load,draw};
}
