# Rapport du relecteur « Digimon des chapitres 1 à 3 » (21/10) — état après corrections
(« FAIT » = corrigé et vérifié cette nuit ; le reste est à faire ou à décider.)

OK : 70 espèces (63 dessins + 7 images), aucune technique ni évolution vers une espèce absente, 68 espèces du Dex
atteignables, 7 lignées des enfants (DW.HERO_LINE) correctes, 158 techniques avec animation, orientation à droite
partout (sauf cinématiques, corrigées).

BLOQUANT (hors Digimon) : FAIT — l'onglet ENGRENAGES du Journal plantait (story.js : variable lue avant sa déclaration).

## IMPORTANT
1. À FOURNIR — images de Bukamon : la planche BUKAMON.jpg montre un lézard debout en couche-culotte (62-69 × 168 px) ;
   dans l'animé, Bukamon est un bébé phoque (Entraînement, lignée de Gomamon). Il faut une nouvelle planche.
2. À FOURNIR / DÉCIDER — tailles dans un même stade : bébés en combat Botamon 24 px, Pichimon 24, Yuramon 30 (dessins)
   contre Poyomon 32, Punimon 32, Pabumon 37, Nyokimon 38 (images) ; sur la carte, Pabumon 19,5 et Nyokimon 20 > Motimon
   18,5 ; Motimon 37 px = le plus petit Entraînement (Yokomon 54). À régler quand les images manquantes seront faites
   (gfx/sprites.js : tailles par stade).
3. FAIT — renaissance et dé-digivolution : un Digimon garde son parcours (les formes qu'il a été, sauvegardé) ; il
   renaît en son propre bébé et dé-digivolue en sa forme d'avant ; sans passé connu (recrue, ancienne partie), la
   lignée de l'animé (Gabumon ← Tsunomon ← Punimon, Tentomon ← Motimon ← Pabumon, Patamon ← Tokomon ← Poyomon).
4. FAIT — coups spéciaux ajoutés : Guilmon (Pyro-Sphère), Candlemon (Bombe de Paraffine), Flarizamon (Morsure Ardente),
   Pabumon (Bulles), Poyomon (Bulles Acides), Motimon et Tokomon (Bulles, comme les autres Entraînement).
5. FAIT — Tentomon, Patamon et Penguinmon atteignent leur Champion principal au niveau 15 comme les autres (avant 18).
6. FAIT — Kuwagamon ne vole plus à reculons dans la scène d'ouverture.
7. FAIT — pêche : Shellmon (boss du chapitre 1) et Gomamon ne mordent qu'à partir du chapitre 2 ; le Digimon qui mord a
   le niveau des Digimon sauvages du coin (avant : N.5-7 partout hors régions).
8. FAIT — Champi-Bombe devient Poison (comme les autres techniques toxiques).

## MINEUR
- FAIT — cinématiques : Seadramon fait face à l'île et à Garurumon, Kuwagamon vaincu fait face au partenaire.
- FAIT — cadre 64×64 : les 38 dessins qui dépassaient (queue de Greymon, cornes de Kabuterimon, aile de Birdramon,
  massue d'Ogremon...) sont réduits juste ce qu'il faut et recentrés (gfx/sprites.js, CADRE ; mesure :
  DW.Sprites.mesurerCadres()). Avant, 22 dessins touchaient le bord en combat ; après, aucun.
- FAIT — alliés visibles en combat (Greymon, Garurumon, Birdramon à côté du partenaire).
- FAIT — Orage, Séisme, Tempête de Pétales de nouveau proposées en classe ; Meramon (boss N.30) garde son Poing Ardent
  (plus de Flamme Bébé ni de Souffle Ardent en double) ; Birdramon sans Spirale Magique en double ; Shellmon n'apprend
  plus le Marteau Boomerang (technique de Zudomon).
- À DÉCIDER — Koromon (Feu), Motimon (Électrique), Tokomon (Lumière) n'ont pas de technique de leur élément ;
  Gabumon est de type Glace alors que son Souffle Bleu est un feu bleu.
- FAIT — négligence : Tentomon, Patamon, Penguinmon, Guilmon et Candlemon peuvent devenir Numemon ou Sukamon.
- À FAIRE — textes : Punimon « trois pointes jaunes » (data/species.js), Nyokimon « bourgeon sur pattes » (species.js,
  maps/village.js) ; la planche de Nyokimon s'appelle NYAKOMON.jpg (dev/optimiser_textures.py).
- FAIT — code mort : anciens dessins de Gabumon / Garurumon / WereGarurumon retirés (85 lignes ; les 64 dessins
  utilisés sont identiques). À FAIRE : espèces inexistantes citées (pagumon dans maps/village.js, tyrannomon dans
  data/techniques_elements.js) ; 13 espèces absentes de la liste des Digimon nocturnes (game/life.js).
- À DÉCIDER — rencontres : de jeunes Kuwagamon sauvages à la Clairière au niveau du boss (voulu : « ils rôdent ») ;
  Monochromon sauvage N.20-22 sur la Rive Sud avant le combat (N.21) ; Entraînement jusqu'au N.10-13 ; Champions 24 à
  36 % au chapitre 2 (47 % au fond du lac de 5 h à 9 h).
- À FAIRE — 7 espèces en images sans dessin de secours (boule grise tant que l'image n'est pas chargée) ; Koromon en
  pixel art à côté des Digimon peints.

## IMAGES À FOURNIR (4 vues tournées vers la droite, sur fond vert : combat de 3/4, profil, face, dos)
- P1 : Bukamon (à refaire), Botamon, Pichimon, Yuramon, Tanemon, Yokomon, Motimon, Tokomon, Agumon, Gabumon, Biyomon,
  Palmon, Tentomon, Gomamon, Patamon.
- P2 : Kuwagamon, Shellmon, Meramon, Monochromon, Seadramon, Greymon, Garurumon, Birdramon, Whamon.
- P3 : Kunemon, Mushroomon, Elecmon, Betamon, Gotsumon, Penguinmon, Gekomon, Guilmon, Candlemon, Flarizamon, Jijimon.
- P4 : Togemon, Ikkakumon, Kabuterimon, Angemon, Numemon, Sukamon, Frigimon, Ogremon, Leomon, Centarumon, Drimogemon,
  Unimon, Devimon, Bakemon.
