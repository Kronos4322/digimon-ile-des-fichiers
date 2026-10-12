'use strict';
// =====================================================================
//  DIGIMON DE L'ÎLE (Digimon World 1 / saison 1) — 21 espèces qui peuplent les régions
//  Disciples : Tentomon, Patamon, Penguinmon
//  Champions : Kabuterimon, Angemon, Monochromon, Frigimon, Leomon, Ogremon, Seadramon,
//              Gekomon, Drimogemon, Unimon, Centarumon, Bakemon, Devimon
//  Ultimes   : Andromon, Etemon, SkullGreymon, Megadramon, Piximon
//  Leurs techniques signature et leurs liens d'évolution (DW.EVO_EXTRA, fusionnés dans evolutions.js).
// =====================================================================
(function () {
  const S = DW.SPECIES, M = DW.MOVES;
  const def = (id, o) => (S[id] = Object.assign({ id }, o));
  // ------------------------------------------------------------ techniques signature
  const mv = (id, o, fx) => { M[id] = Object.assign({ acc: 95, pp: 10 }, o); M[id].fx = fx || (o.contact ? 'tackle' : 'orb'); };
  mv('super_choc', { name: 'Super Choc', type: 'Électrique', pow: 45, desc: 'Une petite décharge lancée par les antennes.' }, 'shock');
  mv('bulle_air', { name: "Bulle d'Air", type: 'Air', pow: 45, desc: "Gonfle ses joues et souffle une bulle d'air comprimé." }, 'tornado');
  mv('glissade', { name: 'Glissade Éclair', type: 'Glace', pow: 50, contact: true, desc: 'Glisse sur le ventre à toute allure.' }, 'dash');
  mv('mega_decharge', { name: 'Méga Décharge', type: 'Électrique', pow: 95, acc: 90, st: { s: 'par', ch: 0.2 }, desc: "Rassemble l'électricité de ses ailes en une boule foudroyante." }, 'thunder');
  mv('poing_celeste', { name: 'Poing Céleste', type: 'Lumière', pow: 95, contact: true, desc: 'Un coup de poing chargé de lumière sacrée.' }, 'punch');
  mv('frappe_volcan', { name: 'Frappe Volcanique', type: 'Feu', pow: 90, acc: 90, desc: 'Crache des boules de feu brûlantes comme la lave.' }, 'fireball');
  mv('poing_givre', { name: 'Poing Givré', type: 'Glace', pow: 90, contact: true, st: { s: 'par', ch: 0.15 }, desc: 'Un poing glacé qui peut figer l\'adversaire.' }, 'punch');
  mv('poing_bete', { name: 'Poing de la Bête', type: 'Feu', pow: 95, contact: true, desc: 'Un poing enflammé en forme de tête de lion.' }, 'firepunch');
  mv('poing_demon', { name: 'Poing du Démon', type: 'Ténèbres', pow: 90, contact: true, desc: 'Un poing chargé d\'énergie maléfique.' }, 'punch');
  mv('souffle_glacial', { name: 'Souffle Glacial', type: 'Glace', pow: 90, acc: 90, desc: 'Un jet d\'eau glacée qui gèle tout sur son passage.' }, 'icebreath');
  mv('symphonie', { name: 'Symphonie Fracassante', type: 'Eau', pow: 85, st: { s: 'slp', ch: 0.2 }, desc: 'Une musique assourdissante jouée sur ses cornes.' }, 'wave');
  mv('foreuse', { name: 'Foreuse Infernale', type: 'Terre', pow: 90, contact: true, desc: 'Perce l\'ennemi avec sa corne-foreuse.' }, 'horn');
  mv('canon_aerien', { name: 'Canon Aérien', type: 'Air', pow: 90, desc: "Une boule d'air compressé tirée à pleine vitesse." }, 'tornado');
  mv('fleche_solaire', { name: 'Flèche Solaire', type: 'Lumière', pow: 90, acc: 100, desc: 'Une flèche de lumière qui ne manque jamais sa cible.' }, 'orb');
  mv('griffe_fantome', { name: 'Griffe Fantôme', type: 'Ténèbres', pow: 80, contact: true, st: { s: 'par', ch: 0.2 }, desc: 'Une griffe glacée venue de l\'au-delà.' }, 'claw');
  mv('main_ombre', { name: 'Main des Ténèbres', type: 'Ténèbres', pow: 105, acc: 90, desc: 'Des griffes d\'ombre jaillissent pour transpercer l\'ennemi.' }, 'bite');
  mv('lame_spirale', { name: 'Lame Spirale', type: 'Neutre', pow: 120, acc: 90, pp: 6, desc: 'Une tornade de lames métalliques sort de ses bras.' }, 'tornado');
  mv('concert_noir', { name: 'Concert Ténébreux', type: 'Ténèbres', pow: 115, acc: 90, pp: 6, desc: 'Une chanson si terrible qu\'elle sape le moral de l\'ennemi.' }, 'shock');
  mv('missile_noir', { name: 'Missile Ténébreux', type: 'Ténèbres', pow: 125, acc: 85, pp: 5, desc: 'Un missile organique lancé depuis sa colonne vertébrale.' }, 'missiles');
  mv('salve_destructrice', { name: 'Salve Destructrice', type: 'Air', pow: 125, acc: 85, pp: 5, desc: 'Ses bras se transforment en missiles qui fondent sur la cible.' }, 'missiles');
  mv('bombe_pixie', { name: 'Bombe Pixie', type: 'Lumière', pow: 115, acc: 95, pp: 6, desc: 'Une bombe d\'énergie lancée avec une précision redoutable.' }, 'meteor');
  Object.assign(DW.SIG = DW.SIG || {}, {
    tentomon: 'super_choc', patamon: 'bulle_air', penguinmon: 'glissade', kabuterimon: 'mega_decharge', angemon: 'poing_celeste', monochromon: 'frappe_volcan',
    frigimon: 'poing_givre', leomon: 'poing_bete', ogremon: 'poing_demon', seadramon: 'souffle_glacial', gekomon: 'symphonie', drimogemon: 'foreuse',
    unimon: 'canon_aerien', centarumon: 'fleche_solaire', bakemon: 'griffe_fantome', devimon: 'main_ombre', andromon: 'lame_spirale', etemon: 'concert_noir',
    skullgreymon: 'missile_noir', megadramon: 'salve_destructrice', piximon: 'bombe_pixie',
  });

  // ------------------------------------------------------------ espèces
  const D = (h, a, d, s, i) => ({ hp: h, atk: a, def: d, spd: s, int: i });
  def('tentomon', { name: 'Tentomon', stage: 'Disciple', types: ['Insecte', 'Électrique'], attr: 'Vaccin', base: D(55, 52, 58, 48, 60), kg: 8, rate: 120, xp: 70,
    learn: [[1, 'charge'], [1, 'super_choc'], [1, 'garde'], [10, 'electro_fil'], [14, 'vive_attaque'], [18, 'petit_tonnerre']], desc: 'Un Digimon insecte très curieux et bavard. Il lance de petites décharges avec ses antennes.' });
  def('patamon', { name: 'Patamon', stage: 'Disciple', types: ['Air', 'Lumière'], attr: 'Données', base: D(52, 50, 48, 60, 62), kg: 6, rate: 120, xp: 70,
    learn: [[1, 'charge'], [1, 'bulle_air'], [1, 'grondement'], [10, 'vive_attaque'], [14, 'tornade'], [18, 'vol_plane']], desc: 'Un petit Digimon qui vole grâce à ses grandes oreilles. On dit qu\'il cache un pouvoir sacré.' });
  def('penguinmon', { name: 'Penguinmon', stage: 'Disciple', types: ['Glace', 'Eau'], attr: 'Données', base: D(56, 52, 54, 56, 52), kg: 9, rate: 120, xp: 70,
    learn: [[1, 'charge'], [1, 'glissade'], [1, 'bulles'], [10, 'souffle_glace'], [14, 'jet_hydro'], [18, 'fleche_glace']], desc: 'Un pingouin de la Terre Gelée qui adore glisser sur la glace. Champion de curling !' });
  const champ = (id, name, types, attr, base, kg, sig, extra, desc) => def(id, { name, stage: 'Champion', types, attr, base, kg, rate: 45, xp: 150,
    learn: [[0, sig], ...extra.map((m, i) => [i < 3 ? 1 : 22 + (i - 3) * 4, m])], desc });
  champ('kabuterimon', 'Kabuterimon', ['Insecte', 'Électrique'], 'Vaccin', D(84, 82, 86, 70, 84), 60, 'mega_decharge', ['electro_choc', 'charge', 'pince', 'vol_plane', 'petit_tonnerre'], "Un scarabée géant qui gouverne le ciel du Pays des Scarabées. Sa Méga Décharge foudroie tout.");
  champ('angemon', 'Angemon', ['Lumière', 'Air'], 'Vaccin', D(80, 84, 74, 86, 90), 50, 'poing_celeste', ['vol_plane', 'tornade', 'bulle_air', 'canon_aerien', 'fleche_solaire'], "Un ange aux six ailes qui combat le mal. Son Poing Céleste purifie les ténèbres.");
  champ('monochromon', 'Monochromon', ['Terre', 'Feu'], 'Données', D(90, 86, 94, 56, 66), 120, 'frappe_volcan', ['coup_corne', 'charge', 'garde', 'coup_tete', 'souffle_ardent'], "Un dinosaure à la carapace aussi dure que le diamant. Il charge tête baissée.");
  champ('frigimon', 'Frigimon', ['Glace'], 'Vaccin', D(88, 84, 82, 60, 76), 70, 'poing_givre', ['souffle_glace', 'charge', 'garde', 'tempete_neige', 'fleche_glace'], "Un bonhomme de neige au grand cœur qui vit dans la Terre Gelée. Son corps est fait de neige éternelle.");
  champ('leomon', 'Leomon', ['Terre', 'Feu'], 'Vaccin', D(86, 94, 76, 82, 74), 70, 'poing_bete', ['griffe', 'uppercut', 'grondement', 'poing_ardent', 'coup_queue'], "Un lion guerrier au sens de la justice inébranlable. Il protège les Digimon faibles.");
  champ('ogremon', 'Ogremon', ['Ténèbres', 'Terre'], 'Virus', D(84, 92, 78, 72, 62), 75, 'poing_demon', ['charge', 'grondement', 'morsure', 'coup_tete', 'main_enfers'], "Un ogre qui manie un os en guise de massue. Il défie sans cesse Leomon.");
  champ('seadramon', 'Seadramon', ['Eau', 'Glace'], 'Données', D(88, 84, 74, 76, 86), 90, 'souffle_glacial', ['jet_hydro', 'grande_vague', 'morsure', 'coup_queue', 'tempete_neige'], "Un serpent de mer géant qui vit au fond du lac. Il ne se montre qu'à certaines heures.");
  champ('gekomon', 'Gekomon', ['Eau'], 'Virus', D(82, 74, 80, 70, 88), 40, 'symphonie', ['bulles', 'jet_hydro', 'parfum', 'grande_vague', 'charme'], "Un musicien du Marais des Geko. Il joue de ses cornes pour son souverain.");
  champ('drimogemon', 'Drimogemon', ['Terre'], 'Données', D(86, 88, 88, 62, 64), 80, 'foreuse', ['charge', 'jet_pierres', 'vrille', 'poing_roc', 'coup_tete'], "Une taupe qui creuse des tunnels avec sa corne-foreuse. Elle adore les trésors.");
  champ('unimon', 'Unimon', ['Air', 'Lumière'], 'Vaccin', D(80, 82, 74, 92, 84), 90, 'canon_aerien', ['coup_corne', 'vol_plane', 'tornade', 'charge', 'fleche_solaire'], "Un pégase sauvage qui ne se laisse monter par personne. Il galope dans le ciel du Bois Brumeux.");
  champ('centarumon', 'Centarumon', ['Terre', 'Lumière'], 'Données', D(86, 80, 84, 78, 90), 100, 'fleche_solaire', ['charge', 'garde', 'coup_corne', 'jet_pierres', 'poing_roc'], "Un centaure sage et calme qui garde d'anciennes ruines. Il connaît les secrets des soins.");
  champ('bakemon', 'Bakemon', ['Ténèbres'], 'Virus', D(76, 78, 70, 82, 86), 5, 'griffe_fantome', ['main_enfers', 'charme', 'morsure', 'parfum', 'grondement'], "Un fantôme qui hante le Cimetière d'Overdell. Il n'apparaît que la nuit.");
  champ('devimon', 'Devimon', ['Ténèbres', 'Air'], 'Virus', D(90, 96, 80, 86, 96), 70, 'main_ombre', ['main_enfers', 'grondement', 'vol_plane', 'morsure', 'concert_noir'], "L'ange déchu qui a répandu les engrenages noirs sur l'Île des Fichiers pour rendre les Digimon fous.");
  const ult = (id, name, types, attr, base, kg, sig, extra, desc) => def(id, { name, stage: 'Ultime', types, attr, base, kg, rate: 20, xp: 230,
    learn: [[0, sig], ...extra.map((m, i) => [i < 3 ? 1 : 38 + (i - 3) * 4, m])], desc });
  ult('andromon', 'Andromon', ['Électrique', 'Terre'], 'Vaccin', D(104, 112, 112, 84, 96), 160, 'lame_spirale', ['poing_roc', 'electro_choc', 'garde', 'mega_decharge', 'vrille'], "Un androïde parfait. Possédé par un engrenage noir, il gardait l'usine dans la saison 1.");
  ult('etemon', 'Etemon', ['Ténèbres', 'Terre'], 'Virus', D(100, 112, 96, 90, 106), 60, 'concert_noir', ['poing_demon', 'grondement', 'charme', 'main_enfers', 'uppercut'], "Le « roi » autoproclamé des Digimon. Son concert est une torture pour les oreilles.");
  ult('skullgreymon', 'SkullGreymon', ['Ténèbres', 'Feu'], 'Virus', D(98, 124, 92, 82, 88), 150, 'missile_noir', ['morsure', 'coup_corne', 'griffe', 'mega_flamme', 'main_enfers'], "Un Greymon dont la Digivolution a mal tourné. Un squelette fou qui ne vit que pour se battre.");
  ult('megadramon', 'Megadramon', ['Air', 'Ténèbres'], 'Virus', D(100, 120, 96, 98, 96), 140, 'salve_destructrice', ['vol_plane', 'morsure', 'coup_queue', 'souffle_ardent', 'main_ombre'], "Un dragon cybernétique ailé. Ses bras-missiles peuvent raser une montagne.");
  ult('piximon', 'Piximon', ['Lumière', 'Air'], 'Données', D(92, 96, 90, 120, 112), 5, 'bombe_pixie', ['vive_attaque', 'charme', 'canon_aerien', 'fleche_solaire', 'couronne_fleurs'], "Un minuscule Digimon ailé, maître d'entraînement réputé. Sa lance ne rate jamais sa cible.");
  DW.DEX_ORDER.push('tentomon', 'kabuterimon', 'patamon', 'angemon', 'unimon', 'devimon', 'penguinmon', 'frigimon', 'monochromon', 'drimogemon', 'leomon', 'centarumon', 'ogremon',
    'seadramon', 'gekomon', 'bakemon', 'andromon', 'etemon', 'skullgreymon', 'megadramon', 'piximon');

  // ------------------------------------------------------------ liens d'évolution (fusionnés dans evolutions.js)
  const r = (to, lvl, req) => ({ to, lvl, req });
  DW.EVO_EXTRA = {
    tsunomon: [r('patamon', 7, { spd: 8, int: 8, wins: 3 })], bukamon: [r('penguinmon', 7, { spd: 10, wins: 3 })], yokomon: [r('tentomon', 8, { def: 12, wins: 3 })],
    tentomon: [r('kabuterimon', 18, { def: 26, int: 14, wins: 10 })], kunemon: [r('kabuterimon', 18, { def: 26, wins: 10 })],
    patamon: [r('angemon', 18, { int: 28, wins: 10 }), r('unimon', 18, { spd: 28, wins: 10 }), r('devimon', 18, { atk: 26, mistakes: 3 })],
    gotsumon: [r('monochromon', 18, { def: 28, wins: 10 }), r('drimogemon', 18, { atk: 22, def: 20, wins: 10 })],
    penguinmon: [r('frigimon', 18, { hp: 26, wins: 10 })], gabumon: [r('frigimon', 18, { hp: 28, def: 14, wins: 10 }), r('ogremon', 18, { atk: 24, mistakes: 3 })],
    elecmon: [r('leomon', 18, { atk: 28, wins: 12 }), r('centarumon', 18, { int: 26, def: 14, wins: 10 })], agumon: [r('monochromon', 18, { def: 28, hp: 14, wins: 10 })],
    betamon: [r('seadramon', 18, { int: 28, wins: 10 }), r('gekomon', 18, { int: 22, hp: 18, wins: 10 })], gomamon: [r('seadramon', 18, { int: 26, spd: 14, wins: 10 })],
    biyomon: [r('unimon', 18, { spd: 26, int: 14, wins: 10 })], mushroomon: [r('bakemon', 18, { int: 26, wins: 10 })], kunemon2: [],
    kabuterimon: [r('andromon', 32, { def: 50, int: 30, happy: 60, wins: 40 })], centarumon: [r('andromon', 32, { int: 50, def: 30, happy: 60, wins: 40 })],
    drimogemon: [r('andromon', 32, { atk: 48, def: 40, wins: 40 })], monochromon: [r('megadramon', 32, { atk: 50, def: 30, wins: 40 })],
    seadramon: [r('megadramon', 32, { int: 50, spd: 30, wins: 40 })], devimon: [r('megadramon', 32, { atk: 50, int: 30, wins: 40 })],
    angemon: [r('piximon', 32, { int: 50, spd: 30, happy: 70, wins: 40 })], unimon: [r('piximon', 32, { spd: 50, int: 30, happy: 70, wins: 40 })],
    leomon: [r('etemon', 32, { atk: 50, hp: 30, wins: 40 })], ogremon: [r('etemon', 32, { atk: 50, wins: 40 })],
    frigimon: [r('zudomon', 32, { hp: 50, def: 30, happy: 60, wins: 40 })], gekomon: [r('zudomon', 32, { int: 46, def: 30, wins: 40 })],
    bakemon: [r('skullmeramon', 32, { int: 50, wins: 40 })], greymon: [r('skullgreymon', 32, { atk: 50, mistakes: 3 })],
  };
  delete DW.EVO_EXTRA.kunemon2;
})();
