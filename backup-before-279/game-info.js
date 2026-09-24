// Read-only game information. All numerical rules are read from the live math module.
import * as M from './math.js?v=23';

const names={bandit:'Outlaw',star:'Sheriff badge',guns:'Revolver',cuffs:'Bear trap',bottle:'Poison bottle',a:'A',k:'K',q:'Q',j:'J',ten:'10',skull:'Skull Wild',scatter:'Scatter'};
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number=n=>n.toLocaleString('en-US',{maximumFractionDigits:2});
const usd=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n);
export const INFO_ORDER=['paytable','pay-ways','tumbles','free-spins','special-symbols','bet-modes','feature-buys','rtp','max-win','results','controls','notice'];
export const INFO_ICONS={
 spin:'<path d="M26 12a10 10 0 1 0 1 12M26 5v8h-8"/>',
 info:'<circle cx="16" cy="16" r="12"/><path d="M16 14v9M16 9v1"/>',
 sound:'<path d="M5 12h6l7-6v20l-7-6H5zM23 11q6 5 0 10"/>',
 turbo:'<path d="M19 3 7 18h9l-3 11 12-16h-9z"/>',
 auto:'<path d="M26 12a10 10 0 0 0-18-3M7 4v7h7M6 20a10 10 0 0 0 18 3m1 5v-7h-7"/><path d="m14 12 6 4-6 4z"/>',
 bet:'<path d="M5 9h22M5 23h22M16 4v10"/>',
 motion:'<path d="M3 9h18q8 0 5-5M3 16h24M3 23h16q7 0 5 5"/>',
 fullscreen:'<path d="M4 12V4h8m8 0h8v8m0 8v8h-8m-8 0H4v-8"/>',
 close:'<path d="m8 8 16 16M24 8 8 24"/>'
};
export const infoIcon=key=>`<svg viewBox="0 0 32 32" aria-hidden="true">${INFO_ICONS[key]||INFO_ICONS.info}</svg>`;

