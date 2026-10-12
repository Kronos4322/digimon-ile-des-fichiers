'use strict';
// =====================================================================
//  OBJETS
// =====================================================================
(function () {
  // ------------------------------------------------------------ objets
  DW.ITEMS = {
    viande:       { name: 'Viande', price: 60, use: 'heal', amt: 30, food: 60, desc: 'Un bon morceau de viande. Calme la faim et restaure 30 PV.' },
    super_viande: { name: 'Super Viande', price: 180, use: 'heal', amt: 90, food: 100, desc: 'Une viande juteuse de qualité. Rassasie complètement et restaure 90 PV.' },
    remede:       { name: 'Remède', price: 80, use: 'cure', desc: 'Soigne le poison, la brûlure, la paralysie et le sommeil.' },
    medoc:        { name: 'Médicament', price: 150, use: 'sick', desc: 'Guérit un Digimon malade. Une maladie non soignée est une erreur de soin.' },
    bandage:      { name: 'Bandage', price: 90, use: 'hurt', desc: 'Soigne une blessure reçue en combat. Un Digimon blessé ne peut pas s\'entraîner.' },
    cartes:       { name: 'Paquet de cartes', price: 200, use: 'pack', desc: '3 cartes Digimon au hasard pour ton album (Menu → ALBUM). Les cartes rares sont précieuses !' },
    // nourriture (Restaurant de Meramon, glaces de Frigimon, champs...)
    pomme:        { name: 'Pomme digitale', price: 30, use: 'heal', amt: 15, food: 30, desc: 'Un fruit croquant. Petit en-cas : 15 PV.' },
    riz:          { name: 'Boule de riz', price: 70, use: 'heal', amt: 35, food: 55, desc: 'Nourrissant et léger. 35 PV, ne fait pas grossir.', light: true },
    poisson:      { name: 'Poisson grillé', price: 90, use: 'heal', amt: 45, food: 70, desc: 'Grillé au feu de bois. 45 PV.' },
    champi:       { name: 'Champignon', price: 50, use: 'heal', amt: 20, food: 40, desc: 'Un champignon des bois. 20 PV... et parfois une surprise.', risky: true },
    glace:        { name: 'Glace de Frigimon', price: 120, use: 'heal', amt: 20, food: 30, happy: 8, desc: 'Une glace fondante. 20 PV et beaucoup de bonheur.' },
    gateau:       { name: 'Gâteau', price: 300, use: 'heal', amt: 50, food: 60, happy: 15, fat: 2, desc: 'Un gâteau de fête. Rend très heureux... mais fait grossir.' },
    bonbon:       { name: 'Bonbon', price: 40, use: 'heal', amt: 5, food: 10, happy: 5, disc: -2, desc: 'Une friandise. Fait plaisir, mais trop gâter nuit à la discipline.' },
    // puces : bonus permanent de statistique (Boutique d'Andromon)
    puce_pv:      { name: 'Puce PV', price: 1500, use: 'chip', stat: 'hp', amt: 4, desc: 'Puce de données : +4 PV max, pour toujours.' },
    puce_atk:     { name: 'Puce Attaque', price: 1500, use: 'chip', stat: 'atk', amt: 2, desc: "Puce de données : +2 en Attaque, pour toujours." },
    puce_def:     { name: 'Puce Défense', price: 1500, use: 'chip', stat: 'def', amt: 2, desc: 'Puce de données : +2 en Défense, pour toujours.' },
    puce_spd:     { name: 'Puce Vitesse', price: 1500, use: 'chip', stat: 'spd', amt: 2, desc: 'Puce de données : +2 en Vitesse, pour toujours.' },
    puce_int:     { name: 'Puce Intelligence', price: 1500, use: 'chip', stat: 'int', amt: 2, desc: 'Puce de données : +2 en Intelligence, pour toujours.' },
    disque_pm:    { name: 'Disque PM', price: 250, use: 'mp', amt: 40, desc: 'Restaure 40 PM.' },
    manuel:       { name: 'Manuel de technique', price: 900, use: 'manual', desc: "Apprend la prochaine technique de l'espèce, sans attendre le niveau." },
    repousse:     { name: 'Parfum répulsif', price: 160, use: 'repel', desc: "Pendant 2 heures, les Digimon sauvages ne te poursuivent plus." },
    reveil:       { name: 'Disque Réveil', price: 500, use: 'revive', desc: 'Ranime un Digimon K.O. avec la moitié de ses PV.' },
  };
  DW.ITEM_ORDER = ['viande', 'super_viande', 'pomme', 'riz', 'poisson', 'champi', 'glace', 'gateau', 'bonbon', 'remede', 'medoc', 'bandage', 'reveil', 'disque_pm',
    'puce_pv', 'puce_atk', 'puce_def', 'puce_spd', 'puce_int', 'manuel', 'repousse', 'cartes'];
})();
