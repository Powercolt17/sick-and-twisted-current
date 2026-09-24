import {drawMobileScenery} from './mobile-scenery.js?v=5';
import {createVideoResource,drawMediaFrame} from './media-resource.js?v=1';
// Supplied feature films and their matching silent backgrounds share one lifecycle.
// This module presents confirmed awards only; it never rolls or modifies outcomes.
import {createBloodWallIntro,WALL_BEATS} from './blood-wall-intro.js?v=1';
export const FEATURE_MEDIA = Object.freeze({
 blood: {name:'Blood Money',file:'blood-money',scatters:3,noFilm:true},   // no intro film: straight to the briefing
 hang: {name:'Hang ’Em High',file:'hang-em-high',scatters:4,introEnd:6.5},
 hell: {name:'Hell to Pay',file:'hell-to-pay',scatters:5,entryLabel:'3 OUTLAW WILD REELS'}
});
const clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
export function confirmedFeatureCells(grid,trigger,count){
 if(!trigger||!Number.isSafeInteger(trigger.count)||trigger.count<1||
    (count===5?trigger.scatters<5:trigger.scatters!==count))throw Error('A confirmed feature award is required');
 const cells=[];for(let c=0;c<6;c++)for(let r=0;r<4;r++)if(grid[c]?.[r]==='scatter')cells.push([c,r]);
 if(cells.length!==trigger.scatters)throw Error('Confirmed scatters do not match the frozen result');
 return cells;
}
export const confirmedBloodCells=(grid,t)=>confirmedFeatureCells(grid,t,3);
export const confirmedHangCells=(grid,t)=>confirmedFeatureCells(grid,t,4);
export const confirmedHellCells=(grid,t)=>confirmedFeatureCells(grid,t,5);

