'use strict';
// =====================================================================
//  DIGIMON (espèces, stats, évolutions, attaques apprises)
// =====================================================================
(function () {
  // ------------------------------------------------------------ Digimon
  // stage : Bébé / Entraînement / Disciple / Champion / Ultime / Méga
  // base : hp, atk (attaques au contact), def, spd, int (attaques élémentaires à distance + résistance)
  const S = DW.SPECIES = {};
  const def = (id, o) => (S[id] = Object.assign({ id }, o));
  // ---- bébés (premier stade) : on commence l'aventure avec l'un d'eux, les autres se cachent dans les herbes hautes
  const baby = (id, o) => def(id, Object.assign({ stage: 'Bébé', attr: 'Données', kg: 1, rate: 235, xp: 28 }, o));
  baby('botamon', { name: 'Botamon', types: ['Neutre'], base: { hp: 40, atk: 40, def: 34, spd: 42, int: 34 },
    learn: [[1, 'charge'], [1, 'bulles_acides'], [3, 'grondement'], [5, 'bulles']],
    desc: "Un bébé Digimon tout duveteux et noir comme l'encre. Il crache des bulles acides quand on l'embête. Un jour, il deviendra Agumon..." });
  baby('punimon', { name: 'Punimon', types: ['Neutre'], base: { hp: 40, atk: 38, def: 38, spd: 40, int: 34 },
    learn: [[1, 'charge'], [1, 'bulles'], [3, 'garde'], [5, 'bulles_acides']],
    desc: 'Une petite boule rouge hérissée de trois pointes jaunes. Elle sautille partout en poussant de petits cris.' });
  baby('pichimon', { name: 'Pichimon', types: ['Eau'], base: { hp: 42, atk: 34, def: 38, spd: 38, int: 38 },
    learn: [[1, 'charge'], [1, 'bulles'], [3, 'garde'], [5, 'bulles_acides']],
    desc: 'Un minuscule bébé poisson aux nageoires duveteuses. Il souffle des bulles en jouant dans les flaques.' });
  baby('yuramon', { name: 'Yuramon', types: ['Plante'], base: { hp: 44, atk: 32, def: 38, spd: 36, int: 40 },
    learn: [[1, 'charge'], [1, 'bulles'], [3, 'grondement'], [5, 'feuille']],
    desc: "Un bébé tout duveteux comme une graine de pissenlit. Le moindre coup de vent l'emporte au loin." });
  baby('nyokimon', { name: 'Nyokimon', types: ['Plante'], base: { hp: 40, atk: 34, def: 36, spd: 40, int: 40 },
    learn: [[1, 'charge'], [1, 'bulles'], [3, 'parfum'], [5, 'feuille']],
    desc: "Un petit bourgeon sur pattes. La fleur sur sa tête s'ouvre quand il est heureux." });

  // (chaque Digimon d'Entraînement a une technique de son élément au N.1 : il la sait d'instinct en digivoluant —
  //  DW.learnEvoMoves. Sans elle, Koromon ne frappait qu'en Neutre ou en Eau et perdait presque tous ses combats :
  //  Étincelle, son coup spécial, data/moves.js ; Tsunomon n'avait sa Glace qu'au N.8 : Flocon)
  def('koromon', { name: 'Koromon', stage: 'Entraînement', types: ['Feu'], attr: 'Vaccin', base: { hp: 45, atk: 46, def: 40, spd: 50, int: 44 }, kg: 4,
    learn: [[1, 'charge'], [1, 'bulles'], [1, 'etincelle'], [4, 'grondement'], [6, 'vive_attaque'], [8, 'bulle_explosive'], [10, 'coup_tete']], evo: { to: 'agumon', lvl: 8 }, rate: 190, xp: 45,
    desc: 'Une petite boule rose pleine d\'énergie. Il souffle des bulles et des étincelles pour se défendre, et rêve de devenir fort.' });
  def('tsunomon', { name: 'Tsunomon', stage: 'Entraînement', types: ['Glace'], attr: 'Données', base: { hp: 46, atk: 44, def: 48, spd: 46, int: 44 }, kg: 4,
    learn: [[1, 'charge'], [1, 'bulles'], [1, 'flocon'], [4, 'garde'], [6, 'vive_attaque'], [8, 'souffle_glace'], [10, 'coup_tete']], evo: { to: 'gabumon', lvl: 8 }, rate: 190, xp: 45,
    desc: "Une petite boule de poils à la corne pointue. Un peu timide, mais d'une loyauté sans faille envers son partenaire." });
  def('bukamon', { name: 'Bukamon', stage: 'Entraînement', types: ['Eau'], attr: 'Vaccin', base: { hp: 48, atk: 42, def: 46, spd: 45, int: 46 }, kg: 5,
    learn: [[1, 'charge'], [1, 'bulles'], [4, 'garde'], [6, 'vive_attaque'], [8, 'jet_hydro'], [10, 'coup_tete']], evo: { to: 'gomamon', lvl: 8 }, rate: 190, xp: 45,
    desc: 'Un bébé phoque farceur qui adore nager. Il ne peut pas rester sur la terre ferme bien longtemps.' });
  def('tanemon', { name: 'Tanemon', stage: 'Entraînement', types: ['Plante'], attr: 'Données', base: { hp: 50, atk: 40, def: 48, spd: 42, int: 48 }, kg: 4,
    learn: [[1, 'charge'], [1, 'bulles'], [4, 'grondement'], [6, 'feuille'], [8, 'lierre'], [10, 'garde']], evo: { to: 'palmon', lvl: 8 }, rate: 190, xp: 45,
    desc: 'Un bulbe timide aux feuilles tendres. Il marche à petits pas sur ses minuscules pattes.' });
  def('yokomon', { name: 'Yokomon', stage: 'Entraînement', types: ['Plante', 'Air'], attr: 'Données', base: { hp: 45, atk: 40, def: 42, spd: 48, int: 46 }, kg: 3,
    learn: [[1, 'charge'], [1, 'bulles'], [5, 'parfum'], [7, 'feuille'], [9, 'bulle_explosive'], [11, 'picorage']], evo: { to: 'biyomon', lvl: 9 }, rate: 200, xp: 42,
    desc: 'Il porte une fleur sur la tête et se déplace grâce à ses racines. Vit en groupe dans les villages.' });

  def('agumon', { name: 'Agumon', stage: 'Disciple', types: ['Feu'], attr: 'Vaccin', base: { hp: 55, atk: 62, def: 50, spd: 55, int: 52 }, kg: 10,
    learn: [[1, 'griffe'], [1, 'grondement'], [1, 'flamme_bebe'], [10, 'vive_attaque'], [13, 'morsure'], [16, 'souffle_ardent'], [19, 'coup_queue'], [22, 'mega_flamme']], evo: { to: 'greymon', lvl: 18 }, rate: 120, xp: 70,
    desc: 'Digimon Reptile courageux et gourmand. Il crache des boules de feu brûlantes : la fameuse Boule de Feu !' });
  def('gomamon', { name: 'Gomamon', stage: 'Disciple', types: ['Eau'], attr: 'Vaccin', base: { hp: 60, atk: 55, def: 58, spd: 50, int: 50 }, kg: 12,
    learn: [[1, 'charge'], [1, 'banc_poissons'], [1, 'garde'], [10, 'vive_attaque'], [13, 'coup_tete'], [16, 'grande_vague'], [19, 'fleche_glace'], [22, 'torpille_harpon']], evo: { to: 'ikkakumon', lvl: 18 }, rate: 120, xp: 70,
    desc: 'Digimon Mammifère marin au caractère joyeux. Il commande aux poissons, qui accourent à son appel.' });
  def('palmon', { name: 'Palmon', stage: 'Disciple', types: ['Plante'], attr: 'Données', base: { hp: 58, atk: 50, def: 52, spd: 52, int: 62 }, kg: 9,
    learn: [[1, 'charge'], [1, 'lierre'], [1, 'parfum'], [10, 'vive_attaque'], [13, 'fouet_liane'], [16, 'feuille_rasoir'], [19, 'couronne_fleurs'], [22, 'pluie_epines']], evo: { to: 'togemon', lvl: 18 }, rate: 120, xp: 70,
    desc: 'Digimon Végétal à la fleur parfumée. Ses lianes peuvent ligoter ses ennemis et les empoisonner.' });
  def('biyomon', { name: 'Biyomon', stage: 'Disciple', types: ['Air', 'Feu'], attr: 'Vaccin', base: { hp: 55, atk: 52, def: 48, spd: 62, int: 56 }, kg: 7,
    learn: [[1, 'coup_bec'], [1, 'grondement'], [1, 'flamme_spirale'], [11, 'vive_attaque'], [15, 'tornade'], [18, 'picorage'], [21, 'vol_plane']], rate: 120, xp: 70,
    desc: 'Digimon Oiseau qui sait à peine voler. Ses ailes servent aussi de bras. Elle crache une spirale de flammes.' });
  def('kunemon', { name: 'Kunemon', stage: 'Disciple', types: ['Insecte', 'Électrique'], attr: 'Virus', base: { hp: 45, atk: 48, def: 42, spd: 48, int: 50 }, kg: 6,
    learn: [[1, 'charge'], [1, 'toile'], [4, 'electro_fil'], [12, 'morsure'], [16, 'electro_choc'], [18, 'souffle_paralysant'], [21, 'petit_tonnerre']], evo: { to: 'kuwagamon', lvl: 20 }, rate: 170, xp: 60,
    desc: 'Une larve électrique malicieuse. Elle emmêle ses ennemis dans un fil chargé d\'électricité.' });
  def('mushroomon', { name: 'Mushroomon', stage: 'Disciple', types: ['Plante', 'Ténèbres'], attr: 'Virus', base: { hp: 52, atk: 50, def: 45, spd: 50, int: 56 }, kg: 8,
    learn: [[1, 'charge'], [1, 'champi_bombe'], [6, 'parfum'], [12, 'morsure'], [15, 'feuille_rasoir'], [17, 'main_enfers'], [20, 'lierre']], rate: 160, xp: 62,
    desc: 'Un champignon farceur qui vit dans les sous-bois. Ses champignons explosent au contact. Il sort surtout la nuit.' });
  def('betamon', { name: 'Betamon', stage: 'Disciple', types: ['Eau', 'Électrique'], attr: 'Virus', base: { hp: 55, atk: 50, def: 52, spd: 50, int: 54 }, kg: 9,
    learn: [[1, 'charge'], [1, 'bulles'], [5, 'electro_choc'], [10, 'garde'], [14, 'jet_hydro'], [17, 'petit_tonnerre'], [20, 'grande_vague']], rate: 160, xp: 64,
    desc: 'Un amphibien qui vit près des points d\'eau. Malgré son air paisible, il envoie de puissantes décharges.' });
  def('gotsumon', { name: 'Gotsumon', stage: 'Disciple', types: ['Terre'], attr: 'Données', base: { hp: 58, atk: 60, def: 62, spd: 38, int: 40 }, kg: 30,
    learn: [[1, 'charge'], [1, 'garde'], [6, 'jet_pierres'], [12, 'poing_roc'], [15, 'vrille'], [18, 'coup_tete']], rate: 150, xp: 66,
    desc: 'Un Digimon fait de roche. Plutôt soupe au lait, il lance des cailloux quand il s\'énerve.' });
  def('elecmon', { name: 'Elecmon', stage: 'Disciple', types: ['Électrique'], attr: 'Données', base: { hp: 55, atk: 58, def: 48, spd: 65, int: 56 }, kg: 8,
    learn: [[1, 'charge'], [1, 'grondement'], [5, 'super_tonnerre'], [11, 'vive_attaque'], [15, 'morsure'], [18, 'souffle_paralysant'], [21, 'petit_tonnerre']], rate: 140, xp: 68,
    desc: 'Le gardien des bébés Digimon. Ses neuf queues accumulent l\'électricité de Super Tonnerre.' });

  def('gabumon', { name: 'Gabumon', stage: 'Disciple', types: ['Glace'], attr: 'Données', base: { hp: 58, atk: 54, def: 60, spd: 52, int: 56 }, kg: 15,
    learn: [[1, 'charge'], [1, 'souffle_bleu'], [1, 'grondement'], [10, 'coup_tete'], [13, 'morsure'], [16, 'souffle_glace'], [19, 'fleche_glace'], [22, 'flamme_bleue']], rate: 120, xp: 70,
    desc: 'Un Digimon Reptile timide qui porte la fourrure de Garurumon. Il crache des flammes bleues : le Souffle Bleu !' });
  def('garurumon', { name: 'Garurumon', stage: 'Champion', types: ['Glace'], attr: 'Vaccin', base: { hp: 82, atk: 86, def: 76, spd: 88, int: 76 }, kg: 70,
    learn: [[0, 'flamme_bleue'], [1, 'morsure'], [1, 'souffle_bleu'], [1, 'vive_attaque'], [24, 'tempete_neige'], [28, 'poing_zero'], [32, 'fleche_glace']], rate: 45, xp: 150,
    desc: 'Un loup légendaire à la fourrure plus dure que l\'acier. Sa Flamme Bleue gèle tout sur son passage.' });
  def('meramon', { name: 'Meramon', stage: 'Champion', types: ['Feu'], attr: 'Données', base: { hp: 78, atk: 90, def: 68, spd: 74, int: 86 }, kg: 45,
    learn: [[0, 'poing_ardent'], [1, 'boule_feu'], [1, 'souffle_ardent'], [1, 'grondement'], [24, 'mega_flamme']], rate: 45, xp: 150,
    desc: 'Un Digimon fait de flammes vivantes. Il brûle tout ce qu\'il touche avec son Poing Ardent.' });
  def('birdramon', { name: 'Birdramon', stage: 'Champion', types: ['Feu', 'Air'], attr: 'Vaccin', base: { hp: 78, atk: 82, def: 70, spd: 94, int: 84 }, kg: 40,
    learn: [[0, 'meteore'], [1, 'flamme_spirale'], [1, 'coup_bec'], [1, 'tornade'], [24, 'vol_plane'], [32, 'souffle_ardent']], rate: 45, xp: 150,
    desc: 'Un immense oiseau de feu. Ses Ailes de Météore font pleuvoir des boules de feu.' });
  def('greymon', { name: 'Greymon', stage: 'Champion', types: ['Feu'], attr: 'Vaccin', base: { hp: 80, atk: 92, def: 75, spd: 70, int: 72 }, kg: 60,
    learn: [[0, 'mega_flamme'], [1, 'griffe'], [1, 'flamme_bebe'], [1, 'morsure'], [22, 'coup_corne'], [27, 'coup_queue'], [31, 'souffle_ardent'], [35, 'vrille']], evo: { to: 'metalgreymon', lvl: 32 }, rate: 45, xp: 150,
    desc: 'Digimon Dinosaure au casque de fossile. Sa Méga Flamme réduit tout en cendres.' });
  def('ikkakumon', { name: 'Ikkakumon', stage: 'Champion', types: ['Eau', 'Glace'], attr: 'Vaccin', base: { hp: 90, atk: 82, def: 85, spd: 58, int: 70 }, kg: 70,
    learn: [[0, 'torpille_harpon'], [1, 'banc_poissons'], [1, 'coup_tete'], [1, 'garde'], [21, 'souffle_glace'], [27, 'tempete_neige'], [30, 'fleche_glace'], [34, 'poing_zero']], evo: { to: 'zudomon', lvl: 32 }, rate: 45, xp: 150,
    desc: 'Digimon Mammifère des mers glacées. Sa corne se détache et file comme une torpille.' });
  def('togemon', { name: 'Togemon', stage: 'Champion', types: ['Plante'], attr: 'Données', base: { hp: 85, atk: 80, def: 80, spd: 62, int: 85 }, kg: 50,
    learn: [[0, 'pluie_epines'], [1, 'poing_piquant'], [1, 'lierre'], [1, 'parfum'], [22, 'fouet_liane'], [27, 'uppercut'], [30, 'couronne_fleurs'], [34, 'feuille_rasoir']], evo: { to: 'lillymon', lvl: 32 }, rate: 45, xp: 150,
    desc: 'Un cactus géant qui boxe avec des gants rouges. Sa Pluie d\'Épines ne pardonne pas.' });
  def('kuwagamon', { name: 'Kuwagamon', stage: 'Champion', types: ['Insecte'], attr: 'Virus', base: { hp: 80, atk: 90, def: 78, spd: 72, int: 60 }, kg: 55,
    learn: [[0, 'pince'], [1, 'charge'], [1, 'grondement'], [1, 'electro_fil'], [22, 'vol_plane'], [26, 'main_enfers'], [30, 'vrille']], rate: 45, xp: 155,
    desc: 'Un insecte géant et agressif. Ses pinces tranchantes peuvent couper un arbre en deux.' });
  def('shellmon', { name: 'Shellmon', stage: 'Champion', types: ['Eau'], attr: 'Données', base: { hp: 90, atk: 78, def: 90, spd: 40, int: 75 }, kg: 80,
    learn: [[0, 'jet_hydro'], [1, 'charge'], [1, 'coquille'], [1, 'bulles'], [14, 'coup_tete'], [18, 'grande_vague']], rate: 45, xp: 160,
    desc: 'Il vit dans un énorme coquillage sur les plages. Très territorial, il attaque avec des jets d\'eau.' });

  def('metalgreymon', { name: 'MetalGreymon', stage: 'Ultime', types: ['Feu', 'Lumière'], attr: 'Vaccin', base: { hp: 100, atk: 120, def: 100, spd: 82, int: 95 }, kg: 140,
    learn: [[0, 'giga_destruction'], [1, 'mega_flamme'], [1, 'coup_corne'], [1, 'morsure'], [38, 'bras_trident'], [42, 'souffle_ardent']], rate: 20, xp: 230,
    desc: 'Greymon dont la moitié du corps est devenue métallique. Ses missiles Giga Destruction rasent les montagnes.' });
  def('zudomon', { name: 'Zudomon', stage: 'Ultime', types: ['Eau', 'Terre'], attr: 'Vaccin', base: { hp: 110, atk: 115, def: 110, spd: 65, int: 85 }, kg: 160,
    learn: [[0, 'marteau_vulcain'], [1, 'torpille_harpon'], [1, 'souffle_glace'], [1, 'coup_tete'], [38, 'boomerang'], [42, 'poing_zero']], rate: 20, xp: 230,
    desc: 'Il porte une carapace de Chrome Digizoïde et un marteau forgé par Vulcanusmon lui-même.' });
  def('lillymon', { name: 'Lillymon', stage: 'Ultime', types: ['Plante', 'Lumière'], attr: 'Données', base: { hp: 92, atk: 90, def: 85, spd: 95, int: 120 }, kg: 20,
    learn: [[0, 'canon_floral'], [1, 'pluie_epines'], [1, 'parfum'], [1, 'charme'], [38, 'feuille_rasoir'], [42, 'couronne_fleurs']], rate: 20, xp: 230,
    desc: 'Une fée gracieuse aux ailes de feuilles. Son Canon Floral concentre toute l\'énergie de la nature.' });

  def('weregarurumon', { name: 'WereGarurumon', stage: 'Ultime', types: ['Glace'], attr: 'Vaccin', base: { hp: 98, atk: 118, def: 92, spd: 110, int: 84 }, kg: 90,
    learn: [[0, 'griffe_garuru'], [1, 'flamme_bleue'], [1, 'poing_zero'], [1, 'morsure'], [38, 'tempete_neige'], [42, 'vive_attaque']], rate: 20, xp: 230,
    desc: 'Un loup-garou guerrier qui se bat avec des techniques de karaté. Sa Griffe du Loup fend la roche.' });
  def('skullmeramon', { name: 'SkullMeramon', stage: 'Ultime', types: ['Feu', 'Ténèbres'], attr: 'Données', base: { hp: 100, atk: 116, def: 88, spd: 86, int: 112 }, kg: 70,
    learn: [[0, 'feu_metal'], [1, 'poing_ardent'], [1, 'mega_flamme'], [1, 'main_enfers'], [38, 'souffle_ardent'], [42, 'grondement']], rate: 20, xp: 230,
    desc: "Une flamme bleue enchaînée, bien plus brûlante que Meramon. Son Feu de Métal fait fondre l'acier." });
  def('garudamon', { name: 'Garudamon', stage: 'Ultime', types: ['Feu', 'Air'], attr: 'Vaccin', base: { hp: 102, atk: 110, def: 90, spd: 112, int: 96 }, kg: 85,
    learn: [[0, 'ombre_ailee'], [1, 'meteore'], [1, 'tornade'], [1, 'coup_bec'], [38, 'flamme_spirale'], [42, 'vol_plane']], rate: 20, xp: 230,
    desc: "Un oiseau-guerrier géant qui protège le ciel de l'île. Ses Ailes Ombrageuses lancent un phénix de feu." });
  def('okuwamon', { name: 'Okuwamon', stage: 'Ultime', types: ['Insecte', 'Ténèbres'], attr: 'Virus', base: { hp: 104, atk: 122, def: 108, spd: 74, int: 70 }, kg: 140,
    learn: [[0, 'double_ciseaux'], [1, 'pince'], [1, 'vrille'], [1, 'electro_fil'], [38, 'main_enfers'], [42, 'vol_plane']], rate: 20, xp: 230,
    desc: 'Un scarabée géant aux quatre mandibules. Sa Double Cisaille peut couper une montagne en deux.' });

  def('numemon', { name: 'Numemon', stage: 'Champion', types: ['Ténèbres'], attr: 'Virus', base: { hp: 70, atk: 62, def: 55, spd: 70, int: 58 }, kg: 10,
    learn: [[0, 'gadoue_nume'], [1, 'charge'], [1, 'grondement'], [1, 'bulles_acides'], [24, 'morsure'], [28, 'vive_attaque']], rate: 60, xp: 120,
    desc: "Une limace qui vit dans les égouts. Un Digimon négligé devient parfois Numemon... Il lance de la gadoue sur ses ennemis." });
  def('sukamon', { name: 'Sukamon', stage: 'Champion', types: ['Ténèbres'], attr: 'Virus', base: { hp: 72, atk: 60, def: 58, spd: 60, int: 60 }, kg: 15,
    learn: [[0, 'ordure_toxique'], [1, 'charge'], [1, 'gadoue_nume'], [1, 'garde'], [24, 'morsure'], [28, 'parfum']], rate: 60, xp: 120,
    desc: "Né d'une erreur de données dans une décharge. Un Digimon très mal soigné devient Sukamon. Il ne sent pas très bon." });
  def('monzaemon', { name: 'Monzaemon', stage: 'Ultime', types: ['Lumière'], attr: 'Vaccin', base: { hp: 110, atk: 100, def: 104, spd: 80, int: 100 }, kg: 80,
    learn: [[0, 'attaque_coeur'], [1, 'charme'], [1, 'coup_tete'], [1, 'garde'], [36, 'couronne_fleurs'], [40, 'poing_zero']], rate: 20, xp: 230,
    desc: "Un ours en peluche géant. Choyé, un Numemon ou un Sukamon peut devenir Monzaemon, le maître de la Ville des Jouets." });

  def('wargreymon', { name: 'WarGreymon', stage: 'Méga', types: ['Feu', 'Lumière'], attr: 'Vaccin', base: { hp: 115, atk: 140, def: 118, spd: 105, int: 108 }, kg: 70,
    learn: [[0, 'force_gaia'], [1, 'tornade_courage'], [1, 'giga_destruction'], [1, 'mega_flamme'], [50, 'bras_trident'], [55, 'coup_corne']], rate: 8, xp: 300,
    desc: "L'ultime guerrier dragon, vêtu d'une armure de Chrome Digizoïde. Il concentre l'énergie de l'atmosphère dans sa Force de Gaïa." });

  def('metalgarurumon', { name: 'MetalGarurumon', stage: 'Méga', types: ['Glace'], attr: 'Données', base: { hp: 112, atk: 128, def: 116, spd: 132, int: 106 }, kg: 90,
    learn: [[0, 'souffle_cocyte'], [1, 'griffe_garuru'], [1, 'flamme_bleue'], [1, 'tempete_neige'], [50, 'poing_zero'], [55, 'vive_attaque']], rate: 8, xp: 300,
    desc: "Le loup d'acier, cuirassé de Chrome Digizoïde. Son Souffle de Cocyte gèle tout, jusqu'au temps lui-même." });

  // personnages de la ville (non capturables, hors DigiDex)
  def('jijimon', { name: 'Jijimon', stage: 'Ultime', types: ['Neutre'], attr: 'Données', base: { hp: 90, atk: 60, def: 80, spd: 40, int: 120 }, kg: 30,
    learn: [[1, 'charge']], rate: 0, xp: 0, npc: true, desc: "Le sage de la Ville des Fichiers. Il veille sur l'île depuis toujours." });

  DW.DEX_ORDER = ['botamon', 'koromon', 'agumon', 'greymon', 'metalgreymon', 'wargreymon', 'punimon', 'tsunomon', 'gabumon', 'garurumon', 'meramon', 'pichimon', 'bukamon', 'gomamon', 'ikkakumon', 'zudomon', 'yuramon', 'tanemon', 'palmon', 'togemon', 'lillymon',
    'nyokimon', 'yokomon', 'biyomon', 'birdramon', 'kunemon', 'kuwagamon', 'mushroomon', 'betamon', 'gotsumon', 'elecmon', 'shellmon', 'weregarurumon', 'metalgarurumon', 'skullmeramon', 'garudamon', 'okuwamon', 'numemon', 'sukamon', 'monzaemon'];
})();