export function infoModel(baseBet=1){
 const bet=Number.isFinite(baseBet)&&baseBet>0?baseBet:1;
 const paytable=['bandit','star','guns','cuffs','bottle','a','k','q','j','ten'].map(symbol=>({symbol,name:names[symbol],rows:[6,5,4,3].map(reels=>({reels,multiplier:M.PAYS[symbol][reels-3]/10}))}));
 const modes=[
  {id:'normal',title:'Base spins',cost:M.SPIN_COST.normal,boost:M.MODE_RULES.normal.boost,description:'Standard spins with tumbles, boxed Wilds, Outlaw Wilds and scatter-triggered free spins. MAX coins never appear.'},
  {id:'boost',title:'Bounty Booster',cost:M.SPIN_COST.boost,boost:M.MODE_RULES.boost.boost,art:'assets/shop/bounty-booster.webp',description:`${M.BOUNTY_FEATURE_MULTIPLIER}× the base-spin chance of triggering a bonus. Tumbles and both Wild types remain available. MAX coins never appear.`},
  {id:'trickster',title:'Trickster Spins',cost:M.SPIN_COST.trickster,boost:M.MODE_RULES.trickster.boost,art:'assets/shop/outlaw-spin.webp',description:`High volatility: most paid spins return nothing. Smaller returns occur alongside occasional larger wins. A payout can be less than the spin cost. Each reel position starts at 1×. A paying square uses its current multiplier, then doubles once for the next tumble: 1× → 2× → 4× → 8× and onward. The corner badge stays in that position as symbols fall or are replaced. Multipliers from the positions in each individual winning way multiply together; for example, 2×, 2× and 2× add an 8× multiplier to that way. Different ways are then added. Nonpaying squares do not increase. The existing Win Boost and Outlaw Wild multiplier also apply. All position multipliers reset for each new paid spin and do not carry into awarded free spins. Ordinary Trickster returns before an awarded feature are at most ${number(M.MODE_RULES.trickster.pathCeiling/M.SPIN_COST.trickster)}× the spin cost. MAX and awarded free spins can pay more, up to the overall round limit. MAX can appear and connect.`},
  {id:'allin',title:'All In Spins',cost:M.SPIN_COST.allin,boost:M.MODE_RULES.allin.boost,art:'assets/shop/all-in-spin.webp',description:'High volatility: most paid spins return nothing, with occasional larger wins. Returns can be less than the full spin cost. Ordinary payouts receive the Win Boost shown below. Outlaw’s Mark can turn every visible match of one marked regular symbol into a boxed Wild with one shot. MAX can appear and connect. Boxed Wilds, Outlaw Wilds, tumbles and scatter-triggered features remain available.'}
 ];
 const buys=[
  {id:'dead',title:'Blood Money',art:'assets/shop/blood-money.webp',cost:M.BUY_COST.dead,description:`Awards ${M.TRIGGER.spins[3]} free spins starting at 1× Win Boost. The Rustler, the Gunfighter and the Ringleader are the wanted cowboys. Each winning tumble containing the current wanted cowboy earns one stamp, regardless of the number of portraits, shots or ways. Three stamps defeat the Rustler and advance to the Gunfighter, then defeat the Gunfighter and advance to the Ringleader. Each advance awards +2 free spins and one independent multiplier roll: 2× (69.5%), 4× (20%), 6× (7%), 8× (2.5%) or 10× (1%). Keep the higher of the current multiplier and the rolled value; it never decreases. Both awards can extend the eight starting spins to twelve. These portraits use the Poison Bottle, Revolver and Outlaw paytable entries respectively. At the Ringleader tier, upgrades are complete; paying Ringleaders still get shot and pay normally. Existing wins pay before the upgrade; surviving symbols and refills use the new symbol on the next tumble. Progress carries between all awarded spins and resets when the feature ends. A Wild-only combination does not earn a stamp. MAX cannot connect in this feature.`},
  {id:'deader',title:'Hang ’Em High',art:'assets/shop/no-mercy.webp',cost:M.BUY_COST.deader,description:"Awards twelve free spins. Capture up to three permanent full-reel Outlaw Wilds starting at ×8; the first arrives by spin 3. Each winning tumble through a captured Outlaw earns that Outlaw one stamp, once per reel regardless of the number of winning cells or ways. Three stamps double its multiplier up to ×64; surplus stamps carry forward. The win that earns an upgrade pays at the old multiplier; subsequent boards use the new one. Capturing all three unlocks The Last Sentence: contributing wins earn two stamps, and a temporary fourth ×8 Outlaw can appear on later spins. It survives that spin’s tumbles, earns no stamps, then leaves. Further capture events can also double a permanent multiplier. All active Outlaw multipliers add together; there is no additional feature Win Boost. Symbol groups require a regular matching symbol to pay. Three or more visible scatters on the final settled unlocked board add +3 spins, once per spin, up to four retriggers (24 spins total). Permanent Outlaws survive all spins, tumbles and retriggers. MAX is inactive. The closing bounty shares split each already-paid win equally between contributing Outlaws; these shares are included in the total, not additional awards. All progress resets after the feature."},
  {id:'outlaws',title:'Hell to Pay',art:'assets/shop/hell-to-pay.webp',cost:M.BUY_COST.outlaws,description:'One tumble round starting with three full-reel Outlaw Wilds. Highest volatility of the three feature buys; it can return nothing. This is not a free-spin package. MAX cannot connect.'}
 ];
 const rtps=[...modes.map(m=>({id:m.id,title:m.title,value:M.targetRTP(m.id)*100})),...buys.map(b=>({id:b.id,title:b.title,value:M.targetRTP(b.id==='dead'?'deadbuy':b.id==='deader'?'deaderbuy':b.id)*100}))];
 const commonRTP=rtps.every(r=>r.value===rtps[0].value)?rtps[0].value:null;
 return {bet,paytable,modes,buys,rtps,rtp:commonRTP,max:M.MAX_AWARD,reels:M.REELS,rows:M.ROWS,
  free:[
   {count:3,title:'Blood Money',spins:M.TRIGGER.spins[3],boost:1,boostLabel:'1× · UP TO 10×',art:'assets/shop/blood-money.webp',description:'Three scatters on the final settled board award Blood Money. Paying wanted cowboys earn one stamp per tumble: three stamps upgrade the Rustler to the Gunfighter, then the Gunfighter to the Ringleader for the remaining feature. Each advance adds two free spins and rolls a multiplier up to 10×, keeping your best result. 2× is most common; 10× has a 1% chance per roll. The opening film can be skipped. Bounty Closed shows the settled feature total before returning to base spins. MAX cannot connect in these free spins.'},
   {count:4,title:'Hang ’Em High',spins:M.TRIGGER.spins[4],boost:M.MODE_RULES.deaderfree.boost,art:'assets/shop/no-mercy.webp',description:"Four scatters trigger the same Hang Em High feature as the purchase. Awards twelve free spins. Capture up to three permanent full-reel Outlaw Wilds starting at ×8; the first arrives by spin 3. Each winning tumble through a captured Outlaw earns that Outlaw one stamp, once per reel regardless of the number of winning cells or ways. Three stamps double its multiplier up to ×64; surplus stamps carry forward. The win that earns an upgrade pays at the old multiplier; subsequent boards use the new one. Capturing all three unlocks The Last Sentence: contributing wins earn two stamps, and a temporary fourth ×8 Outlaw can appear on later spins. It survives that spin’s tumbles, earns no stamps, then leaves. Further capture events can also double a permanent multiplier. All active Outlaw multipliers add together; there is no additional feature Win Boost. Symbol groups require a regular matching symbol to pay. Three or more visible scatters on the final settled unlocked board add +3 spins, once per spin, up to four retriggers (24 spins total). Permanent Outlaws survive all spins, tumbles and retriggers. MAX is inactive. The closing bounty shares split each already-paid win equally between contributing Outlaws; these shares are included in the total, not additional awards. All progress resets after the feature."},
   {count:5,title:'Hell to Pay · MAX active',spins:M.TRIGGER.spins[5],boost:M.MODE_RULES.maxfree.boost,art:'assets/shop/hell-to-pay.webp',description:'Five or more scatters award Hell to Pay with MAX enabled. The confirmed free-spin award is shown after the five-scatter burn and Hell to Pay introduction.'}
  ]};
}

