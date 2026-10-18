# DIGIMON — L'Île des Fichiers

Jeu de fan non officiel inspiré de la saison 1 de Digimon Adventure, dans l'esprit de **Digimon World 1**
(élevage, ville à reconstruire, combats en arène) et de **Digimon World 2003** (décors denses, menus).
Tout est dessiné par le code : aucune image officielle n'est utilisée.

## Lancer le jeu
- **En ligne / téléphone** : la version publiée sur GitHub Pages s'installe comme une application
  (« Installer le jeu » sur PC, « Ajouter à l'écran d'accueil » sur téléphone) et marche ensuite **hors ligne**.
- **En local** : `python dev/serve.py 8766` puis ouvrir `http://localhost:8766` (les polices sont incluses dans `assets/fonts/`).

## Commandes
| Action | Clavier | Manette | Écran tactile |
|---|---|---|---|
| Se déplacer | Flèches ou ZQSD | Croix ou stick gauche | Croix à gauche |
| Courir / sprint en combat / zoom de la carte | Maj (Shift) | X / Carré | COURIR |
| Parler, interagir, valider ; roue de combat | Espace | A / Croix | OK |
| Menu ; coup spécial en combat | Entrée (ou Tab) | Y / Triangle, START | MENU |
| Retour | Échap ou Retour arrière | B / Rond | RETOUR |
| Couper le son | M | | |

## Sauvegarde
Trois emplacements. La partie est **sauvegardée automatiquement** (fin du récit d'ouverture, changements de zone,
combats...). Avant chaque sauvegarde, la précédente est gardée en **copie de secours** ; une sauvegarde abîmée est mise
à part, jamais effacée. Les mises à jour du jeu **ne suppriment pas** la partie en cours (migrations automatiques).

## Contenu (octobre 2026)
- **Chapitre 1 « L'Île des Fichiers »** : 7 DigiSélectionnés au choix, cinématique, réveil chez Jijimon avec le **bébé**
  de la lignée de ton héros, visite de la ville avec Koromon, puis le Grand Arbre de la Clairière (3 énigmes) et
  **Kuwagamon**. Les autres régions s'ouvrent après lui (chapitre 2 : les Engrenages Noirs).
- **Élevage façon Digimon World 1** : faim, toilettes, sommeil (Digimon diurnes ou nocturnes), maladie par négligence,
  blessure, fatigue, discipline (féliciter / gronder), corpulence, durée de vie ; **au 3e K.O. il meurt** et renaît en œuf.
- **Entraînement dans le centre sportif** : le Digimon utilise vraiment le poste (mannequin, rocher, haies, mur, cristal) ;
  objectif Digivolution (points) ou Statistique (formule de Digimon World 1), trois difficultés ; potentiel repoussé par
  le niveau et l'ABI (dé-digivolution, comme Cyber Sleuth).
- **Combats en arène** : carte de combat propre à la région, déplacements libres, attaques visibles qui ratent si la cible
  bouge, portées corps à corps / proche / loin / terrain, roue de commandes, objets lancés par le héros, coup spécial à
  charger. Option : tour par tour façon Digimon World 2003.
- **La ville se reconstruit** : chaque habitant recruté construit son bâtiment ; développement en **pourcentage**
  (Ruines → Mégapole), quartiers, passants, habitants qui s'associent pour débloquer des améliorations.
- **Grand monde** : forêt, plage, dunes, bosquet, Village des Bébés, et **16 régions de 10 sous-zones** (313 cartes),
  chacune avec ses décors, son lieu marquant et son ambiance ; donjons des écussons pour débloquer les Ultimes.
- **Monde vivant** : calendrier et saisons, température, orages, tempêtes, canicules, sécheresses ; échanges avec le décor
  (secouer les arbres avec un bâton, fouiller avec une pelle, s'asseoir, boire...).
- **Carte du monde** : un grand plan qui se découvre petit à petit (régions à ×1, zones en icônes à ×2 / ×3).
- 66 espèces, 143 techniques, 135 objets.

## Organisation du code
Voir **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** : arborescence (chaque fichier y est décrit), ordre de chargement,
recettes pour ajouter un Digimon, une attaque, une zone, et les règles de performance.
- La liste des scripts du jeu est dans **un seul fichier** : `js/scripts.js`.
- `node dev/tests.js` : 30 tests (sauvegarde, migrations, combat, arène, drapeaux, écussons...).
- `dev/check.html` : vérification des 313 cartes (passages, portes, panneaux, personnages accessibles, décors compris)
  et de l'arbre des Digivolutions. `dev/gallery.html` : sprites. `dev/textfit.js` : textes qui débordent.
- Le projet est suivi avec **Git** (`git log` pour l'historique).
