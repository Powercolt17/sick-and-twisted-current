// Position multipliers, drawn in the background of each cell (drawBackground). Animation time is supplied by the payout
// coordinator; there are no timers, random draws, audio or accounting here.
const clamp=v=>Math.max(0,Math.min(1,v));
const fresh=()=>Array.from({length:6},()=>Array(4).fill(1));
const copy=grid=>grid.map(col=>[...col]);
// hit: fraction of the reveal hold at which the new brand strikes (game.js times the kick and sound to it).
export const TRICKSTER_BRAND={hit:.26};
export const TRICKSTER_BADGE={growthMs:180,inset:5,height:25,fontSize:21};
export function createTricksterGrid({G,reduced=false}){
 let values=null,transition=null,owner=null;
 const initial=fresh();
 function reset(active=false,token=null){values=active?fresh():null;transition=null;owner=token;shown=values?copy(values):null;pending.clear();}
 function set(grid){values=grid?copy(grid):null;transition=null;sync();}
 function animate(next,at){if(values)transition={from:copy(values),to:copy(next),at};}
 function finish(){if(transition)values=copy(transition.to);transition=null;sync();}
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
   // Only multiplied positions carry a badge; a plain 1× grid stays clean. A badge that first appears pops in.
   if(value<=1)continue;
   const appear=changed&&from<=1&&!reduced?Math.min(1,p):1,pop=appear<1?1+Math.sin(appear*Math.PI)*.18:1;
   const contact=changed&&!reduced&&p<1&&from>1?Math.sin(p*Math.PI)*Math.exp(-p*2):0;
   const size=TRICKSTER_BADGE.fontSize*Math.min(1,G.cw/100);
   ctx.font=`bold ${size}px Georgia,serif`;
   const w=Math.min(G.cw-10,Math.max(34,ctx.measureText(text).width+12)),h=Math.min(TRICKSTER_BADGE.height,G.ch*.27);
   const x=G.x+(c+1)*G.cw-TRICKSTER_BADGE.inset-w,y=G.y+r*G.ch+TRICKSTER_BADGE.inset;
   ctx.save();ctx.translate(x+w/2,y+h/2);ctx.globalAlpha=Math.min(1,appear*1.6);ctx.scale((1+contact*.07)*(.35+.65*appear)*pop,(1-contact*.10)*(.35+.65*appear)*pop);
   ctx.fillStyle='#18130f';ctx.fillRect(-w/2,-h/2,w,h);
   ctx.lineWidth=1;ctx.strokeStyle=value>1?'#d3b994':'#897a62';ctx.strokeRect(-w/2+.5,-h/2+.5,w-1,h-1);
   if(value>1){ctx.fillStyle='#92281d';ctx.fillRect(-w/2+1,-h/2+1,3,h-2);}
   ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=value>1?'#fff0cc':'#d2c3a5';
   ctx.fillText(text,1,.6,w-10);
   ctx.restore();
  }
  ctx.restore();
 }
 // ---- Multipliers in the background of the cells: branded into painted plates -----------------------------
 // The multiplier lives UNDER the tile (drawBackground runs before the reels), so it is seen only when its cell
 // empties. An upgrade earned by a win is held until that cell is cleared in the tumble; then, in the tumble's hold,
 // the old brand burns off and the new one is SLAMMED into the plate white-hot (sparks, ash, smoke, a jolt) and
 // cools to a charred brand with live embers. Plates escalate with the value (plank -> iron-bound -> charred iron).
 // Sparks and smoke (drawEffects) fly over the neighbouring tiles. Presentation only: values come from the math.
 let shown=null,pending=new Map(),plates=[];
 const tier=v=>v>1?Math.log2(v):0,plateFor=v=>v>=32?2:v>=8?1:0;
 const heatRest=v=>Math.min(.62,.34+.06*(tier(v)-1));   // a cooled brand still glows at its edges
 const key=(c,r)=>c+':'+r,clamp=x=>Math.max(0,Math.min(1,x));
 const ease=x=>x*x*(3-2*x),impact=x=>1-Math.pow(1-x,3);
 const rng=seed=>()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
 function setPlates(list){plates=(list||[]).filter(Boolean);}
 function sync(){
  const next=values;if(!next){shown=null;pending.clear();return;}
  if(!shown){shown=copy(next);return;}
  for(let c=0;c<6;c++)for(let r=0;r<4;r++)if(shown[c][r]!==next[c][r]){
   const k=key(c,r),p=pending.get(k);
   if(p&&p.at===null)p.to=next[c][r];else pending.set(k,{from:p?p.to:shown[c][r],to:next[c][r],at:null,ms:0});
   shown[c][r]=next[c][r];
  }
 }
 function pendingIn(cells){return cells.some(([c,r])=>pending.get(key(c,r))?.at===null);}
 // Upgrades hidden under these cells, in strike order (smallest value first, so the sequence climbs).
 function pendingHits(cells){const seen=new Set(),hits=[];for(const [c,r] of cells){const k=key(c,r),p=pending.get(k);if(p&&p.at===null&&!seen.has(k)){seen.add(k);hits.push({c,r,from:p.from,to:p.to});}}
  return hits.sort((a,b)=>a.to-b.to||a.c-b.c||a.r-b.r);}
 function reveal(cells,at,ms,stagger=0){pendingHits(cells).forEach((h,i)=>{const p=pending.get(key(h.c,h.r));p.at=at+i*stagger;p.ms=Math.max(0,ms);});}
 // Where a cell is in its branding: k 0..1 through the hold, or null when idle.
 function cellState(c,r,now){
  const v=shown?.[c]?.[r]??1,p=pending.get(key(c,r));
  if(!p)return {value:v,k:null};
  if(p.at===null||now<p.at)return {value:p.from,k:null};
  const k=p.ms&&!reduced?clamp((now-p.at)/p.ms):1;
  if(k>=1&&now-p.at>p.ms+900){pending.delete(key(c,r));return {value:p.to,k:null};}   // keep ~0.9 s for the smoke to clear
  return {value:p.to,from:p.from,k:Math.min(1,k),t:now-p.at,ms:p.ms};
 }
 const SLAM=.12,HIT=TRICKSTER_BRAND.hit;
 // The plate fills its cell edge to edge; s (the cell height) sizes the brand and effects.
 function plateRect(c,r){return {cx:G.x+(c+.5)*G.cw,cy:G.y+(r+.5)*G.ch,s:G.ch,pw:G.cw,ph:G.ch};}
 function drawPlate(ctx,v,cx,cy,s,rot,alpha=1,scale=1){
  const img=plates[Math.min(plates.length-1,plateFor(v))],w=G.cw*1.02*scale,h=G.ch*1.02*scale;
  ctx.save();ctx.globalAlpha*=alpha;ctx.translate(cx,cy);ctx.rotate(rot);
  if(img){ctx.drawImage(img,-w/2,-h/2,w,h);}
  else{ // painted-plate stand-in: scorched plank square
   const g=ctx.createLinearGradient(-w/2,-h/2,w/2,h/2);g.addColorStop(0,'#3a2419');g.addColorStop(1,'#1d110b');ctx.fillStyle=g;ctx.fillRect(-w/2,-h/2,w,h);
   ctx.strokeStyle='#0d0705';ctx.lineWidth=2;ctx.strokeRect(-w/2+1,-h/2+1,w-2,h-2);
   const b=ctx.createRadialGradient(0,0,s*.05,0,0,s*.34);b.addColorStop(0,'rgba(8,4,2,.85)');b.addColorStop(1,'rgba(8,4,2,0)');ctx.fillStyle=b;ctx.beginPath();ctx.arc(0,0,s*.34,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
 }
 // A brand burnt into wood: charred glyph, ember rim, and a white-hot core while heat is high.
 function drawBrand(ctx,text,cx,cy,s,scale,heat,alpha,now){
  const len=text.length,size=s*Math.max(.34,.6-.06*(len-2));
  ctx.save();ctx.translate(cx,cy);ctx.scale(scale,scale);ctx.globalAlpha*=alpha;
  ctx.font=`${size}px Outlaw,Western,Georgia,serif`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.lineJoin="round";
  const maxW=G.cw*.8,flick=.85+.15*Math.sin(now*.011+cx)*Math.sin(now*.017+cy);
  // scorched halo burnt into the plate
  ctx.shadowColor='rgba(0,0,0,.9)';ctx.shadowBlur=size*.35;ctx.fillStyle='#140905';ctx.fillText(text,0,size*.04,maxW);ctx.shadowBlur=0;
  // ember rim
  ctx.save();ctx.globalCompositeOperation='lighter';const rim=Math.min(1,.28+heat*.9)*flick;
  ctx.shadowColor=`rgba(255,${Math.round(90+120*heat)},20,${rim})`;ctx.shadowBlur=size*(.18+.35*heat);
  ctx.lineWidth=size*.07;ctx.strokeStyle=`rgba(255,${Math.round(80+110*heat)},${Math.round(20+60*heat)},${rim*.85})`;ctx.strokeText(text,0,size*.04,maxW);ctx.restore();
  // charred body, turning into molten metal while hot
  const body=ctx.createLinearGradient(0,-size*.5,0,size*.5);
  if(heat>.35){const h=clamp((heat-.35)/.65);body.addColorStop(0,`rgb(255,${Math.round(200+55*h)},${Math.round(120+120*h)})`);body.addColorStop(.55,`rgb(255,${Math.round(140+80*h)},${Math.round(40+80*h)})`);body.addColorStop(1,`rgb(${Math.round(200+55*h)},${Math.round(60+60*h)},20)`);}
  else{const e=heat/.35;body.addColorStop(0,`rgb(${Math.round(40+140*e)},${Math.round(18+40*e)},${Math.round(10+8*e)})`);body.addColorStop(1,`rgb(${Math.round(22+90*e)},${Math.round(10+20*e)},6)`);}
  ctx.fillStyle=body;ctx.fillText(text,0,size*.04,maxW);
  ctx.lineWidth=Math.max(1,size*.025);ctx.strokeStyle=`rgba(10,4,2,${.75-.5*heat})`;ctx.strokeText(text,0,size*.04,maxW);
  ctx.restore();
 }
 function drawBackground(ctx,now=0,{hiddenColumns=[]}={}){
  if(!shown)return;
  ctx.save();ctx.beginPath();ctx.rect(G.x,G.y,G.w,G.h);ctx.clip();
  for(let c=0;c<6;c++)for(let r=0;r<4;r++){
   if(hiddenColumns.includes(c))continue;
   const st=cellState(c,r,now),{cx,cy,s}=plateRect(c,r),rot=(rng(c*7+r*13+1)()-.5)*.05;
   if(st.k===null){if(st.value>1){drawPlate(ctx,st.value,cx,cy,s,rot);drawBrand(ctx,'×'+st.value,cx,cy,s,1,heatRest(st.value),1,now);}continue;}
   const {k,from,value}=st,h=heatRest(value);
   // plate: a fresh multiplier slams its plate in; a tier change swaps plates at the hit; the hit jolts the plate
   const jolt=k>HIT&&k<HIT+.1?Math.sin((k-HIT)/.1*Math.PI)*s*.05:0;
   if(from>1&&(k<HIT||plateFor(from)===plateFor(value)))drawPlate(ctx,from,cx,cy+jolt,s,rot);
   if(k>=SLAM&&(from<=1||plateFor(from)!==plateFor(value))){const a=clamp((k-SLAM)/(HIT-SLAM));drawPlate(ctx,value,cx,cy+jolt,s,rot,ease(a),1.22-.22*impact(a));}
   else if(k>=HIT&&from>1)drawPlate(ctx,value,cx,cy+jolt,s,rot);
   // the iron's heat scorches the wood around the brand
   if(k>=HIT){const a=ease(clamp((k-HIT)/.2)),rr=s*(.3+.16*a);const g=ctx.createRadialGradient(cx,cy+jolt,rr*.2,cx,cy+jolt,rr);
    g.addColorStop(0,`rgba(6,2,1,${.55*a})`);g.addColorStop(.75,`rgba(20,6,2,${.35*a})`);g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(cx-rr,cy+jolt-rr,rr*2,rr*2);}
   // the old brand flares and burns away
   if(from>1&&k<SLAM+.08){const b=clamp(k/(SLAM+.08));drawBrand(ctx,'×'+from,cx,cy+jolt,s,1+.1*b,heatRest(from)+(1-heatRest(from))*Math.min(1,b*1.6),1-ease(b),now);}
   // the new brand: slammed in white-hot, held white-hot, then cooling to its resting heat
   if(k>=SLAM){const a=clamp((k-SLAM)/(HIT-SLAM)),heat=k<HIT+.16?1:1-(1-h)*ease(clamp((k-HIT-.16)/(1-HIT-.16)));
    drawBrand(ctx,'×'+value,cx,cy+jolt,s,1.9-.9*impact(a),heat,Math.min(1,a*2.5),now);}
  }
  ctx.restore();
 }
 // Over the tiles: sparks and smoke from each hit, and a heat-seep edge on covered multiplied positions.
 function drawEffects(ctx,now=0,{hiddenColumns=[]}={}){
  if(!shown)return;
  ctx.save();ctx.beginPath();ctx.rect(G.x-G.cw*.5,G.y-G.ch*.5,G.w+G.cw,G.h+G.ch*.5);ctx.clip();
  for(let c=0;c<6;c++)for(let r=0;r<4;r++){
   if(hiddenColumns.includes(c))continue;
   const st=cellState(c,r,now),{cx,cy,s}=plateRect(c,r),v=st.value;
   if(v>1){ // covered-position marker: a heated iron edge with heat seeping into the tile
    const x=G.x+c*G.cw,y=G.y+r*G.ch,w=Math.max(2,G.cw*.03),e=Math.min(1,.45+.1*tier(v)),fl=.82+.18*Math.sin(now*.009+c*1.7+r*2.3);
    ctx.lineWidth=w+2;ctx.strokeStyle='rgba(10,4,2,.8)';ctx.strokeRect(x+w/2+1,y+w/2+1,G.cw-w-2,G.ch-w-2);
    ctx.save();ctx.globalCompositeOperation='lighter';
    ctx.lineWidth=w;ctx.strokeStyle=`rgba(255,${Math.round(70+60*(1-e))},${Math.round(20+20*(1-e))},${(.5+.4*e)*fl})`;ctx.strokeRect(x+w/2+1,y+w/2+1,G.cw-w-2,G.ch-w-2);
    const seep=Math.min(G.cw,G.ch)*.16,a=(.12+.12*e)*fl;
    for(const [x0,y0,x1,y1,rx,ry,rw,rh] of [[x,0,x+seep,0,x,y,seep,G.ch],[x+G.cw,0,x+G.cw-seep,0,x+G.cw-seep,y,seep,G.ch],[0,y,0,y+seep,x,y,G.cw,seep],[0,y+G.ch,0,y+G.ch-seep,x,y+G.ch-seep,G.cw,seep]]){
     const g=ctx.createLinearGradient(x0,y0,x1,y1);g.addColorStop(0,`rgba(255,110,30,${a})`);g.addColorStop(1,'rgba(255,80,20,0)');ctx.fillStyle=g;ctx.fillRect(rx,ry,rw,rh);}
    ctx.restore();
   }
   if(st.k===null||reduced)continue;
   const t=st.t-st.ms*HIT;if(t<0)continue;const R=rng(c*31+r*17+v);
   ctx.save();ctx.globalCompositeOperation='lighter';ctx.lineCap='round';
   // shockwave ring off the iron
   if(t<240){const f=t/240,rr=s*(.3+.45*impact(f));ctx.lineWidth=s*.09*(1-f);ctx.strokeStyle=`rgba(255,${Math.round(200-110*f)},${Math.round(110-90*f)},${.75*(1-f)})`;ctx.beginPath();ctx.arc(cx,cy,rr,0,Math.PI*2);ctx.stroke();}
   // white flash
   if(t<200){const f=1-t/200,fr=s*(.35+.6*(1-f));const g=ctx.createRadialGradient(cx,cy,0,cx,cy,fr);g.addColorStop(0,`rgba(255,245,215,${.85*f})`);g.addColorStop(.45,`rgba(255,150,50,${.45*f})`);g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(cx-fr,cy-fr,fr*2,fr*2);}
   // spark spray
   const n=Math.min(44,22+Math.round(tier(v)*3)),grav=s*.000016;
   for(let i=0;i<n;i++){const life=380+R()*440,ang=-Math.PI/2+(R()-.5)*Math.PI*1.7,sp=(1.6+2.2*R())*s/1000;if(t>life)continue;
    const l=t/life,at=u=>[cx+Math.cos(ang)*sp*u,cy+Math.sin(ang)*sp*u+grav*u*u/2],[x,y]=at(t),[x2,y2]=at(Math.max(0,t-18));
    // orange body stays visible over the cream tiles; a hot additive core makes it glow over dark plates
    const w=Math.max(1,s*.028*(1-l*.5));ctx.globalCompositeOperation='source-over';ctx.strokeStyle=`rgba(${Math.round(240-60*l)},${Math.round(110-80*l)},20,${.95*(1-l*l)})`;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(x2,y2);ctx.lineTo(x,y);ctx.stroke();
    ctx.globalCompositeOperation='lighter';ctx.strokeStyle=`rgba(255,${Math.round(235-150*l)},${Math.round(160-140*l)},${1-l})`;ctx.lineWidth=w*.5;ctx.beginPath();ctx.moveTo(x2,y2);ctx.lineTo(x,y);ctx.stroke();}
   // glowing ember chunks that float, flicker and fall
   for(let i=0;i<9;i++){const life=900+R()*600,ang=-Math.PI*(.2+.6*R()),sp=(.08+.14*R())*s/1000;if(t>life)continue;
    const l=t/life,x=cx+Math.cos(ang)*sp*t+Math.sin(t*.01+i)*s*.02,y=cy+Math.sin(ang)*sp*t+s*.0000035*t*t,fl=.6+.4*Math.sin(t*.05+i*3);
    const er=Math.max(1,s*.022*(1-l*.4));ctx.globalCompositeOperation='source-over';ctx.fillStyle=`rgba(${Math.round(230-70*l)},${Math.round(90-60*l)},15,${(1-l)*.9})`;ctx.beginPath();ctx.arc(x,y,er,0,Math.PI*2);ctx.fill();
    ctx.globalCompositeOperation='lighter';ctx.fillStyle=`rgba(255,${Math.round(190-100*l)},60,${(1-l)*fl})`;ctx.beginPath();ctx.arc(x,y,er*.55,0,Math.PI*2);ctx.fill();}
   ctx.restore();
   // thick smoke curling up off the brand
   for(let i=0;i<8;i++){const d=i*55,life=1150,u=(t-d)/life;if(u<0||u>1)continue;const Q=rng(c*31+r*17+v+i*101);
    const x=cx+(Q()-.5)*s*.45+Math.sin(u*3.2+i)*s*.1,y=cy-u*s*1.05,rad=s*(.15+.36*u),a=.46*(1-u)*Math.min(1,u*7);
    const g=ctx.createRadialGradient(x,y,0,x,y,rad);g.addColorStop(0,`rgba(46,39,34,${a})`);g.addColorStop(.6,`rgba(40,34,30,${a*.6})`);g.addColorStop(1,'rgba(30,26,24,0)');ctx.fillStyle=g;ctx.fillRect(x-rad,y-rad,rad*2,rad*2);}
  }
  ctx.restore();
 }
 const drawMarkers=drawEffects;
 return {reset,set,animate,finish,cancel,draw,drawBackground,drawEffects,drawMarkers,setPlates,pendingIn,pendingHits,reveal,snapshot,get active(){return !!values},get owner(){return owner}};
}

