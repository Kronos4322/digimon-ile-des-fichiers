# Audit des graphismes et des ressources

- **Dépôt** : `C:\Users\CaMiL\Desktop\PROGRAMMES APPLICATIONS CLAUDE\DIGIMON`, branche `main`, commit `f987c32` (22/10/2026).
- **Règles suivies** : lecture et essais seulement. Aucun fichier du dépôt n'a été modifié, créé ou supprimé, et aucun commit n'a été fait.
  Le code de `dev/optimiser_textures.py` a été lu et exécuté **en mémoire** : aucun `.pyc` n'a été écrit dans `dev/`.
  Les originaux (`assets/ASSETS - Digimon`) ont seulement été lus. Le panneau navigateur n'a pas été utilisé.
- **Dossier de l'audit** (tous les chemins ci-dessous en partent) :
  `C:\Users\CaMiL\AppData\Local\Temp\claude\C--Users-CaMiL-Desktop-PROGRAMMES-APPLICATIONS-CLAUDE-DIGIMON\6f82ba0c-eac4-4c5c-b469-a7c3692356c6\scratchpad\audit_integral\graphismes\`
  - `scripts\` : 29 scripts Python / Node, relançables ;
  - `sorties\` : mesures brutes (JSON, CSV, TXT) ;
  - `planches\` : 48 planches d'images.

## Légende

- **Gravité** :
  - **P0** : bloquant ;
  - **P1** : défaut très visible, ou risque important avant une diffusion publique ;
  - **P2** : défaut visible mais localisé, ou coût net ;
  - **P3** : mineur, latent ou d'ordre esthétique.
- **Statut** :
  - **VÉRIFIÉ PAR UN SCRIPT** : mesuré, et regardé en gros plan sur une planche ;
  - **LU** : déduit de la lecture du code ;
  - **PAS VÉRIFIÉ** : hypothèse à confirmer en jeu, car le jeu n'a pas été lancé (navigateur interdit).

## Résumé

On compte **36 anomalies** : **0 P0, 3 P1, 9 P2, 24 P3**. Les 690 images servies ont été examinées : 638 avec transparence, et 116 vues de Digimon.

Les plus graves :

1. **P1 – Le détourage du fond vert efface les verts du dessin.** La règle de `dev/optimiser_textures.py` prend pour du fond tout vert vif. Or le vrai fond des planches vaut environ (2, 250, 4) et ne varie presque pas.
   - 45 objets perdent 5 % ou plus de leur surface, 19 objets 10 % ou plus.
   - Exemples : jardinière verte de la ville (39 %, il ne reste que le squelette du buisson), trèfles, tape-cul, trampoline et buisson fleuri des villages de bébés, portail du vent du Gymnase, herbes du Mont Miharashi, auvent de l'étal de fruits.
2. **P1 – Les yeux d'Agumon et de Palmon sont troués.** Leur iris vert est devenu transparent : on voit le décor du combat à travers l'œil. Cela concerne les vues combat, profil et face. Les griffes de Palmon sont aussi effilochées.
3. **P1 (droits) – L'écran titre peint imite le logo officiel.** Il porte un logo « DIGITAL · DIGIMON · MONSTERS » avec le symbole ™, à remplacer avant toute diffusion publique.

Viennent ensuite (P2) :
- deux vues tournées du mauvais côté (combat de Yuramon, profil de Togemon) ;
- Bukamon plus grand que les Disciples ;
- les arbres flous (copies 1,5 à 1,9 fois trop petites) ;
- 3 Mo de PNG du volcan chargés au démarrage ;
- les parois rayées des souterrains du volcan ;
- les coutures de `grotte/dalles_fissurees` ;
- le nom et les icônes de l'application.

| ID | Grav. | Anomalie | Statut |
|---|---|---|---|
| T1 | P1 | Verts du dessin pris pour le fond (45 objets ≥ 5 %) | VÉRIFIÉ PAR UN SCRIPT |
| T2 | P1 | Yeux d'Agumon et de Palmon troués, griffes de Palmon effilochées | VÉRIFIÉ PAR UN SCRIPT |
| R1 | P1 | Logo officiel imité avec ™ sur l'écran titre | VÉRIFIÉ (à l'œil) |
| D1 | P2 | Yuramon : vue combat tournée vers la gauche | VÉRIFIÉ (à l'œil) |
| D2 | P2 | Togemon : vue profil tournée vers la gauche | VÉRIFIÉ (à l'œil) |
| D4 | P2 | Bukamon plus grand que les Disciples (et que le héros sur la carte) | VÉRIFIÉ PAR UN SCRIPT |
| S1 | P2 | Parois des souterrains du volcan rayées (texture en bande répétée verticalement) | VÉRIFIÉ PAR UN SCRIPT (simulation) + LU, PAS VU EN JEU |
| S2 | P2 | `grotte/dalles_fissurees` : couture horizontale nette | VÉRIFIÉ PAR UN SCRIPT |
| Z1 | P2 | Arbres (23 images) et étals agrandis, donc flous | VÉRIFIÉ PAR UN SCRIPT (simulation) |
| Z2 | P2 | Volcan : 2,96 Mo de PNG 4 fois trop grands, chargés au démarrage | VÉRIFIÉ PAR UN SCRIPT + LU |
| R2 | P2 | Nom de l'application et icônes (Agumon) sous la marque | VÉRIFIÉ (à l'œil) + LU |
| R3 | P2 | Personnages, espèces et univers de la franchise | LU |
| T3 | P3 | La compression WebP verdit le contour des objets découpés sur vert | VÉRIFIÉ PAR UN SCRIPT |
| T4 | P3 | Trous d'épingle et liseré semi-transparent au contour des Digimon | VÉRIFIÉ PAR UN SCRIPT |
| T5 | P3 | Poussière verte quasi invisible dans le kit du personnage | VÉRIFIÉ PAR UN SCRIPT |
| T6 | P3 | Lueurs et effets lumineux peints sur le vert : perdus ou troués | VÉRIFIÉ PAR UN SCRIPT |
| T7 | P3 | `grotte/porte_tombeau` : trait lumineux d'une voisine collé | VÉRIFIÉ (à l'œil) |
| D5 | P3 | Bébés en pixel art nettement plus petits que les autres bébés | VÉRIFIÉ PAR UN SCRIPT |
| D6 | P3 | Poses d'attaque et de recul coupées par le cadre (jusqu'à 2,9 %) | VÉRIFIÉ PAR UN SCRIPT (simulation) |
| D7 | P3 | Birdramon face / dos et Meramon face touchent le bord de leur planche | VÉRIFIÉ PAR UN SCRIPT |
| D8 | P3 | Liseré olive au contour des Digimon orange ou jaunes (Meramon, Birdramon) | VÉRIFIÉ PAR UN SCRIPT |
| S3 | P3 | `desert/dalles_ensablees` et `argile_craquelee` : coutures (jamais employées) | VÉRIFIÉ PAR UN SCRIPT |
| S4 | P3 | Répétition très visible ou fantômes du fondu « raccordable » ; pavés en miroir | VÉRIFIÉ PAR UN SCRIPT |
| S5 | P3 | `grotte/herbe` : petite couture horizontale | VÉRIFIÉ PAR UN SCRIPT |
| S6 | P3 | Herbe ↔ sable et terre ↔ sable : bord net, sans fondu | LU, PAS VÉRIFIÉ |
| S7 | P3 | Fondus entre cartes calculés sur les palettes, pas sur les textures dessinées | LU, PAS VÉRIFIÉ |
| Z3 | P3 | 100 images (1,1 Mo) téléchargées sans être placées nulle part | VÉRIFIÉ PAR UN SCRIPT |
| Z4 | P3 | Petits objets 3 à 7,75 fois plus définis que nécessaire | VÉRIFIÉ PAR UN SCRIPT |
| Z5 | P3 | Images HD 2 posées dans un écran x3 sans lissage : pixels inégaux | LU + simulation |
| O1 | P3 | Fougère (objet non bloquant) dessinée par-dessus le héros posé sur sa case | LU, PAS VÉRIFIÉ |
| O2 | P3 | La base d'un objet recouvre le haut des herbes hautes de la rangée devant | LU |
| O3 | P3 | Silhouette translucide pour le héros seulement | LU |
| O4 | P3 | Objets « walk » triés à −10 : pieds d'un personnage placé derrière dessinés devant | LU |
| O5 | P3 | Grands Digimon de profil : un objet de la même rangée passe devant leurs côtés | LU |
| R4 | P3 | Mentions légales incomplètes ; README inexact sur les images officielles | LU |
| R6 | P3 | Images générées avec ChatGPT : conditions de l'outil, traçabilité | LU |

---

## 1. Fonds verts et transparence

**Comment ça a été mesuré** :
- `scripts\detourage.py` : sur chaque image servie, franges vertes au contour, pixels couleur de la clé, îlots détachés, trous fermés → `sorties\detourage.csv` ;
- `scripts\cle_couleur.py` : couleur réelle du fond des planches ;
- `scripts\pertes.py` : refait le découpage de l'optimiseur sur les **originaux**, objet par objet, et compte ce qui est enlevé alors que ce n'est pas la couleur de la clé → `sorties\pertes.csv`, `sorties\pertes_usage.txt` ;
- `scripts\webp_vs_png.py` et `scripts\webp_vert.py` : comparent les WebP publiés aux PNG de travail (`dev\cache\commun`, lus seulement) ;
- `scripts\gros_trous.py`, `scripts\ilots_visibles.py` ;
- vues d'ensemble : `planches\apercu_*.png` (toutes les images sur magenta).

**Vérifications sans anomalie** :
- **Fond resté opaque** : aucun. Les pixels « couleur de clé » qui restent sont de l'herbe ou des feuilles dessinées (`planches\cle_verte_1.png`, `planches\cle_verte_2.png`).
- **Pixels verts isolés visibles** : aucun, en dehors des bulles de Pabumon, qui sont voulues.
- **Images détourées sur fond noir** (arbres, buissons, fleurs) : pas de liseré noir visible (`planches\fond_noir.png`).
- **Corps de Betamon** : intact grâce à son réglage propre (`CLE_DIGIMON`). Le corps de Palmon est intact aussi, mais pas ses yeux (voir T2) (`planches\detail_franges_vertes.png`).
- **Alpha des 322 WebP du dossier commun** : identique à celui des PNG de travail (alpha sans perte).

### T1 – P1 – Les verts du dessin sont pris pour le fond (règle de détourage trop large)

- **Statut** : VÉRIFIÉ PAR UN SCRIPT, sur les originaux, et regardé en gros plan pour les pires cas.
- **Cause** : `dev/optimiser_textures.py` classe un pixel en fond avec `fond = (g > 150) & (g - max(r, b) > 70)`.
  - Cette règle est dans `planche()` l. 267, `cases()` l. 396 et `grille()` l. 371. `panneau()` l. 342 est encore plus large (`g > 140`, écart > 60).
  - Le fond réel des planches vaut ≈ (2, 250, 4), avec une dispersion de ±4 sur les bords (`scripts\cle_couleur.py`).
  - Un vert d'herbe comme (90, 200, 60) passe donc pour du fond : il devient transparent, et des trous apparaissent dans le sujet.
  - L'ouverture morphologique qui suit (`binary_opening`) efface en plus les traits de moins de 3 px (5 px pour `panneau()`).
- **Images touchées** (pourcentage de la surface du sujet perdue, dans l'original ; liste complète dans `sorties\pertes_usage.txt` et `sorties\pertes.csv`) :

| perte | image | où on la voit en jeu |
|---|---|---|
| 39 % | `commun/jeu/ext_jardiniere_verte.webp` (feuillage presque entièrement effacé) | jardinières de la ville : `ARBRES.planter` variante 0, `maps/quartiers.js` l. 352 et cases « l » |
| 27 % | `bebe/jeu/trefles.webp` | Village des Bébés, Village des Yokomon, `regions.js`, Mont Miharashi |
| 21 % | `bebe/jeu/tape_cul.webp` (herbe du socle) | `yokomon.js`, `miharashi.js` |
| 18,5 % | `commun/jeu/sport_portail_vent.webp` (tourbillon vert du portail) | Gymnase de Leomon, poste « Soufflerie » (`maps/gymnase.js` l. 24) |
| 18 % | `bebe/jeu/trampoline.webp` (anneau d'herbe troué) | Village des Bébés (`maps/berceau.js`) |
| 18 % | `bebe/jeu/buisson_fleurs.webp` | parterres des villages de bébés (`REMPLACE.bebe.flowerbed`) |
| 15,7 % | `bebe/jeu/jeu_ressort.webp` | `REMPLACE.bebe.rockinghorse` |
| 15,3 % | `bebe/jeu/dome_grimpe.webp` (herbe sous l'arche) | `berceau.js` |
| 13–14,5 % | `commun/jeu/mont_arbuste_sec`, `mont_herbes_hautes`, `mont_herbes_seches` | Mont Miharashi (`miharashi.js` l. 311-318) |
| 11,4 % | `commun/jeu/ext_etal_fruits.webp` (bandes vertes de l'auvent) | étals du marché (`marketstall`, `producestand`) |
| 10–11,5 % | `bebe/jeu/moulinets`, `tunnel`, `tourniquet` | villages de bébés |
| 9–10 % | `bebe/jeu/fontaine_bulles`, `balancoire`, `toboggan` | villages de bébés |
| 8–9 % | `commun/jeu/plage_rochers`, `plage_herbe_seche`, `mont_herbe_rousse`, `desert/jeu/herbes_seches` | plage, montagne, désert |
| 5–8 % | `sport_bobine_foudre`, `fanions`, `plage_herbe_dune`, `maison_nid`, `ext_jardiniere_blanche`, `bebe/lampadaire`, `desert/arbre_mort`, `tour_antenne`, `plage_palmier`, `bac_sable`, `jardiniere`, `sport_vit_slalom`, `maison_cubes` | divers |
| jamais placées | `bebe/pas_japonais` (16 %), `haie` (11 %), `barriere_fleurs`, `tapis_patchwork`, `arche_lierre`, `desert/teleporteur`, `cristal`, et `desert/portail` (13,7 %, probablement jamais placé) | bibliothèque de l'atelier seulement |

- **Mesure globale** : 538 objets découpés ont été mesurés. 112 perdent 2 % ou plus, 45 perdent 5 % ou plus, 19 perdent 10 % ou plus. Entre 3 et 9 %, une part de la perte est le contour mêlé de vert : à confirmer à l'œil sur les planches.
- **Comment le voir** :
  - sur les planches `planches\pertes_bebe.png`, `pertes_commun.png`, `pertes_ext.png`, `pertes_desert.png`, `pertes_grotte.png`, à lire de gauche à droite : original, ce qui est gardé (gris = enlevé), pertes en rouge ;
  - sur les images servies, posées sur magenta : `planches\ext_servies.png`, `planches\cle_verte_2.png` (trampoline, dôme) ;
  - dans le jeu : la jardinière verte d'un quartier de la ville, le trampoline du Village des Bébés.
- **Impact** : des objets troués ou décharnés dans les lieux les plus fréquentés (ville, villages de bébés, montagne, gymnase). Sur un sol non vert, le sol se voit à travers.
- **Correction proposée** (dans `dev/optimiser_textures.py`, puis `--tout` sur les dossiers concernés et `python dev/versions.py`) :
  1. Mesurer la clé sur le tour de chaque planche, comme le fait déjà `cle_couleur.py` (médiane ≈ (2, 250, 4)).
  2. Ne prendre pour fond que les pixels proches de cette clé, par exemple `r < 60 & b < 60 & g > 180 & g - max(r, b) > 0,75 g`.
  3. Si des ombres vertes sombres sont peintes, garder le test « ombre » mais exiger une teinte verte pure : `r < 40 & b < 40` et `g > 3 × max(r, b)`.
  4. Détourer par remplissage depuis le bord de la case (comme `grille(..., clair=True)`), plus les zones fermées de clé pure.
  5. Supprimer l'ouverture morphologique, ou la limiter aux îlots de moins de 4 px.
  6. Au contour, « démélanger » la clé : alpha d'après la distance à la clé, puis couleur = (c − (1 − α)·clé) / α, au lieu de tronquer le canal vert.
  7. Revérifier ensuite avec `scripts\pertes.py`.

### T2 – P1 – Yeux d'Agumon et de Palmon troués, griffes de Palmon effilochées

- **Statut** : VÉRIFIÉ PAR UN SCRIPT, et regardé en gros plan sur les images servies.
- **Fichiers** :
  - `assets/commun/jeu/digi_agumon_{combat,profil,face}.webp` (iris vert) ;
  - `digi_palmon_{combat,face,profil}.webp` (iris) ;
  - `digi_palmon_*` (bout des griffes vert et violet, effiloché, avec des points verts).
- **Cause** : `planche_digimon()` l. 547 : `fond = vert > seuil` avec `seuil = 100`. Un iris vert vif dépasse ce seuil. Seul Betamon a un réglage propre (`CLE_DIGIMON`).
- **Comment le voir** :
  - `planches\detail_yeux_agumon_palmon.png` et `planches\detail_yeux_palmon.png` : le magenta passe à travers l'œil ;
  - `planches\simulation_rendu.png` : sur un fond bleu ciel, l'œil d'Agumon devient bleu ciel ;
  - `planches\pertes_digimon.png` : griffes ;
  - en jeu : combat contre Agumon ou Palmon, ou partenaire Agumon (`dev/gallery.html?sp=agumon`).
- **Impact** : le partenaire emblématique a les yeux « vides », qui prennent la couleur du décor (ciel, herbe) en combat et dans les menus.
- **Correction** :
  - immédiate : `CLE_DIGIMON['agumon'] = CLE_DIGIMON['palmon'] = {'seuil': 165, 'ombres': False}`, comme pour Betamon, puis `python dev/optimiser_textures.py digimon --tout` ;
  - durable : la clé stricte et le remplissage depuis le bord proposés en T1, appliqués à `planche_digimon()`.
- **Autres Digimon** : contrôlés à l'œil sans trou notable (Monochromon, Kuwagamon, Elecmon : `planches\detail_yeux_autres.png`). La bouche ouverte de Kuwagamon est transparente parce que le vert se voyait déjà dans l'original : ce n'est pas un défaut (`planches\original_kuwagamon_bouche.png`).

### T3 – P3 – La compression WebP verdit le contour

- **Statut** : VÉRIFIÉ PAR UN SCRIPT (`scripts\webp_vert.py`).
- **Cause** : sous les pixels transparents, les copies gardent la couleur de la clé (vert pur). La compression avec perte (`publier_commun()`, `quality=90` ; `optimiser_planches()`, `quality=85`) en fait déborder un peu sur le contour visible.
- **Mesure** (« vert dominant » moyen au contour, PNG → WebP) :
  - `ext_jardiniere_verte` 8 → 20 ; `ext_jardiniere_blanche` 8 → 19,6 ; `ext_jardiniere_rose` 8 → 18,5 ;
  - `ext_etal_fruits` +6,8 ; `buisson*` +6 à +9 ;
  - `digi_pabumon_face` : 367 nouveaux pixels verts au contour.
- **Impact** : léger liseré verdâtre, surtout sur sol clair. Peu visible à la taille de jeu.
- **Correction** : avant l'encodage WebP, donner aux pixels transparents la couleur du pixel visible le plus proche (« alpha bleeding »), ou au moins une couleur neutre. Le fichier y gagne aussi en poids.

### T4 – P3 – Trous d'épingle et liseré semi-transparent au contour des Digimon

- **Statut** : VÉRIFIÉ PAR UN SCRIPT (`scripts\trous.py`, `sorties\detourage.csv`).
- **Fichiers** : toutes les vues `digi_*`, avec 70 à 1 000 trous fermés de 1 à 4 px chacune, à 1,5–2 px du bord. Par exemple, `digi_angemon_combat` a 879 trous et `digi_agumon_combat` 274, plus environ 1 000 à 3 000 pixels d'alpha inférieur à 32.
- **Cause** : `pose_digimon()` l. 591 calcule l'alpha du bord de 2 px par une formule, qui laisse des pixels à 0 à l'intérieur de la bande de contour.
- **Impact** : invisible à la taille de jeu en temps normal. Un contour légèrement « poreux » sur les agrandissements (éclosion x1,2, `ui/hatch.js`).
- **Correction** : après le calcul de l'alpha, boucher les trous fermés de moins de 5 px (`binary_fill_holes` limité aux petites composantes).

### T5 – P3 – Poussière verte dans le kit du personnage

- **Statut** : VÉRIFIÉ PAR UN SCRIPT (`scripts\ilots.py`, `planches\ilots_kit.png`).
- **Fichiers** : îlots verts détachés dans `assets/commun/kit/ensemble.png` (112), `corps_f.png` (74), `corps_g.png` (65), `tete_f.png` (18). Leur alpha va de 3 à 15 sur 255.
- **Impact** : pratiquement invisible.
- **Correction** : dans `dev/kit_persos.py`, retirer les composantes dont l'alpha maximal est inférieur à 32.

### T6 – P3 – Lueurs et effets lumineux peints sur le vert

- **Statut** : VÉRIFIÉ PAR UN SCRIPT (`planches\pertes_grotte.png`, `pertes_desert.png`, `detail_porte_tombeau.png`).
- **Fichiers** :
  - `grotte/jeu/ankh_lumineux.webp` (halo jaune perdu à 17,7 %, utilisé dans `antre.js`) ;
  - `grotte/sanctuaire_orbe` (rayon vert) ;
  - `desert/balise_cristal`, `tour_antenne`, `teleporteur`, `portail` (champ d'énergie réduit à des carrés épars) ;
  - `commun/sport_bobine_foudre` ;
  - `bebe/dome_bulles` (verre).
- **Cause** : un halo semi-transparent peint sur du vert ne peut pas se découper avec une règle tout ou rien.
- **Impact** : effets troués ou éteints. Le jeu ajoute toutefois ses lumières (`LUMIERES`).
- **Correction** : démélange de la clé (point 6 de T1), ou demander au joueur ces objets sur fond neutre.

### T7 – P3 – Morceau d'une voisine collé

- **Statut** : VÉRIFIÉ à l'œil (`planches\detail_porte_tombeau.png`).
- **Fichier** : `grotte/jeu/porte_tombeau.webp`. Un trait lumineux jaune, qui vient d'une case voisine de la planche, est collé en haut à gauche.
- **Impact** : l'image n'est jamais placée par le code (bibliothèque de l'atelier seulement).
- **Correction** : dans `cases()`, ne garder que les morceaux dont le centre est dans la case et qui ne touchent pas le bord de la case, ou rogner cette entrée.
- **Contrôle global** : `scripts\gros_trous.py` et `sorties\detourage.json` (`gros_morceaux`) n'ont trouvé aucun autre objet fait de plusieurs gros morceaux. Seuls `fontaine_bulles` et `sport_vit_slalom` le sont, et c'est voulu.

---

## 2. Digimon

**Comment ça a été mesuré** :
- `scripts\tables.js` lit les tables du jeu en mémoire → `sorties\tables.json` ;
- `scripts\digimon.py` refait le calcul de `rendreImage` → `sorties\digimon.txt` ;
- planches : `planches\digimon_vues_1.png`, `planches\digimon_vues_2.png` (les 4 vues de chaque espèce, flèche rouge = doit regarder à droite), `planches\digimon_regard_1..3.png` (combat et profil en grand), `planches\digimon_tailles_a.png` et `planches\digimon_tailles_b.png` (tous les Digimon à leur taille de combat et de carte, avec la hauteur du héros) ;
- `scripts\poses_bord.py`, `scripts\poses_combat.py`.

**Vérifications sans anomalie** :
- 29 espèces ont des images, et leurs 4 vues existent (aucune manquante).
- Chaque vue montre bien la même espèce, sans morceau d'un autre personnage.
- Les vues de face et de dos sont correctes.
- Aucune vue n'est limitée par sa largeur : l'élargissement du cadre jusqu'à 1,6 suffit.
- Toutes les vues combat et profil regardent vers la droite, sauf D1 et D2.

### D1 – P2 – Yuramon : la vue combat regarde vers la gauche

- **Statut** : VÉRIFIÉ à l'œil (`planches\digimon_regard_3.png`, `digimon_regard_1.png`).
- **Fichier** : `assets/commun/jeu/digi_yuramon_combat.webp`. Le visage (bandeau violet et yeux) est sur la moitié gauche, la fourrure part vers la droite.
- **Impact** :
  - en combat, le Yuramon du joueur, dessiné à gauche, tourne le dos à l'ennemi ;
  - un Yuramon ennemi, retourné (`flip: side === 'e'`), regarde hors de l'écran ;
  - même chose dans les menus.
- **Correction** : `DIGIMON['yuramon']` : `'combat': (1, 'miroir')`, puis `python dev/optimiser_textures.py digimon --tout`.

### D2 – P2 – Togemon : la vue profil regarde vers la gauche

- **Statut** : VÉRIFIÉ à l'œil (`planches\digimon_regard_3.png`, `digimon_regard_1.png`). Les trous des yeux et de la bouche sont sur le bord gauche du corps.
- **Fichier** : `assets/commun/jeu/digi_togemon_profil.webp`.
- **Impact** : sur la carte (Togemon partenaire ou sauvage), il marche à reculons dans les deux sens. `drawMon` retourne le profil quand il va à gauche.
- **Correction** : `DIGIMON['togemon']` : `'profil': (2, 'miroir')`.

### D4 – P2 – Bukamon plus grand que les Disciples

- **Statut** : VÉRIFIÉ PAR UN SCRIPT (`sorties\digimon.txt`, `planches\digimon_tailles_a.png`).
- **Fichier** : `js/gfx/sprites.js`, `IMAGES.bukamon = { taille: 0.95, echelle: 1.3 }`, avec une pose verticale (63 × 168).
- **Mesures** :
  - en combat, Bukamon fait 82 px, autant qu'Agumon (82) et plus que Betamon (68) et Elecmon (75) ;
  - sur la carte, il fait 44 px, plus que tous les Disciples (34 à 42 px) et que le héros (34,5 px) ;
  - Koromon fait 52 px et Tsunomon 63.
- **Impact** : la hiérarchie des stades est cassée : un Digimon d'entraînement paraît plus grand que sa forme suivante.
- **Correction** : `echelle` à 1,0–1,1, ou `taille` vers 0,8, pour viser entre Tsunomon (63) et Betamon (68). À valider avec le joueur, qui le trouvait « toujours trop petit ».

### D5 – P3 – Bébés en pixel art plus petits que les autres bébés

- **Statut** : VÉRIFIÉ PAR UN SCRIPT.
- **Fichiers** : `IMAGES` de Botamon, Pichimon et YukimiBotamon : `taille: 0.58`.
- **Mesures** : 29 px en combat contre 36 à 46 px pour les autres bébés ; 16 px sur la carte, soit la moitié du héros, contre 20 à 26 px.
- **Correction** : `taille` vers 0,7, si le joueur le souhaite.

### D6 – P3 – Poses d'attaque et de recul coupées par le cadre

- **Statut** : VÉRIFIÉ PAR UN SCRIPT, par simulation exacte du calcul (`scripts\poses_combat.py`, `planches\poses_coupees.png`, partie coupée en rouge).
- **Cause** : `js/gfx/sprites.js`, `rendreImage()`. Le cadre fait `L + 2` de large, mais l'inclinaison (`shear` 0,16 en attaque, −0,12 en recul) déplace le haut de l'image de 0,16 × h.
- **Mesures** (part de l'image hors du cadre) :
  - Garurumon recul 2,9 %, Angemon attaque 2,2 %, Birdramon attaque 2,1 %, Koromon recul 1,4 % ;
  - Kuwagamon, Shellmon, Drimogemon et Togemon environ 1 % ;
  - Agumon attaque 1,1 % : le bout du museau est coupé.
- **Impact** : bref, à chaque attaque ou recul.
- **Correction** : quand `o.shear` est donné, élargir le canvas de `ceil(|shear| × h)` du côté où l'image penche et décaler l'origine d'autant.

### D7 – P3 – Poses qui touchent le bord de leur planche

- **Statut** : VÉRIFIÉ PAR UN SCRIPT (`scripts\poses_bord.py`, `planches\detail_birdramon_bords2.png`).
- **Fichiers** :
  - Birdramon face (pose 0) touche le bord gauche de la planche, et dos (pose 1) le bord droit ;
  - Meramon face (pose 0) touche le bord gauche ;
  - le bout d'une plume est coupé net, sur quelques pixels.
- **Correction** : redemander la planche avec une marge, ou l'accepter.

### D8 – P3 – Liseré olive sur les Digimon orange ou jaunes

- **Statut** : VÉRIFIÉ PAR UN SCRIPT (`scripts\webp_vs_png.py`, `planches\detail_birdramon_bords.png`).
- **Fichiers** : contour de 1 px jaune-vert sombre sur Birdramon et Meramon (mélange JPEG de l'orange et de la clé). L'écart de couleur au contour entre le WebP et le PNG atteint 33 à 35 pour les quatre vues de Meramon.
- **Correction** : démélange de la clé (T1) et alpha bleeding (T3).

### Espèces encore dessinées par le code

52 espèces, d'après `sorties\especes.txt` :
- **Entraînement (6)** : tanemon, yokomon, motimon, tokomon, nyaromon, pyocomon.
- **Disciple (11)** : gomamon, biyomon, kunemon, gotsumon, gabumon, tentomon, patamon, penguinmon, guilmon, candlemon, salamon.
- **Champion (13)** : numemon, sukamon, frigimon, leomon, ogremon, seadramon, gekomon, unimon, centarumon, bakemon, devimon, flarizamon, gatomon.
- **Ultime (17)** : metalgreymon, zudomon, lillymon, weregarurumon, skullmeramon, garudamon, okuwamon, monzaemon, jijimon, andromon, etemon, skullgreymon, megadramon, piximon, angewomon, megakabuterimon, magnaangemon.
- **Méga (5)** : wargreymon, metalgarurumon, ophanimon, magnadramon, omegamon.

Les 29 espèces dessinées par le joueur : 8 Bébés, 3 Entraînement, 5 Disciples, 13 Champions (aucun Ultime, aucun Méga). Aucune espèce n'est sans dessin (sinon, dessin de secours gris).

---

## 3. Textures de sol et transitions

**Comment ça a été mesuré** : `scripts\raccords.py` → `sorties\raccords.txt`. Pour chaque texture, il compare l'écart entre la dernière et la première colonne (ou rangée) avec l'écart moyen entre deux colonnes voisines. Une valeur de 1 signifie un raccord invisible. La mesure est faite sur l'image servie et à la taille où le jeu la répète.

Planches :
- `planches\tuiles_1.png` à `tuiles_4.png` : chaque texture répétée 2 × 2 ;
- `planches\coutures_jeu.png` : 3 × 3 pour les cas douteux.

**Sans anomalie** : les 19 sols du dossier commun (herbes, terres, sables, eaux) se raccordent, avec un rapport au plus de 1,3 à la taille de jeu.

### S1 – P2 – Parois des souterrains du volcan rayées

- **Statut** : VÉRIFIÉ PAR UN SCRIPT (mesure et simulation de la répétition) + LU. PAS VU EN JEU.
- **Fichiers** : `volcan/jeu/paroi_cratere.png` (rapport vertical 9,8) et `falaise_basalte.png` (4,95).
- **Cause** :
  - ce sont des bandes, conçues pour se répéter de gauche à droite seulement (`assets/volcan/LISEZ-MOI.txt`). La falaise les utilise correctement, en « neuf parts » (`terrain.js` l. 456 et 631) ;
  - mais `map.paroi` les emploie comme texture de roche répétée dans les deux sens (`terrain.js` l. 85 et l. 607, `texel(TX_PAROI, px, py)`, modulo en x et en y) ;
  - cartes concernées, dans `maps/sous_volcan.js` : SV(1) et SV(2) avec `paroi: 'falaise_basalte'`, SV(4) et SV(5) avec `paroi: 'paroi_cratere'`.
- **Comment le voir** : `planches\tuiles_4.png` et `planches\coutures_jeu.png` : une bande de lave lumineuse toutes les 64 px. En jeu : les murs (`#`) des souterrains du Mont Miharashi.
- **Impact** : rayures horizontales régulières sur tous les murs de ces 4 cartes. L'ombrage par facettes les brise en partie seulement.
- **Correction** :
  - donner à `paroi` une texture raccordable dans les deux sens (`sol_roche`, `dessus_falaise`, ou un carreau de roche à demander au joueur) ;
  - ou, pour une bande, borner `y` comme pour `TX_FALAISE`.

