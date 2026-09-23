// Opt-in QA only. Fixtures use the existing calibrated outcome resolver and real spin/ledger.
export function installWinQA({getGame,getAudio,getMix}){
 const panel=document.createElement('aside');panel.id='win-qa';panel.style.cssText='position:fixed;left:4px;top:4px;z-index:1000;max-width:96vw;background:#111e;color:white;padding:5px;font:11px monospace';
 const report=document.createElement('pre');report.id='win-qa-report';report.style.cssText='max-height:80px;overflow:auto;margin:4px 0;white-space:pre-wrap';
 const controls=document.createElement('div');panel.append(controls,report);document.body.append(panel);
 const visibilityEvents=[];document.addEventListener('visibilitychange',()=>visibilityEvents.push({hidden:document.hidden,state:getGame()?.approvedWin}));
 let target=window,frame=null,last=null,history=[],observations=[],recording=null,recordingFrames=0;
 const local=()=>target===window;
 const game=()=>target.__sickTwisted;
 const button=(label,fn)=>{const b=document.createElement('button');b.textContent=label;b.style.cssText='font:11px Arial;padding:5px;margin:2px';b.onclick=()=>Promise.resolve(fn()).catch(e=>{report.textContent=String(e);console.error(e);});controls.append(b);return b;};
 const pause=ms=>new Promise(r=>setTimeout(r,ms));
 async function run(id,label,mode='normal'){
  if(!local())return target.__winQA.run(id,label,mode);
  const g=getGame();for(let i=0;!g?.snapState().ready&&i<400;i++)await pause(50);if(!g?.snapState().ready||g.busy)return;
  const before=g.snapState(),plays=g.approvedWin.plays;observations=[];g.forcePath(id,mode);
  const resolved=g.math.resolveOutcome(g.math.outcomeById(id,mode),before.bet);
  const expected=resolved.steps.filter(s=>s.result.cents>0&&!s.result.maxWin).map(s=>({cents:s.result.cents,cells:[...new Set(s.result.cells.map(p=>p.join(':')))].sort()}));
  const crossfires=[],events=[];let seen=0,wasActive=false,wasTumbling=false,stable=true,overlap=false,allLocked=true;
  const poll=setInterval(()=>{const c=g.crossfire,grid=JSON.stringify(g.snapState().reels);
   if(c.active){allLocked&&=g.busy&&document.querySelector('#bet-up').disabled&&!document.querySelector('#spin').disabled;overlap||=g.tumbling||g.approvedWin.active;
    if(c.plays!==seen){seen=c.plays;crossfires.push({cells:c.cells.map(p=>p.join(':')).sort(),grid,mode:c.audioMode,speed:c.speed,shots:c.shots,mix:getMix(),maxTime:0});events.push('shots');}
    const row=crossfires.at(-1);stable&&=row.grid===grid;row.maxTime=Math.max(row.maxTime,c.time);row.audioClock=c.audioClock;row.creditBeforeHit=c.time<c.shots[0].impact?g.ledger.returned:row.creditBeforeHit;
   }
   if(!c.active&&wasActive)events.push('shots-complete');
   if(g.tumbling&&!wasTumbling)events.push('tumble');if(!g.tumbling&&wasTumbling)events.push('refill-complete');wasActive=c.active;wasTumbling=g.tumbling;
  },16);
  try{await g.spin();}finally{clearInterval(poll);}const after=g.snapState(),w=g.approvedWin;
  const expectedCredits=resolved.steps.filter(s=>s.result.cents>0).map(s=>s.result.cents);
  const crossfireChecks={expected,crossfires,events,stable,overlap,allLocked,targetsMatch:JSON.stringify(crossfires.map(s=>s.cells))===JSON.stringify(expected.map(s=>s.cells)),awardsOnce:g.ledger.entries.length===expectedCredits.length&&g.ledger.entries.every((e,i)=>e.accepted===expectedCredits[i]),pendingAudio:g.crossfire.pendingAudio,hidden:document.querySelector('#crossfire-skip').hidden};
  last={label,id,before,after,crossfireChecks,ledger:g.ledger,plays:w.plays-plays,finishes:w.finishes,overlayHidden:document.querySelector('#approved-win-layer').hidden,audioPaused:g.winAudio.paused,mix:getMix(),observations};history.push(last);
 }
 button('QA Crossfire two tumbles',()=>run(9,'crossfire two tumbles'));
 async function rapidSpinCheck(id=9){
  if(!local())return target.__winQA.rapidSpinCheck(id);
  const g=game();if(g.busy)return;
  const started=performance.now();let presses=0,available=true;
  const p=run(id,'rapid spin presses');
  const taps=setInterval(()=>{
   if(!g.busy)return;
   const button=document.querySelector('#spin');available&&=!button.disabled;
   button.click();presses++;
  },45);
  try{await p;}finally{clearInterval(taps);}
  last.rapid={presses,available,elapsedMs:Math.round(performance.now()-started),
   exactBalance:Math.round((last.after.balance-last.before.balance+last.before.bet)*100)===last.ledger.returned,
   idle:!g.busy,spinReady:!document.querySelector('#spin').disabled};
 }
 button('QA rapid spin taps',()=>rapidSpinCheck());
 button('QA rapid large win',()=>rapidSpinCheck(94));
 button('QA bomb animation',()=>{const g=game();if(!g.busy){g.soundToggle(true);document.querySelector('#bomb-preview').click();}});
 button('QA Wild shots',async()=>{
  const g=game();if(g.busy)return;g.soundToggle(true);g.forceWildPath(1);
  const before=g.snapState(),wild={targets:[],shots:[],fired:0,impacted:0,converted:0};
  const poll=setInterval(()=>{const w=g.wildShotState;if(w){wild.targets=w.targets||wild.targets;wild.shots=w.shots;wild.fired=Math.max(wild.fired,w.fired);wild.impacted=Math.max(wild.impacted,w.impacted||0);wild.converted=Math.max(wild.converted,w.converted||0);}},16);
  try{await g.spin();}finally{clearInterval(poll);}
  last={label:'wild shots',before,after:g.snapState(),ledger:g.ledger,wild,observations:[]};history.push(last);
 });
 button('QA two adjacent scatters',async()=>{const g=game();if(g.busy)return;g.soundToggle(true);g.force([['scatter','ten','guns','q'],['bandit','scatter','ten','k'],['cuffs','j','bottle','a'],['k','bandit','q','guns'],['j','star','cuffs','a'],['star','k','guns','bottle']]);await g.spin();});
 button('QA ordinary $0.50',()=>run(29,'ordinary'));
 button('QA big $25.60',()=>run(94,'big'));
 button('QA brutal $144',()=>run(54,'brutal'));
 button('QA large 4705.3x',()=>run(1614,'large'));
 button('QA MAX',()=>game().previewMax());
 const hellGrid=[['a','ten','scatter','q'],['bandit','scatter','ten','k'],['cuffs','scatter','bottle','a'],['k','bandit','q','scatter'],['scatter','star','cuffs','a'],['star','k','guns','bottle']];
 async function hellCheck(alternate=false,record=false){
  const g=game();if(g.busy)return;const grid=alternate?hellGrid.slice().reverse().map(c=>c.slice().reverse()):hellGrid.map(c=>[...c]);
  if(record)await startRecording();g.soundToggle(true);g.force(grid);const before=g.snapState(),p=g.spin();
  for(let i=0;i<600&&!g.hellIntro.active;i++)await pause(25);
  const trigger=g.hellIntro,lockedGrid=JSON.stringify(g.snapState().reels);let stable=true,locked=true;
  const poll=setInterval(()=>{if(g.hellIntro.active){stable&&=JSON.stringify(g.snapState().reels)===lockedGrid;locked&&=g.busy&&target.document.querySelector('#spin').disabled;}},20);
  if(record){for(let i=0;i<600&&g.hellIntro.time<9.05;i++)await pause(25);g.continueHell();g.continueHell();await pause(1500);if(local())recording?.stop?.();else target.__winQA.stopRecording();}
  await p;clearInterval(poll);const ledger=g.ledger,after=g.snapState();const awardsOnce=new Set(ledger.entries.map(e=>e.id)).size===ledger.entries.length&&Math.round((after.balance-before.balance+before.bet)*100)===ledger.returned;last={awardsOnce,label:'Hell to Pay '+(alternate?'alternate':'reference')+' cells',before,after:g.snapState(),trigger,hell:g.hellIntro,stable,locked,ledger:g.ledger,observations:[]};history.push(last);
 }
 button('QA Hell reference cells',()=>hellCheck());
 button('QA Hell alternate cells',()=>hellCheck(true));
 button('QA record Hell reference',()=>hellCheck(false,true));
 button('QA record Hell alternate',()=>hellCheck(true,true));
 button('QA Hell pause',()=>game().pauseHell(true));
 button('QA Hell resume',()=>game().pauseHell(false));
 button('QA Hell continue twice',()=>{game().continueHell();game().continueHell();});
 button('QA Hell cancel',()=>game().cancelHell());
 // Uses the same visible shop buttons as the player's Buy → Confirm flow.
 button('QA buy Hell',()=>{const doc=target.document;doc.querySelector('#crow').click();doc.querySelector('.shop-card[data-id="outlaws"] button').click();doc.querySelector('#confirm-buy').click();});
 let hellLifecycle=null;
 button('QA Hell lifecycle',async()=>{
  const g=game();if(g.busy)return;g.soundToggle(true);g.force(hellGrid);const p=g.spin();
  for(let i=0;i<500&&!g.hellIntro.active;i++)await pause(25);await pause(400);
  hellLifecycle={earlyContinueBlocked:g.continueHell()===false};g.pauseHell(true);const t=g.hellIntro.time;await pause(400);
  hellLifecycle.pauseStable=g.hellIntro.time===t;hellLifecycle.pausedAudio=g.hellIntro.pendingAudio===0;
  const ledger=JSON.stringify(g.ledger);await g.spin();hellLifecycle.spinBlocked=ledger===JSON.stringify(g.ledger);
  g.pauseHell(false);g.soundToggle(false);await pause(450);hellLifecycle.muted=g.hellIntro.muted;hellLifecycle.resumed=g.hellIntro.time>t;
  g.soundToggle(true);hellLifecycle.unmuted=!g.hellIntro.muted;
  for(let i=0;i<500&&!g.hellIntro.canContinue;i++)await pause(25);
  const n=g.hellIntro.continues;g.continueHell();g.continueHell();hellLifecycle.once=g.hellIntro.continues===n+1;hellLifecycle.clean=g.hellIntro.pendingAudio===0&&!g.hellIntro.active;
  await p;hellLifecycle.returnedToSpin=!g.busy;
 });
 button('QA awarded MAX',()=>run(6,'MAX awarded','allin'));
 button('QA record MAX',async()=>{await startRecording();await run(6,'recorded MAX','allin');await pause(800);recording?.stop?.();});
 button('QA sound',()=>game().soundToggle());
 button('QA skip',()=>target.document.querySelector('#approved-win-layer button[aria-label="Skip win celebration to exact total"]').click());
 button('QA spin while busy',()=>game().spin());
 async function waitActive(){for(let i=0;i<400;i++){if(game().approvedWin.active)return;await pause(50);}throw Error('Celebration did not start');}
 async function skipCheck(){if(!local())return target.__winQA.skipCheck();const g=game(),p=run(94,'skip and blocked spin');await waitActive();await pause(1150);const ledgerBefore=JSON.stringify(g.ledger),plays=g.approvedWin.plays;await g.spin();const blocked=plays===g.approvedWin.plays&&ledgerBefore===JSON.stringify(g.ledger);const skip=document.querySelector('#approved-win-layer button[aria-label="Skip win celebration to exact total"]');skip.click();skip.click();const shown=Number(g.winCanvas.dataset.amountMinor);await p;last.check={blocked,shown,exact:shown===last.ledger.returned};}
 button('QA check skip and lock',skipCheck);
 async function muteCheck(){if(!local())return target.__winQA.muteCheck();const g=game();g.soundToggle(true);const p=run(54,'mute and restore');await waitActive();await pause(1100);document.querySelector('#approved-win-layer button[aria-label="Mute win celebration"]').click();const muted=g.winAudio.muted,t=g.winAudio.currentTime;await pause(700);document.querySelector('#approved-win-layer button[aria-label="Enable sound during win celebration"]').click();const continues=g.winAudio.currentTime>t;await p;await pause(400);last.check={muted,unmuted:!g.winAudio.muted,continues,mixRestored:getMix().duck};}
 button('QA check mute',muteCheck);
 button('QA consecutive wins',async()=>{await run(94,'consecutive 1');await run(54,'consecutive 2');});
 async function crossfireCheck(mode){
  if(!local())return target.__winQA.crossfireCheck(mode);
  const g=getGame();g.soundToggle(true);const p=run(9,'crossfire '+mode);
  for(let i=0;i<400&&!g.crossfire.active;i++)await pause(25);await pause(680);
  const check={mode};
  if(mode==='skip'){const before=JSON.stringify(g.ledger);await g.spin();check.spinBlocked=before===JSON.stringify(g.ledger);g.skipCrossfire();g.skipCrossfire();check.pendingAfterSkip=g.crossfire.pendingAudio;}
  if(mode==='mute'){g.soundToggle(false);check.muted=g.crossfire.muted;const t=g.crossfire.time;await pause(450);check.clockContinues=g.crossfire.time>t;g.soundToggle(true);check.unmuted=!g.crossfire.muted;}
  if(mode==='pause'){g.pausePresentation(true);const t=g.crossfire.time,grid=JSON.stringify(g.snapState().reels);await pause(1000);check.frozen=g.crossfire.time===t&&grid===JSON.stringify(g.snapState().reels);check.pendingWhilePaused=g.crossfire.pendingAudio;g.pausePresentation(false);}
  if(mode==='cancel'){g.cancelPresentation();check.pendingAfterCancel=g.crossfire.pendingAudio;check.cleared=!g.crossfire.active;}
  await p;last.lifecycle=check;
 }
 for(const mode of ['skip','mute','pause','cancel'])button('QA Crossfire '+mode,()=>crossfireCheck(mode));
 button('QA Crossfire turbo',async()=>{const b=target.document.querySelector('#turbo');if(b.getAttribute('aria-pressed')!=='true')b.click();await run(9,'crossfire turbo');if(b.getAttribute('aria-pressed')==='true')b.click();});
 button('QA record Crossfire tumbles',async()=>{if(!local())return target.__winQA.recordCrossfire();await startRecording();await run(9,'recorded crossfire tumbles');await pause(800);recording?.stop?.();});

 function viewport(width,height){
  if(!frame){getGame().soundToggle(false);getGame().pauseDebugRendering(true);frame=document.createElement('iframe');frame.title='Actual slot mobile viewport';frame.src='/?debug&winqa&embedded';frame.style.cssText='display:block;border:1px solid #aaa;margin:110px auto 0;';frame.allow='autoplay';document.body.append(frame);document.querySelector('#slot-shell').style.setProperty('display','none','important');target=frame.contentWindow;}
  frame.style.width=width+'px';frame.style.height=height+'px';
 }
 if(!new URLSearchParams(location.search).has('embedded')){button('QA phone 390x844',()=>viewport(390,844));button('QA landscape 844x390',()=>viewport(844,390));button('QA narrow 320x740',()=>viewport(320,740));}
 async function loadCapture(){if(window.html2canvas)return;await new Promise((res,rej)=>{const s=document.createElement('script');s.src='qa-assets/html2canvas.min.js';s.onload=res;s.onerror=rej;document.head.append(s);});}
 async function startRecording(){
  if(!local())return target.__winQA.startRecording();if(recording?.active)return;
  const g=getGame(),stage=document.querySelector('#stage');await loadCapture();
  const rect=stage.getBoundingClientRect(),out=document.createElement('canvas');out.width=Math.ceil(rect.width/2)*2;out.height=Math.ceil(rect.height/2)*2;
  const ctx=out.getContext('2d'),stream=out.captureStream(60),{context,master}=getAudio();
  if(!window.__qaAudio){const dest=context.createMediaStreamDestination(),winSource=context.createMediaElementSource(g.winAudio);winSource.connect(context.destination);winSource.connect(dest);master.connect(dest);window.__qaAudio={dest,winSource};}
  for(const t of window.__qaAudio.dest.stream.getAudioTracks())stream.addTrack(t);
  let base=null,capturing=false,stopped=false,timer=0,lastHUD=document.querySelector('#game-controls').innerText;
  async function snapshot(){if(capturing||stopped)return;capturing=true;try{base=await html2canvas(stage,{backgroundColor:'#090909',scale:1,logging:false,onclone:doc=>{doc.querySelectorAll('#stage canvas,#approved-win-layer,#loading').forEach(el=>el.style.visibility='hidden');}});}finally{capturing=false;}}
  await snapshot();const chunks=[],mime=MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')?'video/webm;codecs=vp9,opus':'video/webm';const rec=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:10000000});
  rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};rec.onstop=()=>{const blob=new Blob(chunks,{type:mime}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='Sick-and-Twisted-Hell-to-Pay-In-Game-'+document.querySelector('#slot-shell').dataset.layout+'-final.webm';a.textContent='Download actual slot recording';a.style.cssText='color:#ffe2a7;display:block';panel.append(a);if(window!==top)top.document.querySelector('#win-qa').append(a.cloneNode(true));recording={finished:true,bytes:blob.size,frames:recordingFrames};};
  function drawCanvas(c,clip){const r=c.getBoundingClientRect(),css=getComputedStyle(c);if(!r.width||!r.height||css.display==='none'||css.visibility==='hidden'||c.closest('[hidden]'))return;ctx.save();if(clip){const p=clip.getBoundingClientRect();ctx.beginPath();ctx.rect(p.left-rect.left,p.top-rect.top,p.width,p.height);ctx.clip();}ctx.globalAlpha=Number(css.opacity);ctx.drawImage(c,r.left-rect.left,r.top-rect.top,r.width,r.height);ctx.restore();}
  function paint(){if(stopped)return;ctx.clearRect(0,0,out.width,out.height);if(base)ctx.drawImage(base,0,0,out.width,out.height);
   drawCanvas(document.querySelector('#portrait-character'));for(const id of ['game','screen-glass'])drawCanvas(document.getElementById(id),document.getElementById('game-viewport'));drawCanvas(g.winCanvas);recordingFrames++;
   const hud=document.querySelector('#game-controls').innerText;if(hud!==lastHUD&&!capturing){lastHUD=hud;snapshot();}timer=setTimeout(paint,1000/60);
  }
  recordingFrames=0;paint();rec.start(250);recording={active:true,stop(){stopped=true;clearTimeout(timer);rec.stop();stream.getVideoTracks().forEach(t=>t.stop());}};
 }
 button('QA record actual slot',startRecording);
 button('QA record $144 spin',async()=>{if(!local())return target.__winQA.recordSpin();await startRecording();await run(54,'recorded brutal');await pause(800);recording?.stop?.();});
 button('QA record large spin',async()=>{if(!local())return target.__winQA.recordLarge();await startRecording();await run(1614,'recorded large');await pause(800);recording?.stop?.();});
 button('QA stop recording',()=>local()?recording?.stop?.():target.__winQA.stopRecording());
 button('QA export results',()=>{const g=game(),data=local()?history:target.__winQA.history;const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));a.download='win-integration-browser-results.json';a.textContent='Download QA results';panel.append(a);});
 setInterval(()=>{const g=game();if(!g)return;const w=g.approvedWin;if(local()&&w.active)observations.push({time:w.time,amountMinor:g.winCanvas.dataset.amountMinor,audioTime:w.audioTime,muted:w.muted,paused:w.paused,busy:g.busy,spinAvailable:!document.querySelector('#spin').disabled,betLocked:document.querySelector('#bet-up').disabled,mix:getMix()});
  const state={bomb:g.bomb?{elapsed:(performance.now()-g.bomb.start-g.bomb.pausedMs)*g.bomb.speed/1000,centers:g.bomb.centers.map(c=>[c.c,c.r]),released:g.bomb.released}:null,hellLifecycle,hell:g.hellIntro,crossfire:g.crossfire,music:g.music,samples:g.samples,wildShotState:g.wildShotState,scatterAudio:g.scatterAudio,bloodIntro:g.bloodIntro,ready:g.snapState().ready,busy:g.busy,balance:g.snapState().balance,win:g.snapState().totalWin,bet:g.snapState().bet,layout:target.document.querySelector('#slot-shell')?.dataset.layout,celebration:w,audioPaused:g.winAudio.paused,recording:local()?recording&&{active:recording.active,finished:recording.finished,frames:recordingFrames}:target.__winQA?.recording,last:local()?last:target.__winQA?.last};if(state.last){const o=state.last.observations;state.last={...state.last,observations:undefined,metrics:{samples:o.length,maxAudioSkew:o.length?Math.max(...o.filter(x=>!x.paused).map(x=>Math.abs(x.time-x.audioTime))):0,exactObserved:o.some(x=>Number(x.amountMinor)===state.last.ledger.returned),allSpinsLocked:o.every(x=>x.busy&&x.betLocked&&x.spinAvailable)}};}state.visibilityEvents=local()?visibilityEvents:target.__winQA?.visibilityEvents;report.textContent=JSON.stringify(state);},100);
 window.__winQA={run,rapidSpinCheck,crossfireCheck,recordCrossfire:async()=>{await startRecording();await run(9,'recorded crossfire tumbles');await pause(800);recording?.stop?.();},skipCheck,muteCheck,startRecording,recordLarge:async()=>{await startRecording();await run(1614,'recorded large');await pause(800);recording?.stop?.();},recordSpin:async()=>{await startRecording();await run(54,'recorded brutal');await pause(800);recording?.stop?.();},stopRecording:()=>recording?.stop?.(),get recording(){return recording&&{active:recording.active,finished:recording.finished,frames:recordingFrames};},get visibilityEvents(){return visibilityEvents;},get history(){return history;},get last(){return last;}};
 if(new URLSearchParams(location.search).has('embedded'))panel.style.display='none';
}
