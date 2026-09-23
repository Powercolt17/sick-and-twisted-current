// Two matched impact samples, chosen independently for each landed scatter.
export const SCATTER_GAP_MS=420;
export const SCATTER_OFFSET=0;
export function createScatterPitch(random=Math.random){
 return ()=>random()<.5?.95:1.05;
}
export function createScatterAudio({getAudio,isMuted=()=>false,pitch=createScatterPitch(),random=Math.random,fallback=()=>{},onPlay=()=>{}}){
 const voices=new Set();let lastStart=-Infinity,serial=0;const history=[];
 function soften(voice,now){
  if(voice.softened)return;voice.softened=true;
  const at=Math.max(now,voice.attackEnd),g=voice.gain.gain;
  g.cancelScheduledValues(at);g.setValueAtTime(1,at);g.linearRampToValueAtTime(.16,at+.08);
  g.linearRampToValueAtTime(0,at+.32);voice.source.stop(at+.34);
 }
 function land(column,count=1){
  if(isMuted())return;const api=getAudio();if(!api?.context)return;
  const {context:ac,destination}=api,now=ac.currentTime;
  const buffers=api.buffers??(api.buffer?[api.buffer]:[]);
  for(let i=0;i<count;i++){
   const at=now,rate=pitch(),variant=Math.min(buffers.length-1,Math.floor(random()*buffers.length)),buffer=buffers[variant];lastStart=at;
   for(const voice of voices)soften(voice,at);
   const event={id:++serial,column,at,offset:SCATTER_OFFSET,rate,variant};history.push(event);if(history.length>32)history.shift();onPlay(event);
   if(!buffer){fallback(at,column);continue;}
   const source=ac.createBufferSource(),gain=ac.createGain(),pan=ac.createStereoPanner?.();
   source.buffer=buffer;source.playbackRate.value=rate;
   gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(1,at+.004);
   source.connect(gain);if(pan){pan.pan.value=(column-2.5)*.18;gain.connect(pan);pan.connect(destination);}else gain.connect(destination);
   const voice={source,gain,pan,attackEnd:at+.42/rate,softened:false};voices.add(voice);
   source.onended=()=>{source.disconnect();gain.disconnect();pan?.disconnect();voices.delete(voice);};
   source.start(at,SCATTER_OFFSET);
  }
 }
 function stop({allowAttack=false}={}){
  const now=getAudio()?.context?.currentTime??0;
  for(const voice of voices){
   if(allowAttack){soften(voice,now);continue;}
   const g=voice.gain.gain;g.cancelScheduledValues(now);g.setValueAtTime(g.value,now);g.linearRampToValueAtTime(0,now+.035);voice.source.stop(now+.04);
  }
  if(!allowAttack){voices.clear();lastStart=-Infinity;}
 }
 return {land,stop,get snapshot(){return {active:voices.size,history:history.map(e=>({...e}))};}};
}
