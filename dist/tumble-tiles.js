// Clean live tiles retain the existing clear/drop motion after Crossfire finishes.
const clamp=x=>Math.max(0,Math.min(1,x));
export function createTumbleTiles({makeCanvas=()=>document.createElement('canvas'),getTile=()=>null,getPoster=()=>null}={}){
 const canvas=(w,h)=>{const c=makeCanvas();c.width=w;c.height=h;return c;};
 function capture(grid,cells,wilds={}){
  const tiles=new Map(),posters=new Map();
  for(const [c,r] of cells){const key=c+':'+r;if(tiles.has(key)||posters.has(c))continue;
   if(wilds[c]){const layers=getPoster(wilds[c].mult,wilds[c]);if(!layers?.art)continue;const image=canvas(360,1424),cx=image.getContext('2d');cx.drawImage(layers.art,0,0,image.width,image.height);if(layers.num)cx.drawImage(layers.num,0,0,image.width,image.height);posters.set(c,image);if(layers.temporary){layers.art.width=layers.art.height=1;if(layers.num)layers.num.width=layers.num.height=1;}}
   else{const source=getTile(grid[c][r],c,r);if(source)tiles.set(key,source);}
  }
  return {tiles,posters};
 }
 function drop(ctx,image,x,y,w,h,progress){
  const p=clamp(progress);if(p>=1||!image)return;const distance=q=>1.18*(.09*q+.91*q*q),d=distance(p),shutter=.006/180*1000;
  ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();
  // Six-millisecond shutter, with an opaque body. The art is translated only.
  for(const [back,a] of [[1,.10],[.5,.19],[0,.71]]){ctx.save();ctx.globalAlpha*=a;ctx.drawImage(image,x,y+distance(Math.max(0,p-back*shutter))*h,w,h);ctx.restore();}
  const edge=Math.min(h*.055,1.18*(.09+1.82*p)*shutter*h);
  ctx.save();ctx.beginPath();ctx.rect(x,y+d*h+edge,w,Math.max(0,h-edge));ctx.clip();ctx.drawImage(image,x,y+d*h,w,h);ctx.restore();ctx.restore();
 }
 return {capture,drop,release(captures){for(const image of captures?.posters?.values()||[])image.width=image.height=1;captures?.posters?.clear();},ready:true};
}
