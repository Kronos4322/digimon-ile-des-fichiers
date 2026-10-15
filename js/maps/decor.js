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
  // lieux marquants : un par sous-zone qui n'a pas déjà son lieu emblématique [élément, nom, description]
  const LANDMARKS = {
    mountain: [['leomonstone', 'La Pierre du Lion', "Une roche sculptée par le vent. On dit que Leomon y méditait autrefois."], ['watchtower', 'La Tour de guet', "Une vieille tour de bois d'où l'on voit toute l'île."], ['chalet', 'Le Chalet des alpages', 'Un refuge pour les voyageurs fatigués. La cheminée est encore tiède.'], ['monolith', 'Le Monolithe de données', 'Une pierre noire qui bourdonne doucement quand on s\'approche.'], ['telescope', "Le Télescope de l'ermite", "Quelqu'un observait les étoiles d'ici, chaque nuit."]],
    summit: [['telescope', 'Le Télescope des cimes', 'Par temps clair, on y verrait les autres serveurs du monde numérique.'], ['monolith', 'La Borne du sommet', 'Une borne de données gravée de chiffres anciens.'], ['flagpole', 'Le Drapeau du sommet', 'Les grimpeurs y accrochent un ruban pour fêter leur ascension.']],
    volcano: [['smallvolcano', 'Le Petit Cratère', 'Il gronde, crache un peu de fumée... et se rendort.'], ['cavemouth', 'La Bouche de lave', "Une grotte rougeoyante. Il y fait une chaleur d'enfer."], ['basalt', 'Les Orgues de basalte', 'Des colonnes de roche noire, refroidies il y a très longtemps.'], ['monolith', 'La Stèle de Meramon', 'Une stèle brûlante couverte de flammes gravées.']],
    savanna: [['baobab', 'Le Baobab millénaire', "Le plus vieil arbre de la savane. Son tronc abrite tout un peuple d'insectes."], ['gearmill', 'Le Moulin à engrenages', 'Il tourne tout seul, entraîné par un engrenage enfoui sous la terre.'], ['giantnest', 'Le Grand Nid', 'Un nid immense... Mais quel Digimon a pu le construire ?'], ['lionrock', 'Le Rocher des Griffes', "Des marques de griffes profondes zèbrent la pierre."]],
    factory: [['crane', 'La Grue géante', "Elle soulève des conteneurs jour et nuit, sans conducteur."], ['robotarm', "Le Bras d'assemblage", 'Il visse, soude et trie... même quand il n\'y a rien à fabriquer.'], ['drill', 'La Foreuse rouillée', 'Elle a creusé jusqu\'à toucher une veine de données.'], ['watchtower', 'La Tour de contrôle', 'Des écrans clignotent encore tout en haut.']],
    trash: [['junkthrone', "Le Trône d'ordures", "Quelqu'un s'est proclamé roi de la décharge..."], ['crane', 'La Grue à ferraille', 'Son grappin aimanté attrape tout ce qui brille.'], ['drill', 'La Foreuse abandonnée', 'Elle a été jetée ici après sa dernière panne.']],
    sewer: [['cavemouth', "La Grande Bouche d'égout", "Un courant d'air tiède en sort en sifflant."], ['minecart', 'Le Wagonnet perdu', 'Il est rempli de vieilles disquettes.']],
    canyon: [['archrock', "L'Arche des vents", 'Le vent qui passe dessous chante une drôle de mélodie.'], ['spire', "L'Aiguille rouge", 'Une colonne de roche si fine qu\'on se demande comment elle tient debout.'], ['ogregate', 'La Porte de pierre', 'Une porte taillée dans la falaise. Fermée à double tour.'], ['cavemouth', 'La Grotte du canyon', "On entend de l'eau couler, tout au fond."]],
    dino: [['giantnest', 'Le Nid géant', "Des coquilles d'œufs grandes comme des rochers traînent autour."], ['timeclock', "L'Horloge figée", 'Ses aiguilles sont arrêtées sur 3 h 12. Le temps semble suspendu ici.'], ['ruintemple', 'Le Temple des fossiles', 'Des os géants sont incrustés dans ses murs.'], ['cavemouth', 'La Grotte aux os', "Des ossements tapissent l'entrée..."]],
    jungle: [['ruintemple', 'Le Temple englouti', 'Les lianes ont presque avalé ce vieux temple.'], ['totem', 'Le Grand Totem', 'Ses visages sculptés semblent te suivre du regard.'], ['stilthut', 'La Cabane perchée', 'Une cabane sur pilotis, avec un hamac.'], ['watchtower', 'Le Mirador de la jungle', "D'en haut, on voit la canopée à perte de vue."]],
    mangrove: [['stilthut', 'La Maison sur pilotis', 'Les racines de la mangrove la soutiennent comme des mains.'], ['bogshack', 'La Cabane du pêcheur', 'Des filets sèchent au soleil.'], ['dock', 'Le Vieux Ponton', 'Les planches craquent sous les pas.']],
    beach: [['lighthouse', 'Le Phare de la côte', 'Sa lumière guide les Digimon perdus en mer.'], ['wreck', "L'Épave du cargo", 'Une coque échouée, pleine de coquillages.'], ['dock', "L'Embarcadère", 'Un petit quai où accostait jadis un bateau.']],
    cemetery: [['mausoleum', 'Le Mausolée', 'Un caveau de pierre. Quelque chose gratte à la porte...'], ['chapel', 'La Chapelle oubliée', 'Ses vitraux brillent faiblement, même la nuit.'], ['mistgate', 'La Porte des brumes', "Une grille d'où s'échappe un brouillard glacé."]],
    fog: [['mistgate', 'La Porte des brumes', "On dit qu'elle mène à une autre partie du monde numérique."], ['chapel', 'Le Sanctuaire du brouillard', 'Les lanternes y brûlent sans jamais s\'éteindre.'], ['monolith', 'La Pierre qui chuchote', "Colle l'oreille contre la pierre : elle murmure des chiffres."], ['watchtower', 'La Tour perdue', 'Personne ne se souvient de qui l\'a construite.']],
    toy: [['carousel', 'Le Carrousel', 'Il tourne tout seul en jouant une boîte à musique.'], ['toytrain', 'Le Petit Train', "Tchou tchou ! Il fait le tour de la ville sans s'arrêter."], ['watchtower', 'La Tour de cubes', 'Une tour faite de cubes empilés... très, très haut.']],
    snow: [['igloo', "L'Igloo", 'Il fait étonnamment chaud à l\'intérieur.'], ['frozenfall', 'La Cascade gelée', "L'eau s'est figée en pleine chute, comme le temps."], ['chalet', 'Le Refuge des neiges', 'Une tasse de chocolat chaud refroidit sur la table.'], ['icetemple', 'Le Petit Temple de glace', 'Des cristaux bleus y brillent de l\'intérieur.']],
    spring: [['lighthouse', 'Le Phare du lac', "Il éclaire le lac la nuit pour le tramway qui ne passe plus."], ['dock', "L'Embarcadère du lac", 'Des barques y étaient amarrées autrefois.'], ['telescope', "La Longue-vue", 'On y voit la Pointe Coela, de l\'autre côté du lac.'], ['giantflower', 'La Fleur géante', 'Elle se tourne vers le soleil toute la journée.']],
    beetle: [['giantstump', 'La Souche géante', "Ce qu'il reste d'un arbre gigantesque. Des scarabées y vivent par centaines."], ['beetlestatue', 'La Statue du Scarabée', 'Les Digimon insectes viennent la saluer chaque matin.'], ['giantshroom', 'Le Champignon géant', 'Son chapeau est assez grand pour s\'abriter de la pluie.']],
    swamp: [['frogstatue', 'La Statue de la Grenouille', 'Une grenouille de pierre couverte de mousse. Elle cligne de l\'œil ?'], ['bogshack', 'La Cabane du marais', 'Une soupe étrange mijote sur le feu.'], ['stilthut', 'La Hutte sur pilotis', "L'eau monte jusqu'aux marches à la saison des pluies."]],
  };
  const DIGITAL = [['datapanel'], ['antenna'], ['pipe']];   // la touche « monde numérique » de Digimon World 2003
  const NO_DRESS = new Set(['town', 'farm', 'nursery']);
  const GROUND = new Set(['.', 's', ',', ';', 'f', 'j', 'n', 'm', '3', 'v', 'q']);   // sol où l'on peut poser un élément

  // seules les petites plantes se traversent (fougères, roseaux, fleurs...) : pierres, os, crabes... bloquent le passage
  const SOFT = /fern|reeds|flower|grass|clover|starfish|shroom/;
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
    for (const [x0, y0, x1, y1] of m.dressKeep || []) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) keep.add(x + ',' + y);   // zones à garder nues (ex. les cabines)
    // devant les lieux clés (le Grand Arbre de Kuwagamon) : rien ne doit cacher l'entrée ni le héros
    for (const o of m.objects) if (o.kind === 'grandarbre') {
      const rows = m.rows.map(r => [...r]); let cut = false;
      for (let y = o.y + o.h - 1; y <= o.y + o.h + 6; y++) for (let x = o.x - 3; x <= o.x + o.w + 2; x++) {
        keep.add(x + ',' + y);
        if (rows[y] && 'TtYbBg'.includes(rows[y][x])) { rows[y][x] = '.'; cut = true; }
      }
      if (cut) m.rows = rows.map(r => r.join(''));
    }
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
    // ---------- lieu marquant de la sous-zone (au plus près du centre ; pas si elle a déjà son lieu emblématique)
    const pool = !m.piece && LANDMARKS[m.theme];
    if (pool) {
      const num = parseInt(String(id).replace(/\D/g, ''), 10), L = pool[(isNaN(num) ? seed : num) % pool.length], D = W.OBJ[L[0]];
      const fw = Math.max(2, Math.round((typeof D.w === 'number' ? D.w : 64) / 16 * 0.8)), fh = (typeof D.h === 'number' ? D.h : 64) > 50 ? 2 : 1;
      const cx0 = Math.floor(m.w / 2), cy0 = Math.floor(m.h / 2);
      search: for (let r = 0; r < Math.max(m.w, m.h) / 2; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const x = cx0 + dx - Math.floor(fw / 2), y = cy0 + dy;
        let fits = true;
        for (let yy = y - 1; yy <= y + fh && fits; yy++) for (let xx = x - 1; xx <= x + fw && fits; xx++) if (!free(xx, yy)) fits = false;
        // devant le lieu (sous son rang du bas) : une case accessible, sinon on pourrait le poser dans une poche fermée
        if (![...Array(fw).keys()].some(i => base.has((x + i) + ',' + (y + fh)))) fits = false;
        if (!fits) continue;
        const o = { kind: L[0], x, y, w: fw, h: fh, decor: true, landmark: true };
        m.objects.push(o); mark(o, occ);
        if (must.some(t => !ok(reach(), t))) { m.objects.pop(); for (let yy = y; yy < y + fh; yy++) for (let xx = x; xx < x + fw; xx++) occ.delete(xx + ',' + yy); continue; }
        m.landmark = L[1];
        m.signs = m.signs || {};
        for (let xx = x; xx < x + fw; xx++) m.signs[xx + ',' + (y + fh - 1)] = `« ${L[1]} » — ${L[2]}`;   // on le lit par-devant
        near(x + Math.floor(fw / 2), y, Math.ceil(fw / 2) + 2);
        break search;
      }
    }
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
        const o = { kind, v, x, y, w: fw, h: 1, decor: true, ...(tiny && SOFT.test(kind) ? { walk: true } : {}), ...(spr.h < 30 ? { small: true } : {}) };
        m.objects.push(o); added.push(o);
        if (!o.walk) mark(o, occ);
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
