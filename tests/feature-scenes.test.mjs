import assert from 'node:assert/strict';
import {createFeatureScenes} from '../dist/feature-scenes.js';
const videos=[];
const context=new Proxy({createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]??(()=>{})});
class Element extends EventTarget{
 constructor(tag){super();this.tag=tag;this.attrs=new Map();this.children=[];this.hidden=false;this.width=1212;this.height=608;}
 setAttribute(k,v){this.attrs.set(k,String(v));}getAttribute(k){return this.attrs.get(k)??null;}removeAttribute(k){this.attrs.delete(k);}
 append(...els){this.children.push(...els);}querySelector(){return new Element('div');}getContext(){return context;}focus(){}
}
class Video extends Element{
 constructor(){super('video');this.paused=true;this.readyState=0;this.networkState=0;this.currentTime=0;this.duration=10;this.loads=0;videos.push(this);}
 set src(v){this.setAttribute('src',v);}get src(){return this.getAttribute('src');}
 load(){this.loads++;if(!this.src)this.readyState=0;}
 play(){this.paused=false;return Promise.resolve();}pause(){this.paused=true;}
 loaded(){this.readyState=2;this.dispatchEvent(new Event('loadeddata'));}
}
globalThis.document=Object.assign(new EventTarget(),{hidden:false,createElement:tag=>tag==='video'?new Video():new Element(tag)});
globalThis.window=new EventTarget();
globalThis.Image=class{constructor(){this.complete=true;this.naturalWidth=1920;this.naturalHeight=1080;}decode(){return Promise.resolve();}};
let time=0;const scenes=createFeatureScenes({canvas:new Element('canvas'),stage:new Element('div'),isMuted:()=>true,getView:()=>({x:0,y:0,w:1212,h:748}),onMix(){},onMusic(){},now:()=>time});
const hang=scenes.intro('hang'),cells=[[0,0],[1,1],[2,2],[3,3]],options={cells,awardedSpins:12};
const flush=async()=>{for(let i=0;i<12;i++)await Promise.resolve();};
const find=kind=>videos.find(v=>v.src?.includes('hang-em-high-'+kind));
const pending=hang.preload();assert.equal(videos.filter(v=>v.src).length,1,'preload opens intro only');
const film=find('intro'),run=hang.play(options);film.loaded();await pending;await flush();assert.equal(scenes.state.phase,'film');
assert.equal(hang.state.awardedSpins,12);
time=4000;film.currentTime=4;scenes.tick(time);
time=12001;scenes.tick(time);assert.equal(scenes.state.phase,'reveal','stalled decoder automatically hands off');
time+=651;scenes.tick(time);assert.equal(await run,true);assert.equal(film.src,null,'finished intro releases decoder');
scenes.leave();time+=651;scenes.tick(time);assert.equal(videos.filter(v=>v.src).length,0,'leaving releases feature background');

const early=hang.play(options);assert.equal(scenes.state.phase,'loading');assert.equal(hang.continue(),true,'slow loading never traps Continue');assert.equal(hang.continue(),false,'double Continue is ignored');
time+=651;scenes.tick(time);assert.equal(await early,true,'skip resolves a pending load without waiting for timeout');
scenes.clear();assert.equal(videos.filter(v=>v.src).length,0);

const resumed=hang.play(options);const second=find('intro');second.loaded();await flush();assert.equal(scenes.state.phase,'film');
hang.setPaused(true);time+=30000;scenes.tick(time);assert.equal(scenes.state.phase,'film');hang.setPaused(false);await flush();scenes.tick(time);assert.equal(scenes.state.phase,'film','hidden-tab time cannot trigger stall recovery');
hang.continue();time+=651;scenes.tick(time);assert.equal(await resumed,true);scenes.clear();

const failed=hang.play(options);find('intro').dispatchEvent(new Event('error'));await flush();assert.equal(scenes.state.phase,'reveal');time+=651;scenes.tick(time);assert.equal(await failed,true,'missing movie preserves the confirmed award');scenes.clear();
const cancelled=hang.play(options);hang.cancel();assert.equal(await cancelled,false);scenes.clear();
console.log('PASS: feature preload budget, stalled-film recovery, slow-load Continue, duplicate Continue, pause/resume, failed movie, cancellation and full decoder cleanup.');

const shortened=hang.play(options);const timed=find('intro');timed.loaded();await flush();
time+=3500;timed.currentTime=3.5;scenes.tick(time);assert.ok(find('background'),'background preload moves with shortened intro');find('background').loaded();await flush();
time+=2990;timed.currentTime=6.49;scenes.tick(time);assert.equal(scenes.state.phase,'film');
hang.setPaused(true);time+=30000;scenes.tick(time);assert.equal(scenes.state.phase,'film');hang.setPaused(false);await flush();
time+=10;timed.currentTime=6.5;scenes.tick(time);assert.equal(scenes.state.phase,'reveal');
time+=651;scenes.tick(time);assert.equal(await shortened,true);assert.equal(hang.state.active,false);scenes.clear();
console.log('PASS: Hang title hold ends at 6.5 seconds; background preload, pause and 650ms handoff preserved.');

 // Rendering and automatic handoff must use the same shortened film clock.
 const trace=[],stack=[];
 const paint=new Proxy({globalAlpha:1,save(){stack.push(this.globalAlpha);},restore(){this.globalAlpha=stack.pop();},drawImage(source,...rect){trace.push({source,alpha:this.globalAlpha,rect});}},{get:(o,k)=>o[k]??(()=>{})});
 const visual=hang.play(options),clip=find('intro');clip.loaded();await flush();
 clip.currentTime=3;scenes.drawIntro(paint);
 assert.equal(trace.length,1,'title renders once, without a competing background composition');
 assert.equal(trace[0].source,clip);
 trace.length=0;clip.currentTime=6.1;scenes.drawIntro(paint);
 const fading=trace.find(x=>x.source===clip);
 assert.ok(Math.abs(fading.alpha-.5)<.00001,'Hang title is halfway dissolved at 6.1s');
 assert.ok(trace.some(x=>x.source!==clip&&Math.abs(x.alpha-.5)<.00001),'feature background shares that dissolve');
 hang.cancel();assert.equal(await visual,false);scenes.clear();
 console.log('PASS: intro composition and shortened-film dissolve regression.');

// The showdown must not jump sideways when its still becomes the loop or during reveal.
const blood=scenes.intro('blood'),bloodRun=blood.play({cells:cells.slice(0,3),awardedSpins:8});
const bloodFilm=videos.find(v=>v.src?.includes('blood-money-intro'));bloodFilm.loaded();await flush();
const before=scenes.backgroundRect;assert.ok(Math.abs(before.x-(1212-before.w)/2)<1e-7,'Blood Money is centered');
bloodFilm.currentTime=7.5;scenes.tick(time);
const bloodLoop=videos.find(v=>v.src?.includes('blood-money-background'));
assert.ok(bloodLoop.src.endsWith('?v=showdown1'),'new media bypasses the previous background cache');
bloodLoop.loaded();await flush();assert.deepEqual(scenes.backgroundRect,before,'video and still use the same placement');
blood.setPaused(true);assert.equal(bloodLoop.paused,true);blood.setPaused(false);await flush();
blood.continue();time+=651;scenes.tick(time);assert.equal(await bloodRun,true);
scenes.clear();assert.equal(bloodLoop.src,null,'new loop releases on exit');
console.log('PASS: centered showdown poster/video continuity, cache version, pause and release.');
