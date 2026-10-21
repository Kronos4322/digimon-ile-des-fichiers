# Rapport du relecteur « atelier des cartes » (21/10, lecture seule) — état après corrections
(Les scripts de preuve a01-a29 étaient dans un dossier temporaire de la session : ils ne sont pas conservés.
« FAIT » = corrigé et vérifié cette nuit ; le reste est à faire.)

OK : aller-retour atelier → fichier → jeu exact (le fichier est régénéré à l'octet près) ; même génération et même rendu
que le jeu ; les retouches actuelles ne rendent rien inaccessible (27 cartes, nouvelle partie et ville complète) ;
annuler / rétablir fonctionne pour les objets.

## BLOQUANT
- B1. FAIT — « Faire valider » remplaçait DW.RETOUCHES par la version validée pendant la fabrication des images : une
  retouche faite pendant ce temps partait dans la version validée (et était perdue). L'atelier est maintenant bloqué
  (voile « Ne touche à rien ») et n'enregistre pas pendant ce temps.
- B2. FAIT — toucher une porte ou une sortie du jeu dans l'atelier effaçait sa condition (énigme du Grand Arbre, portes
  des bâtiments de la ville, Gymnase, passage de Monochromon...). La sortie de l'atelier garde maintenant la trace de
  l'originale (reprend) et le jeu lui garde sa condition d'histoire ; une règle de chapitre s'y AJOUTE (avant : elle la
  remplaçait — 4 sorties retouchées étaient concernées : Bois Brumeux, Pont de l'Infini, marais, tunnel). L'atelier
  affiche « Condition de l'histoire, toujours gardée ».
- B3. FAIT — les objets porteurs d'actions (Grand Arbre, feu de camp de Matt, Gymnase, étal des Champs...) perdaient
  leur action à la gomme ou au déplacement : la gomme ne les efface plus (message), Suppr demande confirmation, un
  déplacement emporte leurs actions (vérifié : 4/4, 1/1, 2/2 actions suivent). Les cabines de la plage (énigme de
  Shellmon, repérées par leur colonne) ne se repeignent plus.
- B4. FAIT — raccourcis clavier actifs dans la zone de texte d'un panneau (impossible de taper une espace, « b »
  changeait d'outil, Retour arrière supprimait le panneau).

## IMPORTANT
- I1. FAIT — écrasements : dev/serve.py refuse (409) un enregistrement fait depuis une version périmée du fichier
  (autre onglet, autre atelier, correction à la main) ; écriture sous verrou et d'un seul coup ; 60 copies de sûreté.
  RESTE : la sauvegarde « en quittant la page » n'est pas garantie (fichier de 160 Ko > limite keepalive) ;
  l'historique d'annulation est perdu au rechargement.
- I2. FAIT — relief annulé qui restait actif (base d'altitude reprise du relief retouché). RESTE : le premier clic d'un
  petit pinceau peut ne rien montrer (le lissage efface un plateau de moins de 16 cases : c'est voulu, mais l'atelier
  ne le dit pas).
- I3. À DÉCIDER — un ensemble de décor automatique gommé est remplacé ailleurs (d'où les 20 retraits de bottes de foin
  sur lac11). Correction possible (compter un ensemble gommé comme posé) mais elle change le décor de cartes déjà
  validées : à faire seulement avec ton accord, en revalidant les cartes concernées.
- I4. À FAIRE — l'atelier ne montre ni les PNJ, ni les déclencheurs, ni les rebords de dénivelé (qui bloquent en jeu),
  et seulement l'état « nouvelle partie ».
- I5. FAIT (dessin) — les objets remplacés par tes images (aiguilles du volcan...) sont dessinés comme dans le jeu
  (18×32 au lieu de 36×70). FAIT (jeu) — un objet dont l'image n'est pas chargée ne fait plus planter la carte.
- I6. À FAIRE — le Diagnostic ne voit pas les vrais blocages (rangée de rochers sur un passage, cases bloquées à la
  main, accès intérieur, sorties créées dans l'atelier).
- I7. FAIT — un panneau déplacé par ses champs x/y emporte son texte ; la Gomme retire les textes écrits dans l'atelier
  sur les cases effacées ; poser un panneau de poste d'entraînement ne demande plus de texte (il passerait avant la
  séance).
- I8. À FAIRE — portails de l'atelier : la règle de région du chapitre ne s'y applique pas (un portail sans règle ouvre
  une région future) ; on n'y entre pas en diagonale ; le décor automatique peut s'y poser.

## MINEUR (à faire)
FAIT : champ x/y vidé (l'objet partait en x = 0) et arrivée d'une sortie vidée (NaN) : la valeur d'avant est gardée. Distributeur : seule la première machine de la carte et sa case
en haut à gauche sont branchées. dummy, weights, guardwall, shrine posés = décoratifs. Emprise devinée d'après le dessin
(20 arbres posés dans l'eau au Sentier, 2 sur des passages, 5 arrivées sur une case prise). Copier / Tampon : FAIT (les
marques internes du décor automatique ne sont plus recopiées). Mode Monde : un clic près d'un bord crée un passage ;
quitter sans « Enregistrer le monde » perd tout. Porte : hauteur ignorée, pas de création de porte. Pinceau : 65 à
107 ms par pas sur les grandes cartes. Historique en copies complètes (mémoire). Panneau peint au gros pinceau : texte
seulement au centre. Portail sans destination enregistré. Sortie de bord vers une voisine du puzzle qui glisse hors du
passage. Essai « tout ouvert » sans les portes conditionnelles. Arbre en case modifié → objet « tree » variante 0.
