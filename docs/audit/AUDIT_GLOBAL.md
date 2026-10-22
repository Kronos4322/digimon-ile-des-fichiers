# Audit intégral du jeu — synthèse

**Jeu** : « Digimon — L'Aventure de l'Île des Fichiers ». Jeu de fan non officiel en HTML5 / JavaScript, sans compilation.

**Mission** : audit intégral, correction et finalisation (demande du joueur, 21/10/2026 au soir).

**Période** : du 21/10/2026 à 23 h 30 au 22/10/2026.

**Dépôt** : https://github.com/Kronos4322/digimon-ile-des-fichiers, branche `main`.

**Version en ligne** : https://kronos4322.github.io/digimon-ile-des-fichiers/

Documents liés, dans ce dossier :
- `BUGS_ET_CORRECTIONS.md` : chaque anomalie et ce qui en a été fait ;
- `MATRICE_CONTENUS.md` : tout le contenu, généré à partir des données du jeu ;
- `PLAN_DE_TESTS.md` : quels tests, comment les relancer, ce qu'ils ne couvrent pas ;
- `RELEASE_CHECKLIST.md` : la publication pas à pas ;
- `ETAT_AVANCEMENT.md` : le journal de la mission, lot par lot ;
- `rapports/` : les quatre rapports détaillés ;
- `graphe/` : le graphe des connexions des cartes.

## 1. En bref

| | Nombre |
|---|---|
| Anomalies relevées | **123** : 1 P0, 7 P1, 27 P2, 88 P3 |
| Corrigées | **84** |
| Corrigées en partie | **4** |
| Laissées à ta décision, ou gardées exprès | **10** |
| Pas encore traitées (P3 surtout), ou non vérifiables sans essai réel | **25** |
| Tests automatiques | **71**, tous réussis, sur le PC et sur GitHub (53 au départ) |
| Parcours de joueur dans un vrai Chrome | **13 étapes sur 13**, en local et sur le site en ligne |
| Formats d'écran essayés | **6 sur 6** |

Toutes les anomalies graves sont réglées :
- **Le seul blocage (P0)** : fermer le jeu pendant le bilan d'un chapitre bloquait la partie pour toujours. C'est corrigé, et les parties touchées se réparent au chargement.
- **Les 7 anomalies graves (P1)** :
  - sauvegardes perdues dans trois cas (principale abîmée, reprise par FICHIER, deux nouvelles parties sur un même emplacement) : corrigé ;
  - ABI à volonté par la dé-digivolution : corrigé ;
  - yeux troués d'Agumon et de Palmon : corrigé ;
  - imitation du logo officiel sur l'écran titre : corrigé ;
  - verts du dessin effacés par le détourage : corrigé pour 30 objets, gardé pour 15 où le nouveau détourage faisait pire.

## 2. Méthode

- **Quatre audits menés en parallèle**, chacun avec ses propres scripts qui exécutent le vrai code du jeu :
  - systèmes : objets, économie, quêtes, sauvegardes, sons ;
  - Digimon : espèces, Digivolutions, progression, combats et équilibrage ;
  - cartes : 351 cartes, graphe des connexions, PNJ, panneaux, collisions ;
  - graphismes : 690 images, détourage, tailles, textures, droits.
- **Le statut de chaque constat est dit** : mesuré par un script, lu dans le code, ou non vérifié. Aucun résultat n'est inventé : ce qui n'a pas pu être vérifié est écrit tel quel.
- **Les corrections sont publiées par lots.** Chaque lot passe ces étapes :
  1. les tests automatiques ;
  2. le parcours de joueur dans Chrome quand l'écran ou la sauvegarde sont touchés ;
  3. un rendu à l'œil des images avant/après ;
  4. le commit, puis la vérification de ses empreintes ;
  5. l'envoi ;
  6. le contrôle du site en ligne : le paquet servi doit avoir l'empreinte du commit.
