// Presentation clock only; never changes bounty outcomes or payout timing.
export const DUEL_TIMING=Object.freeze({travel:65,killTravel:85,killAccent:100,killRate:1,settleHold:260,bodyHold:850,fade:300,enter:480});
export function planDuelShot(clip,run,kill=false,reduced=false){
 const first=clip.ts[clip.start||0],impact=Math.max(first,clip.impact??first);
 const lead=impact-first,travel=reduced?0:kill?DUEL_TIMING.killTravel:DUEL_TIMING.travel;
 const fire=run.shots[0]*1000,gunDelay=reduced?0:Math.max(0,lead-fire-travel);
 const land=gunDelay+fire+travel;
 return {gunDelay,fire:gunDelay+fire,land,clipStart:land-lead,impact,first,travel,ground:clip.ground??clip.ts.at(-1)};
}
export function duelClipTime(age,plan,kill=false,reduced=false){
 const t=Math.max(0,age-plan.clipStart);
 if(!kill||reduced||age<=plan.land)return plan.first+t;
 const post=age-plan.land,fall=Math.max(1,plan.ground-plan.impact);
 // Gravity gathers speed through the existing knee buckle and fall. The impact
 // pose stays synchronized to the bullet; the grounded tail slows naturally.
 const acceleration=.00048,groundAge=(Math.sqrt(1+4*acceleration*fall)-1)/(2*acceleration);
 return post<groundAge?plan.impact+post+acceleration*post*post:plan.ground+(post-groundAge)*.88;
}
export function duelFrame(clip,time){
 const ts=clip.ts;if(time>=ts.at(-1))return null;
 let lo=clip.start||0,hi=ts.length-1;
 while(lo+1<hi){const mid=(lo+hi)>>1;if(ts[mid]<=time)lo=mid;else hi=mid;}
 return {i:lo,f:Math.max(0,Math.min(1,(time-ts[lo])/Math.max(1,ts[lo+1]-ts[lo])))};
}
