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
    if (map._pontsOk || map.region === 'plage' || map.dock || map.indoor || !map.rows) return;
    map._pontsOk = true;
    const W = map.w, H = map.h, g = map.rows.map(r => [...r]), N = W * H;
    const wet = c => c === '~' || c === 'w' || c === '_';
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
    map.rows = g.map(r => r.join(''));
  };

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
    const walls = [];   // cases des parapets : bloquantes (on marche au milieu du pont, pas sur les murets)
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
      // les deux bouts sur la terre ferme : fondu de terre battue (dessiné d'abord, sous le pont)
      const land = (tx, ty) => !isB(tx, ty) && !isWater(tx, ty);
      const midY = (Y0 + Y1) / 2, midX = (X0 + X1) / 2;
      const ends = [];
      if (hz) { if (land(c.x0 - 1, Math.round((c.y0 + c.y1) / 2))) ends.push([X0, midY, -1, 0, (Y1 - Y0) / 2, 400]); if (land(c.x1 + 1, Math.round((c.y0 + c.y1) / 2))) ends.push([X1, midY, 1, 0, (Y1 - Y0) / 2, 410]); }
      else { if (land(Math.round((c.x0 + c.x1) / 2), c.y0 - 1)) ends.push([midX, Y0, 0, -1, (X1 - X0) / 2, 420]); if (land(Math.round((c.x0 + c.x1) / 2), c.y1 + 1)) ends.push([midX, Y1, 0, 1, (X1 - X0) / 2, 430]); }
      for (const e of ends) apron(x, e[0], e[1], e[2], e[3], e[4], seed + e[5], map.dirtCol);
      const film = () => { for (const e of ends) apron(x, e[0], e[1], e[2], e[3], e[4], seed + e[5], map.dirtCol, true); };
      // parapets bloquants quand le pont fait au moins 3 cases de large
      if (hz && c.y1 - c.y0 >= 2) for (let tx = c.x0; tx <= c.x1; tx++) walls.push(tx + ',' + c.y0, tx + ',' + c.y1);
      if (!hz && c.x1 - c.x0 >= 2) for (let ty = c.y0; ty <= c.y1; ty++) walls.push(c.x0 + ',' + ty, c.x1 + ',' + ty);
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
