# Plan de tests

Ce plan dit ce qui est vérifié, avec quoi, et comment le relancer. Il dit aussi ce qui ne l'est pas.
Les résultats de chaque lot publié sont dans `ETAT_AVANCEMENT.md` (« Lots publiés pendant l'audit »).

## 1. Tests de la logique du jeu (sans navigateur)

- **Lancer** : `node dev/tests.js` (environ 3 à 5 minutes sur le PC du joueur).
- **Options** :
  - `SEUL=texte node dev/tests.js` lance seulement les tests dont le nom contient ce texte ;
  - `PILE=1` affiche la pile d'appels d'une erreur.
- **Fonctionnement** : le jeu est chargé dans un faux navigateur (canvas factice, stockage local en mémoire). On vérifie ce qui ne se voit pas à l'écran.
- **Bilan** : 60 tests au 22/10/2026.

| Domaine | Ce qui est vérifié |
|---|---|
| Publication | `js/scripts.js` liste tous les scripts, et seulement eux ; empreintes des scripts, des paquets et des images à jour ; fins de ligne Unix ; aucune page ne recopie la liste des scripts |
| Structure | chaque écran est déclaré ; tous les drapeaux sont déclarés (y compris ceux créés par programme) ; chaque carte a un climat ; chaque technique a un élément et un coût |
| Combats | dégâts (au moins 1, coup spécial, éléments) ; boss avec toute l'équipe K.O. refusé proprement ; une erreur en combat le referme ; Shellmon avec Tai et Greymon ; Meramon sans Sora |
| Progression | expérience strictement croissante ; techniques plafonnées ; échelle Digimon World (PV, stats) ; écussons des Ultimes ; renaissance et dé-digivolution ; lignées des enfants ; poids et maladie |
| Sauvegardes | aller-retour exact ; espèce disparue ; sauvegarde illisible ; aucune sauvegarde lisible ; migrations v2 → v5 ; principale abîmée (la précédente reste lisible) ; deux nouvelles parties sur un emplacement ; FICHIER ; champs abîmés et objets inconnus ; fin de chapitre sauvegardée et réparée |
| Cartes | monde des chapitres 1 à 3 d'un seul tenant ; aucun déclencheur ne bloque un passage ; arrivées vers les cartes agrandies (dont la sortie de chez Penguinmon) ; préparer deux fois une carte ne la change pas ; commerces qui grandissent |
| Donjons | cabines et antre de Shellmon (labyrinthes, escaliers, crypte) ; souterrains du Mont Miharashi (5 cercles) ; sauvetage de Sora ; périls ; éruption des Corniches |
| Histoire et quêtes | Tai et Sora délivrés (leurs chambres) ; Journal ; quêtes annexes (Bukamon, Yokomon, épave) ; cuisine de Mushroomon |
| Objets | sac plein : récompense au coffre, trouvaille laissée ; objet d'Ultime refusé sans écusson ; puce refusée sur un Digimon K.O. |
| Son | séquenceur : pas de rafale de notes après un retard ; musique de la carte après un jingle |

## 2. Parcours de joueur dans un vrai navigateur (Playwright)

- **Lancer** : `node dev/e2e/parcours.js`. Avant la première fois : `npm install` dans `dev/e2e`. Le parcours utilise le Chrome installé sur le PC.
- **Options** :
  - `URL=https://kronos4322.github.io/digimon-ile-des-fichiers/ node dev/e2e/parcours.js` joue le parcours sur le site en ligne ;
  - `AFFICHER=1` montre la fenêtre ;
  - `LENT=3` rend toutes les attentes 3 fois plus longues, quand le PC est lent ou très occupé. Les vérifications
    restent les mêmes, seule la patience change. Sur le PC du joueur chargé par d'autres travaux, un menu a déjà mis
    plus de 8 s à s'ouvrir, et un rechargement de page 146 s.
- **Les 13 étapes**, jouées avec de vraies touches du clavier :
  1. lancement jusqu'à l'écran titre ;
  2. chargement des décors ;
  3. NOUVELLE PARTIE ;
  4. création du personnage ;
  5. saisie du prénom ;
  6. introduction jusqu'à la forêt ;
  7. réveil chez Jijimon ;
  8. déplacement ;
  9. dialogue ;
  10. changement de carte ;
  11. combat jusqu'à la victoire ;
  12. sauvegarde par le menu ;
  13. rechargement de la page, puis CONTINUER.
- **Contrôles en plus** : aucune erreur dans la console, aucun fichier introuvable. Les captures sont dans `dev/captures/e2e/` (non publiées).
- **Dernier résultat** : 13/13 en local et 13/13 sur le site en ligne (commit 94b9945).

## 3. Formats d'écran

- **Lancer** : `node dev/e2e/ecrans.js`.
- **Les 6 formats** : PC 800 × 600, Full HD, 4K densité 2, téléphone en paysage et en portrait, tablette.
- **Contrôles** :
  - le jeu tient dans l'écran en 4:3 ;
  - les pixels restent nets ;
  - les commandes tactiles apparaissent seulement sur les appareils tactiles ;
  - aucune erreur.
- **Dernier résultat** : 6/6.

## 4. Empreintes du commit publié

- **Lancer** : `python dev/versions.py --verifier`.
- **Contrôle** : chaque fichier servi par GitHub Pages correspond à son empreinte dans le dernier commit. Le service worker vérifie aussi l'empreinte de chaque fichier téléchargé.
- **Après l'envoi** : comparer l'empreinte du paquet servi en ligne à celle du commit (voir `RELEASE_CHECKLIST.md`).

## 5. Tests automatiques sur GitHub

`.github/workflows/tests.yml` lance les §§ 1 et 4 à chaque envoi sur `main`.

## 6. Outils de vérification dans la page du jeu (navigateur)

- `dev/check.html` (avec `python dev/serve.py`) : chaque carte (sorties, arrivées, PNJ, panneaux, déclencheurs accessibles) et l'arbre des Digivolutions. Limite connue : il n'attend pas les dossiers d'images chargés tard (`bebe`, `grotte`, `desert`).
- `dev/liens.js`, `dev/geographie.js` : cohérence des liens entre cartes extérieures et ruptures géographiques.
- `dev/playtest.js` : joueur automatique du chapitre 1, qui mesure le rythme réel.
- `dev/empreintes.js` : empreintes des pixels de chaque dessin, avant et après un nettoyage du code.
- `dev/matrice.js` : régénère `docs/audit/MATRICE_CONTENUS.md` à partir des données du jeu.

## 7. Ce qui n'est pas vérifié automatiquement (à faire à la main)

- Une partie complète des chapitres 1 à 3 jouée par une personne : les scripts déroulent l'histoire, imposent l'issue des combats et ne jugent pas le plaisir de jeu.
- Le son à l'oreille : autorisation de lecture automatique, manette seule (SYS-39), rendu réel.
- La manette et le tactile réel sur téléphone : le format est vérifié, pas le confort des commandes.
- Le quota de stockage selon le navigateur (Safari efface après 7 jours) et l'accès aux fichiers (FICHIER) sur un vrai PC.
- Les collisions « au pied du dessin » des décors : elles ne se mesurent qu'avec les vraies images (navigateur). Le code garantit seulement qu'elles ne ferment jamais un passage.
- Le rendu des corrections d'images de l'audit graphique : à regarder sur les planches avant/après de l'agent images.
