'use strict';
// =====================================================================
//  PINCEAU DU DÉCOR — les outils de peinture communs (DW.World.Paint) : couronnes de feuillage en grappes, troncs
//  avec écorce et racines, couleurs (lumière chaude en haut à gauche, ombres froides, encre des contours).
//  Servent aux décors encore peints par le code : jeunes pousses et massifs (premium.js), ponton, passage du Grand
//  Arbre, épave (peints.js), cabanes du début (maisons.js), premières boutiques (facades.js).
//  (les arbres du jeu sont les images du joueur : gfx/textures.js)
// =====================================================================
(function () {
  const Art = DW.Art, hash = Art.hash;
  const hex = c => Art.hex(c), rgb = (a, al = 1) => `rgba(${a[0] | 0},${a[1] | 0},${a[2] | 0},${al})`;
  const mix = (a, b, t) => Art.mix(typeof a === 'string' ? hex(a) : a, typeof b === 'string' ? hex(b) : b, t);
  // couleur éclaircie (k > 0, vers le blanc) ou assombrie (k < 0, vers le noir), en '#rrggbb'
  const shade = (c, k) => '#' + Art.mix(hex(c), k < 0 ? [0, 0, 0] : [255, 255, 255], Math.abs(k)).map(x => Math.round(x).toString(16).padStart(2, '0')).join('');
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
  // TRONC NATUREL : fût légèrement sinueux qui s'évase en racines, deux branches en fourche vers le feuillage,
  // éclairage de cylindre (reflet à gauche, ombre froide à droite), sillons d'écorce qui suivent la forme,
  // nœud, mousse au pied, contour sombre. o : { cx, top, base, w, bark, seed, roots }
  function trunk(x, o) {
    const { cx, top, base, w, bark } = o, seed = o.seed || 1, B = hex(bark);
    const lite = mix(B, '#ffe2b8', 0.32), dk = mix(B, COOL, 0.5), ink = rgb(mix(B, INK, 0.62));
    const H = base - top, N = 10;
    // ligne médiane qui ondule un peu, demi-largeur qui s'évase fort au pied
    const mid = t => cx + Math.sin(t * 2.6 + seed) * w * 0.09 + (t - 0.5) * w * (hash(seed, 1, 971) - 0.5) * 0.3;
    const half = t => w / 2 * (0.82 + 0.75 * Math.pow(1 - t, 4));
    const L = [], R = [];
    for (let k = 0; k <= N; k++) { const t = k / N, y = base - t * H; L.push([mid(t) - half(t), y]); R.push([mid(t) + half(t), y]); }
    // racines : langues de bois qui plongent dans le sol, effilées
    const roots = o.roots || 3;
    for (let r = 0; r < roots; r++) {
      const side = r % 2 ? 1 : -1, k = (r >> 1) + 1, sx = mid(0.08) + side * half(0.08) * (0.55 + 0.15 * k), ex = sx + side * w * (0.32 + 0.22 * k + hash(seed, r, 972) * 0.2);
      const g = x.createLinearGradient(0, base - 5, 0, base + 1); g.addColorStop(0, rgb(B)); g.addColorStop(1, rgb(dk)); x.fillStyle = g; x.strokeStyle = ink; x.lineWidth = 0.7;
      x.beginPath(); x.moveTo(sx - side * w * 0.12, base - 4.5 - k); x.quadraticCurveTo(sx + side * w * 0.2, base - 1, ex, base + 0.8); x.quadraticCurveTo(sx, base + 0.6, sx - side * w * 0.2, base); x.closePath(); x.fill(); x.stroke();
    }
    // branches en fourche (cachées en partie par la couronne, peinte ensuite)
    x.lineCap = 'round';
    for (const [dx, dy, ww] of [[-0.95, -0.55, 0.42], [0.85, -0.7, 0.36], [0.1, -0.85, 0.3]]) {
      const x0 = mid(1), y0 = top + 1, x1 = x0 + dx * w * 1.05, y1 = top + dy * w * 1.25;
      x.strokeStyle = ink; x.lineWidth = w * ww + 1; x.beginPath(); x.moveTo(x0, y0); x.quadraticCurveTo(x0 + dx * w * 0.3, y0 - w * 0.5, x1, y1); x.stroke();
      x.strokeStyle = rgb(mix(B, lite, dx < 0 ? 0.5 : 0)); x.lineWidth = w * ww; x.beginPath(); x.moveTo(x0, y0); x.quadraticCurveTo(x0 + dx * w * 0.3, y0 - w * 0.5, x1, y1); x.stroke();
    }
    // fût : contour sombre puis remplissage en dégradé de cylindre
    const path = () => { x.beginPath(); L.forEach((p, k) => (k ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]))); for (let k = R.length - 1; k >= 0; k--) x.lineTo(R[k][0], R[k][1]); x.closePath(); };
    x.strokeStyle = ink; x.lineWidth = 1.1; path(); x.stroke();
    const g = x.createLinearGradient(cx - w * 0.6, 0, cx + w * 0.6, 0);
    g.addColorStop(0, rgb(mix(B, dk, 0.2))); g.addColorStop(0.22, rgb(lite)); g.addColorStop(0.5, rgb(B)); g.addColorStop(0.85, rgb(dk)); g.addColorStop(1, rgb(mix(dk, INK, 0.3)));
    x.fillStyle = g; path(); x.fill();
    x.save(); path(); x.clip();
    // sillons d'écorce : lignes ondulées qui suivent le fût, plus serrées au centre ; crêtes claires à côté
    const nG = o.smooth ? 0 : Math.max(4, Math.round(w / 1.6));   // (bouleau : écorce lisse)
    for (let gi = 0; gi < nG; gi++) {
      const u = (gi + 0.5) / nG * 2 - 1, t0 = hash(seed, gi, 973) * 0.25, t1 = 0.75 + hash(seed, gi, 974) * 0.25;
      x.beginPath();
      for (let k = 0; k <= 12; k++) { const t = t0 + (t1 - t0) * k / 12, px = mid(t) + u * half(t) * 0.92 + Math.sin(t * 9 + gi * 2.1) * 0.35, py = base - t * H; k ? x.lineTo(px, py) : x.moveTo(px, py); }
      x.strokeStyle = rgb(mix(dk, INK, 0.35), 0.75); x.lineWidth = 0.55 + (1 - Math.abs(u)) * 0.25; x.stroke();
      x.translate(-0.55, 0); x.strokeStyle = rgb(lite, u < 0.2 ? 0.45 : 0.15); x.lineWidth = 0.35; x.stroke(); x.translate(0.55, 0);
    }
    // nœud et mousse au pied
    const ky = base - H * (0.45 + hash(seed, 2, 975) * 0.2), kx = mid(0.5) + w * 0.12;
    x.fillStyle = ink; x.beginPath(); x.ellipse(kx, ky, w * 0.11, w * 0.17, 0, 0, 7); x.fill();
    x.strokeStyle = rgb(lite, 0.6); x.lineWidth = 0.5; x.beginPath(); x.ellipse(kx, ky, w * 0.16, w * 0.23, 0, Math.PI * 0.6, Math.PI * 1.5); x.stroke();
    for (let m = 0; m < 9; m++) { const t = hash(seed, m, 976) * 0.22, side = hash(seed, m, 977) < 0.7 ? -1 : 1; x.fillStyle = m % 3 ? '#4f9a3e' : '#86c858'; x.beginPath(); x.ellipse(mid(t) + side * half(t) * (0.5 + hash(seed, m, 978) * 0.4), base - t * H, 1.3, 0.75, 0, 0, 7); x.fill(); }
    x.restore();
  }

  // pinceaux partagés avec les autres dessins peints (peints.js, premium.js, maisons.js, facades.js...) et quelques
  // outils de couleur (ponts.js, biomes.js, sites.js)
  DW.World.Paint = { crown, trunk, rgb, mix, hex, shade, COOL, WARM, INK };
})();
