import {featurePurchaseEntry,presentationRandom} from './feature-entry.js?v=1';

// A confirmed purchase has an entry board, just like the other feature buys.
// Its five scatters announce the purchased feature; they are never evaluated
// as another wager or used to replace the already selected Outlaw result.
export function hellPurchaseEntry(outcome,rng=presentationRandom){
 if(outcome?.mode!=='outlaws'||!Number.isSafeInteger(outcome.pathId))throw Error('A confirmed Hell to Pay purchase is required');
 return featurePurchaseEntry(5,rng);
}
