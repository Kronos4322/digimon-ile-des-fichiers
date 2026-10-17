'use strict';
// =====================================================================
//  ARBRES D'HIVER PEINTS — au même pinceau que les arbres feuillus (gfx/arbres.js)
//  Arbres nus : le fût peint (Paint.trunk), puis une ramure qui se divise trois fois, chaque branche
//  éclairée en haut à gauche ; la neige posée sur le dessus des branches et dans les fourches ;
//  quelques feuilles mortes accrochées. Variantes (gfx/meteo.js) : tree 14 nu, 15 nu et enneigé ;
//  chêne et bouleau 2 nu, 3 nu et enneigé.
// =====================================================================
(function () {
  const OBJ = DW.World.OBJ, P = DW.World.Paint, hash = DW.Art.hash;
  const { rgb, mix, hex, COOL, WARM, INK } = P;

  // ramure : branches qui se divisent (niveau 0 = grosses branches) ; on garde les segments pour la neige
  function ramure(x, o) {
    const { cx, top, w, bark, seed, snow, spread = 1 } = o, B = hex(bark);
    const lite = rgb(mix(B, '#ffe2b8', 0.35)), ink = rgb(mix(B, INK, 0.62)), mid = rgb(B), dk = rgb(mix(B, COOL, 0.45));
    const segs = [];
    const grow = (x0, y0, ang, len, wid, lvl, k) => {
      const bend = (hash(seed, k, 951) - 0.5) * 0.6;
      const x1 = x0 + Math.cos(ang) * len, y1 = y0 + Math.sin(ang) * len, qx = x0 + Math.cos(ang + bend) * len * 0.55, qy = y0 + Math.sin(ang + bend) * len * 0.55;
      segs.push({ x0, y0, qx, qy, x1, y1, wid, lvl });
      if (lvl >= 3) return;
      const n = lvl === 0 ? 2 : 2 + (hash(seed, k, 952) < 0.4 ? 1 : 0);
      for (let i = 0; i < n; i++) {
        const da = (i - (n - 1) / 2) * (0.55 + hash(seed, k * 3 + i, 953) * 0.35) * spread;
        grow(x1, y1, ang + da + (hash(seed, k * 5 + i, 954) - 0.5) * 0.3, len * (0.62 + hash(seed, k * 7 + i, 955) * 0.18), wid * 0.62, lvl + 1, k * 4 + i + 1);
      }
    };
    // grosses branches partant du haut du fût, en éventail
    const main = [[-2.3, 8.5], [-1.9, 9.8], [-1.5, 10], [-1.1, 9.6], [-0.7, 8.4]];
    main.forEach(([a, l], i) => grow(cx + (i - 2) * w * 0.12, top + 1 + Math.abs(i - 2) * 0.8, a + (hash(seed, i, 956) - 0.5) * 0.2, l * (0.85 + hash(seed, i, 957) * 0.3), w * 0.42, 0, i + 1));
    x.lineCap = 'round';
    // contour sombre, puis le bois (clair au-dessus, ombré en dessous)
    for (const s of segs) { x.strokeStyle = ink; x.lineWidth = s.wid + 0.8; x.beginPath(); x.moveTo(s.x0, s.y0); x.quadraticCurveTo(s.qx, s.qy, s.x1, s.y1); x.stroke(); }
    for (const s of segs) {
      x.strokeStyle = s.lvl >= 2 ? dk : mid; x.lineWidth = s.wid; x.beginPath(); x.moveTo(s.x0, s.y0); x.quadraticCurveTo(s.qx, s.qy, s.x1, s.y1); x.stroke();
      if (s.wid > 0.9) { x.strokeStyle = lite; x.lineWidth = s.wid * 0.38; x.beginPath(); x.moveTo(s.x0 - s.wid * 0.2, s.y0 - s.wid * 0.25); x.quadraticCurveTo(s.qx - s.wid * 0.2, s.qy - s.wid * 0.25, s.x1 - s.wid * 0.2, s.y1 - s.wid * 0.25); x.stroke(); }
    }
    // brindilles au bout des branches fines
    x.strokeStyle = dk; x.lineWidth = 0.35;
    for (const s of segs) if (s.lvl === 3) for (let t = 0; t < 2; t++) { const a = Math.atan2(s.y1 - s.qy, s.x1 - s.qx) + (t ? 0.5 : -0.5), l = 1.6 + hash(s.x1 | 0, t, 958) * 1.6; x.beginPath(); x.moveTo(s.x1, s.y1); x.lineTo(s.x1 + Math.cos(a) * l, s.y1 + Math.sin(a) * l); x.stroke(); }
    if (snow) {
      // neige sur le dessus des branches (épaisse sur les grosses, un liseré sur les fines) et petits tas dans les fourches
      for (const s of segs) {
        if (Math.abs(s.x1 - s.x0) < Math.abs(s.y1 - s.y0) * 0.35 && s.lvl < 2) continue;   // (branche presque verticale : la neige n'y tient pas)
        const off = s.wid * 0.45;
        x.strokeStyle = '#c8d8ee'; x.lineWidth = Math.max(0.5, s.wid * 0.7); x.beginPath(); x.moveTo(s.x0, s.y0 - off); x.quadraticCurveTo(s.qx, s.qy - off, s.x1, s.y1 - off); x.stroke();
        x.strokeStyle = '#ffffff'; x.lineWidth = Math.max(0.35, s.wid * 0.45); x.beginPath(); x.moveTo(s.x0, s.y0 - off - 0.2); x.quadraticCurveTo(s.qx, s.qy - off - 0.2, s.x1, s.y1 - off - 0.2); x.stroke();
      }
      for (const s of segs) if (s.lvl <= 1) { x.fillStyle = '#f4f8ff'; x.beginPath(); x.ellipse(s.x1, s.y1 - s.wid * 0.5, s.wid * 1.2, s.wid * 0.55, 0, Math.PI, 0); x.fill(); }
    } else {
      // quelques feuilles mortes encore accrochées
      for (let i = 0; i < 7; i++) {
        const s = segs[Math.floor(hash(seed, i, 959) * segs.length)];
        if (s.lvl < 2) continue;
        x.fillStyle = ['#a0582a', '#c8803a', '#7a4a26'][i % 3];
        x.beginPath(); x.ellipse(s.x1 + 0.4, s.y1 + 0.8, 0.9, 0.55, hash(seed, i, 960) * 3, 0, 7); x.fill();
      }
    }
  }
  // un arbre nu : le fût, sa ramure, et la neige au pied s'il en a
  function bare(x, o) {
    P.trunk(x, { cx: 18, top: o.top, base: 45, w: o.w, seed: o.seed, roots: o.roots || 3, bark: o.bark, smooth: o.smooth });
    ramure(x, { cx: 18, top: o.top, w: o.w, bark: o.bark2 || o.bark, seed: o.seed + 5, snow: o.snow, spread: o.spread });
    if (o.snow) { x.fillStyle = 'rgba(244,248,255,0.95)'; x.beginPath(); x.ellipse(18, 44.6, 9, 1.8, 0, 0, 7); x.fill(); x.fillStyle = 'rgba(190,210,236,0.9)'; x.beginPath(); x.ellipse(19.5, 45.2, 6, 0.9, 0, 0, 7); x.fill(); }
  }

  const paint0 = { tree: OBJ.tree.paint, oak: OBJ.oak.paint, birch: OBJ.birch.paint };
  OBJ.tree.paint = (x, v) => (v === 14 || v === 15 ? bare(x, { top: 27, w: 6.6, seed: 3 + v, bark: '#6a4a2e', snow: v === 15 }) : paint0.tree(x, v));
  OBJ.oak.paint = (x, v) => (v >= 2 ? bare(x, { top: 27, w: 8.4, seed: 21 + v, roots: 4, bark: '#5a3c24', snow: v === 3, spread: 1.15 }) : paint0.oak(x, v));
  OBJ.birch.paint = (x, v) => (v >= 2 ? bare(x, { top: 22, w: 5.2, seed: 31 + v, roots: 2, bark: '#e6e2d4', bark2: '#8a8070', smooth: true, snow: v === 3, spread: 0.85 }) : paint0.birch(x, v));
  OBJ.tree.painted = OBJ.oak.painted = OBJ.birch.painted = () => true;
})();