### S2 – P2 – `grotte/dalles_fissurees` : couture horizontale nette

- **Statut** : VÉRIFIÉ PAR UN SCRIPT. Rapport vertical 4,8 à la taille de jeu 64 × 64 (`planches\coutures_jeu.png`, `tuiles_3.png`).
- **Où** : paroi de la Crypte des Gardiens (`antre.js` l. 338, `paroi: 'dalles_fissurees'`) et de la Nécropole Ensevelie sous le volcan (`sous_volcan.js` l. 337, même paroi), et dalles des cartes de la grotte.
- **Correction** : la refaire avec `miroir()`, comme `ville_paves`, ou avec un fondu qui préserve les joints. Le mieux reste une tuile dessinée raccordable.

### S3 – P3 – Coutures sur des textures jamais employées

- **Statut** : VÉRIFIÉ PAR UN SCRIPT.
- **Fichiers** : `desert/dalles_ensablees` (rapport horizontal 3,3 : dalles tranchées au bord) et `desert/argile_craquelee` (1,9). Aucune des deux n'est employée (voir Z3).
- **Correction** : à refaire avant de s'en servir.

### S4 – P3 – Répétition très visible ou « fantômes » du fondu raccordable

- **Statut** : VÉRIFIÉ PAR UN SCRIPT (`planches\tuiles_1..4.png`).
- **Fichiers** :
  - le fondu en demi-décalage de `raccordable()` crée des doublons estompés et un quadrillage : `grotte/chemin` (bandes claires en croix), `desert/sable_numerique` (blocs bleus dédoublés), `mont_gravier`, `mont_herbe_alpine` (gros motifs répétés toutes les 128 px), `plage_sable` ;
  - `ville_paves` est raccordée en miroir : sa symétrie et ses demi-pavés aux axes se voient.
