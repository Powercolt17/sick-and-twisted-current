// Authoritative presentation-independent bomb rules. A blast never destroys
// Scatter, either single-cell Wild, MAX, or a covered Outlaw Wild position.
export const BOMB='bomb';
const protectedSymbols=new Set(['scatter','skull','boxedwild','max']);
export const uniqueCells=cells=>[...new Map(cells.map(p=>[p.join(':'),p.slice()])).values()];
export function bombBlast(grid,wilds={}){
 const centers=[];
 for(let c=0;c<grid.length;c++)for(let r=0;r<grid[c].length;r++)if(grid[c][r]===BOMB&&!wilds[c])centers.push([c,r]);
 if(!centers.length)return null;
 const cells=[];
 for(const [c,r] of centers)for(let x=Math.max(0,c-1);x<=Math.min(grid.length-1,c+1);x++)for(let y=Math.max(0,r-1);y<=Math.min(grid[x].length-1,r+1);y++){
  if(!wilds[x]&&!protectedSymbols.has(grid[x][y]))cells.push([x,y]);
 }
 return {centers,cells:uniqueCells(cells)};
}
export function clearCellsForStep(step,result){return uniqueCells([...(result.cells||[]),...(step.bomb?.cells||[])]);}
