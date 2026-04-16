// ── Combat Module ──────────────────────────────────────────────────────────
const Combat = {
  start(player, enemy) {
    Sound.play(enemy.isBoss ? 'boss_appear' : 'combat_start');
    return {
      player, enemy,
      log: [enemy.isBoss ? `⚠ BOSS: ${enemy.name}!` : `Encountered ${enemy.name}!`],
      phase: 'player',
      enemyStunned: false,
    };
  },

  // ── Player Actions ────────────────────────────────────────────────────────
  playerAttack(c, gs) {
    const { player: p, enemy: e } = c;
    const msgs = [];
    msgs.push(...Player.tickStatus(p));
    if(p.hp <= 0) { c.phase = 'defeat'; c.log.push(...msgs); return; }

    const weapon = p.equipment.weapon;
    let dmg = Math.max(1, Player.getEffectiveAtk(p) - e.def);
    let crit = false;
    if(p.critNext) { dmg = Math.floor(dmg * 2); crit = true; p.critNext = false; }
    if(p.blocking) { }

    // Hit flash + damage number on enemy
    gs.hitFlash = { targetId: e.id, timer: 10, color: '#f44' };
    gs.damageNums.push({ x: e.x, y: e.y, val: dmg, color: crit ? '#fd0' : '#f88', timer: 50, vy: -0.8 });

    Sound.play(crit ? 'crit' : 'enemy_hit');
    msgs.push(crit ? `CRIT! ${p.name} hits ${e.name} for ${dmg}!` : `${p.name} attacks for ${dmg}.`);
    e.hp = Math.max(0, e.hp - dmg);

    if(weapon?.effect) Combat._applyEffect(e, weapon.effect, msgs, p, gs);

    if(e.isBoss && !e.inPhase2 && e.hp <= Math.floor(e.maxHp * 0.5)) {
      e.inPhase2 = true;
      msgs.push(`⚡ ${e.name} transforms! Phase 2!`);
      e.atk = Math.floor(e.atk * 1.2);
    }

    if(e.hp <= 0) { e.alive = false; c.phase = 'victory'; msgs.push(`${e.name} defeated!`); Sound.play('enemy_death'); }
    c.log.push(...msgs);
    if(c.phase === 'player') c.phase = 'enemy';
  },

  playerSkill(c, gs) {
    const { player: p, enemy: e } = c;
    const cls = CLASSES[p.classId];
    const msgs = [];
    msgs.push(...Player.tickStatus(p));
    if(p.hp <= 0) { c.phase = 'defeat'; c.log.push(...msgs); return; }

    if(p.skillCd > 0) {
      msgs.push(`Skill on cooldown (${p.skillCd} turns).`);
      c.log.push(...msgs); c.phase = 'enemy'; return;
    }

    p.skillCd = cls.skill.cd;
    Sound.play('skill_' + p.classId);

    if(cls.skill.effect === 'block') {
      p.blocking = true;
      msgs.push('Shieldwall! Next attack blocked.');
    } else if(cls.skill.effect === 'stun_crit') {
      c.enemyStunned = true; p.critNext = true;
      msgs.push('Smoke Bomb! Enemy stunned & next hit crits!');
    } else if(cls.skill.effect === 'magic_burst') {
      const dmg = 45 + Math.floor(Math.random() * 16) + Math.floor(Player.getEffectiveAtk(p) * 0.5);
      gs.hitFlash = { targetId: e.id, timer: 14, color: '#88f' };
      gs.damageNums.push({ x: e.x, y: e.y, val: dmg, color: '#88f', timer: 60, vy: -1.0 });
      msgs.push(`Arcane Burst deals ${dmg} MAGIC damage!`);
      e.hp = Math.max(0, e.hp - dmg);
      if(e.isBoss && !e.inPhase2 && e.hp <= Math.floor(e.maxHp * 0.5)) {
        e.inPhase2 = true; msgs.push(`⚡ ${e.name} enters Phase 2!`); e.atk = Math.floor(e.atk * 1.2);
      }
      if(e.hp <= 0) { e.alive = false; c.phase = 'victory'; msgs.push(`${e.name} defeated!`); Sound.play('enemy_death'); }
    }

    c.log.push(...msgs);
    if(c.phase === 'player') c.phase = 'enemy';
  },

  playerItem(c, item, gs) {
    const { player: p, enemy: e } = c;
    const msgs = [];
    msgs.push(...Player.tickStatus(p));
    if(p.hp <= 0) { c.phase = 'defeat'; c.log.push(...msgs); return; }

    const result = Player.useConsumable(p, item, true);
    msgs.push(result.msg);
    if(result.flee) { Sound.play('flee'); c.phase = 'flee'; c.log.push(...msgs); return; }
    if(result.damage) {
      gs.hitFlash = { targetId: e.id, timer: 10, color: '#f84' };
      gs.damageNums.push({ x: e.x, y: e.y, val: result.damage, color: '#f84', timer: 50, vy: -0.8 });
      e.hp = Math.max(0, e.hp - result.damage);
      if(e.hp <= 0) { e.alive = false; c.phase = 'victory'; msgs.push(`${e.name} defeated!`); Sound.play('enemy_death'); }
    }
    c.log.push(...msgs);
    if(c.phase === 'player') c.phase = 'enemy';
  },

  // ── Enemy Turn ────────────────────────────────────────────────────────────
  enemyTurn(c, gs) {
    const { player: p, enemy: e } = c;
    const msgs = [];
    if(c.phase !== 'enemy') return;
    if(p.skillCd > 0) p.skillCd--;

    if(c.enemyStunned) {
      msgs.push(`${e.name} is stunned!`); c.enemyStunned = false;
      c.phase = 'player'; c.log.push(...msgs); return;
    }

    let tookDmg = false;
    if(e.isBoss) {
      const avail = e.skills.filter(s => !s.phase2Only || (s.phase2Only && e.inPhase2));
      let r = Math.random(), cumul = 0, skill = avail[avail.length - 1];
      for(const s of avail) { cumul += s.prob; if(r <= cumul) { skill = s; break; } }

      if(skill.hits > 1) {
        for(let h = 0; h < skill.hits; h++) {
          const hd = Math.max(1, Math.floor(e.atk * skill.dmgMult) - (skill.ignoreArmor ? 0 : Player.getEffectiveDef(p)));
          if(p.blocking) { msgs.push(`Hit ${h+1} blocked!`); p.blocking = false; }
          else { p.hp = Math.max(0, p.hp - hd); msgs.push(`${skill.name} hit ${h+1}: ${hd}!`); tookDmg = true; }
        }
      } else {
        let hd = Math.max(1, Math.floor(e.atk * skill.dmgMult) - (skill.ignoreArmor ? 0 : Player.getEffectiveDef(p)));
        if(p.blocking) { msgs.push(`${skill.name} — Blocked!`); p.blocking = false; hd = 0; }
        else {
          p.hp = Math.max(0, p.hp - hd);
          msgs.push(`${e.name} uses ${skill.name} for ${hd}!`); tookDmg = true;
        }
        if(skill.effect) Combat._applyEffect(p, skill.effect, msgs, null, gs);
      }
    } else {
      const dmg = Math.max(1, e.atk - Player.getEffectiveDef(p));
      if(p.blocking) { msgs.push(`${e.name} attacks — Blocked!`); p.blocking = false; }
      else {
        p.hp = Math.max(0, p.hp - dmg);
        msgs.push(`${e.name} attacks for ${dmg}.`); tookDmg = true;
        if(e.effect) Combat._applyEffect(p, e.effect, msgs, null, gs);
      }
    }

    if(tookDmg) {
      Sound.play('player_hit');
      // Player hit flash shown via gs
      gs.playerHitFlash = 10;
    }

    if(p.hp <= 0) c.phase = 'defeat';
    else c.phase = 'player';
    c.log.push(...msgs);
  },

  _applyEffect(target, effect, msgs, attacker, gs) {
    if(!effect) return;
    const se = target.statusEffects;
    if(effect === 'poison' && se && !se.poison) {
      se.poison = { turns: 3 }; msgs.push('Poisoned! (3 turns)'); Sound.play('curse');
    } else if(effect === 'burn' && se && !se.burn) {
      se.burn = { turns: 3 }; msgs.push('Burning! (3 turns)');
    } else if(effect === 'curse' && se) {
      const ring = target.equipment?.ring;
      if(ring?.effect === 'curse_immune') { msgs.push('Curse warded off!'); return; }
      se.curse = { turns: 4 }; msgs.push('Cursed! (4 turns)'); Sound.play('curse');
    } else if(effect === 'drain') {
      const d = Math.max(3, Math.floor((target.hp || 0) * 0.1));
      if(target.hp !== undefined) target.hp = Math.max(0, target.hp - d);
      if(attacker) attacker.hp = Math.min(attacker.maxHp, attacker.hp + d);
      msgs.push(`Drained ${d} HP!`);
    } else if(effect === 'lifedrain') {
      const d = Math.max(5, Math.floor((target.hp || 0) * 0.15));
      if(target.hp !== undefined) target.hp = Math.max(0, target.hp - d);
      if(attacker) attacker.hp = Math.min(attacker.maxHp, attacker.hp + d);
      msgs.push(`Life drained ${d} HP!`);
    } else if(effect === 'stun') {
      msgs.push(`${target.name || 'Target'} stunned!`);
    }
  },

  getRewards(c) {
    const lvMsgs = Player.gainXP(c.player, c.enemy.xp);
    if(lvMsgs.length > 0) Sound.play('level_up');
    return { xp: c.enemy.xp, levelMsgs: lvMsgs };
  },
};
