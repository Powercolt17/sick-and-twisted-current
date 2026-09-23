// Native board effects. Outcome cells arrive from the shared math kernel;
// presentation randomness never enters the game sampler.
export const BOMB_TIME=Object.freeze({fire:.22,refill:.58,end:.92});
export const BOMB_AUDIO=Object.freeze({fuse:'assets/bomb/fuse.wav',blast:'assets/bomb/powerful-fire-explosion.wav'});
const clamp=v=>Math.max(0,Math.min(1,v));
const smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
const key=([c,r])=>c+':'+r;
// Uneven exposures give the detonation a hard attack and a longer smoke release.
export const BLAST_FRAMES=Object.freeze([0,.014,.030,.050,.081,.127,.192,.270,.358,.456,.562,.690]);
export function blastExposure(t){
 if(t<0||t>=BLAST_FRAMES.at(-1))return null;
 let i=0;while(i<BLAST_FRAMES.length-2&&t>=BLAST_FRAMES[i+1])i++;
 return {from:i,to:i+1,mix:clamp((t-BLAST_FRAMES[i])/(BLAST_FRAMES[i+1]-BLAST_FRAMES[i]))};
}
export function createBombFX({G,bounds=null,reduced=false,getTile,getAudio=()=>null,isMuted=()=>true,onKick=()=>{},makeCanvas=(w,h)=>Object.assign(document.createElement('canvas'),{width:w,height:h}),loadPicture=async src=>{const im=new Image();im.src=src;await im.decode();return im;}}){
 let state=null,tile=null,atlas=null,serial=0,voice=null;
 const tails=new Set();
 const pcm={},buffers=new WeakMap();
 const ownerTime=(owner,now)=>owner?Math.max(0,((owner.pausedAt??now)-owner.start-owner.pausedMs)*owner.speed/1000):0;
 const elapsed=now=>ownerTime(state,now);
 async function load(){
  const [tnt,blast]=await Promise.all([loadPicture('assets/ink-western/tnt.webp'),loadPicture('assets/bomb/blast-atlas.png')]);atlas=blast;
  tile=makeCanvas(360,356);tile.getContext('2d').drawImage(tnt,0,0,360,356);
  await Promise.all(['fuse','blast'].map(async name=>{try{const r=await fetch(BOMB_AUDIO[name]);if(r.ok)pcm[name]=await r.arrayBuffer();}catch{}}));
 }
 function disposeVoice(tag){if(voice===tag)voice=null;tails.delete(tag);for(const n of tag.nodes){n.onended=null;try{n.stop();n.disconnect();}catch{}}tag.nodes=[];try{tag.blastGain.disconnect();tag.gain.disconnect();}catch{}}
 function stopSound(){if(voice)disposeVoice(voice);}
 async function sound(now){
  stopSound();if(!state||state.pausedAt!==null||isMuted())return;
  const api=getAudio();if(!api?.context||api.context.state==='closed')return;
  const owner=state,ac=api.context,tag={nodes:[],gain:ac.createGain(),blastGain:ac.createGain()};voice=tag;
  tag.gain.gain.value=.83;tag.gain.connect(api.master||ac.destination);
  // Drive the supplied blast hard into the shared limiter; keep the fuse level unchanged.
  tag.blastGain.gain.value=2.8;tag.blastGain.connect(tag.gain);
  if(!buffers.has(ac))buffers.set(ac,Promise.all(['fuse','blast'].map(async name=>({name,buffer:pcm[name]?await ac.decodeAudioData(pcm[name].slice(0)):null}))));
  try{
   const decoded=await buffers.get(ac);if(voice!==tag&&!tails.has(tag))return;
   const u=ownerTime(owner,performance.now());
   for(const {name,buffer} of decoded){if(!buffer)continue;
    const at=name==='fuse'?0:BOMB_TIME.fire,rate=name==='fuse'?owner.speed:1,offset=Math.max(0,(u-at)/owner.speed*rate);
    if(offset>=buffer.duration)continue;
    const src=ac.createBufferSource();src.buffer=buffer;src.playbackRate.value=rate;src.connect(name==='blast'?tag.blastGain:tag.gain);tag.nodes.push(src);
    src.onended=()=>{try{src.disconnect();}catch{}tag.nodes=tag.nodes.filter(n=>n!==src);if(!tag.nodes.length)disposeVoice(tag);};
    src.start(ac.currentTime+Math.max(0,(at-u)/owner.speed),offset);
   }
   if(!tag.nodes.length)disposeVoice(tag);
 }catch{disposeVoice(tag);}
 }
 function shardImage(im,points){
  const minX=Math.min(...points.map(p=>p[0])),minY=Math.min(...points.map(p=>p[1])),maxX=Math.max(...points.map(p=>p[0])),maxY=Math.max(...points.map(p=>p[1]));
  const w=(maxX-minX)*G.cw,h=(maxY-minY)*G.ch,S=3,pad=2;
  const canvas=makeCanvas(Math.ceil(w*S)+pad*2,Math.ceil(h*S)+pad*2),ctx=canvas.getContext('2d');
  ctx.translate(pad-minX*G.cw*S,pad-minY*G.ch*S);ctx.scale(S,S);
  ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x*G.cw,y*G.ch):ctx.moveTo(x*G.cw,y*G.ch));ctx.closePath();ctx.clip();
  ctx.drawImage(im,0,0,G.cw,G.ch);ctx.strokeStyle='#251409';ctx.lineWidth=1.8;ctx.stroke();
  const cx=points.reduce((n,p)=>n+p[0],0)/points.length,cy=points.reduce((n,p)=>n+p[1],0)/points.length;
  return {image:canvas,w:canvas.width/S,h:canvas.height/S,ox:(minX-cx)*G.cw-pad/S,oy:(minY-cy)*G.ch-pad/S,cx,cy};
 }
 function begin(bomb,grid,now,speed=1){
  clear({allowTail:true});let seed=(++serial*9187+bomb.centers.reduce((n,[c,r])=>n+c*129+r*31,0))>>>0;
  const rand=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};
  const centers=bomb.centers.map(([c,r])=>({c,r,x:G.x+(c+.5)*G.cw,y:G.y+(r+.5)*G.ch})),particles=[],fractures=[],grit=[],hitTimes=new Map();
  for(const [c,r] of bomb.cells){
   const center=centers.reduce((a,b)=>Math.hypot(c-b.c,r-b.r)<Math.hypot(c-a.c,r-a.r)?b:a);
   const hit=BOMB_TIME.fire+Math.hypot(c-center.c,r-center.r)*.036;hitTimes.set(c+':'+r,hit);
   const im=getTile(grid[c][r]);if(reduced||!im)continue;
   const mid=[.43+rand()*.14,.43+rand()*.14],top=[.38+rand()*.24,0],right=[1,.38+rand()*.24],bottom=[.38+rand()*.24,1],left=[0,.38+rand()*.24];
   const bend=p=>[(mid[0]+p[0])*.5+(rand()-.5)*.14,(mid[1]+p[1])*.5+(rand()-.5)*.14];
   const bt=bend(top),br=bend(right),bb=bend(bottom),bl=bend(left);
   const polys=[[[0,0],top,bt,mid,bl,left],[top,[1,0],right,br,mid,bt],[right,[1,1],bottom,bb,mid,br],[bottom,[0,1],left,bl,mid,bb]];
   fractures.push({c,r,hit,mid,spokes:[[bt,top],[br,right],[bb,bottom],[bl,left]]});
   for(const points of polys){
    const shard=shardImage(im,points),x=G.x+(c+shard.cx)*G.cw,y=G.y+(r+shard.cy)*G.ch;
    const angle=Math.atan2(y-center.y,x-center.x),v=280+rand()*300;
    particles.push({...shard,x,y,hit,vx:Math.cos(angle)*v,vy:Math.sin(angle)*v-110,spin:(rand()-.5)*10,tilt:(rand()>.5?1:-1)*(6+rand()*8),life:.38+rand()*.15});
   }
  }
  for(const center of centers){
   center.rim=Array.from({length:48},()=>.87+rand()*.20);
   for(let i=0;i<46;i++){
    const angle=rand()*Math.PI*2,v=(i<16?430:170)+rand()*(i<16?420:330);
    grit.push({x:center.x,y:center.y,vx:Math.cos(angle)*v,vy:Math.sin(angle)*v-110,
     size:(i<16?.65:1.1)+rand()*(i<16?1.15:3.8),spin:(rand()-.5)*18,angle,
     life:.22+rand()*.36,ember:i<16,red:i%5===0,stretch:1.3+rand()*2.2});
   }
  }
  state={start:now,speed,pausedAt:null,pausedMs:0,centers,particles,fractures,grit,hitTimes,cells:new Set(bomb.cells.map(key)),centerCells:new Set(bomb.centers.map(key)),released:false,kicked:false};
  void sound(now);return state;
 }
 function advance(now){if(!state||state.pausedAt!==null)return;const u=elapsed(now);if(!state.kicked&&u>=BOMB_TIME.fire){state.kicked=true;if(!reduced)onKick(32,now);}if(u>=BOMB_TIME.end&&state.released)clear({allowTail:true});}
 function quickStop(now){
  if(!state||state.kicked||elapsed(now)>=BOMB_TIME.fire||state.speed>=2.2)return false;
  const u=elapsed(now),clock=state.pausedAt??now;
  state.speed=2.2;state.start=clock-u*1000/state.speed;state.pausedMs=0;
  stopSound();void sound(now);return true;
 }
 function setPaused(paused,now){if(!state)return;if(paused&&state.pausedAt===null){state.pausedAt=now;stopSound();}else if(!paused&&state.pausedAt!==null){state.pausedMs+=now-state.pausedAt;state.pausedAt=null;void sound(now);}}
 function hides(c,r,now){return !!state&&!state.released&&(state.centerCells.has(c+':'+r)||elapsed(now)>=(state.hitTimes.get(c+':'+r)??Infinity));}
 function draw(ctx,now){
  if(!state)return;const u=elapsed(now),t=u-BOMB_TIME.fire;
  ctx.save();
  const clip=bounds||{x:G.x-G.cw*.65,y:G.y-G.ch*.5,w:G.w+G.cw*1.3,h:G.h+G.ch*1.05};
  ctx.beginPath();ctx.rect(clip.x,clip.y,clip.w,clip.h);ctx.clip();
  if(t<0){
   const q=clamp(u/BOMB_TIME.fire),load=smooth((q-.55)/.45);
   for(const c of state.centers){
    // A taut fuse and tiny pressure tremor, never a bouncing TNT sticker.
    ctx.save();ctx.translate(c.x+(reduced?0:Math.sin(q*67)*load*.8),c.y);
    if(!reduced){ctx.rotate(Math.sin(q*51)*load*.009);ctx.scale(1+load*.018,1-load*.018);}
    if(tile)ctx.drawImage(tile,-G.cw/2,-G.ch/2,G.cw,G.ch);
    const fx=G.cw*.29,fy=-G.ch*.36,r=reduced?4:5+load*8;
    ctx.globalCompositeOperation='screen';ctx.globalAlpha=reduced?.28:1;
    const glow=ctx.createRadialGradient(fx,fy,0,fx,fy,r*2.2);glow.addColorStop(0,'#fffad9');glow.addColorStop(.16,'#ffe09c');glow.addColorStop(.45,'#d67622aa');glow.addColorStop(1,'#ba370000');ctx.fillStyle=glow;ctx.fillRect(fx-r*2.2,fy-r*2.2,r*4.4,r*4.4);
    if(!reduced)for(let i=0;i<7;i++){
     const age=(q*1.7+i*.137)%1,a=i*2.399,qx=fx+Math.cos(a)*age*22,qy=fy+Math.sin(a)*age*18+age*age*8;
     ctx.globalAlpha=(1-age)*.9;ctx.strokeStyle=i%2?'#f5ac48':'#fff3c9';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(qx,qy);ctx.lineTo(qx-Math.cos(a)*3,qy-Math.sin(a)*3);ctx.stroke();
    }
    ctx.restore();
   }
  }else if(reduced){
   // Reduced motion still identifies exactly which real cells were destroyed.
   for(const f of state.hitTimes.keys()){
    const age=u-state.hitTimes.get(f);if(age<0||age>.22)continue;
    const [c,r]=f.split(':').map(Number);ctx.fillStyle=`rgba(204,151,86,${.24*(1-age/.22)})`;ctx.fillRect(G.x+c*G.cw+2,G.y+r*G.ch+2,G.cw-4,G.ch-4);
   }
  }else{
   const unit=G.cw/110;
   for(const c of state.centers){
    // The blast stays welded to the TNT, including corner and edge cells.
    // The real cabinet bounds clip its exhaust; its origin never slides inward.
    if(t<.16){
     const radius=G.cw*(.30+2.3*(1-Math.exp(-t*23))),a=Math.exp(-t*24)*(1-smooth((t-.09)/.07));
     ctx.save();ctx.globalCompositeOperation='screen';
     const light=ctx.createRadialGradient(c.x,c.y,0,c.x,c.y,radius);
     light.addColorStop(0,`rgba(255,250,216,${a*.88})`);light.addColorStop(.3,`rgba(255,184,82,${a*.45})`);light.addColorStop(1,'rgba(155,69,18,0)');ctx.fillStyle=light;ctx.fillRect(c.x-radius,c.y-radius,radius*2,radius*2);
     // Broken dust-pressure rim, intentionally irregular and short lived.
     if(t>.015){const ring=G.cw*(.38+2.0*(1-Math.exp(-(t-.015)*19)));
      ctx.globalAlpha=.38*(1-smooth((t-.035)/.125));ctx.strokeStyle='#ddbd86';ctx.lineWidth=(3.5-2*clamp(t/.16))*unit;ctx.beginPath();
      c.rim.forEach((v,i)=>{const a=i/c.rim.length*Math.PI*2,x=c.x+Math.cos(a)*ring*v,y=c.y+Math.sin(a)*ring*v*.84;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.closePath();ctx.stroke();
     }
     ctx.restore();
    }
    const frame=blastExposure(t);
    if(atlas&&frame){
     const smoke=smooth((t-.16)/.38),rise=G.ch*.34*smoke;
     const size=G.cw*(t<.1?2.95+1.05*smooth(t/.10):4+.34*smoke);
     const alpha=(1-.36*smoke)*(1-smooth((t-.43)/.26));
     const cel=(i,a)=>{if(a<=.002)return;ctx.globalAlpha=a;
      ctx.drawImage(atlas,(i%4)*362,Math.floor(i/4)*362,362,362,c.x-size/2,c.y-size/2-rise,size,size);};
     // Adjacent exposures retain the engraved fire/smoke details.
     cel(frame.from,alpha*(1-frame.mix));cel(frame.to,alpha*frame.mix);ctx.globalAlpha=1;
    }
   }
   // Exact source fragments ride out of the explosion, then fall under gravity.
   // Survivors and protected symbols never become debris.
   for(const p of state.particles){const age=u-p.hit;if(age<0)continue;const a=1-smooth((age-(p.life-.16))/.16);if(a<=0)continue;
    const flight=Math.max(0,age-.009),drag=(1-Math.exp(-flight*4.8))/4.8,x=p.x+p.vx*drag,y=p.y+p.vy*drag+610*flight*flight;
    ctx.save();ctx.translate(x,y);ctx.rotate(p.spin*flight);ctx.scale(Math.cos(flight*p.tilt),1-flight*.36);ctx.globalAlpha=a;
    ctx.drawImage(p.image,p.ox,p.oy,p.w,p.h);ctx.restore();
   }
   for(const cell of state.fractures){const age=u-cell.hit;if(age<-.022||age>.04)continue;
    ctx.save();ctx.translate(G.x+cell.c*G.cw,G.y+cell.r*G.ch);ctx.globalAlpha=(1-clamp(Math.abs(age)/.04))*.9;ctx.lineWidth=age<0?1:1.8;ctx.strokeStyle=age<0?'#201006':'#f7d6a4';
    for(const [bend,end] of cell.spokes){ctx.beginPath();ctx.moveTo(cell.mid[0]*G.cw,cell.mid[1]*G.ch);ctx.lineTo(bend[0]*G.cw,bend[1]*G.ch);ctx.lineTo(end[0]*G.cw,end[1]*G.ch);ctx.stroke();}ctx.restore();
   }
   // Fine hot grit bridges the large paper shards and the lingering exhaust.
   for(const p of state.grit){if(t>p.life)continue;const drag=(1-Math.exp(-t*3.8))/3.8,x=p.x+p.vx*drag*unit,y=p.y+(p.vy*drag+470*t*t)*unit;
    const a=(1-smooth((t-p.life*.55)/(p.life*.45)))*(p.ember?.95:.82);
    ctx.save();ctx.globalAlpha=a;ctx.translate(x,y);ctx.rotate(p.angle+p.spin*t);
    if(p.ember){ctx.globalCompositeOperation='screen';ctx.strokeStyle=t<.09?'#ffedb0':'#d77b28';ctx.lineWidth=p.size*unit;ctx.beginPath();ctx.moveTo(-Math.max(2,11*(1-t/p.life))*unit,0);ctx.lineTo(0,0);ctx.stroke();}
    else{const size=p.size*unit;ctx.fillStyle=p.red?'#761e13':t<.08?'#cba575':'#352518';ctx.beginPath();ctx.moveTo(-size,-size*.45);ctx.lineTo(size*.65,-size*.66);ctx.lineTo(size*p.stretch,size*.15);ctx.lineTo(-size*.4,size*.6);ctx.closePath();ctx.fill();}
    ctx.restore();
   }
  }
  ctx.restore();
 }
 function clear({allowTail=false}={}){
  // A completed visual must not cut off the recorded blast. Detached sources
  // remain on the same master bus and AudioContext (including mute and tab
  // suspension), and disconnect on ended. Cancellation/reset stops them all.
  if(allowTail){if(voice){tails.add(voice);voice=null;}}
  else{stopSound();for(const tag of [...tails])disposeVoice(tag);}
  state=null;
 }
 function syncMute(){for(const tag of [...tails,...(voice?[voice]:[])])tag.gain.gain.value=isMuted()?0:.83;if(!isMuted()&&state&&!voice)void sound(performance.now());}
 return {load,begin,advance,quickStop,draw,hides,setPaused,clear,elapsed,release(){if(state)state.released=true;},readyToRefill:now=>!state||elapsed(now)>=BOMB_TIME.refill,syncMute,get tile(){return tile},get active(){return !!state},get state(){return state}};
}