- **Correction** : partir d'un plus grand carreau source, faire 2 ou 3 variantes tirées au hasard par bloc, ou utiliser un raccord par « coupe minimale » plutôt qu'un fondu.

### S5 – P3 – `grotte/herbe` : petite couture horizontale

- **Statut** : VÉRIFIÉ PAR UN SCRIPT. Rapport vertical 2,6, peu visible (`planches\coutures_jeu.png`).
- **Où** : c'est le sable du sol des cartes de la grotte (rôle `herbe`).
- **Autres textures entre 1,5 et 2** : `sable_terre`, `sol_cendres`, `plage_sable`, `grotte/chemin`. Acceptables.

### S6 – P3 – Transitions entre sols dans une même carte

- **Statut** : LU (`terrain.js` l. 188-199 et 470-485), PAS VÉRIFIÉ à l'écran.
- **Ce qui est déjà fondu** : herbe ↔ chemin, avec un mélange tramé des deux textures sur 2 à 3 px de chaque côté et un assombrissement. Le sable près de l'eau a un bord mouillé.
- **Ce qui ne l'est pas** : avec les sols dessinés, herbe ↔ sable et terre ↔ sable n'ont aucun fondu. Chaque pixel est l'une ou l'autre texture, le long de la frontière ondulée. Le bord est net, ce qui se remarque entre l'herbe et le sable clair (`plage_sable`).
- **Correction** : le même tramage que pour l'herbe et le chemin, quand `en === TER.sand` et `ed <= 3`.

