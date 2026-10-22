'use strict';
// =====================================================================
//  LIGNÉES DES DIGISÉLECTIONNÉS (saison 1)
//  Ton premier Digimon est forcément le bébé de la lignée de ton héros :
//    Tai → Agumon, Matt → Gabumon, Sora → Biyomon, Mimi → Palmon,
//    Izzy → Tentomon, Joe → Gomamon, T.K. → Patamon.
//  À sa mort, tu choisis l'œuf suivant (même lignée ou une autre).
//  Ajoute aussi les lignées d'Izzy (Pabumon → Mochimon) et de T.K. (Poyomon → Tokomon), et (lignées données par le joueur) :
//    Sora : Nyokimon → Pyocomon → Biyomon → Birdramon → Garudamon ;
//    Izzy : … → Tentomon → Kabuterimon → MegaKabuterimon ;  Mimi : Poyomon → Tanemon → Palmon → Togemon → Lilimon ;
//    T.K. : … → Angemon → MagnaAngemon ;  Kari : YukimiBotamon → Nyaromon → Salamon → Gatomon → Angewomon → Ophanimon
//    ou Magnadramon ;  Tai et Matt : WarGreymon et MetalGarurumon fusionnent en Omegamon (data/evolutions.js : fusion).
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
  // (Décharge et Rayon Doux au N.1 : leur technique d'élément, apprise d'instinct en digivoluant — DW.learnEvoMoves ;
  //  avant, ni Mochimon ni Tokomon n'en avaient aucune)
  def('motimon', { name: 'Motimon', stage: 'Entraînement', types: ['Électrique'], attr: 'Données', base: { hp: 44, atk: 40, def: 44, spd: 44, int: 52 }, kg: 4,
    learn: [[1, 'charge'], [1, 'bulles'], [1, 'decharge'], [4, 'garde'], [6, 'bulle_explosive'], [8, 'vive_attaque'], [10, 'coup_tete']], rate: 190, xp: 45,
    desc: "Un Digimon tout mou comme une pâte de riz. Il comprend le langage des humains et adore apprendre." });
  def('tokomon', { name: 'Tokomon', stage: 'Entraînement', types: ['Lumière'], attr: 'Vaccin', base: { hp: 48, atk: 46, def: 42, spd: 48, int: 42 }, kg: 4,
    learn: [[1, 'charge'], [1, 'bulles'], [1, 'rayon'], [4, 'grondement'], [6, 'morsure'], [8, 'vive_attaque'], [10, 'bulle_explosive']], rate: 190, xp: 45,
    desc: "Une adorable boule blanche aux longues oreilles... qui cache une bouche immense pleine de dents !" });

  // la lignée de Kari (et les formes qui manquaient aux autres lignées)
  baby('yukimibotamon', { name: 'YukimiBotamon', types: ['Glace'], base: { hp: 40, atk: 34, def: 38, spd: 40, int: 42 },
    learn: [[1, 'charge'], [1, 'bulles'], [3, 'flocon'], [5, 'garde']],
    desc: "Un bébé tout blanc, comme un flocon de neige tombé du ciel. Il souffle des bulles glacées pour se défendre." });
  def('nyaromon', { name: 'Nyaromon', stage: 'Entraînement', types: ['Lumière'], attr: 'Vaccin', base: { hp: 46, atk: 44, def: 42, spd: 50, int: 48 }, kg: 4,
    learn: [[1, 'charge'], [1, 'bulles'], [4, 'grondement'], [6, 'rayon'], [8, 'vive_attaque'], [10, 'morsure']], rate: 190, xp: 45,
    desc: "Une petite tête de chat aux grandes oreilles. Elle remue la queue quand elle est contente et ne tient pas en place." });
  def('pyocomon', { name: 'Pyocomon', stage: 'Entraînement', types: ['Plante', 'Air'], attr: 'Données', base: { hp: 45, atk: 42, def: 40, spd: 50, int: 46 }, kg: 3,
    learn: [[1, 'charge'], [1, 'bulles'], [4, 'parfum'], [6, 'feuille'], [8, 'picorage'], [10, 'bulle_explosive']], rate: 190, xp: 45,
    desc: "Une petite boule rose qui porte une fleur sur la tête. Elle sautille partout en piaillant de joie." });
  def('salamon', { name: 'Salamon', stage: 'Disciple', types: ['Lumière'], attr: 'Vaccin', base: { hp: 54, atk: 50, def: 50, spd: 60, int: 62 }, kg: 6,
    learn: [[1, 'charge'], [1, 'cri_chiot'], [1, 'grondement'], [10, 'vive_attaque'], [13, 'morsure'], [16, 'rayon'], [19, 'charme'], [22, 'prisme']], rate: 120, xp: 70,
    desc: "Un petit chien au cœur pur qui porte au cou l'Anneau Sacré. Son Cri du Chiot fait fuir les Digimon des ténèbres." });
  def('gatomon', { name: 'Gatomon', stage: 'Champion', types: ['Lumière'], attr: 'Vaccin', base: { hp: 76, atk: 86, def: 70, spd: 98, int: 88 }, kg: 7,
    learn: [[0, 'griffe_eclair'], [1, 'vive_attaque'], [1, 'charme'], [1, 'morsure'], [22, 'rayon_sacre'], [26, 'poing_celeste'], [30, 'prisme']], rate: 45, xp: 150,
    desc: "Une petite chatte sacrée à la queue ornée de l'Anneau Sacré. Malgré sa taille, sa Griffe Éclair renverse les géants." });
  def('angewomon', { name: 'Angewomon', stage: 'Ultime', types: ['Lumière', 'Air'], attr: 'Vaccin', base: { hp: 96, atk: 100, def: 90, spd: 112, int: 120 }, kg: 45,
    learn: [[0, 'fleche_celeste'], [1, 'rayon_sacre'], [1, 'charme'], [1, 'aura_soin'], [38, 'jugement'], [42, 'canon_aerien']], rate: 20, xp: 230,
    desc: "Un ange aux huit ailes, au casque d'argent. Sa Flèche Céleste ne manque jamais un cœur corrompu." });
  def('ophanimon', { name: 'Ophanimon', stage: 'Méga', types: ['Lumière'], attr: 'Vaccin', base: { hp: 112, atk: 112, def: 120, spd: 118, int: 138 }, kg: 60,
    learn: [[0, 'lumiere_eden'], [1, 'jugement'], [1, 'fleche_celeste'], [1, 'aura_soin'], [50, 'prisme'], [55, 'rayon_sacre']], rate: 8, xp: 300,
    desc: "L'un des trois Grands Anges, gardienne de l'amour et de la connaissance. Elle protège les Digimon avec sa lance et son bouclier." });
  def('magnadramon', { name: 'Magnadramon', stage: 'Méga', types: ['Lumière', 'Feu'], attr: 'Vaccin', base: { hp: 120, atk: 126, def: 112, spd: 116, int: 120 }, kg: 300,
    learn: [[0, 'feu_sacre'], [1, 'jugement'], [1, 'ombre_ailee'], [1, 'cyclone'], [50, 'rayon_sacre'], [55, 'meteore']], rate: 8, xp: 300,
    desc: "Un dragon sacré aux ailes multiples, entouré de sceaux d'or. Son Feu Sacré purifie tout ce qu'il touche." });
  def('megakabuterimon', { name: 'MegaKabuterimon', stage: 'Ultime', types: ['Insecte', 'Électrique'], attr: 'Vaccin', base: { hp: 110, atk: 116, def: 116, spd: 70, int: 96 }, kg: 200,
    learn: [[0, 'corne_explosive'], [1, 'mega_decharge'], [1, 'pince'], [1, 'carapace'], [38, 'orage'], [42, 'seisme']], rate: 20, xp: 230,
    desc: "Un scarabée géant rouge à la corne immense. Sa Corne Explosive libère un orage entier d'un seul coup." });
  def('magnaangemon', { name: 'MagnaAngemon', stage: 'Ultime', types: ['Lumière', 'Air'], attr: 'Vaccin', base: { hp: 102, atk: 112, def: 100, spd: 104, int: 114 }, kg: 70,
    learn: [[0, 'porte_destin'], [1, 'poing_celeste'], [1, 'rayon_sacre'], [1, 'canon_aerien'], [38, 'jugement'], [42, 'fleche_solaire']], rate: 20, xp: 230,
    desc: "Un ange en armure aux huit ailes d'or, l'épée Excalibur au poignet. Sa Porte du Destin enferme les Digimon maléfiques." });
  def('omegamon', { name: 'Omegamon', stage: 'Méga', types: ['Lumière', 'Glace'], attr: 'Vaccin', base: { hp: 130, atk: 145, def: 130, spd: 125, int: 120 }, kg: 120,
    learn: [[0, 'epee_transcendante'], [1, 'souffle_cocyte'], [1, 'force_gaia'], [1, 'griffe_garuru'], [60, 'jugement'], [65, 'giga_destruction']], rate: 4, xp: 400,
    desc: "Né de la fusion de WarGreymon et de MetalGarurumon, le chevalier sacré à la cape rouge. Il réunit le courage et l'amitié." });
  // (les noms de la série, comme le joueur les écrit)
  S.motimon.name = 'Mochimon'; S.lillymon.name = 'Lilimon';

  // coups spéciaux (data/moves.js) : comme les autres bébés et Digimon d'Entraînement
  Object.assign(DW.SIG, { pabumon: 'bulles', poyomon: 'bulles_acides', motimon: 'bulles', tokomon: 'bulles' });
  // Digivolutions (fusionnées par evolutions.js)
  Object.assign(DW.EVO_EXTRA, {
    pabumon: [{ to: 'motimon', lvl: 5, req: { wins: 2 } }],
    poyomon: [{ to: 'tokomon', lvl: 5, req: { wins: 2 } }, { to: 'tanemon', lvl: 5, req: { wins: 2 } }],   // (T.K., puis Mimi)
    motimon: [{ to: 'tentomon', lvl: 7, req: { int: 10, wins: 3 } }, { to: 'kunemon', lvl: 7, req: { spd: 10, wins: 3 } }],
    tokomon: [{ to: 'patamon', lvl: 7, req: { spd: 10, wins: 3 } }, { to: 'elecmon', lvl: 7, req: { atk: 10, wins: 3 } }],
  });
  const O = DW.DEX_ORDER;
  O.splice(O.indexOf('tentomon') >= 0 ? O.indexOf('tentomon') : O.length, 0, 'pabumon', 'motimon');
  O.splice(O.indexOf('patamon') >= 0 ? O.indexOf('patamon') : O.length, 0, 'poyomon', 'tokomon');
  // (les nouvelles formes, chacune à sa place dans sa lignée ; la lignée de Kari à la fin)
  const apres = (ref, ...ids) => O.splice(O.indexOf(ref) >= 0 ? O.indexOf(ref) + 1 : O.length, 0, ...ids);
  apres('nyokimon', 'pyocomon'); apres('kabuterimon', 'megakabuterimon'); apres('angemon', 'magnaangemon'); apres('metalgarurumon', 'omegamon');
  O.push('yukimibotamon', 'nyaromon', 'salamon', 'gatomon', 'angewomon', 'ophanimon', 'magnadramon');

  // héros → bébé de départ et partenaire de la série
  DW.HERO_LINE = {
    tai: { baby: 'botamon', partner: 'agumon' },
    matt: { baby: 'punimon', partner: 'gabumon' },
    sora: { baby: 'nyokimon', partner: 'biyomon' },
    mimi: { baby: 'poyomon', partner: 'palmon' },
    izzy: { baby: 'pabumon', partner: 'tentomon' },
    joe: { baby: 'pichimon', partner: 'gomamon' },
    tk: { baby: 'poyomon', partner: 'patamon' },
    kari: { baby: 'yukimibotamon', partner: 'salamon' },
  };
  // (anciennes parties : Mimi commençait avec Yuramon)
  const ANCIENNES = { yuramon: { baby: 'yuramon', partner: 'palmon' } };
  // accord au féminin quand le héros est une fille : DW.gn('tombé', 'tombée')
  DW.gn = (m, f) => (DW.state && DW.state.hero === 'perso' && DW.state.look && DW.state.look.gender ? f : m);
  DW.heroLine = id => {
    const k = id || (DW.state && DW.state.hero);
    if (k === 'perso') {   // personnage original : le bébé choisi à la création, et le partenaire de cette lignée
      // (Mimi et T.K. ont le même bébé, Poyomon : c'est la lignée choisie à la création qui compte — look.ligne)
      const look = DW.state.look || {}, baby = look.baby || 'botamon';
      const L = (look.ligne && DW.HERO_LINE[look.ligne]) || Object.values(DW.HERO_LINE).find(l => l.baby === baby) || ANCIENNES[baby];
      return { baby, partner: L ? L.partner : 'agumon' };
    }
    return DW.HERO_LINE[k] || DW.HERO_LINE.tai;
  };
})();
