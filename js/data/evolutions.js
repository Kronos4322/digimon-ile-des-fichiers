'use strict';
// =====================================================================
//  TABLE DES DIGIVOLUTIONS (embranchements + conditions)
//  req : niveau minimal (combats) + points d'entraînement par stat (Terrain
//        d'entraînement), bonheur, victoires.
// =====================================================================
(function () {
  // Aucune Digivolution n'est automatique : elles se déclenchent depuis la table (menu DIGIVOLUTION)
  // une fois le Digimon suffisamment développé (entraînement + combats).
  // req (stats) = POINTS D'ENTRAÎNEMENT (m.tr), gagnés au Terrain d'entraînement.
  // lvl = niveau minimal, gagné en combat (le niveau fixe aussi le potentiel d'entraînement).
  const EVO = DW.EVO = {
    // bébés : deux victoires et un peu d'expérience suffisent
    botamon: [{ to: 'koromon', lvl: 5, req: { wins: 2 } }],
    punimon: [{ to: 'tsunomon', lvl: 5, req: { wins: 2 } }],
    pichimon: [{ to: 'bukamon', lvl: 5, req: { wins: 2 } }],
    yuramon: [{ to: 'tanemon', lvl: 5, req: { wins: 2 } }],
    nyokimon: [{ to: 'yokomon', lvl: 5, req: { wins: 2 } }],
    koromon: [{ to: "agumon", lvl: 7, req: { atk: 10, wins: 3 } }, { to: "gabumon", lvl: 7, req: { def: 10, wins: 3 } }],
    tsunomon: [{ to: "gabumon", lvl: 7, req: { def: 10, wins: 3 } }, { to: "elecmon", lvl: 7, req: { spd: 10, wins: 3 } }, { to: 'gotsumon', lvl: 7, req: { hp: 10, wins: 3 } }],
    bukamon: [{ to: "gomamon", lvl: 7, req: { def: 10, wins: 3 } }, { to: "betamon", lvl: 7, req: { int: 10, wins: 3 } }],
    tanemon: [{ to: "palmon", lvl: 7, req: { int: 10, wins: 3 } }, { to: "mushroomon", lvl: 7, req: { atk: 10, wins: 3 } }],
    yokomon: [{ to: "biyomon", lvl: 8, req: { spd: 12, wins: 3 } }, { to: 'kunemon', lvl: 8, req: { int: 12, wins: 3 } }],
    agumon: [{ to: "greymon", lvl: 15, req: { atk: 28, wins: 10 } }, { to: "meramon", lvl: 15, req: { int: 28, wins: 10 } }],
    gabumon: [{ to: "garurumon", lvl: 15, req: { spd: 26, def: 12, wins: 10 } }],
    gomamon: [{ to: "ikkakumon", lvl: 15, req: { def: 28, wins: 10 } }, { to: "shellmon", lvl: 15, req: { def: 24, hp: 24 } }],
    palmon: [{ to: "togemon", lvl: 15, req: { int: 28, wins: 10 } }],
    biyomon: [{ to: "birdramon", lvl: 15, req: { spd: 28, wins: 10 } }, { to: "meramon", lvl: 15, req: { atk: 28, wins: 10 } }],
    betamon: [{ to: 'shellmon', lvl: 15, req: { hp: 24, wins: 10 } }],
    elecmon: [{ to: 'garurumon', lvl: 15, req: { spd: 28, wins: 10 } }],
    gotsumon: [{ to: 'meramon', lvl: 15, req: { atk: 28, hp: 12, wins: 10 } }],
    mushroomon: [{ to: 'togemon', lvl: 15, req: { def: 26, wins: 10 } }],
    kunemon: [{ to: "kuwagamon", lvl: 16, req: { atk: 30, wins: 10 } }],
    greymon: [{ to: "metalgreymon", lvl: 32, req: { atk: 50, def: 30, happy: 70, wins: 40 } }],
    metalgreymon: [{ to: 'wargreymon', lvl: 45, req: { atk: 64, def: 50, happy: 90, wins: 80 } }],
    ikkakumon: [{ to: "zudomon", lvl: 32, req: { def: 50, hp: 30, happy: 70, wins: 40 } }],
    garurumon: [{ to: 'weregarurumon', lvl: 32, req: { spd: 50, atk: 30, happy: 70, wins: 40 } }],
    meramon: [{ to: 'skullmeramon', lvl: 32, req: { int: 50, atk: 30, happy: 50, wins: 40 } }],
    birdramon: [{ to: 'garudamon', lvl: 32, req: { spd: 50, hp: 30, happy: 70, wins: 40 } }],
    kuwagamon: [{ to: 'okuwamon', lvl: 32, req: { atk: 50, def: 30, wins: 40 } }],
    shellmon: [{ to: 'zudomon', lvl: 32, req: { def: 50, hp: 30, happy: 70, wins: 40 } }],
    numemon: [{ to: 'monzaemon', lvl: 28, req: { happy: 90, disc: 70, wins: 40 } }],
    sukamon: [{ to: 'monzaemon', lvl: 28, req: { happy: 95, disc: 80, wins: 50 } }],
    togemon: [{ to: "lillymon", lvl: 32, req: { int: 50, spd: 30, happy: 70, wins: 40 } }],
  };

  // ---- soins (life.js) : bonnes Digivolutions réservées aux Digimon bien élevés, mauvaises aux négligés
  // espèces de l'île (species2.js)
  for (const sp in DW.EVO_EXTRA || {}) EVO[sp] = (EVO[sp] || []).concat(DW.EVO_EXTRA[sp]);
  const BAD = ['numemon', 'sukamon', 'monzaemon'];
  for (const sp in EVO) for (const o of EVO[sp]) {
    const st = DW.SPECIES[o.to] && DW.SPECIES[o.to].stage, r = o.req = o.req || {};
    if (BAD.includes(o.to) || r.mistakes != null) continue; // évolutions « de négligence » : pas de plafond d'erreurs
    if (st === 'Champion' && r.mistakesMax == null) r.mistakesMax = 4;
    if (st === 'Ultime') { if (r.mistakesMax == null) r.mistakesMax = 2; if (r.disc == null) r.disc = 50; }
    if (st === 'Méga') { if (r.mistakesMax == null) r.mistakesMax = 1; if (r.disc == null) r.disc = 80; }
  }
  // tout Disciple trop négligé peut devenir Numemon (≥ 5 erreurs) ou Sukamon (≥ 8 erreurs)
  for (const sp of ['agumon', 'gabumon', 'gomamon', 'palmon', 'biyomon', 'kunemon', 'mushroomon', 'betamon', 'gotsumon', 'elecmon']) {
    EVO[sp] = EVO[sp] || [];
    EVO[sp].push({ to: 'numemon', lvl: 14, req: { mistakes: 5 } }, { to: 'sukamon', lvl: 14, req: { mistakes: 8 } });
  }
  // un peu de corpulence dans les conditions
  const fat = (from, to, k, v) => { const o = (EVO[from] || []).find(e => e.to === to); if (o) o.req[k] = v; };
  fat('palmon', 'togemon', 'fatMin', 2); fat('gabumon', 'garurumon', 'fatMax', 3); fat('elecmon', 'garurumon', 'fatMax', 3);
  fat('biyomon', 'birdramon', 'fatMax', 2);
  // gros gabarits : il faut un Digimon bien nourri ; formes agiles : il doit rester léger
  fat('agumon', 'greymon', 'fatMin', 0); fat('agumon', 'meramon', 'fatMax', 1); fat('gotsumon', 'meramon', 'fatMax', 2);
  fat('betamon', 'shellmon', 'fatMin', 3); fat('gomamon', 'shellmon', 'fatMin', 3); fat('kunemon', 'kuwagamon', 'fatMax', 2); fat('mushroomon', 'togemon', 'fatMin', 1); fat('gomamon', 'ikkakumon', 'fatMin', 1); fat('ikkakumon', 'zudomon', 'fatMin', 3);

  const LABEL = { hp: 'Entr. PV', atk: 'Entr. Attaque', def: 'Entr. Défense', spd: 'Entr. Vitesse', int: 'Entr. Intell.', happy: 'Bonheur', wins: 'Victoires',
    disc: 'Discipline', mistakes: 'Erreurs de soin', mistakesMax: 'Erreurs de soin', fatMin: 'Corpulence', fatMax: 'Corpulence' };
  const MAXK = ['mistakesMax', 'fatMax'];

  DW.Evo = {
    options: sp => EVO[sp] || [],
    // formes précédentes (pour la dé-digivolution)
    prev: sp => Object.keys(EVO).filter(k => EVO[k].some(e => e.to === sp)),
    // détail des conditions pour un Digimon donné
    check(mon, opt) {
      const rows = [{ label: 'Niveau', need: opt.lvl, have: mon.level }];
      for (const k in opt.req || {}) {
        const have = k === 'happy' ? mon.happy : k === 'wins' ? mon.wins : k === 'disc' ? (mon.disc != null ? mon.disc : 40)
          : k === 'mistakes' || k === 'mistakesMax' ? (mon.mistakes || 0) : k === 'fatMin' || k === 'fatMax' ? Math.round(mon.fat || 0) : mon.tr[k];
        const max = MAXK.includes(k);
        rows.push({ label: LABEL[k], need: opt.req[k], have, cmp: max ? '≤ ' : k === 'mistakes' || k.startsWith('fat') ? '≥ ' : '', max });
      }
      rows.forEach(r => (r.ok = r.max ? r.have <= r.need : r.have >= r.need));
      return { ok: rows.every(r => r.ok), rows };
    },
    available(mon) { return this.options(mon.sp).filter(o => this.check(mon, o).ok); },
  };
  // compatibilité : évolution "principale" de chaque espèce
  for (const sp in EVO) if (DW.SPECIES[sp]) DW.SPECIES[sp].evo = { to: EVO[sp][0].to, lvl: EVO[sp][0].lvl };
})();
