# Audit intégral — objets, quêtes, événements, sauvegardes et sons

Relecteur « systèmes », 22/10/2026. Audit mené sur `main` (commit `f987c32` ; les commits `b111987` et `a31c07e`, arrivés
pendant l'audit — collisions, salle de classe, entrée des Poyomon, pas du partenaire —, ont été relus : numéros de ligne
à jour sur `a31c07e`, essais principaux relancés dessus, voir § 7). Lecture et essais seulement : aucun fichier du dépôt
modifié, aucun commit, panneau navigateur non utilisé.

## Méthode

- Le jeu est chargé dans Node **exactement comme `dev/tests.js`** (faux DOM, liste `js/scripts.js`, contexte principal) :
  `harness.js`. Les essais appellent les **vraies** données et fonctions (`DW.ITEMS`, `BagScene.use`, `ShopScene.update`,
  `DW.save`/`DW.load`, `DW.SaveFile.merge`, `DW.Chapter.*`, `DW.Kuwa.*`, `DW.Antre.*`, `DW.SousVolcan.*`, `DW.Quetes`,
  `DW.Requests`, `DW.Audio`...).
- La progression des chapitres 1 à 3 est jouée par `s04_progression.js` avec un **vrai `Overworld`** (rendu neutralisé,
  dialogues et écrans instantanés). Seul le résultat des combats est imposé (défaite d'abord pour chaque boss, puis
  victoire).
- Suite existante : `node dev/tests.js` → **53 réussis, 0 échoué** (`out_tests_existants.txt`). Elle couvre déjà :
  aller-retour simple, espèce disparue, sauvegarde illisible, migrations v2→v5, drapeaux déclarés, quêtes annexes,
  Meramon sans Sora, Corniches, sauvetage de Sora. Ce rapport ne répète pas ces points, il cherche ce qu'ils ne voient pas.
- Mentions : **[SCRIPT]** = vérifié par un script (nom du script) ; **[LU]** = seulement lu dans le code ; **[NON VÉRIFIÉ]** =
  pas pu être vérifié ici (navigateur réel).
- Gravités : **P0** bloquant critique · **P1** majeur (toute perte de sauvegarde y est au moins) · **P2** intermédiaire ·
  **P3** mineur.

## Résumé

| Gravité | Nombre | Anomalies |
|---|---|---|
| P0 | 1 | SYS-01 |
| P1 | 3 | SYS-02, SYS-03, SYS-04 |
| P2 | 6 | SYS-05 à SYS-10 |
| P3 | 30 | SYS-11 à SYS-40 |
| **Total** | **40** | |

Répartition par domaine : objets et économie 15 (SYS-05 à 08, 11 à 20, 40) ; quêtes et événements 7 (SYS-01, 21 à 26) ;
sauvegardes 11 (SYS-02 à 04, 09, 27 à 33) ; sons 7 (SYS-10, 34 à 39).

