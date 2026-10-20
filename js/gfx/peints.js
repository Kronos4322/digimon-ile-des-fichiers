'use strict';
// =====================================================================
//  DÉCOR PEINT — cailloux, ponton, passage du Grand Arbre, épave, crabe, cabines téléphoniques, fanion
//  au même pinceau (gfx/pinceau.js) : lumière chaude en haut à gauche, ombres froides,
//  liseré de lumière, contour sombre discret, matière (facettes de pierre, bois, mousse). Rendu : World.obj (o.paint).
//  (rochers, souches, buissons, fougères, champignons, palmiers... : images du joueur, gfx/textures.js)
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
  OBJ.pebbles.paint = (x, v) => { for (const [cx, cy, rx, ry] of [[4, 6, 2.6, 1.6], [9, 5.6, 2, 1.4], [11.6, 7, 1.4, 0.9]]) stone(x, Array.from({ length: 7 }, (_, k) => { const a = k / 7 * Math.PI * 2; return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]; }), v ? '#7a7068' : '#6a6660', 41); };

  // mousse posée sur le bois (épave de la crique)
  function moss(x, pts, seed) { for (let i = 0; i < pts.length; i++) { const [px, py] = pts[i]; x.fillStyle = hash(seed, i, 951) < 0.5 ? '#5aa844' : '#88cc5c'; x.beginPath(); x.ellipse(px, py, 2.2, 1.1, 0, 0, 7); x.fill(); } }

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
  // source : margelle de pierres rondes, eau claire et profonde, bouillons
  // monolithe de données : pierre ancienne, runes numériques qui luisent
  // dalle de circuit à moitié enterrée
  // antenne de données : mât métallique, voyant
  // banc / ponton de bois
  OBJ.dock.paint = x => {
    for (const px of [3, 15, 28]) post(x, px, 12, 19.5, 2, '#5a3a1a');
    for (let i = 0; i < 6; i++) plank(x, 1 + i * 5, 4, 5, 10, i % 2 ? '#a06e3c' : '#946434', 100 + i);
    x.fillStyle = 'rgba(255,240,200,0.35)'; x.fillRect(1, 4, 30, 0.7);
  };

  // ------------------------------------------------------------ le Grand Arbre de la Clairière (porte de Kuwagamon)
  // v0 écorce gravée, v1-v2 fissures lumineuses (énigmes résolues), v3 écorce éclatée sur un passage sombre
  // l'entrée (aussi posée sur l'arbre dessiné par le joueur : gfx/textures.js)
  const porteGrandArbre = OBJ.grandarbre.porte = (x, v) => {
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
  };
  // l'arbre lui-même : l'image du joueur (gfx/textures.js) ; ici son secours, si l'image manque : tronc et couronne simples
  OBJ.grandarbre.paint = (x, v) => {
    x.fillStyle = '#6a4626'; x.fillRect(51, 54, 30, 92);
    x.fillStyle = '#3f9a40'; x.beginPath(); x.ellipse(66, 44, 50, 30, 0, 0, 7); x.fill();
    porteGrandArbre(x, v);
  };


  // ------------------------------------------------------------ bateaux, épave, arche, château de sable, crabes, étoiles de mer
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

  // ------------------------------------------------------------ VILLAGE : haies, massifs, réverbères, bancs, drapeaux, tonneaux, caisses
  // massif de fleurs dans un bac de bois (v : couleurs ; 3 et 4 = fleurs d'hiver et d'automne, gfx/meteo.js)
  // réverbère en fer forgé, lanterne de verre (halo : lumières de la carte)
  // banc de parc : lattes de bois sur pieds de fonte
  // drapeau qui flotte
  OBJ.flag.paint = (x, v) => {
    const pg = x.createLinearGradient(3, 0, 5, 0); pg.addColorStop(0, '#f0ece4'); pg.addColorStop(1, '#8a8478'); x.fillStyle = pg; x.fillRect(3.2, 2, 1.6, 31);
    x.fillStyle = '#d8b040'; x.beginPath(); x.arc(4, 1.6, 1.2, 0, 7); x.fill();
    const C = hex(v ? '#3a8ae8' : '#f8a830'), cg = x.createLinearGradient(5, 0, 15, 0); cg.addColorStop(0, rgb(C)); cg.addColorStop(1, rgb(mix(C, INK, 0.25)));
    x.fillStyle = cg; x.beginPath(); x.moveTo(5, 3); x.quadraticCurveTo(10, 2, 15, 5.4); x.quadraticCurveTo(11, 7.6, 15, 11); x.quadraticCurveTo(10, 10, 5, 12); x.closePath(); x.fill();
    x.fillStyle = 'rgba(255,255,255,0.35)'; x.beginPath(); x.moveTo(5, 3); x.quadraticCurveTo(9, 2.4, 12, 4.4); x.lineTo(5, 6); x.fill();
    x.fillStyle = '#ffffff'; x.beginPath(); x.arc(8.4, 7.2, 1.4, 0, 7); x.fill();
  };

  // ------------------------------------------------------------ rosier (Rosière) : buisson sombre et roses épanouies (v : rouge, blanc, rose)
})();
