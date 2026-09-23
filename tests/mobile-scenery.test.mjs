import assert from 'node:assert/strict';
import {drawMobileScenery} from '../dist/mobile-scenery.js';
let clock=0,videoReads=0,presents=0,detailReads=0;
Object.defineProperty(globalThis,'performance',{value:{now:()=>clock},configurable:true});
class Context {
 constructor(screen=false){this.screen=screen;this.globalAlpha=1;this.stack=[];}
 getTransform(){return {a:.75};}setTransform(){}clearRect(){}beginPath(){}rect(){}clip(){}
 save(){this.stack.push(this.globalAlpha);}restore(){this.globalAlpha=this.stack.pop();}
 drawImage(source){if(source.videoWidth)videoReads++;if(source.detailPlate)detailReads++;if(this.screen)presents++;}
}
globalThis.document={createElement:()=>({width:300,height:150,getContext:()=>new Context()})};
const screen=new Context(true),video={videoWidth:960,videoHeight:540,currentTime:0};
const bounds={x:150,y:-500,w:900,h:1600};
for(let i=0;i<120;i++){clock=i*1000/60;video.currentTime=Math.floor(clock*24/1000)/24;drawMobileScenery(screen,video,bounds);}
assert.equal(presents,120,'reel RAF retains its full presentation rate');
assert.ok(videoReads<=49,`video should be read at most 24 times per second, got ${videoReads}`);
const animatedReads=videoReads;
clock+=100;drawMobileScenery(screen,video,bounds);const pausedReads=videoReads;
for(let i=0;i<60;i++){clock+=1000/60;drawMobileScenery(screen,video,bounds);}
assert.equal(videoReads,pausedReads,'paused video never reuploads a frame');
clock+=100;drawMobileScenery(screen,video,{...bounds,h:1700});
assert.equal(videoReads,pausedReads+1,'resizing invalidates the composition once');
screen.globalAlpha=.35;drawMobileScenery(screen,video,{...bounds,h:1700});assert.equal(screen.globalAlpha,.35,'feature crossfades preserve caller opacity');
console.log(`120 game frames: ${animatedReads} video transfers instead of 3120. Paused frames reused; resize and alpha preserved.`);

const plate={naturalWidth:1920,naturalHeight:1080,detailPlate:true};
clock+=100;const beforeDetail=videoReads;
drawMobileScenery(screen,video,bounds,plate);
assert.equal(detailReads,1,'ground samples the original high-resolution plate directly');
assert.equal(videoReads,beforeDetail+1,'detail adds no extra video transfer');
clock+=100;drawMobileScenery(screen,video,bounds,plate);
assert.equal(detailReads,1,'static detail remains cached with a paused video');
