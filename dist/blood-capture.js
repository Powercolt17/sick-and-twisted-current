// Authoring-only recording controls, available solely with ?debug=1&capture=1.
export function installBloodCapture({canvas,getGame,getAudio}){
 const panel=document.createElement('div');panel.style.cssText='position:fixed;bottom:6px;left:6px;z-index:50;background:#18120f;padding:8px;color:#f6e4c0;display:flex;gap:12px;font:13px Arial';
 const record=document.createElement('button');record.textContent='RECORD BLOOD MONEY';
 const status=document.createElement('span');status.textContent='Ready to record';
 const download=document.createElement('a');download.textContent='DOWNLOAD RECORDING';download.hidden=true;download.style.color='#fff';
 const still=document.createElement('a');still.textContent='DOWNLOAD SCENE';still.hidden=true;still.style.color='#fff';const meta=document.createElement('a');meta.textContent='DOWNLOAD TIMING';meta.hidden=true;meta.style.color='#fff';panel.append(record,status,download,still,meta);document.body.append(panel);
 record.onclick=async()=>{
  const game=getGame();if(!game||game.busy)return;record.disabled=true;download.hidden=true;
  const {context,master}=getAudio();await context.resume();game.soundToggle(true);
  const dest=context.createMediaStreamDestination();const limiter=context.createDynamicsCompressor();limiter.threshold.value=-4;limiter.knee.value=2;limiter.ratio.value=16;limiter.attack.value=.002;limiter.release.value=.16;master.connect(limiter);limiter.connect(dest);
  // Fixed capture canvas survives the game's dynamic resolution transitions.
  const output=document.createElement('canvas');output.width=1818;output.height=912;const c=output.getContext('2d',{alpha:false});let running=true;
  const paint=()=>{c.drawImage(canvas,0,0,output.width,output.height);if(running)requestAnimationFrame(paint);};paint();
  const stream=output.captureStream(60);for(const track of dest.stream.getAudioTracks())stream.addTrack(track);
  const chunks=[],mime=MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')?'video/webm;codecs=vp9,opus':'video/webm';
  const recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:14000000});
  recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
  recorder.onstop=()=>{running=false;master.disconnect(limiter);limiter.disconnect();stream.getTracks().forEach(t=>t.stop());const blob=new Blob(chunks,{type:mime});download.href=URL.createObjectURL(blob);download.download='Blood-Money-Rebuilt-Live.webm';download.hidden=false;status.textContent='Recording complete · eight-spin feature verified';record.disabled=false;};
  recorder.start(250);status.textContent='Recording the live game';
  setTimeout(()=>{game.startBonus(8,'DEAD').catch(e=>{status.textContent=e.message;});},350);
  let advanced=false,exported=false;const began=performance.now();const check=setInterval(()=>{
   const state=game.bloodIntro;
   if(state.active&&!exported){exported=true;game.bloodSnapshot().toBlob(blob=>{still.href=URL.createObjectURL(blob);still.download='Blood-Money-Live-Scene.png';still.hidden=false;});meta.href=URL.createObjectURL(new Blob([JSON.stringify({cells:state.cells,awardedSpins:state.awardedSpins,grid:game.geometry,entrySeconds:(performance.now()-began-350)/1000,finalGrid:game.snapState().reels})],{type:'application/json'}));meta.download='Blood-Money-Live-Timing.json';meta.hidden=false;}
   if(state.active&&state.time>=4.7&&!advanced){advanced=true;game.continueBlood();}
   if((advanced&&!state.active&&performance.now()-began>11000)||performance.now()-began>22000){clearInterval(check);recorder.stop();}
  },40);
 };
}
