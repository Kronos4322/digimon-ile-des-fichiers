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
    shellLair: "le sable s'est ouvert sous les cabines : l'antre de Shellmon (maps/antre.js)",
    kuwaChase: 'poursuite de Kuwagamon vue (première entrée dans la forêt)',
    yokoQuest: "la doyenne des Poyomon a demandé de l'eau pour le puits",
    yokoWell: 'le puits du village des Poyomon coule de nouveau',
    yokoTunnel: "échelle du puits des Poyomon découverte (souterrain vers la maison de Jijimon)",
    jijiTunnel: 'souterrain de Jijimon visité',
    jijiTrap: 'trappe du souterrain ouverte dans la maison de Jijimon',
    yokoBath: 'jour du dernier bain dans la source chaude des Poyomon',
    yokoWellGift: 'trésor du fond du puits des Poyomon trouvé (Puce PV)',
    yokoWellDay: "jour de la dernière bouteille d'Eau de source puisée au puits des Poyomon",
    taiTrain: 'jour du dernier entraînement à deux avec Tai',
    taiMatch: 'jour du dernier match amical contre le Greymon de Tai',
    taiLead: 'Tai a parlé du garçon blond vu près du lac (piste du chapitre 2)',
    album1: 'récompense de l\u2019album du chapitre 1 reçue (Jijimon)',
    gotsuBet: 'parties du pari de Gotsumon aujourd\u2019hui { d, n }',
    biyoGame: 'jour du dernier jeu du courrier de Biyomon',
    boothPos: 'énigme des cabines : nombre de mots déjà entendus dans le bon ordre',
    ankhs: "Crypte des Gardiens : les ankhs déjà rallumés (tableau, 0 à 2) ; les trois ouvrent la porte scellée vers Shellmon (maps/antre.js)",
    biyoHint: 'Biyomon : nombre d\u2019indices donnés (un Digimon différent à chaque visite)',
    gymIntro: 'Leomon a présenté le Gymnase (résistances aux éléments, maps/gymnase.js)',
    // histoire
    kuwagamon: 'Kuwagamon vaincu (Grand Arbre de la clairière ; le chapitre 1 continue jusqu’à Shellmon)',
    kuwaSeen: 'entré dans le Grand Arbre (les racines se sont refermées)',
    shellmon: 'Shellmon vaincu (antre sous la plage, fin du chapitre 1)',
    whamon: 'Whamon libéré de son Engrenage Noir (Crique du Radeau)',
    devimon: 'Devimon vaincu',
    ending: 'fin du jeu vue',
    berceau: 'première visite au Village des Bébés',
    tanemon: 'premier échange avec Tanemon au DigiChamp',
    gift_tanemon: 'cadeau de Tanemon reçu (sentier)',
    jiji_tanemon: 'conseil de Jijimon sur le DigiChamp entendu',
    tour: 'visite guidée de la ville par Koromon faite (chapitre 1)',
    chapter: 'chapitre en cours (2 = après Shellmon, 3 = après Seadramon, 4 = après Meramon)',
    // chapitre 2 (game/chapitre2.js)
    monoSeen: 'combat des deux Monochromon vu (Rive Sud)',
    monoCh2: 'Monochromon de la Rive Sud vaincu (le chemin du lac est libre)',
    harmo: "harmonica de Matt entendu au Lac du Tramway",
    mattMet: 'Matt rencontré près de son feu de camp (île du tramway)',
    seadramon: 'Seadramon vaincu, Matt délivré (fin du chapitre 2)',
    yokoVillage: 'arrivée au Village des Yokomon (chapitre 3)',
    soraMet: 'Sora retrouvée (au fond des souterrains du Mont Miharashi ; elle et Biyomon viennent affronter Meramon)',
    biyoAide: "Biyomon, remontée seule à la fontaine, a supplié le héros d'aller chercher Sora sous la montagne (chapitre 3)",
    svDescente: 'première descente dans les souterrains du Mont Miharashi (maps/sous_volcan.js)',
    svRocher: 'le gros rocher de la Galerie des Foreurs poussé par un Champion (la galerie du trésor est ouverte)',
    svGardien: "Drimogemon, gardien possédé de la source, libéré de son Engrenage Noir (l'échelle des foreurs est ouverte)",
    arrosage: "jour de la dernière partie d'arrosage des fleurs au Village des Yokomon (game/minijeux.js)",
    mihaFire: 'grondement du Mont Miharashi entendu (Meramon au sommet)',
    meramon: 'Meramon calmé au sommet du Mont Miharashi, l’eau revient au village (fin du chapitre 3)',
    // quêtes annexes (game/quetes.js)
    bukaQuete: 'quête des Bukamon égarés (chapitre 2) : 1 acceptée, 2 terminée',
    bukaTrouves: 'Bukamon égarés retrouvés (un bit par rive : lac1, lac4, lac6)',
    yokoSoif: 'Yokomon assoiffé de l’oasis du Désert des Poteaux secouru (chapitre 3)',
    crestSeen: 'premier portail d\'écusson découvert (la page ÉCUSSONS du Journal apparaît)',
    bota: 'prochain conseil de Koromon, le guide de la ville (compteur)',
    cups: 'coupes du Colisée remportées { nom: true }',
    cuisineTip: 'explication de la cuisine entendue (game/cuisine.js)',
    dojoDay: 'jour des dernières séances au Dojo agrandi { zen, combat }',
    maraich: 'jour de la dernière récolte offerte par chaque maraîcher de la serre { maraicher_xxx: jour }',
    recipeQuest: 'recette que Mushroomon a demandé de préparer (quête en cours)',
    cookIntro: 'présentation de la cuisine en ville entendue (maps/village.js)',
    homeIntro: 'première visite de la maison du joueur (maps/joueur.js)',
    // limites quotidiennes / horaires (valeur = jour ou heure de jeu)
    meat: 'jour de la dernière récolte de Digiviande',
    harvest: 'jour de la dernière récolte de Palmon',
    fish: 'heure de la dernière pêche',
    canne: 'canne à pêche reçue de Gomamon (champs)',
    rod: 'minute de jeu du dernier lancer avec la canne (game/peche.js)',
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
