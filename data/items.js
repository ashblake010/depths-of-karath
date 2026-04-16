// rarity: 0=Common 1=Uncommon 2=Rare 3=Epic 4=Legendary
// type: weapon armor ring consumable
const ITEMS_DATA=[
  // ── WEAPONS ──
  {id:'w01',name:'Rusty Dagger',   type:'weapon',rarity:0,minFloor:1, atk:2, icon:'weapon',effect:null,       desc:'A worn blade. Better than nothing.'},
  {id:'w02',name:'Short Sword',    type:'weapon',rarity:0,minFloor:1, atk:3, icon:'weapon',effect:null,       desc:'Standard-issue dungeon gear.'},
  {id:'w03',name:'Iron Mace',      type:'weapon',rarity:0,minFloor:2, atk:4, icon:'weapon',effect:null,       desc:'Crushes bone with ease.'},
  {id:'w04',name:'Steel Blade',    type:'weapon',rarity:1,minFloor:3, atk:5, icon:'weapon',effect:null,       desc:'Well-forged steel, reliable.'},
  {id:'w05',name:"Viper's Fang",   type:'weapon',rarity:1,minFloor:3, atk:4, icon:'weapon',effect:'poison',   desc:'Coated in cave-spider venom.'},
  {id:'w06',name:'Battle Axe',     type:'weapon',rarity:1,minFloor:4, atk:6, icon:'weapon',effect:null,       desc:'Heavy but devastating.'},
  {id:'w07',name:'Frost Shard',    type:'weapon',rarity:2,minFloor:4, atk:5, icon:'weapon',effect:'freeze',   desc:'Chills foes to the bone.'},
  {id:'w08',name:'Flame Tongue',   type:'weapon',rarity:2,minFloor:5, atk:6, icon:'weapon',effect:'burn',     desc:'Burns with sorcerous fire.'},
  {id:'w09',name:'Shadow Blade',   type:'weapon',rarity:2,minFloor:6, atk:7, icon:'weapon',effect:null,       desc:'Strikes from the void itself.'},
  {id:'w10',name:'Void Reaper',    type:'weapon',rarity:3,minFloor:7, atk:9, icon:'weapon',effect:null,       desc:'Tears flesh and spirit alike.'},
  {id:'w11',name:'Stormcaller',    type:'weapon',rarity:3,minFloor:7, atk:8, icon:'weapon',effect:'stun',     desc:'Crackling with lightning.'},
  {id:"w12",name:"Dragon's Fang",  type:'weapon',rarity:4,minFloor:8, atk:12,icon:'weapon',effect:'burn',     desc:'Torn from a dragon\'s jaw.'},
  {id:'w13',name:'Soul Eater',     type:'weapon',rarity:4,minFloor:9, atk:11,icon:'weapon',effect:'drain',    desc:'Devours the souls of the slain.'},

  // ── ARMOR ──
  {id:'a01',name:'Leather Vest',   type:'armor', rarity:0,minFloor:1, def:2, icon:'armor', effect:null,       desc:'Tanned hide. Offers some protection.'},
  {id:'a02',name:'Chain Mail',     type:'armor', rarity:0,minFloor:2, def:3, icon:'armor', effect:null,       desc:'Interlocked iron rings.'},
  {id:'a03',name:'Iron Chestplate',type:'armor', rarity:1,minFloor:3, def:4, icon:'armor', effect:null,       desc:'Solid iron forging.'},
  {id:'a04',name:'Steel Armor',    type:'armor', rarity:1,minFloor:4, def:5, icon:'armor', effect:null,       desc:'Heavy but highly protective.'},
  {id:'a05',name:'Shadow Cloak',   type:'armor', rarity:2,minFloor:5, def:4, atk:2,icon:'armor',effect:null,  desc:'+2 ATK from hidden pockets.'},
  {id:'a06',name:'Dragon Scale',   type:'armor', rarity:3,minFloor:7, def:8, icon:'armor', effect:null,       desc:'Scales of a slain dragon.'},
  {id:'a07',name:'Void Plate',     type:'armor', rarity:4,minFloor:8, def:10,icon:'armor', effect:null,       desc:'Forged in the void between worlds.'},

  // ── RINGS ──
  {id:'r01',name:'Ring of Vitality',  type:'ring',rarity:0,minFloor:1, hp:15, icon:'ring',effect:null,        desc:'+15 max HP.'},
  {id:'r02',name:'Ring of Strength',  type:'ring',rarity:0,minFloor:2, atk:2, icon:'ring',effect:null,        desc:'+2 ATK.'},
  {id:'r03',name:'Ring of Protection',type:'ring',rarity:1,minFloor:3, def:2, icon:'ring',effect:null,        desc:'+2 DEF.'},
  {id:'r04',name:"Berserker's Ring",  type:'ring',rarity:1,minFloor:4, atk:4, def:-1,icon:'ring',effect:null, desc:'+4 ATK, -1 DEF. Risk it.'},
  {id:'r05',name:'Ring of Regeneration',type:'ring',rarity:2,minFloor:5,hp:25,icon:'ring',effect:'regen',     desc:'+25 HP, regenerate 1 HP/turn.'},
  {id:'r06',name:'Curse Ward',        type:'ring',rarity:2,minFloor:5, icon:'ring',effect:'curse_immune',     desc:'Immune to curse effect.'},
  {id:'r07',name:'Ring of Karath',    type:'ring',rarity:4,minFloor:9, atk:5,def:5,hp:30,icon:'ring',effect:null,desc:'The dark lord\'s own signet.'},

  // ── CONSUMABLES ──
  {id:'c01',name:'Health Potion',    type:'consumable',rarity:0,minFloor:1, icon:'potion',effect:'heal_20',   desc:'Restores 20 HP.'},
  {id:'c02',name:'Large Health Potion',type:'consumable',rarity:1,minFloor:2,icon:'potion',effect:'heal_40',  desc:'Restores 40 HP.'},
  {id:'c03',name:'Full Restore',     type:'consumable',rarity:2,minFloor:5, icon:'potion',effect:'heal_full', desc:'Fully restores HP.'},
  {id:'c04',name:'Antidote',         type:'consumable',rarity:0,minFloor:2, icon:'potion',effect:'cure_poison',desc:'Cures poison immediately.'},
  {id:'c05',name:'Clarity Scroll',   type:'consumable',rarity:1,minFloor:3, icon:'scroll',effect:'reset_skill',desc:'Resets your class skill cooldown.'},
  {id:'c06',name:'Bomb',             type:'consumable',rarity:1,minFloor:3, icon:'bomb',  effect:'bomb_30',   desc:'Deals 30 damage. Ignores DEF.'},
  {id:'c07',name:'Smoke Canister',   type:'consumable',rarity:1,minFloor:4, icon:'bomb',  effect:'flee',      desc:'Escape from combat instantly.'},
  {id:'c08',name:'Blessing Scroll',  type:'consumable',rarity:2,minFloor:5, icon:'scroll',effect:'buff_atk',  desc:'+5 ATK for 3 combat turns.'},
  {id:'c09',name:'Shield Scroll',    type:'consumable',rarity:2,minFloor:5, icon:'scroll',effect:'buff_def',  desc:'+5 DEF for 3 combat turns.'},
  {id:'c10',name:'Soul Shard',       type:'consumable',rarity:3,minFloor:6, icon:'scroll',effect:'xp_50',     desc:'Contains 50 XP worth of essence.'},
];

// Rarity colors for UI
const RARITY_COLOR=['#aaa','#4fc','#69f','#c4f','#fa0'];
const RARITY_NAME=['Common','Uncommon','Rare','Epic','Legendary'];
