// Wind acts on transparent plant artwork only. The ground is a separate,
// stationary plate, and every clump is pinned at its bottom/root row.
const clamp=v=>Math.max(0,Math.min(1,v));
const smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
const noise=n=>{const q=Math.sin(n*127.1+83.17)*43758.5453;return q-Math.floor(q);};
export function brushGust(time){
 const phase=Math.max(0,time)/4.3,k=Math.floor(phase),u=smooth(phase-k);
 // A prevailing breeze, irregular gusts, and quiet lulls. No travelling sine
 // wave or synchronized back-and-forth across a rectangle of scenery.
 const a=.10+.85*noise(k+11),b=.10+.85*noise(k+12);
 return (a+(b-a)*u)*smooth(time/2.2);
}
export function createBrushWind({atlas,clumps,makeCanvas=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;}}){
 function prepare(p){
  const density=2,w=Math.ceil(p.w*density),h=Math.ceil(p.h*density),pad=Math.ceil(p.flex*density)+3;
  const source=makeCanvas(w,h),sc=source.getContext('2d');sc.drawImage(atlas,...p.source,0,0,w,h);
  const pixels=sc.getImageData(0,0,w,h).data,frames=[];
  // Bake continuous, alpha-correct bends once. Drawing thin texture strips
  // directly can leave horizontal sampling seams in delicate dry stems.
  for(let i=0;i<=40;i++){
   const c=makeCanvas(w+pad*2,h),cc=c.getContext('2d'),out=cc.createImageData(c.width,h),bend=i/40*p.flex*density;
   for(let y=0;y<h;y++){
    const shift=bend*Math.max(0,1-(y+.5)/h/.92)**2;
    for(let x=0;x<c.width;x++){
     const from=x-pad-shift,x0=Math.floor(from),mix=from-x0,x1=x0+1;
     const a=x0>=0&&x0<w?pixels[(y*w+x0)*4+3]:0,b=x1>=0&&x1<w?pixels[(y*w+x1)*4+3]:0;
     const alpha=a*(1-mix)+b*mix;if(!alpha)continue;const dest=(y*c.width+x)*4;
     for(let k=0;k<3;k++)out.data[dest+k]=((a?pixels[(y*w+x0)*4+k]*a*(1-mix):0)+(b?pixels[(y*w+x1)*4+k]*b*mix:0))/alpha;
     out.data[dest+3]=alpha;
    }
   }
   cc.putImageData(out,0,0);frames.push(c);
  }
  return {...p,bend:0,velocity:0,frames,pad:pad/density,drawW:(w+pad*2)/density,drawH:h/density};
 }
 const plants=clumps.map(prepare);let previous=null;
 function update(time,animate){
  let dt=previous===null?0:Math.max(0,Math.min(.1,time-previous));previous=time;
  if(!animate)return;
  while(dt>0){const h=Math.min(dt,1/60);dt-=h;
   for(const p of plants){
    const target=brushGust(Math.max(0,time-p.delay))*p.flex;
    p.velocity+=(p.stiffness*(target-p.bend)-p.damping*p.velocity)*h;
    p.bend+=p.velocity*h;
   }
  }
 }
 function draw(ctx,time,animate=true){
  update(time,animate);
  for(const p of plants){
   const frame=Math.round(clamp(p.bend/p.flex)*40);
   ctx.drawImage(p.frames[frame],p.x-p.pad,p.y,p.drawW,p.drawH);
  }
 }
 return {draw};
}
