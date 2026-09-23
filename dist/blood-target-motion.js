export const BLOOD_TARGET_TIME={fire:560,impact:655,fast:650,slow:1550,catch:340,reward:3320,end:5150};
export const clamp=v=>Math.max(0,Math.min(1,v));
const smooth=t=>{t=clamp(t);return t*t*(3-2*t);};
function hermite(p0,p1,m0,m1,u){return (2*u**3-3*u*u+1)*p0+(u**3-2*u*u+u)*m0+(-2*u**3+3*u*u)*p1+(u**3-u*u)*m1;}
export function bloodTargetFrame(age,reduced=false){
 const t=age-BLOOD_TARGET_TIME.impact;let angle=0;
 if(t>=0&&t<BLOOD_TARGET_TIME.fast)angle=hermite(0,810,1850*BLOOD_TARGET_TIME.fast/1000,690*BLOOD_TARGET_TIME.fast/1000,t/BLOOD_TARGET_TIME.fast);
 else if(t>=BLOOD_TARGET_TIME.fast){const u=clamp((t-BLOOD_TARGET_TIME.fast)/BLOOD_TARGET_TIME.slow);angle=810+270*(1-(1-u)**3.7);}
 const catchAt=BLOOD_TARGET_TIME.fast+BLOOD_TARGET_TIME.slow,after=t-catchAt;
 if(after>=0&&after<BLOOD_TARGET_TIME.catch)angle=1080+5.6*Math.sin(after/46)*Math.exp(-after/105)*(1-smooth((after-220)/120));
 if(after>=BLOOD_TARGET_TIME.catch)angle=1080;
 const velocity=t<0||after>=0?0:t<BLOOD_TARGET_TIME.fast?(hermite(0,810,1202.5,448.5,clamp((t+1)/BLOOD_TARGET_TIME.fast))-angle):270*3.7/BLOOD_TARGET_TIME.slow*(1-clamp((t-BLOOD_TARGET_TIME.fast)/BLOOD_TARGET_TIME.slow))**2.7;
 const land=age>=BLOOD_TARGET_TIME.impact+catchAt+BLOOD_TARGET_TIME.catch;
 return {age,t,reduced,angle:reduced?0:angle,fire:age>=BLOOD_TARGET_TIME.fire,hit:t>=0,
  // The new value is fitted on the hidden face only during the FINAL revolution.
  reveal:reduced?t>=0:angle>=810,
  impact:reduced||t<0?0:Math.exp(-t/65),recoil:reduced||t<0?0:Math.sin(t*.06)*Math.exp(-t/110)*4,
  blur:reduced?0:clamp((velocity-.48)/1.1)*1.15,velocity,land,
  latch:reduced?0:after>=0?Math.exp(-after/90):0,
  reward:reduced? smooth((age-BLOOD_TARGET_TIME.reward)/220)*(1-smooth((age-4800)/350)):smooth((age-BLOOD_TARGET_TIME.reward)/180)*(1-smooth((age-4800)/350)),
  rewardScale:reduced?1:1+.17*(1-smooth((age-BLOOD_TARGET_TIME.reward)/330)),
  done:age>=BLOOD_TARGET_TIME.end};
}
