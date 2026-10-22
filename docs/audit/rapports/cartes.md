# Audit des cartes — « Digimon : L'Île des Fichiers »

Audit en lecture seule (aucun fichier du dépôt modifié, aucun commit). Nuit du 21 au 22 octobre 2026.
Tous les scripts, données extraites et résultats sont dans ce dossier
(`C:\Users\CaMiL\AppData\Local\Temp\claude\C--Users-CaMiL-Desktop-PROGRAMMES-APPLICATIONS-CLAUDE-DIGIMON\6f82ba0c-eac4-4c5c-b469-a7c3692356c6\scratchpad\audit_integral\cartes\`).

> **Attention : le dépôt a changé pendant l'audit.** Au départ : `f987c32`. Pendant l'audit, une autre session a publié
> `86d37c8` … `d21d380`, puis `b111987` et `a31c07e` (01 h 25 – 01 h 29 : salle de classe, Terrain d'entraînement,
> **nouvel arbre creux de la Prairie**, **nouvelle règle de collisions « pied du dessin »** dans `gfx/terrain.js`,
> partenaire). De 01 h 52 à 02 h 07, une session en cours a encore modifié sans commit 22 fichiers (`DW.autosave()` aux
> fins de chapitre, musique des cartes, objets, sac, sauvegarde, pêche, `dev/tests.js`…) : rien qui touche aux passages,
> aux collisions ni au placement des cartes (diffs relus pour `overworld.js`, `antre.js`, `champs.js`, `sol.js`,
> `paysage.js`, `requests.js` : musique, sauvegarde, objets ; les lignes citées ici sont inchangées).
> **Les résultats ci-dessous portent sur `a31c07e`** : toutes les extractions et tous les essais finaux ont été relancés
> entre 01 h 37 et 01 h 58 (les résultats intermédiaires sur les anciennes versions ont été jetés).

---

## 0. Résumé

| | Ville au complet (état de `dev/checkmaps.js`) | Début de partie, sans aucune recrue |
|---|---|---|
| Cartes | 351 (0 erreur de génération) | 351 (0 erreur) |
| Passages examinés | 824 (599 bords, 188 portes, 18 escaliers/déclencheurs, 13 objets-scripts, 6 PNJ-scripts) | 783 |
| Cartes atteintes depuis la maison de Jijimon, ch1 → ch4 | 124 → 155 | 18 → 55 |
| Cartes jamais atteintes | 196 (toutes dans des régions fermées : chapitres futurs et Mont Panorama) | 296 (+ quartiers et bâtiments, qui demandent des recrues) |
| Pièges (on entre, on ne peut plus revenir chez Jijimon) | 0 | 0 |
| Passages à sens unique | 2, tous deux des scènes de l'histoire (voulus) | 2 (les mêmes) |

**Anomalies retenues après relecture (les deux états confondus) : P0 = 0, P1 = 0, P2 = 2, P3 = 13.**
(Comptes bruts des scripts, avant relecture : ville au complet P1 9 / P2 6 / P3 23 ; début de partie P1 12 / P2 105 /
P3 23 — presque tout est voulu ou faux positif, voir § 7.)

Les plus graves :
1. **P2 — Maison de Penguinmon : la sortie renvoie à 37 cases de la porte** (Village des Bébés). L'arrivée, déjà écrite
   à la vraie taille, est agrandie une seconde fois (`js/maps/berceau.js:200`, sortie sans `_zt: true`).
2. **P2 — L'arbre creux de la Prairie (entrée du Village des Poyomon) ne se pose pas toujours au même endroit** : (62,25)
   d'habitude, (50,22) si le Village des Poyomon est préparé avant la Prairie (partie reprise dans le village, ou
   arrivée par le souterrain de Jijimon). `js/maps/yokomon.js:72` pose l'arbre sur une Prairie pas encore décorée.
3. P3 — petits défauts de passages (un arbre de l'atelier posé sur une voie de sortie, une voie morte, une arrivée dans
   un mur), 6 panneaux « invisibles » (texte lu devant une case vide : bottes de foin retirées, poteaux effacés dans
   l'atelier), la règle de l'atelier qui **ferme lac1 ↔ lac0 à partir du chapitre 4**, une fragilité dans
   `js/maps/sous_volcan.js:118`.

Aucun blocage de progression trouvé : chaque chapitre (1 à 3) est faisable sans recrue, chaque boss et chaque
personnage clé est atteignable à son étape, chaque arrivée de passage tombe sur une case praticable (au pire décalée
d'une case) d'où l'on peut repartir.

Fichiers principaux :
- graphe : `graphe_aretes_complet.tsv` (liste d'arêtes, une ligne par passage) et `graphe_regions_complet.md` (résumé
  lisible par région, avec la grille du puzzle) ; mêmes fichiers `_debut` pour le début de partie ;
- `sens_unique_*.tsv`, `transitions_scenarisees_*.tsv`, `inventaire_*.tsv`, `resume_regions.md`, `progression_*.txt`,
  `anomalies_*.json`, `stats_*.json`.

---

## 1. Méthode

1. **Le vrai jeu, dans Node** (`charger.js`) : même faux navigateur que `dev/tests.js` (canevas factice, scripts de
   `js/scripts.js` exécutés dans le contexte principal). En plus, une fausse classe `Image` « charge » chaque image du
   dépôt avec ses **vraies dimensions** (lues dans l'en-tête PNG / WebP : 674 images, 0 absente), pour que
   `gfx/textures.js` crée les objets `tex_…` comme dans le navigateur. Sans cela, des cartes se construisent autrement
   (exemple vérifié : l'entrée de la grotte de Sora n'existe pas, `js/maps/miharashi.js:579`).
2. **Extraction** (`extract.js`) : chaque carte préparée exactement comme en jeu (`DW.preparerCarte` : génération,
   puzzle, retouches de l'atelier `DW.Retouches`, décor en kits, distributeurs, PNJ hors du décor), puis **dessinée**
   (`DW.World.prepare`) pour relever les collisions réelles (`gfx.solid` : objets, cases `block`, élargissements,
   murets des ponts) — 364 / 370 variantes de cartes, 0 échec. Neuf étapes cumulées de l'histoire : ch1 début, après
   Kuwagamon (énigme résolue, trophée), antre ouverte (+ quête des Poyomon finie), ch2 début, après Monochromon, ch3
   début, souterrains (rocher poussé), Sora retrouvée (gardien vaincu), ch4. À chaque étape : conditions des passages
   (`cond`), verrous de chapitre (`DW.Chapter.lock`, règles de l'atelier `regle`), PNJ visibles, déclencheurs.
   Deux états de ville : **« complet »** (toutes les recrues, y compris celles des régions futures — l'état de
   `dev/checkmaps.js`) et **« début »** (aucune recrue : le cas le plus pauvre).
3. **Essais** (`essais.js`) : chaque dialogue de PNJ, chaque panneau-script, chaque déclencheur et chaque script
   d'arrivée est **joué** avec un faux « ow » (réponses 0, puis 1 et 2 si une question est posée). On relève les
   répliques et surtout les **changements de carte** (`ow.charger`) : ce sont les passages scénarisés du graphe
   (escaliers de l'antre et des souterrains, trou des cabines, arbre creux, puits, trappe, échelles, scènes).
4. **Analyse** (`analyse.js`, `modele.js`, `verifs.js`) : modèle de déplacement fidèle à `game/overworld.js`
   (`solid`, `falaise` du relief, diagonales `canDiag`, portes, `caseLibre` à 6 cases, calcul des arrivées de `doWarp`
   et `enterDoor`, `arrive()` des intérieurs qui grandissent). Graphe global par étape depuis la maison de Jijimon
   (12,5) — la scène d'ouverture dans la Clairière se joue seule puis ramène chez Jijimon (`game/debut.js:98`) —, nœud =
   (carte, zone atteignable). Puis : retours, sens uniques, pièges, zones isolées, PNJ, panneaux, déclencheurs, postes
   d'entraînement, toilettes, données des objets.
5. **Outils existants réutilisés, pas dupliqués** : `node dev/tests.js` lancé deux fois (sur `d21d380` : 53/53 ; sur
   `a31c07e` + modifications en cours : 51/53, les 2 échecs sont les empreintes de `game/chapitre1.js` modifié par
   l'autre session, sans rapport avec les cartes). Tous les tests de cartes passent, dont « monde des chapitres 1 à 3 :
   cartes raccordées en un seul territoire », « antre de Shellmon… », « souterrains… », « aucun déclencheur sans
   condition ne bloque un passage ». `dev/check.html` (navigateur) n'a pas été lancé : le panneau navigateur partagé
   était interdit ; ses contrôles sont refaits en Node, en plus strict (depuis les vraies entrées, avec les PNJ, le
   relief, les collisions forcées de l'atelier et les conditions de chaque étape).

---

## 2. Inventaire des cartes

Détail carte par carte (id, nom, région, intérieur, dimensions, thème, chapitre d'ouverture, sorties
bord/porte/script, PNJ, objets, panneaux, déclencheurs, événements, remarques) : `inventaire_complet.tsv` et
`inventaire_debut.tsv`. Résumé par région (`resume_regions.md`) :

| Région | Cartes (intérieurs) | Atteintes ch1 / ch2 / ch3 / ch4 (ville au complet) | Jamais atteintes | Pourquoi |
|---|---|---|---|---|
| village | 113 (107) | 113 / 0 / 0 / 0 | 0 | (début de partie : 7 / 5 / 1 / 1, 99 jamais : bâtiments, quartiers et maisons qui demandent des recrues — voulu) |
| foret | 10 (3) | 10 / 0 / 0 / 0 | 0 | |
| plage | 9 (5) | 8 / 1 / 0 / 0 | 0 | (la salle de Shellmon n'apparaît qu'au ch2 dans l'audit : les trois ankhs de la crypte ne sont pas simulés ; le test « crypte des gardiens » le couvre) |
| lac | 12 (0) | 0 / 12 / 0 / 0 | 0 | lac0 au ch2 ; le reste après Monochromon |
| miharashi | 10 (5) | 0 / 0 / 10 / 0 | 0 | dont la grotte de Sora (5 cercles) |
| brumes | 13 (3) | 0 / 0 / 0 / 1 | 12 | brumes0 s'ouvre au ch4 avec Elecmon (règle de l'atelier), le voile de région arrête à brumes1 |
| volcan (Mont Panorama) | 13 (4) | 0 | 13 | voulu : seul accès par montagne8 (région fermée) — voir P3-12 |
| montagne, savane, usine, decharge, canyon, dino, jungle, overdell, jouets, gel, scarabees, marais, tunnel | 171 | 0 | 171 | régions des chapitres futurs (voile de données `game/chapitre1.js:171-188`) |

- **Génération** : 0 échec sur 351 cartes × 9 étapes × 2 états (vérifié par script).
- **Cartes sans aucune sortie** : aucune. **Cartes vides** (ni objet, ni PNJ, ni panneau) : aucune.
- **Cartes jamais atteintes** : 196 (ville au complet), toutes dans des régions fermées par l'histoire ; aucune carte
  d'une région ouverte (forêt, plage, ville, lac, Pays de Meramon) n'est inatteignable.
- Totaux (ville au complet, dernière étape) : 310 PNJ, 7 602 objets posés, 938 panneaux (399 scripts), 35 déclencheurs.

---

## 3. Graphe des connexions

### 3.1 Où le trouver
- `graphe_aretes_complet.tsv` : une ligne par passage — nature, carte de départ, région, position (x,y, largeur,
  côté), destination, région d'arrivée, arrivée écrite, **arrivée réelle** (après `caseLibre`), première étape où le
  passage est ouvert ET sa carte atteinte, étapes où il est fermé, texte du verrou, retour (passage de retour le plus
  proche, distance, écart au point de départ), problèmes.
- `graphe_regions_complet.md` : la grille du puzzle (le cœur du monde), les passages du puzzle et leurs règles, puis
  région par région chaque carte et ses sorties (« → destination (nature, position, ouvert au chapitre N) ⚠ problème »).
- `transitions_scenarisees_*.tsv` (scènes qui déplacent le héros) et `sens_unique_*.tsv`.

### 3.2 Ouvertures par chapitre (vérifié par script)
- **Ch1** : ville, forêt, plage (et leurs intérieurs). L'Arbre de Kuwagamon s'ouvre quand l'énigme est résolue (porte
  conditionnelle `js/maps/foret.js:28`) et se referme derrière soi jusqu'à la victoire (voulu, `js/maps/kuwagamon.js:83`).
  L'antre de Shellmon par le trou des cabines (`js/maps/antre.js:52-57`), puis 5 cartes par escaliers.
- **Ch2** : Clairière → lac0 (règle de l'atelier `des: 2`) ; le reste du lac après Monochromon (`monoCh2`).
- **Ch3** : Clairière → miharashi0, Sentier → miharashi2, Bosquet → miharashi2 (règles `des: 3`) ; la grotte de Sora
  (`js/maps/sous_volcan.js:124-131`, refusée avant le ch3).
- **Ch4** : Village des Bébés → brumes0 (règle `des: 4` + Elecmon recruté) ; arrêt au voile de brumes1.
- **Jamais** (pour l'instant) : Ville → montagne0, Champs → marais0 et tunnel0 (règles `des: 10`), toutes les autres
  régions.
- Sans aucune recrue, toute la progression des chapitres 1 à 3 reste possible (55 cartes : `progression_debut.txt`).

### 3.3 Retours et sens uniques (vérifié par script)
- Pour chaque passage ouvert, depuis la case d'arrivée réelle : passage de retour vers la carte de départ dans la même
  zone, à quelle distance, et où il ramène. Un seul aller-retour incohérent : **la maison de Penguinmon** (P2-1).
- **Passages à sens unique : 2, tous voulus** (scènes de l'histoire) : Arbre de Kuwagamon → maison de Jijimon (10,8)
  après la victoire ; sommet du Mont Miharashi → Village des Yokomon (48,34) après le combat contre Meramon.
  Les autres scènes ramènent sur la même carte (visite de la ville par Koromon, Tanemon, cage de Shellmon, veillée de
  Matt au lac2). Tous les autres passages ont un passage de retour direct.
- **Pièges : aucun** (aucune zone atteinte d'où l'on ne peut plus revenir chez Jijimon par les passages), dans les deux
  états et à toutes les étapes. Rappel : le Pilote automatique (`js/data/items.js:47`) et chaque défaite ramènent aussi
  en ville.

### 3.4 Arrivées (vérifié par script)
- Aucune arrivée hors de sa carte, aucune arrivée sans case libre à moins de 6 cases (pour les passages utilisables).
- 5 voies d'arrivée tombent sur un obstacle et le héros est décalé d'une case (P3-1, P3-2, P3-4, P3-5, P3-6).

### 3.5 Zones isolées, boucles, téléportations
- Aucune zone praticable de plus de 40 cases contenant un PNJ, un panneau ou une sortie qui ne soit jamais atteinte
  (une seule apparaissait avant le découpage des étapes : la galerie du trésor des souterrains, ouverte en poussant le
  rocher — elle est bien atteinte).
- Aucune arrivée collée à un déclencheur qui renverrait ailleurs (pas de boucle involontaire). Les escaliers posent le
  héros 3 cases devant l'escalier de retour (voulu).
- « Téléportation » : une seule sortie de bord arrive loin du bord opposé — Village des Poyomon → Prairie, qui ramène
  devant l'arbre creux (voulu : transition spéciale). Aucune sortie superposée, aucune sortie hors du bord, aucune
  sortie vers une carte inexistante.
- Géographie (outil `DW.Monde.conflits()`, `js/maps/monde.js`) : voir P3-13.

---

## 4. PNJ et panneaux (vérifié par script, sauf mention)
- 1 546 contrôles de PNJ (chaque PNJ de chaque carte atteinte, à chaque étape ; ville au complet), dont 254 pour des
  PNJ invisibles à cette étape (heure, histoire) : leur case a aussi été contrôlée, pour le moment où ils apparaissent.
  **Aucun PNJ hors carte, sur un obstacle ou dans un objet, ni sur l'eau** (hors ombres qui nagent). Inaccessibles :
  seulement Tai et Agumon dans la cage de Shellmon et Sora derrière le gardien des souterrains tant qu'il n'est pas
  vaincu — voulu (le gardien, lui, est accessible).
- **Aucun PNJ ne bloque un passage** (sorties atteignables sans PNJ mais pas avec : aucune).
- **Dialogues** : chaque `talk` joué (9 étapes × 2 états). Aucun PNJ muet, aucune réplique vide, aucun texte
  « undefined » ou « NaN ». Les seuls « null » / erreurs viennent du faux `Game.push` de l'essai (mini-jeux, fouille) :
  faux positifs (§ 7).
- **Personnages clés** (`progression_*.txt`) : Jijimon, Koromon, Penguinmon, Shellmon, Monochromon, Gomamon, Biyomon,
  Meramon, le gardien Drimogemon, Sora (au village), Tai et Matt (chez toi) sont visibles et atteignables à leur étape.
  Kuwagamon (combattu entre deux étapes), Matt et Gabumon au Lac du Tramway (la nuit ; l'audit tourne à 8 h), Gomamon
  sur la plage (16 h – 19 h), Penguinmon chez lui (selon l'heure) : leur case est accessible, leur apparition n'est pas
  simulée.
- **Panneaux** : 938 (ville au complet). Aucun hors carte, aucun texte vide, aucun inaccessible. 902 sont posés sur une
  case bloquante (c'est la règle : poteau, meuble, mur que l'on regarde) ; 36 sur une case libre, dont **6 sans aucun
  objet dans des cartes atteintes : textes « invisibles »** (P3-8 à P3-10).
- Déclencheurs : 35, tous sur une case praticable et atteinte, tous avec un script.
- Postes d'entraînement et toilettes : tous ont une case atteignable à côté.

---

## 5. Collisions (contrôle de données, vérifié par script)
- Objets : 0 objet sans largeur ou hauteur (le jeu les compte maintenant pour une case, `gfx/terrain.js`, `a31c07e`),
  0 dimension incohérente, 0 objet hors carte, 0 sorte inconnue du jeu.
- Voies d'arrivée sur un obstacle : 5 (deux arbres de l'atelier, l'élargissement d'un objet, un mur, une canopée) ;
  chaque fois le héros est posé sur la case libre voisine — P3.
- Voies de sortie bouchées : 4 voies sur 4 passages (jamais un passage entier) — P3.
- Déclencheurs inaccessibles : 0.

---

## 6. Anomalies détaillées

Légende : **VS** = vérifié par un script (données réelles du jeu), **L** = lu dans le code, **NV** = non vérifié.

### P0 (bloquant critique) — aucune
### P1 (majeur) — aucune

### P2-1 — Maison de Penguinmon : la sortie renvoie au milieu du Village des Bébés
- Cartes : `berceau_maison` → `berceau`. Fichier : `js/maps/berceau.js:200`
  (`warps: [{ x: D, y: P.rows.length - 1, w: 2, h: 1, dir: 'down', to: 'berceau', tx: px, ty: py + 1 }]`).
- Cause : `px, py` viennent de la maison de la carte DÉJÀ agrandie (`zoomMap`, ligne 186) ; la sortie n'a pas
  `_zt: true`, donc `DW.getMap` la convertit encore (`MapKit.zTarget`, `js/maps/common.js:338-342`) : ×2.
- Reproduire : Village des Bébés, entrer chez Penguinmon (porte en 37-38,11), ressortir par le bas : on apparaît en
  (74,24)/(75,24), à ~37 cases à l'est et 12 au sud de la porte (au lieu de (37,12)). VS : sortie extraite tx,ty =
  74,24 ; porte en 37,11 ; la seconde voie (75,24) est en plus sur un obstacle, décalée en (75,23).
- Impact : désorientant à chaque sortie, pas bloquant (zone reliée).
- Correction : ajouter `_zt: true` à cette sortie (comme les sorties posées dans l'atelier), ou écrire tx/ty dans le
  plan d'origine. Vérifier ensuite avec le test « arrivées vers les cartes agrandies converties une seule fois »
  (l'étendre à cette sortie).

### P2-2 — L'arbre creux de la Prairie change de place selon l'ordre de préparation des cartes
- Cartes : `prairie`, `village_yokomon`. Fichiers : `js/maps/yokomon.js:72` (`populate` du Village des Poyomon :
  `DW.getMap('prairie'); DW.YokoVillage.place(pm, 'prairie')`), `js/maps/yokomon.js:144-215` (`place`),
  `js/game/overworld.js:24` (appel normal, après le décor).
- Cause : `place` choisit la case de l'arbre d'après les objets, panneaux et PNJ présents. Appelé par
  `DW.preparerCarte('prairie')`, il voit la Prairie décorée (kits `MapKit.dress`, distributeurs, panneaux) ; appelé par
  le `populate` du Village des Poyomon, il voit la Prairie avant tout décor. Il ne se refait plus ensuite
  (`_yokoFor`).
- Reproduire (VS, `t6.js`, `t7.js`) : préparer `prairie` d'abord → arbre en (62,25), panneau en (60,26), 24 objets de
  décor ; préparer `village_yokomon` d'abord → arbre en (50,22), panneau en (52,22), 23 objets de décor. En jeu (L,
  non simulé) : partie reprise dans le Village des Poyomon, ou descente par la trappe de Jijimon (le souterrain prépare
  en fond le village voisin par sa porte, `js/game/overworld.js:75`) avant d'être passé par la Prairie dans la session.
  Trouvé par un essai ciblé (`t6.js`), pas par les contrôles automatiques.
- Impact : l'entrée du village (et son panneau, et une partie du décor de la Prairie) n'est pas au même endroit d'une
  partie à l'autre ; l'atelier, qui prépare la Prairie directement, devrait montrer (62,25) (NV). Pas bloquant : l'arbre reste accessible dans les deux cas et la sortie
  du village ramène toujours devant lui (VS). Contredit la règle « le même décor à chaque partie et dans l'atelier »
  (`docs/ARCHITECTURE.md`, « D'une carte écrite à une carte jouée »).
- Correction : dans `populate`, appeler `DW.preparerCarte('prairie')` (qui pose l'arbre après le décor) au lieu de
  `DW.getMap('prairie')` + `place` ; ou rendre le choix de la case indépendant du décor (case fixée, ou calculée sur la
  carte avant décor dans les deux cas).
- Remarque (NV) : pendant l'audit, un troisième emplacement (74,25) a été observé dans deux passes faites avant le
  commit `a31c07e` ; la cause exacte de cette troisième place n'a pas été isolée (code changé entre-temps).

### P3 (mineur)
- **P3-1 — Clairière → Sentier : un arbre de l'atelier sur la sortie.** `js/maps/retouches_donnees.js:692-699`
  (ajout `tree` en 42,71) posé sur la 1re des 6 cases de la sortie de l'atelier (`retouches_donnees.js:1345-1355`, bord
  bas 42-47,71). VS : 1 voie sur 6 bouchée ; depuis le Sentier, la 1re voie arrive sur l'arbre, décalée en (43,71).
  Correction : retirer l'arbre ou décaler la sortie d'une case.
- **P3-2 — Prairie → Sentier : un arbre de l'atelier sur la sortie.** `retouches_donnees.js:2101-2107` (ajout `tree` en
  0,30), sur la sortie gauche (0, 23-30). VS : 1 voie sur 8 ; arrivée depuis le Sentier décalée en (0,29).
- **P3-3 — Prairie ↔ Village des Bébés : 6e voie morte.** Collision forcée de l'atelier en 95,28
  (`retouches_donnees.js:2119`, bloc `bloque`) côté Prairie, et canopée « # » en 0,28 côté Village des Bébés. VS : la
  voie ne sert dans aucun sens. Correction : retirer `"95,28"` du bloc `bloque` et dégager (0,28), ou réduire le
  passage à 5 cases.
- **P3-4 — Ville → Terrain d'entraînement : sortie de 5 cases pour une entrée de 4.** Sortie de l'atelier
  `retouches_donnees.js:9276-9286` (bord bas 37-41,71, w 5, tx 30) ; la sortie du Terrain fait 4 cases
  (`js/maps/gym.js:163`, agrandie : 30-33,0). VS : la 5e voie arrive sur la canopée (34,0), décalée en (33,0).
  Correction : `w: 4`.
- **P3-5 — Souterrain de Jijimon → maison : la 2e case de la porte arrive dans le mur.** `js/maps/souterrain.js:52`
  (porte de 2 cases, arrivée `TRAP[0], TRAP[1] + 1` = 14,9) : la 2e case arrive en (15,9), un mur ; décalée en (14,9). VS.
  Correction : porte d'une case, ou arrivée en 13,9.
- **P3-6 — Village des Bébés : 2e voie de la sortie de chez Penguinmon sur un obstacle** — disparaît avec P2-1.
- **P3-7 — Règle de l'atelier : lac1 ↔ lac0 se ferme à partir du chapitre 4.** Passage du puzzle
  `["lac1","right","lac0",33,6,{"jusqua":3}]` (`retouches_donnees.js:10875-10884`). VS : ouvert jusqu'au ch3 (après
  Monochromon), fermé dans les deux sens au ch4, avec le message générique « Il s'ouvrira plus tard dans l'aventure »
  (`js/maps/puzzle.js:140`) alors qu'il était ouvert avant. On fait alors le tour par l'est du lac (aucune carte
  perdue). À confirmer par le créateur (probablement `des` au lieu de `jusqua`).
- **P3-8 — Champs : deux panneaux « bottes de foin » sans bottes de foin.** `js/maps/champs.js:100` (`'19,14'`,
  `'19,15'`, agrandis en 38,28 et 38,30) ; les bottes ont été retirées (`champs.js:53`, `decor.js:197`). VS : on lit
  « Des bottes de foin bien sèches… » devant de l'herbe. Correction : retirer les deux panneaux.
- **P3-9 — Ville : deux poteaux effacés dans l'atelier, leurs textes restés.** `retouches_donnees.js:6443`
  (`"36,52": "."`, texte « Sud : Terrain d'entraînement… ») et `retouches_donnees.js:8209` (`"8,24": "."`, le panneau
  de la ville « Ville des Fichiers — 100 % · niveau… »). VS : texte lu devant une case d'herbe. Correction : remettre
  un poteau (case « S » ou objet) ou retirer le texte (`panneaux: { "36,52": null }`).
- **P3-10 — Textes posés sur le sol au lieu du décor qu'ils décrivent.** `js/maps/souterrain.js:48` (« initiales
  gravées dans la roche » en 6,3 : une case de sol sous le mur — à mettre en 6,2) ; `js/maps/sous_volcan.js:295`
  (« Le pont de pierre file au-dessus de la lave… » sur une case libre en 32,29). VS.
- **P3-11 — `js/maps/sous_volcan.js:115-120` : le rocher et l'échelle suivent l'histoire par une comparaison de
  longueurs.** `if (L.length !== this.objects.length)` : si le rocher part ET l'échelle arrive entre deux `populate`,
  les longueurs sont égales et rien n'est mis à jour (VS : en passant d'un coup de « rien » à « rocher poussé + gardien
  vaincu », le rocher reste). En jeu, chaque drapeau est suivi aussitôt d'un `populate` (lignes 484 et 536) : le cas
  n'arrive pas en partie normale (L). De plus, `this.objects = L` repart de la liste du tout premier `populate` : des
  objets ajoutés après coup (retouches de l'atelier, décor) seraient perdus (aucune retouche aujourd'hui sur ces cartes :
  NV en jeu). Correction : comparer le contenu (ou recalculer à chaque fois), et filtrer `this.objects` plutôt que
  repartir de `_base`.
- **P3-12 — `OPENS = { …, volcan: 3 }` (`js/game/chapitre1.js:170`) alors que le Mont Panorama reste fermé.** Le seul
  accès (montagne8 → volcan0, condition de niveau de ville) est dans une région fermée : les 13 cartes « volcan »
  (dont le donjon de Sora) ne sont jamais atteintes. C'est la décision du joueur (« Mont Panorama inaccessible, plus
  tard », `docs/RAPPORT_GAMMA.md` § 16) ; seule la configuration est incohérente. Correction : retirer `volcan: 3` ou
  le commenter.
- **P3-13 — Grille du monde : 23 chevauchements** (`DW.Monde.conflits()`, `js/maps/monde.js:52-61`). Dont 4 près du
  cœur : les quartiers Résidentiel et Numérique chevauchent la Lisière et les Dunes, le Marché chevauche montagne0 ; les
  19 autres sont entre régions futures. 15 cartes « hors grille ». VS (outil existant). Impact : carte du monde et
  fondus de couleurs de ces cartes ; aucun effet sur les passages.

---

## 7. Éléments voulus et faux positifs écartés
- Régions fermées (196 cartes jamais atteintes) : voulu (chapitres futurs, Mont Panorama).
- Début de partie : quartiers, bâtiments, maisons et Gymnase (Leomon) non atteints sans recrues : voulu. En « ville au
  complet », le Gymnase paraît ouvert dès le ch1 parce que cet état contient aussi les recrues des régions futures
  (`js/game/story.js:89`) ; en vrai, il attend Leomon (`js/maps/gymnase.js:31`).
- Sens uniques des scènes (Kuwagamon, Meramon) ; Arbre de Kuwagamon fermé tant qu'on n'a pas combattu ; Sora derrière
  le gardien ; Tai et Agumon dans la cage ; arbre creux qui ramène au milieu de la Prairie : voulu.
- Cases d'interaction muettes dans certains états, sans gêne : porte de la crypte une fois ouverte (32,5), cases du
  rocher poussé (12-13,23), échelle des foreurs avant le gardien (objet invisible, sous_volcan1 34,34 et
  sous_volcan5 27,36).
- Erreur « got is not iterable » (tunnel2) et textes « null fleur sur 8 » / « null points » : artefacts du faux
  `Game.push` des essais ; les scènes concernées se ferment toujours avec un résultat (`game/activities.js:196`,
  `game/minijeux.js:20`).
- `dojo_combat` → `dojo_in` « hors carte » en début de partie : cette salle n'est reliée qu'au grand Dojo (26 cases de
  large, `js/maps/grandir.js:252-256`), où l'arrivée (24,5) est valable.

---

## 8. Ce qui a été vérifié, lu, ou pas vérifié
**Vérifié par un script** : génération des 351 cartes ; graphe complet (bords, portes, escaliers, objets-scripts, PNJ-
scripts) avec conditions et verrous à 9 étapes et 2 états ; arrivées réelles ; retours ; sens uniques ; pièges ; zones
isolées ; PNJ (position, obstacles, accès, blocage, dialogues joués) ; panneaux ; déclencheurs ; postes et toilettes ;
données des objets ; collisions réelles de `World.prepare` ; position de l'arbre creux selon l'ordre ; `dev/tests.js`.

**Lu seulement** : le moteur de déplacement (`game/overworld.js`), la scène d'ouverture (`game/debut.js`), l'Arbre de
Kuwagamon, la crypte, les souterrains, les intérieurs qui grandissent, le placement des PNJ d'histoire et de quêtes à
l'arrivée (`Story.decorate`, `Quetes.decorate` : cases libres loin des passages), la garantie de la nouvelle règle de
collisions (`gfx/terrain.js`, `a31c07e` : l'élargissement ne bouche jamais une sortie, une porte, un PNJ, un
déclencheur ni la case devant un panneau).

**Non vérifié** :
- La nouvelle règle « pied du dessin » mesure les pixels des images : dans Node (pas de pixels), le jeu applique
  l'ancienne règle (boîte du dessin). Les ~2 000 cases bloquées en plus dans le navigateur ne sont donc pas dans ces
  résultats (garantie de non-blocage : lue, pas mesurée). Les tailles des objets `tex_…` peuvent aussi différer un peu
  (contour transparent non rogné), donc le placement des kits de décor.
- Conditions d'heure (Matt et Seadramon la nuit, boss à heures fixes), météo, saisons : la case de ces PNJ est
  accessible (contrôlée même invisibles), mais leur apparition n'est pas simulée.
- Niveaux intermédiaires de la ville (seulement 0 recrue et toutes les recrues).
- Les trois ankhs de la crypte (allumés au cours de l'étape « antre ») ne sont pas simulés : la salle de Shellmon
  n'apparaît qu'au ch2 dans les tableaux (couvert par le test existant).
- Digimon sauvages, crottes et gravats (obstacles temporaires), Digimon qui se promènent.
- `dev/check.html` et l'atelier des cartes dans le navigateur (panneau navigateur interdit).
- Anciennes parties où l'on incarne un enfant de l'animé (`hero` différent de `perso`).

---

## 9. Relancer
Depuis ce dossier, dans l'ordre (machine lente : chaque étape tourne seule) :
`node extract.js complet` puis `node extract.js debut` (~5 à 15 min chacun), `node essais.js complet|debut` (~2 min),
`node objets_connus.js`, `node analyse.js complet` et `node analyse.js debut` (quelques secondes : écrit graphe,
inventaire, anomalies, sens uniques), `node progression.js complet|debut`, `node resume_regions.js`.
Essais ciblés : `t6.js` / `t7.js` (arbre creux), `t4.js` (rocher des souterrains), `validation_gfx.js` (collisions).
