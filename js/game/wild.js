'use strict';
// =====================================================================
//  DIGIMON SAUVAGES VISIBLES (façon Digimon World 1)
//  Plus de rencontres au hasard dans les herbes : les Digimon se promènent
//  sur la carte, certains te repèrent et te foncent dessus. Le contact
//  lance le combat. Un Digimon battu revient quelques heures plus tard.
// =====================================================================
(function () {
  const TS = 16, DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const GONE_WIN = 180, GONE_RUN = 25;   // minutes de jeu avant réapparition
  const STAGE_LV = { 'Bébé': -4, 'Entraînement': -2, Disciple: 0, Champion: 2, Ultime: 5, 'Méga': 8 };

  // ------------------------------------------------------------ tables des régions
  // 'espèce:poids' ; '@n' = à partir de la sous-zone n ; 'nP' = poids la nuit (0 le jour si 'j0')
  const TABLES = {
    montagne: [8, 'gotsumon:30 biyomon:20 elecmon:15 gabumon:15 monochromon:8@6 leomon:5@8'],
    lac: [9, 'betamon:30 gomamon:30 penguinmon:15 gekomon:10@4 shellmon:8@5 seadramon:6@7'],
    brumes: [10, 'mushroomon:30n50 kunemon:20 patamon:15 palmon:15 bakemon:0n25@3 unimon:5@7'],
    marais: [10, 'betamon:25 mushroomon:25n40 palmon:20 gekomon:12@3 numemon:8@4n12 sukamon:6@5n12'],
    savane: [12, 'elecmon:30 agumon:20 biyomon:20 leomon:10@4 monochromon:8@5 centarumon:6@7'],
    volcan: [16, 'agumon:30 gotsumon:20 meramon:20@2 monochromon:12 birdramon:8@5 skullmeramon:3@9'],
    usine: [18, 'kunemon:25 tentomon:25 elecmon:20 numemon:15 kabuterimon:10@4 andromon:3@8'],
    decharge: [18, 'numemon:30 sukamon:30 kunemon:15 mushroomon:15 ogremon:8@4 etemon:2@9'],
    tunnel: [18, 'gotsumon:30 kunemon:15 numemon:15 bakemon:10n25 drimogemon:20@2 devimon:3@8'],
    jouets: [20, 'patamon:25 biyomon:20 penguinmon:20 numemon:15 monzaemon:2@8 piximon:2@9'],
    canyon: [20, 'gotsumon:25 monochromon:20 birdramon:10 ogremon:15@2 leomon:12@4 centarumon:8@6'],
    scarabees: [20, 'tentomon:30 kunemon:25 kuwagamon:15@2 kabuterimon:12@4 okuwamon:3@8'],
    dino: [24, 'monochromon:25 agumon:20 greymon:20 drimogemon:10 skullgreymon:3@8 metalgreymon:2@9'],
    jungle: [24, 'palmon:25 togemon:20 biyomon:15 kuwagamon:15 birdramon:10@3 lillymon:3@8'],
    gel: [24, 'gabumon:25 penguinmon:25 frigimon:20 garurumon:15@2 ikkakumon:12@3 weregarurumon:3@8'],
    overdell: [28, 'bakemon:30n50 numemon:15 sukamon:10 mushroomon:15 devimon:12@3 skullgreymon:4@7 megadramon:3@8'],
  };
  function parse(str) {
    return str.split(/\s+/).map(t => {
      const [sp, rest] = t.split(':'), n = rest.match(/n(\d+)/), at = rest.match(/@(\d+)/);
      return { sp, w: parseInt(rest, 10), night: n ? +n[1] : null, from: at ? +at[1] : 0 };
    });
  }
  // remplit les rencontres des sous-zones de région (appelé une fois au chargement)
  function fillRegions() {
    for (const id in DW.MAPS) {
      const m = DW.MAPS[id], T = TABLES[m.region];
      if (!T || m.indoor && !m.dark || (m.encounters && m.encounters.length)) continue;
      const idx = +(id.match(/(\d+)$/) || [0, 0])[1], base = T[0] + Math.floor(idx * 0.8);
      m.encounters = parse(T[1]).filter(e => idx >= e.from && DW.SPECIES[e.sp]).map(e => {
        const lv = base + (STAGE_LV[DW.SPECIES[e.sp].stage] || 0);
        return { sp: e.sp, min: lv - 1, max: lv + 1, w: e.w, night: e.night };
      });
      m.wildN = m.wildN || DW.clamp(Math.round(m.w * m.h / 240), 3, 6);
    }
  }

  // ------------------------------------------------------------ système
  const Wild = DW.Wild = {
    TABLES,
    target(map) { return map.encounters && map.encounters.length ? map.wildN || DW.clamp(Math.round(map.w * map.h / 260), 2, 6) : 0; },
    gone(mapId) {
      const st = DW.state, g = st.wildGone = st.wildGone || {};
      if (g[mapId]) { g[mapId] = g[mapId].filter(t => t > st.clock); if (!g[mapId].length) delete g[mapId]; }
      return g[mapId] || [];
    },
    // un Digimon sauvage, placé loin du héros, de préférence dans les herbes
    spawnOne(ow, minDist) {
      const map = ow.map, P = ow.p, night = DW.Time.isNight();
      const list = map.encounters.map(x => ({ ...x, w: night && x.night != null ? x.night : x.w })).filter(x => x.w > 0);
      if (!list.length) return null;
      const e = DW.weighted(list);
      let best = null;
      for (let k = 0; k < 40 && !best; k++) {
        const x = 2 + Math.floor(Math.random() * (map.w - 4)), y = 2 + Math.floor(Math.random() * (map.h - 4));
        if (Math.abs(x - P.x) + Math.abs(y - P.y) < minDist || ow.solid(x, y) || Wild.at(ow, x, y)) continue;
        if (k < 25 && !DW.World.isTall(ow.tileAt(x, y)) && Math.random() < 0.6) continue;
        best = [x, y];
      }
      if (!best) return null;
      const st = DW.SPECIES[e.sp].stage, aggro = ['Champion', 'Ultime', 'Méga'].includes(st) ? 0.8 : 0.35;
      const w = { sp: e.sp, lv: DW.rand(e.min, e.max), x: best[0], y: best[1], hx: best[0], hy: best[1], home: best, mv: null,
        wt: Math.random() * 2, face: Math.random() < 0.5 ? 'left' : 'right', aggro: Math.random() < aggro, alert: 0, seen: false };
      ow.wilds.push(w);
      return w;
    },
    spawn(ow) {
      if (!fillRegions.done) { fillRegions(); fillRegions.done = true; }
      ow.wilds = []; ow.wildT = 0; ow.wildGrace = 2.5;
      const n = Wild.target(ow.map) - Wild.gone(ow.mapId).length;
      for (let i = 0; i < n; i++) Wild.spawnOne(ow, 6);
    },
    at(ow, x, y) { return (ow.wilds || []).find(w => w.x === x && w.y === y); },
    update(ow, dt) {
      if (!ow.wilds) return;
      const P = ow.p, F = ow.f;
      if (ow.wildGrace > 0) ow.wildGrace -= dt;
      // réapparitions (hors de vue)
      ow.wildT += dt;
      if (ow.wildT > 20) { ow.wildT = 0; if (ow.wilds.length + Wild.gone(ow.mapId).length < Wild.target(ow.map)) Wild.spawnOne(ow, 11); }
      for (const w of ow.wilds) {
        if (w.alert > 0) w.alert -= dt;
        if (w.mv) {
          w.mv.t += dt / w.mv.d;
          const k = Math.min(1, w.mv.t);
          w.hx = DW.lerp(w.mv.sx, w.x, k); w.hy = DW.lerp(w.mv.sy, w.y, k);
          if (k >= 1) w.mv = null;
          continue;
        }
        const dx = P.x - w.x, dy = P.y - w.y, dist = Math.abs(dx) + Math.abs(dy);
        const chase = w.aggro && !(DW.state.repelUntil > DW.state.clock) && dist <= 5 && Math.abs(w.x - w.home[0]) + Math.abs(w.y - w.home[1]) < 10;
        if (chase && !w.seen) { w.seen = true; w.alert = 0.9; w.wt = 0.45; DW.Audio.sfx('select'); }
        if (!chase && dist > 7) w.seen = false;
        w.wt -= dt;
        if (w.wt > 0) continue;
        let opts;
        if (chase) {
          w.wt = 0.05;
          opts = [[Math.sign(dx), 0], [0, Math.sign(dy)]].filter(([a, b]) => a || b);
          if (Math.abs(dy) > Math.abs(dx)) opts.reverse();
        } else {
          w.wt = 1 + Math.random() * 3;
          const d = DIRS[Math.floor(Math.random() * 4)];
          if (Math.abs(w.x + d[0] - w.home[0]) > 4 || Math.abs(w.y + d[1] - w.home[1]) > 4) continue;
          opts = [d];
        }
        for (const [ax, ay] of opts) {
          const nx = w.x + ax, ny = w.y + ay;
          if (nx < 1 || ny < 1 || nx >= ow.map.w - 1 || ny >= ow.map.h - 1) continue;
          if ((nx === P.x && ny === P.y) || (nx === P.tx && ny === P.ty) || (nx === F.x && ny === F.y) || (nx === F.tx && ny === F.ty)) continue;
          if (ow.solid(nx, ny) || Wild.at(ow, nx, ny)) continue;
          if (ax) w.face = ax > 0 ? 'right' : 'left';
          w.mv = { sx: w.x, sy: w.y, t: 0, d: chase ? 0.3 : 0.5 };
          w.x = nx; w.y = ny;
          if (DW.World.isTall(ow.tileAt(nx, ny))) ow.rustle[nx + ',' + ny] = 0.4;
          break;
        }
      }
    },
    // contact : un Digimon sauvage collé au héros (immobile) déclenche le combat
    contact(ow) {
      if (!ow.wilds || ow.wildGrace > 0 || !ow.partner) return null;
      const P = ow.p;
      if (P.moving) return null;
      const w = ow.wilds.find(w => !w.mv && Math.abs(w.x - P.x) + Math.abs(w.y - P.y) <= 1);
      if (!w) return null;
      return async () => {
        if (w.x !== P.x) P.dir = w.x > P.x ? 'right' : 'left'; else P.dir = w.y > P.y ? 'down' : 'up';
        w.face = w.x > P.x ? 'left' : 'right'; w.alert = 0.6;
        await DW.wait(0.25);
        const res = await ow.battle({ enemy: new DW.Digimon(w.sp, w.lv) });
        ow.wilds = ow.wilds.filter(o => o !== w);
        const st = DW.state, g = st.wildGone = st.wildGone || {};
        (g[ow.mapId] = g[ow.mapId] || []).push(st.clock + (res === 'win' ? GONE_WIN : GONE_RUN));
        ow.wildGrace = 1.5;
      };
    },
    entries(ow, list) {
      for (const w of ow.wilds || []) list.push({ s: w.hy, ent: 'wild', w, tile: [w.x, w.y] });
    },
    draw(ow, c, w) {
      const X = w.hx * TS + 8, Y = w.hy * TS + 15;
      ow.drawMon(c, w.sp, X, Y, w.face === 'left', w.mv ? ow.t * 12 : ow.t * 1.6 + w.x * 0.37, !!w.mv);
      if (w.alert > 0) {
        const spr = DW.Sprites.ow(w.sp), top = Math.round(Y - spr.h - 6 + Math.min(0, (w.alert - 0.7) * 20));
        c.fillStyle = '#1a0e22'; c.fillRect(Math.round(X) - 2, top - 1, 5, 10);
        c.fillStyle = '#ff4a3a'; c.fillRect(Math.round(X) - 1, top, 3, 5); c.fillRect(Math.round(X) - 1, top + 6, 3, 2);
      }
    },
  };
  DW.Wild.fillRegions = fillRegions;
})();
