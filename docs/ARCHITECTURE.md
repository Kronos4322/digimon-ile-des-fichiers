# Architecture du code

Jeu 100 % HTML5 / JavaScript, **sans outil de compilation** : `index.html` charge `js/scripts.js`, qui charge tous les scripts dans l'ordre.
Chaque fichier est une fonction auto-exécutée `(function () { ... })();` qui enregistre ce qu'elle fournit
dans l'objet global **`DW`** (ex. `DW.Sprites`, `DW.MAPS`, `DW.BattleScene`).

## Arborescence

| Dossier | Rôle | Fichiers |
|---|---|---|
| `index.html` | Page : canvas + `js/scripts.js` (aucun code) | |
| `js/scripts.js` | **Liste unique des scripts**, dans l'ordre de chargement (utilisée par le jeu, `dev/check.html`, `dev/gallery.html` et les tests) | |
| `css/` | Mise en page de la page | `style.css` |
| `js/engine/` | Moteur, indépendant du jeu | `core.js` (canvas, utilitaires, timers, fondu, scènes, boucle), `input.js` (clavier, manette ; actions tenues par des « sources » `Input.press` / `Input.release`), `audio.js` (sons, musiques), `art.js` (rendu des volumes), `time.js` (heure, lumière, météo) |
| `js/ui/` | Interface | `widgets.js` (textes, panneaux, barres), `dialog.js` (dialogues, choix), `menus.js` (menu, équipe, sac, DigiDex, boutique, nom, options), `status.js` (fiche Digimon), `evotable.js` (table des Digivolutions), `learn.js` (oublier une technique : comparaison avantages / inconvénients), `hatch.js` (choix d’un œuf + éclosion en frottant), `farm.js` (DigiFerme), `worldmap.js` (carte), `title.js` (écran titre, confirmation avant d'écraser une partie), `touch.js` (commandes tactiles + saisie du nom sur téléphone), `intro.js` (choix du DigiSélectionné `CharScene`, cinématique camp → Digivice → tunnel numérique → chute vers l’île, réveil `WakeScene`) |
| `js/data/` | Données pures, sans logique | `types.js` (éléments, attributs, statuts), `moves.js` (attaques + animation associée), `species.js` (Digimon), `evolutions.js` (embranchements + conditions), `items.js`, `music.js`, `flags.js` (liste officielle des drapeaux `state.flags`) |
| `js/gfx/` | Graphismes procéduraux | `sprites.js` (cache, respiration, poses), `digimon/*.js` (dessins par stade ; `agumon.js` = lignée complète Botamon → WarGreymon, `bebes.js` = bébés, `ultimes2.js` = WereGarurumon, SkullMeramon, Garudamon, Okuwamon), `hero.js` (7 héros au choix : `DW.HEROES`, `DW.heroLook`, `state.hero`), `icons.js`, `objects.js` (légende des cartes + objets), `town.js` (bâtiments et mobilier de la ville), `district.js` (quartiers, repères de zones, objets de plage), `themes.js` (identité visuelle de chaque zone), `interior.js` (meubles d’intérieur), `nursery.js` (DigiŒufs `DW.EGGS`, jouets, biberon, mobile), `biomes.js` (thèmes des biomes : palettes sol/eau/falaise, canopée « rock », `objMap`, particules ; objets de biome + légende à lettres accentuées), `sites.js` (lieux emblématiques des sous-zones : chalet, phare, manège, Arbre-Monde…), `terrain.js` (sol peint), `ambient.js` (ambiances), `battlebg.js` (fonds de combat) |
| `js/game/` | Logique de jeu | `options.js`, `monster.js` (Digimon, sauvegarde), `training.js` (potentiel + mini-jeu), `care.js` (faim, toilettes, crottes), `companion.js` (vie du partenaire sur la carte : pas de côté, sauts, bulles d’émotion, sommeil la nuit, objets déterrés 3×/jour, en silence), `life.js` (vie façon DW1 : durée de vie + renaissance, erreurs de soin, corpulence, discipline féliciter/gronder, sommeil/DORMIR, maladie/blessure), `activities.js` (tournois du Colisée, curling, chasse au trésor, pêche, cartes Digimon + album), `town.js` (recrues et niveau de la ville), `fx.js` (animations d'attaque), `battle.js`, `evolution.js` (séquence animée), `overworld.js` (exploration) |
| `js/maps/` | Cartes et scénario, **un fichier par région** | `common.js` (outils : `rle`, `paint`, `forestGen`, `recruitNPC`, soins), `foret.js`, `plage.js`, `village.js` (ville reconstruite selon les recrues : fonction `build()`), `gym.js` (Terrain d'entraînement), `maison.js` (intérieur de la maison de Jijimon), `interieurs.js` (Bazar, Dojo, Restaurant, Serre), `champs.js` (Quartier des Champs), `berceau.js` (Village des Bébés : Elecmon, un DigiŒuf par jour, renaissance, repos), `regions.js` (16 régions × 10 sous-zones générées à la demande par `region()` / `genRows()` ; plan type à 10 cases, gabarits, pièce maîtresse, liaisons `LINKS` dans les deux sens) |
| `js/main.js` | Démarrage | |
| `dev/` | Outils (non chargés par le jeu) | `serve.py`, `tests.js` (tests Node : `node dev/tests.js`), `gallery.html`, `check.html` + `checkmaps.js`, `shots.js` (captures : vue d’ensemble d’une carte, planche d’objets), `captures.js` (galerie complète → `captures/index.html`), `islandmap.js` (carte de l’île assemblée → `captures/carte_ile.png`) |
| `docs/` | Documentation | ce fichier |

## Ordre de chargement
moteur → widgets/dialogues → données → graphismes → logique → écrans → cartes → `main.js`.
Une constante lue **au chargement** (ex. `const { UI } = DW;`) doit venir d'un fichier chargé avant.
Les références **à l'exécution** (dans une fonction) peuvent pointer vers n'importe quel fichier.

## Recettes

**Ajouter un Digimon**
1. `js/data/species.js` : `def('id', {...})` + ajout dans `DW.DEX_ORDER`.
2. `js/gfx/digimon/<stade>.js` : fonction de dessin `id(d, p = {}) { ... }` (repère 64×64, tourné vers la droite).
   `p.pose` vaut `'attack'` ou `'hurt'` pendant les combats (optionnel).
3. Évolutions : `js/data/evolutions.js`.
4. Vérifier le rendu : `dev/gallery.html?sp=id`.

**Ajouter une attaque** : `js/data/moves.js` (+ clé d'animation dans la table `FX`), animation dans `js/game/fx.js`.
Un Digimon connaît **6 techniques** au maximum (`DW.MAX_MOVES`). Les techniques de soin utilisent `heal` (part des PV max).
Chaque Digimon a un **coup spécial** (`DW.SIG` dans `moves.js`) : jauge d'énergie pleine en combat → ATTAQUE puis ENTRÉE
(puissance ×1.5, infaillible). Après une victoire, le Digimon peut **retenir une technique ennemie observée**
(même élément ou neutre ; `BattleScene.observe`).

**Ajouter une zone** : nouveau fichier `js/maps/<region>.js` (ou une entrée dans le fichier de la région),
l'ajouter dans `js/scripts.js`, ajouter un nœud dans `js/ui/worldmap.js`, puis lancer `dev/check.html`.

**Ajouter un objet de décor** : `js/gfx/objects.js` (dessin dans `OBJ` + caractère dans `CH`).

**Ajouter un habitant à la ville** : une entrée dans `RECRUITS` (`js/game/town.js`), un emplacement dans `LOTS`
et un service dans `SERVICES` (`js/maps/village.js`), puis `recruitNPC({...})` dans la zone où on le trouve.

**Ajouter un intérieur** : carte avec `indoor: true` (0 vide, 1 parquet, 2 mur), meubles dans `objects`
(`walk: true` = tapis, `back: true` = accroché au mur), et une porte sur la carte extérieure :
`doors: [{ x, y, w, dir: 'up', to, tx, ty }]` (avancer vers la case bloquante de la porte). Voir `maps/maison.js`.

**Ville en quartiers** : chaque quartier est une carte de la région `village` (centre, Champs...). Un habitant
(`RECRUITS` dans `game/town.js`) peut appartenir à un quartier (`district`). Un niveau de ville par habitant :
Ruines → Campement → Hameau → ... → Grande ville, puis Cité, Métropole, Mégapole avec les futurs quartiers.
`map.populate()` recalcule les habitants à chaque arrivée (visiteurs `DW.Visitors` selon l'heure).

**Identité des zones** : toutes les cartes extérieures ont un thème (`spring`, `misty`, `meadow`, `deep`, `autumn`, `town`,
`farm`, `beach`). Le thème colore aussi le **fond de combat** de la zone (`battleBg('foret@autumn')`).
**Identité des zones** : `map.theme` (voir `gfx/themes.js`) choisit l'herbe, la canopée, les variantes d'arbres,
les herbes hautes, les feuilles mortes et les particules. `forestGen({ landmarks: [[ch, n]], avoid: [[x, y]] })` pose
automatiquement les repères de la zone (monolithes, lanternes, fleurs ou champignons géants, arbres morts) et le **décor numérique** façon Digimon World :
`$` tuyau rouillé qui fume, `!` antenne de données, `?` panneau de circuit.
`dev/check.html` signale aussi un PNJ posé sur un obstacle.

**Objets animés** : `frames` (nombre d'images) et `fps` dans la définition ; `draw(d, v, f)` reçoit l'image `f`.

**Bâtiments** : `lights` (fenêtres éclairées la nuit) et `smoke` (cheminée) dans la définition de l'objet.
Les bâtiments pas encore construits restent **invisibles** (simple terrain vague) : le joueur découvre la surprise
à son retour en ville (`DW.Town.reveal`).

**Objets en réserve** : les décors pastel (berceaux, cubes-jouets, arbres-bonbons…) ne sont plus utilisés
mais restent disponibles pour un futur Village de la Création.

## Conventions
- Textes du jeu en français ; commentaires en français.
- Aucune image externe : tout est dessiné par le code (pas de sprites officiels copiés).
- Sauvegarde : `localStorage` (`DW.save` / `DW.load` dans `monster.js`), options séparées (`options.js`).
  Trois emplacements : la sauvegarde, `_precedente` (copie écrite juste avant chaque sauvegarde) et `_illisible`
  (sauvegarde abîmée mise de côté). Un Digimon d'espèce inconnue va dans `state.orphans` au lieu de faire échouer
  le chargement. Changer le format = augmenter `DW.SAVE_V` et ajouter la migration dans `parseState`.
- Nouveau drapeau d'histoire : le déclarer dans `js/data/flags.js` (les tests refusent un drapeau inconnu).
- Nouveau fichier : l'ajouter dans `js/scripts.js` (les tests vérifient que la liste correspond aux fichiers).
- Toujours vérifier avec `node --check`, `node dev/tests.js`, puis `dev/check.html` après une modification de carte.
- Commits Git réguliers : `git add -A` puis `git commit -m "..."` (revenir en arrière : `git log`, `git restore`).

## Erreurs et robustesse
- La boucle du jeu (`core.js`) protège chaque scène : une erreur dans `tick`, `update` ou `draw` est notée dans la
  console (une fois par message) et affichée quelques secondes en bas de l'écran (`DW.reportError`), mais le jeu continue.
- Un combat qui plante se referme (résultat `'error'`) au lieu de bloquer l'écran. `Overworld.battle` refuse un
  combat si toute l'équipe est K.O. (résultat `'none'`) : les scripts testent `res !== 'win'`.
- Les animations utilisent le temps du jeu (`DW.wait`, `dt` dans `tick`), jamais `setTimeout` ni « +1/60 par image » :
  la vitesse reste la même sur un écran 60, 120 ou 144 Hz, et la pause / `DW.timeScale` sont respectées.

## Piège à éviter (scripts de modification)
`String.replace(a, b)` interprète `$'`, `$&`, `$`` dans `b` : une légende contenant `'$'` a déjà corrompu deux fichiers.
Pour insérer du texte brut, utiliser `s.slice(0, i) + b + s.slice(i + a.length)`.

## Performances (à respecter)
- **Préparation des cartes** (`World.prepare`, `gfx/terrain.js`) : c'est un *générateur* qui rend la main (`yield`)
  régulièrement. `World.prepare(map)` va jusqu'à ce que la carte soit affichable ; `World.prepareSome(map, ms)`
  avance par tranches. L'exploration finit l'eau animée puis prépare les **cartes voisines** (sorties + portes)
  quand le héros est immobile ; les cartes éloignées sont libérées (`World.unprepare`).
  Une carte reconstruite (ex. `build()` de la ville) doit appeler `DW.World.unprepare(m)`.
  Une carte froide se prépare en 0,2 à 0,5 s (mesuré, octobre 2026) : `ow.load(...)` doit toujours être appelé
  **écran noir** (`await DW.fade(1)` avant, `DW.fade(0)` après), comme les passages, portes, voyages rapides et la carte.
- **Boucles par pixel** : pas d'allocation (pas de `[a, b]`, de `for...of` sur des petits tableaux, ni de fonction
  créée dans la boucle), `Math.sqrt` plutôt que `Math.hypot`. Les bruits lents (période > 10 px) passent par
  `half(...)` (un calcul pour 2×2 pixels).
- **Eau** : calque limité à la zone d'eau, au-dessus du sol fixe ; seule la 1re image est calculée au chargement.
- **Rendu des volumes** (`Art.render`) : chaque forme n'est relue que dans sa boîte englobante. Tout changement doit
  donner exactement les mêmes pixels (comparer avec l'ancienne version, objet par objet).
- **Combats** : les sprites sont dessinés pendant les éclairs de rencontre (`encounterFx`).
- Mesure : `map.gfx.prof` (temps par étape) et `map.gfx.ms` ; `dev/check.html` affiche le temps de chaque carte.
