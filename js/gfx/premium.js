'use strict';
// =====================================================================
//  DÉCORS PEINTS DES BIOMES PILOTES (forêt, montagne, côte) — au même pinceau que les arbres (gfx/arbres.js) :
//  lumière en haut à gauche, ombres froides en bas à droite, contour sombre discret, touches de lumière chaude,
//  haute définition (pas de pixels étirés). Chaque variante change la SILHOUETTE (pas seulement la couleur).
//  Boîte de dessin : w × h (en pixels du jeu), le sol est en bas (y = h). plat = on marche dessus (sous le héros).
//  Tous ces décors sont dans la bibliothèque de l'atelier des cartes (dev/editeur) et dans ses pinceaux de biome.
// =====================================================================
(function () {
  const OBJ = DW.World.OBJ, Art = DW.Art, hash = Art.hash, P = DW.World.Paint;
  const { rgb, mix, hex, COOL, WARM, INK } = P;
  const LX = -0.6, LY = -0.8;
  const TAU = Math.PI * 2;

  // ------------------------------------------------------------ outils de peinture
  // ombre de contact au sol
  const contact = (x, cx, cy, rx, ry, a = 0.28) => { x.fillStyle = `rgba(12,24,16,${a})`; x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, TAU); x.fill(); };
  // contour lissé passant par des points (fermé)
  function smooth(x, pts) {
    x.beginPath();
    const n = pts.length, m = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const s = m(pts[n - 1], pts[0]); x.moveTo(s[0], s[1]);
    for (let i = 0; i < n; i++) { const p = pts[i], q = m(p, pts[(i + 1) % n]); x.quadraticCurveTo(p[0], p[1], q[0], q[1]); }
    x.closePath();
  }
  // forme irrégulière autour d'un centre (rochers, buissons) : rayon modulé par la graine
  function lump(cx, cy, rx, ry, seed, n = 11, irr = 0.22, flatBottom = 0.6) {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = i / n * TAU - Math.PI / 2, k = 1 - irr / 2 + hash(seed, i, 41) * irr;
      let y = cy + Math.sin(a) * ry * k; if (Math.sin(a) > 0) y = cy + Math.sin(a) * ry * k * flatBottom;   // (posé : dessous aplati)
      pts.push([cx + Math.cos(a) * rx * k, y]);
    }
    return pts;
  }
  // un ROCHER peint : silhouette irrégulière, dégradé de volume, facettes claires en haut à gauche, fissure, contour
  // pal : [sombre, moyen, clair] ; o.moss : mousse sur le dessus ; o.wet : reflets mouillés (rochers côtiers)
  function rock(x, cx, cy, rx, ry, pal, seed, o = {}) {
    const pts = lump(cx, cy, rx, ry, seed, 12, 0.26), D = hex(pal[0]), M = hex(pal[1]), L = hex(pal[2]);
    smooth(x, pts); x.fillStyle = rgb(mix(D, INK, 0.45)); x.save(); x.translate(0.5, 0.6); x.fill(); x.restore();   // contour / ombre portée
    smooth(x, pts);
    const g = x.createRadialGradient(cx - rx * 0.4, cy - ry * 0.5, 0.5, cx, cy, Math.max(rx, ry) * 1.25);
    g.addColorStop(0, rgb(mix(L, WARM, 0.15))); g.addColorStop(0.45, rgb(M)); g.addColorStop(1, rgb(mix(D, COOL, 0.3)));
    x.fillStyle = g; x.fill();
    x.save(); smooth(x, pts); x.clip();
    // facettes : plans plus clairs en haut à gauche, plus sombres à droite
    for (let i = 0; i < 5; i++) {
      const a = -2.4 + hash(seed, i, 42) * 1.6, d = 0.25 + hash(seed, i, 43) * 0.5, fx = cx + Math.cos(a) * rx * d, fy = cy + Math.sin(a) * ry * d;
      x.fillStyle = rgb(mix(M, L, 0.55 + hash(seed, i, 44) * 0.4), 0.55);
      x.beginPath(); x.moveTo(fx, fy); x.lineTo(fx + rx * 0.35, fy - ry * 0.1); x.lineTo(fx + rx * 0.15, fy + ry * 0.28); x.closePath(); x.fill();
    }
    x.fillStyle = rgb(mix(D, COOL, 0.4), 0.45); x.beginPath(); x.ellipse(cx + rx * 0.35, cy + ry * 0.35, rx * 0.6, ry * 0.45, -0.3, 0, TAU); x.fill();
    // fissure
    x.strokeStyle = rgb(mix(D, INK, 0.3), 0.7); x.lineWidth = 0.5;
    const fx = cx + (hash(seed, 9, 45) - 0.3) * rx * 0.6; x.beginPath(); x.moveTo(fx, cy - ry * 0.6); x.lineTo(fx + 1.2, cy - ry * 0.1); x.lineTo(fx + 0.4, cy + ry * 0.35); x.stroke();
    if (o.wet) { x.fillStyle = 'rgba(220,240,255,0.55)'; for (let i = 0; i < 4; i++) x.fillRect(cx - rx * 0.5 + hash(seed, i, 46) * rx * 0.6, cy - ry * 0.55 + hash(seed, i, 47) * ry * 0.5, 1.2, 0.5); }
    x.restore();
    // liseré de lumière en haut à gauche
    x.save(); smooth(x, pts); x.clip(); x.strokeStyle = rgb(mix(L, WARM, 0.5), 0.7); x.lineWidth = 0.9; x.translate(0.6, 0.8); smooth(x, pts); x.stroke(); x.restore();
    if (o.moss) moss(x, cx, cy - ry * 0.55, rx * 0.85, ry * 0.45, seed, o.moss);
    return pts;
  }
  // MOUSSE : coussin vert posé sur le dessus, festonné, avec des touches claires
  function moss(x, cx, cy, rx, ry, seed, col = '#4f8a32') {
    const C = hex(col), pts = lump(cx, cy, rx, ry, seed + 7, 10, 0.4, 0.5);
    smooth(x, pts); x.fillStyle = rgb(mix(C, INK, 0.35)); x.fill();
    x.save(); x.translate(-0.2, -0.4); smooth(x, pts); x.fillStyle = rgb(C); x.fill(); x.restore();
    for (let i = 0; i < 14; i++) { const a = hash(seed, i, 48) * TAU, d = Math.sqrt(hash(seed, i, 49)) * 0.8; x.fillStyle = rgb(mix(C, '#d8f088', 0.35 + hash(seed, i, 50) * 0.4), 0.85); x.beginPath(); x.arc(cx + Math.cos(a) * rx * d - 0.4, cy + Math.sin(a) * ry * d - 0.5, 0.6 + hash(seed, i, 51) * 0.6, 0, TAU); x.fill(); }
    for (let i = 0; i < 5; i++) { const px = cx - rx * 0.8 + hash(seed, i, 52) * rx * 1.6; x.strokeStyle = rgb(mix(C, INK, 0.2), 0.8); x.lineWidth = 0.6; x.beginPath(); x.moveTo(px, cy + ry * 0.4); x.lineTo(px + 0.3, cy + ry * 0.4 + 1.5 + hash(seed, i, 53) * 2.5); x.stroke(); }   // mousse qui pend
  }
  // FRONDE DE FOUGÈRE : tige courbe + folioles de part et d'autre, plus petites vers la pointe
  function frond(x, x0, y0, len, ang, curl, col, seed) {
    const C = hex(col), N = 9, pts = [];
    for (let k = 0; k <= N; k++) { const t = k / N, a = ang + curl * t * t; pts.push([x0 + Math.cos(a) * len * t, y0 + Math.sin(a) * len * t]); }
    for (let k = 1; k < N; k++) {
      const [px, py] = pts[k], [qx, qy] = pts[k + 1], dir = Math.atan2(qy - py, qx - px), sz = Math.sin((1 - k / N) * Math.PI * 0.85 + 0.25) * len * 0.24 + 0.7;
      for (const s of [-1, 1]) {
        const la = dir + s * 1.15, ex = px + Math.cos(la) * sz, ey = py + Math.sin(la) * sz;
        const L = (Math.cos(la) * LX + Math.sin(la) * LY) * 0.5 + 0.5;
        x.fillStyle = rgb(mix(mix(C, COOL, 0.35), mix(C, WARM, 0.35), L)); x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo((px + ex) / 2 + Math.cos(dir) * sz * 0.4, (py + ey) / 2 + Math.sin(dir) * sz * 0.4, ex, ey); x.quadraticCurveTo((px + ex) / 2 - Math.cos(dir) * sz * 0.1, (py + ey) / 2 - Math.sin(dir) * sz * 0.1, px, py); x.fill();
      }
    }
    x.strokeStyle = rgb(mix(C, INK, 0.5)); x.lineWidth = 0.55; x.beginPath(); pts.forEach((p, i) => (i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]))); x.stroke();
  }
  // GRANDE FEUILLE : amande pointue, deux tons séparés par la nervure (moitié éclairée / moitié à l'ombre), contour sombre
  function leaf(x, bx, by, ang, len, wid, col, o = {}) {
    const C = hex(col), ca = Math.cos(ang), sa = Math.sin(ang), nx = -sa, ny = ca, bend = o.bend || 0;
    const at = (t, side) => { const w = Math.sin(Math.PI * Math.pow(t, 0.8)) * wid * (side ? 1 : 0.92); const b = bend * t * t * len; return [bx + ca * len * t + nx * (side * w + b), by + sa * len * t + ny * (side * w + b)]; };
    const half = side => { const pts = []; for (let k = 0; k <= 10; k++) pts.push(at(k / 10, side)); return pts; };
    const Lp = half(-1), Rp = half(1), mid = half(0);
    const L = nx * LX + ny * LY;   // la moitié tournée vers la lumière
    const lightSide = L < 0 ? Lp : Rp, darkSide = L < 0 ? Rp : Lp;
    const poly = (A, B) => { x.beginPath(); A.forEach((p, k) => (k ? x.lineTo(...p) : x.moveTo(...p))); for (let k = B.length - 1; k >= 0; k--) x.lineTo(...B[k]); x.closePath(); };
    poly(Lp, Rp); x.strokeStyle = rgb(mix(C, INK, 0.62)); x.lineWidth = o.ol || 0.9; x.stroke();
    poly(lightSide, mid); x.fillStyle = rgb(mix(C, WARM, 0.18 + (o.lit || 0) * 0.25)); x.fill();
    poly(darkSide, mid); x.fillStyle = rgb(mix(C, COOL, 0.32)); x.fill();
    x.strokeStyle = rgb(mix(C, WARM, 0.5), 0.8); x.lineWidth = 0.4; x.beginPath(); mid.slice(0, 9).forEach((p, k) => (k ? x.lineTo(...p) : x.moveTo(...p))); x.stroke();
  }
  // PALME DÉCOUPÉE : longue feuille arquée en lobes (encoches), face du dessus claire, dessous sombre, nervure claire
  function palme(x, bx, by, ang, len, wid, droop, col, seed) {
    const C = hex(col), N = 22, pts = [];
    for (let k = 0; k <= N; k++) { const t = k / N; pts.push([bx + Math.cos(ang) * len * t, by + Math.sin(ang) * len * t + droop * len * t * t]); }
    const nrm = k => { const a = pts[Math.max(0, k - 1)], b = pts[Math.min(N, k + 1)], d = Math.atan2(b[1] - a[1], b[0] - a[0]); return [-Math.sin(d), Math.cos(d)]; };
    const edge = side => pts.map((p, k) => { const t = k / N, notch = (k % 3 === 0 && k > 1 && k < N - 1) ? 0.35 : 1, w = Math.sin(Math.PI * Math.min(1, t * 1.15)) * wid * notch * (side > 0 ? 1.1 : 0.8); const [nx, ny] = nrm(k); return [p[0] + nx * w * side, p[1] + ny * w * side + (side > 0 ? w * 0.25 : 0)]; });
    const A = edge(1), B = edge(-1);
    const poly = (U, V) => { x.beginPath(); U.forEach((p, k) => (k ? x.lineTo(...p) : x.moveTo(...p))); for (let k = V.length - 1; k >= 0; k--) x.lineTo(...V[k]); x.closePath(); };
    poly(A, B); x.strokeStyle = rgb(mix(C, INK, 0.6)); x.lineWidth = 1; x.stroke();
    poly(A, pts); x.fillStyle = rgb(mix(C, COOL, 0.3)); x.fill();          // dessous (vers le bas) : ombre
    poly(B, pts); x.fillStyle = rgb(mix(C, WARM, 0.28)); x.fill();          // dessus : lumière
    x.strokeStyle = rgb(mix(C, '#f0f0a0', 0.55)); x.lineWidth = 0.6; x.beginPath(); pts.slice(0, N - 2).forEach((p, k) => (k ? x.lineTo(...p) : x.moveTo(...p))); x.stroke();
  }
  // petite fleur à 5 pétales
  const flower = (x, px, py, r, petal, heart) => { x.fillStyle = petal; for (let k = 0; k < 5; k++) { const b = k / 5 * TAU; x.beginPath(); x.arc(px + Math.cos(b) * r * 0.9, py + Math.sin(b) * r * 0.9, r * 0.62, 0, TAU); x.fill(); } x.fillStyle = heart; x.fillRect(px - 0.35, py - 0.35, 0.7, 0.7); };
  const def = (k, o) => { OBJ[k] = { n: 1, noOutline: true, ...o }; OBJ[k].draw = d => d.rect(0, 0, 1, 1, '#000');   // (« draw » de secours : jamais utilisé, le dessin passe par « paint »)
  };

  // =================================================================== FORÊT
  // ARBRE COUCHÉ : grand tronc tombé, écorce en cylindre (clair dessus), bout cassé en échardes, bout scié aux cernes,
  // mousse ; v 1 : couvert de champignons en console et de jeunes fougères
  def('troncouche', { w: 56, h: 24, n: 2, scale: 1.25, paint(x, v) {
    const y = 15, r = 6.2, x0 = 5, x1 = 50, B = hex('#6e4a2c'), lite = mix(B, '#ffd8a8', 0.4), dk = mix(B, COOL, 0.55);
    contact(x, 28, 21.5, 25, 2.6);
    const body = () => { x.beginPath(); x.moveTo(x0 + 2, y - r); x.lineTo(x1, y - r + 1); x.quadraticCurveTo(x1 + 3, y, x1, y + r - 0.5); x.lineTo(x0 + 2, y + r); for (let k = 0; k <= 6; k++) x.lineTo(x0 - (k % 2 ? 2.5 : 0) + hash(v, k, 61) * 1.5, y + r - k * (2 * r / 6)); x.closePath(); };
    x.fillStyle = rgb(mix(dk, INK, 0.5)); x.save(); x.translate(0.6, 0.7); body(); x.fill(); x.restore();
    const g = x.createLinearGradient(0, y - r, 0, y + r); g.addColorStop(0, rgb(lite)); g.addColorStop(0.35, rgb(B)); g.addColorStop(1, rgb(dk));
    body(); x.fillStyle = g; x.fill();
    x.save(); body(); x.clip();
    for (let k = 0; k < 7; k++) { const yy = y - r + 1.5 + k * 1.7 + hash(v, k, 62) * 0.6; x.strokeStyle = rgb(mix(dk, INK, 0.3), 0.6); x.lineWidth = 0.5; x.beginPath(); for (let xx = x0; xx <= x1; xx += 3) x.lineTo(xx, yy + Math.sin(xx * 0.4 + k) * 0.4); x.stroke(); }
    x.restore();
    // bout scié : cernes
    x.fillStyle = rgb(mix(B, '#e8c08a', 0.55)); x.beginPath(); x.ellipse(x1, y, 2.6, r - 0.6, 0, 0, TAU); x.fill();
    x.strokeStyle = rgb(mix(B, INK, 0.2), 0.55); x.lineWidth = 0.4; for (const rr of [0.7, 0.45, 0.22]) { x.beginPath(); x.ellipse(x1, y, 2.6 * rr, (r - 0.6) * rr, 0, 0, TAU); x.stroke(); }
    // échardes du bout cassé
    x.fillStyle = rgb(mix(B, '#f0d0a0', 0.5)); for (let k = 0; k < 4; k++) { const yy = y - r + 2 + k * 3; x.beginPath(); x.moveTo(x0 + 1, yy); x.lineTo(x0 - 3 - hash(v, k, 63) * 2, yy + 0.8); x.lineTo(x0 + 1, yy + 1.6); x.fill(); }
    moss(x, 22, y - r + 0.6, 9, 2.2, 5 + v, '#5a9436'); moss(x, 39, y - r + 1, 5, 1.6, 9 + v, '#4e8a30');
    if (v === 1) {
      for (const [cx, cy, s] of [[16, y + 1, 3], [27, y + 2.5, 2.4], [34, y + 0.5, 2.8]]) {   // champignons en console
        x.fillStyle = rgb(hex('#5a3a1e')); x.beginPath(); x.ellipse(cx + 0.3, cy + 0.6, s * 1.1, s * 0.5, 0, 0, Math.PI); x.fill();
        x.fillStyle = rgb(hex('#e8b060')); x.beginPath(); x.ellipse(cx, cy, s, s * 0.45, 0, Math.PI, TAU); x.fill();
        x.fillStyle = rgb(hex('#c88a40')); x.beginPath(); x.ellipse(cx, cy, s, s * 0.3, 0, 0, Math.PI); x.fill();
        x.fillStyle = 'rgba(255,240,200,0.8)'; x.fillRect(cx - s * 0.6, cy - s * 0.3, s * 0.6, 0.5);
      }
      frond(x, 44, y - r + 1, 7, -2.2, 0.8, '#5aa040', 3); frond(x, 45, y - r + 1, 6, -1.2, -0.6, '#4a9038', 4);
    }
  } });

  // JEUNES POUSSES : v 0 jeune chêne (couronne ronde), v 1 jeune bouleau (fût blanc, couronne claire), v 2 jeune sapin
  def('pousse', { w: 18, h: 30, n: 3, scale: 1.2, paint(x, v) {
    contact(x, 9, 28.5, 4.5, 1.3);
    if (v === 2) {
      x.fillStyle = rgb(hex('#5a3a22')); x.fillRect(8.4, 22, 1.4, 7);
      for (let k = 0; k < 4; k++) {
        const ty = 8 + k * 5, hw = 3 + k * 1.6, C = hex('#2e6a3a');
        x.fillStyle = rgb(mix(C, INK, 0.45)); x.beginPath(); x.moveTo(9, ty - 5.5); x.lineTo(9 + hw + 0.6, ty + 1.2); x.lineTo(9 - hw - 0.6, ty + 1.2); x.closePath(); x.fill();
        const g = x.createLinearGradient(9 - hw, 0, 9 + hw, 0); g.addColorStop(0, rgb(mix(C, WARM, 0.35))); g.addColorStop(0.5, rgb(C)); g.addColorStop(1, rgb(mix(C, COOL, 0.45)));
        x.fillStyle = g; x.beginPath(); x.moveTo(9, ty - 5); x.quadraticCurveTo(9 + hw * 0.5, ty - 1, 9 + hw, ty + 0.8); x.lineTo(9 - hw, ty + 0.8); x.quadraticCurveTo(9 - hw * 0.5, ty - 1, 9, ty - 5); x.fill();
      }
      return;
    }
    const birch = v === 1;
    P.trunk(x, { cx: 9, top: 15, base: 28.5, w: 2.4, seed: 7 + v, bark: birch ? '#e8e4da' : '#6e4a2c', roots: 2, smooth: birch });
    if (birch) { x.fillStyle = '#2a2a2a'; for (let k = 0; k < 4; k++) x.fillRect(8.2 + (k % 2) * 0.9, 17 + k * 2.6, 1.2, 0.5); }
    P.crown(x, { seed: 70 + v * 9, cx: 9, cy: 10, rx: 7, ry: 6.5, n: 10, touches: 50, leaf: 0.7, P: birch ? ['#5aa848', '#3e8a3a', '#a8dc6a'] : ['#3f8a38', '#2a6a2c', '#7cc054'] });
  } });

  // SAULE PLEUREUR : couronne en dôme d'où tombent des rideaux de feuilles fines jusqu'au sol
  def('saule', { w: 50, h: 56, n: 1, scale: 1.5, big: true, paint(x) {
    contact(x, 25, 53, 18, 3, 0.25);
    P.trunk(x, { cx: 25, top: 26, base: 53, w: 6, seed: 21, bark: '#5e4630', roots: 3 });
    P.crown(x, { seed: 33, cx: 25, cy: 18, rx: 19, ry: 12, n: 16, touches: 120, P: ['#6aa84a', '#3e7a36', '#bfe27a'] });
    for (let i = 0; i < 46; i++) {   // rideaux de feuilles
      const a = i / 46, sx = 7 + a * 36 + (hash(1, i, 71) - 0.5) * 2, sy = 15 + Math.abs(a - 0.5) * 10 + hash(1, i, 72) * 4, len = 18 + hash(1, i, 73) * 16 - Math.abs(a - 0.5) * 12;
      const L = 1 - a, col = mix(mix(hex('#3e7a36'), COOL, 0.25), mix(hex('#bfe27a'), WARM, 0.2), L * 0.8 + (hash(1, i, 74) - 0.5) * 0.3);
      x.strokeStyle = rgb(mix(col, INK, 0.25), 0.9); x.lineWidth = 0.7;
      x.beginPath(); x.moveTo(sx, sy); x.quadraticCurveTo(sx + (a - 0.5) * 3, sy + len * 0.6, sx + (a - 0.5) * 6 + 0.5, sy + len); x.stroke();
      x.fillStyle = rgb(col); for (let k = 2; k < len; k += 2.2) { const t = k / len, px = sx + (a - 0.5) * 6 * t * t + 0.3, py = sy + k; x.beginPath(); x.ellipse(px + (k % 4 ? 0.6 : -0.6), py, 0.5, 1.1, (k % 4 ? 0.4 : -0.4), 0, TAU); x.fill(); }
    }
  } });

  // FOUGÈRES : bouquet de frondes qui jaillissent du sol ; v 0 fougère commune, v 1 fougère arquée (frondes longues
  // et retombantes), v 2 fougère royale rousse (port dressé)
  def('fougeres', { w: 30, h: 24, n: 3, scale: 1.2, paint(x, v) {
    contact(x, 15, 22.5, 9, 1.8, 0.22);
    const C = ['#4e9a3a', '#5aa846', '#b0782e'][v], n = [11, 9, 8][v], len = [15, 19, 17][v], curl = [0.9, 1.5, 0.35][v], spread = [2.6, 3, 1.7][v];
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0.5 : i / (n - 1), ang = -Math.PI / 2 + (t - 0.5) * spread, s = t < 0.5 ? -1 : 1;
      frond(x, 15 + (t - 0.5) * 3, 22, len * (0.75 + hash(v, i, 81) * 0.35) * (1 - Math.abs(t - 0.5) * 0.3), ang, s * curl * (0.5 + Math.abs(t - 0.5)), C, v * 10 + i);
    }
    if (v === 2) { x.fillStyle = rgb(hex('#e0b860')); for (let i = 0; i < 3; i++) { x.beginPath(); x.ellipse(13 + i * 2, 4 + i, 0.8, 2, 0, 0, TAU); x.fill(); } }   // épis fertiles
  } });

  // CHAMPIGNONS : v 0 amanites (chapeaux rouges à points blancs), v 1 cèpes (pied épais, chapeau brun luisant),
  // v 2 champignons lumineux (chapeaux bleus translucides, halo)
  def('champignons', { w: 24, h: 20, n: 3, paint(x, v) {
    contact(x, 12, 18.6, 8, 1.6, 0.22);
    const set = [[[7, 18, 4.2, 9], [14, 18.5, 3, 6], [18, 18.6, 2.2, 4]], [[9, 18.5, 4.6, 7], [16, 18.6, 3.4, 5]], [[6, 18.4, 3, 8], [11, 18.6, 3.6, 11], [17, 18.6, 2.6, 7]]][v];
    for (const [cx, by, cr, hgt] of set) {
      const top = by - hgt;
      if (v === 2) { const g = x.createRadialGradient(cx, top, 0.5, cx, top, cr * 3); g.addColorStop(0, 'rgba(140,230,255,0.45)'); g.addColorStop(1, 'rgba(140,230,255,0)'); x.fillStyle = g; x.beginPath(); x.arc(cx, top, cr * 3, 0, TAU); x.fill(); }
      const sw = v === 1 ? cr * 0.55 : cr * 0.32;   // pied
      const gs = x.createLinearGradient(cx - sw, 0, cx + sw, 0); gs.addColorStop(0, '#fffaf0'); gs.addColorStop(1, v === 1 ? '#c8b088' : '#d8d0c0');
      x.fillStyle = gs; x.beginPath(); x.moveTo(cx - sw * 0.8, top + 1); x.quadraticCurveTo(cx - sw * 1.3, by - 1, cx - sw, by); x.lineTo(cx + sw, by); x.quadraticCurveTo(cx + sw * 1.2, by - 1, cx + sw * 0.8, top + 1); x.fill();
      const capC = hex(['#d8342a', '#8a5226', '#4ab8e8'][v]);
      x.fillStyle = rgb(mix(capC, INK, 0.45)); x.beginPath(); x.ellipse(cx + 0.3, top + 0.4, cr + 0.4, cr * 0.72, 0, Math.PI, TAU); x.fill();
      const gc = x.createRadialGradient(cx - cr * 0.4, top - cr * 0.5, 0.3, cx, top, cr * 1.2); gc.addColorStop(0, rgb(mix(capC, WARM, 0.45))); gc.addColorStop(0.6, rgb(capC)); gc.addColorStop(1, rgb(mix(capC, COOL, 0.4)));
      x.fillStyle = gc; x.beginPath(); x.ellipse(cx, top, cr, cr * 0.7, 0, Math.PI, TAU); x.lineTo(cx + cr, top + 0.6); x.quadraticCurveTo(cx, top + 1.6, cx - cr, top + 0.6); x.fill();
      if (v === 0) { x.fillStyle = '#fff8ee'; for (let k = 0; k < 5; k++) { x.beginPath(); x.arc(cx - cr * 0.6 + hash(cx, k, 91) * cr * 1.2, top - cr * 0.15 - hash(cx, k, 92) * cr * 0.45, 0.35 + hash(cx, k, 93) * 0.35, 0, TAU); x.fill(); } }
      x.fillStyle = v === 2 ? 'rgba(230,255,255,0.9)' : 'rgba(255,245,220,0.7)'; x.beginPath(); x.ellipse(cx - cr * 0.4, top - cr * 0.4, cr * 0.3, cr * 0.12, -0.4, 0, TAU); x.fill();
    }
  } });

  // BRANCHES MORTES (au sol, on marche dessus) : rameaux secs croisés et quelques feuilles
  def('branchesmortes', { w: 30, h: 12, n: 2, plat: true, paint(x, v) {
    const B = hex('#7a5634');
    for (let i = 0; i < 4 + v; i++) {
      const x0 = 3 + hash(v, i, 101) * 12, y0 = 4 + hash(v, i, 102) * 6, a = -0.3 + hash(v, i, 103) * 0.6, len = 10 + hash(v, i, 104) * 12;
      const x1 = x0 + Math.cos(a) * len, y1 = y0 + Math.sin(a) * len * 0.4;
      x.strokeStyle = rgb(mix(B, INK, 0.5)); x.lineWidth = 1.6; x.lineCap = 'round'; x.beginPath(); x.moveTo(x0, y0 + 0.4); x.lineTo(x1, y1 + 0.4); x.stroke();
      x.strokeStyle = rgb(mix(B, '#e0b880', 0.3)); x.lineWidth = 1; x.beginPath(); x.moveTo(x0, y0); x.lineTo(x1, y1); x.stroke();
      const mx = (x0 + x1) / 2, my = (y0 + y1) / 2; x.lineWidth = 0.6; x.beginPath(); x.moveTo(mx, my); x.lineTo(mx + 3, my - 2); x.stroke();
    }
    for (let i = 0; i < 6; i++) { x.fillStyle = ['#c8742a', '#a85a22', '#d8a040'][i % 3]; x.beginPath(); x.ellipse(4 + hash(v, i, 105) * 22, 3 + hash(v, i, 106) * 7, 1.4, 0.8, hash(v, i, 107) * 3, 0, TAU); x.fill(); }
  } });

  // FEUILLES MORTES (tapis au sol) : v 0 rousses, v 1 dorées, v 2 brunes ; nappe ovale irrégulière
  def('feuillesmortes', { w: 34, h: 16, n: 3, plat: true, paint(x, v) {
    const pal = [['#c8501e', '#e07a2a', '#a83a18', '#f0a040'], ['#e0b030', '#f0d060', '#c89020', '#a8c040'], ['#8a5a30', '#a87040', '#6a4224', '#c09060']][v];
    for (let i = 0; i < 70; i++) {
      const a = hash(v, i, 111) * TAU, d = Math.sqrt(hash(v, i, 112)), px = 17 + Math.cos(a) * 15 * d, py = 8 + Math.sin(a) * 6 * d, col = hex(pal[i % 4]);
      x.save(); x.translate(px, py); x.rotate(hash(v, i, 113) * TAU);
      x.fillStyle = rgb(mix(col, INK, 0.35)); x.beginPath(); x.ellipse(0.2, 0.3, 1.5, 0.9, 0, 0, TAU); x.fill();
      x.fillStyle = rgb(col); x.beginPath(); x.ellipse(0, 0, 1.4, 0.8, 0, 0, TAU); x.fill();
      x.strokeStyle = rgb(mix(col, INK, 0.4), 0.7); x.lineWidth = 0.25; x.beginPath(); x.moveTo(-1.3, 0); x.lineTo(1.3, 0); x.stroke();
      x.restore();
    }
  } });

  // ROCHERS MOUSSUS : trois rochers serrés, coussins de mousse, fougères au pied ; v 1 : rochers plus plats, lichen
  def('rochersmousse', { w: 42, h: 30, n: 2, scale: 1.2, paint(x, v) {
    contact(x, 21, 27.5, 18, 2.6);
    const pal = ['#4a5048', '#7a8276', '#b4bcae'];
    if (v === 0) { rock(x, 13, 21, 10, 7, pal, 3, { moss: '#4e8a30' }); rock(x, 28, 18, 12, 10, pal, 5, { moss: '#5a9436' }); rock(x, 21, 25, 6, 3.5, pal, 8); }
    else { rock(x, 15, 23, 13, 5.5, pal, 12, { moss: '#5a9436' }); rock(x, 31, 22, 9, 6, pal, 14); for (let i = 0; i < 6; i++) { x.fillStyle = ['#d8d890', '#b8c870', '#e8e0b0'][i % 3]; x.beginPath(); x.arc(27 + hash(i, 1, 121) * 8, 18 + hash(i, 2, 121) * 4, 0.8, 0, TAU); x.fill(); } }
    frond(x, 4, 27, 7, -1.9, 0.7, '#4e9a3a', 1); frond(x, 38, 27, 6, -1.2, -0.6, '#5aa846', 2);
  } });

  // BUISSONS FLEURIS : v 0 églantier blanc, v 1 rosier sauvage rose, v 2 genêt jaune (port plus haut, en épis)
  def('buissonfleuri', { w: 28, h: 22, n: 3, scale: 1.25, paint(x, v) {
    contact(x, 14, 20.5, 11, 2);
    if (v === 2) {   // genêt : tiges dressées couvertes de fleurs jaunes
      for (let i = 0; i < 12; i++) { const a = -Math.PI / 2 + (i / 11 - 0.5) * 1.6, len = 12 + hash(i, 3, 131) * 6; x.strokeStyle = rgb(hex('#3e7a2a')); x.lineWidth = 0.8; x.beginPath(); x.moveTo(14, 20); x.quadraticCurveTo(14 + Math.cos(a) * len * 0.4, 20 + Math.sin(a) * len * 0.6, 14 + Math.cos(a) * len, 20 + Math.sin(a) * len); x.stroke();
        for (let k = 4; k < len; k += 1.6) { const px = 14 + Math.cos(a) * k + 0.4, py = 20 + Math.sin(a) * k; x.fillStyle = k > len * 0.6 ? '#ffe060' : '#f0c020'; x.beginPath(); x.ellipse(px, py, 1, 0.7, a, 0, TAU); x.fill(); } }
      return;
    }
    P.crown(x, { seed: 140 + v, cx: 14, cy: 13, rx: 12, ry: 7.5, n: 12, touches: 70, leaf: 0.8, P: ['#3e8a3a', '#2a6a2c', '#7cc054'] });
    const petal = v === 0 ? ['#f4efe4', '#ffffff'] : ['#f08ab0', '#ffc0d8'], heart = v === 0 ? '#f0c040' : '#c04060';
    for (let i = 0; i < 26; i++) { const a = hash(v, i, 132) * TAU, d = Math.sqrt(hash(v, i, 133)) * 0.9, px = 14 + Math.cos(a) * 11 * d, py = 13 + Math.sin(a) * 6.5 * d; flower(x, px, py, 0.9 + hash(v, i, 134) * 0.4, petal[py < 12 ? 1 : 0], heart); }
  } });

  // MASSIF À GRANDES FEUILLES : touffe de larges feuilles pointues en étoile, chacune avec sa nervure et ses deux
  // tons, contour sombre ; v 0 vert tropical lumineux, v 1 sous-bois sombre (feuilles plus longues), v 2 houx à baies rouges
  def('feuillage', { w: 34, h: 34, n: 3, scale: 1.3, paint(x, v) {
    contact(x, 17, 31, 13, 2.2, 0.3);
    // DÔME de feuilles : 4 couches de l'arrière vers l'avant ; chaque feuille part d'un point du dôme et pointe vers
    // l'extérieur (vers le haut au fond, de côté et vers le bas devant) ; les feuilles se chevauchent
    const C = ['#3e9a30', '#2a6e34', '#2e7a3a'][v], lenB = [9, 11, 8][v], wid = [3, 2.8, 2.7][v], cx = 17, cy = 21;
    const F = [];
    for (let layer = 0; layer < 4; layer++) {
      const n = [7, 8, 8, 6][layer];
      for (let i = 0; i < n; i++) {
        const t = (i + 0.5) / n, side = (t - 0.5) * 2, by = cy - 5 + layer * 2.6 + Math.abs(side) * 1.5, bx = cx + side * (5 + layer);
        const a = -Math.PI / 2 + side * (0.7 + layer * 0.35) + (hash(v, layer * 10 + i, 241) - 0.5) * 0.35 + (layer === 3 ? side * 0.4 : 0);
        F.push({ bx, by, a, len: lenB * (0.8 + hash(v, layer * 10 + i, 242) * 0.4) * (layer === 3 ? 0.85 : 1), bend: (hash(v, layer * 10 + i, 243) - 0.5) * 0.3, lit: 0.55 - layer * 0.12 - side * 0.35, layer });
      }
    }
    F.sort((p, q) => p.layer - q.layer || p.by - q.by);
    for (const f of F) leaf(x, f.bx, f.by, f.a, f.len, wid, C, { bend: f.bend, lit: f.lit });
    for (let i = 0; i < 4; i++) leaf(x, cx + (i - 1.5) * 2.2, cy - 3, -Math.PI / 2 + (i - 1.5) * 0.35, 6 + hash(v, i, 244) * 2, 2.2, v === 1 ? '#3e8a40' : '#5ab040', { lit: 0.9 });   // jeunes feuilles au sommet
    if (v === 2) for (let i = 0; i < 9; i++) { const px = 9 + hash(i, 5, 245) * 16, py = 14 + hash(i, 6, 245) * 10; x.fillStyle = '#5a0a10'; x.beginPath(); x.arc(px + 0.3, py + 0.3, 1.3, 0, TAU); x.fill(); x.fillStyle = '#d8202a'; x.beginPath(); x.arc(px, py, 1.15, 0, TAU); x.fill(); x.fillStyle = '#ffb0a0'; x.fillRect(px - 0.6, py - 0.6, 0.5, 0.5); }
  } });

  // =================================================================== MONTAGNE
  // ÉBOULIS (on marche dessus) : pierres anguleuses de toutes tailles, chacune avec son ombre ; v 1 plus clairsemé
  def('eboulis', { w: 40, h: 18, n: 2, plat: true, paint(x, v) {
    const n = v ? 14 : 24;
    for (let i = 0; i < n; i++) {
      const a = hash(v, i, 141) * TAU, d = Math.sqrt(hash(v, i, 142)), px = 20 + Math.cos(a) * 18 * d, py = 9 + Math.sin(a) * 7 * d, s = 0.8 + hash(v, i, 143) * (i < 4 ? 2.6 : 1.4);
      x.fillStyle = 'rgba(20,24,20,0.35)'; x.beginPath(); x.ellipse(px + 0.5, py + s * 0.5, s, s * 0.45, 0, 0, TAU); x.fill();
      const pts = []; for (let k = 0; k < 5; k++) { const b = k / 5 * TAU + hash(i, k, 144); pts.push([px + Math.cos(b) * s * (0.8 + hash(i, k, 145) * 0.4), py + Math.sin(b) * s * 0.7]); }
      x.fillStyle = rgb(hex('#6e6a60')); x.beginPath(); pts.forEach((p, k) => (k ? x.lineTo(...p) : x.moveTo(...p))); x.closePath(); x.fill();
      x.fillStyle = rgb(hex('#b0aa98')); x.beginPath(); x.moveTo(pts[3][0], pts[3][1]); x.lineTo(pts[4][0], pts[4][1]); x.lineTo(px, py); x.closePath(); x.fill();
    }
  } });

  // AIGUILLE ROCHEUSE : colonne effilée en strates, face éclairée à gauche ; v 0 granit gris, v 1 grès ocre,
  // v 2 roche rouge — chacune avec sa propre silhouette (penchée, fendue, à deux pointes)
  def('aiguille', { w: 26, h: 52, n: 3, scale: 1.3, big: true, paint(x, v) {
    const pal = [['#3a3e44', '#6a7078', '#b0b6bc'], ['#6a4a2a', '#a8784a', '#e2bc84'], ['#5a2418', '#a04a30', '#e08860']][v].map(hex);
    contact(x, 13, 50, 10, 2.2, 0.3);
    const lean = [0, 2.5, -1.5][v], N = 9, L = [], R = [];
    for (let k = 0; k <= N; k++) { const t = k / N, y = 50 - t * 46, hw = (9.5 - t * 7.5) * (0.85 + hash(v, k, 151) * 0.3); L.push([13 - hw + lean * t, y]); R.push([13 + hw + lean * t, y]); }
    const path = () => { x.beginPath(); L.forEach((p, k) => (k ? x.lineTo(...p) : x.moveTo(...p))); if (v === 2) { x.lineTo(13 + lean - 1, 6); x.lineTo(13 + lean + 0.5, 2.5); x.lineTo(13 + lean + 1.5, 6); } for (let k = R.length - 1; k >= 0; k--) x.lineTo(...R[k]); x.closePath(); };
    x.fillStyle = rgb(mix(pal[0], INK, 0.45)); x.save(); x.translate(0.7, 0.4); path(); x.fill(); x.restore();
    const g = x.createLinearGradient(3, 0, 23, 0); g.addColorStop(0, rgb(mix(pal[2], WARM, 0.15))); g.addColorStop(0.4, rgb(pal[1])); g.addColorStop(1, rgb(mix(pal[0], COOL, 0.3)));
    path(); x.fillStyle = g; x.fill();
    x.save(); path(); x.clip();
    for (let k = 0; k < 11; k++) { const y = 48 - k * 4.3 - hash(v, k, 152) * 1.5; x.strokeStyle = rgb(mix(pal[0], INK, 0.3), 0.6); x.lineWidth = 0.6; x.beginPath(); x.moveTo(0, y + 0.8); x.lineTo(26, y - 0.6); x.stroke(); x.strokeStyle = rgb(pal[2], 0.45); x.lineWidth = 0.5; x.beginPath(); x.moveTo(0, y + 1.5); x.lineTo(14, y + 0.8); x.stroke(); }
    if (v === 1) { x.strokeStyle = rgb(mix(pal[0], INK, 0.5)); x.lineWidth = 0.9; x.beginPath(); x.moveTo(15, 10); x.lineTo(13.5, 22); x.lineTo(15.5, 34); x.stroke(); }   // grande fente
    x.fillStyle = rgb(mix(pal[0], COOL, 0.5), 0.35); x.fillRect(16 + lean * 0.5, 0, 12, 52);
    x.restore();
    for (let i = 0; i < 3; i++) { const t = 0.25 + i * 0.22, y = 50 - t * 46; frond(x, 13 - (9.5 - t * 7.5) + lean * t + 0.5, y, 4, -2.6, 0.5, '#5a9a3a', i); }   // touffes accrochées
    x.fillStyle = rgb(hex('#6aa840')); x.beginPath(); x.ellipse(13 + lean - 0.5, 5.5, 2.4, 1.1, 0, Math.PI, TAU); x.fill();   // herbe au sommet
  } });

  // CRISTAUX : bouquet de prismes à facettes qui brillent ; v 0 améthyste (en éventail), v 1 émeraude (un grand
  // et des petits), v 2 quartz (aiguilles fines) — halo lumineux
  def('cristaux', { w: 28, h: 30, n: 3, scale: 1.1, paint(x, v) {
    const C = hex(['#a868e0', '#3ac890', '#d8eef8'][v]);
    const g0 = x.createRadialGradient(14, 18, 1, 14, 18, 15); g0.addColorStop(0, rgb(mix(C, '#ffffff', 0.4), 0.45)); g0.addColorStop(1, rgb(C, 0)); x.fillStyle = g0; x.beginPath(); x.arc(14, 18, 15, 0, TAU); x.fill();
    rock(x, 14, 26, 11, 3.5, ['#3a3a44', '#5e5e6a', '#8a8a96'], 30 + v);
    const set = [[[14, 26, 20, -0.1, 3.4], [9, 26, 14, -0.5, 2.6], [19, 26, 15, 0.45, 2.6], [5.5, 26.5, 8, -0.8, 1.8], [22.5, 26.5, 9, 0.75, 1.8]],
      [[13, 26, 24, 0.05, 4.4], [8, 26.5, 10, -0.35, 2.4], [18.5, 26.5, 11, 0.35, 2.6]],
      [[14, 26, 22, 0, 1.6], [11, 26, 18, -0.25, 1.4], [17, 26, 19, 0.2, 1.5], [8, 26.5, 12, -0.5, 1.2], [20, 26.5, 13, 0.45, 1.2], [15.5, 26, 14, 0.1, 1.1]]][v];
    for (const [bx, by, len, a, w] of set) {
      const tx = bx + Math.sin(a) * len, ty = by - Math.cos(a) * len, nx = Math.cos(a) * w, ny = Math.sin(a) * w;
      const tip = [tx + Math.sin(a) * w * 0.9, ty - Math.cos(a) * w * 0.9];
      x.fillStyle = rgb(mix(C, INK, 0.55)); x.beginPath(); x.moveTo(bx - nx - 0.4, by - ny); x.lineTo(tx - nx - 0.4, ty - ny); x.lineTo(tip[0], tip[1] - 0.5); x.lineTo(tx + nx + 0.4, ty + ny); x.lineTo(bx + nx + 0.4, by + ny); x.fill();
      x.fillStyle = rgb(mix(C, '#ffffff', 0.35)); x.beginPath(); x.moveTo(bx - nx, by - ny); x.lineTo(tx - nx, ty - ny); x.lineTo(tip[0], tip[1]); x.lineTo(bx, by); x.fill();   // face éclairée
      x.fillStyle = rgb(mix(C, COOL, 0.35)); x.beginPath(); x.moveTo(bx + nx, by + ny); x.lineTo(tx + nx, ty + ny); x.lineTo(tip[0], tip[1]); x.lineTo(bx, by); x.fill();   // face à l'ombre
      x.strokeStyle = 'rgba(255,255,255,0.8)'; x.lineWidth = 0.4; x.beginPath(); x.moveTo(bx - nx * 0.4, by - ny * 0.4 - 1); x.lineTo(tx - nx * 0.4, ty - ny * 0.4); x.stroke();
      x.fillStyle = '#ffffff'; x.fillRect(tip[0] - 0.4, tip[1] + 1, 0.8, 0.8);
    }
  } });

  // BLOCS EMPILÉS : gros rochers posés les uns sur les autres, petits cailloux au pied ; v 1 : grès ocre en table
  def('blocs', { w: 46, h: 36, n: 2, scale: 1.25, big: true, paint(x, v) {
    contact(x, 23, 33.5, 20, 2.6, 0.3);
    const pal = v ? ['#6a4a2a', '#a8784a', '#e2bc84'] : ['#3e4246', '#70767c', '#b8bec2'];
    if (v === 0) { rock(x, 13, 27, 11, 7, pal, 41); rock(x, 32, 26, 12, 8, pal, 43, { moss: '#5a9436' }); rock(x, 22, 15, 10, 8, pal, 45); }
    else { rock(x, 23, 28, 19, 6, pal, 51); rock(x, 23, 18, 15, 5, pal, 53); rock(x, 21, 9, 8, 4, pal, 55, { moss: '#7aa040' }); }
    for (let i = 0; i < 6; i++) rock(x, 4 + hash(v, i, 161) * 38, 32 + hash(v, i, 162) * 2, 1.2 + hash(v, i, 163), 0.9, pal, 60 + i);
  } });

  // PIN TORDU SUR SON ROCHER (montagne) : tronc noueux couché par le vent, plateaux d'aiguilles en nuages
  def('pintordu', { w: 38, h: 44, n: 1, scale: 1.4, big: true, paint(x) {
    contact(x, 19, 41.5, 15, 2.4, 0.3);
    rock(x, 18, 37, 14, 5.5, ['#3e4246', '#70767c', '#b8bec2'], 71, { moss: '#5a9436' });
    const B = hex('#5a3c26'), path = [[16, 34], [14, 27], [17, 21], [23, 16], [27, 12]];
    x.lineCap = 'round'; x.lineJoin = 'round';
    for (const [lw, c] of [[4.4, mix(B, INK, 0.55)], [3.4, B], [1.2, mix(B, '#e0b888', 0.4)]]) { x.strokeStyle = rgb(c); x.lineWidth = lw; x.beginPath(); path.forEach((p, i) => (i ? x.lineTo(p[0] - (lw === 1.2 ? 0.8 : 0), p[1]) : x.moveTo(p[0] - (lw === 1.2 ? 0.8 : 0), p[1]))); x.stroke(); }
    x.strokeStyle = rgb(B); x.lineWidth = 1.6; x.beginPath(); x.moveTo(17, 21); x.quadraticCurveTo(11, 18, 7, 19); x.stroke();
    for (const [cx, cy, rx, ry, s] of [[29, 11, 9, 3.4, 1], [8, 17, 7, 2.8, 2], [20, 16, 6, 2.4, 3]]) {   // plateaux d'aiguilles
      const C = hex('#2e5e34');
      x.fillStyle = rgb(mix(C, INK, 0.5)); x.beginPath(); x.ellipse(cx + 0.4, cy + 0.6, rx + 0.5, ry + 0.4, 0, 0, TAU); x.fill();
      for (let i = 0; i < 26; i++) { const a = hash(s, i, 171) * TAU, d = Math.sqrt(hash(s, i, 172)), px = cx + Math.cos(a) * rx * d, py = cy + Math.sin(a) * ry * d, L = (px - cx) / rx * LX + (py - cy) / ry * LY; x.fillStyle = rgb(mix(mix(C, COOL, 0.3), mix(hex('#6aa850'), WARM, 0.25), Math.max(0, Math.min(1, 0.5 + L * 0.6)))); x.beginPath(); x.ellipse(px, py, 1.6, 0.8, -0.2, 0, TAU); x.fill(); }
    }
  } });

  // =================================================================== CÔTE
  // ROCHER CÔTIER : roche sombre et mouillée, balanes blanches, algues au pied, ourlet d'écume ; v 0 rond,
  // v 1 plat et long, v 2 double pointe
  def('rochercotier', { w: 36, h: 28, n: 3, scale: 1.2, paint(x, v) {
    const pal = ['#2a3038', '#4e5a64', '#8a98a2'];
    if (v === 0) rock(x, 18, 18, 13, 9, pal, 81, { wet: true });
    else if (v === 1) rock(x, 18, 21, 16, 6, pal, 83, { wet: true });
    else { rock(x, 12, 18, 9, 9, pal, 85, { wet: true }); rock(x, 24, 20, 9, 7, pal, 87, { wet: true }); }
    for (let i = 0; i < 14; i++) { x.fillStyle = i % 3 ? '#e8ecee' : '#b8c0c4'; x.beginPath(); x.arc(8 + hash(v, i, 181) * 20, 18 + hash(v, i, 182) * 6, 0.45 + hash(v, i, 183) * 0.35, 0, TAU); x.fill(); }   // balanes
    for (let i = 0; i < 7; i++) { const px = 6 + i * 4 + hash(v, i, 184) * 2; x.strokeStyle = rgb(hex(i % 2 ? '#3a6a3a' : '#5a6a2a')); x.lineWidth = 0.9; x.beginPath(); x.moveTo(px, 24); x.quadraticCurveTo(px - 1, 25.5, px + 0.5, 27); x.stroke(); }   // algues
    x.strokeStyle = 'rgba(255,255,255,0.85)'; x.lineWidth = 1; x.beginPath(); for (let k = 0; k <= 30; k++) { const px = 3 + k, py = 26 + Math.sin(k * 0.9 + v) * 0.6; k ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke();   // écume
    x.strokeStyle = 'rgba(200,240,255,0.6)'; x.lineWidth = 0.6; x.beginPath(); for (let k = 0; k <= 26; k++) { const px = 5 + k, py = 27.4 + Math.sin(k * 0.7 + 1) * 0.4; k ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke();
  } });

  // COQUILLAGES (sur le sable, on marche dessus) : v 0 coquilles Saint-Jacques, v 1 conques et bigorneaux,
  // v 2 étoiles de mer et petits galets
  def('coquillages', { w: 26, h: 12, n: 3, plat: true, paint(x, v) {
    const spot = (i, k) => [3 + hash(v, i, 191 + k) * 20, 3 + hash(v, i, 194 + k) * 6];
    for (let i = 0; i < 5; i++) {
      const [px, py] = spot(i, 0);
      x.fillStyle = 'rgba(80,60,30,0.25)'; x.beginPath(); x.ellipse(px + 0.4, py + 1, 2, 0.8, 0, 0, TAU); x.fill();
      if (v === 0) {   // éventail strié
        const C = hex(['#f4d0b0', '#f8e8d0', '#e8a888'][i % 3]); x.fillStyle = rgb(C); x.beginPath(); x.moveTo(px, py + 1.2); x.arc(px, py + 1.2, 2.2, Math.PI * 1.1, Math.PI * 1.9); x.closePath(); x.fill();
        x.strokeStyle = rgb(mix(C, INK, 0.3), 0.6); x.lineWidth = 0.3; for (let k = 0; k < 5; k++) { const b = Math.PI * (1.15 + k * 0.15); x.beginPath(); x.moveTo(px, py + 1.2); x.lineTo(px + Math.cos(b) * 2.1, py + 1.2 + Math.sin(b) * 2.1); x.stroke(); }
      } else if (v === 1) {   // conque spiralée
        x.fillStyle = '#f0dcc0'; x.beginPath(); x.ellipse(px, py, 2.2, 1.2, 0.5, 0, TAU); x.fill(); x.fillStyle = '#e89a8a'; x.beginPath(); x.ellipse(px + 0.6, py + 0.2, 1, 0.5, 0.5, 0, TAU); x.fill();
        x.strokeStyle = 'rgba(120,80,50,0.6)'; x.lineWidth = 0.3; x.beginPath(); x.arc(px - 0.8, py - 0.3, 0.7, 0, 5); x.stroke();
      } else {   // étoile de mer à 5 branches
        const C = hex(['#f08040', '#e85a6a', '#f0b040'][i % 3]); x.fillStyle = rgb(C); x.beginPath();
        for (let k = 0; k < 10; k++) { const b = k / 10 * TAU - Math.PI / 2, r = k % 2 ? 0.8 : 2.4; x.lineTo(px + Math.cos(b) * r, py + Math.sin(b) * r * 0.8); } x.closePath(); x.fill();
        x.fillStyle = rgb(mix(C, '#ffffff', 0.5)); x.fillRect(px - 0.3, py - 0.3, 0.6, 0.6);
      }
    }
  } });

  // OYATS (herbes des dunes) : touffes de longues lames pâles qui ploient au vent, épis ; v 1 plus haute et dorée
  def('oyats', { w: 26, h: 24, n: 2, scale: 1.15, paint(x, v) {
    contact(x, 13, 22.5, 8, 1.4, 0.18);
    const C = hex(v ? '#c8b060' : '#9ab060'), n = v ? 22 : 18;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1), x0 = 13 + (t - 0.5) * 8, len = (v ? 18 : 14) * (0.6 + hash(v, i, 201) * 0.4), bend = 3 + hash(v, i, 202) * 4;
      const ex = x0 + (t - 0.5) * 6 + bend, ey = 22 - len, L = 0.3 + (1 - t) * 0.5;
      x.strokeStyle = rgb(mix(mix(C, COOL, 0.25), mix(C, WARM, 0.45), L)); x.lineWidth = 0.75;
      x.beginPath(); x.moveTo(x0, 22); x.quadraticCurveTo(x0 + (t - 0.5) * 2, 22 - len * 0.6, ex, ey); x.stroke();
      if (i % 4 === 0) { x.fillStyle = rgb(mix(C, '#f0e0a0', 0.5)); x.beginPath(); x.ellipse(ex, ey + 1.5, 0.7, 2, 0.4, 0, TAU); x.fill(); }
    }
  } });

  // COCOTIER PENCHÉ : tronc annelé courbé vers la mer, couronne de longues palmes retombantes, noix de coco ;
  // v 1 : plus haut, penché de l'autre côté, palmes plus échevelées
  def('cocotier', { w: 54, h: 64, n: 2, scale: 1.5, big: true, paint(x, v) {
    const s = v ? -1 : 1, B = hex('#8a6a44'), base = [27 - s * 8, 61], top = [27 + s * (v ? 9 : 7), v ? 12 : 16];
    contact(x, base[0], 61.5, 7, 1.8, 0.28);
    const pt = t => [base[0] + (top[0] - base[0]) * t + s * Math.sin(t * Math.PI) * 4, base[1] + (top[1] - base[1]) * t];
    for (let k = 0; k <= 24; k++) {   // tronc en anneaux
      const t = k / 24, [px, py] = pt(t), r = 3.2 - t * 1.2;
      x.fillStyle = rgb(mix(B, INK, 0.5)); x.beginPath(); x.ellipse(px + 0.4, py + 0.3, r + 0.5, 1.6, 0, 0, TAU); x.fill();
      const g = x.createLinearGradient(px - r, 0, px + r, 0); g.addColorStop(0, rgb(mix(B, '#f0d0a0', 0.45))); g.addColorStop(0.5, rgb(B)); g.addColorStop(1, rgb(mix(B, COOL, 0.45)));
      x.fillStyle = g; x.beginPath(); x.ellipse(px, py, r, 1.4, 0, 0, TAU); x.fill();
    }
    const [cx, cy] = pt(1);
    const cocos = () => { for (let i = 0; i < 4; i++) { const px = cx - 2.4 + (i % 3) * 2.2, py = cy + 2.6 + (i > 2 ? 1.6 : 0); x.fillStyle = '#2a1a0c'; x.beginPath(); x.arc(px + 0.3, py + 0.3, 2, 0, TAU); x.fill(); x.fillStyle = '#6a4626'; x.beginPath(); x.arc(px, py, 1.7, 0, TAU); x.fill(); x.fillStyle = '#b08850'; x.beginPath(); x.arc(px - 0.6, py - 0.6, 0.6, 0, TAU); x.fill(); } };
    // palmes : d'abord celles du fond (vers le haut, plus sombres), puis celles qui retombent vers nous
    const F = (v ? [[-2.9, 18, 0.55], [-2.3, 16, 0.3], [-1.75, 14, 0.15], [-1.25, 15, 0.2], [-0.65, 17, 0.35], [-0.1, 19, 0.6], [0.55, 15, 0.9], [2.6, 15, 0.9]]
      : [[-3.0, 17, 0.6], [-2.4, 16, 0.35], [-1.85, 14, 0.15], [-1.3, 14, 0.15], [-0.75, 16, 0.3], [-0.15, 18, 0.55], [0.5, 15, 0.85], [2.7, 15, 0.85]]).map(([a, l, d], i) => [a + (hash(v, i, 211) - 0.5) * 0.15, l, d, i]);
    F.sort((p, q) => Math.sin(p[0]) - Math.sin(q[0]));
    F.forEach(([a, len, droop, i], n) => { const back = Math.sin(a) < -0.5; palme(x, cx, cy, a, len, 3.4, droop * 0.9, back ? '#2e7a2c' : i % 2 ? '#3e9a30' : '#48a838', 7 + i); if (n === F.length - 3) cocos(); });
  } });

  // CORAUX (dans l'eau claire du lagon) : v 0 corail branchu rouge, v 1 corail cerveau rose, v 2 gorgone violette
  def('corail', { w: 30, h: 24, n: 3, paint(x, v) {
    if (v === 0) {
      const C = hex('#e0503a'), br = (x0, y0, a, len, d) => { if (d > 3 || len < 2) return; const x1 = x0 + Math.cos(a) * len, y1 = y0 + Math.sin(a) * len; x.strokeStyle = rgb(mix(C, INK, 0.4)); x.lineWidth = 2.6 - d * 0.5; x.lineCap = 'round'; x.beginPath(); x.moveTo(x0 + 0.4, y0 + 0.3); x.lineTo(x1 + 0.4, y1 + 0.3); x.stroke(); x.strokeStyle = rgb(mix(C, WARM, 0.2 + d * 0.1)); x.lineWidth = 2 - d * 0.45; x.beginPath(); x.moveTo(x0, y0); x.lineTo(x1, y1); x.stroke(); br(x1, y1, a - 0.5, len * 0.7, d + 1); br(x1, y1, a + 0.45, len * 0.68, d + 1); };
      br(15, 22, -Math.PI / 2, 8, 0); br(11, 22, -2.1, 6, 1); br(19, 22, -1.0, 6, 1);
    } else if (v === 1) {
      const C = hex('#f08aa8'); rock(x, 15, 16, 11, 7, ['#a84a6a', '#e07a98', '#ffc0d4'], 91);
      x.strokeStyle = rgb(mix(C, INK, 0.35), 0.7); x.lineWidth = 0.5; for (let k = 0; k < 6; k++) { x.beginPath(); for (let t = 0; t <= 20; t++) { const px = 6 + t * 0.9, py = 11 + k * 1.6 + Math.sin(t * 1.3 + k) * 0.8; t ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke(); }
    } else {
      const C = hex('#9a5ad0'); x.strokeStyle = rgb(mix(C, INK, 0.3)); x.lineWidth = 1.4; x.beginPath(); x.moveTo(15, 23); x.lineTo(15, 18); x.stroke();
      x.fillStyle = rgb(C, 0.35); x.beginPath(); x.ellipse(15, 11, 11, 8, 0, 0, TAU); x.fill();
      x.strokeStyle = rgb(mix(C, '#ffffff', 0.3)); x.lineWidth = 0.45; for (let k = 0; k < 9; k++) { const a = -Math.PI / 2 + (k / 8 - 0.5) * 2.6; x.beginPath(); x.moveTo(15, 18); x.lineTo(15 + Math.cos(a) * 11, 18 + Math.sin(a) * 9); x.stroke(); }
      for (let k = 1; k < 5; k++) { x.beginPath(); x.ellipse(15, 18, k * 2.6, k * 2, 0, Math.PI * 1.08, Math.PI * 1.92); x.stroke(); }
    }
    x.fillStyle = 'rgba(255,255,255,0.7)'; for (let i = 0; i < 3; i++) { x.beginPath(); x.arc(6 + hash(v, i, 221) * 18, 3 + hash(v, i, 222) * 6, 0.6, 0, TAU); x.fill(); }   // bulles
  } });

  // ALGUES ÉCHOUÉES (sur le sable, on marche dessus) : lanières sombres et luisantes ; v 1 avec du bois flotté
  def('algues', { w: 28, h: 12, n: 2, plat: true, paint(x, v) {
    for (let i = 0; i < 9; i++) {
      const x0 = 3 + hash(v, i, 231) * 20, y0 = 3 + hash(v, i, 232) * 6, len = 6 + hash(v, i, 233) * 8, C = hex(i % 3 ? '#3a4a22' : '#5a5a2a');
      x.strokeStyle = rgb(mix(C, INK, 0.3)); x.lineWidth = 1.4; x.beginPath(); x.moveTo(x0, y0); x.bezierCurveTo(x0 + len * 0.3, y0 - 2, x0 + len * 0.6, y0 + 2, x0 + len, y0 + (hash(v, i, 234) - 0.5) * 3); x.stroke();
      x.strokeStyle = rgb(mix(C, '#c8d890', 0.3), 0.8); x.lineWidth = 0.5; x.beginPath(); x.moveTo(x0, y0 - 0.3); x.bezierCurveTo(x0 + len * 0.3, y0 - 2.3, x0 + len * 0.6, y0 + 1.7, x0 + len, y0 + (hash(v, i, 234) - 0.5) * 3 - 0.3); x.stroke();
    }
    if (v === 1) { const B = hex('#b8a080'); x.strokeStyle = rgb(mix(B, INK, 0.4)); x.lineWidth = 2.6; x.lineCap = 'round'; x.beginPath(); x.moveTo(4, 8); x.lineTo(22, 5); x.stroke(); x.strokeStyle = rgb(mix(B, '#ffffff', 0.25)); x.lineWidth = 1.6; x.beginPath(); x.moveTo(4, 7.6); x.lineTo(22, 4.6); x.stroke(); }
  } });

  // les décors plats se posent sous le héros (on marche dessus) : l'éditeur le sait grâce à « plat »
  DW.World.PLATS = new Set(Object.keys(OBJ).filter(k => OBJ[k].plat));
  DW.World.PREMIUM = new Set(['troncouche', 'pousse', 'saule', 'fougeres', 'champignons', 'branchesmortes', 'feuillesmortes', 'rochersmousse', 'buissonfleuri', 'feuillage', 'eboulis', 'aiguille', 'cristaux', 'blocs', 'pintordu', 'rochercotier', 'coquillages', 'oyats', 'cocotier', 'corail', 'algues']);
})();
