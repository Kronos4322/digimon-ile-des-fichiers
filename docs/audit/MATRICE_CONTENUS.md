# Matrice des contenus

Écrite par `node dev/matrice.js` à partir des données du jeu (commit 8925c8c) et de l'inventaire des cartes de l'audit.
Ne pas la modifier à la main : relancer le script.

## 1. Ce que contient cette version

| Contenu | État |
|---|---|
| Chapitre 1 « L'Île des Fichiers » (Kuwagamon, Shellmon, Tai délivré) | jouable de bout en bout |
| Chapitre 2 « Le Lac et le Loup » (Monochromon, Seadramon, Matt délivré) | jouable de bout en bout |
| Chapitre 3 « La Montagne de Feu » (grotte de Sora, Drimogemon, Meramon, Sora délivrée) | jouable de bout en bout |
| Chapitre 4 « L'Insecte Électrique » | annoncé (« À suivre... »), pas encore écrit |
| Mont Panorama (13 cartes, région « volcan ») | fermé pour l'instant (décision du joueur) |
| Gymnase | fermé aux chapitres 1 à 3 (décision du joueur) |
| Carte du monde dessinée | mise en pause à la demande du joueur (branche locale `carte-monde-vraie`, non publiée) |
| Régions des chapitres suivants (14 régions : brumes, canyon, decharge, dino, gel, jouets, jungle, marais, montagne, overdell, savane, scarabees, tunnel, usine) | générées, fermées par le voile de données |

## 2. Cartes par région

Ville au complet. « Atteintes » : cartes atteintes pour la première fois au chapitre indiqué (audit des cartes, `docs/audit/graphe/`).

| Région | Cartes (dont intérieurs) | Atteintes au ch. 1 / 2 / 3 / 4 | Jamais atteintes | Sorties | PNJ (max) | Objets | Panneaux | Événements |
|---|---|---|---|---|---|---|---|---|
| brumes | 13 (3) | 0 / 0 / 0 / 1 | 12 | 33 | 12 | 274 | 26 | 4 |
| canyon | 10 (0) | 0 / 0 / 0 / 0 | 10 | 27 | 3 | 242 | 24 | 0 |
| decharge | 10 (0) | 0 / 0 / 0 / 0 | 10 | 25 | 3 | 241 | 32 | 1 |
| dino | 13 (3) | 0 / 0 / 0 / 0 | 13 | 31 | 14 | 221 | 28 | 5 |
| foret | 10 (3) | 10 / 0 / 0 / 0 | 0 | 27 | 28 | 562 | 56 | 30 |
| gel | 13 (4) | 0 / 0 / 0 / 0 | 13 | 31 | 14 | 306 | 23 | 10 |
| jouets | 19 (9) | 0 / 0 / 0 / 0 | 19 | 43 | 17 | 503 | 25 | 11 |
| jungle | 16 (6) | 0 / 0 / 0 / 0 | 16 | 38 | 4 | 251 | 27 | 2 |
| lac | 12 (0) | 0 / 12 / 0 / 0 | 0 | 29 | 7 | 372 | 20 | 9 |
| marais | 10 (0) | 0 / 0 / 0 / 0 | 10 | 25 | 3 | 201 | 21 | 0 |
| miharashi | 10 (5) | 0 / 0 / 10 / 0 | 0 | 27 | 16 | 430 | 37 | 37 |
| montagne | 13 (5) | 0 / 0 / 0 / 0 | 13 | 33 | 12 | 223 | 21 | 8 |
| overdell | 18 (9) | 0 / 0 / 0 / 0 | 18 | 41 | 3 | 532 | 29 | 3 |
| plage | 9 (5) | 8 / 1 / 0 / 0 | 0 | 32 | 6 | 741 | 45 | 36 |
| savane | 10 (0) | 0 / 0 / 0 / 0 | 10 | 28 | 3 | 233 | 27 | 1 |
| scarabees | 10 (0) | 0 / 0 / 0 / 0 | 10 | 24 | 3 | 278 | 21 | 2 |
| tunnel | 10 (10) | 0 / 0 / 0 / 0 | 10 | 25 | 3 | 9 | 3 | 1 |
| usine | 19 (10) | 0 / 0 / 0 / 0 | 19 | 43 | 14 | 373 | 24 | 6 |
| village | 113 (107) | 113 / 0 / 0 / 0 | 0 | 231 | 128 | 1298 | 431 | 279 |
| volcan | 13 (4) | 0 / 0 / 0 / 0 | 13 | 31 | 17 | 312 | 18 | 7 |

