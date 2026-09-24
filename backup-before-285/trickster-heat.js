// Trickster heat: the board gets hotter as position multipliers climb. Presentation only, driven by the multiplier grid.
//  - heat 0..1 from the multipliers on the board (how many, how big), smoothed: rises fast, cools slowly
//  - draw(): a warm ember glow creeping in from the reel-window edges, embers drifting up from multiplied cells,
//    and a flash on each strike (pulse). Nothing on a cold board.
//  - level(): what the audio bed should sit at.
const clamp=x=>Math.max(0,Math.min(1,x));
const hash=i=>{let h=(i+1)*2654435761>>>0;h^=h>>>15;h=Math.imul(h,2246822519)>>>0;h^=h>>>13;return (h>>>0)/4294967295;};
export function heatOf(grid){
 if(!grid)return 0;let sum=0,max=0;
 for(const col of grid)for(const v of col){const t=v>1?Math.log2(v):0;sum+=t;max=Math.max(max,t);}
 return clamp(sum/22+max/9);
}
export function createTricksterHeat({G,reduced=false}={}){
 let heat=0,target=0,last=0,pulse=0,pulseAt=-Infinity,cells=[];
 function set(grid,now){
  target=heatOf(grid);cells=[];if(grid)grid.forEach((col,c)=>col.forEach((v,r)=>{if(v>1)cells.push([c,r,Math.log2(v)]);}));
  const dt=Math.min(.1,Math.max(0,(now-last)/1000));last=now;
  heat+=(target-heat)*(target>heat?Math.min(1,dt*7):Math.min(1,dt*1.6));   // catches fire fast, cools slowly
 }
 function strike(strength=1,now=0){pulse=Math.min(1.6,strength);pulseAt=now;}
 function draw(ctx,now){
  const flash=pulse>0?Math.max(0,pulse*(1-(now-pulseAt)/420)):0,h=clamp(heat+flash*.5);if(!(h>.02))return;
  ctx.save();ctx.beginPath();ctx.rect(G.x,G.y,G.w,G.h);ctx.clip();ctx.globalCompositeOperation='lighter';
  // warm light creeping in from the edges
  const edge=Math.min(G.cw,G.ch)*(.35+.55*h),a=.16*h+.22*flash,warm=`rgba(255,${Math.round(120-40*h)},30,`;
  for(const [x0,y0,x1,y1,rx,ry,rw,rh] of [[G.x,0,G.x+edge,0,G.x,G.y,edge,G.h],[G.x+G.w,0,G.x+G.w-edge,0,G.x+G.w-edge,G.y,edge,G.h],[0,G.y,0,G.y+edge,G.x,G.y,G.w,edge],[0,G.y+G.h,0,G.y+G.h-edge,G.x,G.y+G.h-edge,G.w,edge]]){
   const g=ctx.createLinearGradient(x0,y0,x1,y1);g.addColorStop(0,warm+a+')');g.addColorStop(1,warm+'0)');ctx.fillStyle=g;ctx.fillRect(rx,ry,rw,rh);}
  // embers rising off the hot cells
  if(!reduced&&cells.length){const t=now/1000;
   for(const [c,r,tier] of cells){const n=Math.min(6,Math.round(1+tier*h*1.2));
    for(let i=0;i<n;i++){const seed=c*97+r*13+i*31,speed=.06+.05*hash(seed),life=2.4+hash(seed+1)*1.6,u=((t*speed*4+hash(seed+2)*life)%life)/life;
     const x=G.x+(c+.15+.7*hash(seed+3))*G.cw+Math.sin(t*1.7+seed)*G.cw*.08,y=G.y+(r+.9)*G.ch-u*G.ch*1.6,rad=Math.max(.8,G.cw*.014*(1-u*.5)),al=(1-u)*Math.min(1,u*5)*(.5+.5*h)*(.75+.25*Math.sin(t*9+seed));
     ctx.fillStyle=`rgba(255,${Math.round(150-90*u)},40,${al})`;ctx.beginPath();ctx.arc(x,y,rad,0,Math.PI*2);ctx.fill();}}}
  ctx.restore();
 }
 return {set,strike,draw,get heat(){return heat;},get level(){return clamp(heat);}};
}
