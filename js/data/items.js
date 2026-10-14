'use strict';
// =====================================================================
//  OBJETS — catalogue de Digimon World 1 (noms en français)
//  Champs : use (effet, voir monster.js DW.useItem), price, tier (niveau de ville à partir
//  duquel les boutiques le vendent : on débloque d'abord les moins bons), icon (dessin générique, icons.js)
//  Effets de nourriture combinables : amt (PV), mp (PM), full / mpFull, food (faim), happy, disc, fat,
//  tired (fatigue retirée), boost (points en plus à la prochaine séance), chip {stat: n}, life (jours de vie), risky (maladie)
//  Échelle : 1 point de puce = +4 en stat, +20 PV/PM (DW.SCALE).
// =====================================================================
(function () {
  const I = DW.ITEMS = {
    // ------------------------------------------------------------ soins
    soin_p:       { name: 'Petit soin', price: 100, tier: 0, use: 'heal', amt: 500, icon: ['potion', '#5ad870'], desc: 'Restaure 500 PV.' },
    soin_m:       { name: 'Soin moyen', price: 500, tier: 4, use: 'heal', amt: 1500, icon: ['potion', '#3ab8e0'], desc: 'Restaure 1500 PV.' },
    soin_g:       { name: 'Grand soin', price: 1000, tier: 8, use: 'heal', amt: 5000, icon: ['potion', '#a05ae0'], desc: 'Restaure 5000 PV.' },
    soin_s:       { name: 'Super soin', price: 2500, tier: 12, use: 'heal', full: true, icon: ['potion', '#f0c030'], desc: 'Restaure tous les PV.' },
    disque_pm:    { name: 'Disquette PM', price: 300, tier: 0, use: 'mp', amt: 500, icon: ['disk', '#5ab0ff'], desc: 'Restaure 500 PM.' },
    pm_m:         { name: 'Disquette PM+', price: 800, tier: 4, use: 'mp', amt: 1500, icon: ['disk', '#3a7ae0'], desc: 'Restaure 1500 PM.' },
    pm_g:         { name: 'Disquette PM++', price: 2000, tier: 8, use: 'mp', amt: 5000, icon: ['disk', '#2a4ab0'], desc: 'Restaure 5000 PM.' },
    double_disk:  { name: 'Double disquette', price: 1500, tier: 6, use: 'heal', amt: 1500, mp: 1500, icon: ['disk', '#e05ab0'], desc: 'Restaure 1500 PV et 1500 PM.' },
    remede:       { name: 'Remède universel', price: 300, tier: 0, use: 'cure', icon: ['potion', '#f0f0f0'], desc: 'Soigne le poison, la brûlure, la paralysie et le sommeil.' },
    omnipotent:   { name: 'Omnipotent', price: 2000, tier: 8, use: 'heal', amt: 2000, mp: 2000, cure: true, icon: ['potion', '#ff7a3a'], desc: 'Soigne les altérations, rend 2000 PV et 2000 PM.' },
    protection:   { name: 'Protection', price: 1200, tier: 6, use: 'protect', icon: ['shield', '#7ad0ff'], desc: 'En combat : protège ton Digimon de toutes les altérations.' },
    reveil:       { name: 'Disque Réveil', price: 1500, tier: 4, use: 'revive', icon: ['disk', '#ffe060'], desc: 'Ranime un Digimon K.O. avec la moitié de ses PV.' },
    super_reveil: { name: 'Super Réveil', price: 5000, tier: 12, use: 'revive', full: true, icon: ['disk', '#ffffff'], desc: 'Ranime un Digimon K.O. avec tous ses PV et soigne ses altérations.' },
    bandage:      { name: 'Bandage', price: 200, tier: 0, use: 'hurt', icon: ['bandage', '#f4f0e8'], desc: "Soigne une blessure. Un Digimon blessé ne peut pas s'entraîner." },
    medoc:        { name: 'Médicament', price: 1000, tier: 2, use: 'sick', icon: ['pill', '#e04a4a'], desc: 'Guérit maladies et blessures.' },
    // ------------------------------------------------------------ disques de combat (pendant le combat)
    disque_atk:   { name: 'Disque Attaque', price: 500, tier: 4, use: 'buff', st: { atk: 1 }, icon: ['disk', '#f08a30'], desc: "En combat : augmente l'Attaque." },
    disque_def:   { name: 'Disque Défense', price: 500, tier: 4, use: 'buff', st: { def: 1 }, icon: ['disk', '#3a8ae0'], desc: 'En combat : augmente la Défense.' },
    disque_vit:   { name: 'Disque Vitesse', price: 500, tier: 4, use: 'buff', st: { spd: 1 }, icon: ['disk', '#3ac070'], desc: 'En combat : augmente la Vitesse.' },
    disque_omni:  { name: 'Disque Omni', price: 3000, tier: 10, use: 'buff', st: { atk: 1, def: 1, spd: 1 }, icon: ['disk', '#c8c8d8'], desc: 'En combat : augmente Attaque, Défense et Vitesse.' },
    s_disque_atk: { name: 'Super disque Attaque', price: 4000, tier: 14, use: 'buff', st: { atk: 2 }, icon: ['disk', '#d85a10'], desc: "En combat : augmente fortement l'Attaque." },
    s_disque_def: { name: 'Super disque Défense', price: 4000, tier: 14, use: 'buff', st: { def: 2 }, icon: ['disk', '#1a5ab0'], desc: 'En combat : augmente fortement la Défense.' },
    s_disque_vit: { name: 'Super disque Vitesse', price: 4000, tier: 14, use: 'buff', st: { spd: 2 }, icon: ['disk', '#1a9050'], desc: 'En combat : augmente fortement la Vitesse.' },
    // ------------------------------------------------------------ puces (bonus permanents)
    puce_atk:     { name: 'Puce Attaque', price: 7500, tier: 10, use: 'chip', chip: { atk: 12.5 }, icon: ['chip', '#f08a30'], desc: "Attaque +50, pour toujours." },
    puce_def:     { name: 'Puce Défense', price: 7500, tier: 10, use: 'chip', chip: { def: 12.5 }, icon: ['chip', '#3a8ae0'], desc: 'Défense +50, pour toujours.' },
    puce_int:     { name: 'Puce Cerveau', price: 9999, tier: 16, use: 'chip', chip: { int: 12.5 }, icon: ['chip', '#a05ae0'], desc: 'Intelligence +50, pour toujours.' },
    puce_spd:     { name: 'Puce Vitesse', price: 9999, tier: 16, use: 'chip', chip: { spd: 12.5 }, icon: ['chip', '#3ac070'], desc: 'Vitesse +50, pour toujours.' },
    puce_pv:      { name: 'Puce PV', price: 5000, tier: 6, use: 'chip', chip: { hp: 25 }, icon: ['chip', '#e04848'], desc: 'PV max +500, pour toujours.' },
    puce_pm:      { name: 'Puce PM', price: 5000, tier: 6, use: 'chip', chip: { mp: 25 }, icon: ['chip', '#4ae0f0'], desc: 'PM max +500, pour toujours.' },
    puce_dva:     { name: 'Puce DV A', price: 5000, tier: 20, use: 'chip', chip: { atk: 25, int: 25 }, icon: ['chip', '#ffd040'], desc: 'Attaque et Intelligence +100, pour toujours.' },
    puce_dvd:     { name: 'Puce DV D', price: 5000, tier: 20, use: 'chip', chip: { def: 25, spd: 25 }, icon: ['chip', '#80e0ff'], desc: 'Défense et Vitesse +100, pour toujours.' },
    puce_dve:     { name: 'Puce DV E', price: 5000, tier: 20, use: 'chip', chip: { atk: 25, spd: 25 }, icon: ['chip', '#ff80c0'], desc: 'Attaque et Vitesse +100, pour toujours.' },
    // ------------------------------------------------------------ outils
    pilote_auto:  { name: 'Pilote automatique', price: 300, tier: 2, use: 'home', icon: ['tool', '#5ab0ff'], desc: 'Te ramène aussitôt à la Ville des Fichiers.' },
    pot_portable: { name: 'Pot portable', price: 300, tier: 2, use: 'potty', icon: ['tool', '#f0f0f0'], desc: 'Ton Digimon peut faire ses besoins n\'importe où.' },
    manuel_entr:  { name: "Manuel d'entraînement", price: 9999, tier: 16, use: 'passive', icon: ['book', '#3a6ad8'], desc: "Tant qu'il est dans ton sac : +1 point à chaque séance réussie." },
    manuel:       { name: 'Manuel de technique', price: 900, tier: 6, use: 'manual', icon: ['book', '#8a3a2a'], desc: "Apprend la prochaine technique de l'espèce, sans attendre le niveau." },
    baton:        { name: 'Bâton solide', price: 150, tier: 0, use: 'passive', icon: ['tool', '#a8743a'], desc: "Outil : permet de secouer les arbres et les palmiers (fruits, Digimon cachés)." },
    pelle:        { name: 'Petite pelle', price: 300, tier: 1, use: 'passive', icon: ['tool', '#9aa8b8'], desc: "Outil : permet de fouiller sous les rochers, les souches et le bois flotté." },
    oreiller:     { name: 'Oreiller', price: 1000, tier: 6, use: 'passive', icon: ['tool', '#f0d0e8'], desc: "Tant qu'il est dans ton sac : le sommeil rend tous les PV et PM." },
    repousse:     { name: 'Répulsif', price: 1500, tier: 6, use: 'repel', icon: ['tool', '#4aa880'], desc: 'Pendant 2 heures, les Digimon sauvages ne te poursuivent plus.' },
    cloche:       { name: 'Cloche à Digimon', price: 1500, tier: 6, use: 'bell', icon: ['tool', '#e0c040'], desc: 'Pendant 2 heures, tous les Digimon sauvages viennent à toi (même les plus forts !).' },
    chaussures:   { name: 'Chaussures santé', price: 2000, tier: 12, use: 'passive', icon: ['tool', '#e05a3a'], desc: "Tant qu'elles sont dans ton sac : marcher rend un peu de PV et de PM." },
    cartes:       { name: 'Paquet de cartes', price: 200, tier: 0, use: 'pack', desc: '3 cartes Digimon au hasard pour ton album (Menu → ALBUM). Les cartes rares sont précieuses !' },
    // ------------------------------------------------------------ nourriture
    viande:       { name: 'Viande', price: 50, tier: 0, use: 'heal', amt: 600, food: 60, icon: ['meat', '#c8643c'], desc: 'Un bon morceau de viande. Calme la faim et restaure 600 PV.' },
    super_viande: { name: 'Viande géante', price: 500, tier: 3, use: 'heal', amt: 1800, food: 100, icon: ['meat', '#a84a2a'], desc: 'Rassasie bien et restaure 1800 PV.' },
    surlonge:     { name: 'Surlonge', price: 1500, tier: 9, use: 'heal', full: true, food: 100, happy: 5, icon: ['meat', '#8a2a1a'], desc: 'Rassasie complètement et restaure tous les PV.' },
    steak:        { name: 'Steak', price: 1000, tier: 9, use: 'heal', amt: 2500, food: 100, icon: ['meat', '#7a3a2a'], desc: 'Rassasie complètement, restaure 2500 PV.' },
    digichampi:   { name: 'Digichampignon', price: 100, tier: 0, use: 'heal', amt: 300, food: 40, icon: ['mush', '#d84a3a'], desc: 'Calme un peu la faim, 300 PV.' },
    champi_glace: { name: 'Champignon glacé', price: 1000, tier: 16, use: 'heal', food: 20, disc: 15, icon: ['mush', '#7ad0ff'], desc: 'Augmente beaucoup la discipline.' },
    champi_luxe:  { name: 'Champignon de luxe', price: 5000, tier: 20, use: 'heal', food: 30, chip: { atk: 1, def: 1, spd: 1, int: 1 }, icon: ['mush', '#f0c030'], desc: 'Attaque, Défense, Vitesse et Intelligence +4, pour toujours.' },
    champi_joie:  { name: 'Champignon joyeux', price: 1000, tier: 12, use: 'heal', food: 20, happy: 20, risky: 0.3, icon: ['mush', '#f080c0'], desc: 'Rend très heureux... mais peut rendre malade.' },
    super_carotte:{ name: 'Super carotte', price: 500, tier: 6, use: 'heal', food: 30, boost: 1, icon: ['veg', '#f08a20'], desc: 'La prochaine séance d\'entraînement rapporte 1 point de plus.' },
    radis:        { name: 'Radis faucon', price: 500, tier: 6, use: 'heal', food: 30, boost: 1, icon: ['veg', '#f0f0f0'], desc: 'La prochaine séance d\'entraînement rapporte 1 point de plus.' },
    digipomme:    { name: 'Digi-pomme de pin', price: 1000, tier: 9, use: 'heal', food: 40, boost: 2, icon: ['fruit', '#c8a040'], desc: 'La prochaine séance d\'entraînement rapporte 2 points de plus.' },
    epinard:      { name: 'Légume épineux', price: 1000, tier: 9, use: 'heal', food: 20, tired: 100, icon: ['veg', '#3aa040'], desc: 'Fait disparaître la fatigue.' },
    pomme_bleue:  { name: 'Pomme bleue', price: 1000, tier: 6, use: 'heal', food: 30, happy: 15, icon: ['fruit', '#3a8ae0'], desc: 'Rend ton Digimon heureux.' },
    baie_rouge:   { name: 'Baie rouge', price: 1000, tier: 9, use: 'heal', food: 20, tired: 100, disc: 5, happy: 5, icon: ['fruit', '#e03a3a'], desc: 'Repose, et augmente discipline et bonheur.' },
    gland_or:     { name: "Gland d'or", price: 8000, sell: 6000, use: 'none', icon: ['fruit', '#f0c030'], desc: 'Ne se mange pas... mais se revend très cher !' },
    grosse_baie:  { name: 'Grosse baie', price: 1000, tier: 9, use: 'heal', food: 100, fat: 3, icon: ['fruit', '#a03ac0'], desc: 'Rassasie et fait prendre du poids.' },
    noix_douce:   { name: 'Noix douce', price: 1000, tier: 12, use: 'heal', full: true, food: 30, icon: ['fruit', '#c88a4a'], desc: 'Restaure tous les PV !' },
    super_legume: { name: 'Super légume', price: 1000, tier: 12, use: 'heal', amt: 2500, food: 30, icon: ['veg', '#5ad040'], desc: 'Un légume énorme : rassasie et rend 2500 PV.' },
    figue:        { name: 'Figue de Barbarie', price: 1000, tier: 9, use: 'heal', food: 20, fat: -3, icon: ['fruit', '#e05a8a'], desc: 'Fait perdre du poids.' },
    orange_bana:  { name: 'Orange-banane', price: 1000, tier: 12, use: 'heal', full: true, mpFull: true, food: 40, icon: ['fruit', '#f0a020'], desc: 'Restaure tous les PV et PM.' },
    fruit_force:  { name: 'Fruit de force', price: 5000, tier: 18, use: 'heal', food: 20, chip: { atk: 5 }, icon: ['fruit', '#f05a30'], desc: 'Attaque +20, pour toujours !' },
    glace_force:  { name: 'Glace de force', price: 5000, tier: 18, use: 'heal', food: 20, chip: { def: 5 }, icon: ['fruit', '#7ad0ff'], desc: 'Défense +20, pour toujours !' },
    feuille_vite: { name: 'Feuille de vitesse', price: 5000, tier: 18, use: 'heal', food: 20, chip: { spd: 5 }, icon: ['veg', '#5ae08a'], desc: 'Vitesse +20, pour toujours !' },
    fruit_sage:   { name: 'Fruit du sage', price: 5000, tier: 18, use: 'heal', food: 20, chip: { int: 5 }, icon: ['fruit', '#a05ae0'], desc: 'Intelligence +20, pour toujours !' },
    igname:       { name: 'Igname musclée', price: 5000, tier: 18, use: 'heal', food: 40, chip: { hp: 10 }, icon: ['veg', '#c8a070'], desc: 'PV max +200, pour toujours !' },
    baie_calme:   { name: 'Baie calme', price: 5000, tier: 18, use: 'heal', food: 20, chip: { mp: 10 }, icon: ['fruit', '#5ab0ff'], desc: 'PM max +200, pour toujours !' },
    melon:        { name: 'Melon chaîne', price: 5000, tier: 20, use: 'heal', full: true, mpFull: true, food: 100, happy: 10, disc: 5, tired: 100, icon: ['fruit', '#8ad040'], desc: 'Bon pour tout : PV, PM, faim, fatigue, bonheur et discipline.' },
    viande_moisie:{ name: 'Viande moisie', price: 50, tier: 0, use: 'heal', amt: 300, food: 50, risky: 0.3, icon: ['meat', '#7a8a4a'], desc: 'Rassasie un peu... mais peut rendre malade.' },
    pluie_plante: { name: 'Plante de pluie', price: 1000, tier: 9, use: 'heal', amt: 1000, food: 10, tired: 30, icon: ['veg', '#3ac0b0'], desc: 'Rafraîchissante : 1000 PV et un peu moins de fatigue.' },
    // ------------------------------------------------------------ boulangerie et pâtisserie (Quartier du Marché)
    pain:         { name: 'Pain frais', price: 80, tier: 0, use: 'heal', amt: 500, food: 50, icon: ['bread', '#d8964a'], desc: 'Tout chaud sorti du four. 500 PV.' },
    croissant:    { name: 'Croissant', price: 120, tier: 0, use: 'heal', amt: 300, food: 30, happy: 5, icon: ['bread', '#e8b060'], desc: 'Croustillant et doré. Rend un peu heureux.' },
    brioche:      { name: 'Brioche', price: 200, tier: 0, use: 'heal', amt: 900, food: 60, happy: 3, icon: ['bread', '#f0c070'], desc: 'Moelleuse et sucrée. 900 PV.' },
    macaron:      { name: 'Macaron', price: 150, tier: 0, use: 'heal', amt: 100, food: 10, happy: 6, icon: ['cake', '#f08ab0'], desc: 'Petit et coloré. Rend heureux.' },
    eclair:       { name: 'Éclair au chocolat', price: 250, tier: 0, use: 'heal', amt: 200, food: 20, happy: 10, icon: ['cake', '#7a4a2a'], desc: 'Fondant au chocolat. Très bon pour le moral.' },
    tarte:        { name: 'Tarte aux fruits', price: 400, tier: 0, use: 'heal', amt: 1000, food: 60, happy: 8, icon: ['cake', '#e05a3a'], desc: 'Une belle tarte. 1000 PV et de la bonne humeur.' },
    gateau_fete:  { name: 'Gâteau de fête', price: 900, tier: 0, use: 'heal', full: true, food: 80, happy: 20, fat: 2, icon: ['cake', '#ffffff'], desc: 'Tous les PV et beaucoup de bonheur... mais il fait grossir.' },
    // ------------------------------------------------------------ poissons (pêche)
    digianchois:  { name: 'Digi-anchois', price: 50, use: 'heal', amt: 300, food: 30, icon: ['fish', '#b8c8d8'], desc: 'Calme un peu la faim.' },
    digivivaneau: { name: 'Digi-vivaneau', price: 100, use: 'heal', amt: 800, food: 60, icon: ['fish', '#e07a5a'], desc: 'Rassasie bien.' },
    digitruite:   { name: 'Digi-truite', price: 300, use: 'heal', amt: 1500, food: 100, icon: ['fish', '#8ab06a'], desc: 'Rassasie complètement.' },
    truite_noire: { name: 'Truite noire', price: 1000, use: 'heal', food: 60, chip: { atk: 1, def: 1, spd: 1, int: 1 }, icon: ['fish', '#3a3a4a'], desc: 'Augmente un peu toutes les statistiques.' },
    digisilure:   { name: 'Digi-silure', price: 2000, use: 'heal', full: true, food: 100, icon: ['fish', '#8a7a5a'], desc: 'Rassasie complètement et rend tous les PV.' },
    digibar:      { name: 'Digi-bar', price: 8000, use: 'heal', full: true, mpFull: true, food: 100, life: 1, icon: ['fish', '#5a8ad0'], desc: 'Rend tous les PV et PM, et allonge la vie d\'un jour !' },
  };

  // ------------------------------------------------------------ objets de Digivolution (Digimon World 1)
  // utilisables sur un Digimon du stade précédent : il digivolue aussitôt
  const EVO_ITEMS = [
    ['griffes_grey', 'Griffes grises', 'greymon'], ['boule_feu', 'Boule de feu', 'meramon'], ['aile_flamme', 'Aile de flammes', 'birdramon'],
    ['sabot_fer', 'Sabot de fer', 'centarumon'], ['pierre_mono', 'Pierre Mono', 'monochromon'], ['foreuse', "Foreuse d'acier", 'drimogemon'],
    ['aile_noire', 'Aile noire', 'devimon'], ['massue', 'Massue à pointes', 'ogremon'], ['criniere', 'Crinière de feu', 'leomon'],
    ['aile_blanche', 'Aile blanche', 'angemon'], ['haillon', 'Haillon déchiré', 'bakemon'], ['unicorne', 'Corne de licorne', 'unimon'],
    ['casque_corne', 'Casque à corne', 'kabuterimon'], ['machoire', 'Mâchoire-ciseaux', 'kuwagamon'], ['gourde', "Gourde d'eau", 'seadramon'],
    ['coquille', 'Coquille rouge', 'shellmon'], ['cristal_bleu', 'Cristal bleu', 'garurumon'], ['cristal_glace', 'Cristal de glace', 'frigimon'],
    ['piece_metal', 'Pièce de métal', 'metalgreymon'], ['os_fatal', 'Os fatal', 'skullgreymon'], ['piece_cyber', 'Pièce cyber', 'andromon'],
    ['mega_main', 'Méga-main', 'megadramon'], ['petite_lance', 'Petite lance', 'piximon'], ['x_bandage', 'Bandage X', 'monzaemon'],
    ['banane_or', 'Banane dorée', 'etemon'], ['miroir_lune', 'Miroir de lune', 'weregarurumon'],
  ];
  const STAGES = ['Bébé', 'Entraînement', 'Disciple', 'Champion', 'Ultime', 'Méga'];
  for (const [id, name, to] of EVO_ITEMS) {
    const S = DW.SPECIES[to]; if (!S) continue;
    const ult = S.stage === 'Ultime';
    I[id] = { name, price: ult ? 9999 : 5000, tier: ult ? 24 : 14, use: 'evo', to, from: STAGES[STAGES.indexOf(S.stage) - 1], icon: ['evo', ult ? '#ffd040' : '#c8d0e0'],
      desc: `Fait digivoluer un ${STAGES[STAGES.indexOf(S.stage) - 1]} en ${S.name} !` };
  }

  // ordre d'affichage dans le sac
  DW.ITEM_ORDER = Object.keys(I);

  // ------------------------------------------------------------ boutiques (le stock grandit avec la ville)
  DW.SHOPS = {
    bazar: ['viande', 'baton', 'pelle', 'soin_p', 'disque_pm', 'remede', 'bandage', 'cartes', 'medoc', 'pilote_auto', 'pot_portable', 'soin_m', 'pm_m', 'reveil',
      'double_disk', 'protection', 'repousse', 'cloche', 'oreiller', 'soin_g', 'pm_g', 'omnipotent', 'soin_s', 'super_reveil', 'chaussures', 'puce_pv', 'puce_pm'],
    resto: ['viande', 'digichampi', 'viande_moisie', 'super_viande', 'pomme_bleue', 'super_carotte', 'radis', 'steak', 'surlonge', 'epinard', 'baie_rouge',
      'grosse_baie', 'figue', 'digipomme', 'pluie_plante', 'noix_douce', 'super_legume', 'orange_bana', 'champi_joie', 'champi_glace', 'melon', 'champi_luxe'],
    disques: ['disque_atk', 'disque_def', 'disque_vit', 'disque_omni', 's_disque_atk', 's_disque_def', 's_disque_vit'],
    puces: ['puce_pv', 'puce_pm', 'puce_atk', 'puce_def', 'puce_spd', 'puce_int', 'puce_dva', 'puce_dvd', 'puce_dve'],
    fruits: ['fruit_force', 'glace_force', 'feuille_vite', 'fruit_sage', 'igname', 'baie_calme'],
    savoir: ['manuel', 'super_carotte', 'radis', 'digipomme', 'manuel_entr'],
    evolution: EVO_ITEMS.map(e => e[0]).filter(id => I[id]),
    nuit: ['viande_moisie', 'champi_joie', 'reveil', 'medoc', 'cloche', 'super_reveil'],
    cartes: ['cartes'],
    boulangerie: ['pain', 'croissant', 'brioche'],
    patisserie: ['macaron', 'eclair', 'tarte', 'gateau_fete'],
  };
  // stock d'une boutique selon le niveau de la ville (les moins bons d'abord, puis on monte)
  DW.shopStock = name => {
    const lv = DW.Town ? DW.Town.level() : 0;
    return (DW.SHOPS[name] || []).filter(id => I[id] && (I[id].tier || 0) <= lv)
      .sort((a, b) => (I[a].tier || 0) - (I[b].tier || 0) || I[a].price - I[b].price);
  };
})();