Les plus graves :
1. **SYS-01 (P0)** — si le jeu est fermé pendant l'écran de **bilan d'un chapitre**, la partie est rechargée **au chapitre
   précédent** avec le boss déjà vaincu : le voile ne se lève jamais et rien ne relance la fin du chapitre. Partie
   bloquée pour toujours (chapitres 1 et 2 vérifiés ; chapitre 3 : même défaut, sans effet tant que le chapitre 4 n'existe pas).
2. **SYS-02 (P1)** — une sauvegarde principale abîmée cache la copie précédente encore lisible : « Nouvelle partie »
   montre l'emplacement **vide**, le sélectionne d'office, ne prévient pas, et la vraie partie est écrasée deux
   sauvegardes plus tard.
3. **SYS-03 (P1)** — relier un fichier (FICHIER) dont la partie est plus récente remplace la partie locale ; la copie
   « précédente » qui devait la garder est écrasée à la sauvegarde suivante (« rien n'est perdu » est faux).
4. **SYS-05 (P2)** — un coffre de la grotte de Sora (chapitre 3) donne un **Bandage X** : n'importe quel Champion devient
   Monzaemon (**Ultime**) sans écusson. Tous les objets de Digivolution ignorent les écussons.
5. **SYS-06/07 (P2)** — sac plein (20 sortes) : la **Canne à pêche** de Gomamon est perdue à jamais (aucun message), et
   les récompenses uniques (Gants de flamme, Puce PV, Puce Défense, coffres) disparaissent ; « laissé sur place » est faux.

Ce qui marche bien (vérifié) : aller-retour sauvegarde → chargement **sans aucun écart** sur un état riche (équipe
évoluée, puces, équipements, parcours, statut, sac/coffre/frigo, drapeaux, requêtes, coffres, positions, orphelins) ;
stockage plein géré (avertissement, partie gardée pour FICHIER) ; toutes les migrations ; aucune consommation sans
décompte ; aucun arbitrage achat/revente ; aucune récompense de quête donnée deux fois ; toutes les musiques demandées
existent ; progression complète du chapitre 1 au carton « À suivre » sans erreur, drapeaux tous déclarés.

---

## 1. Objets et économie

### 1.1 Ce qui a été mesuré

- **153 objets** (`DW.ITEM_ORDER` = `DW.ITEMS`, aucun doublon, aucun absent) : catalogue complet en annexe A (id, nom,
  icône, usage, prix/revente, rang, boutiques, **effet réellement mesuré**). [SCRIPT `s01_items.js`, `s02_usages.js`]
- Chaque objet a été **utilisé depuis le vrai sac** (`BagScene.use`, hors combat puis en combat) sur un partenaire affamé,
  assoiffé, fatigué, blessé, malade et empoisonné : **tous les consommables décomptent 1**, les objets passifs et
  « en combat » ne décomptent pas hors combat, le combat décompte à part (`battle.js:217-221`). [SCRIPT `s02_usages.js`]
- Objets passifs bien branchés : Manuel d'entraînement (`training.js:69,192`), Oreiller (`life.js:139`), Chaussures santé
  (`overworld.js:385`), Bâton et Pelle (`paysage.js:44,55`, usure `paysage.js:31-38`), Canne (`peche.js:33`), Répulsif /
  Cloche (`wild.js:139-141`). [LU]
- Règle « la nourriture ne soigne plus » (`items.js:132-143`) : aucune nourriture ne rend de PV/PM ; toutes font grossir
  (`care.js:103-111`). [SCRIPT]
- Achats/ventes avec la vraie `ShopScene` : quantité bornée par le sac (10) et les Bits, jamais de Bits négatifs, Canne
  invendable (`sell: 0`), **aucun arbitrage** même avec la remise du Comptoir (-15 %). Toutes les dépenses de Bits du jeu
  sont gardées (contrôles : `gymnase.js:138`, `joueur.js:403`, `regions.js:336`, `village.js:489,548,576`). [SCRIPT `s03_boutiques.js`, LU]
- Sac : 20 sortes (+4 par Grand sac), 10 par objet ; frigo : nourriture seulement, 20 par objet ; coffre/banque : tout sauf
  la nourriture, **sans limite**. [SCRIPT]
- Stocks selon chapitre et ville (`DW.shopStock`, plafond de rang 4/7/10 aux chapitres 1/2/3) : Bazar 11 → 37 objets,
  Restaurant 4 → 16 ; Disques 0 → 4, Puces 0 → 4, Librairie 0 → 4, Boutique de nuit 1 → 4, Évolution et « fruits » 0
  (leurs marchands n'arrivent qu'après le chapitre 3 : cohérent). Les objets de Digivolution **Ultimes** (rang 24) ne
  sont **jamais** vendus (rang maximum 20). [SCRIPT `s01_items.js`]
- Distributeurs : posés sur sentier, plage, Géants, lac0, montagne0, savane0... (12 prévus, 11 posés). [SCRIPT]

### 1.2 Anomalies

**SYS-05 — P2 — Objets de Digivolution : un Ultime sans écusson, dès le chapitre 3** [SCRIPT `s09_coffres.js`, `s02_usages.js`]
- Où : `maps/sous_volcan.js:346` (coffre 9,18 de « sous_volcan3 » : Bandage X + 2 paquets) ; `game/objets.js:26`
  (`canUse` 'evo' : seulement le stade) ; `ui/sac.js:35-46` (évolue sans `DW.Evo.check`) ; plus tard `game/requests.js:28,36-40`
  (Pièce cyber, Méga-main, Petite lance, Bandage X, Banane dorée, Os fatal confiés par des recrues) et `maps/palais.js:144`.
- Reproduction : chapitre 3, ouvrir le coffre (accessible à pied) → Sac → Bandage X sur un Champion. Mesuré : Greymon N.25
  devient **Monzaemon (Ultime)**, Attaque 456, alors que `DW.Crests.requirement('monzaemon')` exige l'écusson de la Pureté
  (0 écusson possédé). Pareil avec Pièce de métal (MetalGreymon), Os fatal, etc.
- Impact : la règle « aucun Digimon ne dépasse Champion sans son écusson » (README, ARCHITECTURE) saute ; Meramon (N.30)
  devient trivial.
- Correction : dans `DW.canUse` 'evo' et `BagScene.use`, refuser si `DW.Crests.requirement(it.to)` n'est pas rempli
  (message « Il faut l'écusson ... ») ; et/ou remplacer le Bandage X du coffre par un objet de Champion.

**SYS-06 — P2 — Canne à pêche perdue pour toujours si le sac est plein** [SCRIPT `s03b_canne.js`]
- Où : `maps/champs.js:174-178` (`s.flags.canne = true; DW.giveItem('canne', 1)` sans regarder le reste).
- Reproduction : 20 sortes d'objets dans le sac, parler à Gomamon aux Champs la première fois → « Tu reçois la Canne à
  pêche ! » mais canne = 0, `flags.canne` = true ; sac vidé, 2e visite : plus de canne offerte ; aucune boutique ne la
  vend ; `DW.Peche.has()` reste faux.
- Impact : pêche partout impossible pour toute la partie (restent le ponton des activités et les poissons du Village des
  Gomamon) ; message mensonger.
- Correction : ne poser le drapeau que si `DW.bagRoom('canne') > 0` (sinon « Ton sac est plein, reviens ! ») ; ou redonner
  la canne si elle n'est ni dans le sac ni au coffre ; ou exempter les objets uniques de la limite de sortes.

**SYS-07 — P2 — Sac plein : récompenses uniques et coffres perdus, « laissé sur place » faux** [SCRIPT `s03_boutiques.js` ; LU pour les sites]
- Où : `game/objets.js:108-113` (`giveItem` renvoie le surplus, `extraMsg` dit « laissé sur place » mais rien n'est posé :
  `state.ground` reste vide) ; sites uniques : `game/chapitre3.js:185` (Gants de flamme, arme unique, rang 99),
  `maps/sous_volcan.js:534` (Puce Défense), `maps/yokomon.js:95` (Puce PV du puits), `maps/palais.js:69-71` (coffres : marqués
  vides AVANT de donner, surplus ignoré, aucun message), `maps/foret.js:86`, `game/guide.js:97`, `maps/village.js:350`,
  `js/main.js:46` (surplus ignoré sans message).
- Reproduction : sac à 20 sortes, `DW.giveItem('gants_flamme')` → 1 laissé, message « laissé sur place... Range tes affaires
  à la maison ! », aucun objet au sol, plus jamais redonné.
- Impact : perte définitive d'objets d'histoire ; le message incite à revenir chercher un objet qui n'existe pas.
- Correction : envoyer le surplus au coffre (`state.bank`, déjà partagé avec la Banque, sans limite) avec « envoyé au coffre
  de ta maison » ; pour les coffres, ne marquer « ouvert » que si tout tient.

**SYS-08 — P2 — Champignons lumineux : Champignon de luxe à volonté dès le chapitre 1** [SCRIPT `s08_cueillette.js` (comptage) ; LU (tirage)]
- Où : `game/paysage.js:63-66` (cueillir : **toujours** un objet, 20 % de Champignon de luxe) ; `data/items.js:67`
  (Champignon de luxe : rang 20, 5000 Bits, +4 Att/Déf/Vit/Int pour toujours, mangeable même rassasié : `objets.js:14`).
- Mesure : **49** champignons cueillables chaque jour sur les cartes du chapitre 1 (33 lumineux + 16 géants : Clairière,
  Sentier, Géants, Dunes, Bosquet, Grand Arbre...), **79** de plus au lac. Espérance ≈ 10 Champignons de luxe par jour au
  chapitre 1 (≈ +40 à quatre stats par jour, ou ~25 000 Bits à la revente), alors que les boutiques du chapitre 1 sont
  plafonnées au rang 4. Les 8 grands arbres (Bâton) donnent aussi des Glands d'or (revente 6000).
- Impact : économie et équilibrage des chapitres 1-3 contournés (l'en-tête de `paysage.js` promet « le plus souvent... rien
  du tout »).
- Correction : chance de luxe à 1-3 %, ou « rien » la plupart du temps comme les autres éléments, ou plafond quotidien.

**SYS-11 — P3 — Description cassée du Gâteau de fête** [SCRIPT `s01_items.js`]
- Où : `data/items.js:97` réécrit par `DW.foodRule` (`items.js:132-142`).
- Constat : « mais il fait grossir. Rassasie bien, rend heureux. » (commence par « mais »).
- Correction : écrire la description finale à la main (ex. « Beaucoup de bonheur... mais il fait grossir. »).

**SYS-12 — P3 — Fruits à 1000 Bits qui ne font plus rien de plus qu'un Digichampignon à 100** [SCRIPT `s02_usages.js`]
- Où : `data/items.js:77,78,80` (Noix douce, Super légume, Orange-banane : leur soin a été retiré par `foodRule`) ; aussi
  Steak (1000) = Viande géante (500), Digi-silure (2000) = Digi-truite (300).
- Mesure : Noix douce → faim -25, bonheur +5, poids +0,2 : exactement le Digichampignon. Description : « Calme la faim. Fait
  prendre du poids. »
- Correction : redonner un effet propre (bonheur, fatigue, discipline) ou baisser les prix.

**SYS-13 — P3 — Chiffres des descriptions justes seulement pour un Disciple** [SCRIPT `s02_usages.js`]
- Où : `data/items.js:37-45,81-86`, `data/equipements.js:35` (texte = points × 4 ou × 20), `game/monster.js:56-60`
  (`stageMult` multiplie aussi les puces et l'équipement).
- Mesure : Puce Attaque « +50 » → Bébé +42, Entraînement +46, Disciple +50, Champion +78 ; Épée Chrome « Att +128 » →
  Champion +199 ; PM : jamais multipliés. Le message après usage, lui, affiche le vrai gain.
- Correction : « environ » dans les textes, ou ajouter les bonus après le multiplicateur de stade.

**SYS-14 — P3 — Boutique du Village des Yokomon : Viande géante listée deux fois** [SCRIPT `s03_boutiques.js`]
- Où : `maps/regions.js:306` (spécialité `super_viande`) + `regions.js:322` (déjà dans la base).
- Correction : filtrer les doublons (`[...new Set(...)]`) ou changer la spécialité.

**SYS-15 — P3 — « Sac plein (10 max) ! » quand le vrai motif est l'absence de place (20 sortes)** [SCRIPT `s03_boutiques.js`]
- Où : `ui/boutique.js:41`, `game/cuisine.js:157`.
- Correction : distinguer « 10 exemplaires au plus » et « plus de place dans le sac (20 sortes) ».

**SYS-16 — P3 — Manuel de technique utilisable en plein combat, sur le premier Digimon seulement** [SCRIPT `s02_usages.js`]
- Où : `ui/sac.js:53-59` (pas de test `this.o.battle`, toujours `party[0]`).
- Constat : en combat, « Agumon étudie le manuel... apprend Flamme Bébé ! » sans passer de tour.
- Correction : refuser en combat (comme les paquets de cartes) et choisir le Digimon (`PartyScene`).

**SYS-17 — P3 — Gants de flamme (cadeau unique de Meramon) vendables, jamais rachetables** [SCRIPT `s03_boutiques.js`]
- Où : `data/equipements.js:16` (pas de `sell: 0`), `ui/boutique.js:13`.
- Correction : `sell: 0` comme la Canne (ou confirmation avant de vendre un objet unique).

**SYS-18 — P3 — Boutique « fruits » définie mais jamais ouverte** [LU, grep]
- Où : `data/items.js:154` ; aucun PNJ n'appelle `ShopScene('fruits')` (les fruits de force ne viennent que des cadeaux de
  Drimogemon et des requêtes).
- Correction : la donner à un marchand (Lillymon, Palmon) ou la retirer.

**SYS-19 — P3 (à décider) — Coffre de la maison et Banque de Kunemon : un seul et même stock** [SCRIPT]
- Où : `ui/sac.js:112-113` (store par défaut 'bank'), `maps/joueur.js:149`, `maps/village.js:534`.
- Constat : ce qu'on range au coffre ressort à la Banque, et inversement. Pratique, mais jamais dit au joueur (Koromon
  parle d'un « coffre », Kunemon d'une « Banque »).
- Correction : l'annoncer (« la Banque et ton coffre sont reliés ») ou séparer les stocks.

**SYS-20 — P3 — Textes de la quête des Bukamon** [LU]
- Où : `game/quetes.js:40` (« 1 Disque PM » : l'objet s'appelle « RAM PM ») ; `game/quetes.js:28` (« Avec Seadramon qui
  rôde dans le lac », dit même après la défaite de Seadramon, quand la quête est prise au chapitre 3).
- Correction : `${DW.ITEMS.disque_pm.name}` ; variante de la réplique si `flags.seadramon`.

**SYS-40 — P3 — Distributeur prévu sur « tunnel0 » jamais posé** [SCRIPT `s03_boutiques.js`]
- Où : `maps/distrib.js:43-55` : aucune case de « tunnel0 » ne remplit les conditions (dégagé 3 × 5, sol `.f,`), la carte
  reste sans machine (région d'un chapitre futur : sans effet aujourd'hui).
- Correction : place de repli (la case libre la plus proche du carrefour) ou retirer la carte de la liste.

---

## 2. Quêtes et événements

### 2.1 Progression déroulée (chapitres 1 à 3) [SCRIPT `s04_progression.js`, sortie `out_s04_progression.txt`]

Drapeaux posés, dans l'ordre réel :
1. Début dans la forêt (`Debut.run`) : `starter`, `kuwaChase` → réveil chez Jijimon, 1re sauvegarde.
2. Visite de Koromon : `tour`.
3. Grand Arbre : mauvaise réponse → combat (gardien) ; 3 bonnes réponses → énigme résolue, porte ouverte.
4. Dans l'arbre : `kuwaSeen` (sortie fermée) ; défaite → maison, `kuwaSeen` remis à faux, 0 K.O. compté ; victoire →
   `kuwagamon`, trophée, sortie ouverte.
5. Cabines (désordre puis ordre) : `boothPos`, `shellLair` ; antre : galeries → lagune → temple → crypte, `ankhs` [3/3],
   porte ouverte.
6. Shellmon (défaite → maison ; victoire avec Greymon à 35 %) : `shellmon`, Tai délivré, **`chapter` = 2**.
7. Rive Sud : `monoSeen` (chemin fermé) → défaite → victoire : `monoCh2`, chemins lac1/lac3 ouverts.
8. Bukamon égarés : `bukaQuete` 1 → `bukaTrouves` 7 → `bukaQuete` 2, +300 Bits, une seule fois (Gomamon disparaît).
9. Lac du Tramway à 21 h : `harmo` ; Matt : `mattMet`, défaite → maison ; nuit suivante, victoire (Garurumon à 40 %) :
   `seadramon`, `gears.lac`, Matt délivré, Seadramon recruté, **`chapter` = 3**.
10. Oasis : sans eau rien ; avec une Eau fraîche → `yokoSoif`.
11. Village des Yokomon : `yokoVillage`, Biyomon → `biyoAide` (Sora absente : normal).
12. Meramon **sans Sora** : `mihaFire`, combat « écrasant » → 1 PV, fuite, retour au village soigné, `meramon` reste faux.
13. Grotte de Sora : cercle 1 (rocher poussé par un Champion : `svRocher`) → cercle 2, compte à rebours de 15 s → on part :
    `svEruption` = 'evitee' → cercles 3, 4, 5 → gardien Drimogemon (défaite → maison, victoire) : `svGardien`, `soraMet`,
    Puce Défense.
14. Fontaine : Sora et Biyomon visibles ; Meramon **avec Sora** (défaite → maison ; victoire, Birdramon à 40 %) : `meramon`,
    `gears.miharashi`, Sora délivrée, Meramon recruté, Gants de flamme, **`chapter` = 4**, carton « À SUIVRE... ».
15. Épave : coffre en 25,51 (Disque Défense + 2 paquets), une seule fois.

Résultat : aucune erreur, **aucun drapeau inconnu**, 30 sauvegardes écrites pendant la partie. L'éruption **subie**
(rester 15 s) pose `svEruption` = 'subie' ; une sauvegarde puis un rechargement pendant le compte à rebours le relancent à
15 s (on peut toujours l'éviter) [SCRIPT `s04b_eruption.js`].

Requêtes des habitants des chapitres 2-3 (Seadramon, Shellmon, Meramon, Birdramon) : toutes faisables (éléments Eau, Feu,
Air présents chez les sauvages ; poissons pêchés ou vendus au Village des Gomamon) ; la 3e réussite donne bien l'objet de
Digivolution, le « ! » disparaît une fois la requête du jour rendue. [SCRIPT `s07_requetes.js`]

### 2.2 Anomalies

**SYS-01 — P0 — Fin de chapitre interrompue : partie bloquée pour toujours** [SCRIPT `s04_progression.js`, section INTERRUPTION]
- Où : `maps/antre.js:454-455` (`DW.autosave()` PUIS `end1()`), `game/chapitre1.js:134-160` (`chapter` = 2 en mémoire
  ligne 137, sauvegardé seulement ligne 160, après le carton, le **bilan qui attend une touche**, deux répliques de Jijimon
  et le carton « CHAPITRE 2 ») ; même schéma `game/chapitre2.js:255-256` + `375-403`, et `game/chapitre3.js:191-192` +
  `196-223`. Pendant ces écrans, la sauvegarde d'arrière-plan ne joue pas (`game/sauvegarde.js:114-117` : seulement si la
  carte est au premier plan).
- Reproduction : vaincre Shellmon, puis fermer l'onglet ou l'appli (ou laisser le téléphone la tuer) pendant « BILAN DU
  CHAPITRE 1 » → Continuer. Mesuré sur la sauvegarde réelle prise à l'ouverture du carton : chapitre 1, `shellmon` vrai,
  Tai délivré ; `DW.Chapter.lock('lac0')` = **fermé** ; une revanche contre Shellmon ne rappelle pas `end1` (chapitre reste
  1). Chapitre 2 : rechargée au chapitre 2 avec Seadramon vaincu et Matt délivré ; désert **fermé**, Matt n'apparaît plus,
  objectif « Matt et Gabumon vivent chez toi. ». Chapitre 3 : rechargée au chapitre 3 (sans effet visible tant que le
  chapitre 4 n'existe pas, bloquant ensuite).
- Impact : la partie ne peut plus avancer (seule issue : recommencer) ; l'écran de bilan est justement un moment où l'on
  pose la manette.
- Correction : dans `end1/end2/end3`, appeler `DW.autosave()` juste après `s.flags.chapter = N` (avant les écrans) ; et
  réparer les parties déjà touchées dans `parseState` (`sauvegarde.js:129-164`) : `shellmon` ⇒ chapitre ≥ 2,
  `seadramon` (ou `gears.lac`) ⇒ ≥ 3, `meramon` ⇒ ≥ 4.

**SYS-21 — P3 — Requêtes de statistiques déjà remplies d'avance** [SCRIPT `s07_requetes.js`]
- Où : `game/requests.js:19-45` (seuils 100-150 écrits avant l'échelle ×4 de `DW.SCALE`), `requests.js:60` (mise à
  l'échelle par le niveau seulement).
- Mesure : Birdramon demande Vitesse ≥ 83 / 138 / 193 (niveaux 15 / 25 / 35) ; un Greymon sans entraînement a 161 / 254 /
  365.
- Correction : multiplier les seuils par `DW.SCALE.stat` (et `DW.SCALE.hp` pour les PV) ou les exprimer en points
  d'entraînement.

**SYS-22 — P3 — Requêtes « vaincre » : seules les rencontres visibles comptent** [LU]
- Où : `game/wild.js:198` (seul appel de `Requests.onWin`) ; les embuscades du décor (`paysage.js:22-29`) et le gardien du
  Grand Arbre (`kuwagamon.js:39-43`) ne comptent pas.
- Correction : appeler `onWin` dans `Overworld.battle` pour tout combat non-boss gagné.

**SYS-23 — P3 — « La soif des Yokomon » disparaît sans un mot si Meramon est calmé avant** [LU]
- Où : `game/quetes.js:90` (condition `!s.flags.meramon`).
- Impact : quête annexe (et sa récompense) perdue ; logique dans l'histoire, mais le Journal ne la mentionne pas.
- Correction : garder le Yokomon (« J'ai entendu que l'eau est revenue ! Merci quand même ») avec sa récompense.

**SYS-24 — P3 — Code mort dans les quêtes** [SCRIPT pour Gomamon, LU pour Meramon]
- Où : `game/quetes.js:45` (remerciement après la quête : Gomamon est caché dès `bukaQuete` = 2, `quetes.js:88`) ;
  `game/chapitre3.js:172-177` (« Meramon vaincu sans Sora » : impossible pour le héros original, le combat sans Sora est
  « écrasant »).
- Correction : laisser Gomamon visible après la quête (sa réplique existe) ; supprimer la branche morte ou la commenter.

**SYS-25 — P3 (équilibrage) — Revanches contre Shellmon : Bits illimités** [LU]
- Où : `maps/antre.js:421` (30 × niveau, jusqu'à 1800 Bits, sans limite par jour, défaite sans perte).
- Correction : une revanche par jour (comme les combats d'entraînement de `services.js:163-170`).

**SYS-26 — P3 — Certains événements ne sont pas sauvegardés tout de suite** [LU]
- Où : `game/overworld.js:559-560` (défaite ordinaire : K.O. compté et 10 % de Bits perdus, puis `blackout` sans
  sauvegarde, `overworld.js:576-593`) ; `ui/sac.js:32` (Pilote automatique : voyage sans sauvegarde).
- Impact : si le jeu est fermé (ou tué) pendant les répliques de Jijimon qui suivent la défaite, le K.O. (« 3 K.O. = mort »)
  et la perte de Bits disparaissent au rechargement ; une fois la main rendue, la sauvegarde d'arrière-plan
  (`sauvegarde.js:114-117`) les enregistre, la fenêtre est donc courte.
- Correction : `DW.autosave()` à la fin de `blackout()` et après le Pilote automatique.

---

## 3. Sauvegardes

### 3.1 Ce qui est sauvé, et ce qui a été mesuré

- Tout `DW.state` est écrit en JSON (aucun `Set`/`Map` dans l'état) : position, carte, direction, point de soin, horloge,
  météo, équipe et boîte (`Digimon.toJSON` : espèce, niveau, XP, IV, techniques, PV/PM, statut, entraînement `tr`/`raw`,
  résistances `res`, ABI, puces, équipement, parcours, faim/soif/besoins, poids, discipline, K.O., vies, durée de vie,
  maladie, blessure, `boost`...), sac, coffre/banque, frigo, Bits, drapeaux, vus/obtenus, recrues, enfants, engrenages,
  écussons, coffres ouverts, cartes, recettes, requêtes, trophées, quotidiens, trouvailles au sol, usure des outils.
- **Aller-retour complet** sur un état riche : **0 écart** (hors `savedAt`) ; le seul champ d'un Digimon non sauvé est
  `evoPending` (consommé juste après le combat : sans effet). Taille : ~3,3 Ko pour cet état d'essai (largement sous le quota, même × 15 copies). [SCRIPT `s05_sauvegardes.js`]
- 3 emplacements indépendants (`..._save`, `_save_2`, `_save_3`), chacun avec `_precedente`, `_ancienne`, `_remplacee`,
  `_illisible`. [SCRIPT]
- Versions : v1 (sans `v`, `caught`, PP), v4 (PV ×20), v6 (engrenage du Mont Panorama → Pays de Meramon), version future v99,
  sauvegardes incomplètes (`{}`, `[]`, `flags: null`, niveau absent, carte inconnue, objet inconnu) : toutes chargées sans
  exception ; `null` et `party` non tableau : refusées, copie `_illisible` gardée, rien d'effacé. [SCRIPT]
- Stockage plein : la sauvegarde refusée renvoie faux, avertissement (une fois toutes les 2 min), la principale garde
  l'ancienne partie et le fichier FICHIER contient la partie refusée. [SCRIPT `s05b_quota.js`]
- Sauvegarde automatique : changement de carte, porte, portail, après chaque combat gagné/fui, événements d'histoire,
  arrière-plan (téléphone) si l'on se promène. Nouvelle partie sur un emplacement occupé : question + mise de côté. [LU, SCRIPT]

### 3.2 Anomalies

**SYS-02 — P1 — Principale abîmée : la partie lisible (précédente) est écrasée par une nouvelle partie** [SCRIPT `s05_sauvegardes.js` § 4]
- Où : `game/sauvegarde.js:70-79` (`saveInfo` lit `KEY || BAK` : une principale non vide mais illisible masque la
  précédente → `null`) ; `ui/title.js:225` (« Nouvelle partie » sélectionne d'office le premier emplacement « vide ») ;
  `title.js:335-354` (pas de question ni de mise de côté si `had` est nul) ; `sauvegarde.js:100-101` (la principale illisible
  est recopiée dans « précédente »).
- Reproduction : principale tronquée, précédente lisible. NOUVELLE PARTIE affiche « — vide — » sur cet emplacement
  (CONTINUER, lui, propose la version précédente). On lance la partie : 1re sauvegarde → la précédente lisible est
  remplacée par la principale abîmée ; 2e sauvegarde → plus aucune copie lisible.
- Fréquence : rare (une principale illisible vient d'une écriture interrompue ou d'un fichier FICHIER abîmé : `merge`,
  `fichier.js:45-47`, écrit tel quel une chaîne illisible dans un emplacement local vide) ; mais c'est précisément le cas
  que les copies `_precedente` / `_illisible` doivent protéger.
- Correction : `saveInfo` essaie `KEY` puis `BAK` séparément et signale « emplacement abîmé (récupérable) » ; un emplacement
  avec n'importe quelle clé (`_precedente`, `_ancienne`, `_illisible`) n'est jamais montré vide ; `DW.save` ne copie dans
  `_precedente` qu'une principale lisible.

**SYS-03 — P1 — FICHIER : la partie locale remplacée est perdue à la sauvegarde suivante** [SCRIPT `s05_sauvegardes.js` § 7]
- Où : `game/fichier.js:44-47` (la partie locale remplacée va dans `_precedente`) ; `game/sauvegarde.js:100-101` (chaque
  sauvegarde réécrit `_precedente`).
- Reproduction : partie « LOCALE » ; relier un fichier dont l'emplacement 1 est plus récent (`savedAt`) → principale =
  FICHIER, précédente = LOCALE ; continuer et sauvegarder une fois → plus aucune trace de LOCALE.
- Impact : deux appareils qui ont divergé (téléphone / PC) : la branche la plus ancienne disparaît sans retour ; le
  commentaire « rien n'est perdu » est faux.
- Correction : ranger la partie locale remplacée dans `_remplacee` (comme `DW.restoreVariant`, `sauvegarde.js:60-68`, qui a
  déjà corrigé ce défaut) ; si les deux parties n'ont pas le même nom ou si le temps de jeu recule, demander au joueur.

**SYS-04 — P1 — Deux « Nouvelle partie » sur le même emplacement : la première partie disparaît** [SCRIPT `s05_sauvegardes.js` § 3]
- Où : `game/sauvegarde.js:45` (`archiveSave` écrase `_ancienne`) ; `ui/title.js:342-354`.
- Reproduction : partie P1 ; nouvelle partie B (P1 mise de côté) ; nouvelle partie C → `_ancienne` = B, P1 n'existe plus nulle
  part. La question ne parle que de la partie actuelle (B), pas de l'« ancienne partie mise de côté ».
- Gravité : le joueur a confirmé deux fois, mais la copie mise de côté, présentée comme récupérable, est détruite sans le dire.
- Correction : ne pas écraser une `_ancienne` différente (garder deux générations) ou prévenir « l'ancienne partie mise de
  côté (P1) sera effacée ».

**SYS-09 — P2 — Après un chargement de secours, la copie de secours devient illisible** [SCRIPT `s05c_secours.js`]
- Où : `game/sauvegarde.js:173-177` (chargement depuis la précédente, la principale abîmée reste en place) puis
  `sauvegarde.js:100-101` (la sauvegarde suivante la recopie dans `_precedente`).
- Mesure : après une sauvegarde, principale lisible, **précédente = la principale tronquée** : une 2e panne ne laisserait
  plus rien.
- Correction : au chargement de secours, réécrire la principale avec la précédente lisible ; ne jamais recopier une
  principale illisible (voir SYS-02).

**SYS-27 — P3 — Stockage presque plein : la copie « précédente » n'est pas écrite, sans le dire** [SCRIPT `s05_sauvegardes.js` § 6]
- Où : `game/sauvegarde.js:30,101` (`write` avale l'échec de la copie).
- Correction : si la copie échoue, prévenir (même message que l'échec de sauvegarde).

**SYS-28 — P3 — Objets et techniques inconnus effacés en silence ; version plus récente rétrogradée** [SCRIPT]
- Où : `game/sauvegarde.js:154` (objets inconnus supprimés du sac, du coffre, du frigo), `sauvegarde.js:123` (techniques
  inconnues retirées), `sauvegarde.js:153` (une sauvegarde v99 devient v7 sans message) — alors que les espèces inconnues
  sont gardées à part (`orphans`).
- Impact : ouvrir une ancienne version en cache (service worker, autre appareil) après une nouvelle efface définitivement
  les objets récents à la sauvegarde suivante.
- Correction : garder les objets inconnus dans un `orphansItems`, comme les Digimon ; prévenir si `o.v > DW.SAVE_V`.

**SYS-29 — P3 — Une 2e sauvegarde illisible écrase la 1re copie « illisible »** [SCRIPT]
- Où : `game/sauvegarde.js:175`. Correction : ne pas écraser une copie existante différente (suffixe horodaté).

**SYS-30 — P3 — « Supprimer une partie » sur l'emplacement en cours : la sauvegarde automatique la recrée** [SCRIPT]
- Où : `ui/menus.js:31-41` ; la prochaine porte réécrit l'emplacement.
- Correction : proposer « Supprimer et revenir à l'écran titre » quand c'est l'emplacement en cours.

**SYS-31 — P3 — Champs simples non vérifiés au chargement** [SCRIPT]
- Où : `game/sauvegarde.js:132` (`Object.assign`) : des Bits en texte (« beaucoup ») sont gardés tels quels (puis
  `bits -= prix` → `NaN`). Seuls les PV du Digimon sont validés (`sauvegarde.js:125-126`).
- Correction : `Number.isFinite` sur `bits`, `clock`, `time`, `x`, `y`.

**SYS-32 — P3 — FICHIER : la clé `_remplacee` est traitée comme une partie principale** [SCRIPT]
- Où : `game/fichier.js:44` (regex sans `remplacee`) → crée une clé parasite `..._remplacee_precedente`, recopiée ensuite
  dans chaque fichier.
- Correction : ajouter `remplacee` à la regex.

**SYS-33 — P3 — FICHIER : erreurs de fusion et écritures sautées** [LU]
- Où : `game/fichier.js:46-47` (`setItem` sans `try`) : stockage plein pendant une fusion → à l'ouverture, le lien du fichier
  est abandonné en silence (`fichier.js:75-77`), à l'import « Ce fichier n'est pas une sauvegarde du jeu » (`fichier.js:131`,
  message faux) ; `fichier.js:55-57` : une sauvegarde faite pendant une écriture n'est pas écrite (le fichier a une
  sauvegarde de retard) ; `fichier.js:32,45` : « la plus récente » selon l'horloge de chaque appareil.
- Correction : `try` autour des écritures avec un vrai message ; relancer `writeNow` si une sauvegarde arrive pendant
  l'écriture.

---

## 4. Sons

### 4.1 Ce qui a été mesuré

- Tout est **synthétisé** (WebAudio, aucun fichier) : 30 musiques (`data/music.js`, `data/musiques_regions.js`), une
  quarantaine de bruitages (`engine/audio.js:65-108` ; les 37 noms appelés dans le code existent tous). Les 30 musiques demandées (cartes et `Audio.play`) **existent toutes**,
  aucune n'est inutilisée. [SCRIPT `s06_sons.js`]
- Musique par carte : Clairière/Sentier `forest`, plage `beach`, ville/maison/Champs `village`, antre `temple`, Grand Arbre
  et grotte `cave`, lac `lake`, Pays de Meramon `field`, cœur du volcan et Mont Panorama `volcano`. Combat : `battle` ou
  `boss` (ou la musique du boss), puis retour à la musique de la carte (`overworld.js:535,550`). [SCRIPT]
- Pas de superposition de musiques (une seule à la fois, `play` arrête la précédente ; la même musique n'est pas relancée).
- Lecture automatique : contexte créé au premier appui (clavier, toucher : `input.js:73,106`, `touch.js:215`), musique mise
  en attente avant ; reprise après écran éteint (`audio.js:24`). Coupure : touche M ou Options, **retenue** au lancement
  suivant (`options.js:15,19`). [SCRIPT]

### 4.2 Anomalies

**SYS-10 — P2 — Séquenceur : notes en retard jouées toutes à la fois** [SCRIPT `s06_sons.js` (mécanisme)]
- Où : `engine/audio.js:123-139` (`ch.time` n'est jamais recalé : `while (ch.time < now + 0.25)` programme toutes les notes
  manquées avec une heure passée, WebAudio les joue immédiatement).
- Mesure : fil principal bloqué 2 s → 13 notes programmées d'un coup, dont **10 dans le passé** (cacophonie). Sur le PC du
  joueur (2 cœurs à 1,1 GHz), la préparation synchrone d'une carte (`overworld.js:61`, `DW.preparerCarte` à la première
  visite) et un onglet en arrière-plan (minuterie ralentie) suffisent. [NON VÉRIFIÉ à l'oreille dans un navigateur]
- Correction : dans `sched()`, `if (ch.time < now) ch.time = now;` avant la boucle ; suspendre le contexte quand l'onglet est
  caché (`visibilitychange`) et le reprendre au retour.

**SYS-34 — P3 — Après un jingle « victory », silence** [SCRIPT `s06_sons.js`]
- Où : `engine/audio.js:130,138` (morceau sans boucle → `stop()`), appels sans relance : `game/town.js:77` (chaque recrue
  sur le terrain), `chapitre1.js:138`, `chapitre2.js:379`, `chapitre3.js:200` (fins de chapitre : silence dans la maison),
  `evolution.js:95` (toute Digivolution hors combat : table des Digivolutions `evotable.js:37,53`, objet du sac
  `sac.js:43`), `story.js:212`.
- Correction : à la fin d'un morceau sans boucle, rejouer `DW.ow.map.music` (ou un `Audio.after(name)`).

**SYS-35 — P3 — Le Pays de Meramon (chapitre 3) joue la musique générique « field »** [SCRIPT]
- Où : `data/musiques_regions.js:100-104` (pas d'entrée `miharashi`), `maps/regions.js:249`. Désert, Village des Yokomon et
  Mont Miharashi (lave, boss du chapitre) partagent la musique de repli.
- Correction : une entrée `miharashi` (ex. `canyon` pour les déserts, `volcano` pour le Mont).

**SYS-36 — P3 — L'harmonica de Matt ne revient pas après un combat au Lac du Tramway** [SCRIPT]
- Où : `game/overworld.js:550` (retour à `map.music` = `lake`), `chapitre2.js:92-96` (l'harmonica n'est lancé qu'à l'arrivée).
- Correction : une musique de carte « calculée » (`map.musicNow()`), ou relancer `onEnter` musical après combat.

**SYS-37 — P3 — `Audio.stop()` avant le premier geste n'annule pas la musique en attente** [SCRIPT]
- Où : `engine/audio.js:110` (attente) et `140` (`stop` ne vide pas `pending`). Correction : `this.pending = null` dans `stop()`.

**SYS-38 — P3 — Réglages du son limités ; le son continue onglet caché** [SCRIPT / LU]
- Où : `ui/menus.js:213` (seulement « Son : Activé / Coupé »), `engine/audio.js:22,28-31` (volumes fixes : maître 0,22,
  musique 0,5, bruitages 0,9) ; aucune suspension sur `visibilitychange`.
- Correction : deux curseurs (musique, bruitages) enregistrés dans les options ; couper/suspendre quand le jeu est caché.

**SYS-39 — P3 — Manette seule : peut-être aucun son** [NON VÉRIFIÉ (navigateur)]
- Où : `engine/input.js:73` (`Audio.init()` appelé depuis la lecture de la manette, dans la boucle d'images) : pour Chrome,
  un bouton de manette n'est pas un « geste » qui autorise le son ; sur PC, les clics de souris sur le jeu sont ignorés
  (`ui/touch.js:186`).
- Correction : à vérifier dans un navigateur ; au besoin, un écran « Appuie sur une touche » ou un clic sur l'écran titre.

---

## 5. Remarques sans gravité (questions de conception, non comptées)

- Défaite contre un boss des souterrains (gardien Drimogemon, cercle 5) : retour chez Jijimon, il faut refaire les cinq
  cercles (l'échelle ne s'ouvre qu'après la victoire). Voulu ? [SCRIPT]
- Le Pot portable réutilise les textes des toilettes (« Des toilettes toutes propres... ») (`care.js:114-129`). [LU]
- L'usure du Bâton et de la Pelle est comptée par sorte d'outil, pas par outil (`paysage.js:31-38`) : un outil revendu
  laisse son usure au suivant. [LU]
- `state.scenery` (une clé par élément du décor fouillé ou secoué) n'est jamais vidé : la sauvegarde grossit lentement
  (sans risque de quota à l'échelle d'une partie). [LU]
- Les objets de Digivolution de Champion (Gourde, Coquille, Boule de feu, Aile de flammes) arrivent dès les chapitres 2-3
  par les requêtes et la grotte, alors que la boutique les réserve au chapitre 4 (rang 14) : cohérent avec « chaque recrue
  ouvre une voie », à garder en tête pour l'équilibrage. [SCRIPT]

## 6. Ce qui n'a pas été vérifié

- Comportements du navigateur réel : politique de lecture automatique (manette), ralentissement des minuteries en
  arrière-plan, rendu sonore réel, quota exact de `localStorage` selon le navigateur, effacement Safari après 7 jours,
  API d'accès aux fichiers (FICHIER) et événement `visibilitychange` réels.
- Issue réelle des combats (imposée dans les simulations) et dégâts de la lave pendant l'éruption « subie » (seul le drapeau
  est vérifié).
- Accessibilité à pied des personnages et objets hors de la grotte de Sora et du coffre de l'épave (domaine du relecteur
  des cartes).

## 7. Scripts et sorties (dossier `audit_integral\systemes\`)

| Script | Sujet | Sortie |
|---|---|---|
| `harness.js` | chargement du jeu comme `dev/tests.js` (+ quota simulé) | — |
| `s01_items.js` | catalogue, boutiques, rangs, stocks par chapitre | `out_s01_items.txt` |
| `s02_usages.js` | usage réel de chaque objet (sac, combat), promesses des textes, équipements | `out_s02_usages.txt` |
| `s03_boutiques.js`, `s03b_canne.js` | hameaux, distributeurs, achats/ventes, sac plein, coffre/frigo, Canne | `out_s03_boutiques.txt`, `out_s03b_canne.txt` |
| `sim_base.js`, `s04_progression.js` | chapitres 1-3 joués, interruptions de fin de chapitre | `out_s04_progression.txt`, `out_s04_console.txt` |
| `s04b_eruption.js` | éruption des Corniches subie, sauvegarde pendant le compte à rebours | `out_s04b_eruption.txt` |
| `s05_sauvegardes.js`, `s05b_quota.js`, `s05c_secours.js` | aller-retour, emplacements, versions, corruption, quota, FICHIER | `out_s05_sauvegardes.txt`, `out_s05b_quota.txt`, `out_s05c_secours.txt` |
| `s06_sons.js` | musiques, séquenceur (faux AudioContext), coupure, combat | `out_s06_sons.txt` |
| `s07_requetes.js` | requêtes des habitants des chapitres 2-3 | `out_s07_requetes.txt` |
| `s08_cueillette.js` | champignons et grands arbres des chapitres 1-3 | `out_s08_cueillette.txt` |
| `s09_coffres.js` | coffres de la grotte de Sora, Bandage X | `out_s09_coffres.txt` |
| `gen_annexe.js` | annexe A (catalogue) | `annexe_objets.md` |
| `node dev/tests.js` | suite existante : 53 / 53 | `out_tests_existants.txt` |
| (relance) | s02, s03b, s04, s05, s06, s09 relancés sur `a31c07e` : mêmes résultats | `recheck_a31c07e` |

---

## Annexe A — Catalogue des 153 objets (données réelles, effet mesuré)

Effet mesuré par `s02_usages.js` sur un Agumon N.15 (PV 50, PM 10, faim 80, soif 80, fatigue 80, bonheur 40, blessé,
malade, empoisonné ; Greymon pour les objets d'Ultime). Les PV/PM rendus sont plafonnés par le maximum du Digimon d'essai.
« décompte » = exemplaires retirés du sac par un usage hors combat.

| id | nom | icône | usage | prix (vente) | rang | vendu par | effet mesuré (hors combat, partenaire affamé, blessé, malade, empoisonné) | décompte |
|---|---|---|---|---|---|---|---|---|
| soin_p | RAM PV | potion | heal | 100 (50) | 0 | bazar, distrib. RAM PV, distrib. la ville | hp:50→550 happy:40→42 | 1 |
| soin_m | RAM PV+ | potion | heal | 500 (250) | 4 | bazar | hp:50→860 happy:40→42 | 1 |
| soin_g | RAM PV++ | potion | heal | 1000 (500) | 8 | bazar | hp:50→840 happy:40→42 | 1 |
| soin_s | Super RAM PV | potion | heal | 2500 (1250) | 12 | bazar | hp:50→860 happy:40→42 | 1 |
| disque_pm | RAM PM | disk | mp | 300 (150) | 0 | bazar, distrib. RAM PM, distrib. la ville | mp:10→510 | 1 |
| pm_m | RAM PM+ | disk | mp | 800 (400) | 4 | bazar | mp:10→820 | 1 |
| pm_g | RAM PM++ | disk | mp | 2000 (1000) | 8 | bazar | mp:10→840 | 1 |
| double_disk | Double disquette | disk | heal | 1500 (750) | 6 | bazar | hp:50→860 mp:10→820 happy:40→42 | 1 |
| remede | Remède universel | potion | cure | 300 (150) | 0 | bazar, distrib. RAM PV, distrib. RAM PM | status:poison→null | 1 |
| omnipotent | Omnipotent | potion | heal | 2000 (1000) | 8 | bazar | hp:50→860 mp:10→840 happy:40→42 status:poison→null | 1 |
| protection | Protection | shield | protect | 1200 (600) | 6 | bazar | (passif / en combat) | 0 |
| reveil | Disque Réveil | disk | revive | 1500 (750) | 4 | bazar, nuit | hp:0→420 status:poison→null | 1 |
| super_reveil | Super Réveil | disk | revive | 5000 (2500) | 12 | bazar, nuit | hp:0→820 mp:10→840 status:poison→null | 1 |
| bandage | Bandage | bandage | hurt | 200 (100) | 0 | bazar, distrib. RAM PV, distrib. la ville | hurt:720→0 | 1 |
| medoc | Médicament | pill | sick | 1000 (500) | 2 | bazar, nuit | happy:40→42 sick:720→0 hurt:720→0 germs:60→0 | 1 |
| disque_atk | Disque Attaque | disk | buff | 500 (250) | 4 | disques | (passif / en combat) | 0 |
| disque_def | Disque Défense | disk | buff | 500 (250) | 4 | disques | (passif / en combat) | 0 |
| disque_vit | Disque Vitesse | disk | buff | 500 (250) | 4 | disques | (passif / en combat) | 0 |
| disque_omni | Disque Omni | disk | buff | 3000 (1500) | 10 | disques | (passif / en combat) | 0 |
| s_disque_atk | Super disque Attaque | disk | buff | 4000 (2000) | 14 | disques | (passif / en combat) | 0 |
| s_disque_def | Super disque Défense | disk | buff | 4000 (2000) | 14 | disques | (passif / en combat) | 0 |
| s_disque_vit | Super disque Vitesse | disk | buff | 4000 (2000) | 14 | disques | (passif / en combat) | 0 |
| puce_atk | Puce Attaque | chip | chip | 7500 (3750) | 10 | puces | atk:96→146 | 1 |
| puce_def | Puce Défense | chip | chip | 7500 (3750) | 10 | puces | def:80→130 | 1 |
| puce_int | Puce Cerveau | chip | chip | 9999 (4999) | 16 | puces | int:80→130 | 1 |
| puce_spd | Puce Vitesse | chip | chip | 9999 (4999) | 16 | puces | spd:84→134 | 1 |
| puce_pv | Puce PV | chip | chip | 5000 (2500) | 6 | bazar, puces | hp:50→550 maxHp:840→1340 | 1 |
| puce_pm | Puce PM | chip | chip | 5000 (2500) | 6 | bazar, puces | mp:10→510 maxMp:820→1320 | 1 |
| puce_dva | Puce DV A | chip | chip | 5000 (2500) | 20 | puces | atk:100→200 int:80→180 | 1 |
| puce_dvd | Puce DV D | chip | chip | 5000 (2500) | 20 | puces | def:80→180 spd:88→188 | 1 |
| puce_dve | Puce DV E | chip | chip | 5000 (2500) | 20 | puces | atk:96→196 spd:84→184 | 1 |
| pilote_auto | Pilote automatique | tool | home | 300 (150) | 2 | bazar | message : Le Pilote automatique te ramène à la Ville des Fichiers ! | 1 |
| pot_portable | Pot portable | tool | potty | 300 (150) | 2 | bazar | happy:40→42 germs:60→56 need:30→0 | 1 |
| manuel_entr | Manuel d'entraînement | book | passive | 9999 (4999) | 16 | savoir | (passif / en combat) | 0 |
| manuel | Manuel de technique | book | manual | 900 (450) | 6 | savoir | moves:2→3 | 1 |
| baton | Bâton solide | tool | passive | 150 (75) | 0 | bazar | (passif / en combat) | 0 |
| pelle | Petite pelle | tool | passive | 300 (150) | 1 | bazar | (passif / en combat) | 0 |
| canne | Canne à pêche | tool | passive | 0 (0) | — | — | (passif / en combat) | 0 |
| oreiller | Oreiller | tool | passive | 1000 (500) | 6 | bazar | (passif / en combat) | 0 |
| repousse | Répulsif | tool | repel | 1500 (750) | 6 | bazar | message : Tu te parfumes... Les Digimon sauvages vont te laisser tranq | 1 |
| cloche | Cloche à Digimon | tool | bell | 1500 (750) | 6 | bazar, nuit | message : Ding ding ! Tous les Digimon sauvages des environs accourent | 1 |
| chaussures | Chaussures santé | tool | passive | 2000 (1000) | 12 | bazar | (passif / en combat) | 0 |
| cartes | Paquet de cartes | dessin dédié | pack | 200 (100) | 0 | bazar, cartes | (aucun) | 1 |
| eau_fraiche | Eau fraîche | potion | heal | 40 (20) | 0 | bazar, distrib. nourriture, distrib. la ville | thirst:80→10 happy:40→44 | 1 |
| viande | Viande | meat | heal | 50 (25) | 0 | bazar, resto, distrib. nourriture, distrib. la ville | hunger:80→55 happy:40→45 fat:0→0.2 need:30→43 | 1 |
| super_viande | Viande géante | meat | heal | 500 (250) | 3 | resto | hunger:80→30 happy:40→45 fat:0→0.4 need:30→55 | 1 |
| surlonge | Surlonge | meat | heal | 1500 (750) | 9 | resto | hunger:80→30 happy:40→50 fat:0→0.4 need:30→55 | 1 |
| steak | Steak | meat | heal | 1000 (500) | 9 | resto | hunger:80→30 happy:40→45 fat:0→0.4 need:30→55 | 1 |
| digichampi | Digichampignon | mush | heal | 100 (50) | 0 | resto | hunger:80→55 happy:40→45 fat:0→0.2 need:30→43 | 1 |
| champi_glace | Champignon glacé | mush | heal | 1000 (500) | 16 | resto | hunger:80→63.3 happy:40→45 disc:40→55 fat:0→0.1 need:30→38 | 1 |
| champi_luxe | Champignon de luxe | mush | heal | 5000 (2500) | 20 | resto | atk:100→104 def:80→84 spd:92→96 int:80→84 hunger:80→55 happy:40→45 fat:0→0.2 need:30→43 | 1 |
| champi_joie | Champignon joyeux | mush | heal | 1000 (500) | 12 | resto, nuit | hunger:80→63.3 happy:40→65 fat:0→0.1 need:30→38 | 1 |
| super_carotte | Super carotte | veg | heal | 500 (250) | 6 | resto, savoir, ferme | hunger:80→55 happy:40→45 fat:0→0.2 boost:0→1 need:30→43 | 1 |
| radis | Radis faucon | veg | heal | 500 (250) | 6 | resto, savoir, ferme | hunger:80→55 happy:40→45 fat:0→0.2 boost:0→1 need:30→43 | 1 |
| digipomme | Digi-pomme de pin | fruit | heal | 1000 (500) | 9 | resto, savoir, ferme | hunger:80→55 happy:40→45 fat:0→0.2 boost:0→2 need:30→43 | 1 |
| epinard | Légume épineux | veg | heal | 1000 (500) | 9 | resto, ferme | hunger:80→63.3 happy:40→45 fat:0→0.1 tired:80→0 need:30→38 | 1 |
| pomme_bleue | Pomme bleue | fruit | heal | 1000 (500) | 6 | resto, ferme | hunger:80→55 happy:40→60 fat:0→0.2 need:30→43 | 1 |
| baie_rouge | Baie rouge | fruit | heal | 1000 (500) | 9 | resto, ferme | hunger:80→63.3 happy:40→50 disc:40→45 fat:0→0.1 tired:80→0 need:30→38 | 1 |
| gland_or | Gland d'or | fruit | none | 8000 (6000) | — | — | (passif / en combat) | 0 |
| grosse_baie | Grosse baie | fruit | heal | 1000 (500) | 9 | resto, ferme | hunger:80→30 happy:40→45 fat:0→3.4 need:30→55 | 1 |
| noix_douce | Noix douce | fruit | heal | 1000 (500) | 12 | resto | hunger:80→55 happy:40→45 fat:0→0.2 need:30→43 | 1 |
| super_legume | Super légume | veg | heal | 1000 (500) | 12 | resto, ferme | hunger:80→55 happy:40→45 fat:0→0.2 need:30→43 | 1 |
| figue | Figue de Barbarie | fruit | heal | 1000 (500) | 9 | resto, ferme | hunger:80→63.3 happy:40→45 fat:0→-2.8 need:30→38 | 1 |
| orange_bana | Orange-banane | fruit | heal | 1000 (500) | 12 | resto | hunger:80→55 happy:40→45 fat:0→0.2 need:30→43 | 1 |
| fruit_force | Fruit de force | fruit | heal | 5000 (2500) | 18 | fruits | atk:92→112 hunger:80→63.3 happy:40→45 fat:0→0.1 need:30→38 | 1 |
| glace_force | Glace de force | fruit | heal | 5000 (2500) | 18 | fruits | def:88→108 hunger:80→63.3 happy:40→45 fat:0→0.1 need:30→38 | 1 |
| feuille_vite | Feuille de vitesse | veg | heal | 5000 (2500) | 18 | fruits | spd:88→108 hunger:80→63.3 happy:40→45 fat:0→0.1 need:30→38 | 1 |
| fruit_sage | Fruit du sage | fruit | heal | 5000 (2500) | 18 | fruits | int:88→108 hunger:80→63.3 happy:40→45 fat:0→0.1 need:30→38 | 1 |
| igname | Igname musclée | veg | heal | 5000 (2500) | 18 | fruits | hp:50→250 maxHp:820→1020 hunger:80→55 happy:40→45 fat:0→0.2 need:30→43 | 1 |
| baie_calme | Baie calme | fruit | heal | 5000 (2500) | 18 | fruits | mp:10→210 maxMp:840→1040 hunger:80→63.3 happy:40→45 fat:0→0.1 need:30→38 | 1 |
| melon | Melon chaîne | fruit | heal | 5000 (2500) | 20 | resto | hunger:80→30 happy:40→55 disc:40→45 fat:0→0.4 tired:80→0 need:30→55 | 1 |
| viande_moisie | Viande moisie | meat | heal | 50 (25) | 0 | resto, nuit | hunger:80→55 happy:40→45 fat:0→0.2 need:30→43 | 1 |
| pluie_plante | Plante de pluie | veg | heal | 1000 (500) | 9 | resto | hunger:80→71.6 happy:40→45 fat:0→0.0 tired:80→50 need:30→34 | 1 |
| pain | Pain frais | bread | heal | 80 (40) | 0 | boulangerie | hunger:80→55 happy:40→45 fat:0→0.2 need:30→43 | 1 |
| croissant | Croissant | bread | heal | 120 (60) | 0 | boulangerie | hunger:80→55 happy:40→50 fat:0→0.2 need:30→43 | 1 |
| brioche | Brioche | bread | heal | 200 (100) | 0 | boulangerie | hunger:80→55 happy:40→48 fat:0→0.2 need:30→43 | 1 |
| macaron | Macaron | cake | heal | 150 (75) | 0 | glacier, patisserie | hunger:80→71.6 happy:40→51 fat:0→0.0 need:30→34 | 1 |
| eclair | Éclair au chocolat | cake | heal | 250 (125) | 0 | glacier, patisserie | hunger:80→63.3 happy:40→55 fat:0→0.1 need:30→38 | 1 |
| tarte | Tarte aux fruits | cake | heal | 400 (200) | 0 | glacier, patisserie | hunger:80→55 happy:40→53 fat:0→0.2 need:30→43 | 1 |
| gateau_fete | Gâteau de fête | cake | heal | 900 (450) | 0 | patisserie | hunger:80→55 happy:40→65 fat:0→2.2 need:30→43 | 1 |
| digianchois | Digi-anchois | fish | heal | 50 (25) | — | — | hunger:80→55 happy:40→45 fat:0→0.2 need:30→43 | 1 |
| digivivaneau | Digi-vivaneau | fish | heal | 100 (50) | — | — | hunger:80→55 happy:40→45 fat:0→0.2 need:30→43 | 1 |
| digitruite | Digi-truite | fish | heal | 300 (150) | — | — | hunger:80→30 happy:40→45 fat:0→0.4 need:30→55 | 1 |
| truite_noire | Truite noire | fish | heal | 1000 (500) | — | — | atk:100→104 def:80→84 spd:92→96 int:88→92 hunger:80→55 happy:40→45 fat:0→0.2 need:30→43 | 1 |
| digisilure | Digi-silure | fish | heal | 2000 (1000) | — | — | hunger:80→30 happy:40→45 fat:0→0.4 need:30→55 | 1 |
| digibar | Digi-bar | fish | heal | 8000 (4000) | — | — | hunger:80→30 happy:40→45 fat:0→0.4 life:30→31 need:30→55 | 1 |
| griffes_grey | Griffes grises | evo | evo | 5000 (2500) | 14 | evolution | hp:50→749 mp:10→130 maxHp:820→1519 maxMp:820→940 atk:92→198 def:84→173 spd:92→173 int:84→167 sp:agumon→greymon moves:5→6 | 1 |
| boule_feu | Boule de feu | evo | evo | 5000 (2500) | 14 | evolution | hp:50→729 mp:10→230 maxHp:840→1519 maxMp:820→1040 atk:92→198 def:84→161 spd:92→179 int:84→198 sp:agumon→meramon moves:5→6 | 1 |
| aile_flamme | Aile de flammes | evo | evo | 5000 (2500) | 14 | evolution | hp:50→718 mp:10→210 maxHp:820→1488 maxMp:800→1000 atk:100→192 def:84→167 spd:92→217 int:80→186 sp:agumon→birdramon moves:5→6 | 1 |
| sabot_fer | Sabot de fer | evo | evo | 5000 (2500) | 14 | evolution | hp:50→802 mp:10→230 maxHp:860→1612 maxMp:820→1040 atk:100→186 def:84→198 spd:92→186 int:84→198 sp:agumon→centarumon moves:5→6 | 1 |
| pierre_mono | Pierre Mono | evo | evo | 5000 (2500) | 14 | evolution | hp:50→822 mp:10→90 maxHp:840→1612 maxMp:840→920 atk:96→192 def:80→204 spd:92→142 int:88→161 sp:agumon→monochromon moves:5→6 | 1 |
| foreuse | Foreuse d'acier | evo | evo | 5000 (2500) | 14 | evolution | hp:50→780 mp:10→70 maxHp:820→1550 maxMp:820→880 atk:96→198 def:84→198 spd:84→142 int:84→148 sp:agumon→drimogemon moves:5→6 | 1 |
| aile_noire | Aile noire | evo | evo | 5000 (2500) | 14 | evolution | hp:50→842 mp:10→270 maxHp:820→1612 maxMp:840→1100 atk:100→217 def:88→192 spd:92→198 int:88→217 sp:agumon→devimon moves:5→6 | 1 |
| massue | Massue à pointes | evo | evo | 5000 (2500) | 14 | evolution | hp:50→802 mp:10→70 maxHp:860→1612 maxMp:820→880 atk:96→204 def:80→179 spd:92→173 int:84→148 sp:agumon→ogremon moves:5→6 | 1 |
| criniere | Crinière de feu | evo | evo | 5000 (2500) | 14 | evolution | hp:50→791 mp:10→150 maxHp:840→1581 maxMp:800→940 atk:96→210 def:80→173 spd:88→186 int:80→167 sp:agumon→leomon moves:5→6 | 1 |
| aile_blanche | Aile blanche | evo | evo | 5000 (2500) | 14 | evolution | hp:50→771 mp:10→250 maxHp:860→1581 maxMp:800→1040 atk:92→186 def:88→179 spd:88→198 int:80→198 sp:agumon→angemon moves:5→6 | 1 |
| haillon | Haillon déchiré | evo | evo | 5000 (2500) | 14 | evolution | hp:50→698 mp:10→210 maxHp:840→1488 maxMp:800→1000 atk:100→186 def:80→161 spd:92→192 int:80→186 sp:agumon→bakemon moves:5→6 | 1 |
| unicorne | Corne de licorne | evo | evo | 5000 (2500) | 14 | evolution | hp:50→740 mp:10→210 maxHp:860→1550 maxMp:840→1040 atk:92→179 def:80→167 spd:84→204 int:88→198 sp:agumon→unimon moves:5→6 | 1 |
| casque_corne | Casque à corne | evo | evo | 5000 (2500) | 14 | evolution | hp:50→791 mp:10→210 maxHp:840→1581 maxMp:840→1040 atk:96→186 def:84→198 spd:84→161 int:88→198 sp:agumon→kabuterimon moves:5→6 | 1 |
| machoire | Mâchoire-ciseaux | evo | evo | 5000 (2500) | 14 | evolution | hp:50→740 mp:10→50 maxHp:860→1550 maxMp:840→880 atk:96→204 def:84→179 spd:92→173 int:88→148 sp:agumon→kuwagamon moves:5→6 | 1 |
| gourde | Gourde d'eau | evo | evo | 5000 (2500) | 14 | evolution | hp:50→822 mp:10→210 maxHp:840→1612 maxMp:840→1040 atk:100→192 def:84→179 spd:84→167 int:88→198 sp:agumon→seadramon moves:5→6 | 1 |
| coquille | Coquille rouge | evo | evo | 5000 (2500) | 14 | evolution | hp:50→842 mp:10→150 maxHp:820→1612 maxMp:800→940 atk:100→186 def:84→204 spd:84→105 int:80→167 sp:agumon→shellmon moves:5→6 | 1 |
| cristal_bleu | Cristal bleu | evo | evo | 5000 (2500) | 14 | evolution | hp:50→771 mp:10→150 maxHp:860→1581 maxMp:840→980 atk:100→198 def:84→179 spd:84→192 int:88→179 sp:agumon→garurumon moves:5→6 | 1 |
| cristal_glace | Cristal de glace | evo | evo | 5000 (2500) | 14 | evolution | hp:50→822 mp:10→150 maxHp:840→1612 maxMp:820→960 atk:96→192 def:84→186 spd:92→148 int:84→173 sp:agumon→frigimon moves:5→6 | 1 |
| piece_metal | Pièce de métal | evo | evo | 9999 (4999) | 24 | evolution | hp:50→740 mp:10→150 maxHp:1550→2240 maxMp:920→1060 atk:204→328 def:173→288 spd:167→248 int:161→264 sp:greymon→metalgreymon moves:4→5 | 1 |
| os_fatal | Os fatal | evo | evo | 9999 (4999) | 24 | evolution | hp:50→691 mp:10→110 maxHp:1519→2160 maxMp:940→1040 atk:210→352 def:179→272 spd:161→232 int:167→256 sp:greymon→skullgreymon moves:4→5 | 1 |
| piece_cyber | Pièce cyber | evo | evo | 9999 (4999) | 24 | evolution | hp:50→789 mp:10→150 maxHp:1581→2320 maxMp:960→1100 atk:204→312 def:179→320 spd:167→248 int:173→280 sp:greymon→andromon moves:4→6 | 1 |
| mega_main | Méga-main | evo | evo | 9999 (4999) | 24 | evolution | hp:50→731 mp:10→150 maxHp:1519→2200 maxMp:960→1100 atk:204→336 def:173→272 spd:161→272 int:173→280 sp:greymon→megadramon moves:4→5 | 1 |
| petite_lance | Petite lance | evo | evo | 9999 (4999) | 24 | evolution | hp:50→611 mp:10→250 maxHp:1519→2080 maxMp:940→1180 atk:204→280 def:179→264 spd:167→336 int:167→312 sp:greymon→piximon moves:4→5 | 1 |
| x_bandage | Bandage X | evo | evo | 9999 (4999) | 24 | evolution | hp:50→851 mp:10→190 maxHp:1519→2320 maxMp:920→1100 atk:198→280 def:179→296 spd:161→232 int:161→280 sp:greymon→monzaemon moves:4→5 | 1 |
| banane_or | Banane dorée | evo | evo | 9999 (4999) | 24 | evolution | hp:50→740 mp:10→230 maxHp:1550→2240 maxMp:960→1180 atk:204→312 def:179→280 spd:173→272 int:173→312 sp:greymon→etemon moves:4→5 | 1 |
| miroir_lune | Miroir de lune | evo | evo | 9999 (4999) | 24 | evolution | hp:50→700 mp:10→90 maxHp:1550→2200 maxMp:960→1040 atk:210→336 def:179→272 spd:161→304 int:173→256 sp:greymon→weregarurumon moves:4→5 | 1 |
| griffes_bronze | Griffes de bronze | claw | equip | 400 (200) | 0 | bazar | atk:96→112 | 1 |
| crocs_acier | Crocs d'acier | claw | equip | 1200 (600) | 3 | bazar | atk:100→132 | 1 |
| gants_flamme | Gants de flamme | claw | equip | 2500 (1250) | 99 | — | atk:92→132 int:84→96 | 1 |
| lame_digitale | Lame digitale | claw | equip | 3000 (1500) | 6 | bazar | atk:100→156 spd:84→92 | 1 |
| marteau_titan | Marteau Titan | claw | equip | 6000 (3000) | 9 | bazar | atk:96→184 spd:92→80 | 1 |
| epee_chrome | Épée Chrome Digizoïde | claw | equip | 15000 (7500) | 13 | bazar | atk:96→224 | 1 |
| veste_cuir | Veste de cuir | armor | equip | 400 (200) | 0 | bazar | def:84→100 | 1 |
| plastron_bronze | Plastron de bronze | armor | equip | 1200 (600) | 3 | bazar | hp:50→130 maxHp:840→920 def:80→112 | 1 |
| armure_digitale | Armure digitale | armor | equip | 3200 (1600) | 6 | bazar | hp:50→210 maxHp:860→1020 def:84→140 | 1 |
| carapace_mono | Carapace de Monochromon | armor | equip | 6500 (3250) | 9 | bazar | def:80→168 spd:88→80 | 1 |
| armure_chrome | Armure Chrome Digizoïde | armor | equip | 16000 (8000) | 13 | bazar | hp:50→370 maxHp:860→1180 def:84→212 | 1 |
| bandeau | Bandeau | ring | equip | 300 (150) | 0 | bazar | spd:92→108 | 1 |
| lunettes | Lunettes d'aviateur | ring | equip | 900 (450) | 2 | bazar | spd:84→96 int:84→96 | 1 |
| anneau_pm | Anneau PM | ring | equip | 1500 (750) | 4 | bazar | mp:10→170 maxMp:820→980 int:84→100 | 1 |
| plume_ardente | Plume ardente | ring | equip | 3500 (1750) | 7 | bazar | atk:92→100 spd:92→132 | 1 |
| pendentif | Pendentif Écusson | ring | equip | 9000 (4500) | 11 | bazar | hp:50→130 mp:10→90 maxHp:840→920 maxMp:840→920 atk:92→108 def:84→100 spd:88→104 int:88→104 | 1 |
| miel | Miel doré | jar | heal | 300 (150) | — | — | hunger:80→71.6 happy:40→49 fat:0→0.0 need:30→34 | 1 |
| piment | Piment de feu | veg | heal | 300 (150) | — | — | hunger:80→75.8 happy:40→45 fat:0→0.0 need:30→32 | 1 |
| eau_source | Eau de source | potion | heal | 150 (75) | — | — | thirst:80→0 happy:40→44 | 1 |
| sel | Sel de roche | jar | none | 150 (75) | — | — | (passif / en combat) | 0 |
| lait | Lait de cactus | potion | heal | 300 (150) | — | — | hunger:80→67.5 happy:40→45 fat:0→0.1 need:30→36 | 1 |
| truffe | Truffe des bois | mush | heal | 1200 (600) | — | — | hunger:80→71.6 happy:40→45 fat:0→0.0 need:30→34 | 1 |
| sucre | Sucre d'ourson | jar | heal | 300 (150) | — | — | hunger:80→75.8 happy:40→48 fat:0→0.0 need:30→32 | 1 |
| algue | Algue marine | veg | heal | 200 (100) | — | — | hunger:80→71.6 happy:40→45 fat:0→0.0 need:30→34 | 1 |
| glace_pilee | Glace pilée | potion | heal | 200 (100) | — | glacier | hunger:80→75.8 happy:40→45 fat:0→0.0 tired:80→50 need:30→32 | 1 |
| farine | Farine | jar | none | 100 (50) | 0 | boulangerie | (passif / en combat) | 0 |
| riz | Riz | jar | heal | 120 (60) | 0 | resto | hunger:80→63.3 happy:40→45 fat:0→0.1 need:30→38 | 1 |
| brochette | Brochette pimentée | bowl | heal | 1200 (600) | — | — | atk:100→108 hunger:80→55 happy:40→50 fat:0→0.2 need:30→43 | 1 |
| grillade | Grillade au sel | bowl | heal | 900 (450) | — | — | hp:50→130 maxHp:840→920 hunger:80→55 happy:40→45 fat:0→0.2 need:30→43 | 1 |
| soupe | Soupe aux champignons | bowl | heal | 900 (450) | — | — | mp:10→90 maxMp:820→900 hunger:80→55 happy:40→45 fat:0→0.2 need:30→43 | 1 |
| ragout | Ragoût du potager | bowl | heal | 2000 (1000) | — | — | hp:50→150 maxHp:840→940 def:84→88 hunger:80→55 happy:40→50 fat:0→0.2 need:30→43 | 1 |
| poisson_miel | Poisson laqué au miel | bowl | heal | 1500 (750) | — | — | int:84→92 hunger:80→55 happy:40→50 fat:0→0.2 need:30→43 | 1 |
| sushi | Sushis de l'île | bowl | heal | 1500 (750) | — | — | spd:84→92 int:80→84 hunger:80→55 happy:40→45 fat:0→0.2 need:30→43 | 1 |
| curry | Curry de Meramon | bowl | heal | 2000 (1000) | — | — | atk:96→100 def:80→88 hunger:80→55 happy:40→45 fat:0→0.2 need:30→43 | 1 |
| salade | Salade croquante | bowl | heal | 1200 (600) | — | — | def:84→92 hunger:80→55 happy:40→45 fat:0→-1.8 need:30→43 | 1 |
| tarte_maison | Tarte maison | cake | heal | 1500 (750) | — | — | spd:88→96 hunger:80→55 happy:40→70 fat:0→0.2 need:30→43 | 1 |
| pain_miel | Pain au miel | bread | heal | 700 (350) | — | — | hunger:80→55 happy:40→53 fat:0→0.2 tired:80→0 need:30→43 | 1 |
| sorbet | Sorbet de Frigimon | cake | heal | 900 (450) | — | — | hunger:80→63.3 happy:40→60 disc:40→50 fat:0→0.1 tired:80→0 need:30→38 | 1 |
| smoothie | Smoothie bleu | potion | heal | 1200 (600) | — | — | mp:10→70 maxMp:820→880 hunger:80→55 happy:40→55 fat:0→0.2 need:30→43 | 1 |
| gratin | Gratin à la truffe | bowl | heal | 4000 (2000) | — | — | hp:50→90 mp:10→50 maxHp:840→880 maxMp:820→860 atk:96→100 def:80→84 spd:92→96 int:84→88 hunger:80→55 happy:40→55 fat:0→0.2 need:30→43 | 1 |
| festin | Festin de l'Île | bowl | heal | 9000 (4500) | — | — | hp:50→130 mp:10→90 maxHp:860→940 maxMp:820→900 atk:100→108 def:84→92 spd:84→92 int:84→92 hunger:80→30 happy:40→75 fat:0→0.4 life:30→31 need:30→55 | 1 |
