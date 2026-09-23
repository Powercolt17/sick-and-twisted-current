import assert from 'node:assert/strict';
import {createScatterAudio,createScatterPitch} from '../dist/scatter-audio.js';
assert.equal(createScatterPitch(()=>0)(),.95);assert.equal(createScatterPitch(()=>.99)(),1.05);
const sources=[],noop=()=>{},ac={currentTime:10,createBufferSource(){const s={playbackRate:{value:0},connect:noop,disconnect:noop,start(...args){this.started=args;},stop:noop};sources.push(s);return s;},createGain:()=>({gain:{value:1,setValueAtTime:noop,linearRampToValueAtTime:noop,cancelScheduledValues:noop},connect:noop,disconnect:noop})};
const buffers=[{id:'A'},{id:'B'}];let pick=0,muted=false,pitch=0;const fx=createScatterAudio({getAudio:()=>({context:ac,buffers,destination:{}}),isMuted:()=>muted,random:()=>pick++%2?.9:.1,pitch:()=>pitch++%2?1.05:.95});
fx.land(2,2);assert.deepEqual(sources.map(s=>s.buffer.id),['A','B']);assert.deepEqual(sources.map(s=>s.started),[[10,0],[10,0]]);assert.deepEqual(sources.map(s=>s.playbackRate.value),[.95,1.05]);ac.currentTime=10.1;fx.land(3);assert.equal(sources[2].started[0],10.1,'sound follows contact without old artificial delay');muted=true;fx.land(4);assert.equal(sources.length,3);fx.stop();assert.equal(fx.snapshot.active,0);
console.log('PASS: random sample per scatter, exact ±5% pitch, contact synchronization, simultaneous hits, mute and cleanup.');
