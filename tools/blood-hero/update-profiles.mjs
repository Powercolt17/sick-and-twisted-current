// Re-evaluate existing seeds only. This does not generate a new outcome catalog.
import fs from 'node:fs';
import {BLOOD_CATALOG} from '../../dist/blood-catalog.js';
import {BLOOD_STATES,bloodOutcome,bountyIndex} from '../../dist/blood-bounty.js';
import {evaluate,wildTotal} from '../../dist/math.js';
const profiles=BLOOD_CATALOG.map((rows,i)=>rows.map(([seed,,next])=>{
 const out=bloodOutcome(seed,{...BLOOD_STATES[i],multiplier:1},()=>.2);
 if(!out||bountyIndex(out.bloodFinal)!==next)throw Error('Catalog topology changed');
 const base=[0,0,0];for(const s of out.steps)base[s.bloodBefore.level]+=evaluate(s.grid,s.wilds,1,wildTotal(s.wilds),{winBoost:1,maxEligible:false}).exactTenths;
 return base;
}));
fs.writeFileSync(new URL('../../dist/blood-profiles.js',import.meta.url),'// Base-bet tenths of cents by bounty stage, in the unchanged BLOOD_CATALOG seed order.\n// Derived from actual paytable evaluation, before any feature multiplier.\nexport const BLOOD_PROFILES='+JSON.stringify(profiles)+';\n');
console.log('Updated paytable profiles for the unchanged 12,600 seeds.');
