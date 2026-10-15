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
  // cartes équipées : la forêt et la plage, puis l'entrée de chaque région
  const BASE = ['clairiere', 'sentier', 'prairie', 'geants', 'lisiere', 'plage', 'crique', 'dunes', 'bosquet', 'champs'];
  const list = () => BASE.concat(Object.values(DW.REGION_ENTRY || {}));
  const hash = (x, y, s) => { let h = (x * 374761393 + y * 668265263 + s * 2246822519) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

  function place(m, id) {
    if (m.indoor || !m.rows) return;
    if (id === 'village') {   // distributeur provisoire de la ville : jusqu'à l'ouverture du Bazar
      const has = (m.objects || []).some(o => o.kind === 'vending');
      if (DW.Town.has('gotsumon')) { if (has) { m.objects = m.objects.filter(o => o.kind !== 'vending'); for (const k in m.signs) if (m.signs[k] && m.signs[k].vending) delete m.signs[k]; if (m.gfx) DW.World.unprepare(m); } return; }
      if (has) return;
    } else if (m._distribFor === m.rows) return;
    const i = id === 'village' ? 3 : list().indexOf(id);
    if (i < 0) return;
    m._distribFor = m.rows;
    if ((m.objects || []).some(o => o.kind === 'vending')) return;
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
    const [x, y] = best, v = i % 3, M = MACHINES[id === 'village' ? 3 : v];
    m.objects.push({ kind: 'vending', v, x, y, w: 1, h: 1 });
    m.signs = m.signs || {};
    m.signs[`${x},${y}`] = Object.assign(async () => {
      DW.Audio.sfx('select');
      await DW.say(`${M.name}. Insère tes Bits !`);
      await DW.Game.push(new DW.ShopScene(M.stock));
    }, { vending: true });
    if (m.gfx) DW.World.unprepare(m);
  }
  DW.Distrib = { place, MACHINES };
})();
