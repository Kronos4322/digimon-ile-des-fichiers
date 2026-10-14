# Architecture du code

Jeu 100 % HTML5 / JavaScript, **sans outil de compilation** : `index.html` charge `js/scripts.js`, qui charge tous les scripts dans l'ordre.
Chaque fichier est une fonction auto-exécutée `(function () { ... })();` qui enregistre ce qu'elle fournit
dans l'objet global **`DW`** (ex. `DW.Sprites`, `DW.MAPS`, `DW.BattleScene`).

## Arborescence

| Dossier | Rôle | Fichiers |
|---|---|---|
| `index.html` | Page : canvas + `js/scripts.js` (aucun code) | |
| `js/scripts.js` | **Liste unique des scripts**, dans l'ordre de chargement (utilisée par le jeu, `dev/check.html`, `dev/gallery.html` et les tests) | |
| `css/` | Mise en page de la page + polices | `style.css` (canvas centré, `@font-face` des polices incluses) |
| `fonts/` | Polices incluses (marchent hors ligne) | DotGothic16 et Press Start 2P (latin, `woff2`), licences `OFL-*.txt` (SIL OFL 1.1) |
| `js/engine/` | Moteur, indépendant du jeu | `core.js` (canvas, utilitaires, timers, fondu, scènes, boucle), `input.js` (clavier, manette ; actions tenues par des « sources » `Input.press` / `Input.release`), `audio.js` (sons, musiques), `art.js` (rendu des volumes), `time.js` (heure, lumière, météo) |
| `js/ui/` | Interface | `widgets.js` (textes, panneaux, barres), `dialog.js` (dialogues, choix), `menus.js` (menu, équipe, sac, DigiDex, boutique, nom, options), `status.js` (fiche Digimon), `evotable.js` (table des Digivolutions), `learn.js` (oublier une technique : comparaison avantages / inconvénients), `hatch.js` (choix d’un œuf + éclosion en frottant), `farm.js` (DigiFerme), `worldmap.js` (carte du monde : un seul grand plan, grands ensembles à ×1, icônes des zones à ×2/×3, brouillard sur le non-découvert), `battleui.js` (affichage du combat au tour par tour, façon Digimon World 2003), `arenaui.js` (affichage de l'arène : carte de combat, roue de commandes, barres de vie), `title.js` (écran titre, confirmation avant d'écraser une partie), `touch.js` (commandes tactiles + saisie du nom sur téléphone), `intro.js` (choix du DigiSélectionné `CharScene`, cinématique camp → Digivice → tunnel numérique → chute vers l’île, réveil `WakeScene`) |
| `js/data/` | Données pures, sans logique | `types.js` (éléments, attributs, statuts), `moves.js` (attaques + animation associée), `species.js` + `species2.js` (Digimon), `lignees.js` (lignée de chaque héros : son bébé de départ), `evolutions.js` (embranchements + conditions), `items.js` (objets, boutiques ; vente selon le % de la ville), `music.js` + `musiques_regions.js` (musiques, une par région), `ecussons.js` (écussons des Ultimes), `techniques_classe.js` (50 techniques apprises en classe), `flags.js` (liste officielle des drapeaux `state.flags`) |
| `js/gfx/` | Graphismes procéduraux | `sprites.js` (cache, respiration, poses), `digimon/*.js` (dessins par stade : `bebes.js`, `entrainement.js`, `disciples.js`, `champions.js`, `ultimes.js`, `ultimes2.js`, `lignees.js`, `ile.js` (habitants de l'île) ; `agumon.js` = lignée complète Botamon → WarGreymon, `bebes.js` = bébés, `ultimes2.js` = WereGarurumon, SkullMeramon, Garudamon, Okuwamon), `hero.js` (7 héros au choix : `DW.HEROES`, `DW.heroLook`, `state.hero`), `icons.js`, `objects.js` (légende des cartes + objets), `town.js` (bâtiments et mobilier de la ville), `district.js` (quartiers, repères de zones), `littoral.js` (bord de mer : radeau, jet d'eau de Whamon, barque, arche de pierre, épave, crabes, étoiles de mer), `themes.js` (identité visuelle de chaque zone), `interior.js` (meubles d’intérieur : cheminée, lits, canapés, télé cathodique, aquarium, piano, cuisine, frigo, armoire, bureau-ordinateur, lampadaire, tapis, affiches...), `city.js` (bâtiments des quartiers : maisons de ville, immeubles, boutiques, tour de l'horloge, tours de données, statues, étals, poteaux à câbles, arches de quartier), `nursery.js` (DigiŒufs `DW.EGGS`, jouets, biberon, mobile, arche arc-en-ciel, piles de cubes ABC, maisonnettes en coquille d'œuf, chevaux à bascule, coussin-nid), `biomes.js` (thèmes des biomes : palettes sol/eau/falaise, canopée « rock », `objMap`, particules ; objets de biome + légende à lettres accentuées), `sites.js` (lieux emblématiques des sous-zones : chalet, phare, manège, Arbre-Monde…), `terrain.js` (sol peint + détails denses façon Digimon World 2003 : touffes, trèfles, fleurettes, cailloux, circuits apparents ; `map.paintGround` pour un sol peint à la main), `ambient.js` (ambiances), `vivant.js` (papillons, lucioles, poissons, ombres de nuages), `regionfx.js` (ambiance propre à chaque région : bulles, braises, feux follets, étincelles, mouettes, brume...), `buildings2.js` / `interior2.js` (bâtiments et meubles supplémentaires), `chapitre1.js` (Grand Arbre de Kuwagamon, racines, nid, vitrine à trophées), `classe.js` (école, tableau, pupitres), `ecussons.js` (glyphes des écussons), `battlebg.js` (fonds de combat) |
| `js/game/` | Logique de jeu | `options.js` (dont « Combats : Arène / Tour par tour »), `monster.js` (Digimon, sauvegarde), `training.js` (potentiel, objectif Digivolution ou Statistique — formule de Digimon World 1, difficultés), `trainfield.js` (séance jouée au poste même, sur la carte du centre sportif), `trainingames.js` (mini-jeux, encore utilisés pour l'Intelligence en classe), `calendrier.js` (Motimon, calendrier, température, intempéries qui fatiguent), `paysage.js` (échanges avec le décor : secouer, fouiller, s'asseoir, boire...), `collab.js` (habitants qui s'associent : améliorations), `sol.js` (trouvailles au sol du jour), `wild.js` (Digimon sauvages visibles), `cuisine.js` (recettes), `requests.js` (demandes des habitants), `chapitre1.js` (cartons de chapitre, visite de Koromon, verrou des zones du chapitre 1), `trophees.js` (trophées de boss, cave de ta maison), `care.js` (faim, toilettes, crottes), `companion.js` (vie du partenaire sur la carte : pas de côté, sauts, bulles d’émotion, sommeil la nuit, objets déterrés 3×/jour, en silence), `life.js` (vie façon DW1 : durée de vie + renaissance, erreurs de soin, corpulence, discipline féliciter/gronder, sommeil/DORMIR, maladie/blessure), `activities.js` (tournois du Colisée, curling, chasse au trésor, pêche, cartes Digimon + album), `town.js` (recrues et niveau de la ville), `services.js` (services des recrues en ville : clinique, boutiques, cadeaux du jour, combats d'entraînement, rumeurs ; quartier d'habitation ; stands à enseigne `placeKiosks`), `story.js` (Engrenages Noirs, boss, Devimon, fin, journal), `guide.js` (arrivée chez Jijimon : monde, mystère, enquête, choix des règles expliqués, questions libres — aussi menu « Questions » de Jijimon), `fx.js` (animations d'attaque), `battle.js` (combat au tour par tour ; calcul des dégâts, statuts, EXP, observation — réutilisés par l'arène), `arena.js` (combat en arène : carte de combat de la région, déplacements en temps réel, quadrillage caché, portées corps à corps / proche / loin / terrain, roue de commandes, objets lancés, coup spécial à charger), `evolution.js` (séquence animée), `overworld.js` (exploration) |
| `js/maps/` | Cartes et scénario, **un fichier par région** | `common.js` (outils : `rle`, `paint`, `forestGen`, `recruitNPC`, soins, `densify` : bouquets de fougères/fleurs praticables), `decor.js` (décors en kits par thème et lieu marquant de chaque sous-zone, posés à la première visite sans jamais boucher un passage), `palais.js` (pièces d'intérieur : `room`, `entrance`...), `rivage.js` (Dunes des Bébés, Bosquet des Pousses ; table `STAGES` : Digimon sauvages par stade et par zone), `kuwagamon.js` (Grand Arbre : 3 énigmes, salle, combat, scène de défaite), `joueur.js` (ta maison, coffre, cave), `classe.js` (salle de classe : techniques), `enigmes.js`, `donjons.js`, `foret.js`, `plage.js` (Plage des Cabines 40×36 : cabines de l'épisode 2 et Shellmon, lagon, promenade, ponton ; Crique du Radeau 40×30 : radeau de l'épisode 14 et Whamon, épave, arche ; eau turquoise du thème `beach` via `waterDepth`), `village.js` (ville reconstruite selon les recrues : fonction `build()`), `gym.js` (centre sportif : piste d'athlétisme, aires de couleur, sol peint par `paintGround`), `maison.js` (intérieur de la maison de Jijimon), `interieurs.js` (Bazar, Dojo, Restaurant, Serre), `champs.js` (Quartier des Champs), `quartiers.js` (quartiers périphériques Résidentiel / Marché / Numérique, ouverts aux paliers 3 / 8 / 14 d'une échelle de 16 (convertie depuis les 11 niveaux de la ville) ; chaque emplacement a son niveau minimal ; maisons et immeubles visitables, intérieurs générés `maison_r*`, `maison_m*`, `maison_n*`), `berceau.js` (Village des Bébés, 44×32, thème `nursery` : place à mosaïque, nurserie, aire de jeux, mare, bac à sable ; Elecmon, un DigiŒuf par jour, renaissance, repos), `regions.js` (16 régions × 10 sous-zones générées à la demande par `region()` / `genRows()` ; plan type à 10 cases, gabarits, pièce maîtresse, **espaces ouverts** `addRooms` (4-5 par sous-zone : étang, prairie, bosquet, reliés au carrefour), liaisons `LINKS` dans les deux sens) |
| `js/main.js` | Démarrage | |
| `dev/` | Outils (non chargés par le jeu) | `serve.py`, `tests.js` (tests Node : `node dev/tests.js` ; `PILE=1` pour le détail d'une erreur), `textfit.js` (textes qui débordent de leur cadre), `plan.js`, `gallery.html`, `check.html` + `checkmaps.js`, `shots.js` (captures : vue d’ensemble d’une carte, planche d’objets), `captures.js` (galerie complète → `captures/index.html`), `islandmap.js` (carte de l’île assemblée → `captures/carte_ile.png`) |
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
Chaque Digimon a un **coup spécial** (`DW.SIG` dans `moves.js`) : jauge d'énergie pleine en combat → ENTRÉE, puis on le
**charge** en martelant ESPACE pendant 2 s (×1,1 à ×2,1). Les techniques coûtent des PM (`DW.mpCost`, `MP_RATIO`). Après une victoire, le Digimon peut **retenir une technique ennemie observée**
(même élément ou neutre ; `BattleScene.observe`).

**Ajouter une zone** : nouveau fichier `js/maps/<region>.js` (ou une entrée dans le fichier de la région),
l'ajouter dans `js/scripts.js`, lui donner une `region` connue de `js/ui/worldmap.js` (elle y apparaît toute seule, en icône
près du lieu de sa région), puis lancer `dev/check.html` (qui pose aussi les décors en kits, comme en jeu).

**Ajouter un objet de décor** : `js/gfx/objects.js` (dessin dans `OBJ` + caractère dans `CH`).

**Ajouter un habitant à la ville** : une entrée dans `RECRUITS` (`js/game/town.js`), un emplacement dans `LOTS`
et un service dans `SERVICES` (`js/maps/village.js`), puis `recruitNPC({...})` dans la zone où on le trouve.

**Ajouter un intérieur** : carte avec `indoor: true` (0 vide, 1 parquet, 2 mur), meubles dans `objects`
(`walk: true` = tapis, `back: true` = accroché au mur), et une porte sur la carte extérieure :
`doors: [{ x, y, w, dir: 'up', to, tx, ty }]` (avancer vers la case bloquante de la porte). Voir `maps/maison.js`.

**Ville en quartiers** : chaque quartier est une carte de la région `village` (centre, Champs...). Un habitant
(`RECRUITS` dans `game/town.js`) peut appartenir à un quartier (`district`). La ville progresse en **pourcentage**
(`DW.Town.progress()` : habitants +7 % chacun, trophées +2 % jusqu'à 20 %, Digimon collectionnés jusqu'à 17 %) et les
niveaux Ruines → ... → Mégapole (0 à 11) arrivent aux paliers `DW.Town.STEPS` (5, 12, 20, 30 %...). `DW.Town.label()` l'affiche.
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

## La ville qui grandit (mégapole)
Le niveau de la ville (`DW.Town.level()`, 0 à 11) vient de son pourcentage de développement. La ville centrale (`village.js`) s'ouvre vers le nord au niveau 3
(route et arche n'existent pas avant). `quartiers.js` décrit chaque quartier par `district(id, def)` : `paint` (rues, parc, décor),
`lots` (emplacements `{ kind, v, x, y, w, h }` avec un niveau minimal croissant : `progressive`), `fixed` (décor toujours présent),
`exits` (sorties vers les quartiers voisins, fermées par des arbres avant leur ouverture), `spots` (promeneurs : plus nombreux avec le niveau).
Maisons et immeubles ont une porte vers un intérieur généré par `makeHome` (salon, cuisine, chambre ou musique ; sol `map.floor`
et papier peint `map.wall` tirés au hasard, mais fixes pour une maison donnée ; un habitant). Certaines recrues de l'histoire
déménagent dans les quartiers quand ils existent (`DISTRICT_HOME` dans `game/story.js`). L'herbe couverte par le haut d'un
bâtiment devient infranchissable (case `ŧ`), pour que personne ne se promène « derrière » un toit.

**Intérieurs stylés** : `map.floor = { type: 'tile' | 'tatami' | 'stone' | 'herring' | 'carpet', cols: [clair, foncé, joint] }`,
`map.wall = { base, alt, pattern: 'stripes' | 'dots' | 'diamond' | 'brick' | 'plain', wood: lambris }`. Sans ces champs, le rendu
reste exactement celui d'origine (parquet et enduit).

## Cartes des régions : de la place pour explorer
Comme dans Digimon World 1 / 2003, une sous-zone n'est pas un simple couloir entre ses sorties : `addRooms` (regions.js)
place 4 ou 5 grands espaces (étang avec berges, prairie d'herbes hautes où se cachent les Digimon sauvages, bosquet calme)
loin du carrefour, des sorties, de la pièce maîtresse et des trajets sortie → carrefour, chacun relié par un chemin.
Cartes de 88-100 × 64-72 cases (facteur K = 1,45), passages de 6 cases, chemins 2 fois plus larges. Mesure (octobre 2026) : 41 % de cases praticables (19 % avant), ~140 cases libres par
Digimon sauvage (~50 avant). `forestGen` calcule une seule fois la distance de chaque case à chaque chemin
(résultat identique, génération 6 fois plus rapide).

## Cartes faites à la main agrandies ×2
Forêt (Clairière, Sentier, Prairie, Bois des Géants, Lisière), Plage, Ville des Fichiers, Champs, Terrain d'entraînement
et Village des Bébés sont **écrits dans leur plan d'origine** puis agrandis ×2 par `MapKit.zoomMap` (common.js ; table
`MapKit.ZOOM` : facteur et dimensions d'origine). Le sol est agrandi en « Scale2x » (`zoomRows` : bords arrondis, pas
d'escaliers), les lisières/haies/rochers (`BLOCKY`) remplissent leur bloc, les autres objets restent seuls ; les objets
de plusieurs cases gardent leur taille et sont recentrés ; un point posé sur un objet (porte, panneau, œuf sur le nid)
suit l'objet. Les forêts sont régénérées directement à la bonne taille (`zoomGen` agrandit les options de `forestGen`).
**Toute coordonnée d'arrivée (tx, ty) vers ces cartes s'écrit dans le plan d'origine** : `zTarget` la convertit
(une seule fois, marque `_zt`). Coordonnée codée en dur dans un script : `MapKit.zpt(id, x, y)`.
Sauvegarde v4 : positions converties à la lecture.

## Statistiques à l'échelle Digimon World (monster.js : DW.SCALE)
Le calcul « brut » des stats reste celui d'origine (niveau, base, données innées, entraînement, puces), puis il est
multiplié : PV et PM ×20 (max 9999), Attaque / Défense / Vitesse / Intelligence ×4 (max 999). Les dégâts sont
multipliés par le même facteur que les PV (combats aussi longs qu'avant), le coût des techniques par celui des PM,
les soins des objets sont écrits directement à la nouvelle échelle (items.js). Sauvegarde v5 : PV/PM restants ×20.
Les PM s'entraînent (poste « Énergie », cristal de données Ψ au Terrain d'entraînement, m.tr.mp) et ont leur puce
(puce_pm, Atelier d'Andromon). Points d'entraînement : 6 stats, 300 au total, plafond par stat 10 + 3 × niveau + 4 × ABI (max 99) ; ABI +1 par Digivolution, +2 par dé-digivolution (Cyber Sleuth).

## Santé du partenaire (life.js)
La maladie n'arrive jamais au hasard : `m.germs` (0-100, « Santé » dans la fiche) accumule les négligences
(`Life.causes` : crottes par terre, faim, envie pressante, épuisement, blessure, veille tardive, corpulence extrême ;
accidents +12, nuit blanche +20, erreur de soin +5) et baisse quand tout va bien (-3/h), en dormant (-35), aux toilettes.
Au-delà de 70 il peut tomber malade, à 100 c'est certain. Le Médicament guérit et sert aussi de prévention (santé ≤ 50).

## Écussons et enfants perdus (quête parallèle)
Au début, aucun Digimon ne dépasse le stade **Champion**. `data/ecussons.js` (`DW.Crests`) rattache chaque Ultime à un
écusson (Courage → MetalGreymon, SkullGreymon, Etemon ; Amitié → WereGarurumon, Megadramon ; Amour → Garudamon,
SkullMeramon ; Savoir → Andromon, Okuwamon ; Pureté → Lillymon, Monzaemon ; Sincérité → Zudomon ; Espoir → Piximon) ;
les sept réunis débloquent la Méga. La condition s'ajoute à `DW.Evo.check` (ligne « Écusson … » de la table).
`maps/donjons.js` : un donjon secret par enfant (portail `crestgate` posé dans une sous-zone par `regions.js` via
`DW.Donjons.pieceFor`) : hall (stèle d'indice + énigme 1) → galerie (énigme 2) → sanctuaire (gardien à Engrenage Noir,
enfant, piédestal). Délivrer l'enfant donne son écusson ; il attend ensuite chez Jijimon. Ton propre écusson est seul
dans ton donjon. Énigmes réutilisables : `maps/enigmes.js` (`DW.Enigmes` : barrière, vasques dans l'ordre, dalles, stèle
à question), état dans `state.enigmes`. Écussons : `state.crests`, enfants : `state.kids`. Journal → page ÉCUSSONS.
Ajouter un donjon = une entrée dans `LIST` de donjons.js. PNJ spéciaux : `hero` (enfant dessiné en héros),
`obj` + `ov` (objet dont l'aspect dépend de l'état), `walk` (se traverse) ; `map.calm` : pas de Digimon sauvage.

## Combat en arène (game/arena.js, ui/arenaui.js)
Par défaut (option « Combats : Arène »), un combat se joue sur une **carte de combat** générée depuis la carte où l'on était
(`fieldMap` : sol et bordure les plus fréquents, clairière irrégulière 36 × 24, caméra qui suit). Les deux Digimon se déplacent
en temps réel ; le terrain est découpé en **dalles invisibles** de 32 px : une technique verrouille la dalle de la cible (et
ses voisines selon la portée) puis part ; si la cible en est sortie, c'est raté. Portées (`shapeOf`) : corps à corps (il faut
rejoindre l'adversaire), proche, loin, tout le terrain (moins fort), sur soi. **Le combat ne s'arrête jamais**, même pendant
la roue de commandes (ESPACE : Attaque ; ↑ Garde ; → Techniques ; ← Objets lancés par le héros ; ↓ Fuite). Les calculs
(dégâts, statuts, EXP, observation) sont ceux de `BattleScene`, dont `ArenaScene` hérite. Tests : section « arène » de `dev/tests.js`.

## Élevage façon Digimon World 1 (life.js, care.js)
Grande bulle des besoins (`Life.needs`), rythme **diurne / nocturne** par espèce (`Life.sched`), et **3 K.O. = mort** :
`Life.knockout` (compteur `m.kos`), puis renaissance en œuf avec une ou deux techniques oubliées (`Life.death`).

## Monde vivant
Calendrier de 12 mois × 10 jours, 4 saisons ; météo par climat et par saison avec orages, tempêtes de neige, tempêtes de vent,
canicules et **sécheresses** (`engine/time.js` : `climateList`, `drought`, `temp`, `weatherMult`). Motimon (ville) devient
plus précis avec le niveau de la ville (Centre de météorologie au niveau 4). Décor : `decor.js` + `regionfx.js` + `paysage.js`.

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
