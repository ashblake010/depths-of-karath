// ── Renderer Module ────────────────────────────────────────────────────────
const Renderer = {
  IMGS: {}, loaded: 0, total: 27,
  canvas: null, ctx: null,

  loadSprites(onDone) {
    const all = { ...PLAYER_SPRITES, ...ENEMY_SPRITES, ...BOSS_SPRITES, ...ITEM_SPRITES, ...TILE_SPRITES };
    Renderer.total = Object.keys(all).length;
    for(const [k, b64] of Object.entries(all)) {
      const img = new Image();
      img.onload  = () => { Renderer.loaded++; if(Renderer.loaded >= Renderer.total) onDone(); };
      img.onerror = () => { Renderer.loaded++; if(Renderer.loaded >= Renderer.total) onDone(); };
      img.src = 'data:image/png;base64,' + b64;
      Renderer.IMGS[k] = img;
    }
  },

  // ── Utility ────────────────────────────────────────────────────────────────
  clear(color = '#000') {
    const { ctx, canvas } = Renderer;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  },

  text(txt, x, y, size = 14, color = '#fff', align = 'left') {
    const { ctx } = Renderer;
    ctx.font = `${size}px monospace`; ctx.fillStyle = color; ctx.textAlign = align;
    ctx.fillText(String(txt), x, y); ctx.textAlign = 'left';
  },

  rect(x, y, w, h, color, alpha = 1) {
    const { ctx } = Renderer;
    ctx.globalAlpha = alpha; ctx.fillStyle = color; ctx.fillRect(x, y, w, h); ctx.globalAlpha = 1;
  },

  roundRect(x, y, w, h, r, color) {
    const { ctx } = Renderer;
    ctx.fillStyle = color; ctx.beginPath();
    ctx.roundRect(x, y, w, h, r); ctx.fill();
  },

  bar(x, y, w, h, val, max, fg, bg = '#222') {
    Renderer.rect(x, y, w, h, bg);
    if(max > 0) Renderer.rect(x, y, Math.max(0, Math.floor(w * (val / max))), h, fg);
  },

  // ── Sprite drawing with pixel-perfect rendering ───────────────────────────
  drawSprite(key, dx, dy, dw, dh, flashColor = null, flashAlpha = 0, glowColor = null) {
    const { ctx } = Renderer;
    const img = Renderer.IMGS[key];
    if(!img) return;
    ctx.imageSmoothingEnabled = false;

    // Glow/shadow under sprite
    if(glowColor) {
      ctx.shadowColor  = glowColor;
      ctx.shadowBlur   = 8;
    }

    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;

    // Hit flash overlay
    if(flashColor && flashAlpha > 0) {
      ctx.globalCompositeOperation = 'source-atop';
      ctx.save();
      ctx.beginPath(); ctx.rect(dx, dy, dw, dh); ctx.clip();
      ctx.drawImage(img, dx, dy, dw, dh);
      ctx.globalAlpha = flashAlpha;
      ctx.fillStyle   = flashColor;
      ctx.fillRect(dx, dy, dw, dh);
      ctx.restore();
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }
  },

  // ── Title Screen ───────────────────────────────────────────────────────────
  drawTitle(gs) {
    const { canvas } = Renderer;
    const W = canvas.width, H = canvas.height;
    Renderer.clear('#050008');
    const g = Renderer.ctx.createRadialGradient(W/2, H*0.4, 10, W/2, H*0.4, W*0.65);
    g.addColorStop(0, '#1a0030'); g.addColorStop(1, '#000');
    Renderer.ctx.fillStyle = g; Renderer.ctx.fillRect(0, 0, W, H);

    Renderer.text('DEPTHS OF',  W/2, H*0.23, 20, '#c88', 'center');
    Renderer.text('KARATH',     W/2, H*0.33, 40, '#e44', 'center');
    Renderer.text('The Undying',W/2, H*0.42, 13, '#a66', 'center');

    Renderer.drawSprite('karath', W/2-44, H*0.46, 88, 88, null, 0, '#a00');

    Renderer.roundRect(W/2-72, H*0.71, 144, 40, 8, '#4a0000');
    Renderer.text('NEW GAME', W/2, H*0.71+26, 16, '#fa8', 'center');

    if(gs.hasSave) {
      Renderer.roundRect(W/2-72, H*0.79, 144, 40, 8, '#001430');
      Renderer.text('CONTINUE',  W/2, H*0.79+26, 16, '#8cf', 'center');
    }

    // Meta stats
    if(gs.meta.runsPlayed > 0 || gs.meta.bestFloor > 0) {
      Renderer.text(`Best: Floor ${gs.meta.bestFloor}  Kills: ${gs.meta.totalKills}`, W/2, H*0.94, 10, '#444', 'center');
    }
  },

  // ── Class Select ──────────────────────────────────────────────────────────
  drawClassSelect() {
    const { canvas, ctx } = Renderer;
    const W = canvas.width, H = canvas.height;
    Renderer.clear('#080012');
    Renderer.text('CHOOSE YOUR CLASS', W/2, 38, 16, '#e88', 'center');

    const clsKeys = ['warrior', 'rogue', 'mage'];
    const bw = W * 0.88, bh = H * 0.21;
    const startY = H * 0.12;
    clsKeys.forEach((k, i) => {
      const cls = CLASSES[k];
      const by = startY + i * (bh + 14);
      const bx = (W - bw) / 2;
      Renderer.roundRect(bx, by, bw, bh, 10, '#14001e');
      ctx.strokeStyle = '#7030b0'; ctx.lineWidth = 1;
      ctx.strokeRect(bx+0.5, by+0.5, bw-1, bh-1);
      const sh = bh - 16;
      Renderer.drawSprite(k, bx+8, by+8, sh, sh, null, 0, '#6020a0');
      const tx = bx + sh + 14;
      Renderer.text(cls.name,     tx, by+22, 18, '#eee');
      Renderer.text(cls.desc,     tx, by+40, 11, '#999');
      Renderer.text(`HP:${cls.baseHp}  ATK:${cls.baseAtk}  DEF:${cls.baseDef}`, tx, by+58, 12, '#8cf');
      Renderer.text(`[${cls.skill.name}]`, tx, by+76, 11, '#fc8');
      Renderer.text(cls.skill.desc, tx, by+90, 10, '#aaa');
    });
  },

  // ── HUD (dungeon top strip) ────────────────────────────────────────────────
  drawHUD(gs) {
    const { canvas } = Renderer;
    const W = canvas.width;
    const p = gs.player;
    Renderer.rect(0, 0, W, 50, '#07000e');

    // HP bar with flash
    const hpColor = gs.playerHitFlash > 0 ? '#f44' : '#4c4';
    Renderer.bar(8, 6, W-16, 13, p.hp, p.maxHp, hpColor, '#1a0');
    Renderer.text(`HP ${p.hp}/${p.maxHp}`, W/2, 17, 10, '#cff', 'center');

    // XP bar
    Renderer.bar(8, 22, W-16, 7, p.xp, p.xpNext, '#66f', '#111');

    // Stats
    const buffAtkTxt = gs.player.tempBuffs?.atk > 0 ? ` (+${gs.player.tempBuffs.atk})` : '';
    Renderer.text(
      `FL:${gs.floor}  LV:${p.level}  ATK:${Player.getEffectiveAtk(p)}${buffAtkTxt}  DEF:${Player.getEffectiveDef(p)}`,
      W/2, 40, 10, '#8af', 'center'
    );

    // Status effect dots
    const se = p.statusEffects || {};
    let ox = 8;
    if(se.poison) { Renderer.ctx.fillStyle='#4f4'; Renderer.ctx.fillRect(ox,44,8,5); ox+=11; }
    if(se.burn)   { Renderer.ctx.fillStyle='#f84'; Renderer.ctx.fillRect(ox,44,8,5); ox+=11; }
    if(se.curse)  { Renderer.ctx.fillStyle='#b4f'; Renderer.ctx.fillRect(ox,44,8,5); ox+=11; }
  },

  // ── Dungeon View ──────────────────────────────────────────────────────────
  drawDungeon(gs) {
    const { canvas, ctx } = Renderer;
    const W = canvas.width, H = canvas.height;
    const VIEW = 13;
    Renderer.clear('#000');
    Renderer.drawHUD(gs);

    const HUD_H = 50;
    const mapSize = VIEW * TS;
    const mapLeft = Math.floor((W - mapSize) / 2);
    const mapTop  = HUD_H;

    const { player: p, map, revealed, enemies, items } = gs;
    const camX = Math.max(0, Math.min(50-VIEW, p.x - Math.floor(VIEW/2)));
    const camY = Math.max(0, Math.min(50-VIEW, p.y - Math.floor(VIEW/2)));

    ctx.save();
    ctx.beginPath();
    ctx.rect(mapLeft, mapTop, mapSize, mapSize);
    ctx.clip();

    // ── Draw tiles with torch lighting ─────────────────────────
    for(let ty = 0; ty < VIEW; ty++) {
      for(let tx = 0; tx < VIEW; tx++) {
        const mx = camX + tx, my = camY + ty;
        if(mx < 0 || my < 0 || mx >= 50 || my >= 50) continue;
        if(!revealed[my][mx]) continue;

        const tile = map[my][mx];
        const dist = Math.sqrt((mx-p.x)**2 + (my-p.y)**2);
        const px   = mapLeft + tx * TS, py = mapTop + ty * TS;

        // Torch light: full bright within vision, dim beyond
        let light;
        if(dist <= 1.5)           light = 1.0;
        else if(dist <= Dungeon.VISION) light = 0.55 + 0.45 * (1 - dist / Dungeon.VISION);
        else                      light = 0.18;

        ctx.globalAlpha = light;
        ctx.imageSmoothingEnabled = false;
        if(tile === T.WALL) {
          ctx.drawImage(Renderer.IMGS.wall, px, py, TS, TS);
        } else if(tile === T.FLOOR || tile === T.STAIRS) {
          ctx.drawImage(Renderer.IMGS.floor, px, py, TS, TS);
          if(tile === T.STAIRS) {
            ctx.globalAlpha = light * 1.2;
            ctx.drawImage(Renderer.IMGS.stairs, px, py, TS, TS);
          }
        } else {
          ctx.drawImage(Renderer.IMGS.void, px, py, TS, TS);
        }
        ctx.globalAlpha = 1;
      }
    }

    // ── Draw items ─────────────────────────────────────────────
    for(const item of items) {
      if(item.picked) continue;
      if(!revealed[item.y]?.[item.x]) continue;
      const dist = Math.sqrt((item.x-p.x)**2 + (item.y-p.y)**2);
      if(dist > Dungeon.VISION + 1) continue;
      const sx = mapLeft + (item.x - camX) * TS;
      const sy = mapTop  + (item.y - camY) * TS;
      if(sx < mapLeft-TS || sy < mapTop-TS || sx >= mapLeft+mapSize+TS || sy >= mapTop+mapSize+TS) continue;
      ctx.globalAlpha = dist <= Dungeon.VISION ? 1 : 0.4;
      const iimg = Renderer.IMGS[item.icon];
      if(iimg) { ctx.imageSmoothingEnabled=false; ctx.drawImage(iimg, sx+5, sy+5, TS-10, TS-10); }
      else { ctx.fillStyle = RARITY_COLOR[item.rarity]; ctx.fillRect(sx+8, sy+8, TS-16, TS-16); }
      // Rarity glow ring
      ctx.strokeStyle = RARITY_COLOR[item.rarity] + '99'; ctx.lineWidth = 1;
      ctx.strokeRect(sx+4, sy+4, TS-8, TS-8);
      ctx.globalAlpha = 1;
    }

    // ── Draw enemies ───────────────────────────────────────────
    for(const en of enemies) {
      if(!en.alive) continue;
      if(!revealed[en.y]?.[en.x]) continue;
      const dist = Math.sqrt((en.x-p.x)**2 + (en.y-p.y)**2);
      if(dist > Dungeon.VISION + 1) continue;

      // Use lerp render position
      const ex = mapLeft + (en.rx - camX * TS);
      const ey = mapTop  + (en.ry - camY * TS);
      if(ex < mapLeft-TS*2 || ey < mapTop-TS*2) continue;
      if(ex >= mapLeft+mapSize+TS || ey >= mapTop+mapSize+TS) continue;

      const eSize = en.isBoss ? Math.floor(TS * 1.6) : TS;
      const eOff  = en.isBoss ? -Math.floor(TS * 0.3) : 0;

      // Flash check
      const isFlashing = gs.hitFlash?.targetId === en.id && gs.hitFlash.timer > 0;
      const flashA     = isFlashing ? (gs.hitFlash.timer / 10) * 0.75 : 0;
      const flashC     = gs.hitFlash?.color || '#f44';

      // Glow for boss
      const glowC = en.isBoss ? (en.inPhase2 ? '#ff4400' : '#aa0000') : null;

      ctx.globalAlpha = dist <= Dungeon.VISION ? 1 : 0.3;
      Renderer.drawSprite(en.sprite, ex + eOff, ey + eOff, eSize, eSize, flashC, flashA, glowC);

      // HP bar above enemy
      const barW = eSize;
      const barX = ex + eOff, barY = ey + eOff - 6;
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = '#400'; ctx.fillRect(barX, barY, barW, 4);
      const hpRatio = en.hp / en.maxHp;
      ctx.fillStyle = hpRatio > 0.5 ? '#4f4' : hpRatio > 0.25 ? '#fa0' : '#f44';
      ctx.fillRect(barX, barY, Math.floor(barW * hpRatio), 4);
      ctx.globalAlpha = 1;

      // Boss outline
      if(en.isBoss) {
        ctx.strokeStyle = en.inPhase2 ? '#f80' : '#f44';
        ctx.lineWidth = 2;
        ctx.strokeRect(ex + eOff, ey + eOff, eSize, eSize);
      }
    }

    // ── Draw player ────────────────────────────────────────────
    const prx = mapLeft + (p.rx - camX * TS);
    const pry = mapTop  + (p.ry - camY * TS);

    // Player glow ring (class color)
    const classGlow = { warrior: '#8040ff', rogue: '#ff4080', mage: '#4080ff' };
    Renderer.drawSprite(
      p.classId,
      prx, pry, TS, TS,
      gs.playerHitFlash > 0 ? '#f00' : null,
      gs.playerHitFlash > 0 ? (gs.playerHitFlash / 10) * 0.6 : 0,
      classGlow[p.classId]
    );

    // Status icon dots above player
    const se = p.statusEffects || {};
    let sox = prx; const soy = pry - 7;
    if(se.poison) { ctx.fillStyle='#4f4'; ctx.fillRect(sox,soy,6,6); sox+=8; }
    if(se.burn)   { ctx.fillStyle='#f84'; ctx.fillRect(sox,soy,6,6); sox+=8; }
    if(se.curse)  { ctx.fillStyle='#b4f'; ctx.fillRect(sox,soy,6,6); }

    ctx.restore();

    // ── Damage numbers (world-space, above map) ────────────────
    for(const dn of gs.damageNums) {
      if(dn.timer <= 0) continue;
      const dnsx = mapLeft + (dn.x - camX) * TS + TS/2;
      const dnsy = mapTop  + (dn.y - camY) * TS + (dn.py || 0);
      const alpha = Math.min(1, dn.timer / 30);
      ctx.globalAlpha = alpha;
      ctx.font = 'bold 14px monospace'; ctx.fillStyle = dn.color;
      ctx.textAlign = 'center';
      ctx.fillText('-' + dn.val, dnsx, dnsy);
      ctx.textAlign = 'left'; ctx.globalAlpha = 1;
    }

    // ── Room type labels (treasure/den) ────────────────────────
    if(gs.rooms) {
      for(const room of gs.rooms) {
        if(room.type !== ROOM_TYPE.TREASURE && room.type !== ROOM_TYPE.DEN) continue;
        if(!revealed[room.cy]?.[room.cx]) continue;
        const rx2 = mapLeft + (room.cx - camX) * TS;
        const ry2 = mapTop  + (room.cy - camY) * TS;
        if(rx2 < mapLeft || ry2 < mapTop || rx2 >= mapLeft+mapSize || ry2 >= mapTop+mapSize) continue;
        Renderer.text(
          room.type === ROOM_TYPE.TREASURE ? '💎' : '☠',
          rx2 + TS/2, ry2 - 2, 10, '#fff', 'center'
        );
      }
    }

    // ── Minimap ────────────────────────────────────────────────
    Renderer.drawMinimap(gs, W-66, mapTop+4, 62, 62);

    // ── Notification ───────────────────────────────────────────
    if(gs.notification?.timer > 0) {
      const alpha = Math.min(1, gs.notification.timer / 20);
      ctx.globalAlpha = alpha;
      Renderer.rect(0, H - 36, W, 36, '#000000cc');
      Renderer.text(gs.notification.text, W/2, H - 14, 12, '#ffcc44', 'center');
      ctx.globalAlpha = 1;
    }
  },

  drawMinimap(gs, mx, my, mw, mh) {
    const { ctx } = Renderer;
    const { map, revealed, player: p, enemies } = gs;
    const scale = mw / 50;

    ctx.globalAlpha = 0.85;
    ctx.fillStyle = '#05000a';
    ctx.fillRect(mx, my, mw, mh);
    ctx.strokeStyle = '#333'; ctx.lineWidth = 1;
    ctx.strokeRect(mx, my, mw, mh);

    for(let y = 0; y < 50; y++) {
      for(let x = 0; x < 50; x++) {
        if(!revealed[y][x]) continue;
        const tile = map[y][x];
        if(tile === T.WALL || tile === T.VOID) continue;
        ctx.fillStyle = tile === T.STAIRS ? '#ff8' : '#334';
        ctx.fillRect(mx + x*scale, my + y*scale, Math.max(1, scale), Math.max(1, scale));
      }
    }

    // Enemies on minimap
    for(const en of enemies) {
      if(!en.alive || !revealed[en.y]?.[en.x]) continue;
      ctx.fillStyle = en.isBoss ? '#f44' : '#f84';
      ctx.fillRect(mx + en.x*scale - 0.5, my + en.y*scale - 0.5, 2, 2);
    }

    // Player dot
    ctx.fillStyle = '#0ff';
    ctx.fillRect(mx + p.x*scale - 1, my + p.y*scale - 1, 3, 3);

    ctx.globalAlpha = 1;
  },

  // ── Combat Screen ─────────────────────────────────────────────────────────
  drawCombat(gs) {
    const { canvas, ctx } = Renderer;
    const W = canvas.width, H = canvas.height;
    Renderer.clear('#060008');

    const c = gs.combat, p = gs.player, e = c.enemy;
    const isPhase2 = e.inPhase2;

    // Atmospheric BG based on boss
    if(e.isBoss) {
      const grad = ctx.createRadialGradient(W/2, H*0.35, 10, W/2, H*0.35, W*0.6);
      grad.addColorStop(0, isPhase2 ? '#1a0000' : '#100015');
      grad.addColorStop(1, '#000');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
    }

    // Enemy sprite
    const sprSize = e.isBoss ? 110 : 80;
    const sprX = W/2 - sprSize/2, sprY = 16;

    const isFlashing = gs.hitFlash?.targetId === e.id && gs.hitFlash.timer > 0;
    const flashA     = isFlashing ? (gs.hitFlash.timer / 10) * 0.8 : 0;
    const glowC      = e.isBoss ? (isPhase2 ? '#ff4400cc' : '#aa0000cc') : '#66000066';

    if(isPhase2) ctx.filter = 'hue-rotate(20deg) saturate(2)';
    Renderer.drawSprite(e.sprite, sprX, sprY, sprSize, sprSize, '#f44', flashA, glowC);
    ctx.filter = 'none';

    // Enemy name + HP
    Renderer.text(e.name + (isPhase2 ? ' ⚡ PHASE 2' : ''), W/2, sprY + sprSize + 18, 14, e.isBoss ? '#f88' : '#fa8', 'center');
    Renderer.bar(W*0.08, sprY+sprSize+24, W*0.84, 11, e.hp, e.maxHp, '#f44', '#400');
    Renderer.text(`${e.hp} / ${e.maxHp}`, W/2, sprY+sprSize+44, 10, '#faa', 'center');

    // Divider
    Renderer.rect(0, sprY+sprSize+52, W, 1, '#333');

    // Combat log (last 5)
    const logSlice = c.log.slice(Math.max(0, c.log.length-5));
    for(let i = 0; i < logSlice.length; i++) {
      const age   = c.log.length - (Math.max(0,c.log.length-5) + i);
      const alpha = Math.max(0.3, 1 - age * 0.15);
      ctx.globalAlpha = alpha;
      const color = logSlice[i].includes('CRIT') ? '#fd0'
                  : logSlice[i].includes('Blocked') ? '#8cf'
                  : logSlice[i].includes('defeated') ? '#4f4'
                  : logSlice[i].includes('damage') || logSlice[i].includes('hit') ? '#f88'
                  : '#ccc';
      Renderer.text(logSlice[i], W/2, sprY+sprSize+68 + i*17, 11, color, 'center');
      ctx.globalAlpha = 1;
    }

    // Player section
    Renderer.rect(0, H-106, W, 1, '#333');

    // Player sprite + flash
    const pFlashA = gs.playerHitFlash > 0 ? (gs.playerHitFlash/10)*0.6 : 0;
    Renderer.drawSprite(p.classId, W/2-130, H-100, 44, 44, '#f00', pFlashA, null);

    Renderer.text(`${p.name}`, 8, H-86, 12, '#ccc');
    Renderer.bar(8, H-78, W-16, 12, p.hp, p.maxHp, gs.playerHitFlash>0?'#f44':'#4f4', '#130');
    Renderer.text(`${p.hp} / ${p.maxHp}`, W/2, H-68, 10, '#8f8', 'center');

    // Status dots
    const se = p.statusEffects || {};
    let ox = W/2-30;
    if(se.poison) { ctx.fillStyle='#4f4'; ctx.fillRect(ox,H-58,8,8); ox+=12; }
    if(se.burn)   { ctx.fillStyle='#f84'; ctx.fillRect(ox,H-58,8,8); ox+=12; }
    if(se.curse)  { ctx.fillStyle='#b4f'; ctx.fillRect(ox,H-58,8,8); }

    // Skill cooldown
    const cls = CLASSES[p.classId];
    const cdReady = p.skillCd <= 0;
    Renderer.roundRect(W/2-80, H-50, 160, 24, 6, cdReady ? '#1a2a00' : '#1a0010');
    Renderer.text(
      cdReady ? `${cls.skill.name} — READY` : `${cls.skill.name} — ${p.skillCd}t`,
      W/2, H-32, 11, cdReady ? '#8f0' : '#884', 'center'
    );

    // Damage numbers in combat (floating above center of screen)
    for(const dn of gs.damageNums) {
      if(dn.timer <= 0) continue;
      const dnx = W/2 + (Math.random() < 0.5 ? -20 : 20);
      const dny = sprY + sprSize/2 + (dn.py || 0);
      const alpha = Math.min(1, dn.timer / 30);
      ctx.globalAlpha = alpha;
      ctx.font = `bold ${14 + (dn.color === '#fd0' ? 4 : 0)}px monospace`;
      ctx.fillStyle = dn.color; ctx.textAlign = 'center';
      ctx.fillText('-' + dn.val, dnx, dny);
      ctx.textAlign = 'left'; ctx.globalAlpha = 1;
    }
  },

  // ── Level Up Screen ───────────────────────────────────────────────────────
  drawLevelUp(gs) {
    const { canvas } = Renderer;
    const W = canvas.width, H = canvas.height;
    Renderer.clear('#03001a');
    const p = gs.player;

    const grd = Renderer.ctx.createRadialGradient(W/2,H*0.3,5,W/2,H*0.3,W*0.5);
    grd.addColorStop(0,'#0a0050'); grd.addColorStop(1,'#000');
    Renderer.ctx.fillStyle=grd; Renderer.ctx.fillRect(0,0,W,H);

    Renderer.text('LEVEL UP!', W/2, H*0.14, 24, '#fd0', 'center');
    Renderer.text(`Level ${p.level}`, W/2, H*0.22, 17, '#fff', 'center');
    Renderer.text(`Points: ${p.pendingPoints}`, W/2, H*0.29, 13, '#8cf', 'center');

    const opts = [
      { label: `HP  +10`, sub: `${p.maxHp} → ${p.maxHp+10}`, stat: 'hp', color: '#4f4' },
      { label: `ATK +2`,  sub: `${Player.getEffectiveAtk(p)} → ${Player.getEffectiveAtk(p)+2}`, stat: 'atk', color: '#f84' },
      { label: `DEF +1`,  sub: `${Player.getEffectiveDef(p)} → ${Player.getEffectiveDef(p)+1}`, stat: 'def', color: '#48f' },
    ];
    opts.forEach((o, i) => {
      const by = H*0.36 + i*72;
      Renderer.roundRect(W/2-115, by, 230, 58, 10, '#0a0a20');
      Renderer.ctx.strokeStyle = o.color + 'aa'; Renderer.ctx.lineWidth = 2;
      Renderer.ctx.strokeRect(W/2-114, by+1, 228, 56);
      Renderer.text(o.label, W/2, by+24, 18, o.color, 'center');
      Renderer.text(o.sub,   W/2, by+44, 12, '#888', 'center');
    });
    Renderer.text('Tap a stat to allocate', W/2, H-28, 11, '#555', 'center');
  },

  // ── Inventory ─────────────────────────────────────────────────────────────
  drawInventory(gs) {
    const { canvas, ctx } = Renderer;
    const W = canvas.width, H = canvas.height;
    Renderer.clear('#030010');
    const p = gs.player;

    Renderer.text('INVENTORY', W/2, 28, 16, '#d8e', 'center');

    // Equipment
    Renderer.text('EQUIPPED', 8, 52, 10, '#555');
    ['weapon','armor','ring'].forEach((slot, i) => {
      const it = p.equipment[slot];
      const by = 56 + i * 28;
      ctx.fillStyle = '#080018'; ctx.fillRect(8, by, W-16, 26);
      ctx.strokeStyle = '#2a1a40'; ctx.lineWidth = 1; ctx.strokeRect(8, by, W-16, 26);
      Renderer.text(slot+':', 14, by+17, 10, '#444');
      if(it) {
        const iimg = Renderer.IMGS[it.icon];
        if(iimg) { ctx.imageSmoothingEnabled=false; ctx.drawImage(iimg, 54, by+4, 18, 18); }
        Renderer.text(it.name, 76, by+17, 11, RARITY_COLOR[it.rarity]);
        Renderer.text(`A:${it.atk||0} D:${it.def||0}`, W-50, by+17, 9, '#888', 'right');
      } else {
        Renderer.text('—', 54, by+17, 11, '#333');
      }
    });

    // Bag
    const bagY = 144;
    Renderer.text(`BAG  ${p.inventory.length}/15`, 8, bagY, 10, '#555');
    const sel = gs.ui.inventorySelect;
    p.inventory.forEach((it, i) => {
      const bx = 8 + (i%2) * ((W-16)/2);
      const by = bagY+6 + Math.floor(i/2)*28;
      const selected = i === sel;
      ctx.fillStyle = selected ? '#18002a' : '#070014';
      ctx.fillRect(bx, by, (W-16)/2-2, 26);
      ctx.strokeStyle = selected ? RARITY_COLOR[it.rarity] : '#1e0e30';
      ctx.lineWidth = selected ? 2 : 1;
      ctx.strokeRect(bx, by, (W-16)/2-2, 26);
      const iimg = Renderer.IMGS[it.icon];
      if(iimg) { ctx.imageSmoothingEnabled=false; ctx.drawImage(iimg, bx+2, by+4, 18, 18); }
      Renderer.text(it.name, bx+24, by+17, 9, RARITY_COLOR[it.rarity]);
    });

    // Selected item detail panel
    if(sel >= 0 && sel < p.inventory.length) {
      const it = p.inventory[sel];
      const dy = H - 88;
      Renderer.rect(0, dy, W, 88, '#06001a');
      ctx.strokeStyle = '#2a0050'; ctx.lineWidth = 1; ctx.strokeRect(0, dy, W, 88);
      Renderer.text(it.name, W/2, dy+18, 14, RARITY_COLOR[it.rarity], 'center');
      Renderer.text(RARITY_NAME[it.rarity], W/2, dy+32, 10, '#666', 'center');
      Renderer.text(it.desc, W/2, dy+50, 10, '#bbb', 'center');
      const action = it.type==='consumable'
        ? (gs.ui.inventoryAction?'Tap again to USE':'Tap again to select')
        : (gs.ui.inventoryAction?'Tap again to EQUIP':'Tap again to select');
      Renderer.text(action, W/2, dy+70, 10, '#88f', 'center');
    } else {
      Renderer.text('Tap item to inspect  •  Tap header area to close', W/2, H-14, 10, '#333', 'center');
    }
  },

  // ── Game Over ─────────────────────────────────────────────────────────────
  drawGameOver(gs) {
    const { canvas } = Renderer;
    const W = canvas.width, H = canvas.height;
    Renderer.clear('#0a0000');
    const g = Renderer.ctx.createRadialGradient(W/2,H*0.35,5,W/2,H*0.35,W*0.5);
    g.addColorStop(0,'#1a0000'); g.addColorStop(1,'#000');
    Renderer.ctx.fillStyle=g; Renderer.ctx.fillRect(0,0,W,H);

    Renderer.drawSprite('boss_karath', W/2-40, H*0.06, 80, 80, '#f00', 0.15, '#400');
    Renderer.text('YOU DIED', W/2, H*0.35, 32, '#f22', 'center');
    Renderer.text(`Reached Floor ${gs.floor}`, W/2, H*0.46, 15, '#888', 'center');
    Renderer.text(`Level ${gs.player.level}`, W/2, H*0.53, 13, '#666', 'center');
    Renderer.text(`Best Floor: ${gs.meta.bestFloor}`, W/2, H*0.64, 12, '#666', 'center');
    Renderer.text(`Total Kills: ${gs.meta.totalKills}`, W/2, H*0.70, 12, '#666', 'center');
    Renderer.roundRect(W/2-80, H*0.79, 160, 42, 8, '#200');
    Renderer.text('PLAY AGAIN', W/2, H*0.79+28, 15, '#f88', 'center');
  },

  // ── Victory ───────────────────────────────────────────────────────────────
  drawVictory(gs) {
    const { canvas } = Renderer;
    const W = canvas.width, H = canvas.height;
    Renderer.clear('#000810');
    Renderer.text('KARATH DEFEATED!', W/2, H*0.14, 22, '#fd0', 'center');
    Renderer.text('The Depths are conquered.', W/2, H*0.24, 13, '#888', 'center');
    Renderer.text(`Floor ${gs.floor}  Level ${gs.player.level}`, W/2, H*0.34, 14, '#8cf', 'center');
    Renderer.text(`Total Kills: ${gs.meta.totalKills}`, W/2, H*0.42, 13, '#8f8', 'center');
    Renderer.roundRect(W/2-80, H*0.56, 160, 42, 8, '#020830');
    Renderer.text('PLAY AGAIN', W/2, H*0.56+28, 15, '#8cf', 'center');
  },

  // ── Loading ───────────────────────────────────────────────────────────────
  drawLoading() {
    const { canvas } = Renderer;
    const W = canvas.width, H = canvas.height;
    Renderer.clear('#000');
    Renderer.text('Loading...', W/2, H/2-24, 16, '#666', 'center');
    Renderer.bar(W*0.2, H/2-4, W*0.6, 12, Renderer.loaded, Renderer.total, '#446', '#111');
    Renderer.text(Math.floor(Renderer.loaded/Renderer.total*100)+'%', W/2, H/2+22, 12, '#555', 'center');
  },
};
