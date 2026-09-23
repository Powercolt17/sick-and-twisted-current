export const FEATURE_TIMING=Object.freeze({duration:9.116666666666667,cardAt:3.5966666666666667,dimAt:3.3966666666666665,continueAt:5.866666666666666});
const clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
const noise=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
export function createScatterBurn({frozen,cells,G,skull,fire,make,seed}){
 const N=128,tiles=cells.map(([c,r],i)=>{
  const original=make(N,N);original.getContext('2d').drawImage(frozen,G.x+c*G.cw,G.y+r*G.ch,G.cw,G.ch,0,0,N,N);
  const mask=make(N,N),edge=make(N,N),paint=make(N,N),mc=mask.getContext('2d'),ec=edge.getContext('2d'),pc=paint.getContext('2d');
  const alpha=mc.createImageData(N,N),heat=ec.createImageData(N,N),threshold=new Float32Array(N*N),s=seed+i*97;
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){const d=Math.min(x,y,N-1-x,N-1-y)/(N/2),grain=noise(Math.floor(x/4)+Math.floor(y/4)*37+s),wave=.035*Math.sin(x*.19+s)*Math.cos(y*.16+s);threshold[y*N+x]=clamp(d*.78+grain*.18+wave);}
  return {c,r,i,s,original,mask,edge,paint,mc,ec,pc,alpha,heat,threshold};
 });
 let previous=-1;
 function draw(ctx,t){
  const frame=Math.floor(t*60),update=frame!==previous;previous=frame;
  for(const tile of tiles){
   const {c,r,i,s,original,mask,edge,paint,mc,ec,pc,alpha,heat,threshold}=tile,x=G.x+c*G.cw,y=G.y+r*G.ch;
   const ignite=.14+i*.045,begin=.88+i*.085,p=clamp((t-begin)/1.17),lit=smooth((t-ignite)/.16),tail=1-smooth((t-2.3)/.65);
   if(update){
    for(let k=0;k<N*N;k++){const q=k*4,d=p*1.15-threshold[k];alpha.data[q+3]=p===0?255:Math.round(255*(1-smooth((d+.005)/.025)));const e=p>0&&p<1?Math.max(0,1-Math.abs(d)/.045):0;heat.data[q]=255;heat.data[q+1]=Math.round(75+e*145);heat.data[q+2]=Math.round(e*50);heat.data[q+3]=Math.round(e*240);}
    mc.putImageData(alpha,0,0);ec.putImageData(heat,0,0);pc.clearRect(0,0,N,N);pc.globalCompositeOperation='source-over';pc.drawImage(original,0,0);pc.globalCompositeOperation='destination-in';pc.drawImage(mask,0,0);pc.globalCompositeOperation='source-over';
   }
   ctx.save();ctx.beginPath();ctx.rect(x,y,G.cw,G.ch);ctx.clip();
   if(p>0)ctx.drawImage(skull,x,y,G.cw,G.ch);
   ctx.drawImage(paint,x,y,G.cw,G.ch);if(p>0&&p<1)ctx.drawImage(edge,x,y,G.cw,G.ch);ctx.restore();
   ctx.save();ctx.globalAlpha=lit*(.9-.35*smooth((t-2.5)/.5));ctx.strokeStyle=p<1?'#ffb94e':'#ee3e14';ctx.lineWidth=2.6;ctx.shadowBlur=13*tail;ctx.shadowColor='#ff6519';ctx.strokeRect(x+2,y+2,G.cw-4,G.ch-4);ctx.shadowBlur=0;
   if(tail>0&&lit>0){
    const fw=fire.width/4,fh=fire.height/3;
    for(let j=0;j<9;j++){
     const n=s+j*43,f=(Math.floor(t*24+noise(n)*8)%8)+1,px=x+G.cw*(j<5?j/4:j%2),py=y+G.ch*(j<5?1:(j-4)/5),w=G.cw*(.33+noise(n+1)*.18),h=G.ch*(.36+noise(n+2)*.22);
     ctx.globalAlpha=lit*tail*(.7+.2*Math.sin(t*19+n));ctx.drawImage(fire,f%4*fw,Math.floor(f/4)*fh,fw,fh,px-w/2,py-h,w,h);
    }
    ctx.globalAlpha=lit*tail;ctx.fillStyle='#ffc25b';for(let j=0;j<14;j++){const n=s+j*71,age=(t*1.3+noise(n))%1;ctx.fillRect(x+noise(n+4)*G.cw+(noise(n+8)-.5)*age*25,y+G.ch*(1-age)-age*28,1.3,2.3);}
   }ctx.restore();
  }
 }
 return {draw,dispose(){for(const t of tiles)for(const c of [t.original,t.mask,t.edge,t.paint])c.width=c.height=1;}};
}
