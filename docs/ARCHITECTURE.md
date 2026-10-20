# Architecture du code

Jeu 100 % HTML5 / JavaScript, **sans outil de compilation** : `index.html` charge `js/scripts.js`, qui charge tous les
scripts dans l'ordre. Chaque fichier est une fonction auto-exécutée `(function () { ... })();` qui enregistre ce qu'elle
fournit dans l'objet global **`DW`** (ex. `DW.Sprites`, `DW.MAPS`, `DW.BattleScene`). L'en-tête de chaque fichier dit ce
qu'il contient : c'est la référence, ce document en donne la carte.

## Arborescence

| Dossier | Rôle | Fichiers |
|---|---|---|
| `index.html` | Page : canvas + `js/scripts.js` (installation, plein écran) | |
| `js/scripts.js` | **Liste unique des scripts**, dans l'ordre de chargement (jeu, `dev/check.html`, `dev/gallery.html`, atelier des cartes, tests) | |
| `js/main.js` | Démarrage : écran titre tout de suite, écran de chargement si on lance la partie avant la fin des images, mode essai de l'atelier (`?essai=carte,x,y`) | |
| `js/engine/` | Moteur, indépendant du jeu | `core.js` (canvas, utilitaires, timers, fondu, scènes, boucle), `input.js` (clavier, manette, tactile ; actions tenues par des « sources »), `audio.js` (bruitages et musiques chiptune), `art.js` (rendu des volumes « pré-rendu 3D »), `time.js` (horloge, calendrier, saisons, simulation de la météo) |
| `js/ui/` | Écrans et interface | `widgets.js`, `dialog.js`, `menus.js` (Digivice, équipe, DigiDex, options), `sac.js` (sac, banque, coffre, frigo), `boutique.js`, `nom.js`, `status.js` (fiche Digimon), `evotable.js`, `learn.js` (oublier une technique), `battleui.js` (affichage du combat), `hatch.js` (œufs, éclosion), `renaissance.js`, `farm.js` (DigiFerme), `worldmap.js`, `title.js` (écran titre, emplacements), `intro.js` (« Qui es-tu ? », cinématique d'ouverture), `touch.js` (commandes tactiles) |
| `js/data/` | Données pures | `types.js`, `moves.js`, `species.js` + `species2.js` + `species3.js`, `lignees.js`, `evolutions.js`, `ecussons.js`, `techniques_classe.js`, `techniques_elements.js`, `items.js` (catalogue de Digimon World 1, boutiques), `equipements.js`, `music.js` + `musiques_regions.js`, `flags.js` (liste officielle des drapeaux) |
| `js/gfx/` | Graphismes | voir ci-dessous |
| `js/game/` | Logique de jeu | voir ci-dessous |
| `js/maps/` | Cartes et scénario | voir ci-dessous |
| `assets/` | Images, polices, icônes | `commun/jeu/` et `volcan/jeu/` (copies allégées des images du créateur, faites par `dev/optimiser_textures.py`), `commun/kit/` (kit du personnage, `dev/kit_persos.py`), `ASSETS - Digimon/` et `volcan/*.png` (originaux : sur le PC du créateur seulement, hors GitHub), `css/`, `fonts/` (licence SIL OFL), `icons/` |
| `dev/` | Outils (jamais chargés par le jeu) | voir « Outils » |
| `docs/` | Documentation | ce fichier, `ZONES_DW1.md` (recherches sur Digimon World 1) |

**`js/gfx/`** — `sprites.js` (cache et respiration des Digimon), `digimon/*.js` (un dessin par espèce : `bebes.js`,
`entrainement.js`, `disciples.js`, `champions.js`, `ultimes.js`, `ultimes2.js`, `ile.js`, `chapitre3.js`, lignées détaillées
`agumon.js`, `gabumon.js`, `lignees.js`, vues de face / de dos `vues.js`), `hero.js` (sprite de marche du joueur et des
enfants de l'histoire `DW.HEROES`), `persos.js` + `kit_donnees.js` (personnage assemblé avec le kit du créateur), `icons.js`,
**`objects.js`** (légende des cartes `World.CH`, objets `World.OBJ`, dessins de secours `World.secours`, échelle des décors
et des bâtiments, `World.obj`), **`textures.js`** (les images du créateur : sols par thème, arbres et décors qui remplacent
les dessins par code, fleurs, mobilier), `pinceau.js` (outils de peinture `World.Paint`), décors encore peints par le code :
`premium.js`, `peints.js`, `maisons.js`, `facades.js`, `town.js`, `district.js`, `city.js`, `grandir.js`, `buildings2.js`,
`interior.js`, `interior2.js`, `farm.js`, `nursery.js` (DigiŒufs), `littoral.js`, `ecussons.js`, `chapitre1.js`, `temple.js`,
`classe.js`, `desert.js`, `sites.js`, `biomes.js` (thèmes et objets des régions), `themes.js` (identité des zones),
**`terrain.js`** (préparation d'une carte : sol peint, eau animée, falaises, objets, herbes hautes), `ponts.js` (ponts
peints, redressement des ponts), `ambient.js`, `vivant.js`, `rendu.js` (étalonnage), `regionfx.js`, `battlebg.js` (fonds de
combat), `ciel.js` (jour, nuit, météo à l'écran), `meteo.js` (orages, tempêtes).

**`js/game/`** — `options.js`, `monster.js` (Digimon, stats, échelle `DW.SCALE`), `objets.js` (effets des objets, sac,
`giveItem`), `sauvegarde.js` (emplacements, migrations `SAVE_V`), `fichier.js` (sauvegarde dans un fichier de l'ordinateur),
élevage : `care.js` (faim, toilettes), `life.js` (vie façon Digimon World 1 : durée de vie, sommeil, maladie, discipline,
corpulence), `companion.js` (le partenaire sur la carte), entraînement : `training.js`, `trainfield.js` (séance sur le poste
même), `trainingames.js` (mini-jeux d'entraînement), monde : `calendrier.js`, `abri.js` (orages), `paysage.js` (échanges avec
le décor), `sol.js` (trouvailles au sol), `wild.js` (Digimon sauvages visibles), `lave.js` (dangers volcaniques), ville :
`town.js` (recrues, niveau), `collab.js`, `services.js`, `requests.js`, `cuisine.js`, activités : `activities.js` (tournois,
curling, trésor, pêche, cartes), `peche.js`, `minijeux.js`, combat : `battle.js` (tour par tour), `fx.js` (animations des
techniques), `fxelem.js` (effets d'élément), `evolution.js` (séquence de Digivolution), histoire : `story.js` (Engrenages
Noirs), `guide.js` (Jijimon), `debut.js` (début joué dans la forêt), `chapitre1.js`, `cine_shellmon.js`, `chapitre2.js`,
`chapitre3.js`, `trophees.js`, et **`overworld.js`** (exploration ; `DW.preparerCarte` : une carte prête à jouer).

**`js/maps/`** — `common.js` (`DW.getMap`, outils `DW.MapKit` : `paint`, `forestGen`, `zoomMap`, `zpt`, `freeNear`,
`changerLignes`...), `puzzle.js` (le monde en pièces de 96 × 72 cases reliées par leurs bords), `monde.js` (grille du monde,
voisines), `relief.js` (relief en niveaux), `retouches.js` + `retouches_donnees.js` (retouches de l'atelier des cartes),
`decor.js` (décor en kits et lieu marquant), `distrib.js` (distributeurs, panneaux au bord des chemins), cartes :
`foret.js`, `plage.js`, `rivage.js`, `village.js`, `quartiers.js`, `champs.js`, `gym.js`, `gymnase.js`, `classe.js`,
`berceau.js`, `yokomon.js`, `souterrain.js`, `miharashi.js` (chapitre 3), `regions.js` (16 régions de 10 sous-zones),
intérieurs : `maison.js`, `joueur.js`, `interieurs.js`, `grandir.js` (bâtiments qui grandissent), `palais.js`, donjons :
`donjons.js` + `enigmes.js`, boss : `kuwagamon.js`, `antre.js` (Shellmon).

## Ordre de chargement
moteur → widgets/dialogues → données → graphismes → logique → écrans → cartes → histoire → `main.js`.
Une constante lue **au chargement** (ex. `const { UI } = DW;`) doit venir d'un fichier chargé avant.
Les références **à l'exécution** (dans une fonction) peuvent pointer vers n'importe quel fichier.

## D'une carte écrite à une carte jouée
1. **Génération** (`DW.getMap`, maps/common.js) : construction (`build`), gabarit et passages du puzzle, chemins vers les
   passages, `densify`, ponts redressés (`World.fixBridges`).
2. **Retouches de l'atelier** (`DW.Retouches.appliquer`, maps/retouches.js) : thème, relief, cases, objets retirés et
   ajoutés, sorties, panneaux, collisions — toujours après la génération.
3. **Habillage** (`DW.preparerCarte`, game/overworld.js) : décor en kits (maps/decor.js), panneaux au bord des chemins et
   distributeurs (maps/distrib.js), éléments de l'histoire. Il respecte les retouches (objet retiré, `decorAuto: false`,
   panneau placé à la main). Il est déterministe : le même décor à chaque partie et dans l'atelier.
4. **Rendu** (`World.prepare`, gfx/terrain.js) : sol peint, eau, objets, collisions finales.

Chaque étape marque les lignes qu'elle a traitées (`m._denseFor`, `m._retFor`, `m._dressFor`...). **Remplacer les lignes
d'une carte déjà préparée passe toujours par `DW.MapKit.changerLignes(m, lignes)`**, qui fait suivre ces marqueurs ;
sinon la génération et le décor se refont par-dessus à la visite suivante.

## L'atelier des cartes (sur le PC du créateur)
`dev/editeur/` (hors GitHub), lancé par `dev/editeur/LANCER_ATELIER.bat` (serveur `dev/serve.py`, port 8765). Il montre
chaque carte exactement comme le jeu et enregistre tout dans `js/maps/retouches_donnees.js`. Le panneau « À valider »
compare avec la dernière version validée (le dernier commit) ; « Faire valider » écrit `dev/editeur/validation/a_valider.md`
et des images avant / après : Claude vérifie les cartes (`dev/check.html?seul=...`) puis met en ligne.

## Les images du créateur
Les décors (sols, arbres, buissons, rochers, fleurs, mobilier, meubles, plage, montagne, volcan) sont ses images,
fabriquées avec ChatGPT. `python dev/optimiser_textures.py` en fait des copies allégées (`assets/<dossier>/jeu/`) ;
`gfx/textures.js` les relie aux objets du jeu (table `ARBRES` : objet → images par variante, `HAUTEUR` : taille en hauteurs
de héros, `CHOIX` : sols par thème). Un objet remplacé garde seulement un petit dessin de secours (`World.secours`), utilisé
si l'image ne se charge pas ; les rendus faits pendant le chargement sont oubliés dès que les images arrivent
(`World.oublierObjet`). Règles du créateur : arbres et maisons font 3 fois la hauteur du héros ; un objet vu de biais n'est
pas utilisé (on garde le dessin de face).

## Recettes

**Ajouter un Digimon**
1. `js/data/species.js` (ou `species2.js`, `species3.js`) : `def('id', {...})` + ajout dans `DW.DEX_ORDER`.
2. `js/gfx/digimon/<stade>.js` : fonction de dessin `id(d, p = {}) { ... }` (repère 64×64, tourné vers la droite).
   `p.pose` vaut `'attack'` ou `'hurt'` pendant les combats (optionnel).
3. Évolutions : `js/data/evolutions.js` (tout Digimon doit être atteignable depuis un œuf : `dev/check.html` le vérifie).
4. Vérifier le rendu : `dev/gallery.html?sp=id`.

**Ajouter une attaque** : `js/data/moves.js` (+ clé d'animation dans la table `FX`), animation dans `js/game/fx.js`.
Un Digimon connaît **6 techniques** au maximum (`DW.MAX_MOVES`). Les techniques de soin utilisent `heal` (part des PV max).
Chaque Digimon a un **coup spécial** (`DW.SIG` dans `moves.js`) : jauge d'énergie pleine en combat, puis on le **charge**.
Les techniques coûtent des PM (`DW.mpCost`, `MP_RATIO`). Après une victoire, le Digimon peut **retenir une technique ennemie
observée** (même élément ou neutre ; `BattleScene.observe`).

**Ajouter une zone** : nouveau fichier `js/maps/<region>.js` (ou une entrée dans le fichier de la région), l'ajouter dans
`js/scripts.js`, lui donner une `region` connue de `js/ui/worldmap.js`, la placer dans le puzzle ou la relier par ses
sorties, puis lancer `dev/check.html`.

**Ajouter un objet de décor** : une image du créateur (dossier `assets/ASSETS - Digimon/`, `dev/optimiser_textures.py`,
puis `gfx/textures.js`), ou un dessin dans `World.OBJ` (`js/gfx/objects.js` ou le fichier du thème) + un caractère dans
`World.CH` s'il se pose dans la grille. Il apparaît tout seul dans la bibliothèque de l'atelier.

**Ajouter un habitant à la ville** : une entrée dans `RECRUITS` (`js/game/town.js`), un emplacement dans `LOTS`
et un service dans `SERVICES` (`js/maps/village.js`), puis `recruitNPC({...})` dans la zone où on le trouve.

**Ajouter un intérieur** : carte avec `indoor: true` (0 vide, 1 parquet, 2 mur), meubles dans `objects`
(`walk: true` = tapis, `back: true` = accroché au mur), et une porte sur la carte extérieure :
`doors: [{ x, y, w, dir: 'up', to, tx, ty }]` (avancer vers la case bloquante de la porte). Voir `maps/maison.js`.
Intérieurs stylés : `map.floor = { type: 'tile' | 'tatami' | 'stone' | 'herring' | 'carpet', cols }`,
`map.wall = { base, alt, pattern: 'stripes' | 'dots' | 'diamond' | 'brick' | 'plain', wood }`.

**Objets animés** : `frames` (nombre d'images) et `fps` dans la définition ; `draw(d, v, f)` reçoit l'image `f`.
**Bâtiments** : `lights` (fenêtres éclairées la nuit) et `smoke` (cheminée). Les bâtiments pas encore construits restent
**invisibles** : le joueur découvre la surprise à son retour en ville (`DW.Town.reveal`).

## La ville qui grandit
Chaque recrue fait progresser la ville (`DW.Town.progress()`, en pourcentage) ; les niveaux Ruines → ... → Mégapole
(`DW.Town.level()`, 0 à 11) arrivent aux paliers `DW.Town.STEPS`. La ville centrale (`village.js`) est reconstruite selon les
recrues (`build()`) ; les quartiers (`quartiers.js` : Résidentiel, Marché, Numérique) s'ouvrent à leur niveau, avec des maisons
visitables (`makeHome`). Bazar, Dojo, Restaurant, Serre et la maison de Jijimon grandissent dedans (`maps/grandir.js`) et
dehors (`gfx/grandir.js`). Les enfants délivrés logent à l'étage de la maison du joueur (`maps/joueur.js`).

## Cartes faites à la main agrandies ×2
Forêt, Plage, Ville des Fichiers, Champs, Terrain d'entraînement et Village des Bébés sont **écrits dans leur plan
d'origine** puis agrandis ×2 par `MapKit.zoomMap` (table `MapKit.ZOOM`). **Toute coordonnée d'arrivée (tx, ty) vers ces
cartes s'écrit dans le plan d'origine** : `zTarget` la convertit (une seule fois, marque `_zt`). Coordonnée codée en dur
dans un script : `MapKit.zpt(id, x, y)`. Les sorties posées dans l'atelier sont déjà à la vraie taille (`_zt: true`).

## Statistiques (monster.js : DW.SCALE)
Le calcul « brut » des stats (niveau, base, données innées, entraînement, puces) est multiplié : PV et PM ×20 (max 9999),
Attaque / Défense / Vitesse / Intelligence ×4 (max 999). Points d'entraînement : 6 stats, 300 au total, plafond par stat
10 + 3 × niveau + 4 × ABI (max 99) ; ABI +1 par Digivolution, +2 par dé-digivolution.

## Élevage et santé (care.js, life.js)
Grande bulle des besoins (`Life.needs`), rythme **diurne / nocturne** par espèce (`Life.sched`), **3 K.O. = mort** puis
renaissance en œuf. La maladie n'arrive jamais au hasard : `m.germs` accumule les négligences (`Life.causes`) et baisse
quand tout va bien ; au-delà de 70 il peut tomber malade, à 100 c'est certain.

## Écussons et enfants perdus (quête parallèle)
Au début, aucun Digimon ne dépasse le stade **Champion** : chaque Ultime demande l'écusson de sa famille
(`data/ecussons.js`, `DW.Crests`), les sept réunis débloquent la Méga. Un donjon secret par enfant (`maps/donjons.js`,
énigmes réutilisables `maps/enigmes.js`) ; délivrer l'enfant donne son écusson.

## Combats (game/battle.js, ui/battleui.js)
Tous les combats se jouent au tour par tour : le joueur choisit chaque technique ; effets d'élément à chaque impact
(`game/fxelem.js`), animations des techniques (`game/fx.js`), allié automatique (`o.ally`). Équilibrage : `DW.BALANCE`.

## Monde vivant
Calendrier de 12 mois × 10 jours, 4 saisons ; météo par climat et par saison avec orages, tempêtes, canicules et
sécheresses (`engine/time.js`, rendu `gfx/ciel.js` et `gfx/meteo.js`). Décor vivant : `decor.js`, `regionfx.js`,
`vivant.js`, `paysage.js`.

## Outils (`dev/`)
- `node dev/tests.js` : tests de la logique, sans navigateur (`PILE=1` pour le détail d'une erreur).
- `python dev/serve.py 8766` : serveur local sans cache (et services de l'atelier des cartes).
- `dev/check.html` (+ `checkmaps.js`) : toutes les cartes (sorties, arrivées, portes, panneaux, personnages accessibles,
  décor compris) et l'arbre des Digivolutions ; `?seul=carte1,carte2`.
- `dev/empreintes.js` : empreinte des pixels de chaque dessin ; `Empreintes.base()` avant un nettoyage,
  `Empreintes.compare()` après : rien ne doit changer à l'écran.
- `dev/gallery.html` (sprites), `dev/textfit.js` (textes qui débordent), `dev/shots.js`, `dev/captures.js`,
  `dev/avantapres.js` (captures), `dev/islandmap.js`, `dev/plan.js`, `dev/domaine.js`, `dev/assemblage.js` (vues
  d'ensemble), `dev/geographie.js` et `dev/liens.js` (cohérence des liens entre cartes), `dev/guide.js` (guides du
  joueur en PDF), `dev/playtest.js` (partie jouée automatiquement), `dev/optimiser_textures.py` et `dev/kit_persos.py`
  (images du créateur).

## Conventions
- Textes du jeu et commentaires en français ; fichiers en UTF-8, fins de ligne LF (les tests le vérifient).
- Aucune image officielle : décors = images du créateur, Digimon et héros dessinés par le code.
- Sauvegarde : `localStorage` (`DW.save` / `DW.load` dans `game/sauvegarde.js`), options séparées (`options.js`).
  `_precedente` (copie écrite juste avant chaque sauvegarde) et `_illisible` (sauvegarde abîmée mise de côté). Un Digimon
  d'espèce inconnue va dans `state.orphans`. Changer le format = augmenter `DW.SAVE_V` et ajouter la migration.
- Nouveau drapeau d'histoire : le déclarer dans `js/data/flags.js` (les tests refusent un drapeau inconnu).
- Nouveau fichier : l'ajouter dans `js/scripts.js` (les tests vérifient que la liste correspond aux fichiers).
- Après une modification : `node --check`, `node dev/tests.js`, puis `dev/check.html` si une carte a changé, et
  `dev/empreintes.js` si un dessin a pu changer.

## Erreurs et robustesse
- La boucle du jeu (`core.js`) protège chaque scène : une erreur est notée dans la console et affichée quelques secondes
  en bas de l'écran (`DW.reportError`), mais le jeu continue.
- Un combat qui plante se referme (résultat `'error'`). `Overworld.battle` refuse un combat si toute l'équipe est K.O.
  (résultat `'none'`) : les scripts testent `res !== 'win'`.
- Le héros n'arrive jamais dans un obstacle : si la case d'arrivée est prise, il est posé sur la case libre la plus proche.
- Les animations utilisent le temps du jeu (`DW.wait`, `dt` dans `tick`), jamais `setTimeout` ni « +1/60 par image ».

## Piège à éviter (scripts de modification)
`String.replace(a, b)` interprète `$'`, `$&`, `` $` `` dans `b` : une légende contenant `'$'` a déjà corrompu deux fichiers.
Pour insérer du texte brut, utiliser `s.slice(0, i) + b + s.slice(i + a.length)` (ou `replace(a, () => b)`).

## Performances (à respecter : le PC du créateur a 2 cœurs à 1,1 GHz)
- **Préparation des cartes** (`World.prepare`, `gfx/terrain.js`) : un *générateur* qui rend la main régulièrement.
  `World.prepareSome(map, ms)` avance par tranches ; l'exploration prépare les **cartes voisines** quand le héros est immobile
  et libère les autres. `ow.charger(...)` prépare la carte sur l'écran noir du fondu.
- Le générateur est trop gros pour être optimisé par V8 : les boucles par pixel vivent dans de petites fonctions appelées
  par bandes de lignes. **Boucles par pixel** : pas d'allocation, pas de `for...of` sur de petits tableaux, `Math.sqrt`
  plutôt que `Math.hypot`.
- **Vérifications d'accès** (décor en kits, ponts) : grilles `Uint8Array` et piles `Int32Array`, jamais d'ensembles de
  chaînes « x,y » dans une boucle répétée.
- **Rendu des volumes** (`Art.render`) : tout changement doit donner exactement les mêmes pixels (`dev/empreintes.js`).
- Mesure : `map.gfx.prof` (temps par étape) et `map.gfx.ms` ; `dev/check.html` affiche le temps de chaque carte.
