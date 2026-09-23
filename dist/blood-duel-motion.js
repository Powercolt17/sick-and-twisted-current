// Presentation clock only; never changes bounty outcomes or payout timing.
export const DUEL_TIMING=Object.freeze({travel:65,killTravel:85,killAccent:240,killRate:.68,settleHold:500,bodyHold:1250,fade:360,enter:420});
export function planDuelShot(clip,run,kill=false,reduced=false){
 const first=clip.ts[clip.start||0],impact=Math.max(first,clip.impact??first);
 const lead=impact-first,travel=reduced?0:kill?DUEL_TIMING.killTravel:DUEL_TIMING.travel;
 const fire=run.shots[0]*1000,gunDelay=reduced?0:Math.max(0,lead-fire-travel);
 const land=gunDelay+fire+travel;
 return {gunDelay,fire:gunDelay+fire,land,clipStart:land-lead,impact,first,travel};
}
export function duelClipTime(age,plan,kill=false,reduced=false){
 const t=Math.max(0,age-plan.clipStart);
 if(!kill||reduced||age<=plan.land)return plan.first+t;
 const post=age-plan.land,k=DUEL_TIMING;
 // Only the moving reaction receives the accent. No frozen pre-impact pose.
 return plan.impact+Math.min(post,k.killAccent)*k.killRate+Math.max(0,post-k.killAccent);
}
export function duelFrame(clip,time){
 const ts=clip.ts;if(time>=ts.at(-1))return null;
 let lo=clip.start||0,hi=ts.length-1;
 while(lo+1<hi){const mid=(lo+hi)>>1;if(ts[mid]<=time)lo=mid;else hi=mid;}
 return {i:lo,f:Math.max(0,Math.min(1,(time-ts[lo])/Math.max(1,ts[lo+1]-ts[lo])))};
}
