// Blur one continuous reel, not separate cells: symbol joins cannot form bands.
// Compress vertically before filtering, then restore the aspect ratio. This
// gives a long vertical smear with a small, reusable GPU surface per column.
export function createTeaseStrip({G,getTile,makeCanvas}){
 const buffers=new Map(),sx=3,sy=.25,pad=160;
 function acquire(column){
  if(buffers.has(column))return buffers.get(column);
  const width=Math.ceil(G.cw*sx),height=Math.ceil((G.h+pad*2)*sy);
  const raw=makeCanvas(width,height),soft=makeCanvas(width,height),a=raw.getContext('2d'),b=soft.getContext('2d');
  const entry={raw,soft,a,b};buffers.set(column,entry);return entry;
 }
 function draw(ctx,plan,sample){
  if(!sample.anticipating)return false;
  const {raw,soft,a,b}=acquire(plan.reel);
  if(!('filter' in b))return false;
  a.setTransform(1,0,0,1,0,0);a.clearRect(0,0,raw.width,raw.height);
  for(let i=Math.floor(-sample.position)-3;i<=Math.ceil(4-sample.position)+3;i++){
   const tile=getTile(plan.motion.symbol(plan,i));if(!tile)return false;
   a.drawImage(tile,0,((i+sample.position)*G.ch+pad)*sy,raw.width,G.ch*sy);
  }
  b.clearRect(0,0,soft.width,soft.height);b.filter=`blur(${Math.max(1,sample.blur*12)}px)`;b.drawImage(raw,0,0);b.filter='none';
  ctx.drawImage(soft,0,pad*sy,soft.width,G.h*sy,G.x+plan.reel*G.cw,G.y,G.cw,G.h);
  return true;
 }
 return {draw};
}
