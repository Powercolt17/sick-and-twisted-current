// One purchase, one cap, idempotent credits across every tumble and free spin.
// Presentation only receives already-resolved step awards; it cannot invent one.
export function createRoundLedger(stakeCents,capCents){
 if(!Number.isSafeInteger(stakeCents)||stakeCents<0||!Number.isSafeInteger(capCents)||capCents<=0)throw new Error('Invalid round cents');
 let returned=0;const posted=new Map();
 return {stakeCents,capCents,
  credit(id,amount){if(!Number.isSafeInteger(amount)||amount<0)throw new Error('Invalid award cents');if(posted.has(id)){if(posted.get(id).requested!==amount)throw new Error('Conflicting duplicate credit');return 0;}
   const accepted=Math.min(amount,capCents-returned);posted.set(id,{requested:amount,accepted});returned+=accepted;return accepted;},
  get returnedCents(){return returned},get remainingCents(){return capCents-returned},get netCents(){return returned-stakeCents},get entries(){return [...posted].map(([id,p])=>({id,...p}))}
 };
}
