// A reading gate for the confirmed award. Presentation never changes the outcome.
export function createBloodBriefing({stage,onPreview=()=>{},onFinish=()=>{}}){
 let pending=null,priorFocus=null,previousInert=false;
 const panel=document.createElement('section');panel.className='blood-briefing blood-overlay';panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby','blood-briefing-title');
 panel.innerHTML=`<div class="blood-dossier blood-briefing-card blood-reference-entry"><img class="blood-entry-reference" src="assets/blood-plates/approved-entry-hd.webp" alt="" aria-hidden="true" draggable="false"><div class="blood-hardware" aria-hidden="true"><i class="timber top"></i><i class="timber bottom"></i><i class="timber left"></i><i class="timber right"></i></div>
  <header class="blood-dossier-header"><span class="blood-eyebrow">A DEADLY WAGER. A HIGHER BOUNTY.</span><h2 id="blood-briefing-title">BLOOD MONEY</h2><div class="blood-header-rule" aria-hidden="true"><span>★</span></div></header>
  <div class="blood-dossier-content">
   <figure class="blood-target"><div class="blood-target-art"><img src="assets/ink-western/rustler.webp" alt="Wanted: The Rustler" draggable="false"></div><figcaption>YOUR FIRST TARGET</figcaption></figure>
   <div class="blood-award"><div><strong class="blood-award-spins"></strong><span>FREE SPINS</span></div><div><strong class="blood-award-boost"></strong><span>WIN MULTIPLIER</span></div></div>
   <h3 class="blood-motto">HUNT. COLLECT.<br><em>UPGRADE.</em></h3>
   <div class="blood-briefing-stamps" aria-hidden="true"><span><b>01</b><small>STAMP</small></span><i></i><span><b>02</b><small>STAMP</small></span><i></i><span> <b>03</b><small>STAMP</small></span><strong class="blood-upgrade-label">NEXT<br>OUTLAW <em>→</em></strong></div>
   <div class="blood-instructions"><p>Win with the wanted outlaw to earn a stamp.</p><p><strong>3 stamps: +2 spins. Shoot for a higher multiplier.</strong></p></div>
   <div class="blood-dossier-action"><button type="button" class="blood-continue" aria-label="Start Blood Money free spins">BEGIN THE HUNT <span aria-hidden="true">→</span></button><p class="blood-briefing-note">START AT 1× · RANDOM ROLLS UP TO 10× · KEEP YOUR BEST</p></div>
  </div><span class="blood-corner tl" aria-hidden="true"></span><span class="blood-corner tr" aria-hidden="true"></span><span class="blood-corner bl" aria-hidden="true"></span><span class="blood-corner br" aria-hidden="true"></span>
 </div>`;
 stage.append(panel);const button=panel.querySelector('button'),hud=stage.querySelector('#game-controls');
 function finish(accepted=true){if(!pending)return false;const resolve=pending;pending=null;panel.hidden=true;stage.removeAttribute('data-blood-briefing');if(hud){hud.inert=previousInert;hud.setAttribute('aria-hidden',String(previousInert));}onFinish();if(priorFocus?.isConnected)priorFocus.focus({preventScroll:true});resolve(accepted);return true;}
 button.addEventListener('click',()=>finish());
 document.addEventListener('keydown',e=>{if(!pending)return;if(['Space','Enter'].includes(e.code)){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)finish();}else if(e.key==='Tab'){e.preventDefault();button.focus({preventScroll:true});}},true);
 window.addEventListener('pagehide',()=>finish(false));
 return {
  show({awardedSpins,boost=1}){if(pending)throw Error('Blood Money briefing already open');if(!Number.isSafeInteger(awardedSpins)||awardedSpins<1)throw Error('Confirmed free spins required');panel.querySelector('.blood-briefing-card').classList.toggle('blood-reference-entry',awardedSpins===8);priorFocus=document.activeElement;previousInert=!!hud?.inert;panel.querySelector('.blood-award-spins').textContent=String(awardedSpins);panel.querySelector('.blood-award-boost').textContent='UP TO 10×';onPreview({awardedSpins,boost});stage.setAttribute('data-blood-briefing','');if(hud){hud.inert=true;hud.setAttribute('aria-hidden','true');}panel.hidden=false;const result=new Promise(resolve=>pending=resolve);button.focus({preventScroll:true});return result;},
  cancel:()=>finish(false),get active(){return !!pending;}
 };
}
