import {collapse,positionKey} from './cascade-kernel.js?v=1';
import {ANTICIPATION} from './scatter-anticipation.js?v=12';
import {SCATTER_GAP_MS} from './scatter-audio.js?v=2';
const clamp=v=>Math.max(0,Math.min(1,v));
// Keep incoming tiles moving through the entire burn, then lock on contact.
const refillTravel=f=>f<.72?.62*(f/.72)**1.25:.62+.38*((f-.72)/.28)**2;
export const TUMBLE_TIME={clear:180,fall:270,settle:90};
export const BLAST_TUMBLE_TIME={clear:0,fall:240,settle:75};
export function createTumbleMotion({G,reduced=false,tiles=null}){
 let state=null;
 const elapsed=now=>state?((state.pausedAt??now)-state.start-state.pausedMs)*state.speed:0;
 function begin(grid,next,cells,now,speed=1,opts={}){
  tiles?.release?.(state?.captures);
  const timing=opts.blast?BLAST_TUMBLE_TIME:TUMBLE_TIME;
  const mapping=collapse(grid,cells,(c,r)=>next[c][r]);
  if(JSON.stringify(mapping.grid)!==JSON.stringify(next))throw new Error('Refill does not preserve gravity');
  const columns=[...new Set(mapping.removed.map(p=>p[0]))].sort();
  const anticipation=opts.anticipation&&!reduced&&mapping.moves.flat().filter(m=>!m.fresh&&m.symbol==='scatter').length>=2;
  const fallMs=anticipation?1050:timing.fall;
  // Optional beat after the clear, before the refill falls (Trickster: the multiplier under an emptied cell grows).
  const hold=reduced?0:Math.max(0,opts.hold||0);
  let delay=0,lastScatter=-Infinity;
  const windows=columns.map((column,i)=>{
   const scatterCount=mapping.incoming[column].filter(s=>s==='scatter').length;
   let start=(reduced?0:timing.clear+hold+(anticipation?timing.fall+150+i*220:0))+delay;
   let land=start+(reduced?130:fallMs);
   if(scatterCount){const extra=Math.max(0,lastScatter+SCATTER_GAP_MS*speed-land);start+=extra;land+=extra;delay+=extra;lastScatter=land+(scatterCount-1)*SCATTER_GAP_MS*speed;}
   return {column,start,land,end:land+(reduced?80:timing.settle),scatterCount,rows:mapping.incoming[column].length};
  });
  const duration=windows.at(-1)?.end??(reduced?210:timing.clear+hold+fallMs+timing.settle);
  const captures=tiles?.ready&&!reduced?tiles.capture(grid,mapping.removed,opts.wilds):null;
  state={timing,captures,anticipation,windows,fallMs,filler:opts.filler||['a','k','q','j','ten'],old:grid.map(c=>[...c]),next,mapping,removed:new Set(mapping.removed.map(positionKey)),columns,start:now,speed,pausedAt:null,pausedMs:0,duration,emitted:new Set()};
 }
 function setPaused(paused,now){if(!state)return;if(paused&&state.pausedAt===null)state.pausedAt=now;else if(!paused&&state.pausedAt!==null){state.pausedMs+=now-state.pausedAt;state.pausedAt=null;}}
 function advance(now){
  if(!state||state.pausedAt!==null)return [];const u=elapsed(now),cues=[];
  for(const w of state.windows){const at=w.land;if(state.emitted.has(w.column)||u<at)continue;state.emitted.add(w.column);cues.push({column:w.column,scatter:w.scatterCount>0,scatterCount:w.scatterCount,at:state.start+state.pausedMs+at/state.speed});}
  return cues;
 }
 function release(now){
  if(!state?.anticipation)return;const u=elapsed(now);let i=0,previous=u,lastScatter=-Infinity;
  for(const w of state.windows){
   if(!state.emitted.has(w.column)&&w.start>u){
    w.fallMs=state.timing.fall;w.land=Math.max(u+i++*38+w.fallMs,previous);
    if(w.scatterCount)w.land=Math.max(w.land,lastScatter+SCATTER_GAP_MS*state.speed);
    w.start=w.land-w.fallMs;w.end=w.land+state.timing.settle;
   }
   previous=w.land;if(w.scatterCount)lastScatter=w.land+(w.scatterCount-1)*SCATTER_GAP_MS*state.speed;
  }
  state.duration=Math.max(...state.windows.map(w=>w.end));
 }
 function quickStop(now){
  if(!state||state.quickStopping)return false;state.quickStopping=true;
  // Fresh scatters keep their individual visual/audio beats. Ordinary gravity
  // runs three times faster without jumping its current falling positions.
  if(state.windows.some(w=>w.scatterCount&&!state.emitted.has(w.column))){release(now);return true;}
  const u=elapsed(now),clock=state.pausedAt??now;state.speed*=3;
  state.start=clock-u/state.speed;state.pausedMs=0;return true;
 }
 function scatterPositions(now){
  if(!state)return [];const u=elapsed(now),positions=[];
  for(let c=0;c<state.mapping.moves.length;c++)for(const m of state.mapping.moves[c])if(m.symbol==='scatter'){
   const w=state.windows.find(w=>w.column===c);
   if(m.fresh&&(!w||u<w.land))continue;
   const start=state.anticipation&&!m.fresh?state.timing.clear:w?.start??state.timing.clear;
   const fall=state.anticipation&&!m.fresh?state.timing.fall:w?.fallMs??state.fallMs;
   const f=clamp((u-start)/fall),b=clamp((u-start-fall)/state.timing.settle);
   const travel=state.anticipation?(m.fresh?refillTravel(f):1-(1-f)**3):f*f;
   positions.push([c,m.to-(m.to-m.from)*(1-travel)+(f>=1&&m.to!==m.from?Math.sin(b*Math.PI)*.017:0)]);
  }
  return positions;
 }
 function drawColumn(ctx,c,now,sprite){
  if(!state)return false;const u=elapsed(now),x=G.x+c*G.cw;
  ctx.save();ctx.beginPath();ctx.rect(x,G.y,G.cw,G.h);ctx.clip();
  if(reduced){const window=state.windows.find(w=>w.column===c),a=clamp((u-(window?.start??0))/130);for(let r=0;r<4;r++){const blasted=state.timing.clear===0&&state.removed.has(c+':'+r);if(!blasted)sprite(state.old[c][r],x,G.y+r*G.ch,G.cw,G.ch);if(blasted||state.old[c][r]!==state.next[c][r]){ctx.globalAlpha=a;sprite(state.next[c][r],x,G.y+r*G.ch,G.cw,G.ch);ctx.globalAlpha=1;}}}
  else if(u<state.timing.clear){const q=clamp(u/state.timing.clear);if(!state.captures?.posters.has(c))for(let r=0;r<4;r++){
   const k=c+':'+r,image=state.captures?.tiles.get(k),removed=state.removed.has(k);
   if(image)tiles.drop(ctx,image,x,G.y+r*G.ch,G.cw,G.ch,q);
   else{ctx.globalAlpha=removed?1-q*q:1;sprite(state.old[c][r],x,G.y+r*G.ch,G.cw,G.ch);ctx.globalAlpha=1;}
  }}
  else{
   const window=state.windows.find(w=>w.column===c),start=window?.start??state.timing.clear;
   const fallMs=window?.fallMs??state.fallMs,f=clamp((u-start)/fallMs),b=clamp((u-start-fallMs)/state.timing.settle);
   // Survivors fall first; genuine incoming tiles enter the empty spaces later.
   // No looping filler strip or synthetic scatter artwork is drawn.
   for(const m of state.mapping.moves[c]){
    const survivor=state.anticipation&&!m.fresh;
    const mf=survivor?clamp((u-state.timing.clear)/state.timing.fall):f;
    const mb=survivor?clamp((u-state.timing.clear-state.timing.fall)/state.timing.settle):b;
    const travel=state.anticipation?(m.fresh?refillTravel(mf):1-(1-mf)**3):mf*mf;
    const distance=m.to-m.from,offset=distance===0?0:distance*G.ch*(1-travel);
    const bounce=mf>=1&&distance?(state.anticipation?Math.sin(mb*Math.PI)*G.ch*.017:Math.sin(mb*Math.PI*2)*Math.exp(-mb*4)*7.2):0;
    // Landing: a short squash on contact (bottom-anchored), gone by the end of the settle.
    const squash=mf>=1&&distance&&mb<1&&!reduced?Math.sin(mb*Math.PI)*Math.exp(-mb*2)*.07:0,dh=G.ch*squash,dw=G.cw*squash*.6;
    sprite(m.symbol,x-dw/2,G.y+m.to*G.ch-offset+bounce+dh,G.cw+dw,G.ch-dh);
   }
  }
  ctx.restore();return true;
 }
 function drawWild(ctx,c,now){const image=state?.captures?.posters.get(c);if(!image)return false;const u=elapsed(now);if(u<state.timing.clear)tiles.drop(ctx,image,G.x+c*G.cw,G.y,G.cw,G.h,clamp(u/state.timing.clear));return true;}
 const wildAlpha=(c,now)=>!state||!state.columns.includes(c)?1:1-clamp(elapsed(now)/(reduced?130:state.timing.clear||.001));
 return {begin,setPaused,advance,release,quickStop,scatterPositions,drawColumn,drawWild,wildAlpha,elapsed,audioLevel:now=>!state?0:clamp((state.duration-elapsed(now))/(reduced?80:state.timing.settle)),finished:now=>!state||elapsed(now)>=state.duration,clear(){tiles?.release?.(state?.captures);state=null},get active(){return !!state},get anticipationWindow(){if(!state?.anticipation)return null;const epoch=state.start+state.pausedMs,start=epoch+state.timing.clear/state.speed,contacts=state.windows.map(w=>({column:w.column,rows:w.rows,start:epoch+w.start/state.speed,at:epoch+w.land/state.speed,end:epoch+w.end/state.speed}));return {start,end:contacts.at(-1)?.at??start,contacts};}};
}

