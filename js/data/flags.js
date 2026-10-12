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
    autoEvo: 'Digivolutions automatiques (mode « solo » façon DW1)',
    solo: 'équipe limitée à un seul Digimon',
    // histoire
    kuwagamon: 'Kuwagamon vaincu (forêt)',
    shellmon: 'Shellmon vaincu (plage)',
    devimon: 'Devimon vaincu',
    ending: 'fin du jeu vue',
    berceau: 'première visite au Village des Bébés',
    tanemon: 'premier échange avec Tanemon au DigiChamp',
    gift_tanemon: 'cadeau de Tanemon reçu (sentier)',
    jiji_tanemon: 'conseil de Jijimon sur le DigiChamp entendu',
    bota: 'prochain conseil de Koromon, le guide de la ville (compteur)',
    cups: 'coupes du Colisée remportées { nom: true }',
    // limites quotidiennes / horaires (valeur = jour ou heure de jeu)
    meat: 'jour de la dernière récolte de Digiviande',
    harvest: 'jour de la dernière récolte de Palmon',
    fish: 'heure de la dernière pêche',
    eggDay: 'jour du dernier DigiŒuf pris',
    findDay: 'jour des trouvailles du partenaire',
    findN: 'nombre de trouvailles du partenaire ce jour-là (3 max)',
  };
  // familles de drapeaux nommés par programme
  DW.FLAG_PREFIXES = {
    pk_: 'objet ramassé sur une carte (pickup)',
    act_: 'activité du jour : { d: jour, n: parties jouées } (game/activities.js : tournoi, curling, trésor, pêche)',
  };
  DW.flagKnown = k => k in DW.FLAGS || Object.keys(DW.FLAG_PREFIXES).some(p => k.startsWith(p));
})();
