// Shared authoritative rules. Rendering never rolls or awards a multiplier.
export const BLOOD_START_SPINS=8,BLOOD_RETRIGGER_SPINS=2,BLOOD_MAX_LEVEL=2;
export const BLOOD_MULTIPLIERS=Object.freeze([1,2,4,6,8,10]);
export const BLOOD_MULTIPLIER_WEIGHTS=Object.freeze([
 {value:2,weight:695},{value:4,weight:200},{value:6,weight:70},{value:8,weight:25},{value:10,weight:10}
].map(Object.freeze));
function validLevel(level){if(!Number.isInteger(level)||level<0||level>BLOOD_MAX_LEVEL)throw new RangeError('Invalid Blood Money stage');return level;}
// Compatibility for retained catalog tools and older cached presentation modules.
// Live outcome resolution uses bloodMultiplier(state), never this former ladder.
export const bloodBoost=level=>2**validLevel(level);
export function bloodMultiplier(state){const value=state.multiplier??1;if(!BLOOD_MULTIPLIERS.includes(value))throw new RangeError('Invalid Blood Money multiplier');return value;}
export function bloodExtraSpins(fromLevel,toLevel){validLevel(fromLevel);validLevel(toLevel);if(toLevel<fromLevel)throw new RangeError('Blood Money cannot move backwards');return (toLevel-fromLevel)*BLOOD_RETRIGGER_SPINS;}
export function rollBloodMultiplier(current,u){
 bloodMultiplier({multiplier:current});if(!(u>=0&&u<1))throw new RangeError('Multiplier draw must be in [0,1)');
 let ticket=Math.floor(u*1000),rolled=10;for(const entry of BLOOD_MULTIPLIER_WEIGHTS){ticket-=entry.weight;if(ticket<0){rolled=entry.value;break;}}
 const multiplier=Math.max(current,rolled);return {spins:BLOOD_RETRIGGER_SPINS,fromMultiplier:current,rolled,multiplier,increased:multiplier>current};
}
// Claims an already-resolved result once. Replays and skipped presentation cannot reroll it.
export function createBloodRewards(){
 let level=0,multiplier=1;
 return {claim(event){
  if(!event?.upgraded||event.state?.level!==level+1||level===BLOOD_MAX_LEVEL)return null;
  const r=event.reward;
  if(!r||r.fromMultiplier!==multiplier||!BLOOD_MULTIPLIER_WEIGHTS.some(e=>e.value===r.rolled)||r.multiplier!==Math.max(multiplier,r.rolled)||event.state.multiplier!==r.multiplier)throw new Error('Unresolved Blood Money promotion');
  level=event.state.level;multiplier=r.multiplier;return {...r,spins:BLOOD_RETRIGGER_SPINS,level};
 },get level(){return level;},get multiplier(){return multiplier;}};
}
