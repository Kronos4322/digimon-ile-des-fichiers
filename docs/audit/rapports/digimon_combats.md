# Audit des Digimon, des Digivolutions et des combats

Audit fait en lecture et en essais seulement, le 22/10/2026, sur `main` au commit `f987c32`. Aucun fichier du dépôt n'a été modifié : `git status` montre toujours seulement `.claude/launch.json`, comme avant l'audit.
Tout ce qui a servi est dans ce dossier : scripts `a1` à `a10` et `t_*.js`, sorties `sortie_*.md` et `log_*.txt`.

## Méthode et légende

- **Chargement** : `charger.js` reprend le faux navigateur de `dev/tests.js` (lignes 12 à 51) et charge les vrais scripts de `js/scripts.js` dans Node (~7 s). Toutes les données et fonctions interrogées sont donc celles du jeu.
- **Combats** : `sim.js` fait passer chaque combat par la vraie `BattleScene` et le vrai `DW.Game.push` (`run`, `doTurn`, `calc`, `useMove`, `endOfTurn`, `allyTurn`, `checkFaints`, `giveXp`). Seules les animations et l'interface sont neutralisées (`msg`, `tween`, `wait`, `fade`, `playFX`), et une « politique » joue à la place du joueur : la meilleure attaque payable, puis le coup spécial dès que la jauge est pleine.
- **Scripts de boss** : ils sont joués de bout en bout, avec le vrai `Overworld.prototype.battle` et les vrais scripts d'histoire (`DW.Kuwa.fight`, PNJ de l'antre, radeau de Whamon, `DW.Chapter.monoFight`, `mattScene`, `meramonFight`). Seule la carte est simulée (`charger`).
- **Tests existants** : les 18 tests de `dev/tests.js` sur les Digimon et les combats réussissent tous. Ils ont été relancés avec `SEUL=`, en lecture seule.
- **Statut de chaque constat** : **[SCRIPT]** = vérifié par un script (le nom du script est donné), **[LU]** = lu dans le code seulement, **[NON VÉRIFIÉ]** = pas vérifié.
- **Gravité** : **P0** bloquant critique, **P1** majeur, **P2** intermédiaire, **P3** mineur. Les **bugs** (le code ne fait pas ce que disent son commentaire, sa règle ou son texte) sont séparés des **choix d'équilibrage** (le code fait ce qui est écrit, mais le résultat pose problème).

## 0. En bref

**Aucun blocage (P0) trouvé.** Je n'ai trouvé aucun combat qui plante ni qui ne peut pas finir. Les récompenses ne sont données qu'une fois, toutes les défaites ramènent à l'exploration, et les 8 lignées de la série sont correctes. Il n'y a ni NaN, ni valeur négative, ni dépassement de plafond dans 32 400 Digimon générés (sauf au Gymnase, fermé aux chapitres 1 à 3).

| Gravité | Bugs | Équilibrage | Total |
|---|---|---|---|
| P0 | 0 | 0 | **0** |
| P1 | 1 | 0 | **1** |
| P2 | 5 | 5 | **10** |
| P3 | 19 | 2 | **21** |

Les plus graves :
1. **[P1] ABI sans coût ni limite.** Digivoluer puis dé-digivoluer en boucle ne coûte rien et rapporte +3 ABI à chaque aller-retour. Dix allers-retours au N.7 donnent un plafond d'entraînement de 99 par stat (31 normalement) et 600 au total.
2. **[P2] Mode « Statistique ».** La difficulté reste figée et les gains sont 5 à 6 fois plus forts : Attaque 72 → 456 en 6 séances au N.10. Avec le point 1, un Agumon N.10 atteint Att 999, Déf 999 et PV 5 438 (un Greymon N.30 non entraîné : Att 384).
3. **[P2] Bandage X dans un coffre du chapitre 3.** Il fait passer n'importe quel Champion en Monzaemon (Ultime), sans écusson ni aucune condition.
4. **[P2] Trois Ultimes sans écusson** : MegaKabuterimon, MagnaAngemon et Angewomon. Ils restent accessibles alors que « chaque Ultime demande l'écusson de sa famille ».
5. **[P2] Les objets de Digivolution cassent la lignée.** Le Gabumon de Matt devenu Birdramon dé-digivolue en Biyomon et renaîtrait en Nyokimon.
6. **[P2] Deux branches impossibles** : Ogremon → Etemon et Devimon → Megadramon. Il faut au moins 3 erreurs de soin pour la forme, puis au plus 2 pour l'Ultime, et les erreurs ne s'effacent jamais.
7. **[P2, équilibrage] Koromon**, la première forme de la lignée de Tai, n'a aucune technique de Feu. Tous les Entraînement ont Bulles (Eau), qui lui est super efficace : il ne gagne que 21 % de ses combats à niveau égal.

---

## 1. Registre des espèces

**Ce qui est en ordre [SCRIPT `a1_registre.js`, `t_refs.js`]**
- **Espèces** : 81 espèces dans `DW.SPECIES` (79 au DigiDex `DW.DEX_ORDER` + Jijimon et Whamon, PNJ). `DW.DEX` n'existe pas : le DigiDex est `DW.DEX_ORDER`.
- **Définitions** : aucun doublon de définition (`def`, `baby`, `champ`, `ult`) dans les 4 fichiers, aucune clé différente de son `id`, aucun doublon ni espèce inconnue dans le Dex.
- **Types et statistiques** : tous les types (y compris Poison, ajouté par `techniques_elements.js`) et tous les attributs sont connus. Les 5 statistiques de base sont positives, et toutes les espèces ont un poids, un nom et une description.
- **Techniques** : toutes celles des listes `learn` existent. Les 80 coups spéciaux (`DW.SIG`) existent et figurent dans la liste de leur espèce ; seul Jijimon (PNJ) n'en a pas.
- **Évolutions** : aucune espèce n'évolue vers une espèce inexistante, et aucune table (`DRAW`, `IMAGES`, `EGGS`, `Wild.TABLES`, `Town.RECRUITS`, rencontres, PNJ) ne cite une espèce inexistante.
- **Dessins** : 52 espèces sont dessinées par le code et 29 ont les images du joueur (4 vues chacune : `assets/commun/jeu/digi_<espèce>_<vue>.webp`, toutes présentes, toutes avec une empreinte, toutes de plus de 2 Ko). Aucune espèce n'est condamnée à la tache de secours.
- **Attributs** : ils sont conformes au canon pour toutes les espèces vérifiées (Vaccin, Données, Virus).

**Adaptations volontaires (pas des erreurs)**
- Mochimon et Lilimon (ids `motimon` et `lillymon`) : « les noms de la série, comme le joueur les écrit », `data/lignees.js:67`.
- Gabumon de type Glace : tranché par le joueur.
- Monochromon Terre et Feu, Guilmon → Flarizamon → SkullMeramon, Nyokimon → Pyocomon → Biyomon (lignée de Sora donnée par le joueur), Mimi et T.K. qui partagent Poyomon.
- Poison ajouté comme élément (`techniques_elements.js:11-43`). Sukamon et Numemon passent Poison, Mushroomon devient Plante et Poison (et non plus Plante et Ténèbres, comme le dit `species.js:60`).
- Whamon (Champion, PNJ, ne peut pas être élevé) et Jijimon : jamais obtenables, c'est voulu.

**Anomalies du registre** (détail au § 5) : D13 (références mortes), D21 (29 espèces sans dessin de secours), D23 (chiffres du README), Poison sans technique de classe (D25), Koromon, Motimon et Tokomon sans technique de leur élément (E1).

Le registre complet est en **annexe A** : id, nom, stade, types, attribut, base, poids, EXP, techniques avec leur niveau, coup spécial, dessin, formes d'avant et d'après.

## 2. Arbres de Digivolution [SCRIPT `a2_evolutions.js`, `t_erreurs.js`, `t_xband.js`, `t_objevo.js`, `a6_cas_limites.js` § 10]

- **Arêtes** : 132 Digivolutions. Toutes mènent à une espèce existante, sans doublon, et aucune ne saute un stade. Les deux seules arêtes « latérales » sont WarGreymon et MetalGarurumon → Omegamon (fusion).
- **Départs** : les 7 œufs de Penguinmon et YukimiBotamon (lignée de Kari, choisie à la création ou par renaissance).
- **Accessibilité** : en ignorant les conditions, 79 espèces sur 81 sont obtenables. Les 2 autres sont les PNJ Jijimon et Whamon.
- **Branches sans suite** : 13 Ultimes n'ont pas de Méga (Zudomon, Lilimon, SkullMeramon, Garudamon, Okuwamon, Monzaemon, Andromon, Etemon, SkullGreymon, Megadramon, Piximon, MegaKabuterimon, MagnaAngemon). C'est un choix de conception : seules les lignées de Tai, Matt et Kari ont une Méga.
- **Plafonds d'entraînement** : chaque condition reste sous le plafond `10 + 3 × niveau + 4 × ABI` (avec l'ABI minimal du chemin), et sous le plafond total `300 + 30 × ABI`, au niveau minimal demandé. Aucune contradiction sur une même arête (corpulence mini/maxi, erreurs, bonheur ou discipline au-dessus de 100). Le tableau complet des conditions est en **annexe B**.
- **Lignées des héros** : les 8 lignées de `DW.HERO_LINE` sont correctes (aussi couvert par le test « lignées de la série »).
- **Fusion Omegamon** : il faut un MetalGarurumon debout dans l'équipe (un MetalGarurumon K.O. ou un deuxième WarGreymon ne suffisent pas) et les 7 écussons. Les conditions du partenaire ne comptent pas : un MetalGarurumon N.1, au bonheur 0, convient. À la dé-digivolution, Omegamon redevient WarGreymon et le MetalGarurumon n'est jamais rendu (D15).
- **Écussons aux chapitres 1 à 3** : les 7 donjons sont dans des régions fermées. Même l'écusson de Sora (Nid de Braises, région `volcan`, que `OPENS` ouvre au chapitre 3) est hors de portée, car on n'entre dans la région `volcan` que depuis `montagne8`, elle-même fermée [SCRIPT `t_volcan.js`]. Les Ultimes à écusson et les Méga sont donc impossibles dans la version GAMMA, comme voulu, **sauf** MegaKabuterimon, MagnaAngemon et Angewomon (D4) et le Bandage X (D3).
- **Conditions impossibles** : Ogremon → Etemon et Devimon → Megadramon (D6). Les plafonds de niveau ne bloquent rien (N.100 maximum ; Omegamon demande N.55).
- **Corpulence** : les formes « agiles » des lignées principales (Birdramon, Garurumon) sont difficiles à tenir (E2).
- **Accessibles trop tôt** : le Bandage X (D3), l'Aile de flammes (un coffre du chapitre 3 : n'importe quel Disciple → Birdramon), les 3 Ultimes sans écusson (D4).
- **Dé-digivolution** : toujours possible et sans condition (D1). Pour une espèce qui n'a pas de parcours, `prev1` donne bien une forme de stade inférieur, sauf Omegamon (D15). `bebe()` donne un bébé proposé en œuf pour les 79 espèces obtenables.
- **Renaissance** (`Life.reborn`) : elle donne le bébé du parcours, avec IV + 2 (au plus 15), la moitié de l'entraînement, les techniques, les victoires et l'équipement. L'ABI, les K.O. et les erreurs repartent à 0 (D24). Statistiques sans anomalie pour toutes les espèces.

## 3. Progression [SCRIPT `a3_progression.js`, `t_stat.js`, `t_misc.js`, `t_poids.js`]

- **Formules** (`game/monster.js:56-64`) :
  - PV = ⌊(⌊(2·base + IV)·N/100⌋ + N + 10 + bonus) × 20 × stade⌋, plafonnés à 9 999.
  - Att, Déf, Vit et Int = ⌊(⌊(2·base + IV)·N/100⌋ + 5 + bonus) × 4 × stade⌋, plafonnées à 999.
  - PM : même formule que les PV sur la base d'Intelligence, **sans** le multiplicateur de stade.
  - bonus = tr·N/100 + tr/3 + raw·0,8 + puces + équipement.
  - Multiplicateur de stade : Bébé 0,85, Entraînement 0,92, Disciple 1, Champion 1,55, Ultime 2, Méga 2,5.
  - EXP cumulée pour atteindre le niveau N = ⌊N³·0,8⌋.
