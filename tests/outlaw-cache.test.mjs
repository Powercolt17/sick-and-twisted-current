import assert from 'node:assert/strict';
import {drawOutlaw,prepareOutlawAssets} from '../dist/outlaw-motion.js';
const allocations=[];
function makeCanvas(width,height){
 const canvas={width,height};
 const ctx=new Proxy({canvas,measureText:s=>({width:s.length*100})},{get:(o,k)=>o[k]??(()=>{})});
 canvas.getContext=()=>ctx;allocations.push(canvas);return canvas;
}
const image={width:484,height:1448},assets=prepareOutlawAssets({art:image,plate:image},makeCanvas);
const target=makeCanvas(484,1448).getContext('2d');
for(let value=1;value<=1000;value++)drawOutlaw(target,assets,2,'idle',{multiplier:value});
const cacheBytes=[...assets.numbers.values()].reduce((total,c)=>total+c.width*c.height*4,0);
assert.ok(cacheBytes<=14*1024*1024,'long sessions must keep multiplier canvases under 14 MiB');
assert.ok(allocations.slice(5,-16).every(c=>c.width===1&&c.height===1),'eviction explicitly releases native backing stores');
const count=allocations.length;drawOutlaw(target,assets,2,'idle',{multiplier:1000});
assert.equal(allocations.length,count,'repeated multiplier reuses its raster');
console.log('PASS: 1,000 multiplier changes stay within the canvas budget and release evicted buffers.');
