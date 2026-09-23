import {createHellIntro} from './hell-intro.js?v=80';
import {createBloodScatterReaction} from './blood-reveal.js?v=3';
import {createBountyReveal,createBountyFrame,BOUNTY_REVEAL,BOUNTY_MATERIAL} from './bounty-poster.js?v=94art';
import {loadBloodAudio,scheduleBloodAudio} from './blood-audio.js?v=82';
import {createBloodCinematic} from './blood-cinematic.js?v=2';

export const BLOOD_FEATURE=Object.freeze({id:'blood-money',name:'Blood Money',title:'BLOOD MONEY',minScatters:3,maxScatters:3,fireGlow:false,debugKey:'blood',createArtwork:createBountyReveal,timing:BOUNTY_REVEAL,showScatterCount:false,createScatterEffect:createBloodScatterReaction,createFrame:createBountyFrame,loadAudio:loadBloodAudio,scheduleAudio:scheduleBloodAudio,images:{bountyMaterial:BOUNTY_MATERIAL,bloodArt:'assets/blood-money/artwork.png',bloodClean:'assets/blood-money/cloth-clean-plate.png',background:'assets/blood-money/background-clean.png',armClean:'assets/blood-money/armless.png',scatter:'assets/ink-refined/scatter.webp?v=pigment1',scatterPlate:'assets/ink-refined/scatter-clean.webp?v=pigment1',flash:'assets/bonus/flash.webp',smoke:'assets/bonus/smoke.webp'}});

export function confirmedBloodCells(grid,trigger){
 if(!trigger||!Number.isSafeInteger(trigger.count)||trigger.count<1||trigger.scatters!==3)throw Error('A confirmed three-scatter award is required');
 const cells=[];
 for(let c=0;c<6;c++)for(let r=0;r<4;r++)if(grid[c]?.[r]==='scatter')cells.push([c,r]);
 if(cells.length!==3)throw Error('Confirmed scatters do not match the frozen result');
 return cells;
}

export function createBloodIntro(options){
 const poster=createHellIntro({...options,feature:{...BLOOD_FEATURE,createArtwork:(assets,make)=>createBountyReveal(assets,make,{getTile:options.getTile,reduced:options.reduced})}});
 const film=createBloodCinematic(options);let generation=0,entering=false;
 return {
  load:poster.load,
  async play(input){if(entering||film.active||poster.active)return false;entering=true;const id=++generation;
   try{await poster.load();if(id!==generation)return false;const advanced=await film.play(input);if(!advanced||id!==generation)return false;return await poster.play(input);}
   finally{entering=false;if(!poster.active&&!film.active)options.onMix(false);}
  },
  draw:ctx=>film.active?film.draw(ctx):poster.draw(ctx),syncMute(){film.syncMute();poster.syncMute();},
  setPaused(value){film.setPaused(value);poster.setPaused(value);},
  continue:()=>film.active?film.skip():poster.continue(),cancel(){generation++;film.cancel();poster.cancel();},
  setMuteToggle(fn){film.setMuteToggle(fn);poster.setMuteToggle(fn);},
  get active(){return film.active||poster.active;},get snapshot(){return film.active?film.snapshot:poster.snapshot;},
  get state(){return film.active?film.state:{...poster.state,phase:'poster'};}
 };
}
