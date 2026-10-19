'use strict';
// Vérifie chaque carte : sorties, arrivées, PNJ, panneaux, terrains d'entraînement et déclencheurs accessibles.
// Point de départ = première sortie de la carte. Ouvrir dev/check.html (via dev/serve.py).
(function () {
  const lines = [];
  // vérification sur la ville au complet (toutes les recrues) : quartiers, routes et maisons ouverts.
  // (À bas niveau, certains passages sont fermés exprès : ils n'existent pas encore.)
  DW.Town.RECRUITS.forEach(r => (DW.state.recruits[r.id] = true));
  // maison entièrement meublée et Tai délivré : toutes les pièces et leurs portes existent
  DW.state.hero = 'perso'; DW.state.kids = { tai: true, matt: true };
  DW.state.home = { owned: Object.fromEntries(Object.keys(DW.Home.FURN).map(k => [k, true])) };
  // tout objet cité par la légende ou par une carte doit exister
  const OBJ = DW.World.OBJ, miss = new Set();
  for (const ch in DW.World.CH) { const o = DW.World.CH[ch].obj; if (o && !OBJ[o]) miss.add(o + ' (case ' + ch + ')'); }
  for (const id in DW.MAPS) { const m = DW.MAPS[id]; if (m.build) m.build(); if (m.populate) { try { m.populate(); } catch (e) { /* (dépend de l'état de partie) */ } }   /* comme au chargement d'une carte en jeu */ for (const o of m.objects || []) if (!OBJ[o.kind]) miss.add(o.kind + ' (' + id + ')'); }
  if (miss.size) lines.push(`<span class="ko">objets manquants : ${[...miss].join(', ')}</span>`);
  const solidAt = (m, g, x, y) => x < 0 || y < 0 || x >= m.w || y >= m.h || DW.SOLID.has(m.rows[y][x]) || g.solid.has(x + ',' + y) || (m.npcs || []).some(n => n.x === x && n.y === y && !n.walk && !n.gate);   // barrière d'énigme : supposée levée ; dalle : on marche dessus
  // (check.html?seul=village,montagne0 : seulement ces cartes, pour vérifier vite une retouche)
  const ONLY = (new URLSearchParams(location.search).get('seul') || '').split(',').filter(Boolean);
  for (const id of Object.keys(DW.MAPS).filter(k => !ONLY.length || ONLY.includes(k))) {
    // la carte telle que le jeu la prépare (décors en kits, distributeurs, personnages hors du décor : game/overworld.js)
    const m = DW.preparerCarte ? DW.preparerCarte(id) : DW.getMap(id); if (!DW.preparerCarte && DW.MapKit.dress) DW.MapKit.dress(m, id);
    const g = DW.World.prepare(m), p = [];
    // départ : le premier passage de bord, sinon la case devant le premier escalier (étages, greniers, caves)
    const d0 = (m.doors || [])[0], w0 = m.warps[0] || (d0 && { x: d0.x, y: d0.y + 1, w: d0.w || 1, h: 1, to: d0.to });
    if (!w0) { lines.push(`<span class="ok">${id} OK</span> — pièce sans sortie (accès par script)`); DW.World.unprepare(m); continue; }
    let start = null;
    for (let y = w0.y; y < w0.y + w0.h && !start; y++) for (let x = w0.x; x < w0.x + w0.w; x++) if (!solidAt(m, g, x, y)) { start = [x, y]; break; }
    if (!start) { lines.push(`<span class="ko">${id} : sortie ${w0.to} entièrement bloquée</span>`); DW.World.unprepare(m); continue; }
    const seen = new Set([start.join()]), q = [start];
    while (q.length) {
      const [x, y] = q.shift();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy, k = nx + ',' + ny;
        if (!seen.has(k) && !solidAt(m, g, nx, ny)) { seen.add(k); q.push([nx, ny]); }
      }
    }
    const adj = (x, y) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => seen.has((x + dx) + ',' + (y + dy)));
    for (const w of m.warps) {
      let ok = false;
      for (let y = w.y; y < w.y + w.h; y++) for (let x = w.x; x < w.x + w.w; x++) if (seen.has(x + ',' + y)) ok = true;
      if (!ok) p.push('sortie vers ' + w.to + ' inaccessible');
      const tm = DW.getMap(w.to);
      for (let y = 0; y < w.h; y++) for (let x = 0; x < w.w; x++) {
        const tx = w.tx + x, ty = w.ty + y;
        if (!tm.rows[ty] || tm.rows[ty][tx] === undefined) p.push(`arrivée hors carte ${w.to} ${tx},${ty}`);
      }
      if (!m.secretEntry && !tm.warps.some(b => b.to === id) && !(tm.doors || []).some(b => b.to === id)) p.push('pas de retour depuis ' + w.to);
    }
    for (const o of m.doors || []) { const dy = { up: 1, down: -1 }[o.dir] || 0, dx = { left: 1, right: -1 }[o.dir] || 0; let ok = false; for (let x = o.x; x < o.x + (o.w || 1); x++) if (seen.has((x + dx) + ',' + (o.y + dy))) ok = true; if (!ok) p.push('porte vers ' + o.to + ' inaccessible'); const tm = DW.getMap(o.to); if (!tm.rows[o.ty] || tm.rows[o.ty][o.tx] === undefined) p.push('arrivée de porte hors carte ' + o.to); }
    for (const n of m.npcs || []) if (!n.shadow && (DW.SOLID.has(m.rows[n.y][n.x]) || g.solid.has(n.x + ',' + n.y))) p.push(`PNJ ${n.sp || 'objet'} (${n.x},${n.y}) sur un obstacle`);
    // chaque case d'arrivée d'un passage doit être praticable dans la carte d'arrivée (sinon on arrive dans les arbres)
    for (const w of m.warps || []) { const tm = DW.getMap(w.to), occ = new Set(); for (const o of tm.objects || []) if (!o.walk && !o.top) for (let yy = o.y; yy < o.y + o.h; yy++) for (let xx = o.x; xx < o.x + o.w; xx++) occ.add(xx + ',' + yy);
      for (let y = w.y; y < w.y + (w.h || 1); y++) for (let x = w.x; x < w.x + (w.w || 1); x++) { const tx = w.tx + (x - w.x), ty = w.ty + (y - w.y), ch = (tm.rows[ty] || '')[tx]; if (ch === undefined || DW.SOLID.has(ch) || occ.has(tx + ',' + ty)) p.push(`arrivée bloquée vers ${w.to} (${tx},${ty})`); } }
    for (const n of m.npcs || []) if (!adj(n.x, n.y)) p.push(`PNJ ${n.sp || 'objet'} (${n.x},${n.y}) inaccessible`);
    for (const t of m.triggers || []) {
      let ok = false;
      for (let y = t.y; y < t.y + (t.h || 1); y++) for (let x = t.x; x < t.x + (t.w || 1); x++) if (seen.has(x + ',' + y)) ok = true;
      if (!ok) p.push('déclencheur ligne ' + t.y + ' inaccessible');
    }
    for (const k in m.signs || {}) { const [x, y] = k.split(',').map(Number); if (!adj(x, y)) p.push('panneau ' + k + ' inaccessible'); }
    m.rows.forEach((r, y) => [...r].forEach((ch, x) => { const I = DW.World.info(ch); if ((I.train || I.toilet) && !adj(x, y)) p.push(`${I.train ? 'entraînement' : 'toilettes'} (${x},${y}) inaccessible`); }));
    const tall = m.rows.join('').split('').filter(ch => DW.World.isTall(ch)).length;
    lines.push(p.length ? `<span class="ko">${id} : ${p.join(' ; ')}</span>` : `<span class="ok">${id} OK</span> — ${m.w}x${m.h}, ${seen.size} cases, ${tall} herbes hautes, ${g.ms} ms`);
    DW.World.unprepare(m);   // (dessin de la carte libéré : toutes les cartes à la fois ne tiennent pas en mémoire)
  }
  // ------------------------------------------------------------ arbre des Digivolutions et données des espèces
  {
    const p = [], SP = DW.SPECIES, seen = new Set(), q = [...DW.EGG_ORDER];
    while (q.length) { const s = q.pop(); if (seen.has(s)) continue; seen.add(s); for (const o of DW.Evo.options(s)) q.push(o.to); }
    for (const sp in SP) {
      if (SP[sp].npc) continue;
      if (!seen.has(sp)) p.push(`${sp} inatteignable depuis un œuf`);
      if (!DW.DRAW[sp]) p.push(`${sp} sans dessin`);
      for (const [, mv] of SP[sp].learn) if (!DW.MOVES[mv]) p.push(`${sp} : technique inconnue ${mv}`);
      if (SP[sp].stage === 'Champion' && !DW.Evo.options(sp).length) p.push(`${sp} (Champion) sans Ultime`);
      for (const o of DW.Evo.options(sp)) if (!SP[o.to]) p.push(`${sp} → ${o.to} inconnu`);
    }
    // tables de Digimon sauvages, recrues de l'histoire, objets
    for (const rid in DW.Wild.TABLES) for (const t of DW.Wild.TABLES[rid][1].split(/\s+/)) if (!SP[t.split(':')[0]]) p.push(`table ${rid} : ${t} inconnu`);
    const R = DW.Town.RECRUITS, ids = R.map(r => r.id);
    ids.forEach((id, i) => { if (ids.indexOf(id) !== i) p.push(`recrue en double : ${id}`); if (!SP[id]) p.push(`recrue inconnue : ${id}`); if (!DW.MAPS[R[i].zone]) p.push(`zone de recrue inconnue : ${id}`); });
    for (const id of DW.ITEM_ORDER) if (!DW.ITEMS[id]) p.push(`objet inconnu : ${id}`);
    lines.push(p.length ? `<span class="ko">Digivolutions / données : ${p.join(' ; ')}</span>` : `<span class="ok">Digivolutions / données OK</span> — ${Object.keys(SP).length} espèces, ${ids.length} recrues`);
  }
  document.getElementById('out').innerHTML = lines.join('\n');
  window.CHECK_RESULT = lines.join('\n').replace(/<[^>]+>/g, '');
})();
