import {createBloodTarget} from './blood-target.js?v=2';
import {bloodTargetFrame,BLOOD_TARGET_TIME} from './blood-target-motion.js?v=2';
const clamp=n=>Math.max(0,Math.min(1,n)),ease=n=>1-(1-clamp(n))**3;
// Convert the canvas camera to the positioned DOM target's local CSS pixels.
// Include the same zoom/pivot as the scene, not a second independent shake.
export function bloodTargetCameraMatrix(m,{renderScale,sceneTop,k,x,y}){
 const a=m.a/renderScale,b=m.b/renderScale,c=m.c/renderScale,d=m.d/renderScale;
 const e=m.e/renderScale,f=(m.f-Math.round(sceneTop*renderScale))/renderScale;
 return [a,b,c,d,(a-1)*x+c*y+k*e,b*x+(d-1)*y+k*f];
}
export const BLOOD_REWARD_DURATION=BLOOD_TARGET_TIME.end;
export function bloodPromotionFrame(age,reduced=false){
 const rewardAge=age-BLOOD_TARGET_TIME.reward,enter=ease(rewardAge/280),exit=ease((age-4800)/350),strike=clamp((rewardAge-130)/350);
 return {opacity:enter*(1-exit),rise:reduced?0:18*(1-enter)-8*exit,
  scale:reduced?1:1+.18*(1-strike)**3,
  shine:reduced?0:Math.sin(clamp((rewardAge-330)/850)*Math.PI),
  dust:reduced?0:Math.sin(clamp((rewardAge-160)/900)*Math.PI),
  travel:clamp((rewardAge-160)/1300),boostReady:age>=BLOOD_TARGET_TIME.impact+BLOOD_TARGET_TIME.fast+BLOOD_TARGET_TIME.slow+BLOOD_TARGET_TIME.catch,done:age>=BLOOD_REWARD_DURATION};
}
// Presentation only: grants originate in createBloodRewards, never in an animation.
export function createBloodPromotion({stage,reduced=false,onCue=()=>{},onStart=()=>{}}){
 const root=document.createElement('div');root.className='blood-progression';root.hidden=true;
 root.innerHTML=`<aside class="blood-tier" aria-label="Blood Money win multiplier"></aside>
 <div class="blood-promotion-dim" hidden></div>
 <section class="blood-promotion" hidden aria-label="Bounty upgrade reward"><div class="blood-promotion-top">BOUNTY CLAIMED</div><div class="blood-promotion-main"><strong class="blood-spins-award">+2</strong> <h3>FREE SPINS</h3></div><div class="blood-reward-result">WIN MULTIPLIER INCREASED</div><span class="sr-only blood-promotion-defeated"></span><span class="sr-only blood-promotion-remaining"></span><span class="sr-only blood-boost-to"></span><span class="sr-only blood-promotion-next"></span></section>`;
 stage.append(root);const badge=root.querySelector('.blood-tier'),target=createBloodTarget(badge),panel=root.querySelector('.blood-promotion'),dim=root.querySelector('.blood-promotion-dim'),viewport=stage.querySelector('#game-viewport');let active=false,event=null,lastLevel=-1,ageNow=null,shownMultiplier=1,aim={x:1109.5,y:95};
 let placement=null;
 function measure(){
  if(!active)return;const s=stage.getBoundingClientRect(),v=viewport.getBoundingClientRect(),k=v.width/1212,phone=stage.closest('#slot-shell').dataset.layout==='portrait';root.dataset.phone=String(phone);
  const x=v.left-s.left,y=v.top-s.top;
  // The range target keeps its true proportions above the lantern.
  const h=phone?Math.max(76,y-3):204*k,w=h*700/800,left=phone?s.width-w-5:x+1006.5*k,top=phone?0:y+1*k;
  Object.assign(badge.style,{left:left+'px',top:top+'px',width:w+'px',height:h+'px'});
  placement={k,x:left-x,y:top-y};
  aim={x:(left-x+w*315/700)/k,y:(top-y+h*280/800)/k};
  Object.assign(panel.style,{left:x+597*k+'px',top:y+v.height*.91+'px',width:phone?s.width*.84+'px':606*k+'px'});
  Object.assign(dim.style,{left:x+267*k+'px',top:y+157*k+'px',width:660*k+'px',height:396*k+'px'});
 }
 const observer=new ResizeObserver(measure);observer.observe(stage);observer.observe(viewport);
 function setLevel(level){if(lastLevel===level)return;lastLevel=level;target.setLevel(level);}
 function update(clock){if(!event)return;const age=clock-event.at,f=bloodPromotionFrame(age,reduced),m=bloodTargetFrame(age,reduced);ageNow=age;root.dataset.rewardLevel=String(event.level);root.dataset.rewardAge=String(Math.round(age));panel.style.opacity=f.opacity;panel.setAttribute('aria-hidden',String(f.opacity<.05));panel.style.setProperty('--reward-rise',f.rise+'px');panel.style.setProperty('--award-scale',f.scale);panel.style.setProperty('--reward-shine',f.shine);panel.style.setProperty('--particle-opacity',f.dust);panel.style.setProperty('--particle-travel',f.travel);dim.style.opacity='0';if(m.reveal)setLevel(event.multiplier);target.frame(m);
  if(age>=0&&!event.drew){event.drew=true;onCue({type:'target-draw'});} if(m.fire&&!event.fired){event.fired=true;onCue({type:'target-shot',level:event.level});}
  if(m.hit&&!event.hit){event.hit=true;onCue({type:'target-impact',level:event.level});}

  if(m.land&&!event.caught){event.caught=true;target.announce();shownMultiplier=event.multiplier;onCue({type:'target-catch',level:event.level,multiplier:event.multiplier,increased:event.increased});}
  if(f.done){panel.hidden=true;dim.hidden=true;event=null;ageNow=null;target.reset();delete root.dataset.rewardLevel;}}

 return {root,update,
  camera(matrix,renderScale,sceneTop){if(!active||!placement)return;badge.style.transformOrigin='0 0';badge.style.transform='matrix('+bloodTargetCameraMatrix(matrix,{...placement,renderScale,sceneTop}).join(',')+')';},
  start(){badge.style.transform="none";active=true;shownMultiplier=1;event=null;ageNow=null;root.hidden=false;panel.hidden=true;dim.hidden=true;target.reset();lastLevel=-1;setLevel(1);target.announce();measure();},
  show(reward,{defeated,next,remaining,clock}){event={...reward,at:clock,fired:false,hit:false,caught:false};root.querySelector('.blood-promotion-defeated').textContent=defeated;root.querySelector('.blood-promotion-remaining').textContent=`${remaining} SPINS REMAINING`;root.querySelector('.blood-boost-to').textContent=reward.multiplier+String.fromCharCode(215);root.querySelector('.blood-reward-result').textContent=reward.increased?'WIN MULTIPLIER INCREASED':'HIGHER MULTIPLIER KEPT';root.querySelector('.blood-promotion-next').textContent=`NEXT TARGET: ${next}`;root.dataset.rewardLevel=String(reward.level);panel.hidden=false;dim.hidden=true;root.querySelector('.blood-promotion-top').textContent=reward.multiplier===10?'MAXIMUM BOUNTY':'BOUNTY CLAIMED';measure();onStart();update(clock);},
  stop(){badge.style.transform="none";active=false;event=null;ageNow=null;root.hidden=true;panel.hidden=true;dim.hidden=true;target.reset();delete root.dataset.rewardLevel;},
  get shownMultiplier(){return shownMultiplier;},get active(){return !!event;},get age(){return ageNow;},get target(){return aim;},ready:target.ready
 };
}