Total : 351 cartes. Graphe des connexions complet : `docs/audit/graphe/graphe_regions_complet.md` et `graphe_aretes_complet.tsv`.

## 3. Boss et combats d'histoire (chapitres 1 à 3)

| Chapitre | Boss | Niveau | Lieu | Remarque |
|---|---|---|---|---|
| 1 | Kuwagamon | 11 | Grand Arbre | défaite : retour chez Jijimon, sans K.O. compté |
| 1 | Shellmon | 17 | Antre de Shellmon (sous les cabines de la plage) | Tai et Greymon arrivent à 35 % de ses PV ; fin du chapitre 1 |
| 1-2 | Whamon | 24 | Crique du Radeau | facultatif ; décor de pleine mer |
| 2 | Monochromon | 21 | Rive Sud du lac | ouvre les rives du lac |
| 2 | Seadramon | 26 | Lac du Tramway (la nuit) | Matt et Garurumon arrivent à 40 % ; fin du chapitre 2 |
| 3 | Drimogemon | 29 | fond de la grotte de Sora (5 cartes sous le volcan) | gardien obligatoire avant Sora |
| 3 | Meramon | 30 | Mont Miharashi | sans Sora : combat écrasant et fuite ; avec Sora, Birdramon arrive à 40 % ; fin du chapitre 3 |

Taux de victoire mesurés selon le partenaire : `docs/audit/rapports/digimon_combats.md`, § 4.2.

## 4. Espèces de Digimon

81 espèces (8 Bébé, 9 Entraînement, 16 Disciple, 26 Champion, 17 Ultime, 5 Méga).
29 ont les images dessinées par le joueur (4 vues : combat, profil, face, dos) ; les autres sont dessinées par le code.
132 Digivolutions, dont 31 demandent un écusson (Ultime : l'écusson de l'enfant ; Méga : les écussons réunis).

« Sauvage » : premier chapitre où l'espèce se rencontre sur une carte atteinte (et nombre de ces cartes).