export function createFeatureScenes({canvas,stage,isMuted,getView,onMix,onMusic,reduced=false,now=()=>performance.now(),sfx=()=>{},kick=()=>{},G={x:267,y:157,w:660,h:396,cw:110,ch:99},bountyWall='auto'}){
 // Blood Money opens on the reels themselves (The Bounty Wall) once its painted art is present; until then, the film.
 const wall=createBloodWallIntro({G,reduced,sfx,kick,force:bountyWall===true});
 const useWall=key=>key==='blood'&&bountyWall!==false&&wall.ready;
 const media=new Map(),resources=new WeakMap();let session=null,current=null,exitAt=null,serial=0,motion=true,paused=document.hidden,muteToggle=()=>{};
 const controls=document.createElement('div');controls.className='feature-film-controls';controls.hidden=true;
 controls.setAttribute('role','dialog');controls.setAttribute('aria-label','Feature introduction');
 const sound=document.createElement('button');sound.type='button';sound.className='feature-film-sound';
 const skip=document.createElement('button');skip.type='button';skip.className='feature-film-skip';skip.textContent='CONTINUE';
 const action=document.createElement('div');action.className='feature-film-action';
 const award=document.createElement('span');award.className='feature-film-award';award.hidden=true;
 action.append(award,skip);
 const resume=document.createElement('button');resume.type='button';resume.className='feature-film-resume';resume.textContent='PLAY INTRO';resume.hidden=true;
 const label=document.createElement('span');label.className='sr-only';label.setAttribute('aria-live','polite');
 controls.append(sound,action,resume,label);stage.querySelector('#scene-stack').append(controls);
 const hud=stage.querySelector('#game-controls');
 function presentation(phase){
  controls.setAttribute('data-phase',phase);stage.setAttribute('data-feature-film-phase',phase);
 }
 sound.addEventListener('click',()=>muteToggle());skip.addEventListener('click',()=>beginReveal(true));
 resume.addEventListener('click',()=>{if(session)void playFilm(session);});
 function item(key){
  if(media.has(key))return media.get(key);const spec=FEATURE_MEDIA[key];if(!spec)throw Error('Unknown feature');
  const poster=new Image();poster.src=`assets/feature-scenes/${spec.file}-background.jpg${key==='blood'?'?v=showdown1':''}`;
  const makeVideo=(kind,loop)=>{const v=document.createElement('video');v.playsInline=true;v.setAttribute('playsinline','');v.preload='none';v.loop=loop;v.muted=loop||isMuted();v.disablePictureInPicture=true;resources.set(v,createVideoResource(v,`assets/feature-scenes/${spec.file}-${kind}${kind==='background'&&getView().mobile?'-mobile':''}.mp4${kind==='intro'?'?v=2':key==='blood'?'?v=showdown1':''}`,{now}));return v;};
  const record={...spec,key,poster,background:makeVideo('background',true),intro:makeVideo('intro',false)};
  record.posterReady=poster.decode().catch(()=>null);media.set(key,record);return record;
 }
 const ready=video=>resources.get(video).load();
 const release=video=>resources.get(video).release();
 const filmEnd=record=>Math.min(Number.isFinite(record.intro.duration)?record.intro.duration:10,record.introEnd??Infinity);
 function syncMute(){for(const record of media.values())record.intro.muted=isMuted();sound.textContent=isMuted()?'SOUND OFF':'SOUND ON';sound.setAttribute('aria-label',isMuted()?'Enable sound':'Mute sound');}
 function backgroundPlay(){if(!current)return;const v=current.background;if(paused||!motion||reduced){resources.get(v).pause();return;}if(v.paused)void resources.get(v).play();}
 function stopOther(except){for(const r of media.values())if(r!==except){release(r.background);release(r.intro);}}
 function beginReveal(skipped=false){
  const s=session;if(!s||s.phase==='reveal'||paused)return false;
  if(s.key==='blood'&&wall.active){sfx('rip',.9,1);s.tornAt=now();}
  s.phase='reveal';presentation('reveal');s.revealAt=now();s.skipped=skipped;resources.get(s.record.intro).pause();resume.hidden=true;skip.disabled=true;
  backgroundPlay();return true;
 }
 async function playFilm(s){
  if(session!==s||paused)return;
  syncMute();
  try{const ok=await resources.get(s.record.intro).play();if(session!==s||s.phase==='reveal'||paused)return;if(!ok)throw Error('Playback unavailable');s.phase='film';s.progressAt=now();s.progressTime=s.record.intro.currentTime;presentation('film');resume.hidden=true;}
  catch{if(session===s&&s.phase!=='reveal'&&!paused){s.phase='waiting';presentation('waiting');resume.hidden=false;resume.focus({preventScroll:true});}}
 }
 async function play(key,input={}){
  if(session)return false;
  const record=item(key),cells=input.cells||[],count=record.scatters;
  if(cells.length<count||(count<5&&cells.length!==count)||new Set(cells.map(c=>c.join(':'))).size!==cells.length||cells.some(c=>c.length!==2||!c.every(Number.isInteger)||c[0]<0||c[0]>5||c[1]<0||c[1]>3))throw Error('Invalid confirmed scatter cells');
  if(input.awardedSpins!=null&&(!Number.isSafeInteger(input.awardedSpins)||input.awardedSpins<1))throw Error('Invalid confirmed spin award');
  const frozen=document.createElement('canvas');frozen.width=canvas.width;frozen.height=canvas.height;frozen.getContext('2d').drawImage(canvas,0,0);
  let resolve;const result=new Promise(r=>resolve=r);
  const s=session={id:++serial,key,record,cells:cells.map(c=>[...c]),awardedSpins:input.awardedSpins??null,phase:'loading',resolve,frozen,pausedAt:paused?now():null,revealAt:0};
  current=record;exitAt=null;stopOther(record);onMix(true);onMusic(true,key);syncMute();
  controls.setAttribute('data-feature',key);stage.setAttribute('data-feature-film',key);presentation('loading');
  award.hidden=!s.awardedSpins&&!record.entryLabel;award.textContent=s.awardedSpins?`${s.awardedSpins} FREE SPINS${key==='hang'?' · STICKY WILDS':''}`:record.entryLabel||'';
  skip.textContent=key==='blood'?(useWall(key)?'TEAR IT DOWN':'OPEN CONTRACT'):'CONTINUE';
  skip.setAttribute('aria-label',`Continue to ${record.name}${s.awardedSpins?' free spins':''}`);
  if(hud){hud.inert=true;hud.setAttribute('aria-hidden','true');}
  controls.hidden=false;skip.disabled=false;skip.hidden=false;resume.hidden=true;label.textContent=record.name+(s.awardedSpins?` · ${s.awardedSpins} free spins`:'');
  controls.setAttribute('aria-label',record.name+' introduction');
  if(record.noFilm&&!useWall(key)){ // no intro film for this feature: dissolve from the board to its scene and continue
   s.phase='film';skip.hidden=true;void ready(record.background);if(paused)s.fallback=true;else beginReveal();return result;
  }
  if(useWall(key)){ // The Bounty Wall: drawn on the canvas from the confirmed board; no intro film to load
   wall.begin(s.cells,frozen,s.awardedSpins,now(),getView());s.phase='film';presentation('film');skip.hidden=false;skip.disabled=false;
   if(paused)wall.pause(now());else skip.focus({preventScroll:true});
   return result;
  }
  record.intro.currentTime=0;record.background.currentTime=0;record.intro.onended=()=>{if(session===s)beginReveal();};
  record.intro.onerror=()=>{if(session===s&&s.phase!=='loading')beginReveal();};
  const ok=await ready(record.intro);
  if(session!==s||s.phase==='reveal')return result;
  skip.hidden=false;skip.disabled=false;
  if(!ok){s.phase='film';if(!paused)beginReveal();else s.fallback=true;}
  else if(paused)s.phase='waiting';else await playFilm(s);
  if(session===s&&s.phase==='film'&&!paused)skip.focus({preventScroll:true});
  return result;
 }
 function complete(ok){
  if(!session)return false;const s=session;session=null;wall.end();controls.hidden=true;resume.hidden=true;s.record.intro.pause();s.record.intro.onended=null;s.record.intro.onerror=null;release(s.record.intro);
  stage.setAttribute('data-feature-film','');presentation('complete');
  if(hud){hud.inert=false;hud.setAttribute('aria-hidden','false');stage.querySelector('#spin')?.focus({preventScroll:true});}
  s.frozen.width=s.frozen.height=1;onMix(false);onMusic(false,s.key);s.resolve(ok);return true;
 }
 function tick(at=now()){
  if(paused)return;
  const s=session;
  if(s?.phase==='film'&&!(s.key==='blood'&&wall.active)){
   const v=s.record.intro,end=filmEnd(s.record);
   if(v.currentTime!==s.progressTime){s.progressTime=v.currentTime;s.progressAt=at;}
   // Recover from a decoder/network stall without losing the confirmed award.
   else if(at-(s.progressAt??at)>8000){beginReveal(true);}
   if(v.currentTime>=end-3&&!s.backgroundRequested){s.backgroundRequested=true;void ready(s.record.background);}
   if(v.currentTime>=end-1)backgroundPlay();
   if(v.currentTime>=end)beginReveal();
  }
  if(s?.phase==='film'&&s.key==='blood'&&wall.active){const t=wall.elapsed(at);
   if(t>=WALL_BEATS.ready&&!s.backgroundRequested){s.backgroundRequested=true;void ready(s.record.background);}
   if(t>=WALL_BEATS.auto-1000)backgroundPlay();
   if(t>=WALL_BEATS.auto)beginReveal();
  }
  if(s?.phase==='film'&&s.record.intro.ended)beginReveal();
  if(s?.phase==='reveal'&&at-s.revealAt>=650)complete(true);
  if(exitAt!==null&&at-exitAt>=650){if(current)release(current.background);current=null;exitAt=null;}
 }
 function setPaused(value){
  if(paused===value)return;paused=value;const at=now();
  if(value){wall.pause(at);if(session)session.pausedAt=at;if(exitAt!==null)exitAt={at:exitAt,pause:at};for(const r of media.values()){resources.get(r.intro).pause();resources.get(r.background).pause();}}
  else{
   if(exitAt&&typeof exitAt==='object')exitAt=exitAt.at+at-exitAt.pause;wall.resume(at);
   const s=session;if(s){if(s.phase==='reveal')s.revealAt+=at-(s.pausedAt??at);s.pausedAt=null;if(s.fallback){s.fallback=false;beginReveal();}else if((s.phase==='film'||s.phase==='waiting')&&!(s.key==='blood'&&wall.active)){s.progressAt=at;void playFilm(s);}}
   if(!s||s.phase==='reveal'||s.record.intro.currentTime>=filmEnd(s.record)-1)backgroundPlay();
  }
 }
 function rect(source,b,contain=false,alignX=.94){const iw=source.videoWidth||source.naturalWidth||1920,ih=source.videoHeight||source.naturalHeight||1080,k=(contain?Math.min:Math.max)(b.w/iw,b.h/ih),w=iw*k,h=ih*k;return {x:b.x+(b.w-w)*(contain?.5:alignX),y:b.y+(b.h-h)*.5,w,h};}
 function drawMedia(ctx,source,b,containProgress=1,alignX=.94){
  const a=rect(source,b,true),z=rect(source,b,false,alignX),p=containProgress;ctx.save();ctx.beginPath();ctx.rect(b.x,b.y,b.w,b.h);ctx.clip();drawMediaFrame(ctx,source,a.x+(z.x-a.x)*p,a.y+(z.y-a.y)*p,a.w+(z.w-a.w)*p,a.h+(z.h-a.h)*p);ctx.restore();
 }
 function view(){return getView();}
 function frame(record){return record.background.readyState>=2?record.background:record.poster.complete&&record.poster.naturalWidth?record.poster:null;}
 function drawBackground(ctx,at=now()){
  if(!current)return false;const src=frame(current);if(!src)return false;
  const b=view();ctx.save();if(exitAt!==null){const start=typeof exitAt==='object'?exitAt.at:exitAt;const t=typeof exitAt==='object'?exitAt.pause:at;ctx.globalAlpha=1-smooth((t-start)/650);}
  if(b.mobile)drawMobileScenery(ctx,src,b,current.poster,current.key);else drawMedia(ctx,src,b,1,current.key==='blood'?.5:.94);
  // A single continuous scene keeps the gallows, sky and floor in one perspective.
  ctx.restore();return true;
 }
 function drawIntro(ctx){
  const s=session;if(!s)return false;
  if(s.key==='blood'&&wall.active){
   const b=view();
   if(s.phase==='reveal'){ // torn down: the feature background shows through as the wall falls away
    const k=smooth((now()-(s.tornAt??s.revealAt))/450);ctx.save();ctx.fillStyle='#0d0a08';ctx.fillRect(0,b.y,1212,b.h);drawBackground(ctx);
    if(k<1){ctx.globalAlpha=1-k;ctx.translate(0,k*k*140);wall.draw(ctx,now(),b);}ctx.restore();return true;}
   ctx.save();ctx.fillStyle='#0d0a08';ctx.fillRect(0,b.y,1212,b.h);wall.draw(ctx,now(),b);ctx.restore();return true;
  }
  if(s.phase==='reveal')return false;
  const b=view();ctx.save();ctx.fillStyle='#0d0a08';ctx.fillRect(0,b.y,1212,b.h);
  if(s.phase==='loading'){ctx.drawImage(s.frozen,0,0,1212,608);ctx.restore();return true;}
  const v=s.record.intro,t=v.currentTime,has=v.readyState>=2;
  const end=filmEnd(s.record),blend=smooth((t-(end-.8))/.8);
  // Show one complete composition on portrait screens. The actual feature
  // background appears only as the title dissolves, never as a second scene.
  if(blend>0){ctx.globalAlpha=blend;drawBackground(ctx);}
  if(has){ctx.globalAlpha=1-blend;drawMedia(ctx,v,b,b.mobile?0:1);}
  // The supplied films begin on black. Crossfade from the confirmed board over that opening.
  if(t<.36){ctx.globalAlpha=1-smooth(t/.36);ctx.drawImage(s.frozen,0,0,1212,608);}
  ctx.restore();return true;
 }
 function leave(){if(session)complete(false);if(current&&exitAt===null)exitAt=paused?{at:now(),pause:now()}:now();}
 function clear(){complete(false);for(const r of media.values()){release(r.intro);release(r.background);}current=null;exitAt=null;}
 const keydown=e=>{if(session&&['Space','Enter'].includes(e.code)&&e.target!==sound&&e.target!==resume){e.preventDefault();e.stopImmediatePropagation();beginReveal(true);}};
 document.addEventListener('keydown',keydown,true);document.addEventListener('visibilitychange',()=>setPaused(document.hidden));window.addEventListener('pagehide',clear);
 return {
  intro(key){return {load:()=>item(key).posterReady,preload:()=>{const r=item(key);stopOther(r);return Promise.all([ready(r.intro),r.posterReady]);},play:input=>play(key,input),draw:drawIntro,syncMute,setPaused,continue:()=>session?.key===key&&beginReveal(true),cancel:()=>session?.key===key&&complete(false),setMuteToggle:fn=>muteToggle=fn,
   get snapshot(){return session?.key===key?session.frozen:null;},get active(){return session?.key===key;},get state(){const s=session?.key===key?session:null;return {active:!!s,phase:s?.phase==='reveal'?'handoff':'film',time:s?.record.intro.currentTime||0,paused,awardedSpins:s?.awardedSpins??null,cells:s?.cells??[],canContinue:!!s&&s.phase!=='reveal',recordedMedia:true,clock:'supplied-video'};}};},
  tick,drawBackground,drawIntro,leave,clear,syncMute,setPaused,
  drawRevealCover(ctx){if(session?.phase!=='reveal'||!current)return;const s=session,keepFilm=s.skipped&&s.record.intro.readyState>=2;const src=keepFilm?s.record.intro:frame(current);if(!src)return;ctx.save();ctx.globalAlpha=1-this.foregroundAlpha;const b=view();if(b.mobile&&!keepFilm)drawMobileScenery(ctx,src,b,current.poster,current.key);else drawMedia(ctx,src,b,keepFilm&&b.mobile?0:1,!keepFilm&&current.key==='blood'?.5:.94);ctx.restore();},
  setMotion(value){if(motion===value)return;motion=value;backgroundPlay();},
  get active(){return !!session;},
  get revealing(){return session?.phase==='reveal';},
  get foregroundAlpha(){return session?.phase==='reveal'?smooth(((paused?session.pausedAt:now())-session.revealAt)/650):1;},
  get hasBackground(){return !!current;},
  get opaqueBackground(){return !!current&&exitAt===null&&!!frame(current);},
  get backgroundRect(){return current&&frame(current)?rect(frame(current),view(),false,current.key==='blood'?.5:.94):null;},
  get state(){return {feature:current?.key??null,phase:session?.phase??(exitAt!==null?'exit':current?'feature':'base'),introTime:session?.record.intro.currentTime??0,backgroundTime:current?.background.currentTime??0,backgroundPaused:current?.background.paused??true,foregroundAlpha:this.foregroundAlpha};}
 };
}

