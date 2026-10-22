# Audit intégral — état d'avancement

Mission : « Audit intégral, correction et finalisation du jeu vidéo Digimon » (demande du joueur du 21/10/2026 au soir).
Ce fichier dit où en est la mission, pour pouvoir la reprendre d'une session à l'autre. Les livrables finaux sont dans
ce même dossier (`docs/audit/`) : AUDIT_GLOBAL.md, BUGS_ET_CORRECTIONS.md, MATRICE_CONTENUS.md, PLAN_DE_TESTS.md,
RELEASE_CHECKLIST.md ; README.md et CHANGELOG.md à la racine.

## État initial (relevé avant toute correction, 21/10/2026 vers 23 h 30)

- Dépôt distant : https://github.com/Kronos4322/digimon-ile-des-fichiers.git (branche `main`).
- Branche locale `main`, synchronisée avec `origin/main` au commit `f987c32` (2026-10-21 23:18:43 +0200).
- Modification locale non enregistrée : `.claude/launch.json` (réglages du PC du joueur, jamais publiés).
- Autres branches locales : `carte-monde-vraie` (carte du monde mise de côté, non publiée), branches des copies de
  travail des agents (`worktree-agent-*`).
- Outils : Node v24.14.1, Python 3.14.3, Google Chrome installé ; Playwright absent au départ.
- Tests automatiques au départ : `node dev/tests.js` → 53 réussis, 0 échoué.
- Version en ligne (GitHub Pages) : https://kronos4322.github.io/digimon-ile-des-fichiers/ — vérifiée à jour avec
  `f987c32` (empreinte du paquet `jeu-1.js` identique au contenu servi).

## Stratégie de publication

Le jeu n'a pas d'étape de compilation (HTML5/JavaScript chargés tels quels) ; la « version de production », ce sont les
deux paquets `paquets/jeu-1.js` et `jeu-2.js` et les empreintes, fabriqués par `python dev/versions.py`. La branche
`main` est publiée directement par GitHub Pages (règle du joueur : une seule source, publiée après chaque lot vérifié).
Chaque lot de corrections : `python dev/versions.py`, `node dev/tests.js` (tous réussis), vérification en jeu, commit,
`python dev/versions.py --verifier`, `git push origin main`, puis contrôle du site en ligne (contenu servi = empreintes).

## Phases (mise à jour : 22/10/2026, vers 3 h)

| Phase | Sujet | État |
|---|---|---|
| 1 | Inventaire, architecture, état initial | fait : 4 audits (systèmes, Digimon et combats, cartes, graphismes) ; 351 cartes, 81 espèces, 132 Digivolutions, 153 objets, 690 images |
| 2 | Démarrage, boucle, erreurs | corrigé avant l'audit (démarrage blindé, file:// redirigé) ; parcours réel 13/13 sans erreur de console |
| 3 | Graphismes, fonds verts, textures, ordre d'affichage | audit fait (36 anomalies : 0 P0, 3 P1, 9 P2, 24 P3) ; corrections en cours (agent images) |
| 4 | Cartes : graphe des connexions, collisions, level design | audit fait (0 P0, 0 P1, 2 P2, 13 P3) ; P2 corrigées (94b9945) ; P3 du code corrigées ; P3 des retouches de l'atelier à valider par le joueur |
| 5 | Digimon, digivolutions, progression | audit fait (0 P0, 1 P1, 10 P2, 21 P3) ; corrections en cours (agent Digimon) |
| 6 | Combats, cas extrêmes, équilibrage | audit fait (avec la phase 5) ; corrections en cours (agent Digimon) ; éléments, Méga, renaissance : décisions du joueur |
| 7 | Jouabilité, commandes, ergonomie | parcours réel au clavier 13/13 (dev/e2e/parcours.js) ; formats d'écran 6/6 (dev/e2e/ecrans.js) |
| 8 | Histoire, quêtes, événements | audit fait ; corrigé (e862fe0) : fins de chapitre (P0), quêtes, défaites sauvegardées |
| 9 | Objets, équipements, économie | audit fait ; corrigé (e862fe0) : objets d'Ultime, sac plein, canne, champignons, revanche de Shellmon ; textes des objets : agent Digimon |
| 10 | PNJ et interactions | audit fait (avec les cartes) : aucun PNJ inaccessible ; 2 panneaux fantômes retirés, 4 dans les retouches de l'atelier |
| 11 | Sauvegardes | corrigé (e862fe0) : 9 anomalies (dont 3 P1), 5 tests ajoutés |
| 12 | Sons et musiques | corrigé (e862fe0) : séquenceur, son suspendu onglet caché, musique après un jingle ; réglages de volume : à faire |
| 13 | Performances | WebP pour le dossier commun (15,9 → 5,2 Mo) ; volcan chargé à part : en cours (agent images) |
| 14 | Compatibilité, écrans | 6 formats sur 6 (PC, 4K, téléphone, tablette) |
| 15 | Nettoyage du code | fait (38f426c) : lanceur JOUER.bat, pages de dev/ lavées |
| 16 | Tests automatisés et parcours réels | 60 tests Node ; parcours Playwright 13/13 ; formats 6/6 |
| 17 | GitHub, publication, version en ligne | chaque lot vérifié en ligne (empreinte du paquet servi = empreinte publiée) |
| 18 | Cohérence globale | à faire après les fusions |
| 19 | Ressources et droits | audit fait : polices sous licence OFL ; l'écran titre imite le logo officiel (™) : décision du joueur |
| 20-23 | Priorisation, contre-audit, livrables, validation | en cours |

## Lots publiés pendant l'audit

| Commit | Contenu | Tests | En ligne |
|---|---|---|---|
| ee62d9f | état initial, parcours Playwright | 53/53, parcours 13/13 | vérifié |
| d21d380 | rangement du code, essai des formats d'écran | 53/53, formats 6/6 | vérifié |
| a31c07e | salle de classe, panneaux, arbre creux, collisions | 53/53, parcours 13/13 | vérifié |
| e862fe0 | audit des systèmes : fins de chapitre, sauvegardes, objets, son, quêtes | 60/60, parcours 13/13 (avant les derniers textes du lot) | vérifié |
| 94b9945 | audit des cartes : P2 (Penguinmon, arbre creux) et P3 du code | 60/60 ; parcours 13/13 SUR LE SITE EN LIGNE | vérifié (paquet jeu-2 servi = 08d0cfee) |

## Rapports d'audit (copies de travail)

Les quatre rapports détaillés (fichier:ligne, reproduction, correction) ont été écrits dans le dossier temporaire de
la session ; leur contenu est repris dans `BUGS_ET_CORRECTIONS.md` et `AUDIT_GLOBAL.md`.
