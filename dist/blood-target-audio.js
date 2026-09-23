// One struck-steel voice at bullet contact, through the game's muted/limited bus.
// Inharmonic resonances and a short noisy attack keep this a range-target ding.
export function playTargetDing(context,destination){
 const at=context.currentTime,out=context.createStereoPanner();out.pan.value=.38;out.connect(destination);
 const partials=[[820,.24,1.4],[1371,.14,1.06],[2248,.10,.74],[3573,.052,.36],[4891,.018,.17]];
 let pending=partials.length+1;const finished=()=>{if(--pending===0)out.disconnect();};
 for(const [hz,level,decay]of partials){
  const voice=context.createOscillator(),gain=context.createGain();voice.type='sine';
  voice.frequency.setValueAtTime(hz*1.018,at);voice.frequency.exponentialRampToValueAtTime(hz,at+.032);
  gain.gain.setValueAtTime(.0001,at);gain.gain.linearRampToValueAtTime(level,at+.002);gain.gain.exponentialRampToValueAtTime(.0001,at+decay);
  voice.connect(gain);gain.connect(out);voice.start(at);voice.stop(at+decay+.015);voice.onended=()=>{voice.disconnect();gain.disconnect();finished();};
 }
 const buffer=context.createBuffer(1,Math.ceil(context.sampleRate*.035),context.sampleRate),data=buffer.getChannelData(0);let seed=197;
 for(let i=0;i<data.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;data[i]=(seed/2147483648-1)*Math.exp(-i/(context.sampleRate*.006));}
 const strike=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();strike.buffer=buffer;filter.type='highpass';filter.frequency.value=2300;gain.gain.value=.18;
 strike.connect(filter);filter.connect(gain);gain.connect(out);strike.start(at);strike.onended=()=>{strike.disconnect();filter.disconnect();gain.disconnect();finished();};
 return {at,end:at+1.415,voices:partials.length+1};
}
