# Rapport du relecteur « intro et téléphone » (20/10, lecture seule) — à traiter

> **État après la mission (21/10)** — points 1 à 18 et 20 à 25 : FAITS (publiés). Point 19 (libellés OK / RETOUR des
> aides tactiles) : à revérifier sur téléphone.


BLOQUANT
1. fichier.js:104-110 : « FICHIER > Charger un fichier » annulé → promesse jamais résolue → busy reste vrai (title.js:292),
   OK ignoré (title.js:283) : titre figé. Écouter 'cancel' + délai de secours, input dans le DOM, remettre busy à faux.

IMPORTANT
2. index.html:15 bouton « Installer le jeu » (fixe bas droite, z 50) recouvre B en paysage (740x360). → haut/centre, ou caché si DW.Touch.on.
3. touch.js:151-156 vide le champ après chaque lettre : ⌫ n'efface rien ; Gboard « L, Lu, Luc » → « LLuLuc ».
   → garder le texte du champ, name = field.value filtré à chaque input, vider à l'ouverture ; autocorrect="off".
4. touch.js:33 champ HTML « Ton nom » à 30 % de la hauteur, 240 px : cache EFFACER/VALIDER (portrait 360x620),
   la règle et l'erreur (paysage). → poser le champ sur NameScene.FIELD (rect du canvas), transparent.
5. nom.js:11 propose Tai, Matt, Sora, Izzy, Mimi, Joe (enfants à délivrer) ; dialog.js:94 portrait du héros sur les
   répliques du vrai Matt si le héros s'appelle Matt. → retirer ces prénoms (+TK, Kari), refuser un nom = DW.HEROES[k].name.
6. sauvegarde.js:56-64 restoreVariant range la partie actuelle dans _precedente, écrasée au save suivant (88-89) :
   la partie actuelle disparaît. Stick en diagonale change la version (title.js:219-222). → clé dédiée + confirmation.
7. menus.js:92-99 « Quitter sans sauvegarder » garde DW.state ; fichier.js:119 appelle DW.save() → écrase l'emplacement.
   → DW.state = DW.newState() au retour au titre, ou n'enregistrer que si DW.ow existe.
8. Aucun visibilitychange/pagehide/popstate : Retour Android ferme l'appli ; appli tuée en fond → perte depuis le
   dernier autosave ; musique continue (audio.js:119). → save au passage en fond si DW.ow non verrouillé + ctx.suspend ;
   history.pushState + popstate = Retour.
9. Pas de navigator.storage.persist() ; iOS Safari efface après 7 jours. → persist() + invitation écran d'accueil + rappel d'export.
10. index.html:46 dblclick → exitFullscreen : double toucher (dialogues) sort du plein écran. → ignorer si DW.Touch.on.
11. sw.js:9 ne précharge rien ; SW enregistré après les scripts ; activate supprime l'ancien cache trop tôt.
    → précharger dans install (scripts, polices, kit, Textures.LISTE) ; supprimer l'ancien cache après remplissage.
12. sw.js:21 réseau d'abord sans délai : ~280 revalidations, 249 images 6 par 6 (textures.js:177-182) → 4 s à 100 ms,
    13 s à 300 ms ; image 40 s x 3 essais. → cache d'abord + mise à jour en fond (images, polices), délai ~3 s HTML/JS.

MINEUR
13. fichier.js:102 révoque l'URL après 2 s (Safari) ; input d'import hors DOM → 60 s, attacher, navigator.share.
14. sauvegarde.js:32 « Supprimer » laisse _ancienne → l'emplacement plein dans CONTINUER. → effacer _ancienne, _illisible.
15. sauvegarde.js:79 « Sauvegardé » même si l'écriture échoue → n'afficher que si DW.save() réussit.
16. persos.js:20-28 kit : pas de nouvel essai → « Chargement... » permanent. → réessayer comme textures.js:176.
17. main.js:82 polices attendues 1,5 s ; logo mis en cache une fois (title.js:141-175) → vider cache.logo à l'arrivée des polices.
18. input.js:42 « APPUIE SUR ESPACE » sur téléphone → Input.device = 'touch' dans build().
19. Aides OK/Retour/croix vs boutons A/B et stick (touch.js:128) → libeller OK et RETOUR.
20. touch.js:145-146 toucher un choix ne le sélectionne pas ; emplacements : premier plein, pas le plus récent (title.js:213).
21. CreateScene (intro.js:51-61) et NameScene sans retour (B/Échap).
22. Petits textes 6-7 px ; B 39 px, MENU/COURIR 26 px (touch.js:104-107) < 44-48 px conseillés.
23. Commandes sur le jeu en 16:9 / 4:3 (touch.js:110-117) : B sur la fin des dialogues (640x360), stick sur le début (1024x768).
24. viewport-fit=cover sans env(safe-area-inset-*) (index.html:5).
25. audio.js:24 resume seulement si 'suspended' (iOS 'interrupted') ; init seulement au pointerdown.

OK : nouvelle partie (attendreDecors, Perso.charger), continuer (versions, illisible), quitter pendant l'intro,
textes sans débordement, tactile complet, 249 images + 12 planches présentes, sauvegarde ~57 Ko.
