// Blood Money street composition in game units. Shared by sprites and muzzle effects.
export const BLOOD_STAGE=Object.freeze({
 hero:Object.freeze({x:16,y:37,scale:.88}),
 enemy:Object.freeze({cx:1095,ground:590,scale:1.30})
});
export function bloodHeroPoint(x,y){const h=BLOOD_STAGE.hero;return {x:h.x+x*h.scale,y:h.y+y*h.scale};}
