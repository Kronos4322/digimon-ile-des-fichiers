'use strict';
// =====================================================================
//  PLAN DE L'ÎLE (outil de développement) : schéma de toutes les zones et sous-zones,
//  avec leurs liaisons. Dans la console du jeu :  await PLAN.build()  → captures/plan_ile.png
// =====================================================================
(function () {
  const CW = 176, CH = 64, GX = 14, GY = 22; // taille d'une case + espacements
  const step = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] };
  // ancrage de chaque région sur le plan (en pixels), à peu près selon la géographie de l'île
  const ANCHOR = {
    gel: [700, 120], brumes: [1500, 120], jouets: [2300, 120],
    lac: [60, 470], usine: [2300, 470], decharge: [3100, 470],
    scarabees: [60, 860], montagne: [1500, 860], savane: [2300, 860],
    volcan: [1500, 1250], canyon: [2300, 1250], dino: [3100, 1250],
    marais: [60, 1640], tunnel: [860, 1640], jungle: [2300, 1640], overdell: [2300, 2030],
  };
  // cartes de départ (forêt, plage, ville), placées à la main
  const BASE = {
    lac_: null, clairiere: [860, 520], sentier: [860, 610], prairie: [1060, 610], berceau: [1260, 610],
    geants: [860, 700], lisiere: [860, 790], plage: [860, 880], village: [1060, 880],
    maison: [1060, 970], champs: [860, 1060], gym: [1260, 1060],
  };
  const wrap = (g, s, w) => { const out = []; let line = ''; for (const word of s.split(' ')) { const t = line ? line + ' ' + word : word; if (g.measureText(t).width > w && line) { out.push(line); line = word; } else line = t; } out.push(line); return out; };

  function layout() {
    const pos = {}, M = DW.MAPS;
    for (const k in BASE) if (BASE[k]) pos[k] = { x: BASE[k][0], y: BASE[k][1], w: 180, h: 70, base: true };
    for (const r in ANCHOR) {
      const subs = Object.keys(M).filter(id => M[id].region === r && M[id].spec);
      const grid = { [r + '0']: [0, 0] }, q = [r + '0'];
      while (q.length) {
        const id = q.shift(), [gx, gy] = grid[id];
        for (const w of M[id].warps) if (subs.includes(w.to) && !grid[w.to]) { const [dx, dy] = step[w.dir]; grid[w.to] = [gx + dx, gy + dy]; q.push(w.to); }
      }
      const xs = Object.values(grid).map(p => p[0]), ys = Object.values(grid).map(p => p[1]), x0 = Math.min(...xs), y0 = Math.min(...ys);
      for (const id in grid) pos[id] = { x: ANCHOR[r][0] + (grid[id][0] - x0) * (CW + GX), y: ANCHOR[r][1] + 30 + (grid[id][1] - y0) * (CH + GY), w: CW, h: CH, region: r };
    }
    // intérieurs : petite case sous leur sous-zone
    for (const id of ['usine_in', 'manoir']) { const from = M[id].warps[0].to; if (pos[from]) pos[id] = { x: pos[from].x + 20, y: pos[from].y + CH + 4, w: CW - 40, h: 16, inside: true }; }
    return pos;
  }

  async function build(o = {}) {
    const M = DW.MAPS, pos = layout(), TH = DW.World.THEMES;
    const W = 3900, H = 2420, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const g = cv.getContext('2d');
    // mer et île
    const sea = g.createLinearGradient(0, 0, 0, H); sea.addColorStop(0, '#1e5aa0'); sea.addColorStop(1, '#0e2e62');
    g.fillStyle = sea; g.fillRect(0, 0, W, H);
    const blocks = Object.values(pos);
    g.fillStyle = '#e6cf98';
    for (const p of blocks) { g.beginPath(); g.roundRect(p.x - 40, p.y - 56, p.w + 80, p.h + 100, 40); g.fill(); }
    g.fillStyle = '#3e7a3a';
    for (const p of blocks) { g.beginPath(); g.roundRect(p.x - 26, p.y - 42, p.w + 52, p.h + 72, 30); g.fill(); }
    // cadres des régions
    for (const r in ANCHOR) {
      const ids = Object.keys(pos).filter(id => pos[id].region === r);
      if (!ids.length) continue;
      const x0 = Math.min(...ids.map(id => pos[id].x)) - 10, y0 = Math.min(...ids.map(id => pos[id].y)) - 40;
      const x1 = Math.max(...ids.map(id => pos[id].x + pos[id].w)) + 10, y1 = Math.max(...ids.map(id => pos[id].y + pos[id].h)) + 10;
      g.fillStyle = 'rgba(8,16,34,0.55)'; g.beginPath(); g.roundRect(x0, y0, x1 - x0, y1 - y0, 12); g.fill();
      g.fillStyle = '#ffe680'; g.font = 'bold 20px sans-serif'; g.textAlign = 'left';
      g.fillText(M[r + '0'].regionName, x0 + 12, y0 + 24);
    }
    g.fillStyle = 'rgba(8,16,34,0.55)'; g.beginPath(); g.roundRect(840, 460, 640, 690, 12); g.fill();
    g.fillStyle = '#ffe680'; g.font = 'bold 20px sans-serif'; g.fillText('Forêt, plage et Ville des Fichiers', 852, 488);
    // liaisons
    const done = new Set();
    for (const a in pos) for (const w of (M[a].warps || []).concat(M[a].doors || [])) {
      const b = w.to; if (!pos[b]) continue;
      const key = [a, b].sort().join('|'); if (done.has(key)) continue; done.add(key);
      const A = pos[a], B = pos[b], ext = A.region !== B.region || A.base || B.base;
      g.strokeStyle = ext ? '#ffd040' : 'rgba(240,240,220,0.85)'; g.lineWidth = ext ? 5 : 4; g.setLineDash(ext ? [10, 6] : []);
      g.beginPath(); g.moveTo(A.x + A.w / 2, A.y + A.h / 2); g.lineTo(B.x + B.w / 2, B.y + B.h / 2); g.stroke();
    }
    g.setLineDash([]);
    // cases
    for (const id in pos) {
      const p = pos[id], m = M[id], th = TH[m.theme] || {};
      const fill = p.inside ? '#5a4a6a' : th.canopyStyle === 'rock' && m.indoor ? '#3a3240' : (th.grass ? th.grass[2] : '#5aa050');
      g.fillStyle = fill; g.strokeStyle = '#10141e'; g.lineWidth = 3;
      g.beginPath(); g.roundRect(p.x, p.y, p.w, p.h, 8); g.fill(); g.stroke();
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(p.x + 3, p.y + p.h - 14, p.w - 6, 11);
      const light = th.grass && parseInt(th.grass[2].slice(1, 3), 16) > 170;
      g.fillStyle = light ? '#14202a' : '#ffffff'; g.font = p.inside ? '12px sans-serif' : 'bold 14px sans-serif'; g.textAlign = 'center';
      if (p.inside) { g.fillStyle = '#ffffff'; g.fillText('⌂ ' + m.name, p.x + p.w / 2, p.y + 12); continue; }
      const lines = wrap(g, m.name, p.w - 12);
      lines.slice(0, 2).forEach((l, i) => g.fillText(l, p.x + p.w / 2, p.y + 20 + i * 16 - (lines.length > 1 ? 4 : -4)));
      // pictos : ★ lieu emblématique, ▼ grotte / souterrain
      g.font = '11px sans-serif'; g.fillStyle = '#ffe680';
      const tags = [m.piece ? '★' : '', m.indoor && !p.base ? '▼ souterrain' : '', m.dark && !m.indoor ? '☾ sombre' : ''].filter(Boolean).join('  ');
      g.fillText(tags || id, p.x + p.w / 2, p.y + p.h - 5);
    }
    // titre et légende
    g.fillStyle = 'rgba(8,16,34,0.85)'; g.beginPath(); g.roundRect(20, 20, 600, 82, 12); g.fill();
    g.textAlign = 'left'; g.fillStyle = '#ffe680'; g.font = 'bold 28px sans-serif'; g.fillText("PLAN DE L'ÎLE DES FICHIERS", 36, 56);
    g.font = '15px sans-serif'; g.fillStyle = '#c8d4f0';
    g.fillText(`${Object.keys(pos).length} cartes — ★ lieu emblématique   ▼ souterrain   ⌂ intérieur`, 36, 80);
    g.fillText('— trait blanc : passage dans la région    - - trait doré : passage vers une autre région', 36, 98);
    PLAN.last = cv;
    if (o.save !== false) { const b = await new Promise(r => cv.toBlob(r, 'image/png')); await fetch('/dev/save?name=plan_ile.png', { method: 'POST', body: b }); }
    return Object.keys(pos).length;
  }
  const PLAN = window.PLAN = { layout, build };
})();
