# Journal des versions

Le jeu est publié en continu : chaque lot vérifié part sur `main` et sur le site
(https://kronos4322.github.io/digimon-ile-des-fichiers/). Ce journal résume, pour le joueur, ce qui change d'un lot à
l'autre. Le détail de chaque correction est dans `docs/audit/BUGS_ET_CORRECTIONS.md`, l'historique complet dans git.

## 24/10/2026 — Falaises, bords de sable, fondus entre cartes, petits défauts d'image

### Petits défauts d'image (2a5548b)
- Digimon : plus de trous d'épingle ni de liseré pâle au contour (37 576 petits trous sur les 116 vues, 169 restent : de
  vrais petits jours du dessin), plus de liseré olive sur les Digimon orange et jaunes (Birdramon, Meramon, Agumon).
- Combat : les poses d'attaque et de recul ne sont plus coupées par le cadre ; sur la carte et en combat, le haut de la
  tête n'est plus coupé quand le Digimon s'étire en respirant ou en marchant.
- Objets : plus de liseré verdâtre au contour (jardinières, étal de fruits, objets des villages de bébés, du désert et
  de la grotte) ; la porte du tombeau perd le trait lumineux d'une image voisine.
- Habillage du personnage : plus de grains de poussière verte.

### Falaises des prairies (5653316)
- Quartier des Champs, Lisière du Ravin, Ville des Fichiers : les falaises sont une vraie paroi de roche grise moussue,
  tirée de la planche Montagnes du joueur (avant : une bande d'herbe unie et plate au-dessus d'un muret de pavés). Une
  version par hauteur de falaise (1 à 4 cases), sans motif qui se répète avant 15 cases ; la mousse prend la couleur de
  l'herbe de la carte ; les bouts de la paroi sont arrondis et irréguliers au lieu d'être coupés droit.
- Cascade des Champs : l'eau coule sur la paroi, entre deux bandes de roche mouillée (avant : deux blocs de pierre claire
  posés devant la falaise).

### Sols (5653316)
- Herbe ↔ sable et terre ↔ sable : le bord est fondu (touffes d'herbe, grains de sable, sur 3 à 4 pixels) au lieu d'une
  ligne nette.
- Fondus entre cartes voisines : calculés sur les images de sol réellement affichées, et non plus sur les anciennes
  couleurs. Avant, 30 paires de cartes voisines avaient un fondu d'herbe faux ; par exemple, le Sentier et les Géants,
  qui ont la même herbe, étaient décalés quand même.

## 22/10/2026 — Audit intégral : corrections

### Falaises de la plage (32798c7)
- Plage des Cabines, Crique, Dunes : une vraie falaise de grès en couches, avec son rebord d'herbe et son pied dans le
  sable (avant : une bande d'herbe unie au-dessus d'un muret de pavés gris).

### Renaissance
- Un Digimon qui renaît garde son ABI (avant : remis à zéro), dans sa lignée comme dans une autre.

### Volcan, options, bébés (905a766, 38a2614, 2220674, 69aeb0c)
- Images du volcan 16 fois plus légères (2,96 Mo -> 187 Ko), chargées en arrière-plan : 8,3 Mo à télécharger avant de
  jouer au lieu de 11,2 Mo. Une carte n'est jamais dessinée avant l'arrivée de ses images.
- Parois des souterrains du volcan sans bandes horizontales ; dalles de la grotte sans couture.
- Options : volumes de la musique et des bruitages réglables à part.
- Botamon, Pichimon et YukimiBotamon à la taille des autres bébés.
- Les techniques d'une version plus récente du jeu sont gardées dans la sauvegarde au lieu d'être effacées.
- Le gardien du Grand Arbre vaincu compte pour les demandes des habitants.

### Images (7b2ae96)
- Yeux d'Agumon et de Palmon : l'iris vert n'est plus troué (on voyait le décor à travers l'œil) ; griffes de Palmon nettes.
- Yuramon (combat) et Togemon (profil) regardent du bon côté.
- 30 objets ne perdent plus leurs verts au détourage : jardinières de la ville, trèfles, trampoline, buisson fleuri,
  haie, tape-cul, toboggan, balançoire, tunnel, herbe des dunes, palmier, auvent de l'étal de fruits, portail du vent du
  Gymnase...
- Arbres nets : copiés à la taille où le jeu les dessine (210 px de haut au lieu de 111 à 143).

### Écran titre (a66a8c0)
- L'écusson « DIGITAL DIGIMON MONSTERS ™ », qui imitait le logo officiel, est effacé de l'image peinte ; le jeu dessine
  son propre titre en pixel art : « UNE AVENTURE DIGIMON » et « L'ÎLE DES FICHIERS ».

