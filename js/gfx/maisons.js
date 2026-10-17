'use strict';
// =====================================================================
//  MAISONS DU DÉBUT, PEINTES — la cabane de Jijimon (ville en ruines) et ta cabane
//  au même pinceau que le décor (gfx/arbres.js, gfx/peints.js) : lumière chaude en haut à gauche,
//  ombres froides, planches veinées une à une, toit de bardeaux moussus rapiécé de tôle,
//  soubassement de pierres, fenêtre éclairée, fenêtre condamnée, tas de bois, lierre, herbes au pied.
//  La porte reste à la même place que l'ancien dessin (porte de la carte) : centre cx, de 0.58 H à 0.9 H.
// =====================================================================
(function () {
  const OBJ = DW.World.OBJ, P = DW.World.Paint, hash = DW.Art.hash;
  const { rgb, mix, hex, COOL, WARM, INK } = P;
  const rr = (x, x0, y0, w, h, r) => { x.beginPath(); x.moveTo(x0 + r, y0); x.arcTo(x0 + w, y0, x0 + w, y0 + h, r); x.arcTo(x0 + w, y0 + h, x0, y0 + h, r); x.arcTo(x0, y0 + h, x0, y0, r); x.arcTo(x0, y0, x0 + w, y0, r); x.closePath(); };

  // une planche verticale : teinte propre, côté gauche éclairé, veines, nœud, clous
  function plank(x, x0, y0, w, h, base, seed) {
    const C = mix(base, hash(seed, 1, 601) < 0.5 ? '#c8a878' : '#5a4a3a', hash(seed, 2, 601) * 0.35);
    const g = x.createLinearGradient(x0, 0, x0 + w, 0);
    g.addColorStop(0, rgb(mix(C, WARM, 0.22))); g.addColorStop(0.35, rgb(C)); g.addColorStop(1, rgb(mix(C, COOL, 0.3)));
    x.fillStyle = g; x.fillRect(x0, y0, w, h);
    // salissures en bas, ombre portée du toit en haut
    const v = x.createLinearGradient(0, y0, 0, y0 + h);
    v.addColorStop(0, 'rgba(12,20,30,0.5)'); v.addColorStop(0.16, 'rgba(12,20,30,0)'); v.addColorStop(0.82, 'rgba(40,30,20,0)'); v.addColorStop(1, 'rgba(40,30,20,0.35)');
    x.fillStyle = v; x.fillRect(x0, y0, w, h);
    // veines du bois
    x.strokeStyle = rgb(mix(C, INK, 0.45), 0.55); x.lineWidth = 0.35;
    for (let k = 0; k < 3; k++) { const gx = x0 + w * (0.25 + k * 0.25) + (hash(seed, k, 602) - 0.5); x.beginPath(); x.moveTo(gx, y0 + 1); x.bezierCurveTo(gx + 0.6, y0 + h * 0.35, gx - 0.6, y0 + h * 0.65, gx + 0.3, y0 + h - 1); x.stroke(); }
    if (hash(seed, 3, 603) < 0.5) { const ky = y0 + h * (0.3 + hash(seed, 4, 603) * 0.4); x.fillStyle = rgb(mix(C, INK, 0.55)); x.beginPath(); x.ellipse(x0 + w * 0.5, ky, w * 0.16, w * 0.24, 0, 0, 7); x.fill(); x.strokeStyle = rgb(mix(C, WARM, 0.2), 0.6); x.beginPath(); x.ellipse(x0 + w * 0.5, ky, w * 0.28, w * 0.4, 0, 0, 7); x.stroke(); }
    // joint sombre et clous
    x.fillStyle = rgb(mix(C, INK, 0.7)); x.fillRect(x0 + w - 0.45, y0, 0.45, h);
    x.fillStyle = '#3a3430'; for (const ny of [y0 + h * 0.2, y0 + h * 0.86]) { x.beginPath(); x.arc(x0 + w * 0.5, ny, 0.32, 0, 7); x.fill(); }
  }
  // pierre arrondie du soubassement
  function stone(x, cx, cy, rx, ry, col, seed) {
    const C = mix(col, hash(seed, 1, 611) < 0.5 ? '#c8c0b0' : '#6a6460', hash(seed, 2, 611) * 0.3);
    const g = x.createRadialGradient(cx - rx * 0.35, cy - ry * 0.45, 0.3, cx, cy, Math.max(rx, ry) * 1.1);
    g.addColorStop(0, rgb(mix(C, WARM, 0.45))); g.addColorStop(0.5, rgb(C)); g.addColorStop(1, rgb(mix(C, COOL, 0.45)));
    x.fillStyle = g; x.strokeStyle = rgb(mix(C, INK, 0.6)); x.lineWidth = 0.5;
    x.beginPath(); x.ellipse(cx, cy, rx, ry, (hash(seed, 3, 611) - 0.5) * 0.4, 0, 7); x.fill(); x.stroke();
    if (hash(seed, 4, 611) < 0.4) { x.fillStyle = 'rgba(90,140,60,0.75)'; x.beginPath(); x.ellipse(cx - rx * 0.2, cy - ry * 0.6, rx * 0.5, ry * 0.3, 0, 0, 7); x.fill(); }
  }
  // touffes d'herbe au pied des murs
  function tufts(x, x0, x1, y, seed, n) {
    for (let i = 0; i < n; i++) {
      const tx = x0 + hash(seed, i, 621) * (x1 - x0), hh = 2 + hash(seed, i, 622) * 3;
      for (let b = -2; b <= 2; b++) { x.strokeStyle = b < 0 ? '#3a7a30' : b > 0 ? '#2a5a26' : '#6ab048'; x.lineWidth = 0.6; x.beginPath(); x.moveTo(tx + b * 0.5, y); x.quadraticCurveTo(tx + b * 0.9, y - hh * 0.6, tx + b * 1.4, y - hh); x.stroke(); }
    }
  }
  // fenêtre : cadre de bois, vitres (éclairées de l'intérieur ou fêlées), ou condamnée par deux planches
  function window_(x, x0, y0, w, h, kind, seed) {
    x.fillStyle = '#4a3220'; rr(x, x0 - 1.2, y0 - 1.2, w + 2.4, h + 2.4, 0.8); x.fill();
    if (kind === 'lit') {
      const g = x.createLinearGradient(0, y0, 0, y0 + h); g.addColorStop(0, '#ffe8a0'); g.addColorStop(1, '#f0a050');
      x.save(); x.shadowColor = '#ffc860'; x.shadowBlur = 3; x.fillStyle = g; x.fillRect(x0, y0, w, h); x.restore();
      x.fillStyle = 'rgba(255,255,255,0.45)'; x.beginPath(); x.moveTo(x0, y0 + h * 0.6); x.lineTo(x0 + w * 0.4, y0); x.lineTo(x0 + w * 0.55, y0); x.lineTo(x0, y0 + h * 0.85); x.fill();
      // petit rideau à carreaux
      x.fillStyle = 'rgba(200,70,60,0.75)'; x.beginPath(); x.moveTo(x0, y0); x.lineTo(x0 + w * 0.3, y0); x.quadraticCurveTo(x0 + w * 0.1, y0 + h * 0.5, x0 + w * 0.22, y0 + h); x.lineTo(x0, y0 + h); x.fill();
    } else {
      const g = x.createLinearGradient(x0, y0, x0 + w, y0 + h); g.addColorStop(0, '#2a3440'); g.addColorStop(1, '#141820');
      x.fillStyle = g; x.fillRect(x0, y0, w, h);
      if (kind === 'cracked') { x.fillStyle = 'rgba(160,200,220,0.55)'; x.fillRect(x0, y0, w * 0.5, h); x.strokeStyle = 'rgba(230,245,255,0.8)'; x.lineWidth = 0.35; x.beginPath(); x.moveTo(x0 + w * 0.2, y0 + h * 0.3); x.lineTo(x0 + w * 0.45, y0 + h * 0.55); x.lineTo(x0 + w * 0.35, y0 + h * 0.9); x.moveTo(x0 + w * 0.45, y0 + h * 0.55); x.lineTo(x0 + w * 0.7, y0 + h * 0.45); x.stroke(); }
    }
    // croisillons
    x.fillStyle = '#4a3220'; x.fillRect(x0 + w / 2 - 0.5, y0, 1, h); x.fillRect(x0, y0 + h / 2 - 0.5, w, 1);
    // appui de fenêtre éclairé
    plank(x, x0 - 2, y0 + h + 0.6, w + 4, 1.6, '#8a6440', seed + 5);
    if (kind === 'boarded') for (const [a, b, s] of [[[x0 - 2, y0 + 1], [x0 + w + 2, y0 + h - 1], 1], [[x0 - 2, y0 + h - 1.5], [x0 + w + 2, y0 + 1.5], 2]]) {
      x.save(); x.translate(a[0], a[1]); x.rotate(Math.atan2(b[1] - a[1], b[0] - a[0])); plank(x, 0, -1.2, Math.hypot(b[0] - a[0], b[1] - a[1]), 2.4, '#a08458', seed + s * 7); x.restore();
    }
  }
  // toit : bardeaux de bois en rangées (chaque bardeau sa teinte), mousse, un rapiéçage de tôle
  function roof(x, pts, top, bottom, base, seed, W) {
    x.save();
    const path = () => { x.beginPath(); pts.forEach((p, i) => (i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]))); x.closePath(); };
    path(); x.fillStyle = rgb(mix(base, INK, 0.3)); x.fill(); x.clip();
    const sw = Math.max(4, W * 0.055), sh = Math.max(3, (bottom - top) / 7);
    for (let r = 0, y = top - 1; y < bottom + sh; r++, y += sh * 0.82) {
      const k = (y - top) / (bottom - top);   // plus bas = plus de lumière qui rase
      for (let i = -1, xx = (r % 2) * sw * 0.5 - sw; xx < W + sw; i++, xx += sw) {
        const C = mix(base, hash(seed + r, i, 631) < 0.5 ? '#c8a070' : '#5a4430', hash(seed + r, i, 632) * 0.45);
        const lx = 1 - xx / W, g = x.createLinearGradient(0, y, 0, y + sh);
        g.addColorStop(0, rgb(mix(C, WARM, 0.15 + lx * 0.25))); g.addColorStop(0.7, rgb(C)); g.addColorStop(1, rgb(mix(C, COOL, 0.45)));
        x.fillStyle = g; rr(x, xx + 0.2, y, sw - 0.4, sh, Math.min(1.4, sw * 0.25)); x.fill();
        x.fillStyle = rgb(mix(C, INK, 0.6), 0.7); x.fillRect(xx + 0.2, y + sh - 0.5, sw - 0.4, 0.5);
        if (k > 0.1 && hash(seed + r, i, 633) < 0.07) { x.fillStyle = 'rgba(20,14,10,0.8)'; x.fillRect(xx + sw * 0.3, y + sh * 0.2, sw * 0.4, sh * 0.6); }   // bardeau manquant
      }
    }
    // mousse en coussinets
    for (let i = 0; i < Math.round(W / 14); i++) {
      const mx = W * (0.08 + hash(seed, i, 641) * 0.84), my = top + (bottom - top) * (0.35 + hash(seed, i, 642) * 0.6), mr = 1.5 + hash(seed, i, 643) * W * 0.035;
      for (let j = 0; j < 7; j++) {   // plaque de mousse : petites taches serrées, plus claires au soleil
        const jx = mx + (hash(i, j, 644) - 0.5) * mr * 2.6, jy = my + (hash(i, j, 645) - 0.5) * mr * 0.8;
        x.fillStyle = j < 2 ? 'rgba(130,170,80,0.75)' : j < 5 ? 'rgba(78,118,52,0.7)' : 'rgba(46,80,40,0.7)';
        x.beginPath(); x.ellipse(jx, jy, mr * (0.35 + hash(i, j, 646) * 0.4), mr * 0.22, (hash(i, j, 647) - 0.5) * 0.5, 0, 7); x.fill();
      }
    }
    // rapiéçage de tôle ondulée rouillée (la touche « île des fichiers »)
    { const px = W * 0.56, py = top + (bottom - top) * 0.28, pw = W * 0.16, ph = (bottom - top) * 0.3;
      const g = x.createLinearGradient(px, 0, px + pw, 0);
      for (let k = 0; k <= 8; k++) g.addColorStop(k / 8, k % 2 ? '#7a5a4a' : '#b8784a');
      x.fillStyle = g; x.save(); x.translate(px, py); x.rotate(-0.06); x.fillRect(0, 0, pw, ph);
      x.fillStyle = 'rgba(150,70,30,0.45)'; x.fillRect(pw * 0.5, ph * 0.4, pw * 0.4, ph * 0.5);
      x.fillStyle = '#2a2420'; for (const [a, b] of [[1, 1], [pw - 1, 1], [1, ph - 1], [pw - 1, ph - 1]]) { x.beginPath(); x.arc(a, b, 0.4, 0, 7); x.fill(); }
      x.restore(); }
    // lumière rasante en haut à gauche, ombre en bas à droite
    const lg = x.createLinearGradient(0, top, W, bottom); lg.addColorStop(0, 'rgba(255,240,170,0.22)'); lg.addColorStop(0.5, 'rgba(255,240,170,0)'); lg.addColorStop(1, 'rgba(12,30,50,0.28)');
    x.fillStyle = lg; x.fillRect(0, top - 2, W, bottom - top + 6);
    x.restore();
    // bord du toit (rive) : une planche sombre et sa tranche éclairée
    x.strokeStyle = rgb(mix(base, INK, 0.65)); x.lineWidth = 1.1; x.lineJoin = 'round'; x.beginPath(); pts.forEach((p, i) => (i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]))); x.closePath(); x.stroke();
  }

  // ------------------------------------------------------------ la cabane (W × H, porte centrée en cx)
  function cabin(x, W, H, cx, o = {}) {
    const k = W / 184, s = o.seed || 7, y0 = H * 0.36, wy = H * 0.9, xl = W * 0.12, xr = W * 0.88;
    // ombre au sol
    const sg = x.createRadialGradient(cx, H - 3, 1, cx, H - 3, W * 0.5); sg.addColorStop(0, 'rgba(20,24,16,0.5)'); sg.addColorStop(1, 'rgba(20,24,16,0)');
    x.fillStyle = sg; x.beginPath(); x.ellipse(cx, H - 3.5, W * 0.5, 5 + 4 * k, 0, 0, 7); x.fill();
    // murs de planches (légèrement de travers sur la cabane en ruine)
    const pw = Math.max(4.2, 7.5 * k + 2);
    x.save(); x.beginPath(); x.rect(xl, y0, xr - xl, wy - y0); x.clip();
    for (let i = 0, px = xl; px < xr; i++, px += pw) plank(x, px, y0 - 1, pw, wy - y0 + 2, o.wood || '#8a7458', s * 10 + i);
    // deux planches clouées de travers (réparations)
    for (const [fx, fy, fw] of [[0.2, 0.56, 0.12], [0.64, 0.7, 0.1]]) { x.save(); x.translate(W * fx, H * fy); x.rotate(-0.08); plank(x, 0, 0, W * fw, Math.max(2.4, H * 0.045), '#a89068', s + fx * 100); x.restore(); }
    // ombre portée de l'avancée du toit
    const eg = x.createLinearGradient(0, y0, 0, y0 + H * 0.08); eg.addColorStop(0, 'rgba(10,18,30,0.6)'); eg.addColorStop(1, 'rgba(10,18,30,0)');
    x.fillStyle = eg; x.fillRect(xl, y0, xr - xl, H * 0.08);
    // côté droit dans l'ombre
    const rg = x.createLinearGradient(xl, 0, xr, 0); rg.addColorStop(0, 'rgba(255,240,180,0.10)'); rg.addColorStop(0.6, 'rgba(0,0,0,0)'); rg.addColorStop(1, 'rgba(12,30,50,0.3)');
    x.fillStyle = rg; x.fillRect(xl, y0, xr - xl, wy - y0);
    x.restore();
    // poutres d'angle
    for (const bx of [xl - 1, xr - 2.2]) plank(x, bx, y0 - 1, 3.2, wy - y0 + 1, '#6a4c30', s + bx);
    // soubassement de pierres
    for (let i = 0, sx = xl - 1; sx < xr + 1; i++) { const rx = 2.4 + hash(s, i, 651) * 2.2 * (0.6 + k * 0.6); stone(x, sx + rx, wy + 1.4, rx, 2.2 + k, '#9a948a', s * 3 + i); sx += rx * 1.8; }
    // porte de planches, traverse en Z, gonds de fer, poignée
    const dw = W * 0.18, dy = H * 0.58, dh = wy - dy;
    x.fillStyle = '#2a1a10'; rr(x, cx - dw / 2 - 1.2, dy - 1.2, dw + 2.4, dh + 1.2, 0.8); x.fill();
    const n = Math.max(3, Math.round(dw / 4.5));
    for (let i = 0; i < n; i++) plank(x, cx - dw / 2 + i * dw / n, dy, dw / n, dh, '#6a4a30', s * 7 + i);
    x.save(); x.strokeStyle = '#4a3220'; x.lineWidth = Math.max(1.4, dh * 0.08);
    x.beginPath(); x.moveTo(cx - dw / 2 + 1, dy + dh * 0.22); x.lineTo(cx + dw / 2 - 1, dy + dh * 0.22); x.moveTo(cx - dw / 2 + 1, dy + dh * 0.8); x.lineTo(cx + dw / 2 - 1, dy + dh * 0.8); x.moveTo(cx - dw / 2 + 1, dy + dh * 0.8); x.lineTo(cx + dw / 2 - 1, dy + dh * 0.22); x.stroke(); x.restore();
    x.fillStyle = '#2a2a2e'; for (const hy of [0.22, 0.8]) x.fillRect(cx - dw / 2 - 0.6, dy + dh * hy - 0.8, dw * 0.3, 1.6);
    x.fillStyle = '#d8b050'; x.beginPath(); x.arc(cx + dw * 0.3, dy + dh * 0.52, Math.max(0.6, dw * 0.05), 0, 7); x.fill();
    // fenêtres : une éclairée (on y vit !), une condamnée ou fêlée
    const ww = W * 0.12, wh = H * 0.13;
    window_(x, W * 0.22, H * 0.48, ww, wh, o.big ? 'lit' : 'boarded', s + 11);
    window_(x, W * 0.66, H * 0.48, ww, wh, o.big ? 'cracked' : 'lit', s + 13);
    // lanterne à côté de la porte
    { const lx = cx + dw / 2 + W * 0.04, ly = H * 0.6;
      x.strokeStyle = '#2a2a2e'; x.lineWidth = 0.6; x.beginPath(); x.moveTo(lx - 1.8, ly - 3); x.lineTo(lx, ly - 3); x.lineTo(lx, ly - 1.4); x.stroke();
      x.save(); x.shadowColor = '#ffc860'; x.shadowBlur = 4; x.fillStyle = '#ffd880'; rr(x, lx - 1.6, ly - 1.4, 3.2, 4, 0.8); x.fill(); x.restore();
      x.strokeStyle = '#2a2a2e'; x.lineWidth = 0.5; rr(x, lx - 1.6, ly - 1.4, 3.2, 4, 0.8); x.stroke(); }
    // toit de bardeaux (faîtage un peu affaissé)
    const rp = [[W * 0.03, y0 + 3], [W * 0.19, H * 0.1], [W * 0.5, H * 0.12], [W * 0.82, H * 0.08], [W * 0.97, y0 + 4]];
    roof(x, rp, H * 0.08, y0 + 4, o.roof || '#8a6848', s + 21, W);
    // cheminée de pierres (fumée : OBJ.jhouse.smoke)
    if (o.chimney) {
      const chx = W * o.chimney, cw = Math.max(5, W * 0.07), ct = H * 0.0, cb = H * 0.2;
      for (let r = 0, yy = cb; yy > ct; r++, yy -= 2.6) for (let c = 0; c < 3; c++) stone(x, chx + (c + 0.5 + (r % 2) * 0.4) * cw / 3, yy, cw / 6 + 0.3, 1.5, '#8a8478', s + r * 5 + c);
      x.fillStyle = '#2a2220'; x.fillRect(chx - 0.4, ct, cw + 0.8, 1.8);
    }
    // lierre qui grimpe sur le coin gauche
    for (let i = 0; i < Math.round(8 + 6 * k); i++) {
      const ly = wy - i * (H * 0.045), lx = xl + 1 + Math.sin(i * 1.3) * 2.4;
      x.fillStyle = i % 3 ? '#3a7a34' : '#62a848'; x.beginPath(); x.ellipse(lx, ly, 1.8 + k, 1.3 + k * 0.6, i, 0, 7); x.fill();
    }
    // tas de bois (bûches vues en bout) et seau
    { const bx = W * 0.865, by = wy - 1, br = Math.max(1.6, 2.6 * k + 1);
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3 - r; c++) {
        const lx = bx + c * br * 1.9 + r * br * 0.95, ly = by - r * br * 1.7;
        x.fillStyle = '#5a3a20'; x.beginPath(); x.arc(lx, ly, br, 0, 7); x.fill();
        x.fillStyle = '#c8945a'; x.beginPath(); x.arc(lx - 0.2, ly - 0.2, br * 0.72, 0, 7); x.fill();
        x.strokeStyle = '#8a5a30'; x.lineWidth = 0.3; x.beginPath(); x.arc(lx - 0.2, ly - 0.2, br * 0.38, 0, 7); x.stroke();
      } }
    { const bx = W * 0.07, by = wy, bw = Math.max(3.6, W * 0.045), bh = bw * 1.1;
      const g = x.createLinearGradient(bx - bw / 2, 0, bx + bw / 2, 0); g.addColorStop(0, '#c8ccd4'); g.addColorStop(1, '#5a606a');
      x.fillStyle = g; x.beginPath(); x.moveTo(bx - bw / 2, by - bh); x.lineTo(bx + bw / 2, by - bh); x.lineTo(bx + bw * 0.4, by); x.lineTo(bx - bw * 0.4, by); x.closePath(); x.fill();
      x.strokeStyle = '#3a3e46'; x.lineWidth = 0.4; x.beginPath(); x.ellipse(bx, by - bh, bw / 2, 0.8, 0, 0, 7); x.stroke();
      x.beginPath(); x.arc(bx, by - bh, bw * 0.45, Math.PI, 0); x.stroke(); }
    // chez Jijimon : un banc sous la fenêtre, une jardinière, un petit écriteau peint
    if (o.big) {
      for (let kk = 0; kk < 2; kk++) plank(x, W * 0.2, wy - 7 + kk * 2, W * 0.16, 1.8, '#a0703c', s + 31 + kk);
      x.fillStyle = '#2e2a32'; for (const lx of [W * 0.21, W * 0.35]) x.fillRect(lx, wy - 3.4, 1.2, 3.4);
      plank(x, W * 0.64, H * 0.48 + H * 0.13 + 2.2, W * 0.14, 3, '#7a5030', s + 41);
      for (let i = 0; i < 7; i++) { const fx = W * 0.65 + i * W * 0.018, fy = H * 0.48 + H * 0.13 + 1.6; x.fillStyle = '#3a8a3a'; x.beginPath(); x.arc(fx, fy, 1.4, 0, 7); x.fill(); x.fillStyle = ['#ff6a8a', '#ffe060', '#ffffff'][i % 3]; x.beginPath(); x.arc(fx, fy - 0.8, 0.9, 0, 7); x.fill(); }
      x.save(); x.translate(cx, H * 0.47); x.rotate(-0.04); plank(x, -W * 0.08, 0, W * 0.16, H * 0.07, '#9a6a3a', s + 51);
      { const ey = H * 0.035, er = H * 0.022; x.fillStyle = '#f4ecd8'; x.beginPath(); x.ellipse(0, ey, er * 0.8, er, 0, 0, 7); x.fill(); x.fillStyle = '#e8a040'; x.beginPath(); x.arc(-er * 0.25, ey - er * 0.2, er * 0.25, 0, 7); x.arc(er * 0.3, ey + er * 0.35, er * 0.2, 0, 7); x.fill();
        x.strokeStyle = '#5a3a20'; x.lineWidth = 0.5; x.beginPath(); x.ellipse(0, ey, er * 0.8, er, 0, 0, 7); x.stroke(); }
      x.restore();
    }
    tufts(x, xl - 2, xr + 2, wy + 2.4, s + 61, Math.round(10 + 14 * k));
  }

  OBJ.shack.paint = x => cabin(x, 80, 70, 40, { seed: 3 });
  OBJ.jhouse.paint = (x, v) => cabin(x, 184, 118, 92, { seed: 9, big: true, chimney: 0.8, wood: '#8e7656', roof: '#7e6244' });
  OBJ.jhouse.painted = v => v === 0;   // (rénovée et cossue : dessins de gfx/town.js)
  // lumières de la cabane (fenêtre, lanterne) ; la maison rénovée garde les siennes
  { const L = OBJ.jhouse.lights; OBJ.jhouse.lightsOf = v => (v ? L : [[52, 64, 16], [116, 71, 9]]); }
  OBJ.shack.lights = [[58, 38, 11], [65, 42, 6]];
})();
