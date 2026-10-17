'use strict';
// =====================================================================
//  ARBRES PEINTS — feuillus, chênes et bouleaux dessinés « au pinceau » (façon Sea of Stars / Octopath)
//  au lieu de piles de sphères : silhouette irrégulière faite de grappes de feuilles, masse sombre et froide
//  au cœur, tons moyens, éclats chauds en haut à gauche (le soleil), liseré de lumière sur le bord, petites
//  feuilles en touches, tronc avec écorce, racines et ombre du feuillage sur le tronc. Contour sombre discret.
//  Les variantes (OBJ.tree : 0-2 verts, 5-7 automne, 8 vert profond, 9 moussu, 10-11 hiver, 12-13 fleurs)
//  gardent leur sens ; les arbres nus (14-15) gardent leur dessin. OBJ.oak et OBJ.birch aussi (v 0 et 1).
//  Rendu par World.obj via « paint » (gfx/objects.js) : pinceau direct, en haute définition.
// =====================================================================
(function () {
  const OBJ = DW.World.OBJ, Art = DW.Art, hash = Art.hash;
  const hex = c => Art.hex(c), rgb = (a, al = 1) => `rgba(${a[0] | 0},${a[1] | 0},${a[2] | 0},${al})`;
  const mix = (a, b, t) => Art.mix(typeof a === 'string' ? hex(a) : a, typeof b === 'string' ? hex(b) : b, t);
  const COOL = '#0c2a3a', WARM = '#fff0a8', INK = '#0a1a14';
  const LX = -0.6, LY = -0.8;   // direction de la lumière (haut-gauche)

  // grappes de la couronne : cercles répartis sur un dôme (cx, cy, rx, ry), graine = forme propre à la variante
  function clumps(seed, cx, cy, rx, ry, n) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const a = hash(seed, i, 901) * Math.PI * 2, d = Math.sqrt(hash(seed, i, 902)) * 0.78;
      const x = cx + Math.cos(a) * rx * d, y = cy + Math.sin(a) * ry * d * 0.95 - (1 - d) * 1.5;
      const r = (rx + ry) * (0.2 + hash(seed, i, 903) * 0.13) * (1.05 - d * 0.25);
      out.push({ x, y, r });
    }
    // un bord festonné : grappes tout autour
    const m = Math.round(n * 0.7);
    for (let i = 0; i < m; i++) {
      const a = (i / m) * Math.PI * 2 + hash(seed, i, 904) * 0.4;
      const out2 = 0.8 + hash(seed, i, 906) * 0.2, x = cx + Math.cos(a) * rx * out2, y = cy + Math.sin(a) * ry * out2 * (Math.sin(a) > 0 ? 0.9 : 1);
      out.push({ x, y, r: (rx + ry) * (0.12 + hash(seed, i, 905) * 0.12) });
    }
    return out;
  }
  // lumière d'un point de la couronne (-1 ombre … 1 plein soleil)
  const lit = (x, y, cx, cy, rx, ry) => { const nx = (x - cx) / rx, ny = (y - cy) / ry; return (nx * LX + ny * LY) * 0.9 - 0.12 * ny; };

  function crown(x, o) {
    const { seed, cx, cy, rx, ry, P, n = 18 } = o;
    const C = clumps(seed, cx, cy, rx, ry, n);
    const base = hex(P[0]), dark = mix(P[1], COOL, 0.38), deep = mix(P[1], COOL, 0.62), hi = mix(P[2], WARM, 0.32), top = mix(P[2], WARM, 0.62);
    // 1) contour sombre (silhouette élargie) puis masse profonde
    x.fillStyle = rgb(mix(deep, INK, 0.35));
    for (const c of C) { x.beginPath(); x.arc(c.x, c.y, c.r + 0.6, 0, 7); x.fill(); }
    x.fillStyle = rgb(deep);
    for (const c of C) { x.beginPath(); x.arc(c.x, c.y, c.r, 0, 7); x.fill(); }
    // 2) chaque grappe : ombre propre en bas à droite, ton moyen, éclat en haut à gauche (selon sa place sur le dôme)
    const sorted = C.slice().sort((a, b) => a.y - b.y);
    for (const c of sorted) {
      const L = lit(c.x, c.y, cx, cy, rx, ry), r = c.r;
      x.fillStyle = rgb(mix(dark, base, Math.max(0, Math.min(1, 0.45 + L * 0.6))));
      x.beginPath(); x.arc(c.x - 0.35, c.y - 0.45, r * 0.86, 0, 7); x.fill();
      if (L > -0.15) {
        x.fillStyle = rgb(mix(base, hi, Math.max(0, Math.min(1, 0.25 + L * 0.8))));
        x.beginPath(); x.arc(c.x - r * 0.28, c.y - r * 0.32, r * 0.55, 0, 7); x.fill();
      }
      if (L > 0.45) { x.fillStyle = rgb(top, 0.85); x.beginPath(); x.arc(c.x - r * 0.4, c.y - r * 0.46, r * 0.26, 0, 7); x.fill(); }
    }
    // 3) feuilles en touches (petites ellipses inclinées), teintées par la lumière du dôme
    for (let i = 0; i < (o.touches || 160); i++) {
      const a = hash(seed, i, 911) * Math.PI * 2, d = Math.sqrt(hash(seed, i, 912)) * 0.95;
      const px = cx + Math.cos(a) * rx * d, py = cy + Math.sin(a) * ry * d;
      const L = lit(px, py, cx, cy, rx, ry) + (hash(seed, i, 913) - 0.5) * 0.35;
      x.fillStyle = L > 0.25 ? rgb(mix(hi, top, Math.min(1, L - 0.25)), 0.9) : L > -0.25 ? rgb(mix(base, hi, L + 0.25), 0.75) : rgb(mix(deep, dark, 0.6), 0.6);
      x.save(); x.translate(px, py); x.rotate(-0.6 + hash(seed, i, 914) * 1.2);
      x.beginPath(); x.ellipse(0, 0, 1.1 * (o.leaf || 1), 0.7 * (o.leaf || 1), 0, 0, 7); x.fill(); x.restore();
    }
    // 4) liseré de lumière sur le bord haut-gauche
    x.strokeStyle = rgb(top, 0.75); x.lineWidth = 0.7;
    for (const c of C) {
      const L = lit(c.x, c.y, cx, cy, rx, ry);
      if (L < 0.35) continue;
      x.beginPath(); x.arc(c.x, c.y, c.r - 0.2, Math.PI * 1.05, Math.PI * 1.45); x.stroke();
    }
    return C;
  }
  function trunk(x, o) {
    const { cx, top, base, w, bark } = o, B = hex(bark), lite = mix(B, '#ffe0b0', 0.25), dk = mix(B, COOL, 0.5);
    // racines
    x.fillStyle = rgb(dk);
    for (const s of [-1, 1]) { x.beginPath(); x.moveTo(cx + s * w * 0.3, base - 4); x.quadraticCurveTo(cx + s * w * 0.9, base - 1, cx + s * w * 1.25, base + 0.6); x.lineTo(cx + s * w * 0.2, base + 0.6); x.fill(); }
    // fût légèrement évasé, dégradé (lumière à gauche)
    const g = x.createLinearGradient(cx - w / 2, 0, cx + w / 2, 0);
    g.addColorStop(0, rgb(lite)); g.addColorStop(0.45, rgb(B)); g.addColorStop(1, rgb(dk));
    x.fillStyle = g;
    x.beginPath(); x.moveTo(cx - w * 0.42, top); x.lineTo(cx + w * 0.42, top); x.quadraticCurveTo(cx + w * 0.5, base - 6, cx + w * 0.62, base);
    x.lineTo(cx - w * 0.62, base); x.quadraticCurveTo(cx - w * 0.5, base - 6, cx - w * 0.42, top); x.fill();
    // écorce
    x.strokeStyle = rgb(dk, 0.7); x.lineWidth = 0.6;
    for (let i = 0; i < 4; i++) { const xx = cx - w * 0.3 + i * w * 0.2; x.beginPath(); x.moveTo(xx, top + 2 + i); x.quadraticCurveTo(xx + 0.6, (top + base) / 2, xx - 0.3, base - 2); x.stroke(); }
    // creux de nœud
    x.fillStyle = rgb(mix(dk, INK, 0.5)); x.beginPath(); x.ellipse(cx + w * 0.1, (top + base) / 2 + 2, 1, 1.5, 0, 0, 7); x.fill();
  }
  // ombre du feuillage sur le haut du tronc
  function crownShadow(x, cx, y, w) {
    const g = x.createLinearGradient(0, y - 1, 0, y + 7);
    g.addColorStop(0, 'rgba(6,18,20,0.75)'); g.addColorStop(1, 'rgba(6,18,20,0)');
    x.fillStyle = g; x.fillRect(cx - w, y - 1, w * 2, 8);
  }

  // ------------------------------------------------------------ palettes des variantes [feuillage, ombre, lumière]
  const TREE_P = { 0: ['#4aa23e', '#2b7034', '#8ad25e'], 1: ['#3f9648', '#276440', '#74c868'], 2: ['#58aa3a', '#36782e', '#98d856'],
    5: ['#e2802c', '#a84a1c', '#ffbe5a'], 6: ['#d0503a', '#8e2a20', '#f48a5a'], 7: ['#e4b434', '#a87e1c', '#ffe27a'],
    8: ['#2c7040', '#18462a', '#4a9a52'], 9: ['#3a9676', '#226856', '#72c8a2'], 10: ['#2e6a4c', '#1a4434', '#56966c'], 11: ['#9cbac4', '#6a8a98', '#dcecf0'],
    12: ['#6aa24a', '#3e6e3a', '#a8d070'], 13: ['#5e9a48', '#35663a', '#9ccc68'] };
  function paintTree(x, v) {
    const P = TREE_P[v] || TREE_P[0], seed = 40 + v * 7;
    trunk(x, { cx: 18, top: 27, base: 45, w: 7.6, bark: v === 8 ? '#5a3a22' : v === 9 ? '#6a5a3a' : '#7a5230' });
    crownShadow(x, 18, 28, 5);
    crown(x, { seed, cx: 18, cy: 16, rx: 15, ry: 12.5, P });
    if (v === 9) { x.fillStyle = 'rgba(110,180,80,0.85)'; x.beginPath(); x.ellipse(16.5, 37, 2.2, 4.5, 0.1, 0, 7); x.fill(); }
    if (v === 12 || v === 13) {   // FLEURS : des centaines de petites fleurs à 5 pétales sur la couronne, plus claires au soleil
      const petal = v === 12 ? ['#f6a8c8', '#ffd2e4', '#fff0f6'] : ['#f2eadc', '#fff8ec', '#ffffff'], heart = v === 12 ? '#e0607a' : '#f0c040';
      for (let i = 0; i < 140; i++) {
        const a = hash(v, i, 921) * Math.PI * 2, d = Math.sqrt(hash(v, i, 922)) * 0.92, px = 18 + Math.cos(a) * 15 * d, py = 16 + Math.sin(a) * 12.5 * d;
        const L = lit(px, py, 18, 16, 15, 12.5) + (hash(v, i, 923) - 0.5) * 0.4;
        if (L < -0.55 && hash(v, i, 924) < 0.6) continue;   // moins de fleurs dans l'ombre : on y voit les feuilles
        const r = 0.75 + hash(v, i, 925) * 0.45, col = petal[L > 0.35 ? 2 : L > -0.15 ? 1 : 0];
        x.fillStyle = col;
        for (let k = 0; k < 5; k++) { const b = k / 5 * Math.PI * 2 + i; x.beginPath(); x.arc(px + Math.cos(b) * r * 0.9, py + Math.sin(b) * r * 0.9, r * 0.62, 0, 7); x.fill(); }
        x.fillStyle = heart; x.fillRect(px - 0.3, py - 0.3, 0.6, 0.6);
      }
    }
    if (v === 10 || v === 11) for (let i = 0; i < 9; i++) {   // neige posée sur le haut des grappes
      const px = 18 + (hash(v, i, 931) - 0.5) * 26, py = 6 + hash(v, i, 932) * 14, r = 3 + hash(v, i, 933) * 3;
      x.fillStyle = '#f6faff'; x.beginPath(); x.ellipse(px, py, r, r * 0.45, 0, Math.PI, 0); x.fill();
      x.fillStyle = '#ffffff'; x.fillRect(px - r * 0.5, py - r * 0.4, r * 0.6, 0.5);
    }
  }
  function paintOak(x, v) {
    const P = v === 1 ? ['#c8682a', '#8e441c', '#f0a050'] : ['#327f42', '#1c5630', '#62ae58'];
    trunk(x, { cx: 18, top: 27, base: 45, w: 9.5, bark: '#5e3e24' });
    crownShadow(x, 18, 28, 6);
    crown(x, { seed: 7 + v, cx: 18, cy: 16.5, rx: 15.5, ry: 13.5, P, n: 22 });
  }
  function paintBirch(x, v) {
    const P = v === 1 ? ['#e8c83a', '#b08e20', '#fff07a'] : ['#8ccc50', '#58a03a', '#c4ec78'];
    // tronc clair taché de noir
    const g = x.createLinearGradient(15, 0, 21, 0); g.addColorStop(0, '#fbfaf2'); g.addColorStop(1, '#bfbcae');
    x.fillStyle = g; x.beginPath(); x.moveTo(15.6, 22); x.lineTo(20.2, 22); x.lineTo(21, 45); x.lineTo(15, 45); x.fill();
    x.fillStyle = '#2a2a28'; for (const y of [27, 31, 35, 39, 42]) { x.fillRect(15.6 + (y % 3), y, 2.2, 0.8); }
    crownShadow(x, 18, 23, 4);
    crown(x, { seed: 13 + v, cx: 18, cy: 15, rx: 13, ry: 12, P, n: 16 });
  }

  // pinceaux partagés avec les autres dessins peints (gfx/peints.js)
  DW.World.Paint = { crown, trunk, rgb, mix, hex, COOL, WARM, INK };

  // les arbres feuillus passent au pinceau ; les variantes nues gardent leur ancien dessin (draw)
  OBJ.tree.paint = (x, v) => (v === 3 ? paintOak(x, 0) : v === 4 ? paintBirch(x, 0) : paintTree(x, v));
  OBJ.tree.painted = v => v !== 14 && v !== 15;
  OBJ.oak.paint = paintOak; OBJ.oak.painted = v => v < 2;
  OBJ.birch.paint = paintBirch; OBJ.birch.painted = v => v < 2;
})();
