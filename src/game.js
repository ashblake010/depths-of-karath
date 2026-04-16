// ── Game State Machine ─────────────────────────────────────────────────────
const TS = 28; // tile size in pixels

const Game = {
  gs: null,
  canvas: null, ctx: null,

  init() {
    const canvas = document.getElementById('gc');
    Game.canvas = canvas;
    Renderer.canvas = canvas;
    Renderer.ctx = canvas.getContext('2d');
    Game.ctx = Renderer.ctx;

    function resize() {
      const W = Math.min(window.innerWidth, 420);
      const H = window.innerHeight;
      canvas.width = W; canvas.height = H;
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      const ov = document.getElementById('overlay');
      ov.style.width = W + 'px'; ov.style.height = H + 'px';
    }
    resize(); window.addEventListener('resize', resize);

    Sound.init();
    UI.init(Game.handleInput);
    UI.setMode('none');
    UI.addCanvasTap(canvas, (x, y) => Game.handleTap(x, y));

    document.addEventListener('keydown', e => {
      const map = { ArrowUp:'up', ArrowDown:'down', ArrowLeft:'left', ArrowRight:'right',
                    w:'up', s:'down', a:'left', d:'right',
                    ' ':'attack', z:'skill', x:'inv', Escape:'back' };
      const act = map[e.key];
      if(act) { e.preventDefault(); Game.handleInput(act); }
    });

    const meta    = JSON.parse(localStorage.getItem('dok_meta') || '{}');
    const hasSave = !!localStorage.getItem('dok_save');

    Game.gs = {
      scene: 'title',
      player: null,
      map: null, revealed: null, rooms: null, enemies: [], items: [],
      floor: 1,
      combat: null,
      ui: { levelSelectIndex: 0, inventorySelect: -1, inventoryAction: false },
      notification: null,
      meta: { runsPlayed: meta.runsPlayed||0, bestFloor: meta.bestFloor||0, totalKills: meta.totalKills||0 },
      hasSave,
      // Animation state
      fade: { alpha: 1.0, dir: -1 },   // fade in on start
      damageNums: [],                    // [{x,y,val,color,timer,vy,py}]
      hitFlash: null,                    // {targetId, timer, color}
      playerHitFlash: 0,                 // countdown timer
      moveQueue: [],                     // buffered inputs during anim
      moveLocked: false,
    };

    Renderer.loadSprites(() => {
      Game.setState('title');
      requestAnimationFrame(Game.loop);
    });
    requestAnimationFrame(Game.loop);
  },

  loop() {
    requestAnimationFrame(Game.loop);
    const gs = Game.gs;

    // ── Notification tick ──────────────────────────────────────
    if(gs.notification?.timer > 0) gs.notification.timer--;

    // ── Fade animation ─────────────────────────────────────────
    if(gs.fade) {
      gs.fade.alpha += gs.fade.dir * 0.06;
      if(gs.fade.alpha <= 0) { gs.fade.alpha = 0; gs.fade.dir = 0; }
      if(gs.fade.alpha >= 1) { gs.fade.alpha = 1; gs.fade.dir = 0; }
    }

    // ── Hit flash tick ─────────────────────────────────────────
    if(gs.hitFlash?.timer > 0) gs.hitFlash.timer--;
    if(gs.playerHitFlash > 0) gs.playerHitFlash--;

    // ── Damage number tick ─────────────────────────────────────
    for(let i = gs.damageNums.length - 1; i >= 0; i--) {
      const dn = gs.damageNums[i];
      dn.timer--;
      dn.py = (dn.py || 0) + dn.vy;
      if(dn.timer <= 0) gs.damageNums.splice(i, 1);
    }

    // ── Player lerp position ───────────────────────────────────
    if(gs.player) {
      const tp = gs.player;
      if(tp.rx === undefined) { tp.rx = tp.x * TS; tp.ry = tp.y * TS; }
      const tx = tp.x * TS, ty = tp.y * TS;
      tp.rx += (tx - tp.rx) * 0.28;
      tp.ry += (ty - tp.ry) * 0.28;
      if(Math.abs(tp.rx - tx) < 0.5 && Math.abs(tp.ry - ty) < 0.5) {
        tp.rx = tx; tp.ry = ty;
        if(gs.moveLocked) { gs.moveLocked = false; Game._processQueue(); }
      }
    }

    // ── Enemy lerp positions ───────────────────────────────────
    if(gs.enemies) {
      for(const en of gs.enemies) {
        if(!en.alive) continue;
        if(en.rx === undefined) { en.rx = en.x * TS; en.ry = en.y * TS; }
        en.rx += (en.x * TS - en.rx) * 0.22;
        en.ry += (en.y * TS - en.ry) * 0.22;
      }
    }

    // ── Render ─────────────────────────────────────────────────
    if(Renderer.loaded < Renderer.total) { Renderer.drawLoading(); return; }
    switch(gs.scene) {
      case 'title':       Renderer.drawTitle(gs); break;
      case 'classSelect': Renderer.drawClassSelect(); break;
      case 'dungeon':     Renderer.drawDungeon(gs); break;
      case 'combat':      Renderer.drawCombat(gs); break;
      case 'levelUp':     Renderer.drawLevelUp(gs); break;
      case 'inventory':   Renderer.drawInventory(gs); break;
      case 'gameOver':    Renderer.drawGameOver(gs); break;
      case 'victory':     Renderer.drawVictory(gs); break;
    }

    // ── Fade overlay (on top of everything) ────────────────────
    if(gs.fade && gs.fade.alpha > 0) {
      Renderer.ctx.globalAlpha = gs.fade.alpha;
      Renderer.ctx.fillStyle = '#000';
      Renderer.ctx.fillRect(0, 0, Game.canvas.width, Game.canvas.height);
      Renderer.ctx.globalAlpha = 1;
    }
  },

  setState(scene) {
    const gs = Game.gs;
    gs.scene = scene;
    switch(scene) {
      case 'title':       UI.setMode('none'); break;
      case 'classSelect': UI.setMode('none'); break;
      case 'dungeon':     UI.setMode('dungeon'); break;
      case 'combat':      UI.setMode('combat'); break;
      case 'levelUp':     UI.setMode('none'); break;
      case 'inventory':   UI.setMode('none'); break;
      case 'gameOver':    UI.setMode('none'); break;
      case 'victory':     UI.setMode('none'); break;
    }
  },

  handleTap(x, y) {
    Sound.resume();
    const gs = Game.gs;
    const W = Game.canvas.width, H = Game.canvas.height;
    switch(gs.scene) {
      case 'title':
        if(y > H*0.68 && y < H*0.80) Game.startNewGame();
        else if(gs.hasSave && y > H*0.76 && y < H*0.88) Game.loadGame();
        break;
      case 'classSelect': {
        const clsKeys = ['warrior', 'rogue', 'mage'];
        const bh = H * 0.22, startY = H * 0.12;
        clsKeys.forEach((k, i) => { const by = startY + i*(bh+12); if(y>=by && y<=by+bh) Game.selectClass(k); });
        break;
      }
      case 'levelUp': {
        const opts = ['hp', 'atk', 'def'];
        opts.forEach((stat, i) => {
          const by = H*0.38 + i*68;
          if(y >= by && y <= by+52 && gs.player.pendingPoints > 0) {
            Player.allocPoint(gs.player, stat);
            UI.notify(gs, `+${stat.toUpperCase()} allocated!`);
            if(gs.player.pendingPoints <= 0) Game.setState(gs._returnScene || 'dungeon');
          }
        });
        break;
      }
      case 'inventory':
        Game._handleInventoryTap(x, y);
        break;
      case 'gameOver':
      case 'victory':
        if(y > H*0.72) { localStorage.removeItem('dok_save'); Game.startNewGame(); }
        break;
    }
  },

  handleInput(action) {
    Sound.resume();
    const gs = Game.gs;
    if(gs.scene === 'dungeon') {
      if(gs.moveLocked) { gs.moveQueue.push(action); return; }
      Game._dungeonInput(action);
    } else if(gs.scene === 'combat') {
      Game._combatInput(action);
    }
  },

  _processQueue() {
    const gs = Game.gs;
    if(gs.moveQueue.length > 0 && !gs.moveLocked) {
      const next = gs.moveQueue.shift();
      Game._dungeonInput(next);
    }
  },

  _dungeonInput(action) {
    const gs = Game.gs;
    const p  = gs.player;
    const moves = { up:[0,-1], down:[0,1], left:[-1,0], right:[1,0] };

    if(action === 'inv') {
      gs.ui.inventorySelect = -1; gs.ui.inventoryAction = false;
      Game.setState('inventory'); return;
    }
    if(action === 'skill') {
      if(p.skillCd > 0) { UI.notify(gs, `Skill on cooldown (${p.skillCd} turns)!`); return; }
      const cls = CLASSES[p.classId];
      if(cls.skill.effect === 'block') {
        p.blocking = true; p.skillCd = cls.skill.cd;
        Sound.play('skill_warrior');
        UI.notify(gs, 'Shieldwall active!');
      } else {
        UI.notify(gs, 'Use skill in combat!');
      }
      return;
    }

    const d = moves[action];
    if(!d) return;
    const nx = p.x + d[0], ny = p.y + d[1];

    // Attack enemy?
    const enemy = Dungeon.getEnemyAt(gs.enemies, nx, ny);
    if(enemy) {
      gs.combat = Combat.start(p, enemy);
      Game.setState('combat'); return;
    }

    // Move
    if(!Dungeon.isBlocked(gs.map, gs.enemies, nx, ny)) {
      p.x = nx; p.y = ny;
      gs.moveLocked = true;
      Sound.play('step');
      Dungeon.updateVision(gs.map, gs.revealed, p.x, p.y);

      // Spot enemies within range
      for(const en of gs.enemies) {
        if(!en.alive) continue;
        const dist = Math.abs(en.x - p.x) + Math.abs(en.y - p.y);
        if(dist <= Dungeon.VISION + 1) en.spotted = true;
      }

      // Enemy AI step
      Game._runEnemyAI();

      // Pick up item
      const item = Dungeon.getItemAt(gs.items, p.x, p.y);
      if(item) {
        item.picked = true;
        if(Player.addToInventory(p, item)) {
          Sound.play('pickup');
          UI.notify(gs, `Found: ${item.name}!`);
        } else { UI.notify(gs, 'Bag full!'); item.picked = false; }
      }

      // Stairs?
      if(gs.map[p.y][p.x] === T.STAIRS) {
        Sound.play('stairs');
        Game._fadeToNextFloor();
        return;
      }

      Game.saveGame();
    }
  },

  _runEnemyAI() {
    const gs = Game.gs;
    const p  = gs.player;
    for(const en of gs.enemies) {
      if(!en.alive || !en.spotted) continue;
      const moved = Dungeon.stepEnemyAI(en, p, gs.map, gs.enemies);
      // If enemy walked onto player tile → auto-start combat
      if(moved && en.x === p.x && en.y === p.y) {
        en.x = en.rx !== undefined ? Math.round(en.rx / TS) : en.x; // rollback pos
        // revert: put enemy back one step (player doesn't move to enemy in AI)
        Dungeon.stepEnemyAI(en, p, gs.map, gs.enemies); // just ensure it's adjacent
        gs.combat = Combat.start(p, en);
        Game.setState('combat');
        return;
      }
    }
  },

  _fadeToNextFloor() {
    const gs = Game.gs;
    gs.fade = { alpha: 0, dir: 1 };
    const checkFade = setInterval(() => {
      if(gs.fade.alpha >= 1) {
        clearInterval(checkFade);
        Game._nextFloor();
        gs.fade.dir = -1; // fade in on new floor
      }
    }, 16);
  },

  _combatInput(action) {
    const gs = Game.gs;
    const c  = gs.combat;
    if(c.phase === 'victory' || c.phase === 'defeat' || c.phase === 'flee') return;
    if(c.phase !== 'player') return;

    if(action === 'attack') {
      Combat.playerAttack(c, gs); Game._afterPlayerAction();
    } else if(action === 'cskill') {
      Combat.playerSkill(c, gs); Game._afterPlayerAction();
    } else if(action === 'citem') {
      const p = gs.player;
      const consumable = p.inventory.find(i => i.type === 'consumable');
      if(consumable) { Combat.playerItem(c, consumable, gs); Game._afterPlayerAction(); }
      else UI.notify(gs, 'No usable items!');
    } else if(action === 'flee') {
      c.phase = 'flee'; c.log.push('You fled!');
      Sound.play('flee');
      Game._endCombat();
    }
  },

  _afterPlayerAction() {
    const gs = Game.gs;
    const c  = gs.combat;
    if(c.phase === 'victory') {
      const rewards = Combat.getRewards(c);
      gs.meta.totalKills++;
      UI.notify(gs, `Victory! +${rewards.xp} XP${rewards.levelMsgs.length ? ' ' + rewards.levelMsgs.join(' ') : ''}`, 120);
      Game._endCombat();
    } else if(c.phase === 'defeat') {
      Game._handleDeath();
    } else if(c.phase === 'flee') {
      Game._endCombat();
    } else if(c.phase === 'enemy') {
      setTimeout(() => {
        Combat.enemyTurn(c, gs);
        if(c.phase === 'defeat') Game._handleDeath();
      }, 500);
    }
  },

  _endCombat() {
    const gs = Game.gs;
    const c  = gs.combat;
    if(c.enemy.alive === false) {
      const idx = gs.enemies.indexOf(c.enemy);
      if(idx >= 0) gs.enemies.splice(idx, 1);
    }
    gs.combat = null;
    if(gs.player.pendingPoints > 0) {
      gs._returnScene = 'dungeon';
      Game.setState('levelUp');
    } else {
      Game.setState('dungeon');
    }
    Game.saveGame();
  },

  _handleDeath() {
    const gs = Game.gs;
    gs.meta.bestFloor = Math.max(gs.meta.bestFloor, gs.floor);
    Game._saveMeta();
    localStorage.removeItem('dok_save');
    Sound.play('game_over');
    Game.setState('gameOver');
  },

  _nextFloor() {
    const gs = Game.gs;
    if(gs.floor === 10) { Game._winGame(); return; }
    gs.floor++;
    const dungeon = Dungeon.generate(gs.floor);
    gs.map = dungeon.map; gs.revealed = dungeon.revealed; gs.rooms = dungeon.rooms;
    gs.enemies = dungeon.enemies; gs.items = dungeon.items;
    gs.player.x = dungeon.startX; gs.player.y = dungeon.startY;
    gs.player.rx = gs.player.x * TS; gs.player.ry = gs.player.y * TS;
    gs.damageNums = [];
    UI.notify(gs, `Floor ${gs.floor}`, 120);
    Game.setState('dungeon');
    Game.saveGame();
  },

  _winGame() {
    const gs = Game.gs;
    gs.meta.bestFloor = 10;
    Game._saveMeta();
    localStorage.removeItem('dok_save');
    Game.setState('victory');
  },

  startNewGame() { Game.setState('classSelect'); },

  selectClass(classId) {
    const gs = Game.gs;
    gs.player = Player.create(classId);
    gs.floor  = 1;
    gs.damageNums = []; gs.hitFlash = null; gs.playerHitFlash = 0;
    const dungeon = Dungeon.generate(1);
    gs.map = dungeon.map; gs.revealed = dungeon.revealed; gs.rooms = dungeon.rooms;
    gs.enemies = dungeon.enemies; gs.items = dungeon.items;
    gs.player.x = dungeon.startX; gs.player.y = dungeon.startY;
    gs.player.rx = gs.player.x * TS; gs.player.ry = gs.player.y * TS;
    gs.fade = { alpha: 1, dir: -1 };
    UI.notify(gs, `Welcome, ${CLASSES[classId].name}! Find the stairs.`, 160);
    Game.setState('dungeon');
    Game.saveGame();
  },

  _handleInventoryTap(x, y) {
    const gs = Game.gs;
    const p  = gs.player;
    const W  = Game.canvas.width, H = Game.canvas.height;
    const inv = p.inventory;
    let tappedItem = false;
    inv.forEach((it, i) => {
      const bx = 8 + (i % 2) * ((W-16)/2);
      const by = 154 + Math.floor(i/2) * 28;
      if(x >= bx && x <= bx+(W-16)/2 && y >= by && y <= by+28) {
        tappedItem = true;
        if(gs.ui.inventorySelect === i && gs.ui.inventoryAction) {
          if(it.type === 'consumable') {
            const r = Player.useConsumable(p, it, false);
            Sound.play('pickup');
            UI.notify(gs, r.msg);
          } else {
            const msg = Player.equip(p, it);
            Sound.play('pickup');
            UI.notify(gs, msg);
          }
          gs.ui.inventorySelect = -1; gs.ui.inventoryAction = false;
        } else if(gs.ui.inventorySelect === i) {
          gs.ui.inventoryAction = true;
        } else {
          gs.ui.inventorySelect = i; gs.ui.inventoryAction = false;
        }
      }
    });
    if(!tappedItem && y < 154) {
      gs.ui.inventorySelect = -1; gs.ui.inventoryAction = false;
      Game.setState('dungeon');
    }
  },

  saveGame() {
    const gs = Game.gs;
    if(!gs.player) return;
    try {
      const save = {
        player: gs.player, floor: gs.floor,
        map: gs.map.map(r => Array.from(r)),
        revealed: gs.revealed.map(r => Array.from(r)),
        enemies: gs.enemies, items: gs.items,
      };
      localStorage.setItem('dok_save', JSON.stringify(save));
    } catch(e) { console.warn('Save failed', e); }
    Game._saveMeta();
  },

  _saveMeta() {
    localStorage.setItem('dok_meta', JSON.stringify(Game.gs.meta));
  },

  loadGame() {
    const gs = Game.gs;
    try {
      const save = JSON.parse(localStorage.getItem('dok_save'));
      if(!save) return;
      gs.player = save.player; gs.floor = save.floor;
      gs.map = save.map; gs.revealed = save.revealed;
      gs.enemies = save.enemies; gs.items = save.items;
      gs.damageNums = []; gs.hitFlash = null; gs.playerHitFlash = 0;
      gs.fade = { alpha: 1, dir: -1 };
      Game.setState('dungeon');
    } catch(e) { localStorage.removeItem('dok_save'); Game.startNewGame(); }
  },
};
