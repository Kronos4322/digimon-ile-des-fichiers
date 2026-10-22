# Liste de contrôle d'une publication

Le jeu n'a pas d'étape de compilation. Ce qui est publié, c'est la branche `main` telle quelle, servie par GitHub Pages
à l'adresse https://kronos4322.github.io/digimon-ile-des-fichiers/. Le joueur y joue sur PC (lanceur `JOUER.bat`) et sur
téléphone.

## Avant le commit

- [ ] `python dev/versions.py` : met à jour les empreintes des scripts et des images, et refait les deux paquets `paquets/jeu-1.js` et `jeu-2.js`.
- [ ] `node dev/tests.js` : tous les tests réussis (60 au 22/10/2026).
- [ ] Si l'écran, les commandes ou la sauvegarde sont touchés : `node dev/e2e/parcours.js` (13/13, aucune erreur de console, aucun fichier introuvable).
- [ ] Si la mise en page est touchée : `node dev/e2e/ecrans.js` (6/6).
- [ ] Si des images sont touchées : regarder les planches avant/après en grand (règle du projet : regarder avant de corriger).
- [ ] Ne pas inclure `.claude/launch.json` (réglages du PC du joueur).
- [ ] Ne jamais modifier `assets/ASSETS - Digimon/` : ce sont les originaux du joueur, seulement lus.

## Commit et envoi

- [ ] Message de commit en français, qui dit ce qui change pour le joueur, terminé par la ligne `Co-Authored-By:`.
- [ ] `python dev/versions.py --verifier` : « 0 fausses » (chaque fichier du commit correspond à son empreinte).
- [ ] `git push origin main`. Jamais de `--force`. Les branches de travail (`carte-monde-vraie`, `worktree-agent-*`) restent locales.

## Après l'envoi

- [ ] Attendre la mise à jour de GitHub Pages (1 à 3 minutes).
- [ ] Vérifier que le site sert le nouveau paquet :
  - `curl -s https://kronos4322.github.io/digimon-ile-des-fichiers/js/scripts.js | grep -o "jeu-2.js', v: '[0-9a-f]*'"` donne l'empreinte du commit ;
  - le paquet téléchargé a cette même empreinte : `curl -s ".../paquets/jeu-2.js?v=<empreinte>" | sha256sum` commence par elle.
- [ ] Pour un lot important : `URL=https://kronos4322.github.io/digimon-ile-des-fichiers/ node dev/e2e/parcours.js` sur le site en ligne.
- [ ] Contrôler le résultat des tests sur GitHub (onglet Actions, workflow « Tests »).
- [ ] Noter le lot dans `docs/audit/ETAT_AVANCEMENT.md` et dans `CHANGELOG.md`.

## Pourquoi ces contrôles

- **Le service worker (`sw.js`)** garde le jeu hors ligne. Il ne prend un fichier téléchargé que si son contenu a la bonne empreinte : le CDN de GitHub ignore `?v=` et peut servir une ancienne copie un moment. Une empreinte fausse dans le commit laisserait le joueur bloqué sur l'ancienne version.
- **Les deux paquets** réunissent les 162 scripts en deux fichiers, pour démarrer vite sur un PC lent. Le test « paquets du site en ligne » vérifie qu'ils sont exactement la réunion des scripts.