- **Valeurs** : 81 espèces × 100 niveaux × IV 0 et 15 × entraînement 0 et 99, soit 32 400 Digimon. Aucune stat NaN, aucune négative, aucune au-dessus de 9 999 / 999, et aucune stat ne baisse en montant de niveau.
- **Valeurs de départ et des boss** (IV 7) :

| Digimon | PV | PM | Att |
|---|---|---|---|
| Botamon N.4 | 289 | 340 | 27 |
| Agumon N.10 | 620 | 620 | 72 |
| Greymon N.15 | 1 550 | 940 | 204 |
| Kuwagamon N.11 | 1 209 | — | 155 |
| Shellmon N.17 | 1 798 | — | 198 |
| Meramon N.30 | 2 728 | — | 378 |
| WarGreymon N.45 (sans entraînement) | 8 050 | — | **999** (999 aussi en Déf, Vit et Int) |

- **Montée de niveau** : les PV et les PM suivent l'écart. Un K.O. reste à 0 même s'il gagne des niveaux par l'EXP partagée. Le niveau s'arrête à 100.
- **Digivolution et dé-digivolution** : sur les 132 arêtes, les PV et les PM restent dans leurs bornes. **Exception** : un Digimon K.O. qui digivolue est relevé (D7).
- **Sauvegarde** : l'aller-retour JSON est identique pour les 81 espèces (stats, PV, PM, ABI, parcours, raw, puces). Au chargement, les PV ne sont pas bornés (D12).
- **Affichage** : la fiche (`ui/status.js`) et le combat lisent les mêmes fonctions (`m.stat`, `maxHp`, `maxMp`), donc ce qui est affiché correspond aux données [LU]. Trois écarts : la description des puces (D10), « Suivant » au N.100 (D11) et le sommeil (D9).
- **Saut de puissance à la Digivolution** (au même niveau) :
  - Agumon → Greymon N.15 : PV ×1,85, Att ×2,15.
  - Greymon → MetalGreymon N.32 : PV ×1,47, Att ×1,66.
  - MetalGreymon → WarGreymon N.45 : Att ×1,11 seulement, car le plafond est atteint.
  - WarGreymon → Omegamon : PV ×1,05, Att ×1,00 (E4).
- **Entraînement** :
  - En mode « Digivolution », les plafonds sont respectés (tr.atk 40/40 au N.10, total 240/300).
  - En mode « Statistique », 6 séances parfaites en Difficile font passer l'Attaque de 72 à 456, avec une difficulté bloquée à 0,30 (D2).
- **Objets** : RAM, Réveil (seulement sur un K.O.), Disque Attaque et Protection sont décomptés une fois chacun. Le sac ne descend jamais sous 0. 16 équipements portés l'un après l'autre gardent les PV bornés.

## 4. Combats

### 4.1 Mécanique vérifiée [SCRIPT `a6_cas_limites.js`, `a6b_objets_allie.js`, `a7_scenarios.js`, `t_lutte_ennemi.js`]

- **Formule des dégâts** (`game/battle.js:351-364`) :
  - base = (⌊2N/5 + 2⌋ × puissance × A/D / 50 + 2) × 20 × 0,6 × (×1,05 si c'est un sauvage qui frappe) × (1 ± 0,06 par niveau d'écart, borné entre 0,7 et 1,5) ;
  - puis × 1,5 si l'élément est celui de l'attaquant, × l'efficacité (bornée entre 0,5 et 1,8), × la résistance du Gymnase, × 1,2 pour l'avantage d'attribut, × 1,5 en coup critique, × un hasard de 0,85 à 1 × la météo × le bonheur ; minimum 1.
  - Sur un exemple recalculé à la main : **267 = 267**. Minimum 1 respecté (Botamon N.1 sur Omegamon N.100 : 39).
- **Déclenchement et fin** :
  - Un combat de boss avec toute l'équipe K.O. est refusé (« none »).
  - Un combat sauvage perdu compte un K.O., coûte 10 % des Bits et ramène chez Jijimon soigné. Au 3e K.O., le Digimon meurt et renaît en Botamon N.4 (3 défaites simulées : 1 000 → 900 → 810 → 729 Bits).
  - Un boss perdu appelle `bossDefeat` (soins, retour chez Jijimon, aucune récompense). Seule exception : la défaite contre Meramon sans Sora fait fuir le joueur, qui est soigné au Village des Yokomon.
- **PM** :
  - Coût = max(20, round(puissance/8) × 10) pour une attaque, 40 pour une technique de statut, 80 pour un soin ; Coup de Corps et Lutte sont gratuits ; 6 % des PM max reviennent à chaque tour.
  - À 0 PM, le jeu passe bien à la Lutte (recul de 25 % des PV max), même sans aucune technique.
  - Les boss ne tombent jamais à sec (0 Lutte en 250 combats).
  - Défaut : la Lutte n'est jamais proposée tant qu'une technique de statut est payable (D16).
- **Fin garantie** : chaque espèce (sauf Jijimon) a un coup spécial gratuit, qui se recharge quand on frappe ou qu'on encaisse. Même deux Digimon qui ne font que se protéger finissent leur combat. Aucun sauvage n'est sans attaque (niveaux 1 à 60).
- **Objets en combat** : chacun est décompté une fois, l'ennemi joue après, et le Réveil relève un équipier K.O.
- **Fuite** :
  - Face à un sauvage de même niveau, 200 fuites réussies sur 200, en 1,48 essai en moyenne.
  - Contre un boss, elle est refusée et le boss ne joue pas pendant l'essai.
  - Une fuite ratée laisse l'ennemi frapper seul.
- **Changement de Digimon** : le changement volontaire et le remplaçant forcé (sans retour possible) marchent. Quand toute l'équipe est K.O., le combat est perdu.
- **États** :
  - Poison : 4 tours, 1/12 des PV max par tour. Brûlure : 4 tours, 1/16 par tour, Attaque ÷2. Paralysie : 3 tours, 20 % de tours perdus, Vitesse ÷2.
  - Les Digimon de Feu ne sont pas brûlés et ceux d'Électricité ne sont pas paralysés.
  - Le sommeil fait perdre 1 action au lieu de 2 (D9). L'état reste après le combat jusqu'à un soin.
- **Récompenses** : 1 seul message d'EXP et 1 seul de Bits par victoire, y compris quand l'allié achève le boss. Les PNJ de Monochromon, Matt et Meramon disparaissent après leur victoire (pas de double récompense) ; Kuwagamon aussi. Shellmon reste pour la revanche (E5).
- **Désobéissance** :

| Discipline | Désobéit |
|---|---|
| 0 | 44 % des tours |
| 20 | 25 % |
| 40 (valeur de départ) | 4,8 % |
| 45 et plus | 0 % |

  La moitié de ces tours sont perdus.

### 4.2 Boss des chapitres 1 à 3 [SCRIPT `a5_boss.js` (N = 150), `a10_niveaux.js` (N = 40)]

Victoires sur 150 combats, sans objet, et entre parenthèses avec 3 RAM PV+ :

| Boss | Partenaire | Victoires |
|---|---|---|
| Kuwagamon N.11 | Agumon N.11 | 16 % (49 %) |
| Kuwagamon N.11 | Gabumon, Palmon, Tentomon ou Gomamon N.11 | 0 à 4 % |
| Kuwagamon N.11 | Greymon N.15 | 100 % |
| Shellmon N.17 (Tai et Greymon arrivent à 35 %) | Greymon N.17 | 26 % (72 %) |
| Shellmon N.17 | Garurumon | 93 % |
| Shellmon N.17 | Togemon, Kabuterimon, Ikkakumon | 99 à 100 % |
| Whamon N.24 (facultatif) | Greymon N.22 | 0 % (3 %) |
| Whamon N.24 | Kabuterimon ou Togemon N.22 | 99 à 100 % |
| Monochromon N.21 | Greymon N.20 | 10 % (97 %) |
| Monochromon N.21 | Ikkakumon | 94 % |
| Monochromon N.21 | Togemon | 97 % |
| Seadramon N.26 (Garurumon allié à 40 %) | Greymon N.26 | 28 % (65 %) |
| Seadramon N.26 | Garurumon N.25 | 0 % (75 %) |
| Seadramon N.26 | Kabuterimon | 99 % |
| Seadramon N.26 | Togemon | 97 % |
| Drimogemon N.29 (obligatoire avant Sora) | Greymon N.28 | 7 % (47 %) |
| Drimogemon N.29 | Ikkakumon | 99 % |
| Meramon N.30 avec Sora (Birdramon à 40 %, Meramon grandit) | Greymon N.28 | 2 % |
| Meramon N.30 avec Sora | Greymon N.30 | 52 % (63 %) |
| Meramon N.30 avec Sora | Ikkakumon N.28 | 13 % |
| Meramon N.30 avec Sora | Monochromon N.28 | 27 % (99 %) |
| Meramon N.30 sans Sora (combat écrasant) | même un Greymon N.60 | toujours « fuite » à 1 PV, comme le veut le script |

Niveau minimal pour gagner au moins 1 combat sur 2 sans objet (Champion bien entraîné : environ 2 × niveau dans sa stat principale) :

| Boss | Greymon | Garurumon | Birdramon | Togemon | Kabuterimon | Ikkakumon | Angemon |
|---|---|---|---|---|---|---|---|
| Kuwagamon N.11 | ≤15 | ≤15 | ≤15 | ≤15 | ≤15 | ≤15 | ≤15 |
| Shellmon N.17 | 18 | 17 | 18 | ≤15 | ≤15 | ≤15 | ≤15 |
| Whamon N.24 | 27 | 26 | 26 | 17 | 20 | 23 | 22 |
| Monochromon N.21 | 21 | 21 | 21 | 18 | 20 | 18 | 20 |
| Seadramon N.26 | 27 | 28 | 27 | 23 | 23 | 24 | 24 |
| Drimogemon N.29 | 30 | 26 | 29 | 23 | 28 | 25 | 26 |
| Meramon N.30 | 31 | 34 | 31 | 32 | 30 | 29 | 28 |

« ≤15 » : le balayage commence au N.15, niveau minimal d'un Champion. Avec un Champion bien entraîné, chaque boss se bat donc entre son propre niveau et 4 niveaux au-dessus. Les écarts viennent surtout des éléments (E3).

### 4.3 Sauvages par zone [SCRIPT `a4_zones.js`, `a8_sauvages.js` (N = 60), `a9_entrainement.js`, `t_bosquet.js`]

- **Niveaux par zone** :

| Zone | Niveaux |
|---|---|
| Dunes des Bébés | 2 à 4 |
| Bosquet des Pousses | 4 à 7 |
| Plage | 5 à 8 |
| Forêt | 7 à 12 (de jeunes Kuwagamon de 10 à 11 à la Clairière : voulu) |
| Antre de Shellmon | 11 à 18 |
| Grand Lac | Disciples de 18 à 28, Champions de 20 à 30 (Monochromon de 20 à 22 sur la Rive Sud avant le boss : voulu) |
| Pays de Meramon | 24 à 31 |
| Souterrains | 25 à 32 |

  La région `volcan` (14 à 25) n'est pas accessible aux chapitres 1 à 3. Aucune incohérence trouvée : pas d'espèce inconnue, pas de PNJ en sauvage, toujours min ≤ max.
