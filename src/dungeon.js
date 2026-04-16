// ── Dungeon Module ─────────────────────────────────────────────────────────
const T = { VOID: 0, FLOOR: 1, WALL: 2, STAIRS: 3 };

// Room types
const ROOM_TYPE = { NORMAL: 0, TREASURE: 1, DEN: 2, START: 3, BOSS: 4 };

const Dungeon = {
  MAP_W: 50, MAP_H: 50,
  VISION: 6,

  generate(floorNum) {
    const map     = Array.from({length:50}, () => new Uint8Array(50).fill(T.WALL));
    const revealed= Array.from({length:50}, () => new Uint8Array(50).fill(0));
    const rooms   = [];

    /* ── BSP room carver ─────────────────────────────────── */
    function carveRoom(x, y, w, h, type = ROOM_TYPE.NORMAL) {
      for(let ry = y; ry < y + h; ry++)
        for(let rx = x; rx < x + w; rx++) map[ry][rx] = T.FLOOR;
      const room = { x, y, w, h, cx: x + Math.floor(w/2), cy: y + Math.floor(h/2), type, connected: false };
      rooms.push(room);
      return room;
    }

    function carveCorridor(x0, y0, x1, y1) {
      // L-shaped corridor, widen by 1 for a less claustrophobic feel
      const midX = x0, midY = y1;
      for(let x = Math.min(x0, midX); x <= Math.max(x0, midX); x++) {
        map[y0][x] = T.FLOOR;
        if(y0 > 0)  map[y0-1][x] = map[y0-1][x] === T.WALL ? T.FLOOR : map[y0-1][x];
      }
      for(let y = Math.min(y0, midY); y <= Math.max(y0, midY); y++) {
        map[y][midX] = T.FLOOR;
      }
      for(let x = Math.min(midX, x1); x <= Math.max(midX, x1); x++) {
        map[y1][x] = T.FLOOR;
      }
    }

    function roomsOverlap(a, b, pad = 2) {
      return !(a.x + a.w + pad <= b.x || b.x + b.w + pad <= a.x ||
               a.y + a.h + pad <= b.y || b.y + b.h + pad <= a.y);
    }

    /* ── Place rooms randomly, no overlap ────────────────── */
    const roomCount = 8 + Math.min(floorNum, 6);
    let attempts = 0;
    while(rooms.length < roomCount && attempts < 600) {
      attempts++;
      const rw = 4 + Math.floor(Math.random() * 5);
      const rh = 4 + Math.floor(Math.random() * 5);
      const rx = 2 + Math.floor(Math.random() * (48 - rw - 2));
      const ry = 2 + Math.floor(Math.random() * (48 - rh - 2));
      const candidate = { x: rx, y: ry, w: rw, h: rh };
      if(rooms.some(r => roomsOverlap(r, candidate))) continue;
      // Assign room type
      let type = ROOM_TYPE.NORMAL;
      if(rooms.length === 0) type = ROOM_TYPE.START;
      else if(rooms.length === roomCount - 1) type = ROOM_TYPE.BOSS;
      else if(Math.random() < 0.15) type = ROOM_TYPE.TREASURE;
      else if(Math.random() < 0.20) type = ROOM_TYPE.DEN;
      carveRoom(rx, ry, rw, rh, type);
    }

    /* ── Connect rooms with corridors (MST-like: connect each to nearest) ── */
    const connected = [rooms[0]];
    const unconnected = rooms.slice(1);
    while(unconnected.length > 0) {
      let bestDist = Infinity, bestFrom = null, bestTo = null, bestIdx = -1;
      for(const from of connected) {
        for(let i = 0; i < unconnected.length; i++) {
          const to = unconnected[i];
          const d = Math.abs(from.cx - to.cx) + Math.abs(from.cy - to.cy);
          if(d < bestDist) { bestDist = d; bestFrom = from; bestTo = to; bestIdx = i; }
        }
      }
      carveCorridor(bestFrom.cx, bestFrom.cy, bestTo.cx, bestTo.cy);
      bestTo.connected = true;
      connected.push(bestTo);
      unconnected.splice(bestIdx, 1);
    }

    // Guarantee extra corridor for loops (less linear feel)
    for(let i = 0; i < Math.floor(rooms.length / 3); i++) {
      const a = rooms[Math.floor(Math.random() * rooms.length)];
      const b = rooms[Math.floor(Math.random() * rooms.length)];
      if(a !== b) carveCorridor(a.cx, a.cy, b.cx, b.cy);
    }

    /* ── Place stairs in boss/last room ─────────────────── */
    const bossRoom  = rooms.find(r => r.type === ROOM_TYPE.BOSS) || rooms[rooms.length-1];
    const startRoom = rooms.find(r => r.type === ROOM_TYPE.START) || rooms[0];
    map[bossRoom.cy][bossRoom.cx] = T.STAIRS;

    /* ── Spawn enemies ───────────────────────────────────── */
    const enemies = Dungeon.spawnEnemies(floorNum, rooms, bossRoom, map);
    /* ── Spawn items ─────────────────────────────────────── */
    const items   = Dungeon.spawnItems(floorNum, rooms, map, enemies);

    /* ── Initial vision reveal ───────────────────────────── */
    const px = startRoom.cx, py = startRoom.cy;
    Dungeon.updateVision(map, revealed, px, py);

    return { map, revealed, rooms, enemies, items, startX: px, startY: py, bossRoom };
  },

  spawnEnemies(floorNum, rooms, bossRoom, map) {
    const pool    = ENEMIES_DATA.filter(e => e.minFloor <= floorNum && e.maxFloor >= floorNum);
    const enemies = [];
    const isBossFloor  = floorNum === 5 || floorNum === 10;
    const bossData     = isBossFloor ? BOSSES_DATA.find(b => b.floor === floorNum) : null;

    for(const room of rooms) {
      if(room.type === ROOM_TYPE.START) continue;
      if(room === bossRoom && bossData) continue;

      const count = room.type === ROOM_TYPE.DEN ? 3 : room.type === ROOM_TYPE.TREASURE ? 0 : 1 + Math.floor(Math.random() * 2);
      for(let i = 0; i < count && pool.length > 0; i++) {
        const data  = pool[Math.floor(Math.random() * pool.length)];
        const scale = 1 + (floorNum - data.minFloor) * 0.12;
        // Offset enemy from room center
        const ex = room.cx + (i === 0 ? 0 : Math.floor(Math.random()*3)-1);
        const ey = room.cy + (i === 0 ? 0 : Math.floor(Math.random()*3)-1);
        if(map[ey]?.[ex] !== T.FLOOR) continue;
        enemies.push({
          ...data,
          hp: Math.floor(data.hp * scale), maxHp: Math.floor(data.hp * scale),
          atk: Math.floor(data.atk * scale), def: data.def,
          x: ex, y: ey,
          alive: true, id: 'e_' + Date.now() + '_' + Math.random(),
          isBoss: false,
          spotted: false,
          // Render lerp position (pixels)
          rx: ex * 28, ry: ey * 28,
        });
      }
    }

    if(bossData) {
      enemies.push({
        ...bossData,
        maxHp: bossData.hp,
        x: bossRoom.cx, y: bossRoom.cy,
        alive: true, id: 'boss_' + bossData.id,
        isBoss: true, inPhase2: false,
        spotted: false,
        rx: bossRoom.cx * 28, ry: bossRoom.cy * 28,
      });
    }
    return enemies;
  },

  spawnItems(floorNum, rooms, map, enemies) {
    const items   = [];
    const pool    = ITEMS_DATA.filter(it => it.minFloor <= floorNum);
    const occupied = new Set(enemies.map(e => `${e.x},${e.y}`));

    for(const room of rooms) {
      const isTreasure = room.type === ROOM_TYPE.TREASURE;
      const chance = isTreasure ? 1.0 : 0.5;
      if(Math.random() > chance) continue;
      const count = isTreasure ? 2 + Math.floor(Math.random()*2) : 1;
      for(let i = 0; i < count; i++) {
        for(let attempt = 0; attempt < 10; attempt++) {
          const fx = room.x + 1 + Math.floor(Math.random() * (room.w - 2));
          const fy = room.y + 1 + Math.floor(Math.random() * (room.h - 2));
          const key = `${fx},${fy}`;
          if(map[fy]?.[fx] !== T.FLOOR || occupied.has(key)) continue;
          // Weight items by rarity (higher floor → better drops)
          const rarityBoost = Math.floor(floorNum / 3);
          const weighted = [];
          for(const it of pool) {
            const w = Math.max(1, 6 - it.rarity + rarityBoost - (it.minFloor > floorNum - 1 ? 2 : 0));
            // Treasure rooms prefer higher rarity
            const tw = isTreasure ? Math.max(1, w - it.rarity + 2) : w;
            for(let j = 0; j < tw; j++) weighted.push(it);
          }
          const chosen = weighted[Math.floor(Math.random() * weighted.length)];
          items.push({ ...chosen, x: fx, y: fy, picked: false });
          occupied.add(key);
          break;
        }
      }
    }
    return items;
  },

  updateVision(map, revealed, px, py) {
    const r = Dungeon.VISION;
    for(let dy = -r; dy <= r; dy++) {
      for(let dx = -r; dx <= r; dx++) {
        const nx = px + dx, ny = py + dy;
        if(nx < 0 || ny < 0 || nx >= 50 || ny >= 50) continue;
        if(Math.sqrt(dx*dx + dy*dy) <= r) revealed[ny][nx] = 1;
      }
    }
  },

  isBlocked(map, enemies, x, y) {
    if(x < 0 || y < 0 || x >= 50 || y >= 50) return true;
    if(map[y][x] === T.WALL || map[y][x] === T.VOID) return true;
    if(enemies.find(e => e.alive && e.x === x && e.y === y)) return true;
    return false;
  },

  getEnemyAt(enemies, x, y) {
    return enemies.find(e => e.alive && e.x === x && e.y === y) || null;
  },

  getItemAt(items, x, y) {
    return items.find(i => !i.picked && i.x === x && i.y === y) || null;
  },

  // Enemy AI: move one step toward player if spotted
  stepEnemyAI(enemy, player, map, allEnemies) {
    if(!enemy.alive || !enemy.spotted) return false;
    const dx = player.x - enemy.x, dy = player.y - enemy.y;
    if(dx === 0 && dy === 0) return false;

    // Build candidate moves ordered by distance reduction
    const sdx = Math.sign(dx), sdy = Math.sign(dy);
    const moves = [];
    if(sdx !== 0 && sdy !== 0) moves.push([sdx, sdy], [sdx, 0], [0, sdy]);
    else if(sdx !== 0)          moves.push([sdx, 0], [0, 1], [0, -1]);
    else                         moves.push([0, sdy], [1, 0], [-1, 0]);

    for(const [mx, my] of moves) {
      const nx = enemy.x + mx, ny = enemy.y + my;
      // Allow moving onto player's tile (triggers combat in game.js)
      if(nx === player.x && ny === player.y) { enemy.x = nx; enemy.y = ny; return true; }
      if(!Dungeon.isBlocked(map, allEnemies, nx, ny)) { enemy.x = nx; enemy.y = ny; return true; }
    }
    return false;
  },
};
