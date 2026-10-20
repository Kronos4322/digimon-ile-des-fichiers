'use strict';
// =====================================================================
//  MÉTÉO SPECTACULAIRE (par-dessus engine/time.js)
//  - ORAGE : vrais éclairs ramifiés qui tombent jusqu'au sol, flashs énormes (double éclat),
//    tremblement de l'écran, tonnerre ; la foudre tombe parfois tout près... et peut frapper
//    le partenaire (quelques PV perdus) qui tremble ensuite de peur. Marques de brûlure au sol.
//  - BROUILLARD : on ne voit plus qu'un petit cercle autour du héros, des bancs de brume passent.
//  - CANICULE / SÉCHERESSE : l'herbe jaunit (sol recoloré), l'air tremble, le soleil écrase.
//  - SAISONS (zones tempérées) : cerisiers en fleurs au printemps, feuillage roux puis arbres nus
//    en automne, branches nues en hiver ; neige posée sur les arbres, toits, rochers et herbes hautes ;
//    les fleurs fanent en automne et laissent place aux perce-neige en hiver.
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

  DW.Meteo = {
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
      // à l'abri : on voit les éclairs par les fenêtres (lueur faible) et on entend le tonnerre au loin (game/abri.js)
      if (w === 'storm' && ow && ow.map.indoor) { this.next -= dt; if (this.next <= 0) { this.next = 4 + R() * 6; this.flash = Math.max(this.flash, 0.18 + R() * 0.12); DW.wait(0.6 + R()).then(() => DW.Audio.sfx('thunder')); } return; }
      if (w !== 'storm' || !ow) return;
      this.next -= dt;
      if (this.next > 0) return;
      const violent = T.front && T.front().violent;   // orages d'été : bien plus violents
      this.next = violent ? 1.3 + R() * 2.4 : 2.2 + R() * 4;
      this.strike(ow, violent);
      // rappel : il faut se mettre à l'abri
      this.remind = (this.remind || 0) - 1;
      if (this.playing(ow) && this.remind <= 0) { this.remind = 18; DW.Care.toast("Mets-toi à l'abri (une maison, une grotte...) le temps que l'orage passe !", '#ffd890'); }
    },
    // un éclair : loin dans le paysage, ou tout près du héros, ou SUR le partenaire
    strike(ow, violent) {
      const P = ow.f && ow.partner ? ow.f : ow.p, near = this.playing(ow) && R() < (violent ? 0.42 : 0.3);
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
      if (w === 'storm' && !ow.map.indoor) {
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
      const g = ow.gfx, w = T.weather(), drought = T.drought(), st = DW.state;
      const temperate = ['forest', 'village', 'beach'].includes(ow.map.climate || 'village');
      const mo = T.date().m;
      this.cur = { tmp: temperate && !ow.map.indoor, m: mo, snow: temperate ? st.snow || 0 : 0 };   // (servira aux arbres et aux herbes de cette image)
      // fleurs peintes : elles fanent en automne (octobre, novembre), perce-neige en hiver
      const fmode = !temperate || !g.flowers || !g.flowers.length ? '' : mo >= 9 ? 'w' : mo >= 7 ? 'a' : '';
      const snow = temperate ? Math.round((st.snow || 0) * 10) / 10 : 0, bloom = temperate && T.season() === 0 ? Math.round((st.bloom || 0) * 5) / 5 : 0;
      const k = w === 'heat' || drought ? (drought ? 0.85 : 0.45) : 0;
      if (ow.map.indoor || (!k && snow < 0.1 && bloom < 0.2 && !fmode)) return g.ground;
      const key = [ow.map.id, ow.map.version || '', k, snow, bloom, fmode].join('|');
      if (this._dry && this._dry.key === key && this._dry.src === g.ground) return this._dry.cv;
      const src = g.ground, kk = src._k || 1, cv = document.createElement('canvas');
      cv.width = src.width; cv.height = src.height; cv._k = src._k;
      const x = cv.getContext('2d'); Art.drawRaw(x, src, 0, 0);
      const im = x.getImageData(0, 0, cv.width, cv.height), d = im.data;
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], gg = d[i + 1], b = d[i + 2];
        const grass = gg > r * 1.04 && gg > b * 1.12, water = b > r * 1.15 && b > gg * 1.02;
        if (grass && k) {   // pixel « herbe » : vert dominant → paille
          const nr = gg * 0.98 + r * 0.12, ng = gg * 0.84 + r * 0.04, nb = b * 0.55;
          d[i] = r + (nr - r) * k; d[i + 1] = gg + (ng - gg) * k; d[i + 2] = b + (nb - b) * k;
        }
        if (snow >= 0.1 && !water) {   // NEIGE (sauf sur l'eau) : le relief reste — creux bleutés, bosses blanches au soleil
          const r0 = d[i], g0 = d[i + 1], b0 = d[i + 2], l = (r0 + g0 + b0) / 3;
          const dirt = r0 > g0 * 1.05 && r0 > b0 * 1.25;   // chemins : neige tassée, on devine encore la piste
          const cov = snow * (dirt ? 0.58 : 0.94) * Math.min(1, Math.max(0.32, (l - 18) / 115));   // sous-bois sombre : un peu moins couvert
          const t = Math.min(1, Math.max(0, (l - 35) / 150));
          d[i] = r0 + (170 + t * 80 - r0) * cov; d[i + 1] = g0 + (188 + t * 64 - g0) * cov; d[i + 2] = b0 + (224 + t * 31 - b0) * cov;
        }
      }
      if (fmode) this.fadeFlowers(d, cv.width, cv.height, g.flowers, fmode, snow);
      // FLEURS du printemps : après les pluies douces, l'herbe se couvre de petites fleurs
      if (bloom >= 0.2) {
        const FL = [[255, 140, 190], [255, 230, 90], [250, 250, 255], [190, 140, 255], [255, 120, 90]], px = 2 * kk, Wd = cv.width;
        for (let y = 0; y < cv.height - px; y += 5 * kk) for (let x = 0; x < Wd - px; x += 5 * kk) {
          const h = Art.hash(x, y, 91); if (h > bloom * 0.09) continue;
          const i0 = (y * Wd + x) * 4; if (!(d[i0 + 1] > d[i0] * 1.04 && d[i0 + 1] > d[i0 + 2] * 1.12)) continue;
          const col = FL[Math.floor(Art.hash(x, y, 92) * FL.length)];
          for (let yy = 0; yy < px; yy++) for (let xx = 0; xx < px; xx++) { const j = ((y + yy) * Wd + x + xx) * 4; d[j] = col[0]; d[j + 1] = col[1]; d[j + 2] = col[2]; }
        }
      }
      x.putImageData(im, 0, 0);
      this._dry = { key, src, cv };
      return cv;
    },
    // fleurs peintes au sol (croix de 5 pixels + tige) : en automne la moitié fane, les autres deviennent
    // des colchiques et des asters ; en hiver elles disparaissent, quelques perce-neige les remplacent
    fadeFlowers(d, Wd, Hd, list, mode, snow) {
      const px = (x, y) => (x >= 0 && y >= 0 && x < Wd && y < Hd ? (y * Wd + x) * 4 : -1);
      const set = (x, y, c) => { const i = px(x, y); if (i >= 0) { d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; } };
      for (const [x, y] of list) {
        const h = Art.hash(x, y, 93);
        // couleur de l'herbe autour (la fleur s'efface)
        let gc = [70, 130, 52];
        for (const [ox, oy] of [[3, 0], [-3, 0], [0, 4], [0, -3]]) { const i = px(x + ox, y + oy); if (i >= 0 && d[i + 1] > d[i] && d[i + 1] > d[i + 2]) { gc = [d[i], d[i + 1], d[i + 2]]; break; } }
        const CROSS = [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1], [0, 2]];
        if (mode === 'a' && h >= 0.45) {   // colchiques, asters
          const col = [[180, 120, 220], [214, 140, 226], [236, 150, 50]][Math.floor(h * 30) % 3];
          for (const [ox, oy] of CROSS.slice(1, 5)) set(x + ox, y + oy, col);
          continue;
        }
        if (snow >= 0.1) continue;   // (sous la neige, le sol est déjà tout blanc)
        for (const [ox, oy] of CROSS) set(x + ox, y + oy, gc);
        if (mode === 'w' && h < 0.22) { set(x, y + 1, [60, 120, 60]); set(x, y, [70, 130, 60]); set(x - 1, y - 1, [250, 250, 255]); set(x - 1, y, [236, 240, 250]); set(x, y - 1, [120, 170, 90]); }   // perce-neige
      }
    },
    // arbre de saison : [type, variante] à dessiner à la place de l'arbre, ou null
    TREES: { tree: 1, oak: 1, birch: 1, pine: 1 },
    treeV(o) {
      let kind = o.kind, v = o.v || 0;
      if (kind === 'pine') return this.cur && this.cur.snow >= 0.3 && DW.Textures && DW.Textures.aArbre('pine', 3) ? ['pine', 3] : null;   // (sapin enneigé)
      if (kind === 'tree' && v === 3) { kind = 'oak'; v = 0; } else if (kind === 'tree' && v === 4) { kind = 'birch'; v = 0; }
      const C = this.cur, se = Math.floor(C.m / 3), p = C.m % 3, h = Art.hash(o.tx, o.ty, 77), snow = C.snow >= 0.3, isT = kind === 'tree';
      const green = !isT || [0, 1, 2, 8, 9].includes(v), warm = isT && v >= 5 && v <= 7;
      // arbres déjà enneigés du thème d'hiver (gfx/themes.js) : la plupart perdent leurs feuilles, quelques persistants restent
      if (isT && (v === 10 || v === 11)) return se === 3 && (v === 11 || h < 0.65) ? [kind, snow ? 15 : 14] : null;
      if (!green && !warm) return null;
      const BARE = isT ? (snow ? 15 : 14) : (snow ? 3 : 2), FALL = isT ? [5, 6, 7][Math.floor(h * 30) % 3] : 1;
      if (se === 0) {   // printemps : quelques arbres encore nus en mars, cerisiers en fleurs en mars-avril
        if (p === 0 && h > 0.82 && !(DW.Textures && DW.Textures.aArbre('tree', 0))) return [kind, BARE];
        if (isT && green && p < 2 && h < 0.3) return [kind, h < 0.18 ? 12 : 13];
        return null;
      }
      if (se === 1) return null;
      if (se === 2) {   // automne : les feuilles rougissent, puis tombent en novembre
        if (p === 2 && h < 0.5) return [kind, BARE];
        if (!green) return null;
        return h < [0.35, 0.85, 1][p] ? [kind, FALL] : null;
      }
      return [kind, BARE];   // hiver : tous nus
    },
    // fleurs posées (fleurs géantes, massifs) : espèces d'automne en octobre-novembre, d'hiver de décembre à février
    FLOWERS: { giantflower: 1, flowerbed: 1 },
    objImg(o, img) {
      const C = this.cur;
      if (!C || !C.tmp) return img;
      if (o.flat) return this.DRY[o.kind] && C.m >= 9 ? this.dry(img, this.DRY[o.kind]) : img;   // (fougères : objets plats)
      if (this.TREES[o.kind] && !o.sprs) {
        const r = this.treeV(o);
        if (r) { img = DW.World.obj(r[0], r[1]).img; if (r[1] === (r[0] === 'tree' ? 15 : 3) || (r[0] === 'tree' && DW.Textures && DW.Textures.aArbre('tree', r[1]) && (r[1] === 10 || r[1] === 11))) return img; }   // (déjà enneigé)
        else if (o.kind === 'tree' && (o.v === 10 || o.v === 11)) return img;
      } else if (this.FLOWERS[o.kind] && (o.v || 0) < 3 && C.m >= 7) img = DW.World.obj(o.kind, C.m >= 9 ? 3 : 4).img;
      else if (this.DRY[o.kind] && C.m >= 9) img = this.dry(img, this.DRY[o.kind]);   // hiver : fougères fanées, buissons ternis
      return C.snow >= 0.3 ? this.snowCap(img, C.snow >= 0.7 ? 2 : 1) : img;
    },
    // plantes en hiver : 1 = fanée (paille brune), 0.45 = feuillage terni
    DRY: { fern: 1, bigfern: 1, junglebush: 0.7, bush: 0.45, hedge: 0.3 },
    _dryC: new WeakMap(),
    dry(img, k) {
      let e = this._dryC.get(img);
      if (e) return e;
      const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height; cv._k = img._k;
      const x = cv.getContext('2d'); Art.drawRaw(x, img, 0, 0);
      const im = x.getImageData(0, 0, cv.width, cv.height), d = im.data;
      for (let i = 0; i < d.length; i += 4) {
        if (!d[i + 3]) continue;
        const r = d[i], g = d[i + 1], b = d[i + 2];
        if (!(g > r * 1.02 && g > b)) continue;   // seulement le vert
        const l = (r + g + b) / 3;
        d[i] = r + (l * 0.95 + 34 - r) * k; d[i + 1] = g + (l * 0.82 + 22 - g) * k; d[i + 2] = b + (l * 0.55 + 12 - b) * k;
      }
      x.putImageData(im, 0, 0);
      this._dryC.set(img, cv);
      return cv;
    },
    // neige posée sur le dessus des objets (toits, rochers, buissons, sapins...) : image recalculée une fois
    _cap: new WeakMap(),
    snowCap(img, lv) {
      let e = this._cap.get(img);
      if (!e) this._cap.set(img, e = []);
      if (e[lv]) return e[lv];
      const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height; cv._k = img._k;
      const x = cv.getContext('2d'); Art.drawRaw(x, img, 0, 0);   // (copie pixel pour pixel : image haute définition)
      const im = x.getImageData(0, 0, cv.width, cv.height), d = im.data, Wd = cv.width, Hd = cv.height;
      const kk = img._k || 1, big = Hd / kk > 60, y1 = Math.round(Hd * 0.86);   // (pas sur l'ombre au pied)
      // épaisseur : un liseré sur les petits objets, une vraie couche sur les toits des bâtiments (bord irrégulier)
      const th0 = big ? Hd * (0.05 + 0.025 * lv) : Math.max(2, kk * (lv + 1));
      for (let X = 0; X < Wd; X++) {
        let run = 0;
        const th = Math.max(2, Math.round(th0 * (big ? 0.7 + 0.6 * Art.fbm(X / kk * 0.15, lv, 77) : 1)));
        for (let Y = 0; Y < y1; Y++) {
          const i = (Y * Wd + X) * 4;
          if (d[i + 3] < 60) { run = 0; continue; }
          if (run < th) { const s = run === th - 1 ? 0.55 : 0.92; d[i] += (238 - d[i]) * s; d[i + 1] += (243 - d[i + 1]) * s; d[i + 2] += (252 - d[i + 2]) * s; }
          run++;
        }
      }
      x.putImageData(im, 0, 0);
      return (e[lv] = cv);
    },
    // herbes hautes : blanches sous la neige, le bout des brins d'abord (automne et hiver : couleurs du thème, gfx/themes.js)
    _tall: new WeakMap(),
    tall(cv) {
      const C = this.cur;
      if (!C || !C.tmp) return cv;
      const sn = Math.round(Math.min(1, C.snow) * 4);
      const mode = sn >= 1 ? 's' + sn : '';
      if (!mode) return cv;
      let e = this._tall.get(cv);
      if (!e) this._tall.set(cv, e = {});
      if (e[mode]) return e[mode];
      const o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height; o._k = cv._k;
      const x = o.getContext('2d'); Art.drawRaw(x, cv, 0, 0);
      const im = x.getImageData(0, 0, o.width, o.height), d = im.data;
      for (let i = 0; i < d.length; i += 4) {
        if (!d[i + 3]) continue;
        const l = (d[i] + d[i + 1] + d[i + 2]) / 3, y = Math.floor(i / 4 / o.width) / o.height;
        // sous la neige, seul le haut des brins dépasse (paille sèche, poudrée de blanc) : le bas est enfoui
        if (y > 0.92 - sn * 0.09) { d[i + 3] = 0; continue; }
        d[i] = l * 0.62 + 92; d[i + 1] = l * 0.56 + 80; d[i + 2] = l * 0.42 + 58;
        const k = Math.min(0.6, sn / 4 * 0.5 * (1.2 - y)); d[i] += (240 - d[i]) * k; d[i + 1] += (244 - d[i + 1]) * k; d[i + 2] += (252 - d[i + 2]) * k;
      }
      x.putImageData(im, 0, 0);
      return (e[mode] = o);
    },
  };
})();
