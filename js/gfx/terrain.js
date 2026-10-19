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
    if (World.fixBridges) World.fixBridges(map);   // ponts utiles redressés, ponts inutiles enlevés (gfx/ponts.js)
    if (!map.rows && map.build) map.build();
    const t0 = performance.now(), prof = {};
    let tp = t0; const lap = k => { const n = performance.now(); prof[k] = Math.round(n - tp); tp = n; };
    const GW = map.w * TS, GH = map.h * TS, N = GW * GH;
    const tt = map.rows.map(r => [...r].map(ch => TER[World.info(ch).t]));
    // sols spéciaux de la terre (rocaille, cendres) : une valeur par case, 0 = terre ordinaire
    let SOLK = null; for (let ty = 0; ty < map.h; ty++) for (let tx = 0; tx < map.w; tx++) { const I = World.CH[map.rows[ty][tx]]; if (I && I.sol) { if (!SOLK) SOLK = new Uint8Array(map.w * map.h); SOLK[ty * map.w + tx] = I.sol; } }
    // TEXTURES DESSINÉES (gfx/textures.js) : sol, dessus des terrasses, falaises, escaliers, lave (null = dessin par code)
    const TX = DW.Textures && (map.textures || DW.Textures.themeDe(map)) ? DW.Textures : null, txp = n => (TX && map.textures ? TX.pixels(map.textures + '/' + n) : null);
    const TX_CENDRES = txp('sol_cendres'), TX_DESSUS = txp('dessus_falaise'), TX_FALAISE = txp('falaise_basalte'), TX_ESC = txp('escalier');
    const TX_LAVE = ['lave', 'lave_2', 'lave_3', 'lave_4'].map(n => txp(n)).filter(Boolean);
    const sol = r => (TX ? TX.sol(map, r) : null);
    const TX_HERBE = sol('herbe'), TX_HSECHE = sol('herbe_seche'), TX_SABLE = sol('sable'), TX_CHEMIN = sol('chemin'), TX_MER = sol('eau_mer'), TX_DOUCE = sol('eau_douce'), TX_PAVES = sol('paves');
    // herbe dessinée (l'herbe sèche sur les cases « j ») ; l'ombre des arbres et des falaises reste par-dessus
    // (la couleur est écrite dans HC, réutilisé : à lire aussitôt ; mêmes calculs que TX.lit et Art.mix)
    const texO = (P, x, y) => { const X = ((Math.floor(x) % P.w) + P.w) % P.w, Y = ((Math.floor(y) % P.h) + P.h) % P.h; return (Y * P.w + X) * 4; };
    const HC = [0, 0, 0, 255];
    // SOLS SELON L'ALTITUDE (map.solsNiveau, ex. le volcan : herbe de montagne puis terre sèche en montant ; rocaille en
    // gravier puis en roche craquelée) : une image commune par niveau de relief, null = celle de la carte
    // (un niveau : un nom, ou [sol, sol des taches] ; « volcan:nom » = image du dossier du volcan, sinon dossier commun)
    const pix = n => (n ? TX.pixels(n.includes(':') ? n.replace(':', '/') : 'commun/' + n) : null);
    const parNiveau = L => (TX && L ? L.map(n => (!n ? null : Array.isArray(n) ? [pix(n[0]), pix(n[1])] : [pix(n), null])) : null);
    const SN = map.solsNiveau, HERBE_NIV = parNiveau(SN && SN.herbe), ROC_NIV = parNiveau(SN && SN.rocaille), CENDRES_TACHES = SN && SN.cendres && TX ? pix(SN.cendres) : null;
    // SOL NATUREL (sols d'altitude) : le motif est légèrement déformé (la répétition des carreaux ne se voit plus), un
    // second sol vient en grandes taches irrégulières, et la lumière varie doucement par endroits ; écrit dans NAT
    const NAT = [0, 0, 0];
    const solNaturel = (Pa, Pb, px, py) => {
      const ox = (DXS(px, py) - 0.5) * 14, oy = (DYS(px, py) - 0.5) * 14, q = texO(Pa, px + ox, py + oy), d = Pa.d;   // (déformation lente et douce : pas d'étirement)
      let r = d[q], g = d[q + 1], b = d[q + 2];
      if (Pb) {
        let w = (S8(px, py) - 0.42) / 0.16; w = w < 0 ? 0 : w > 1 ? 1 : w; w = w * w * (3 - 2 * w) * 0.9;
        if (w > 0) { const q2 = texO(Pb, px - oy * 0.7 + 57, py + ox * 0.7 + 31), d2 = Pb.d; r += (d2[q2] - r) * w; g += (d2[q2 + 1] - g) * w; b += (d2[q2 + 2] - b) * w; }
      }
      const k = 0.86 + G5(px, py) * 0.26;
      NAT[0] = r * k; NAT[1] = g * k; NAT[2] = b * k; return NAT;
    };
    const herbeTx = (tx, ty, px, py, sh, en, ed) => {
      let P = map.rows[ty][tx] === 'j' && TX_HSECHE ? TX_HSECHE : TX_HERBE || TX_HSECHE, r, g, b;
      const Q = HERBE_NIV && HERBE_NIV[ALTP ? ALTP[py * GW + px] : altCase(tx, ty)];
      if (Q) { solNaturel(Q[0], Q[1], px, py); r = NAT[0]; g = NAT[1]; b = NAT[2]; }
      else { const q = texO(P, px, py), d = P.d; r = d[q]; g = d[q + 1]; b = d[q + 2]; }
      if (TX_CHEMIN && en === TER.dirt && ed <= 2 && hash(px >> 1, py >> 1, 96) < (3 - ed) * 0.3) { const q2 = texO(TX_CHEMIN, px, py), d2 = TX_CHEMIN.d; r = r + (d2[q2] - r) * 0.55; g = g + (d2[q2 + 1] - g) * 0.55; b = b + (d2[q2 + 2] - b) * 0.55; }   // (bord de chemin)
      const k = Math.min(0.45, sh * 0.04); if (k > 0) { r = r + (24 - r) * k; g = g + (50 - g) * k; b = b + (60 - b) * k; }
      HC[0] = r; HC[1] = g; HC[2] = b; return HC;
    };
    const altCase = (x, y) => { const a = map.alt ? map.alt[DW.clamp(y, 0, map.h - 1) * map.w + DW.clamp(x, 0, map.w - 1)] : 0; return a === 255 ? 9 : a; };
    // lave refroidie : sur une falaise basse (loin du cratère), les fissures de lave de l'image deviennent sombres
    const refroidie = (c, k) => { if (k <= 0) return c; const chaud = Math.max(0, Math.min(1, (c[0] - c[2] - 70) / 120)) * (c[0] > 150 ? 1 : 0.5); if (chaud <= 0) return c; const f = chaud * k, g = (c[0] + c[1] + c[2]) / 3 * 0.45; return [c[0] + (g + 18 - c[0]) * f, c[1] + (g + 8 - c[1]) * f, c[2] + (g - c[2]) * f, c[3]]; };
    const solVar = (c, k, px, py) => {
      if (k === 1 && ROC_NIV) { const Q = ROC_NIV[ALTP ? ALTP[py * GW + px] : altCase(px >> 4, py >> 4)]; if (Q && Q[0]) return solNaturel(Q[0], Q[1], px, py).slice(); }
      if (k === 2 && TX_CENDRES) return SN ? solNaturel(TX_CENDRES, CENDRES_TACHES, px, py).slice() : TX.lit(TX_CENDRES, px, py);
      if (k === 1 && TX_DESSUS) return TX.lit(TX_DESSUS, px, py);
      if (k === 1) {   // rocaille : terre grisée, taches de gravier plus sombres et plus claires
        let o = Art.mix(c, [140, 130, 114], 0.5); const h1 = hash(px >> 1, py >> 1, 601);
        if (h1 < 0.16) o = Art.mix(o, [92, 84, 74], 0.55); else if (h1 > 0.93) o = Art.mix(o, [204, 194, 176], 0.5);
        return o;
      }
      let o = Art.mix(c, [62, 56, 56], 0.72); const h2 = hash(px, py, 603);   // cendres : gris très sombre, grain clair, rares braises
      if (h2 < 0.05) o = Art.mix(o, [118, 108, 104], 0.6); else if (h2 > 0.9975) o = [236, 118, 44];
      if (noise(px * 0.05, py * 0.05, 604) > 0.72) o = Art.mix(o, [96, 40, 30], 0.25);   // reflets rougeâtres de la chaleur
      return o;
    };
    const tAt = (x, y) => tt[DW.clamp(y, 0, map.h - 1)][DW.clamp(x, 0, map.w - 1)];
    // (ponts : pontons de bois au bord de la mer, ponts de pierre partout ailleurs)
    const DOCK = map.region === 'plage' || map.dock;   // (seules les zones de plage gardent leurs pontons de bois)
    const HW = (GW >> 1) + 1;
    const half = fn => { const A = new Float32Array(HW * ((GH >> 1) + 1)).fill(NaN); return (px, py) => { const k = (py >> 1) * HW + (px >> 1); let v = A[k]; if (v !== v) v = A[k] = fn(px & ~1, py & ~1); return v; }; };
    const WX = half((x, y) => noise(x * 0.07, y * 0.07, 1)), WY = half((x, y) => noise(x * 0.07, y * 0.07, 2));
    const WLX = half((x, y) => noise(x * 0.022, y * 0.022, 3)), WLY = half((x, y) => noise(x * 0.022, y * 0.022, 4));
    const G5 = half((x, y) => fbm(x * 0.035, y * 0.035, 5)), D7 = half((x, y) => fbm(x * 0.06, y * 0.06, 7));
    const S8 = half((x, y) => fbm(x * 0.04, y * 0.04, 8)), S9 = half((x, y) => fbm(x * 0.05, y * 0.05, 9));
    const DXS = half((x, y) => noise(x * 0.007, y * 0.007, 41)), DYS = half((x, y) => noise(x * 0.007, y * 0.007, 42));   // (sols d'altitude : déformation du motif)
    const TUFT = half((x, y) => noise(x * 0.18, y * 0.18, 313)), MID6 = half((x, y) => noise(x * 0.09, y * 0.09, 6));   // (herbe peinte : nappes et touffes)
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
      let v = 2.75 + (G5(px, py) - 0.5) * 3.2 + (MID6(px, py) - 0.5) * 1.3;
      // brins : petits traits verticaux de 3 pixels (clair à la pointe, sombre au pied), peu contrastés
      const off = COFF[px], k = Math.floor((py + off) / 3), pos = (py + off) - k * 3;
      v += (hash(px, k, 311) - 0.5) * 0.7 + (pos === 0 ? 0.22 : pos === 2 ? -0.2 : 0);
      const tip = hash(px, py, 312); if (tip < 0.015) v += 0.8; else if (tip > 0.99) v -= 0.6;
      if (TUFT(px, py) > 0.72) v -= 0.5;            // touffes plus sombres
      v -= SH[i] * 0.2; if (tallAt(tx, ty)) v -= 1;
      return v;
    };
    const lushDirtV = (px, py, i) => {
      let v = 3.1 + (D7(px, py) - 0.5) * 2 + (noise(px * 0.2, py * 0.2, 95) - 0.5) * 0.6 + Math.min(ED[i], 10) * 0.04;   // (le milieu du chemin, tassé, est plus clair)
      const p = hash(px, py, 96); if (p < 0.012) v -= 0.9; else if (p > 0.99) v += 0.7;   // petits cailloux
      return v - SH[i] * 0.18;
    };
    const CANOPY = TH ? TH.canopy.map(Art.hex) : PAL.canopy;
    const FORET_ARBRES = !!(TX && DW.Textures.aArbre('tree', 0) && !(TH && TH.canopyStyle === 'rock'));   // forêts en vrais arbres (images du joueur)
    const FLEURS_POSEES = [];   // fleurs et champignons du sol dessinés avec les images du joueur (petits objets plats)
    const LITTER = TH ? TH.litter : ['#c86a2a', '#e09a3a', '#8a5a2a', '#a8a040', '#7a9a38'];
    // biomes : le thème peut remplacer les couleurs de la terre, du sable, de l'eau (lave, marais, glace) et des falaises
    const DIRT = map.dirt ? map.dirt.map(Art.hex) : TH && TH.dirt ? TH.dirt.map(Art.hex) : PAL.dirt, SAND = TH && TH.sand ? TH.sand.map(Art.hex) : PAL.sand;
    const WET = TH && TH.wet ? TH.wet.map(Art.hex) : PAL.wet, WATER = TH && TH.water ? TH.water.map(Art.hex) : PAL.water;
    const CLIFF = TH && TH.cliff ? TH.cliff.map(Art.hex) : PAL.cliff, ROCKY = TH && TH.canopyStyle === 'rock';
    // intérieurs : style du sol (map.floor) et des murs (map.wall) ; sans style = parquet et enduit d'origine
    const FLOOR = map.floor ? { ...map.floor, c: (map.floor.cols || []).map(Art.hex) } : null;
    const WALL = map.wall ? { ...map.wall, base: Art.hex(map.wall.base || '#ead8b4'), alt: Art.hex(map.wall.alt || map.wall.base || '#ead8b4'), wood: map.wall.wood ? Art.hex(map.wall.wood) : null } : null;
    // PAROIS ROCHEUSES (TER.rock) : strates ocre, fissures, rebord herbeux en haut, pied sombre ; hauteur de la paroi
    const ROCK = (map.falaise && World.FALAISES[map.falaise] ? World.FALAISES[map.falaise] : TH && TH.rock ? TH.rock : ['#3a2a20', '#4e3828', '#664a32', '#7e5e3e', '#98744c', '#b28c5e', '#cca674', '#e2c28e']).map(Art.hex);
    const RUN = new Int8Array(map.w * map.h * 2).fill(-1);   // (mémorisé par case : demandé pour chaque pixel des parois)
    const rockRun = (tx, ty, dy) => {
      const c = (ty * map.w + tx) * 2 + (dy > 0 ? 1 : 0); if (tx >= 0 && tx < map.w && ty >= 0 && ty < map.h && RUN[c] >= 0) return RUN[c];
      let n = 0; for (let y = ty + dy; n < 12 && tAt(tx, y) === TER.rock && y >= 0 && y < map.h; y += dy) n++;
      if (tx >= 0 && tx < map.w && ty >= 0 && ty < map.h) RUN[c] = n; return n;
    };
    const HARD = new Set([TER.rock, TER.cliff, TER.bridge, TER.stairs, TER.stone, TER.cobble, TER.wood, TER.wall, TER.void, TER.metal]);
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
    // (les grosses boucles au pixel sont de petites fonctions à part, appelées par bandes de lignes : le moteur JavaScript
    //  les optimise à fond, ce qu'il refuse de faire pour la grande fonction prep entière)
    const voteRows = (ya, yb) => { for (let py = ya; py < yb; py++) for (let px = 0; px < GW; px++) {
      const base = TT[(py >> 4) * MW + (px >> 4)];
      if (isHard[base] || uni[(py >> 4) * MW + (px >> 4)]) { T[py * GW + px] = base; continue; }
      // frontières organiques : petite ondulation + grande vague (les chemins ne sont plus des octogones)
      const wx = px + 0.5 + (WX(px, py) - 0.5) * 10 + (LUSH ? (WLX(px, py) - 0.5) * 14 : 0), wy = py + 0.5 + (WY(px, py) - 0.5) * 10 + (LUSH ? (WLY(px, py) - 0.5) * 14 : 0);
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
    } };
    for (let py = 0; py < GH; py += 4) { voteRows(py, Math.min(GH, py + 4)); yield; }
    // FALAISES ARRONDIES : le contour des parois (roche) suit une courbe lisse au lieu des marches des cases. Le masque des
    // cases de roche est lissé (B-spline sur 4 × 4 cases, légère ondulation) puis coupé à mi-hauteur : les angles des
    // marches deviennent des courbes, une diagonale en escalier devient une pente régulière ; un bord droit reste à sa
    // place. Le cœur d'une case de roche reste de la roche (une paroi ne disparaît jamais) ; rien ne bouge près des
    // escaliers et des ponts ; les déplacements, eux, suivent toujours les cases.
    if (!map.indoor) {
      const RK = TER.rock, R1 = new Uint8Array(MW * MH), BORD = new Uint8Array(MW * MH);
      // (un escalier taillé dans la paroi compte comme de la paroi : le contour lissé passe derrière lui sans coupure)
      for (let k = 0; k < MW * MH; k++) R1[k] = TT[k] === RK || TT[k] === TER.stairs ? 1 : 0;
      for (let ty = 0; ty < MH; ty++) for (let tx = 0; tx < MW; tx++) {
        let r = 0, n = 0, bad = false;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const t = tF(tx + dx, ty + dy); if (t === RK || t === TER.stairs) r++; else n++; if (t === TER.bridge) bad = true; }
        if (r && n && !bad && TT[ty * MW + tx] !== TER.stairs) BORD[ty * MW + tx] = 1;
      }
      const mk = (x, y) => R1[(y < 0 ? 0 : y >= MH ? MH - 1 : y) * MW + (x < 0 ? 0 : x >= MW ? MW - 1 : x)];
      // (terrain qui remplace un coin de roche rogné : la case voisine du bord le plus proche)
      const voisin = (tx, ty, lx, ly) => {
        const sx = lx < 8 ? -1 : 1, sy = ly < 8 ? -1 : 1, dH = lx < 8 ? lx : 15 - lx, dV = ly < 8 ? ly : 15 - ly;
        const h = tF(tx + sx, ty), v = tF(tx, ty + sy), d = tF(tx + sx, ty + sy);
        if (v !== RK && (dV <= dH || h === RK)) return v;
        if (h !== RK) return h;
        return d !== RK ? d : -1;
      };
      const arrondirRows = (ya, yb) => { for (let py = ya; py < yb; py++) { const ty = py >> 4; for (let px = 0; px < GW; px++) {
        const tx = px >> 4; if (!BORD[ty * MW + tx]) continue;
        const u = (px + 0.5 + (WX(px, py) - 0.5) * 5) / TS - 0.5, v = (py + 0.5 + (WY(px, py) - 0.5) * 5) / TS - 0.5;
        const i0 = Math.floor(u), j0 = Math.floor(v), fu = u - i0, fv = v - j0;
        // poids de la B-spline cubique (4 cases de chaque côté)
        const u2 = fu * fu, u3 = u2 * fu, v2 = fv * fv, v3 = v2 * fv;
        const a0 = (1 - fu) * (1 - fu) * (1 - fu) / 6, a1 = (3 * u3 - 6 * u2 + 4) / 6, a2 = (-3 * u3 + 3 * u2 + 3 * fu + 1) / 6, a3 = u3 / 6;
        const b0 = (1 - fv) * (1 - fv) * (1 - fv) / 6, b1 = (3 * v3 - 6 * v2 + 4) / 6, b2 = (-3 * v3 + 3 * v2 + 3 * fv + 1) / 6, b3 = v3 / 6;
        let sm = 0;
        for (let j = 0; j < 4; j++) {
          const y = j0 - 1 + j, r = a0 * mk(i0 - 1, y) + a1 * mk(i0, y) + a2 * mk(i0 + 1, y) + a3 * mk(i0 + 2, y);
          sm += (j === 0 ? b0 : j === 1 ? b1 : j === 2 ? b2 : b3) * r;
        }
        const i = py * GW + px, base = TT[ty * MW + tx], lx = px & 15, ly = py & 15;
        if (base === RK) {
          if (sm < 0.5 && Math.min(lx, 15 - lx, ly, 15 - ly) < 6) { const nt = voisin(tx, ty, lx, ly); if (nt >= 0 && !isHard[nt]) T[i] = nt; }
        } else if (sm > 0.5 && !isHard[base]) T[i] = RK;
      } } };
      for (let py = 0; py < GH; py += 8) { arrondirRows(py, Math.min(GH, py + 8)); yield; }
    }
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
    const bordRows = (ya, yb) => { for (let py = ya; py < yb; py++) for (let px = 0; px < GW; px++) {
      const i = py * GW + px, t = T[i];
      let n = -1;
      if (px > 0 && T[i - 1] !== t) n = i - 1;
      else if (px < GW - 1 && T[i + 1] !== t) n = i + 1;
      else if (py > 0 && T[i - GW] !== t) n = i - GW;
      else if (py < GH - 1 && T[i + GW] !== t) n = i + GW;
      if (n >= 0) { ED[i] = 1; EN[i] = T[n]; Q[qt++] = i; }
    } };
    for (let py = 0; py < GH; py += 32) { bordRows(py, Math.min(GH, py + 32)); yield; }
    // (la file avance par paquets de 32768)
    const bfsRun = () => {
      let h = qh, q = qt; const lim = h + 32768;
      while (h < q && h < lim) {
        const i = Q[h++], d = ED[i];
        if (d >= 40) continue;
        const px = i % GW, t = T[i], e = EN[i], d1 = d + 1;
        let n;
        if (px > 0 && !ED[n = i - 1] && T[n] === t) { ED[n] = d1; EN[n] = e; Q[q++] = n; }
        if (px < GW - 1 && !ED[n = i + 1] && T[n] === t) { ED[n] = d1; EN[n] = e; Q[q++] = n; }
        if (i >= GW && !ED[n = i - GW] && T[n] === t) { ED[n] = d1; EN[n] = e; Q[q++] = n; }
        if (i < N - GW && !ED[n = i + GW] && T[n] === t) { ED[n] = d1; EN[n] = e; Q[q++] = n; }
      }
      qh = h; qt = q;
    };
    while (qh < qt) { bfsRun(); yield; }
    const loin = () => { for (let i = 0; i < N; i++) if (!ED[i]) ED[i] = 60; };
    loin();
    lap('bfs');
    // ombre portée sous la canopée et les falaises
    // ALTITUDE AU PIXEL (contours arrondis des plateaux : maps/relief.js) et PAROIS AU PIXEL : pour chaque pixel de roche,
    // sa distance au haut (RU) et au bas (RD) de la paroi, sur la silhouette arrondie (le liseré du haut et le pied
    // suivent la courbe, plus les marches des cases)
    const ALTP = map.alt && DW.Relief && DW.Relief.altPixels ? DW.Relief.altPixels(map) : null;
    yield;
    const RU = new Uint16Array(N), RD = new Uint16Array(N), RK = TER.rock;
    const paroiCols = (xa, xb) => { for (let px = xa; px < xb; px++) {
      let k = 0; for (let py = 0, i = px; py < GH; py++, i += GW) { if (T[i] === RK) RU[i] = k++; else k = 0; }
      k = 0; for (let py = GH - 1, i = py * GW + px; py >= 0; py--, i -= GW) { if (T[i] === RK) RD[i] = k++; else k = 0; }
    } };
    for (let px = 0; px < GW; px += 128) { paroiCols(px, Math.min(GW, px + 128)); yield; }
    // SOLS SPÉCIAUX AUX CONTOURS NATURELS (rocaille, cendres, terre ordinaire) : la limite ondule (vote entre les cases
    // voisines, comme entre deux terrains) au lieu de suivre les cases
    let SOLKP = null;
    if (SOLK) {
      SOLKP = new Uint8Array(N);
      const sk = (x, y) => SOLK[(y < 0 ? 0 : y >= MH ? MH - 1 : y) * MW + (x < 0 ? 0 : x >= MW ? MW - 1 : x)];
      const UNIS = new Uint8Array(MW * MH);
      for (let ty = 0; ty < MH; ty++) for (let tx = 0; tx < MW; tx++) { const k = sk(tx, ty); let u = 1; for (let dy = -1; dy <= 1 && u; dy++) for (let dx = -1; dx <= 1; dx++) if (sk(tx + dx, ty + dy) !== k) { u = 0; break; } UNIS[ty * MW + tx] = u; }
      const ws = new Float32Array(16);
      const solkRows = (ya, yb) => { for (let py = ya; py < yb; py++) for (let px = 0; px < GW; px++) {
        const tx = px >> 4, ty = py >> 4, k0 = SOLK[ty * MW + tx], i = py * GW + px;
        if (UNIS[ty * MW + tx]) { SOLKP[i] = k0; continue; }
        const wx = px + 0.5 + (WX(px, py) - 0.5) * 12 + (WLX(px, py) - 0.5) * 16, wy = py + 0.5 + (WY(px, py) - 0.5) * 12 + (WLY(px, py) - 0.5) * 16;
        const u = wx / TS - 0.5, v = wy / TS - 0.5, i0 = Math.floor(u), j0 = Math.floor(v), fu = u - i0, fv = v - j0;
        ws.fill(0);
        ws[sk(i0, j0)] += (1 - fu) * (1 - fv); ws[sk(i0 + 1, j0)] += fu * (1 - fv); ws[sk(i0, j0 + 1)] += (1 - fu) * fv; ws[sk(i0 + 1, j0 + 1)] += fu * fv; ws[k0] += 0.001;
        let best = k0, bw = -1; for (let k = 0; k < 16; k++) if (ws[k] > bw) { bw = ws[k]; best = k; }
        SOLKP[i] = best;
      } };
      for (let py = 0; py < GH; py += 8) { solkRows(py, Math.min(GH, py + 8)); yield; }
    }
    const SH = new Uint8Array(N);
    const ombreCols = (xa, xb) => { for (let px = xa; px < xb; px++) {
      let run = 99;
      for (let py = 0; py < GH; py++) {
        const i = py * GW + px, t = T[i];
        const tx = px >> 4, ty = py >> 4;
        const caster = t === TER.canopy || t === TER.pastel || t === TER.rock || (t === TER.cliff && tAt(tx, ty + 1) !== TER.cliff) || (t === TER.wall && tAt(tx, ty + 1) !== TER.wall);
        if (caster) run = 0; else run++;
        if (!caster && run <= 10 && t !== TER.water) SH[i] = 11 - run;
      }
    } };
    for (let px = 0; px < GW; px += 64) { ombreCols(px, Math.min(GW, px + 64)); yield; }
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
    // relief de la voûte de feuillage (deux tailles de grappes, Worley), calculé une fois par bloc de 2×2 pixels
    // (moitié de résolution lissée : 4 fois moins de calculs, sans effet de mosaïque) ; précalculé d'un coup (canvPrep)
    // aux points de la demi-grille des cases où il y a du feuillage, puis lu en interpolant (canv)
    const worleyV = (px, py) => {
      const cx = Math.floor(px / 13), cy = Math.floor(py / 13);
      let d1 = 99, d2 = 99, ox = 0, oy = 0;
      for (let yy = -1; yy <= 1; yy++) for (let xx = -1; xx <= 1; xx++) {
        const k = cell13(cx + xx, cy + yy), ex = px - CF13[k], ey = py - CF13[k + 1], dd = Math.sqrt(ex * ex + ey * ey);
        if (dd < d1) { d2 = d1; d1 = dd; ox = ex; oy = ey; } else if (dd < d2) d2 = dd;
      }
      const sx = Math.floor(px / 7), sy = Math.floor(py / 7);
      let s1 = 99, s2 = 99, sox = 0, soy = 0;
      for (let yy = -1; yy <= 1; yy++) for (let xx = -1; xx <= 1; xx++) {
        const k = cell7(sx + xx, sy + yy), ex = px - CF[k], ey = py - CF[k + 1], dd = Math.sqrt(ex * ex + ey * ey);
        if (dd < s1) { s2 = s1; s1 = dd; sox = ex; soy = ey; } else if (dd < s2) s2 = dd;
      }
      let v = 3.6 - d1 * 0.11 - (ox + oy) * 0.05 - s1 * 0.16 - (sox + soy) * 0.07;
      if (d2 - d1 < 1.4) v -= 0.6 * (1 - (d2 - d1) / 1.4);   // creux entre les grandes grappes
      if (s2 - s1 < 0.9) v -= 0.35;                           // et entre les petites
      return v;
    };
    const CVA = new Float32Array(HW * ((GH >> 1) + 1));
    const canvPrep = (ya, yb) => {
      for (let ty = ya; ty < yb; ty++) for (let tx = 0; tx < MW; tx++) {
        let feuille = false;
        for (let y = ty * TS; y < ty * TS + TS && !feuille; y++) for (let x = tx * TS, i = y * GW + x; x < tx * TS + TS; x++, i++) if (T[i] === TER.canopy) { feuille = true; break; }
        if (!feuille) continue;
        for (let y = ty * TS; y <= ty * TS + TS && y <= GH; y += 2) for (let x = tx * TS; x <= tx * TS + TS && x <= GW; x += 2) CVA[(y >> 1) * HW + (x >> 1)] = worleyV(x, y);
      }
    };
    const canv = (px, py) => {
      const k = (py >> 1) * HW + (px >> 1), fx = (px & 1) / 2, fy = (py & 1) / 2, a = CVA[k], b = CVA[k + 1], c = CVA[k + HW], d = CVA[k + HW + 1];
      return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
    };
    const EDGE = {}; for (const v of map.voisines || []) EDGE[v.side] = true;   // côtés qui touchent une autre carte (maps/monde.js)
    // ESCALIER DESSINÉ (image « escalier ») : posé contre la falaise sur TOUTE sa hauteur, du bord du plateau jusqu'au
    // pied (la bande de paroi des colonnes voisines), sans trou autour ; le haut transparent de l'image = le plateau
    let ESCV = null;
    const escalierVu = (tx, ty) => {
      if (!ESCV) {
        ESCV = new Array(map.w * map.h).fill(null); const vu = new Set(), Wm = map.w;
        for (let y = 0; y < map.h; y++) for (let x = 0; x < Wm; x++) {
          if (tAt(x, y) !== TER.stairs || vu.has(y * Wm + x)) continue;
          let x0 = x, x1 = x, y0 = y, y1 = y; const q = [[x, y]]; vu.add(y * Wm + x);
          while (q.length) { const [a, c] = q.pop(); x0 = Math.min(x0, a); x1 = Math.max(x1, a); y0 = Math.min(y0, c); y1 = Math.max(y1, c);
            for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = a + dx, ny = c + dy; if (nx < 0 || ny < 0 || nx >= Wm || ny >= map.h || vu.has(ny * Wm + nx) || tAt(nx, ny) !== TER.stairs) continue; vu.add(ny * Wm + nx); q.push([nx, ny]); } }
          let top = y0, bot = y1, mur = 999;
          for (const cx of [x0 - 1, x1 + 1]) for (let yy = y0; yy <= y1 + 1; yy++) if (tAt(cx, yy) === TER.rock) {
            let a = yy; while (a > 0 && tAt(cx, a - 1) === TER.rock) a--; let c = yy; while (c < map.h - 1 && tAt(cx, c + 1) === TER.rock) c++;
            top = Math.min(top, a); bot = Math.max(bot, c); mur = Math.min(mur, a); break;
          }
          if (mur === 999) mur = top;
          const ch = map.rows[Math.max(0, Math.min(top, mur) - 1)][Math.min(Wm - 1, x0 + 1)], I = World.CH[ch], Lh = altCase(x0 + 1, mur - 1);
          const R = { x0, x1, y0: top, y1: bot, mur, fond: (I && I.sol === 2 ? TX_CENDRES : TX_DESSUS) || TX_CENDRES || TX_DESSUS, froid: Lh <= 2 ? 1 : Lh <= 3 ? 0.6 : 0 };
          for (let yy = top; yy <= bot; yy++) for (let xx = x0; xx <= x1; xx++) ESCV[yy * Wm + xx] = R;
        }
      }
      return ESCV[ty * map.w + tx] || null;
    };
    // L'escalier est POSÉ DEVANT la falaise : derrière lui, le plateau au-dessus du bord et la paroi en dessous (un peu
    // dans l'ombre) ; ses marches gardent leur proportion (environ 8 px) : une falaise plus haute = plus de marches, jamais
    // des marches étirées (la 1re et la dernière marche de l'image restent aux extrémités, celles du milieu se répètent) ;
    // les chapeaux des piliers dépassent un peu au-dessus du bord ; ombre au pied ; lave refroidie en bas de la montagne
    const ESC_S0 = 18.5, ESC_FIN = 58, ESC_P = (ESC_FIN - ESC_S0) / 5;   // (image « escalier » : 5 marches de 18,5 à 58 px sur 64)
    const peindreEsc = (R, tx, ty, lx, ly, px, py) => {
      const EH = TX_ESC.h, k = EH / 64, xs = (tx - R.x0) * 16 + lx, Y = ty * 16 + ly;
      const haut = R.mur * 16 - 5, bas = (R.y1 + 1) * 16, L = bas - haut, n = Math.max(2, Math.round(L / 8.5)), pas = L / n;
      let yi;
      if (Y < haut) yi = ESC_S0 - (haut - Y);
      else if (Y >= bas) yi = ESC_FIN + (Y - bas);
      else { const u = (Y - haut) / pas, kk = Math.min(n - 1, Math.floor(u)), j = kk === 0 ? 0 : kk === n - 1 ? 4 : 1 + (kk - 1) % 3; yi = ESC_S0 + (j + (u - kk)) * ESC_P; }
      let col;
      if (Y < R.mur * 16 || !TX_FALAISE) col = R.fond ? TX.lit(R.fond, px, py) : [60, 50, 46];
      else { const wy = Y - R.mur * 16, Hw = (R.y1 + 1 - R.mur) * 16, FH = TX_FALAISE.h, yt = Hw === FH ? wy : wy < 16 ? wy : wy >= Hw - 16 ? FH - (Hw - wy) : 16 + ((wy - 16) % (FH - 32)); col = Art.mix(TX.lit(TX_FALAISE, px, yt), [0, 0, 0], 0.3); }
      if (yi >= 0 && yi < 64) { const e = TX.lit(TX_ESC, xs / ((R.x1 - R.x0 + 1) * 16) * TX_ESC.w, yi * k); if (e[3] > 40) col = e[3] > 230 ? e : Art.mix(col, e, e[3] / 255); }
      if (R.froid) col = refroidie(col, R.froid);
      if (Y >= bas - 3) col = Art.mix(col, [0, 0, 0], 0.1 * (Y - bas + 4));   // ombre au pied
      return col;
    };
    const ESCA = TX_ESC ? (escalierVu(0, 0), ESCV) : null;   // (escaliers dessinés, par case)
    const putD = (j, c) => { D[j] = c[0]; D[j + 1] = c[1]; D[j + 2] = c[2]; D[j + 3] = 255; };
    const couleurRows = (ya, yb) => { for (let py = ya; py < yb; py++) for (let px = 0; px < GW; px++) {
      const i = py * GW + px, j = i * 4, t = T[i], ed = ED[i], en = EN[i];
      const tx = px >> 4, ty = py >> 4, lx = px & 15, ly = py & 15;
      const b = Art.bayer(px, py);
      let col;
      if (ESCA) { const RE = ESCA[ty * MW + tx]; if (RE) { putD(j, peindreEsc(RE, tx, ty, lx, ly, px, py)); continue; } }
      // SOLS DESSINÉS (images du joueur) : chemin direct, sans calculer d'abord l'ancien dessin qu'on jetterait ensuite
      // (les bords mouillés du sable et les bords de pelouse gardent le chemin normal, plus bas)
      if (TX) {
        let tc = null;
        if (t === TER.grass && (TX_HERBE || TX_HSECHE)) tc = herbeTx(tx, ty, px, py, SH[i], en, ed);
        else if (t === TER.lawn && TX_HERBE && !(LUSH && en !== TER.lawn && en !== 255 && en !== TER.pastel && ed <= 2)) tc = herbeTx(tx, ty, px, py, SH[i], en, ed);
        else if (t === TER.sand && TX_SABLE && !(en === TER.water && ed <= 9)) tc = TX.lit(TX_SABLE, px, py);
        else if (t === TER.dirt && TX_CHEMIN && !(SOLKP && SOLKP[i]) && altCase(tx, ty) < 3) {
          tc = TX.lit(TX_CHEMIN, px, py);
          if (TX_HERBE && en === TER.grass && ed <= 3 && hash(px >> 1, py >> 1, 95) < (4 - ed) * 0.24) tc = Art.mix(tc, TX.lit(TX_HERBE, px, py), 0.8);
          if (ed <= 4 && en === TER.grass) tc = Art.mix(tc, [30, 24, 14], 0.06 * (5 - ed));
        }
        if (tc) {
          if (LUSH) { const de = Math.min(EDGE.left ? 999 : px, EDGE.up ? 999 : py, EDGE.right ? 999 : GW - 1 - px, EDGE.down ? 999 : GH - 1 - py); if (de < 80) { const k = (1 - de / 80) * (1 - de / 80) * 0.5; putD(j, tc); D[j] -= D[j] * k; D[j + 1] -= (D[j + 1] - 12) * k; D[j + 2] -= D[j + 2] * k * 0.9; continue; } }
          putD(j, tc); continue;
        }
      }
      if (t === TER.grass && LUSH) {
        // près d'un chemin : l'herbe s'éclaircit en touffes mêlées de terre (fondu tramé, sans contour)
        {
          col = lerpPal(GRASS, lushGrassV(px, py, i, tx, ty));
          const p5 = G5(px, py), sh = SH[i];
          if (p5 > 0.55) { const w = (p5 - 0.55) * 0.55; col[0] += (236 - col[0]) * w; col[1] += (226 - col[1]) * w * 0.6; col[2] += (110 - col[2]) * w * 0.4; }   // nappe de soleil (jaune doré)
          const cool = Math.min(0.5, (p5 < 0.42 ? (0.42 - p5) * 1.2 : 0) + sh * 0.035);
          if (cool > 0) { col[0] += (30 - col[0]) * cool; col[1] += (90 - col[1]) * cool * 0.5; col[2] += (100 - col[2]) * cool; }   // ombre bleutée
        }
        if (TX_HERBE || TX_HSECHE) col = herbeTx(tx, ty, px, py, SH[i], en, ed);   // (image dessinée : gfx/textures.js)
      } else if (t === TER.dirt && LUSH) {
        // bord du chemin : brins d'herbe qui débordent, terre un peu plus sombre
        col = lerpPal(DIRT, lushDirtV(px, py, i) - (en === TER.grass && ed <= 4 ? (5 - ed) * 0.14 : 0));
        if (en === TER.grass && ed <= 4) {
          col = [col[0], col[1], col[2]];   // (copie : lerpPal réutilise son tableau)   // l'herbe gagne doucement sur le bord du chemin (fondu, sans pointillés)
          const k = (5 - ed) / 5 * (0.35 + TUFT(px, py) * 0.5), gc = lerpPal(GRASS, 2.2 + (G5(px, py) - 0.5) * 2);
          col = [col[0] + (gc[0] - col[0]) * k, col[1] + (gc[1] - col[1]) * k, col[2] + (gc[2] - col[2]) * k];
        }
        if (map.ambient === 'forest' && hash(px >> 1, py >> 1, 92) < 0.012) col = Art.mix(Art.hex(LITTER[Math.floor(hash(px >> 1, py >> 1, 93) * LITTER.length)]), col, 0.45);   // quelques feuilles mortes, fondues dans la terre
        if (TX_CHEMIN && !(SOLKP && SOLKP[i]) && altCase(tx, ty) < 3) {   // terre et sentiers (image dessinée), l'herbe déborde sur les bords
          col = TX.lit(TX_CHEMIN, px, py);
          if (TX_HERBE && en === TER.grass && ed <= 3 && hash(px >> 1, py >> 1, 95) < (4 - ed) * 0.24) col = Art.mix(col, TX.lit(TX_HERBE, px, py), 0.8);
          if (ed <= 4 && en === TER.grass) col = Art.mix(col, [30, 24, 14], 0.06 * (5 - ed));   // (un peu creusé au bord)
        }
        if (SOLKP && SOLKP[i]) col = solVar(col, SOLKP[i], px, py);
        else if (TX_CENDRES && altCase(tx, ty) >= 3) col = Art.mix(TX.lit(altCase(tx, ty) >= 4 ? TX_CENDRES : TX_DESSUS || TX_CENDRES, px + 31, py + 17), [150, 120, 96], 0.12);   // sentier en hauteur : sol volcanique (image dessinée) ; en bas, la terre
      } else if (t === TER.lawn && LUSH) {
        // pelouse (Village des Bébés) : mêmes brins fins, palette pastel, fleurs semées
        if (en !== TER.lawn && en !== 255 && en !== TER.pastel && ed <= 2 && hash(px, py, 315) < (3 - ed) / 4) col = lerpPal(SAND, 3.4 + (hash(px, py, 316) - 0.5));
        else col = lerpPal(PAL.lawn, lushGrassV(px, py, i, tx, ty) + 0.2);
        if (hash(px, py, 13) < 0.005) col = Art.hex(['#ffb6d6', '#fff0a0', '#d8c0ff', '#ffffff'][Math.floor(hash(px, py, 14) * 4)]);
        if (TX_HERBE && !(en !== TER.lawn && en !== 255 && en !== TER.pastel && ed <= 2)) col = herbeTx(tx, ty, px, py, SH[i], en, ed);   // pelouse : l'herbe dessinée (gfx/textures.js)
      } else if (t === TER.grass) {
        let v = 2.4 + (G5(px, py) - 0.5) * 3 + (noise(px * 0.3, py * 0.3, 6) - 0.5) * 1.4 + b * 0.8;
        if (en !== TER.grass && en !== TER.canopy && en !== 255) { if (ed === 1) v = 0.2; else if (ed === 2) v -= 1; }
        v -= SH[i] * 0.22;
        if (tallAt(tx, ty)) v -= 1.2;
        col = GRASS[DW.clamp(Math.round(v), 0, 5)];
        if (TX_HERBE || TX_HSECHE) col = herbeTx(tx, ty, px, py, SH[i], en, ed);   // (image dessinée : gfx/textures.js)
        if (map.ambient === 'forest' && SH[i] > 2 && hash(px >> 1, py >> 1, 90) < 0.02) col = Art.hex(['#c8a040', '#a8c050', '#d08a3a'][Math.floor(hash(px, py, 91) * 3)]);
      } else if (t === TER.dirt) {
        let v = 3 + (D7(px, py) - 0.5) * 2.4 + b * 0.8;
        if (ed <= 2 && en !== TER.dirt) v -= 3 - ed;
        if (ed === 3 && hash(px, py, 94) < 0.08) v += 2;
        if (py > 2 && (T[i - GW] === TER.grass || T[i - 2 * GW] === TER.grass)) v -= 1;
        v -= SH[i] * 0.2;
        col = DIRT[DW.clamp(Math.round(v), 0, 5)];
        if (map.ambient === 'forest' && hash(px >> 1, py >> 1, 92) < 0.06) col = Art.hex(LITTER[Math.floor(hash(px >> 1, py >> 1, 93) * LITTER.length)]);
        if (TX_CHEMIN && !(SOLKP && SOLKP[i]) && altCase(tx, ty) < 3) {   // terre et sentiers (image dessinée), l'herbe déborde sur les bords
          col = TX.lit(TX_CHEMIN, px, py);
          if (TX_HERBE && en === TER.grass && ed <= 3 && hash(px >> 1, py >> 1, 95) < (4 - ed) * 0.24) col = Art.mix(col, TX.lit(TX_HERBE, px, py), 0.8);
          if (ed <= 4 && en === TER.grass) col = Art.mix(col, [30, 24, 14], 0.06 * (5 - ed));   // (un peu creusé au bord)
        }
        if (SOLKP && SOLKP[i]) col = solVar(col, SOLKP[i], px, py);
        else if (TX_CENDRES && altCase(tx, ty) >= 3) col = Art.mix(TX.lit(altCase(tx, ty) >= 4 ? TX_CENDRES : TX_DESSUS || TX_CENDRES, px + 31, py + 17), [150, 120, 96], 0.12);   // sentier en hauteur : sol volcanique (image dessinée) ; en bas, la terre
      } else if (t === TER.sand) {
        const r = Math.sin(px * 0.2 + S8(px, py) * 9 + py * 0.55);
        let v = 3.2 + (S9(px, py) - 0.5) * 1.6 + b * 0.7 + (r > 0.9 ? -1 : r < -0.96 ? 1 : 0);
        if (hash(px, py, 10) < 0.03) v += hash(px, py, 11) < 0.5 ? -1 : 1;
        v -= SH[i] * 0.2;
        if (en === TER.water && ed <= 9) { const wv = lerpPal(WET, v * 0.5 + ed * 0.35 - 0.6), dry = SAND[DW.clamp(Math.round(v), 0, 5)], k = ed <= 5 ? 0 : (ed - 5) / 4; col = [wv[0] + (dry[0] - wv[0]) * k, wv[1] + (dry[1] - wv[1]) * k, wv[2] + (dry[2] - wv[2]) * k]; }   // sable mouillé qui sèche en s'éloignant de l'eau
        else col = SAND[DW.clamp(Math.round(v), 0, 5)];
        if (TX_SABLE && !(en === TER.water && ed <= 5)) { const s2 = TX.lit(TX_SABLE, px, py); col = en === TER.water && ed <= 9 ? Art.mix(col, s2, (ed - 5) / 4) : s2; }   // sable dessiné (le bord mouillé reste)
      } else if (t === TER.lawn) {
        let v = 3 + (L12(px, py) - 0.5) * 2 + b * 0.6;
        if (ed === 1 && en !== TER.lawn && en !== 255) v = 1;
        v -= SH[i] * 0.2;
        if (tallAt(tx, ty)) v -= 1;
        col = PAL.lawn[DW.clamp(Math.round(v), 0, 5)];
        const h = hash(px, py, 13);
        if (h < 0.006) col = Art.hex(['#ffb6d6', '#fff0a0', '#d8c0ff', '#ffffff'][Math.floor(hash(px, py, 14) * 4)]);
        if (TX_HERBE) col = herbeTx(tx, ty, px, py, SH[i], en, ed);   // pelouse : l'herbe dessinée (gfx/textures.js)
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
      } else if (t === TER.cobble && TX_PAVES) {
        // PAVÉS DESSINÉS (image du joueur) : bordure plus sombre contre l'herbe, mousse si la ville est à l'abandon, ombres
        let c = TX.lit(TX_PAVES, px, py); const decay = map.decay || 0;
        if (decay > 0 && hash(px >> 2, py >> 2, 160) < decay * 0.35) c = Art.mix(c, [70, 120, 50], 0.45);
        if (ed <= 3 && en !== TER.cobble) c = Art.mix(c, [40, 36, 30], 0.12 * (4 - ed));
        col = Art.mix(c, [0, 0, 0], SH[i] * 0.03);
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
        let v = canv(px, py) + (hash(px >> 1, py >> 1, 18) - 0.5) * 0.4 - Math.min(ed, 40) * 0.03;
        col = lerpPal(CANOPY, v);
        if (FORET_ARBRES) { col[0] = col[0] + (10 - col[0]) * 0.5; col[1] = col[1] + (26 - col[1]) * 0.5; col[2] = col[2] + (16 - col[2]) * 0.5; v -= 0.8; }   // (sous-bois sombre : les arbres dessinés sont posés dessus)
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
      } else if (t === TER.rock) {
        // (falaises arrondies : un pixel de roche peut déborder sur une case voisine ; il se repère sur la paroi la plus proche)
        let RX = tx, RY = ty;
        if (tAt(tx, ty) !== TER.rock) for (const [dx, dy] of [[0, 1], [0, -1], [-1, 0], [1, 0], [-1, 1], [1, 1], [-1, -1], [1, -1]]) if (tAt(tx + dx, ty + dy) === TER.rock) { RX = tx + dx; RY = ty + dy; break; }
        const lxR = Math.max(0, Math.min(15, px - RX * 16)), lyR = Math.max(0, Math.min(15, py - RY * 16));
        // FALAISE EN COLONNES DE ROCHE (façon RPG 2D peint) : la paroi est faite de piliers arrondis empilés en blocs,
        // éclairés en haut à gauche (face claire, flanc droit dans l'ombre), joints sombres entre les blocs, mousse et
        // lierre qui pendent du rebord, liseré d'herbe qui déborde en haut, pied dans l'ombre avec des éboulis
        const topRow = tAt(RX, RY - 1) !== TER.rock, botRow = tAt(RX, RY + 1) !== TER.rock;
        const leftE = tAt(RX - 1, RY) !== TER.rock, rightE = tAt(RX + 1, RY) !== TER.rock;
        const up = rockRun(RX, RY, -1), Hpx = RU[i] + RD[i] + 1, wy = RU[i], depth = wy / Hpx;
        if (TX_FALAISE) {
          const FH = TX_FALAISE.h, yt = Hpx === FH ? wy : wy < 16 ? wy : wy >= Hpx - 16 ? FH - (Hpx - wy) : 16 + ((wy - 16) % (FH - 32));
          col = TX.lit(TX_FALAISE, px, yt);
          { const Lh = altCase(RX, RY - up - 1); if (Lh <= 3) col = refroidie(col, Lh <= 2 ? 1 : 0.6); }   // (en bas de la montagne : lave refroidie)
          if (TX_ESC && lxR < 7) { const RL = escalierVu(RX - 1, RY); if (RL && RL.x1 === RX - 1) col = Art.mix(col, [8, 4, 6], 0.42 * (1 - lxR / 7)); }   // ombre de l'escalier sur la paroi
          if (leftE && lxR < 2) col = Art.mix(col, [0, 0, 0], 0.25); else if (rightE && lxR > 13) col = Art.mix(col, [0, 0, 0], 0.35);
        } else {
        // colonnes de largeur inégale (9 à 15 px), légèrement ondulées
        const wx = px + (noise(px * 0.04, py * 0.025, 61) - 0.5) * 7;
        const k0 = Math.floor(wx / 20), cw = 15 + hash(k0, 0, 62) * 4, cx0 = k0 * 20 + (20 - cw) / 2 + (hash(k0, 1, 63) - 0.5) * 2;
        let u = (wx - cx0) / cw, col0 = k0;
        if (u < 0 || u > 1) col0 = k0 + 0.5;   // (creux entre deux colonnes)
        const gap = u < 0 || u > 1 || col0 !== k0;
        // blocs empilés dans chaque colonne : hauteur 11 à 22 px, décalés d'une colonne à l'autre
        const sh = 18 + hash(k0, 2, 64) * 16, sw = wy + hash(k0, 3, 65) * sh + Math.pow((wx - cx0) / cw - 0.5, 2) * 10, seg = Math.floor(sw / sh), fy = sw / sh - seg;   // (joints bombés : dessus de bloc arrondi)
        const lipH = 3 + Math.round(noise(px * 0.18, RY, 66) * 4);
        const drip = hash(k0, seg, 67) < 0.22 ? Math.floor(hash(k0, 4, 68) * 14) + 4 : 0;   // mousse / lierre qui pend
        if (wy < lipH) {
          col = lerpPal(GRASS, 3.4 - lyR * 0.5 + b * 0.6);                                   // herbe du plateau qui déborde
        } else if (wy === lipH) {
          col = lerpPal(GRASS, 0.4);                                                        // ourlet sombre sous l'herbe
        } else if (wy < lipH + drip && !gap && Math.abs(u - 0.35 - hash(k0, 5, 69) * 0.3) < 0.14) {
          col = lerpPal(GRASS, 1.2 + (1 - (wy - lipH) / Math.max(1, drip)) * 1.6 + b * 0.5);   // lierre
        } else if (gap) {
          col = lerpPal(ROCK, 0.6 + (1 - depth) * 0.8);                                     // creux sombre entre deux piliers
        } else {
          const rx = (u - 0.5) * 2, ry = (fy - 0.5) * 2;
          let v = 5.0 - rx * 1.7 - Math.pow(Math.abs(rx), 4) * 2.2;                         // pilier arrondi : clair à gauche, sombre à droite
          v += (0.5 - fy) * 1.6;                                                            // haut du bloc éclairé, bas dans l'ombre
          if (fy < 0.06) v = 1.0;                                                           // joint entre deux blocs
          else if (fy < 0.16) v += 1.1;                                                      // arête éclairée du dessus du bloc
          if (Math.abs(rx) > 0.8 && Math.abs(ry) > 0.75) v -= 1.6;                          // coins arrondis des blocs
          v += (noise(px * 0.3, py * 0.3, 70) - 0.5) * 1.1 + b * 0.45;                      // grain de la pierre
          if (noise(px * 0.6, py * 0.08, 71) > 0.8 && Math.abs(rx) < 0.6) v -= 1.3;          // fissure
          v -= depth * 1.5;                                                                 // le bas de la paroi est dans l'ombre
          if (leftE && lxR < 3) v += 0.8; if (rightE && lxR > 12) v -= (lxR - 12) * 0.7;
          col = lerpPal(ROCK, v);
          if (fy > 0.06 && fy < 0.14 && hash(px >> 1, seg * 7 + k0, 72) < 0.3) col = lerpPal(GRASS, 1.8 + b);   // mousse sur les corniches
        }
        if (Hpx - 1 - wy <= 3) { const r = hash(px, py, 73); col = r < 0.3 ? lerpPal(ROCK, 2.6 + r * 3) : lerpPal(ROCK, 0.8 + (3 - (Hpx - 1 - wy)) * 0.1); }   // pied : ombre et éboulis
        }
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
        // MARCHES DE PIERRE : dalles taillées (dessus clair et chaud, contremarche sombre et froide), joints,
        // usure au milieu, mousse dans les coins, murets de falaise de chaque côté
        const s = ly % 4, slab = Math.floor((px + (Math.floor(py / 4) & 1) * 5) / 9), tone = 0.9 + hash(slab, py >> 2, 26) * 0.2;
        let c = s === 0 ? [236 * tone, 220 * tone, 186 * tone] : s === 3 ? [96, 86, 82] : [196 * tone, 178 * tone, 146 * tone];
        if (s === 2) c = Art.mix(c, [120, 108, 96], 0.3);
        if ((px + (Math.floor(py / 4) & 1) * 5) % 9 === 0 && s !== 3) c = Art.mix(c, [90, 80, 70], 0.55);           // joints
        if (lx >= 5 && lx <= 10 && s === 0) c = Art.mix(c, [255, 246, 220], 0.25);                                  // usure (plus clair au milieu)
        if ((lx <= 3 || lx >= 12) && s === 3 && hash(px, py, 27) < 0.5) c = [74, 128, 64];                         // mousse
        { const R0 = ROCK[2], R1 = ROCK[6]; c = s === 3 ? Art.mix(ROCK[1], [0, 0, 0], 0.1) : Art.mix(R1, R0, (s === 2 ? 0.35 : 0.1) + (1 - tone) * 2); if ((px + (Math.floor(py / 4) & 1) * 5) % 9 === 0 && s !== 3) c = ROCK[2]; }
        if (lx < 2 || lx > 13) c = Art.mix(ROCK[lx < 2 ? 5 : 2], [0, 0, 0], lx === 0 || lx === 15 ? 0.35 : 0);    // murets (même roche que la paroi)
        col = c;
        if (TX_ESC) {
          let x0 = tx, y0 = ty, x1 = tx, y1 = ty;
          while (x0 > 0 && tAt(x0 - 1, ty) === TER.stairs) x0--; while (x1 < map.w - 1 && tAt(x1 + 1, ty) === TER.stairs) x1++;
          while (y0 > 0 && tAt(tx, y0 - 1) === TER.stairs) y0--; while (y1 < map.h - 1 && tAt(tx, y1 + 1) === TER.stairs) y1++;
          const EH = TX_ESC.h, Hs = (y1 - y0 + 1) * 16, ys = (ty - y0) * 16 + ly, yt = Hs <= EH ? ys / Hs * EH : ys < 16 ? ys : ys >= Hs - 16 ? EH - (Hs - ys) : 16 + ((ys - 16) % (EH - 32));
          const e = TX.lit(TX_ESC, ((tx - x0) * 16 + lx) / ((x1 - x0 + 1) * 16) * TX_ESC.w, yt), fond = TX_DESSUS || TX_CENDRES;
          if (fond) col = TX.lit(fond, px, py);
          if (e[3] > 40) col = e[3] > 230 ? e : Art.mix(col, e, e[3] / 255);
        }
      } else if (t === TER.bridge && !DOCK) {
        // PONT DE PIERRE (rivières, lacs) : tablier de dalles taillées posées en quinconce, chacune éclairée en haut
        // à gauche, joints sombres, usure claire au milieu, mousse dans les joints ; PARAPETS sur les bords
        // (chaperon clair, face extérieure dans l'ombre), et une borne tous les 3 ponts de case
        const vertical = !(tAt(tx - 1, ty) === TER.bridge || tAt(tx + 1, ty) === TER.bridge);
        const along = vertical ? py : px, across = vertical ? px : py, la = vertical ? ly : lx, lb = vertical ? lx : ly;
        const edgeA = vertical ? tAt(tx - 1, ty) !== TER.bridge : tAt(tx, ty - 1) !== TER.bridge;   // bord gauche / haut
        const edgeB = vertical ? tAt(tx + 1, ty) !== TER.bridge : tAt(tx, ty + 1) !== TER.bridge;   // bord droit / bas
        const row = Math.floor(across / 5), off = (row & 1) * 4, sl = Math.floor((along + off) / 8), ia = (along + off) % 8, ib = across % 5;
        const tone = 0.86 + hash(sl, row, 28) * 0.24;
        let c = [178 * tone, 168 * tone, 150 * tone];
        if (ia === 0 || ib === 0) c = hash(sl, row, 29) < 0.18 ? [70, 112, 56] : [86, 80, 74];                // joints (un peu de mousse)
        else if (ia === 1 || ib === 1) c = Art.mix(c, [255, 246, 222], 0.28);                                     // arête éclairée
        else if (ia === 7 || ib === 4) c = Art.mix(c, [40, 44, 56], 0.22);                                        // arête dans l'ombre
        if (lb >= 5 && lb <= 10 && ia > 1 && ib > 1) c = Art.mix(c, [236, 228, 210], 0.12);                      // usure au milieu
        c = Art.mix(c, [0, 0, 0], (noise(px * 0.3, py * 0.3, 30) - 0.5) * 0.18);
        // parapets : muret de 3 px, chaperon clair, joint, puis face extérieure sombre
        const par = edgeA && lb <= 3 ? lb : edgeB && lb >= 12 ? 15 - lb : -1;
        if (par >= 0) {
          const k2 = Math.floor((along + (edgeA ? 0 : 3)) / 10), stoneT = 0.9 + hash(k2, edgeA ? 1 : 2, 31) * 0.2;
          c = par === 0 ? [74, 70, 72] : par === 1 ? [212 * stoneT, 204 * stoneT, 186 * stoneT] : par === 2 ? [176 * stoneT, 166 * stoneT, 148 * stoneT] : [92, 86, 82];
          if ((along + (edgeA ? 0 : 3)) % 10 === 0 && par > 0 && par < 3) c = [96, 90, 84];                    // joints du chaperon
          if (!edgeA && par === 1) c = Art.mix(c, [40, 44, 60], 0.18);                                          // muret du bas : moins de lumière
        }
        // bornes de pierre tous les 3 ponts de case, sur les parapets
        const pier = (vertical ? ty : tx) % 3 === 0 && par >= 0 && la >= 4 && la <= 11;
        if (pier) { const r = Math.hypot(la - 7.5, par - 1.5); c = r < 1.8 ? [226, 218, 200] : r < 3 ? [150, 142, 128] : r < 3.8 ? [70, 66, 66] : c; }
        col = c;
      } else if (t === TER.bridge) {
        // PONTON / PASSERELLE PEINTS (bord de mer) : planches de longueurs et de tons variés, veines du bois, clous,
        // interstices sombres où l'on devine l'eau, bords usés, pieux d'amarrage tous les 3 cases
        const vertical = !(tAt(tx - 1, ty) === TER.bridge || tAt(tx + 1, ty) === TER.bridge);
        const a = vertical ? py : px, bb = vertical ? lx : ly, along = vertical ? px : py;
        const plank = Math.floor(a / 5), pa = a - plank * 5, seg = Math.floor((along + Math.floor(hash(plank, 9, 22) * 16)) / 16);
        const tone = 0.82 + hash(plank, seg, 22) * 0.36, base = [168 * tone, 116 * tone, 64 * tone];
        let c = Art.mix(base, [70, 40, 20], (noise(along * 0.5, a * 0.9 + plank * 7, 23) - 0.5) * 0.55);   // veines
        if (pa === 0) c = Art.mix([26, 34, 44], c, 0.25);                                                     // interstice (l'eau dessous)
        else if (pa === 1) c = Art.mix(c, [255, 236, 196], 0.22);                                             // arête éclairée
        else if (pa === 4) c = Art.mix(c, [40, 24, 12], 0.28);                                                // bord dans l'ombre
        if ((along & 15) === 3 && (pa === 2 || pa === 3) && hash(plank, seg, 24) < 0.7) c = [70, 64, 60];      // clous
        if (bb <= 1 || bb >= 14) c = Art.mix([74, 44, 22], c, bb === 0 || bb === 15 ? 0.1 : 0.4);            // poutres de rive
        if (hash(px >> 1, py >> 1, 25) < 0.02) c = Art.mix(c, [200, 190, 170], 0.35);                         // sel, usure
        const post = (vertical ? ty : tx) % 3 === 0 && (bb <= 2 || bb >= 13) && ((vertical ? ly : lx) >= 5 && (vertical ? ly : lx) <= 10);
        if (post) { const r = Math.hypot((vertical ? ly : lx) - 7.5, bb <= 2 ? bb - 1 : bb - 14); c = r < 1.6 ? [126, 88, 52] : r < 2.6 ? [64, 40, 22] : c; }
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
        // (seulement sur les bords SANS carte voisine : sinon une bande sombre marquerait chaque frontière)
        const de = Math.min(EDGE.left ? 999 : px, EDGE.up ? 999 : py, EDGE.right ? 999 : GW - 1 - px, EDGE.down ? 999 : GH - 1 - py);
        if (de < 80) { const k = (1 - de / 80) * (1 - de / 80) * 0.5; putD(j, col); D[j] -= D[j] * k; D[j + 1] -= (D[j + 1] - 12) * k; D[j + 2] -= D[j + 2] * k * 0.9; continue; }
      }
      putD(j, col);
    } };
    if (!ROCKY) for (let ty = 0; ty < MH; ty += 4) { canvPrep(ty, Math.min(MH, ty + 4)); yield; }
    for (let py = 0; py < GH; py += 2) { couleurRows(py, Math.min(GH, py + 2)); yield; }
    lap('couleur');
    // FONDUS ENTRE CARTES (grille du monde : maps/monde.js) : le long d'un bord partagé avec une voisine d'un autre
    // biome, les couleurs de l'herbe, de la terre, du sable et du feuillage glissent vers celles d'en face et se
    // rejoignent exactement à mi-chemin sur la frontière (les deux cartes font le même calcul) : aucune couture.
    if (map.voisines && map.voisines.length && !map.indoor) {
      const mean = P => { const a = [0, 0, 0]; for (const c of P) { a[0] += c[0]; a[1] += c[1]; a[2] += c[2]; } return [a[0] / P.length, a[1] / P.length, a[2] / P.length]; };
      const palOf = m2 => {
        const T2 = m2.theme && World.THEMES[m2.theme], H = c => c.map(Art.hex);
        return { [TER.grass]: T2 && T2.grass ? H(T2.grass) : m2.ambient === 'forest' ? PAL.forest : PAL.grass, [TER.dirt]: T2 && T2.dirt ? H(T2.dirt) : PAL.dirt,
          [TER.sand]: T2 && T2.sand ? H(T2.sand) : PAL.sand, [TER.canopy]: T2 && T2.canopy ? H(T2.canopy) : PAL.canopy };
      };
      const mine = { [TER.grass]: GRASS, [TER.dirt]: DIRT, [TER.sand]: SAND, [TER.canopy]: CANOPY }, BAND = 12 * TS, END = 4 * TS;
      for (const v of map.voisines) {
        const M2 = DW.MAPS[v.id]; if (!M2) continue;
        const other = palOf(M2), delta = {}; let any = false;
        for (const k in mine) { const a = mean(mine[k]), b = mean(other[k]); delta[k] = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]; if (Math.abs(delta[k][0]) + Math.abs(delta[k][1]) + Math.abs(delta[k][2]) > 6) any = true; }
        if (!any) continue;
        const vert = v.side === 'left' || v.side === 'right', from = v.from * TS, to = v.to * TS;
        // (seulement la bande le long du bord partagé)
        const A0 = Math.max(0, from - END), A1 = Math.min(vert ? GH - 1 : GW - 1, to + END), B = Math.min(BAND, vert ? GW : GH);
        const y0 = vert ? A0 : v.side === 'up' ? 0 : GH - B, y1 = vert ? A1 : v.side === 'up' ? B - 1 : GH - 1;
        const x0 = vert ? (v.side === 'left' ? 0 : GW - B) : A0, x1 = vert ? (v.side === 'left' ? B - 1 : GW - 1) : A1;
        // (tables : poids selon la distance au bord, fondu aux extrémités, écart de couleur par terrain)
        const WD = new Float64Array(BAND); for (let d = 0; d < BAND; d++) WD[d] = 0.5 * Math.pow(1 - d / BAND, 1.4);
        const DL = []; for (const k in delta) DL[k] = delta[k];
        for (let py = y0; py <= y1; py++) { if ((py & 31) === 31) yield; for (let px = x0; px <= x1; px++) {
          const d = v.side === 'left' ? px : v.side === 'right' ? GW - 1 - px : v.side === 'up' ? py : GH - 1 - py;
          if (d >= BAND) continue;
          const along = vert ? py : px; if (along < from - END || along > to + END) continue;
          const i = py * GW + px, dl = DL[T[i]]; if (!dl) continue;
          const endFade = DW.clamp(Math.min(along - (from - END), to + END - along) / END, 0, 1);
          const w = WD[d] * endFade, j = i * 4;
          D[j] += dl[0] * w; D[j + 1] += dl[1] * w; D[j + 2] += dl[2] * w;
        } }
      }
      lap('fondus');
    }
    if (ALTP && DW.Relief.rebordsPixels) {   // (maps/relief.js)
      // zone des escaliers : 2 = l'escalier et son image (rien n'y est peint), 1 = juste autour (pas de rebord)
      const ZE = new Uint8Array(MW * MH), esc = (x, y) => tF(x, y) === TER.stairs || (ESCA && x >= 0 && y >= 0 && x < MW && y < MH && ESCA[y * MW + x]);
      for (let ty = 0; ty < MH; ty++) for (let tx = 0; tx < MW; tx++) {
        if (esc(tx, ty)) { ZE[ty * MW + tx] = 2; continue; }
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (esc(tx + dx, ty + dy)) ZE[ty * MW + tx] = 1;
      }
      DW.Relief.rebordsPixels(map, D, ALTP, i => T[i] === RK, ZE); map._rebordsPix = map.alt; yield;
    }
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
        if (kind === 'gravier') {
          if (k > 3 || TX_DESSUS) continue;   // (la texture dessinée a déjà ses cailloux)
          const s = 1 + Math.floor(hash(tx, ty, 70 + k) * 2);
          for (let yy = 0; yy <= s; yy++) for (let xx = 0; xx <= s + 1; xx++) set(x + xx, y + yy, yy === 0 || xx === 0 ? '#c8bea8' : yy === s || xx === s + 1 ? '#5e564c' : '#968c7c');
          set(x + s + 2, y + s + 1, '#3a342e');   // (ombre)
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
      if (inf.deco && !(TH && TH.noFlowers && (inf.deco === 'flowers' || inf.deco === 'mushrooms'))) {
        const F = TX && (inf.deco === 'flowers' || inf.deco === 'mushrooms') ? TX.fleur(map, tx, ty, inf.deco) : null;
        if (F) FLEURS_POSEES.push([tx, ty, F]); else if (F !== '') decorate(tx, ty, inf.deco);   // (images du joueur : posées plus bas, comme objets ; '' = case laissée nue)
      }
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
      let kind = (map.objMap && map.objMap[inf.obj]) || (TH && TH.objMap && TH.objMap[inf.obj]) || inf.obj;   // (map.objMap : la carte remplace un décor, ex. des pins sur le volcan)
      let o = OBJ[kind];
      let v = inf.v != null ? inf.v : Math.floor(hash(tx, ty, 60) * o.n);   // (variante imposée par la case : puits plein / vide)
      if (inf.obj === 'tree' && kind !== 'tree') {
        const h = hash(tx, ty, 60);
        if (TH && TH.trees2) { const tot = TH.trees2.reduce((a, t) => a + t[1], 0); let r = h * tot; v = TH.trees2[0][0]; for (const [tv, w] of TH.trees2) { if (r < w) { v = tv; break; } r -= w; } }
      } else if (inf.obj === 'tree') {
        const h = hash(tx, ty, 60);
        if (TH) { const tot = TH.trees.reduce((a, t) => a + t[1], 0); let r = h * tot; v = TH.trees[0][0]; for (const [tv, w] of TH.trees) { if (r < w) { v = tv; break; } r -= w; } }
        else { v = h < 0.5 ? Math.floor(h * 6) : h < 0.82 ? 3 : h < 0.9 ? 4 : Math.floor(hash(tx, ty, 62) * 3); if (map.ambient !== 'forest') v = Math.floor(h * 3); }
      }
      { const R = TX && TX.objet(map, kind, tx, ty); if (R) { kind = R; o = OBJ[R]; v = 0; } }   // (image dessinée : gfx/textures.js)
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
    // bouche du volcan (dessinée par game/lave.js) : ses images sont préparées avec la carte
    // (cratère : la 1re image avant d'afficher la carte, les suivantes après, en tâche de fond : game/lave.js)
    if (map.bouche) for (const k of ['bouche', 'bouchelave']) if (!World.objReady(k, 0, 0)) { World.objFrame(k, 0, 0); yield; }
    // FLEURS ET CHAMPIGNONS DU SOL (images du joueur) : une touffe par case, placée au hasard dans la case, plate (sous le héros)
    for (const [tx, ty, kind] of FLEURS_POSEES) {
      if (!OBJ[kind]) continue;
      if (!World.objReady(kind, 0)) { World.obj(kind, 0); yield; }
      const jx = Math.round((hash(tx, ty, 66) - 0.5) * 8), jy = Math.round((hash(tx, ty, 67) - 0.5) * 6);
      objs.push({ kind, v: 0, flip: hash(tx, ty, 68) < 0.5, spr: World.obj(kind, 0), sprs: null, fps: 4, x: tx * TS + 8 + jx, y: ty * TS + 13 + jy, sort: -10 + ty * 0.01, big: false, tx, ty, flat: true });
    }
    // FORÊTS EN VRAIS ARBRES : là où le jeu peignait une voûte de feuillage (cases « # »), des arbres dessinés serrés en
    // quinconce (une case sur quatre, et chaque case du premier rang, celui qu'on voit de face) ; variantes du thème
    if (FORET_ARBRES) {
      const KF = (map.objMap && map.objMap.tree) || 'tree';   // (forêt de pins, etc. : map.objMap)
      const pick = (tx, ty) => { const h = hash(tx, ty, 60); if (KF !== 'tree') return h < 0.5 ? 0 : 1; if (TH && TH.trees) { const tot = TH.trees.reduce((a, t) => a + t[1], 0); let r = h * tot; for (const [tv, w] of TH.trees) { if (r < w) return tv; r -= w; } return TH.trees[0][0]; } return Math.floor(h * 3); };
      for (let ty = 0; ty < map.h; ty++) for (let tx = 0; tx < map.w; tx++) {
        if (tAt(tx, ty) !== TER.canopy) continue;
        const devant = tAt(tx, ty + 1) !== TER.canopy, quinconce = ty % 3 === 0 && (tx + ((ty / 3) & 1) * 2) % 4 === 0;   // (arbres 3 fois plus grands que le héros)
        if (!(quinconce || (devant && tx % 3 === 0))) continue;
        const v = pick(tx, ty);
        if (!World.objReady(KF, v)) { World.obj(KF, v); yield; }
        const jx = Math.round((hash(tx, ty, 64) - 0.5) * 6), jy = devant ? 0 : Math.round((hash(tx, ty, 65) - 0.5) * 4);
        objs.push({ kind: KF, v, flip: hash(tx, ty, 63) < 0.5, spr: World.obj(KF, v), sprs: null, fps: 4, x: tx * TS + 8 + jx, y: ty * TS + 16 + jy, sort: ty + 0.5 + jy / 16, big: true, tx, ty, flat: false });
      }
    }
    // objets posés : walk = on marche dessus (tapis), back = accroché au mur (dessiné derrière tout)
    for (const o0 of map.objects || []) {
      const R = TX && TX.objet(map, o0.kind, o0.x, o0.y), o = R ? { ...o0, kind: R, v: 0 } : o0;   // (image dessinée : gfx/textures.js)
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
      objs.push({ kind: o.kind, v: o.v || 0, flip: !!o.flip, spr, sprs: anim, fps: OBJ[o.kind].fps || 4, x: (o.x + o.w / 2) * TS + (o.ox || 0), y: (o.y + o.h) * TS - 1 + (o.oy || 0), sort: flat ? -10 + o.y * 0.01 : o.top ? 1000 : o.y + o.h - 0.5, big: !flat && !o.small && !o.top, flat: flat || o.top, tx: o.x, ty: o.y, def: o });
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
    const pixEau = () => {
      const L = [], W = TER.water; let x0 = GW, y0 = GH, x1 = -1, y1 = -1;
      for (let i = 0; i < N; i++) if (T[i] === W) {
        L.push(i);
        const px = i % GW, py = (i / GW) | 0;
        if (px < x0) x0 = px; if (px > x1) x1 = px; if (py < y0) y0 = py; if (py > y1) y1 = py;
      }
      return [L, x0, y0, x1, y1];
    };
    const PE = pixEau(), WI = PE[0];
    let wx0 = PE[1], wy0 = PE[2], wx1 = PE[3], wy1 = PE[4];
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
    const bridges = !DOCK && World.paintBridges ? World.paintBridges(map) : null;   // ponts de pierre peints (gfx/ponts.js)
    if (bridges) for (const k of bridges.walls) solid.add(k);   // (les murets bloquent le passage)
    map.gfx = { ground, water, objs, solid, tall, GW, GH, fps: 5, puddles, prof, flowers, bridges };
    lap('sol');
    if (!water) { map.gfx.ms = Math.round(performance.now() - t0); yield 'ready'; }
    else {
      const NW = WI.length, BW = wx1 - wx0 + 1, BH = wy1 - wy0 + 1;
      // parties indépendantes du temps, calculées une seule fois par pixel d'eau
      const V0 = new Float32Array(NW), F26 = new Float32Array(NW), F27 = new Float32Array(NW), OUT = new Int32Array(NW);
      // sorte d'eau de chaque pixel : 0 = celle de l'ambiance ; entre deux sortes, un mélange sur une case (K1, K2, KW)
      // (sorte d'eau de chaque case, -1 hors de l'eau ; lue en bordant la carte)
      const EK = new Int8Array(map.w * map.h);
      for (let ty = 0; ty < map.h; ty++) for (let tx = 0; tx < map.w; tx++) { const I = World.CH[map.rows[ty][tx]]; EK[ty * map.w + tx] = I && I.t === 'water' ? I.eau || 0 : -1; }
      const eauDe = (tx, ty) => EK[(ty < 0 ? 0 : ty >= map.h ? map.h - 1 : ty) * map.w + (tx < 0 ? 0 : tx >= map.w ? map.w - 1 : tx)];
      const wsum = new Float64Array(6);
      let EAUX = false; for (let y = 0; y < map.h && !EAUX; y++) for (const c of map.rows[y]) if (World.CH[c] && World.CH[c].eau) { EAUX = true; break; }
      const K1 = EAUX ? new Uint8Array(NW) : null, K2 = EAUX ? new Uint8Array(NW) : null, KW = EAUX ? new Float32Array(NW) : null;
      const eauFixe = (ka, kb) => { for (let k = ka; k < kb; k++) {
        const i = WI[k], px = i % GW, py = (i / GW) | 0;
        let prof = TH && TH.waterDepth || 3.2;   // waterDepth : eau claire plus loin du bord (lagon)
        if (EAUX) {
          const fx = (px - 8) / TS, fy = (py - 8) / TS, x0 = Math.floor(fx), y0 = Math.floor(fy), ax = fx - x0, ay = fy - y0, own = eauDe(px >> 4, py >> 4);
          wsum.fill(0);
          let e = eauDe(x0, y0); wsum[e < 0 ? Math.max(0, own) : e] += (1 - ax) * (1 - ay);
          e = eauDe(x0 + 1, y0); wsum[e < 0 ? Math.max(0, own) : e] += ax * (1 - ay);
          e = eauDe(x0, y0 + 1); wsum[e < 0 ? Math.max(0, own) : e] += (1 - ax) * ay;
          e = eauDe(x0 + 1, y0 + 1); wsum[e < 0 ? Math.max(0, own) : e] += ax * ay;
          let a1 = 0, a2 = -1; for (let e = 1; e < 6; e++) if (wsum[e] > wsum[a1]) a1 = e;
          for (let e = 0; e < 6; e++) if (e !== a1 && wsum[e] > 0 && (a2 < 0 || wsum[e] > wsum[a2])) a2 = e;
          K1[k] = a1; K2[k] = a2 < 0 ? a1 : a2; KW[k] = a2 < 0 ? 0 : wsum[a2] / (wsum[a1] + wsum[a2]);
          if (a1) prof = World.EAUX[a1].prof;
        }
        V0[k] = Math.min(6, ED[i] / prof) + Art.bayer(px, py) * 0.6;
        // houle (F26) : seulement loin du bord et hors des eaux dessinées ; écume (F27) : seulement près du bord
        // (ailleurs, eauImage ne s'en sert pas)
        const k1 = EAUX ? K1[k] : 0, txE = (TX_MER || TX_DOUCE) && !(EAUX && (k1 === 4 || k1 === 5)), ed = ED[i];
        if (ed > 5 && !txE) F26[k] = px * 0.06 + py * 0.4 + fbm(px * 0.03, py * 0.03, 26) * 6;
        let fo0 = 1.6; if (EAUX && (k1 || KW[k] > 0)) { const E1 = World.EAUX[k1]; if (E1) fo0 = 1.6 * E1.fo; }
        if (ed <= Math.abs(fo0) * 2 + 2.3) F27[k] = px * 0.07 + py * 0.05 + fbm(px * 0.05, py * 0.05, 27) * 5;
        OUT[k] = ((py - wy0) * BW + (px - wx0)) * 4;
      } };
      for (let k = 0; k < NW; k += 4096) { eauFixe(k, Math.min(NW, k + 4096)); yield; }
      const NF = 8, frames = water.frames;
      const FOAM = Art.hex(TH && TH.foam ? TH.foam[0] : '#f4feff'), FOAM2 = Art.hex(TH && TH.foam ? TH.foam[1] : '#c4f2f8'), WHITE = Art.hex(TH && TH.foam ? TH.foam[0] : '#ffffff');
      // (couleurs en variables r, g, b et mélanges écrits en clair : mêmes calculs que Art.mix, sans tableau par pixel)
      const texO = (P, x, y) => { const X = ((Math.floor(x) % P.w) + P.w) % P.w, Y = ((Math.floor(y) % P.h) + P.h) % P.h; return (Y * P.w + X) * 4; };
      const MER = !!(map.mer || map.climate === 'beach');
      const eauImage = (f, W8, ka, kb) => {
        const ph = f / NF, a = ph * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a), EX = World.EAUX;
        const LV = TX_LAVE.length ? TX_LAVE[f % TX_LAVE.length] : null, dec = TX_LAVE.length === 1 ? f * 2 : 0;
        for (let k = ka; k < kb; k++) {
          const i = WI[k], px = i % GW, py = (i / GW) | 0, ed = ED[i], en = EN[i], o = OUT[k], k1 = EAUX ? K1[k] : 0;
          // EAU PEINTE : profondeur en dégradé continu, réseau de reflets doux (caustiques), houle en longues lignes,
          // écume du rivage fondue (plus de bandes nettes)
          let v = V0[k];
          const txE = (TX_MER || TX_DOUCE) && !(EAUX && (k1 === 4 || k1 === 5));   // (eau dessinée : ses vagues remplacent les reflets calculés)
          if (ed > 4 && !txE) {
            const c1 = noise(px * 0.13 + ca * 1.4, py * 0.13 + sa * 1.4, 24), c2 = noise(px * 0.13 - ca * 1.4 + 40, py * 0.13 - sa * 1.4 + 20, 25), dc = Math.abs(c1 - c2);
            if (dc < 0.05) v -= 1.7 * (1 - dc / 0.05);
            if (ed > 5) { const sw = Math.sin(F26[k] + a); if (sw > 0.82) v -= (sw - 0.82) / 0.18 * 1.5; }
          }
          lerpPal(WATER, v); let r = TMP[0], g = TMP[1], b = TMP[2];
          let fo0 = 1.6, F1 = FOAM, F2 = FOAM2;
          if (EAUX && (k1 || KW[k] > 0)) {   // eau peinte : sa palette (et un mélange avec la voisine)
            const E1 = EX[k1], E2 = EX[K2[k]], w2 = KW[k];
            if (E1) { lerpPal(E1.P, v); r = TMP[0]; g = TMP[1]; b = TMP[2]; }
            if (w2 > 0) { const r1 = r, g1 = g, b1 = b; lerpPal(E2 ? E2.P : WATER, v); r = r1 + (TMP[0] - r1) * w2; g = g1 + (TMP[1] - g1) * w2; b = b1 + (TMP[2] - b1) * w2; }
            if (E1) { fo0 = 1.6 * E1.fo; F1 = E1.F[0]; F2 = E1.F[1]; }
          }
          if (LV && EAUX && k1 === 5 && !KW[k]) {
            const q = texO(LV, px + dec, py + dec * 0.5), d = LV.d; r = d[q]; g = d[q + 1]; b = d[q + 2];
            if (ed <= 2) { const t = (3 - ed) * 0.22; r = r + (40 - r) * t; g = g + (14 - g) * t; b = b + (8 - b) * t; }
            W8[o] = r; W8[o + 1] = g; W8[o + 2] = b; W8[o + 3] = 255; continue;
          }
          if (txE) {   // eaux dessinées (gfx/textures.js) ; marais et lave gardent leur dessin
            const mer = EAUX && k1 ? k1 === 1 : MER, P = mer ? TX_MER || TX_DOUCE : TX_DOUCE || TX_MER;
            const q = texO(P, px + ca * 3 + f * 0, py + sa * 2), d = P.d, tr = d[q], tg = d[q + 1], tb = d[q + 2];
            r = tr + (r - tr) * 0.22; g = tg + (g - tg) * 0.22; b = tb + (b - tb) * 0.22;
          }
          if (en === TER.bridge && ed <= 4) { const t = 0.4 * (1 - ed / 5); r = r + (10 - r) * t; g = g + (30 - g) * t; b = b + (60 - b) * t; }   // ombre sous le ponton
          if (en !== TER.bridge && en !== 255) {
            const fo = fo0 + 1.3 * (fo0 / 1.6) * Math.sin(a + F27[k]);
            if (ed <= fo) { const t = Math.max(0, (ed - fo + 1) * 0.35); r = F1[0] + (r - F1[0]) * t; g = F1[1] + (g - F1[1]) * t; b = F1[2] + (b - F1[2]) * t; }
            else if (ed <= fo + 2.2) { const t = (ed - fo) / 2.2; r = F2[0] + (r - F2[0]) * t; g = F2[1] + (g - F2[1]) * t; b = F2[2] + (b - F2[2]) * t; }
          }
          if (ed > 3 && hash(px, py, 100 + f) < 0.0012) { r = WHITE[0]; g = WHITE[1]; b = WHITE[2]; }
          W8[o] = r; W8[o + 1] = g; W8[o + 2] = b; W8[o + 3] = 255;
        }
      };
      for (let f = 0; f < NF; f++) {
        const id = new ImageData(BW, BH), W8 = id.data;
        for (let k = 0; k < NW; k += 4096) { eauImage(f, W8, k, Math.min(NW, k + 4096)); yield; }
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
    if (map.bouche) for (const k of ['bouche', 'bouchelave']) for (let fr = 1; fr < OBJ[k].frames; fr++) if (!World.objReady(k, 0, fr)) { World.objFrame(k, 0, fr); yield; }
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
  // prête à s'afficher (le reste de l'eau animée se termine ensuite, en tâche de fond)
  World.pret = map => !!(map.gfx && map.gfx.ms !== undefined);

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
  // EAUX (7 tons, du bord clair au fond sombre) : 1 mer, 2 eau claire (lagon), 3 eau douce (rivière, étang), 4 eau trouble (marais)
  // prof : distance au bord (en pixels / 1) pour atteindre le fond ; ecume : [écume du rivage, frange], force de l'écume
  World.EAUX = [null,
    { nom: 'mer', pal: ['#a8f0ee', '#5ccfe0', '#2ea4d2', '#1d7cc0', '#1a5ea8', '#173f86', '#12285e'], prof: 2.3, ecume: ['#ffffff', '#cfeff8'], fo: 1.35 },
    { nom: 'claire', pal: ['#e2fff8', '#b0f6ec', '#7ae8e2', '#48d4de', '#2cbad6', '#2098c6', '#1c78b0'], prof: 8, ecume: ['#ffffff', '#d8fbf6'], fo: 1 },
    { nom: 'douce', pal: ['#bcecdc', '#8cd8cc', '#5ec0c2', '#3ea4b6', '#2e86a4', '#266a8a', '#1e5070'], prof: 3.4, ecume: ['#eefcf6', '#bfe8de'], fo: 0.7 },
    { nom: 'trouble', pal: ['#a6b47a', '#8a9c60', '#71864c', '#5c703e', '#4a5c32', '#3a4a28', '#2c381e'], prof: 2.2, ecume: ['#c8d098', '#aab47c'], fo: 0.45 },
    // lave : croûte sombre au bord, de plus en plus brillante vers le cœur ; les « reflets » deviennent des veines de feu
    { nom: 'lave', pal: ['#2a0e08', '#561410', '#922814', '#cc4618', '#ec7020', '#fca232', '#ffd65a'], prof: 3.2, ecume: ['#2a1612', '#5a2414'], fo: 0.8 },
  ].map(e => e && { ...e, P: e.pal.map(Art.hex), F: e.ecume.map(Art.hex) });
  // STYLES DE FALAISE (8 tons, du plus sombre au plus clair) : choisis par carte dans l'éditeur (map.falaise)
  World.FALAISES = {
    ocre: ['#3a2a20', '#4e3828', '#664a32', '#7e5e3e', '#98744c', '#b28c5e', '#cca674', '#e2c28e'],
    grise: ['#22262c', '#34393f', '#4a5057', '#626870', '#7c838a', '#979ea4', '#b4bac0', '#d2d6da'],
    calcaire: ['#4a4438', '#635b4c', '#7e7562', '#9a917b', '#b5ad96', '#cdc6b0', '#e2dcc8', '#f4f0e2'],
    rouge: ['#3a1a14', '#55241a', '#723220', '#8e4428', '#a85a34', '#c27444', '#d89060', '#eab07e'],
    vegetale: ['#1c2a1c', '#2a3a26', '#3c4e32', '#50603e', '#66744c', '#7e8a5e', '#9aa476', '#b8c094'],
    cotiere: ['#1e2630', '#2c3642', '#3e4a56', '#53606c', '#6b7884', '#86929c', '#a4aeb6', '#c4ccd2'],
    neige: ['#3a4250', '#525c6c', '#6c7888', '#8896a6', '#a6b2c0', '#c4ceda', '#dee6ee', '#f6f9fc'],
    volcanique: ['#120e10', '#1e181a', '#2c2426', '#3c3234', '#4e4244', '#625456', '#7a6a6a', '#94847e'],
  };
})();