| Espèce | Stade | Types | Attribut | Images du joueur | Sauvage (ch. 1-3) | Digivolue en |
|---|---|---|---|---|---|---|
| Botamon | Bébé | Neutre | Données | oui | ch. 1 (1) | Koromon |
| Nyokimon | Bébé | Plante | Données | oui | ch. 1 (1) | Pyocomon, Yokomon |
| Pabumon | Bébé | Neutre | Données | oui | ch. 1 (1) | Mochimon |
| Pichimon | Bébé | Eau | Données | oui | ch. 1 (1) | Bukamon |
| Poyomon | Bébé | Neutre | Données | oui | ch. 1 (1) | Tokomon, Tanemon |
| Punimon | Bébé | Neutre | Données | oui | ch. 1 (1) | Tsunomon |
| YukimiBotamon | Bébé | Glace | Données | oui | — | Nyaromon |
| Yuramon | Bébé | Plante | Données | oui | ch. 1 (1) | Tanemon |
| Bukamon | Entraînement | Eau | Vaccin | oui | ch. 1 (5) | Gomamon, Betamon, Penguinmon |
| Koromon | Entraînement | Feu | Vaccin | oui | ch. 1 (2) | Agumon, Gabumon, Guilmon |
| Mochimon | Entraînement | Électrique | Données | non | ch. 1 (3) | Tentomon, Kunemon |
| Nyaromon | Entraînement | Lumière | Vaccin | non | — | Salamon |
| Pyocomon | Entraînement | Plante, Air | Données | non | — | Biyomon |
| Tanemon | Entraînement | Plante | Données | non | ch. 1 (4) | Palmon, Mushroomon |
| Tokomon | Entraînement | Lumière | Vaccin | non | ch. 1 (3) | Patamon, Elecmon |
| Tsunomon | Entraînement | Glace | Données | oui | ch. 1 (2) | Gabumon, Elecmon, Gotsumon, Patamon |
| Yokomon | Entraînement | Plante, Air | Données | non | ch. 1 (4) | Biyomon, Kunemon, Tentomon, Candlemon |
| Agumon | Disciple | Feu | Vaccin | oui | — | Greymon, Meramon, Monochromon, Numemon, Sukamon |
| Betamon | Disciple | Eau, Électrique | Virus | oui | ch. 1 (7) | Shellmon, Seadramon, Gekomon, Numemon, Sukamon |
| Biyomon | Disciple | Air, Feu | Vaccin | non | — | Birdramon, Meramon, Unimon, Numemon, Sukamon |
| Candlemon | Disciple | Feu | Données | non | ch. 3 (4) | Meramon, Numemon, Sukamon |
| Elecmon | Disciple | Électrique | Données | oui | ch. 1 (3) | Garurumon, Leomon, Centarumon, Numemon, Sukamon |
| Gabumon | Disciple | Glace | Données | non | — | Garurumon, Frigimon, Ogremon, Numemon, Sukamon |
| Gomamon | Disciple | Eau | Vaccin | non | — | Ikkakumon, Shellmon, Seadramon, Numemon, Sukamon |
| Gotsumon | Disciple | Terre | Données | non | ch. 1 (11) | Meramon, Monochromon, Drimogemon, Numemon, Sukamon |
| Guilmon | Disciple | Feu | Virus | non | ch. 3 (2) | Flarizamon, Numemon, Sukamon |
| Kunemon | Disciple | Insecte, Électrique | Virus | non | ch. 1 (7) | Kuwagamon, Kabuterimon, Numemon, Sukamon |
| Mushroomon | Disciple | Plante, Poison | Virus | oui | ch. 1 (7) | Togemon, Bakemon, Numemon, Sukamon |
| Palmon | Disciple | Plante | Données | oui | — | Togemon, Numemon, Sukamon |
| Patamon | Disciple | Air, Lumière | Données | non | — | Angemon, Unimon, Devimon, Numemon, Sukamon |
| Penguinmon | Disciple | Glace, Eau | Données | non | — | Frigimon, Numemon, Sukamon |
| Salamon | Disciple | Lumière | Vaccin | non | — | Gatomon, Numemon, Sukamon |
| Tentomon | Disciple | Insecte, Électrique | Vaccin | non | — | Kabuterimon, Numemon, Sukamon |
| Angemon | Champion | Lumière, Air | Vaccin | oui | — | MagnaAngemon, Piximon |
| Bakemon | Champion | Ténèbres | Virus | non | ch. 3 (1) | SkullMeramon |
| Birdramon | Champion | Feu, Air | Vaccin | oui | — | Garudamon |
| Centarumon | Champion | Terre, Lumière | Données | non | — | Andromon |
| Devimon | Champion | Ténèbres, Air | Virus | non | — | Megadramon |
| Drimogemon | Champion | Terre | Données | oui | ch. 3 (1) | Andromon |
| Flarizamon | Champion | Feu, Terre | Vaccin | non | ch. 3 (3) | SkullMeramon |
| Frigimon | Champion | Glace | Vaccin | non | — | Zudomon |
| Garurumon | Champion | Glace | Vaccin | oui | — | WereGarurumon |
| Gatomon | Champion | Lumière | Vaccin | non | — | Angewomon |
| Gekomon | Champion | Eau | Virus | non | — | Zudomon |
| Greymon | Champion | Feu | Vaccin | oui | — | MetalGreymon, SkullGreymon |
| Ikkakumon | Champion | Eau, Glace | Vaccin | oui | — | Zudomon |
| Kabuterimon | Champion | Insecte, Électrique | Vaccin | oui | — | MegaKabuterimon, Andromon |
| Kuwagamon | Champion | Insecte | Virus | oui | ch. 1 (1) | Okuwamon |
| Leomon | Champion | Terre, Feu | Vaccin | non | — | Etemon |
| Meramon | Champion | Feu | Données | oui | — | SkullMeramon |
| Monochromon | Champion | Terre, Feu | Données | oui | ch. 3 (1) | Megadramon |
| Numemon | Champion | Poison, Ténèbres | Virus | non | ch. 3 (2) | Monzaemon |
| Ogremon | Champion | Ténèbres, Terre | Virus | non | — | Etemon |
| Seadramon | Champion | Eau, Glace | Données | non | — | Megadramon |
| Shellmon | Champion | Eau | Données | oui | — | Zudomon |
| Sukamon | Champion | Poison | Virus | non | — | Monzaemon |
| Togemon | Champion | Plante | Données | oui | — | Lilimon |
| Unimon | Champion | Air, Lumière | Vaccin | non | — | Piximon |
| Whamon | Champion | Eau | Vaccin | oui | — | — |
| Andromon | Ultime | Électrique, Terre | Vaccin | non | — | — |
| Angewomon | Ultime | Lumière, Air | Vaccin | non | — | Ophanimon, Magnadramon |
| Etemon | Ultime | Ténèbres, Terre | Virus | non | — | — |
| Garudamon | Ultime | Feu, Air | Vaccin | non | — | — |
| Jijimon | Ultime | Neutre | Données | non | — | — |
| Lilimon | Ultime | Plante, Lumière | Données | non | — | — |
| MagnaAngemon | Ultime | Lumière, Air | Vaccin | non | — | — |
| Megadramon | Ultime | Air, Ténèbres | Virus | non | — | — |
| MegaKabuterimon | Ultime | Insecte, Électrique | Vaccin | non | — | — |
| MetalGreymon | Ultime | Feu, Lumière | Vaccin | non | — | WarGreymon |
| Monzaemon | Ultime | Lumière | Vaccin | non | — | — |
| Okuwamon | Ultime | Insecte, Ténèbres | Virus | non | — | — |
| Piximon | Ultime | Lumière, Air | Données | non | — | — |
| SkullGreymon | Ultime | Ténèbres, Feu | Virus | non | — | — |
| SkullMeramon | Ultime | Feu, Ténèbres | Données | non | — | — |
| WereGarurumon | Ultime | Glace | Vaccin | non | — | MetalGarurumon |
| Zudomon | Ultime | Eau, Terre | Vaccin | non | — | — |
| Magnadramon | Méga | Lumière, Feu | Vaccin | non | — | — |
| MetalGarurumon | Méga | Glace | Données | non | — | Omegamon |
| Omegamon | Méga | Lumière, Glace | Vaccin | non | — | — |
| Ophanimon | Méga | Lumière | Vaccin | non | — | — |
| WarGreymon | Méga | Feu, Lumière | Vaccin | non | — | Omegamon |

