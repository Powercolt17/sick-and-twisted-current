// Moving parts are masks of the approved symbol atlas, never replacement art.
// Parchment and every pixel outside a moving part stay in their original place.
const clamp=v=>Math.max(0,Math.min(1,v)),ease=v=>{v=clamp(v);return v*v*(3-2*v);};
export const REACTION_CONTACT=300/440;
const SIZE=362;
const inside=(x,y,poly)=>{let hit=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit;};
const box=(l,t,r,b)=>[[l,t],[r,t],[r,b],[l,b]];
const MASKS={
 a:{glyph:box(24,61,329,313)},k:{glyph:box(23,61,330,310)},q:{glyph:box(31,61,329,326)},j:{glyph:box(27,61,328,306)},ten:{glyph:box(19,65,336,306)},
 // Both jaws hinge on the same oblique line. Buckle, chain and base stay fixed.
 cuffs:{back:[[28,174],[26,130],[46,78],[247,75],[329,170],[334,225],[319,240],[302,219],[267,203],[226,191],[184,181],[137,175],[97,165],[64,171],[39,183]],
 front:[[30,157],[40,177],[49,167],[82,177],[115,190],[150,200],[187,213],[219,218],[265,219],[297,203],[329,190],[332,245],[305,262],[243,269],[199,267],[161,261],[119,247],[78,227],[43,202]]},
 guns:{body:[[26,30],[73,25],[82,51],[267,137],[264,175],[280,190],[307,259],[305,333],[224,303],[223,241],[189,230],[173,210],[162,145],[26,66]],
 hammer:[[255,143],[263,156],[272,158],[281,151],[291,155],[290,168],[278,177],[263,178]]},
 bandit:{head:[[18,103],[23,79],[109,61],[107,18],[223,9],[249,69],[329,74],[335,103],[269,119],[264,154],[220,165],[167,158],[115,156],[93,128],[40,119]]},
 star:{glyph:box(24,17,331,326)},skull:{glyph:box(40,17,326,332)}
};
export function createSymbolReactions({makeCanvas=()=>document.createElement('canvas')}={}){
 const tiles=new Map();let liquid=null;
 const canvas=()=>{const c=makeCanvas();c.width=SIZE;c.height=SIZE;return c;};
 function setLiquid(image){liquid=image;}
 function prepare(atlas,symbols){
  tiles.clear();if(!atlas?.width||!atlas?.height)return false;
  const paperTile=canvas(),pc=paperTile.getContext('2d'),pi=symbols.indexOf('cuffs');
  pc.drawImage(atlas,pi%6*atlas.width/6,Math.floor(pi/6)*atlas.height/2,atlas.width/6,atlas.height/2,0,0,SIZE,SIZE);
  const paperSource=pc.getImageData(0,0,SIZE,SIZE).data;
  for(const [name,masks] of Object.entries(MASKS)){
   const index=symbols.indexOf(name);if(index<0)continue;
   const original=canvas(),oc=original.getContext('2d');oc.drawImage(atlas,index%6*atlas.width/6,Math.floor(index/6)*atlas.height/2,atlas.width/6,atlas.height/2,0,0,SIZE,SIZE);
   const raw=oc.getImageData(0,0,SIZE,SIZE),src=raw.data,n=SIZE*SIZE,labels=new Int8Array(n);labels.fill(-1);
   const parts=Object.entries(masks),alpha=new Uint8Array(n);
   for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){
    const i=y*SIZE+x,p=i*4,r=src[p],g=src[p+1],b=src[p+2],l=(r+g+b)/3;
    if(l>=165||r>g*1.65)continue;
    for(let j=parts.length-1;j>=0;j--)if(inside(x,y,parts[j][1])){labels[i]=j;alpha[i]=Math.round(clamp((165-l)/45)*255);break;}
   }
   // Ignore isolated paper specks inside the hand-traced working regions.
   const marked=new Uint8Array(n);
   for(let root=0;root<n;root++)if(labels[root]>=0&&!marked[root]){
    const region=[root],label=labels[root];marked[root]=1;
    for(let k=0;k<region.length;k++){const i=region[k],x=i%SIZE;
     for(const j of [x>0?i-1:-1,x<SIZE-1?i+1:-1,i-SIZE,i+SIZE])if(j>=0&&j<n&&!marked[j]&&labels[j]===label){marked[j]=1;region.push(j);}
    }
    if(region.length<32)for(const i of region)labels[i]=-1;
   }
   // Expand the silhouette matte through antialiased edges, then retain small
   // enclosed engraving highlights as opaque original pixels. This avoids
   // thresholding the distressed texture into speckles during motion.
   const grown=new Int8Array(labels);for(let y=2;y<SIZE-2;y++)for(let x=2;x<SIZE-2;x++){
    const i=y*SIZE+x;if(labels[i]>=0)continue;
    search:for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const j=i+dy*SIZE+dx;if(labels[j]>=0){grown[i]=labels[j];break search;}}
   }labels.set(grown);
   const visited=new Uint8Array(n);
   for(let root=0;root<n;root++)if(labels[root]<0&&!visited[root]){
    const region=[root],adjacent=new Map();visited[root]=1;let touches=false;
    for(let k=0;k<region.length;k++){const i=region[k],x=i%SIZE;if(x===0||x===SIZE-1||i<SIZE||i>=n-SIZE)touches=true;
     for(const j of [x>0?i-1:-1,x<SIZE-1?i+1:-1,i-SIZE,i+SIZE])if(j>=0&&j<n){if(labels[j]>=0)adjacent.set(labels[j],(adjacent.get(labels[j])||0)+1);else if(!visited[j]){visited[j]=1;region.push(j);}}
    }
    if(!touches&&region.length<2200&&adjacent.size){const label=[...adjacent].sort((a,b)=>b[1]-a[1])[0][0];for(const i of region)labels[i]=label;}
   }
   for(let i=0;i<n;i++)if(labels[i]>=0)alpha[i]=255;
   // Rebuild only the covered paper from genuine blank engraving margins.
   // Mirrored texture sampling retains paper grain without nearest-pixel streaks.
   const paper=new Uint8ClampedArray(n*3),mirror=(v,size)=>{v=v%(size*2);return v<size?v:size*2-1-v;};
   for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){
    const i=y*SIZE+x,s=((26+mirror(y+17,32))*SIZE+118+mirror(x+29,98))*4;
    for(let ch=0;ch<3;ch++)paper[i*3+ch]=paperSource[s+ch];
   }
   const base=canvas(),bc=base.getContext('2d'),clean=bc.createImageData(SIZE,SIZE);clean.data.set(src);
   const layers=parts.map(([name])=>({name,image:canvas()})),data=layers.map(x=>x.image.getContext('2d').createImageData(SIZE,SIZE));
   for(let i=0;i<n;i++)if(labels[i]>=0){const p=i*4,j=labels[i],a=alpha[i]/255,s=i*3;for(let ch=0;ch<3;ch++){clean.data[p+ch]=src[p+ch]*(1-a)+paper[s+ch]*a;data[j].data[p+ch]=src[p+ch];}data[j].data[p+3]=alpha[i];}
   bc.putImageData(clean,0,0);layers.forEach((l,i)=>l.image.getContext('2d').putImageData(data[i],0,0));
   tiles.set(name,{original,base,layers:Object.fromEntries(layers.map(l=>[l.name,l.image]))});
  }
 }
 function hinge(ctx,image,sy){const slope=58/282,x=38,y=181;ctx.save();ctx.transform(1,slope*(1-sy),0,sy,0,(1-sy)*(y-slope*x));ctx.drawImage(image,0,0);ctx.restore();}
 // One continuous physical event: load, contact, small rebound, controlled return.
 function closure(p){const c=REACTION_CONTACT;if(p<c-.12)return -.025*Math.sin(clamp(p/(c-.12))*Math.PI);if(p<c)return ease((p-c+.12)/.12);if(p<c+.065)return 1-.10*Math.sin((p-c)/.065*Math.PI);return 1-ease((p-c-.065)/(1-c-.065));}
 function draw(ctx,name,x,y,w,h,reaction){
  if(!reaction||reaction.progress<=0||reaction.progress>=1)return false;
  const p=reaction.progress,strength=reaction.intensity??1;
  if(name==='bottle'){
   if(!liquid)return false;
   // Original glass and skull label are always drawn by the caller. Add liquid
   // only inside its engraved inner wall, excluding the complete label region.
   ctx.save();ctx.translate(x,y);ctx.scale(w/SIZE,h/SIZE);
   ctx.beginPath();ctx.moveTo(132,111);ctx.lineTo(220,111);ctx.lineTo(248,170);ctx.lineTo(229,318);ctx.lineTo(139,318);ctx.lineTo(118,172);ctx.closePath();ctx.clip();
   ctx.beginPath();ctx.rect(0,0,SIZE,SIZE);ctx.moveTo(125,140);ctx.lineTo(125,274);ctx.lineTo(231,274);ctx.lineTo(231,140);ctx.closePath();ctx.clip('evenodd');
   const wave=Math.sin(p*Math.PI*2.4)*Math.sin(Math.PI*p)*strength,alpha=.68*Math.sin(Math.PI*p);
   ctx.globalCompositeOperation='screen';ctx.globalAlpha=alpha;ctx.translate(181,292);ctx.rotate(wave*.12);ctx.drawImage(liquid,-104,-36+wave*9,208,70);ctx.restore();return false;
  }
  const t=tiles.get(name);if(!t)return false;
  ctx.save();ctx.beginPath();ctx.rect(x+2,y+2,w-4,h-4);ctx.clip();ctx.translate(x,y);ctx.scale(w/SIZE,h/SIZE);ctx.drawImage(t.base,0,0);
  if(name==='cuffs'){
   const q=closure(p);hinge(ctx,t.layers.back,1-q*.76);hinge(ctx,t.layers.front,1-q*.70);
  }else if(name==='guns'){
   const age=p-REACTION_CONTACT,fall=p<REACTION_CONTACT?ease((p-.48)/(REACTION_CONTACT-.48)):1-ease((p-.80)/.20);
   const recoil=age<0?0:Math.sin(clamp(age/.045)*Math.PI/2)*Math.exp(-age*13)*(1-ease((p-.87)/.13));
   ctx.save();ctx.translate(254+3*recoil*strength,245+2*recoil*strength);ctx.rotate(.045*recoil*strength);ctx.translate(-254,-245);ctx.drawImage(t.layers.body,0,0);
   ctx.translate(262,175);ctx.rotate(-.50*fall);ctx.translate(-262,-175);ctx.drawImage(t.layers.hammer,0,0);ctx.restore();
  }else if(name==='bandit'){
   const dip=p<.48?ease(p/.48):p<.72?1-ease((p-.48)/.24)*1.35:-.35*(1-ease((p-.72)/.28));
   ctx.save();ctx.translate(181,155+dip*4*strength);ctx.rotate(dip*.018*strength);ctx.translate(-181,-155);ctx.drawImage(t.layers.head,0,0);ctx.restore();
  }else{
   const age=p-REACTION_CONTACT,compression=age<-.12?0:age<0?ease((age+.12)/.12):Math.exp(-age*20)*Math.cos(age*26);
   ctx.save();ctx.translate(181,188);ctx.scale(1+.022*compression*strength,1-.05*compression*strength);ctx.translate(-181,-188);ctx.drawImage(t.layers.glyph,0,0);ctx.restore();
   if(age>=0&&age<.12){ctx.globalAlpha=(1-age/.12)*.25*strength;ctx.drawImage(t.layers.glyph,-.6,0);}
  }
  ctx.restore();return true;
 }
 return {prepare,setLiquid,draw,get ready(){return tiles.size>0;},get layers(){return tiles;},get liquidReady(){return !!liquid;}};
}
