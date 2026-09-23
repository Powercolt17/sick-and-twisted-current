import assert from 'node:assert/strict';
import {createScatterDeath,DEATH_CLIP,DEATH_CLIPS,TURBO_RATE} from '../dist/scatter-death.js?v=5';

// A controllable stand-in for the video element: time only advances when the test says so.
function fakeVideo({autoplayRefused=false}={}){
 const listeners={};let src='';
 const v={currentTime:0,readyState:0,paused:true,ended:false,playbackRate:1,networkState:0,muted:false,playsInline:false,preload:'none',loop:true,
  canPlayType:type=>type.includes('avc1')?'probably':'',
  setAttribute(){},getAttribute(name){return name==='src'?src||null:null;},removeAttribute(name){if(name==='src')src='';},
  addEventListener(type,fn){(listeners[type]??=[]).push(fn);},removeEventListener(type,fn){listeners[type]=(listeners[type]||[]).filter(f=>f!==fn);},
  load(){setTimeout(()=>{v.readyState=4;(listeners.loadeddata||[]).forEach(fn=>fn());},0);},
  play(){if(autoplayRefused)return Promise.reject(new Error('NotAllowedError'));v.paused=false;return Promise.resolve();},
  pause(){v.paused=true;},
  advance(ms){if(v.paused)return;v.currentTime+=ms/1000*v.playbackRate;if(v.currentTime*1000>=DEATH_CLIP.durationMs){v.currentTime=DEATH_CLIP.durationMs/1000;v.ended=true;v.paused=true;(listeners.ended||[]).forEach(fn=>fn());}},
 };
 Object.defineProperty(v,'src',{get:()=>src,set:value=>{src=value;}});
 return v;
}
const G={x:267,y:157,w:660,h:396,cw:110,ch:99};
const tick=ms=>new Promise(r=>setTimeout(r,ms));

async function playsOnEveryCellAndCuesThreeHits(){
 const video=fakeVideo(),shots=[];let turbo=false;
 const death=createScatterDeath({G,video,turbo:()=>turbo,onShot:(i,cells)=>shots.push([i,cells.length])});
 assert.equal(video.muted,true);assert.equal(video.playsInline,true);assert.equal(video.loop,false);
 assert.match(video.src||'', /^$/);                      // no decoder until asked
 const cells=[[0,1],[2,3],[5,0]];
 const done=death.play(cells,{isCancelled:()=>false});
 await tick(5);assert.equal(death.active,true);assert.deepEqual(death.cells,cells);
 assert.ok(video.src.endsWith(DEATH_CLIP.mp4),'mp4 chosen when the browser can play H.264');
 for(let t=0;t<DEATH_CLIP.durationMs+100;t+=40){video.advance(40);await tick(17);}
 assert.equal(await done,true);
 assert.deepEqual(shots.map(s=>s[0]),[0,1,2,3],'each of the four impacts cues exactly once, in order');
 assert.deepEqual(DEATH_CLIP.cuesMs,[460,1290,2000,2670],'cues sit on the measured impact frames');
 assert.ok(shots.every(s=>s[1]===3),'every cue carries the confirmed cells');
 assert.equal(death.active,false);assert.equal(death.holding,true,'dead frame holds until the feature clears it');
 assert.equal(video.paused,true);
 // draw hits every confirmed cell and nothing else
 const drawn=[];const ctx={save(){},restore(){},strokeRect(){},drawImage(_src,x,y,w,h){drawn.push([x,y,w,h]);}};
 death.draw(ctx,0);
 assert.deepEqual(drawn,cells.map(([c,r])=>[G.x+c*G.cw,G.y+r*G.ch,G.cw,G.ch]));
 death.clear();assert.equal(death.holding,false);drawn.length=0;death.draw(ctx,0);assert.equal(drawn.length,0,'nothing drawn after clear');
}

async function skipJumpsToTheDeadFrameAndCuesNothingTwice(){
 const video=fakeVideo(),shots=[];
 const death=createScatterDeath({G,video,onShot:i=>shots.push(i)});
 const done=death.play([[1,1],[3,2],[4,0]],{isCancelled:()=>false});
 await tick(5);for(let t=0;t<700;t+=40){video.advance(40);await tick(17);}
 assert.deepEqual(shots,[0],'first hit has fired before the skip');
 assert.equal(death.skip(),true);assert.equal(await done,true);
 assert.ok(video.currentTime*1000>=DEATH_CLIP.durationMs-60,'skip lands on the final frame');
 assert.deepEqual(shots,[0],'skipping does not fire the remaining hits');
 assert.equal(death.skip(),false,'a second press does nothing');
}

async function hiddenTabPausesAndResumes(){
 const video=fakeVideo(),shots=[];
 const death=createScatterDeath({G,video,onShot:i=>shots.push(i)});
 const done=death.play([[2,2]],{isCancelled:()=>false});
 await tick(5);for(let t=0;t<300;t+=40){video.advance(40);await tick(17);}
 death.setPaused(true);assert.equal(video.paused,true);
 const before=video.currentTime;for(let t=0;t<2000;t+=40){video.advance(40);await tick(17);}
 assert.equal(video.currentTime,before,'hidden-tab time does not advance the clip');assert.deepEqual(shots,[]);
 death.setPaused(false);await tick(5);assert.equal(video.paused,false);
 for(let t=0;t<DEATH_CLIP.durationMs+100;t+=40){video.advance(40);await tick(17);}
 assert.equal(await done,true);assert.deepEqual(shots,[0,1,2,3]);
}

