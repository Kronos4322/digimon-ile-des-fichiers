'use strict';
// =====================================================================
//  TEXTURES DESSINÉES (assets/<dossier>/*.png, fabriquées avec ChatGPT) : chaque image présente remplace le dessin
//  par code de l'élément correspondant ; une image absente = le dessin par code reste (voir assets/volcan/LISEZ-MOI.txt).
//  Le jeu charge d'abord la copie allégée (assets/<dossier>/jeu/, faite par dev/optimiser_textures.py), sinon l'original.
//  Quelle que soit la taille de l'image, elle est mise à l'échelle du jeu (TAILLE, en pixels du jeu : 1 case = 16) ;
//  les objets sont d'abord recadrés sur leur contenu (fond transparent enlevé).
//  Une carte choisit son dossier avec map.textures (ex. 'volcan' : maps/miharashi.js). Toutes les cartes extérieures
//  prennent aussi le dossier COMMUN (assets maison du joueur : herbes, terres, sables, eaux, arbres), selon leur thème
//  (CHOIX) ; les arbres du jeu (variantes de saison comprises) sont dessinés avec ses images (ARBRES).
//  Utilisé par : gfx/terrain.js (sol, falaises, escaliers, lave, objets), gfx/premium.js (cratère), game/lave.js (coulées).
// =====================================================================
(function () {
  const SOLS = ['herbe_claire', 'herbe_verte', 'sable_terre', 'herbe_seche', 'herbe_fleurie', 'herbe_dense', 'terre_claire', 'herbe_haute', 'herbe_terre',
    'sable_dunes', 'terre_brune', 'terre_sombre', 'sable_plage', 'terre_savane', 'terre_cailloux', 'terre_craquelee', 'sable_desert', 'eau_mer', 'eau_douce'];
  const LISTE = {
    commun: [...SOLS, 'arbre_sapin', 'arbre_cerisier', 'arbre_chene_clair', 'arbre_saule', 'arbre_mauve', 'arbre_chene', 'arbre_vert', 'arbre_vert_vif', 'arbre_bouleau',
      'arbre_fleurs', 'arbre_automne_brun', 'arbre_erable_orange', 'arbre_erable_rouge', 'arbre_mi_automne', 'arbre_bouleau_automne', 'arbre_mi_automne', 'arbre_chene_automne', 'arbre_neige_tordu', 'arbre_neige_bouleau', 'arbre_neige_rond', 'arbre_neige_chene',
      'arbre_neige_sapin', 'arbre_neige_sapin3', 'arbre_neige_nu',
      'buisson', 'buisson_baies', 'buisson_baies2', 'buisson_fleuri', 'amanites', 'fougere_1', 'fougere_2', 'rocher_mousse', 'souche', 'tronc_couche', 'racines',
      'panneau', 'monolithe', 'sanctuaire', 'totem', 'fleur_cristal', 'cristaux', 'source',
      'fleur_1', 'fleur_2', 'fleur_3', 'fleur_4', 'fleur_5', 'fleur_6', 'fleur_7', 'fleur_8', 'fleur_9', 'fleur_10',
      'amanites2', 'champi_violet', 'champi_bleu', 'cepes', 'girolles', 'rond_sorcieres', 'souche_champignons', 'champi_blancs', 'champi_vert', 'tuyau', 'lampadaire', 'pierre_runique', 'cairn', 'eboulis', 'lanterne_pierre', 'borne_bleue', 'borne_rouge', 'dalle_runique',
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
      'mont_gravier', 'mont_roche_craquelee', 'mont_herbe_alpine', 'mont_terre_seche'],
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
    mont_gravier: [128, 128], mont_roche_craquelee: [128, 128], mont_herbe_alpine: [128, 128], mont_terre_seche: [128, 128],
  };
  // objets du jeu remplacés par une image (par dossier) : un nom, ou plusieurs (variante choisie selon la case)
  // ARBRES DU JEU dessinés avec les images du dossier commun : [type][variante] -> image (variantes de OBJ.tree : 0-2 verts,
  // 3 chêne, 4 bouleau, 5-7 automne, 8 vert profond, 9 moussu, 10-11 hiver, 12-13 en fleurs, 14 nu, 15 nu enneigé ;
  // chêne et bouleau : 0 été, 1 automne, 2 nu, 3 nu enneigé ; sapin : 0-2, 3 enneigé — gfx/meteo.js choisit selon la saison)
  const ARBRES = {
    tree: ['arbre_vert', 'arbre_vert_vif', 'arbre_chene_clair', 'arbre_chene', 'arbre_bouleau', 'arbre_erable_orange', 'arbre_erable_rouge', 'arbre_mi_automne',
      'arbre_chene', 'arbre_chene_clair', 'arbre_neige_rond', 'arbre_neige_sapin3', 'arbre_cerisier', 'arbre_fleurs', 'arbre_automne_brun', 'arbre_neige_nu'],
    oak: ['arbre_chene', 'arbre_chene_automne', 'arbre_automne_brun', 'arbre_neige_chene'],
    birch: ['arbre_bouleau', 'arbre_bouleau_automne', 'arbre_automne_brun', 'arbre_neige_bouleau'],
    pine: ['mont_sapin', 'arbre_sapin', 'mont_sapin', 'arbre_neige_sapin'],
    // (le joueur veut SES arbres partout : toutes les autres espèces d'arbres du jeu prennent l'image la plus proche ;
    //  seuls les palmiers et cocotiers restent, faute d'image)
    saule: ['arbre_saule'], pintordu: ['arbre_sapin'], bigtree: ['arbre_chene', 'arbre_chene_clair'],
    jungletree: ['arbre_vert', 'arbre_chene', 'arbre_vert_vif'], cycad: ['arbre_vert_vif', 'arbre_vert'], mangrove: ['arbre_saule'], swamptree: ['arbre_saule'],
    acacia: ['arbre_chene_clair', 'arbre_mi_automne'], baobab: ['arbre_chene'], deadtree: ['arbre_automne_brun', 'arbre_neige_tordu'],
    candytree: ['arbre_cerisier', 'arbre_mauve', 'arbre_fleurs'],
    // DÉCORS : buissons, fougères, rochers, souches, troncs, champignons lumineux, objets de forêt
    bush: ['buisson', 'buisson_baies', 'buisson_fleuri', 'buisson_baies2'], hedge: ['buisson'], junglebush: ['buisson', 'buisson_baies2'],
    buissonfleuri: ['buisson_fleuri'], rosebush: ['fleur_7'], fern: ['fougere_1', 'fougere_2'], bigfern: ['fougere_1', 'fougere_2'], fougeres: ['fougere_2', 'fougere_1'],
    mossrock: ['rocher_mousse'], rock: ['rocher_mousse'], boulder: ['eboulis', 'rocher_mousse'], rochersmousse: ['rocher_mousse', 'eboulis'],
    stump: ['souche'], giantstump: ['souche', 'souche_champignons'], log: ['tronc_couche'], hollowlog: ['tronc_couche'], troncouche: ['tronc_couche'], treeroots: ['racines'],
    glowshroom: ['champi_violet', 'champi_bleu'], giantshroom: ['champi_bleu', 'champi_vert'], champignons: ['cepes', 'girolles', 'champi_blancs'],
    monolith: ['monolithe', 'pierre_runique'], totem: ['totem'], pipe: ['tuyau', 'tuyau'], lamp: ['lampadaire'], antenna: ['borne_bleue', 'borne_rouge'],
    datapanel: ['dalle_runique', 'dalle_runique'], bench: ['banc_dossier'], steplog: ['banc_rondin'], stonelantern: ['lanterne_pierre'], cairn: ['cairn'], rubble: ['eboulis'],
    crystal: ['cristaux'], datacrystal: ['cristaux'], sign: ['panneau'], roadsign: ['panneau'], flowerbed: ['fleur_2', 'fleur_6', 'fleur_9', 'fleur_3'],
    giantflower: ['fleur_cristal'], spring: ['source'], shrine: ['sanctuaire'],
    // ville : fontaines, puits, sacs, tonneaux, pots (seulement les images vues de face ; celles vues de biais gardent
    // l'ancien dessin — règle du joueur ; la fontaine du Village des Yokomon, à sec puis qui coule, garde aussi le sien)
    well: ['ville_puits_treuil'], bigfountain: ['ville_fontaine_etages', 'ville_fontaine_vasque', 'ville_fontaine_octogone'],
    barrel: ['maison_tonneau', 'ville_tonneaux'], sacks: ['ville_sacs'], pottedtree: ['ville_pot_arbuste', 'ville_buis'],
    // intérieurs (vus de face)
    bed: ['maison_lit'], wardrobe: ['maison_armoire'], bookshelf: ['maison_bibliotheque', 'maison_bibliotheque_basse'],
    floorlamp: ['maison_lampadaire'], frame: ['maison_tableau'], stool: ['maison_tabouret'], shelf: ['maison_etagere_murale'],
    sidetable: ['maison_chevet'], plant: ['maison_plante', 'maison_vase_fleurs'], fridge: ['maison_frigo'],
    toybox: ['maison_coffre_jouets'], desk: ['maison_bureau'], cushion: ['maison_coussins'], bigrug: ['maison_tapis'],
    _grandarbre: ['arbre_chene'],   // (le Grand Arbre de la Clairière : voir objets(), son passage reste dessiné par-dessus)
  };
  // TAILLES : hauteur de chaque décor dessiné, en HAUTEURS DE HÉROS (le héros : 34 px du jeu) ; le joueur : « les arbres
  // doivent être 3 fois plus grands que le personnage »
  const HEROS = 34;
  const HAUTEUR = {
    tree: 3, oak: 3, birch: 3.1, pine: 3.3, saule: 3, pintordu: 3, bigtree: 4, jungletree: 3, cycad: 2.5, mangrove: 3, swamptree: 3, acacia: 2.8, baobab: 3.5, deadtree: 2.6, candytree: 2.6,
    bush: 0.85, hedge: 0.85, junglebush: 0.9, buissonfleuri: 0.85, rosebush: 0.8, flowerbed: 0.55, fern: 0.75, bigfern: 0.9, fougeres: 0.8, giantflower: 1.4,
    glowshroom: 0.9, giantshroom: 1.7, champignons: 0.5, mossrock: 0.8, rock: 0.6, boulder: 1, rochersmousse: 1, rubble: 0.8, cairn: 0.9,
    stump: 0.6, giantstump: 1, log: 0.5, hollowlog: 0.55, troncouche: 0.6, treeroots: 1, monolith: 1.6, totem: 1.7, crystal: 1, datacrystal: 1.3,
    sign: 1.1, roadsign: 1.2, spring: 1.1, shrine: 1.5, pipe: 0.9, lamp: 1.7, antenna: 1.3, stonelantern: 1.1, datapanel: 0.8, bench: 0.6, steplog: 0.4,
  };
  const nomArbre = (kind, v) => { const L = ARBRES[kind]; return L ? (v < L.length ? L[v] : L[v % L.length]) : null; };
  // SOLS PAR THÈME (rôle -> image) : herbe, chemin (terre), sable, eaux (herbe_seche : seulement un dossier de carte ; une
  // texture différente case par case dessinait des carrés)
  const DEFAUT = { herbe: 'herbe_verte', herbe_seche: null, chemin: 'terre_claire', sable: 'sable_plage', eau_mer: 'eau_mer', eau_douce: 'eau_douce' };
  const CHOIX = {
    foret: { herbe: 'herbe_verte', chemin: 'terre_brune' }, spring: {}, meadow: { herbe: 'herbe_claire' },
    misty: { herbe: 'herbe_dense', chemin: 'terre_sombre' }, deep: { herbe: 'herbe_dense', chemin: 'terre_sombre' }, autumn: { herbe: 'herbe_seche', chemin: 'terre_brune' },
    town: {}, farm: { chemin: 'terre_brune' }, beach: { herbe: 'herbe_claire', chemin: 'sable_terre' }, nursery: { herbe: 'herbe_fleurie' }, toy: { herbe: 'herbe_haute' },
    mountain: { herbe: 'herbe_terre', chemin: 'terre_cailloux' }, savanna: { herbe: 'herbe_seche', chemin: 'terre_savane', sable: 'sable_desert' },
    jungle: { herbe: 'herbe_dense', chemin: 'terre_sombre' }, dino: { herbe: 'herbe_dense', chemin: 'terre_brune' }, mangrove: { herbe: 'herbe_dense', chemin: 'terre_sombre' },
    beetle: { chemin: 'terre_brune' }, canyon: { herbe: 'herbe_seche', chemin: 'terre_craquelee', sable: 'sable_desert' },
    desert: { herbe: 'herbe_seche', chemin: 'terre_craquelee', sable: 'sable_dunes' }, sandtemple: { sable: 'sable_desert', chemin: 'terre_craquelee' },
    yokovillage: {}, miharashi: { herbe: 'herbe_dense', chemin: 'terre_brune' },
  };
  // ambiances qui gardent leur dessin (sombres, enneigées, mécaniques) ; le Terrain d'entraînement reste tel quel
  const SANS = new Set(['cave', 'lavacave', 'sewer', 'snow', 'summit', 'icecave', 'swamp', 'fog', 'cemetery', 'trash', 'factory', 'volcano']);
  const CARTES_SANS = new Set(['gym']);
  const REMPLACE = { volcan: { lavarock: ['rocher_magma'], steamvent: ['fumerolle'], aiguille: ['pic_1', 'pic_2', 'pic_3'] } };
  const T = DW.Textures = { img: {}, fini: false, LISTE, TAILLE };
  const nav = typeof Image !== 'undefined' && typeof document !== 'undefined';
  const racine = nav && document.currentScript ? document.currentScript.src.replace(/js\/gfx\/textures\.js(\?.*)?$/, '') : '';
  const pix = {}, motifs = {};
  const nomDe = cle => cle.split('/')[1];

  // chargement : la copie allégée, sinon l'original, sinon rien (null) ; main.js attend la fin avant de lancer le jeu
  // (6 images à la fois, comme un navigateur sur un même serveur ; un échec est retenté deux fois : un petit serveur qui
  //  reçoit 100 demandes d'un coup en refuse une partie)
  const charger1 = url => new Promise(ok => { const im = new Image(); im.onload = () => ok(im.naturalWidth ? im : null); im.onerror = () => ok(undefined); setTimeout(() => ok(undefined), 40000); im.src = url; });
  const charger = async (url, absent) => { for (let k = 0; k < 3; k++) { const im = await charger1(url); if (im !== undefined || absent) return im || null; await new Promise(r => setTimeout(r, 400 * (k + 1))); } return null; };
  const taches = Object.entries(LISTE).flatMap(([d, noms]) => noms.map(n => async () => {
    T.img[d + '/' + n] = (await charger(racine + 'assets/' + d + '/jeu/' + n + '.png')) || (await charger(racine + 'assets/' + d + '/' + n + '.png', true));
  }));
  const ouvrier = async () => { while (taches.length) await taches.shift()(); };
  T.charge = !nav ? Promise.resolve() : Promise.all([1, 2, 3, 4, 5, 6].map(ouvrier)).then(() => { T.fini = true; objets(); });

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
    if (map && map.textures) { const P = T.pixels(map.textures + '/' + role); if (P) return P; }
    const th = themeDe(map); if (!th) return null;
    const n = (CHOIX[th] && CHOIX[th][role]) || DEFAUT[role];
    return n ? T.pixels('commun/' + n) : null;
  };
  // image d'arbre pour (type, variante), prête à poser dans le cadre de l'objet (w x h, agrandi S fois) ; null sinon
  const arbres = {};
  T.arbre = (kind, v, w, h, S) => {
    const n = nomArbre(kind, v); if (!n) return null;
    const im = T.a('commun/' + n); if (!im) return null;
    const k = kind + v; if (arbres[k]) return arbres[k];
    const f = Math.min(w / im.naturalWidth, h / im.naturalHeight), dw = im.naturalWidth * f, dh = im.naturalHeight * f, q = (DW.Art.HD || 1) * (S || 1);
    const net = reduire(im, 0, 0, im.naturalWidth, im.naturalHeight, Math.max(1, Math.round(dw * q)), Math.max(1, Math.round(dh * q)));
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
  // réduction par moitiés successives (une grande image réduite d'un coup devient granuleuse)
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
    const t = TAILLE[nomDe(cle)]; w = w || (Array.isArray(t) ? t[0] : 64); h = h || (Array.isArray(t) ? t[1] : 64);
    const k = cle + '@' + w + 'x' + h; if (pix[k]) return pix[k];
    const cv = reduire(im, 0, 0, im.naturalWidth, im.naturalHeight, w, h);
    return (pix[k] = { w, h, d: cv.getContext('2d').getImageData(0, 0, w, h).data, cv });
  };
  // couleur d'une texture qui se répète (coordonnées quelconques) ; [r, g, b, opacité 0 à 255]
  T.lit = (P, x, y) => { const X = ((Math.floor(x) % P.w) + P.w) % P.w, Y = ((Math.floor(y) % P.h) + P.h) % P.h, o = (Y * P.w + X) * 4, d = P.d; return [d[o], d[o + 1], d[o + 2], d[o + 3]]; };
  // motif (canvas.createPattern) pour remplir une forme avec la texture
  T.motif = (c, cle) => { const P = T.pixels(cle); if (!P) return null; return motifs[cle] || (motifs[cle] = c.createPattern(P.cv, 'repeat')); };
  // l'objet qui remplace « kind » sur cette carte (ou null) ; la variante dépend de la case
  T.objet = (map, kind, tx, ty) => {
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
  // chaque image d'objet devient un objet du jeu « tex_<dossier>_<nom> », à sa taille de jeu (TAILLE)
  function objets() {
    const OBJ = DW.World && DW.World.OBJ; if (!OBJ) return;
    // chaque décor dessiné prend sa hauteur de jeu (HAUTEUR) : on agrandit sa boîte (l'image y est posée en bas, centrée)
    for (const kind in HAUTEUR) {
      const O = OBJ[kind], n = nomArbre(kind, 0), im = n && T.a('commun/' + n); if (!O || !im) continue;
      const bw = typeof O.w === 'function' ? O.w(0) : O.w, bh = typeof O.h === 'function' ? O.h(0) : O.h;
      O.scale = HAUTEUR[kind] * HEROS / (im.naturalHeight * Math.min(bw / im.naturalWidth, bh / im.naturalHeight));
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
    }
    for (const [d, noms] of Object.entries(LISTE)) for (const n of noms) {
      const im = T.a(d + '/' + n), t = TAILLE[n]; if (!im || !t || Array.isArray(t)) continue;
      const [sx, sy, sw, sh] = cadre(im), w = Math.round(t.w || t.h * sw / sh), h = Math.round(t.h || t.w * sh / sw);
      let net = null;
      OBJ['tex_' + d + '_' + n] = { w, h, n: 1, noOutline: true, image: true,
        paint(x) { const k = DW.Art.HD || 1; net = net || reduire(im, sx, sy, sw, sh, w * k, h * k); x.drawImage(net, 0, 0, w, h); },
        draw: dd => dd.rect(0, 0, 1, 1, 'rgba(0,0,0,0)') };
    }
  }
})();