function tile(symbol,label=names[symbol]){
 if(symbol==='scatter')return `<span class="info-tile" role="img" aria-label="${escape(label)}" style="background-image:url('assets/scatters/condemned.png');background-size:contain;background-position:center;background-color:#180c0b"></span>`;
 const i=M.SYMBOLS.indexOf(symbol);
 return `<span class="info-tile" role="img" aria-label="${escape(label)}" style="background-position:${i%6*20}% ${i<6?0:100}%"></span>`;
}
const art=(src,extra='')=>`<img class="info-art ${extra}" src="${escape(src)}" alt="" loading="lazy" decoding="async" draggable="false">`;
const paragraph=s=>`<p>${escape(s)}</p>`;
const section=(id,title,body)=>`<section class="info-section" id="info-${id}" aria-labelledby="info-title-${id}"><h2 id="info-title-${id}">${escape(title)}</h2>${body}</section>`;
const row=(visual,title,body)=>`<article class="info-rule-row"><div class="info-rule-art">${visual}</div><div><h3>${escape(title)}</h3>${body}</div></article>`;

export function infoHTML(model=infoModel()){
 const m=model;
 const top=`<div class="info-special-grid">
  <article>${art('assets/wilds/boxed-wild.png')}<h3>BOXED WILD</h3><p>Single-square substitute</p></article>
  <article>${art('assets/outlaw-hanging/outlaw-original.png','info-poster')}<h3>OUTLAW WILD</h3><p>Full reel · multiplier</p></article>
  <article>${art('assets/tokens/max.png?v=gold2')}<h3>MAX</h3><p>${number(m.max)}× round cap</p></article></div>`;
 const pays=`<p class="info-pay-note">Pays are <b>multiples of the base bet, per way</b>, before Win Boost and Outlaw Wild multipliers.</p><div class="info-pay-grid">${m.paytable.map(p=>`<article class="info-pay-card" data-symbol="${p.symbol}">${tile(p.symbol)}<h3>${escape(p.name)}</h3><table aria-label="${escape(p.name)} paytable"><thead><tr><th scope="col">REELS</th><th scope="col">PAY</th></tr></thead><tbody>${p.rows.map(v=>`<tr><th scope="row">${v.reels}</th><td>${number(v.multiplier)}×</td></tr>`).join('')}</tbody></table></article>`).join('')}</div>`;
 const free=m.free.map(f=>row(art(f.art),f.title,`<p class="info-fact">${f.count}${f.count===5?'+':''} SCATTERS · ${f.spins} FREE SPINS · ${f.boostLabel||f.boost+'×'} WIN BOOST</p>${paragraph(f.description)}`)).join('');
 const special=[
  row(art('assets/wilds/boxed-wild.png'),"Outlaw’s Mark",paragraph('All In paid spins only. After the reels land, one regular symbol can be marked with red crosshairs. The gunslinger fires once and all visible matching symbols turn into boxed Wilds together, then the board is evaluated. An Outlaw Wild covering a position takes precedence; Scatter, MAX, dynamite and existing Wilds are not marked.')+paragraph('Converted Wilds substitute for ordinary paying symbols and follow the normal tumble rules. The 50× All In Win Boost and any Outlaw Wild multiplier apply to ordinary wins. Mark has no separate cash award and does not guarantee a payout.')),
  row(art('assets/bomb/tnt.png'),'Dynamite Refill',paragraph('Can appear in every spin mode and feature. Existing wins pay first, then dynamite blasts ordinary symbols in a 3 × 3 area. Scatters, single-square Wilds, nonpaying Outlaw Wild reels and MAX coins survive the blast. Fresh symbols fall into the gaps at no additional stake and are evaluated for wins. New dynamite can trigger another blast. Dynamite has no separate symbol payout and a refill can return nothing.')),
  row(tile('scatter'),'Scatter',paragraph('Scatters are counted after the last tumble, anywhere on the board. They do not substitute or pay a separate symbol award. Blood Money awards +2 spins for each of its two target advances. Hang ’Em High can retrigger with scatters under its feature rules.')),
  row(tile('skull'),'Skull Wild',paragraph('Substitutes for all ordinary paying symbols. It does not substitute for Scatter or MAX and has no multiplier or separate paytable award.')),
  row(art('assets/wilds/boxed-wild.png'),'Quick-draw boxed Wilds',paragraph('After the reels land, the gunslinger can shoot 2–4 individual squares into boxed Wilds. Each replaces an ordinary symbol and substitutes for paying symbols. They never replace Scatter or MAX, never expand and have no multiplier of their own. They can win or miss.')),
  row(art('assets/outlaw-hanging/outlaw-original.png','info-poster'),'Outlaw Wilds',paragraph('Expands to cover all four rows of a reel. Each row below the first doubles its multiplier: for example, 1× → 2× → 4× → 8×. Outlaw Wilds can appear in every spin mode and feature.')+paragraph('Add all active Outlaw Wild multipliers together. That total multiplies ordinary wins on the board; without an Outlaw Wild, this multiplier is 1×. A paying Outlaw Wild normally clears with the winning symbols; a nonpaying one remains for the next tumble. In Hang ’Em High, captured Outlaw Wilds remain locked for the entire feature.')),
  row(art('assets/tokens/max.png?v=gold2'),'MAX coin',paragraph(`In an eligible mode, MAX acts as a Wild. If it participates in a paying ways combination, the purchased round ends at a total return of ${number(m.max)}× base bet, including amounts already returned.`)+paragraph('MAX can connect only in Trickster Spins, All In Spins and free spins awarded by five or more scatters. It never appears in base spins or Bounty Booster. It cannot connect on a board with three or more scatters. A visible coin outside a paying connection awards nothing.')+paragraph('Coins may appear in other features but are inactive there: they do not substitute or pay. An Outlaw Wild covering a coin does not activate it.'))
 ].join('');
 const modes=m.modes.map(mode=>row(mode.art?art(mode.art):tile('guns'),mode.title,`<p class="info-fact">${number(mode.cost)}× BASE BET PER SPIN · ${usd(mode.cost*m.bet)} AT YOUR BET</p>${paragraph(mode.description)}<p>Win Boost: <b>${mode.boost}×</b>. Cost is charged once per spin; its tumbles cost nothing extra.</p>`)).join('');
 const buys=m.buys.map(b=>row(art(b.art),b.title,`<p class="info-fact">${number(b.cost)}× BASE BET · ${usd(b.cost*m.bet)} AT YOUR BET</p>${paragraph(b.description)}`)).join('');
 const controls=[
  ['spin','Spin','Starts one round at the selected mode’s cost. Space also spins when no menu is open.'],
  ['info','Information','Opens this guide. Scroll to read; use the cross or Escape to return to the game. Opening Info stops autoplay.'],
  ['bet','Base bet','The up/down arrows change the base bet. Enhanced-spin costs and feature-buy prices follow this amount.'],
  ['turbo','Turbo','Changes presentation speed. It does not change the result, paytable or RTP.'],
  ['auto','Autoplay','Starts up to 10 paid demo spins. Press again to stop subsequent spins. A triggered free-spin feature stops autoplay.'],
  ['sound','Sound & music','The sound setting mutes or enables both the soundtrack and effects.'],
  ['motion','Background motion','Turns environmental and idle-character motion on or off. Reduced-motion preferences are also respected.'],
  ['fullscreen','Fullscreen','Enters or leaves fullscreen. If the browser blocks native fullscreen, expands the game within the page; use the fullscreen button or Escape to leave.']
 ].map(([icon,title,text])=>row(infoIcon(icon),title,paragraph(text))).join('')+row(art('assets/ui/godless-crow.png'),'The crow’s offers',paragraph('Opens enhanced spins and feature buys. Activate one enhanced mode at a time; selecting it again returns to base spins. Pressing Buy Feature charges the price and starts the feature immediately.'));
 return section('paytable','PAY TABLE',`<p class="info-current-bet">BASE BET <b>${usd(m.bet)}</b></p>${top}${pays}`)+
  section('pay-ways','PAY WAYS',paragraph(`${m.reels} reels, ${m.rows} rows. Matching symbols pay on three or more consecutive reels, starting from the leftmost reel. Row position does not matter. Each ordinary symbol pays for its longest matching run; different symbol wins are added together.`)+paragraph('Count the matching positions on each reel in the run, then multiply those counts to get the number of ways. Wild positions count as matches.')+`<div class="info-example"><strong>2 × 1 × 3 = 6 WAYS</strong><p>For example, two As on reel 1, one on reel 2 and three on reel 3 make six winning ways, if the run ends there.</p></div>`+paragraph('Ordinary win = paytable value × base bet × ways × Win Boost × total Outlaw Wild multiplier. MAX uses the round-cap rule below.'))+
  section('tumbles','TUMBLES',paragraph('Paying symbols are marked with blood, then clear. Surviving symbols fall into the gaps and new symbols enter. The board pays again if it forms another winning combination. This repeats until neither a paying combination nor dynamite remains, or the round cap is reached.')+paragraph('Tumbles are available in every spin mode and feature, with no additional stake. Surviving boxed Wilds fall like ordinary symbols. A tumble sequence may finish with no further win.'))+
  section('free-spins','FREE SPINS',free+paragraph('Every awarded spin can tumble and receive Outlaw Wilds or boxed Wilds. The feature’s own Win Boost applies during its free spins; the triggering spin’s boost does not carry over. Free spins do not cost an additional stake.'))+
  section('special-symbols','SPECIAL SYMBOLS',special)+
  section('bet-modes','BET MODES',paragraph('The minimum base bet is $0.01. Mode costs and feature prices are rounded to the nearest cent. Sub-cent awards accumulate across a tumble sequence before cent rounding.')+modes+paragraph('Enhanced modes remain selected until deactivated or another mode is chosen. A return can be smaller than the full spin cost, including in Trickster and All In.'))+
  section('feature-buys','FEATURE BUYS',buys+paragraph('These are one-time purchases. All payouts still use the base bet, not the purchase price. The total return can be less than the purchase cost.'))+
  section('rtp','RETURN TO PLAYER',(m.rtp===null?'':`<p class="info-large-number">${m.rtp.toFixed(2)}%</p>`)+paragraph('Each figure includes the complete purchased round: all tumbles and any awarded free spins. Feature-buy RTP uses the full purchase price, not the base bet.')+`<table class="info-rtp-table"><thead><tr><th scope="col">MODE OR BUY</th><th scope="col">RTP</th></tr></thead><tbody>${m.rtps.map(r=>`<tr><th scope="row">${escape(r.title)}</th><td>${r.value.toFixed(2)}%</td></tr>`).join('')}</tbody></table>`+paragraph('The figures above are the model targets before currency rounding. Cent rounding can change the effective return at very small bets.')+paragraph('RTP is a long-run average, not a promised return for an individual round or session. Volatility describes how widely results vary; lower volatility does not guarantee a profit or a minimum return.'))+
  section('max-win','MAXIMUM WIN',`<p class="info-large-number">${number(m.max)}×</p>`+paragraph(`The total return from one purchased round cannot exceed ${number(m.max)}× base bet (${usd(m.max*m.bet)} at your current base bet). This includes all tumbles and any free spins awarded by that round. Once the cap is reached, the round ends and no further free spins are played.`)+paragraph('This is a cap, not a promise that every mode can reach it. MAX coin eligibility is described under Special Symbols.'))+
  section('results','READING YOUR RESULT',paragraph('ROUND RETURN is the total paid back during the purchased round. NET is that return minus the full amount charged for the round. A positive return is not necessarily a profit.')+paragraph('BALANCE shows available demo credits. BET shows the base bet. WIN shows the amount returned in the current round. Mode costs and purchase prices are multiples of the base bet.'))+
  section('controls','USER INTERFACE GUIDE',controls)+
  section('notice','GAME NOTICE',paragraph('Sick & Twisted · Godless Slots. This version uses USD demo credits only. There are no deposits, withdrawals or cash prizes. Refreshing the page or using Reset starts a new demo balance; interrupted rounds are not restored.')+paragraph('The stated RTP describes this demo’s mathematical model. This demo has not been certified for real-money play.')+`<button class="info-return" type="button" data-info-close>RETURN TO GAME</button>`);
}

