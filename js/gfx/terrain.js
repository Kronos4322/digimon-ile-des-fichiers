'use strict';
// =====================================================================
//  MONDE — sol peint au pixel (terrains, eau animée, ombres) et herbes hautes
// =====================================================================
(function () {
  const Art = DW.Art, hash = Art.hash, noise = Art.noise, fbm = Art.fbm;
  const TS = 16;
  const World = DW.World, TER = World.TER, OBJ = World.OBJ;

  // ------------------------------------------------------------ palettes du sol
  const P = s => s.map(Art.hex);
  const PAL = {
    grass: P(['#2c7432', '#3a8a3a', '#4aa046', '#5cb452', '#74c860', '#94dc78']),
    forest: P(['#1e5a2c', '#286e32', '#34843a', '#469c44', '#5eb252', '#80c866']),
    dirt: P(['#6e4224', '#8a5a34', '#a47244', '#ba8a56', '#d0a46c', '#e2be88']),
    sand: P(['#c09a60', '#d6b476', '#e6ca8e', '#f2dcaa', '#f8eac6', '#fff6e2']),
    wet: P(['#a07c4c', '#b48e5c', '#c6a06c', '#d6b27e']),
    water: P(['#9cf0ec', '#62d6e4', '#40b8e2', '#3098da', '#277ccc', '#205fb4', '#1a4a9a']),
    lawn: P(['#5eb078', '#76c488', '#90d69a', '#a8e4ac', '#c2f0c0', '#ddfad8']),
    canopy: P(['#0e2a16', '#153a1e', '#1d4c24', '#27612c', '#337634', '#468e40']),
    cliff: P(['#4a3a2e', '#5e4a3a', '#76604a', '#8e7658', '#a88e6a', '#c0a67e']),
    pink: P(['#b86a96', '#dc8ab4', '#f4a8cc', '#ffc6e0', '#ffe2f0']),
    mint: P(['#5a9c8a', '#78c0a6', '#9ee0c2', '#c2f4dc', '#e2fff0']),
    lilac: P(['#7a6ab0', '#9a88d0', '#baa8ec', '#d6c8ff', '#eee6ff']),
  };
  const put = (D, i, c, k = 1) => { D[i] = c[0] * k; D[i + 1] = c[1] * k; D[i + 2] = c[2] * k; D[i + 3] = 255; };

  // ------------------------------------------------------------ sols et murs d'intérieur stylés
  // map.floor = { type: 'tile' | 'tatami' | 'stone' | 'carpet' | 'herring', cols: [couleur claire, couleur foncée, joint] }
  // map.wall  = { base, alt, pattern: 'stripes' | 'dots' | 'diamond' | 'brick' | 'plain', wood: lambris }
  function floorPx(F, px, py, lx, ly, ed, en, sh, b) {
    const [A, B, J] = [F.c[0] || [220, 200, 170], F.c[1] || [190, 170, 140], F.c[2] || [120, 100, 80]];
    let c;
    if (F.type === 'tile') {               // carrelage en damier, joints, petit reflet
      const tx = px >> 3, ty = py >> 3, ix = px & 7, iy = py & 7;
      c = (tx + ty) & 1 ? B : A;
      if (ix === 0 || iy === 0) c = J; else if (ix === 1 && iy > 1 && iy < 4) c = Art.mix(c, [255, 255, 255], 0.35);
    } else if (F.type === 'tatami') {      // tatamis 32×16 alternés, bordure tressée
      const row = py >> 4, vert = (row + (px >> 5)) & 1, ix = vert ? (py & 15) : (px & 31), iy = vert ? (px & 31) : (py & 15);
      c = Art.mix(A, B, (hash(px >> 1, py, 180) - 0.5) * 0.3 + ((vert ? px : py) & 1) * 0.12);
      if (iy === 0 || iy === 15) c = J; else if (iy === 1 || iy === 14) c = Art.mix(c, J, 0.45);
      if (ix === 0) c = Art.mix(J, [0, 0, 0], 0.3);
    } else if (F.type === 'stone') {       // dalles irrégulières
      const row = Math.floor(py / 10), off = (row & 1) * 7, bx = Math.floor((px + off) / 14), ix = (px + off) % 14, iy = py % 10;
      c = Art.mix(A, B, hash(bx, row, 181));
      if (ix === 0 || iy === 0) c = J; else if (ix === 1 || iy === 1) c = Art.mix(c, [255, 255, 255], 0.18);
    } else if (F.type === 'herring') {     // parquet en chevrons
      const k = ((px >> 2) + (py >> 3)) & 1, s = (k ? px + py : px - py) & 15;
      c = Art.mix(A, B, hash(Math.floor((px + (k ? py : -py)) / 16), k, 182) * 0.8);
      if (s === 0) c = J;
    } else {                               // moquette (carpet) : uni, grain fin, frise sur les bords
      c = Art.mix(A, B, (hash(px, py, 183) - 0.5) * 0.25 + 0.2);
      if (ed >= 2 && ed <= 3 && en !== TER.wood) c = J;
    }
    c = Art.mix(c, [40, 30, 20], b * 0.04);
    if (en !== TER.wood && ed <= 5) c = Art.mix(c, [30, 14, 6], (6 - ed) * 0.08);
    return Art.mix(c, [20, 10, 4], sh * 0.045);
  }
  function wallPx(W, px, py) {
    const p = W.pattern;
    if (p === 'stripes') return ((px >> 2) % 3) ? W.base : W.alt;
    if (p === 'dots') return ((px & 7) === 3 && (py & 7) === 3) || ((px & 7) === 7 && (py & 7) === 7) ? W.alt : W.base;
    if (p === 'diamond') { const x = px & 15, y = py & 15; return Math.abs(x - 8) + Math.abs(y - 8) === 7 ? W.alt : W.base; }
    if (p === 'brick') { const row = py >> 2, ix = (px + (row & 1) * 4) & 7; return (py & 3) === 0 || ix === 0 ? W.alt : W.base; }
    return W.base;
  }

  // ------------------------------------------------------------ préparation d'une carte
  // Générateur : rend la main régulièrement (yield) pour pouvoir préparer une carte
  // par petites tranches pendant le jeu (cartes voisines préparées à l'avance).
  const NATURAL = new Set(['tree', 'bush', 'rock', 'boulder', 'mossrock', 'fern', 'stump', 'log', 'hollowlog', 'palm', 'bigtree', 'pine', 'flowers']);
  function* prep(map) {
    if (!map.rows && map.build) map.build();
    const t0 = performance.now(), prof = {};
    let tp = t0; const lap = k => { const n = performance.now(); prof[k] = Math.round(n - tp); tp = n; };
    const GW = map.w * TS, GH = map.h * TS, N = GW * GH;
    const tt = map.rows.map(r => [...r].map(ch => TER[World.info(ch).t]));
    const tAt = (x, y) => tt[DW.clamp(y, 0, map.h - 1)][DW.clamp(x, 0, map.w - 1)];
    const HW = (GW >> 1) + 1;
    const half = fn => { const A = new Float32Array(HW * ((GH >> 1) + 1)).fill(NaN); return (px, py) => { const k = (py >> 1) * HW + (px >> 1); let v = A[k]; if (v !== v) v = A[k] = fn(px & ~1, py & ~1); return v; }; };
    const WX = half((x, y) => noise(x * 0.07, y * 0.07, 1)), WY = half((x, y) => noise(x * 0.07, y * 0.07, 2));
    const G5 = half((x, y) => fbm(x * 0.035, y * 0.035, 5)), D7 = half((x, y) => fbm(x * 0.06, y * 0.06, 7));
    const S8 = half((x, y) => fbm(x * 0.04, y * 0.04, 8)), S9 = half((x, y) => fbm(x * 0.05, y * 0.05, 9));
    const L12 = half((x, y) => fbm(x * 0.04, y * 0.04, 12)), C21 = half((x, y) => fbm(x * 0.08, y * 0.08, 21));
    // thème de la zone (couleurs propres à chaque zone)
    const TH = World.themeOf ? World.themeOf(map) : World.THEMES && World.THEMES[map.theme];
    const GRASS = map.grass ? (World.seasonGrass ? World.seasonGrass(map, map.grass) : map.grass).map(Art.hex) : TH ? TH.grass.map(Art.hex) : map.ambient === 'forest' ? PAL.forest : PAL.grass;
    // map.lush : sol façon Digimon World 1 (herbe en brins fins, tons continus, chemins aux bords fondus, ombre de forêt sur les bords)
    // actif sur toutes les cartes extérieures (map.lush = false pour le désactiver), jamais en intérieur
    const LUSH = map.lush != null ? !!map.lush : !map.indoor, TMP = [0, 0, 0];
    // couleur continue entre les tons de la palette (pas de paliers) ; écrit dans TMP (aucune allocation)
    const lerpPal = (P, v) => {
      v = v < 0 ? 0 : v > P.length - 1 ? P.length - 1 : v;
      const a = Math.floor(v), f = v - a, A = P[a], B = P[Math.min(P.length - 1, a + 1)];
      TMP[0] = A[0] + (B[0] - A[0]) * f; TMP[1] = A[1] + (B[1] - A[1]) * f; TMP[2] = A[2] + (B[2] - A[2]) * f;
      return TMP;
    };
    const COFF = new Uint8Array(GW); for (let x = 0; x < GW; x++) COFF[x] = Math.floor(hash(x, 0, 310) * 3);   // décalage des brins par colonne
    // HERBE PEINTE : grandes nappes douces (lumière / ombre), touffes moyennes, brins discrets (plus de « bruit » au pixel)
    const lushGrassV = (px, py, i, tx, ty) => {
      let v = 2.75 + (G5(px, py) - 0.5) * 3.2 + (noise(px * 0.09, py * 0.09, 6) - 0.5) * 1.3;
      // brins : petits traits verticaux de 3 pixels (clair à la pointe, sombre au pied), peu contrastés
      const off = COFF[px], k = Math.floor((py + off) / 3), pos = (py + off) - k * 3;
      v += (hash(px, k, 311) - 0.5) * 0.7 + (pos === 0 ? 0.22 : pos === 2 ? -0.2 : 0);
      const tip = hash(px, py, 312); if (tip < 0.015) v += 0.8; else if (tip > 0.99) v -= 0.6;
      if (noise(px * 0.18, py * 0.18, 313) > 0.72) v -= 0.5;            // touffes plus sombres
      v -= SH[i] * 0.2; if (tallAt(tx, ty)) v -= 1;
      return v;
    };
    const lushDirtV = (px, py, i) => {
      let v = 3.1 + (D7(px, py) - 0.5) * 2 + (noise(px * 0.2, py * 0.2, 95) - 0.5) * 0.6 + Math.min(ED[i], 10) * 0.04;   // (le milieu du chemin, tassé, est plus clair)
      const p = hash(px, py, 96); if (p < 0.012) v -= 0.9; else if (p > 0.99) v += 0.7;   // petits cailloux
      return v - SH[i] * 0.18;
    };
    const CANOPY = TH ? TH.canopy.map(Art.hex) : PAL.canopy;
    const LITTER = TH ? TH.litter : ['#c86a2a', '#e09a3a', '#8a5a2a', '#a8a040', '#7a9a38'];
    // biomes : le thème peut remplacer les couleurs de la terre, du sable, de l'eau (lave, marais, glace) et des falaises
    const DIRT = map.dirt ? map.dirt.map(Art.hex) : TH && TH.dirt ? TH.dirt.map(Art.hex) : PAL.dirt, SAND = TH && TH.sand ? TH.sand.map(Art.hex) : PAL.sand;
    const WET = TH && TH.wet ? TH.wet.map(Art.hex) : PAL.wet, WATER = TH && TH.water ? TH.water.map(Art.hex) : PAL.water;
    const CLIFF = TH && TH.cliff ? TH.cliff.map(Art.hex) : PAL.cliff, ROCKY = TH && TH.canopyStyle === 'rock';
    // intérieurs : style du sol (map.floor) et des murs (map.wall) ; sans style = parquet et enduit d'origine
    const FLOOR = map.floor ? { ...map.floor, c: (map.floor.cols || []).map(Art.hex) } : null;
    const WALL = map.wall ? { ...map.wall, base: Art.hex(map.wall.base || '#ead8b4'), alt: Art.hex(map.wall.alt || map.wall.base || '#ead8b4'), wood: map.wall.wood ? Art.hex(map.wall.wood) : null } : null;
    const HARD = new Set([TER.cliff, TER.bridge, TER.stairs, TER.stone, TER.cobble, TER.wood, TER.wall, TER.void, TER.metal]);
    // terrain au pixel (frontières organiques)
    const T = new Uint8Array(N);
    // vote bilinéaire entre les 4 cases voisines (coins arrondis) + légère déformation
    const wsum = new Float32Array(16);
    // case entourée de 8 voisines du même terrain : aucune frontière possible, pas de vote
    const uni = new Uint8Array(map.w * map.h);
    for (let ty = 0; ty < map.h; ty++) for (let tx = 0; tx < map.w; tx++) {
      const t = tt[ty][tx];
      let u = 1;
      for (let dy = -1; dy <= 1 && u; dy++) for (let dx = -1; dx <= 1; dx++) if (tAt(tx + dx, ty + dy) !== t) { u = 0; break; }
      uni[ty * map.w + tx] = u;
    }
    // (accès rapides : terrain des cases à plat, terrains « durs » en table)
    const MW = map.w, MH = map.h, TT = new Uint8Array(MW * MH), isHard = new Uint8Array(32);
    for (let ty = 0; ty < MH; ty++) for (let tx = 0; tx < MW; tx++) TT[ty * MW + tx] = tt[ty][tx];
    for (const h of HARD) isHard[h] = 1;
    const tF = (x, y) => TT[(y < 0 ? 0 : y >= MH ? MH - 1 : y) * MW + (x < 0 ? 0 : x >= MW ? MW - 1 : x)];
    for (let py = 0; py < GH; py++) { if ((py & 3) === 3) yield; for (let px = 0; px < GW; px++) {
      const base = TT[(py >> 4) * MW + (px >> 4)];
      if (isHard[base] || uni[(py >> 4) * MW + (px >> 4)]) { T[py * GW + px] = base; continue; }
      const wx = px + 0.5 + (WX(px, py) - 0.5) * 10, wy = py + 0.5 + (WY(px, py) - 0.5) * 10;
      const u = wx / TS - 0.5, v = wy / TS - 0.5, i0 = Math.floor(u), j0 = Math.floor(v), fu = u - i0, fv = v - j0;
      const a = tF(i0, j0), b = tF(i0 + 1, j0), c = tF(i0, j0 + 1), d = tF(i0 + 1, j0 + 1);
      if (a === b && a === c && a === d) { T[py * GW + px] = isHard[a] ? base : a; continue; }
      wsum.fill(0);
      if (!isHard[a]) wsum[a] += (1 - fu) * (1 - fv);
      if (!isHard[b]) wsum[b] += fu * (1 - fv);
      if (!isHard[c]) wsum[c] += (1 - fu) * fv;
      if (!isHard[d]) wsum[d] += fu * fv;
      wsum[base] += 0.001;
      let best = base, bw = -1;
      for (let k = 0; k < 11; k++) if (wsum[k] > bw) { bw = wsum[k]; best = k; }
      T[py * GW + px] = best;
    } }
    lap('vote');
    // places rondes (ex. la place de la ville, la piste du terrain) : cercle net au lieu des cases
    for (const pl of map.plazas || []) {
      for (let py = Math.max(0, Math.floor(pl.y - pl.ry - 4)); py < Math.min(GH, pl.y + pl.ry + 4); py++) for (let px = Math.max(0, Math.floor(pl.x - pl.rx - 4)); px < Math.min(GW, pl.x + pl.rx + 4); px++) {
        // pl.t : terrain (pavés par défaut) ; pl.inner : anneau (ex. piste ovale) au lieu d'un disque plein
        const d = Math.hypot((px - pl.x) / pl.rx, (py - pl.y) / pl.ry), i = py * GW + px, tp = pl.t ? TER[pl.t] : TER.cobble;
        if (d < 1 && d >= (pl.inner || 0)) T[i] = tp; else if (!pl.inner && T[i] === tp) T[i] = TER.grass;
      }
    }
    // distance au terrain voisin (BFS)
    const ED = new Uint8Array(N), EN = new Uint8Array(N).fill(255);
    const Q = new Int32Array(N);
    let qh = 0, qt = 0;
    for (let py = 0; py < GH; py++) { if ((py & 31) === 31) yield; for (let px = 0; px < GW; px++) {
      const i = py * GW + px, t = T[i];
      let n = -1;
      if (px > 0 && T[i - 1] !== t) n = i - 1;
      else if (px < GW - 1 && T[i + 1] !== t) n = i + 1;
      else if (py > 0 && T[i - GW] !== t) n = i - GW;
      else if (py < GH - 1 && T[i + GW] !== t) n = i + GW;
      if (n >= 0) { ED[i] = 1; EN[i] = T[n]; Q[qt++] = i; }
    } }
    while (qh < qt) {
      if ((qh & 32767) === 32767) yield;
      const i = Q[qh++], d = ED[i];
      if (d >= 40) continue;
      const px = i % GW, t = T[i], e = EN[i], d1 = d + 1;
      let n;
      if (px > 0 && !ED[n = i - 1] && T[n] === t) { ED[n] = d1; EN[n] = e; Q[qt++] = n; }
      if (px < GW - 1 && !ED[n = i + 1] && T[n] === t) { ED[n] = d1; EN[n] = e; Q[qt++] = n; }
      if (i >= GW && !ED[n = i - GW] && T[n] === t) { ED[n] = d1; EN[n] = e; Q[qt++] = n; }
      if (i < N - GW && !ED[n = i + GW] && T[n] === t) { ED[n] = d1; EN[n] = e; Q[qt++] = n; }
    }
    for (let i = 0; i < N; i++) if (!ED[i]) ED[i] = 60;
    lap('bfs');
    // ombre portée sous la canopée et les falaises
    const SH = new Uint8Array(N);
    for (let px = 0; px < GW; px++) {
      if ((px & 63) === 63) yield;
      let run = 99;
      for (let py = 0; py < GH; py++) {
        const i = py * GW + px, t = T[i];
        const tx = px >> 4, ty = py >> 4;
        const caster = t === TER.canopy || t === TER.pastel || (t === TER.cliff && tAt(tx, ty + 1) !== TER.cliff) || (t === TER.wall && tAt(tx, ty + 1) !== TER.wall);
        if (caster) run = 0; else run++;
        if (!caster && run <= 10 && t !== TER.water) SH[i] = 11 - run;
      }
    }
    const tallGrid = map.rows.map(r => [...r].map(ch => World.isTall(ch)));
    const tallAt = (x, y) => tallGrid[y][x];
    // couleur de base
    const base = new Uint8ClampedArray(N * 4);
    const D = base;
    // canopée (bruit de Worley) : un point par cellule de 7 px, calculé une seule fois
    const CW = Math.ceil(GW / 7) + 3, CF = new Float32Array(CW * (Math.ceil(GH / 7) + 3) * 2).fill(NaN);
    const CW13 = Math.ceil(GW / 13) + 3, CF13 = new Float32Array(CW13 * (Math.ceil(GH / 13) + 3) * 2).fill(NaN);
    const cell13 = (cx, cy) => { const k = ((cy + 1) * CW13 + cx + 1) * 2; if (CF13[k] !== CF13[k]) { CF13[k] = cx * 13 + 2 + hash(cx, cy, 26) * 9; CF13[k + 1] = cy * 13 + 2 + hash(cx, cy, 27) * 9; } return k; };
    const cell7 = (cx, cy) => { const k = ((cy + 1) * CW + cx + 1) * 2; if (CF[k] !== CF[k]) { CF[k] = cx * 7 + hash(cx, cy, 16) * 7; CF[k + 1] = cy * 7 + hash(cx, cy, 17) * 7; } return k; };
    for (let py = 0; py < GH; py++) { if (py & 1) yield; for (let px = 0; px < GW; px++) {
      const i = py * GW + px, j = i * 4, t = T[i], ed = ED[i], en = EN[i];
      const tx = px >> 4, ty = py >> 4, lx = px & 15, ly = py & 15;
      const b = Art.bayer(px, py);
      let col;
      if (t === TER.grass && LUSH) {
        // près d'un chemin : l'herbe s'éclaircit en touffes mêlées de terre (fondu tramé, sans contour)
        if (en === TER.dirt && ed <= 2 && hash(px, py, 314) < (3 - ed) / 4) col = lerpPal(DIRT, lushDirtV(px, py, i) - 0.3);
        else {
          col = lerpPal(GRASS, lushGrassV(px, py, i, tx, ty));
          const p5 = G5(px, py), sh = SH[i];
          if (p5 > 0.55) { const w = (p5 - 0.55) * 0.55; col[0] += (236 - col[0]) * w; col[1] += (226 - col[1]) * w * 0.6; col[2] += (110 - col[2]) * w * 0.4; }   // nappe de soleil (jaune doré)
          const cool = Math.min(0.5, (p5 < 0.42 ? (0.42 - p5) * 1.2 : 0) + sh * 0.035);
          if (cool > 0) { col[0] += (30 - col[0]) * cool; col[1] += (90 - col[1]) * cool * 0.5; col[2] += (100 - col[2]) * cool; }   // ombre bleutée
        }
      } else if (t === TER.dirt && LUSH) {
        // bord du chemin : brins d'herbe qui débordent, terre un peu plus sombre
        if (en === TER.grass && ed <= 3 && hash(px, py, 98) < (4 - ed) / 6) col = lerpPal(GRASS, lushGrassV(px, py, i, tx, ty) - 0.4);
        else col = lerpPal(DIRT, lushDirtV(px, py, i) - (en === TER.grass && ed <= 3 ? (4 - ed) * 0.18 : 0));
        if (map.ambient === 'forest' && hash(px >> 1, py >> 1, 92) < 0.012) col = Art.mix(Art.hex(LITTER[Math.floor(hash(px >> 1, py >> 1, 93) * LITTER.length)]), col, 0.45);   // quelques feuilles mortes, fondues dans la terre
      } else if (t === TER.lawn && LUSH) {
        // pelouse (Village des Bébés) : mêmes brins fins, palette pastel, fleurs semées
        if (en !== TER.lawn && en !== 255 && en !== TER.pastel && ed <= 2 && hash(px, py, 315) < (3 - ed) / 4) col = lerpPal(SAND, 3.4 + (hash(px, py, 316) - 0.5));
        else col = lerpPal(PAL.lawn, lushGrassV(px, py, i, tx, ty) + 0.2);
        if (hash(px, py, 13) < 0.005) col = Art.hex(['#ffb6d6', '#fff0a0', '#d8c0ff', '#ffffff'][Math.floor(hash(px, py, 14) * 4)]);
      } else if (t === TER.grass) {
        let v = 2.4 + (G5(px, py) - 0.5) * 3 + (noise(px * 0.3, py * 0.3, 6) - 0.5) * 1.4 + b * 0.8;
        if (en !== TER.grass && en !== TER.canopy && en !== 255) { if (ed === 1) v = 0.2; else if (ed === 2) v -= 1; }
        v -= SH[i] * 0.22;
        if (tallAt(tx, ty)) v -= 1.2;
        col = GRASS[DW.clamp(Math.round(v), 0, 5)];
        if (map.ambient === 'forest' && SH[i] > 2 && hash(px >> 1, py >> 1, 90) < 0.02) col = Art.hex(['#c8a040', '#a8c050', '#d08a3a'][Math.floor(hash(px, py, 91) * 3)]);
      } else if (t === TER.dirt) {
        let v = 3 + (D7(px, py) - 0.5) * 2.4 + b * 0.8;
        if (ed <= 2 && en !== TER.dirt) v -= 3 - ed;
        if (ed === 3 && hash(px, py, 94) < 0.08) v += 2;
        if (py > 2 && (T[i - GW] === TER.grass || T[i - 2 * GW] === TER.grass)) v -= 1;
        v -= SH[i] * 0.2;
        col = DIRT[DW.clamp(Math.round(v), 0, 5)];
        if (map.ambient === 'forest' && hash(px >> 1, py >> 1, 92) < 0.06) col = Art.hex(LITTER[Math.floor(hash(px >> 1, py >> 1, 93) * LITTER.length)]);
      } else if (t === TER.sand) {
        const r = Math.sin(px * 0.2 + S8(px, py) * 9 + py * 0.55);
        let v = 3.2 + (S9(px, py) - 0.5) * 1.6 + b * 0.7 + (r > 0.9 ? -1 : r < -0.96 ? 1 : 0);
        if (hash(px, py, 10) < 0.03) v += hash(px, py, 11) < 0.5 ? -1 : 1;
        v -= SH[i] * 0.2;
        if (en === TER.water && ed <= 7) col = WET[DW.clamp(Math.round(v * 0.5 + ed * 0.35 - 1), 0, 3)];
        else col = SAND[DW.clamp(Math.round(v), 0, 5)];
      } else if (t === TER.lawn) {
        let v = 3 + (L12(px, py) - 0.5) * 2 + b * 0.6;
        if (ed === 1 && en !== TER.lawn && en !== 255) v = 1;
        v -= SH[i] * 0.2;
        if (tallAt(tx, ty)) v -= 1;
        col = PAL.lawn[DW.clamp(Math.round(v), 0, 5)];
        const h = hash(px, py, 13);
        if (h < 0.006) col = Art.hex(['#ffb6d6', '#fff0a0', '#d8c0ff', '#ffffff'][Math.floor(hash(px, py, 14) * 4)]);
      } else if (t === TER.stone) {
        const row = Math.floor(py / 6), bx = Math.floor((px + (row % 2) * 4) / 8);
        const ix = (px + (row % 2) * 4) % 8, iy = py % 6;
        const tone = ['#f6dccc', '#f2d0c4', '#fae6d8', '#ecd4e4'][Math.floor(hash(bx, row, 15) * 4)];
        let c = Art.hex(tone);
        if (ix === 0 || iy === 0) c = Art.hex('#c4a2ac');
        else if (ix === 1 || iy === 1) c = Art.mix(c, [255, 255, 255], 0.35);
        else if (ix === 7 || iy === 5) c = Art.mix(c, [150, 110, 130], 0.25);
        if (ed === 1 && en !== TER.stone) c = Art.hex('#b49098');
        for (const m of map.mosaic || []) {
          const dx = px - m.x, dy = (py - m.y) * 1.25, r = Math.hypot(dx, dy);
          if (r < m.r) {
            const ring = Math.floor(r / 5), ang = (Math.atan2(dy, dx) + Math.PI) / (Math.PI * 2) * (8 + ring * 6);
            c = Art.hex(['#ffd2e4', '#cfe4ff', '#fff2c8', '#d8f4dc'][(ring + Math.floor(ang)) % 4]);
            if (r % 5 < 1 || ang % 1 < 0.08) c = Art.hex('#c8a8b8');
            if (r > m.r - 1.5) c = Art.hex('#a88898');
          }
        }
        col = c;
      } else if (t === TER.cobble) {
        const row = Math.floor(py / 5), bx = Math.floor((px + (row % 2) * 3) / 7);
        const ix = (px + (row % 2) * 3) % 7, iy = py % 5, decay = map.decay || 0, hb = hash(bx, row, 160);
        let c = Art.hex(['#a8a49c', '#9c9890', '#b4b0a6', '#a09a90'][Math.floor(hash(bx, row, 161) * 4)]);
        if (ix === 0 || iy === 0) c = Art.hex(decay > 0.3 && hash(px, py, 162) < decay * 0.5 ? '#4a8a3a' : '#6a665e');
        else if (ix === 1 || iy === 1) c = Art.mix(c, [255, 255, 255], 0.25);
        else if (ix === 6 || iy === 4) c = Art.mix(c, [40, 36, 30], 0.25);
        if (hb < decay * 0.32) c = Art.hex(hash(px, py, 163) < 0.5 ? '#8a6a44' : (hash(px >> 1, py >> 1, 164) < 0.4 ? '#4a9a3e' : '#7a5a3a'));
        if (ed <= 3 && en !== TER.cobble) c = Art.hex(ed === 1 ? '#4e4a44' : (ix === 0 || iy === 0) ? '#5e5a52' : '#8a8478');
        col = Art.mix(c, [0, 0, 0], SH[i] * 0.03);
      } else if (t === TER.canopy && !ROCKY) {
        // VOÛTE DE FEUILLAGE PEINTE : grandes grappes (Worley 13 px), chacune éclairée en haut à gauche,
        // creux sombres et froids entre elles, tons continus (pas de paliers)
        const cx = Math.floor(px / 13), cy = Math.floor(py / 13);
        let d1 = 99, d2 = 99, ox = 0, oy = 0;
        for (let yy = -1; yy <= 1; yy++) for (let xx = -1; xx <= 1; xx++) {
          const k = cell13(cx + xx, cy + yy), fx = CF13[k], fy = CF13[k + 1], ex = px - fx, ey = py - fy;
          const dd = Math.sqrt(ex * ex + ey * ey);
          if (dd < d1) { d2 = d1; d1 = dd; ox = ex; oy = ey; } else if (dd < d2) d2 = dd;
        }
        // petites grappes de feuilles (Worley 7 px) posées sur les grandes
        const sx = Math.floor(px / 7), sy = Math.floor(py / 7);
        let s1 = 99, s2 = 99, sox = 0, soy = 0;
        for (let yy = -1; yy <= 1; yy++) for (let xx = -1; xx <= 1; xx++) {
          const k = cell7(sx + xx, sy + yy), ex = px - CF[k], ey = py - CF[k + 1], dd = Math.sqrt(ex * ex + ey * ey);
          if (dd < s1) { s2 = s1; s1 = dd; sox = ex; soy = ey; } else if (dd < s2) s2 = dd;
        }
        let v = 3.6 - d1 * 0.11 - (ox + oy) * 0.05 - s1 * 0.16 - (sox + soy) * 0.07 + (hash(px >> 1, py >> 1, 18) - 0.5) * 0.4 - Math.min(ed, 40) * 0.03;
        if (d2 - d1 < 1.4) v -= 0.6 * (1 - (d2 - d1) / 1.4);   // creux entre les grandes grappes
        if (s2 - s1 < 0.9) v -= 0.35;                           // et entre les petites
        col = lerpPal(CANOPY, v);
        if (v < 1.6) { const k = (1.6 - v) * 0.25; col[0] += (12 - col[0]) * k; col[1] += (40 - col[1]) * k * 0.6; col[2] += (60 - col[2]) * k; }   // ombre bleutée
        else if (v > 3.6) { const k = Math.min(0.4, (v - 3.6) * 0.3); col[0] += (230 - col[0]) * k; col[1] += (230 - col[1]) * k * 0.5; col[2] += (120 - col[2]) * k * 0.3; }   // éclat doré
      } else if (t === TER.canopy) {
        // bruit de Worley : touffes de feuilles
        const cx = Math.floor(px / 7), cy = Math.floor(py / 7);
        let d1 = 99, d2 = 99, ox = 0, oy = 0;
        for (let yy = -1; yy <= 1; yy++) for (let xx = -1; xx <= 1; xx++) {
          const k = cell7(cx + xx, cy + yy), fx = CF[k], fy = CF[k + 1], ex = px - fx, ey = py - fy;
          const dd = Math.sqrt(ex * ex + ey * ey);
          if (dd < d1) { d2 = d1; d1 = dd; ox = px - fx; oy = py - fy; } else if (dd < d2) d2 = dd;
        }
        let v = 3.6 - d1 * 0.45 - (ox + oy) * 0.12 + b * 0.6 + (hash(px >> 1, py >> 1, 18) - 0.5) * 0.8 - Math.min(ed, 40) * 0.035;
        if (ROCKY) {
          // roche : facettes éclairées par le haut-gauche, fissures franches
          v = 3.4 - d1 * 0.2 - (ox + oy) * 0.24 + b * 0.5 - Math.min(ed, 40) * 0.02;
          if (d2 - d1 < 1) v -= 2;
        } else if (d2 - d1 < 1.2) v -= 1.3;
        col = CANOPY[DW.clamp(Math.round(v), 0, 5)];
      } else if (t === TER.pastel) {
        const cx = Math.floor(px / 8), cy = Math.floor(py / 8);
        let d1 = 99, d2 = 99, ox = 0, oy = 0, cell = 0;
        for (let yy = -1; yy <= 1; yy++) for (let xx = -1; xx <= 1; xx++) {
          const fx = (cx + xx) * 8 + hash(cx + xx, cy + yy, 16) * 8, fy = (cy + yy) * 8 + hash(cx + xx, cy + yy, 17) * 8;
          const dd = Math.sqrt((px - fx) * (px - fx) + (py - fy) * (py - fy));
          if (dd < d1) { d2 = d1; d1 = dd; ox = px - fx; oy = py - fy; cell = hash(cx + xx, cy + yy, 19); } else if (dd < d2) d2 = dd;
        }
        const pal = cell < 0.33 ? PAL.pink : cell < 0.66 ? PAL.mint : PAL.lilac;
        let v = 3.2 - d1 * 0.38 - (ox + oy) * 0.11 + b * 0.6;
        if (d2 - d1 < 1.2) v -= 1.4;
        col = pal[DW.clamp(Math.round(v), 0, 4)];
      } else if (t === TER.cliff) {
        const face = tAt(tx, ty + 1) !== TER.cliff;
        const above = tAt(tx, ty - 1) !== TER.cliff;
        if (face) {
          let v = 3 + (noise(px * 0.5, py * 0.12, 19) - 0.5) * 2.6 + b * 0.7 - (ly / 16) * 1.4;
          if (noise(px * 0.9, py * 0.05, 20) > 0.72) v -= 1.5;
          if (ly >= 14) v = 0.5;
          col = CLIFF[DW.clamp(Math.round(v), 0, 5)];
          if (above && ly < 3) col = ly === 2 ? GRASS[0] : GRASS[ly ? 2 : 4];
        } else {
          let v = 2.6 + (C21(px, py) - 0.5) * 2 + b;
          col = GRASS[DW.clamp(Math.round(v), 0, 4)];
        }
      } else if (t === TER.stairs) {
        const s = ly % 4;
        col = Art.hex(s === 0 ? '#e0d0b0' : s === 3 ? '#7a6a50' : '#bca888');
        if (lx < 2 || lx > 13) col = CLIFF[lx < 2 ? 2 : 1];
      } else if (t === TER.bridge) {
        const vertical = !(tAt(tx - 1, ty) === TER.bridge || tAt(tx + 1, ty) === TER.bridge);
        const a = vertical ? ly : lx, bb = vertical ? lx : ly;
        const plank = Math.floor((vertical ? py : px) / 4);
        const tone = ['#a8743c', '#b8844c', '#9a6a36'][Math.floor(hash(plank, 3, 22) * 3)];
        let c = Art.hex(tone);
        if (a % 4 === 3) c = Art.hex('#4a3018');
        else if (a % 4 === 0) c = Art.mix(c, [255, 240, 200], 0.2);
        c = Art.mix(c, [60, 30, 10], (noise(px * 0.6, py * 0.15, 23) - 0.5) * 0.3);
        if (bb <= 1 || bb >= 14) c = Art.hex(bb === 0 || bb === 15 ? '#4a2c14' : '#6a4422');
        if ((bb === 3 || bb === 12) && a % 4 === 1) c = Art.hex('#d8d0c0');
        col = c;
      } else if (t === TER.wood && FLOOR) {
        col = floorPx(FLOOR, px, py, lx, ly, ed, en, SH[i], b);
      } else if (t === TER.wood) {
        // parquet : lames de longueur variable, joints sombres, veinage
        const row = Math.floor(py / 5), off = Math.floor(hash(row, 7, 170) * 40), bx = Math.floor((px + off) / 22);
        const ix = (px + off) % 22, iy = py % 5;
        let c = Art.hex(['#b07a46', '#a46e3e', '#ba8650', '#9e683a'][Math.floor(hash(bx, row, 171) * 4)]);
        c = Art.mix(c, [70, 40, 20], (noise(px * 0.5, py * 0.12 + row * 3, 172) - 0.5) * 0.35);
        if (iy === 0) c = Art.hex('#5a3618'); else if (iy === 1) c = Art.mix(c, [255, 230, 190], 0.18);
        else if (ix === 0) c = Art.hex('#6a4222');
        if (hash(px >> 1, py, 173) < 0.012) c = Art.mix(c, [60, 30, 10], 0.4);
        // ombre au pied des murs et sur les côtés de la pièce
        if (en !== TER.wood && ed <= 5) c = Art.mix(c, [30, 14, 6], (6 - ed) * 0.09);
        col = Art.mix(c, [20, 10, 4], SH[i] * 0.045);
      } else if (t === TER.wall) {
        // mur vu de face : poutre en haut, enduit, lambris et plinthe en bas
        const top = tAt(tx, ty - 1) !== TER.wall, bottom = tAt(tx, ty + 1) !== TER.wall;
        let c = WALL ? wallPx(WALL, px, py) : Art.hex('#ead8b4');
        c = Art.mix(c, [150, 110, 70], (fbm(px * 0.12, py * 0.12, 174) - 0.5) * (WALL ? 0.18 : 0.35) + b * 0.05);
        if (top && ly < 4) c = Art.hex(ly === 3 ? '#3a2412' : ly === 0 ? '#4a2e16' : '#7a5230');
        if (bottom) {
          if (ly >= 8 && ly < 14) {
            if (WALL && WALL.wood) { c = Art.mix(WALL.wood, [0, 0, 0], ((px >> 2) & 1) ? 0 : 0.08); if ((px & 3) === 0) c = Art.mix(WALL.wood, [20, 10, 0], 0.4); if (ly === 8) c = Art.mix(WALL.wood, [255, 255, 255], 0.25); }
            else { c = Art.hex(((px >> 2) & 1) ? '#8a5a32' : '#7e522c'); if ((px & 3) === 0) c = Art.hex('#5a3a1e'); if (ly === 8) c = Art.hex('#a87a4a'); }
          }
          if (ly >= 14) c = Art.hex(ly === 15 ? '#2a1a0c' : '#4a2e16');
        }
        // poteaux de colombage toutes les 5 cases
        if (tx % 5 === 0 && lx < 3 && !(top && ly < 4)) c = Art.hex(lx === 0 ? '#3a2412' : '#6a4424');
        col = c;
      } else if (t === TER.metal) {
        // tôle d'acier : plaques rivetées, rainures, traces d'usure et bandes de sécurité
        const bx = px >> 4, by = py >> 4;
        let c = Art.hex(['#8a92a0', '#848c9a', '#9098a6', '#7e8694'][Math.floor(hash(bx, by, 175) * 4)]);
        c = Art.mix(c, [40, 44, 56], (fbm(px * 0.1, py * 0.1, 176) - 0.5) * 0.4);
        if ((ly === 4 || ly === 11) && lx > 2 && lx < 13) c = Art.mix(c, [255, 255, 255], 0.12);
        if (lx === 0 || ly === 0) c = Art.hex('#4a505e'); else if (lx === 1 || ly === 1) c = Art.mix(c, [255, 255, 255], 0.25);
        if ((lx === 2 || lx === 13) && (ly === 2 || ly === 13)) c = Art.hex('#c8ccd6');
        if (map.hazard && map.hazard.some(([x0, y0, x1, y1]) => tx >= x0 && tx <= x1 && ty >= y0 && ty <= y1)) c = Art.hex(((px + py) >> 2) & 1 ? '#f0c020' : '#2a2a30');
        if (hash(px >> 1, py >> 1, 177) < 0.01) c = Art.mix(c, [120, 70, 30], 0.5);
        col = Art.mix(c, [10, 10, 16], SH[i] * 0.04);
      } else if (t === TER.void) {
        // hors de la pièce : noir, avec le dessus des murs au bord du parquet
        col = Art.hex('#0e0a12');
        if (en === TER.wood && ed <= 4) col = Art.hex(ed === 1 ? '#2a1a0e' : ed === 4 ? '#3a2614' : '#6a4a2c');
        if (en === TER.wall && ed <= 4 && tAt(tx, ty + 1) !== TER.wall) col = Art.hex(ed === 4 ? '#3a2614' : '#6a4a2c');
        if (en === TER.metal && ed <= 5) col = Art.hex(['#5a6070', '#3a404c', '#7a8292', '#2a2e38', '#1a1d24'][ed - 1]);
      } else {
        col = WATER[3];
      }
      // ombre douce de la forêt sur les bords de la carte (façon Digimon World 1)
      if (LUSH) {
        const de = Math.min(px, py, GW - 1 - px, GH - 1 - py);
        if (de < 80) { const k = (1 - de / 80) * (1 - de / 80) * 0.5; put(D, j, col); D[j] -= D[j] * k; D[j + 1] -= (D[j + 1] - 12) * k; D[j + 2] -= D[j + 2] * k * 0.9; continue; }
      }
      put(D, j, col);
    } }
    lap('couleur');
    // décor peint (fleurs, champignons)
    const flowers = [];
    const decorate = (tx, ty, kind) => {
      const n = kind === 'mushrooms' ? 3 : 5;
      for (let k = 0; k < n; k++) {
        const x = tx * TS + 2 + Math.floor(hash(tx, ty, 30 + k) * 12), y = ty * TS + 3 + Math.floor(hash(tx, ty, 40 + k) * 11);
        const set = (xx, yy, c) => { if (xx < 0 || yy < 0 || xx >= GW || yy >= GH) return; put(D, (yy * GW + xx) * 4, Art.hex(c)); };
        if (kind === 'shells') {
          if (k > 2) continue;
          const r = hash(tx, ty, 60 + k);
          if (r < 0.4) { const c = ['#ffe0e8', '#fff4e0', '#ffd0b8'][k]; set(x, y, c); set(x - 1, y + 1, c); set(x + 1, y + 1, c); set(x, y + 1, '#d8a8a8'); }
          else if (r < 0.7) { const c = k % 2 ? '#f07a3a' : '#e85a6a'; set(x, y - 1, c); set(x - 1, y, c); set(x, y, c); set(x + 1, y, c); set(x - 1, y + 1, c); set(x + 1, y + 1, c); }
          else { set(x, y, '#f8f4ec'); set(x + 1, y, '#e8dcc8'); }
          continue;
        }
        if (kind === 'weeds') {
          ['#7a8a3a', '#9aaa48', '#6a7a30'].forEach((c, j) => { set(x - 1 + j, y - j % 2, c); set(x - 1 + j, y + 1, '#5a6a2a'); });
          set(x, y - 2, '#b8b858');
        } else if (kind === 'mushrooms') {
          set(x, y + 2, '#f4ead8'); set(x, y + 1, '#f4ead8');
          ['#a01818', '#e04040', '#e04040', '#e04040', '#a01818'].forEach((c, i) => set(x - 2 + i, y, c));
          set(x - 1, y - 1, '#e04040'); set(x, y - 1, '#ff7070'); set(x + 1, y - 1, '#e04040'); set(x, y, '#ffffff');
          set(x - 2, y + 3, '#2c6a2c'); set(x + 2, y + 3, '#2c6a2c');
        } else {
          if (k === 0) flowers.push([x, y]);   // (une par case : les saisons les fanent ou les changent, gfx/meteo.js)
          const cols = kind === 'flowers2' ? ['#ff9ac8', '#fff2a0', '#c8b4ff', '#ffffff'] : ['#ff5a7a', '#ffd84a', '#ffffff', '#b48aff', '#ff9a4a'];
          const c = cols[Math.floor(hash(tx, ty, 50 + k) * cols.length)];
          set(x, y + 2, '#2e7a2c'); set(x, y + 1, '#3a8a30');
          set(x - 1, y, c); set(x + 1, y, c); set(x, y - 1, c); set(x, y + 1, c);
          set(x, y, k % 2 ? '#ffe070' : '#f0a020');
        }
      }
    };
    for (let ty = 0; ty < map.h; ty++) for (let tx = 0; tx < map.w; tx++) {
      const inf = World.info(map.rows[ty][tx]);
      if (inf.deco && !(TH && TH.noFlowers && (inf.deco === 'flowers' || inf.deco === 'mushrooms'))) decorate(tx, ty, inf.deco);
    }
    // touffes d'herbe, trèfles et brindilles sur l'herbe des forêts
    if (map.ambient === 'forest') {
      const set = (xx, yy, c) => { if (xx >= 0 && yy >= 0 && xx < GW && yy < GH && T[yy * GW + xx] === TER.grass) put(D, (yy * GW + xx) * 4, typeof c === 'string' ? Art.hex(c) : c); };
      const g0 = GRASS[0], g1 = GRASS[1], g2 = GRASS[2], g3 = GRASS[3], g4 = GRASS[4];
      for (let k = 0; k < GW * GH / 90; k++) {
        const x = Math.floor(hash(k, 1, 200) * GW), y = Math.floor(hash(k, 2, 200) * GH), r = hash(k, 3, 200);
        if (T[y * GW + x] !== TER.grass || ED[y * GW + x] < 3) continue;
        if (r < 0.6) { set(x, y, g0); set(x - 1, y - 1, g2); set(x + 1, y - 1, g2); set(x, y - 2, g4); set(x - 2, y - 2, g3); set(x + 2, y - 2, g3); }
        else if (r < 0.85) { set(x, y, g2); set(x + 1, y, g2); set(x, y + 1, g2); set(x + 1, y + 1, g1); set(x - 1, y + 1, g3); }
        else if (TH && TH.litter && r < 0.95) { const c = LITTER[Math.floor(hash(k, 4, 200) * LITTER.length)]; set(x, y, c); set(x + 1, y, c); set(x, y + 1, c); }
        else { set(x, y, '#8a6a3a'); set(x + 1, y + 1, '#8a6a3a'); set(x + 2, y + 1, '#6a4a2a'); }
      }
    }
    // cailloux le long des bords des chemins (sol façon DW1)
    if (LUSH) {
      const P0 = [150, 140, 128], P1 = [204, 196, 182], P2 = [96, 88, 80];
      for (let k = 0; k < GW * GH / 60; k++) {
        const x = Math.floor(hash(k, 7, 220) * (GW - 1)), y = Math.floor(hash(k, 8, 220) * (GH - 1)), i = y * GW + x;
        if (T[i] !== TER.dirt || ED[i] > 4 || T[i + 1] !== TER.dirt || T[i + GW] !== TER.dirt) continue;
        put(D, i * 4, P1); put(D, (i + 1) * 4, P0); put(D, (i + GW) * 4, P2); put(D, (i + GW + 1) * 4, P2);
      }
    }
    if (TH && TH.sparkle) {
      const sp = TH.sparkle.map(Art.hex);
      for (let k = 0; k < GW * GH / 60; k++) {
        const x = Math.floor(hash(k, 5, 210) * GW), y = Math.floor(hash(k, 6, 210) * GH), i = y * GW + x;
        if (T[i] === TER.grass || T[i] === TER.dirt || T[i] === TER.sand) put(D, i * 4, sp[k % sp.length]);
      }
    }
    lap('decor');
    // objets
    const objs = [];
    const solid = new Set(), widen = [];   // widen : largeur des objets bas et larges (ajoutée à la fin, sans jamais couper un passage)
    for (let ty = 0; ty < map.h; ty++) for (let tx = 0; tx < map.w; tx++) {
      const inf = World.info(map.rows[ty][tx]);
      if (!inf.obj) continue;
      const kind = (TH && TH.objMap && TH.objMap[inf.obj]) || inf.obj;
      const o = OBJ[kind];
      let v = Math.floor(hash(tx, ty, 60) * o.n);
      if (inf.obj === 'tree' && kind !== 'tree') {
        const h = hash(tx, ty, 60);
        if (TH.trees2) { const tot = TH.trees2.reduce((a, t) => a + t[1], 0); let r = h * tot; v = TH.trees2[0][0]; for (const [tv, w] of TH.trees2) { if (r < w) { v = tv; break; } r -= w; } }
      } else if (inf.obj === 'tree') {
        const h = hash(tx, ty, 60);
        if (TH) { const tot = TH.trees.reduce((a, t) => a + t[1], 0); let r = h * tot; v = TH.trees[0][0]; for (const [tv, w] of TH.trees) { if (r < w) { v = tv; break; } r -= w; } }
        else { v = h < 0.5 ? Math.floor(h * 6) : h < 0.82 ? 3 : h < 0.9 ? 4 : Math.floor(hash(tx, ty, 62) * 3); if (map.ambient !== 'forest') v = Math.floor(h * 3); }
      }
      const jx = inf.obj === 'tree' || inf.obj === 'fern' ? Math.round((hash(tx, ty, 61) - 0.5) * 4) : 0;
      if (!World.objReady(kind, v)) { if (o.frames) for (let fr = 0; fr < o.frames; fr++) { World.objFrame(kind, v, fr); yield; } else { World.obj(kind, v); yield; } }
      const anim = o.frames ? World.objFrames(kind, v) : null;
      // objets bas et larges posés au sol (bûches, troncs creux, bois flotté, rochers) : toute leur largeur bloque
      // le passage, pas seulement leur case (on ne traverse plus le bout d'une bûche)
      { const sp0 = anim ? anim[0] : World.obj(kind, v); if (inf.solid && inf.obj !== 'tree' && sp0.h <= 34 && sp0.w > 22) { const k = Math.round((sp0.w - 16) / 32); const grp = []; for (let xx = 1; xx <= k; xx++) grp.push((tx - xx) + ',' + ty, (tx + xx) + ',' + ty); widen.push(grp); } }
      // décor naturel retourné une fois sur deux (gauche / droite) : les rangées d'arbres ne se répètent plus à l'identique
      const flip = !anim && NATURAL.has(inf.obj) && hash(tx, ty, 63) < 0.5;
      objs.push({ kind, v, flip, spr: anim ? anim[0] : World.obj(kind, v), sprs: anim, fps: o.fps || 4, x: tx * TS + 8 + jx, y: ty * TS + 15 + (inf.obj === 'tree' ? 1 : 0), sort: inf.under ? -10 + ty * 0.01 : ty + (inf.solid ? 0.5 : 0.6), big: ['tree', 'palm', 'bigtree'].includes(inf.obj) || !!o.big, tx, ty, flat: !inf.solid });
    }
    // objets posés : walk = on marche dessus (tapis), back = accroché au mur (dessiné derrière tout)
    for (const o of map.objects || []) {
      const D = OBJ[o.kind], vv = o.v || 0;
      if (!World.objReady(o.kind, vv)) { if (D.frames) for (let fr = 0; fr < D.frames; fr++) { World.objFrame(o.kind, vv, fr); yield; } else { World.obj(o.kind, vv); yield; } }
      const anim = OBJ[o.kind].frames ? World.objFrames(o.kind, o.v || 0) : null;
      const spr = anim ? anim[0] : World.obj(o.kind, o.v || 0);
      if (!o.walk && !o.top) for (let yy = 0; yy < o.h; yy++) for (let xx = 0; xx < o.w; xx++) solid.add((o.x + xx) + ',' + (o.y + yy));
      // cases bloquées autour d'un objet qu'on traverse en son centre (ex. les piliers d'une porte de temple)
      for (const [bx, by] of o.block || []) solid.add((o.x + bx) + ',' + (o.y + by));
      // pareil pour les objets posés plus larges que leur emprise (bas : bûches, piliers tombés...)
      if (!o.walk && !o.top && !o.back && spr.h <= 34 && spr.w > o.w * 16 + 6) { const k = Math.round((spr.w - o.w * 16) / 32); const grp = []; for (let xx = 1; xx <= k; xx++) grp.push((o.x - xx) + ',' + (o.y + o.h - 1), (o.x + o.w - 1 + xx) + ',' + (o.y + o.h - 1)); widen.push(grp); }
      const flat = o.walk || o.back;
      objs.push({ kind: o.kind, v: o.v || 0, spr, sprs: anim, fps: OBJ[o.kind].fps || 4, x: (o.x + o.w / 2) * TS + (o.ox || 0), y: (o.y + o.h) * TS - 1 + (o.oy || 0), sort: flat ? -10 + o.y * 0.01 : o.top ? 1000 : o.y + o.h - 0.5, big: !flat && !o.small && !o.top, flat: flat || o.top, tx: o.x, ty: o.y, def: o });
    }
    // herbes hautes
    const tall = [];
    for (let ty = 0; ty < map.h; ty++) for (let tx = 0; tx < map.w; tx++) {
      const inf = World.info(map.rows[ty][tx]);
      if (inf.tall) tall.push({ tx, ty, kind: World.tallKind(map, inf.tall), v: Math.floor(hash(tx, ty, 70) * 4) });
    }
    const puddles = [];
    if (map.ambient === 'town') for (let ty = 0; ty < map.h; ty++) for (let tx = 0; tx < map.w; tx++) {
      const t = tt[ty][tx];
      if ((t === TER.cobble || t === TER.dirt) && hash(tx, ty, 180) < 0.11 && !World.info(map.rows[ty][tx]).solid)
        puddles.push({ x: tx * TS + 4 + hash(tx, ty, 181) * 8, y: ty * TS + 5 + hash(tx, ty, 182) * 6, rx: 3 + hash(tx, ty, 183) * 4, ry: 1.6 + hash(tx, ty, 184) * 1.4 });
    }
    lap('objets');
    // eau animée : calque limité à la zone d'eau (transparent ailleurs), 8 images
    const WI = [];
    let wx0 = GW, wy0 = GH, wx1 = -1, wy1 = -1;
    for (let i = 0; i < N; i++) if (T[i] === TER.water) {
      WI.push(i);
      const px = i % GW, py = (i / GW) | 0;
      if (px < wx0) wx0 = px; if (px > wx1) wx1 = px; if (py < wy0) wy0 = py; if (py > wy1) wy1 = py;
    }
    const lilies = [];
    if (!(TH && TH.water === World.LAVA)) for (let ty = 0; ty < map.h; ty++) for (let tx = 0; tx < map.w; tx++) if (World.info(map.rows[ty][tx]).lily) lilies.push([tx, ty]);   // pas de nénuphars sur la lave
    yield;
    const ground = Art.canvas(GW, GH);
    ground.getContext('2d').putImageData(new ImageData(base, GW, GH), 0, 0);
    // détails au sol, denses comme dans Digimon World 2003 (touffes d'herbe, trèfles, fleurs, cailloux,
    // feuilles mortes, coquillages, mousse entre les pavés) : seulement visuels, peints une fois
    if (LUSH && map.dense !== false) {
      const g = ground.getContext('2d'), rgb = a => `rgb(${a[0] | 0},${a[1] | 0},${a[2] | 0})`;
      const G0 = rgb(GRASS[0]), G1 = rgb(GRASS[1]), G3 = rgb(GRASS[Math.min(3, GRASS.length - 1)]), G4 = rgb(GRASS[Math.min(4, GRASS.length - 1)]), G5c = rgb(GRASS[GRASS.length - 1]);
      const D0 = rgb(DIRT[0]), D4 = rgb(DIRT[Math.min(4, DIRT.length - 1)]), S0 = rgb(SAND[0]);
      const FL = map.ambient === 'forest' ? ['#ffffff', '#f0e070', '#c8a0ff'] : ['#ffffff', '#ffe060', '#f080b0', '#a0b8ff', '#ff8a5a'];
      const forest = map.ambient === 'forest';
      for (let ty = 0; ty < map.h; ty++) for (let tx = 0; tx < map.w; tx++) {
        const dens = fbm(tx * 0.22, ty * 0.22, 77), n = Math.floor(dens * 4.2 + hash(tx, ty, 78) * 1.2) - 1;
        for (let k = 0; k < n; k++) {
          const px = tx * TS + Math.floor(hash(tx * 7 + k, ty, 79) * 15), py = ty * TS + 3 + Math.floor(hash(tx, ty * 7 + k, 80) * 13);
          if (px >= GW || py >= GH) continue;
          const i = py * GW + px, t = T[i], r = hash(px, py, 81);
          if (ED[i] < 3 || SH[i] > 6) continue;
          if (t === TER.grass || t === TER.lawn) {
            if (r < 0.42) {   // touffe : brins sombres et pointes claires
              for (let b = -2; b <= 2; b++) { const h = 2 + Math.floor(hash(px + b, py, 82) * 3); g.fillStyle = b % 2 ? G0 : G1; g.fillRect(px + b, py - h, 1, h); g.fillStyle = G4; g.fillRect(px + b, py - h, 1, 1); }
            } else if (r < 0.6) {   // trèfle
              g.fillStyle = G3; g.fillRect(px, py, 2, 1); g.fillRect(px + 1, py - 1, 1, 1); g.fillRect(px - 1, py - 1, 1, 1); g.fillStyle = G5c; g.fillRect(px, py - 1, 1, 1);
            } else if (r < 0.78) {   // petites fleurs en grappe
              const col = FL[Math.floor(hash(px, py, 83) * FL.length)];
              for (let f = 0; f < 3; f++) { const fx = px + Math.floor(hash(px, f, 84) * 5) - 2, fy = py - Math.floor(hash(py, f, 85) * 3); g.fillStyle = G0; g.fillRect(fx, fy + 1, 1, 1); g.fillStyle = col; g.fillRect(fx, fy, 1, 1); }
            } else if (r < 0.88 && forest) {   // feuilles mortes
              g.fillStyle = LITTER[Math.floor(hash(px, py, 86) * LITTER.length)]; g.fillRect(px, py, 2, 1); g.fillRect(px + 1, py - 1, 1, 1);
            } else if (r < 0.94) {   // caillou
              g.fillStyle = '#5a5a58'; g.fillRect(px, py, 3, 2); g.fillStyle = '#a8a8a0'; g.fillRect(px, py, 2, 1);
            } else {   // ombre d'herbe dense
              g.fillStyle = G0; g.globalAlpha = 0.5; g.fillRect(px - 2, py, 5, 1); g.globalAlpha = 1;
            }
          } else if (t === TER.dirt) {
            if (r < 0.5) { g.fillStyle = D0; g.fillRect(px, py, 2, 1); g.fillStyle = D4; g.fillRect(px, py - 1, 1, 1); }   // gravier
            else if (r < 0.7) { g.fillStyle = D0; g.fillRect(px, py, 1, 1); g.fillRect(px + 1, py + 1, 2, 1); g.fillRect(px + 3, py + 1, 1, 1); }   // fissure
          } else if (t === TER.sand) {
            if (r < 0.25) { g.fillStyle = '#fff4e0'; g.fillRect(px, py, 2, 1); g.fillStyle = '#e8a090'; g.fillRect(px + 1, py, 1, 1); }   // coquillage
            else if (r < 0.5) { g.fillStyle = S0; g.fillRect(px, py, 2, 1); }
          } else if (t === TER.cobble) {
            if (r < 0.35) { g.fillStyle = G1; g.fillRect(px, py, 1, 1); g.fillRect(px + 1, py - 1, 1, 1); }   // mousse et herbes entre les pavés
          }
        }
      }
      // circuits apparents (la signature de Digimon World 2003) : quelques pistes cyan à angles droits,
      // avec des nœuds lumineux, comme si le monde numérique affleurait sous la nature (pas en ville)
      if (map.ambient !== 'town' && map.circuits !== false) {
        const nP = Math.max(1, Math.round(map.w * map.h / 380)), okT = t => t === TER.grass || t === TER.dirt || t === TER.sand || t === TER.lawn;
        for (let p = 0; p < nP; p++) {
          let x = Math.floor(hash(p, 1, 501) * GW), y = Math.floor(hash(p, 2, 501) * GH);
          if (!okT(T[y * GW + x]) || ED[y * GW + x] < 6) continue;
          g.save(); g.globalAlpha = 0.32; g.strokeStyle = '#3ad8cc'; g.lineWidth = 1;
          g.beginPath(); g.moveTo(x + 0.5, y + 0.5);
          const nodes = [[x, y]];
          for (let s = 0, horiz = hash(p, 3, 501) < 0.5; s < 3 + Math.floor(hash(p, 4, 501) * 4); s++, horiz = !horiz) {
            const len = (8 + Math.floor(hash(p, 10 + s, 501) * 18)) * (hash(p, 20 + s, 501) < 0.5 ? -1 : 1);
            const nx = horiz ? x + len : x, ny = horiz ? y : y + len;
            if (nx < 2 || ny < 2 || nx >= GW - 2 || ny >= GH - 2 || !okT(T[ny * GW + nx])) break;
            x = nx; y = ny; g.lineTo(x + 0.5, y + 0.5); nodes.push([x, y]);
          }
          g.stroke();
          g.globalAlpha = 0.6; g.fillStyle = '#9ffcf2';
          for (const [nx, ny] of nodes) g.fillRect(nx - 1, ny - 1, 3, 3);
          g.globalAlpha = 0.5; g.fillStyle = '#1a6a64';
          for (const [nx, ny] of nodes) g.fillRect(nx, ny, 1, 1);
          g.restore();
        }
      }
    }
    // sol peint à la main par la carte (ex. la piste et les aires du terrain d'entraînement)
    if (map.paintGround) map.paintGround(ground.getContext('2d'), GW, GH);
    const water = WI.length ? { x: wx0, y: wy0, frames: [] } : null;
    if (widen.length) {
      // (parcours en tableaux d'octets : une exploration de la carte par groupe d'objets, il faut qu'elle soit rapide)
      const MW = map.w, MH = map.h, NB = MW * MH, BLK = new Uint8Array(NB), EXTRA = new Uint8Array(NB), SEEN = new Uint8Array(NB), STK = new Int32Array(NB);
      for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) if (World.info(map.rows[y][x]).solid || solid.has(x + ',' + y)) BLK[y * MW + x] = 1;
      const inside = (x, y) => x >= 0 && y >= 0 && x < MW && y < MH;
      const blocked = (x, y) => !inside(x, y) || BLK[y * MW + x] || EXTRA[y * MW + x];
      const goals = [];
      for (const w of [...(map.warps || []), ...(map.doors || [])]) for (let y = w.y; y < w.y + (w.h || 1); y++) for (let x = w.x; x < w.x + (w.w || 1); x++) goals.push([x, y + (map.doors && map.doors.includes(w) ? 1 : 0)]);
      for (const k in map.signs || {}) { const [x, y] = k.split(',').map(Number); goals.push([x, y + 1]); }
      // cases atteignables depuis le premier but libre (SEEN), false si aucun but n'est libre
      const reach = () => {
        const st = goals.find(([x, y]) => !blocked(x, y)); if (!st) return false;
        SEEN.fill(0); let sp = 0; const s0 = st[1] * MW + st[0]; SEEN[s0] = 1; STK[sp++] = s0;
        while (sp) {
          const i = STK[--sp], x = i % MW, y = (i / MW) | 0;
          if (x + 1 < MW && !SEEN[i + 1] && !BLK[i + 1] && !EXTRA[i + 1]) { SEEN[i + 1] = 1; STK[sp++] = i + 1; }
          if (x > 0 && !SEEN[i - 1] && !BLK[i - 1] && !EXTRA[i - 1]) { SEEN[i - 1] = 1; STK[sp++] = i - 1; }
          if (y + 1 < MH && !SEEN[i + MW] && !BLK[i + MW] && !EXTRA[i + MW]) { SEEN[i + MW] = 1; STK[sp++] = i + MW; }
          if (y > 0 && !SEEN[i - MW] && !BLK[i - MW] && !EXTRA[i - MW]) { SEEN[i - MW] = 1; STK[sp++] = i - MW; }
        }
        return true;
      };
      const need = reach() ? goals.filter(([x, y]) => inside(x, y) && SEEN[y * MW + x]) : [];
      // (jamais sur un chemin : un rocher ou un tuyau au bord du sentier ne doit pas le rétrécir)
      const onPath = (x, y) => { const ch = (map.rows[y] || '')[x]; return ch === '=' || ch === 'z'; };
      for (const grp of widen) {
        const cells = [];
        for (const k of grp) { if (solid.has(k)) continue; const [x, y] = k.split(',').map(Number); if (!onPath(x, y)) cells.push([x, y, k]); }
        if (!cells.length) continue;
        for (const [x, y] of cells) if (inside(x, y)) EXTRA[y * MW + x] = 1;
        const ok = reach() && need.every(([x, y]) => SEEN[y * MW + x] || EXTRA[y * MW + x]);
        for (const [x, y] of cells) if (inside(x, y)) EXTRA[y * MW + x] = 0;
        if (ok) for (const [x, y, k] of cells) { solid.add(k); if (inside(x, y)) BLK[y * MW + x] = 1; }
      }
    }
    map.gfx = { ground, water, objs, solid, tall, GW, GH, fps: 5, puddles, prof, flowers };
    lap('sol');
    if (!water) { map.gfx.ms = Math.round(performance.now() - t0); yield 'ready'; }
    else {
      const NW = WI.length, BW = wx1 - wx0 + 1, BH = wy1 - wy0 + 1;
      // parties indépendantes du temps, calculées une seule fois par pixel d'eau
      const V0 = new Float32Array(NW), F26 = new Float32Array(NW), F27 = new Float32Array(NW), OUT = new Int32Array(NW);
      for (let k = 0; k < NW; k++) {
        if ((k & 2047) === 2047) yield;
        const i = WI[k], px = i % GW, py = (i / GW) | 0;
        V0[k] = Math.min(6, ED[i] / (TH && TH.waterDepth || 3.2)) + Art.bayer(px, py) * 0.6;   // waterDepth : eau claire plus loin du bord (lagon)
        F26[k] = px * 0.06 + py * 0.4 + fbm(px * 0.03, py * 0.03, 26) * 6;
        F27[k] = px * 0.07 + py * 0.05 + fbm(px * 0.05, py * 0.05, 27) * 5;
        OUT[k] = ((py - wy0) * BW + (px - wx0)) * 4;
      }
      const NF = 8, frames = water.frames;
      const FOAM = Art.hex(TH && TH.foam ? TH.foam[0] : '#f4feff'), FOAM2 = Art.hex(TH && TH.foam ? TH.foam[1] : '#c4f2f8'), WHITE = Art.hex(TH && TH.foam ? TH.foam[0] : '#ffffff');
      for (let f = 0; f < NF; f++) {
        const id = new ImageData(BW, BH), W8 = id.data;
        const ph = f / NF, a = ph * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
        for (let k = 0; k < NW; k++) {
          if ((k & 2047) === 2047) yield;
          const i = WI[k], px = i % GW, py = (i / GW) | 0, ed = ED[i], en = EN[i];
          let v = V0[k];
          if (ed > 4) {
            const c1 = noise(px * 0.13 + ca * 1.4, py * 0.13 + sa * 1.4, 24), c2 = noise(px * 0.13 - ca * 1.4 + 40, py * 0.13 - sa * 1.4 + 20, 25);
            if (Math.abs(c1 - c2) < 0.035) v -= 2;
            if (ed > 5 && Math.sin(F26[k] + a) > 0.94) v -= 1.6;
          }
          let col = WATER[DW.clamp(Math.round(v), 0, 6)];
          if (en === TER.bridge && ed <= 3) col = Art.mix(col, [10, 30, 60], 0.35);
          if (en !== TER.bridge && en !== 255) {
            const fo = 1.6 + 1.3 * Math.sin(a + F27[k]);
            if (ed <= fo) col = FOAM;
            else if (ed <= fo + 1.4) col = FOAM2;
          }
          if (ed > 3 && hash(px, py, 100 + f) < 0.0012) col = WHITE;
          put(W8, OUT[k], col);
        }
        // nénuphars
        const putL = (X, Y, c2) => { if (X >= wx0 && Y >= wy0 && X <= wx1 && Y <= wy1) put(W8, ((Y - wy0) * BW + (X - wx0)) * 4, c2); };
        for (const [lx, ly] of lilies) {
          for (let k = 0; k < 2; k++) {
            const cx = lx * TS + 4 + Math.floor(hash(lx, ly, 120 + k) * 8), cy = ly * TS + 4 + Math.floor(hash(lx, ly, 130 + k) * 8) + (f % 4 < 2 ? 0 : (k ? 0 : 1));
            const r = 3 + (k ? 0 : 1);
            for (let yy = -r; yy <= r; yy++) for (let xx = -r - 1; xx <= r + 1; xx++) {
              const dd = (xx * xx) / ((r + 1) * (r + 1)) + (yy * yy) / (r * r);
              if (dd > 1) continue;
              if (xx > 0 && Math.abs(yy) <= Math.max(0, xx - 1) * 0.6 && yy >= 0) continue;
              putL(cx + xx, cy + yy, dd > 0.7 ? [30, 90, 40] : (xx + yy < -1 ? [120, 200, 90] : [70, 160, 70]));
            }
            if (hash(lx, ly, 140 + k) < 0.4) [[0, -1], [-1, 0], [1, 0], [0, 0]].forEach(([a2, b2]) => putL(cx - 1 + a2, cy - 1 + b2, b2 === 0 && a2 === 0 ? [255, 230, 120] : [255, 150, 200]));
          }
        }
        const cv = Art.canvas(BW, BH);
        cv.getContext('2d').putImageData(id, 0, 0);
        frames.push(cv);
        if (f === 0) { lap('eau'); map.gfx.ms = Math.round(performance.now() - t0); yield 'ready'; }
      }
    }
  }
  // préparation immédiate (jusqu'à ce que la carte soit affichable)
  // la saison a changé depuis la préparation : on refait la carte
  const stale = map => { if (map.gfx && map.gfx.tk !== undefined && World.themeKey && map.gfx.tk !== World.themeKey(map)) World.unprepare(map); };
  const stamp = map => { if (map.gfx && map.gfx.tk === undefined) map.gfx.tk = World.themeKey ? World.themeKey(map) : null; };
  World.prepare = map => {
    stale(map);
    if (map.gfx) return map.gfx;
    const it = map._prep || (map._prep = prep(map));
    for (;;) { const res = it.next(); if (res.done) { map._prep = null; break; } if (res.value === 'ready') break; }
    stamp(map);
    return map.gfx;
  };
  // avance la préparation pendant au plus ms millisecondes ; true quand tout est prêt (eau comprise)
  World.prepareSome = (map, ms) => {
    if (!map._prep) stale(map);
    if (map.gfx && !map._prep) return true;
    const it = map._prep || (map._prep = prep(map)), t = performance.now();
    while (performance.now() - t < ms) if (it.next().done) { map._prep = null; stamp(map); return true; }
    return false;
  };
  World.unprepare = map => { delete map.gfx; delete map._prep; };

  // ------------------------------------------------------------ herbes hautes (sprites 16x24, 3 positions de vent)
  const TALL = { grass: ['#1c5a22', '#36923a', '#6cca58', 34], dune: ['#6a7228', '#9aac40', '#d4e07a', 18], pastel: ['#3e9a6e', '#72cc96', '#c4f4d8', 30] };
  const tallCache = {};
  World.tall = (kind, v, f) => {
    const key = kind + v + f;
    if (tallCache[key]) return tallCache[key];
    // « grass@automne » : herbes hautes aux couleurs du thème de la zone
    const [base, theme] = kind.split('@');
    const [c0, c1, c2, n] = theme ? [...World.THEMES[theme].tall, TALL[base][3]] : TALL[kind];
    // HERBES HAUTES PEINTES (haute définition) : touffes de brins effilés et courbés, pied sombre et froid,
    // pointe claire et chaude, quelques épis ou fleurs ; f = position dans le vent (0, 1, 2)
    const K = Art.HD || 1, cv = Art.canvas(16 * K, 24 * K), x = cv.getContext('2d');
    x.scale(K, K);
    const C0 = Art.hex(c0), C1 = Art.hex(c1), C2 = Art.hex(c2), rgbS = a => `rgb(${a[0] | 0},${a[1] | 0},${a[2] | 0})`;
    const foot = rgbS(Art.mix(C0, C1, 0.35)), tipc = rgbS(Art.mix(C2, [255, 240, 160], 0.3));
    const wind = (f - 1) * 1.8;
    // 3 touffes, plus serrées au centre ; on peint du fond vers l'avant
    const tufts = [[2.5 + hash(v, 1, 87) * 3.5, 17.5 + hash(v, 1, 89) * 5], [7 + hash(v, 2, 87) * 3, 19 + hash(v, 2, 89) * 5], [11.5 + hash(v, 3, 87) * 3, 17 + hash(v, 3, 89) * 6]];
    const blades = [];
    tufts.forEach(([tx0, ty0], ti) => { const m = Math.round(n / 3); for (let k = 0; k < m; k++) blades.push({ x0: tx0 + (hash(v, ti * 50 + k, 80) - 0.5) * 4, y0: ty0 + hash(v, ti * 50 + k, 81) * 1.2, h: (kind === 'dune' ? 9 : 7) + hash(v, ti * 50 + k, 82) * (kind === 'dune' ? 9 : 8), lean: (hash(v, ti * 50 + k, 83) - 0.5) * 5, w: 0.9 + hash(v, ti * 50 + k, 84) * 0.7 }); });
    blades.sort((a, b) => a.y0 - b.y0);
    // ombre au pied des touffes
    x.fillStyle = 'rgba(8,30,24,0.16)'; for (const [tx0, ty0] of tufts) { x.beginPath(); x.ellipse(tx0, ty0 + 0.4, 2.6, 0.8, 0, 0, 7); x.fill(); }
    for (const b of blades) {
      const ex = b.x0 + b.lean + wind * (b.h / 12), ey = b.y0 - b.h, mx = b.x0 + b.lean * 0.3, my = b.y0 - b.h * 0.55;
      const g = x.createLinearGradient(0, b.y0, 0, ey);
      g.addColorStop(0, foot); g.addColorStop(0.45, rgbS(C1)); g.addColorStop(1, tipc);
      x.fillStyle = g;
      // brin effilé : deux courbes qui se rejoignent à la pointe
      x.beginPath(); x.moveTo(b.x0 - b.w / 2, b.y0); x.quadraticCurveTo(mx - b.w * 0.3, my, ex, ey); x.quadraticCurveTo(mx + b.w * 0.3, my, b.x0 + b.w / 2, b.y0); x.closePath(); x.fill();
    }
    if (kind === 'grass') for (let k = 0; k < 2; k++) if (hash(v, k, 85) < 0.45) {   // épis et petites fleurs au bout de quelques brins
      const b = blades[Math.floor(hash(v, k, 86) * blades.length)], ex = b.x0 + b.lean + wind * (b.h / 12), ey = b.y0 - b.h;
      x.fillStyle = hash(v, k, 88) < 0.5 ? '#fff4c8' : '#ffffff'; x.beginPath(); x.ellipse(ex, ey, 0.9, 1.3, 0, 0, 7); x.fill();
    }
    if (kind === 'pastel') for (let k = 0; k < 3; k++) { const b = blades[Math.floor(hash(v, k, 84) * blades.length)]; x.fillStyle = '#ffb0d0'; x.beginPath(); x.arc(b.x0 + b.lean + wind * (b.h / 12), b.y0 - b.h, 0.9, 0, 7); x.fill(); }
    cv._k = K;
    return (tallCache[key] = cv);
  };

  World.tallKind = (map, kind) => { const k = World.themeKey ? World.themeKey(map) : map.theme; return kind === 'grass' && k && World.THEMES[k] && World.THEMES[k].tall ? kind + '@' + k : kind; };
  World.PAL = PAL;
})();
