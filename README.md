# DIGIMON — L'Île des Fichiers

Jeu de fan non officiel inspiré de la saison 1 de Digimon Adventure, avec une ambiance visuelle
façon *Digimon World* (sprites « pré-rendus 3D », interface bleu-canard) et une logique de jeu
à la Pokémon (combats au tour par tour, niveaux, Digivolution). Tout est dessiné par le code :
aucune image officielle n'est utilisée.

## Lancer le jeu
Double-clique sur `index.html` (navigateur récent). Internet sert uniquement aux polices.
Pour développer : `python dev/serve.py 8766` puis ouvrir `http://localhost:8766`.

## Commandes
| Action | Clavier | Manette | Écran tactile |
|---|---|---|---|
| Se déplacer | Flèches ou ZQSD | Croix ou stick gauche | Croix à gauche |
| Courir | Maj (Shift) | X / Carré | COURIR |
| Parler / interagir / valider | Espace | A / Croix | OK |
| Menu | Entrée (ou Tab) | Y / Triangle, START | MENU |
| Retour | Échap ou Retour arrière | B / Rond | RETOUR |
| Couper le son | M | | |

Les commandes tactiles apparaissent au premier toucher de l'écran (téléphone, tablette).

## Sauvegarde
La partie est **sauvegardée automatiquement** à chaque changement de zone, après chaque combat
et au choix du partenaire (icône de disquette). « Continuer » sur l'écran titre.
- Avant chaque sauvegarde, la précédente est gardée en **copie de secours** : si la dernière est abîmée,
  le jeu charge la copie et prévient le joueur (la sauvegarde abîmée est conservée à part, jamais effacée).
- Un Digimon d'une espèce retirée du jeu n'empêche pas le chargement : il est **mis de côté** et revient
  si l'espèce revient.
- « Nouvelle partie » demande confirmation quand une partie existe déjà.

## Contenu actuel (v1.4)
- **Début de partie** : on choisit son héros parmi 7 DigiSélectionnés, cinématique (camp → Digivice → tunnel numérique →
  chute sur l'île), réveil chez Jijimon. Le premier partenaire est un **bébé** (Botamon, Pichimon ou Yuramon).
- **Pas de capture** : les Digimon naissent de **DigiŒufs** (Village des Bébés, un par jour) puis grandissent par
  Digivolution et entraînement. 61 espèces, du Bébé au Méga (lignée complète Botamon → WarGreymon).
- **Combats ≠ entraînement** : les combats donnent de l'EXP et le **niveau** ; le **Terrain d'entraînement** donne
  des **points d'entraînement** (mini-jeu de timing, volontairement difficile). Les **Digivolutions** demandent les deux
  et se déclenchent depuis la **table des Digivolutions** (jamais automatiques, sauf option « règles DW1 »).
- **Combat** : PM (points de magie) au lieu des PP, jauge d'énergie et **coup spécial** de chaque Digimon, techniques
  **observées** chez l'ennemi, écran de comparaison avant d'oublier une technique (6 au maximum), mode « Ordres »
  (le partenaire se bat seul, façon Digimon World).
- **Vie du partenaire** (façon DW1) : faim, toilettes, sommeil, maladie, blessure, discipline, corpulence,
  erreurs de soin, durée de vie et renaissance.
- **La ville se reconstruit** : chaque Digimon recruté construit son bâtiment ; la ville grandit de Ruines à Mégapole,
  en plusieurs quartiers. Les bâtiments pas encore construits restent cachés.
- **Grand monde** : forêt, plage, Quartier des Champs, Village des Bébés, et **16 régions de 10 sous-zones** chacune
  (montagne, lac, marais, volcan, usine...), avec Engrenages Noirs et boss à libérer, jusqu'à Devimon.
- **Activités** : tournois du Colisée, curling, chasse au trésor, pêche, cartes Digimon (menu ALBUM).
- Jour/nuit, météo, carte de l'île avec zoom sur les sous-zones, voyage rapide (Biyomon).

## Organisation du code
Voir **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** : arborescence, ordre de chargement, recettes pour ajouter
un Digimon, une attaque, une zone.
- La liste des scripts du jeu est dans **un seul fichier** : `js/scripts.js`.
- Outils : `dev/gallery.html` (sprites), `dev/check.html` (vérification des 177 cartes et de l'arbre des Digivolutions),
  `node dev/tests.js` (tests de la logique : sauvegarde, combat, expérience, drapeaux).
- Le projet est suivi avec **Git** (`git log` pour l'historique).
