const clamp=x=>Math.max(0,Math.min(1,x));
export const HANG_REVEAL=560;
export function hangMotion(age,type='upgrade',reduced=false){
 if(reduced||age<0||age>1800)return {pull:0,swing:0,numberScale:1,impact:0};
 const catchAt=type==='upgrade'?HANG_REVEAL:160;
 const after=(age-catchAt)/1000;
 const wind=type==='upgrade'&&age<catchAt?-52*Math.pow(Math.sin(Math.PI*clamp(age/catchAt)),2):0;
 return {pull:wind+(after>=0?39*Math.exp(-7*after)*Math.sin(after*22):0),
  swing:after>=0?.045*Math.exp(-3*after)*Math.sin(after*10):0,
  numberScale:1+(after>=0?.29*Math.exp(-8*after)*Math.sin(Math.min(1,after/.13)*Math.PI/2):0),
  impact:after>=0?Math.max(0,1-after/.35):0};
}
