// Approved artwork compositor, unchanged cloth/fire/title motion. Recorded burn is separate.
const TIMES={card:4.08,title:4.32,caption:4.76};
const clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{x=clamp(x);return x*x*(3-2*x);},out=x=>1-Math.pow(1-clamp(x),3);
const random=n=>{const v=Math.sin(n*97.73+17.8)*43758.54;return v-Math.floor(v);};
function label(ctx,text,x,y,size,maxWidth,{fill='#ecddbc',stroke='#17100d',outline=5,font='HellOutlaw',align='center'}={}){
 ctx.save();ctx.textAlign=align;ctx.textBaseline='middle';ctx.font=`${size}px ${font}`;const width=ctx.measureText(text).width;if(width>maxWidth)ctx.font=`${size*maxWidth/width}px ${font}`;
 ctx.lineJoin='round';ctx.strokeStyle=stroke;ctx.lineWidth=outline*2;if(outline)ctx.strokeText(text,x,y);ctx.fillStyle=fill;ctx.fillText(text,x,y);ctx.restore();
}
function roughRect(ctx,x,y,w,h,seed){
 ctx.beginPath();const step=12;
 for(let i=0;i<=Math.ceil(w/step);i++){const xx=x+Math.min(w,i*step),yy=y+(random(i+seed)-.5)*3;i?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy);}
 for(let i=0;i<=Math.ceil(h/step);i++)ctx.lineTo(x+w+(random(i+seed+50)-.5)*3,y+Math.min(h,i*step));
 for(let i=0;i<=Math.ceil(w/step);i++)ctx.lineTo(x+w-Math.min(w,i*step),y+h+(random(i+seed+100)-.5)*3);
 for(let i=0;i<=Math.ceil(h/step);i++)ctx.lineTo(x+(random(i+seed+150)-.5)*3,y+h-Math.min(h,i*step));ctx.closePath();
}
function createLivingArt(assets,make){
 const width=960,height=640,base=make(width,height),bc=base.getContext('2d'),cape=make(width,height),cc=cape.getContext('2d');
 bc.drawImage(assets.cleanArt,0,0,width,height);cc.drawImage(assets.art,0,0,width,height);
 // Cut only the loose cloth from the original painting. Its shoulder remains pinned.
 const contour=[[242,248],[274,225],[342,208],[310,211],[373,180],[338,189],[404,162],[380,148],[427,153],[477,164],[530,170],[565,180],[602,183],[635,195],[658,210],[688,222],[720,249],[765,277],[727,301],[706,339],[683,365],[645,396],[621,434],[595,460],[561,489],[528,494],[559,451],[506,474],[476,481],[504,439],[450,459],[414,477],[433,437],[391,453],[421,414],[364,434],[390,393],[335,416],[360,372],[301,400],[330,351],[281,373],[306,329],[261,348],[291,307],[248,323],[278,284],[241,302],[272,266],[230,282]];
 function inside(x,y){let yes=false;for(let i=0,j=contour.length-1;i<contour.length;j=i++){const a=contour[i],b=contour[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}
 const pixels=cc.getImageData(0,0,width,height);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=(y*width+x)*4,r=pixels.data[i],g=pixels.data[i+1],b=pixels.data[i+2];
  const cloth=(r<70&&g<42)||(r>50&&g<r*.36&&b<r*.4);
  if(!inside(x*1.6,y*1.6)||!cloth)pixels.data[i+3]=0;
 }cc.putImageData(pixels,0,0);
 const fireMask=make(width,height),mc=fireMask.getContext('2d'),mask=bc.getImageData(0,0,width,height),mp=mask.data;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const k=(y*width+x)*4,X=x*1.6,Y=y*1.6,r=mp[k],g=mp[k+1],b=mp[k+2];
  const back=(X<650||X>1240)&&Y>35&&Y<690;
  const fire=clamp((r-90)/70)*clamp((g-35)/50)*clamp((120-b)/60);
  mp[k]=mp[k+1]=mp[k+2]=255;mp[k+3]=back?255*fire:0;
 }mc.putImageData(mask,0,0);
 const frameCache=new Map(),flameLayer=make(width,height),fc=flameLayer.getContext('2d');
 const clothLayer=make(width,height),cl=clothLayer.getContext('2d'),clothOut=cl.createImageData(width,height),source=cc.getImageData(0,0,width,height).data;
 function animateCloth(phase){
  clothOut.data.fill(0);const out=clothOut.data;
  for(let y=70;y<337;y++)for(let x=116;x<490;x++){
   let sx=x,sy=y;
   for(let k=0;k<3;k++){
    const w=Math.pow(clamp((445-sx)/265),1.1),lag=(445-sx)*.0022;
    sx=x-w*(4.3*Math.sin(phase-lag)+1.3*Math.sin(phase*2+.7));
    sy=y-w*(11.5*Math.sin(phase-lag)+2.7*Math.sin(phase*2-sy*.017));
   }
   const ix=Math.floor(sx),iy=Math.floor(sy),u=sx-ix,v=sy-iy;if(ix<0||iy<0||ix>=width-1||iy>=height-1)continue;
   const q=(iy*width+ix)*4,ids=[q,q+4,q+width*4,q+width*4+4],weights=[(1-u)*(1-v),u*(1-v),(1-u)*v,u*v];
   let alpha=0,r=0,g=0,b=0;
   for(let k=0;k<4;k++){const at=ids[k],a=source[at+3]*weights[k];alpha+=a;r+=source[at]*a;g+=source[at+1]*a;b+=source[at+2]*a;}
   if(alpha>.1){const k=(y*width+x)*4;out[k]=r/alpha;out[k+1]=g/alpha;out[k+2]=b/alpha;out[k+3]=alpha;}
  }cl.putImageData(clothOut,0,0);return clothLayer;
 }
 const aw=assets.inkFire.width/4,ah=assets.inkFire.height/3;
 function get(time){
  const frame=((Math.floor(time*30)%120)+120)%120;if(frameCache.has(frame))return frameCache.get(frame);
  const t=frame/30,phase=t/4*Math.PI*2,c=make(width,height),ctx=c.getContext('2d');ctx.drawImage(base,0,0);
  // Independent painted flame layers flicker behind the fixed ruined town.
  fc.clearRect(0,0,width,height);fc.globalCompositeOperation='source-over';
  for(let j=0;j<20;j++){
   const right=j>=13,seed=j*133+77,X=(right?1255+random(seed)*220:30+random(seed)*580)/1.6,Y=(245+random(seed+17)*390)/1.6;
   const frameId=(Math.floor(t*10+j*1.7)%8)+1,W=55+random(seed+41)*45,H=95+random(seed+61)*90;
   const flicker=.13+.09*Math.sin(phase*3+j*2.1),rise=9*Math.sin(phase*2+j);
   fc.globalAlpha=flicker;fc.drawImage(assets.inkFire,(frameId%4)*aw,Math.floor(frameId/4)*ah,aw,ah,X-W/2,Y-H+rise,W,H);
  }
  fc.globalAlpha=1;fc.globalCompositeOperation='destination-in';fc.drawImage(fireMask,0,0);fc.globalCompositeOperation='source-over';ctx.drawImage(flameLayer,0,0);
  ctx.drawImage(animateCloth(phase),0,0);
  frameCache.set(frame,c);if(frameCache.size>12)frameCache.delete(frameCache.keys().next().value);return c;
 }
 return {get,dispose(){frameCache.clear();}};
}