### S7 – P3 – Fondus entre cartes calculés sur les palettes, pas sur les textures

- **Statut** : LU (`terrain.js` l. 810-843), PAS VÉRIFIÉ.
- **Constat** :
  - le fondu entre cartes voisines ajoute l'écart entre les moyennes des **palettes procédurales** des thèmes ;
  - les sols réellement affichés viennent des textures choisies par `CHOIX`. Par exemple, `herbe_dense` (101, 164, 67) et `herbe_seche` (196, 177, 87) diffèrent de 127 en somme R + G + B (`sorties\teintes_sols.txt`) ;
  - selon les thèmes voisins, le fondu manque son but, ou décale à tort deux textures identiques.
- **Impact** : saut de couleur au passage d'une carte à l'autre. On ne voit jamais deux cartes en même temps.
- **Correction** : calculer `mine` et `other` d'après la teinte moyenne des textures du rôle (`T.sol(map, role)`) quand elles existent.

---

## 4. Tailles, images manquantes et orphelines

**Comment ça a été mesuré** :
- `scripts\inventaire.py` → `sorties\inventaire.json` ;
- `scripts\tailles.py` → `sorties\tailles.txt`. Il compare la hauteur utile de chaque image à la taille où le jeu la dessine (`Art.HD = 2` pixels d'image par pixel du jeu) ;
- `scripts\orphelines.py` → `sorties\orphelines.txt` ;
- `scripts\coherence_tables.py`.

**Sans anomalie** :
- aucune image servie sans empreinte (`js/data/versions_images.js`), aucune empreinte sans fichier ;
- aucune image demandée absente, aucune image servie jamais demandée ;
- les tables de `textures.js` (ARBRES, REMPLACE, ROLES, CHOIX, TAILLE, TAILLES_DOSSIER, LUMIERES) sont cohérentes ;
- aucune vue de Digimon n'est agrandie : rapport ≥ 1 pour les Champions (240 px pour 212 px utiles).

### Z1 – P2 – Arbres et étals flous (copies trop petites)

- **Statut** : VÉRIFIÉ PAR UN SCRIPT + simulation (`planches\simulation_rendu.png`, `planches\simulation_rendu_detail.png`).
- **Fichiers** :
  - les 23 `commun/jeu/arbre_*.webp` font 111 à 143 px de haut. Ils sont dessinés à 207 px (3 hauteurs de héros × HD 2), donc agrandis de 1,45 à 1,86 fois. Les pires : `arbre_chene` et `arbre_cerisier` (112 × 111) ;
  - `ext_etal_pain` (74 × 89) et `ext_etal_fruits` (80 × 95), pour 125 px utiles.
- **Cause** : dans `optimiser_commun()` l. 477, `k = min(36*1.55*2/w, 46*1.55*2/h)` date de l'ancienne échelle 1,55 des arbres. Depuis la règle « 3 fois le héros » (`HAUTEUR` = 3 × 34,5 px), il faut au moins 207 px de haut, 310 px pour l'écran x3. L'original fait environ 1 250 px.
- **Impact** : les arbres, le décor le plus fréquent du jeu, sont visiblement plus mous que les Digimon et les objets voisins.
- **Correction** :
  - arbres : `k = 210 / h` (ou 310 / h), puis `python dev/optimiser_textures.py commun --tout`. Coût : environ 15 Ko × 23 en plus ;
  - étals : passer par `GRAND`.

### Z2 – P2 – Volcan : 2,96 Mo de PNG 4 fois trop grands, chargés au démarrage

- **Statut** : VÉRIFIÉ PAR UN SCRIPT (inventaire) + LU (`textures.js` l. 58 et 236 ; `main.js` l. 23-30).
- **Fichiers** : `assets/volcan/jeu/` :
  - `dessus_falaise.png` 704 × 704, 1 156 Ko ;
  - `sol_cendres.png` 512 × 512, 666 Ko ;
  - `lave.png` 512 × 512, 573 Ko ;
  - `paroi_cratere.png` 204 Ko, `falaise_basalte.png` 191 Ko ;
  - toutes en RGBA alors qu'elles sont opaques.
  Le jeu réduit ces sols à 128 × 128 (ou 176) pixels du jeu, peints à 1 px par pixel (`T.pixels`) : 4 fois trop de pixels dans chaque sens.
- **Cause** : le dossier `volcan` n'a pas suivi le passage au WebP (`optimiser()`, `K = 4`, PNG). Il est dans `LISTE`, donc chargé au démarrage : l'écran « Chargement des décors » l'attend. Pourtant, il ne sert qu'au chapitre 3.
- **Impact** : 40 % des 7,4 Mo d'images du démarrage, au premier lancement et à chaque mise à jour de ces fichiers, sur le PC lent du joueur et sur téléphone.
- **Correction** :
  - WebP q 85–90 à 2 fois la taille de jeu (256 et 352 px), soit environ 30 à 60 Ko chacune ;
  - et passer `volcan` dans `TARDIFS` (`T.dossier`, déjà attendu par `Overworld.charger`).

### Z3 – P3 – 100 images téléchargées sans être placées nulle part

- **Statut** : VÉRIFIÉ PAR UN SCRIPT (`sorties\orphelines.txt`).
- **Méthode** : recherche du nom dans tout le code (`tex_<dossier>_<nom>`, noms cités, tables, `retouches_donnees.js`). Aucun nom n'est fabriqué dynamiquement, motifs `'mur_' +` vérifiés.
- **Volume** : 1,1 Mo au total :
  - `desert` 33 images, 436 Ko (`arche`, `cristal`, `teleporteur`, `dalles_ensablees`, `sable_numerique`...) ;
  - `grotte` 33 images, 312 Ko (les 8 `mur_*` de la planche 17, les portes `porte_anubis`, `porte_tombeau`...) ;
  - `bebe` 26 images, 309 Ko (`haie`, `pas_japonais`, `fontaine_oeuf`...) ;
  - `commun` 8 images, 53 Ko (bancs et tables de « Mobilier de village » sauf `banc_dossier` et `banc_rondin`).
- **Impact** : `T.dossier` télécharge le dossier entier en arrière-plan pour tout joueur. Ces images servent seulement de bibliothèque à l'atelier, qui peut les placer.
- **Correction** : au choix du joueur, garder (bibliothèque) ou ne charger, par carte, que les images qu'elle emploie.

### Z4 – P3 – Petits objets bien plus définis que nécessaire

- **Statut** : VÉRIFIÉ PAR UN SCRIPT (`sorties\tailles.txt`).
- **Fichiers** : rapport de 3 à 7,75 :
  - fleurs `fleur_*` (128 px pour 20 px utiles), `amanites` ;
  - coquillages `plage_*` ;
  - jouets du Village des Bébés (180 px pour 32 à 40 px) ;
  - `grotte/dalle_soleil`, `ossements`...
- **Impact** : faible (7 à 19 Ko chacun).
- **Correction** : plafonner la copie à environ 3 fois la taille de jeu (`TAILLE` × 3).

### Z5 – P3 – Images HD 2 posées dans un écran x3 sans lissage

- **Statut** : LU + simulation (`planches\simulation_rendu_detail.png`, en bas).
- **Cause** : `engine/art.js` l. 322 fixe `Art.HD = 2`, et `engine/core.js` l. 137-138 fait `setTransform(3)` avec `imageSmoothingEnabled = false`. Les sprites et décors HD sont donc agrandis 1,5 fois au plus proche voisin : leurs pixels font alternativement 1 et 2 px d'écran (contours en escalier irrégulier).
- **Correction**, à peser contre les performances :
  - `Art.HD = 3`, mémoire × 2,25 ;
  - ou lissage activé seulement pour les images `_k` (surcharge de `drawImage` dans `art.js`).

---

## 5. Ordre d'affichage

**Statut** : LU (`js/game/overworld.js` l. 589-705, `js/gfx/terrain.js` l. 958-1010, `js/ui/battleui.js` l. 190-200, `js/game/wild.js` l. 205).

**Ordre sur la carte** :
1. sol pré-rendu, eau, ponts, flaques ;
2. couche arrière des herbes hautes ;
3. ombres portées ;
4. une liste triée par clé `s`, en rangées :
   - objets de la grille : `ty + 0,5` (bloquants) ou `ty + 0,6` (non bloquants) ;
   - objets « sous » (`under`), « à plat » (`walk`, `back`) et fleurs posées : −10 ;
   - objets posés : `y + h − 0,5` ;
   - objets « dessus » (`top`) : 1000 ;
   - personnages : leur rangée ; partenaire : rangée − 0,01 ; PNJ « dalle » : rangée − 0,6 ;
5. après chaque personnage, l'avant des herbes hautes sur sa case ;
6. silhouette translucide du héros s'il est caché ;
7. effets d'ambiance, météo, lumières, interface.

**Sans anomalie** :
- unités cohérentes : tout est en rangées ;
- en combat : fond → ennemi → allié (en retrait, avant le partenaire) → partenaire → particules ;
- objets muraux dessinés sous tout, objets « dessus » au-dessus de tout.

### O1 – P3 – Fougère dessinée par-dessus le héros posé sur sa case

- **Statut** : LU, PAS VÉRIFIÉ.
- **Cause** : un objet non bloquant de la grille (fougère « n ») est trié à `ty + 0,6`. Il passe donc devant le héros quand celui-ci est **sur** sa case. La fougère (`HAUTEUR` 0,75, soit 26 px) cache alors environ les trois quarts du héros (34,5 px), sans silhouette.
- **Correction** : trier les objets non bloquants à `ty + 0,4`, ou les dessiner à moitié transparents quand le héros les traverse.

### O2 – P3 – La base d'un objet recouvre le haut des herbes hautes de devant

- **Statut** : LU.
- **Cause** : toute la couche arrière des herbes hautes est dessinée avant tous les objets. Une touffe dépasse de 8 px au-dessus de sa case (`Y - 8`). La base d'un arbre ou d'un objet de la rangée du dessus recouvre donc le haut des touffes qui devraient être devant lui.
- **Correction** : dessiner les herbes hautes dans la liste triée (clé `ty + 0,55`), ou redessiner leur avant pour les cases sous un objet.

### O3 – P3 – Silhouette translucide pour le héros seulement

- **Statut** : LU (l. 697-701).
- **Constat** : le partenaire, les Digimon sauvages et les PNJ cachés par un arbre (3 fois le héros, environ 5 rangées) disparaissent sans repère. C'est déjà noté dans la mémoire (« placer hors de la canopée »).
- **Correction** : appliquer la même silhouette au partenaire, et aux personnages qui ont un dialogue.

### O4 – P3 – Objets « walk » triés à −10

- **Statut** : LU.
- **Constat** : les objets « walk » (plantes de feu de `sous_volcan.js` l. 251 et 387, petits décors doux de `decor.js` l. 180) sont triés à −10. Un personnage sur la rangée du dessus a donc ses pieds dessinés par-dessus le haut de la plante, alors qu'il est derrière. Cela ne fait que 1 à 2 px.

### O5 – P3 – Grands Digimon de profil

- **Statut** : LU.
- **Constat** : les profils de Champions font jusqu'à 86 px de large sur la carte (Drimogemon), soit plus de 5 cases. Ils sont triés par leur seule rangée : un rocher ou un objet de la même rangée, trié à `+0,5`, passe devant leurs côtés.

---

## 6. Provenance et droits (phase 19)

Constat technique seulement : les points ci-dessous sont à soumettre à un juriste, sans conclusion à sa place.

**Provenance des images** :
- **Créations du joueur, générées avec ChatGPT** :
  - `assets/commun/jeu/*` (décors, mobilier, sols) ;
  - les 29 Digimon `digi_*` (planches `assets/ASSETS - Digimon/Digimon`) ;
  - `assets/bebe|desert|grotte/jeu/*` (planches) ;
  - `assets/volcan/jeu/*` (`LISEZ-MOI.txt`, noms « Image ChatGPT ») ;
  - `assets/intro/jeu/*` (maquettes « Générique, introduction ») ;
  - `assets/commun/kit/*` (planches « PErsonnages », `dev/kit_persos.py`).
- **Dessins par le code** : 52 Digimon (`js/gfx/digimon/*.js`), héros et enfants (`js/gfx/hero.js`), décors restants et dessins de secours (`js/gfx/*.js`), effets.
- **Icônes de l'application** (`assets/icons/*.png`) : Agumon en pixel art, ajoutées au commit `8eb7d95` (12/10). Leur fabrication n'est pas tracée dans `dev/`.
- **Polices** : sans anomalie, voir plus bas.

### R1 – P1 (droits) – Imitation du logo officiel sur l'écran titre

- **Statut** : VÉRIFIÉ à l'œil (`planches\titre_icones.png`).
- **Fichier** : `assets/intro/jeu/titre.webp`, affiché par `js/ui/title.js` l. 19 et 525. Le jeu y ajoute même un éclat sur le logo.
- **Constat** : un écusson bleu et jaune « DIGITAL · DIGIMON · MONSTERS », avec le symbole **™**, reprend la composition du logo de la série « Digimon: Digital Monsters ».
- **Impact** : c'est l'élément le plus exposé, la première image du jeu. L'imitation d'un logo de marque, avec ™, peut laisser croire à un produit officiel, malgré la mention en bas de l'écran.
- **Correction proposée** : avant une diffusion publique, remplacer le logo par un titre propre au jeu, sans le logo officiel ni ™. On peut repeindre la zone, comme le fait déjà `optimiser_intro()` pour le texte « APPUIS SUR ESPACE », ou demander l'image sans logo. Autre voie : une autorisation des ayants droit.

### R2 – P2 (droits) – Nom de l'application et icônes sous la marque

- **Statut** : VÉRIFIÉ (à l'œil) + LU.
- **Fichiers** : `manifest.webmanifest` (`"name": "Digimon — L'Aventure de l'Île des Fichiers"`, `"short_name": "Digimon Île"`), `index.html` (`<title>`), `assets/icons/*.png` (Agumon).
- **Constat** : le jeu installable se présente sur l'écran d'accueil du téléphone sous le nom et avec un personnage de la franchise.
- **Correction** : un nom propre (par exemple « L'Île des Fichiers — jeu de fan »), une icône sans personnage officiel, et la mention de non-affiliation dans la `description` du manifeste.

### R3 – P2 (droits) – Personnages, espèces et univers de la franchise

- **Statut** : LU.
- **Éléments repris** :
  - **espèces** : les 81 espèces (noms et designs), dont 29 redessinées par le joueur d'après les designs officiels et 52 dessinées par le code ;
  - **personnages** : les 8 enfants « inspirés de » Tai, Matt, Sora, Izzy, Mimi, Joe, T.K. et Kari (noms du doublage, `js/gfx/hero.js`, `js/gfx/persos.js` l. 402-415) ;
  - **univers** : lieux (Île des Fichiers, Mont Miharashi, Village des Yokomon...), Digivice, DigiDex, écussons de la saison 1 (`js/gfx/ecussons.js`), Engrenages Noirs, objets du « catalogue de Digimon World 1 » (`js/data/items.js`).
- **Constat** : ces œuvres et marques appartiennent à Bandai / Toei Animation et à leurs auteurs. Il faut faire vérifier la politique des ayants droit envers les jeux de fan (non commerciaux) avant une diffusion publique, et en particulier la présence de designs officiels redessinés.

### R4 – P3 – Mentions incomplètes ou inexactes

- **Statut** : LU.
- **Déjà présent** : la mention « Jeu de fan non officiel — Digimon © Bandai / Toei Animation » figure à l'écran titre (`js/ui/title.js` l. 551).
- **Manques** :
  - pas de mention © dans le README ni dans le manifeste ;
  - pas d'écran de crédits (polices, outil de génération).
- **Inexactitudes du README** (l. 5-7) :
  - « Aucune image officielle n'est utilisée » est vrai pour les fichiers, mais les designs repris sont ceux de la franchise. À reformuler en « aucune image officielle copiée ; personnages et designs © Bandai / Toei » ;
  - « une partie des Digimon (bébés et entraînement) » est dépassé : Disciples et Champions aussi ;
  - « 70 espèces » : 81 espèces sont définies.

### R6 – P3 – Images générées par une IA

- **Statut** : LU.
- **Constat** : les conditions d'utilisation de l'outil s'appliquent. Les sorties qui représentent des personnages protégés ne deviennent pas libres de droits pour autant.
- **Correction** : garder une trace (dates, consignes) des images générées pour le jeu.

**Polices, sans anomalie** :
- **DotGothic16** : © 2020 The DotGothic16 Project Authors (Fontworks).
- **Press Start 2P** : © 2012 The Press Start 2P Project Authors (CodeMan38), avec le nom réservé « Press Start 2P ».
- Les deux sont sous **SIL OFL 1.1**. Les textes de licence complets (93 lignes) sont dans `assets/fonts/OFL-*.txt`.
- Les fichiers woff2 viennent de Google Fonts (commit `671d110`). La redistribution est permise avec la licence. Si ces fichiers sont un jour modifiés (sous-ensemble refait), ne pas garder le nom réservé « Press Start 2P ».

**Musique** : `js/data/music.js` la déclare « compositions originales ». PAS VÉRIFIÉ : hors du périmètre graphique, aucune comparaison avec des thèmes officiels.

---

## Méthode et limites

- **Rendu en jeu non observé** : le jeu n'a pas été lancé, car le panneau navigateur était interdit. Les effets de rendu viennent du code, reproduit dans des simulations (S1, D6, Z1, Z5) ; ils sont marqués comme tels.
- **Mesure des pertes au détourage (T1)** :
  - elle compte les morceaux épais de « non-clé » enlevés au contact du sujet ;
  - pour les objets fins, lumineux ou à contour sableux, elle inclut une part du contour mêlé de vert, qui est normal à enlever. Les pires cas ont été confirmés à l'œil ; entre 3 et 9 %, regarder les planches ;
  - ce sont des pixels de l'original : la proportion reste la même dans la copie réduite.
- **Images « jamais placées » (Z3)** : recherche des noms dans le code. Une image placée seulement par une retouche future de l'atelier ne peut pas être détectée.
- **Relancer l'audit** : `python scripts\<nom>.py`, depuis le dossier de l'audit. Exécuter d'abord `node scripts\tables.js` : les autres scripts lisent `sorties\tables.json`. Tous ne font que lire le dépôt.
