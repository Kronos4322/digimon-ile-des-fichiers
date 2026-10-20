'use strict';
// =====================================================================
//  DÉCOR VIVANT (cartes extérieures) — dessiné au sol, sous les objets :
//  reflets du soleil sur l'eau, poissons qui sautent, reflet du héros au bord de l'eau,
//  ombres des nuages qui glissent, papillons le jour, lucioles les nuits d'été.
// =====================================================================
(function () {
  const TS = 16, hash = DW.Art.hash;
  const isWater = ch => { const I = DW.World.info(ch); return I && I.t === 'water'; };
  // cases d'eau « au large » (entourées d'eau) : là où les poissons sautent
  function waterTiles(map) {
    if (map._water && map._water.rows === map.rows) return map._water;
    const all = [], deep = [];
    map.rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) if (isWater(r[x])) {
      all.push([x, y]);
      if ([[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dy]) => isWater((map.rows[y + dy] || '')[x + dx] || '#'))) deep.push([x, y]);
    } });
    return (map._water = { rows: map.rows, all, deep });
  }

  DW.Vivant = {
    init(ow) {
      ow.viv = { fish: null, fishT: 2 + Math.random() * 3, flies: [], bugs: [] };
      const se = DW.Time.season();
      // papillons (printemps, été) ; lucioles (été, nuit)
      const n = ow.map.indoor ? 0 : se === 3 ? 0 : se === 2 ? 3 : 7;
      for (let i = 0; i < n; i++) ow.viv.bugs.push({ x: Math.random() * ow.map.w * TS, y: Math.random() * ow.map.h * TS, ph: Math.random() * 6, c: ['#ffffff', '#ffe070', '#ff9ac8', '#9ad0ff', '#ffb050'][i % 5], vx: 0, vy: 0 });
      if (!ow.map.indoor && se === 1) for (let i = 0; i < 18; i++) ow.viv.flies.push({ x: Math.random() * ow.map.w * TS, y: Math.random() * ow.map.h * TS, ph: Math.random() * 6 });
    },
    update(ow, dt) {
      const v = ow.viv; if (!v || ow.map.indoor) return;
      const W = waterTiles(ow.map);
      // un poisson saute de temps en temps dans l'eau visible
      if (!v.fish && W.deep.length && (v.fishT -= dt) <= 0) {
        const { cx, cy } = ow.camera();
        const near = W.deep.filter(([x, y]) => Math.abs(x * TS - cx - DW.W / 2) < DW.W / 2 && Math.abs(y * TS - cy - DW.H / 2) < DW.H / 2);
        if (near.length) { const [x, y] = near[Math.floor(Math.random() * near.length)]; v.fish = { x: x * TS + 8, y: y * TS + 10, t: 0, dir: Math.random() < 0.5 ? -1 : 1 }; }
        v.fishT = 3 + Math.random() * 5;
      }
      if (v.fish && (v.fish.t += dt) > 1.6) v.fish = null;
      for (const b of v.bugs) {
        b.ph += dt * 6;
        if (b.tx == null || Math.random() < dt * 0.3) { b.tx = b.x + (Math.random() - 0.5) * 120; b.ty = b.y + (Math.random() - 0.5) * 80; }
        b.vx += ((b.tx - b.x) * 0.4 - b.vx) * dt; b.vy += ((b.ty - b.y) * 0.4 - b.vy) * dt;
        b.x += b.vx * dt; b.y += b.vy * dt + Math.sin(b.ph) * 8 * dt;
        b.x = Math.max(0, Math.min(ow.map.w * TS, b.x)); b.y = Math.max(0, Math.min(ow.map.h * TS, b.y));
      }
      for (const f of v.flies) { f.ph += dt; f.x += Math.sin(f.ph * 0.7) * 6 * dt; f.y += Math.cos(f.ph * 0.5) * 4 * dt; }
    },
    // au sol (avant les objets) : reflets, poissons, reflet du héros, ombres des nuages
    drawGround(ow, c, x0, x1, y0, y1) {
      const v = ow.viv; if (!v || ow.map.indoor) return;
      const t = ow.t, L = DW.Time.light(), day = L.dark < 0.35, clear = DW.Time.weather() === 'clear';
      const W = waterTiles(ow.map);
      // éclats de soleil qui scintillent sur l'eau
      if (day && W.all.length) {
        const bucket = Math.floor(t * 2.5);
        for (const [x, y] of W.all) {
          const X = x * TS, Y = y * TS;
          if (X < x0 - TS || X > x1 || Y < y0 - TS || Y > y1) continue;
          for (let k = 0; k < 2; k++) {
            const h = hash(x * 3 + k, y + bucket * 7, 600);
            if (h > (clear ? 0.16 : 0.06)) continue;
            const px = X + Math.floor(hash(x, y + k, 601) * 14) + 1, py = Y + Math.floor(hash(x + k, y, 602) * 12) + 2, a = 0.5 + 0.5 * Math.sin(t * 9 + x + y * 2);
            c.fillStyle = `rgba(255,255,240,${0.75 * a})`; c.fillRect(px, py, 3, 1); c.fillRect(px + 1, py - 1, 1, 3);
          }
        }
      }
      // reflet du héros quand il se tient juste au-dessus de l'eau
      const P = ow.p, below = (ow.map.rows[P.y + 1] || '')[P.x];
      if (below && isWater(below) && !P.moving) {
        const spr = DW.Sprites.hero(P.face8 || P.dir, 0), pp = ow.pos(P);
        const X = Math.round(pp.x * TS + 8 - spr.w / 2), Y = Math.round(pp.y * TS + 17);
        c.save(); c.globalAlpha = 0.28; c.translate(X, Y + spr.h); c.scale(1, -1);
        c.drawImage(spr.img, 0, Math.sin(t * 3) * 0.6, spr.w, spr.h); c.restore();
      }
      // poisson : saut en arc, éclaboussures au départ et à l'arrivée
      if (v.fish) {
        const f = v.fish, k = Math.min(1, f.t / 0.8);
        if (f.t < 0.8) {
          const fx = f.x + f.dir * k * 14, fy = f.y - Math.sin(k * Math.PI) * 12;
          c.fillStyle = '#c8d8e8'; c.beginPath(); c.ellipse(fx, fy, 3, 1.4, f.dir * (k - 0.5) * 1.8, 0, 7); c.fill();
          c.fillStyle = '#7a9ab8'; c.fillRect(Math.round(fx - f.dir * 3), Math.round(fy - 1), 1, 2);
        }
        for (const [sx, st0] of [[f.x, 0], [f.x + f.dir * 14, 0.8]]) {
          const r = (f.t - st0) * 14; if (r <= 0 || r > 10) continue;
          c.strokeStyle = `rgba(230,245,255,${1 - r / 10})`; c.lineWidth = 0.8;
          c.beginPath(); c.ellipse(sx, f.y, r, r * 0.35, 0, 0, 7); c.stroke();
        }
      }
      // ombres des nuages qui glissent sur le sol (beau temps, en journée)
      if (day && clear) {
        const a = 0.09 * (1 - L.dark * 2.5), drift = t * 6;
        if (a > 0.01) {
          c.fillStyle = `rgba(10,20,40,${a})`;
          for (let i = 0; i < 6; i++) {
            const bx = hash(i, 1, 610) * 900 + drift, by = hash(i, 2, 610) * 700, rx = 70 + hash(i, 3, 610) * 50, ry = 28 + hash(i, 4, 610) * 18;
            for (let X = bx + Math.ceil((x0 - 160 - bx) / 900) * 900; X < x1 + 160; X += 900)
              for (let Y = by + Math.ceil((y0 - 100 - by) / 700) * 700; Y < y1 + 100; Y += 700) {
                c.beginPath(); c.ellipse(X, Y, rx, ry, 0, 0, 7); c.fill();
                c.beginPath(); c.ellipse(X + 40, Y - 14, 40, 22, 0, 0, 7); c.fill();
              }
          }
        }
      }
    },
    // au-dessus des objets : papillons et lucioles
    drawAir(ow, c) {
      const v = ow.viv; if (!v || ow.map.indoor) return;
      const L = DW.Time.light(), t = ow.t;
      if (L.dark < 0.4 && !DW.Time.rainy()) for (const b of v.bugs) {
        const w = Math.abs(Math.sin(b.ph * 2)) * 2 + 0.5;
        c.fillStyle = b.c; c.fillRect(Math.round(b.x - w), Math.round(b.y), Math.round(w), 2); c.fillRect(Math.round(b.x + 1), Math.round(b.y), Math.round(w), 2);
        c.fillStyle = '#3a2a2a'; c.fillRect(Math.round(b.x), Math.round(b.y), 1, 2);
      }
      if (L.dark > 0.35 && v.flies.length) {
        c.save(); c.globalCompositeOperation = 'lighter';
        for (const f of v.flies) { const a = 0.5 + 0.5 * Math.sin(t * 3 + f.ph * 5); c.fillStyle = `rgba(200,255,120,${a})`; c.fillRect(Math.round(f.x), Math.round(f.y), 2, 2); c.fillStyle = `rgba(200,255,120,${a * 0.25})`; c.fillRect(Math.round(f.x) - 2, Math.round(f.y) - 2, 6, 6); }
        c.restore();
      }
    },
  };
})();
