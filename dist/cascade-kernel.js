// Shared pure gravity rules. The model, renderer and verifier use these mappings.
export const positionKey=([c,r])=>c+':'+r;
export function collapse(grid,cells,fill){
 const removed=new Set(cells.map(positionKey)),next=[],moves=[],incoming=[];
 for(let c=0;c<grid.length;c++){
  const survivors=[];for(let r=0;r<grid[c].length;r++)if(!removed.has(c+':'+r))survivors.push({symbol:grid[c][r],from:r});
  const holes=grid[c].length-survivors.length,col=[],m=[],fresh=[];
  for(let r=0;r<holes;r++){const symbol=fill(c,r);col.push(symbol);m.push({symbol,from:r-holes,to:r,fresh:true});fresh.push(symbol);}
  for(let i=0;i<survivors.length;i++){const s=survivors[i];col.push(s.symbol);m.push({...s,to:holes+i,fresh:false});}
  next.push(col);moves.push(m);incoming.push(fresh);
 }
 return {grid:next,moves,incoming,removed:[...removed].map(k=>k.split(':').map(Number))};
}
export function removePayingWilds(wilds,cells){
 const columns=new Set(cells.map(p=>p[0]));return Object.fromEntries(Object.entries(wilds).filter(([c])=>!columns.has(+c)));
}
