/* Sick & Twisted – original artwork pendulum animation. No dependencies. */
export const WIDTH = 484, HEIGHT = 1448;
export const PERIOD = 3.2, ENTRANCE_DURATION = 3.2;
// One physical cell drop per beat. All game modes share these exact contact times.
export const WILD_STEPS=Object.freeze({lead:.055,travel:.12,hold:.085,rows:4,settle:.20,turboRate:1.35});
export const WILD_LANDINGS=Object.freeze(Array.from({length:4},(_,i)=>WILD_STEPS.lead+i*(WILD_STEPS.travel+WILD_STEPS.hold)+WILD_STEPS.travel));
export const WILD_ENTRY_END=WILD_LANDINGS[3]+WILD_STEPS.settle;
const TAU = Math.PI * 2;
const outline = [[258,307],[278,309],[274,321],[257,338],[268,350],[279,368],[286,388],[298,405],[320,421],[346,438],[357,450],[365,491],[370,545],[379,588],[382,617],[377,658],[374,689],[366,725],[366,744],[355,749],[352,769],[350,793],[340,806],[345,827],[350,859],[354,883],[350,920],[357,968],[369,1022],[373,1071],[366,1112],[360,1080],[351,1056],[346,1064],[338,1023],[330,992],[322,982],[319,1009],[328,1030],[326,1058],[329,1085],[321,1101],[326,1122],[325,1156],[323,1189],[317,1200],[306,1206],[287,1203],[273,1197],[269,1188],[269,1169],[275,1147],[270,1128],[274,1110],[270,1093],[271,1071],[261,1050],[253,1013],[247,980],[233,944],[224,916],[214,912],[207,941],[210,976],[215,1001],[211,1038],[210,1070],[218,1094],[219,1112],[231,1120],[234,1139],[232,1159],[218,1165],[212,1178],[197,1187],[177,1193],[160,1199],[140,1199],[140,1191],[148,1179],[164,1163],[168,1147],[171,1125],[165,1111],[170,1097],[164,1080],[162,1052],[154,1022],[149,1000],[140,1061],[135,1063],[137,1085],[128,1076],[123,1055],[114,1089],[108,1090],[109,1068],[107,1040],[110,998],[112,961],[116,920],[121,860],[123,820],[112,811],[103,800],[101,780],[99,759],[91,751],[95,727],[95,700],[98,667],[103,643],[100,624],[106,603],[107,578],[115,548],[117,515],[125,486],[125,468],[148,450],[161,434],[163,423],[151,440],[149,421],[158,406],[152,391],[137,397],[125,395],[117,390],[117,378],[125,363],[151,347],[144,338],[143,324],[154,309],[176,296],[192,287],[207,282],[215,285],[224,302],[232,311],[248,307]];
const rope = [[236,226],[250,226],[250,279],[260,285],[263,295],[258,303],[264,308],[259,319],[248,324],[237,318],[235,308],[228,302],[232,291],[237,284]];
const glyphs = [
 [[85,939],[97,935],[116,937],[129,940],[151,936],[162,941],[164,950],[153,960],[145,970],[155,985],[165,994],[165,1005],[152,1010],[137,1006],[123,1007],[112,1009],[91,1008],[87,1001],[87,990],[100,981],[108,968],[100,956],[86,954]],
 [[184,892],[198,884],[214,878],[225,867],[237,866],[251,870],[260,879],[259,902],[249,924],[251,942],[258,950],[276,947],[286,953],[286,967],[274,977],[276,1003],[280,1022],[278,1039],[267,1048],[247,1056],[223,1056],[202,1054],[187,1048],[184,1036],[196,1025],[207,1025],[207,1002],[202,981],[196,969],[190,964],[190,951],[202,943],[204,920],[192,921],[182,915],[182,902]],
 [[287,932],[300,905],[321,885],[345,873],[363,871],[383,870],[393,863],[406,862],[417,869],[420,884],[419,904],[411,919],[412,928],[423,940],[430,960],[432,988],[423,1015],[410,1037],[389,1051],[363,1057],[337,1054],[315,1046],[298,1033],[285,1012],[280,989],[282,965]]
];
function path(ctx, points) {ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();}
function smooth(a,b,x) {const q=Math.max(0,Math.min(1,(x-a)/(b-a)));return q*q*(3-2*q);}
function transform(ctx, y, angle) {ctx.translate(242,228+y);ctx.rotate(angle);ctx.translate(-242,-228);}
function drawFull(ctx,img) {ctx.drawImage(img,0,0,WIDTH,HEIGHT);}
const loadedOutlawAssets=new Map();
export function loadOutlawAssets(base='./assets/') {
 const key=new URL(base,document.baseURI).href;
 if(loadedOutlawAssets.has(key))return loadedOutlawAssets.get(key);
 const pending=loadPreparedOutlawAssets(key).catch(error=>{loadedOutlawAssets.delete(key);throw error;});
 loadedOutlawAssets.set(key,pending);return pending;
}
async function loadPreparedOutlawAssets(base) {
 const load = src => new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=src;});
 const [art,plate]=await Promise.all([load(base+'outlaw-original.png'),load(base+'reel-clean-plate.png')]);
 return prepareOutlawAssets({art,plate},(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;});
}
export function prepareOutlawAssets(assets,makeCanvas) {
 const {art,plate}=assets;
 const background=makeCanvas(WIDTH,HEIGHT),bc=background.getContext('2d');drawFull(bc,plate);
 for(const r of [[0,0,484,229],[0,1237,484,211],[0,0,80,1448],[432,0,52,1448]])bc.drawImage(art,r[0]*art.width/WIDTH,r[1]*art.height/HEIGHT,r[2]*art.width/WIDTH,r[3]*art.height/HEIGHT,...r);
 const figure=makeCanvas(WIDTH,HEIGHT),fc=figure.getContext('2d');
 for(const polygon of [rope,outline]){fc.save();path(fc,polygon);fc.clip();drawFull(fc,art);fc.restore();}
 const type=makeCanvas(WIDTH,HEIGHT),tc=type.getContext('2d');
 // Preserve the source letter contours instead of painting a replacement outline.
 for(const polygon of glyphs){path(tc,polygon);tc.fillStyle='#fff';tc.fill();tc.lineWidth=22;tc.lineJoin='round';tc.strokeStyle='#fff';tc.stroke();}
 tc.globalCompositeOperation='source-in';drawFull(tc,art);tc.globalCompositeOperation='source-over';
 // The supplied art has a sample ×16 baked into the figure. Mask it out for
 // other live values; the original artwork/type are retained pixel-for-pixel at ×16.
 const figureLive=makeCanvas(WIDTH,HEIGHT),lc=figureLive.getContext('2d');
 drawFull(lc,figure);lc.save();path(lc,outline);lc.clip();
 // The concealed part of the coat remains in deep ink shadow under the live
 // lettering. Keep the original silhouette instead of adding a rectangular UI plate.
 lc.fillStyle=lc.strokeStyle='#211a13';
 for(const polygon of glyphs){path(lc,polygon);lc.fill();lc.lineWidth=28;lc.lineJoin='round';lc.stroke();}
 lc.restore();
 return {...assets,background,figure,figureLive,type,makeCanvas,numbers:new Map()};
}
export function motionAt(time, mode='idle') {
 let y=0,angle=0,visibility=1;
 if(mode==='idle') angle=0.0124*Math.sin(TAU*(time+ENTRANCE_DURATION-0.69)/PERIOD);
 else {
  const dropStart=0.14,catchTime=0.69;
  if(time<dropStart) {y=-1280;visibility=0;}
  else if(time<catchTime) {let u=(time-dropStart)/(catchTime-dropStart);y=-1280*(1-u*u);}
  else {const s=time-catchTime,settle=1-smooth(1.7,ENTRANCE_DURATION,time);y=21*Math.exp(-6.4*s)*Math.sin(18*s)*settle;angle=(0.028*Math.exp(-1.8*s)*settle+0.0124)*Math.sin(TAU*s/PERIOD);}
 }
 return {y,angle,visibility};
}
export function stepMotionAt(time){
 const S=WILD_STEPS,t=Math.max(0,time);
 const row=Math.min(S.rows-1,Math.max(0,Math.floor((t-S.lead)/(S.travel+S.hold))));
 const start=S.lead+row*(S.travel+S.hold),u=Math.max(0,Math.min(1,(t-start)/S.travel));
 const progress=(row+Math.pow(u,2.15))/S.rows,age=t-WILD_LANDINGS[row];
 const recoil=age>=0&&age<.08?18*Math.sin(age/.08*Math.PI*2)*Math.exp(-age*38):0;
 const caught=Math.max(0,t-WILD_LANDINGS[3]);
 return {offset:-HEIGHT+progress*HEIGHT+recoil,front:progress*HEIGHT,row,age,
  claimed:WILD_LANDINGS.filter(at=>t>=at).length,
  impact:age>=0&&age<.14?Math.pow(1-age/.14,2):0,
  angle:(.024*Math.exp(-caught*2.2)+.0124)*Math.sin(TAU*caught/PERIOD),
  entering:t<WILD_ENTRY_END,progress};
}
export function drawOutlaw(ctx, assets, time, mode='idle', options={}) {
 const {background,figure,type}=assets,stepped=mode==='steps',step=stepped?stepMotionAt(time):null;
 const state=stepped?{y:0,angle:step.angle,visibility:1}:motionAt(time,mode);
 if(options.reduced){state.y=0;state.angle=0;state.visibility=1;}
 const value=Math.max(1,Math.round(options.multiplier??16));
 ctx.save();
 if(options.rect){
  const {x,y,w,h}=options.rect,scale=Math.min(w/388,h/HEIGHT);
  ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();
  ctx.translate(x+(w-388*scale)/2-48*scale,y+(h-HEIGHT*scale)/2);ctx.scale(scale,scale);
 }else{ctx.scale(ctx.canvas.width/WIDTH,ctx.canvas.height/HEIGHT);ctx.clearRect(0,0,WIDTH,HEIGHT);}
 if(stepped&&options.reduced)ctx.globalAlpha*=smooth(0,.16,time);
 ctx.save();
 if(stepped&&!options.reduced)ctx.translate(0,step.offset);
 drawFull(ctx,background);
 ctx.save();ctx.beginPath();ctx.rect(80,228,352,1009);ctx.clip();
 if(state.visibility) {
  ctx.save();transform(ctx,state.y,state.angle);
  drawFull(ctx,stepped?assets.figureLive:value===16?figure:assets.figureLive);
  ctx.restore();
  // The multiplier follows the drop vertically, then remains fixed as the cowboy swings.
  ctx.save();ctx.translate(0,state.y);
  if(stepped){const punch=options.reduced?1:1+.085*step.impact;ctx.translate(255,960);ctx.scale(punch,punch);ctx.translate(-255,-960);}
  if(value===16)drawFull(ctx,type);else ctx.drawImage(multiplierLayer(assets,value),0,700);ctx.restore();
 }
 ctx.restore();ctx.restore();
 ctx.restore();
}

