import {bigWinTier} from './big-win.js?v=3';

// Resolve one spin, including all of its capped/rounded cascades. Feature-buy
// prices and earlier free-spin wins are not the stake or return of this spin.
export function spinBigWin(result,{bet,stake,feature=false,preview=false}={}){
 if(preview||!result||result.maxWin)return null; // MAX owns its presentation.
 const wager=feature?bet:stake>0?stake:bet;
 const value=result.cents/100;
 if(!bigWinTier(value,wager,value))return null;
 return {value,options:{summaryOnly:true,cascade:false,bet,wager,stake:wager,
  roundReturn:value,honestFeedback:false}};
}
