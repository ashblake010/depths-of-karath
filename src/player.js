// ── Player Module ──────────────────────────────────────────────────────────
const Player={
  create(classId){
    const cls=CLASSES[classId];
    return{
      classId,name:cls.name,symbol:cls.symbol,
      maxHp:cls.baseHp, hp:cls.baseHp,
      baseAtk:cls.baseAtk, baseDef:cls.baseDef,
      atk:cls.baseAtk, def:cls.baseDef,
      xp:0, level:1, xpNext:30,
      pendingPoints:0,
      skillCd:0,
      statusEffects:{},   // {poison:{turns}, burn:{turns}, freeze:{turns}, curse:{turns}, regen:{turns}}
      tempBuffs:{atk:0,def:0,atkTurns:0,defTurns:0},
      equipment:{weapon:null,armor:null,ring:null},
      inventory:[],       // max 15 items
      x:1, y:1,
      blocking:false,
      critNext:false,
    };
  },

  // recalculate atk/def from base + equipment
  recalcStats(p){
    let a=p.baseAtk, d=p.baseDef, h=0;
    const slots=['weapon','armor','ring'];
    for(const s of slots){
      const it=p.equipment[s];
      if(!it) continue;
      if(it.atk) a+=it.atk;
      if(it.def) d+=it.def;
      if(it.hp)  h+=it.hp;
    }
    p.atk=a; p.def=d;
    // ring hp bonus stored separately; maxHp = base + ring bonus + level bonuses
    const cls=CLASSES[p.classId];
    const levelHpBonus=(p.level-1)*10;
    p.maxHp=cls.baseHp + levelHpBonus + h;
    p.hp=Math.min(p.hp,p.maxHp);
  },

  gainXP(p,amount){
    p.xp+=amount;
    const msgs=[];
    while(p.xp>=p.xpNext){
      p.xp-=p.xpNext;
      p.level++;
      p.xpNext=Math.floor(p.xpNext*1.4);
      p.pendingPoints+=3;
      Player.recalcStats(p);
      p.hp=Math.min(p.hp+20,p.maxHp); // heal a bit on level up
      msgs.push(`Level ${p.level}!`);
    }
    return msgs;
  },

  allocPoint(p,stat){
    if(p.pendingPoints<=0) return false;
    if(stat==='hp'){
      const cls=CLASSES[p.classId];
      // we track base hp separately via level
      p.hp=Math.min(p.hp+10,p.maxHp+10);
      p.maxHp+=10;
    } else if(stat==='atk'){
      p.baseAtk+=2;
    } else if(stat==='def'){
      p.baseDef+=1;
    }
    Player.recalcStats(p);
    p.pendingPoints--;
    return true;
  },

  equip(p,item){
    // unequip old
    const slot=item.type==='weapon'?'weapon':item.type==='armor'?'armor':'ring';
    if(p.equipment[slot]){
      p.inventory.push(p.equipment[slot]);
    }
    p.equipment[slot]=item;
    p.inventory.splice(p.inventory.indexOf(item),1);
    Player.recalcStats(p);
    return `Equipped ${item.name}`;
  },

  useConsumable(p,item,inCombat){
    const e=item.effect;
    let msg='';
    if(e==='heal_20'){  const h=Math.min(20,p.maxHp-p.hp); p.hp+=h; msg=`Healed ${h} HP.`; }
    else if(e==='heal_40'){ const h=Math.min(40,p.maxHp-p.hp); p.hp+=h; msg=`Healed ${h} HP.`; }
    else if(e==='heal_full'){ const h=p.maxHp-p.hp; p.hp=p.maxHp; msg=`Healed ${h} HP.`; }
    else if(e==='cure_poison'){ delete p.statusEffects.poison; msg='Cured poison!'; }
    else if(e==='reset_skill'){ p.skillCd=0; msg='Skill cooldown reset!'; }
    else if(e==='bomb_30'){ return {msg:'Used Bomb!',damage:30}; }
    else if(e==='flee'){ return {msg:'Escaped!',flee:true}; }
    else if(e==='buff_atk'){ p.tempBuffs.atk=5; p.tempBuffs.atkTurns=3; msg='+5 ATK for 3 turns!'; }
    else if(e==='buff_def'){ p.tempBuffs.def=5; p.tempBuffs.defTurns=3; msg='+5 DEF for 3 turns!'; }
    else if(e==='xp_50'){ const lvMsgs=Player.gainXP(p,50); msg='Gained 50 XP! '+lvMsgs.join(' '); }
    else msg=`Used ${item.name}.`;
    p.inventory.splice(p.inventory.indexOf(item),1);
    return {msg};
  },

  addToInventory(p,item){
    if(p.inventory.length>=15) return false;
    p.inventory.push(item);
    return true;
  },

  // Apply status effects at start of player's turn. Returns array of log messages.
  tickStatus(p){
    const msgs=[];
    const se=p.statusEffects;
    if(se.poison){ const dmg=4; p.hp=Math.max(1,p.hp-dmg); msgs.push(`Poison! -${dmg} HP`); se.poison.turns--; if(se.poison.turns<=0) delete se.poison; }
    if(se.burn){   const dmg=5; p.hp=Math.max(1,p.hp-dmg); msgs.push(`Burn! -${dmg} HP`);   se.burn.turns--;   if(se.burn.turns<=0)   delete se.burn; }
    if(se.curse){  const dmg=3; p.hp=Math.max(1,p.hp-dmg); msgs.push(`Curse! -${dmg} HP`);  se.curse.turns--;  if(se.curse.turns<=0)  delete se.curse; }
    if(se.regen){  const h=1;   p.hp=Math.min(p.maxHp,p.hp+h); msgs.push(`Regen +${h} HP`); } // regen is permanent from ring
    // temp buff decay
    if(p.tempBuffs.atkTurns>0){ p.tempBuffs.atkTurns--; if(p.tempBuffs.atkTurns<=0) p.tempBuffs.atk=0; }
    if(p.tempBuffs.defTurns>0){ p.tempBuffs.defTurns--; if(p.tempBuffs.defTurns<=0) p.tempBuffs.def=0; }
    return msgs;
  },

  getEffectiveAtk(p){ return p.atk + p.tempBuffs.atk; },
  getEffectiveDef(p){ return p.def + p.tempBuffs.def; },
};