// Coordinates are viewport-based because native modal dialogs live in the top layer.
export function infoBounds(rect,viewport){
 const safe=viewport.safe||{},left=(viewport.left||0)+Math.max(8,safe.left||0),top=(viewport.top||0)+Math.max(8,safe.top||0);
 const right=(viewport.left||0)+viewport.width-Math.max(8,safe.right||0),bottom=(viewport.top||0)+viewport.height-Math.max(8,safe.bottom||0),compact=viewport.width<600||rect.height<340;
 const width=Math.max(0,compact?right-left:Math.min(rect.width,right-left)),height=Math.max(0,compact?bottom-top:Math.min(rect.height,bottom-top));
 return {left:compact?left:Math.max(left,Math.min(rect.left,right-width)),top:compact?top:Math.max(top,Math.min(rect.top,bottom-height)),width,height};
}

export function createGameInfo({dialog,content,closeButton,menuDialog,menuButton,infoButton,stage,getBet,beforeOpen=()=>{},window:win=window}){
 const apply=(el,box)=>Object.entries(box).forEach(([k,v])=>el.style[k]=v+'px');
 const viewport=()=>{const v=win.visualViewport,css=win.getComputedStyle?.(win.document?.querySelector('.safe-area-probe')||stage),safe={};for(const k of ['left','right','top','bottom'])safe[k]=parseFloat(css?.['padding'+k[0].toUpperCase()+k.slice(1)])||0;return {width:v?.width||win.innerWidth,height:v?.height||win.innerHeight,left:v?.offsetLeft||0,top:v?.offsetTop||0,safe};};
 function position(){
  if(dialog.open)apply(dialog,infoBounds(stage.getBoundingClientRect(),viewport()));
  if(menuDialog.open){const r=menuButton.getBoundingClientRect(),v=viewport(),area=infoBounds({width:v.width,height:0},v),w=Math.min(290,area.width);menuDialog.style.maxHeight=area.height+'px';apply(menuDialog,{width:w,left:Math.max(area.left,Math.min(r.left,area.left+area.width-w))});const h=menuDialog.getBoundingClientRect().height;menuDialog.style.top=Math.max(area.top,Math.min(r.top-h-8,area.top+area.height-h))+'px';}
 }
 const restore=()=>menuButton.focus({preventScroll:true});
 function close(){if(dialog.open)dialog.close();}
 function open(){
  if(dialog.open)return;
  beforeOpen();if(menuDialog.open)menuDialog.close();
  content.innerHTML=infoHTML(infoModel(getBet()));
  dialog.showModal();position();content.scrollTop=0;closeButton.focus({preventScroll:true});
 }
 function openMenu(){if(menuButton.disabled)return;if(menuDialog.open){menuDialog.close();return;}menuDialog.showModal();position();menuButton.setAttribute('aria-expanded','true');infoButton.focus({preventScroll:true});}
 function onKey(e){if(!dialog.open)return;if(e.code==='Space'||e.code==='Enter')e.stopPropagation();}
 function onContentClick(e){if(e.target.closest('[data-info-close]'))close();}
 const menuClose=()=>{menuButton.setAttribute('aria-expanded','false');if(!dialog.open)restore();};
 menuButton.addEventListener('click',openMenu);infoButton.addEventListener('click',open);closeButton.addEventListener('click',close);
 content.addEventListener('click',onContentClick);dialog.addEventListener('keydown',onKey);dialog.addEventListener('close',restore);
 menuDialog.addEventListener('close',menuClose);menuDialog.addEventListener('toggle',position,true);
 win.addEventListener('resize',position);win.addEventListener('scroll',position,{passive:true});
 win.visualViewport?.addEventListener('resize',position);win.visualViewport?.addEventListener('scroll',position,{passive:true});win.document?.addEventListener('fullscreenchange',position);
 return {open,close,position,openMenu};
}
