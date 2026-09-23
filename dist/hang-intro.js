import {createHellIntro} from './hell-intro.js?v=80';
import {createHangArtwork} from './hang-artwork.js?v=1';

export const HANG_FEATURE=Object.freeze({id:'hang-em-high',name:'Hang ’Em High',title:'HANG ’EM HIGH',minScatters:4,maxScatters:4,fireGlow:false,debugKey:'hang',createArtwork:createHangArtwork,images:{hangArt:'assets/hang-em-high/artwork.png',hangClean:'assets/hang-em-high/cloth-clean-plate.png'}});

export function confirmedHangCells(grid,trigger){
 if(!trigger||!Number.isSafeInteger(trigger.count)||trigger.count<1||trigger.scatters!==4)throw Error('A confirmed four-scatter award is required');
 const cells=[];
 for(let c=0;c<6;c++)for(let r=0;r<4;r++)if(grid[c]?.[r]==='scatter')cells.push([c,r]);
 if(cells.length!==4)throw Error('Confirmed scatters do not match the frozen result');
 return cells;
}

export function createHangIntro(options){return createHellIntro({...options,feature:HANG_FEATURE});}
