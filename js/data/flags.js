'use strict';
// =====================================================================
//  DRAPEAUX DE PARTIE (state.flags) : la liste officielle
//  Tout nouveau drapeau doit être déclaré ici. Une faute de frappe dans un nom de drapeau
//  est signalée par les tests (dev/tests.js) et dans la console à la sauvegarde.
// =====================================================================
(function () {
  DW.FLAGS = {
    // réglages de partie
    starter: 'espèce du premier partenaire choisi (active la sauvegarde automatique)',
    arenaTuto: 'explications du combat en arène déjà vues',
    shellLair: "le sable s'est ouvert sous les cabines : l'antre de Shellmon (maps/antre.js)",
    kuwaChase: 'poursuite de Kuwagamon vue (première entrée dans la forêt)',
    boothPos: 'énigme des cabines : nombre de mots déjà entendus dans le bon ordre',
    // histoire
    kuwagamon: 'Kuwagamon vaincu (Grand Arbre de la clairière, fin du chapitre 1)',
    kuwaSeen: 'entré dans le Grand Arbre (les racines se sont refermées)',
    shellmon: 'Shellmon vaincu (plage)',
    whamon: 'Whamon libéré de son Engrenage Noir (Crique du Radeau)',
    devimon: 'Devimon vaincu',
    ending: 'fin du jeu vue',
    berceau: 'première visite au Village des Bébés',
    tanemon: 'premier échange avec Tanemon au DigiChamp',
    gift_tanemon: 'cadeau de Tanemon reçu (sentier)',
    jiji_tanemon: 'conseil de Jijimon sur le DigiChamp entendu',
    tour: 'visite guidée de la ville par Koromon faite (chapitre 1)',
    chapter: 'chapitre en cours (2 = après Kuwagamon)',
    crestSeen: 'premier portail d\'écusson découvert (la page ÉCUSSONS du Journal apparaît)',
    bota: 'prochain conseil de Koromon, le guide de la ville (compteur)',
    cups: 'coupes du Colisée remportées { nom: true }',
    cuisineTip: 'explication de la cuisine entendue (game/cuisine.js)',
    cookIntro: 'présentation de la cuisine en ville entendue (maps/village.js)',
    homeIntro: 'première visite de la maison du joueur (maps/joueur.js)',
    // limites quotidiennes / horaires (valeur = jour ou heure de jeu)
    meat: 'jour de la dernière récolte de Digiviande',
    harvest: 'jour de la dernière récolte de Palmon',
    fish: 'heure de la dernière pêche',
    whamonDay: 'jour du dernier trésor de Whamon (Crique du Radeau)',
    eggDay: 'jour du dernier DigiŒuf pris',
    findDay: 'jour des trouvailles au sol (game/sol.js)',
    findN: 'nombre de trouvailles apparues au sol ce jour-là (3 max)',
  };
  // familles de drapeaux nommés par programme
  DW.FLAG_PREFIXES = {
    pk_: 'objet ramassé sur une carte (pickup)',
    act_: 'activité du jour : { d: jour, n: parties jouées } (game/activities.js : tournoi, curling, trésor, pêche)',
  };
  DW.flagKnown = k => k in DW.FLAGS || Object.keys(DW.FLAG_PREFIXES).some(p => k.startsWith(p));
})();