function multiplierLayer(assets,value){
 if(assets.numbers.has(value)){const cached=assets.numbers.get(value);assets.numbers.delete(value);assets.numbers.set(value,cached);return cached;}
 // Only the lettering band needs storage; preserve its original pixel coordinates.
 const layer=assets.makeCanvas(WIDTH,448),ctx=layer.getContext('2d');ctx.translate(0,-700);
 // Match the supplied oversized, dark-outlined ivory lettering with no UI box.
 const digits=String(value);let size=228;
 ctx.font=`${size}px Outlaw,Western,Georgia,serif`;
 const measure=()=>{ctx.font=`${size}px Outlaw,Western,Georgia,serif`;const n=ctx.measureText(digits).width;ctx.font=`${size*.54}px Outlaw,Western,Georgia,serif`;return n+ctx.measureText('x').width+10;};
 size*=Math.min(1,320/measure());const width=measure(),left=255-width/2;
 ctx.fillStyle='#efe0bf';ctx.strokeStyle='#211a13';ctx.lineJoin='round';ctx.textBaseline='alphabetic';ctx.lineWidth=22;
 ctx.font=`${size*.54}px Outlaw,Western,Georgia,serif`;const xw=ctx.measureText('x').width;
 ctx.strokeText('x',left,1017);ctx.fillText('x',left,1017);
 ctx.font=`${size}px Outlaw,Western,Georgia,serif`;ctx.strokeText(digits,left+xw+10,1042);ctx.fillText(digits,left+xw+10,1042);
 if(assets.numbers.size>=16){const oldest=assets.numbers.keys().next().value,expired=assets.numbers.get(oldest);expired.width=expired.height=1;assets.numbers.delete(oldest);}
 assets.numbers.set(value,layer);return layer;
}
