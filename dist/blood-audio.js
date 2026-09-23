export const BLOOD_AUDIO_CUES=Object.freeze([['cock',.04,.30,-.5,.20],['cock',.16,.34,0,.20],['cock',.28,.38,.5,.23],['rip',.28,.48,0,.40],['stamp',.70,.85,0,.62],['feature',.70,.48,0,6]]);
let cached;
export async function loadBloodAudio(context){
 if(cached?.context===context)return cached;
 const files={cock:'assets/sfx/shootout-cock.wav',rip:'assets/sfx/wild-rip.wav',shot:'assets/sfx/revolver-shot.wav?v=42',feature:'assets/sfx/feature-whistle.mp3',stamp:'assets/sfx/wild-stamp.wav'};
 const pairs=await Promise.all(Object.entries(files).map(async([key,path])=>{const r=await fetch(path);if(!r.ok)throw Error('Blood Money sound unavailable: '+path);return [key,await context.decodeAudioData(await r.arrayBuffer())];}));
 return cached={context,...Object.fromEntries(pairs)};
}
export function scheduleBloodAudio(context,destination,{offset=0,muted=false,buffers}){
 const mix=context.createGain(),sources=new Set();mix.gain.value=muted?0:.83;mix.connect(destination);
 const cues=BLOOD_AUDIO_CUES;
 for(const [key,at,level,pan,max] of cues){
  const buffer=buffers?.[key];if(!buffer)continue;const duration=Math.min(buffer.duration,max),seek=Math.max(0,offset-at);if(seek>=duration)continue;
  const source=context.createBufferSource(),gain=context.createGain(),stereo=context.createStereoPanner();source.buffer=buffer;gain.gain.value=level;stereo.pan.value=pan;
  source.connect(gain);gain.connect(stereo);stereo.connect(mix);sources.add(source);
  const start=context.currentTime+Math.max(0,at-offset),left=duration-seek;
  gain.gain.setValueAtTime(level,start);gain.gain.setValueAtTime(level,start+Math.max(0,left-.06));gain.gain.linearRampToValueAtTime(0,start+left);
  source.onended=()=>{sources.delete(source);source.disconnect();gain.disconnect();stereo.disconnect();};source.start(start,seek,left);
 }
 let stopped=false;
 return {get pending(){return sources.size;},mute(v){if(!stopped)mix.gain.setTargetAtTime(v?0:.83,context.currentTime,.008);},stop(){if(stopped)return;stopped=true;mix.gain.setValueAtTime(0,context.currentTime);for(const s of [...sources]){try{s.stop();}catch{}}sources.clear();mix.disconnect();}};
}
