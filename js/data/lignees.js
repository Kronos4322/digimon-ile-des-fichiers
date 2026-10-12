'use strict';
// =====================================================================
//  LIGNÉES DES DIGISÉLECTIONNÉS (saison 1)
//  Ton premier Digimon est forcément le bébé de la lignée de ton héros :
//    Tai → Agumon, Matt → Gabumon, Sora → Biyomon, Mimi → Palmon,
//    Izzy → Tentomon, Joe → Gomamon, T.K. → Patamon.
//  À sa mort, tu choisis l'œuf suivant (même lignée ou une autre).
//  Ajoute aussi les lignées d'Izzy (Pabumon → Motimon) et de T.K. (Poyomon → Tokomon).
// =====================================================================
(function () {
  const S = DW.SPECIES;
  const def = (id, o) => (S[id] = Object.assign({ id }, o));
  const baby = (id, o) => def(id, Object.assign({ stage: 'Bébé', attr: 'Données', kg: 1, rate: 235, xp: 28 }, o));

  baby('pabumon', { name: 'Pabumon', types: ['Neutre'], base: { hp: 40, atk: 34, def: 36, spd: 40, int: 42 },
    learn: [[1, 'charge'], [1, 'bulles'], [3, 'garde'], [5, 'bulles_acides']],
    desc: "Un petit slime vert pâle qui suce sa tétine. Les bulles collantes qu'il souffle retiennent ceux qui l'embêtent." });
  baby('poyomon', { name: 'Poyomon', types: ['Neutre'], base: { hp: 42, atk: 34, def: 36, spd: 42, int: 38 },
    learn: [[1, 'charge'], [1, 'bulles'], [3, 'grondement'], [5, 'bulles_acides']],
    desc: "Un bébé translucide qui flotte comme une méduse. Il crache des bulles acides pour se défendre." });
  def('motimon', { name: 'Motimon', stage: 'Entraînement', types: ['Électrique'], attr: 'Données', base: { hp: 44, atk: 40, def: 44, spd: 44, int: 52 }, kg: 4,
    learn: [[1, 'charge'], [1, 'bulles'], [4, 'garde'], [6, 'bulle_explosive'], [8, 'vive_attaque'], [10, 'coup_tete']], rate: 190, xp: 45,
    desc: "Un Digimon tout mou comme une pâte de riz. Il comprend le langage des humains et adore apprendre." });
  def('tokomon', { name: 'Tokomon', stage: 'Entraînement', types: ['Lumière'], attr: 'Vaccin', base: { hp: 48, atk: 46, def: 42, spd: 48, int: 42 }, kg: 4,
    learn: [[1, 'charge'], [1, 'bulles'], [4, 'grondement'], [6, 'morsure'], [8, 'vive_attaque'], [10, 'bulle_explosive']], rate: 190, xp: 45,
    desc: "Une adorable boule blanche aux longues oreilles... qui cache une bouche immense pleine de dents !" });

  // Digivolutions (fusionnées par evolutions.js)
  Object.assign(DW.EVO_EXTRA, {
    pabumon: [{ to: 'motimon', lvl: 5, req: { wins: 2 } }],
    poyomon: [{ to: 'tokomon', lvl: 5, req: { wins: 2 } }],
    motimon: [{ to: 'tentomon', lvl: 7, req: { int: 10, wins: 3 } }, { to: 'kunemon', lvl: 7, req: { spd: 10, wins: 3 } }],
    tokomon: [{ to: 'patamon', lvl: 7, req: { spd: 10, wins: 3 } }, { to: 'elecmon', lvl: 7, req: { atk: 10, wins: 3 } }],
  });
  const O = DW.DEX_ORDER;
  O.splice(O.indexOf('tentomon') >= 0 ? O.indexOf('tentomon') : O.length, 0, 'pabumon', 'motimon');
  O.splice(O.indexOf('patamon') >= 0 ? O.indexOf('patamon') : O.length, 0, 'poyomon', 'tokomon');

  // héros → bébé de départ et partenaire de la série
  DW.HERO_LINE = {
    tai: { baby: 'botamon', partner: 'agumon' },
    matt: { baby: 'punimon', partner: 'gabumon' },
    sora: { baby: 'nyokimon', partner: 'biyomon' },
    mimi: { baby: 'yuramon', partner: 'palmon' },
    izzy: { baby: 'pabumon', partner: 'tentomon' },
    joe: { baby: 'pichimon', partner: 'gomamon' },
    tk: { baby: 'poyomon', partner: 'patamon' },
  };
  DW.heroLine = id => DW.HERO_LINE[id || (DW.state && DW.state.hero)] || DW.HERO_LINE.tai;
})();
