# DIGIMON — L'Île des Fichiers

Jeu de fan non officiel inspiré de la saison 1 de Digimon Adventure, dans l'esprit de **Digimon World 1**
(élevage, ville à reconstruire) et de **Digimon World 2003** (décors denses, menus), avec des combats **au tour par
tour** façon Pokémon. Aucune image officielle n'est copiée : les décors et les Digimon (bébés, Disciples, Champions...)
sont les images du créateur, peintes avec un outil de génération d'images (`assets/*/jeu/`, originaux dans
`assets/ASSETS - Digimon`, jamais publiés) ; les autres Digimon, le héros et les effets sont dessinés par le code ; le
titre est dessiné par le jeu (police Press Start 2P, licence OFL). Digimon, ses personnages et ses designs sont
© Bandai / Toei Animation ; ce projet n'est ni affilié ni approuvé.

## Jouer
- **Sur PC : double-cliquer sur `JOUER.bat`** (à la racine du dossier). Le jeu en ligne s'ouvre dans sa propre fenêtre,
  comme une application : Chrome, sinon Edge, sinon le navigateur par défaut. La première fois, il pose aussi un
  raccourci **Digimon** sur le Bureau, avec l'icône du jeu : ensuite, un clic dessus suffit.
- **Partout (PC, téléphone, tablette)** : **https://kronos4322.github.io/digimon-ile-des-fichiers/** — la version de
  référence, la même partout, mise à jour à chaque publication.
- **Application installée** : bouton « Installer le jeu » de l'écran titre (PC) ou « Ajouter à l'écran d'accueil »
  (téléphone) ; elle s'ouvre ensuite même **hors ligne**.
- **Jamais en double-cliquant sur `index.html`** : ouvert comme un simple fichier (adresse `file://`), le navigateur
  interdit au jeu de lire ses propres images. La page part d'ailleurs aussitôt sur le jeu en ligne.

## Commandes
| Action | Clavier | Manette | Écran tactile |
|---|---|---|---|
| Se déplacer (8 directions) | Flèches ou ZQSD | Croix ou stick gauche | Croix à gauche |
| Courir | Maj (Shift) | X / Carré | COURIR |
| Parler, frapper, valider | Espace | A / Croix | OK |
| Ouvrir le menu (Digivice) | Entrée (ou Échap, Tab) | START | MENU |
| Retour, sortir | Suppr (ou Retour arrière) | B / Rond | RETOUR |
| Couper le son | M | | |
| Plein écran | F11 ou double-clic sur le jeu | | au premier toucher |

## Sauvegarde
Trois emplacements. La partie est **sauvegardée automatiquement** (fin du récit d'ouverture, changements de zone,
combats...). Avant chaque sauvegarde, la précédente est gardée en **copie de secours** ; une sauvegarde abîmée est mise
à part, jamais effacée. Les mises à jour du jeu **ne suppriment pas** la partie en cours (migrations automatiques).
Les parties sont gardées par le navigateur, pour l'adresse du jeu : `JOUER.bat`, le site et l'application installée
partagent les mêmes parties dans un même navigateur. D'un appareil ou d'un navigateur à l'autre : menu FICHIER de
l'écran titre (lien avec un fichier sur l'ordinateur, export / import sur téléphone).

## Contenu (octobre 2026)
- **Ton héros** : un des 8 enfants inspirés des DigiSauveurs (Tai, Matt, Sora, Izzy, Mimi, Joe, T.K., Kari), puis son
  DigiŒuf ; le début se joue dans la forêt de l'île.
- **Chapitre 1 « L'Île des Fichiers »** : le Grand Arbre de la Clairière (énigmes) et **Kuwagamon**, les cabines de la plage
  et **Shellmon**, Tai délivré. **Chapitre 2 « Le Lac et le Loup »** : Monochromon, **Seadramon**, Matt et Garurumon.
  **Chapitre 3 « La Montagne de Feu »** : les déserts aux poteaux, le Village des Yokomon, Sora et **Meramon** au Mont
  Miharashi, la grotte sous le volcan. Les régions s'ouvrent chapitre après chapitre.
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
  16 régions de 10 sous-zones, le Mont Miharashi et les intérieurs : 351 cartes. Donjons des écussons pour débloquer
  les Ultimes.
- **Monde vivant** : calendrier et saisons, température, orages, tempêtes, canicules, sécheresses ; échanges avec le décor
  (secouer les arbres avec un bâton, fouiller avec une pelle, s'asseoir, boire...).
- **Carte du monde** : un grand plan qui se découvre petit à petit.
- 81 espèces (79 au DigiDex), 132 Digivolutions, 166 techniques, 153 objets, 351 cartes (inventaire complet :
  [docs/audit/MATRICE_CONTENUS.md](docs/audit/MATRICE_CONTENUS.md)).

## Développement
Jeu 100 % HTML5 / JavaScript, **sans outil de compilation**. Tout est décrit dans
**[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** : chaque fichier, l'ordre de chargement, les recettes (ajouter un
Digimon, une attaque, une zone...), les règles de performance et de publication.

| Chemin | Contenu |
|---|---|
| `JOUER.bat` | le lanceur Windows (jeu en ligne en fenêtre d'application, raccourci sur le Bureau) |
| `index.html`, `manifest.webmanifest`, `sw.js` | la page du jeu, l'application installable, le service worker (hors ligne, mises à jour) |
| `js/` | les scripts du jeu ; leur liste, dans l'ordre, est dans **un seul fichier** : `js/scripts.js` |
| `assets/` | images, polices, icônes, feuille de style de la page |
| `paquets/` | les scripts réunis pour le site en ligne (fabriqués par `dev/versions.py` : ne pas modifier) |
| `dev/` | outils de développement, jamais chargés par le jeu : tests, vérifications, serveur local, captures |
| `docs/` | documentation, recherches et rapports |

- **Essayer une modification** avant de la publier : `python dev/serve.py 8766`, puis http://localhost:8766.
- **Tester** : `node dev/tests.js` (logique du jeu sans navigateur : sauvegarde, migrations, combat, drapeaux, chapitres,
  géographie du monde, liste des scripts, empreintes, fins de ligne... ; `SEUL=texte` pour quelques tests) ;
  `dev/check.html` avec le serveur local (toutes les cartes et l'arbre des Digivolutions ; `?seul=carte1,carte2`) ;
  `dev/gallery.html` (sprites : `?sp=agumon,greymon`, `?hero`, `?icons`) ; dans un vrai Chrome : `node dev/e2e/parcours.js`
  (une partie jouée au clavier, de l'écran titre à la reprise après rechargement ; `URL=<adresse>` pour le site en ligne)
  et `node dev/e2e/ecrans.js` (6 formats d'écran) — `npm install` dans `dev/e2e` la première fois. Les tests sont
  relancés par GitHub à chaque envoi (`.github/workflows/tests.yml`). Plan complet : `docs/audit/PLAN_DE_TESTS.md`.
- **Publier** : `python dev/versions.py`, `node dev/tests.js`, commit, `python dev/versions.py --verifier`, puis
  `git push` (GitHub Pages republie le site en une minute environ) ; liste complète : `docs/audit/RELEASE_CHECKLIST.md`,
  journal des versions : `CHANGELOG.md`.
- **Atelier des cartes** (`dev/editeur/`, seulement sur le PC du créateur, lancé par `dev/editeur/LANCER_ATELIER.bat`) :
  il montre chaque carte comme le jeu ; ses retouches sont écrites dans `js/maps/retouches_donnees.js`, vérifiées
  (« Faire valider ») avant la mise en ligne.
- Le projet est suivi avec **Git** (`git log` pour l'historique).