- **Les choix de conception sont laissés au joueur**, par exemple l'équilibrage des éléments ou la taille de Bukamon. Ils sont notés au lieu d'être tranchés à sa place.

## 3. État initial (21/10/2026, 23 h 30)

- Commit `f987c32`, synchronisé avec GitHub ; tests : 53 sur 53.
- Version en ligne à jour.
- Juste avant l'audit, deux défauts avaient été corrigés :
  - le démarrage cassé, quand le jeu était ouvert par un double-clic sur `index.html` (file://) ;
  - le chargement trop lourd du dossier d'images commun, passé de 15,9 Mo à 5,2 Mo grâce au WebP.

## 4. Résultats par domaine

### Cartes et graphe des connexions (priorité absolue de la mission)

Les mesures de l'audit des cartes :
- **Génération** : les 351 cartes se génèrent sans erreur.
- **Passages** : 824 passages examinés quand la ville est au complet (bords, portes, escaliers, scripts).
- **Accessibilité** : depuis la maison de Jijimon, 124 cartes sont atteintes au chapitre 1 et 155 au chapitre 4. Les 196 autres sont dans des régions fermées exprès : chapitres futurs et Mont Panorama.
- **Pièges** : aucun. Aucune zone n'empêche de revenir chez Jijimon.
- **Sens uniques** : 2, deux scènes voulues de l'histoire.
- **Histoire** : chaque boss et chaque personnage clé est atteignable à son étape. Les chapitres 1 à 3 se jouent sans aucune recrue.
- **Anomalies** : 2 P2 et 13 P3, toutes corrigées sauf les chevauchements de la grille de la carte du monde (mise en pause à ta demande). Parmi elles :
  - la sortie de chez Penguinmon ;
  - l'arbre creux qui changeait de place ;
  - des arbres sur des sorties ;
  - des panneaux fantômes ;
  - une voie morte ;
  - un passage qui se serait refermé au chapitre 4.
- **Graphe** : `graphe/graphe_regions_complet.md` (une région par section) et `graphe/graphe_aretes_complet.tsv` (un passage par ligne).

### Digimon, Digivolutions, combats

Ce qui est en ordre :
- **Registre** : les 81 espèces sont cohérentes, et les 132 Digivolutions mènent toutes à des espèces existantes. Chaque espèce a ses dessins.
- **Progression** : aucune statistique fausse, négative ou au-dessus des plafonds sur 32 400 Digimon générés.
- **Combats** : la formule des dégâts est conforme au code. Tous les combats se terminent, et chaque récompense n'est donnée qu'une fois.
- **Boss** : chaque boss se bat avec un Champion bien entraîné, entre son niveau et 4 niveaux au-dessus.

Ce qui est corrigé (26 anomalies) :
- l'ABI qui montait en boucle ;
- le mode d'entraînement « Statistique » démesuré ;
- les Ultimes sans écusson ;
- les lignées cassées par un objet de Digivolution ;
- deux branches impossibles ;
- Koromon perdant presque tous ses combats (79 % de victoires au lieu de 22 %) ;
- les formes agiles inaccessibles sans affamer le Digimon ;
- divers cas limites : K.O., sommeil, Lutte, Dojo, Bits, EXP partagée...

Tes décisions :
- le poids des éléments dans les combats est gardé (« Greymon est un Digimon de Feu, c'est normal ») ;
- les Méga : « pour plus tard » ;
- l'ABI n'est plus remis à zéro à la renaissance (corrigé).

### Systèmes : sauvegardes, objets, quêtes, sons

- **Sauvegardes** : l'aller-retour sauvegarde → chargement est exact, toutes les migrations passent et le stockage plein est géré. Les 3 cas de perte de partie sont corrigés, et 5 tests les couvrent désormais.
- **Objets** :
  - les objets d'Ultime demandent leur écusson ;
  - le surplus d'un sac plein va au coffre (ou au frigo), avec un message juste ;
  - la canne à pêche n'est plus perdue ;
  - les champignons de luxe sont rares ;
  - la prime de revanche de Shellmon est donnée une fois par jour ;
  - les demandes des habitants demandent un vrai entraînement.
- **Son** : plus de rafale de notes après un ralentissement. Le son est suspendu quand le jeu est caché, et la musique revient après un jingle.
- **Quêtes** : la progression complète du chapitre 1 au carton « À suivre » se déroule sans erreur, et tous les drapeaux sont déclarés.

### Graphismes et ressources

- **Images servies** : aucune n'est manquante ni périmée.
- **Polices** : sous licence libre (OFL).
- **Corrigé** :
  - les yeux d'Agumon et de Palmon ;
  - le sens de Yuramon et de Togemon ;
  - 30 objets qui perdaient leurs verts (regardés un à un) ;
  - les 23 arbres, nets au lieu de flous ;
  - l'écran titre.
- **Corrigé aussi** :
  - les images du volcan, 16 fois plus légères et chargées en arrière-plan ;
  - les parois des souterrains, sans bandes ;
  - les dalles de la grotte, sans couture ;
  - les bébés en pixel art, à la taille des autres bébés.
- **Non corrigé** : 18 défauts mineurs (P3) : contours, ordre d'affichage, tailles. Ils sont listés dans `BUGS_ET_CORRECTIONS.md`.

### Performances, compatibilité, code

- **Démarrage** :
  - les images du dossier commun sont en WebP (5,2 Mo au lieu de 15,9 Mo) ;
  - les dossiers de la grotte, des bébés, du désert et du volcan sont chargés en arrière-plan ;
  - avant de pouvoir jouer : 8,3 Mo à télécharger au lieu de 11,2 Mo (le volcan passe de 2,96 Mo à 187 Ko) ;
  - une carte voisine n'est plus préparée avant l'arrivée de ses images.
- **Écrans** : PC 800 × 600, Full HD, 4K, téléphone en paysage et en portrait, tablette. Le jeu tient en 4:3, les pixels restent nets, et les commandes tactiles n'apparaissent que sur les appareils tactiles.
- **Code** :
  - lanceur `JOUER.bat` ;
  - page et outils lavés (plus de style ni de script en ligne) ;
  - outil cassé retiré ;
  - références mortes retirées.

### Publication

- **Chaque lot** a été vérifié en ligne : le paquet servi par GitHub Pages a l'empreinte du commit.
- **Tests sur GitHub** : `.github/workflows/tests.yml` relance les tests et la vérification des empreintes à chaque envoi.
- **Branches de travail** : elles restent locales. Aucune réécriture d'historique, aucun `--force`.

## 5. Réserves

- **Le jeu n'a pas été joué de bout en bout par une personne pendant l'audit.** Les scripts déroulent l'histoire et les combats, et le parcours Playwright joue le début au clavier. Rien ne remplace une vraie partie des chapitres 1 à 3.
- **Pas encore vérifié en conditions réelles** : le son à l'oreille, la manette seule, le tactile sur un vrai téléphone, l'accès aux fichiers (FICHIER) et Safari.
- **15 objets gardent l'ancien détourage** : ceux à lueurs peintes, à brindilles et à brins fins. Ils peuvent perdre un peu de leur contour.
- **Contenu volontairement fermé** : le chapitre 4 n'est pas écrit, le Mont Panorama et le Gymnase sont fermés, et la carte du monde est en pause.

## 6. Statut

**VERSION STABLE AVEC RÉSERVES.**
- **Ce qui est fait** : toutes les anomalies bloquantes et graves sont corrigées et vérifiées. Les tests, le parcours réel et la version en ligne sont au vert.
- **Ce qui reste** :
  - les réserves ci-dessus ;
  - les P3 non traitées ;
  - les Méga, laissées pour plus tard.
