// The approved, unmodified artwork is an atlas for this native Canvas menu.
// DOM controls above it own interaction, accessible labels and purchase logic.
export const SHOP_ART='assets/shop/approved-buy-menu.png';
export const SHOP_REFERENCE={width:1672,height:941};
export const SHOP_REGIONS={
 booster:{card:[286,128,357,371],button:[300,440,328,48],price:[300,405,328,32],defaultPrice:1.5},
 outlaw:{card:[659,128,357,371],button:[672,440,330,48],price:[672,406,330,31],defaultPrice:75},
 allin:{card:[1030,126,366,375],button:[1046,440,334,48],price:[1046,406,334,31],defaultPrice:200},
 dead:{card:[286,538,357,332],button:[300,811,328,48],price:[300,779,328,30],defaultPrice:99},
 deader:{card:[659,538,357,332],button:[672,811,330,48],price:[672,779,330,30],defaultPrice:499},
 outlaws:{card:[1032,538,362,332],button:[1046,811,331,48],price:[1046,779,331,30],defaultPrice:799}
};
const rect=([x,y,w,h])=>({x,y,w,h});
const scaleRect=(r,s,x=0,y=0)=>({x:x+r.x*s,y:y+r.y*s,w:r.w*s,h:r.h*s});
const relative=(r,source,target)=>({x:target.x+(r[0]-source[0])*target.w/source[2],y:target.y+(r[1]-source[1])*target.h/source[3],w:r[2]*target.w/source[2],h:r[3]*target.h/source[3]});
export function shopLayout(width,height,view='grid'){
 const mobile=width<720||height<500,l={width,height,mobile,cards:{}};
 if(!mobile){
  const s=Math.min(width/1672,Math.max(560,height)/941),x=(width-1672*s)/2,y=Math.max(0,(height-941*s)/2);
  l.height=Math.max(height,941*s);l.scene={x,y,w:1672*s,h:941*s};
  for(const [id,r] of Object.entries(SHOP_REGIONS))l.cards[id]={card:scaleRect(rect(r.card),s,x,y),button:scaleRect(rect(r.button),s,x,y),price:scaleRect(rect(r.price),s,x,y)};
  l.bet=scaleRect(rect([1238,27,106,38]),s,x,y);l.down=scaleRect(rect([1190,24,46,46]),s,x,y);l.up=scaleRect(rect([1342,24,46,46]),s,x,y);l.close=scaleRect(rect([1414,22,48,48]),s,x,y);
  l.confirm=scaleRect(rect([471,128,732,733]),s,x,y);
 }else{
  const cols=width<520?1:2,gap=14,pad=22,cw=(width-pad*2-gap*(cols-1))/cols;
  l.scene={x:0,y:0,w:width,h:height};
  l.close={x:width-64,y:17,w:44,h:44};l.down={x:width/2-104,y:99,w:44,h:44};l.up={x:width/2+60,y:99,w:44,h:44};l.bet={x:width/2-60,y:102,w:120,h:38};
  let y=190;l.sections=[];
  for(const group of [['booster','outlaw','allin'],['dead','deader','outlaws']]){
   l.sections.push({x:pad,y:y-30,w:width-pad*2,h:22});
   const ch=cw*(group[0]==='booster'?371:332)/357;
   group.forEach((id,i)=>{const r=SHOP_REGIONS[id],card={x:pad+(i%cols)*(cw+gap),y:y+Math.floor(i/cols)*(ch+gap),w:cw,h:ch};l.cards[id]={card,button:relative(r.button,r.card,card),price:relative(r.price,r.card,card)};});
   y+=Math.ceil(3/cols)*(ch+gap)+36;
  }
  l.height=view==='confirm'?Math.max(height,790):Math.max(height,y+16);
  l.confirm={x:22,y:168,w:width-44,h:590};l.scene.h=l.height;
 }
 return l;
}
function copy(ctx,img,source,dest){ctx.drawImage(img,...source,dest.x,dest.y,dest.w,dest.h);}
function border(ctx,img,source,dest){
 const [x,y,w,h]=source,n=10,sx=dest.w/w,sy=dest.h/h;
 copy(ctx,img,[x,y,w,n],{x:dest.x,y:dest.y,w:dest.w,h:n*sy});
 copy(ctx,img,[x,y+h-n,w,n],{x:dest.x,y:dest.y+dest.h-n*sy,w:dest.w,h:n*sy});
 copy(ctx,img,[x,y+n,n,h-2*n],{x:dest.x,y:dest.y+n*sy,w:n*sx,h:dest.h-2*n*sy});
 copy(ctx,img,[x+w-n,y+n,n,h-2*n],{x:dest.x+dest.w-n*sx,y:dest.y+n*sy,w:n*sx,h:dest.h-2*n*sy});
 // The ivory corner ornaments extend farther inward than the straight rail.
 for(const right of [false,true])for(const bottom of [false,true]){
  const k=24;copy(ctx,img,[x+(right?w-k:0),y+(bottom?h-k:0),k,k],{x:dest.x+(right?dest.w-k*sx:0),y:dest.y+(bottom?dest.h-k*sy:0),w:k*sx,h:k*sy});
 }
}
function ink(ctx,img,dest){copy(ctx,img,[646,205,10,120],dest);}
function amount(ctx,img,dest,text,size,source=[300,405,96,32]){
 copy(ctx,img,source,dest);ctx.fillStyle='#f1e6cd';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`900 ${size}px Offers,Georgia,serif`;ctx.fillText(text,dest.x+dest.w/2,dest.y+dest.h*.5,dest.w-8);
}
export function paintShop(ctx,img,l,{bet=1,active=null,prices={},view='grid',pending=null,money=v=>'$'+v.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}={}){
 ctx.clearRect(0,0,l.width,l.height);ctx.fillStyle='#17120e';ctx.fillRect(0,0,l.width,l.height);
 if(!l.mobile){
  copy(ctx,img,[0,0,1672,941],l.scene);
 }else{
  ink(ctx,img,{x:0,y:0,w:l.width,h:l.height});
  // Original frame strips, brand and heading, rearranged for a readable phone menu.
  copy(ctx,img,[200,85,16,800],{x:5,y:74,w:12,h:l.height-91});
  copy(ctx,img,[1455,85,17,800],{x:l.width-17,y:74,w:12,h:l.height-91});
  copy(ctx,img,[202,7,1267,10],{x:5,y:5,w:l.width-10,h:8});
  copy(ctx,img,[202,910,1267,17],{x:5,y:l.height-17,w:l.width-10,h:12});
  copy(ctx,img,[236,14,231,66],{x:23,y:17,w:150,h:43});
  copy(ctx,img,[579,18,506,48],{x:24,y:66,w:l.width-48,h:Math.min(34,(l.width-48)*48/506)});
  copy(ctx,img,[1414,22,48,48],l.close);
  copy(ctx,img,[1190,24,46,46],l.down);copy(ctx,img,[1342,24,46,46],l.up);
  if(view==='grid'){
   for(const [i,dest] of l.sections.entries()){
    const label={x:dest.x+(dest.w-166)/2,y:dest.y,w:166,h:22},side=(dest.w-186)/2;
    copy(ctx,img,i?[754,509,170,24]:[751,95,173,25],label);
    for(const right of [false,true])copy(ctx,img,[310,105,430,5],{x:right?label.x+176:dest.x,y:dest.y+10,w:Math.max(1,side),h:3});
   }
   for(const [id,box] of Object.entries(l.cards))copy(ctx,img,SHOP_REGIONS[id].card,box.card);
   ctx.fillStyle='#cab99a';ctx.textAlign='center';ctx.font='11px Arial,sans-serif';ctx.fillText('USD demo credits · Prices follow the base bet',l.width/2,l.height-27,l.width-36);
  }
 }
 if(bet!==1||l.mobile)amount(ctx,img,l.bet,money(bet),l.mobile?24:l.bet.h*.62,[1396,25,14,44]);
 if(view==='confirm'){
  if(!l.mobile){const s=l.scene.w/1672;ink(ctx,img,{x:l.scene.x+222*s,y:l.scene.y+90*s,w:1230*s,h:790*s});}
  if(pending){
   const r=SHOP_REGIONS[pending],q=l.confirm;
   const src=[r.card[0]+20,r.card[1]+(pending==='outlaw'?67:43),r.card[2]-40,r.card[3]-(pending==='outlaw'?158:134)];
   const h=Math.min(252,q.h*.36),w=Math.min(q.w*.76,h*src[2]/src[3]);
   copy(ctx,img,src,{x:q.x+(q.w-w)/2,y:q.y+q.h*.13,w,h});
  }
  return;
 }
 for(const [id,b] of Object.entries(l.cards)){
  const r=SHOP_REGIONS[id],enhancer=['booster','outlaw','allin'].includes(id),on=active===id;
  if(enhancer){
   if((id==='allin')!==on)border(ctx,img,on?SHOP_REGIONS.allin.card:SHOP_REGIONS.booster.card,b.card);
   if((id==='allin')!==on)copy(ctx,img,on?SHOP_REGIONS.allin.button:SHOP_REGIONS.booster.button,b.button);
  }
  if(prices[id]!==undefined&&prices[id]!==r.defaultPrice)amount(ctx,img,b.price,money(prices[id]),b.price.h);
 }
}
