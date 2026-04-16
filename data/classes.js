const CLASSES={
  warrior:{id:'warrior',name:'Warrior',symbol:'⚔',desc:'Hardy fighter. High HP & defense.',
    baseHp:85,baseAtk:10,baseDef:5,
    skill:{name:'Shieldwall',desc:'Block the next attack entirely.',cd:4,effect:'block'}},
  rogue:{id:'rogue',name:'Rogue',symbol:'🗡',desc:'Swift assassin. High attack, low defense.',
    baseHp:55,baseAtk:13,baseDef:2,
    skill:{name:'Smoke Bomb',desc:'Stun enemy & guarantee a critical hit.',cd:3,effect:'stun_crit'}},
  mage:{id:'mage',name:'Mage',symbol:'✦',desc:'Arcane scholar. Magic ignores all armor.',
    baseHp:45,baseAtk:8,baseDef:2,
    skill:{name:'Arcane Burst',desc:'Deal 45+ magic damage, ignoring DEF.',cd:5,effect:'magic_burst'}}
};
