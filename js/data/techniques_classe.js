'use strict';
// =====================================================================
//  TECHNIQUES DE LA SALLE DE CLASSE — 50 techniques apprises en étudiant (Terrain d'entraînement → salle de classe)
//  Après chaque séance d'Intelligence, le partenaire peut retenir une technique au hasard
//  (plus la séance est réussie, plus il a de chances). Les plus puissantes demandent plus de points
//  d'Intelligence entraînée (niv : points d'entraînement Intelligence nécessaires).
//  Seules les techniques de son élément (ou Neutre) lui sont proposées. Voir game/classe.js.
// =====================================================================
(function () {
  const M = DW.MOVES;
  // [id, nom, élément, puissance, précision, niv, animation, options, description]
  const L = [
    // ---- Neutre
    ['pas_chasse', 'Pas Chassé', 'Neutre', 45, 100, 0, 'dash', { contact: true }, "Un pas de côté suivi d'un coup rapide."],
    ['coup_double', 'Coup Double', 'Neutre', 55, 95, 0, 'tackle', { contact: true }, "Deux coups si rapides qu'on n'en voit qu'un."],
    ['cri_strident', 'Cri Strident', 'Neutre', 0, 90, 8, 'roar', { sc: { who: 'foe', s: 'def', n: -1, ch: 1 } }, "Un cri aigu qui fait baisser la Défense de l'ennemi."],
    ['concentration', 'Concentration', 'Neutre', 0, null, 8, 'shield', { sc: { who: 'self', s: 'int', n: 1, ch: 1 } }, "Se concentre : augmente l'Intelligence."],
    ['repos_eclair', 'Repos Éclair', 'Neutre', 0, null, 16, 'hearts', { heal: 0.3 }, 'Une courte sieste qui rend 30 % des PV.'],
    ['charge_furieuse', 'Charge Furieuse', 'Neutre', 80, 90, 26, 'tackle', { contact: true }, 'Une charge de toutes ses forces.'],
    ['onde_data', 'Onde de Données', 'Neutre', 75, 100, 26, 'orb', {}, 'Une onde de données pures qui ne rate jamais son but.'],
    ['explosion_data', 'Explosion de Données', 'Neutre', 110, 85, 38, 'meteor', {}, 'Libère toutes ses données en une explosion aveuglante.'],
    // ---- Feu
    ['etincelle', 'Étincelle', 'Feu', 40, 100, 0, 'fireball', {}, 'Une petite étincelle brûlante.'],
    ['griffe_braise', 'Griffe de Braise', 'Feu', 55, 95, 8, 'claw', { contact: true, st: { s: 'brn', ch: 0.1 } }, 'Des griffes rougies au feu.'],
    ['mur_flammes', 'Mur de Flammes', 'Feu', 0, null, 16, 'shield', { sc: { who: 'self', s: 'def', n: 1, ch: 1 } }, 'Un rideau de feu protecteur : augmente la Défense.'],
    ['brasier', 'Brasier', 'Feu', 85, 90, 26, 'flamebeam', { st: { s: 'brn', ch: 0.2 } }, 'Une gerbe de flammes qui peut brûler.'],
    ['nova_ardente', 'Nova Ardente', 'Feu', 115, 85, 38, 'bluefire', {}, 'Une sphère de feu blanc qui éclate sur la cible.'],
    // ---- Eau
    ['eclaboussure', 'Éclaboussure', 'Eau', 40, 100, 0, 'bubbles', {}, "Une gerbe d'eau fraîche."],
    ['bulle_piege', 'Bulle Piège', 'Eau', 50, 95, 8, 'bubbles', { sc: { who: 'foe', s: 'spd', n: -1, ch: 0.3 } }, "Enferme l'ennemi dans une bulle : peut le ralentir."],
    ['maree', 'Marée', 'Eau', 70, 95, 16, 'wave', {}, 'Une vague qui monte et retombe sur la cible.'],
    ['jet_glacial', 'Geyser', 'Eau', 90, 90, 26, 'waterbeam', {}, 'Un jet brûlant jaillit du sol.'],
    ['deluge', 'Déluge', 'Eau', 115, 85, 38, 'wave', {}, 'Une pluie torrentielle qui submerge tout.'],
    // ---- Plante
    ['graines', 'Pluie de Graines', 'Plante', 40, 100, 0, 'leaves', {}, 'Une volée de graines dures.'],
    ['spores_dodo', 'Spores Dodo', 'Plante', 0, 75, 8, 'spores', { st: { s: 'slp', ch: 1 } }, "Des spores qui endorment l'ennemi."],
    ['racine_soin', 'Racines Nourricières', 'Plante', 0, null, 16, 'vine', { heal: 0.35 }, 'Puise la force de la terre : rend 35 % des PV.'],
    ['ronces', 'Ronces', 'Plante', 80, 95, 26, 'needles', { contact: true }, "Des ronces géantes s'enroulent autour de la cible."],
    ['tempete_petales', 'Tempête de Pétales', 'Plante', 110, 90, 38, 'flowercannon', {}, 'Un tourbillon de pétales tranchants.'],
    // ---- Glace
    ['flocon', 'Flocon', 'Glace', 40, 100, 0, 'icebreath', {}, 'Un flocon glacé qui pique.'],
    ['givre', 'Givre', 'Glace', 55, 95, 8, 'icebreath', { sc: { who: 'foe', s: 'spd', n: -1, ch: 0.3 } }, "Couvre l'ennemi de givre : peut le ralentir."],
    ['eclat_glace', 'Éclat de Glace', 'Glace', 75, 95, 26, 'needles', {}, 'Des aiguilles de glace lancées à toute vitesse.'],
    ['zero_absolu', 'Zéro Absolu', 'Glace', 110, 85, 38, 'blizzard', { st: { s: 'par', ch: 0.15 } }, "Un froid si intense qu'il peut figer la cible."],
    // ---- Électrique
    ['decharge', 'Décharge', 'Électrique', 40, 100, 0, 'shock', {}, 'Une petite décharge électrique.'],
    ['champ_magnetique', 'Champ Magnétique', 'Électrique', 0, 90, 8, 'wire', { st: { s: 'par', ch: 1 } }, "Paralyse l'ennemi."],
    ['eclair_double', 'Éclair Double', 'Électrique', 70, 95, 16, 'thunder', {}, 'Deux éclairs qui frappent en même temps.'],
    ['orage', 'Orage', 'Électrique', 105, 85, 38, 'thunder', { st: { s: 'par', ch: 0.2 } }, 'Un orage foudroyant.'],
    // ---- Terre
    ['jet_sable', 'Jet de Sable', 'Terre', 0, 100, 0, 'rocks', { sc: { who: 'foe', s: 'atk', n: -1, ch: 1 } }, "Du sable dans les yeux : baisse l'Attaque de l'ennemi."],
    ['eboulement', 'Éboulement', 'Terre', 65, 90, 16, 'rocks', {}, 'Des rochers dégringolent sur la cible.'],
    ['seisme', 'Séisme', 'Terre', 95, 90, 26, 'hammer', {}, 'La terre tremble violemment.'],
    ['faille', 'Faille', 'Terre', 115, 80, 38, 'rocks', {}, 'Ouvre une faille sous les pieds de la cible.'],
    // ---- Air
    ['bourrasque', 'Bourrasque', 'Air', 40, 100, 0, 'tornado', {}, 'Un coup de vent soudain.'],
    ['danse_plume', 'Danse de la Plume', 'Air', 0, null, 8, 'tornado', { sc: { who: 'self', s: 'spd', n: 1, ch: 1 } }, 'Une danse légère : augmente la Vitesse.'],
    ['lame_air', "Lame d'Air", 'Air', 75, 95, 26, 'tornado', {}, "Une lame d'air tranchante."],
    ['cyclone', 'Cyclone', 'Air', 110, 85, 38, 'tornado', {}, 'Un cyclone qui emporte tout.'],
    // ---- Insecte
    ['dard', 'Dard', 'Insecte', 40, 100, 0, 'needles', { contact: true, st: { s: 'psn', ch: 0.2 } }, 'Un dard qui peut empoisonner.'],
    ['essaim', 'Essaim', 'Insecte', 70, 95, 16, 'web', {}, "Un nuage d'insectes de données."],
    ['carapace', 'Carapace', 'Insecte', 0, null, 26, 'shield', { sc: { who: 'self', s: 'def', n: 2, ch: 1 } }, 'Durcit sa carapace : augmente beaucoup la Défense.'],
    // ---- Lumière
    ['rayon', 'Rayon Doux', 'Lumière', 40, 100, 0, 'orb', {}, 'Un petit rayon de lumière.'],
    ['aura_soin', 'Aura de Soin', 'Lumière', 0, null, 16, 'hearts', { heal: 0.4 }, 'Une aura chaude qui rend 40 % des PV.'],
    ['prisme', 'Prisme', 'Lumière', 80, 95, 26, 'orb', {}, 'Un éclat de lumière décomposé en mille couleurs.'],
    ['jugement', 'Jugement', 'Lumière', 115, 85, 38, 'meteor', {}, 'Une colonne de lumière sacrée.'],
    // ---- Ténèbres
    ['ombre_furtive', 'Ombre Furtive', 'Ténèbres', 45, 100, 0, 'bite', { pri: 1 }, "Frappe depuis l'ombre, toujours en premier."],
    ['malediction', 'Malédiction', 'Ténèbres', 0, 90, 16, 'spores', { st: { s: 'psn', ch: 1 } }, "Un sort qui empoisonne l'ennemi."],
    ['cauchemar', 'Cauchemar', 'Ténèbres', 85, 90, 26, 'bite', { st: { s: 'slp', ch: 0.15 } }, 'Plonge la cible dans un mauvais rêve.'],
    ['neant', 'Néant', 'Ténèbres', 115, 85, 38, 'meteor', {}, 'Un trou noir de données qui aspire la cible.'],
  ];
  DW.CLASS_MOVES = [];
  for (const [id, name, type, pow, acc, niv, fx, o, desc] of L) {
    if (M[id]) continue;   // un nom déjà pris garde sa définition d'origine
    M[id] = Object.assign({ name, type, pow: pow || 0, acc, desc, fx, classe: niv }, o);
    if (!pow) delete M[id].pow;
    DW.CLASS_MOVES.push(id);
  }
})();
