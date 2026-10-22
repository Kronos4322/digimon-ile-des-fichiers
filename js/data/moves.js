'use strict';
// =====================================================================
//  ATTAQUES
// =====================================================================
(function () {
  // ------------------------------------------------------------ attaques
  // pow: puissance, acc: précision (null = toujours), pp, pri: priorité, contact: animation au corps à corps
  // st: {s: statut, ch: chance}  sc: {who: 'self'|'foe', s: stat, n: crans, ch}
  const M = DW.MOVES = {
    lutte:          { name: 'Lutte', type: 'Neutre', pow: 40, acc: null, contact: true, desc: "Toujours possible, sans PM (dernier choix du menu Combat) : le Digimon se blesse d'un quart de ses PV max." },
    // (les signatures des lignées de Kari, de Sora, d'Izzy et de T.K., et d'Omegamon)
    cri_chiot:      { name: 'Cri du Chiot', type: 'Lumière', pow: 45, acc: 100, sc: { who: 'foe', s: 'atk', n: -1, ch: 0.3 }, desc: "Salamon pousse un cri aigu plein de lumière. Peut baisser l'Attaque de l'ennemi." },
    griffe_eclair:  { name: 'Griffe Éclair', type: 'Lumière', pow: 85, acc: 95, contact: true, desc: 'Gatomon frappe à la vitesse de la lumière avec les griffes de ses gants.' },
    fleche_celeste: { name: 'Flèche Céleste', type: 'Lumière', pow: 110, acc: 90, desc: "Angewomon tire de son arc une flèche de lumière sacrée qui transperce les ténèbres." },
    porte_destin:   { name: 'Porte du Destin', type: 'Lumière', pow: 120, acc: 85, desc: "MagnaAngemon trace un cercle dans le ciel avec son épée : la porte qui s'ouvre aspire ses ennemis." },
    corne_explosive: { name: 'Corne Explosive', type: 'Électrique', pow: 115, acc: 90, st: { s: 'par', ch: 0.2 }, desc: "MegaKabuterimon concentre l'électricité dans sa grande corne et la libère d'un coup." },
    lumiere_eden:   { name: "Lumière de l'Éden", type: 'Lumière', pow: 130, acc: 90, desc: "Ophanimon fait jaillir dix cristaux de lumière qui frappent de toutes parts." },
    feu_sacre:      { name: 'Feu Sacré', type: 'Feu', pow: 130, acc: 90, st: { s: 'brn', ch: 0.2 }, desc: 'Magnadramon crache un feu sacré qui purifie tout ce qu\'il touche.' },
    epee_transcendante: { name: 'Épée Transcendante', type: 'Lumière', pow: 140, acc: 90, contact: true, desc: "Omegamon tranche avec la lame jaillie de la tête de WarGreymon, à son bras gauche." },
    charge:         { name: 'Coup de Corps', type: 'Neutre', pow: 40, acc: 100, contact: true, desc: 'Fonce sur l\'ennemi de tout son corps.' },
    vive_attaque:   { name: 'Assaut Éclair', type: 'Neutre', pow: 40, acc: 100, pri: 1, contact: true, desc: 'Attaque très rapide qui frappe toujours en premier.' },
    griffe:         { name: 'Griffe', type: 'Neutre', pow: 50, acc: 95, contact: true, desc: 'Lacère l\'ennemi avec ses griffes.' },
    coup_tete:      { name: 'Coup de Tête', type: 'Neutre', pow: 60, acc: 95, contact: true, desc: 'Un puissant coup de boule.' },
    coup_corne:     { name: 'Coup de Corne', type: 'Neutre', pow: 75, acc: 95, contact: true, desc: 'Frappe avec les cornes de son casque.' },
    poing_piquant:  { name: 'Poing Piquant', type: 'Neutre', pow: 70, acc: 95, contact: true, desc: 'Un crochet du droit hérissé d\'épines.' },
    grondement:     { name: 'Intimidation', type: 'Neutre', pow: 0, acc: 100, sc: { who: 'foe', s: 'atk', n: -1 }, desc: 'Baisse l\'Attaque de l\'ennemi.' },
    garde:          { name: 'Garde', type: 'Neutre', pow: 0, acc: null, sc: { who: 'self', s: 'def', n: 1 }, desc: 'Augmente la Défense.' },
    morsure:        { name: 'Morsure', type: 'Ténèbres', pow: 55, acc: 100, contact: true, desc: 'Mord l\'ennemi avec des crocs acérés.' },
    bulles:         { name: 'Bulles', type: 'Eau', pow: 30, acc: 100, sc: { who: 'foe', s: 'spd', n: -1, ch: 0.1 }, desc: 'Souffle des bulles. Peut baisser la Vitesse.' },
    boule_feu:      { name: 'Boule de Feu', type: 'Feu', pow: 45, acc: 100, st: { s: 'brn', ch: 0.1 }, desc: 'Crache une boule de feu. Peut brûler.' },
    mega_flamme:    { name: 'Méga Flamme', type: 'Feu', pow: 90, acc: 90, st: { s: 'brn', ch: 0.2 }, desc: 'Un torrent de flammes dévastateur.' },
    flamme_spirale: { name: 'Spirale Magique', type: 'Feu', pow: 50, acc: 95, st: { s: 'brn', ch: 0.1 }, desc: 'Biyomon crache une spirale de flammes vertes tournoyantes.' },
    flamme_bebe:    { name: 'Flamme Bébé', type: 'Feu', pow: 50, acc: 100, st: { s: 'brn', ch: 0.1 }, desc: "L'attaque fétiche d'Agumon : une boule de feu brûlante crachée à bout portant." },
    banc_poissons:  { name: 'Marche des Poissons', type: 'Eau', pow: 45, acc: 100, desc: 'Appelle un banc de poissons à la rescousse.' },
    torpille_harpon:{ name: 'Torpille Harpon', type: 'Eau', pow: 90, acc: 90, desc: 'Tire sa corne comme une torpille.' },
    jet_hydro:      { name: 'Jet Hydro', type: 'Eau', pow: 65, acc: 95, desc: 'Un jet d\'eau sous haute pression.' },
    coquille:       { name: 'Coquille', type: 'Eau', pow: 0, acc: null, sc: { who: 'self', s: 'def', n: 2 }, desc: 'Se cache dans sa coquille. Augmente beaucoup la Défense.' },
    souffle_glace:  { name: 'Souffle Glacé', type: 'Glace', pow: 60, acc: 95, sc: { who: 'foe', s: 'spd', n: -1, ch: 0.3 }, desc: 'Un souffle polaire. Peut baisser la Vitesse.' },
    lierre:         { name: 'Lierre Empoisonné', type: 'Plante', pow: 40, acc: 100, st: { s: 'psn', ch: 0.2 }, desc: 'Fouette avec des lianes. Peut empoisonner.' },
    parfum:         { name: 'Parfum Soporifique', type: 'Plante', pow: 0, acc: 75, st: { s: 'slp', ch: 1 }, desc: 'Un doux parfum qui endort l\'ennemi.' },
    fouet_liane:    { name: 'Fouet Liane', type: 'Plante', pow: 55, acc: 100, contact: true, desc: 'Frappe violemment avec une liane.' },
    pluie_epines:   { name: 'Pluie d\'Épines', type: 'Plante', pow: 90, acc: 90, desc: 'Projette des centaines d\'épines.' },
    coup_bec:       { name: 'Coup de Bec', type: 'Air', pow: 35, acc: 100, contact: true, desc: 'Pique avec son bec.' },
    tornade:        { name: 'Tornade', type: 'Air', pow: 60, acc: 95, desc: 'Déchaîne une tornade.' },
    vol_plane:      { name: 'Vol Plané', type: 'Air', pow: 60, acc: 95, contact: true, desc: 'Fond sur l\'ennemi depuis les airs.' },
    toile:          { name: 'Toile Gluante', type: 'Insecte', pow: 0, acc: 95, sc: { who: 'foe', s: 'spd', n: -2 }, desc: 'Baisse beaucoup la Vitesse de l\'ennemi.' },
    pince:          { name: 'Pince Tranchante', type: 'Insecte', pow: 70, acc: 95, contact: true, desc: 'Broie l\'ennemi entre ses pinces.' },
    electro_fil:    { name: 'Électro-Fil', type: 'Électrique', pow: 40, acc: 100, st: { s: 'par', ch: 0.2 }, desc: 'Un fil électrifié. Peut paralyser.' },
    electro_choc:   { name: 'Électro-Choc', type: 'Électrique', pow: 45, acc: 100, st: { s: 'par', ch: 0.1 }, desc: 'Une décharge électrique. Peut paralyser.' },
    super_tonnerre: { name: 'Tonnerre Étincelant', type: 'Électrique', pow: 60, acc: 95, st: { s: 'par', ch: 0.1 }, desc: 'Un éclair surpuissant.' },
    champi_bombe:   { name: 'Champi-Bombe', type: 'Ténèbres', pow: 45, acc: 100, st: { s: 'psn', ch: 0.15 }, desc: 'Lance des champignons explosifs. Peut empoisonner.' },
    jet_pierres:    { name: 'Jet de Pierres', type: 'Terre', pow: 45, acc: 95, desc: 'Lance des cailloux.' },
    souffle_ardent: { name: 'Souffle Ardent', type: 'Feu', pow: 65, acc: 95, st: { s: 'brn', ch: 0.15 }, desc: 'Un long jet de flammes brûlantes.' },
    coup_queue:     { name: 'Coup de Queue', type: 'Neutre', pow: 70, acc: 95, contact: true, desc: 'Balaie l\'ennemi d\'un grand coup de queue.' },
    gadoue_nume:    { name: 'Gadoue Nume', type: 'Ténèbres', pow: 55, acc: 95, sc: { who: 'foe', s: 'atk', n: -1, ch: 0.3 }, desc: 'Lance une boule de gadoue... dégoûtante. Peut baisser l\'Attaque.' },
    ordure_toxique: { name: 'Ordure Toxique', type: 'Ténèbres', pow: 60, acc: 90, st: { s: 'psn', ch: 0.3 }, desc: 'Une attaque nauséabonde qui peut empoisonner.' },
    attaque_coeur:  { name: 'Attaque Cœur', type: 'Lumière', pow: 110, acc: 95, desc: "Des cœurs d'amour qui adoucissent les cœurs les plus durs... et frappent fort." },
    griffe_garuru:  { name: 'Griffe du Loup', type: 'Glace', pow: 100, acc: 95, contact: true, desc: 'Lacère avec des griffes plus dures que le diamant.' },
    feu_metal:      { name: 'Feu de Métal', type: 'Feu', pow: 100, acc: 90, st: { s: 'brn', ch: 0.3 }, desc: 'Crache des flammes bleues assez chaudes pour faire fondre le métal.' },
    ombre_ailee:    { name: 'Ailes Ombrageuses', type: 'Air', pow: 100, acc: 95, desc: 'Projette un phénix de feu en forme d\'ailes.' },
    double_ciseaux: { name: 'Double Cisaille', type: 'Insecte', pow: 105, acc: 90, contact: true, desc: 'Tranche avec ses quatre mandibules à la fois.' },
    bulles_acides:  { name: 'Bulles Acides', type: 'Neutre', pow: 30, acc: 100, sc: { who: 'foe', s: 'def', n: -1, ch: 0.2 }, desc: 'Crache des bulles acides qui rongent la défense.' },
    souffle_cocyte: { name: 'Souffle de Cocyte', type: 'Glace', pow: 130, acc: 90, desc: 'Un souffle glacé venu des abysses : il gèle tout, jusqu’au temps lui-même.' },
    force_gaia:     { name: 'Force de Gaïa', type: 'Feu', pow: 130, acc: 90, desc: "Concentre toute l'énergie de l'atmosphère en une sphère géante et la projette." },
    tornade_courage:{ name: 'Tornade du Courage', type: 'Neutre', pow: 110, acc: 95, contact: true, desc: 'Tournoie comme une tornade, griffes Dramon en avant.' },
    giga_destruction:{ name: 'Giga Destruction', type: 'Feu', pow: 110, acc: 85, desc: 'Deux missiles organiques jaillissent de son torse.' },
    bras_trident:   { name: 'Bras Trident', type: 'Neutre', pow: 95, acc: 95, contact: true, desc: 'Lacère avec sa griffe métallique à trois lames.' },
    grande_vague:   { name: 'Grande Vague', type: 'Eau', pow: 65, acc: 95, desc: 'Fait déferler une vague sur l\'ennemi.' },
    tempete_neige:  { name: 'Tempête de Neige', type: 'Glace', pow: 80, acc: 90, sc: { who: 'foe', s: 'spd', n: -1, ch: 0.3 }, desc: 'Une tempête glaciale. Peut baisser la Vitesse.' },
    marteau_vulcain:{ name: 'Marteau de Vulcain', type: 'Terre', pow: 115, acc: 85, contact: true, desc: 'Un coup de marteau qui fait trembler la terre.' },
    boomerang:      { name: 'Marteau Boomerang', type: 'Neutre', pow: 90, acc: 95, desc: 'Zudomon lance son marteau qui revient comme un boomerang.' },
    feuille:        { name: 'Feuille Tranchante', type: 'Plante', pow: 35, acc: 100, desc: 'Lance des feuilles coupantes.' },
    feuille_rasoir: { name: 'Feuille Rasoir', type: 'Plante', pow: 65, acc: 95, desc: 'Une rafale de feuilles aiguisées comme des rasoirs.' },
    uppercut:       { name: 'Uppercut Cactus', type: 'Neutre', pow: 85, acc: 90, contact: true, desc: 'Un uppercut dévastateur.' },
    canon_floral:   { name: 'Canon Floral', type: 'Plante', pow: 120, acc: 90, desc: 'Ses mains forment une fleur qui tire un rayon d\'énergie.' },
    charme:         { name: 'Charme Floral', type: 'Lumière', pow: 0, acc: 100, sc: { who: 'foe', s: 'atk', n: -2 }, desc: 'Un charme irrésistible. Baisse beaucoup l\'Attaque.' },
    souffle_bleu:   { name: 'Souffle Bleu', type: 'Glace', pow: 45, acc: 100, desc: 'Crache des flammes bleues glaciales.' },
    flamme_bleue:   { name: 'Flamme Bleue', type: 'Glace', pow: 90, acc: 90, sc: { who: 'foe', s: 'spd', n: -1, ch: 0.2 }, desc: 'Un torrent de flammes bleues qui gèle l\'ennemi.' },
    poing_ardent:   { name: 'Poing Ardent', type: 'Feu', pow: 85, acc: 95, contact: true, st: { s: 'brn', ch: 0.3 }, desc: 'Un coup de poing enflammé. Brûle souvent.' },
    meteore:        { name: 'Ailes de Météore', type: 'Feu', pow: 90, acc: 90, desc: 'Fait pleuvoir des météores de feu.' },
    // ---- techniques vues dans l'anime (Digimon Adventure, saison 1)
    couronne_fleurs:{ name: 'Couronne de Fleurs', type: 'Plante', pow: 0, acc: null, heal: 0.5, desc: 'Une couronne de fleurs apaisante. Rend la moitié de ses PV.' },
    fleche_glace:   { name: 'Flèche de Glace', type: 'Glace', pow: 70, acc: 95, sc: { who: 'foe', s: 'spd', n: -1, ch: 0.2 }, desc: 'Tire une flèche de glace acérée. Peut baisser la Vitesse.' },
    poing_zero:     { name: 'Poing Zéro Absolu', type: 'Glace', pow: 75, acc: 95, contact: true, sc: { who: 'foe', s: 'spd', n: -1, ch: 0.3 }, desc: 'Un poing glacé à -273 degrés. Peut ralentir l\'ennemi.' },
    petit_tonnerre: { name: 'Petit Tonnerre', type: 'Électrique', pow: 40, acc: 100, st: { s: 'par', ch: 0.1 }, desc: 'Une petite décharge électrique. Peut paralyser.' },
    bulle_explosive:{ name: 'Bulle Explosive', type: 'Air', pow: 40, acc: 100, desc: 'Gonfle ses joues et souffle une bulle d\'air qui explose.' },
    souffle_paralysant: { name: 'Souffle Paralysant', type: 'Électrique', pow: 0, acc: 80, st: { s: 'par', ch: 1 }, desc: 'Un souffle électrique qui paralyse l\'ennemi.' },
    vrille:         { name: 'Vrille Foreuse', type: 'Terre', pow: 70, acc: 95, contact: true, desc: 'Tourne sur lui-même comme une foreuse et perce la défense.' },
    main_enfers:    { name: 'Main des Enfers', type: 'Ténèbres', pow: 55, acc: 95, contact: true, sc: { who: 'foe', s: 'atk', n: -1, ch: 0.3 }, desc: 'Une main spectrale qui agrippe l\'ennemi. Peut baisser son Attaque.' },
    picorage:       { name: 'Petit Picorage', type: 'Air', pow: 25, acc: 100, pri: 1, contact: true, desc: 'Une rafale de petits coups de bec, toujours en premier.' },
    poing_roc:      { name: 'Poing de Roc', type: 'Terre', pow: 60, acc: 90, contact: true, desc: 'Un coup de poing dur comme la pierre.' },
  };


  // animation propre à chaque attaque (voir battle.js : FX)
  const FX = {
    couronne_fleurs: 'hearts', fleche_glace: 'icebreath', poing_zero: 'punch', petit_tonnerre: 'shock', bulle_explosive: 'bubbles',
    souffle_paralysant: 'wire', vrille: 'tackle', main_enfers: 'bite', picorage: 'tackle',
    flamme_bebe: 'fireball', lutte: 'tackle', charge: 'tackle', vive_attaque: 'dash', griffe: 'claw', coup_tete: 'tackle', coup_corne: 'horn', poing_piquant: 'punch',
    grondement: 'roar', garde: 'shield', morsure: 'bite', bulles: 'bubbles', boule_feu: 'fireball', mega_flamme: 'flamebeam',
    flamme_spirale: 'spiral', banc_poissons: 'fish', torpille_harpon: 'harpoon', jet_hydro: 'waterbeam', coquille: 'shield',
    souffle_glace: 'icebreath', lierre: 'vine', parfum: 'spores', fouet_liane: 'vine', pluie_epines: 'needles', coup_bec: 'tackle',
    tornade: 'tornado', vol_plane: 'dash', toile: 'web', pince: 'scissor', electro_fil: 'wire', electro_choc: 'shock',
    super_tonnerre: 'thunder', champi_bombe: 'mushbomb', jet_pierres: 'rocks', poing_roc: 'punch', souffle_ardent: 'flamebeam',
    coup_queue: 'tackle', giga_destruction: 'missiles', bras_trident: 'claw', grande_vague: 'wave', tempete_neige: 'blizzard',
    marteau_vulcain: 'hammer', boomerang: 'boomerang', feuille: 'leaves', feuille_rasoir: 'leaves', uppercut: 'punch',
    griffe_eclair: 'claw', epee_transcendante: 'claw', fleche_celeste: 'meteor', porte_destin: 'meteor', corne_explosive: 'thunder', lumiere_eden: 'meteor', feu_sacre: 'flamebeam',
    gadoue_nume: 'mushbomb', ordure_toxique: 'spores', attaque_coeur: 'hearts', griffe_garuru: 'claw', feu_metal: 'bluefire', ombre_ailee: 'meteor', double_ciseaux: 'scissor', bulles_acides: 'bubbles', force_gaia: 'meteor', souffle_cocyte: 'bluefire', tornade_courage: 'dash', canon_floral: 'flowercannon', charme: 'hearts', souffle_bleu: 'bluefire', flamme_bleue: 'bluefire', poing_ardent: 'firepunch', meteore: 'meteor',
  };
  for (const id in M) M[id].fx = FX[id] || (M[id].contact ? 'tackle' : 'orb');
  // PM (comme dans Digimon World 1) : les techniques puisent dans une réserve commune.
  // Coût selon la puissance ; le Coup de Corps et la Lutte sont gratuits.
  // part des PM réellement dépensée par technique (0.5 : deux fois moins cher qu'au début)
  const MP_RATIO = 0.5;
  DW.mpCost = key => { const id = typeof key === 'string' ? key : Object.keys(M).find(k => M[k] === key), mv = M[id]; if (!mv || id === 'lutte' || id === 'charge') return 0; const k = (DW.SCALE && DW.SCALE.mp) || 1; const base = mv.mp != null ? mv.mp : mv.pow ? Math.max(2, Math.round(mv.pow / 8)) : mv.heal ? 8 : 4; return Math.max(k, Math.round(base * k * MP_RATIO)); };

  // ------------------------------------------------------------ coup spécial de chaque Digimon (sa technique signature)
  // Utilisable quand la jauge d'énergie du combat est pleine : puissance ×1.5, ne rate jamais.
  DW.SIG = {
    botamon: 'bulles_acides', punimon: 'bulles', pichimon: 'bulles', yuramon: 'bulles', nyokimon: 'bulles', wargreymon: 'force_gaia', metalgarurumon: 'souffle_cocyte',
    numemon: 'gadoue_nume', sukamon: 'ordure_toxique', monzaemon: 'attaque_coeur', weregarurumon: 'griffe_garuru', skullmeramon: 'feu_metal', garudamon: 'ombre_ailee', okuwamon: 'double_ciseaux',
    // (Koromon : Étincelle, de son élément — ses Bulles d'Eau ne servaient à rien contre Bukamon et les Digimon Plante ;
    //  Bulles reste de l'Eau : Neutre, Bukamon perdait sa seule technique d'Eau et les Plante ne la craignaient plus)
    koromon: 'etincelle', tsunomon: 'bulles', bukamon: 'bulles', tanemon: 'bulles', yokomon: 'bulles',
    agumon: 'flamme_bebe', greymon: 'mega_flamme', metalgreymon: 'giga_destruction', gabumon: 'souffle_bleu', garurumon: 'flamme_bleue',
    meramon: 'poing_ardent', gomamon: 'banc_poissons', ikkakumon: 'torpille_harpon', zudomon: 'marteau_vulcain',
    palmon: 'lierre', togemon: 'pluie_epines', lillymon: 'canon_floral', biyomon: 'flamme_spirale', birdramon: 'meteore',
    kunemon: 'electro_fil', kuwagamon: 'pince', mushroomon: 'champi_bombe', betamon: 'electro_choc', gotsumon: 'poing_roc',
    elecmon: 'super_tonnerre', shellmon: 'jet_hydro',
    yukimibotamon: 'bulles', nyaromon: 'bulles', pyocomon: 'bulles', salamon: 'cri_chiot', gatomon: 'griffe_eclair', angewomon: 'fleche_celeste',
    ophanimon: 'lumiere_eden', magnadramon: 'feu_sacre', megakabuterimon: 'corne_explosive', magnaangemon: 'porte_destin', omegamon: 'epee_transcendante',
  };
  DW.sigOf = mon => DW.SIG[mon.sp] || null;
})();
