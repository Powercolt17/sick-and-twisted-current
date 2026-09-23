// BLOOD MONEY: THE DUEL.
// The wanted outlaw and gunslinger share two clear lanes on the approved lantern-lit street.
// Presentation only: the bounty timeline still owns every stamp, upgrade and cent.
// Desktop and tablet only. Phones never paint the gunslinger, so they keep the header poster.
import {BLOOD_STAGE,bloodHeroPoint} from './blood-duel-stage.js?v=1';
import {gunslingerTimeline} from './gunslinger-motion.js?v=2';
import {DUEL_TIMING,planDuelShot,duelClipTime,duelFrame} from './blood-duel-motion.js?v=1';
const clamp=v=>Math.max(0,Math.min(1,v)),ease=v=>{v=clamp(v);return v*v*(3-2*v);};
const {bodyHold:LIE,fade:FADE,enter:ENTER}=DUEL_TIMING,POSTER_IN=700;
const CLIP_OF=['hit1','hit2','kill'],REST=[['hit1',0],['hit1',-1],['hit2',-1],['kill',-1]];
export function createBloodDuel({shooter,canvas,getRenderScale=()=>2,reduced=false,turbo=()=>false,onCue=()=>{},onKick=()=>{},getBounty=()=>null}){
 let meta=null,loading=null,img={},d=null,clock=0,last=null,slow=null,particles=[],shots=[],paused=false,heldShot=null;
 const LANE=BLOOD_STAGE.enemy;
 const bmp=async src=>{const im=new Image();im.src=src;await im.decode();try{return await createImageBitmap(im);}catch(e){return im;}};
 function load(){
  if(!loading)loading=(async()=>{
   const m=await fetch('assets/blood-duel/duel.json?v=3').then(r=>r.json());
   const files={pool:'assets/blood-duel/pool.webp',flash:'assets/bonus/flash.webp'};
   for(const [lv,o] of Object.entries(m.outlaws))for(const [k,c] of Object.entries(o.clips))files[`clip_${lv}_${k}`]=`assets/blood-duel/${c.file}?v=3`;
   await Promise.all([...Object.entries(files).map(async([k,src])=>{img[k]=await bmp(src);}),shooter.load?.()]);meta=m;
  })().catch(e=>{loading=null;meta=null;console.warn('Blood Money duel unavailable',e);});
  return loading;
 }
 const has=level=>level!=null&&!!meta&&!!meta.outlaws[String(level)]&&!!img[`clip_${level}_hit1`];
 const O=()=>meta.outlaws[String(d.level)];
 const fresh=(level,enterAt)=>({level,state:0,clip:null,hitAt:null,pools:[],enterAt,goneAt:0,restAt:-1e9,shot:null,away:false});
 function start(level=0,stamps=0){heldShot=null;if(!has(level))return false;clock=0;last=null;slow=null;particles=[];shots=[];d=fresh(level,-1e9);d.state=Math.max(0,Math.min(2,stamps));canvas.style.filter='';return true;}
 function stop(){heldShot=null;d=null;particles=[];shots=[];slow=null;canvas.style.filter='';}
 function setPaused(value){paused=!!value;last=null;}
 // Active time is shared by fire, contact, audio and particles. Drawing never advances state.
 function update(now){if(!d||paused){last=null;return;}const dt=last===null?0:Math.max(0,Math.min(100,now-last))*(turbo()?1.55:1);last=now;clock+=dt;
  if(d.clip&&clock>=d.clip.at){const c=O().clips[d.clip.name],time=duelClipTime(clock-d.clip.origin,d.clip.plan,d.clip.kill,reduced);
   if(d.clip.kill&&!d.clip.landed&&time>=(c.ground??c.ts.at(-1))){d.clip.landed=true;onCue({type:'fall',clock});if(!reduced)onKick(1.8);}
   if((reduced&&d.shot?.impacted)||time>=c.ts.at(-1)){d.clip=null;d.restAt=clock;}}
  const sec=dt/1000;particles=particles.filter(p=>{p.vy+=900*sec;p.x+=p.vx*sec;p.y+=p.vy*sec;p.life-=sec;return p.life>0&&p.y<LANE.ground+6;});
  shots=shots.filter(s=>clock-s.at<s.dur+100);
  const b=getBounty();
  if(b&&b.level>d.level&&d.next===undefined&&!d.away){if(d.state<3&&!(d.shot&&!d.shot.impacted)){d.state=3;d.clip=null;d.restAt=clock;}next(b.level);}
  if(d.goneAt&&!d.clip&&!d.shot&&clock>=d.goneAt+FADE&&d.next!==undefined){const lv=d.next;d=has(lv)?fresh(lv,clock):{...fresh(lv,clock),away:true,awayAt:clock};slow=null;return;}
  if(d.state===3&&!d.clip&&!d.shot&&d.next===undefined&&!d.away&&clock-d.restAt>=LIE){d.goneAt=clock;d.next=null;}
  const q=d.shot;if(!q)return;const t=clock-q.at;
  if(!q.drew&&t>=0){q.drew=true;onCue({type:'draw',clock});}
  if(!q.fired&&clock>=q.origin+q.plan.fire){q.fired=true;const m=muzzle(q.run,q.run.shots[0]+.001),w=wound(q.n);
   shots.push({x0:m.x,y0:m.y,x1:w.x,y1:w.y,at:q.origin+q.plan.fire,dur:q.plan.travel||1,kill:q.kill});
   onCue({type:'shot',kill:q.kill,clock,scheduled:q.origin+q.plan.fire});onKick(q.kill?3.5:2.2);}
  if(q.fired&&!q.impacted&&clock>=q.origin+q.plan.land){q.impacted=true;const w=wound(q.n);d.hitAt=q.origin+q.plan.land;
   for(let i=0;i<(q.kill?18:12);i++){const a=(Math.random()-.5)*1.9,sp=90+Math.random()*230;particles.push({x:w.x,y:w.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-65,r:.8+Math.random()*1.6,life:.65+Math.random()*.3});}
   d.pools.push({x:LANE.cx+(Math.random()-.5)*22,at:clock,s:42+q.n*16});d.state=q.n+1;
   if(q.kill)slow={from:d.hitAt,to:d.hitAt+DUEL_TIMING.killAccent};
   if(reduced){d.clip=null;d.restAt=clock;}
   onCue({type:'impact',n:q.n,kill:q.kill,clock,scheduled:q.origin+q.plan.land});onKick(q.kill?6:4);}
  if(q.impacted&&t>=q.run.end*1000&&!d.clip)d.shot=null;
 }
 function muzzle(run,t){if(shooter.muzzle)return shooter.muzzle(t);const j=shooter.assets.json,p=j.placement,k=shooter.frameIndex(t),m=j.muzzles[Math.max(0,k)];return bloodHeroPoint(p.x+m[0]*p.width/j.width,p.y+m[1]*p.height/j.height);}
 function wound(n){const o=O(),c=o.clips[CLIP_OF[n]],fr=duelFrame(c,c.impact??c.ts[c.start||0]),m=c.m[fr?.i??0],w=o.wounds[n];return {x:LANE.cx+w[0]*o.scale*m*LANE.scale,y:LANE.ground+w[1]*o.scale*m*LANE.scale};}
 function hit(n,kill,{continueToTarget=false}={}){if(!d||d.away||d.shot||d.clip||!Number.isInteger(n)||n<0||n>2||n!==d.state)return false;
  const run=shooter.timeline?.({hold:kill&&continueToTarget})||gunslingerTimeline([[0,0]]),c=O().clips[CLIP_OF[n]],plan=planDuelShot(c,run,kill,reduced);
  shooter.startCells(run,wound(n));d.shot={origin:clock,at:clock+plan.gunDelay,plan,run,n,kill:!!kill,fired:false,impacted:false,drew:false};
  if(kill&&continueToTarget)heldShot=d.shot;
  d.clip={name:CLIP_OF[n],origin:clock,plan,kill:!!kill,at:clock+plan.clipStart};return true;}
 function next(level){if(!d||d.next!==undefined)return;const c=d.clip&&O().clips[d.clip.name];
  const end=c?d.clip.origin+d.clip.plan.land+Math.max(0,c.ts.at(-1)-d.clip.plan.impact)+DUEL_TIMING.killAccent*(1-DUEL_TIMING.killRate):clock;
  d.goneAt=Math.max(clock,end)+LIE;d.next=level;}
 function clipAt(name){if(!d.clip||clock<d.clip.at)return null;return duelFrame(O().clips[name],duelClipTime(clock-d.clip.origin,d.clip.plan,d.clip.kill,reduced));}
 function clipFrame(g,name,i,alpha,ox,oy,bw,t){const c=O().clips[name],n=i<0?c.count+i:Math.min(c.count-1,Math.max(0,i)),sx=(n%c.cols)*c.cw,sy=Math.floor(n/c.cols)*c.ch,m=c.m[n];
  g.save();g.globalAlpha*=alpha;g.translate(LANE.cx+ox,LANE.ground+oy);if(bw>0)g.transform(1,0,Math.sin(t/1300)*.005*bw,1+Math.sin(t/760)*.008*bw,0,0);g.scale(m*LANE.scale,m*LANE.scale);g.drawImage(img[`clip_${d.level}_${name}`],sx,sy,c.cw,c.ch,c.ox,c.oy,c.dw,c.dh);g.restore();}
 let buf=null,bufG=null,bufRS=0;const BW=310,BH=470,FBX=155,FBY=435;
 function buffer(){const rs=getRenderScale();if(!buf||bufRS!==rs){buf=document.createElement('canvas');buf.width=Math.ceil(BW*rs);buf.height=Math.ceil(BH*rs);bufG=buf.getContext('2d');bufRS=rs;}return bufG;}
 const lane=phone=>!phone&&!!d&&!d.away&&has(d.level);
 const owns=phone=>!phone&&!!d&&!!meta;
 function releaseAim(){if(!heldShot)return null;const result=shooter.handoff?.((clock-heldShot.at)/1000)??null;heldShot=null;return result;}
 function drawFigure(ctx,now,motion){const q=(d&&d.shot)||heldShot;if(!q||!shooter.assets.json)return false;const t=(clock-q.at)/1000;if(t<0||(!heldShot&&t>=q.run.end))return false;if(reduced)return shooter.idle(ctx,now,false)||false;shooter.figure(ctx,t,1,now,motion);return true;}
 let warmed=false;
 function drawOutlaw(ctx){if(!d||!meta)return;const t=clock;
  // the first time he is drawn (the feature's opening, a quiet moment), push every sheet through the game canvas once,
  // so no sheet is ever drawn for the first time in the middle of a shot
  if(!warmed){warmed=true;ctx.save();ctx.globalAlpha=.004;for(const k of Object.keys(img))if(img[k])ctx.drawImage(img[k],0,0,1,1);ctx.restore();}
  const gone=d.goneAt?clamp((t-d.goneAt)/FADE):0;if(gone>=1)return;const enter=ease(clamp((t-d.enterAt)/ENTER)),alpha=(1-gone)*enter;
  const hitA=d.hitAt!=null?(t-d.hitAt)/1000:9,e=hitA<.14?(1-hitA/.14)*.4:0;
  // Contact shadow and blood remain planted on the shared dirt floor
  ctx.save();ctx.globalAlpha=alpha*.55;ctx.translate(LANE.cx,LANE.ground+1);ctx.scale(1.2,.19);const sh=ctx.createRadialGradient(0,0,4,0,0,70);sh.addColorStop(0,'rgba(8,4,2,.85)');sh.addColorStop(1,'rgba(8,4,2,0)');ctx.fillStyle=sh;ctx.fillRect(-72,-72,144,144);ctx.restore();
  if(img.pool)for(const p of d.pools){const a=clamp((t-p.at)/900),w=p.s*(.3+.7*ease(a)),h=w*img.pool.height/img.pool.width*.32;ctx.save();ctx.globalAlpha=.85*alpha;ctx.drawImage(img.pool,p.x-w/2,LANE.ground-h*.55,w,h);ctx.restore();}
  let name,fr=null;if(d.clip&&!reduced){fr=clipAt(d.clip.name);if(fr)name=d.clip.name;}
  const bw=d.state>=3||reduced?0:fr?Math.max(0,1-(t-d.clip.at)/180):ease(clamp((t-d.restAt)/900));
  if(!fr&&e<=0){const r=REST[d.state];ctx.save();ctx.globalAlpha=alpha;clipFrame(ctx,r[0],r[1],1,0,0,bw,t);ctx.restore();return;}
  // Motion-compensated cells preserve a single silhouette; the buffer applies the impact light.
  const g=buffer(),rs=bufRS,ox=FBX-LANE.cx,oy=FBY-LANE.ground;g.setTransform(1,0,0,1,0,0);g.globalAlpha=1;g.globalCompositeOperation='source-over';g.clearRect(0,0,buf.width,buf.height);g.setTransform(rs,0,0,rs,0,0);
  if(!fr){const r=REST[d.state];name=r[0];clipFrame(g,name,r[1],1,ox,oy,bw,t);}
  else clipFrame(g,name,fr.i+(fr.f>=.5?1:0),1,ox,oy,bw,t);
  if(e>0){g.globalCompositeOperation='source-atop';g.fillStyle=`rgba(255,${190-90*e|0},${140-90*e|0},${.38*e})`;g.fillRect(0,0,BW,BH);g.globalCompositeOperation='source-over';}
  ctx.save();ctx.globalAlpha=alpha;ctx.drawImage(buf,LANE.cx-FBX,LANE.ground-FBY,BW,BH);ctx.restore();}
 function drawOver(ctx){if(!d)return;const t=clock;
  if(d.shot)shooter.drawFlash?.(ctx,(clock-d.shot.at)/1000);
  for(const sh of shots){const a=t-sh.at,big=sh.kill,ang=Math.atan2(sh.y1-sh.y0,sh.x1-sh.x0);
   // muzzle flash off his revolver, turned toward the target
   if(!shooter.drawFlash&&a<(big?110:70)&&img.flash){const f=img.flash,p=a/(big?110:70),s2=(big?120:88)*(1-.3*p),fh=s2*f.height/f.width;ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=1-p;ctx.translate(sh.x0,sh.y0);ctx.rotate(ang);ctx.drawImage(f,-s2*.06,-fh/2,s2,fh);ctx.restore();}
   const p=clamp(a/sh.dur),hx=sh.x0+(sh.x1-sh.x0)*p,hy=sh.y0+(sh.y1-sh.y0)*p;
   if(a<sh.dur+55){const tail=Math.max(0,p-.32),tx=sh.x0+(sh.x1-sh.x0)*tail,ty=sh.y0+(sh.y1-sh.y0)*tail,fade=a<sh.dur?1:1-(a-sh.dur)/55;
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.lineCap='round';for(const [w,c,al] of big?[[12,'255,120,40',.22],[5,'255,200,120',.55],[2,'255,250,230',1]]:[[6,'255,140,50',.28],[2.2,'255,235,190',.95]]){const gr=ctx.createLinearGradient(tx,ty,hx,hy);gr.addColorStop(0,`rgba(${c},0)`);gr.addColorStop(1,`rgba(${c},${al*fade})`);ctx.strokeStyle=gr;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(tx,ty);ctx.lineTo(hx,hy);ctx.stroke();}ctx.restore();}
  }
  // blood blown out of him, falling to the boards
  if(particles.length){ctx.save();ctx.fillStyle='#5e0a07';for(const b of particles){ctx.globalAlpha=Math.min(1,b.life*1.6);ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,6.283);ctx.fill();}ctx.restore();}
  // bullet time: a short accent on the moving reaction after the kill round lands (a GPU filter on the canvas)
  let a=0;if(slow&&!reduced&&t>=slow.from&&t<slow.to+180)a=t<slow.to?Math.min(1,(t-slow.from)/40):1-ease((t-slow.to)/180);
  const f=a>.01?`grayscale(${(a*.75).toFixed(3)}) brightness(${(1-a*.22).toFixed(3)}) contrast(${(1+a*.12).toFixed(3)})`:'';if(canvas.style.filter!==f)canvas.style.filter=f;}
 return {load,start,stop,update,hit,next,has,lane,owns,releaseAim,drawFigure,drawOutlaw,drawOver,setPaused,
  get debug(){return d?{level:d.level,state:d.state,holdingAim:!!heldShot,gun:shooter.handoff?.(Math.max(0,(clock-((d.shot||heldShot)?.at??clock))/1000))??null,ground:LANE.ground,scale:LANE.scale,clip:d.clip&&d.clip.name,frame:d.clip?clipAt(d.clip.name):null,shot:!!d.shot,impacted:!!d.shot?.impacted,away:d.away,paused,clock:Math.round(clock),particles:particles.length,plan:d.shot?.plan??null}:null;},
  get posterAlpha(){return !d||!d.away?1:ease(clamp((clock-(d.awayAt||0))/POSTER_IN));},
  get active(){return !!d;},get impacted(){return !!d&&(!d.shot||d.shot.impacted);},get settled(){return !d||(!d.shot&&!d.clip&&(d.away||d.state<3||clock-d.restAt>=DUEL_TIMING.settleHold)&&!(d.goneAt&&clock<d.goneAt+FADE));},get ready(){return !!meta;}};
}