## 5. Objets

153 objets. Catalogue complet, avec l'effet mesuré de chacun : `docs/audit/rapports/systemes.md`, annexe A.

| Usage | Nombre | Objets |
|---|---|---|
| soins et nourriture | 71 | RAM PV, RAM PV+, RAM PV++, Super RAM PV, Double disquette, Omnipotent, Eau fraîche, Viande, Viande géante, Surlonge, Steak, Digichampignon, Champignon glacé, Champignon de luxe, Champignon joyeux, Super carotte, Radis faucon, Digi-pomme de pin, Légume épineux, Pomme bleue, Baie rouge, Grosse baie, Noix douce, Super légume, Figue de Barbarie, Orange-banane, Fruit de force, Glace de force, Feuille de vitesse, Fruit du sage, Igname musclée, Baie calme, Melon chaîne, Viande moisie, Plante de pluie, Pain frais, Croissant, Brioche, Macaron, Éclair au chocolat, Tarte aux fruits, Gâteau de fête, Digi-anchois, Digi-vivaneau, Digi-truite, Truite noire, Digi-silure, Digi-bar, Miel doré, Piment de feu, Eau de source, Lait de cactus, Truffe des bois, Sucre d'ourson, Algue marine, Glace pilée, Riz, Brochette pimentée, Grillade au sel, Soupe aux champignons, Ragoût du potager, Poisson laqué au miel, Sushis de l'île, Curry de Meramon, Salade croquante, Tarte maison, Pain au miel, Sorbet de Frigimon, Smoothie bleu, Gratin à la truffe, Festin de l'Île |
| objets de Digivolution | 26 | Griffes grises, Boule de feu, Aile de flammes, Sabot de fer, Pierre Mono, Foreuse d'acier, Aile noire, Massue à pointes, Crinière de feu, Aile blanche, Haillon déchiré, Corne de licorne, Casque à corne, Mâchoire-ciseaux, Gourde d'eau, Coquille rouge, Cristal bleu, Cristal de glace, Pièce de métal, Os fatal, Pièce cyber, Méga-main, Petite lance, Bandage X, Banane dorée, Miroir de lune |
| équipements | 16 | Griffes de bronze, Crocs d'acier, Gants de flamme, Lame digitale, Marteau Titan, Épée Chrome Digizoïde, Veste de cuir, Plastron de bronze, Armure digitale, Carapace de Monochromon, Armure Chrome Digizoïde, Bandeau, Lunettes d'aviateur, Anneau PM, Plume ardente, Pendentif Écusson |
| puces (bonus permanents) | 9 | Puce Attaque, Puce Défense, Puce Cerveau, Puce Vitesse, Puce PV, Puce PM, Puce DV A, Puce DV D, Puce DV E |
| renfort en combat | 7 | Disque Attaque, Disque Défense, Disque Vitesse, Disque Omni, Super disque Attaque, Super disque Défense, Super disque Vitesse |
| objets passifs (outils, sacs) | 6 | Manuel d'entraînement, Bâton solide, Petite pelle, Canne à pêche, Oreiller, Chaussures santé |
| PM | 3 | RAM PM, RAM PM+, RAM PM++ |
| objets de quête ou de vente | 3 | Gland d'or, Sel de roche, Farine |
| réveil | 2 | Disque Réveil, Super Réveil |
| statut | 1 | Remède universel |
| protection en combat | 1 | Protection |
| blessure | 1 | Bandage |
| maladie | 1 | Médicament |
| retour à la ville | 1 | Pilote automatique |
| pot portable | 1 | Pot portable |
| manuel de technique | 1 | Manuel de technique |
| répulsif | 1 | Répulsif |
| cloche | 1 | Cloche à Digimon |
| paquets de cartes | 1 | Paquet de cartes |

