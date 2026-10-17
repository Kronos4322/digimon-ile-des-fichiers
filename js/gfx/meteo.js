'use strict';
// =====================================================================
//  MÉTÉO SPECTACULAIRE (par-dessus engine/time.js)
//  - ORAGE : vrais éclairs ramifiés qui tombent jusqu'au sol, flashs énormes (double éclat),
//    tremblement de l'écran, tonnerre ; la foudre tombe parfois tout près... et peut frapper
//    le partenaire (quelques PV perdus) qui tremble ensuite de peur. Marques de brûlure au sol.
//  - BROUILLARD : on ne voit plus qu'un petit cercle autour du héros, des bancs de brume passent.
//  - CANICULE / SÉCHERESSE : l'herbe jaunit (sol recoloré), l'air tremble, le soleil écrase.
// =====================================================================
(function () {
  const T = DW.Time, W = DW.W, H = DW.H, TS = 16, Art = DW.Art;
  const R = Math.random;

  // ------------------------------------------------------------ éclair : tracé ramifié (coordonnées écran)
  function boltPath(x0, y0, x1, y1, depth) {
    const pts = [[x0, y0]], n = 9 + Math.floor(R() * 4);
    for (let i = 1; i < n; i++) {
      const k = i / n, sp = (1 - k) * 18 + 6;
      pts.push([x0 + (x1 - x0) * k + (R() - 0.5) * sp, y0 + (y1 - y0) * k + (R() - 0.5) * 6]);
    }
    pts.push([x1, y1]);
    const branches = [];
    if (depth > 0) for (let i = 2; i < pts.length - 2; i++) if (R() < 0.38) {
      const [bx, by] = pts[i], len = 30 + R() * 50, a = Math.PI / 2 + (R() < 0.5 ? -1 : 1) * (0.5 + R() * 0.6);
      branches.push(boltPath(bx, by, bx + Math.cos(a) * len, by + Math.sin(a) * len, depth - 1));
    }
    return { pts, branches };
  }
  function strokeBolt(c, b, w) {
    c.beginPath(); b.pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.lineWidth = w; c.stroke();
    for (const s of b.branches) strokeBolt(c, s, Math.max(0.6, w * 0.55));
  }

  const M = DW.Meteo = {
    bolts: [], scorch: [], flash: 0, next: 2, fear: 0, clouds: null,
    // le partenaire est-il dehors, sur la carte, en train de jouer ?
    playing(ow) { return ow && ow === DW.Game.top() && !ow.map.indoor && !ow.locked && !ow.cine; },
    screenOf(ow, wx, wy) { const cam = ow.camera(); return [wx * TS + 8 - cam.cx, wy * TS + 12 - cam.cy]; },

    update(ow, dt) {
      const w = T.weather();
      if (this.flash > 0) this.flash = Math.max(0, this.flash - dt * 2.6);
      if (this.fear > 0) this.fear -= dt;
      for (let i = this.bolts.length - 1; i >= 0; i--) { const b = this.bolts[i]; b.t += dt; if (b.t > b.life) this.bolts.splice(i, 1); else if (!b.re && b.t > 0.11) { b.re = true; this.flash = Math.max(this.flash, 0.75); } }
      for (let i = this.scorch.length - 1; i >= 0; i--) { this.scorch[i].t += dt; if (this.scorch[i].t > 8) this.scorch.splice(i, 1); }
      if (w !== 'storm' || !ow || ow.map.indoor) return;
      this.next -= dt;
      if (this.next > 0) return;
      this.next = 2.2 + R() * 4;
      this.strike(ow);
    },
    // un éclair : loin dans le paysage, ou tout près du héros, ou SUR le partenaire
    strike(ow) {
      const P = ow.f && ow.partner ? ow.f : ow.p, near = this.playing(ow) && R() < 0.3;
      let gx, gy, hit = false;
      if (near) {
        const [px, py] = this.screenOf(ow, ow.pos(P).x, ow.pos(P).y);
        hit = !!ow.partner && R() < 0.35;
        const a = R() * Math.PI * 2, d = hit ? 0 : 26 + R() * 40;
        gx = px + Math.cos(a) * d; gy = py + Math.sin(a) * d * 0.6;
      } else { gx = 20 + R() * (W - 40); gy = 60 + R() * (H - 90); }
      const b = boltPath(gx + (R() - 0.5) * 60, -12, gx, gy, 2);
      this.bolts.push({ ...b, t: 0, life: 0.42, gx, gy, near });
      this.flash = near ? 1 : 0.8;
      ow.shake = Math.max(ow.shake, near ? 0.55 : 0.25);
      // tonnerre : immédiat quand c'est tout près, en retard quand c'est loin
      DW.wait(near ? 0.02 : 0.25 + R() * 0.6).then(() => { DW.Audio.sfx('thunder'); if (near) DW.Audio.sfx('explode'); });
      if (near) { const cam = ow.camera(); this.scorch.push({ x: gx + cam.cx, y: gy + cam.cy, t: 0 }); }
      if (near) this.fear = Math.max(this.fear, hit ? 5 : 3);   // le partenaire a PEUR
      if (hit) this.zap(ow);
    },
    // la foudre frappe le partenaire : quelques PV (jamais K.O.), il tremble de peur
    zap(ow) {
      const m = ow.partner; if (!m) return;
      const loss = Math.min(m.hp - 1, Math.max(1, Math.round(m.maxHp * (0.05 + R() * 0.05))));
      if (loss > 0) m.hp -= loss;
      m.addHappy && m.addHappy(-2);
      DW.Care.toast(`⚡ La foudre frappe ${m.name} ! (-${Math.max(0, loss)} PV) Il tremble de peur...`, '#ffe060');
    },

    // ------------------------------------------------------------ dessin (coordonnées écran, après la carte)
    draw(ow, c) {
      const w = T.weather(), t = ow.t, cam = ow.camera();
      // marques de brûlure laissées par la foudre
      for (const s of this.scorch) {
        const x = s.x - cam.cx, y = s.y - cam.cy, a = Math.max(0, 1 - s.t / 8);
        c.fillStyle = `rgba(20,14,10,${0.55 * a})`; c.beginPath(); c.ellipse(x, y, 9, 4, 0, 0, 7); c.fill();
        c.fillStyle = `rgba(255,150,60,${Math.max(0, 0.8 - s.t * 0.4)})`; c.beginPath(); c.ellipse(x, y, 4, 1.8, 0, 0, 7); c.fill();
        for (let i = 0; i < 3; i++) { const k = (s.t * 0.6 + i / 3) % 1; c.fillStyle = `rgba(120,120,130,${0.35 * a * (1 - k)})`; c.beginPath(); c.arc(x + Math.sin(k * 6 + i) * 3, y - k * 22, 2 + k * 5, 0, 7); c.fill(); }
      }
      if (w === 'storm') {
        // nuages noirs qui défilent (ombres sur la carte)
        this.clouds = this.clouds || Array.from({ length: 5 }, () => ({ x: R() * W * 1.5, y: R() * H, r: 70 + R() * 70 }));
        for (const k of this.clouds) {
          const x = ((k.x + t * 22) % (W + 2 * k.r)) - k.r, g = c.createRadialGradient(x, k.y, 0, x, k.y, k.r);
          g.addColorStop(0, 'rgba(6,8,24,0.5)'); g.addColorStop(1, 'rgba(6,8,24,0)');
          c.fillStyle = g; c.fillRect(x - k.r, k.y - k.r, k.r * 2, k.r * 2);
        }
        // pluie battante supplémentaire
        c.strokeStyle = 'rgba(200,215,255,0.35)'; c.lineWidth = 0.8; c.beginPath();
        for (let i = 0; i < 90; i++) { const x = (i * 97 + t * 520) % (W + 80) - 40, y = (i * 61 + t * 760) % (H + 30) - 15; c.moveTo(x, y); c.lineTo(x - 7, y - 13); }
        c.stroke();
      }
      // éclairs : halo bleuté, cœur blanc, impact au sol
      for (const b of this.bolts) {
        const vis = b.t < 0.09 || (b.t > 0.12 && b.t < 0.3) || (b.t > 0.34 && R() < 0.5);
        if (!vis) continue;
        const a = 1 - b.t / b.life;
        c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
        c.globalCompositeOperation = 'lighter';
        c.strokeStyle = `rgba(110,140,255,${0.35 * a})`; strokeBolt(c, b, 9);
        c.strokeStyle = `rgba(170,200,255,${0.7 * a})`; strokeBolt(c, b, 4);
        c.globalCompositeOperation = 'source-over';
        c.strokeStyle = `rgba(255,255,255,${a})`; strokeBolt(c, b, 1.6);
        const g = c.createRadialGradient(b.gx, b.gy, 0, b.gx, b.gy, b.near ? 46 : 26);
        g.addColorStop(0, `rgba(255,255,230,${0.9 * a})`); g.addColorStop(1, 'rgba(160,190,255,0)');
        c.fillStyle = g; c.beginPath(); c.arc(b.gx, b.gy, b.near ? 46 : 26, 0, 7); c.fill();
        c.restore();
      }
      // le partenaire a peur : il tremble (voir companion.js) et des gouttes de peur jaillissent
      if (this.fear > 0 && ow.partner && ow.f) {
        const [x, y] = this.screenOf(ow, ow.pos(ow.f).x, ow.pos(ow.f).y), h = DW.Sprites.ow(ow.partner.sp).h;
        const k = (t * 3) % 1;
        c.fillStyle = '#8ac8ff';
        for (const s of [-1, 1]) { const dx = x + s * (8 + k * 6), dy = y - h - 2 + k * 6; c.beginPath(); c.moveTo(dx, dy - 3); c.quadraticCurveTo(dx + 2.6, dy + 1, dx, dy + 2); c.quadraticCurveTo(dx - 2.6, dy + 1, dx, dy - 3); c.fill(); }
        DW.UI.text(c, '!!', x + 2, y - h - 6 + Math.sin(t * 20) * 1, { size: 10, bold: true, align: 'center', color: '#ffe060', shadowColor: '#402000' });
      }
      // BROUILLARD épais : on ne voit plus qu'autour du héros
      if (w === 'fog' && !ow.map.indoor) {
        const pp = ow.pos(ow.p), x = pp.x * TS + 8 - cam.cx, y = pp.y * TS + 6 - cam.cy;
        const g = c.createRadialGradient(x, y, 22, x, y, 118);
        g.addColorStop(0, 'rgba(222,228,234,0)'); g.addColorStop(0.45, 'rgba(222,228,234,0.55)'); g.addColorStop(1, 'rgba(222,228,234,0.94)');
        c.fillStyle = g; c.fillRect(0, 0, W, H);
        for (let i = 0; i < 6; i++) {   // bancs de brume qui passent devant tout
          const bx = ((i * 140 + t * (8 + i * 3)) % (W + 240)) - 120, by = 30 + (i * 53) % (H - 40), r = 60 + (i % 3) * 25;
          const b = c.createRadialGradient(bx, by, 0, bx, by, r);
          b.addColorStop(0, 'rgba(235,240,245,0.42)'); b.addColorStop(1, 'rgba(235,240,245,0)');
          c.fillStyle = b; c.fillRect(bx - r, by - r, r * 2, r * 2);
        }
      }
      // CANICULE / SÉCHERESSE : soleil écrasant et air brûlant
      if ((w === 'heat' || T.drought()) && !ow.map.indoor && !T.isNight()) {
        const g = c.createRadialGradient(W - 30, -10, 0, W - 30, -10, 190);
        g.addColorStop(0, 'rgba(255,250,210,0.55)'); g.addColorStop(0.4, 'rgba(255,220,140,0.18)'); g.addColorStop(1, 'rgba(255,200,120,0)');
        c.fillStyle = g; c.fillRect(0, 0, W, H);
        c.fillStyle = `rgba(255,170,80,${T.drought() ? 0.1 : 0.06})`; c.fillRect(0, 0, W, H);
      }
      // flash énorme : tout l'écran devient blanc
      if (this.flash > 0) { c.fillStyle = `rgba(240,245,255,${Math.min(0.92, this.flash)})`; c.fillRect(0, 0, W, H); }
    },

    // ------------------------------------------------------------ herbe jaunie (canicule, et surtout sécheresse)
    _dry: null,
    ground(ow) {
      const g = ow.gfx, w = T.weather(), drought = T.drought();
      if (ow.map.indoor || (w !== 'heat' && !drought)) return g.ground;
      const k = drought ? 0.85 : 0.45, key = ow.map.id + (ow.map.version || '') + k;
      if (this._dry && this._dry.key === key && this._dry.src === g.ground) return this._dry.cv;
      const src = g.ground, kk = src._k || 1, cv = document.createElement('canvas');
      cv.width = src.width; cv.height = src.height; cv._k = src._k;
      const x = cv.getContext('2d'); Art.drawRaw(x, src, 0, 0);
      const im = x.getImageData(0, 0, cv.width, cv.height), d = im.data;
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], gg = d[i + 1], b = d[i + 2];
        if (gg > r * 1.04 && gg > b * 1.12) {   // pixel « herbe » : vert dominant → paille
          const nr = gg * 0.98 + r * 0.12, ng = gg * 0.84 + r * 0.04, nb = b * 0.55;
          d[i] = r + (nr - r) * k; d[i + 1] = gg + (ng - gg) * k; d[i + 2] = b + (nb - b) * k;
        }
      }
      x.putImageData(im, 0, 0);
      this._dry = { key, src, cv };
      return cv;
    },
  };
})();
