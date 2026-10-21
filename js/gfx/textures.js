'use strict';
// =====================================================================
//  IMAGES DU JOUEUR (assets/<dossier>/*.png, fabriquées avec ChatGPT) : chaque image remplace le dessin par code de
//  l'élément correspondant (sol, décor, Digimon) ; une image absente ou pas encore chargée = un petit dessin de secours.
//  Le jeu charge d'abord la copie allégée (assets/<dossier>/jeu/, faite par dev/optimiser_textures.py), sinon l'original.
//  Quelle que soit la taille de l'image, elle est mise à l'échelle du jeu (TAILLE, en pixels du jeu : 1 case = 16) ;
//  les objets sont d'abord recadrés sur leur contenu (fond transparent enlevé).
//  Une carte choisit son dossier avec map.textures (ex. 'volcan' : maps/miharashi.js). Toutes les cartes extérieures
//  prennent aussi le dossier COMMUN (assets maison du joueur : herbes, terres, sables, eaux, arbres), selon leur thème
//  (CHOIX) ; les arbres du jeu (variantes de saison comprises) sont dessinés avec ses images (ARBRES).
//  Les Digimon dessinés par le joueur (digi_<espèce>_<vue>) : gfx/sprites.js (IMAGES).
//  Utilisé par : gfx/terrain.js (sol, falaises, escaliers, lave, objets), gfx/objects.js (décors), gfx/meteo.js (saisons),
//  gfx/sprites.js (Digimon), gfx/premium.js (cratère), game/lave.js (coulées), main.js (attente du chargement), l'atelier.
// =====================================================================
(function () {
  const SOLS = ['herbe_claire', 'herbe_verte', 'sable_terre', 'herbe_seche', 'herbe_fleurie', 'herbe_dense', 'terre_claire', 'herbe_haute', 'herbe_terre',
    'sable_dunes', 'terre_brune', 'terre_sombre', 'sable_plage', 'terre_savane', 'terre_cailloux', 'terre_craquelee', 'sable_desert', 'eau_mer', 'eau_douce'];
  // matériel d'entraînement du joueur (dossier SPORT) : appareil du jeu -> image
  const SPORT = {
    dummy: ['sport_mannequin_cible'], weights: ['sport_rocher_socle'], punchbag: ['sport_sac_frappe'], hurdle: ['sport_vit_haies'],
    guardwall: ['sport_mur_soleil'], datacrystal: ['sport_pilier_cristal'], shieldrack: ['sport_def_boucliers'],
    epouvantail: ['sport_epouvantail'], traineau: ['sport_traineau'], pneus: ['sport_pneus'], slalom: ['sport_vit_slalom'], mannequinbois: ['sport_def_mannequin_bois'],
    anneaufeu: ['sport_feu_anneau'], cascade: ['sport_eau_cascade'], bainglace: ['sport_glace_bain'], portailvent: ['sport_portail_vent'],
    bobinefoudre: ['sport_bobine_foudre'], rochersuspendu: ['sport_rocher_suspendu'], portailombre: ['sport_portail_ombre'],
    tableaumemoire: ['sport_int_memoire'], telescope: ['sport_int_telescope'], formes: ['sport_int_formes'],
  };
  const LISTE = {
    commun: [...SOLS, 'arbre_sapin', 'arbre_cerisier', 'arbre_chene_clair', 'arbre_saule', 'arbre_mauve', 'arbre_chene', 'arbre_vert', 'arbre_vert_vif', 'arbre_bouleau',
      'arbre_fleurs', 'arbre_automne_brun', 'arbre_erable_orange', 'arbre_erable_rouge', 'arbre_mi_automne', 'arbre_bouleau_automne', 'arbre_chene_automne', 'arbre_neige_tordu', 'arbre_neige_bouleau', 'arbre_neige_rond', 'arbre_neige_chene',
      'arbre_neige_sapin', 'arbre_neige_sapin3', 'arbre_neige_nu',
      'buisson', 'buisson_baies', 'buisson_baies2', 'buisson_fleuri', 'amanites', 'fougere_1', 'fougere_2', 'rocher_mousse', 'souche', 'tronc_couche', 'racines',
      'panneau', 'monolithe', 'sanctuaire', 'totem', 'fleur_cristal', 'cristaux', 'source',
      'fleur_1', 'fleur_2', 'fleur_3', 'fleur_4', 'fleur_5', 'fleur_6', 'fleur_7', 'fleur_8', 'fleur_9', 'fleur_10',
      'amanites2', 'champi_violet', 'champi_bleu', 'cepes', 'girolles', 'rond_sorcieres', 'souche_champignons', 'champi_blancs', 'champi_vert', 'tuyau', 'pierre_runique', 'cairn', 'eboulis', 'lanterne_pierre', 'borne_bleue', 'borne_rouge', 'dalle_runique',
      'banc_simple', 'table_ronde', 'banc_courbe', 'banc_dossier', 'banc_rondin', 'table_souche', 'banc_mousse', 'table_rect', 'table_banquet', 'table_pique_nique',
      // mobilier urbain et d'intérieur (planches sur fond vert, découpées par dev/optimiser_textures.py)
      'ville_fontaine_vasque', 'ville_fontaine_octogone', 'ville_puits_treuil', 'ville_fontaine_etages', 'ville_tonneaux',
      'ville_sacs', 'ville_pot_arbuste', 'ville_buis',
      'maison_tableau', 'maison_vase_fleurs', 'maison_lit', 'maison_chevet', 'maison_armoire', 'maison_tabouret',
      'maison_coffre_jouets', 'maison_etagere_murale', 'maison_bureau', 'maison_bibliotheque', 'maison_tapis', 'maison_bibliotheque_basse',
      'maison_lampadaire', 'maison_plante', 'maison_coussins', 'maison_frigo', 'maison_tonneau',
      // montagne : plantes, rochers, entrée de grotte, sols (carreaux rendus raccordables)
      'mont_sapin', 'mont_buisson', 'mont_arbuste_sec', 'mont_herbes_hautes', 'mont_herbes_seches', 'mont_herbe_rousse', 'mont_edelweiss', 'mont_fleurs_violettes', 'mont_buisson_baies',
      'mont_grotte', 'mont_petit_rocher', 'mont_rocher', 'mont_gros_rocher', 'mont_aiguille', 'mont_eboulis_gros', 'mont_rocher_mousse', 'mont_eboulis', 'mont_cairn',
      'mont_gravier', 'mont_herbe_alpine', 'mont_terre_seche',
      'maison_aquarium', 'maison_ordinateur', 'maison_cuisiniere', 'ville_lampadaire_noir', 'ville_paves',
      // mobilier extérieur (planche à 10 catégories) : caisses, distributeurs, boîte aux lettres, jardinières, étals, puits ;
      // les toilettes de tout le jeu : la cabane au toit bleu de la planche VILLAGE BEBE
      'ext_caisse', 'ext_caisse2', 'ext_distrib_rouge', 'ext_distrib_bleu', 'ext_distrib_blanc', 'ext_boite_lettres', 'toilettes',
      'ext_jardiniere_verte', 'ext_jardiniere_blanche', 'ext_jardiniere_rose', 'ext_etal_fruits', 'ext_etal_legumes', 'ext_etal_pain', 'ext_puits', 'ext_panneau',
      // plage : rochers, arche, herbes de dune, coquillages, mares, palmiers, bois flotté, château de sable, barque, radeau, sables
      'plage_rocher', 'plage_rochers', 'plage_pile_rochers', 'plage_arche', 'plage_herbe_dune', 'plage_herbe_seche', 'plage_conque', 'plage_escargot', 'plage_coquille', 'plage_etoile', 'plage_mare',
      'plage_palmier', 'plage_palmier_courbe', 'plage_palmier_double', 'plage_bois_flotte', 'plage_bois_flotte2', 'plage_chateau', 'plage_barque', 'plage_radeau', 'plage_sable', 'plage_borne',
      // matériel d'entraînement (planches SPORT) : Terrain d'entraînement, Gymnase de Leomon, salle de classe
      ...Object.values(SPORT).flat(),
      // Digimon (planches du joueur, une image par vue : gfx/sprites.js)
      ...Object.keys(DW.Sprites.IMAGES).flatMap(sp => DW.Sprites.VUES.map(v => 'digi_' + sp + '_' + v))],
    volcan: ['sol_cendres', 'dessus_falaise', 'lave', 'falaise_basalte', 'paroi_cratere', 'escalier',
      'pic_1', 'pic_2', 'pic_3', 'rocher_magma', 'fumerolle', 'cone_lave', 'plante_feu_1', 'plante_feu_2', 'plante_feu_3'],
  };
  // taille dans le jeu : [largeur, hauteur] pour une texture, { h } ou { w } pour un objet (l'autre côté suit l'image)
  const TAILLE = {
    ...Object.fromEntries(SOLS.map(n => [n, [128, 128]])),
    // fleurs et champignons posés au sol (là où le jeu les peignait en quelques pixels) : de petits objets nets
    ...Object.fromEntries(['fleur_1', 'fleur_2', 'fleur_3', 'fleur_4', 'fleur_5', 'fleur_6', 'fleur_7', 'fleur_8', 'fleur_9', 'fleur_10'].map(n => [n, { h: 10 }])),
    ...Object.fromEntries(['amanites', 'amanites2', 'cepes', 'girolles', 'champi_blancs', 'champi_bleu', 'champi_violet', 'champi_vert'].map(n => [n, { h: 9 }])), rond_sorcieres: { w: 20 },
    // mobilier d'extérieur (posé dans l'atelier des cartes : « Mobilier de village ») ; les bancs du jeu prennent ces images
    banc_simple: { h: 14 }, banc_courbe: { h: 18 }, banc_dossier: { h: 20 }, banc_rondin: { h: 13 }, banc_mousse: { h: 20 },
    table_ronde: { h: 20 }, table_souche: { h: 17 }, table_rect: { h: 21 }, table_banquet: { h: 22 }, table_pique_nique: { h: 22 },
    sol_cendres: [128, 128], dessus_falaise: [176, 176], lave: [128, 128],
    falaise_basalte: [80, 64], paroi_cratere: [80, 64], escalier: [48, 64],
    pic_1: { h: 34 }, pic_2: { h: 30 }, pic_3: { h: 32 }, rocher_magma: { w: 24 }, fumerolle: { w: 18 }, cone_lave: { w: 26 },
    plante_feu_1: { h: 16 }, plante_feu_2: { h: 14 }, plante_feu_3: { h: 16 },
    // montagne (le héros : 34 px) : posés par étage sur le Mont Miharashi (maps/miharashi.js)
    mont_buisson: { h: 26 }, mont_arbuste_sec: { h: 32 }, mont_herbes_hautes: { h: 24 }, mont_herbes_seches: { h: 22 }, mont_herbe_rousse: { h: 22 },
    mont_edelweiss: { h: 13 }, mont_fleurs_violettes: { h: 14 }, mont_buisson_baies: { h: 24 }, mont_grotte: { h: 58 },
    mont_petit_rocher: { h: 12 }, mont_rocher: { h: 20 }, mont_gros_rocher: { h: 32 }, mont_aiguille: { h: 46 }, mont_eboulis_gros: { h: 26 },
    mont_rocher_mousse: { h: 24 }, mont_eboulis: { h: 18 }, mont_cairn: { h: 28 },
    ville_paves: [96, 96], plage_sable: [96, 96], plage_borne: { h: 40 },   // (pavés de la ville : une pierre fait environ 12 px du jeu)
    mont_gravier: [128, 128], mont_herbe_alpine: [128, 128], mont_terre_seche: [128, 128],
  };
  // objets du jeu remplacés par une image (par dossier) : un nom, ou plusieurs (variante choisie selon la case)
  // ARBRES DU JEU dessinés avec les images du dossier commun : [type][variante] -> image (variantes de OBJ.tree : 0-2 verts,
  // 3 chêne, 4 bouleau, 5-7 automne, 8 vert profond, 9 moussu, 10-11 hiver, 12-13 en fleurs, 14 sans feuilles vertes (feuillage
  // brun : pas d'image d'arbre nu sans neige), 15 nu enneigé ;
  // chêne et bouleau : 0 été, 1 automne, 2 nu, 3 nu enneigé ; sapin : 0 vert, 1 enneigé, 2 mort (sec), 3 enneigé (l'hiver),
  // 4 mort enneigé (sommets) — gfx/meteo.js choisit selon la saison)
  const ARBRES = {
    tree: ['arbre_vert', 'arbre_vert_vif', 'arbre_chene_clair', 'arbre_chene', 'arbre_bouleau', 'arbre_erable_orange', 'arbre_erable_rouge', 'arbre_mi_automne',
      'arbre_chene', 'arbre_chene_clair', 'arbre_neige_rond', 'arbre_neige_sapin3', 'arbre_cerisier', 'arbre_fleurs', 'arbre_automne_brun', 'arbre_neige_nu'],
    oak: ['arbre_chene', 'arbre_chene_automne', 'arbre_automne_brun', 'arbre_neige_chene'],
    birch: ['arbre_bouleau', 'arbre_bouleau_automne', 'arbre_automne_brun', 'arbre_neige_bouleau'],
    pine: ['mont_sapin', 'arbre_neige_sapin', 'arbre_automne_brun', 'arbre_neige_sapin', 'arbre_neige_tordu'],
    // (le joueur veut SES arbres partout : toutes les autres espèces d'arbres du jeu prennent l'image la plus proche)
    saule: ['arbre_saule'], pintordu: ['arbre_sapin'], bigtree: ['arbre_chene', 'arbre_chene_clair'],
    jungletree: ['arbre_vert', 'arbre_chene', 'arbre_vert_vif'], cycad: ['arbre_vert_vif', 'arbre_vert'], mangrove: ['arbre_saule'], swamptree: ['arbre_saule'],
    acacia: ['arbre_chene_clair', 'arbre_mi_automne'], baobab: ['arbre_chene'], deadtree: ['arbre_automne_brun'],
    cendre: ['arbre_neige_nu'],   // (arbre de cendres des volcans : ton arbre nu enneigé, passé en gris cendre — CENDRE ci-dessous)
    candytree: ['arbre_cerisier', 'arbre_mauve', 'arbre_fleurs'],
    // DÉCORS : buissons, fougères, rochers, souches, troncs, champignons lumineux, objets de forêt
    bush: ['buisson', 'buisson_baies', 'buisson_fleuri', 'buisson_baies2'], hedge: ['buisson'], junglebush: ['buisson', 'buisson_baies2'],
    buissonfleuri: ['buisson_fleuri'], rosebush: ['fleur_7'], fern: ['fougere_1', 'fougere_2'], bigfern: ['fougere_1', 'fougere_2'], fougeres: ['fougere_2', 'fougere_1'],
    mossrock: ['rocher_mousse', 'mont_rocher_mousse'], rock: ['mont_rocher', 'mont_petit_rocher', 'mont_rocher_mousse'], boulder: ['mont_gros_rocher', 'mont_eboulis_gros'], rochersmousse: ['rocher_mousse', 'eboulis'],
    stump: ['souche'], giantstump: ['souche', 'souche_champignons'], log: ['tronc_couche'], hollowlog: ['tronc_couche'], troncouche: ['tronc_couche'], treeroots: ['racines'],
    glowshroom: ['champi_violet', 'champi_bleu'], giantshroom: ['champi_bleu', 'champi_vert'], champignons: ['cepes', 'girolles', 'champi_blancs'],
    monolith: ['monolithe', 'pierre_runique'], totem: ['totem'], pipe: ['tuyau', 'tuyau'], lamp: ['ville_lampadaire_noir'], antenna: ['borne_bleue', 'borne_rouge'],
    datapanel: ['dalle_runique', 'dalle_runique'], bench: ['banc_dossier'], steplog: ['banc_rondin'], stonelantern: ['lanterne_pierre'], cairn: ['cairn'], rubble: ['mont_eboulis'],
    crystal: ['cristaux'], sign: ['panneau'], roadsign: ['panneau'], flowerbed: ['fleur_2', 'fleur_6', 'fleur_9', 'fleur_3'],
    giantflower: ['fleur_cristal'], spring: ['source'], shrine: ['sanctuaire'],
    // ville : fontaines, puits, sacs, tonneaux, pots (seulement les images vues de face ; celles vues de biais gardent
    // l'ancien dessin — règle du joueur ; la fontaine du Village des Yokomon, à sec puis qui coule, garde aussi le sien)
    well: ['ville_puits_treuil', 'ext_puits'], bigfountain: ['ville_fontaine_etages', 'ville_fontaine_vasque', 'ville_fontaine_octogone'],
    barrel: ['maison_tonneau', 'ville_tonneaux'], sacks: ['ville_sacs'], pottedtree: ['ville_pot_arbuste', 'ville_buis'],
    // intérieurs (vus de face)
    bed: ['maison_lit'], wardrobe: ['maison_armoire'], bookshelf: ['maison_bibliotheque', 'maison_bibliotheque_basse'],
    floorlamp: ['maison_lampadaire'], frame: ['maison_tableau'], stool: ['maison_tabouret'], shelf: ['maison_etagere_murale'],
    sidetable: ['maison_chevet'], plant: ['maison_plante', 'maison_vase_fleurs'], fridge: ['maison_frigo'],
    // mobilier extérieur : les distributeurs gardent leur couleur selon leur rôle (0 soins PV : rouge, 1 PM : bleu, 2 nourriture :
    // blanc) ; les stands des recrues gardent leur dessin (leurs variantes ont un sens)
    crates: ['ext_caisse', 'ext_caisse2'], vending: ['ext_distrib_rouge', 'ext_distrib_bleu', 'ext_distrib_blanc'], mailbox: ['ext_boite_lettres'], toilet: ['toilettes'],
    planter: ['ext_jardiniere_verte', 'ext_jardiniere_blanche', 'ext_jardiniere_rose'], marketstall: ['ext_etal_fruits', 'ext_etal_legumes', 'ext_etal_pain'],
    stall: ['ext_etal_pain'], producestand: ['ext_etal_fruits'],
    // le panneau d'affichage de la ville : son image, et par-dessus les affiches des habitants revenus (OBJ.noticeboard.surImage)
    noticeboard: ['ext_panneau'],
    // plage (ses rochers remplacent les pierres grises bleutées de la mer)
    searock: ['plage_rocher', 'plage_rochers', 'plage_pile_rochers'], rockarch: ['plage_arche'], tidepool: ['plage_mare'],
    palm: ['plage_palmier', 'plage_palmier_double'], cocotier: ['plage_palmier_courbe', 'plage_palmier'], driftwood: ['plage_bois_flotte', 'plage_bois_flotte2'],
    starfish: ['plage_etoile'], sandcastle: ['plage_chateau'], rowboat: ['plage_barque'], raft: ['plage_radeau'], oyats: ['plage_herbe_dune', 'plage_herbe_seche'],
    coquillages: ['plage_conque', 'plage_escargot', 'plage_coquille'], shellpile: ['plage_coquille', 'plage_conque'],
    toybox: ['maison_coffre_jouets'], desk: ['maison_bureau'], cushion: ['maison_coussins'], bigrug: ['maison_tapis'], rug: ['maison_tapis'],
    bigplant: ['maison_plante'], barrels: ['ville_tonneaux'], aquarium: ['maison_aquarium'], computer: ['maison_ordinateur'], oven: ['maison_cuisiniere'],
    ...SPORT,
    _grandarbre: ['arbre_chene'],   // (le Grand Arbre de la Clairière : voir objets(), son passage reste dessiné par-dessus)
  };
  // TAILLES : hauteur de chaque décor dessiné, en HAUTEURS DE HÉROS (le héros : 34 px du jeu) ; le joueur : « les arbres
  // doivent être 3 fois plus grands que le personnage »
  const HEROS = DW.World.HEROS_VISIBLE;   // hauteur visible du héros (sprite de marche), en pixels du jeu
  const HAUTEUR = {
    // (règle du joueur : TOUS les arbres font 3 fois la hauteur du héros, quelle que soit l'espèce)
    tree: 3, oak: 3, birch: 3, pine: 3, saule: 3, pintordu: 3, bigtree: 3, jungletree: 3, cycad: 3, mangrove: 3, swamptree: 3, acacia: 3, baobab: 3, deadtree: 3, candytree: 3, cendre: 3,
    bush: 0.85, hedge: 0.85, junglebush: 0.9, buissonfleuri: 0.85, rosebush: 0.8, flowerbed: 0.55, fern: 0.75, bigfern: 0.9, fougeres: 0.8, giantflower: 1.4,
    glowshroom: 0.9, giantshroom: 1.7, champignons: 0.5, mossrock: 0.8, rock: 0.6, boulder: 1, rochersmousse: 1, rubble: 0.8, cairn: 0.9,
    stump: 0.6, giantstump: 1, log: 0.5, hollowlog: 0.55, troncouche: 0.6, treeroots: 1, monolith: 1.6, totem: 1.7, crystal: 1, datacrystal: 1.9,
    palm: 3, cocotier: 3, searock: 1, rockarch: 2.6, sandcastle: 0.9, oyats: 0.8, toilet: 2.1,
    // matériel d'entraînement (le héros : 1)
    dummy: 1.6, weights: 1.5, punchbag: 1.9, hurdle: 1.2, guardwall: 2, shieldrack: 1.5, epouvantail: 1.6, traineau: 1.25, pneus: 2, slalom: 1.6, mannequinbois: 1.6,
    anneaufeu: 2, cascade: 2.1, bainglace: 1.5, portailvent: 2, bobinefoudre: 2, rochersuspendu: 1.9, portailombre: 2, tableaumemoire: 1.6, telescope: 1.6, formes: 1.3,
    sign: 1.1, roadsign: 1.2, spring: 1.1, shrine: 1.5, pipe: 0.9, lamp: 1.7, antenna: 1.3, stonelantern: 1.1, datapanel: 0.8, bench: 0.6, steplog: 0.4,
  };
  const nomArbre = (kind, v) => { const L = ARBRES[kind]; return L ? (v < L.length ? L[v] : L[v % L.length]) : null; };
  // SOLS PAR THÈME (rôle -> image) : herbe, chemin (terre), sable, eaux (herbe_seche : seulement un dossier de carte ; une
  // texture différente case par case dessinait des carrés)
  const DEFAUT = { herbe: 'herbe_verte', herbe_seche: null, chemin: 'terre_claire', sable: 'sable_plage', eau_mer: 'eau_mer', eau_douce: 'eau_douce', paves: 'ville_paves' };
  const CHOIX = {
    foret: { herbe: 'herbe_verte', chemin: 'terre_brune' }, spring: {}, meadow: { herbe: 'herbe_claire' },
    misty: { herbe: 'herbe_dense', chemin: 'terre_sombre' }, deep: { herbe: 'herbe_dense', chemin: 'terre_sombre' }, autumn: { herbe: 'herbe_seche', chemin: 'terre_brune' },
    town: {}, farm: { chemin: 'terre_brune' }, beach: { herbe: 'herbe_claire', chemin: 'sable_terre', sable: 'plage_sable' }, nursery: { herbe: 'herbe_fleurie' }, toy: { herbe: 'herbe_haute' },
    mountain: { herbe: 'herbe_terre', chemin: 'terre_cailloux' }, savanna: { herbe: 'herbe_seche', chemin: 'terre_savane', sable: 'sable_desert' },
    jungle: { herbe: 'herbe_dense', chemin: 'terre_sombre' }, dino: { herbe: 'herbe_dense', chemin: 'terre_brune' }, mangrove: { herbe: 'herbe_dense', chemin: 'terre_sombre' },
    beetle: { chemin: 'terre_brune' }, canyon: { herbe: 'herbe_seche', chemin: 'terre_craquelee', sable: 'sable_desert' },
    desert: { herbe: 'herbe_seche', chemin: 'terre_craquelee', sable: 'sable_dunes' }, sandtemple: { sable: 'sable_desert', chemin: 'terre_craquelee' },
    yokovillage: {}, miharashi: { herbe: 'herbe_dense', chemin: 'terre_brune' },
  };
  // ambiances qui gardent leur dessin (sombres, enneigées, mécaniques) ; le Terrain d'entraînement reste tel quel
  const SANS = new Set(['cave', 'lavacave', 'sewer', 'snow', 'summit', 'icecave', 'swamp', 'fog', 'cemetery', 'trash', 'factory', 'volcano']);
  const CARTES_SANS = new Set(['gym']);
  const REMPLACE = { volcan: { lavarock: ['rocher_magma'], steamvent: ['fumerolle'], aiguille: ['pic_1', 'pic_2', 'pic_3'] }, grotte: { chest: ['coffre'] },
    // désert (Désert des Poteaux, Plaine des Panneaux : maps/miharashi.js) : la vieille ligne télégraphique, les panneaux
    // routiers, les vestiges numériques, rochers, os, cactus et arbustes de la planche DESERT
    desert: { telpole: ['poteau', 'poteau_penche', 'poteau_brise', 'poteau_transfo', 'poteau', 'poteau_boitier', 'poteau_eclate'],
      roadsign: ['panneau_fleches', 'panneau_danger', 'panneau_ensable', 'poteau_orbe', 'panneau_pierre', 'panneau_fleches', 'stele_cible'],
      antenna: ['tour_antenne', 'antenne', 'balise_cristal'], datapanel: ['rocher_ecran', 'stele_holo', 'bloc_circuits', 'carte'],
      deadtree: ['arbre_mort'], boulder: ['rocher', 'rocher_pointu', 'blocs'], bones: ['squelette'], cactus: ['cactus'],
      drybush: ['arbuste_sec', 'buisson_epineux', 'herbes_seches', 'arbuste_sec', 'virevoltant'], rock: ['rocher', 'cailloux'], chest: ['coffre'],
      crates: ['caisses'], barrel: ['tonneaux'], barrels: ['tonneaux'], sacks: ['sacs'] },
    // villages de bébés (Village des Bébés, Village des Poyomon) : le mobilier de la planche VILLAGE BEBE
    bebe: { bench: ['banc'], lamp: ['lampadaire'], mailbox: ['boite_lettres'], noticeboard: ['panneau_affichage'], vending: ['distributeur'],
      crates: ['cartons'], planter: ['jardiniere'], chest: ['coffre'], toybox: ['etagere_jouets'] } };
  // SOLS d'un dossier, par rôle (sinon l'image du rôle porte son nom : la grotte) : le désert prend son sable pâle et sa piste
  // caillouteuse
  const ROLES = { desert: { sable: 'sable_pale', chemin: 'sable_cailloux' } };
  // DOSSIERS CHARGÉS PLUS TARD, en arrière-plan après le démarrage (le démarrage n'attend pas leurs images ; une carte qui
  // s'en sert attend qu'ils soient prêts : T.dossier, game/overworld.js), en WebP — la grotte de Shellmon (maps/antre.js),
  // le village des bébés (maps/berceau.js, maps/village_yokomon.js), le désert (maps/miharashi.js)
  const TARDIFS = {
    bebe: ['anneaux', 'arche_fleurs', 'arche_lierre', 'arche_papillon', 'armoire_soins', 'bac_sable', 'balancoire', 'ballons', 'banc', 'barriere', 'barriere_fleurs', 'bassin_source', 'berceau', 'boite_lettres', 'borne', 'buisson_fleurs', 'carillon', 'cartons', 'chaise_haute', 'champignon_geant', 'chariot', 'coffre', 'coussins', 'couveuse', 'cubes', 'distributeur', 'dome_bulles', 'dome_grimpe', 'escalier_bois', 'estrade', 'etagere_biberons', 'etagere_jouets', 'fanions', 'fontaine_bulles', 'fontaine_oeuf', 'gamelles', 'garde_manger', 'guirlande', 'haie', 'hochet', 'jardiniere', 'jeu_ressort', 'kiosque_livres', 'lampadaire', 'lampe_etoile', 'lampe_fleur', 'lanterne_branche', 'lanterne_coeur', 'lit_barreaux', 'lit_cocon', 'maison_bois', 'maison_champignon', 'maison_coquillage', 'maison_coussin', 'maison_cubes', 'maison_escargot', 'maison_fleur', 'maison_mousse', 'maison_nid', 'maison_nuage', 'maison_oeuf', 'manege', 'mare_cascade', 'mobile', 'moulin', 'moulinets', 'nid_oeufs', 'observatoire', 'oeufs', 'panier_balles', 'panier_linge', 'panneau_affichage', 'panneau_meteo', 'pas_japonais', 'passerelle', 'pavillon_fleur', 'peluche', 'pont_bois', 'portail', 'portillon', 'poteau_indicateur', 'poubelle', 'scene_musique', 'souche_musique', 'statue_oeuf', 'table', 'table_langer', 'tabouret', 'tambour', 'tape_cul', 'tapis_patchwork', 'toboggan', 'toupie', 'tourniquet', 'train', 'trampoline', 'trefles', 'tunnel', 'xylophone'],
    desert: ['antenne', 'arbre_mort', 'arbuste_sec', 'arche', 'arche_ruine', 'argile_craquelee', 'balise', 'balise_cristal', 'banniere', 'barrage', 'barriere_corde', 'bassin', 'bloc_circuits', 'bloc_grave', 'blocs', 'bord_falaise', 'borne_pierre', 'borne_rayee', 'buisson_epineux', 'cactus', 'cailloux', 'caisses', 'caisses_numeriques', 'carte', 'coffre', 'colonne', 'colonne_brisee', 'colonne_tombee', 'cristal', 'dalle', 'dalle_plate', 'dalles_ensablees', 'dolmen', 'dune', 'eboulis', 'echelle', 'epave_machine', 'escalier', 'etal', 'falaise', 'fosse', 'foyer', 'herbes_seches', 'jarres', 'marches', 'mur_brise', 'mur_oeil', 'mur_ruine', 'niche_faucon', 'niche_statue', 'obelisque', 'obelisque_losange', 'panneau_danger', 'panneau_ensable', 'panneau_fleches', 'panneau_pierre', 'piedestal', 'pilier_circuits', 'pilier_vasque', 'pont_casse', 'portail', 'porte_ankh', 'porte_cristal', 'portique', 'poteau', 'poteau_boitier', 'poteau_brise', 'poteau_casse', 'poteau_eclate', 'poteau_orbe', 'poteau_penche', 'poteau_tombe', 'poteau_transfo', 'poteaux_cable', 'puits', 'rocher', 'rocher_ecran', 'rocher_glitch', 'rocher_pointu', 'sable_cailloux', 'sable_graviers', 'sable_numerique', 'sable_ondule', 'sable_pale', 'sacs', 'squelette', 'station_meteo', 'stele_cible', 'stele_gravee', 'stele_holo', 'stele_orbe', 'teleporteur', 'tente', 'tente_dechiree', 'terre_noire', 'terre_orange', 'tonneaux', 'tour_antenne', 'virevoltant'],
    grotte: ['alcove_sarcophage', 'ankh', 'ankh_lumineux', 'anubis', 'anubis_geant', 'arche', 'arche_ruine', 'autel', 'autel_soleil', 'banniere', 'bassin_colonnes', 'braises', 'brasero', 'brasero_anubis', 'brasero_colonne', 'caisse', 'canopes', 'cascade_roche', 'cascade_temple', 'champignons', 'chemin', 'coffre', 'coffre_anubis', 'colonne_cristaux', 'colonne_moussue', 'coupe_feu', 'cristaux', 'cristaux_violets', 'dais', 'dalle_soleil', 'dalles_fissurees', 'eboulis', 'entree', 'entree_mousse', 'entree_temple', 'escalier', 'escalier_roche', 'flamme_bleue', 'fleurs_lanternes', 'fontaine', 'fontaine_lotus', 'fresque', 'frise_murale', 'gres_aiguilles', 'gres_ankh', 'gres_arche', 'gres_eboulis', 'gres_entree', 'gres_mur', 'gres_rochers', 'grille', 'gue', 'herbe', 'jarre', 'lampe', 'lanterne', 'mur_blocs', 'mur_brise', 'mur_colonne', 'mur_ecroule', 'mur_fissure', 'mur_frise', 'mur_grave', 'mur_hieroglyphes', 'mur_moussu', 'mur_niche', 'mur_peint', 'mur_scarabee', 'mur_soleil', 'mur_sombre', 'niche', 'niche_statue', 'obelisque', 'obelisque_bleu', 'obelisque_cristal', 'offrandes', 'ossements', 'panneau', 'paves', 'piedestal_orbe', 'pierre_runique', 'pilier_brise', 'pilier_grave', 'pilier_lotus', 'pilier_peint', 'pilier_roche', 'portail_roche', 'porte_anubis', 'porte_arche', 'porte_bannieres', 'porte_gardiens', 'porte_grotte', 'porte_ruine', 'porte_scellee', 'porte_temple', 'porte_tombeau', 'porte_torches', 'portique', 'rideau', 'rocher_mousse', 'rochers', 'sable', 'sanctuaire_orbe', 'sarcophage', 'sarcophage_roche', 'scarabee_or', 'socle', 'sol_roche', 'source', 'source_grotte', 'stalagmite', 'stalagmites', 'statue_scarabee', 'stele', 'stele_lumineuse', 'stele_magique', 'tambour', 'terre_sombre', 'tombeau', 'tonneau', 'torche', 'torche_anubis', 'torche_murale', 'torche_plantee', 'torche_trepied', 'tresor_sable', 'vase', 'vasque'],
  };
  const EXT = { grotte: 'webp', bebe: 'webp', desert: 'webp' };
  // tailles propres à un dossier (en pixels du jeu, comme TAILLE ; un même nom peut exister ailleurs : l'escalier du volcan)
  const TAILLES_DOSSIER = {
    bebe: { anneaux: { h: 20 }, arche_fleurs: { h: 64 }, arche_lierre: { h: 64 }, arche_papillon: { h: 62 }, armoire_soins: { h: 46 }, bac_sable: { h: 22 }, balancoire: { h: 54 }, ballons: { h: 46 }, banc: { h: 22 }, barriere: { h: 20 }, barriere_fleurs: { h: 20 }, bassin_source: { h: 34 }, berceau: { h: 34 }, boite_lettres: { h: 40 }, borne: { h: 40 }, buisson_fleurs: { h: 30 }, carillon: { h: 52 }, cartons: { h: 32 }, chaise_haute: { h: 36 }, champignon_geant: { h: 42 }, chariot: { h: 16 }, coffre: { h: 24 }, coussins: { h: 18 }, couveuse: { h: 46 }, cubes: { h: 18 }, distributeur: { h: 46 }, dome_bulles: { h: 76 }, dome_grimpe: { h: 32 }, escalier_bois: { h: 34 }, estrade: { h: 30 }, etagere_biberons: { h: 46 }, etagere_jouets: { h: 40 }, fanions: { h: 40 }, fontaine_bulles: { h: 46 }, fontaine_oeuf: { h: 62 }, gamelles: { h: 16 }, garde_manger: { h: 44 }, guirlande: { h: 50 }, haie: { h: 20 }, hochet: { h: 18 }, jardiniere: { h: 20 }, jeu_ressort: { h: 30 }, kiosque_livres: { h: 62 }, lampadaire: { h: 56 }, lampe_etoile: { h: 44 }, lampe_fleur: { h: 44 }, lanterne_branche: { h: 50 }, lanterne_coeur: { h: 54 }, lit_barreaux: { h: 28 }, lit_cocon: { h: 34 }, maison_bois: { h: 85 }, maison_champignon: { h: 85 }, maison_coquillage: { h: 85 }, maison_coussin: { h: 85 }, maison_cubes: { h: 85 }, maison_escargot: { h: 50 }, maison_fleur: { h: 85 }, maison_mousse: { h: 85 }, maison_nid: { h: 85 }, maison_nuage: { h: 85 }, maison_oeuf: { h: 85 }, manege: { h: 86 }, mare_cascade: { h: 40 }, mobile: { h: 50 }, moulin: { h: 96 }, moulinets: { h: 38 }, nid_oeufs: { h: 22 }, observatoire: { h: 96 }, oeufs: { h: 22 }, panier_balles: { h: 18 }, panier_linge: { h: 20 }, panneau_affichage: { h: 42 }, panneau_meteo: { h: 40 }, pas_japonais: { h: 36 }, passerelle: { h: 22 }, pavillon_fleur: { h: 78 }, peluche: { h: 20 }, pont_bois: { h: 30 }, portail: { h: 76 }, portillon: { h: 26 }, poteau_indicateur: { h: 50 }, poubelle: { h: 32 }, scene_musique: { h: 72 }, souche_musique: { h: 34 }, statue_oeuf: { h: 66 }, table: { h: 22 }, table_langer: { h: 40 }, tabouret: { h: 16 }, tambour: { h: 20 }, tape_cul: { h: 22 }, tapis_patchwork: { h: 36 }, toboggan: { h: 46 }, toupie: { h: 18 }, tourniquet: { h: 26 }, train: { h: 16 }, trampoline: { h: 22 }, trefles: { h: 22 }, tunnel: { h: 28 }, xylophone: { h: 14 } },
    desert: { antenne: { h: 62 }, arbre_mort: { h: 44 }, arbuste_sec: { h: 28 }, arche: { h: 66 }, arche_ruine: { h: 58 }, argile_craquelee: [128, 128], balise: { h: 30 }, balise_cristal: { h: 58 }, banniere: { h: 56 }, barrage: { h: 26 }, barriere_corde: { h: 44 }, bassin: { h: 22 }, bloc_circuits: { h: 32 }, bloc_grave: { h: 34 }, blocs: { h: 24 }, bord_falaise: { h: 48 }, borne_pierre: { h: 52 }, borne_rayee: { h: 34 }, buisson_epineux: { h: 26 }, cactus: { h: 40 }, cailloux: { h: 14 }, caisses: { h: 30 }, caisses_numeriques: { h: 30 }, carte: { h: 40 }, coffre: { h: 22 }, colonne: { h: 64 }, colonne_brisee: { h: 60 }, colonne_tombee: { h: 30 }, cristal: { h: 48 }, dalle: { h: 24 }, dalle_plate: { h: 16 }, dalles_ensablees: [128, 128], dolmen: { h: 52 }, dune: { h: 44 }, eboulis: { h: 46 }, echelle: { h: 56 }, epave_machine: { h: 34 }, escalier: { h: 50 }, etal: { h: 56 }, falaise: { h: 56 }, fosse: { h: 40 }, foyer: { h: 16 }, herbes_seches: { h: 24 }, jarres: { h: 28 }, marches: { h: 50 }, mur_brise: { h: 64 }, mur_oeil: { h: 60 }, mur_ruine: { h: 70 }, niche_faucon: { h: 66 }, niche_statue: { h: 60 }, obelisque: { h: 74 }, obelisque_losange: { h: 72 }, panneau_danger: { h: 46 }, panneau_ensable: { h: 26 }, panneau_fleches: { h: 44 }, panneau_pierre: { h: 44 }, piedestal: { h: 34 }, pilier_circuits: { h: 62 }, pilier_vasque: { h: 56 }, pont_casse: { h: 48 }, portail: { h: 72 }, porte_ankh: { h: 68 }, porte_cristal: { h: 66 }, portique: { h: 64 }, poteau: { h: 76 }, poteau_boitier: { h: 66 }, poteau_brise: { h: 72 }, poteau_casse: { h: 36 }, poteau_eclate: { h: 66 }, poteau_orbe: { h: 58 }, poteau_penche: { h: 68 }, poteau_tombe: { h: 22 }, poteau_transfo: { h: 74 }, poteaux_cable: { h: 60 }, puits: { h: 40 }, rocher: { h: 26 }, rocher_ecran: { h: 40 }, rocher_glitch: { h: 60 }, rocher_pointu: { h: 38 }, sable_cailloux: [128, 128], sable_graviers: [128, 128], sable_numerique: [128, 128], sable_ondule: [128, 128], sable_pale: [128, 128], sacs: { h: 28 }, squelette: { h: 34 }, station_meteo: { h: 62 }, stele_cible: { h: 52 }, stele_gravee: { h: 52 }, stele_holo: { h: 58 }, stele_orbe: { h: 62 }, teleporteur: { h: 36 }, tente: { h: 62 }, tente_dechiree: { h: 52 }, terre_noire: [128, 128], terre_orange: [128, 128], tonneaux: { h: 30 }, tour_antenne: { h: 64 }, virevoltant: { h: 20 } },
    grotte: { alcove_sarcophage: { h: 82 }, ankh: { h: 44 }, ankh_lumineux: { h: 46 }, anubis: { h: 60 }, anubis_geant: { h: 112 }, arche: { h: 72 }, arche_ruine: { h: 84 }, autel: { h: 26 }, autel_soleil: { h: 92 }, banniere: { h: 56 }, bassin_colonnes: { h: 64 }, braises: { h: 20 }, brasero: { h: 42 }, brasero_anubis: { h: 58 }, brasero_colonne: { h: 56 }, caisse: { h: 22 }, canopes: { h: 28 }, cascade_roche: { h: 78 }, cascade_temple: { h: 74 }, champignons: { h: 30 }, chemin: [128, 128], coffre: { h: 26 }, coffre_anubis: { h: 34 }, colonne_cristaux: { h: 72 }, colonne_moussue: { h: 52 }, coupe_feu: { h: 46 }, cristaux: { h: 30 }, cristaux_violets: { h: 38 }, dais: { h: 80 }, dalle_soleil: { h: 12 }, dalles_fissurees: [64, 64], eboulis: { h: 34 }, entree: { h: 72 }, entree_mousse: { h: 72 }, entree_temple: { h: 92 }, escalier: { h: 42 }, escalier_roche: { h: 50 }, flamme_bleue: { h: 52 }, fleurs_lanternes: { h: 36 }, fontaine: { h: 60 }, fontaine_lotus: { h: 70 }, fresque: { h: 58 }, frise_murale: { h: 40 }, gres_aiguilles: { h: 58 }, gres_ankh: { h: 46 }, gres_arche: { h: 66 }, gres_eboulis: { h: 34 }, gres_entree: { h: 72 }, gres_mur: { h: 62 }, gres_rochers: { h: 42 }, grille: { h: 66 }, gue: { h: 22 }, herbe: [128, 128], jarre: { h: 30 }, lampe: { h: 52 }, lanterne: { h: 50 }, mur_blocs: { h: 56 }, mur_brise: { h: 54 }, mur_colonne: { h: 58 }, mur_ecroule: { h: 56 }, mur_fissure: { h: 56 }, mur_frise: { h: 56 }, mur_grave: { h: 56 }, mur_hieroglyphes: { h: 46 }, mur_moussu: { h: 56 }, mur_niche: { h: 58 }, mur_peint: { h: 56 }, mur_scarabee: { h: 44 }, mur_soleil: { h: 42 }, mur_sombre: { h: 58 }, niche: { h: 58 }, niche_statue: { h: 76 }, obelisque: { h: 88 }, obelisque_bleu: { h: 70 }, obelisque_cristal: { h: 80 }, offrandes: { h: 28 }, ossements: { h: 14 }, panneau: { h: 32 }, paves: [64, 64], piedestal_orbe: { h: 50 }, pierre_runique: { h: 52 }, pilier_brise: { h: 50 }, pilier_grave: { h: 76 }, pilier_lotus: { h: 82 }, pilier_peint: { h: 82 }, pilier_roche: { h: 74 }, portail_roche: { h: 82 }, porte_anubis: { h: 72 }, porte_arche: { h: 86 }, porte_bannieres: { h: 98 }, porte_gardiens: { h: 98 }, porte_grotte: { h: 86 }, porte_ruine: { h: 82 }, porte_scellee: { h: 92 }, porte_temple: { h: 92 }, porte_tombeau: { h: 72 }, porte_torches: { h: 92 }, portique: { h: 66 }, rideau: { h: 46 }, rocher_mousse: { h: 30 }, rochers: { h: 34 }, sable: [128, 128], sanctuaire_orbe: { h: 74 }, sarcophage: { h: 62 }, sarcophage_roche: { h: 72 }, scarabee_or: { h: 54 }, socle: { h: 22 }, sol_roche: [128, 128], source: { h: 46 }, source_grotte: { h: 52 }, stalagmite: { h: 50 }, stalagmites: { h: 40 }, statue_scarabee: { h: 48 }, stele: { h: 50 }, stele_lumineuse: { h: 60 }, stele_magique: { h: 54 }, tambour: { h: 34 }, terre_sombre: [128, 128], tombeau: { h: 58 }, tonneau: { h: 24 }, torche: { h: 46 }, torche_anubis: { h: 50 }, torche_murale: { h: 42 }, torche_plantee: { h: 46 }, torche_trepied: { h: 48 }, tresor_sable: { h: 30 }, vase: { h: 30 }, vasque: { h: 26 } },
  };
  const tailleDe = (d, n) => (TAILLES_DOSSIER[d] && TAILLES_DOSSIER[d][n]) || TAILLE[n];
  // lumières des décors dessinés, dans le noir des cartes sombres : [x, y] en fraction de l'image, rayon, couleur ;
  // FLAMMES : leur lumière vacille, des flammèches et des étincelles s'en échappent (gfx/ambient.js)
  const LUMIERES = {
    bebe: { couveuse: [[0.5, 0.28, 30]], dome_bulles: [[0.5, 0.5, 40, 'rgba(160,220,255,0.45)']], fontaine_bulles: [[0.5, 0.6, 30, 'rgba(150,220,255,0.45)']], kiosque_livres: [[0.92, 0.55, 26]],
      lampadaire: [[0.3, 0.22, 38]], lampe_etoile: [[0.5, 0.25, 40, 'rgba(255,230,140,0.6)']], lampe_fleur: [[0.5, 0.18, 34, 'rgba(255,230,170,0.55)']], lanterne_branche: [[0.45, 0.55, 32]],
      lanterne_coeur: [[0.68, 0.35, 34, 'rgba(255,150,190,0.55)']], portail: [[0.1, 0.45, 26], [0.9, 0.45, 26]] },
    desert: { balise: [[0.35, 0.12, 30, 'rgba(255,150,60,0.6)']], balise_cristal: [[0.5, 0.15, 40, 'rgba(110,200,255,0.55)']], bloc_circuits: [[0.5, 0.6, 24, 'rgba(110,200,255,0.45)']], carte: [[0.5, 0.4, 22, 'rgba(120,255,170,0.4)']],
      cristal: [[0.5, 0.45, 40, 'rgba(110,190,255,0.55)']], obelisque_losange: [[0.5, 0.25, 26, 'rgba(110,200,255,0.5)']], pilier_circuits: [[0.5, 0.5, 26, 'rgba(110,200,255,0.45)']], portail: [[0.5, 0.5, 44, 'rgba(110,255,170,0.5)']],
      porte_cristal: [[0.5, 0.45, 40, 'rgba(110,220,255,0.55)']], poteau_orbe: [[0.5, 0.06, 24, 'rgba(110,200,255,0.5)']], rocher_ecran: [[0.5, 0.45, 26, 'rgba(110,200,255,0.45)']], rocher_glitch: [[0.5, 0.5, 30, 'rgba(140,110,255,0.5)']],
      stele_holo: [[0.5, 0.4, 36, 'rgba(110,220,255,0.55)']], stele_orbe: [[0.5, 0.3, 26, 'rgba(110,220,200,0.45)']], teleporteur: [[0.5, 0.55, 44, 'rgba(110,230,255,0.55)']], tour_antenne: [[0.5, 0.15, 34, 'rgba(110,220,255,0.5)']] },
    grotte: { ankh_lumineux: [[0.5, 0.3, 44, 'rgba(255,240,120,0.6)']], autel_soleil: [[0.15, 0.25, 34], [0.85, 0.25, 34]], braises: [[0.5, 0.4, 30]], brasero: [[0.5, 0.15, 44]], brasero_anubis: [[0.5, 0.12, 48]], brasero_colonne: [[0.5, 0.14, 48]], champignons: [[0.5, 0.4, 26, 'rgba(170,120,255,0.45)']], colonne_cristaux: [[0.5, 0.5, 40, 'rgba(140,140,255,0.45)']], coupe_feu: [[0.5, 0.16, 52]], cristaux: [[0.5, 0.5, 30, 'rgba(110,170,255,0.5)']], cristaux_violets: [[0.5, 0.5, 34, 'rgba(170,120,255,0.5)']], flamme_bleue: [[0.5, 0.14, 44, 'rgba(120,190,255,0.6)']], fleurs_lanternes: [[0.5, 0.35, 32, 'rgba(220,140,255,0.5)']], fontaine_lotus: [[0.5, 0.5, 46, 'rgba(110,230,240,0.5)']], lampe: [[0.5, 0.62, 40]], lanterne: [[0.62, 0.72, 36]], obelisque_bleu: [[0.5, 0.3, 30, 'rgba(110,190,255,0.5)']], obelisque_cristal: [[0.5, 0.4, 40, 'rgba(120,180,255,0.5)']], piedestal_orbe: [[0.5, 0.12, 28, 'rgba(120,180,255,0.5)']], pierre_runique: [[0.5, 0.4, 32, 'rgba(110,200,255,0.5)']], porte_torches: [[0.12, 0.3, 38], [0.88, 0.3, 38]], sanctuaire_orbe: [[0.5, 0.45, 44, 'rgba(255,200,90,0.55)']], source: [[0.5, 0.6, 30, 'rgba(110,200,240,0.4)']], source_grotte: [[0.5, 0.6, 34, 'rgba(110,200,240,0.4)']], stele_lumineuse: [[0.5, 0.45, 40, 'rgba(255,210,120,0.5)']], stele_magique: [[0.5, 0.45, 36, 'rgba(110,200,255,0.5)']], torche: [[0.55, 0.12, 40]], torche_anubis: [[0.6, 0.12, 40]], torche_murale: [[0.5, 0.2, 38]], torche_plantee: [[0.5, 0.12, 40]], torche_trepied: [[0.5, 0.12, 42]] } };
  const FLAMMES = new Set(['autel_soleil', 'braises', 'brasero', 'brasero_anubis', 'brasero_colonne', 'coupe_feu', 'lampe', 'lanterne', 'porte_torches', 'torche', 'torche_anubis', 'torche_murale', 'torche_plantee', 'torche_trepied']);
  const T = DW.Textures = { img: {}, fini: false, LISTE, TAILLE };
  const nav = typeof Image !== 'undefined' && typeof document !== 'undefined';
  const racine = !nav ? '' : window.RACINE_JEU != null ? window.RACINE_JEU : document.currentScript ? document.currentScript.src.replace(/js\/gfx\/textures\.js(\?.*)?$/, '') : '';   // (RACINE_JEU : js/scripts.js ; un paquet n'a pas le nom de ce fichier)
  const pix = {}, motifs = {};
  const nomDe = cle => cle.split('/')[1];

  // chargement : la copie allégée, sinon l'original, sinon rien (null) ; main.js attend la fin avant de lancer le jeu
  // (adresse versionnée, ?v=<empreinte> : le service worker la sert depuis son cache sans rien redemander au serveur,
  //  sw.js ; 10 images à la fois ; un échec est retenté deux fois : un petit serveur qui reçoit 100 demandes d'un coup
  //  en refuse une partie)
  const charger1 = url => new Promise(ok => { const im = new Image(); im.onload = () => ok(im.naturalWidth ? im : null); im.onerror = () => ok(undefined); setTimeout(() => ok(undefined), 40000); im.src = url; });
  const charger = async (url, absent) => { for (let k = 0; k < 3; k++) { const im = await charger1(url); if (im !== undefined || absent) return im || null; await new Promise(r => setTimeout(r, 400 * (k + 1))); } return null; };
  // une image : la copie allégée (jeu/, en PNG ou en WebP : EXT), sinon l'original
  const chargerImage = async (d, n) => {
    const f = d + '/jeu/' + n + '.' + (EXT[d] || 'png');
    T.img[d + '/' + n] = (await charger(racine + 'assets/' + f + DW.versionImage(f))) || (await charger(racine + 'assets/' + d + '/' + n + '.png', true));
  };
  const ouvriers = (taches, k) => Promise.all(Array.from({ length: k }, async () => { while (taches.length) await taches.shift()(); }));
  // (les Digimon dessinés pendant le chargement, sur l'écran titre, l'ont été avec leur dessin de secours : on les oublie)
  T.charge = !nav ? Promise.resolve() : ouvriers(Object.entries(LISTE).flatMap(([d, noms]) => noms.map(n => () => chargerImage(d, n))), 10)
    .then(() => { T.fini = true; objetsCommuns(); objets(LISTE); DW.Sprites.oublier(); });
  const enCours = {};
  T.dossier = d => enCours[d] || (enCours[d] = !nav || !TARDIFS[d] ? Promise.resolve()
    : T.charge.then(() => ouvriers(TARDIFS[d].map(n => () => chargerImage(d, n)), 6)).then(() => objets({ [d]: TARDIFS[d] })));
  if (nav) T.charge.then(() => { for (const d in TARDIFS) T.dossier(d); });

  T.a = cle => T.img[cle] || null;
  // thème de la carte (sans la saison) ; null = pas d'images communes sur cette carte
  const themeDe = map => {
    if (!map || map.indoor || (DW.MAPS && [...CARTES_SANS].some(id => DW.MAPS[id] === map))) return null;
    const th = (map.theme || '').split('~')[0];
    if (th) return SANS.has(th) ? null : CHOIX[th] ? th : 'autre';
    return map.ambient === 'forest' ? 'foret' : map.climate === 'beach' ? 'beach' : 'autre';
  };
  T.themeDe = themeDe;
  // la texture d'un RÔLE de sol pour cette carte : d'abord le dossier propre à la carte (même nom que le rôle), puis
  // l'image commune choisie pour son thème ; null = le dessin par code
  T.sol = (map, role) => {
    if (map && map.textures) { const P = T.pixels(map.textures + '/' + ((ROLES[map.textures] || {})[role] || role)); if (P) return P; }
    // (une carte d'intérieur avec son dossier — la grotte — prend les sols communs qui lui manquent : solCommun)
    const th = themeDe(map) || (map && map.solCommun ? 'autre' : null); if (!th) return null;
    const n = (CHOIX[th] && CHOIX[th][role]) || DEFAUT[role];
    return n ? T.pixels('commun/' + n) : null;
  };
  // image d'arbre pour (type, variante), prête à poser dans le cadre de l'objet (w x h, agrandi S fois) ; null sinon
  const arbres = {};
  // ARBRE DE CENDRES (volcans) : l'image passée en gris cendre, pixel par pixel (la neige devient de la cendre, les branches
  // du charbon ; sans « filter » de canvas : il manque à certains Safari)
  function cendre(cv) {
    const x = cv.getContext('2d'), D = x.getImageData(0, 0, cv.width, cv.height), d = D.data;
    for (let i = 0; i < d.length; i += 4) { const l = 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2]; d[i] = l * 0.5 + 24; d[i + 1] = l * 0.45 + 19; d[i + 2] = l * 0.41 + 17; }
    x.putImageData(D, 0, 0);
  }
  T.arbre = (kind, v, w, h, S) => {
    const n = nomArbre(kind, v); if (!n) return null;
    const im = T.a('commun/' + n); if (!im) return null;
    const k = kind + v; if (arbres[k]) return arbres[k];
    const f = Math.min(w / im.naturalWidth, h / im.naturalHeight), dw = im.naturalWidth * f, dh = im.naturalHeight * f, q = (DW.Art.HD || 1) * (S || 1);
    const net = reduire(im, 0, 0, im.naturalWidth, im.naturalHeight, Math.max(1, Math.round(dw * q)), Math.max(1, Math.round(dh * q)));
    if (kind === 'cendre') cendre(net);
    return (arbres[k] = { net, x: (w - dw) / 2, y: h - dh, w: dw, h: dh });
  };
  // fleurs du sol : quelle image pour cette case (null = pas d'images) ; selon le thème (des champs, des sous-bois...)
  const FLEURS = { autre: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], foret: [1, 4, 5, 8, 10, 7], deep: [4, 5, 8, 10], misty: [5, 8, 10], meadow: [2, 3, 6, 9, 7, 1], spring: [1, 2, 3, 6, 7, 8, 9, 10],
    farm: [3, 6, 9, 2], town: [2, 6, 7, 9, 3], beach: [6, 3, 9], autumn: [3, 9, 4], savanna: [3, 9], desert: [3], canyon: [3, 9] };
  T.fleur = (map, tx, ty, deco) => {
    const th = themeDe(map); if (!th) return null;
    // (le jeu peignait ces cases très serrées : on n'en garde qu'une partie, sinon le sol devient un champ de champignons)
    const h = DW.Art.hash(tx, ty, 779);
    if (deco === 'mushrooms') {
      if (h >= 0.22) return '';
      const C = th === 'deep' || th === 'misty' ? ['champi_bleu', 'champi_violet', 'champi_vert', 'champi_blancs'] : ['amanites', 'amanites2', 'cepes', 'girolles', 'champi_blancs', 'amanites'];
      const n = DW.Art.hash(tx, ty, 780) < 0.06 ? 'rond_sorcieres' : C[Math.floor(DW.Art.hash(tx, ty, 781) * C.length) % C.length];
      return T.a('commun/' + n) ? 'tex_commun_' + n : '';
    }
    if (h > 0.5) return '';
    const L = FLEURS[th] || FLEURS.autre, n = 'fleur_' + L[Math.floor(DW.Art.hash(tx, ty, 778) * L.length) % L.length];
    return T.a('commun/' + n) ? 'tex_commun_' + n : null;
  };
  T.aArbre = (kind, v) => { const n = nomArbre(kind, v); return !!(n && T.a('commun/' + n)); };
  // (atelier des cartes : combien d'images différentes pour un objet du jeu, et le nom de celle d'une variante)
  T.variantes = kind => (ARBRES[kind] || []).length;
  T.nomImage = (kind, v) => nomArbre(kind, v);
  // réduction par moitiés successives (une grande image réduite d'un coup devient granuleuse)
  T.reduire = (im, w, h) => reduire(im, 0, 0, im.naturalWidth || im.width, im.naturalHeight || im.height, w, h);
  function reduire(im, sx, sy, sw, sh, w, h) {
    let src = im, ox = sx, oy = sy, cw = sw, ch = sh;
    while (cw / 2 >= w && ch / 2 >= h) {
      const n = DW.Art.canvas(Math.ceil(cw / 2), Math.ceil(ch / 2)), x = n.getContext('2d');
      x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high'; x.drawImage(src, ox, oy, cw, ch, 0, 0, n.width, n.height);
      src = n; ox = 0; oy = 0; cw = n.width; ch = n.height;
    }
    const out = DW.Art.canvas(w, h), x = out.getContext('2d');
    x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high'; x.drawImage(src, ox, oy, cw, ch, 0, 0, w, h);
    return out;
  }
  // pixels d'une texture à sa taille de jeu (ou w × h) ; null si l'image manque
  T.pixels = (cle, w, h) => {
    const im = T.a(cle); if (!im) return null;
    const t = tailleDe(cle.split('/')[0], nomDe(cle)); w = w || (Array.isArray(t) ? t[0] : 64); h = h || (Array.isArray(t) ? t[1] : 64);
    const k = cle + '@' + w + 'x' + h; if (pix[k]) return pix[k];
    const cv = reduire(im, 0, 0, im.naturalWidth, im.naturalHeight, w, h);
    return (pix[k] = { w, h, d: cv.getContext('2d').getImageData(0, 0, w, h).data, cv });
  };
  // couleur d'une texture qui se répète (coordonnées quelconques) ; [r, g, b, opacité 0 à 255]
  T.lit = (P, x, y) => { const X = ((Math.floor(x) % P.w) + P.w) % P.w, Y = ((Math.floor(y) % P.h) + P.h) % P.h, o = (Y * P.w + X) * 4, d = P.d; return [d[o], d[o + 1], d[o + 2], d[o + 3]]; };
  // motif (canvas.createPattern) pour remplir une forme avec la texture
  T.motif = (c, cle) => { const P = T.pixels(cle); if (!P) return null; return motifs[cle] || (motifs[cle] = c.createPattern(P.cv, 'repeat')); };
  // l'objet qui remplace « kind » sur cette carte (ou null) ; la variante dépend de la case
  // ... et par thème de carte (dossier commun) : sur la plage, les dalles numériques deviennent la borne de la planche Plage
  const PAR_THEME = { beach: { datapanel: ['plage_borne'] } };
  T.objet = (map, kind, tx, ty) => {
    const th = map && !map.textures ? themeDe(map) : null, RT = th && PAR_THEME[th] && PAR_THEME[th][kind];
    if (RT) { const d = RT.filter(n => T.a('commun/' + n)); if (d.length) return 'tex_commun_' + d[Math.floor(DW.Art.hash(tx, ty, 777) * d.length) % d.length]; }
    const R = map && map.textures && REMPLACE[map.textures] && REMPLACE[map.textures][kind]; if (!R) return null;
    const dispo = R.filter(n => T.a(map.textures + '/' + n)); if (!dispo.length) return null;
    return 'tex_' + map.textures + '_' + dispo[Math.floor(DW.Art.hash(tx, ty, 777) * dispo.length) % dispo.length];
  };
  // contour utile d'une image (pixels assez opaques) : on enlève le fond transparent autour
  function cadre(im) {
    const s = Math.max(1, Math.floor(Math.max(im.naturalWidth, im.naturalHeight) / 400)), w = Math.ceil(im.naturalWidth / s), h = Math.ceil(im.naturalHeight / s);
    const cv = DW.Art.canvas(w, h), x = cv.getContext('2d'); x.drawImage(im, 0, 0, w, h);
    const d = x.getImageData(0, 0, w, h).data; let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let y = 0; y < h; y++) for (let i = 0; i < w; i++) if (d[(y * w + i) * 4 + 3] > 40) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 < 0) return [0, 0, im.naturalWidth, im.naturalHeight];
    return [x0 * s, y0 * s, Math.min(im.naturalWidth, (x1 + 1) * s) - x0 * s, Math.min(im.naturalHeight, (y1 + 1) * s) - y0 * s];
  }
  // les décors du jeu dessinés avec les images du joueur (arbres, Grand Arbre) : leur taille de jeu
  function objetsCommuns() {
    const OBJ = DW.World && DW.World.OBJ; if (!OBJ) return;
    // les décors dessinés pendant le chargement (écran titre...) l'ont été avec leur dessin de secours : on les oublie
    for (const kind in ARBRES) DW.World.oublierObjet(kind);
    // chaque décor dessiné prend sa hauteur de jeu (HAUTEUR) : on agrandit sa boîte (l'image y est posée en bas, centrée) ;
    // chaque variante à la même hauteur (les images d'un arbre, d'une saison à l'autre, n'ont pas les mêmes proportions)
    for (const kind in HAUTEUR) {
      const O = OBJ[kind]; if (!O) continue;
      const bw = typeof O.w === 'function' ? O.w(0) : O.w, bh = typeof O.h === 'function' ? O.h(0) : O.h;
      const ech = (ARBRES[kind] || []).map(n => { const im = T.a('commun/' + n); return im ? HAUTEUR[kind] * HEROS / (im.naturalHeight * Math.min(bw / im.naturalWidth, bh / im.naturalHeight)) : null; });
      if (ech[0] == null) continue;
      O.scale = ech[0]; O.echelles = ech.map(e => e || ech[0]);
    }
    const GA = OBJ.grandarbre;
    if (GA && GA.porte && T.aArbre('_grandarbre', 0) && !GA._image) {
      GA._image = true;
      GA.paint = (x, v) => {
        const A = T.arbre('_grandarbre', 0, 132, 150, GA.scale || 1);
        x.fillStyle = 'rgba(14,26,16,0.4)'; x.beginPath(); x.ellipse(66, 146, 60, 5, 0, 0, 7); x.fill();
        x.imageSmoothingEnabled = true; x.drawImage(A.net, A.x, A.y, A.w, A.h);
        GA.porte(x, v);
      };
      DW.World.oublierObjet('grandarbre');
    }
  }
  // chaque image d'objet devient un objet du jeu « tex_<dossier>_<nom> », à sa taille de jeu (TAILLE), avec sa lumière
  function objets(listes) {
    const OBJ = DW.World && DW.World.OBJ; if (!OBJ) return;
    for (const [d, noms] of Object.entries(listes)) for (const n of noms) {
      const im = T.a(d + '/' + n), t = tailleDe(d, n); if (!im || !t || Array.isArray(t)) continue;
      const [sx, sy, sw, sh] = cadre(im), w = Math.round(t.w || t.h * sw / sh), h = Math.round(t.h || t.w * sh / sw);
      let net = null;
      const L = LUMIERES[d] && LUMIERES[d][n];
      OBJ['tex_' + d + '_' + n] = { w, h, n: 1, noOutline: true, image: true,
        ...(L ? { lights: L.map(([fx, fy, r, c]) => [fx * w, fy * h, r, c]), fire: FLAMMES.has(n) ? [L[0][0] * w, L[0][1] * h + 3] : undefined } : {}),
        paint(x) { const k = DW.Art.HD || 1; net = net || reduire(im, sx, sy, sw, sh, w * k, h * k); x.drawImage(net, 0, 0, w, h); },
        draw: dd => dd.rect(0, 0, 1, 1, 'rgba(0,0,0,0)') };
    }
  }
})();
