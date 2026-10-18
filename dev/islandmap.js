'use strict';
// =====================================================================
//  CARTE DE L'ÎLE (outil de développement) : assemble les vraies cartes du jeu
//  selon leurs passages (warps), avec les intérieurs, les liaisons, les zones
//  futures dans le brouillard et un récapitulatif de l'avancement.
//  Nécessite dev/shots.js. Dans la console :  await ISLAND.build()   (enregistre dev/captures/carte_ile.png)
// =====================================================================
(function () {
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const T = 6;          // pixels par case sur la carte finale
  const GAP = 7;        // cases de chemin entre deux zones voisines
  const DIR = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

  // ------------------------------------------------------------ disposition par les passages
  function layout() {
    const pos = { village: { x: 0, y: 0 } }, links = [], queue = ['village'];
    const M = id => DW.getMap(id);
    const overlap = (id, p) => Object.keys(pos).some(k => {
      const q = pos[k], a = M(k), b = M(id);
      return p.x < q.x + a.w + 3 && p.x + b.w + 3 > q.x && p.y < q.y + a.h + 3 && p.y + b.h + 3 > q.y;
    });
    while (queue.length) {
      const id = queue.shift(), m = M(id), P = pos[id];
      for (const w of m.warps || []) {
        const B = DW.MAPS[w.to] && M(w.to); if (!B || B.indoor) continue;
        const [dx, dy] = DIR[w.dir];
        const ax = P.x + w.x + (dx > 0 ? w.w || 1 : 0), ay = P.y + w.y + (dy > 0 ? w.h || 1 : 0);
        if (!pos[w.to]) {
          let p = { x: ax + dx * GAP - w.tx - (dx < 0 ? 1 : 0), y: ay + dy * GAP - w.ty - (dy < 0 ? 1 : 0) };
          // chevauchement : on cherche le plus petit décalage (en s'éloignant et/ou de côté)
          if (overlap(w.to, p)) {
            let best = null;
            for (let al = 0; al <= 40; al++) for (let pe = -80; pe <= 80; pe++) {
              const cost = al * 1.5 + Math.abs(pe) * 0.5; if (best && cost >= best.cost) continue;
              const q = dx === 0 ? { x: p.x + pe, y: p.y + dy * al } : { x: p.x + dx * al, y: p.y + pe };
              if (!overlap(w.to, q)) best = { cost, q };
            }
            if (best) p = best.q;
          }
          pos[w.to] = p; queue.push(w.to);
        }
        const Q = pos[w.to];
        if (!links.some(l => l.a === w.to && l.b === id)) links.push({ a: id, b: w.to, x1: ax, y1: ay, x2: Q.x + w.tx + 0.5, y2: Q.y + w.ty + 0.5, dir: w.dir });
      }
    }
    return { pos, links };
  }

  // ------------------------------------------------------------ dessin
  async function build(o = {}) {
    window.requestAnimationFrame = cb => setTimeout(() => cb(performance.now()), 16);
    const st = DW.state;
    if (o.full !== false) DW.Town.RECRUITS.forEach(r => (st.recruits[r.id] = true));
    st.clock = Math.floor(st.clock / 1440) * 1440 + 11 * 60; st.weather = { type: 'clear', until: st.clock + 600 };
    const { pos, links } = layout(), ids = Object.keys(pos);
    // rendu de chaque carte à taille réelle, puis réduction
    const imgs = {};
    for (const id of ids) { await DEV.map(id, null, null, 11); imgs[id] = DEV.last; }
    const inside = Object.keys(DW.MAPS).filter(k => DW.getMap(k).indoor);
    for (const id of inside) { await DEV.map(id, null, null, 11); imgs[id] = DEV.last; }
    DEV.hide();

    // emprise : cartes + zones futures + marge
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const id of ids) { const m = DW.getMap(id), p = pos[id]; x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x + m.w); y1 = Math.max(y1, p.y + m.h); }
    const V = pos.village, VM = DW.getMap('village');
    const FUTURE = [
      { name: "Montagne de l'Infini", x: V.x + VM.w + 14, y: V.y - 46, w: 44, h: 40, kind: 'mountain' },
      { name: 'Usine', x: V.x + VM.w + 66, y: V.y - 46, w: 34, h: 28, kind: 'factory' },
      { name: 'Désert de Gear', x: x1 + 14, y: V.y + 2, w: 46, h: 40, kind: 'desert' },
      { name: 'Marais / Lac', x: x0 - 52, y: y0 + 6, w: 40, h: 34, kind: 'lake' },
    ];
    for (const f of FUTURE) { x0 = Math.min(x0, f.x); y0 = Math.min(y0, f.y); x1 = Math.max(x1, f.x + f.w); y1 = Math.max(y1, f.y + f.h); }
    const IW = 150;                     // colonne des intérieurs à droite
    const PAD = 24;                     // cases de mer autour
    const ox = (-x0 + PAD) * T, oy = (-y0 + PAD + 6) * T;
    const colH = Object.keys(DW.MAPS).filter(k => DW.getMap(k).indoor).reduce((a, k) => a + DW.getMap(k).h * IW / DW.getMap(k).w + 22, 40);
    const CW = (x1 - x0 + PAD * 2) * T + IW + 20, CH = Math.max((y1 - y0 + PAD * 2 + 6) * T, oy + V.y * T + colH);
    const cv = document.createElement('canvas'); cv.width = CW; cv.height = CH;
    const g = cv.getContext('2d');
    const X = tx => ox + tx * T, Y = ty => oy + ty * T;
    const rnd = (a, b, s) => DW.Art.hash(a, b, s);

    // mer
    const sea = g.createLinearGradient(0, 0, 0, CH); sea.addColorStop(0, '#2a6ab8'); sea.addColorStop(1, '#14407a');
    g.fillStyle = sea; g.fillRect(0, 0, CW, CH);
    g.strokeStyle = 'rgba(255,255,255,0.12)'; g.lineWidth = 1;
    for (let i = 0; i < 260; i++) { const x = rnd(i, 1, 9) * CW, y = rnd(i, 2, 9) * CH; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 6, y - 3, x + 12, y); g.stroke(); }
    // terres : disques autour de chaque zone (côte organique), sable puis herbe
    const blobs = [...ids.map(id => ({ x: pos[id].x, y: pos[id].y, w: DW.getMap(id).w, h: DW.getMap(id).h })), ...FUTURE, ...links.map(l => ({ x: Math.min(l.x1, l.x2) - 2, y: Math.min(l.y1, l.y2) - 2, w: Math.abs(l.x2 - l.x1) + 4, h: Math.abs(l.y2 - l.y1) + 4 }))];
    const land = (grow, col, s) => {
      g.fillStyle = col;
      blobs.forEach((b, i) => {
        g.fillRect(X(b.x - grow * 0.6), Y(b.y - grow * 0.6), (b.w + grow * 1.2) * T, (b.h + grow * 1.2) * T);
        const per = 2 * (b.w + b.h), n = Math.ceil(per / 4);
        for (let k = 0; k < n; k++) {
          let u = k / n * per, px, py;
          if (u < b.w) { px = b.x + u; py = b.y; } else if ((u -= b.w) < b.h) { px = b.x + b.w; py = b.y + u; } else if ((u -= b.h) < b.w) { px = b.x + b.w - u; py = b.y + b.h; } else { u -= b.w; px = b.x; py = b.y + b.h - u; }
          const r = (grow * (0.7 + rnd(i, k, s) * 0.6)) * T;
          g.beginPath(); g.arc(X(px), Y(py), r, 0, 7); g.fill();
        }
      });
    };
    land(14, '#0e3a6a', 3);            // haut-fond
    land(11, '#5ab0d8', 4);            // lagon
    land(8.5, '#ecd49a', 5);           // sable
    land(6.5, '#3e8a3c', 6);           // herbe
    // texture : bosquets
    for (let i = 0; i < 900; i++) {
      const x = rnd(i, 3, 7) * CW, y = rnd(i, 4, 7) * CH, d = g.getImageData(x | 0, y | 0, 1, 1).data;
      if (d[1] > 120 && d[1] < 150 && d[0] < 80) { g.fillStyle = rnd(i, 5, 7) < 0.5 ? '#2e6e30' : '#4c9a46'; g.beginPath(); g.arc(x, y, 3 + rnd(i, 6, 7) * 4, 0, 7); g.fill(); }
    }

    // zones futures : relief esquissé puis brouillard
    for (const f of FUTURE) {
      const fx = X(f.x), fy = Y(f.y), fw = f.w * T, fh = f.h * T;
      g.save(); g.beginPath(); g.rect(fx, fy, fw, fh); g.clip();
      if (f.kind === 'mountain') {
        g.fillStyle = '#7a6a5a'; g.beginPath(); g.moveTo(fx, fy + fh); g.lineTo(fx + fw * 0.5, fy + fh * 0.08); g.lineTo(fx + fw, fy + fh); g.fill();
        g.fillStyle = '#f4f6ff'; g.beginPath(); g.moveTo(fx + fw * 0.38, fy + fh * 0.32); g.lineTo(fx + fw * 0.5, fy + fh * 0.08); g.lineTo(fx + fw * 0.62, fy + fh * 0.32); g.fill();
      } else if (f.kind === 'factory') {
        g.fillStyle = '#6a6e7a'; g.fillRect(fx + fw * 0.15, fy + fh * 0.4, fw * 0.7, fh * 0.5);
        g.fillRect(fx + fw * 0.25, fy + fh * 0.1, fw * 0.1, fh * 0.4); g.fillRect(fx + fw * 0.55, fy + fh * 0.18, fw * 0.1, fh * 0.3);
      } else if (f.kind === 'desert') {
        g.fillStyle = '#d8b878'; g.fillRect(fx, fy, fw, fh);
        g.fillStyle = '#c09858'; for (let i = 0; i < 8; i++) { g.beginPath(); g.ellipse(fx + rnd(i, 1, 2) * fw, fy + rnd(i, 2, 2) * fh, 22, 6, 0, 0, 7); g.fill(); }
      } else {
        g.fillStyle = '#4a8a9a'; g.beginPath(); g.ellipse(fx + fw / 2, fy + fh / 2, fw * 0.4, fh * 0.32, 0, 0, 7); g.fill();
        g.fillStyle = '#5a7a3a'; for (let i = 0; i < 10; i++) { g.beginPath(); g.arc(fx + rnd(i, 3, 2) * fw, fy + rnd(i, 4, 2) * fh, 6, 0, 7); g.fill(); }
      }
      g.restore();
      for (let i = 0; i < 26; i++) {
        g.fillStyle = `rgba(235,240,250,${0.35 + rnd(i, 7, f.x) * 0.3})`;
        g.beginPath(); g.ellipse(fx + rnd(i, 8, f.x) * fw, fy + rnd(i, 9, f.x) * fh, 20 + rnd(i, 1, f.x) * 26, 10 + rnd(i, 2, f.x) * 10, 0, 0, 7); g.fill();
      }
      label(g, f.name, fx + fw / 2, fy + fh / 2 - 6, '#c8d0e0', 'à venir');
    }

    // chemins entre zones
    g.lineCap = 'round';
    for (const l of links) {
      const a = [X(l.x1), Y(l.y1)], b = [X(l.x2), Y(l.y2)], vert = l.dir === 'up' || l.dir === 'down';
      const mid = vert ? [[a[0], (a[1] + b[1]) / 2], [b[0], (a[1] + b[1]) / 2]] : [[(a[0] + b[0]) / 2, a[1]], [(a[0] + b[0]) / 2, b[1]]];
      const path = () => { g.beginPath(); g.moveTo(...a); g.lineTo(...mid[0]); g.lineTo(...mid[1]); g.lineTo(...b); };
      g.strokeStyle = '#7a5a34'; g.lineWidth = 9; path(); g.stroke();
      g.strokeStyle = '#d8b878'; g.lineWidth = 6; path(); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 1; g.setLineDash([3, 4]); path(); g.stroke(); g.setLineDash([]);
    }

    // les cartes elles-mêmes (ombre portée + cadre)
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    for (const id of ids) {
      const m = DW.getMap(id), p = pos[id], x = X(p.x), y = Y(p.y), w = m.w * T, h = m.h * T;
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(x + 4, y + 5, w, h);
      g.drawImage(imgs[id], 0, 0, m.w * 16, m.h * 16, x, y, w, h);
      g.strokeStyle = '#1a1208'; g.lineWidth = 2; g.strokeRect(x - 1, y - 1, w + 2, h + 2);
      g.strokeStyle = '#f0e0b0'; g.lineWidth = 1; g.strokeRect(x - 2.5, y - 2.5, w + 5, h + 5);
      const enc = (m.encounters || []).length;
      label(g, m.name, x + w / 2, y - 22, '#ffe680', enc ? `${m.w}×${m.h} cases · ${enc} Digimon sauvages` : `${m.w}×${m.h} cases`);
    }

    // colonne des intérieurs (reliés à leur porte dans la ville)
    let iy = Math.min(Y(V.y) - 10, CH - colH + 30); const ix = CW - IW - 14;
    g.fillStyle = 'rgba(10,20,40,0.6)'; g.fillRect(ix - 8, iy - 22, IW + 16, inside.length * 0 + 22);
    label(g, 'Intérieurs', ix + IW / 2, iy - 8, '#ffe680');
    const doors = VM.doors || [];
    for (const id of inside) {
      const m = DW.getMap(id), k = IW / (m.w * 16), h = m.h * 16 * k;
      const d = doors.find(o => o.to === id);
      if (d) {
        g.strokeStyle = 'rgba(255,240,200,0.7)'; g.lineWidth = 1; g.setLineDash([2, 3]);
        g.beginPath(); g.moveTo(X(V.x + d.x + 1), Y(V.y + d.y)); g.lineTo(ix, iy + h / 2); g.stroke(); g.setLineDash([]);
        g.fillStyle = '#ffe680'; g.beginPath(); g.arc(X(V.x + d.x + 1), Y(V.y + d.y), 2.5, 0, 7); g.fill();
      }
      g.fillStyle = 'rgba(0,0,0,0.4)'; g.fillRect(ix + 3, iy + 4, IW, h);
      g.drawImage(imgs[id], 0, 0, m.w * 16, m.h * 16, ix, iy, IW, h);
      g.strokeStyle = '#f0e0b0'; g.strokeRect(ix - 0.5, iy - 0.5, IW + 1, h + 1);
      g.font = '10px monospace'; g.fillStyle = '#fff'; g.textAlign = 'left'; g.fillText(m.name, ix, iy + h + 11);
      iy += h + 22;
    }

    // titre, rose des vents et récapitulatif de l'avancement
    g.fillStyle = 'rgba(8,16,34,0.82)'; g.fillRect(10, 10, 300, 158);
    g.strokeStyle = '#f0e0b0'; g.strokeRect(10.5, 10.5, 300, 158);
    g.textAlign = 'left'; g.fillStyle = '#ffe680'; g.font = 'bold 16px monospace'; g.fillText("L'ÎLE DES FICHIERS", 22, 32);
    g.font = '11px monospace'; g.fillStyle = '#c8d4f0'; g.fillText('État d\'avancement du jeu', 22, 48);
    const species = Object.keys(DW.SPECIES || {}).length, moves = Object.keys(DW.MOVES || {}).length;
    const lines = [
      `Zones extérieures : ${ids.length}   Intérieurs : ${inside.length}`,
      `Digimon : ${species} espèces (DigiDex ${(DW.DEX_ORDER || []).length})`,
      `Techniques : ${moves}`,
      `Habitants à recruter : ${DW.Town.RECRUITS.length}`,
      `Niveaux de ville : ${DW.Town.LEVELS.length} (${DW.Town.LEVELS[0]} → ${DW.Town.LEVELS[DW.Town.LEVELS.length - 1]})`,
      `Héros jouables : ${(DW.HERO_ORDER || ['tai']).length}`,
      'Zones à venir : dans le brouillard',
      o.full !== false ? '(ville affichée entièrement reconstruite)' : '',
    ];
    g.fillStyle = '#ffffff'; lines.forEach((s, i) => g.fillText(s, 22, 68 + i * 13));
    // rose des vents
    const rx = 40, ry = CH - 44;
    g.fillStyle = 'rgba(8,16,34,0.6)'; g.beginPath(); g.arc(rx, ry, 26, 0, 7); g.fill();
    g.fillStyle = '#f0e0b0'; g.beginPath(); g.moveTo(rx, ry - 20); g.lineTo(rx + 5, ry); g.lineTo(rx, ry + 20); g.lineTo(rx - 5, ry); g.fill();
    g.fillStyle = '#e04a2c'; g.beginPath(); g.moveTo(rx, ry - 20); g.lineTo(rx + 5, ry); g.lineTo(rx - 5, ry); g.fill();
    g.font = 'bold 10px monospace'; g.textAlign = 'center'; g.fillStyle = '#fff'; g.fillText('N', rx, ry - 23);

    ISLAND.last = cv;
    if (o.save !== false) {
      const blob = await new Promise(r => cv.toBlob(r, 'image/png'));
      await fetch('/dev/save?name=carte_ile.png', { method: 'POST', body: blob });
    }
    return { w: CW, h: CH, zones: ids, interiors: inside };
  }

  // étiquette : nom (+ sous-titre) sur un cartouche sombre
  function label(g, name, x, y, col, sub) {
    g.font = 'bold 12px monospace'; const w = Math.max(g.measureText(name).width, sub ? (g.font = '9px monospace', g.measureText(sub).width) : 0) + 14;
    const h = sub ? 28 : 17;
    g.fillStyle = 'rgba(8,16,34,0.8)'; g.fillRect(x - w / 2, y - 12, w, h);
    g.strokeStyle = 'rgba(240,224,176,0.7)'; g.lineWidth = 1; g.strokeRect(x - w / 2 + 0.5, y - 11.5, w - 1, h - 1);
    g.textAlign = 'center'; g.font = 'bold 12px monospace'; g.fillStyle = col; g.fillText(name, x, y + 1);
    if (sub) { g.font = '9px monospace'; g.fillStyle = '#c8d4f0'; g.fillText(sub, x, y + 12); }
  }

  const ISLAND = window.ISLAND = { layout, build };
})();
