import {writeFileSync} from 'node:fs';
import {hangFeature} from '../dist/hang-kernel.js';
const rows=[];let seed=1;
while(rows.length<12000){const f=hangFeature(seed++);if(f)rows.push([f.seed,f.cents,f.locks,f.upgrades,f.first,f.retriggers,f.tumbleEvents,f.spins.length]);}
writeFileSync(new URL('../dist/hang-catalog.js',import.meta.url),'// Fixed, reproducible complete-feature trajectories. tools/bake-hang.mjs\nexport const HANG_CATALOG='+JSON.stringify(rows)+';\n');
console.log({paths:rows.length,seeds:seed-1,min:Math.min(...rows.map(r=>r[1]))/100,mean:rows.reduce((n,r)=>n+r[1],0)/rows.length/100,max:Math.max(...rows.map(r=>r[1]))/100,locks:[0,1,2,3].map(k=>rows.filter(r=>r[2]===k).length)});
