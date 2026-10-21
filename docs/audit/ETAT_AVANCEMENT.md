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

## Phases

| Phase | Sujet | État |
|---|---|---|
| 1 | Inventaire, architecture, état initial | état initial relevé ; inventaire en cours (agents) |
| 2 | Démarrage, boucle, erreurs | corrigé avant l'audit : démarrage blindé, ouverture en file:// redirigée |
| 3 | Graphismes, fonds verts, textures, ordre d'affichage | en cours (agent graphismes) |
| 4 | Cartes : inventaire, graphe des connexions, collisions, level design | en cours (agent cartes ; agent collisions) |
| 5 | Digimon, digivolutions, progression | en cours (agent Digimon) |
| 6 | Combats, cas extrêmes, équilibrage | en cours (agent Digimon) |
| 7 | Jouabilité, commandes, ergonomie | à faire |
| 8 | Histoire, quêtes, événements | en cours (agent systèmes) |
| 9 | Objets, équipements, économie | en cours (agent systèmes) |
| 10 | PNJ et interactions | en cours (agent cartes) |
| 11 | Sauvegardes | en cours (agent systèmes) |
| 12 | Sons et musiques | en cours (agent systèmes) |
| 13 | Performances | commencé : images du dossier commun en WebP (15,9 → 5,2 Mo) |
| 14 | Compatibilité, écrans | à faire |
| 15 | Nettoyage du code | en cours (agent rangement, sur sa branche) |
| 16 | Tests automatisés et parcours réels | à faire (Playwright) |
| 17 | GitHub, publication, version en ligne | vérifié à chaque lot |
| 18 | Cohérence globale | à faire |
| 19 | Ressources et droits | en cours (agent graphismes) |
| 20-23 | Priorisation, contre-audit, livrables, validation | à faire |
