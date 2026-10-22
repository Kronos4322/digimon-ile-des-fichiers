# Journal des versions

Le jeu est publié en continu : chaque lot vérifié part sur `main` et sur le site
(https://kronos4322.github.io/digimon-ile-des-fichiers/). Ce journal résume, pour le joueur, ce qui change d'un lot à
l'autre. Le détail de chaque correction est dans `docs/audit/BUGS_ET_CORRECTIONS.md`, l'historique complet dans git.

## 22/10/2026 — Audit intégral : corrections

### Images (en cours)
- Yeux d'Agumon et de Palmon : l'iris vert n'est plus troué (on voyait le décor à travers l'œil) ; griffes de Palmon nettes.
- Yuramon (combat) et Togemon (profil) regardent du bon côté.
- 35 objets ne perdent plus leurs verts au détourage : jardinières de la ville, trèfles, trampoline, buisson fleuri,
  haie, tape-cul, toboggan, balançoire, herbes de la montagne et de la plage, palmier, auvent de l'étal de fruits,
  portail du vent du Gymnase...
- Arbres plus nets (copies à la taille où ils sont dessinés).

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
