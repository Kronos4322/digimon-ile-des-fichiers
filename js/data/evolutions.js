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
    nyokimon: [{ to: 'pyocomon', lvl: 5, req: { wins: 2 } }, { to: 'yokomon', lvl: 5, req: { wins: 2 } }],
    pyocomon: [{ to: 'biyomon', lvl: 7, req: { spd: 10, wins: 3 } }],
    yukimibotamon: [{ to: 'nyaromon', lvl: 5, req: { wins: 2 } }],
    nyaromon: [{ to: 'salamon', lvl: 7, req: { int: 10, wins: 3 } }],
    koromon: [{ to: "agumon", lvl: 7, req: { atk: 10, wins: 3 } }, { to: "gabumon", lvl: 7, req: { def: 10, wins: 3 } }],
    tsunomon: [{ to: "gabumon", lvl: 7, req: { def: 10, wins: 3 } }, { to: "elecmon", lvl: 7, req: { spd: 10, wins: 3 } }, { to: 'gotsumon', lvl: 7, req: { hp: 10, wins: 3 } }],
    bukamon: [{ to: "gomamon", lvl: 7, req: { def: 10, wins: 3 } }, { to: "betamon", lvl: 7, req: { int: 10, wins: 3 } }],
    tanemon: [{ to: "palmon", lvl: 7, req: { int: 10, wins: 3 } }, { to: "mushroomon", lvl: 7, req: { atk: 10, wins: 3 } }],
    yokomon: [{ to: "biyomon", lvl: 8, req: { spd: 12, wins: 3 } }, { to: 'kunemon', lvl: 8, req: { int: 12, wins: 3 } }],
    agumon: [{ to: "greymon", lvl: 15, req: { atk: 28, wins: 10 } }, { to: "meramon", lvl: 15, req: { int: 28, wins: 10 } }],
    gabumon: [{ to: "garurumon", lvl: 15, req: { spd: 26, def: 12, wins: 10 } }],
    gomamon: [{ to: "ikkakumon", lvl: 15, req: { def: 28, wins: 10 } }, { to: "shellmon", lvl: 15, req: { def: 24, hp: 24, wins: 10 } }],   // (10 victoires, comme Betamon → Shellmon)
    palmon: [{ to: "togemon", lvl: 15, req: { int: 28, wins: 10 } }],
    biyomon: [{ to: "birdramon", lvl: 15, req: { spd: 28, wins: 10 } }, { to: "meramon", lvl: 15, req: { atk: 28, wins: 10 } }],
    betamon: [{ to: 'shellmon', lvl: 15, req: { hp: 24, wins: 10 } }],
    elecmon: [{ to: 'garurumon', lvl: 15, req: { spd: 28, wins: 10 } }],
    gotsumon: [{ to: 'meramon', lvl: 15, req: { atk: 28, hp: 12, wins: 10 } }],
    mushroomon: [{ to: 'togemon', lvl: 15, req: { def: 26, wins: 10 } }],
    kunemon: [{ to: "kuwagamon", lvl: 16, req: { atk: 30, wins: 10 } }],
    salamon: [{ to: 'gatomon', lvl: 15, req: { spd: 26, int: 12, wins: 10 } }],
    gatomon: [{ to: 'angewomon', lvl: 32, req: { int: 50, spd: 30, happy: 70, wins: 40 } }],
    angewomon: [{ to: 'ophanimon', lvl: 45, req: { int: 64, def: 50, happy: 90, wins: 80 } }, { to: 'magnadramon', lvl: 45, req: { atk: 64, int: 50, happy: 90, wins: 80 } }],
    kabuterimon: [{ to: 'megakabuterimon', lvl: 32, req: { def: 50, int: 30, happy: 70, wins: 40 } }],
    angemon: [{ to: 'magnaangemon', lvl: 32, req: { int: 50, spd: 30, happy: 70, wins: 40 } }],
    // FUSION (WarGreymon + MetalGarurumon) : il faut l'autre dans l'équipe ; il fusionne avec lui (ui/evotable.js)
    wargreymon: [{ to: 'omegamon', lvl: 55, req: { fusion: 'metalgarurumon', happy: 90, wins: 100 } }],
    metalgarurumon: [{ to: 'omegamon', lvl: 55, req: { fusion: 'wargreymon', happy: 90, wins: 100 } }],
    greymon: [{ to: "metalgreymon", lvl: 32, req: { atk: 50, def: 30, happy: 70, wins: 40 } }],
    metalgreymon: [{ to: 'wargreymon', lvl: 45, req: { atk: 64, def: 50, happy: 90, wins: 80 } }],
    ikkakumon: [{ to: "zudomon", lvl: 32, req: { def: 50, hp: 30, happy: 70, wins: 40 } }],
    garurumon: [{ to: 'weregarurumon', lvl: 32, req: { spd: 50, atk: 30, happy: 70, wins: 40 } }],
    weregarurumon: [{ to: 'metalgarurumon', lvl: 45, req: { spd: 64, atk: 50, happy: 90, wins: 80 } }],
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
  // formes « de négligence » (atteintes avec au moins N erreurs de soin : Ogremon, Devimon, SkullGreymon) : les erreurs ne
  // baissent jamais, leurs Digivolutions ne les plafonnent donc pas (Ogremon → Etemon et Devimon → Megadramon étaient impossibles)
  const NEGLIGE = new Set();
  for (const sp in EVO) for (const o of EVO[sp]) if (o.req && o.req.mistakes != null) NEGLIGE.add(o.to);
  for (const sp in EVO) for (const o of EVO[sp]) {
    const st = DW.SPECIES[o.to] && DW.SPECIES[o.to].stage, r = o.req = o.req || {}, plafond = !NEGLIGE.has(sp);
    if (BAD.includes(o.to) || r.mistakes != null) continue; // évolutions « de négligence » : pas de plafond d'erreurs
    if (st === 'Champion' && r.mistakesMax == null && plafond) r.mistakesMax = 4;
    if (st === 'Ultime') { if (r.mistakesMax == null && plafond) r.mistakesMax = 2; if (r.disc == null) r.disc = 50; }
    if (st === 'Méga') { if (r.mistakesMax == null) r.mistakesMax = 1; if (r.disc == null) r.disc = 80; }
  }
  // tout Disciple trop négligé peut devenir Numemon (≥ 5 erreurs) ou Sukamon (≥ 8 erreurs)
  for (const sp of ['agumon', 'gabumon', 'gomamon', 'palmon', 'biyomon', 'kunemon', 'mushroomon', 'betamon', 'gotsumon', 'elecmon', 'tentomon', 'patamon', 'penguinmon', 'guilmon', 'candlemon', 'salamon']) {
    EVO[sp] = EVO[sp] || [];
    EVO[sp].push({ to: 'numemon', lvl: 14, req: { mistakes: 5 } }, { to: 'sukamon', lvl: 14, req: { mistakes: 8 } });
  }
  // un peu de corpulence dans les conditions
  // (formes agiles : seuils relevés d'un cran — avant 2, 3, 3, 1, 2, 2 — avec la perte de poids des séances, game/training.js :
  //  un Digimon nourri à la demande et entraîné 4 fois par jour les remplit ; avant, il fallait l'affamer)
  const fat = (from, to, k, v) => { const o = (EVO[from] || []).find(e => e.to === to); if (o) o.req[k] = v; };
  fat('palmon', 'togemon', 'fatMin', 2); fat('gabumon', 'garurumon', 'fatMax', 4); fat('elecmon', 'garurumon', 'fatMax', 4);
  fat('biyomon', 'birdramon', 'fatMax', 3);
  // gros gabarits : il faut un Digimon bien nourri ; formes agiles : il doit rester léger
  fat('agumon', 'greymon', 'fatMin', 0); fat('agumon', 'meramon', 'fatMax', 2); fat('gotsumon', 'meramon', 'fatMax', 3);
  fat('betamon', 'shellmon', 'fatMin', 3); fat('gomamon', 'shellmon', 'fatMin', 3); fat('kunemon', 'kuwagamon', 'fatMax', 3); fat('mushroomon', 'togemon', 'fatMin', 1); fat('gomamon', 'ikkakumon', 'fatMin', 1); fat('ikkakumon', 'zudomon', 'fatMin', 3);

  const LABEL = { hp: 'Entr. PV', atk: 'Entr. Attaque', def: 'Entr. Défense', spd: 'Entr. Vitesse', int: 'Entr. Intell.', happy: 'Bonheur', wins: 'Victoires',
    disc: 'Discipline', mistakes: 'Erreurs de soin', mistakesMax: 'Erreurs de soin', fatMin: 'Corpulence', fatMax: 'Corpulence', fusion: 'Fusion' };
  const MAXK = ['mistakesMax', 'fatMax'];

  const RANG = ['Bébé', 'Entraînement', 'Disciple', 'Champion', 'Ultime', 'Méga'], rang = sp => RANG.indexOf(DW.SPECIES[sp].stage);
  DW.Evo = {
    options: sp => EVO[sp] || [],
    // formes précédentes (pour la dé-digivolution)
    prev: sp => Object.keys(EVO).filter(k => EVO[k].some(e => e.to === sp)),
    // LA forme précédente : celle qu'il a vraiment été (passe : m.parcours, la dernière forme d'un stade inférieur — même hors
    // de la table : le Gabumon de Matt devenu Birdramon par l'Aile de flammes redevient Gabumon, et renaît en Punimon),
    // sinon celle dont il est l'évolution principale (Gabumon ← Tsunomon et non Koromon, Tentomon ← Motimon, Patamon ← Tokomon :
    // les lignées de l'animé)
    prev1(sp, passe) {
      const v = passe && passe[passe.length - 1];
      if (v && DW.SPECIES[v] && DW.SPECIES[sp] && rang(v) < rang(sp)) return v;
      const p = this.prev(sp);
      return p.find(k => EVO[k][0].to === sp) || p[0] || null;
    },
    // forme née d'une fusion (Omegamon : WarGreymon + MetalGarurumon) : elle ne dé-digivolue pas (ui/evotable.js)
    estFusion: sp => Object.keys(EVO).some(k => EVO[k].some(e => e.to === sp && e.req && e.req.fusion)),
    // bébé à l'origine de sa lignée (renaissance) : Greymon → Agumon → Koromon → Botamon
    bebe(sp, passe = []) {
      const P = passe.slice();
      for (let k = 0; k < 8; k++) { const p = this.prev1(sp, P); if (!p) break; if (P[P.length - 1] === p) P.pop(); sp = p; }
      return sp;
    },
    // détail des conditions pour un Digimon donné
    check(mon, opt) {
      const rows = [{ label: 'Niveau', need: opt.lvl, have: mon.level }];
      for (const k in opt.req || {}) {
        // fusion : l'autre Digimon doit être dans l'équipe, en état de se battre (1 = oui)
        if (k === 'fusion') { const F = DW.Evo.partenaireFusion(mon, opt); rows.push({ label: `Avec ${DW.SPECIES[opt.req.fusion].name}`, need: 1, have: F ? 1 : 0 }); continue; }
        const have = k === 'happy' ? mon.happy : k === 'wins' ? mon.wins : k === 'disc' ? (mon.disc != null ? mon.disc : 40)
          : k === 'mistakes' || k === 'mistakesMax' ? (mon.mistakes || 0) : k === 'fatMin' || k === 'fatMax' ? Math.round(mon.fat || 0) : mon.tr[k];
        const max = MAXK.includes(k);
        rows.push({ label: LABEL[k], need: opt.req[k], have, cmp: max ? '≤ ' : k === 'mistakes' || k.startsWith('fat') ? '≥ ' : '', max });
      }
      rows.forEach(r => (r.ok = r.max ? r.have <= r.need : r.have >= r.need));
      return { ok: rows.every(r => r.ok), rows };
    },
    available(mon) { return this.options(mon.sp).filter(o => this.check(mon, o).ok); },
    // le Digimon de l'équipe avec qui fusionner (autre que lui), ou null
    partenaireFusion(mon, opt) { const sp = opt.req && opt.req.fusion; return sp ? ((DW.state && DW.state.party) || []).find(p => p !== mon && p.sp === sp && p.hp > 0) || null : null; },
  };
  // compatibilité : évolution "principale" de chaque espèce
  for (const sp in EVO) if (DW.SPECIES[sp]) DW.SPECIES[sp].evo = { to: EVO[sp][0].to, lvl: EVO[sp][0].lvl };
})();