### Cartes (94b9945, a4e0391)
- Maison de Penguinmon : la sortie ramène devant sa porte (avant : à ~37 cases).
- L'arbre creux de la Prairie (entrée du Village des Poyomon) est toujours au même endroit.
- Souterrain de Jijimon : l'escalier n'arrive plus dans un mur.
- Plus de panneaux qui parlent de décors disparus (bottes de foin, poteaux de la ville).
- Sorties dégagées (deux arbres retirés), passage Prairie ↔ Village des Bébés sans voie morte, sortie vers le Terrain
  d'entraînement de la bonne largeur, passage du lac qui ne se refermera pas au chapitre 4.
- Grotte de Sora : le texte du pont se lit depuis le pont ; le rocher et l'échelle suivent toujours l'histoire.

### Digimon et combats (52ebfcc)
- L'ABI ne se gagne plus en boucle (Digivolution / dé-digivolution) : une fois par forme.
- Le mode d'entraînement « Statistique » n'est plus démesuré (1,25 fois le mode Digivolution, au lieu de 4,6).
- MegaKabuterimon, MagnaAngemon et Angewomon demandent leur écusson, comme les autres Ultimes.
- Un objet de Digivolution ne fait plus changer de lignée à la dé-digivolution ou à la renaissance.
- Etemon et Megadramon s'obtiennent enfin ; Gomamon → Shellmon demande 10 victoires.
- Un Digimon K.O. ne peut plus digivoluer ni être relevé par une puce.
- Le sommeil fait perdre 2 actions ; la Lutte est toujours proposée ; le combat du Dojo d'Elecmon est amical.
- Les Bits dépendent du plus haut niveau des participants ; demi-EXP pour ceux restés au fond.
- Koromon a une technique de Feu (79 % de victoires contre les autres Entraînement, au lieu de 22 %).
- Birdramon, Garurumon et les autres formes agiles s'obtiennent sans affamer son Digimon.
- Textes des objets justes (puces, équipements, Gâteau de fête), fruits utiles, Gants de flamme invendables.

### Sauvegardes, objets, son, quêtes (e862fe0, 21a6651)
- Fin de chapitre : la partie est sauvegardée dès le nouveau chapitre. Fermer le jeu pendant le bilan bloquait la partie
  pour toujours ; les parties touchées sont réparées au chargement.
- Une sauvegarde abîmée ne fait plus disparaître ta partie ; FICHIER ne perd plus la partie qu'il remplace ; deux
  nouvelles parties sur le même emplacement gardent les deux anciennes (◀ ▶ dans CONTINUER).
- Sac plein : une récompense part au coffre de ta maison (la nourriture au frigo) ; la Canne à pêche n'est plus perdue.
- Un objet de Digivolution d'Ultime demande son écusson ; Champignon de luxe plus rare ; prime de revanche de Shellmon une
  fois par jour ; les demandes de statistiques des habitants demandent un vrai entraînement.
- Son : plus de rafale de notes après un ralentissement, son coupé quand le jeu est caché, musique de la carte après un
  jingle, harmonica de Matt après un combat, musique du Pays de Meramon.
- Supprimer la partie en cours ramène à l'écran titre.

### Outils et documents
- Tests : 71 tests automatiques (`node dev/tests.js`), relancés par GitHub à chaque envoi ; parcours de joueur dans un vrai
  Chrome (`node dev/e2e/parcours.js`, aussi sur le site en ligne) ; essai de 6 formats d'écran (`node dev/e2e/ecrans.js`).
- Documents de l'audit dans `docs/audit/` : rapports, graphe des connexions des cartes, matrice des contenus, plan de
  tests, liste de contrôle de publication, registre des anomalies.

## 21-22/10/2026 — avant l'audit

- Lanceur `JOUER.bat` : le jeu en ligne dans sa propre fenêtre, raccourci sur le Bureau ; ouvrir `index.html` par un
  double-clic renvoie vers le site (le navigateur y interdisait de lire les images).
- Images du dossier commun en WebP : 5,2 Mo à télécharger au lieu de 15,9 Mo.
- Nouvelles planches de Digimon du joueur (Agumon, Greymon, Garurumon, Birdramon, Kabuterimon, Togemon, Ikkakumon,
  Angemon, Monochromon, Drimogemon, Meramon, Koromon, bébés en pixel art...).
- Personnages : un bas d'un seul tenant pour tous, gants retournés.
- Démarrage blindé ; salle de classe rangée ; un panneau par appareil au Terrain d'entraînement ; collisions au pied de
  chaque décor ; lignées de la série.
