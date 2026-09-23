// Full-length recordings; the supplied Hang theme is encoded at 192 kbps for delivery.
// Measured: main -14.49 LUFS; Blood Money -11.34 LUFS, requiring -3.15 dB trim.
export const MUSIC_TRACKS=Object.freeze({
 main:{path:'assets/music/last-stand-at-dusk.flac',gain:1},
 blood:{path:'assets/music/blood-money.flac',gain:10**(-3.15/20)},
 hang:{path:'assets/music/desolate-trails.mp3',gain:1}
});

export function createThemeMusic({getAudio,isMuted=()=>false,fetchAudio=async path=>{
 const response=await fetch(path);if(!response.ok)throw Error('Theme '+response.status);return response.arrayBuffer();
}}){
 const cache=new Map();let selected='main',enabled=false,generation=0,voice=null;
 function record(track){if(!MUSIC_TRACKS[track])throw Error('Unknown theme');if(!cache.has(track))cache.set(track,{buffer:null,loading:null,failed:false});return cache.get(track);}
 async function load(track=selected){
  const item=record(track),api=getAudio();if(item.buffer)return item.buffer;if(!api?.context||api.context.state==='closed')return null;
  if(!item.loading)item.loading=(async()=>{
   try{item.buffer=await api.context.decodeAudioData(await fetchAudio(MUSIC_TRACKS[track].path));item.failed=false;return item.buffer;}
   catch(error){item.failed=true;console.warn('Theme unavailable:',error);return null;}
   finally{item.loading=null;}
  })();
  return item.loading;
 }
 function fadeOut(old){
  if(!old)return;const t=old.context.currentTime,g=old.gain.gain;
  g.cancelScheduledValues(t);g.setValueAtTime(Math.max(.0001,g.value),t);g.exponentialRampToValueAtTime(.0001,t+.5);old.source.stop(t+.55);
 }
 async function play(){
  enabled=true;const id=++generation,track=selected;
  const buffer=await load(track);
  if(!buffer||id!==generation||!enabled||isMuted()||selected!==track)return false;
  if(voice?.track===track)return true;
  const api=getAudio();if(!api?.context||api.context.state==='closed')return false;
  const ac=api.context,t=ac.currentTime,old=voice,gain=ac.createGain(),duck=ac.createGain(),source=ac.createBufferSource();
  gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(MUSIC_TRACKS[track].gain,t+(old ? .5 : 1.4));duck.gain.value=1;
  source.buffer=buffer;source.loop=true;source.connect(gain);gain.connect(duck);duck.connect(api.master||ac.destination);
  const current={track,context:ac,source,gain,duck};
  source.onended=()=>{source.disconnect();gain.disconnect();duck.disconnect();if(voice===current)voice=null;};
  voice=current;source.start(t);fadeOut(old);return true;
 }
 function stop(){enabled=false;generation++;const old=voice;voice=null;fadeOut(old);}
 function select(track){record(track);if(selected===track)return Promise.resolve(!!voice);selected=track;generation++;return enabled?play():Promise.resolve(false);}
 return {load,play,stop,select,
  get buffer(){return record(selected).buffer;},get failed(){return record(selected).failed;},
  get source(){return voice?.source||null;},get gain(){return voice?.gain||null;},get duck(){return voice?.duck||null;},
  get snapshot(){return {track:selected,playingTrack:voice?.track||null,enabled,loaded:!!record(selected).buffer,failed:record(selected).failed,duration:record(selected).buffer?.duration||0,gain:voice?.gain.gain.value||0,targetGain:MUSIC_TRACKS[selected].gain};}
 };
}