- **EXP par victoire** :
  - Agumon N.8 contre un Disciple N.8 : 68 EXP, 3 victoires par niveau.
  - Greymon N.15 contre un Disciple N.9 : 11 EXP, 53 victoires par niveau (combattre plus faible ne rapporte presque rien, c'est voulu).
  - Greymon N.30 contre Meramon N.30 : 642 EXP, 4 victoires par niveau.
  - Contre un boss : ×1,5 EXP et 25 Bits par niveau.
- **Facilités** : un Champion à niveau de zone gagne 100 % de ses combats contre les Disciples. Togemon N.24 bat tout le lac en 1 tour (sauf Kuwagamon : 10 %).
- **Situations sans issue** : un Greymon N.24 perd 100 % de ses combats contre les Champions sauvages du lac (Gekomon, Shellmon, Monochromon, Seadramon N.26), et un Greymon N.29 contre Monochromon N.30 aux souterrains. Ces Champions poursuivent le joueur (agressivité 0,8 ; même stade, donc pas « plus fort »). Chaque défaite compte un K.O. et le 3e tue le Digimon (E3).
- **Entraînement N.6** : Koromon gagne en moyenne 21 % de ses combats contre les autres Entraînement sauvages de même niveau, contre 97 % pour Tanemon et 95 % pour Pyocomon (E1).

### 4.4 Résumé d'équilibrage

**Bugs**
- D1 (ABI sans coût), D2 (mode « Statistique »), D3, D5 et D7 à D19.

**Choix d'équilibrage à revoir**
- **E1** Koromon sans technique de Feu.
- **E2** Corpulence maximale demandée aux lignées de Sora et de Matt.
- **E3** Domination des éléments : les lignées de Feu (Greymon, Birdramon, Flarizamon, Meramon) affrontent surtout des boss et des Champions sauvages d'Eau ou de Terre (Shellmon, Whamon, Seadramon, Monochromon, Drimogemon). Sans objet, elles gagnent de 0 à 28 % à niveau égal, alors que Togemon et Kabuterimon gagnent de 97 à 100 %. Les RAM font passer Greymon contre Monochromon de 10 à 97 %.
- **E4** Les Méga atteignent le plafond de 999 dès leur niveau d'accès.
- **E5** La revanche de Shellmon est illimitée et rapporte trop.
- **E6** L'EXP partagée est donnée entière aux Digimon restés au fond.
- **E7** L'allié frappe à 7 % / 12 % des PV max du boss, quels que soient ses stats et l'élément.

**Conformes à l'intention écrite** (seulement noté)
- Contre Kuwagamon, un Disciple N.11 n'a que 0 à 16 % de chances ; le jeu dit de digivoluer d'abord.
- Meramon sans Sora : on fuit toujours.
- Le gain d'EXP s'effondre contre plus faible.
- Les jeunes Kuwagamon rôdent à la Clairière avant le boss.

---

## 5. Anomalies

Chaque fiche donne : le statut de vérification, le fichier et la ligne, comment reproduire, l'impact et la correction proposée.

### P1

**D1 — [P1, bug] L'ABI n'a ni coût ni limite (boucle Digivolution ↔ dé-digivolution).** [SCRIPT `a3_progression.js` § 4, `t_stat.js`]
- **Où** : `js/ui/evotable.js:32-41` (dé-digivolution sans aucune condition, « Possible ! » toujours affiché), `js/game/monster.js:112-117` (ABI +1 en digivoluant, +2 en dé-digivoluant), `js/game/training.js:45,47` (plafonds `10 + 3N + 4·ABI` et `300 + 30·ABI`).
- **Reproduire** : Koromon N.7 (atk 10, 3 victoires) → Agumon → dé-digivolution → Agumon… Les conditions restent remplies, puisque l'entraînement est gardé. Après 10 allers-retours : ABI 30, plafond 99 par stat (31 au lieu de cela normalement), plafond total 600.
- **Impact** : le potentiel censé dépendre du niveau (« les COMBATS font monter le niveau → le niveau fixe le POTENTIEL ») saute dès les premières minutes. La dé-digivolution l'annonce même au joueur : « ABI +2 : son potentiel augmente ». Avec D2, un Agumon N.10 a PV 5 438, Att 999 et Déf 999 [SCRIPT `t_stat.js`] : tous les boss des chapitres 1 à 3 deviennent triviaux.
- **Correction** :
  - Ne compter l'ABI qu'une fois par forme atteinte (par exemple un ensemble des formes déjà obtenues dans `parcours`) ;
  - ou borner l'ABI (par exemple ≤ ⌊N/3⌋) ;
  - ou donner un coût à la dé-digivolution : niveau remis au minimum de la forme comme dans Cyber Sleuth, une par jour, ou un objet.

### P2

**D2 — [P2, bug et équilibrage] Mode « Statistique » : la difficulté ne monte jamais et les gains sont démesurés.** [SCRIPT `t_stat.js`]
- **Où** : `js/game/training.js:89` (`difficulty` lit `m.tr`, que le mode « Statistique » ne change pas), `:158` (difficulté calculée sur `tr`), `:78` (plafond raw = 2,5 × plafond, hors du total de 300), `:75` (8 × multiplicateur de réussite jusqu'à 4 × 2 en Difficile = 64 points affichés, soit +80 Att par séance).
- **Reproduire** : Agumon N.10, 12 séances parfaites en Difficile :

| Objectif | Résultat | Difficulté |
|---|---|---|
| « Digivolution » | Att 72 → 155, plafonné après 4 séances | monte jusqu'à 1,00 |
| « Statistique » | Att 72 → 456 en 6 séances | reste à 0,30 |

  Un Agumon N.10 entraîné en raw 120 PV, Att et Déf bat Kuwagamon N.11 dans 100 % des cas avec 86 % de ses PV [SCRIPT `a5_boss.js`].
- **Impact** : le « vrai fossé entre les stades » (`monster.js:54`) disparaît, et le choix « Digivolution » n'a plus d'intérêt pour combattre.
- **Correction** :
  - calculer la difficulté sur `raw` en mode « Statistique » ;
  - abaisser le plafond raw (par exemple 1 × plafond) ou le compter dans le total ;
  - réduire le multiplicateur de séance.

**D3 — [P2, bug] Le Bandage X (coffre du chapitre 3) fait de n'importe quel Champion un Ultime, sans écusson ni condition.** [SCRIPT `t_xband.js`]
- **Où** : `js/maps/sous_volcan.js:346` (coffre de la Nécropole Ensevelie : `x_bandage`), `js/game/objets.js:26` (`canUse` ne vérifie que le stade), `js/data/items.js:121-126` (objets « evo » : `from` = stade précédent, aucune autre condition). Même principe pour l'Aile de flammes, `sous_volcan.js:442` : n'importe quel Disciple → Birdramon.
- **Reproduire** : ouvrir les coffres `sous_volcan3` (9,18) et (55,18), ce qui donne `x_bandage: 1`, puis l'utiliser sur un Greymon N.26. Il devient Monzaemon : PV 2 449 → 3 800, Att 334 → 464. L'écusson de la Pureté reste « à trouver », et la table n'a même pas d'arête Greymon → Monzaemon.
- **Impact** : contourne la règle « Au début, aucun Digimon ne dépasse le stade Champion » (`ecussons.js:4`) dans la version GAMMA, avant Meramon. Casse aussi la lignée (D5).
- **Correction** :
  - dans `canUse` (`case 'evo'`), exiger `DW.Crests.requirement(it.to)` et un niveau minimal ;
  - ou remplacer le Bandage X du coffre par une autre récompense jusqu'à ce que l'écusson soit obtenable.

**D4 — [P2, bug] Trois Ultimes n'exigent aucun écusson.** [SCRIPT `a2_evolutions.js`, `t_xband.js`]
- **Où** : `js/data/ecussons.js:13-21` (`ULTIMES` ne cite ni `megakabuterimon`, ni `magnaangemon`, ni `angewomon`).
- **Reproduire** : Kabuterimon N.32 (def 50, int 30, bonheur 70, 40 victoires, discipline 50, au plus 2 erreurs) → MegaKabuterimon : « POSSIBLE », sans aucun écusson. Même résultat pour Angemon → MagnaAngemon et Gatomon → Angewomon. MetalGreymon, dans les mêmes conditions, est refusé (« Écusson du Courage »).
- **Impact** : les lignées d'Izzy, de T.K. et de Kari atteignent l'Ultime dans la version GAMMA (N.32 est atteignable grâce aux revanches de Shellmon), pas les autres. Kari n'a d'ailleurs pas d'écusson : `ORDER` en compte 7.
- **Correction** : ajouter `megakabuterimon` à `izzy` et `magnaangemon` à `tk`, et décider de l'écusson d'Angewomon (celui de T.K., ou un 8e écusson pour Kari).

**D5 — [P2, bug] Un objet de Digivolution sort de l'arbre : la dé-digivolution et la renaissance changent de lignée.** [SCRIPT `t_objevo.js`, `t_xband.js`]
- **Où** : `js/data/evolutions.js:93-96` (`prev1` n'accepte la forme du parcours que si c'est un « prev » de la table, sinon il prend la forme principale), `js/game/monster.js:117` (parcours vidé quand la forme d'arrivée n'y figure pas).
- **Reproduire** :
  - Punimon → Tsunomon → Gabumon + Aile de flammes → Birdramon → dé-digivolution → **Biyomon**, parcours `[]`, renaissance en **Nyokimon**.
  - Greymon + Bandage X → Monzaemon → dé-digivolution → **Numemon**.
- **Impact** : le partenaire de la lignée de Matt devient une autre espèce. Annule pour ce cas la correction de la mission GAMMA (« il renaît en son propre bébé »).
- **Correction** : dans `prev1`, rendre la dernière forme du parcours si elle est d'un stade inférieur, même hors de la table.

**D6 — [P2, bug] Ogremon → Etemon et Devimon → Megadramon sont impossibles.** [SCRIPT `t_erreurs.js`]
- **Où** : `js/data/species2.js:86` (Patamon → Devimon : au moins 3 erreurs), `:88` (Gabumon → Ogremon : au moins 3 erreurs), `js/data/evolutions.js:65-67` (tout Ultime « non négligé » reçoit au plus 2 erreurs et une discipline de 50). Les erreurs ne baissent jamais, sauf à la renaissance (`life.js:48,189`).
- **Reproduire** : Gabumon N.18 avec 3 erreurs → Ogremon. Puis, au N.40, avec tout au maximum et l'écusson du Courage, Ogremon → Etemon est refusé : « Erreurs de soin 3/2 ». Seuls la Massue et l'Aile noire (rang 14, en vente au chapitre 4) donnent un Ogremon ou un Devimon sans erreur.
- **Impact** : deux branches mortes. Hors des chapitres 1 à 3, puisqu'il faut aussi l'écusson.
- **Correction** : marquer ces deux arêtes comme Digivolutions de négligence (`mistakes: 3`, comme Greymon → SkullGreymon) ou leur donner `mistakesMax: 99`.

**E1 — [P2, équilibrage] Koromon n'a aucune technique de Feu, et tous les Entraînement ont une attaque d'Eau.** [SCRIPT `a9_entrainement.js`, `t_koro.js`, `t_bosquet.js`]
- **Où** : `js/data/species.js:29-31` (Koromon : Coup de Corps, Bulles, Intimidation, Assaut Éclair, Bulle Explosive, Coup de Tête), `js/data/moves.js:122` (coup spécial de Koromon : `bulles`, de l'Eau). Tous les Entraînement ont Bulles (Eau), super efficace sur le Feu.
- **Reproduire** : Koromon N.6 contre les Entraînement sauvages N.6, 50 combats chacun :
  - 2 % contre Bukamon, Tanemon, Yokomon et Pyocomon, 22 % contre Tsunomon, moyenne 21 % ;
  - Tanemon fait 97 %, Pyocomon 95 % ;
  - au Bosquet, Koromon N.5 gagne 2 % contre Motimon et 0 % contre Yokomon.

  Sur la plage, Koromon N.6 gagne 0 à 3 % de ses combats.
- **Impact** : la lignée de Tai (Botamon, la lignée par défaut) bute dès le 2e stade. Koromon doit gagner 3 combats pour devenir Agumon. Seule parade : la salle de classe, qui propose Étincelle (Feu) [SCRIPT `t_misc.js`].
- **Correction** : donner à Koromon une technique de Feu au N.1 à 4 (Étincelle) et un coup spécial de son élément. Faire de même pour Motimon (Électrique) et Tokomon (Lumière), qui n'ont pas non plus de technique de leur élément.

**E2 — [P2, équilibrage] Corpulence maximale des formes « agiles », dont les Champions de Sora et de Matt.** [SCRIPT `t_poids.js` (boucle de soins simplifiée, avec les vraies `Care.update` et `Care.feed`) ; LU pour les conditions]
- **Où** : `js/data/evolutions.js:77-81` (Biyomon → Birdramon ≤ 2, Gabumon → Garurumon ≤ 3, Elecmon → Garurumon ≤ 3, Agumon → Meramon ≤ 1, Gotsumon → Meramon ≤ 2, Kunemon → Kuwagamon ≤ 2), `js/game/care.js:109` (+1,6 de corpulence par journée de repas complète), `js/game/training.js:199` (-0,2 par séance).
- **Reproduire** : Biyomon nourri dès que sa faim atteint 70, pendant 5 jours :
  - aucune séance : corpulence 6,6 ;
  - 4 séances par jour : 5,4 ;
  - 7 séances par jour : 4,4 ;
  - nourri seulement à faim 95 : 4,2.

  Aucune erreur de soin dans ces 4 cas. La Figue (-3) n'est en vente qu'à partir du chapitre 3 (rang 9) ; la Salade (-2) passe par la cuisine.
- **Impact** : Birdramon et Garurumon restent fermés tant que le joueur ne prive pas son Digimon de nourriture (au risque d'erreurs de soin, qui ferment ensuite les Champions au-delà de 4 erreurs) ou ne trouve pas de quoi le faire maigrir. Le test « poids » ne vérifie que le sens « costaud ».
- **Correction** : relever ces seuils (par exemple ≤ 5, soit « Enrobé » au plus), ou faire perdre davantage de poids à l'entraînement (-0,4 par séance). À **vérifier en jeu** : la durée réelle pour atteindre N.15.

**E3 — [P2, équilibrage] Les éléments décident presque seuls des combats de boss et des Champions sauvages.** [SCRIPT `a5_boss.js`, `a8_sauvages.js`, `a10_niveaux.js`]
- **Où** : `js/data/types.js:27` (avantage ×1,5 par type, borné entre 0,5 et 1,8), `js/game/battle.js:357,360` (×1,5 pour l'élément de l'attaquant, ×1,2 pour l'attribut). Ces multiplicateurs se cumulent : environ ×3,2 contre ×0,7.
- **Chiffres** : voir les § 4.2 et 4.3. Greymon, à niveau égal et sans objet, gagne de 0 à 28 % contre Shellmon, Whamon, Monochromon, Seadramon et Drimogemon, et 0 % contre les Champions sauvages du lac. Garurumon gagne 0 % contre Seadramon (Glace contre Eau et Glace : ×0,5).
- **Impact** : la lignée de Feu, la plus jouée, dépend des RAM. Elle risque de perdre son Digimon au 3e K.O. au chapitre 2, où environ 39 % des sauvages du fond du lac sont des Champions agressifs.
- **Correction (choix du joueur)** : adoucir le cumul (borner le total élément × attribut, par exemple ×1,6), ou ne pas faire poursuivre le joueur par les Champions d'un élément qui le domine.

**E4 — [P2, équilibrage, hors chapitres 1 à 3] Les Méga atteignent le plafond de 999 dès leur niveau d'accès.** [SCRIPT `a3_progression.js`]
- **Où** : `js/game/monster.js:166` (999), `:170` (Méga ×2,5).
- **Reproduire** : WarGreymon N.45 sans entraînement a Att, Déf, Vit et Int à 999. Omegamon N.55 aussi, avec 9 999 PV. WarGreymon → Omegamon : PV ×1,05, Att ×1,00. Une Puce Attaque sur WarGreymon N.50 donne +0.
- **Impact** : à ce stade, l'entraînement, les puces et l'équipement ne servent plus, toutes les Méga ont les mêmes stats, et la fusion n'apporte que ses techniques.
- **Correction** : multiplicateur Méga plus bas (environ 1,9), ou plafond relevé pour les stades Ultime et Méga.

**E5 — [P2, équilibrage] La revanche de Shellmon est illimitée.** [SCRIPT `a7_scenarios.js`, `t_conds.js`]
- **Où** : `js/maps/antre.js:410-411` (niveau = meilleur niveau de l'équipe + 1, jusqu'à 60), `:421` (+30 × niveau en Bits, en plus des Bits du combat de boss). Le PNJ n'a aucune condition.
- **Reproduire** : Togemon N.20 bat la revanche (Shellmon N.21) : +1 964 Bits. C'est répétable aussitôt, sur place.
- **Impact** : environ 2 000 Bits et environ 1 250 EXP par combat, sans fin, dès le chapitre 2. Cela rend le N.32 (D4) et les achats faciles. L'EXP « à volonté » est voulue ; les Bits sont en trop.
- **Correction** : supprimer les 30 × niveau ou limiter la revanche à une par jour.

### P3

**D7 — [P3, bug] Un Digimon K.O. peut digivoluer depuis sa fiche, et il est relevé.** [SCRIPT `a6_cas_limites.js` § 10, `a3_progression.js` § 3]
- **Où** : `js/ui/evotable.js:43-56` (aucune vérification des PV), `js/game/monster.js:104-106` (`reajuster` ajoute l'écart des PV max avant de borner).
- **Reproduire** : Agumon K.O. (N.15, atk 28, 10 victoires) → Greymon depuis l'onglet Digivolution : PV 710/1550. Puis dé-digivolution : Agumon à 1 PV.
- **Impact** : réanimation gratuite, sans objet.
- **Correction** : refuser la Digivolution d'un Digimon K.O. ; dans `reajuster`, garder 0 si les PV étaient à 0.

**D8 — [P3, bug] Une puce relève un Digimon K.O. hors combat.** [SCRIPT `a3_progression.js` § 6]
- **Où** : `js/game/objets.js:23` (`case 'chip'` sans vérification des PV), `:46` (`m.hp += maxHp - hp0`).
- **Reproduire** : une Puce PV sur un Agumon K.O. le remet à 500 PV.
- **Correction** : exiger `m.hp > 0`, ou ne pas augmenter les PV d'un Digimon K.O.

**D9 — [P3, bug] Le sommeil fait perdre 1 action, pas « exactement 2 tours ».** [SCRIPT `a6_cas_limites.js` § 6]
- **Où** : `js/game/battle.js:12` (`slp: 2`), `:368-371` (décompte puis réveil, et le Digimon joue dans le même tour), `:442` (commentaire « dort exactement 2 tours »).
- **Impact** : Parfum Soporifique et Spores Dodo sont deux fois plus faibles que voulu.
- **Correction** : mettre `slp` à 3, ou réveiller le Digimon sans le faire jouer.

**D10 — [P3, bug] La description des puces est fausse hors du stade Disciple.** [SCRIPT `a3_progression.js` § 6]
- **Où** : `js/data/items.js:37-43` (« Attaque +50 », « PV max +500 », etc.) ; le gain est multiplié par le stade (`monster.js:53-60`).
- **Reproduire** : la Puce PV donne +775 à un Champion et +1 000 à un Ultime ; la Puce Attaque donne +77 ou +100, et +0 au plafond. Le message après usage, lui, donne le vrai gain.
- **Correction** : écrire le gain en « points » ou le calculer pour le Digimon choisi.

**D11 — [P3, bug] « Suivant : 24 240 » affiché au niveau 100.** [SCRIPT `a3_progression.js` § 2]
- **Où** : `js/ui/status.js:156`.
- **Correction** : afficher « — » à N.100.

**D12 — [P3, bug] Les PV ne sont pas bornés au chargement.** [SCRIPT `t_misc.js`]
- **Où** : `js/game/monster.js:128-131` (`from` reprend `o.hp` tel quel ; les PM, eux, sont bornés ligne 45).
- **Reproduire** : une sauvegarde à PV 99 999 donne un Agumon à 99999/640.
- **Impact** : nul en jeu normal ; il apparaît après une baisse de stats d'une version à l'autre ou une sauvegarde abîmée.
- **Correction** : `m.hp = Math.min(o.hp, m.maxHp)`.

**D13 — [P3, bug] Références mortes.** [SCRIPT `a1_registre.js`, `t_refs.js`]
- `tyrannomon` dans `js/data/techniques_elements.js:51`, ignoré.
- `pagumon` dans les passants de `js/maps/village.js:390`, jamais affiché.
- 13 espèces inexistantes dans `NOCTURNAL` (`js/game/life.js:27`) : gazimon, tsukaimon, demidevimon, pagumon, vampiremon, myotismon, phantomon, soulmon, wizardmon, pumpkinmon, impmon, keramon, kuramon.
- `kunemon2` (`js/data/species2.js:91,100`).
- **Correction** : supprimer, ou créer les espèces.

**D14 — [P3, bug] Objets de Digivolution d'Ultime jamais vendus ; deux sont introuvables.** [SCRIPT `a2_evolutions.js` ; grep]
- **Où** : `js/data/items.js:124` (rang 24), `:166-172` (le stock monte au plus au rang 20).
- **Constat** : la Pièce de métal (MetalGreymon) et le Miroir de lune (WereGarurumon) n'ont aucune autre source.
- **Correction** : rang ≤ 20, ou leur donner une source.

**D15 — [P3, bug] La dé-digivolution d'Omegamon est traitée comme une Digivolution ; le partenaire de fusion est perdu.** [SCRIPT `a2_evolutions.js`]
- **Où** : `js/data/evolutions.js:43-44` (Méga → Méga), `js/game/monster.js:113-117` (`bas` faux : ABI +1 au lieu de +2, `omegamon` ajouté au parcours), `js/ui/evotable.js:52` (le MetalGarurumon quitte l'équipe et n'est jamais rendu).
- **Correction** : marquer la fusion pour que la dé-digivolution compte comme « bas » et rende le partenaire, ou interdire la dé-digivolution d'Omegamon.

**D16 — [P3, bug] La Lutte n'est jamais proposée tant qu'une technique de statut est payable.** [SCRIPT `a6_cas_limites.js` § 8]
- **Où** : `js/game/battle.js:168`.
- **Reproduire** : un Greymon N.40 réduit à Garde et Intimidation (une mort peut faire oublier 1 ou 2 techniques) contre un boss : il ne frappe qu'avec son coup spécial, tous les 15 à 30 tours.
- **Correction** : toujours ajouter « Lutte » en dernier choix.

**D17 — [P3, bug] Le combat du Dojo d'Elecmon est traité comme un combat sauvage.** [LU]
- **Où** : `js/maps/grandir.js:240` (pas de `boss`), donc `battle.js:48` (« Agumon sauvage… »), fuite possible, ×1,05 aux dégâts, et `overworld.js:519` (compté parmi les Digimon vus de la carte).
- **Correction** : passer une option « amical » (`boss: true` sans pénalité).

**D18 — [P3, bug] Les Bits d'une victoire dépendent du Digimon actif au moment du K.O.** [LU]
- **Où** : `js/game/battle.js:508`.
- **Reproduire** : envoyer un bébé pour le dernier coup porte le multiplicateur jusqu'à ×1,8 au lieu de ×0,2.
- **Correction** : prendre le plus haut niveau des participants.

**D19 — [P3, bug] Le Gymnase peut donner des statistiques négatives.** [SCRIPT `a3_progression.js` § 8]
- **Où** : `js/maps/gymnase.js:40` (`raw` peut descendre à -15), `js/game/monster.js:60`.
- **Reproduire** : un Botamon N.4 avec raw -15 affiche Att -14 et Déf -17.
- **Impact** : nul aux chapitres 1 à 3, où le Gymnase est fermé.
- **Correction** : borner la stat affichée à au moins 1, ou borner `raw` selon le niveau.

**D20 — [P3, bug] Gomamon → Shellmon ne demande aucune victoire.** [SCRIPT `a2_evolutions.js`]
- **Où** : `js/data/evolutions.js:29` (Betamon → Shellmon en demande 10).
- **Correction** : ajouter `wins: 10`.

**D21 — [P3, bug] 29 espèces n'ont pas de dessin de secours.** [SCRIPT `t_refs.js` ; rendu NON VÉRIFIÉ, car le navigateur était interdit]
- **Où** : `js/gfx/sprites.js:21-33,104`.
- **Constat** : ce sont les 29 espèces à images (Agumon, Greymon, Kuwagamon, Shellmon, Meramon, les bébés…). Tant que l'image n'est pas chargée, ou si elle échoue, elles s'affichent en boule grise.
- **Correction** : garder une silhouette légère par espèce, ou attendre le dossier `commun` avant un combat.

**D22 — [P3, bug] Le test « Shellmon… à mi-vie » ne teste pas la vraie configuration.** [LU]
- **Où** : `dev/tests.js:511` (`at: 0.5`) ; le jeu met `at: 0.35` (`js/maps/antre.js:412`).
- **Correction** : lire la valeur du jeu dans le test.

**D23 — [P3, bug] Le README est périmé.** [SCRIPT]
- **Où** : `README.md:51` annonce « 70 espèces, 158 techniques ».
- **Constat** : il y en a 81 (79 au DigiDex) et 166.

**D24 — [P3, à confirmer] La renaissance remet l'ABI à 0.** [SCRIPT `a3_progression.js` § 7]
- **Où** : `js/game/life.js:187-189`.
- **Constat** : l'entraînement gardé (la moitié) peut dépasser le nouveau plafond (30 > 22 au N.4), et l'entraînement reste bloqué jusqu'à une montée de niveau.
- **Décision du joueur** : garder l'ABI, ou non.

**D25 — [P3, bug] L'élément Poison n'a aucune technique de classe.** [SCRIPT `t_misc.js`]
- **Où** : `js/data/techniques_classe.js:12-74`.
- **Constat** : Sukamon, Numemon et Mushroomon ne se voient proposer en classe que des techniques Neutre (et Plante ou Ténèbres pour leur autre type).

**E6 — [P3, équilibrage] L'EXP partagée est donnée entière aux Digimon restés au fond.** [SCRIPT `a6_cas_limites.js` § 5]
- **Où** : `js/game/battle.js:470-483`.
- **Reproduire** : un Botamon N.3 jamais envoyé gagne 100 EXP (N.3 → N.5).
- **Correction** : la moitié pour les non-participants.

**E7 — [P3, équilibrage] L'allié frappe à 7 % / 12 % des PV max du boss, quels que soient ses stats et l'élément.** [SCRIPT `a6b_objets_allie.js`]
- **Où** : `js/game/battle.js:288-289`.
- **Reproduire** : un Koromon N.1 allié enlève 6 % des PV d'Omegamon N.100.
- **Impact** : volontairement simple ; à garder ou à pondérer par l'élément.

## 6. Non vérifié

- **Rendu** des dessins et des images : le navigateur partagé était interdit.
- **Mini-jeux d'entraînement** : leur difficulté réelle pour un joueur humain.
- **Durée réelle** d'une progression en jours de jeu : nombre de jours pour atteindre N.15 ou N.32, et donc portée réelle d'E2.
- **Hors chapitres 1 à 3** : donjons des écussons, Devimon, régions 4 et plus, tournois et Colisée, DigiFerme, demandes des habitants au-delà de leur lecture.
- **Fréquences d'apprentissage** (`tryLearn`, `observe`, classe) sur une vraie partie.
- **Tactile, manette, son.**

## Fichiers

Tous dans `C:\Users\CaMiL\AppData\Local\Temp\claude\C--Users-CaMiL-Desktop-PROGRAMMES-APPLICATIONS-CLAUDE-DIGIMON\6f82ba0c-eac4-4c5c-b469-a7c3692356c6\scratchpad\audit_integral\digimon\` :
- **Bancs** : `charger.js` (chargement du jeu), `sim.js` (banc de combat).
- **Scripts d'audit** : `a1_registre.js`, `a2_evolutions.js`, `a3_progression.js`, `a4_zones.js`, `a5_boss.js`, `a6_cas_limites.js`, `a6b_objets_allie.js`, `a7_scenarios.js`, `a8_sauvages.js`, `a9_entrainement.js`, `a10_niveaux.js`, plus les `t_*.js` ciblés.
- **Sorties** : `sortie_registre.md`, `sortie_evolutions.md` (tableau complet des conditions), `sortie_progression.md`, `sortie_zones.md`, `sortie_boss.md`, `sortie_cas_limites.md`, `sortie_scenarios.md`, `sortie_sauvages.md`, `sortie_entrainement.md`, `sortie_niveaux.md`.
- Relancer un script : `node <script>` depuis ce dossier, avec `N=…` pour le nombre de combats.

---

## Annexe A — Registre des 81 espèces (données chargées du jeu)

Base = PV / Att / Déf / Vit / Int ; techniques : id[niveau d’apprentissage] (0 = apprise en digivoluant) ; SIG = coup spécial ; « ← de » / « → vers » : formes d’avant et d’après dans la table.

| id | nom | stade | types | attr | base | kg | xp | techniques | SIG | dessin | ← de | → vers |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| botamon | Botamon | Bébé | Neutre | Données | 40/40/34/42/34 | 1 | 28 | charge[1] bulles_acides[1] grondement[3] bulles[5] | bulles_acides | image (secours = tache grise pendant le chargement) | — | koromon |
| punimon | Punimon | Bébé | Neutre | Données | 40/38/38/40/34 | 1 | 28 | charge[1] bulles[1] garde[3] bulles_acides[5] | bulles | image (secours = tache grise pendant le chargement) | — | tsunomon |
| pichimon | Pichimon | Bébé | Eau | Données | 42/34/38/38/38 | 1 | 28 | charge[1] bulles[1] garde[3] bulles_acides[5] | bulles | image (secours = tache grise pendant le chargement) | — | bukamon |
| yuramon | Yuramon | Bébé | Plante | Données | 44/32/38/36/40 | 1 | 28 | charge[1] bulles[1] grondement[3] feuille[5] | bulles | image (secours = tache grise pendant le chargement) | — | tanemon |
| nyokimon | Nyokimon | Bébé | Plante | Données | 40/34/36/40/40 | 1 | 28 | charge[1] bulles[1] parfum[3] feuille[5] | bulles | image (secours = tache grise pendant le chargement) | — | pyocomon yokomon |
| koromon | Koromon | Entraînement | Feu | Vaccin | 45/46/40/50/44 | 4 | 45 | charge[1] bulles[1] grondement[4] vive_attaque[6] bulle_explosive[8] coup_tete[10] | bulles | image (secours = tache grise pendant le chargement) | botamon | agumon gabumon guilmon |
| tsunomon | Tsunomon | Entraînement | Glace | Données | 46/44/48/46/44 | 4 | 45 | charge[1] bulles[1] garde[4] vive_attaque[6] souffle_glace[8] coup_tete[10] | bulles | image (secours = tache grise pendant le chargement) | punimon | gabumon elecmon gotsumon patamon |
| bukamon | Bukamon | Entraînement | Eau | Vaccin | 48/42/46/45/46 | 5 | 45 | charge[1] bulles[1] garde[4] vive_attaque[6] jet_hydro[8] coup_tete[10] | bulles | image (secours = tache grise pendant le chargement) | pichimon | gomamon betamon penguinmon |
| tanemon | Tanemon | Entraînement | Plante | Données | 50/40/48/42/48 | 4 | 45 | charge[1] bulles[1] grondement[4] feuille[6] lierre[8] garde[10] | bulles | dessin code | yuramon poyomon | palmon mushroomon |
| yokomon | Yokomon | Entraînement | Plante+Air | Données | 45/40/42/48/46 | 3 | 42 | charge[1] bulles[1] parfum[5] feuille[7] bulle_explosive[9] picorage[11] | bulles | dessin code | nyokimon | biyomon kunemon tentomon candlemon |
| agumon | Agumon | Disciple | Feu | Vaccin | 55/62/50/55/52 | 10 | 70 | griffe[1] grondement[1] flamme_bebe[1] vive_attaque[10] morsure[13] souffle_ardent[16] coup_queue[19] mega_flamme[22] | flamme_bebe | image (secours = tache grise pendant le chargement) | koromon | greymon meramon monochromon numemon sukamon |
| gomamon | Gomamon | Disciple | Eau | Vaccin | 60/55/58/50/50 | 12 | 70 | charge[1] banc_poissons[1] garde[1] vive_attaque[10] coup_tete[13] grande_vague[16] fleche_glace[19] raz_de_maree[20] torpille_harpon[22] | banc_poissons | dessin code | bukamon | ikkakumon shellmon seadramon numemon sukamon |
| palmon | Palmon | Disciple | Plante | Données | 58/50/52/52/62 | 9 | 70 | charge[1] lierre[1] parfum[1] vive_attaque[10] fouet_liane[13] feuille_rasoir[16] couronne_fleurs[19] tempete_petales[20] pluie_epines[22] | lierre | image (secours = tache grise pendant le chargement) | tanemon | togemon numemon sukamon |
| biyomon | Biyomon | Disciple | Air+Feu | Vaccin | 55/52/48/62/56 | 7 | 70 | coup_bec[1] grondement[1] flamme_spirale[1] vive_attaque[11] tornade[15] picorage[18] vol_plane[21] tempete_petales[24] | flamme_spirale | dessin code | pyocomon yokomon | birdramon meramon unimon numemon sukamon |
| kunemon | Kunemon | Disciple | Insecte+Électrique | Virus | 45/48/42/48/50 | 6 | 60 | charge[1] toile[1] electro_fil[4] dard_venin[8] morsure[12] electro_choc[16] souffle_paralysant[18] petit_tonnerre[21] | electro_fil | dessin code | yokomon motimon | kuwagamon kabuterimon numemon sukamon |
| mushroomon | Mushroomon | Disciple | Plante+Poison | Virus | 52/50/45/50/56 | 8 | 62 | charge[1] champi_bombe[1] parfum[6] nuage_toxique[9] morsure[12] feuille_rasoir[15] main_enfers[17] jet_acide[19] lierre[20] | champi_bombe | image (secours = tache grise pendant le chargement) | tanemon | togemon bakemon numemon sukamon |
| betamon | Betamon | Disciple | Eau+Électrique | Virus | 55/50/52/50/54 | 9 | 64 | charge[1] bulles[1] electro_choc[5] garde[10] jet_hydro[14] petit_tonnerre[17] grande_vague[20] raz_de_maree[22] | electro_choc | image (secours = tache grise pendant le chargement) | bukamon | shellmon seadramon gekomon numemon sukamon |
| gotsumon | Gotsumon | Disciple | Terre | Données | 58/60/62/38/40 | 30 | 66 | charge[1] garde[1] jet_pierres[6] poing_roc[12] vrille[15] coup_tete[18] seisme[19] | poing_roc | dessin code | tsunomon | meramon monochromon drimogemon numemon sukamon |
| elecmon | Elecmon | Disciple | Électrique | Données | 55/58/48/65/56 | 8 | 68 | charge[1] grondement[1] super_tonnerre[5] vive_attaque[11] morsure[15] souffle_paralysant[18] petit_tonnerre[21] orage[21] | super_tonnerre | image (secours = tache grise pendant le chargement) | tsunomon tokomon | garurumon leomon centarumon numemon sukamon |
| gabumon | Gabumon | Disciple | Glace | Données | 58/54/60/52/56 | 15 | 70 | charge[1] souffle_bleu[1] grondement[1] coup_tete[10] morsure[13] souffle_glace[16] fleche_glace[19] pics_glace[20] flamme_bleue[22] | souffle_bleu | dessin code | koromon tsunomon | garurumon frigimon ogremon numemon sukamon |
| garurumon | Garurumon | Champion | Glace | Vaccin | 82/86/76/88/76 | 70 | 150 | flamme_bleue[0] morsure[1] souffle_bleu[1] vive_attaque[1] tempete_neige[24] poing_zero[28] pics_glace[28] fleche_glace[32] | flamme_bleue | image (secours = tache grise pendant le chargement) | gabumon elecmon | weregarurumon |
| meramon | Meramon | Champion | Feu | Données | 78/90/68/74/86 | 45 | 150 | poing_ardent[0] boule_feu[1] souffle_ardent[1] grondement[1] mega_flamme[24] tempete_feu[28] | poing_ardent | image (secours = tache grise pendant le chargement) | agumon biyomon gotsumon candlemon | skullmeramon |
| birdramon | Birdramon | Champion | Feu+Air | Vaccin | 78/82/70/94/84 | 40 | 150 | meteore[0] flamme_spirale[1] coup_bec[1] tornade[1] vol_plane[24] tempete_feu[30] souffle_ardent[32] | meteore | image (secours = tache grise pendant le chargement) | biyomon | garudamon |
| greymon | Greymon | Champion | Feu | Vaccin | 80/92/75/70/72 | 60 | 150 | mega_flamme[0] griffe[1] flamme_bebe[1] morsure[1] coup_corne[22] coup_queue[27] tempete_feu[30] souffle_ardent[31] vrille[35] | mega_flamme | image (secours = tache grise pendant le chargement) | agumon | metalgreymon skullgreymon |
| ikkakumon | Ikkakumon | Champion | Eau+Glace | Vaccin | 90/82/85/58/70 | 70 | 150 | torpille_harpon[0] banc_poissons[1] coup_tete[1] garde[1] souffle_glace[21] tempete_neige[27] fleche_glace[30] raz_de_maree[30] poing_zero[34] | torpille_harpon | image (secours = tache grise pendant le chargement) | gomamon | zudomon |
| togemon | Togemon | Champion | Plante | Données | 85/80/80/62/85 | 50 | 150 | pluie_epines[0] poing_piquant[1] lierre[1] parfum[1] fouet_liane[22] uppercut[27] tempete_petales[28] couronne_fleurs[30] feuille_rasoir[34] | pluie_epines | image (secours = tache grise pendant le chargement) | palmon mushroomon | lillymon |
| kuwagamon | Kuwagamon | Champion | Insecte | Virus | 80/90/78/72/60 | 55 | 155 | pince[0] charge[1] grondement[1] electro_fil[1] vol_plane[22] main_enfers[26] vrille[30] | pince | image (secours = tache grise pendant le chargement) | kunemon | okuwamon |
| shellmon | Shellmon | Champion | Eau | Données | 90/78/90/40/75 | 80 | 160 | jet_hydro[0] charge[1] coquille[1] bulles[1] coup_tete[14] grande_vague[18] raz_de_maree[28] | jet_hydro | image (secours = tache grise pendant le chargement) | gomamon betamon | zudomon |
| metalgreymon | MetalGreymon | Ultime | Feu+Lumière | Vaccin | 100/120/100/82/95 | 140 | 230 | giga_destruction[0] mega_flamme[1] coup_corne[1] morsure[1] bras_trident[38] souffle_ardent[42] | giga_destruction | dessin code | greymon | wargreymon |
| zudomon | Zudomon | Ultime | Eau+Terre | Vaccin | 110/115/110/65/85 | 160 | 230 | marteau_vulcain[0] torpille_harpon[1] souffle_glace[1] coup_tete[1] boomerang[38] poing_zero[42] | marteau_vulcain | dessin code | ikkakumon shellmon frigimon gekomon | — |
| lillymon | Lilimon | Ultime | Plante+Lumière | Données | 92/90/85/95/120 | 20 | 230 | canon_floral[0] pluie_epines[1] parfum[1] charme[1] feuille_rasoir[38] couronne_fleurs[42] | canon_floral | dessin code | togemon | — |
| weregarurumon | WereGarurumon | Ultime | Glace | Vaccin | 98/118/92/110/84 | 90 | 230 | griffe_garuru[0] flamme_bleue[1] poing_zero[1] morsure[1] tempete_neige[38] vive_attaque[42] | griffe_garuru | dessin code | garurumon | metalgarurumon |
| skullmeramon | SkullMeramon | Ultime | Feu+Ténèbres | Données | 100/116/88/86/112 | 70 | 230 | feu_metal[0] poing_ardent[1] mega_flamme[1] main_enfers[1] souffle_ardent[38] grondement[42] | feu_metal | dessin code | meramon bakemon flarizamon | — |
| garudamon | Garudamon | Ultime | Feu+Air | Vaccin | 102/110/90/112/96 | 85 | 230 | ombre_ailee[0] meteore[1] tornade[1] coup_bec[1] flamme_spirale[38] vol_plane[42] | ombre_ailee | dessin code | birdramon | — |
| okuwamon | Okuwamon | Ultime | Insecte+Ténèbres | Virus | 104/122/108/74/70 | 140 | 230 | double_ciseaux[0] pince[1] vrille[1] electro_fil[1] main_enfers[38] vol_plane[42] | double_ciseaux | dessin code | kuwagamon | — |
| numemon | Numemon | Champion | Poison+Ténèbres | Virus | 70/62/55/70/58 | 10 | 120 | gadoue_nume[0] charge[1] grondement[1] bulles_acides[1] morsure[24] boue_toxique[26] vive_attaque[28] | gadoue_nume | dessin code | agumon gabumon gomamon palmon biyomon betamon elecmon gotsumon mushroomon kunemon salamon tentomon patamon penguinmon guilmon candlemon | monzaemon |
| sukamon | Sukamon | Champion | Poison | Virus | 72/60/58/60/60 | 15 | 120 | ordure_toxique[0] charge[1] gadoue_nume[1] garde[1] morsure[24] jet_acide[25] parfum[28] boue_toxique[30] | ordure_toxique | dessin code | agumon gabumon gomamon palmon biyomon betamon elecmon gotsumon mushroomon kunemon salamon tentomon patamon penguinmon guilmon candlemon | monzaemon |
| monzaemon | Monzaemon | Ultime | Lumière | Vaccin | 110/100/104/80/100 | 80 | 230 | attaque_coeur[0] charme[1] coup_tete[1] garde[1] couronne_fleurs[36] poing_zero[40] | attaque_coeur | dessin code | numemon sukamon | — |
| wargreymon | WarGreymon | Méga | Feu+Lumière | Vaccin | 115/140/118/105/108 | 70 | 300 | force_gaia[0] tornade_courage[1] giga_destruction[1] mega_flamme[1] bras_trident[50] coup_corne[55] | force_gaia | dessin code | metalgreymon | omegamon |
| metalgarurumon | MetalGarurumon | Méga | Glace | Données | 112/128/116/132/106 | 90 | 300 | souffle_cocyte[0] griffe_garuru[1] flamme_bleue[1] tempete_neige[1] poing_zero[50] vive_attaque[55] | souffle_cocyte | dessin code | weregarurumon | omegamon |
| jijimon | Jijimon (npc) | Ultime | Neutre | Données | 90/60/80/40/120 | 30 | 0 | charge[1] | — | dessin code | — | — |
| tentomon | Tentomon | Disciple | Insecte+Électrique | Vaccin | 55/52/58/48/60 | 8 | 70 | charge[1] super_choc[1] garde[1] electro_fil[10] vive_attaque[14] petit_tonnerre[18] orage[22] | super_choc | dessin code | yokomon motimon | kabuterimon numemon sukamon |
| patamon | Patamon | Disciple | Air+Lumière | Données | 52/50/48/60/62 | 6 | 70 | charge[1] bulle_air[1] grondement[1] vive_attaque[10] tornade[14] vol_plane[18] rayon_sacre[22] | bulle_air | dessin code | tsunomon tokomon | angemon unimon devimon numemon sukamon |
| penguinmon | Penguinmon | Disciple | Glace+Eau | Données | 56/52/54/56/52 | 9 | 70 | charge[1] glissade[1] bulles[1] souffle_glace[10] jet_hydro[14] fleche_glace[18] | glissade | dessin code | bukamon | frigimon numemon sukamon |
| whamon | Whamon (npc) | Champion | Eau | Vaccin | 125/82/88/34/72 | 260 | 260 | charge[1] jet_hydro[1] grande_vague[1] coup_tete[1] jet_arrow[1] | jet_arrow | image (secours = tache grise pendant le chargement) | — | — |
| kabuterimon | Kabuterimon | Champion | Insecte+Électrique | Vaccin | 84/82/86/70/84 | 60 | 150 | mega_decharge[0] electro_choc[1] charge[1] pince[1] vol_plane[22] petit_tonnerre[26] orage[30] | mega_decharge | image (secours = tache grise pendant le chargement) | kunemon tentomon | megakabuterimon andromon |
| angemon | Angemon | Champion | Lumière+Air | Vaccin | 80/84/74/86/90 | 50 | 150 | poing_celeste[0] vol_plane[1] tornade[1] bulle_air[1] canon_aerien[22] fleche_solaire[26] rayon_sacre[28] | poing_celeste | image (secours = tache grise pendant le chargement) | patamon | magnaangemon piximon |
| monochromon | Monochromon | Champion | Terre+Feu | Données | 90/86/94/56/66 | 120 | 150 | frappe_volcan[0] coup_corne[1] charge[1] garde[1] coup_tete[22] souffle_ardent[26] seisme[30] | frappe_volcan | image (secours = tache grise pendant le chargement) | agumon gotsumon | megadramon |
| frigimon | Frigimon | Champion | Glace | Vaccin | 88/84/82/60/76 | 70 | 150 | poing_givre[0] souffle_glace[1] charge[1] garde[1] tempete_neige[22] fleche_glace[26] pics_glace[26] | poing_givre | dessin code | gabumon penguinmon | zudomon |
| leomon | Leomon | Champion | Terre+Feu | Vaccin | 86/94/76/82/74 | 70 | 150 | poing_bete[0] griffe[1] uppercut[1] grondement[1] poing_ardent[22] coup_queue[26] | poing_bete | dessin code | elecmon | etemon |
| ogremon | Ogremon | Champion | Ténèbres+Terre | Virus | 84/92/78/72/62 | 75 | 150 | poing_demon[0] charge[1] grondement[1] morsure[1] coup_tete[22] main_enfers[26] | poing_demon | dessin code | gabumon | etemon |
| seadramon | Seadramon | Champion | Eau+Glace | Données | 88/84/74/76/86 | 90 | 150 | souffle_glacial[0] jet_hydro[1] grande_vague[1] morsure[1] coup_queue[22] tempete_neige[26] | souffle_glacial | dessin code | gomamon betamon | megadramon |
| gekomon | Gekomon | Champion | Eau | Virus | 82/74/80/70/88 | 40 | 150 | symphonie[0] bulles[1] jet_hydro[1] parfum[1] grande_vague[22] charme[26] | symphonie | dessin code | betamon | zudomon |
| drimogemon | Drimogemon | Champion | Terre | Données | 86/88/88/62/64 | 80 | 150 | foreuse[0] charge[1] jet_pierres[1] vrille[1] poing_roc[22] coup_tete[26] | foreuse | image (secours = tache grise pendant le chargement) | gotsumon | andromon |
| unimon | Unimon | Champion | Air+Lumière | Vaccin | 80/82/74/92/84 | 90 | 150 | canon_aerien[0] coup_corne[1] vol_plane[1] tornade[1] charge[22] fleche_solaire[26] | canon_aerien | dessin code | biyomon patamon | piximon |
| centarumon | Centarumon | Champion | Terre+Lumière | Données | 86/80/84/78/90 | 100 | 150 | fleche_solaire[0] charge[1] garde[1] coup_corne[1] jet_pierres[22] poing_roc[26] | fleche_solaire | dessin code | elecmon | andromon |
| bakemon | Bakemon | Champion | Ténèbres | Virus | 76/78/70/82/86 | 5 | 150 | griffe_fantome[0] main_enfers[1] charme[1] morsure[1] parfum[22] sphere_obscure[24] grondement[26] | griffe_fantome | dessin code | mushroomon | skullmeramon |
| devimon | Devimon | Champion | Ténèbres+Air | Virus | 90/96/80/86/96 | 70 | 150 | main_ombre[0] sphere_obscure[0] main_enfers[1] grondement[1] vol_plane[1] morsure[22] concert_noir[26] | main_ombre | dessin code | patamon | megadramon |
| andromon | Andromon | Ultime | Électrique+Terre | Vaccin | 104/112/112/84/96 | 160 | 230 | lame_spirale[0] poing_roc[1] electro_choc[1] garde[1] mega_decharge[38] vrille[42] | lame_spirale | dessin code | kabuterimon centarumon drimogemon | — |
| etemon | Etemon | Ultime | Ténèbres+Terre | Virus | 100/112/96/90/106 | 60 | 230 | concert_noir[0] poing_demon[1] grondement[1] charme[1] main_enfers[38] uppercut[42] | concert_noir | dessin code | leomon ogremon | — |
| skullgreymon | SkullGreymon | Ultime | Ténèbres+Feu | Virus | 98/124/92/82/88 | 150 | 230 | missile_noir[0] morsure[1] coup_corne[1] griffe[1] mega_flamme[38] main_enfers[42] | missile_noir | dessin code | greymon | — |
| megadramon | Megadramon | Ultime | Air+Ténèbres | Virus | 100/120/96/98/96 | 140 | 230 | salve_destructrice[0] vol_plane[1] morsure[1] coup_queue[1] souffle_ardent[38] main_ombre[42] | salve_destructrice | dessin code | monochromon seadramon devimon | — |
| piximon | Piximon | Ultime | Lumière+Air | Données | 92/96/90/120/112 | 5 | 230 | bombe_pixie[0] vive_attaque[1] charme[1] canon_aerien[1] fleche_solaire[38] couronne_fleurs[42] | bombe_pixie | dessin code | angemon unimon | — |
| guilmon | Guilmon | Disciple | Feu | Virus | 58/64/50/54/50 | 12 | 72 | griffe[1] grondement[1] pyro_sphere[1] vive_attaque[10] morsure[13] coup_tete[16] souffle_ardent[19] mega_flamme[22] | pyro_sphere | dessin code | koromon | flarizamon numemon sukamon |
| candlemon | Candlemon | Disciple | Feu | Données | 52/50/48/50/66 | 6 | 66 | charge[1] flamme_follet[1] garde[1] flamme_bebe[10] bombe_paraffine[13] flamme_spirale[16] souffle_ardent[19] boule_feu[22] | bombe_paraffine | dessin code | yokomon | meramon numemon sukamon |
| flarizamon | Flarizamon | Champion | Feu+Terre | Vaccin | 80/94/72/78/70 | 55 | 152 | morsure_ardente[0] poing_lave[1] souffle_ardent[1] grondement[1] mega_flamme[24] coup_queue[28] poing_ardent[32] | morsure_ardente | dessin code | guilmon | skullmeramon |
| pabumon | Pabumon | Bébé | Neutre | Données | 40/34/36/40/42 | 1 | 28 | charge[1] bulles[1] garde[3] bulles_acides[5] | bulles | image (secours = tache grise pendant le chargement) | — | motimon |
| poyomon | Poyomon | Bébé | Neutre | Données | 42/34/36/42/38 | 1 | 28 | charge[1] bulles[1] grondement[3] bulles_acides[5] | bulles_acides | image (secours = tache grise pendant le chargement) | — | tokomon tanemon |
| motimon | Mochimon | Entraînement | Électrique | Données | 44/40/44/44/52 | 4 | 45 | charge[1] bulles[1] garde[4] bulle_explosive[6] vive_attaque[8] coup_tete[10] | bulles | dessin code | pabumon | tentomon kunemon |
| tokomon | Tokomon | Entraînement | Lumière | Vaccin | 48/46/42/48/42 | 4 | 45 | charge[1] bulles[1] grondement[4] morsure[6] vive_attaque[8] bulle_explosive[10] | bulles | dessin code | poyomon | patamon elecmon |
| yukimibotamon | YukimiBotamon | Bébé | Glace | Données | 40/34/38/40/42 | 1 | 28 | charge[1] bulles[1] flocon[3] garde[5] | bulles | image (secours = tache grise pendant le chargement) | — | nyaromon |
| nyaromon | Nyaromon | Entraînement | Lumière | Vaccin | 46/44/42/50/48 | 4 | 45 | charge[1] bulles[1] grondement[4] rayon[6] vive_attaque[8] morsure[10] | bulles | dessin code | yukimibotamon | salamon |
| pyocomon | Pyocomon | Entraînement | Plante+Air | Données | 45/42/40/50/46 | 3 | 45 | charge[1] bulles[1] parfum[4] feuille[6] picorage[8] bulle_explosive[10] | bulles | dessin code | nyokimon | biyomon |
| salamon | Salamon | Disciple | Lumière | Vaccin | 54/50/50/60/62 | 6 | 70 | charge[1] cri_chiot[1] grondement[1] vive_attaque[10] morsure[13] rayon[16] charme[19] prisme[22] | cri_chiot | dessin code | nyaromon | gatomon numemon sukamon |
| gatomon | Gatomon | Champion | Lumière | Vaccin | 76/86/70/98/88 | 7 | 150 | griffe_eclair[0] vive_attaque[1] charme[1] morsure[1] rayon_sacre[22] poing_celeste[26] prisme[30] | griffe_eclair | dessin code | salamon | angewomon |
| angewomon | Angewomon | Ultime | Lumière+Air | Vaccin | 96/100/90/112/120 | 45 | 230 | fleche_celeste[0] rayon_sacre[1] charme[1] aura_soin[1] jugement[38] canon_aerien[42] | fleche_celeste | dessin code | gatomon | ophanimon magnadramon |
| ophanimon | Ophanimon | Méga | Lumière | Vaccin | 112/112/120/118/138 | 60 | 300 | lumiere_eden[0] jugement[1] fleche_celeste[1] aura_soin[1] prisme[50] rayon_sacre[55] | lumiere_eden | dessin code | angewomon | — |
| magnadramon | Magnadramon | Méga | Lumière+Feu | Vaccin | 120/126/112/116/120 | 300 | 300 | feu_sacre[0] jugement[1] ombre_ailee[1] cyclone[1] rayon_sacre[50] meteore[55] | feu_sacre | dessin code | angewomon | — |
| megakabuterimon | MegaKabuterimon | Ultime | Insecte+Électrique | Vaccin | 110/116/116/70/96 | 200 | 230 | corne_explosive[0] mega_decharge[1] pince[1] carapace[1] orage[38] seisme[42] | corne_explosive | dessin code | kabuterimon | — |
| magnaangemon | MagnaAngemon | Ultime | Lumière+Air | Vaccin | 102/112/100/104/114 | 70 | 230 | porte_destin[0] poing_celeste[1] rayon_sacre[1] canon_aerien[1] jugement[38] fleche_solaire[42] | porte_destin | dessin code | angemon | — |
| omegamon | Omegamon | Méga | Lumière+Glace | Vaccin | 130/145/130/125/120 | 120 | 400 | epee_transcendante[0] souffle_cocyte[1] force_gaia[1] griffe_garuru[1] jugement[60] giga_destruction[65] | epee_transcendante | dessin code | wargreymon metalgarurumon | — |

## Annexe B — Conditions des 132 Digivolutions (après les réglages automatiques de `data/evolutions.js` et `data/ecussons.js`)

Plafond = plafond d’entraînement par stat au niveau minimal demandé, avec l’ABI minimal du chemin ; écusson = condition ajoutée par `DW.Crests.requirement`.

| de | vers | niv | conditions | plafond entr. au niv (ABI min) | écusson | remarque |
|---|---|---|---|---|---|---|
| botamon | koromon | 5 | wins 2 | 25 (ABI 0) |  |  |
| punimon | tsunomon | 5 | wins 2 | 25 (ABI 0) |  |  |
| pichimon | bukamon | 5 | wins 2 | 25 (ABI 0) |  |  |
| yuramon | tanemon | 5 | wins 2 | 25 (ABI 0) |  |  |
| nyokimon | pyocomon | 5 | wins 2 | 25 (ABI 0) |  |  |
| nyokimon | yokomon | 5 | wins 2 | 25 (ABI 0) |  |  |
| pyocomon | biyomon | 7 | spd 10, wins 3 | 35 (ABI 1) |  |  |
| yukimibotamon | nyaromon | 5 | wins 2 | 25 (ABI 0) |  |  |
| nyaromon | salamon | 7 | int 10, wins 3 | 35 (ABI 1) |  |  |
| koromon | agumon | 7 | atk 10, wins 3 | 35 (ABI 1) |  |  |
| koromon | gabumon | 7 | def 10, wins 3 | 35 (ABI 1) |  |  |
| koromon | guilmon | 7 | atk 8, spd 8, wins 3 | 35 (ABI 1) |  |  |
| tsunomon | gabumon | 7 | def 10, wins 3 | 35 (ABI 1) |  |  |
| tsunomon | elecmon | 7 | spd 10, wins 3 | 35 (ABI 1) |  |  |
| tsunomon | gotsumon | 7 | hp 10, wins 3 | 35 (ABI 1) |  |  |
| tsunomon | patamon | 7 | spd 8, int 8, wins 3 | 35 (ABI 1) |  |  |
| bukamon | gomamon | 7 | def 10, wins 3 | 35 (ABI 1) |  |  |
| bukamon | betamon | 7 | int 10, wins 3 | 35 (ABI 1) |  |  |
| bukamon | penguinmon | 7 | spd 10, wins 3 | 35 (ABI 1) |  |  |
| tanemon | palmon | 7 | int 10, wins 3 | 35 (ABI 1) |  |  |
| tanemon | mushroomon | 7 | atk 10, wins 3 | 35 (ABI 1) |  |  |
| yokomon | biyomon | 8 | spd 12, wins 3 | 38 (ABI 1) |  |  |
| yokomon | kunemon | 8 | int 12, wins 3 | 38 (ABI 1) |  |  |
| yokomon | tentomon | 8 | def 12, wins 3 | 38 (ABI 1) |  |  |
| yokomon | candlemon | 8 | hp 12, wins 3 | 38 (ABI 1) |  |  |
| agumon | greymon | 15 | atk 28, wins 10, mistakesMax 4, fatMin 0 | 63 (ABI 2) |  |  |
| agumon | meramon | 15 | int 28, wins 10, mistakesMax 4, fatMax 1 | 63 (ABI 2) |  |  |
| agumon | monochromon | 18 | def 28, hp 14, wins 10, mistakesMax 4 | 72 (ABI 2) |  |  |
| agumon | numemon | 14 | mistakes 5 | 60 (ABI 2) |  |  |
| agumon | sukamon | 14 | mistakes 8 | 60 (ABI 2) |  |  |
| gabumon | garurumon | 15 | spd 26, def 12, wins 10, mistakesMax 4, fatMax 3 | 63 (ABI 2) |  |  |
| gabumon | frigimon | 18 | hp 28, def 14, wins 10, mistakesMax 4 | 72 (ABI 2) |  |  |
| gabumon | ogremon | 18 | atk 24, mistakes 3 | 72 (ABI 2) |  | aucune victoire demandée |
| gabumon | numemon | 14 | mistakes 5 | 60 (ABI 2) |  |  |
| gabumon | sukamon | 14 | mistakes 8 | 60 (ABI 2) |  |  |
| gomamon | ikkakumon | 15 | def 28, wins 10, mistakesMax 4, fatMin 1 | 63 (ABI 2) |  |  |
| gomamon | shellmon | 15 | def 24, hp 24, mistakesMax 4, fatMin 3 | 63 (ABI 2) |  | aucune victoire demandée |
| gomamon | seadramon | 18 | int 26, spd 14, wins 10, mistakesMax 4 | 72 (ABI 2) |  |  |
| gomamon | numemon | 14 | mistakes 5 | 60 (ABI 2) |  |  |
| gomamon | sukamon | 14 | mistakes 8 | 60 (ABI 2) |  |  |
| palmon | togemon | 15 | int 28, wins 10, mistakesMax 4, fatMin 2 | 63 (ABI 2) |  |  |
| palmon | numemon | 14 | mistakes 5 | 60 (ABI 2) |  |  |
| palmon | sukamon | 14 | mistakes 8 | 60 (ABI 2) |  |  |
| biyomon | birdramon | 15 | spd 28, wins 10, mistakesMax 4, fatMax 2 | 63 (ABI 2) |  |  |
| biyomon | meramon | 15 | atk 28, wins 10, mistakesMax 4 | 63 (ABI 2) |  |  |
| biyomon | unimon | 18 | spd 26, int 14, wins 10, mistakesMax 4 | 72 (ABI 2) |  |  |
| biyomon | numemon | 14 | mistakes 5 | 60 (ABI 2) |  |  |
| biyomon | sukamon | 14 | mistakes 8 | 60 (ABI 2) |  |  |
| betamon | shellmon | 15 | hp 24, wins 10, mistakesMax 4, fatMin 3 | 63 (ABI 2) |  |  |
| betamon | seadramon | 18 | int 28, wins 10, mistakesMax 4 | 72 (ABI 2) |  |  |
| betamon | gekomon | 18 | int 22, hp 18, wins 10, mistakesMax 4 | 72 (ABI 2) |  |  |
| betamon | numemon | 14 | mistakes 5 | 60 (ABI 2) |  |  |
| betamon | sukamon | 14 | mistakes 8 | 60 (ABI 2) |  |  |
| elecmon | garurumon | 15 | spd 28, wins 10, mistakesMax 4, fatMax 3 | 63 (ABI 2) |  |  |
| elecmon | leomon | 18 | atk 28, wins 12, mistakesMax 4 | 72 (ABI 2) |  |  |
| elecmon | centarumon | 18 | int 26, def 14, wins 10, mistakesMax 4 | 72 (ABI 2) |  |  |
| elecmon | numemon | 14 | mistakes 5 | 60 (ABI 2) |  |  |
| elecmon | sukamon | 14 | mistakes 8 | 60 (ABI 2) |  |  |
| gotsumon | meramon | 15 | atk 28, hp 12, wins 10, mistakesMax 4, fatMax 2 | 63 (ABI 2) |  |  |
| gotsumon | monochromon | 18 | def 28, wins 10, mistakesMax 4 | 72 (ABI 2) |  |  |
| gotsumon | drimogemon | 18 | atk 22, def 20, wins 10, mistakesMax 4 | 72 (ABI 2) |  |  |
| gotsumon | numemon | 14 | mistakes 5 | 60 (ABI 2) |  |  |
| gotsumon | sukamon | 14 | mistakes 8 | 60 (ABI 2) |  |  |
| mushroomon | togemon | 15 | def 26, wins 10, mistakesMax 4, fatMin 1 | 63 (ABI 2) |  |  |
| mushroomon | bakemon | 18 | int 26, wins 10, mistakesMax 4 | 72 (ABI 2) |  |  |
| mushroomon | numemon | 14 | mistakes 5 | 60 (ABI 2) |  |  |
| mushroomon | sukamon | 14 | mistakes 8 | 60 (ABI 2) |  |  |
| kunemon | kuwagamon | 16 | atk 30, wins 10, mistakesMax 4, fatMax 2 | 66 (ABI 2) |  |  |
| kunemon | kabuterimon | 18 | def 26, wins 10, mistakesMax 4 | 72 (ABI 2) |  |  |
| kunemon | numemon | 14 | mistakes 5 | 60 (ABI 2) |  |  |
| kunemon | sukamon | 14 | mistakes 8 | 60 (ABI 2) |  |  |
| salamon | gatomon | 15 | spd 26, int 12, wins 10, mistakesMax 4 | 63 (ABI 2) |  |  |
| salamon | numemon | 14 | mistakes 5 | 60 (ABI 2) |  |  |
| salamon | sukamon | 14 | mistakes 8 | 60 (ABI 2) |  |  |
| gatomon | angewomon | 32 | int 50, spd 30, happy 70, wins 40, mistakesMax 2, disc 50 | 99 (ABI 3) | AUCUN | Ultime SANS écusson |
| angewomon | ophanimon | 45 | int 64, def 50, happy 90, wins 80, mistakesMax 1, disc 80 | 99 (ABI 4) | Écussons réunis |  |
| angewomon | magnadramon | 45 | atk 64, int 50, happy 90, wins 80, mistakesMax 1, disc 80 | 99 (ABI 4) | Écussons réunis |  |
| kabuterimon | megakabuterimon | 32 | def 50, int 30, happy 70, wins 40, mistakesMax 2, disc 50 | 99 (ABI 3) | AUCUN | Ultime SANS écusson |
| kabuterimon | andromon | 32 | def 50, int 30, happy 60, wins 40, mistakesMax 2, disc 50 | 99 (ABI 3) | Écusson izzy |  |
| angemon | magnaangemon | 32 | int 50, spd 30, happy 70, wins 40, mistakesMax 2, disc 50 | 99 (ABI 3) | AUCUN | Ultime SANS écusson |
| angemon | piximon | 32 | int 50, spd 30, happy 70, wins 40, mistakesMax 2, disc 50 | 99 (ABI 3) | Écusson tk |  |
| wargreymon | omegamon | 55 | fusion metalgarurumon, happy 90, wins 100, mistakesMax 1, disc 80 | 99 (ABI 5) | Écussons réunis |  |
| metalgarurumon | omegamon | 55 | fusion wargreymon, happy 90, wins 100, mistakesMax 1, disc 80 | 99 (ABI 5) | Écussons réunis |  |
| greymon | metalgreymon | 32 | atk 50, def 30, happy 70, wins 40, mistakesMax 2, disc 50 | 99 (ABI 3) | Écusson tai |  |
| greymon | skullgreymon | 32 | atk 50, mistakes 3 | 99 (ABI 3) | Écusson tai | aucune victoire demandée |
| metalgreymon | wargreymon | 45 | atk 64, def 50, happy 90, wins 80, mistakesMax 1, disc 80 | 99 (ABI 4) | Écussons réunis |  |
| ikkakumon | zudomon | 32 | def 50, hp 30, happy 70, wins 40, mistakesMax 2, disc 50, fatMin 3 | 99 (ABI 3) | Écusson joe |  |
| garurumon | weregarurumon | 32 | spd 50, atk 30, happy 70, wins 40, mistakesMax 2, disc 50 | 99 (ABI 3) | Écusson matt |  |
| weregarurumon | metalgarurumon | 45 | spd 64, atk 50, happy 90, wins 80, mistakesMax 1, disc 80 | 99 (ABI 4) | Écussons réunis |  |
| meramon | skullmeramon | 32 | int 50, atk 30, happy 50, wins 40, mistakesMax 2, disc 50 | 99 (ABI 3) | Écusson sora |  |
| birdramon | garudamon | 32 | spd 50, hp 30, happy 70, wins 40, mistakesMax 2, disc 50 | 99 (ABI 3) | Écusson sora |  |
| kuwagamon | okuwamon | 32 | atk 50, def 30, wins 40, mistakesMax 2, disc 50 | 99 (ABI 3) | Écusson izzy |  |
| shellmon | zudomon | 32 | def 50, hp 30, happy 70, wins 40, mistakesMax 2, disc 50 | 99 (ABI 3) | Écusson joe |  |
| numemon | monzaemon | 28 | happy 90, disc 70, wins 40 | 99 (ABI 3) | Écusson mimi |  |
| sukamon | monzaemon | 28 | happy 95, disc 80, wins 50 | 99 (ABI 3) | Écusson mimi |  |
| togemon | lillymon | 32 | int 50, spd 30, happy 70, wins 40, mistakesMax 2, disc 50 | 99 (ABI 3) | Écusson mimi |  |
| tentomon | kabuterimon | 15 | def 26, int 14, wins 10, mistakesMax 4 | 63 (ABI 2) |  |  |
| tentomon | numemon | 14 | mistakes 5 | 60 (ABI 2) |  |  |
| tentomon | sukamon | 14 | mistakes 8 | 60 (ABI 2) |  |  |
| patamon | angemon | 15 | int 28, wins 10, mistakesMax 4 | 63 (ABI 2) |  |  |
| patamon | unimon | 18 | spd 28, wins 10, mistakesMax 4 | 72 (ABI 2) |  |  |
| patamon | devimon | 18 | atk 26, mistakes 3 | 72 (ABI 2) |  | aucune victoire demandée |
| patamon | numemon | 14 | mistakes 5 | 60 (ABI 2) |  |  |
| patamon | sukamon | 14 | mistakes 8 | 60 (ABI 2) |  |  |
| penguinmon | frigimon | 15 | hp 26, wins 10, mistakesMax 4 | 63 (ABI 2) |  |  |
| penguinmon | numemon | 14 | mistakes 5 | 60 (ABI 2) |  |  |
| penguinmon | sukamon | 14 | mistakes 8 | 60 (ABI 2) |  |  |
| centarumon | andromon | 32 | int 50, def 30, happy 60, wins 40, mistakesMax 2, disc 50 | 99 (ABI 3) | Écusson izzy |  |
| drimogemon | andromon | 32 | atk 48, def 40, wins 40, mistakesMax 2, disc 50 | 99 (ABI 3) | Écusson izzy |  |
| monochromon | megadramon | 32 | atk 50, def 30, wins 40, mistakesMax 2, disc 50 | 99 (ABI 3) | Écusson matt |  |
| seadramon | megadramon | 32 | int 50, spd 30, wins 40, mistakesMax 2, disc 50 | 99 (ABI 3) | Écusson matt |  |
| devimon | megadramon | 32 | atk 50, int 30, wins 40, mistakesMax 2, disc 50 | 99 (ABI 3) | Écusson matt |  |
| unimon | piximon | 32 | spd 50, int 30, happy 70, wins 40, mistakesMax 2, disc 50 | 99 (ABI 3) | Écusson tk |  |
| leomon | etemon | 32 | atk 50, hp 30, wins 40, mistakesMax 2, disc 50 | 99 (ABI 3) | Écusson tai |  |
| ogremon | etemon | 32 | atk 50, wins 40, mistakesMax 2, disc 50 | 99 (ABI 3) | Écusson tai |  |
| frigimon | zudomon | 32 | hp 50, def 30, happy 60, wins 40, mistakesMax 2, disc 50 | 99 (ABI 3) | Écusson joe |  |
| gekomon | zudomon | 32 | int 46, def 30, wins 40, mistakesMax 2, disc 50 | 99 (ABI 3) | Écusson joe |  |
| bakemon | skullmeramon | 32 | int 50, wins 40, mistakesMax 2, disc 50 | 99 (ABI 3) | Écusson sora |  |
| guilmon | flarizamon | 15 | atk 28, wins 10, mistakesMax 4 | 63 (ABI 2) |  |  |
| guilmon | numemon | 14 | mistakes 5 | 60 (ABI 2) |  |  |
| guilmon | sukamon | 14 | mistakes 8 | 60 (ABI 2) |  |  |
| candlemon | meramon | 15 | int 28, wins 10, mistakesMax 4 | 63 (ABI 2) |  |  |
| candlemon | numemon | 14 | mistakes 5 | 60 (ABI 2) |  |  |
| candlemon | sukamon | 14 | mistakes 8 | 60 (ABI 2) |  |  |
| flarizamon | skullmeramon | 32 | atk 50, hp 30, wins 40, mistakesMax 2, disc 50 | 99 (ABI 3) | Écusson sora |  |
| pabumon | motimon | 5 | wins 2 | 25 (ABI 0) |  |  |
| poyomon | tokomon | 5 | wins 2 | 25 (ABI 0) |  |  |
| poyomon | tanemon | 5 | wins 2 | 25 (ABI 0) |  |  |
| motimon | tentomon | 7 | int 10, wins 3 | 35 (ABI 1) |  |  |
| motimon | kunemon | 7 | spd 10, wins 3 | 35 (ABI 1) |  |  |
| tokomon | patamon | 7 | spd 10, wins 3 | 35 (ABI 1) |  |  |
| tokomon | elecmon | 7 | atk 10, wins 3 | 35 (ABI 1) |  |  |
