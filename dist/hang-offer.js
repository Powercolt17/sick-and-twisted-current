import {loadOutlawAssets} from './outlaw-motion.js?v=113';

// Reframe the approved game artwork for a small offer card. The timber stays
// fixed and the intact cowboy layer moves as one piece around the rope anchor.
let artwork;
function loadArtwork(){
 return artwork??=Promise.all([
  loadOutlawAssets('./assets/outlaw-hanging/'),
  new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src='assets/shop/trickster-buy-menu.png';})
 ]).catch(error=>{artwork=null;throw error;});
}
export function createHangOfferArt(dialog){
 const updateVisibility=()=>dialog.classList.toggle('offer-motion-paused',document.hidden);
 document.addEventListener('visibilitychange',updateVisibility);updateVisibility();
 return function illustration(){
  const print=document.createElement('div');print.className='card-art hanging-offer';
  print.style.setProperty('--art-ratio','1.5');print.style.setProperty('--art-width','210px');
  const canvas=className=>{const c=document.createElement('canvas');c.width=600;c.height=400;c.className=className;print.append(c);return c;};
  const timber=canvas('hanging-timber'),cowboy=canvas('hanging-cowboy');
  loadArtwork().then(([outlaw,atlas])=>{
   const beam=timber.getContext('2d');
   beam.drawImage(atlas,681,628,217,33,32,5,545,83);
   beam.drawImage(atlas,849,662,33,87,505,74,57,326);
   const figure=cowboy.getContext('2d');
   figure.imageSmoothingQuality='high';
   // Preserve the black ink; brighten the painted midtones instead of blending
   // them away against the card. The tighter crop makes the face legible.
   figure.filter='brightness(1.5) saturate(.8)';
   figure.drawImage(outlaw.figureLive,80,228,352,560,62,54,435,692);
   print.dataset.ready='true';
  }).catch(()=>{
   const img=document.createElement('img');img.src='assets/outlaw-hanging/outlaw-original.png';img.alt='';img.draggable=false;
   img.style.cssText='position:static;width:100%;height:100%;object-fit:contain';print.replaceChildren(img);
  });
  return print;
 };
}
