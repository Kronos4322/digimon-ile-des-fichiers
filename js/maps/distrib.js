'use strict';
// =====================================================================
//  DISTRIBUTEURS (comme dans Digimon World 1) : des machines posées un peu partout sur l'île
//  vendent l'essentiel loin de la ville, en attendant que les boutiques ouvrent :
//   - distributeur de RAM PV, de RAM PM, de nourriture (viande, eau).
//  En ville, un distributeur complet dépanne au début : il disparaît quand Gotsumon ouvre le Bazar.
//  Une machine par carte de la liste ; sa place est choisie à la première visite, dans un endroit
//  dégagé (toutes les cases autour praticables : elle ne bloque jamais un passage), loin des sorties.
// =====================================================================
(function () {
  const MACHINES = [
    { name: 'Distributeur de RAM PV', stock: ['soin_p', 'bandage', 'remede'] },
    { name: 'Distributeur de RAM PM', stock: ['disque_pm', 'remede'] },
    { name: 'Distributeur de nourriture', stock: ['viande', 'eau_fraiche'] },
    { name: 'Distributeur de la ville', stock: ['soin_p', 'disque_pm', 'viande', 'eau_fraiche', 'bandage'] },
  ];
  // cartes équipées (peu nombreuses : un distributeur doit rester une bonne surprise) : 3 dans la forêt et sur la plage,
  // puis une région sur deux
  const BASE = ['sentier', 'plage', 'geants'];
  const list = () => BASE.concat(Object.values(DW.REGION_ENTRY || {}).filter((_, i) => i % 2 === 0));
  const hash = (x, y, s) => { let h = (x * 374761393 + y * 668265263 + s * 2246822519) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

  function place(m, id) {
    if (m.indoor || !m.rows) return;
    if (id === 'village') {   // distributeur provisoire de la ville : jusqu'à l'ouverture du Bazar
      const has = (m.objects || []).some(o => o.kind === 'vending');
      if (DW.Town.has('gotsumon')) { if (has) { m.objects = m.objects.filter(o => o.kind !== 'vending'); for (const k in m.signs) if (m.signs[k] && m.signs[k].vending) delete m.signs[k]; if (m.gfx) DW.World.unprepare(m); } return; }
    } else if (m._distribFor === m.rows) return;
    const i = id === 'village' ? 3 : list().indexOf(id);
    if (i < 0) return;
    m._distribFor = m.rows;
    // un distributeur déjà là (déplacé dans l'atelier des cartes) : il garde sa boutique
    const deja = (m.objects || []).find(o => o.kind === 'vending');
    if (deja) { brancher(m, deja.x, deja.y, MACHINES[id === 'village' ? 3 : i % 3]); return; }
    const H = m.rows.length, W = m.rows[0].length, occ = new Set();
    for (const o of m.objects || []) if (!o.walk) for (let y = o.y - (o.top ? 0 : 0); y < o.y + (o.h || 1); y++) for (let x = o.x; x < o.x + (o.w || 1); x++) occ.add(x + ',' + y);
    const walk = (x, y) => x > 0 && y > 0 && x < W - 1 && y < H - 1 && !DW.SOLID.has(m.rows[y][x]) && !occ.has(x + ',' + y) && m.rows[y][x] !== '~';
    const far = new Set();
    for (const w of [...(m.warps || []), ...(m.doors || [])]) for (let y = w.y - 4; y < w.y + (w.h || 1) + 4; y++) for (let x = w.x - 4; x < w.x + (w.w || 1) + 4; x++) far.add(x + ',' + y);
    for (const n of m.npcs || []) for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) far.add((n.x + dx) + ',' + (n.y + dy));
    for (const k in m.signs || {}) far.add(k);
    let best = null, bs = 2;
    for (let y = 3; y < H - 5; y++) for (let x = 3; x < W - 3; x++) {
      if (far.has(x + ',' + y) || !'.f,='.includes(m.rows[y][x]) || m.rows[y][x] === '=') continue;
      let ok = true;
      for (let dy = -1; dy <= 3 && ok; dy++) for (let dx = -1; dx <= 1; dx++) if (!walk(x + dx, y + dy)) { ok = false; break; }   // dégagé autour, et 3 rangées devant (pas de feuillage qui la cache)
      if (!ok) continue;
      // de préférence au bord d'un chemin
      let path = false;
      for (let dy = -2; dy <= 2 && !path; dy++) for (let dx = -2; dx <= 2; dx++) if ((m.rows[y + dy] || '')[x + dx] === '=') { path = true; break; }
      const s = hash(x, y, i + 7) + (path ? 0 : 1);
      if (s < bs) { bs = s; best = [x, y]; }
    }
    if (!best) return;
    const [x, y] = best, v = i % 3, T = DW.Retouches && DW.Retouches.de(id);
    if (T && (T.retraits || []).includes(`vending@${x},${y}`)) return;   // (retiré dans l'atelier des cartes)
    m.objects.push({ kind: 'vending', v, x, y, w: 1, h: 1 });
    brancher(m, x, y, MACHINES[id === 'village' ? 3 : v]);
    if (m.gfx) DW.World.unprepare(m);
  }
  // la machine répond quand on lui parle (sa boutique)
  function brancher(m, x, y, M) {
    m.signs = m.signs || {};
    if (m.signs[`${x},${y}`]) return;
    m.signs[`${x},${y}`] = Object.assign(async () => {
      DW.Audio.sfx('select');
      await DW.say(`${M.name}. Insère tes Bits !`);
      await DW.Game.push(new DW.ShopScene(M.stock));
    }, { vending: true });
  }
  // PANNEAUX bien placés : un panneau perdu dans l'herbe est déplacé au bord du chemin le plus proche
  // (case d'herbe touchant le chemin, devant dégagé), son texte le suit. Une seule fois par carte.
  const SIGN = new Set(['S', 'Z', 'Q']);
  function signs(m, id) {
    if (m.indoor || !m.rows || m._signsFor === m.rows || !m.signs) return;
    const H = m.rows.length, W = m.rows[0].length, g = m.rows.map(r => [...r]);
    // un panneau posé ou écrit dans l'atelier des cartes reste où le créateur l'a mis
    const T = DW.Retouches && DW.Retouches.de(id), fixe = new Set(T ? [...Object.keys(T.panneaux || {}), ...Object.keys(T.cases || {}).filter(k => SIGN.has(T.cases[k]))] : []);
    const at = (x, y) => (g[y] || [])[x];
    const isPath = (x, y) => at(x, y) === '=';
    const nearWarp = (x, y) => [...(m.warps || []), ...(m.doors || [])].some(w => x >= w.x - 2 && x < w.x + (w.w || 1) + 2 && y >= w.y - 2 && y < w.y + (w.h || 1) + 2);
    const occ = new Set(); for (const o of m.objects || []) if (!o.walk) for (let y = o.y; y < o.y + (o.h || 1); y++) for (let x = o.x; x < o.x + (o.w || 1); x++) occ.add(x + ',' + y);
    // caché : le feuillage des arbres juste devant (en dessous) le recouvre
    const TREE = new Set(['T', '#', 'Y', 't', 'p']);
    const hidden = (x, y) => { for (let dy = 1; dy <= 2; dy++) for (let dx = -1; dx <= 1; dx++) if (TREE.has(at(x + dx, y + dy))) return true; return false; };
    let moved = false;
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      if (!SIGN.has(at(x, y)) || !m.signs[`${x},${y}`] || fixe.has(x + ',' + y)) continue;
      let ok = false;
      for (let dy = -2; dy <= 2 && !ok; dy++) for (let dx = -2; dx <= 2; dx++) if (isPath(x + dx, y + dy)) { ok = true; break; }
      if (ok && !hidden(x, y)) continue;   // au bord d'un chemin et bien visible : il reste là
      let best = null, bd = 1e9;
      for (let yy = Math.max(2, y - 10); yy < Math.min(H - 2, y + 11); yy++) for (let xx = Math.max(2, x - 10); xx < Math.min(W - 2, x + 11); xx++) {
        if (!'.f,'.includes(at(xx, yy)) || occ.has(xx + ',' + yy) || nearWarp(xx, yy) || m.signs[`${xx},${yy}`]) continue;
        if (!(isPath(xx + 1, yy) || isPath(xx - 1, yy) || isPath(xx, yy + 1))) continue;
        if (DW.SOLID.has(at(xx, yy + 1)) || occ.has(xx + ',' + (yy + 1)) || hidden(xx, yy)) continue;
        const d = Math.abs(xx - x) + Math.abs(yy - y);
        if (d < bd) { bd = d; best = [xx, yy]; }
      }
      if (!best) continue;
      const [nx, ny] = best, ch = at(x, y), CH = DW.World.CH, base = Object.keys(CH).find(k => CH[k].t === CH[ch].t && !CH[k].obj && !CH[k].solid && !CH[k].tall) || '.';
      g[ny][nx] = ch; g[y][x] = base;
      m.signs[`${nx},${ny}`] = m.signs[`${x},${y}`]; delete m.signs[`${x},${y}`];
      moved = true;
    }
    if (moved) { DW.MapKit.changerLignes(m, g.map(r => r.join(''))); if (m.gfx) DW.World.unprepare(m); }
    m._signsFor = m.rows;
  }
  DW.Distrib = { place, signs, MACHINES };
  // la nuit, les fenêtres des maisons s'allument (comme l'école du Terrain d'entraînement) : points de lumière
  // des bâtiments qui n'en avaient pas (tous les fichiers de dessins sont chargés à ce stade)
  { const O = DW.World.OBJ, L = { house: [[18, 40, 11], [38, 40, 11]], shack: [[26, 44, 12], [54, 44, 12]], greenhouse: [[30, 44, 14], [58, 44, 14]], kiosk: [[30, 40, 14]] };
    for (const k in L) if (O[k] && !O[k].lights) O[k].lights = L[k]; }
})();
