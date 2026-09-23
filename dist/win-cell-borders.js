// A separate layer keeps the approved shooting, blood and sound untouched.
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
export function drawWinCellBorders(ctx,G,volley,{reduced=false}={}){
 if(!volley?.active||!volley.cells.length)return;
 const t=volley.time,speed=volley.speed||1,fade=1-smooth((t-volley.duration+.23/speed)*speed/.23);
 const enter=smooth(t*speed/.08),unit=G.cw/150,lit=new Set(volley.cells.map(([c,r])=>c+':'+r));
 ctx.save();ctx.beginPath();ctx.rect(G.x,G.y,G.w,G.h);ctx.clip();
 // Keep the symbols legible; focus the actual awarded cells across every mode.
 ctx.fillStyle=`rgba(8,3,2,${.17*enter*fade})`;
 for(let c=0;c<6;c++)for(let r=0;r<4;r++)if(!lit.has(c+':'+r))ctx.fillRect(G.x+c*G.cw,G.y+r*G.ch,G.cw,G.ch);
 for(const [c,r] of volley.cells){
  const hit=volley.shots.find(s=>s.c===c&&s.r===r),age=(t-(hit?.impact??0))*speed;
  const contact=!reduced&&age>=0?Math.exp(-age*13):0;
  const pulse=reduced?0:(.5+.5*Math.sin(t*speed*8.2))*.16;
  const x=G.x+c*G.cw+4*unit,y=G.y+r*G.ch+4*unit,w=G.cw-8*unit,h=G.ch-8*unit;
  ctx.globalAlpha=enter*fade;ctx.lineJoin='bevel';ctx.shadowBlur=0;
  ctx.lineWidth=7*unit;ctx.strokeStyle='#210704';ctx.strokeRect(x,y,w,h);
  ctx.shadowColor=contact>.25?'#ffb54c':'#f15118';ctx.shadowBlur=(9+contact*15)*unit;
  ctx.lineWidth=(3.6+contact*1.5)*unit;ctx.strokeStyle=age>=0?'#ffad46':'#c77936';ctx.strokeRect(x,y,w,h);
  ctx.shadowBlur=0;ctx.globalAlpha=enter*fade*(.76+pulse+.08*contact);
  ctx.lineWidth=(1.5+contact*.8)*unit;ctx.strokeStyle='#fff0c8';ctx.strokeRect(x,y,w,h);
  // Hot corner brackets punch on contact without obscuring the symbol or blood.
  const len=(13+contact*8)*unit;ctx.lineWidth=(3+contact)*unit;ctx.strokeStyle=contact>.2?'#fff9e9':'#ffcf7f';
  ctx.beginPath();
  for(const [px,py,dx,dy] of [[x,y,1,1],[x+w,y,-1,1],[x,y+h,1,-1],[x+w,y+h,-1,-1]]){
   ctx.moveTo(px,py+dy*len);ctx.lineTo(px,py);ctx.lineTo(px+dx*len,py);
  }ctx.stroke();
 }
 ctx.restore();
}
