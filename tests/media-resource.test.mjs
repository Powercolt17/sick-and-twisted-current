import assert from 'node:assert/strict';
import {createVideoResource,drawMediaFrame} from '../dist/media-resource.js';
class Video extends EventTarget{
 constructor(){super();this.attrs=new Map();this.readyState=0;this.networkState=0;this.paused=true;this.loads=0;this.plays=0;}
 getAttribute(k){return this.attrs.get(k)??null;}removeAttribute(k){this.attrs.delete(k);}
 set src(v){this.attrs.set('src',v);}load(){this.loads++;if(!this.getAttribute('src')){this.readyState=0;this.networkState=0;}}
 play(){this.plays++;this.paused=false;return this.nextPlay?.()??Promise.resolve();}pause(){this.paused=true;}
}
const v=new Video(),r=createVideoResource(v,'intro.mp4');
assert.equal(r.attached,false);
const first=r.load();assert.equal(r.load(),first,'parallel preloads share one load');
assert.equal(v.loads,1);v.readyState=2;v.dispatchEvent(new Event('loadeddata'));assert.equal(await first,true);
await r.play();assert.equal(v.plays,1);r.release();assert.equal(r.attached,false);assert.equal(v.paused,true);assert.equal(v.readyState,0);
const cancelled=r.load();r.release();assert.equal(await cancelled,false,'release resolves pending preload');
const retry=r.load();v.readyState=2;v.dispatchEvent(new Event('canplay'));assert.equal(await retry,true,'resource is reusable');
let t=0;const bad=new Video();bad.nextPlay=()=>Promise.reject(Error('autoplay denied'));
const br=createVideoResource(bad,'bad.mp4',{now:()=>t});
assert.equal(await br.play(),false);assert.equal(await br.play(),false);assert.equal(bad.plays,1,'failed play cannot spin every frame');t=1001;await br.play();assert.equal(bad.plays,2);
const stalled=new Video(),sr=createVideoResource(stalled,'slow.mp4',{timeout:5});
assert.equal(await sr.load(),false,'loading is bounded');sr.release();
const deferred=new Video(),dr=createVideoResource(deferred,'deferred.mp4');const old=dr.play();dr.release();await old;assert.equal(deferred.plays,0,'released queued playback cannot restart decoder');
assert.equal(drawMediaFrame({drawImage(){throw new DOMException('frame discarded','InvalidStateError');}},{}),false);
assert.throws(()=>drawMediaFrame({drawImage(){throw new TypeError('bad arguments');}},{}),TypeError,'programming errors stay visible');
r.release();br.release();
console.log('PASS: media lazy load, deduplication, decoder release, cancelled load, reload, bounded failure, playback race and discarded-frame recovery.');
