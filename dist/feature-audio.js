// Clean authored effects: generated PCM only. No recording, stream, movie,
// speech, backing track or media element can enter this audio path.
let bank;
export function createFeatureBuffers(context){
 if(bank?.context===context)return bank;
 const rate=context.sampleRate||48000,make=seconds=>context.createBuffer(1,Math.ceil(seconds*rate),rate);
 const burn=make(3.15),bell=make(5.4),hit=make(.4);let seed=713057,low=0;
 const noise=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2147483648-1;};
 const b=burn.getChannelData(0);
 for(let i=0;i<b.length;i++){const t=i/rate,n=noise();low=low*.94+n*.06;const env=Math.min(1,t/.1)*Math.min(1,(3.15-t)/.5),sw=.35+.65*Math.sin(Math.min(1,t/2.4)*Math.PI/2);b[i]=(low*.8+n*.085+(Math.abs(n)>.998?n*.28:0))*env*sw;}
 const h=hit.getChannelData(0);for(let i=0;i<h.length;i++){const t=i/rate;h[i]=.45*Math.sin(2*Math.PI*(90*t-50*t*t))*Math.exp(-t*16)+noise()*.1*Math.exp(-t*85);}
 const p=bell.getChannelData(0),partials=[[1,.40,3.4],[2,.18,2.8],[2.40,.14,2.2],[3.01,.10,1.7],[4.17,.07,1.1],[5.43,.035,.7]];
 for(let i=0;i<p.length;i++){const t=i/rate,attack=Math.min(1,t/.0035);let n=0;for(const [ratio,gain,decay] of partials)n+=Math.sin(2*Math.PI*246.94*ratio*t)*gain*Math.exp(-t/decay);p[i]=(n+noise()*.075*Math.exp(-t*125))*attack*Math.min(1,(5.4-t)/.15)*.62;}
 bank={context,burn,bell,hit};return bank;
}
export function scheduleFeatureAudio(context,destination,{offset=0,muted=false,count=3,cardAt=3.5966666667}={}){
 const buffers=createFeatureBuffers(context),gain=context.createGain(),nodes=new Set(),start=context.currentTime;gain.gain.value=muted?0:1;gain.connect(destination);
 function play(buffer,at,level,pan=0){
  if(offset>=at+buffer.duration)return;
  const source=context.createBufferSource(),volume=context.createGain(),position=context.createStereoPanner();source.buffer=buffer;volume.gain.value=level;position.pan.value=pan;
  source.connect(volume);volume.connect(position);position.connect(gain);nodes.add(source);
  source.onended=()=>{nodes.delete(source);source.disconnect();volume.disconnect();position.disconnect();};source.start(start+Math.max(0,at-offset),Math.max(0,offset-at));
 }
 play(buffers.burn,.15,.75);
 for(let i=0;i<count;i++)play(buffers.hit,.92+i*.085,.45/Math.sqrt(count),-.6+1.2*i/Math.max(1,count-1));
 play(buffers.bell,cardAt,.72);
 let stopped=false;return {get pending(){return nodes.size;},mute(v){if(!stopped)gain.gain.setTargetAtTime(v?0:1,context.currentTime,.008);},stop(){if(stopped)return;stopped=true;gain.gain.cancelScheduledValues(context.currentTime);gain.gain.setValueAtTime(0,context.currentTime);for(const n of [...nodes]){try{n.stop();}catch{}}nodes.clear();gain.disconnect();}};
}
