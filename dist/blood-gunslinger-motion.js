// One presentation clock for the glance, holster draw, aimed shot and return.
const clamp=v=>Math.max(0,Math.min(1,v));
const smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
export function bloodGunTimeline({raised=false,hold=false}={}){return {shots:[.560],drawDuration:.500,lowerAt:1.02,lowerDuration:.46,restAt:1.48,end:1.56,raised,hold};}
export function bloodGunPose(t,run=bloodGunTimeline()){
 const draw=t<0?(run.raised?1:0):!run.raised&&t<run.drawDuration?clamp(t/run.drawDuration):run.hold||t<run.lowerAt?1:1-smooth((t-run.lowerAt)/run.lowerDuration);
 const age=t-run.shots[0],kick=age<0?0:age<.026?smooth(age/.026):Math.exp(-(age-.026)/.078)*(1-smooth((age-.20)/.14));
 return {draw,kick,frame:Math.round(draw*31),aimWeight:smooth((draw-.35)/.65),phase:t<0?'idle':t<.5?(run.raised?'retarget':'draw'):age<0?'aim':run.hold&&t>=run.lowerAt?'hold':t<run.lowerAt?'recoil':t<run.restAt?'lower':'idle'};
}
