// Presentation only. All marks refer to actual landed scatters and active
// columns; this coordinator never chooses outcomes or adds symbols.
export const FIRE_RAILS=Object.freeze({path:'assets/bonus-tease/burning-rope-atlas.webp',width:96,height:396,columns:12,frames:120,fps:24});
export const ANTICIPATION=Object.freeze({leadMs:0,gapMs:20,fallScale:2.8,refillScale:1,fadeMs:180});
const clamp=v=>Math.max(0,Math.min(1,v));
export function createScatterAnticipation({G,reduced=false,onCue=()=>{}}){
 let state=null,fire=null;
 async function load(){
  const im=new Image();im.src=FIRE_RAILS.path;
  await im.decode();fire=im;
 }
 function drawRail(ctx,edge,progress,height,alpha,side){
  ctx.save();ctx.globalAlpha=alpha;
  if(fire){
   // Predecoded, transparent OpenArt frames: two small blits, no video,
   // per-frame filters, pixel reads, or particle allocation on mobile.
   const frame=Math.min(FIRE_RAILS.frames-1,Math.floor(clamp(progress)*(FIRE_RAILS.frames-1)));
   const sx=(frame%FIRE_RAILS.columns)*FIRE_RAILS.width+side*48;
   const sy=Math.floor(frame/FIRE_RAILS.columns)*FIRE_RAILS.height;
   // A 5px rope core sits just above the 3px reel divider. Flame tips can
   // flare to either side without hiding the symbol face.
   ctx.drawImage(fire,sx,sy,48,396,edge-24,G.y,48,height);
  }else{
   // Loading failure stays unobtrusive; reel timing never depends on art.
   ctx.strokeStyle='#c99d60';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(edge,G.y);ctx.lineTo(edge,G.y+height);ctx.stroke();
  }
  ctx.restore();
 }
 function clear(){if(state&&!state.stopped)onCue({type:'stop'});state=null;}
 function begin(now,contacts,options={}){
  clear();
  // All spin/refill callers must supply two distinct, already landed scatters.
  // Never start the visual or audio cue from a predicted final outcome alone.
  const scatters=[...new Map((options.scatters||[]).map(p=>[p.join(':'),p])).values()];
  if(reduced||!contacts.length||scatters.length<2||scatters.length>=5)return false;
  const pending=contacts.map((c,i)=>({...c,start:c.start??(i?contacts[i-1].end??contacts[i-1].at:now),end:c.end??c.at+80,landed:false})).sort((a,b)=>a.start-b.start);
  state={start:now,pending,scatters:scatters.map(p=>[...p]),getScatters:options.getScatters,second:options.second,finished:null,stopped:false,pausedAt:null,activeColumn:null};
  onCue({type:'start',duration:Math.max(0,pending.at(-1).at-now)});
  return true;
 }
 function finish(now,trigger=false){
  if(!state)return;if(!state.stopped){state.stopped=true;onCue({type:'stop',fizzle:!trigger,delayMs:Math.max(0,state.pending.at(-1).end-now)});}
  state.finished=trigger?now:Math.max(now,state.pending.at(-1).end);state.trigger=trigger;
 }
 function updateScatters(cells){if(state)state.scatters=cells.map(p=>[...p]);}
 function land(column,now){
  if(!state||state.finished!==null)return;
  const c=state.pending.find(c=>c.column===column);if(c)c.landed=true;
  if(state.pending.every(c=>c.landed))finish(now,(state.getScatters?.(now)??state.scatters).length>=3);
 }
 function shift(ms){if(!state)return;state.start+=ms;if(state.finished!==null)state.finished+=ms;for(const c of state.pending){c.start+=ms;c.at+=ms;c.end+=ms;}}
 function setPaused(paused,now){if(!state)return;if(paused&&state.pausedAt===null)state.pausedAt=now;else if(!paused&&state.pausedAt!==null){shift(now-state.pausedAt);state.pausedAt=null;}}
 function current(now){return state?.pending.find(c=>now<c.end)??state?.pending.at(-1);}
 function advance(now){
  if(!state||state.pausedAt!==null||state.stopped)return;
  const c=current(now);if(now<c.start||c.column===state.activeColumn)return;
  state.activeColumn=c.column;
  onCue({type:'reel',column:c.column,duration:Math.max(0,c.at-now),final:c===state.pending.at(-1)});
 }
 function sample(now){
  if(!state||reduced)return null;now=state.pausedAt??now;
  const a=state.finished===null?1:1-clamp((now-state.finished)/ANTICIPATION.fadeMs);
  if(a<=0)return null;
  const c=current(now),t=now-state.start,progress=clamp((now-c.start)/(c.at-c.start));
  return {a,t,c,now,progress,final:c===state.pending.at(-1),visible:now>=c.start};
 }
 function drawUnderlay(){}
 function draw(ctx,now){
  const s=sample(now);if(!s)return;const {a,t,c,visible}=s;
  ctx.save();ctx.beginPath();ctx.rect(G.x,G.y,G.w,G.h);ctx.clip();
  const cells=state.getScatters?.(s.now)??state.scatters;
  const intensity=Math.min(3,Math.max(0,cells.length-2));
  // Scatters already on the board stay legible while the ordinary cells recede.
  const focus=clamp(t/180)*a;

  for(let col=0;col<Math.round(G.w/G.cw);col++)for(let row=0;row<Math.round(G.h/G.ch);row++){
   if(cells.some(p=>p[0]===col&&p[1]===row))continue;
   const rolling=state.pending.some(p=>p.column===col&&row<(p.rows??G.h/G.ch)&&s.now<p.at);
   ctx.fillStyle=`rgba(9,6,5,${(rolling?.04:.36)*focus})`;
   ctx.fillRect(G.x+col*G.cw,G.y+row*G.ch,G.cw,G.ch);
  }
  // Refill lanes overlap. Each gets its own burn clock rather than waiting
  // for the leftmost lane to land before its animation can become visible.
  const lanes=state.pending.filter(p=>s.now>=p.start&&s.now<p.end);
  for(const p of state.pending){
   if(p.landed||s.now>=p.at||lanes.includes(p))continue;
   const h=(p.rows??G.h/G.ch)*G.ch;
   ctx.strokeStyle=`rgba(216,157,75,${a*.25})`;ctx.lineWidth=1;
   ctx.strokeRect(G.x+p.column*G.cw+3,G.y+3,G.cw-6,h-6);
  }
  for(const lane of lanes){
   const x=G.x+lane.column*G.cw,h=(lane.rows??G.h/G.ch)*G.ch;
   const progress=clamp((s.now-lane.start)/Math.max(1,lane.at-lane.start));
   const settling=s.now>=lane.at?1-clamp((s.now-lane.at)/Math.max(1,lane.end-lane.at)):1;
   const weight=a*settling*(.92+.08*Math.sin(t*.012));
   ctx.strokeStyle=`rgba(255,195,91,${weight*.55})`;ctx.lineWidth=2;
   ctx.strokeRect(x+3,G.y+2,G.cw-6,h-4);
   drawRail(ctx,x+4,progress,h,weight,0);
   drawRail(ctx,x+G.cw-4,progress,h,weight,1);
   const hit=1-clamp((s.now-lane.at)/130);
   if(s.now>=lane.at&&hit>0){ctx.fillStyle=`rgba(255,214,132,${a*hit*.12})`;ctx.fillRect(x+3,G.y+2,G.cw-6,h-4);}
  }
  const pulse=.5+.5*Math.sin(t*.0105);
  for(const [col,row] of cells){
   const x=G.x+col*G.cw+3,y=G.y+row*G.ch+3,w=G.cw-6,h=G.ch-6;
   ctx.save();ctx.globalAlpha=a;ctx.globalCompositeOperation='screen';
   ctx.strokeStyle=`rgba(255,${165+intensity*20},85,${.6+.32*pulse})`;ctx.lineWidth=2.5+intensity*.4;ctx.shadowColor='#c82818';ctx.shadowBlur=0;
   ctx.strokeRect(x,y,w,h);ctx.shadowBlur=0;
   // Ember-red light breathes from the perimeter, preserving the red artwork.
   const rim=ctx.createLinearGradient(0,y,0,y+h);
   rim.addColorStop(0,`rgba(255,110,64,${.20+.15*pulse})`);rim.addColorStop(.18,'rgba(224,51,24,0)');rim.addColorStop(.78,'rgba(224,51,24,0)');rim.addColorStop(1,`rgba(255,110,64,${.12+.12*pulse})`);
   ctx.fillStyle=rim;ctx.fillRect(x,y,w,h);
   const second=state.second?.[0]===col&&state.second?.[1]===row;
   const impact=second?1-clamp(t/145):0;
   if(impact){ctx.fillStyle=`rgba(255,240,203,${impact*.32})`;ctx.fillRect(x,y,w,h);}
   ctx.strokeStyle=`rgba(255,227,183,${.62+.35*pulse})`;ctx.lineWidth=1.2;
   for(const [px,py,dx,dy] of [[x,y,1,1],[x+w,y,-1,1],[x,y+h,1,-1],[x+w,y+h,-1,-1]]){ctx.beginPath();ctx.moveTo(px,py+dy*9);ctx.lineTo(px,py);ctx.lineTo(px+dx*9,py);ctx.stroke();}
   ctx.restore();
  }
  if(state.trigger&&state.finished!==null){
   const hit=1-clamp((s.now-state.finished)/160);
   if(hit>0){ctx.fillStyle=`rgba(255,216,135,${hit*.16})`;ctx.fillRect(G.x,G.y,G.w,G.h);}
  }
  ctx.restore();
 }
 return {load,setAsset:im=>{fire=im},setSmoke(){},begin,updateScatters,land,finish,advance,setPaused,drawUnderlay,draw,clear,get active(){return !!state},get pending(){return state?.pending.filter(c=>!c.landed).map(c=>({...c}))||[]}};
}
