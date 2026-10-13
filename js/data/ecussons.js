'use strict';
// =====================================================================
//  ÉCUSSONS DES DIGISÉLECTIONNÉS — la quête parallèle des enfants perdus
//  Au début du jeu, les Digimon ne dépassent pas le stade CHAMPION.
//  Chaque écusson débloque les Ultimes de sa famille (comme dans l'animé) ; les 7 réunis débloquent la Méga.
//  Les écussons sont gardés dans des donjons secrets (maps/donjons.js) avec les enfants perdus :
//  délivrer un enfant donne son écusson. Ton propre écusson est seul dans son donjon (tu n'as pas à te délivrer !).
//  Comme ton Digimon finit par mourir et que tu choisis l'œuf suivant, tous les écussons finissent par servir.
//  Écussons trouvés : state.crests = { tai: true, ... } ; enfants délivrés : state.kids = { matt: true, ... }
// =====================================================================
(function () {
  // écusson (= héros qui le porte) → Ultimes de sa famille
  const ULTIMES = {
    tai: ['metalgreymon', 'skullgreymon', 'etemon'],   // Courage
    matt: ['weregarurumon', 'megadramon'],             // Amitié
    sora: ['garudamon', 'skullmeramon'],               // Amour
    izzy: ['andromon', 'okuwamon'],                    // Savoir
    mimi: ['lillymon', 'monzaemon'],                   // Pureté
    joe: ['zudomon'],                                  // Sincérité
    tk: ['piximon'],                                   // Espoir
  };
  const ORDER = ['tai', 'matt', 'sora', 'izzy', 'mimi', 'joe', 'tk'];
  const OF = {};   // Ultime → écusson
  for (const k in ULTIMES) for (const sp of ULTIMES[k]) OF[sp] = k;

  const st = () => DW.state || {};
  const Crests = DW.Crests = {
    ORDER, ULTIMES, OF,
    name: k => (DW.HEROES && DW.HEROES[k] ? DW.HEROES[k].crest : k),
    color: k => (DW.HEROES && DW.HEROES[k] ? DW.HEROES[k].crestCol : '#c8d0e0'),
    has: k => !!(st().crests || {})[k],
    count: () => ORDER.filter(k => Crests.has(k)).length,
    give(k) { const s = st(); s.crests = s.crests || {}; s.crests[k] = true; },
    kidFound: k => !!(st().kids || {})[k],
    freeKid(k) { const s = st(); s.kids = s.kids || {}; s.kids[k] = true; },
    // condition supplémentaire d'une Digivolution (null si aucune) : { label, need, have, ok }
    requirement(to) {
      const sp = DW.SPECIES[to];
      if (!sp) return null;
      if (sp.stage === 'Méga') { const n = Crests.count(); return { label: 'Écussons réunis', need: ORDER.length, have: n, ok: n >= ORDER.length }; }
      if (sp.stage === 'Ultime' && OF[to]) { const k = OF[to], ok = Crests.has(k); return { label: `Écusson ${Crests.name(k)}`, need: 1, have: ok ? 1 : 0, ok, crest: k }; }
      return null;
    },
  };

  // les conditions de Digivolution (data/evolutions.js) tiennent compte des écussons
  const check = DW.Evo.check.bind(DW.Evo);
  DW.Evo.check = (mon, opt) => {
    const r = check(mon, opt), q = Crests.requirement(opt.to);
    if (q) { r.rows.push(q); r.ok = r.ok && q.ok; }
    return r;
  };
})();
