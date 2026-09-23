// Reprice the existing seed set for the stage multipliers. Do not search for
// new outcomes, replace any trajectories, or change the terminal-state map.
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {BLOOD_CATALOG} from '../dist/blood-catalog.js';
import {BLOOD_STATES,bloodOutcome,bountyIndex} from '../dist/blood-bounty.js';
import {resolveOutcome} from '../dist/math.js';
const rows=BLOOD_CATALOG.map((group,i)=>group.map(([seed,,next])=>{
 const out=bloodOutcome(seed,BLOOD_STATES[i]);assert.ok(out);
 assert.equal(bountyIndex(out.bloodFinal),next,'preserve seed trajectory');
 const cents=resolveOutcome(out).cents;assert.equal(cents,out.rawCents);
 return [seed,cents,next];
}));
writeFileSync(new URL('../dist/blood-catalog.js',import.meta.url),'// Existing seeds repriced for 1x / 2x / 4x stages; +2-spin advances are modeled in blood-math.js.\nexport const BLOOD_CATALOG='+JSON.stringify(rows)+';\n');
console.log('Repriced '+rows.flat().length+' existing paths; all terminal states retained.');
