'use strict';
// =====================================================================
//  VUE D'UN DOMAINE (outil de développement) : les vraies cartes d'une région
//  posées côte à côte selon leurs passages, à l'échelle, pour juger la cohérence.
//  Nécessite dev/shots.js. Dans la console :
//    await DOMAINE.build(['plage', 'crique', ...], 'domaine_ch1')   (enregistre captures/<nom>.png)
// =====================================================================
(function () {
  const DIR = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  const GAP = 3;   // cases entre deux cartes voisines

  // disposition par les passages, limitée aux cartes demandées
  function layout(ids) {
    const M = id => DW.getMap(id), set = new Set(ids);
    const pos = {}, links = [];
    const overlap = (id, p) => Object.keys(pos).some(k => {
      const q = pos[k], a = M(k), b = M(id);
      return p.x < q.x + a.w + 1 && p.x + b.w + 1 > q.x && p.y < q.y + a.h + 1 && p.y + b.h + 1 > q.y;
    });
    for (const start of ids) {
      if (pos[start]) continue;
      // îlot non relié : posé à droite de tout le reste
      let xr = 0; for (const k in pos) xr = Math.max(xr, pos[k].x + M(k).w + 8);
      pos[start] = { x: xr, y: 0 };
      const queue = [start];
      while (queue.length) {
        const id = queue.shift(), m = M(id), P = pos[id];
        for (const w of m.warps || []) {
          if (!set.has(w.to) || !DIR[w.dir]) continue;
          const [dx, dy] = DIR[w.dir];
          const ax = P.x + w.x + (dx > 0 ? w.w || 1 : 0), ay = P.y + w.y + (dy > 0 ? w.h || 1 : 0);
          if (!pos[w.to]) {
            let p = { x: ax + dx * GAP - w.tx - (dx < 0 ? 1 : 0), y: ay + dy * GAP - w.ty - (dy < 0 ? 1 : 0) };
            if (overlap(w.to, p)) {
              let best = null;
              for (let al = 0; al <= 60; al++) for (let pe = -90; pe <= 90; pe++) {
                const cost = al * 1.5 + Math.abs(pe) * 0.5; if (best && cost >= best.cost) continue;
                const q = dx === 0 ? { x: p.x + pe, y: p.y + dy * al } : { x: p.x + dx * al, y: p.y + pe };
                if (!overlap(w.to, q)) best = { cost, q };
              }
              if (best) p = best.q;
            }
            pos[w.to] = p; queue.push(w.to);
          }
          const Q = pos[w.to];
          links.push({ x1: ax, y1: ay, x2: Q.x + w.tx + 0.5, y2: Q.y + w.ty + 0.5 });
        }
      }
    }
    return { pos, links };
  }

  async function build(ids, name = 'domaine', o = {}) {
    const T = o.T || 4;   // pixels par case sur l'image finale
    const st = DW.state;
    st.clock = Math.floor(st.clock / 1440) * 1440 + 11 * 60; st.weather = { type: 'clear', until: st.clock + 600 };
    if (o.chapter) st.flags.chapter = o.chapter;
    const { pos, links } = layout(ids), imgs = {};
    for (const id of ids) { await DEV.map(id, null, null, 11); imgs[id] = DEV.last; }
    DEV.hide();
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const id of ids) { const m = DW.getMap(id), p = pos[id]; x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x + m.w); y1 = Math.max(y1, p.y + m.h); }
    const PAD = 4, TOP = 40;
    const cv = document.createElement('canvas');
    cv.width = (x1 - x0 + PAD * 2) * T; cv.height = (y1 - y0 + PAD * 2) * T + TOP;
    const g = cv.getContext('2d'); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.fillStyle = '#10141c'; g.fillRect(0, 0, cv.width, cv.height);
    const X = tx => (tx - x0 + PAD) * T, Y = ty => (ty - y0 + PAD) * T + TOP;
    // passages
    g.strokeStyle = '#ffe070'; g.lineWidth = Math.max(2, T * 0.8); g.lineCap = 'round';
    for (const l of links) { g.beginPath(); g.moveTo(X(l.x1), Y(l.y1)); g.lineTo(X(l.x2), Y(l.y2)); g.stroke(); }
    // cartes
    for (const id of ids) {
      const m = DW.getMap(id), p = pos[id], im = imgs[id];
      g.drawImage(im, 0, 0, m.w * 16, m.h * 16, X(p.x), Y(p.y), m.w * T, m.h * T);
      g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 1; g.strokeRect(X(p.x) + 0.5, Y(p.y) + 0.5, m.w * T - 1, m.h * T - 1);
      const lab = (m.name || id) + '  (' + id + ')';
      g.font = 'bold ' + Math.max(12, T * 3.4) + 'px sans-serif';
      const tw = g.measureText(lab).width;
      g.fillStyle = 'rgba(0,0,0,0.65)'; g.fillRect(X(p.x) + 4, Y(p.y) + 4, tw + 12, Math.max(12, T * 3.4) + 10);
      g.fillStyle = '#ffffff'; g.fillText(lab, X(p.x) + 10, Y(p.y) + 4 + Math.max(12, T * 3.4) + 2);
    }
    g.fillStyle = '#ffe070'; g.font = 'bold 26px sans-serif'; g.fillText(o.title || name, 16, 30);
    this.last = cv;
    if (o.save !== false) { const b = await new Promise(r => cv.toBlob(r, 'image/png')); await fetch('/dev/save?name=' + name + '.png', { method: 'POST', body: b }); }
    return { w: cv.width, h: cv.height, pos };
  }

  window.DOMAINE = { layout, build };
})();
