'use strict';
// =====================================================================
//  DÉCOR PEINT — rochers, souches, troncs couchés, buissons, fougères, champignons, cairns, cailloux
//  au même pinceau que les arbres (gfx/arbres.js) : lumière chaude en haut à gauche, ombres froides,
//  liseré de lumière, contour sombre discret, matière (facettes de pierre, écorce, mousse, folioles).
//  Les variantes gardent leur sens (couleurs, baies, chapeau bleu / violet...). Rendu : World.obj (o.paint).
// =====================================================================
(function () {
  const OBJ = DW.World.OBJ, P = DW.World.Paint, hash = DW.Art.hash;
  const { rgb, mix, hex, COOL, WARM, INK } = P;

  // ------------------------------------------------------------ pierre : polygone à facettes, éclairé en haut à gauche
  function stone(x, pts, col, seed, o = {}) {
    const C = hex(col), lite = mix(C, WARM, 0.35), top = mix(C, '#ffffff', 0.55), dk = mix(C, COOL, 0.45), deep = mix(C, INK, 0.6);
    // contour arrondi (courbes passant par le milieu des côtés), base plate posée au sol
    const path = o.sharp ? () => { x.beginPath(); pts.forEach((p, i) => (i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]))); x.closePath(); } : () => {
      const n = pts.length, mid = (i, j) => [(pts[i][0] + pts[j][0]) / 2, (pts[i][1] + pts[j][1]) / 2], m0 = mid(0, 1);
      x.beginPath(); x.moveTo(m0[0], m0[1]);
      for (let i = 1; i <= n; i++) { const q = pts[i % n], m = mid(i % n, (i + 1) % n); x.quadraticCurveTo(q[0], q[1], m[0], m[1]); }
      x.closePath();
    };
    let x0 = 99, y0 = 99, x1 = -99, y1 = -99; for (const [a, b] of pts) { x0 = Math.min(x0, a); y0 = Math.min(y0, b); x1 = Math.max(x1, a); y1 = Math.max(y1, b); }
    // contour
    x.save(); x.lineJoin = 'round'; x.strokeStyle = rgb(deep); x.lineWidth = 1.2; path(); x.stroke();
    // masse dégradée (clair en haut à gauche, froid en bas à droite)
    const g = x.createRadialGradient(x0 + (x1 - x0) * 0.32, y0 + (y1 - y0) * 0.25, 0.5, x0 + (x1 - x0) * 0.5, y0 + (y1 - y0) * 0.5, Math.max(x1 - x0, y1 - y0) * 0.75);
    g.addColorStop(0, rgb(top)); g.addColorStop(0.25, rgb(lite)); g.addColorStop(0.6, rgb(C)); g.addColorStop(1, rgb(mix(dk, COOL, 0.3)));
    x.fillStyle = g; path(); x.fill();
    x.clip();
    // facettes : quelques plans plus clairs ou plus sombres
    for (let i = 0; i < 5; i++) {
      const cx = x0 + hash(seed, i, 941) * (x1 - x0), cy = y0 + hash(seed, i, 942) * (y1 - y0), r = 2 + hash(seed, i, 943) * 4;
      const up = cy < (y0 + y1) / 2 && cx < (x0 + x1) * 0.55;
      x.fillStyle = rgb(up ? lite : dk, 0.32);
      x.beginPath(); x.ellipse(cx, cy, r * 1.2, r * 0.6, -0.4 + hash(seed, i, 947), 0, 7); x.fill();
    }
    // grain de la pierre
    for (let i = 0; i < 40; i++) { x.fillStyle = hash(seed, i, 948) < 0.5 ? rgb(top, 0.5) : rgb(deep, 0.35); x.fillRect(x0 + hash(seed, i, 949) * (x1 - x0), y0 + hash(seed, i, 950) * (y1 - y0), 0.6, 0.6); }
    // ombre au pied (la pierre s'enfonce dans le sol)
    const gb = x.createLinearGradient(0, y1 - 4, 0, y1);
    gb.addColorStop(0, 'rgba(10,20,26,0)'); gb.addColorStop(1, 'rgba(10,20,26,0.55)');
    x.fillStyle = gb; x.fillRect(x0, y1 - 4, x1 - x0, 4);
    // fissure
    x.strokeStyle = rgb(deep, 0.8); x.lineWidth = 0.6;
    x.beginPath(); x.moveTo(x0 + (x1 - x0) * 0.55, y0 + 2); x.lineTo(x0 + (x1 - x0) * 0.62, (y0 + y1) / 2); x.lineTo(x0 + (x1 - x0) * 0.56, y1 - 2); x.stroke();
    // mousse sur le dessus
    if (o.moss) for (let i = 0; i < 26; i++) {
      const px = x0 + 2 + hash(seed, i, 944) * (x1 - x0 - 4), py = y0 + 0.3 + hash(seed, i, 945) * (y1 - y0) * 0.32 * (1 - Math.abs(px - (x0 + x1) / 2) / (x1 - x0));
      x.fillStyle = hash(seed, i, 946) < 0.4 ? '#3e8a3a' : hash(seed, i, 946) < 0.8 ? '#5aa844' : '#9ad868'; x.beginPath(); x.ellipse(px, py, 1.2, 0.7, 0, 0, 7); x.fill();
    }
    x.restore();
    // liseré de lumière sur l'arête haute
    x.strokeStyle = rgb(mix(top, WARM, 0.3), 0.85); x.lineWidth = 0.7;
    const erx = (x1 - x0) / 2 - 1.2, ery = (y1 - y0) / 2 - 1;
    if (erx > 1 && ery > 1) { x.beginPath(); x.ellipse((x0 + x1) / 2, (y0 + y1) / 2 + 0.6, erx, ery, 0, Math.PI * 1.08, Math.PI * 1.55); x.stroke(); }
  }
  const ROCK = [[2, 14], [3, 7], [8, 3], [14, 3], [18, 8], [18, 14]];
  OBJ.rock.paint = (x, v) => stone(x, ROCK, v ? '#9a98a4' : '#a8a4a0', 3 + v);
  OBJ.boulder.paint = (x, v) => stone(x, [[2, 16], [3, 8], [9, 3], [16, 4], [20, 10], [20, 16]], ['#76767e', '#6a645a', '#5a5668'][v], 11 + v);
  OBJ.mossrock.paint = (x, v) => stone(x, [[2, 18], [3, 9], [9, 4], [16, 4], [22, 9], [22, 18]], v ? '#8e8e98' : '#9a968c', 21 + v, { moss: true });
  OBJ.cairn.paint = x => { [[8, 23, 6.6, 3], [8, 18.6, 5.4, 2.6], [8.6, 14.6, 4.4, 2.4], [8, 11, 3.4, 2], [8.4, 8, 2.4, 1.6]].forEach(([cx, cy, rx, ry], i) => stone(x, Array.from({ length: 8 }, (_, k) => { const a = k / 8 * Math.PI * 2; return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]; }), ['#8a8a90', '#7a7468', '#9a948a', '#86868c', '#a8a49a'][i], 31 + i)); };
  OBJ.pebbles.paint = (x, v) => { for (const [cx, cy, rx, ry] of [[4, 6, 2.6, 1.6], [9, 5.6, 2, 1.4], [11.6, 7, 1.4, 0.9]]) stone(x, Array.from({ length: 7 }, (_, k) => { const a = k / 7 * Math.PI * 2; return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]; }), v ? '#7a7068' : '#6a6660', 41); };

  // ------------------------------------------------------------ bois : souche et tronc creux
  const BARK = '#7a5030';
  function bark(x, x0, y0, w, h, horiz) {
    const B = hex(BARK), lite = mix(B, '#ffd8a8', 0.3), dk = mix(B, COOL, 0.5);
    const g = horiz ? x.createLinearGradient(0, y0, 0, y0 + h) : x.createLinearGradient(x0, 0, x0 + w, 0);
    g.addColorStop(0, rgb(lite)); g.addColorStop(0.5, rgb(B)); g.addColorStop(1, rgb(dk));
    x.fillStyle = g; x.strokeStyle = rgb(mix(dk, INK, 0.5)); x.lineWidth = 1;
    x.beginPath(); x.roundRect ? x.roundRect(x0, y0, w, h, Math.min(w, h) * 0.3) : x.rect(x0, y0, w, h); x.fill(); x.stroke();
    x.strokeStyle = rgb(dk, 0.7); x.lineWidth = 0.6;
    for (let i = 1; i < 5; i++) { x.beginPath(); if (horiz) { x.moveTo(x0 + 2, y0 + i * h / 5); x.quadraticCurveTo(x0 + w / 2, y0 + i * h / 5 + 0.8, x0 + w - 3, y0 + i * h / 5); } else { x.moveTo(x0 + i * w / 5, y0 + 2); x.lineTo(x0 + i * w / 5 + 0.4, y0 + h - 1); } x.stroke(); }
  }
  function rings(x, cx, cy, rx, ry) {
    x.fillStyle = '#e2b47a'; x.strokeStyle = '#5a3a1e'; x.lineWidth = 0.8;
    x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, 7); x.fill(); x.stroke();
    x.strokeStyle = 'rgba(150,96,50,0.8)'; x.lineWidth = 0.5;
    for (const k of [0.68, 0.42, 0.18]) { x.beginPath(); x.ellipse(cx + 0.3, cy + 0.1, rx * k, ry * k, 0, 0, 7); x.stroke(); }
    x.fillStyle = 'rgba(255,240,200,0.5)'; x.beginPath(); x.ellipse(cx - rx * 0.4, cy - ry * 0.35, rx * 0.35, ry * 0.25, 0, 0, 7); x.fill();
  }
  function moss(x, pts, seed) { for (let i = 0; i < pts.length; i++) { const [px, py] = pts[i]; x.fillStyle = hash(seed, i, 951) < 0.5 ? '#5aa844' : '#88cc5c'; x.beginPath(); x.ellipse(px, py, 2.2, 1.1, 0, 0, 7); x.fill(); } }
  OBJ.stump.paint = x => {
    // racines, fût, cernes, mousse
    x.fillStyle = rgb(mix(BARK, COOL, 0.5));
    for (const s of [-1, 1]) { x.beginPath(); x.moveTo(9 + s * 4, 10); x.quadraticCurveTo(9 + s * 7, 13, 9 + s * 8.5, 14.6); x.lineTo(9 + s * 3, 14.6); x.fill(); }
    bark(x, 3, 6, 12, 8.5, false);
    rings(x, 9, 6, 6, 2.6);
    moss(x, [[4.5, 12.5], [6, 13.2], [13, 12.8]], 5);
  };
  OBJ.hollowlog.paint = x => {
    bark(x, 3, 5, 29, 12, true);
    rings(x, 31.5, 11, 3.4, 6); x.fillStyle = '#1e1208'; x.beginPath(); x.ellipse(31.5, 11, 2.1, 4, 0, 0, 7); x.fill();
    moss(x, [[11, 5.6], [14, 5.2], [17, 5.6], [22, 5.3], [25, 5.8]], 7);
    x.fillStyle = '#e04848'; x.beginPath(); x.ellipse(8, 4.2, 2, 1.4, 0, Math.PI, 0); x.fill(); x.fillStyle = '#fff'; x.fillRect(7.5, 3.2, 0.8, 0.6);
    x.fillStyle = '#f0e6d0'; x.fillRect(7.5, 4.2, 1, 1.4);
  };

  // ------------------------------------------------------------ feuillage bas : buissons et fougères
  OBJ.bush.paint = (x, v) => {
    P.crown(x, { seed: 61 + v, cx: 11, cy: 10.5, rx: 9.8, ry: 7, P: v ? ['#4aa246', '#2c6e34', '#86d05e'] : ['#3f9a48', '#256238', '#74c464'], n: 10 });
    if (v) for (const [bx, by] of [[7, 7], [14, 9.5], [11, 13], [5, 11.5], [16, 6]]) { x.fillStyle = '#d8283a'; x.beginPath(); x.arc(bx, by, 1.1, 0, 7); x.fill(); x.fillStyle = '#ffd0d0'; x.fillRect(bx - 0.6, by - 0.7, 0.5, 0.5); }
  };
  // fronde : tige courbée + folioles alternées, claires au soleil
  function frond(x, x0, y0, ang, len, col, lite, dark) {
    const ex = x0 + Math.cos(ang) * len, ey = y0 + Math.sin(ang) * len, mx = x0 + Math.cos(ang) * len * 0.55, my = y0 + Math.sin(ang) * len * 0.55 - len * 0.18;
    x.strokeStyle = dark; x.lineWidth = 0.8; x.beginPath(); x.moveTo(x0, y0); x.quadraticCurveTo(mx, my, ex, ey); x.stroke();
    const n = 7;
    for (let i = 1; i <= n; i++) {
      const t = i / (n + 1), qx = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * mx + t * t * ex, qy = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * my + t * t * ey;
      const s = (1 - t * 0.7) * 2.6;
      for (const side of [-1, 1]) {
        const a = ang + side * 1.1 - 0.15;
        x.fillStyle = side < 0 ? lite : col;
        x.beginPath(); x.ellipse(qx + Math.cos(a) * s * 0.6, qy + Math.sin(a) * s * 0.6, s * 0.75, s * 0.32, a, 0, 7); x.fill();
      }
    }
  }
  function fernPaint(x, cx, by, fronds, len, base) {
    const C = hex(base), lite = rgb(mix(C, WARM, 0.4)), dark = rgb(mix(C, COOL, 0.5)), col = rgb(C);
    // ombre au cœur de la touffe
    x.fillStyle = 'rgba(10,30,20,0.45)'; x.beginPath(); x.ellipse(cx, by - 1, len * 0.45, 2, 0, 0, 7); x.fill();
    // frondes du fond (sombres) puis du devant (claires)
    fronds.forEach(([a, k], i) => frond(x, cx, by - 1, a, len * k, i % 2 ? rgb(mix(C, COOL, 0.25)) : col, i % 2 ? col : lite, dark));
  }
  OBJ.fern.paint = (x, v) => fernPaint(x, 11, 15.5, [[-2.5, 0.8], [-0.5, 0.8], [-2.0, 1], [-1.0, 1], [-1.57, 1.05], [-2.9, 0.75], [-0.25, 0.75]], 10, v ? '#3e9a40' : '#4aa83c');
  OBJ.bigfern.paint = (x, v) => fernPaint(x, 13, 19.5, [[-2.6, 0.85], [-0.55, 0.85], [-2.15, 1], [-1.0, 1], [-1.6, 1.05], [-1.3, 0.95], [-1.85, 0.95], [-2.95, 0.7], [-0.2, 0.7]], 12.5, v ? '#3a8a34' : '#4a9a3a');

  // ------------------------------------------------------------ champignon lumineux (chapeau bleu ou violet)
  function shroom(x, cx, by, h, rx, cap, capd, glow) {
    const C = hex(cap), D = hex(capd);
    // pied
    const g = x.createLinearGradient(cx - rx * 0.3, 0, cx + rx * 0.3, 0); g.addColorStop(0, '#fbfcf4'); g.addColorStop(1, '#bcc8c0');
    x.fillStyle = g; x.beginPath(); x.moveTo(cx - rx * 0.24, by); x.quadraticCurveTo(cx - rx * 0.32, by - h * 0.5, cx - rx * 0.2, by - h); x.lineTo(cx + rx * 0.2, by - h); x.quadraticCurveTo(cx + rx * 0.3, by - h * 0.5, cx + rx * 0.26, by); x.fill();
    // halo
    if (glow) { const hg = x.createRadialGradient(cx, by - h, 1, cx, by - h, rx * 1.6); hg.addColorStop(0, rgb(C, 0.45)); hg.addColorStop(1, rgb(C, 0)); x.fillStyle = hg; x.fillRect(cx - rx * 1.6, by - h - rx * 1.6, rx * 3.2, rx * 3.2); }
    // lamelles puis chapeau en dôme, lumière en haut à gauche
    x.fillStyle = rgb(mix(D, INK, 0.3)); x.beginPath(); x.ellipse(cx, by - h + 0.6, rx, rx * 0.32, 0, 0, 7); x.fill();
    const gc = x.createRadialGradient(cx - rx * 0.4, by - h - rx * 0.6, 0.5, cx, by - h - rx * 0.2, rx * 1.2);
    gc.addColorStop(0, rgb(mix(C, '#ffffff', 0.5))); gc.addColorStop(0.5, rgb(C)); gc.addColorStop(1, rgb(D));
    x.fillStyle = gc; x.strokeStyle = rgb(mix(D, INK, 0.5)); x.lineWidth = 0.7;
    x.beginPath(); x.ellipse(cx, by - h, rx, rx * 0.72, 0, Math.PI, 0); x.closePath(); x.fill(); x.stroke();
    for (const [dx, dy, r] of [[-0.4, -0.45, 0.16], [0.2, -0.5, 0.12], [0.35, -0.2, 0.1], [-0.1, -0.2, 0.09]]) { x.fillStyle = 'rgba(255,255,255,0.9)'; x.beginPath(); x.arc(cx + dx * rx, by - h + dy * rx, r * rx, 0, 7); x.fill(); }
  }
  OBJ.glowshroom.paint = (x, v) => {
    const cap = v ? '#5ae0f0' : '#b07aff', capd = v ? '#2a9ac0' : '#7040c8';
    shroom(x, 17, 27, 9, 5, cap, capd, true);
    shroom(x, 10, 27, 13.5, 8.5, cap, capd, true);
    shroom(x, 20.5, 27, 2.6, 2.2, cap, capd, false); shroom(x, 4, 27, 2.2, 1.8, cap, capd, false);
  };

  // ------------------------------------------------------------ petits décors de la Clairière
  // planche de bois peinte (veines, bord clair en haut, bord sombre en bas)
  function plank(x, x0, y0, w, h, col, seed) {
    const C = hex(col), g = x.createLinearGradient(0, y0, 0, y0 + h);
    g.addColorStop(0, rgb(mix(C, WARM, 0.25))); g.addColorStop(1, rgb(mix(C, COOL, 0.35)));
    x.fillStyle = g; x.fillRect(x0, y0, w, h);
    x.strokeStyle = rgb(mix(C, INK, 0.45), 0.6); x.lineWidth = 0.4;
    for (let i = 0; i < 3; i++) { const yy = y0 + (i + 0.5) * h / 3 + (hash(seed, i, 961) - 0.5); x.beginPath(); x.moveTo(x0 + 1, yy); x.quadraticCurveTo(x0 + w / 2, yy + (hash(seed, i, 962) - 0.5) * 1.4, x0 + w - 1, yy); x.stroke(); }
    x.fillStyle = rgb(mix(C, INK, 0.5)); x.fillRect(x0, y0 + h - 0.6, w, 0.6);
  }
  function post(x, cx, y0, y1, w, col) {
    const C = hex(col), g = x.createLinearGradient(cx - w / 2, 0, cx + w / 2, 0);
    g.addColorStop(0, rgb(mix(C, WARM, 0.3))); g.addColorStop(1, rgb(mix(C, COOL, 0.5)));
    x.fillStyle = g; x.fillRect(cx - w / 2, y0, w, y1 - y0);
    x.fillStyle = rgb(mix(C, INK, 0.5)); x.fillRect(cx + w / 2 - 0.5, y0, 0.5, y1 - y0);
  }
  // panneau d'information : toit de bardeaux, cadre, affiche en papier
  OBJ.sign.paint = x => {
    post(x, 7, 10, 31, 3, '#6a4424'); post(x, 21, 10, 31, 3, '#5a3a20');
    x.fillStyle = 'rgba(10,20,14,0.35)'; x.beginPath(); x.ellipse(14, 31, 11, 1.6, 0, 0, 7); x.fill();
    plank(x, 1.5, 7, 25, 15.5, '#7a5230', 3);
    // affiche (papier un peu jauni, coins punaisés)
    const pg = x.createLinearGradient(3, 8.5, 25, 20.5); pg.addColorStop(0, '#fbf0d0'); pg.addColorStop(1, '#e2c890');
    x.fillStyle = pg; x.fillRect(3.5, 9, 21, 11.5);
    x.strokeStyle = 'rgba(110,80,40,0.8)'; x.lineWidth = 0.7;
    for (const [y, w] of [[12, 16], [14.6, 13], [17.2, 10]]) { x.beginPath(); x.moveTo(6, y); x.lineTo(6 + w, y); x.stroke(); }
    x.fillStyle = '#c84a3a'; for (const [px, py] of [[4.5, 10], [23.5, 10]]) { x.beginPath(); x.arc(px, py, 0.8, 0, 7); x.fill(); }
    // toit à deux pans, bardeaux
    x.fillStyle = '#7a3428'; x.beginPath(); x.moveTo(-0.5, 7.6); x.lineTo(14, 0.4); x.lineTo(28.5, 7.6); x.lineTo(26.5, 9); x.lineTo(1.5, 9); x.closePath(); x.fill();
    x.fillStyle = '#a84a36'; x.beginPath(); x.moveTo(1.5, 7.2); x.lineTo(14, 1.2); x.lineTo(14, 3); x.lineTo(3.5, 8); x.closePath(); x.fill();
    x.strokeStyle = 'rgba(40,14,10,0.6)'; x.lineWidth = 0.5; for (let i = 1; i < 4; i++) { x.beginPath(); x.moveTo(1 + i * 0.4, 7.6 - i * 1.6 + 1.6); x.lineTo(27 - i * 0.4, 7.6 - i * 1.6 + 1.6); x.stroke(); }
    moss(x, [[3, 8.6], [24, 8.4]], 9);
  };
  // source : margelle de pierres rondes, eau claire et profonde, bouillons
  OBJ.spring.paint = x => {
    x.fillStyle = 'rgba(10,26,20,0.3)'; x.beginPath(); x.ellipse(15, 15, 14, 7, 0, 0, 7); x.fill();
    const wg = x.createRadialGradient(13, 12, 1, 15, 13, 11);
    wg.addColorStop(0, '#b8fbff'); wg.addColorStop(0.45, '#4ed8f0'); wg.addColorStop(1, '#1a6a9a');
    x.fillStyle = wg; x.beginPath(); x.ellipse(15, 13, 10.5, 5.6, 0, 0, 7); x.fill();
    x.strokeStyle = 'rgba(255,255,255,0.75)'; x.lineWidth = 0.6;
    for (const [rx, ry] of [[3, 1.2], [5.5, 2.4]]) { x.beginPath(); x.ellipse(14, 12.6, rx, ry, 0, 0, 7); x.stroke(); }
    for (let i = 0; i < 12; i++) {   // margelle
      const a = i / 12 * Math.PI * 2, px = 15 + Math.cos(a) * 11.6, py = 13 + Math.sin(a) * 6.6;
      stone(x, Array.from({ length: 6 }, (_, k) => { const b = k / 6 * Math.PI * 2; return [px + Math.cos(b) * 2.8, py + Math.sin(b) * 2]; }), i % 2 ? '#9aa0ac' : '#b2b6c0', 70 + i, { moss: i % 4 === 0 });
    }
    x.fillStyle = '#ffffff'; x.beginPath(); x.ellipse(12, 11.6, 2.2, 0.7, -0.2, 0, 7); x.fill();
    // petits jets d'eau qui jaillissent de la source
    for (const [jx, jh] of [[23, 8], [6.5, 6]]) { const jg = x.createLinearGradient(0, 11 - jh, 0, 11); jg.addColorStop(0, 'rgba(230,255,255,0.95)'); jg.addColorStop(1, 'rgba(110,230,250,0.6)'); x.fillStyle = jg; x.beginPath(); x.moveTo(jx - 1, 11); x.quadraticCurveTo(jx - 0.6, 11 - jh * 0.6, jx, 11 - jh); x.quadraticCurveTo(jx + 0.6, 11 - jh * 0.6, jx + 1, 11); x.fill(); }
  };
  // monolithe de données : pierre ancienne, runes numériques qui luisent
  OBJ.monolith.paint = (x, v) => {
    stone(x, [[3, 44], [4, 10], [8, 3], [15, 2], [19, 9], [19, 44]], v ? '#8a96a4' : '#9a9a94', 81 + v, { moss: true, sharp: true });
    const L = '#5ae8f0';
    x.save(); x.shadowColor = L; x.shadowBlur = 3; x.strokeStyle = L; x.lineWidth = 0.9; x.lineCap = 'round';
    x.beginPath(); x.moveTo(7, 12); x.lineTo(7, 38); x.moveTo(7, 22); x.lineTo(12, 22); x.lineTo(12, 34); x.moveTo(15, 8); x.lineTo(15, 18); x.stroke();
    x.fillStyle = '#d8ffff'; for (const [px, py] of [[12, 34], [7, 12], [15, 18]]) { x.beginPath(); x.arc(px, py, 1.2, 0, 7); x.fill(); }
    x.restore();
    stone(x, [[1, 45], [1.5, 40.5], [20.5, 40.5], [21, 45]], '#7a7a74', 89, { sharp: true });
  };
  // dalle de circuit à moitié enterrée
  OBJ.datapanel.paint = (x, v) => {
    const Lc = v ? '#7aff9a' : '#5ae8f0';
    stone(x, [[2, 18], [6, 6], [30, 3], [32, 16]], v ? '#2e4e40' : '#2e3e5e', 91 + v, { sharp: true });
    x.save(); x.shadowColor = Lc; x.shadowBlur = 3; x.strokeStyle = Lc; x.lineWidth = 0.9; x.lineCap = 'round';
    x.beginPath(); x.moveTo(8, 14); x.lineTo(14, 8); x.lineTo(24, 7); x.lineTo(28, 12); x.moveTo(12, 15); x.lineTo(20, 12); x.stroke();
    x.fillStyle = '#e8ffff'; for (const [px, py] of [[14, 8], [24, 7], [20, 12]]) { x.beginPath(); x.arc(px, py, 1.3, 0, 7); x.fill(); }
    x.restore();
    moss(x, [[4, 17], [6, 18], [30, 18], [28, 18.6]], 93);
  };
  // antenne de données : mât métallique, voyant
  OBJ.antenna.paint = (x, v) => {
    stone(x, [[4, 44], [4.5, 38.5], [13.5, 38.5], [14, 44]], '#7a7e86', 95, { sharp: true });
    const g = x.createLinearGradient(7.5, 0, 10.5, 0); g.addColorStop(0, '#dfe4ea'); g.addColorStop(1, '#6a7078');
    x.fillStyle = g; x.fillRect(7.7, 9, 2.6, 31);
    x.strokeStyle = '#8a9098'; x.lineWidth = 1; x.beginPath(); x.moveTo(9, 26); x.lineTo(3, 20); x.moveTo(9, 22); x.lineTo(15, 16); x.stroke();
    const C = v ? '#5ae890' : '#ff5a5a';
    x.save(); x.shadowColor = C; x.shadowBlur = 4; x.fillStyle = C; x.beginPath(); x.arc(9, 6, 3.4, 0, 7); x.fill(); x.restore();
    x.fillStyle = '#ffffff'; x.beginPath(); x.arc(8, 5, 1.1, 0, 7); x.fill();
    x.fillStyle = '#f0c030'; x.fillRect(5, 40.6, 8, 0.8);
  };
  // banc / ponton de bois
  OBJ.dock.paint = x => {
    for (const px of [3, 15, 28]) post(x, px, 12, 19.5, 2, '#5a3a1a');
    for (let i = 0; i < 6; i++) plank(x, 1 + i * 5, 4, 5, 10, i % 2 ? '#a06e3c' : '#946434', 100 + i);
    x.fillStyle = 'rgba(255,240,200,0.35)'; x.fillRect(1, 4, 30, 0.7);
  };

  // ------------------------------------------------------------ le Grand Arbre de la Clairière (porte de Kuwagamon)
  // v0 écorce gravée, v1-v2 fissures lumineuses (énigmes résolues), v3 écorce éclatée sur un passage sombre
  OBJ.grandarbre.paint = (x, v) => {
    x.fillStyle = 'rgba(14,26,16,0.4)'; x.beginPath(); x.ellipse(66, 146, 60, 5, 0, 0, 7); x.fill();
    // tronc massif, racines puissantes (même pinceau que les arbres : gfx/arbres.js)
    P.trunk(x, { cx: 66, top: 54, base: 146, w: 30, seed: 9, roots: 6, bark: '#6a4626' });
    // l'entrée
    if (v >= 3) {
      x.fillStyle = '#120a06'; x.beginPath(); x.ellipse(66, 128, 15, 19, 0, 0, 7); x.fill();
      x.fillStyle = '#21140a'; x.beginPath(); x.ellipse(66, 124, 11, 14, 0, 0, 7); x.fill();
      x.fillStyle = '#ff3a2a'; for (const ex of [62, 70]) { x.beginPath(); x.arc(ex, 118, 1.2, 0, 7); x.fill(); }
      x.fillStyle = '#a07848'; for (const [px, py, a] of [[40, 140, -0.4], [92, 142, 0.5], [50, 146, 0.2], [84, 132, -0.6], [30, 132, 0.8]]) { x.beginPath(); x.moveTo(px, py); x.lineTo(px + 8 * Math.cos(a), py - 3); x.lineTo(px + 6, py + 2); x.fill(); }
    } else {
      const dg = x.createLinearGradient(54, 110, 78, 142); dg.addColorStop(0, '#a87a48'); dg.addColorStop(1, '#6a4626');
      x.fillStyle = dg; x.strokeStyle = '#3a2412'; x.lineWidth = 1; x.beginPath(); x.ellipse(66, 126, 13, 17, 0, 0, 7); x.fill(); x.stroke();
      x.strokeStyle = 'rgba(58,36,18,0.85)'; x.lineWidth = 0.8; for (let k = 0; k < 5; k++) { x.beginPath(); x.moveTo(57, 116 + k * 4); x.lineTo(75, 116 + k * 4); x.stroke(); }
      x.save(); x.shadowColor = '#5af0c0'; x.shadowBlur = 4; x.fillStyle = '#5af0c0'; x.beginPath(); x.arc(66, 110, 3, 0, 7); x.fill();
      x.strokeStyle = '#5af0c0'; x.lineWidth = 1.1; x.lineCap = 'round';
      if (v >= 1) { x.beginPath(); x.moveTo(66, 108); x.lineTo(60, 120); x.lineTo(63, 132); x.moveTo(60, 120); x.lineTo(54, 124); x.stroke(); }
      if (v >= 2) { x.beginPath(); x.moveTo(66, 108); x.lineTo(74, 118); x.lineTo(70, 136); x.moveTo(74, 118); x.lineTo(80, 112); x.stroke(); }
      x.restore();
    }
    // ombre du feuillage sur le haut du tronc, puis la couronne immense
    const sg = x.createLinearGradient(0, 56, 0, 76); sg.addColorStop(0, 'rgba(6,18,20,0.8)'); sg.addColorStop(1, 'rgba(6,18,20,0)'); x.fillStyle = sg; x.fillRect(44, 56, 46, 20);
    P.crown(x, { seed: 777, cx: 66, cy: 44, rx: 50, ry: 30, P: ['#3f9a40', '#226230', '#7cc858'], n: 60, touches: 700, leaf: 1.5 });
    // lianes qui pendent
    x.strokeStyle = '#3a7a2a'; x.lineWidth = 1.1;
    for (const lx of [24, 48, 86, 108]) { x.beginPath(); x.moveTo(lx, 62); x.quadraticCurveTo(lx + 4, 80, lx - 1, 96); x.stroke(); x.fillStyle = '#5aa844'; for (let k = 0; k < 4; k++) { x.beginPath(); x.ellipse(lx + 1, 68 + k * 7, 1.6, 0.8, 0.5, 0, 7); x.fill(); } }
  };
  // tuyau rouillé ou métallique à moitié enterré (fumée : OBJ.pipe.smoke)
  OBJ.pipe.paint = (x, v) => {
    const M = hex(v ? '#8a8e96' : '#9a7a5a'), Ml = rgb(mix(M, '#ffffff', 0.4)), Md = rgb(mix(M, COOL, 0.5));
    x.fillStyle = 'rgba(14,26,16,0.4)'; x.beginPath(); x.ellipse(17, 30, 14, 2.4, 0, 0, 7); x.fill();
    stone(x, [[2, 30], [4, 24], [10, 22], [14, 25], [14, 30]], '#6a5a3a', 111, { moss: true });
    // coude : tube épais avec reflet
    x.lineCap = 'round'; x.lineJoin = 'round';
    x.strokeStyle = rgb(mix(M, INK, 0.6)); x.lineWidth = 10; x.beginPath(); x.moveTo(9, 29); x.lineTo(9, 15); x.quadraticCurveTo(9, 8, 16, 8); x.lineTo(26, 8); x.stroke();
    x.strokeStyle = rgb(M); x.lineWidth = 8.4; x.stroke();
    x.strokeStyle = Ml; x.lineWidth = 2; x.beginPath(); x.moveTo(6.5, 28); x.lineTo(6.5, 15); x.quadraticCurveTo(7, 6.5, 16, 5.6); x.lineTo(25, 5.6); x.stroke();
    x.strokeStyle = Md; x.lineWidth = 1.6; x.beginPath(); x.moveTo(11.6, 28); x.lineTo(11.6, 15.5); x.quadraticCurveTo(12, 10.5, 16, 10.4); x.lineTo(25, 10.4); x.stroke();
    x.fillStyle = rgb(mix(M, INK, 0.3)); x.beginPath(); x.ellipse(27, 8, 3, 5, 0, 0, 7); x.fill(); x.fillStyle = '#141414'; x.beginPath(); x.ellipse(27.4, 8, 1.8, 3.4, 0, 0, 7); x.fill();
    x.fillStyle = '#d8d0c0'; for (const [px, py] of [[6, 22], [12, 22], [20, 5.5], [20, 10.5]]) { x.beginPath(); x.arc(px, py, 0.7, 0, 7); x.fill(); }
    if (!v) { x.fillStyle = 'rgba(176,96,58,0.75)'; x.beginPath(); x.ellipse(16, 12, 3, 1.6, 0, 0, 7); x.fill(); x.beginPath(); x.ellipse(8, 24, 1.6, 2.4, 0, 0, 7); x.fill(); }
    moss(x, [[7, 26.6], [5, 27.4]], 113);
  };

  // ------------------------------------------------------------ BORD DE MER : palmiers, rochers marins, bois flotté, cuvettes
  // palmier : stipe annelé et courbé, couronne de palmes retombantes à folioles, noix de coco
  OBJ.palm.paint = (x, v) => {
    const base = [22, 59], top = v ? [26.5, 16] : [17.5, 16], bend = v ? -3 : 3;
    const pt = t => [base[0] + (top[0] - base[0]) * t + Math.sin(t * 3) * bend * 0.7, base[1] + (top[1] - base[1]) * t];
    x.fillStyle = 'rgba(30,24,10,0.25)'; x.beginPath(); x.ellipse(22, 59, 7, 1.6, 0, 0, 7); x.fill();
    // stipe : anneaux du bas vers le haut, plus fins en montant, lumière à gauche
    for (let i = 0; i < 16; i++) {
      const t = i / 16, [cx, cy] = pt(t), w = 3.6 - t * 1.4;
      const g = x.createLinearGradient(cx - w, 0, cx + w, 0); g.addColorStop(0, '#d8b080'); g.addColorStop(0.5, '#a8784a'); g.addColorStop(1, '#5e3e22');
      x.fillStyle = g; x.beginPath(); x.ellipse(cx, cy, w, 1.9, 0, 0, 7); x.fill();
      x.strokeStyle = 'rgba(70,44,22,0.75)'; x.lineWidth = 0.5; x.beginPath(); x.ellipse(cx, cy + 0.9, w * 0.95, 0.9, 0, 0, Math.PI); x.stroke();
    }
    // palmes : arrière (sombres) puis avant (claires)
    const frond = (ang, len, droop, dark) => {
      const [cx, cy] = top, ex = cx + Math.cos(ang) * len, ey = cy + Math.sin(ang) * len * 0.55 + droop;
      const mx = cx + Math.cos(ang) * len * 0.55, my = cy + Math.sin(ang) * len * 0.3 - 3;
      x.strokeStyle = dark ? '#2a5a2a' : '#3e7a30'; x.lineWidth = 0.9; x.beginPath(); x.moveTo(cx, cy); x.quadraticCurveTo(mx, my, ex, ey); x.stroke();
      for (let i = 2; i <= 12; i++) {
        const t = i / 13, qx = (1 - t) * (1 - t) * cx + 2 * (1 - t) * t * mx + t * t * ex, qy = (1 - t) * (1 - t) * cy + 2 * (1 - t) * t * my + t * t * ey;
        const s = (1 - t * 0.6) * 4.2;
        for (const side of [-1, 1]) {
          const a = Math.atan2(ey - my, ex - mx) + side * 1.15 + 0.25;
          x.strokeStyle = dark ? (side < 0 ? '#2f6e34' : '#245a2c') : (side < 0 ? '#7ccc5a' : '#4ea040'); x.lineWidth = 1.1;
          x.beginPath(); x.moveTo(qx, qy); x.lineTo(qx + Math.cos(a) * s, qy + Math.sin(a) * s + 1.2); x.stroke();
        }
      }
    };
    for (const [a, l, dr] of [[-2.6, 17, 3], [-0.5, 17, 3], [-1.57, 13, -2], [-3.0, 15, 9], [-0.1, 15, 9]]) frond(a, l, dr, true);
    for (const [a, l, dr] of [[-2.2, 19, 6], [-0.9, 19, 6], [2.6, 15, 12], [0.55, 15, 12], [-1.4, 15, 0]]) frond(a, l, dr, false);
    // noix de coco
    for (const [dx, dy] of [[-2, 3], [1.5, 3.6], [-0.2, 5]]) { x.fillStyle = '#6a4a22'; x.beginPath(); x.arc(top[0] + dx, top[1] + dy, 1.9, 0, 7); x.fill(); x.fillStyle = 'rgba(255,230,180,0.6)'; x.beginPath(); x.arc(top[0] + dx - 0.6, top[1] + dy - 0.6, 0.6, 0, 7); x.fill(); }
  };
  // rocher marin : pierre, base mouillée sombre, bernacles, algues
  OBJ.searock.paint = (x, v) => {
    x.fillStyle = 'rgba(60,46,26,0.35)'; x.beginPath(); x.ellipse(13, 20, 11.5, 2.2, 0, 0, 7); x.fill();
    stone(x, [[1, 20], [2, 11], [7, 4], [15, 3], [22, 8], [25, 20]], ['#8a8a92', '#7e8088', '#96928a'][v], 121 + v);
    const wg = x.createLinearGradient(0, 15, 0, 20.5); wg.addColorStop(0, 'rgba(30,40,60,0)'); wg.addColorStop(1, 'rgba(30,40,60,0.45)'); x.fillStyle = wg; x.fillRect(1, 15, 24, 6);
    for (let i = 0; i < 9; i++) { const px = 4 + hash(v, i, 991) * 18, py = 7 + hash(v, i, 992) * 10; x.fillStyle = '#ece6d8'; x.beginPath(); x.arc(px, py, 0.8, 0, 7); x.fill(); x.fillStyle = '#8a8478'; x.fillRect(px - 0.2, py - 0.2, 0.4, 0.4); }
    for (const [px, py] of [[4, 18.6], [21, 18.8], [7, 19.4]]) { x.fillStyle = '#3a7a4a'; x.beginPath(); x.ellipse(px, py, 2.6, 1.1, 0.2, 0, 7); x.fill(); x.fillStyle = '#5aa05a'; x.beginPath(); x.ellipse(px - 0.6, py - 0.4, 1.2, 0.5, 0.2, 0, 7); x.fill(); }
  };
  // bois flotté : blanchi par le sel, fendillé
  OBJ.driftwood.paint = (x, v) => {
    x.fillStyle = 'rgba(120,96,60,0.35)'; x.beginPath(); x.ellipse(17, 13, 15, 1.8, 0, 0, 7); x.fill();
    x.lineCap = 'round';
    const branch = (pts, w) => { x.strokeStyle = '#6e604c'; x.lineWidth = w + 1; x.beginPath(); pts.forEach((p, i) => (i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]))); x.stroke(); x.strokeStyle = '#cdbca2'; x.lineWidth = w; x.stroke(); x.strokeStyle = 'rgba(255,250,236,0.8)'; x.lineWidth = w * 0.3; x.beginPath(); pts.forEach((p, i) => (i ? x.lineTo(p[0], p[1] - w * 0.25) : x.moveTo(p[0], p[1] - w * 0.25))); x.stroke(); };
    branch([[3, 10.5], [17, 8.6], [31, 10.2]], 5.4); branch([[20, 8.4], [26, 3.4]], 2);
    x.strokeStyle = 'rgba(110,96,76,0.8)'; x.lineWidth = 0.5; for (const [a, b] of [[7, 22], [11, 27]]) { x.beginPath(); x.moveTo(a, 9.6); x.lineTo(b, 9.2); x.stroke(); }
    x.fillStyle = '#8a7458'; x.beginPath(); x.ellipse(31, 10.2, 1.4, 2.4, 0, 0, 7); x.fill();
    if (v) { x.fillStyle = '#3a7a4a'; x.beginPath(); x.ellipse(10, 6.8, 2.8, 1.2, 0.2, 0, 7); x.fill(); }
  };
  // cuvette d'eau dans un rocher (petit poisson orange, coquillages)
  OBJ.tidepool.paint = x => {
    x.fillStyle = 'rgba(80,60,30,0.35)'; x.beginPath(); x.ellipse(17, 21, 15, 2.4, 0, 0, 7); x.fill();
    stone(x, [[1, 20], [3, 9], [12, 4], [24, 4], [32, 10], [33, 20]], '#8e8a84', 131);
    const wg = x.createRadialGradient(15, 10, 1, 17, 11, 9); wg.addColorStop(0, '#c8f6ff'); wg.addColorStop(0.5, '#4ab0e8'); wg.addColorStop(1, '#1e5a8a');
    x.fillStyle = '#2a4a5a'; x.beginPath(); x.ellipse(17, 11.2, 9.2, 4.2, 0, 0, 7); x.fill();
    x.fillStyle = wg; x.beginPath(); x.ellipse(17, 11, 8.4, 3.6, 0, 0, 7); x.fill();
    x.fillStyle = '#f07a3a'; x.beginPath(); x.ellipse(21, 12, 1.6, 0.9, 0.3, 0, 7); x.fill();
    x.fillStyle = 'rgba(255,255,255,0.85)'; x.beginPath(); x.ellipse(13.5, 9.8, 2.6, 0.6, -0.1, 0, 7); x.fill();
    for (const [px, py] of [[26, 15], [8, 13], [29, 18]]) { x.fillStyle = '#ece6d8'; x.beginPath(); x.arc(px, py, 0.9, 0, 7); x.fill(); }
    x.fillStyle = '#3a7a4a'; x.beginPath(); x.ellipse(5, 17, 3, 1.3, 0, 0, 7); x.fill();
  };

  // ------------------------------------------------------------ bateaux, épave, arche, château de sable, crabes, étoiles de mer
  const reflectShadow = (x, cx, cy, rx, ry) => { const g = x.createRadialGradient(cx, cy, 1, cx, cy, rx); g.addColorStop(0, 'rgba(10,40,70,0.55)'); g.addColorStop(1, 'rgba(10,40,70,0)'); x.fillStyle = g; x.save(); x.translate(cx, cy); x.scale(1, ry / rx); x.beginPath(); x.arc(0, 0, rx, 0, 7); x.fill(); x.restore(); };
  function log(x, x0, y0, x1, y1, w, col) {
    const C = hex(col); x.lineCap = 'round';
    x.strokeStyle = rgb(mix(C, INK, 0.55)); x.lineWidth = w + 1; x.beginPath(); x.moveTo(x0, y0); x.lineTo(x1, y1); x.stroke();
    x.strokeStyle = rgb(C); x.lineWidth = w; x.stroke();
    x.strokeStyle = rgb(mix(C, WARM, 0.45), 0.85); x.lineWidth = w * 0.3; x.beginPath(); x.moveTo(x0, y0 - w * 0.25); x.lineTo(x1, y1 - w * 0.25); x.stroke();
    x.fillStyle = rgb(mix(C, '#e8c890', 0.5)); x.beginPath(); x.ellipse(x1, y1, w * 0.3, w * 0.5, 0, 0, 7); x.fill();
  }
  function sail(x, pts, col) {
    const g = x.createLinearGradient(pts[0][0], pts[0][1], pts[2][0], pts[2][1]); g.addColorStop(0, '#fffaf0'); g.addColorStop(1, col);
    x.fillStyle = g; x.strokeStyle = 'rgba(90,70,50,0.8)'; x.lineWidth = 0.7;
    x.beginPath(); x.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) x.quadraticCurveTo((pts[i - 1][0] + pts[i][0]) / 2 + 2, (pts[i - 1][1] + pts[i][1]) / 2, pts[i][0], pts[i][1]); x.closePath(); x.fill(); x.stroke();
  }
  OBJ.raft.paint = x => {
    reflectShadow(x, 32, 54, 30, 4);
    for (let k = 0; k < 7; k++) log(x, 6, 40 + k * 2, 58, 38 + k * 2, 2.6, k % 2 ? '#a8743c' : '#946232');
    x.strokeStyle = '#5a8a3a'; x.lineWidth = 1.2; for (const lx of [14, 32, 50]) { x.beginPath(); x.moveTo(lx, 38); x.lineTo(lx + 1, 54); x.stroke(); }
    log(x, 30.5, 44, 31.5, 6, 1.7, '#7a5030');
    sail(x, [[32, 8], [52, 14], [50, 34], [32, 36]], '#e6d8bc');
    x.fillStyle = '#d0bea0'; x.fillRect(38, 18, 7, 6); x.strokeStyle = 'rgba(120,96,70,0.7)'; x.strokeRect(38, 18, 7, 6);
    x.fillStyle = '#e84a4a'; x.beginPath(); x.moveTo(34, 4); x.lineTo(40, 5); x.lineTo(34, 7); x.fill();
  };
  OBJ.rowboat.paint = x => {
    reflectShadow(x, 20, 18, 18, 3.4);
    const g = x.createLinearGradient(0, 8, 0, 19); g.addColorStop(0, '#d8784a'); g.addColorStop(1, '#7a3020');
    x.fillStyle = g; x.strokeStyle = '#3a160c'; x.lineWidth = 0.9;
    x.beginPath(); x.moveTo(1, 9); x.quadraticCurveTo(5, 18.5, 20, 18.5); x.quadraticCurveTo(35, 18.5, 39, 9); x.closePath(); x.fill(); x.stroke();
    x.strokeStyle = 'rgba(60,20,10,0.6)'; x.lineWidth = 0.6; x.beginPath(); x.moveTo(4, 12.5); x.quadraticCurveTo(20, 15, 36, 12.5); x.stroke();
    x.fillStyle = '#5a2c18'; x.beginPath(); x.ellipse(20, 9, 18, 3, 0, 0, 7); x.fill();
    x.fillStyle = '#3a1c10'; x.beginPath(); x.ellipse(20, 9.4, 15.6, 2, 0, 0, 7); x.fill();
    plank(x, 14, 7.5, 12, 2, '#c8945a', 141);
    x.strokeStyle = '#c8945a'; x.lineWidth = 1.2; x.beginPath(); x.moveTo(8, 9); x.lineTo(2, 4); x.stroke(); x.fillStyle = '#c8945a'; x.beginPath(); x.ellipse(2, 3.6, 2.4, 1, -0.6, 0, 7); x.fill();
    x.strokeStyle = 'rgba(255,240,210,0.6)'; x.lineWidth = 0.6; x.beginPath(); x.moveTo(4, 9.6); x.quadraticCurveTo(10, 15.6, 18, 16.6); x.stroke();
  };
  OBJ.rockarch.paint = x => {
    const R = '#8c847a';
    for (const fx of [16, 72]) { x.fillStyle = 'rgba(240,252,255,0.9)'; x.beginPath(); x.ellipse(fx, 70, 15, 3.4, 0, 0, 7); x.fill(); x.fillStyle = 'rgba(200,236,246,0.7)'; x.beginPath(); x.ellipse(fx, 71.5, 17, 2.4, 0, 0, 7); x.fill(); }
    stone(x, [[60, 70], [58, 36], [64, 20], [76, 16], [86, 38], [84, 70]], '#7e766c', 151);
    x.lineCap = 'round'; x.strokeStyle = rgb(mix(R, INK, 0.6)); x.lineWidth = 12; x.beginPath(); x.moveTo(14, 26); x.bezierCurveTo(26, 6, 52, 2, 70, 20); x.stroke();
    const g = x.createLinearGradient(0, 4, 0, 30); g.addColorStop(0, rgb(mix(R, WARM, 0.45))); g.addColorStop(1, rgb(mix(R, COOL, 0.45)));
    x.strokeStyle = g; x.lineWidth = 10.4; x.stroke();
    stone(x, [[4, 70], [2, 44], [8, 26], [20, 16], [28, 30], [27, 70]], R, 152);
    x.fillStyle = '#5a9a4a'; x.beginPath(); x.moveTo(20, 9); x.quadraticCurveTo(40, -1, 60, 7); x.quadraticCurveTo(40, 4, 20, 11); x.fill();
    x.fillStyle = '#f0e070'; for (const [px, py] of [[26, 6.5], [44, 3], [56, 6]]) { x.beginPath(); x.arc(px, py, 1.1, 0, 7); x.fill(); }
  };
  OBJ.wreck.paint = x => {
    const Wk = '#3e2212';
    x.fillStyle = 'rgba(150,120,70,0.45)'; x.beginPath(); x.ellipse(40, 46, 36, 4, 0, 0, 7); x.fill();
    x.lineCap = 'round';
    for (let k = 0; k < 5; k++) { x.strokeStyle = Wk; x.lineWidth = 1.8; x.beginPath(); x.moveTo(50 + k * 4, 44); x.quadraticCurveTo(48 + k * 4, 22 - k, 54 + k * 4, 16 - k); x.stroke(); }
    const g = x.createLinearGradient(0, 28, 0, 47); g.addColorStop(0, '#a8703e'); g.addColorStop(1, '#4a2a16');
    x.fillStyle = g; x.strokeStyle = '#2a160a'; x.lineWidth = 1;
    x.beginPath(); x.moveTo(4, 32); x.quadraticCurveTo(10, 46, 52, 46); x.quadraticCurveTo(64, 44, 60, 30); x.quadraticCurveTo(30, 27, 12, 28); x.closePath(); x.fill(); x.stroke();
    x.strokeStyle = 'rgba(42,22,10,0.7)'; x.lineWidth = 0.6; for (let k = 0; k < 4; k++) { x.beginPath(); x.moveTo(7, 33 + k * 3); x.quadraticCurveTo(30, 36 + k * 3, 58, 33 + k * 2.6); x.stroke(); }
    x.fillStyle = '#1e1008'; x.beginPath(); x.ellipse(33, 33, 3.4, 2.4, 0.2, 0, 7); x.fill();
    log(x, 30, 32, 38, 6, 2.2, '#a06a3a'); log(x, 38, 6, 44, 2, 1.4, '#a06a3a');
    sail(x, [[37, 10], [52, 16], [46, 26], [36, 22]], '#c8b898');
    for (const pts of [[[0, 48], [2, 40], [12, 37], [24, 42], [28, 48]], [[52, 48], [60, 40], [72, 41], [80, 48]]]) {
      const sg = x.createLinearGradient(0, 37, 0, 48); sg.addColorStop(0, '#f4e2b4'); sg.addColorStop(1, '#d6b47a');
      x.fillStyle = sg; x.beginPath(); x.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) x.quadraticCurveTo((pts[i - 1][0] + pts[i][0]) / 2, pts[i - 1][1] - 1, pts[i][0], pts[i][1]); x.closePath(); x.fill();
    }
    moss(x, [[10, 44], [16, 45], [55, 44]], 161);
  };
  OBJ.sandcastle.paint = x => {
    x.fillStyle = 'rgba(150,110,60,0.35)'; x.beginPath(); x.ellipse(15, 23, 13, 2.4, 0, 0, 7); x.fill();
    const sandBlock = (bx, by, bw, bh) => { const g = x.createLinearGradient(bx, by, bx + bw, by + bh); g.addColorStop(0, '#fbe6b4'); g.addColorStop(1, '#c8a060'); x.fillStyle = g; x.strokeStyle = '#9a7a44'; x.lineWidth = 0.6; x.beginPath(); x.rect(bx, by, bw, bh); x.fill(); x.stroke(); for (let i = 0; i < 6; i++) { x.fillStyle = 'rgba(150,110,60,0.4)'; x.fillRect(bx + hash(bx, i, 171) * bw, by + hash(by, i, 172) * bh, 0.6, 0.6); } };
    sandBlock(3, 13, 24, 10);
    for (const tx of [3, 12, 21]) { sandBlock(tx, 7, 6, 8); x.fillStyle = '#f0d49a'; x.fillRect(tx + 0.6, 5.6, 1.4, 1.8); x.fillRect(tx + 3.6, 5.6, 1.4, 1.8); }
    x.fillStyle = '#6a4a26'; x.beginPath(); x.moveTo(12.4, 23); x.lineTo(12.4, 19); x.quadraticCurveTo(15, 15.6, 17.6, 19); x.lineTo(17.6, 23); x.fill();
    x.strokeStyle = '#8a5a32'; x.lineWidth = 0.8; x.beginPath(); x.moveTo(15, 7); x.lineTo(15, 0); x.stroke();
    x.fillStyle = '#e04848'; x.beginPath(); x.moveTo(15.4, 0.4); x.lineTo(21, 2); x.lineTo(15.4, 3.6); x.fill();
    x.fillStyle = '#ffe0e8'; x.beginPath(); x.arc(7, 18, 1.2, 0, 7); x.fill(); x.fillStyle = '#f07a3a'; x.beginPath(); x.arc(23, 19, 1.2, 0, 7); x.fill();
  };
  OBJ.crab.paint = (x, v, f) => {
    const C = hex(v ? '#e8783a' : '#d84a3a'), Cd = rgb(mix(C, INK, 0.4)), up = f ? -1.4 : 0;
    x.fillStyle = 'rgba(110,90,60,0.4)'; x.beginPath(); x.ellipse(9, 11, 7, 1.4, 0, 0, 7); x.fill();
    x.strokeStyle = Cd; x.lineWidth = 0.7; x.lineCap = 'round';
    for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { x.beginPath(); x.moveTo(9 + s * 3, 8); x.quadraticCurveTo(9 + s * (5 + k), 7.5 - k * 0.4, 9 + s * (6 + k), 10.4 - k * 0.6 + (f && k === 1 ? -1 : 0)); x.stroke(); }
    const g = x.createRadialGradient(7.6, 6, 0.5, 9, 7.6, 5); g.addColorStop(0, rgb(mix(C, '#ffffff', 0.45))); g.addColorStop(0.6, rgb(C)); g.addColorStop(1, rgb(mix(C, INK, 0.3)));
    x.fillStyle = g; x.strokeStyle = Cd; x.lineWidth = 0.6; x.beginPath(); x.ellipse(9, 7.6, 4.6, 3, 0, 0, 7); x.fill(); x.stroke();
    for (const [cx, cy] of [[3, 5 + up], [15, 5 - up]]) { x.fillStyle = rgb(C); x.beginPath(); x.ellipse(cx, cy, 1.9, 1.5, 0, 0, 7); x.fill(); x.stroke(); x.beginPath(); x.moveTo(cx - 0.4, cy - 0.2); x.lineTo(cx + 1.4, cy - 1); x.stroke(); }
    x.beginPath(); x.moveTo(5, 7); x.lineTo(4, 6 + up); x.moveTo(13, 7); x.lineTo(14, 6 - up); x.stroke();
    for (const ex of [7.6, 10.4]) { x.fillStyle = '#ffffff'; x.beginPath(); x.arc(ex, 4.6, 0.9, 0, 7); x.fill(); x.fillStyle = '#141414'; x.beginPath(); x.arc(ex, 4.7, 0.5, 0, 7); x.fill(); }
  };
  OBJ.starfish.paint = (x, v) => {
    const C = hex(v ? '#f0a040' : '#e86a8a'), pts = [];
    for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 1.9 : 4.6; pts.push([6 + Math.cos(a) * r, 5.4 + Math.sin(a) * r * 0.8]); }
    const g = x.createRadialGradient(5, 4.4, 0.4, 6, 5.4, 4.6); g.addColorStop(0, rgb(mix(C, '#ffffff', 0.4))); g.addColorStop(1, rgb(mix(C, INK, 0.2)));
    x.fillStyle = g; x.strokeStyle = rgb(mix(C, INK, 0.45)); x.lineWidth = 0.5; x.lineJoin = 'round';
    x.beginPath(); pts.forEach((p, i) => (i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]))); x.closePath(); x.fill(); x.stroke();
    x.fillStyle = 'rgba(255,240,208,0.9)'; for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + k * Math.PI * 2 / 5; for (const r of [1.4, 2.6]) { x.beginPath(); x.arc(6 + Math.cos(a) * r, 5.4 + Math.sin(a) * r * 0.8, 0.35, 0, 7); x.fill(); } }
  };

  // ------------------------------------------------------------ cabine téléphonique et distributeur
  function rr(x, x0, y0, w, h, r) { x.beginPath(); x.moveTo(x0 + r, y0); x.lineTo(x0 + w - r, y0); x.quadraticCurveTo(x0 + w, y0, x0 + w, y0 + r); x.lineTo(x0 + w, y0 + h - r); x.quadraticCurveTo(x0 + w, y0 + h, x0 + w - r, y0 + h); x.lineTo(x0 + r, y0 + h); x.quadraticCurveTo(x0, y0 + h, x0, y0 + h - r); x.lineTo(x0, y0 + r); x.quadraticCurveTo(x0, y0, x0 + r, y0); x.closePath(); }
  function glass(x, x0, y0, w, h) {
    const g = x.createLinearGradient(x0, y0, x0 + w, y0 + h); g.addColorStop(0, '#d8f4ff'); g.addColorStop(0.45, '#7ccaf0'); g.addColorStop(1, '#3a7ab0');
    x.fillStyle = g; x.fillRect(x0, y0, w, h);
    x.fillStyle = 'rgba(255,255,255,0.55)'; x.beginPath(); x.moveTo(x0 + 1, y0 + h * 0.55); x.lineTo(x0 + w * 0.45, y0 + 1); x.lineTo(x0 + w * 0.62, y0 + 1); x.lineTo(x0 + 1, y0 + h * 0.8); x.closePath(); x.fill();
  }
  OBJ.booth.lights = [[15, 3.4, 14, 'rgba(255,230,120,0.6)'], [15, 30, 20, 'rgba(160,230,255,0.45)']];   // gyrophare et intérieur éclairés la nuit
  OBJ.booth.paint = x => {
    x.fillStyle = 'rgba(60,50,30,0.4)'; x.beginPath(); x.ellipse(15, 56, 13, 2.2, 0, 0, 7); x.fill();
    stone(x, [[3, 56], [3, 50.5], [27, 50.5], [27, 56]], '#9aa0aa', 181, { sharp: true });
    // cadre métallique laqué blanc, vitres avec reflet
    const fg = x.createLinearGradient(4, 0, 26, 0); fg.addColorStop(0, '#ffffff'); fg.addColorStop(1, '#a8b2c0');
    x.fillStyle = fg; x.strokeStyle = '#4a5468'; x.lineWidth = 0.9; rr(x, 4, 14, 22, 38, 1.4); x.fill(); x.stroke();
    glass(x, 6.5, 17, 17, 31);
    x.strokeStyle = '#d8e0ea'; x.lineWidth = 1; x.beginPath(); x.moveTo(15, 17); x.lineTo(15, 48); x.moveTo(6.5, 32); x.lineTo(23.5, 32); x.stroke();
    // téléphone vert, écran, combiné et fil
    x.fillStyle = '#2f9a58'; rr(x, 16.5, 22, 5.4, 9, 0.8); x.fill(); x.fillStyle = '#c8f0d0'; x.fillRect(17.2, 23, 4, 2.4);
    x.fillStyle = '#1a5a30'; x.fillRect(15.6, 24, 1.4, 6); x.strokeStyle = '#1a1a1a'; x.lineWidth = 0.5; x.beginPath(); x.moveTo(16.3, 30); x.quadraticCurveTo(15, 34, 18, 36); x.stroke();
    x.save(); x.shadowColor = '#ff7a3a'; x.shadowBlur = 3; x.fillStyle = '#ff8a4a'; x.fillRect(16, 18.4, 7, 1.4); x.restore();
    // toit bleu bombé, enseigne TEL, gyrophare
    const tg = x.createLinearGradient(0, 7, 0, 15); tg.addColorStop(0, '#6a9ae8'); tg.addColorStop(1, '#2a56a8');
    x.fillStyle = tg; x.strokeStyle = '#1a3470'; x.lineWidth = 0.9; rr(x, 2, 7, 26, 8, 3); x.fill(); x.stroke();
    x.fillStyle = '#ffffff'; x.fillRect(7, 8.4, 16, 6); const W = DW.World.signText; if (W) W({ deco: { rect: (a, b, c, d, col) => { x.fillStyle = col; x.fillRect(a, b, c, d); } }, rect: (a, b, c, d, col) => { x.fillStyle = col; x.fillRect(a, b, c, d); } }, 'TEL', 9, 9, '#2a5ab8', 1);
    x.fillStyle = '#3f72cc'; rr(x, 13, 2, 4, 6, 1.6); x.fill();
    x.save(); x.shadowColor = '#ffe060'; x.shadowBlur = 4; x.fillStyle = '#ffe060'; x.beginPath(); x.arc(15, 3.4, 1.3, 0, 7); x.fill(); x.restore();
  };
  OBJ.vending.paint = (x, v) => {
    const body = ['#2ec060', '#2a74e8', '#f07a1a'][v], dark = ['#147a38', '#163e96', '#9a4410'][v], item = ['#ff4a5a', '#7ad0ff', '#c8643c'][v], B = hex(body);
    x.fillStyle = 'rgba(20,20,20,0.4)'; x.beginPath(); x.ellipse(13, 43, 12, 2, 0, 0, 7); x.fill();
    const g = x.createLinearGradient(1, 0, 25, 0); g.addColorStop(0, rgb(mix(B, '#ffffff', 0.3))); g.addColorStop(0.55, body); g.addColorStop(1, rgb(mix(B, INK, 0.35)));
    x.fillStyle = g; x.strokeStyle = rgb(mix(B, INK, 0.6)); x.lineWidth = 0.9; rr(x, 1, 6, 24, 37, 2); x.fill(); x.stroke();
    x.fillStyle = dark; rr(x, 0, 0, 26, 8, 2); x.fill();
    x.save(); x.shadowColor = '#fff6c0'; x.shadowBlur = 4; x.fillStyle = '#fff6c0'; x.fillRect(2, 1.6, 22, 4.8); x.restore(); x.fillStyle = item; x.fillRect(4, 2.6, 18, 2.8);
    glass(x, 3, 9, 14, 20);
    for (let r = 0; r < 4; r++) { x.fillStyle = 'rgba(120,150,170,0.9)'; x.fillRect(3, 13.6 + r * 5, 14, 0.8); for (let k = 0; k < 3; k++) { x.fillStyle = item; rr(x, 4 + k * 4.4, 10.4 + r * 5, 3.2, 3, 0.6); x.fill(); x.fillStyle = 'rgba(255,255,255,0.5)'; x.fillRect(4.4 + k * 4.4, 10.8 + r * 5, 0.8, 1.6); } }
    x.fillStyle = '#ffe070'; x.fillRect(19, 10, 4, 3); x.fillStyle = '#1a1a1a'; x.fillRect(19.6, 14, 2.8, 1.4);
    for (let r = 0; r < 3; r++) { x.fillStyle = ['#ff5050', '#50d050', '#ffffff'][r]; x.beginPath(); x.arc(21, 18 + r * 3.4, 1.1, 0, 7); x.fill(); }
    x.fillStyle = '#141414'; rr(x, 4, 32, 18, 6, 1); x.fill(); x.fillStyle = '#3a3a3a'; x.fillRect(4, 32, 18, 1.4);
  };

  // ------------------------------------------------------------ VILLAGE : haies, massifs, réverbères, bancs, drapeaux, tonneaux, caisses
  OBJ.hedge.paint = (x, v) => {
    x.fillStyle = 'rgba(14,40,16,0.4)'; x.beginPath(); x.ellipse(9, 18, 8.5, 2, 0, 0, 7); x.fill();
    P.crown(x, { seed: 201 + v, cx: 9, cy: 11, rx: 8.4, ry: 7, P: v ? ['#3e9446', '#22602e', '#7ac860'] : ['#3a8c40', '#1e5a2c', '#6cb858'], n: 9, touches: 70 });
    if (v) for (const [fx, fy, c] of [[5, 12, '#ffffff'], [12, 10, '#ffd0e0'], [9, 6, '#ffffff'], [14, 13, '#ffd0e0']]) { x.fillStyle = c; for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; x.beginPath(); x.arc(fx + Math.cos(a) * 0.8, fy + Math.sin(a) * 0.8, 0.6, 0, 7); x.fill(); } x.fillStyle = '#f0c040'; x.fillRect(fx - 0.3, fy - 0.3, 0.6, 0.6); }
  };
  // massif de fleurs dans un bac de bois (v : couleurs ; 3 et 4 = fleurs d'hiver et d'automne, gfx/meteo.js)
  OBJ.flowerbed.paint = (x, v) => {
    const cols = [['#ff5a7a', '#ffd84a', '#ffffff'], ['#b48aff', '#ff9ac8', '#fff2a0'], ['#ff9a4a', '#ffe060', '#ff5a5a'], ['#7a4ad8', '#ffd84a', '#f4f0ff'], ['#e8902a', '#c84a3a', '#f0c040']][v] || ['#ff5a7a', '#ffd84a', '#ffffff'];
    plank(x, 1, 8.5, 18, 6.5, '#9a5a2a', 211 + v);
    x.fillStyle = '#3a2412'; x.fillRect(2, 8.5, 16, 1.6);
    for (let i = 0; i < 9; i++) { const fx = 2.6 + i * 1.9 + hash(v, i, 212) * 0.8, fy = 5.2 + (i % 3) * 1.3; x.strokeStyle = '#3a8a30'; x.lineWidth = 0.6; x.beginPath(); x.moveTo(fx, 9); x.lineTo(fx, fy + 0.8); x.stroke(); x.fillStyle = '#4a9a3a'; x.beginPath(); x.ellipse(fx + 0.8, 8, 1, 0.5, -0.5, 0, 7); x.fill(); }
    for (let i = 0; i < 9; i++) { const fx = 2.6 + i * 1.9 + hash(v, i, 212) * 0.8, fy = 5.2 + (i % 3) * 1.3, c = cols[i % 3]; x.fillStyle = c; for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2 + i; x.beginPath(); x.arc(fx + Math.cos(a) * 0.9, fy + Math.sin(a) * 0.9, 0.7, 0, 7); x.fill(); } x.fillStyle = 'rgba(255,255,255,0.7)'; x.fillRect(fx - 0.6, fy - 0.8, 0.5, 0.5); x.fillStyle = '#f0c040'; x.fillRect(fx - 0.3, fy - 0.3, 0.6, 0.6); }
  };
  // réverbère en fer forgé, lanterne de verre (halo : lumières de la carte)
  OBJ.lamp.paint = x => {
    x.fillStyle = 'rgba(20,20,20,0.35)'; x.beginPath(); x.ellipse(6, 31, 4, 1.3, 0, 0, 7); x.fill();
    const g = x.createLinearGradient(4.6, 0, 7.4, 0); g.addColorStop(0, '#6a6278'); g.addColorStop(1, '#241e2c');
    x.fillStyle = g; x.fillRect(4.8, 10, 2.4, 21); x.fillStyle = '#2a2430'; x.fillRect(3.4, 28.6, 5.2, 2.4); x.fillRect(4.2, 26, 3.6, 1.2);
    x.strokeStyle = '#2a2430'; x.lineWidth = 0.7; x.beginPath(); x.moveTo(6, 12); x.quadraticCurveTo(9, 11, 8.6, 8.6); x.moveTo(6, 12); x.quadraticCurveTo(3, 11, 3.4, 8.6); x.stroke();
    x.save(); x.shadowColor = '#ffd870'; x.shadowBlur = 5; const lg = x.createLinearGradient(0, 3, 0, 10); lg.addColorStop(0, '#fff6c8'); lg.addColorStop(1, '#ffc850'); x.fillStyle = lg; x.beginPath(); x.moveTo(3, 3.4); x.lineTo(9, 3.4); x.lineTo(8.2, 10); x.lineTo(3.8, 10); x.closePath(); x.fill(); x.restore();
    x.strokeStyle = '#2a2430'; x.lineWidth = 0.8; x.beginPath(); x.moveTo(3, 3.4); x.lineTo(9, 3.4); x.lineTo(8.2, 10); x.lineTo(3.8, 10); x.closePath(); x.moveTo(6, 3.4); x.lineTo(6, 10); x.stroke();
    x.fillStyle = '#2a2430'; x.beginPath(); x.moveTo(2, 3.6); x.lineTo(6, 0.6); x.lineTo(10, 3.6); x.closePath(); x.fill(); x.fillRect(5.4, 10, 1.2, 1.4);
  };
  // banc de parc : lattes de bois sur pieds de fonte
  OBJ.bench.paint = x => {
    x.fillStyle = 'rgba(20,20,20,0.3)'; x.beginPath(); x.ellipse(11, 13.4, 10, 1.4, 0, 0, 7); x.fill();
    x.fillStyle = '#2e2a32'; for (const lx of [3, 17]) { x.fillRect(lx, 3, 1.6, 10.6); x.fillRect(lx - 0.6, 12.6, 2.8, 1); }
    for (let k = 0; k < 2; k++) plank(x, 2, 2.6 + k * 2.2, 18, 1.8, '#a0703c', 221 + k);
    for (let k = 0; k < 2; k++) plank(x, 2, 7.6 + k * 1.8, 18, 1.6, '#b8844c', 223 + k);
  };
  // drapeau qui flotte
  OBJ.flag.paint = (x, v) => {
    const pg = x.createLinearGradient(3, 0, 5, 0); pg.addColorStop(0, '#f0ece4'); pg.addColorStop(1, '#8a8478'); x.fillStyle = pg; x.fillRect(3.2, 2, 1.6, 31);
    x.fillStyle = '#d8b040'; x.beginPath(); x.arc(4, 1.6, 1.2, 0, 7); x.fill();
    const C = hex(v ? '#3a8ae8' : '#f8a830'), cg = x.createLinearGradient(5, 0, 15, 0); cg.addColorStop(0, rgb(C)); cg.addColorStop(1, rgb(mix(C, INK, 0.25)));
    x.fillStyle = cg; x.beginPath(); x.moveTo(5, 3); x.quadraticCurveTo(10, 2, 15, 5.4); x.quadraticCurveTo(11, 7.6, 15, 11); x.quadraticCurveTo(10, 10, 5, 12); x.closePath(); x.fill();
    x.fillStyle = 'rgba(255,255,255,0.35)'; x.beginPath(); x.moveTo(5, 3); x.quadraticCurveTo(9, 2.4, 12, 4.4); x.lineTo(5, 6); x.fill();
    x.fillStyle = '#ffffff'; x.beginPath(); x.arc(8.4, 7.2, 1.4, 0, 7); x.fill();
  };
  // tonneau cerclé (v1 : caisse)
  OBJ.barrel.paint = (x, v) => {
    x.fillStyle = 'rgba(20,20,20,0.3)'; x.beginPath(); x.ellipse(8, 17.4, 6.4, 1.3, 0, 0, 7); x.fill();
    if (v) { plank(x, 2, 4, 12, 13, '#b8844c', 231); x.strokeStyle = '#7a5028'; x.lineWidth = 0.8; x.beginPath(); x.moveTo(2, 4); x.lineTo(14, 17); x.moveTo(14, 4); x.lineTo(2, 17); x.stroke(); x.strokeStyle = '#4a2c14'; x.strokeRect(2, 4, 12, 13); return; }
    const g = x.createLinearGradient(2, 0, 14, 0); g.addColorStop(0, '#c89060'); g.addColorStop(0.45, '#9a6a3c'); g.addColorStop(1, '#5a3a1e');
    x.fillStyle = g; x.strokeStyle = '#3a2210'; x.lineWidth = 0.8; x.beginPath(); x.moveTo(3, 4); x.quadraticCurveTo(1.2, 10, 3, 17); x.lineTo(13, 17); x.quadraticCurveTo(14.8, 10, 13, 4); x.closePath(); x.fill(); x.stroke();
    x.strokeStyle = 'rgba(58,34,16,0.6)'; x.lineWidth = 0.5; for (const sx of [5.5, 8, 10.5]) { x.beginPath(); x.moveTo(sx, 4); x.lineTo(sx, 17); x.stroke(); }
    x.strokeStyle = '#5a5a62'; x.lineWidth = 1; for (const yy of [6.5, 14.5]) { x.beginPath(); x.moveTo(2.2, yy); x.quadraticCurveTo(8, yy + 0.8, 13.8, yy); x.stroke(); }
    x.fillStyle = '#c89a62'; x.beginPath(); x.ellipse(8, 4, 5, 1.6, 0, 0, 7); x.fill(); x.strokeStyle = '#5a3a1e'; x.lineWidth = 0.6; x.stroke();
  };
  OBJ.crates.paint = (x, v) => {
    x.fillStyle = 'rgba(20,20,20,0.3)'; x.beginPath(); x.ellipse(9, 23.4, 8, 1.4, 0, 0, 7); x.fill();
    const box = (bx, by, s, col, seed) => { plank(x, bx, by, s, s, col, seed); x.strokeStyle = '#4a2c14'; x.lineWidth = 0.8; x.strokeRect(bx, by, s, s); x.strokeStyle = 'rgba(90,56,28,0.9)'; x.beginPath(); x.moveTo(bx, by); x.lineTo(bx + s, by + s); x.moveTo(bx + s, by); x.lineTo(bx, by + s); x.stroke(); x.fillStyle = 'rgba(255,230,190,0.5)'; x.fillRect(bx, by, s, 1); };
    box(1, 11, 12, '#b8844c', 241); box(v ? 7 : 4, 1, 10, '#c8945a', 242);
    if (v) { x.fillStyle = '#9a6a3c'; x.beginPath(); x.ellipse(15, 19, 2.6, 4, 0, 0, 7); x.fill(); }
  };

  // ------------------------------------------------------------ rosier (Rosière) : buisson sombre et roses épanouies (v : rouge, blanc, rose)
  OBJ.rosebush.paint = (x, v) => {
    x.fillStyle = 'rgba(14,40,16,0.4)'; x.beginPath(); x.ellipse(13, 22, 11, 2, 0, 0, 7); x.fill();
    P.crown(x, { seed: 301 + v, cx: 13, cy: 13.5, rx: 11, ry: 8.5, P: ['#2f7a3a', '#1a4a28', '#5aa04a'], n: 10, touches: 80 });
    const C = [['#c8203a', '#f04a62', '#ff9aa8'], ['#e8e2dc', '#fffaf6', '#ffffff'], ['#e86a9a', '#ffa0c4', '#ffd8e8']][v];
    for (let i = 0; i < 7; i++) {
      const rx = 4 + hash(v, i, 311) * 18, ry = 7 + hash(v, i, 312) * 11, r = 1.6 + hash(v, i, 313) * 0.8;
      x.fillStyle = C[0]; x.beginPath(); x.arc(rx, ry, r, 0, 7); x.fill();
      x.fillStyle = C[1]; x.beginPath(); x.arc(rx - 0.3, ry - 0.3, r * 0.7, 0, 7); x.fill();
      x.strokeStyle = C[0]; x.lineWidth = 0.4; x.beginPath(); x.arc(rx - 0.2, ry - 0.2, r * 0.35, 0.5, 5.2); x.stroke();
      x.fillStyle = C[2]; x.fillRect(rx - r * 0.6, ry - r * 0.6, 0.6, 0.6);
    }
  };
})();
