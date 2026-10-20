# DIGIMON — L'Île des Fichiers

Jeu de fan non officiel inspiré de la saison 1 de Digimon Adventure, dans l'esprit de **Digimon World 1**
(élevage, ville à reconstruire) et de **Digimon World 2003** (décors denses, menus), avec des combats **au tour par
tour** façon Pokémon. Aucune image officielle n'est utilisée : les décors sont les images du créateur
(`assets/commun/jeu/`), les Digimon, le héros et les effets sont dessinés par le code.

## Lancer le jeu
- **En ligne / téléphone** : la version publiée sur GitHub Pages s'installe comme une application
  (« Installer le jeu » sur PC, « Ajouter à l'écran d'accueil » sur téléphone) et marche ensuite **hors ligne**.
- **En local** : `python dev/serve.py 8766` puis ouvrir `http://localhost:8766` (les polices sont incluses dans `assets/fonts/`).

## Commandes
| Action | Clavier | Manette | Écran tactile |
|---|---|---|---|
| Se déplacer (8 directions) | Flèches ou ZQSD | Croix ou stick gauche | Croix à gauche |
| Courir | Maj (Shift) | X / Carré | COURIR |
| Parler, frapper, valider | Espace | A / Croix | OK |
| Ouvrir le menu (Digivice) | Entrée (ou Échap, Tab) | START | MENU |
| Retour, sortir | Suppr (ou Retour arrière) | B / Rond | RETOUR |
| Couper le son | M | | |

## Sauvegarde
Trois emplacements. La partie est **sauvegardée automatiquement** (fin du récit d'ouverture, changements de zone,
combats...). Avant chaque sauvegarde, la précédente est gardée en **copie de secours** ; une sauvegarde abîmée est mise
à part, jamais effacée. Les mises à jour du jeu **ne suppriment pas** la partie en cours (migrations automatiques).
Le menu FICHIER de l'écran titre relie aussi les parties à un fichier sur l'ordinateur.

## Contenu (octobre 2026)
- **Ton héros** : un des 8 enfants inspirés des DigiSauveurs (Tai, Matt, Sora, Izzy, Mimi, Joe, T.K., Kari), puis son
  DigiŒuf ; le début se joue dans la forêt de l'île.
- **Chapitre 1 « L'Île des Fichiers »** : le Grand Arbre de la Clairière (énigmes) et **Kuwagamon**, les cabines de la plage
  et **Shellmon**, Tai délivré. **Chapitre 2 « Le Lac et le Loup »** : Monochromon, **Seadramon**, Matt et Garurumon.
  **Chapitre 3 « La Montagne de Feu »** : les déserts aux poteaux, le Village des Yokomon, Sora et **Meramon** au Mont
  Miharashi. Les régions s'ouvrent chapitre après chapitre.
- **Élevage façon Digimon World 1** : faim, toilettes, sommeil (Digimon diurnes ou nocturnes), maladie par négligence
  (jamais au hasard), blessure, fatigue, discipline (féliciter / gronder), corpulence, durée de vie ; **au 3e K.O. il meurt**
  et renaît en œuf. Digivolutions jamais automatiques : on les déclenche soi-même quand les conditions sont réunies.
- **Entraînement au Terrain d'entraînement** : le Digimon utilise vraiment le poste (piste, haltères, sac de frappe, mur,
  cristal, classe) ; les points d'entraînement débloquent les Digivolutions, le niveau (combats) fixe le potentiel.
- **Combats au tour par tour** : le joueur choisit chaque technique (6 au plus, coût en PM), coup spécial à charger,
  objets, allié ; après une victoire, une technique ennemie observée peut être apprise.
- **La ville se reconstruit** : chaque habitant recruté construit son bâtiment, qui grandit avec la ville (Ruines →
  Mégapole) ; quartiers, passants, services, cuisine, tournois du Colisée, pêche, mini-jeux.
- **Grand monde** : le cœur de l'île est un **puzzle de 28 cartes** de 96 × 72 cases reliées par leurs bords, plus
  16 régions de 10 sous-zones et les intérieurs : 342 cartes. Donjons des écussons pour débloquer les Ultimes.
- **Monde vivant** : calendrier et saisons, température, orages, tempêtes, canicules, sécheresses ; échanges avec le décor
  (secouer les arbres avec un bâton, fouiller avec une pelle, s'asseoir, boire...).
- **Carte du monde** : un grand plan qui se découvre petit à petit.
- 70 espèces, 158 techniques, plus de 150 objets.

## Organisation du code
Voir **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** : arborescence (chaque fichier y est décrit), ordre de chargement,
recettes pour ajouter un Digimon, une attaque, une zone, et les règles de performance.
- La liste des scripts du jeu est dans **un seul fichier** : `js/scripts.js`.
- `node dev/tests.js` : 34 tests (sauvegarde, migrations, combat, drapeaux, écussons, chapitres...).
- `dev/check.html` : vérification des 342 cartes (passages, arrivées, portes, panneaux, personnages accessibles, décors
  compris) et de l'arbre des Digivolutions ; `?seul=carte1,carte2` pour quelques cartes.
- `dev/empreintes.js` : empreinte de chaque dessin du jeu, pour prouver qu'un nettoyage du code ne change rien à l'écran.
- `dev/gallery.html` : sprites. `dev/textfit.js` : textes qui débordent.
- **Atelier des cartes** (`dev/editeur/`, seulement sur le PC du créateur) : il montre chaque carte comme le jeu ; ses
  retouches sont écrites dans `js/maps/retouches_donnees.js`, vérifiées (« Faire valider ») avant la mise en ligne.
- Le projet est suivi avec **Git** (`git log` pour l'historique).