## 6. Quêtes, événements et drapeaux

69 drapeaux déclarés (`js/data/flags.js`) : chacun est un événement ou un état de l'histoire.
Quêtes annexes des chapitres 1 à 3 : les Bukamon égarés (chapitre 2), la soif des Yokomon et le trésor de l'épave (chapitre 3),
les demandes des habitants (26 profils, plus un profil commun ; la 3e demande réussie donne l'objet de Digivolution de l'habitant),
les recettes de Mushroomon, l'album de cartes.

| Drapeau | Signification |
|---|---|
| `starter` | espèce du premier partenaire choisi (active la sauvegarde automatique) |
| `shellLair` | le sable s'est ouvert sous les cabines : l'antre de Shellmon (maps/antre.js) |
| `kuwaChase` | poursuite de Kuwagamon vue (première entrée dans la forêt) |
| `yokoQuest` | la doyenne des Poyomon a demandé de l'eau pour le puits |
| `yokoWell` | le puits du village des Poyomon coule de nouveau |
| `yokoTunnel` | échelle du puits des Poyomon découverte (souterrain vers la maison de Jijimon) |
| `jijiTunnel` | souterrain de Jijimon visité |
| `jijiTrap` | trappe du souterrain ouverte dans la maison de Jijimon |
| `yokoBath` | jour du dernier bain dans la source chaude des Poyomon |
| `yokoWellGift` | trésor du fond du puits des Poyomon trouvé (Puce PV) |
| `yokoWellDay` | jour de la dernière bouteille d'Eau de source puisée au puits des Poyomon |
| `taiTrain` | jour du dernier entraînement à deux avec Tai |
| `taiMatch` | jour du dernier match amical contre le Greymon de Tai |
| `taiLead` | Tai a parlé du garçon blond vu près du lac (piste du chapitre 2) |
| `album1` | récompense de l’album du chapitre 1 reçue (Jijimon) |
| `gotsuBet` | parties du pari de Gotsumon aujourd’hui { d, n } |
| `biyoGame` | jour du dernier jeu du courrier de Biyomon |
| `boothPos` | énigme des cabines : nombre de mots déjà entendus dans le bon ordre |
| `ankhs` | Crypte des Gardiens : les ankhs déjà rallumés (tableau, 0 à 2) ; les trois ouvrent la porte scellée vers Shellmon (maps/antre.js) |
| `biyoHint` | Biyomon : nombre d’indices donnés (un Digimon différent à chaque visite) |
| `gymIntro` | Leomon a présenté le Gymnase (résistances aux éléments, maps/gymnase.js) |
| `kuwagamon` | Kuwagamon vaincu (Grand Arbre de la clairière ; le chapitre 1 continue jusqu’à Shellmon) |
| `kuwaSeen` | entré dans le Grand Arbre (les racines se sont refermées) |
| `shellmon` | Shellmon vaincu (antre sous la plage, fin du chapitre 1) |
| `whamon` | Whamon libéré de son Engrenage Noir (Crique du Radeau) |
| `devimon` | Devimon vaincu |
| `ending` | fin du jeu vue |
| `berceau` | première visite au Village des Bébés |
| `tanemon` | premier échange avec Tanemon au DigiChamp |
| `gift_tanemon` | cadeau de Tanemon reçu (sentier) |
| `jiji_tanemon` | conseil de Jijimon sur le DigiChamp entendu |
| `tour` | visite guidée de la ville par Koromon faite (chapitre 1) |
| `chapter` | chapitre en cours (2 = après Shellmon, 3 = après Seadramon, 4 = après Meramon) |
| `monoSeen` | combat des deux Monochromon vu (Rive Sud) |
| `monoCh2` | Monochromon de la Rive Sud vaincu (le chemin du lac est libre) |
| `harmo` | harmonica de Matt entendu au Lac du Tramway |
| `mattMet` | Matt rencontré près de son feu de camp (île du tramway) |
| `seadramon` | Seadramon vaincu, Matt délivré (fin du chapitre 2) |
| `yokoVillage` | arrivée au Village des Yokomon (chapitre 3) |
| `soraMet` | Sora retrouvée (au fond des souterrains du Mont Miharashi ; elle et Biyomon viennent affronter Meramon) |
| `biyoAide` | Biyomon, remontée seule à la fontaine, a supplié le héros d'aller chercher Sora sous la montagne (chapitre 3) |
| `svDescente` | première descente dans les souterrains du Mont Miharashi (maps/sous_volcan.js) |
| `svRocher` | le gros rocher de la Galerie des Foreurs poussé par un Champion (la galerie du trésor est ouverte) |
| `svGardien` | Drimogemon, gardien possédé de la source, libéré de son Engrenage Noir (l'échelle des foreurs est ouverte) |
| `svEruption` | éruption des Corniches de l'Abîme : 'evitee' (on a quitté les corniches à temps) ou 'subie' (game/perils.js) |
| `arrosage` | jour de la dernière partie d'arrosage des fleurs au Village des Yokomon (game/minijeux.js) |
| `mihaFire` | grondement du Mont Miharashi entendu (Meramon au sommet) |
| `meramon` | Meramon calmé au sommet du Mont Miharashi, l’eau revient au village (fin du chapitre 3) |
| `bukaQuete` | quête des Bukamon égarés (chapitre 2) : 1 acceptée, 2 terminée |
| `bukaTrouves` | Bukamon égarés retrouvés (un bit par rive : lac1, lac4, lac6) |
| `yokoSoif` | Yokomon assoiffé de l’oasis du Désert des Poteaux secouru (chapitre 3) |
| `crestSeen` | premier portail d'écusson découvert (la page ÉCUSSONS du Journal apparaît) |
| `bota` | prochain conseil de Koromon, le guide de la ville (compteur) |
| `cups` | coupes du Colisée remportées { nom: true } |
| `cuisineTip` | explication de la cuisine entendue (game/cuisine.js) |
| `dojoDay` | jour des dernières séances au Dojo agrandi { zen, combat } |
| `maraich` | jour de la dernière récolte offerte par chaque maraîcher de la serre { maraicher_xxx: jour } |
| `recipeQuest` | recette que Mushroomon a demandé de préparer (quête en cours) |
| `cookIntro` | présentation de la cuisine en ville entendue (maps/village.js) |
| `homeIntro` | première visite de la maison du joueur (maps/joueur.js) |
| `meat` | jour de la dernière récolte de Digiviande |
| `harvest` | jour de la dernière récolte de Palmon |
| `fish` | heure de la dernière pêche |
| `canne` | canne à pêche reçue de Gomamon (champs) |
| `rod` | minute de jeu du dernier lancer avec la canne (game/peche.js) |
| `whamonDay` | jour du dernier trésor de Whamon (Crique du Radeau) |
| `eggDay` | jour du dernier DigiŒuf pris |
| `findDay` | jour des trouvailles au sol (game/sol.js) |
| `findN` | nombre de trouvailles apparues au sol ce jour-là (3 max) |

## 7. Musiques

30 musiques synthétisées (aucun fichier son) : title, field, beach, village, battle, boss, temple, harmonica, seadramon, shellmon, evolve, victory, forest, mountain, volcano, savanna, factory, trash, canyon, dino, jungle, cemetery, fog, toy, snow, lake, swamp, cave, dungeon, beetle.
