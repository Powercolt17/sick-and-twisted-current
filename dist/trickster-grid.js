// Functional position badges. Animation time is supplied by the payout
// coordinator; there are no timers, random draws, audio or accounting here.
const clamp=v=>Math.max(0,Math.min(1,v));
const fresh=()=>Array.from({length:6},()=>Array(4).fill(1));
const copy=grid=>grid.map(col=>[...col]);
export const TRICKSTER_BADGE={growthMs:180,inset:5,height:25,fontSize:21};
export function createTricksterGrid({G,reduced=false}){
 let values=null,transition=null,owner=null;
 const initial=fresh();
 function reset(active=false,token=null){values=active?fresh():null;transition=null;owner=token;}
 function set(grid){values=grid?copy(grid):null;transition=null;}
 function animate(next,at){if(values)transition={from:copy(values),to:copy(next),at};}
 function finish(){if(transition)values=copy(transition.to);transition=null;}
 function cancel(token){if(owner===token)reset();}
 function snapshot(elapsed=0){
  if(!values)return null;
  return copy(transition&&elapsed>=transition.at?transition.to:values);
 }
 function draw(ctx,elapsed=0,{idle=false,hiddenColumns=[]}={}){
  const grid=values||(idle?initial:null);if(!grid)return;
  const age=transition?elapsed-transition.at:-1,p=clamp(age/TRICKSTER_BADGE.growthMs);
  ctx.save();ctx.beginPath();ctx.rect(G.x,G.y,G.w,G.h);ctx.clip();
  for(let c=0;c<6;c++)for(let r=0;r<4;r++){
   if(hiddenColumns.includes(c))continue;
   const from=grid[c][r],to=transition?.to[c][r]??from,changed=to!==from&&age>=0;
   const value=changed?to:from,text=value+'×';
   const contact=changed&&!reduced&&p<1?Math.sin(p*Math.PI)*Math.exp(-p*2):0;
   const size=TRICKSTER_BADGE.fontSize*Math.min(1,G.cw/100);
   ctx.font=`bold ${size}px Georgia,serif`;
   const w=Math.min(G.cw-10,Math.max(34,ctx.measureText(text).width+12)),h=Math.min(TRICKSTER_BADGE.height,G.ch*.27);
   const x=G.x+(c+1)*G.cw-TRICKSTER_BADGE.inset-w,y=G.y+r*G.ch+TRICKSTER_BADGE.inset;
   ctx.save();ctx.translate(x+w/2,y+h/2);ctx.scale(1+contact*.07,1-contact*.10);
   ctx.fillStyle='#18130f';ctx.fillRect(-w/2,-h/2,w,h);
   ctx.lineWidth=1;ctx.strokeStyle=value>1?'#d3b994':'#897a62';ctx.strokeRect(-w/2+.5,-h/2+.5,w-1,h-1);
   if(value>1){ctx.fillStyle='#92281d';ctx.fillRect(-w/2+1,-h/2+1,3,h-2);}
   ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=value>1?'#fff0cc':'#d2c3a5';
   ctx.fillText(text,1,.6,w-10);
   ctx.restore();
  }
  ctx.restore();
 }
 return {reset,set,animate,finish,cancel,draw,snapshot,get active(){return !!values},get owner(){return owner}};
}
