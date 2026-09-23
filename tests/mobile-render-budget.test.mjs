import assert from 'node:assert/strict';
import {createMobileRenderBudget} from '../dist/mobile-render-budget.js';
const steady=createMobileRenderBudget();for(let i=0;i<300;i++)steady.sample(8,true);assert.equal(steady.quality,1);assert.equal(steady.motion,true);
const slow=createMobileRenderBudget();for(let i=0;i<100;i++)slow.sample(40,true);assert.equal(slow.quality,.6);assert.equal(slow.motion,false);
const desktop=createMobileRenderBudget();for(let i=0;i<300;i++)desktop.sample(40,false);assert.equal(desktop.quality,1);assert.equal(desktop.motion,true);
console.log('Presentation adapts to sustained render cost; healthy mobile and desktop retain full quality.');
