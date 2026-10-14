'use strict';
// =====================================================================
//  DÉCORS EN KITS (densité façon Digimon World 2003) : sur chaque carte extérieure générée,
//  des petits ensembles d'éléments propres à la région sont posés dans les espaces libres
//  (rocher moussu + champignons, épave + crabe, tombes + lanterne, réservoir + batteries...),
//  avec une touche numérique discrète (panneaux de circuits, antennes, tuyaux de données).
//  Sécurité : après chaque ensemble, on vérifie que tous les passages, portes, panneaux et
//  personnages restent accessibles ; sinon l'ensemble est retiré.
//  Les cartes de la ville (thèmes town / farm / nursery) restent faites à la main.
// =====================================================================
(function () {
  // ensembles par thème : chaque liste = éléments posés côte à côte (le premier au centre)
  const FOREST = [['mossrock', 'glowshroom'], ['hollowlog', 'fern'], ['stump', 'fern', 'glowshroom'], ['boulder', 'bigfern'], ['oak'], ['birch', 'fern'], ['cairn', 'pebbles']];
  const KITS = {
    spring: FOREST, misty: FOREST.concat([['stonelantern', 'mossrock']]), meadow: [['boulder', 'flowerbed'], ['oak'], ['birch'], ['cairn', 'pebbles'], ['haybale'], ['stump', 'flowerbed']],
    deep: FOREST.concat([['giantstump'], ['glowshroom', 'glowshroom']]), autumn: FOREST.concat([['deadtree'], ['scarecrow']]),
    beach: [['wreck', 'crab'], ['driftwood', 'starfish', 'crab'], ['driftwood', 'starfish'], ['tidepool', 'crab'], ['tidepool', 'starfish'], ['rockarch'], ['palm', 'crab'], ['palm', 'starfish'], ['boulder', 'crab']],
    mountain: [['boulder', 'pebbles'], ['cairn'], ['pine', 'pine'], ['crystal', 'pebbles'], ['basalt'], ['stalagmite', 'boulder']],
    summit: [['boulder', 'pebbles'], ['cairn'], ['crystal'], ['basalt', 'pebbles']],
    volcano: [['lavarock', 'steamvent'], ['basalt', 'pebbles'], ['smallvolcano'], ['bones', 'lavarock'], ['steamvent', 'steamvent']],
    savanna: [['acacia', 'drybush'], ['termite'], ['baobab'], ['halfgear', 'drybush'], ['boulder', 'drybush'], ['skullrock']],
    factory: [['tank', 'battery'], ['conveyor', 'scrap'], ['battery', 'scrap'], ['crane'], ['robotarm'], ['chimney', 'scrap']],
    trash: [['tirestack', 'scrap'], ['brokencar', 'tirestack'], ['tvstack', 'junkpile'], ['scrap', 'battery'], ['junkpile']],
    sewer: [['scrap', 'battery'], ['tirestack'], ['pipe', 'scrap']],
    canyon: [['archrock'], ['cactus', 'drybush'], ['spire'], ['boulder', 'pebbles'], ['skullrock', 'cactus']],
    dino: [['cycad', 'bigfern'], ['bones', 'fern'], ['amber', 'boulder'], ['bigfern', 'cycad'], ['bones']],
    jungle: [['jungletree', 'junglebush'], ['totem', 'junglebush'], ['bigfern', 'junglebush'], ['reeds', 'bigfern']],
    mangrove: [['mangrove', 'reeds'], ['reeds', 'reeds'], ['junglebush', 'reeds']],
    cemetery: [['tombstone', 'tombstone', 'jacklantern'], ['gargoyle', 'tombstone'], ['ironfence', 'tombstone'], ['deadtree', 'jacklantern']],
    fog: [['stonelantern', 'mossrock'], ['mossrock', 'fern'], ['deadtree'], ['cairn', 'stonelantern']],
    toy: [['teddy', 'block'], ['jackbox', 'block'], ['toyhouse'], ['candytree', 'block'], ['block', 'block', 'teddy']],
    snow: [['snowbush', 'icerock'], ['icecrystal', 'icerock'], ['snowman'], ['pine', 'snowbush'], ['icepillar', 'icecrystal']],
    beetle: [['giantstump', 'glowshroom'], ['honeycomb', 'stump'], ['hollowlog', 'glowshroom'], ['beetlestatue', 'fern']],
    swamp: [['swamptree', 'reeds'], ['frogstatue', 'reeds'], ['reeds', 'reeds'], ['bogshack']],
  };
  const DIGITAL = [['datapanel'], ['antenna'], ['pipe']];   // la touche « monde numérique » de Digimon World 2003
  const NO_DRESS = new Set(['town', 'farm', 'nursery']);
  const GROUND = new Set(['.', 's', ',', ';', 'f', 'j', 'n', 'm', '3', 'v', 'q']);   // sol où l'on peut poser un élément

  function dress(m, id) {
    if (m._dressFor === m.rows || m.indoor || m.dress === false || NO_DRESS.has(m.theme) || !KITS[m.theme] || !m.rows) return;
    const W = DW.World, A = DW.Art, kits = KITS[m.theme], seed = [...String(id || m.name)].reduce((h, c) => h * 31 + c.charCodeAt(0) | 0, 11) & 1023;
    m.objects = m.objects || [];
    // cases occupées par les objets déjà posés
    const occ = new Set();
    const mark = (o, set) => { for (let y = o.y; y < o.y + o.h; y++) for (let x = o.x; x < o.x + o.w; x++) set.add(x + ',' + y); };
    for (const o of m.objects) if (!o.walk && !o.top) mark(o, occ);
    // abords à laisser libres
    const keep = new Set(), near = (x, y, r) => { for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) keep.add((x + dx) + ',' + (y + dy)); };
    for (const w of [...(m.warps || []), ...(m.doors || [])]) for (let y = w.y; y < w.y + (w.h || 1); y++) for (let x = w.x; x < w.x + (w.w || 1); x++) near(x, y, 3);
    for (const k in m.signs || {}) { const [x, y] = k.split(',').map(Number); near(x, y, 2); }
    for (const n of m.npcs || []) near(n.x, n.y, 2);
    for (const t of m.triggers || []) for (let y = t.y; y < t.y + (t.h || 1); y++) for (let x = t.x; x < t.x + (t.w || 1); x++) near(x, y, 1);
    const free = (x, y) => x > 0 && y > 0 && x < m.w - 1 && y < m.h - 1 && GROUND.has(m.rows[y][x]) && !occ.has(x + ',' + y) && !keep.has(x + ',' + y);
    // accessibilité : cases praticables reliées au premier passage
    const walk = (x, y) => x >= 0 && y >= 0 && x < m.w && y < m.h && !DW.SOLID.has(m.rows[y][x]) && !occ.has(x + ',' + y);
    const targets = [];
    for (const w of [...(m.warps || []), ...(m.doors || [])]) targets.push([w.x, w.y]);
    for (const n of m.npcs || []) targets.push([n.x, n.y]);
    for (const k in m.signs || {}) targets.push(k.split(',').map(Number));
    const reach = () => {
      const seen = new Set(), q = [];
      const start = targets.find(([x, y]) => walk(x, y)) || null;
      if (!start) return seen;
      q.push(start); seen.add(start.join(','));
      while (q.length) { const [x, y] = q.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy, k = nx + ',' + ny; if (!seen.has(k) && walk(nx, ny)) { seen.add(k); q.push([nx, ny]); } } }
      return seen;
    };
    const ok = (seen, [x, y]) => seen.has(x + ',' + y) || [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => seen.has((x + dx) + ',' + (y + dy)));
    const base = reach(), must = targets.filter(t => ok(base, t));
    // nombre d'ensembles selon la surface
    const n = Math.round(m.w * m.h / 110);
    for (let i = 0, tries = 0; i < n && tries < n * 8; tries++) {
      const cx = 2 + Math.floor(A.hash(tries, 1, seed) * (m.w - 4)), cy = 2 + Math.floor(A.hash(tries, 2, seed) * (m.h - 4));
      if (!free(cx, cy)) continue;
      const kit = A.hash(tries, 3, seed) < 0.1 && m.theme !== 'toy' ? DW.pick(DIGITAL) : kits[Math.floor(A.hash(tries, 4, seed) * kits.length)];
      const added = [];
      kit.forEach((kind, j) => {
        const D = W.OBJ[kind], sw = typeof D.w === 'number' ? D.w : 32, sh = typeof D.h === 'number' ? D.h : 32;   // taille d'après la définition (sans dessiner)
        const spr = { w: sw, h: sh }, tiny = spr.w <= 20 && spr.h <= 16, fw = Math.max(1, Math.round(spr.w / 16 * 0.7));
        const ox = j === 0 ? 0 : Math.round((A.hash(tries, 10 + j, seed) - 0.5) * 6), oy = j === 0 ? 0 : Math.round((A.hash(tries, 20 + j, seed) - 0.5) * 3);
        const x = cx + ox - Math.floor(fw / 2), y = cy + oy;
        for (let xx = x; xx < x + fw; xx++) if (!free(xx, y)) return;
        const v = Math.floor(A.hash(tries, 30 + j, seed) * (W.OBJ[kind].n || 1));
        const o = { kind, v, x, y, w: fw, h: 1, decor: true, ...(tiny ? { walk: true } : {}), ...(spr.h < 30 ? { small: true } : {}) };
        m.objects.push(o); added.push(o);
        if (!tiny) mark(o, occ);
      });
      if (!added.length) continue;
      // un ensemble qui coupe un chemin est retiré
      const seen = reach();
      if (must.some(t => !ok(seen, t))) {
        for (const o of added) { m.objects.splice(m.objects.indexOf(o), 1); for (let xx = o.x; xx < o.x + o.w; xx++) occ.delete(xx + ',' + o.y); }
        continue;
      }
      // l'espace autour devient réservé : les ensembles restent espacés
      near(cx, cy, 2);
      i++;
    }
    m._dressFor = m.rows;
    // la carte avait déjà été préparée (carte voisine dessinée à l'avance) : on la redessine avec son décor
    if (m.objects.some(o => o.decor) && m.gfx) DW.World.unprepare(m);
  }
  DW.MapKit.dress = dress;
})();