export function createHellArtwork(assets,make,{title:titleText='HELL TO PAY',fireGlow=true}={}){
 const livingArt=assets.liveArt??createLivingArt(assets,make),reducedMotion=false;
 const title=make(1000,165),tc=title.getContext('2d');
 label(tc,titleText,500,87,110,925,{fill:'#e8d9b5',outline:0});
 tc.globalCompositeOperation='destination-out';
 for(let j=0;j<1600;j++){tc.globalAlpha=.25+random(j+1)*.7;tc.fillRect(random(j+500)*1000,random(j+2500)*165,.5+random(j+800)*2.5,.4+random(j+1300)*1.6);}
 tc.globalCompositeOperation='source-over';tc.globalAlpha=1;

 function draw(ctx,time,awardedSpins=null){const t=time+29/60,cfg={awardedSpins};
  if(t<TIMES.card)return;
  const age=t-TIMES.card,enter=out(age/.20),cardW=980,cardH=cardW*2/3,cy=373;
  const settle=reducedMotion?0:Math.sin(Math.max(0,age-.25)*29)*Math.exp(-Math.max(0,age-.25)*17)*3;
  ctx.save();ctx.globalAlpha=smooth(age/.055);ctx.translate(720,cy+(reducedMotion?0:12*(1-enter)+settle));
  // The illustration resolves in place, like a printed bonus plate. No off-screen flight or rotation.
  const s=reducedMotion?1:1.065-.065*enter;ctx.scale(s,s);
  ctx.shadowColor='rgba(0,0,0,.8)';ctx.shadowBlur=35;ctx.drawImage(livingArt?livingArt.get(age):assets.art,-cardW/2,-cardH/2,cardW,cardH);ctx.shadowBlur=0;
  // Soft fixed light modulation keeps painted fire in the painting itself.
  if(!reducedMotion&&fireGlow){
   ctx.save();ctx.beginPath();ctx.rect(-420,-280,840,455);ctx.clip();ctx.globalCompositeOperation='screen';
   const glow=ctx.createRadialGradient(95,-125,10,95,-125,245);glow.addColorStop(0,`rgba(200,72,10,${.025+.008*Math.sin(t*3.7)})`);glow.addColorStop(1,'rgba(100,20,0,0)');ctx.fillStyle=glow;ctx.fillRect(-170,-310,540,470);ctx.restore();
  }
  if(t>=TIMES.title){
   const a=t-TIMES.title,p=out(a/.16),bump=reducedMotion?0:Math.sin(a*31)*Math.exp(-a*18)*4;
   ctx.save();ctx.translate(0,190+(reducedMotion?0:-16*(1-p)+bump));const k=reducedMotion?1:1.035-.035*p;ctx.scale(k,k);ctx.globalAlpha*=smooth(a/.07);
   ctx.shadowColor='#180804';ctx.shadowBlur=1;ctx.shadowOffsetY=4;ctx.drawImage(title,-460,-76,920,152);ctx.restore();
  }
  if(t>=TIMES.caption){
   ctx.save();ctx.globalAlpha*=smooth((t-TIMES.caption)/.16);
   const text=cfg.awardedSpins===null?'BONUS ACTIVATED':`${cfg.awardedSpins} FREE SPINS`;
   label(ctx,text,0,264,26,650,{fill:'#cfaf71',outline:0});ctx.strokeStyle='#86633e';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-280,264);ctx.lineTo(-235,264);ctx.moveTo(235,264);ctx.lineTo(280,264);ctx.stroke();ctx.restore();
  }
  ctx.restore();

 }
return {draw,dispose:()=>livingArt.dispose()};
}