async function cancellationAndRefusalNeverBlockTheFeature(){
 let cancelled=false;const video=fakeVideo();
 const death=createScatterDeath({G,video,onShot:()=>{}});
 const done=death.play([[0,0],[1,0],[2,0]],{isCancelled:()=>cancelled});
 await tick(5);cancelled=true;await tick(40);
 assert.equal(await done,true);assert.equal(video.paused,true);
 const refused=createScatterDeath({G,video:fakeVideo({autoplayRefused:true}),onShot:()=>{}});
 assert.equal(await refused.play([[0,0]],{isCancelled:()=>false}),false,'autoplay refusal resolves at once so the feature continues');
 const none=createScatterDeath({G,video:fakeVideo(),onShot:()=>{}});
 assert.equal(await none.play([],{isCancelled:()=>false}),false,'no cells, nothing to play');
 const t=createScatterDeath({G,video:fakeVideo(),turbo:()=>true,onShot:()=>{}});
 const v=t.element;const p=t.play([[0,0]],{isCancelled:()=>false});await tick(5);
 assert.equal(v.playbackRate,TURBO_RATE,'turbo shortens the clip');t.skip();await p;
}

async function hangClipUsesItsOwnCuesAndElement(){
 const videos={blood:fakeVideo(),hang:fakeVideo()},cues=[];
 const death=createScatterDeath({G,videos,onCue:(name,i,cells,total,key)=>cues.push([name,i,total,key,cells.length])});
 const cells=[[0,0],[1,2],[3,1],[5,3]];
 const done=death.play(cells,{key:'hang',isCancelled:()=>false});
 await tick(5);assert.equal(death.key,'hang');assert.equal(videos.hang.src,DEATH_CLIPS.hang.mp4);assert.equal(videos.blood.src,'','the Blood Money element is never touched by a Hang trigger');
 for(let t=0;t<DEATH_CLIPS.hang.durationMs+100;t+=40){videos.hang.advance(40);await tick(17);}
 assert.equal(await done,true);
 assert.deepEqual(cues.map(c=>c[0]),['drop','cinch','dead'],'the noose drop, the cinch and the death fire once each, in order');
 assert.ok(cues.every(c=>c[3]==='hang'&&c[2]===3&&c[4]===4));
 assert.deepEqual(DEATH_CLIPS.hang.cuesMs,[200,620,2150]);
 assert.equal(DEATH_CLIP,DEATH_CLIPS.blood,'existing import still points at the Blood Money clip');
 // a Blood Money play afterwards switches elements cleanly
 const bloodCues=[];const d2=createScatterDeath({G,videos:{blood:fakeVideo(),hang:fakeVideo()},onCue:n=>bloodCues.push(n)});
 const p=d2.play([[2,2],[3,3],[4,0]],{key:'blood',isCancelled:()=>false});await tick(5);assert.equal(d2.key,'blood');d2.skip();await p;
 assert.equal(await d2.play([[1,1]],{key:'nope',isCancelled:()=>false}),false,'an unknown clip key does nothing and never blocks the feature');
}

async function hellClipBurnsFiveOrMore(){
 const videos={blood:fakeVideo(),hang:fakeVideo(),hell:fakeVideo()},cues=[];
 const death=createScatterDeath({G,videos,onCue:(name,i,cells,total,key)=>cues.push([name,key,cells.length])});
 const cells=[[0,0],[1,1],[2,2],[3,3],[4,0],[5,1]];
 const done=death.play(cells,{key:'hell',isCancelled:()=>false});
 await tick(5);assert.equal(death.key,'hell');assert.ok(videos.hell.src.endsWith(DEATH_CLIPS.hell.mp4));
 for(let t=0;t<DEATH_CLIPS.hell.durationMs+100;t+=40){videos.hell.advance(40);await tick(17);}
 assert.equal(await done,true);
 assert.deepEqual(cues,[['ignite','hell',6],['flare','hell',6],['skull','hell',6]],'ignition, flare and skull fire once each on all six cells');
 assert.deepEqual(DEATH_CLIPS.hell.cuesMs,[950,1420,2600]);
}

await hellClipBurnsFiveOrMore();
await hangClipUsesItsOwnCuesAndElement();
await playsOnEveryCellAndCuesThreeHits();
await skipJumpsToTheDeadFrameAndCuesNothingTwice();
await hiddenTabPausesAndResumes();
await cancellationAndRefusalNeverBlockTheFeature();
console.log('PASS: Blood Money, Hang Em High and Hell to Pay clips on every confirmed cell, measured cues (four shots; drop, cinch, dead; ignite, flare, skull), skip, hidden-tab pause, cancel/refusal fallthrough, turbo rate and cleanup.');
