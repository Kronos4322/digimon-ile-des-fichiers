# Rapports détaillés de l'audit intégral (22/10/2026)

Ce dossier contient les quatre rapports écrits pendant l'audit, recopiés tels quels.

| Fichier | Domaine | État du dépôt audité |
|---|---|---|
| `systemes.md` | objets et économie, quêtes et événements, sauvegardes, sons | `f987c32` |
| `digimon_combats.md` | registre des espèces, Digivolutions, progression, combats, boss, équilibrage | `f987c32` |
| `cartes.md` | inventaire des 351 cartes, graphe des connexions, PNJ, panneaux, collisions | `a31c07e` |
| `graphismes.md` | 690 images servies, vues des Digimon, détourage, tailles, textures, droits | `f987c32` |

Dans chaque fiche, la mention du statut dit comment le constat a été établi :
- **[SCRIPT] / VÉRIFIÉ PAR UN SCRIPT** : mesuré en exécutant le vrai code du jeu, dans Node ou sur les images ;
- **[LU]** : déduit de la lecture du code ;
- **[NON VÉRIFIÉ]** : hypothèse à confirmer en jeu.

Les scripts de mesure cités (`s04_progression.js`, `a5_boss.js`, `t6.js`...) ont tourné dans un dossier de travail
temporaire de la session. Ils ne sont pas versionnés.

Le graphe des connexions des cartes est dans `../graphe/` :
- `graphe_aretes_*.tsv` : un passage par ligne ;
- `graphe_regions_*.md` : un résumé par région ;
- deux états pour chaque fichier : `_complet` (ville au complet) et `_debut` (début de partie, sans recrue).

Ce qui a été corrigé depuis, et ce qui reste, est tenu à jour dans `../BUGS_ET_CORRECTIONS.md`.
