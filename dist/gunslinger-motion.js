// Presentation seconds. Both screen and cell shots use this exact motion clock.
export const GUNSLINGER = Object.freeze({
  draw: .310, aim: .100, cadence: .400,
  kick: .065, recovery: .220, finalRecovery: .250,
  finalHold: .150, lower: .310, settle: .080, flash: .040,
  impact: .012, reveal: .085,
});
const clamp = v => Math.max(0, Math.min(1, v));
const ease = v => { v = clamp(v); return clamp(v*v*v*(10+v*(-15+6*v))); };
export function gunslingerTimeline(targets) {
  const T=GUNSLINGER,shots=targets.map((_,i)=>+(T.draw+T.aim+i*T.cadence).toFixed(6));
  const last=shots.at(-1)??0, lowerAt=last+T.kick+T.finalRecovery+T.finalHold;
  return {targets:targets.map(p=>[...p]),shots,drawDuration:T.draw,
    recoilDuration:T.kick+T.recovery,finalRecoilDuration:T.kick+T.finalRecovery,
    lowerAt,lowerDelay:lowerAt-last,lowerDuration:T.lower,
    restAt:lowerAt+T.lower,end:lowerAt+T.lower+T.settle,
    impactDelay:T.impact,revealDelay:T.reveal};
}
export function gunslingerPose(t,run) {
  if(!run)return {phase:'idle',draw:0,kick:0,cloth:0,idle:1};
  const T=GUNSLINGER,drawEnd=run.drawDuration??T.draw,last=run.shots.at(-1)??0;
  const lowerAt=run.lowerAt??last+(run.lowerDelay??T.kick+T.finalRecovery+T.finalHold);
  const lower=run.lowerDuration??T.lower,restAt=lowerAt+lower;
  let phase=t<drawEnd?'draw':t<lowerAt?'aim':t<restAt?'lower':t<restAt+T.settle?'settle':'idle';
  const draw=t<drawEnd?clamp(t/drawEnd):t<lowerAt?1:1-clamp((t-lowerAt)/lower);
  let kick=0,cloth=0;
  // Lagged cloth impulses are evaluated from the same events, never timers.
  const follow=(age,size)=>age>0&&age<.42?size*Math.sin(Math.PI*clamp(age/.42))*Math.exp(-age*5):0;
  cloth+=follow(t-.08,2.1)-follow(t-lowerAt-.065,2.0);
  for(let i=0;i<run.shots.length;i++){
    const age=t-run.shots[i],attack=run.recoilAttack??T.kick,hold=run.recoilHold??0,recovery=run.recoilRecovery??(i===run.shots.length-1?T.finalRecovery:T.recovery);
    if(age>=0&&age<attack+hold+recovery){
      kick=age<attack?ease(age/attack):age<attack+hold?1:1-ease((age-attack-hold)/recovery);
      phase=age<attack+hold?'recoil':'recover';
    }
    cloth+=follow(age-.025,3.1*(run.recoilWeight??1));
  }
  if(t>restAt)cloth*=1-ease((t-restAt)/T.settle);
  return {phase,draw,kick,cloth,idle:t<.045?1-ease(t/.045):t>restAt-.045?ease((t-restAt+.045)/.045):0};
}
