'use strict';
// =====================================================================
//  PONTS DE PIERRE PEINTS — un calque haute définition posé sur l'eau, sous les personnages
//  (gfx/terrain.js le prépare avec la carte, game/overworld.js le dessine juste après l'eau).
//  Chaque pont est peint EN ENTIER (pas case par case), au même pinceau que le décor :
//  lumière chaude en haut à gauche, ombres froides, contour discret.
//  - tablier de grandes dalles irrégulières, allée plus claire usée au milieu, mousse dans les joints ;
//  - parapets : chaperon clair, face intérieure ombrée qui projette son ombre sur le tablier ;
//    piliers carrés aux extrémités et au-dessus de chaque pile ;
//  - face visible (pont est-ouest) : cordon de pierre, mur de pierre de taille, deux ou trois GRANDES ARCHES
//    (voussoirs, clé de voûte), l'eau sombre dessous, piles avec avant-bec ; ombre portée et reflet sur l'eau ;
//  - pont nord-sud : parapets de chaque côté, ombre portée sur l'eau à l'est.
//  Les pontons de bois du bord de mer gardent leur dessin (terrain.js).
// =====================================================================
(function () {
  const Art = DW.Art, hash = Art.hash, TS = 16, K = 2;   // calque peint 2 fois plus fin que le sol
  const mix = (a, b, t) => Art.mix(a, b, t), rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  const DECK = [192, 176, 146], ASH = [206, 198, 180], WALL = [158, 150, 136], LITE = [246, 238, 216], INK = [42, 38, 44], COOL = [26, 46, 70], MOSS = [92, 130, 66];
  const rr = (x, x0, y0, w, h, r) => { x.beginPath(); x.moveTo(x0 + r, y0); x.arcTo(x0 + w, y0, x0 + w, y0 + h, r); x.arcTo(x0 + w, y0 + h, x0, y0 + h, r); x.arcTo(x0, y0 + h, x0, y0, r); x.arcTo(x0, y0, x0 + w, y0, r); x.closePath(); };

  // une pierre taillée : dégradé (clair en haut à gauche), arête éclairée, bord sombre, grain, mousse
  function block(x, x0, y0, w, h, base, seed, o = {}) {
    const t = 0.9 + hash(seed, 1, 701) * 0.2, C = base.map(v => v * t);
    const g = x.createLinearGradient(x0, y0, x0 + w * 0.6, y0 + h);
    g.addColorStop(0, rgb(mix(C, LITE, o.lit != null ? o.lit : 0.3))); g.addColorStop(0.5, rgb(C)); g.addColorStop(1, rgb(mix(C, COOL, o.shade != null ? o.shade : 0.3)));
    x.fillStyle = g; rr(x, x0, y0, w, h, Math.min(o.r != null ? o.r : 1.2, w / 3, h / 3)); x.fill();
    x.strokeStyle = rgb(mix(C, INK, 0.6), 0.9); x.lineWidth = o.line || 0.5; x.stroke();
    x.fillStyle = rgb(LITE, 0.55); x.fillRect(x0 + 0.7, y0 + 0.5, Math.max(0, w - 1.6), 0.45);
    for (let k = 0; k < Math.round(w * h / 14); k++) { x.fillStyle = hash(seed, k, 702) < 0.5 ? rgb(LITE, 0.3) : rgb(INK, 0.2); x.fillRect(x0 + 0.5 + hash(seed, k, 703) * (w - 1.5), y0 + 0.5 + hash(seed, k, 704) * (h - 1.5), 0.5, 0.5); }
    if (o.crack && hash(seed, 7, 707) < o.crack) { x.strokeStyle = rgb(INK, 0.45); x.lineWidth = 0.35; x.beginPath(); const cx = x0 + w * (0.3 + hash(seed, 8, 708) * 0.4); x.moveTo(cx, y0 + 0.6); x.lineTo(cx + 1.2, y0 + h * 0.5); x.lineTo(cx + 0.4, y0 + h - 0.6); x.stroke(); }
    if (o.moss && hash(seed, 5, 705) < o.moss) { x.fillStyle = rgb(MOSS, 0.75); x.beginPath(); x.ellipse(x0 + w * hash(seed, 6, 706), y0 + h - 0.5, Math.min(2.4, w * 0.3), 0.8, 0, 0, 7); x.fill(); }
  }
  // dalles du tablier sur un rectangle (sens du pont : hz), allée usée au milieu
  function deck(x, X0, Y0, X1, Y1, hz, seed) {
    x.save(); x.beginPath(); x.rect(X0, Y0, X1 - X0, Y1 - Y0); x.clip();
    x.fillStyle = rgb(mix(DECK, [96, 86, 70], 0.55)); x.fillRect(X0, Y0, X1 - X0, Y1 - Y0);   // joints (mortier)
    // grandes dalles posées à plat : rangées de hauteurs variées, longueurs irrégulières, coins usés, éclairage doux
    const A0 = hz ? X0 : Y0, A1 = hz ? X1 : Y1, B0 = hz ? Y0 : X0, B1 = hz ? Y1 : X1;
    for (let b = B0, r = 0; b < B1; r++) {
      const bh = Math.min(B1 - b, 6 + Math.floor(hash(seed, r, 720) * 4));
      for (let a = A0 - hash(seed, r, 721) * 12, k = 0; a < A1; k++) {
        const len = 9 + Math.floor(hash(seed + k, r, 722) * 9), s2 = seed * 7 + r * 31 + k, jit = (hash(s2, 2, 723) - 0.5) * 0.8;
        const tone = mix(DECK, hash(s2, 3, 724) < 0.5 ? [214, 196, 160] : [170, 160, 140], hash(s2, 4, 725) * 0.5);
        const o = { moss: 0.1, crack: 0.12, lit: 0.12, shade: 0.12, r: 1.8, line: 0.35 };
        if (hz) block(x, a + 0.35, b + 0.35 + jit * 0.3, len - 0.7, bh - 0.7, tone, s2, o);
        else block(x, b + 0.35 + jit * 0.3, a + 0.35, bh - 0.7, len - 0.7, tone, s2, o);
        a += len;
      }
      b += bh;
    }
    // usure : une allée plus claire au milieu, les bords salis ; douce lumière du ciel
    const g = hz ? x.createLinearGradient(0, Y0, 0, Y1) : x.createLinearGradient(X0, 0, X1, 0);
    g.addColorStop(0, 'rgba(40,34,26,0.28)'); g.addColorStop(0.3, 'rgba(255,246,220,0.05)'); g.addColorStop(0.5, 'rgba(255,246,220,0.16)'); g.addColorStop(0.7, 'rgba(255,246,220,0.05)'); g.addColorStop(1, 'rgba(40,34,26,0.22)');
    x.fillStyle = g; x.fillRect(X0, Y0, X1 - X0, Y1 - Y0);
    x.restore();
  }
  // parapet le long d'un bord : chaperon (pierres longues) ; « face » = hauteur visible de sa face intérieure
  function parapet(x, X0, Y0, X1, Y1, hz, seed, face) {
    if (hz) {
      if (face) {   // face intérieure (vers nous) : assise de pierres plus sombres, puis l'ombre sur le tablier
        for (let a = X0, k = 0; a < X1; k++) { const l = Math.min(X1 - a, 9 + Math.floor(hash(seed, k, 731) * 5)); block(x, a, Y0 + 3, l, face, mix(WALL, COOL, 0.12), seed + k, { lit: 0.12, shade: 0.4, moss: 0.25 }); a += l; }
        const g = x.createLinearGradient(0, Y0 + 3 + face, 0, Y0 + 3 + face + 3.4); g.addColorStop(0, 'rgba(12,22,34,0.42)'); g.addColorStop(1, 'rgba(12,22,34,0)'); x.fillStyle = g; x.fillRect(X0, Y0 + 3 + face, X1 - X0, 3.4);
      }
      for (let a = X0 - 2, k = 0; a < X1; k++) { const l = Math.min(X1 - a, 11 + Math.floor(hash(seed, k, 732) * 6)); block(x, Math.max(X0, a), Y0, Math.min(l, X1 - Math.max(X0, a)), 3.4, ASH, seed + 50 + k, { lit: 0.5, shade: 0.2 }); a += l; }
    } else {
      for (let a = Y0 - 2, k = 0; a < Y1; k++) { const l = Math.min(Y1 - a, 11 + Math.floor(hash(seed, k, 733) * 6)); block(x, X0, Math.max(Y0, a), 3.6, Math.min(l, Y1 - Math.max(Y0, a)), ASH, seed + 70 + k, { lit: 0.5, shade: 0.25 }); a += l; }
      x.fillStyle = 'rgba(12,22,34,0.3)'; x.fillRect(X0 + 3.6, Y0, 1.6, Y1 - Y0);   // ombre du parapet ouest sur le tablier
    }
  }
  // pilier carré (sur un parapet) : socle, fût, chapeau mouluré, ombre au sol
  function pillar(x, cx, by, seed, hgt = 7) {
    x.fillStyle = 'rgba(12,22,34,0.32)'; x.beginPath(); x.ellipse(cx + 1.6, by + 0.8, 4.2, 1.4, 0, 0, 7); x.fill();
    block(x, cx - 3.2, by - hgt, 6.4, hgt, mix(WALL, LITE, 0.1), seed, { lit: 0.38, shade: 0.4 });
    block(x, cx - 3.9, by - hgt - 2.2, 7.8, 2.6, ASH, seed + 1, { lit: 0.55 });
    block(x, cx - 2.6, by - hgt - 3.6, 5.2, 1.8, mix(ASH, LITE, 0.2), seed + 2, { lit: 0.6 });
  }
  // la face sud d'un pont est-ouest : cordon, mur, grandes arches, piles, ombre et reflet
  function facade(x, X0, X1, Y, seed) {
    const FH = 14, len = X1 - X0, n = Math.max(1, Math.round(len / 38)), pier = 6, span = (len - pier * (n + 1)) / n;
    // ombre portée et reflet sur l'eau, sous le pont
    const sg = x.createLinearGradient(0, Y + FH, 0, Y + FH + 9); sg.addColorStop(0, 'rgba(6,22,38,0.5)'); sg.addColorStop(1, 'rgba(6,22,38,0)');
    x.fillStyle = sg; x.fillRect(X0 - 2, Y + FH, len + 6, 9);
    for (let k = 0; k < 5; k++) { x.fillStyle = `rgba(214,226,232,${0.13 - k * 0.022})`; x.fillRect(X0 + 2 + hash(seed, k, 741) * 6, Y + FH + 1.4 + k * 1.5, len - 6 - hash(seed, k, 742) * 10, 0.55); }
    // mur de pierre de taille
    x.save(); x.beginPath(); x.rect(X0, Y, len, FH); x.clip();
    x.fillStyle = rgb(mix(WALL, INK, 0.5)); x.fillRect(X0, Y, len, FH);
    for (let r = 0; r < 4; r++) for (let a = X0 - (r % 2) * 4.5, k = 0; a < X1; k++) {
      const l = 8 + Math.floor(hash(seed + r, k, 743) * 4);
      block(x, a + 0.25, Y + 3 + r * 2.8 + 0.2, l - 0.5, 2.6, mix(WALL, COOL, 0.1 + r * 0.07), seed * 3 + r * 17 + k, { lit: 0.16, shade: 0.35, moss: r === 3 ? 0.45 : 0.08, r: 0.6 });
      a += l;
    }
    x.restore();
    // cordon de pierre (la ligne saillante sous le parapet) : clair dessus, ombre dessous
    for (let a = X0, k = 0; a < X1; k++) { const l = Math.min(X1 - a, 10 + Math.floor(hash(seed, k, 744) * 5)); block(x, a, Y, l, 3, ASH, seed + 90 + k, { lit: 0.5, shade: 0.35 }); a += l; }
    x.fillStyle = 'rgba(12,22,34,0.35)'; x.fillRect(X0, Y + 3, len, 0.9);
    // arches : ouverture sombre (on voit l'eau dessous), voussoirs, clé de voûte, avant-becs des piles
    for (let i = 0; i < n; i++) {
      const ax0 = X0 + pier * (i + 1) + span * i, ax1 = ax0 + span, cx = (ax0 + ax1) / 2, rx = span / 2, base = Y + FH, top = Y + 5, ry = base - top;
      x.save();
      x.beginPath(); x.moveTo(ax0, base); x.ellipse(cx, base, rx, ry, 0, Math.PI, 0); x.closePath();
      const ag = x.createLinearGradient(0, top, 0, base); ag.addColorStop(0, 'rgba(4,10,18,1)'); ag.addColorStop(0.7, 'rgba(10,30,44,1)'); ag.addColorStop(1, 'rgba(30,70,90,1)');
      x.fillStyle = ag; x.fill();
      x.clip();
      x.fillStyle = 'rgba(150,200,215,0.32)'; for (let k = 0; k < 3; k++) x.fillRect(cx - rx * (0.7 - k * 0.15), base - 1.4 - k * 1.3, rx * (1.4 - k * 0.3), 0.5);
      x.restore();
      // voussoirs en éventail
      const nv = Math.max(7, Math.round(rx * 1.1));
      for (let v = 0; v <= nv; v++) {
        const a = Math.PI + (v / nv) * Math.PI, px = cx + Math.cos(a) * (rx + 1.2), py = base + Math.sin(a) * (ry + 1.2);
        x.save(); x.translate(px, py); x.rotate(a + Math.PI / 2);
        const key = v === nv / 2 || (nv % 2 && (v === (nv - 1) / 2));
        block(x, key ? -1.6 : -1.15, -1.3, key ? 3.2 : 2.3, key ? 3.2 : 2.6, key ? mix(ASH, LITE, 0.25) : mix(ASH, COOL, 0.05), seed * 11 + i * 23 + v, { lit: 0.45, r: 0.5, line: 0.4 });
        x.restore();
      }
    }
    // avant-becs des piles (dans l'eau) : un éperon de pierre clair qui fend le courant
    for (let i = 0; i <= n; i++) {
      const px = X0 + i * (pier + span) + pier / 2;
      if (i === 0 || i === n) continue;
      block(x, px - pier / 2 - 0.4, Y + FH - 3, pier + 0.8, 4.6, mix(WALL, COOL, 0.2), seed + 300 + i, { lit: 0.25, moss: 0.6 });
      x.fillStyle = 'rgba(232,246,250,0.55)'; x.fillRect(px - pier / 2 - 1.4, Y + FH + 1.2, pier + 2.8, 0.6);   // remous
    }
  }

  // extrémité d'un pont sur la terre ferme : une plage de terre battue qui se fond dans l'herbe (taches irrégulières),
  // des cailloux, et une marche de seuil en pierre au bout du tablier. (cx, cy) = milieu du bout ; (dx, dy) = vers la terre
  function apron(x, cx, cy, dx, dy, half, seed, dirt, film) {
    const D = dirt || [150, 118, 80];
    if (film) {   // (après le tablier) la terre rapportée par les pieds sur le bout du pont
      const g = dx ? x.createLinearGradient(cx, 0, cx - dx * 12, 0) : x.createLinearGradient(0, cy, 0, cy - dy * 12); g.addColorStop(0, rgb(D, 0.55)); g.addColorStop(0.5, rgb(D, 0.2)); g.addColorStop(1, rgb(D, 0));
      x.fillStyle = g; if (dx) x.fillRect(Math.min(cx, cx - dx * 12), cy - half + 3, 12, half * 2 - 6); else x.fillRect(cx - half + 3, Math.min(cy, cy - dy * 12), half * 2 - 6, 12);
      return;
    }
    for (let k = 0; k < 14; k++) {
      const t = hash(seed, k, 751), u = (hash(seed, k, 752) - 0.5) * 2;
      const px = cx + dx * (2 + t * 18) + dy * u * half * (1.05 - t * 0.6), py = cy + dy * (2 + t * 18) + dx * u * half * (1.05 - t * 0.6);
      const r = (half * 0.6 + 4) * (1 - t * 0.5);
      const g = x.createRadialGradient(px, py, 0.5, px, py, r);
      g.addColorStop(0, rgb(mix(D, [176, 146, 104], hash(seed, k, 753) * 0.4), 0.95 - t * 0.35)); g.addColorStop(0.6, rgb(D, 0.55 - t * 0.2)); g.addColorStop(1, rgb(D, 0));
      x.fillStyle = g; x.beginPath(); x.ellipse(px, py, r * (dx ? 1.2 : 1), r * (dy ? 1.2 : 0.8), 0, 0, 7); x.fill();
    }
    // traces de pas, cailloux
    for (let k = 0; k < 10; k++) {
      const t = hash(seed, k, 754), u = (hash(seed, k, 755) - 0.5) * 2, px = cx + dx * (2 + t * 11) + dy * u * half * 0.8, py = cy + dy * (2 + t * 11) + dx * u * half * 0.8;
      x.fillStyle = 'rgba(60,46,32,0.55)'; x.beginPath(); x.ellipse(px + 0.3, py + 0.4, 0.9, 0.6, 0, 0, 7); x.fill();
      x.fillStyle = hash(seed, k, 756) < 0.5 ? 'rgba(210,200,184,0.95)' : 'rgba(150,142,130,0.95)'; x.beginPath(); x.ellipse(px, py, 0.8, 0.55, 0, 0, 7); x.fill();
    }
    // marche de seuil : une longue pierre claire en travers, posée dans la terre
    if (dx) block(x, cx + (dx > 0 ? 0 : -3), cy - half + 2.4, 3, half * 2 - 4.8, mix(ASH, [150, 118, 80], 0.15), seed + 9, { lit: 0.45, r: 1 });
    else block(x, cx - half + 2.4, cy + (dy > 0 ? 0 : -3), half * 2 - 4.8, 3, mix(ASH, [150, 118, 80], 0.15), seed + 9, { lit: 0.45, r: 1 });
  }

  // ------------------------------------------------------------ LOGIQUE DES PONTS (au chargement de chaque carte)
  // 1) un pont INUTILE disparaît : ses bouts donnent sur la même terre (on pouvait déjà passer ailleurs),
  //    ou il ne mène nulle part (ponton isolé) — sauf s'il touche le bord de la carte (un passage) ;
  // 2) un pont UTILE est redressé : bande droite de 3 cases dans le sens de la traversée, prolongée jusqu'aux rives,
  //    à condition qu'elle relie bien les mêmes terres ; sinon on garde son tracé.
  DW.World.fixBridges = map => {
    if (map._pontsFor === map.rows || map.region === 'plage' || map.dock || map.indoor || !map.rows) return;
    const W = map.w, H = map.h, g = map.rows.map(r => [...r]), N = W * H;
    const wet = c => c === '_' || (DW.World.CH[c] && DW.World.CH[c].t === 'water' && DW.SOLID.has(c));   // (toutes les eaux, pas les pierres de gué)
    // (un pont qui porte un passage, un panneau ou un personnage reste toujours)
    const special = new Set([...(map.warps || []).flatMap(w => { const a = []; for (let yy = w.y; yy < w.y + (w.h || 1); yy++) for (let xx = w.x; xx < w.x + (w.w || 1); xx++) a.push(xx + ',' + yy); return a; }), ...Object.keys(map.signs || {}), ...(map.npcs || []).map(n => n.x + ',' + n.y)]);
    const land = (x, y) => x >= 0 && y >= 0 && x < W && y < H && g[y][x] !== '_' && !wet(g[y][x]) && !DW.SOLID.has(g[y][x]);
    // terres : régions marchables (sans les ponts)
    const lab = new Int32Array(N).fill(-1), size = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (lab[y * W + x] >= 0 || !land(x, y)) continue;
      const id = size.length, st = [y * W + x]; lab[y * W + x] = id; let n = 0;
      while (st.length) { const i = st.pop(), cx = i % W, cy = (i / W) | 0; n++; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = cx + dx, ny = cy + dy; if (land(nx, ny) && lab[ny * W + nx] < 0) { lab[ny * W + nx] = id; st.push(ny * W + nx); } } }
      size.push(n);
    }
    const shores = cells => { const s = new Set(); let edge = false; for (const [x, y] of cells) { if (x === 0 || y === 0 || x === W - 1 || y === H - 1) edge = true; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < W && ny < H && lab[ny * W + nx] >= 0 && size[lab[ny * W + nx]] >= 6) s.add(lab[ny * W + nx]); } } return { s, edge }; };
    const seen = new Uint8Array(N);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (g[y][x] !== '_' || seen[y * W + x]) continue;
      const comp = [], st = [[x, y]]; seen[y * W + x] = 1;
      while (st.length) { const [cx, cy] = st.pop(); comp.push([cx, cy]); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = cx + dx, ny = cy + dy; if (nx >= 0 && ny >= 0 && nx < W && ny < H && !seen[ny * W + nx] && g[ny][nx] === '_') { seen[ny * W + nx] = 1; st.push([nx, ny]); } } }
      const sh = shores(comp);
      if (!sh.edge && sh.s.size <= 1 && !comp.some(([cx, cy]) => special.has(cx + ',' + cy))) { for (const [cx, cy] of comp) g[cy][cx] = '~'; continue; }   // inutile : on l'enlève
      // redressement
      let mx = 1e9, Mx = -1, my = 1e9, My = -1, sx = 0, sy = 0;
      for (const [cx, cy] of comp) { mx = Math.min(mx, cx); Mx = Math.max(Mx, cx); my = Math.min(my, cy); My = Math.max(My, cy); sx += cx; sy += cy; }
      const isRect = comp.length === (Mx - mx + 1) * (My - my + 1) && Math.min(Mx - mx, My - my) >= 2;
      if (isRect) continue;
      // (au bord de la carte, le pont mène à un passage : on garde son tracé ; s'il est grand et tordu, il devient une digue de sable)
      if (sh.edge) { if (comp.length > 24) for (const [cx, cy] of comp) g[cy][cx] = 's'; continue; }
      // traversées possibles : dans les deux sens, à plusieurs hauteurs ; une traversée = une suite continue d'eau
      // d'une rive à l'autre (3 cases de large si possible, sinon 2) ; on garde la plus courte qui relie les mêmes terres
      let best = null;
      const cx0 = Math.round(sx / comp.length), cy0 = Math.round(sy / comp.length);
      for (const hz of [true, false]) for (const d of [0, -1, 1, -2, 2, -3, 3]) for (const width of [3, 2]) {
        const c0 = (hz ? cy0 : cx0) + d, at = (p, q) => (hz ? [p, q] : [q, p]);
        const wetAt = (p, q) => { const [cx, cy] = at(p, q); return cx >= 0 && cy >= 0 && cx < W && cy < H && wet(g[cy][cx]); };
        const landAt = (p, q) => { const [cx, cy] = at(p, q); return land(cx, cy); };
        const lo = (hz ? mx : my) - 8, hi = (hz ? Mx : My) + 8, rowsW = width === 3 ? [-1, 0, 1] : [0, 1];
        for (let p = lo; p <= hi; p++) {
          if (!rowsW.every(r => wetAt(p, c0 + r)) || rowsW.every(r => wetAt(p - 1, c0 + r))) continue;   // début d'une traversée
          let q = p; while (q <= hi && rowsW.every(r => wetAt(q, c0 + r))) q++;
          const e0 = p - 1, e1 = q;   // les deux rives
          if (!landAt(e0, c0) || !landAt(e1, c0)) { p = q; continue; }
          if (best && q - p >= best.len) { p = q; continue; }
          const band = []; for (let k = p; k < q; k++) for (const r of rowsW) band.push(at(k, c0 + r));
          const nb = shores(band);
          if ([...sh.s].every(l => nb.s.has(l))) best = { band, len: q - p };
          p = q;
        }
      }
      if (!best) {
        // aucune traversée droite : un grand passage devient une digue de sable (plus naturel qu'un pont tordu)
        if (comp.length > 24) for (const [cx, cy] of comp) g[cy][cx] = 's';
        continue;
      }
      best = best.band;
      for (const [cx, cy] of comp) g[cy][cx] = '~';
      for (const [cx, cy] of best) g[cy][cx] = '_';
    }
    DW.World.prolongerPonts(g);
    map.rows = map._pontsFor = g.map(r => r.join(''));
  };
  // UN PONT MÈNE TOUJOURS QUELQUE PART : un pont qui s'arrête à 1-3 cases de la rive est prolongé jusqu'à la terre,
  // et ses deux bouts sont dégagés sur 2 cases (pas d'arbre, de bûche ni de lisière en travers de la sortie).
  // g : lignes de la carte en tableaux de caractères (modifiées sur place). Aussi appelé après les retouches de l'éditeur.
  DW.World.prolongerPonts = g => {
    const H = g.length, W = g[0].length, info = DW.World.info, seen = new Uint8Array(W * H);
    const wet = c => DW.World.CH[c] && DW.World.CH[c].t === 'water' && DW.SOLID.has(c), dur = c => { const t = info(c).t; return t === 'rock' || t === 'cliff' || t === 'water' || t === 'bridge' || t === 'stairs' || t === 'wall' || t === 'void'; };
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (g[y][x] !== '_' || seen[y * W + x]) continue;
      let mx = x, Mx = x, my = y, My = y; const st = [[x, y]]; seen[y * W + x] = 1;
      while (st.length) { const [cx, cy] = st.pop(); mx = Math.min(mx, cx); Mx = Math.max(Mx, cx); my = Math.min(my, cy); My = Math.max(My, cy); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = cx + dx, ny = cy + dy; if (nx >= 0 && ny >= 0 && nx < W && ny < H && !seen[ny * W + nx] && g[ny][nx] === '_') { seen[ny * W + nx] = 1; st.push([nx, ny]); } } }
      const vert = My - my >= Mx - mx;   // (sens de la traversée : la plus grande longueur)
      const across = vert ? [mx, Mx] : [my, My], at = (a, b) => (vert ? [a, b] : [b, a]);   // a : en travers, b : le long (renvoie [x, y])
      const cell = (a, b) => { const [cx, cy] = at(a, b); return cx >= 0 && cy >= 0 && cx < W && cy < H ? g[cy][cx] : undefined; };
      const set = (a, b, c) => { const [cx, cy] = at(a, b); g[cy][cx] = c; };
      for (const [b0, d] of vert ? [[my, -1], [My, 1]] : [[mx, -1], [Mx, 1]]) {
        let k = 1;
        const rangee = b => { const r = []; for (let a = across[0]; a <= across[1]; a++) r.push(cell(a, b)); return r; };
        while (k <= 3 && rangee(b0 + d * k).every(c => c !== undefined && wet(c))) k++;
        const rive = rangee(b0 + d * k), mid = rive[(rive.length - 1) >> 1];
        if (mid === undefined) continue;   // (le pont touche le bord de la carte : un passage)
        if (k > 1 && k <= 3 && !wet(mid) && !dur(mid)) for (let j = 1; j < k; j++) for (let a = across[0]; a <= across[1]; a++) set(a, b0 + d * j, '_');
        else if (k > 1) continue;   // (trop loin de la rive : on laisse tel quel)
        // abords dégagés : les 2 rangées de terre au bout du pont, un peu plus larges que lui
        for (let j = k; j < k + 2; j++) for (let a = across[0] - 1; a <= across[1] + 1; a++) {   // (une case de plus de chaque côté : une bûche ou un arbre déborde)
          const c = cell(a, b0 + d * j); if (c === undefined || wet(c) || dur(c) && c !== '#') continue;
          const I = info(c); if (I.obj === 'sign' || I.train || I.toilet) continue; if (DW.SOLID.has(c) || c === '#') set(a, b0 + d * j, I.t === 'sand' ? 's' : '=');
        }
      }
    }
    return g;
  };

  // =================================================================== STYLES DE PONTS (bois, tronc, corde)
  // style d'une carte : choisi dans l'atelier (map.pont), sinon selon la région : forêts → bois, Pays de Meramon
  // (montagne) → corde, ailleurs → pierre. Chaque pont est peint en entier : (X0, Y0)-(X1, Y1) en pixels, hz = est-ouest.
  const BOIS = [150, 104, 62], BOIS_C = [214, 168, 112], BOIS_S = [78, 50, 30], CORDE = [206, 180, 128];
  DW.World.styleDePont = map => map.pont || (map.region === 'foret' ? 'bois' : map.region === 'miharashi' ? 'corde' : 'pierre');
  // planche : dégradé le long, arête claire, joint sombre, deux clous, veinure ; usée (plus claire) au milieu du pont
  function planche(x, x0, y0, w, h, hz, seed, usure) {
    const t = 0.85 + hash(seed, 1, 801) * 0.3, C = mix(BOIS.map(v => v * t), BOIS_C, usure * 0.45);
    const g = hz ? x.createLinearGradient(x0, 0, x0 + w, 0) : x.createLinearGradient(0, y0, 0, y0 + h);
    g.addColorStop(0, rgb(mix(C, LITE, 0.25))); g.addColorStop(0.6, rgb(C)); g.addColorStop(1, rgb(mix(C, BOIS_S, 0.45)));
    x.fillStyle = g; x.fillRect(x0, y0, w, h);
    x.fillStyle = rgb(mix(C, BOIS_S, 0.8)); if (hz) x.fillRect(x0 + w - 0.6, y0, 0.6, h); else x.fillRect(x0, y0 + h - 0.6, w, 0.6);   // joint
    x.strokeStyle = rgb(mix(C, BOIS_S, 0.5), 0.5); x.lineWidth = 0.3;   // veinure
    for (let k = 0; k < 2; k++) { x.beginPath(); if (hz) { const vx = x0 + 1 + hash(seed, k, 802) * (w - 2); x.moveTo(vx, y0); x.bezierCurveTo(vx + 0.8, y0 + h * 0.3, vx - 0.8, y0 + h * 0.7, vx, y0 + h); } else { const vy = y0 + 1 + hash(seed, k, 802) * (h - 2); x.moveTo(x0, vy); x.bezierCurveTo(x0 + w * 0.3, vy + 0.8, x0 + w * 0.7, vy - 0.8, x0 + w, vy); } x.stroke(); }
    x.fillStyle = 'rgba(40,30,24,0.8)'; if (hz) { x.fillRect(x0 + w / 2 - 0.4, y0 + 1.4, 0.8, 0.8); x.fillRect(x0 + w / 2 - 0.4, y0 + h - 2.2, 0.8, 0.8); } else { x.fillRect(x0 + 1.4, y0 + h / 2 - 0.4, 0.8, 0.8); x.fillRect(x0 + w - 2.2, y0 + h / 2 - 0.4, 0.8, 0.8); }
  }
  // poteau de bois vu d'en haut (tête claire, ombre), avec sa base
  function poteau(x, px, py, r, seed) {
    x.fillStyle = 'rgba(8,20,30,0.35)'; x.beginPath(); x.ellipse(px + 1.4, py + 1.6, r + 0.6, r * 0.6, 0, 0, 7); x.fill();
    x.fillStyle = rgb(BOIS_S); x.beginPath(); x.arc(px + 0.3, py + 0.4, r + 0.5, 0, 7); x.fill();
    const g = x.createRadialGradient(px - r * 0.4, py - r * 0.4, 0.2, px, py, r); g.addColorStop(0, rgb(BOIS_C)); g.addColorStop(1, rgb(mix(BOIS, BOIS_S, 0.3)));
    x.fillStyle = g; x.beginPath(); x.arc(px, py, r, 0, 7); x.fill();
    x.strokeStyle = rgb(mix(BOIS, BOIS_S, 0.5), 0.6); x.lineWidth = 0.25; x.beginPath(); x.arc(px, py, r * 0.55, 0, 7); x.stroke();
  }
  // corde tendue entre deux points, qui pend un peu au milieu
  function corde(x, ax, ay, bx, by, pend, ep = 0.9) {
    const mx = (ax + bx) / 2, my = (ay + by) / 2 + pend;
    x.strokeStyle = rgb(mix(CORDE, BOIS_S, 0.55)); x.lineWidth = ep + 0.6; x.beginPath(); x.moveTo(ax, ay + 0.4); x.quadraticCurveTo(mx, my + 0.4, bx, by + 0.4); x.stroke();
    x.strokeStyle = rgb(CORDE); x.lineWidth = ep; x.beginPath(); x.moveTo(ax, ay); x.quadraticCurveTo(mx, my, bx, by); x.stroke();
    x.strokeStyle = rgb(mix(CORDE, LITE, 0.5), 0.6); x.lineWidth = ep * 0.35; x.setLineDash([1, 1.2]); x.beginPath(); x.moveTo(ax, ay - ep * 0.2); x.quadraticCurveTo(mx, my - ep * 0.2, bx, by - ep * 0.2); x.stroke(); x.setLineDash([]);
  }
  // PONT DE BOIS : planches en travers, longerons sombres sur les bords, poteaux et rambardes de corde,
  // pilotis visibles dans l'eau sur la face sud (pont est-ouest) et ombre portée
  function pontBois(x, X0, Y0, X1, Y1, hz, seed) {
    const L = hz ? X1 - X0 : Y1 - Y0, Wd = hz ? Y1 - Y0 : X1 - X0;
    // ombre sur l'eau
    x.fillStyle = 'rgba(6,22,38,0.38)'; if (hz) x.fillRect(X0 + 2, Y1, X1 - X0, 5); else x.fillRect(X1, Y0 + 2, 5, Y1 - Y0);
    // pilotis (face sud / est)
    for (let a = 6; a < L - 2; a += 22) { const px = hz ? X0 + a : X1 - 2, py = hz ? Y1 - 1 : Y0 + a; x.fillStyle = rgb(BOIS_S); if (hz) x.fillRect(px - 1.4, py, 2.8, 6); else x.fillRect(px, py - 1.4, 6, 2.8); x.fillStyle = 'rgba(200,240,255,0.5)'; if (hz) x.fillRect(px - 2.2, py + 5.4, 4.4, 0.6); else x.fillRect(px + 5.4, py - 2.2, 0.6, 4.4); }
    // longerons
    x.fillStyle = rgb(BOIS_S); if (hz) { x.fillRect(X0, Y0 + 1, L, Wd - 2); } else x.fillRect(X0 + 1, Y0, Wd - 2, L);
    // planches (en travers du passage)
    const ep = 4.2;
    for (let a = 0, k = 0; a < L; a += ep, k++) {
      const u = Math.abs((a + ep / 2) / L - 0.5) * 2, usure = 1 - u, jit = (hash(seed, k, 803) - 0.5) * 1.2;
      if (hz) planche(x, X0 + a, Y0 + 1.5 + jit * 0.4, ep, Wd - 3, true, seed + k, usure * 0.6);
      else planche(x, X0 + 1.5 + jit * 0.4, Y0 + a, Wd - 3, ep, false, seed + k, usure * 0.6);
    }
    // bord de chaque côté : une poutre claire et des poteaux reliés par une corde
    const posts = []; for (let a = 2; a <= L - 2; a += Math.max(14, L / Math.max(1, Math.round(L / 20)))) posts.push(a); if (posts[posts.length - 1] < L - 4) posts.push(L - 2);
    for (const side of [0, 1]) {
      const pts = posts.map(a => (hz ? [X0 + a, side ? Y1 - 1.6 : Y0 + 1.6] : [side ? X1 - 1.6 : X0 + 1.6, Y0 + a]));
      x.fillStyle = rgb(mix(BOIS, BOIS_S, 0.3)); if (hz) x.fillRect(X0, side ? Y1 - 2.6 : Y0 + 0.4, L, 2.2); else x.fillRect(side ? X1 - 2.6 : X0 + 0.4, Y0, 2.2, L);
      for (let i = 0; i < pts.length - 1; i++) corde(x, pts[i][0], pts[i][1] - (hz ? 3 : 0), pts[i + 1][0], pts[i + 1][1] - (hz ? 3 : 0), hz ? 1.8 : 0.8);
      for (const [px, py] of pts) poteau(x, px, py - (hz ? 1.2 : 0), 1.7, seed + px + py);
    }
  }
  // PONT DE CORDE (montagne) : planches espacées (on voit l'eau entre elles), tablier qui s'affaisse au milieu,
  // deux cordes porteuses et des suspentes, gros poteaux d'ancrage aux deux bouts
  function pontCorde(x, X0, Y0, X1, Y1, hz, seed) {
    const L = hz ? X1 - X0 : Y1 - Y0, Wd = hz ? Y1 - Y0 : X1 - X0, sag = Math.min(4, L / 18);
    const off = a => Math.sin(Math.PI * a / L) * sag;   // affaissement (vers le sud ou l'est)
    x.fillStyle = 'rgba(6,22,38,0.3)'; for (let a = 0; a < L; a += 4) { if (hz) x.fillRect(X0 + a, Y1 + off(a) + 1, 3.4, 3); else x.fillRect(X1 + off(a) + 1, Y0 + a, 3, 3.4); }
    for (let a = 1, k = 0; a < L - 1; a += 4.6, k++) {
      const jit = (hash(seed, k, 811) - 0.5) * 1.4, d = off(a);
      if (hz) planche(x, X0 + a, Y0 + 2.5 + d + jit * 0.3, 3.4, Wd - 5, true, seed + k, 0.2);
      else planche(x, X0 + 2.5 + d + jit * 0.3, Y0 + a, Wd - 5, 3.4, false, seed + k, 0.2);
    }
    for (const side of [0, 1]) {
      const at = a => (hz ? [X0 + a, (side ? Y1 - 2 : Y0 + 2) + off(a)] : [(side ? X1 - 2 : X0 + 2) + off(a), Y0 + a]);
      for (let a = 2; a < L - 2; a += 4.6) { const [px, py] = at(a); corde(x, px, py - (hz ? 4 : 0), px, py, 0, 0.45); }   // suspentes
      x.strokeStyle = rgb(mix(CORDE, BOIS_S, 0.55)); x.lineWidth = 1.5; x.beginPath(); for (let a = 0; a <= L; a += 2) { const [px, py] = at(a); a ? x.lineTo(px, py + 0.4 - (hz ? 4 : 0)) : x.moveTo(px, py + 0.4 - (hz ? 4 : 0)); } x.stroke();
      x.strokeStyle = rgb(CORDE); x.lineWidth = 1; x.beginPath(); for (let a = 0; a <= L; a += 2) { const [px, py] = at(a); a ? x.lineTo(px, py - (hz ? 4 : 0)) : x.moveTo(px, py - (hz ? 4 : 0)); } x.stroke();
      for (const a of [0.5, L - 0.5]) { const [px, py] = at(a); poteau(x, px, py - (hz ? 2 : 0), 2.4, seed + a + side); }
    }
  }
  // TRONC COUCHÉ (forêt profonde) : un arbre géant tombé en travers de l'eau ; écorce en cylindre (sombre sur les
  // flancs), dessus aplati et usé par les pas, mousse, moignons de branches, souche et racines au bout ouest/nord
  function pontTronc(x, X0, Y0, X1, Y1, hz, seed) {
    // repère du tronc : a = le long (de -E à L+E, il déborde sur les berges), b = en travers (0..Wd)
    const L = hz ? X1 - X0 : Y1 - Y0, Wd = hz ? Y1 - Y0 : X1 - X0, E = 7, B = [118, 74, 42], TOP = [196, 146, 96];
    const P = (a, b) => (hz ? [X0 + a, Y0 + b] : [X0 + b, Y0 + a]);
    const R = (a0, b0, la, lb) => (hz ? [X0 + a0, Y0 + b0, la, lb] : [X0 + b0, Y0 + a0, lb, la]);
    const rect = (a0, b0, la, lb) => { const [rx, ry, rw, rh] = R(a0, b0, la, lb); x.fillRect(rx, ry, rw, rh); };
    // ombre portée sur l'eau (sud / est)
    x.fillStyle = 'rgba(6,22,38,0.45)'; rect(-E + 3, Wd - 1, L + 2 * E - 2, 6);
    // RACINES arrachées au bout de départ (ouest / nord) : langues de bois qui s'écartent en éventail
    for (let r = 0; r < 5; r++) {
      const sp = (r - 2) / 2, [ax, ay] = P(-E + 2, Wd / 2 + sp * Wd * 0.3), [bx, by] = P(-E - 5 - hash(seed, r, 831) * 4, Wd / 2 + sp * Wd * 0.75);
      x.strokeStyle = rgb(mix(B, INK, 0.55)); x.lineWidth = 3.4 - Math.abs(sp); x.lineCap = 'round'; x.beginPath(); x.moveTo(ax, ay); x.lineTo(bx, by); x.stroke();
      x.strokeStyle = rgb(mix(B, TOP, 0.25)); x.lineWidth = 2 - Math.abs(sp) * 0.6; x.beginPath(); x.moveTo(ax, ay); x.lineTo(bx, by); x.stroke();
    }
    // FÛT : volume de cylindre (flancs très sombres, dessus clair usé), contour sombre
    const g = hz ? x.createLinearGradient(0, Y0 - 1, 0, Y0 + Wd + 1) : x.createLinearGradient(X0 - 1, 0, X0 + Wd + 1, 0);
    g.addColorStop(0, rgb(mix(B, INK, 0.65))); g.addColorStop(0.1, rgb(mix(B, INK, 0.25))); g.addColorStop(0.24, rgb(B)); g.addColorStop(0.36, rgb(mix(TOP, B, 0.25)));
    g.addColorStop(0.5, rgb(TOP)); g.addColorStop(0.64, rgb(mix(TOP, B, 0.3))); g.addColorStop(0.78, rgb(mix(B, COOL, 0.2))); g.addColorStop(0.92, rgb(mix(B, INK, 0.4))); g.addColorStop(1, rgb(mix(B, INK, 0.7)));
    x.fillStyle = rgb(mix(B, INK, 0.7)); rect(-E, -1.2, L + 2 * E, Wd + 2.4);
    x.fillStyle = g; rect(-E, -0.5, L + 2 * E, Wd + 1);
    // écorce en plaques sur les deux flancs (le dessus, usé, en est dépourvu)
    for (const [b0, b1] of [[0, Wd * 0.3], [Wd * 0.7, Wd]]) for (let a = -E, k = 0; a < L + E; k++) {
      const la = 3 + hash(seed, k + b0, 832) * 5, lb = (b1 - b0) * (0.5 + hash(seed, k + b0, 833) * 0.4), bb = b0 + (b1 - b0 - lb) * hash(seed, k, 834);
      x.fillStyle = rgb(mix(B, INK, 0.5), 0.55); rect(a, bb, 0.5, lb); x.fillStyle = rgb(mix(B, TOP, 0.2), 0.35); rect(a + 0.6, bb, 0.4, lb * 0.7);
      a += la;
    }
    // dessus : fines veines du bois lissé par les pas
    x.strokeStyle = rgb(mix(TOP, B, 0.45), 0.45); x.lineWidth = 0.35;
    for (let k = 0; k < 4; k++) { const b = Wd * (0.38 + k * 0.08); x.beginPath(); for (let a = -E + 2; a <= L + E - 2; a += 4) { const [px, py] = P(a, b + (hash(seed, k * 90 + a, 835) - 0.5) * 0.7); a > -E + 2 ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke(); }
    // COUPE à cernes au bout d'arrivée (est / sud)
    { const [cx, cy] = P(L + E, Wd / 2), rx = hz ? 2.6 : Wd / 2, ry = hz ? Wd / 2 : 2.6;
      x.fillStyle = rgb([226, 184, 128]); x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, 7); x.fill();
      x.strokeStyle = rgb(mix(B, INK, 0.3), 0.6); x.lineWidth = 0.35; for (const f of [0.75, 0.5, 0.25]) { x.beginPath(); x.ellipse(cx, cy, rx * f, ry * f, 0, 0, 7); x.stroke(); }
      x.strokeStyle = rgb(mix(B, INK, 0.6)); x.lineWidth = 0.8; x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, 7); x.stroke(); }
    // mousse en coussins irréguliers (plus sur le flanc nord / ouest, à l'ombre) et petites fougères
    for (let i = 0; i < Math.round(L / 12) + 1; i++) {   // (longues plaques le long des flancs, plus fournies au nord / à l'ouest, à l'ombre)
      const a = hash(seed, i, 836) * (L + E) - E / 2, nord = hash(seed, i, 837) < 0.7, b = nord ? Wd * (0.04 + hash(seed, i, 838) * 0.12) : Wd * (0.86 + hash(seed, i, 838) * 0.08);
      const [px, py] = P(a, b), r = 1.4 + hash(seed, i, 839) * 1.2, la = r * (2.6 + hash(seed, i, 840) * 2), lb = r * 0.9;
      const E2 = (dx, dy, ra, rb) => { x.beginPath(); x.ellipse(px + dx, py + dy, hz ? ra : rb, hz ? rb : ra, 0, 0, 7); x.fill(); };
      x.fillStyle = rgb(mix(MOSS, INK, 0.35), 0.9); E2(0.3, 0.4, la + 0.4, lb + 0.4);
      x.fillStyle = rgb(MOSS); E2(0, 0, la, lb);
      x.fillStyle = 'rgba(206,240,150,0.6)'; for (let k = 0; k < 4; k++) { const t = (k / 3 - 0.5) * la * 1.4; E2(hz ? t : -lb * 0.3, hz ? -lb * 0.3 : t, 0.8, 0.5); }
    }
    // moignons de branches cassées sur les flancs
    for (let i = 0; i < Math.max(1, Math.round(L / 26)); i++) {
      const a = (i + 0.5) / Math.max(1, Math.round(L / 26)) * L, out = i % 2 ? Wd + 2.2 : -2.2, [px, py] = P(a, out), [qx, qy] = P(a + 1.5, out + (i % 2 ? 3 : -3));
      x.strokeStyle = rgb(mix(B, INK, 0.45)); x.lineWidth = 2.4; x.lineCap = 'round'; x.beginPath(); x.moveTo(px, py); x.lineTo(qx, qy); x.stroke();
      x.fillStyle = rgb([226, 184, 128]); x.beginPath(); x.arc(qx, qy, 0.9, 0, 7); x.fill();
    }
  }

  DW.World.paintBridges = map => {
    const rows = map.rows, W = map.w, H = map.h, info = DW.World.info;
    const isB = (x, y) => x >= 0 && y >= 0 && x < W && y < H && info(rows[y][x]).t === 'bridge';
    const isWater = (x, y) => x >= 0 && y >= 0 && x < W && y < H && info(rows[y][x]).t === 'water';
    // ponts = groupes de cases de pont reliées
    const seen = new Uint8Array(W * H), comps = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!isB(x, y) || seen[y * W + x]) continue;
      const c = { x0: x, y0: y, x1: x, y1: y, n: 0, cells: [] }, st = [[x, y]]; seen[y * W + x] = 1;
      while (st.length) {
        const [cx, cy] = st.pop(); c.cells.push([cx, cy]); c.n++;
        c.x0 = Math.min(c.x0, cx); c.y0 = Math.min(c.y0, cy); c.x1 = Math.max(c.x1, cx); c.y1 = Math.max(c.y1, cy);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = cx + dx, ny = cy + dy; if (isB(nx, ny) && !seen[ny * W + nx]) { seen[ny * W + nx] = 1; st.push([nx, ny]); } }
      }
      comps.push(c);
    }
    if (!comps.length) return null;
    let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
    for (const c of comps) { x0 = Math.min(x0, c.x0); y0 = Math.min(y0, c.y0); x1 = Math.max(x1, c.x1); y1 = Math.max(y1, c.y1); }
    x0 = Math.max(0, x0 - 2); y0 = Math.max(0, y0 - 2); x1 = Math.min(W - 1, x1 + 2); y1 = Math.min(H - 1, y1 + 2);
    const cv = Art.canvas((x1 - x0 + 1) * TS * K, (y1 - y0 + 1) * TS * K), x = cv.getContext('2d');
    x.scale(K, K); x.translate(-x0 * TS, -y0 * TS);
    const walls = [];   // cases des parapets : bloquantes seulement sur un pont de 4 cases ou plus (un pont de 3 se traverse sur toute sa largeur : le muret est fin, l'eau arrête de chaque côté)
    for (const c of comps) {
      const seed = c.x0 * 31 + c.y0 * 17;
      const rect = c.n === (c.x1 - c.x0 + 1) * (c.y1 - c.y0 + 1);
      // sens du pont : il relie les deux rives où se trouve la terre ferme (un pont court et large, comme à l'entrée
      // de la ville, garde ainsi ses parapets le long de l'eau et pas en travers du passage) ; sinon, le plus long côté
      const landAt = (tx, ty) => !isB(tx, ty) && !isWater(tx, ty), mx = Math.round((c.x0 + c.x1) / 2), my = Math.round((c.y0 + c.y1) / 2);
      const lLR = landAt(c.x0 - 1, my) || landAt(c.x1 + 1, my), lTB = landAt(mx, c.y0 - 1) || landAt(mx, c.y1 + 1);
      const hz = lLR !== lTB ? lLR : c.x1 - c.x0 >= c.y1 - c.y0;
      if (!rect) {   // pont de forme irrégulière (rare) : dalles case par case, parapets sur les bords qui donnent sur l'eau
        for (const [tx, ty] of c.cells) deck(x, tx * TS, ty * TS, tx * TS + TS, ty * TS + TS, hz, seed + tx * 3 + ty);
        for (const [tx, ty] of c.cells) {
          const X = tx * TS, Y = ty * TS, s2 = seed + tx * 7 + ty * 13;
          if (isWater(tx, ty - 1)) parapet(x, X, Y, X + TS, Y + 7, true, s2, 4);
          if (isWater(tx, ty + 1)) parapet(x, X, Y + TS - 3.4, X + TS, Y + TS, true, s2 + 1, 0);
          if (isWater(tx - 1, ty)) parapet(x, X, Y, X + 3.6, Y + TS, false, s2 + 2);
          if (isWater(tx + 1, ty)) parapet(x, X + TS - 3.6, Y, X + TS, Y + TS, false, s2 + 3);
        }
        continue;
      }
      const X0 = c.x0 * TS, Y0 = c.y0 * TS, X1 = (c.x1 + 1) * TS, Y1 = (c.y1 + 1) * TS;
      const style = DW.World.styleDePont(map);
      if (style !== 'pierre') {   // pont de bois, tronc couché ou pont de corde : on marche sur toute sa largeur
        const land0 = (tx, ty) => !isB(tx, ty) && !isWater(tx, ty);
        if (hz) { for (const [ex, dx] of [[X0, -1], [X1, 1]]) if (land0(dx < 0 ? c.x0 - 1 : c.x1 + 1, Math.round((c.y0 + c.y1) / 2))) apron(x, ex, (Y0 + Y1) / 2, dx, 0, (Y1 - Y0) / 2, seed + 400 + dx, map.dirtCol); }
        else { for (const [ey, dy] of [[Y0, -1], [Y1, 1]]) if (land0(Math.round((c.x0 + c.x1) / 2), dy < 0 ? c.y0 - 1 : c.y1 + 1)) apron(x, (X0 + X1) / 2, ey, 0, dy, (X1 - X0) / 2, seed + 420 + dy, map.dirtCol); }
        (style === 'bois' ? pontBois : style === 'tronc' ? pontTronc : pontCorde)(x, X0, Y0, X1, Y1, hz, seed);
        continue;
      }
      // les deux bouts sur la terre ferme : fondu de terre battue (dessiné d'abord, sous le pont)
      const land = (tx, ty) => !isB(tx, ty) && !isWater(tx, ty);
      const midY = (Y0 + Y1) / 2, midX = (X0 + X1) / 2;
      const ends = [];
      if (hz) { if (land(c.x0 - 1, Math.round((c.y0 + c.y1) / 2))) ends.push([X0, midY, -1, 0, (Y1 - Y0) / 2, 400]); if (land(c.x1 + 1, Math.round((c.y0 + c.y1) / 2))) ends.push([X1, midY, 1, 0, (Y1 - Y0) / 2, 410]); }
      else { if (land(Math.round((c.x0 + c.x1) / 2), c.y0 - 1)) ends.push([midX, Y0, 0, -1, (X1 - X0) / 2, 420]); if (land(Math.round((c.x0 + c.x1) / 2), c.y1 + 1)) ends.push([midX, Y1, 0, 1, (X1 - X0) / 2, 430]); }
      for (const e of ends) apron(x, e[0], e[1], e[2], e[3], e[4], seed + e[5], map.dirtCol);
      const film = () => { for (const e of ends) apron(x, e[0], e[1], e[2], e[3], e[4], seed + e[5], map.dirtCol, true); };
      // parapets bloquants quand le pont fait au moins 3 cases de large
      if (hz && c.y1 - c.y0 >= 3) for (let tx = c.x0; tx <= c.x1; tx++) walls.push(tx + ',' + c.y0, tx + ',' + c.y1);
      if (!hz && c.x1 - c.x0 >= 3) for (let ty = c.y0; ty <= c.y1; ty++) walls.push(c.x0 + ',' + ty, c.x1 + ',' + ty);
      if (hz) {
        const southWater = c.cells.some(([tx, ty]) => ty === c.y1 && isWater(tx, ty + 1));
        if (southWater) facade(x, X0, X1, Y1, seed);
        deck(x, X0, Y0 + 7, X1, Y1 - 3, true, seed); film();
        parapet(x, X0, Y0, X1, Y0 + 7, true, seed + 1, 4);      // parapet nord : chaperon + face intérieure
        parapet(x, X0, Y1 - 3.4, X1, Y1, true, seed + 2, 0);    // parapet sud : chaperon
        // piliers aux deux bouts et au-dessus des piles
        const n = Math.max(1, Math.round((X1 - X0) / 38)), pier = 6, span = ((X1 - X0) - pier * (n + 1)) / n;
        const px = [X0 + 3.4, X1 - 3.4];
        if (southWater) for (let i = 1; i < n; i++) px.push(X0 + i * (pier + span) + pier / 2);
        for (const p of px) { pillar(x, p, Y0 + 7, seed + p, 6); pillar(x, p, Y1 + 0.4, seed + p + 5, 4.6); }
      } else {
        // pont nord-sud : ombre sur l'eau à l'est, tablier, parapets ouest et est, piliers aux bouts
        const g = x.createLinearGradient(X1, 0, X1 + 7, 0); g.addColorStop(0, 'rgba(6,22,38,0.42)'); g.addColorStop(1, 'rgba(6,22,38,0)'); x.fillStyle = g; x.fillRect(X1, Y0 + 3, 7, Y1 - Y0);
        x.fillStyle = rgb(mix(WALL, COOL, 0.35)); x.fillRect(X1 - 0.6, Y0 + 2, 1.8, Y1 - Y0 - 1);   // tranche du pont (côté est)
        deck(x, X0 + 3.6, Y0, X1 - 3.6, Y1, false, seed); film();
        parapet(x, X0, Y0, X0 + 3.6, Y1, false, seed + 1);
        parapet(x, X1 - 3.6, Y0, X1, Y1, false, seed + 2);
        if (c.cells.some(([tx, ty]) => ty === c.y1 && isWater(tx, ty + 1))) facade(x, X0, X1, Y1, seed + 3);
        for (const p of [Y0 + 4, Y1 - 0.5]) { pillar(x, X0 + 1.8, p, seed + p, 5); pillar(x, X1 - 1.8, p, seed + p + 7, 5); }
      }
    }
    cv._k = K;
    return { cv, x: x0 * TS, y: y0 * TS, walls };
  };
})();
