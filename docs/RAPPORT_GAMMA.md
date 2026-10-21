# Rapport de la mission GAMMA (nuit du 20 au 21 octobre 2026)

Mission : audit intégral, optimisation et finalisation de la version GAMMA (chapitres 1 à 3 jouables, rapides, cohérents
et beaux). Tout ce qui est décrit ici est **publié** sur GitHub Pages (source unique du téléphone et du PC), sauf ce qui
est marqué « local » (l'atelier des cartes, dev/editeur/, n'est volontairement pas publié).

Sauvegarde faite avant de commencer : étiquette git `sauvegarde-avant-gamma-2026-10-20` (poussée) et dossier
`_perso/archives/sauvegarde_2026-10-20_avant_gamma` (atelier, réglages, retouches du joueur).

## 0. En bref
- **La version GAMMA est jouable du début du chapitre 1 à la fin du chapitre 3** : progression simulée de bout en bout
  par les relecteurs, aucun blocage connu restant. Le dernier blocage trouvé (le Journal plantait sur l'onglet
  ENGRENAGES) est corrigé et publié.
- **Plus rapide** : en ligne, au lancement suivant le premier, on peut jouer après ~3 s au lieu de ~22 s (PC au calme).
- **Plus sûr** : sauvegardes protégées (versions, arrière-plan, quitter sans sauvegarder, téléphone), atelier qui
  n'écrase plus ton travail, tests qui ne peuvent plus « réussir » en silence.
- 21 lots publiés cette nuit, chacun testé (suite automatique 44 / 44 au dernier lot) et vérifié en ligne.
- Ce qui reste demande surtout **tes images** (Digimon à redessiner, tailles des bébés) ou **tes décisions** (§ 17).

## 1. Résultat de l'audit initial
Six relecteurs indépendants (lecture seule, simulations Node et essais dans le navigateur) ; leurs rapports, avec
l'état de chaque point après correction, sont dans `docs/audits_gamma/` :
| Domaine | Verdict à l'audit | Rapport |
|---|---|---|
| Chapitre 1 | jouable, aucun blocage ; 6 défauts importants (textes faux, objectif introuvable, indices de recrues, défi des recrues, tutoriel périmé) | chapitre1.md |
| Chapitres 2 et 3 | jouables jusqu'au bout ; 1 blocage (anciennes parties avec un enfant de l'animé pour héros), 6 importants | chapitres2-3.md |
| Ville, Champs, entraînement | 2 blocages (recettes de Mushroomon, haies inutiles), 8 importants | ville-champs-entrainement.md |
| Introduction et téléphone | 1 blocage (écran titre figé), 11 importants (prénom au clavier, sauvegardes, Retour Android...) | introduction-telephone.md |
| Digimon | 1 blocage (Journal), 8 importants (lignée à la renaissance, techniques, images de Bukamon...) | digimon.md |
| Atelier des cartes | 4 blocages (pertes de travail, conditions effacées), 8 importants | atelier-des-cartes.md |

## 2. Problèmes critiques corrigés (tous publiés)
- Journal : l'onglet ENGRENAGES plantait dès qu'une région était connue (introduit la veille au soir) ; corrigé, et un
  test dessine maintenant chaque onglet et chaque région.
- Écran titre figé après « FICHIER > Charger un fichier » annulé (téléphone, Firefox).
- Saisie du prénom au clavier du téléphone : l'effacement ne marchait pas, les claviers à suggestions doublaient les
  lettres, le champ cachait EFFACER et VALIDER.
- Reprendre une « version précédente » d'une partie faisait perdre la partie actuelle ; « Quitter sans sauvegarder »
  puis FICHIER écrasait l'emplacement avec la partie abandonnée.
- Chapitre 2 sans fin pour une ancienne partie avec Tai (ou un autre enfant) pour héros.
- Recettes de Mushroomon bloquées dès la 2e (le Piment n'arrive qu'à la fin du chapitre 3).
- Une carte entière ne se dessinait plus si une image de décor posée dans l'atelier n'était pas chargée (réseau coupé).
- Atelier : une retouche faite pendant « Faire valider » était perdue ; toucher une porte effaçait sa condition (la
  porte du Grand Arbre s'ouvrait dès le début) ; un deuxième onglet ou serveur écrasait ton travail.
- Images de la grotte et des décors redemandées au serveur à chaque lancement (~22 s avant de pouvoir jouer en ligne).

## 3. Corrections par chapitre
**Chapitre 1** — textes justes (Kuwagamon est dans le Grand Arbre, pas au ravin ; Penguinmon est le gardien du Village
des Bébés ; panneaux de la plage et de la ville ; directions de Koromon) ; objectif du moment chez Jijimon et dans le
Journal ; indices de recrues vers des Digimon qu'on peut vraiment trouver ; défi d'une recrue : niveau annoncé, défaite
= match amical ; mauvaise réponse au Grand Arbre annoncée ; tutoriel du combat au tour par tour ; Kuwagamon « se
désagrège en données » (Jijimon ne dit plus qu'il s'est envolé ; ses données retourneront au Village des Bébés) ; les
Poyomon ne parlent plus du monstre rouge après sa défaite ; cartes d'album données à la rencontre (Koromon, Tanemon,
Botamon, Agumon) ; Kuwagamon ne vole plus à reculons dans l'ouverture ; le combat contre Shellmon montre Greymon à côté
de ton partenaire ; Shellmon ne mord plus à la pêche avant d'être vaincu.

**Chapitre 2** — la veillée avec Matt compte comme une nuit (plus de « nuit blanche ») ; faiblesse de Monochromon juste
(l'eau) ; sortie ouest de la Rive Sud : un message propre (voile de données levé par le combat des Monochromon) ; au
chapitre 4, le passage Rosière ↔ Rive Sud n'est plus à sens unique ; la région s'appelle « Grand Lac » (l'île garde
« Lac du Tramway ») ; Seadramon sauvage seulement après le chapitre 2 ; Seadramon fait face à l'île et à Garurumon dans
les cinématiques ; Garurumon visible pendant le combat ; bilan du chapitre avec Matt et Gabumon ; quête « Les Bukamon
égarés » (§ 10).

**Chapitre 3** — Sora vit chez toi après sa délivrance (sa chambre à l'étage, Biyomon avec elle) ; faiblesses de Meramon
justes (l'eau et la terre) ; Meramon cohérent (la source, puis le restaurant) ; l'Engrenage de Meramon compte pour le
Pays de Meramon dans le Journal (sauvegardes v7 avec migration) ; Birdramon attend au Mont Panorama ; panneaux de la
Plaine des Panneaux et du Désert posés et justes ; fontaine et poteaux du Village des Yokomon cohérents avant et après
Meramon ; Meramon et Birdramon sauvages seulement après le chapitre 3 ; le boss Meramon connaît son Poing Ardent ;
Birdramon visible pendant le combat ; bilan avec Sora et Biyomon ; « À suivre » au lieu d'un faux chapitre 4 ; quêtes
« La soif des Yokomon » et « Le trésor de l'épave » (§ 10).

**Ville, Champs, entraînement** — haies posées dans l'atelier = postes de Vitesse ; un panneau vise son poste jusqu'à
6 cases ; la classe se travaille au cristal ; salle de sport de ta maison avec les règles du Terrain ; étal de la ferme
et glacier de Frigimon garnis ; distributeur du Terrain branché ; ingrédient du jour au comptoir ; panneaux restés
devant les escaliers retirés (53 → 0) ; enseignes conformes au stock ; « Je sers / Je cours / Je fais » ; Koromon ne
conseille le Médicament que s'il est en rayon ; relais de Birdramon signé Birdramon ; maraîchers existants (Togemon,
Yuramon au lieu de Lalamon et Floramon, absents) ; le traîneau affiche son nom ; la fatigue affichée est celle du niveau
choisi (20, 30 ou 40 %).

## 4. Introduction et écran titre (dossier « Générique, introduction »)
Écran titre = ton coucher de soleil peint (logo entier, le héros et Agumon face à l'île ; reflets sur la mer, éclat sur
le logo ; boutons peints sur la maquette effacés). Introduction : ton feu de camp des huit enfants (feu qui vacille,
étincelles), la neige et l'aurore, ta pluie de lumières (les Digivices brillent en tombant), le Digivice aux pieds du
héros, le tunnel et la chute vers l'île ; légendes en haut pour garder les enfants visibles. Sans les images (réseau
lent), l'ancien décor dessiné prend le relais ; charger une partie n'est jamais retardé par l'introduction. Vérifié :
déroulé complet dans le navigateur, sans erreur.

## 5. Grotte de Shellmon (dossier GROTTE DE SHELLMON)
Tes 20 planches découpées en 128 pièces (WebP, 1,5 Mo au lieu de 6 Mo) : grotte côtière (sable, grès, bassins d'eau de
mer, cristaux et champignons lumineux, stalagmites, premières ruines, sentier qui guide jusqu'au temple), Temple englouti
(colonnades, hiéroglyphes, fresques, torches, crypte, cour de la fontaine, salle du trésor, porte gardée par deux
Anubis) et la salle de Shellmon (allée dallée, colonnes, coupes de feu, lagune). Les décors ne bloquent jamais un
passage, les coffres restent à leurs places, braseros et cristaux éclairent le noir. Vérifié : chaque labyrinthe se
traverse de l'entrée à la sortie (test automatique), les 3 cartes et leurs transitions dans le navigateur. Une partie
sauvegardée dans l'ancienne antre reprend à l'entrée de la salle.

## 6. Digimon et techniques (détail : docs/audits_gamma/digimon.md)
- Renaissance et dé-digivolution : chaque Digimon garde son parcours ; il renaît en son propre bébé (avant : un Gabumon
  de Matt renaissait en Botamon, un Tentomon en Nyokimon, un Patamon en Punimon).
- Coups spéciaux ajoutés à 7 espèces ; Tentomon, Patamon, Penguinmon : Champion au N.15 comme les autres ; Champi-Bombe
  devient Poison ; techniques de classe de nouveau proposées ; Meramon, Birdramon, Shellmon : listes de techniques
  nettoyées ; 5 Disciples de plus peuvent tourner mal (Numemon, Sukamon).
- Pêche : niveaux réalistes, boss et partenaires des enfants seulement quand l'histoire le permet.
- Alliés visibles en combat : capture `dev/captures/combat_allie_garurumon.png` (local).
- Dessins recadrés : 38 Digimon dessinés dépassaient un peu du cadre (cornes de Greymon, ailes de Kabuterimon et de
  MetalGreymon, crête de Birdramon, massue d'Ogremon...) ; ils sont réduits juste ce qu'il faut, pieds sur le sol
  (avant / après : `dev/captures/cadres_avant.png`, `cadres_apres.png`, local). Anciens dessins de la lignée de
  Gabumon retirés (code mort).
- À fournir : nouvelle planche de Bukamon, et 4 vues par Digimon pour harmoniser les tailles (liste P1 à P4 dans le
  rapport des Digimon).

## 7. Atelier des cartes (éditeur) — local (détail : docs/audits_gamma/atelier-des-cartes.md)
- Corrigé dans l'atelier : « Faire valider » bloque l'atelier pendant les images (plus de retouche perdue) ; raccourcis
  désactivés pendant qu'on écrit un panneau ; objets du jeu porteurs d'actions protégés de la gomme, suppression
  confirmée, déplacement qui emporte leurs actions ; cabines de la plage protégées ; conditions des portes gardées et
  affichées ; objets remplacés par tes images dessinés comme dans le jeu ; copier / tampon sans les marques internes du
  décor automatique.
- Corrigé dans le jeu (publié) : une sortie modifiée dans l'atelier garde sa condition d'histoire et une règle de
  chapitre s'y ajoute ; un objet déplacé garde ses actions ; relief annulé sans niveau fantôme.
- Corrigé dans dev/serve.py (publié) : un enregistrement fait depuis une version périmée est refusé (rien n'est écrasé) ;
  écriture sous verrou et d'un seul coup ; 60 copies de sûreté.
- Reste (voir le rapport) : afficher PNJ, déclencheurs et rebords ; diagnostic d'accessibilité avec les règles du jeu ;
  panneaux déplacés par leurs champs x/y ; règles des portails ; décor automatique gommé remplacé ailleurs (à décider).

## 8. Chaussures
Vérifiées dans toutes les situations : 8 personnages × 8 directions × 2 pas de marche (`dev/captures/marche_pieds.png`,
local), et dans l'éditeur de personnage.

## 9. Téléphone et sauvegardes
Toucher une réponse ou une ligne de menu la choisit ; RETOUR dans la création du personnage ; boutons agrandis (≥ 44 px)
et zone sûre des iPhone ; bouton « Installer » qui ne couvre plus B ; double toucher qui ne sort plus du plein écran ;
Retour d'Android = retour dans le jeu ; sauvegarde quand le jeu passe en arrière-plan ; son relancé après l'écran
éteint ; stockage « persistant » demandé ; « Télécharger mes parties » ouvre le menu Partager du téléphone ; sur iPhone
dans Safari, rappel d'installer le jeu sur l'écran d'accueil (Safari efface les données d'un site non installé après
7 jours) ; planches du personnage redemandées si le réseau en rate une.

## 10. Quêtes annexes ajoutées (histoires du jeu, pas de l'animé)
- Chapitre 2, « Les Bukamon égarés » : après Monochromon, un Gomamon a perdu ses trois petits le long des rives ; les
  retrouver (jusqu'à la Cascade du Dragon) rapporte du poisson, un Disque PM, des Bits, une carte d'album et le secret
  de la langue de sable qui mène, la nuit, à l'île du vieux tramway (la banquette du tramway permet d'attendre le soir).
- Chapitre 3, « La soif des Yokomon » : à l'oasis du Désert des Poteaux, un Yokomon s'est effondré ; une Eau fraîche le
  sauve, il montre le chemin du village.
- Chapitre 3, « Le trésor de l'épave » : une fois Meramon calmé, l'eau revient au petit lac du village ; un passage de
  planches mène à l'épave et à son coffre.
Vérifiées de bout en bout par un test automatique.

## 11. Performances (mesures réelles, PC du créateur : 2 cœurs à 1,1 GHz)
| Mesure (site en ligne, lancement suivant le premier) | Avant la mission | Après |
|---|---|---|
| Titre affiché | ~3,1 s | **~1,1 s** (PC au calme) ; ~4,5 s quand le PC est chargé |
| Toutes les images prêtes (on peut lancer la partie) | **~21,8 s** | **~3,3 s** (PC au calme) ; ~18 s quand le PC est très chargé |
| Scripts du jeu | 159 demandes l'une après l'autre | 2 paquets + les retouches de l'atelier |
| Suite de tests | ~3,5 min | ~47 s |
- Les mesures varient beaucoup sur ce PC selon ce qui tourne en même temps (plusieurs relecteurs automatiques
  tournaient pendant la nuit). Toutes ont été prises dans le vrai navigateur.
- Moyens : empreintes `?v=` sur chaque script et image + service worker « cache d'abord » + 2 paquets de scripts ;
  cartes de la forêt, des Dunes et du Bosquet fabriquées à leur première visite ; grotte en WebP chargée en
  arrière-plan ; tests chargés dans le contexte principal de Node.

## 12. Architecture (voir docs/ARCHITECTURE.md)
Publication (empreintes, paquets, service worker, `dev/versions.py --verifier`), cartes fabriquées à la demande, dossiers
d'images chargés plus tard (`T.dossier`), quêtes annexes (`game/quetes.js`), parcours des Digimon (`m.parcours` :
renaissance et dé-digivolution), sorties et objets de l'atelier qui « reprennent » ceux du jeu (`reprend` :
`maps/retouches.js`), enregistrement de l'atelier avec version (`dev/serve.py`). Sauvegardes : version 7.

## 13. Améliorations graphiques
Écran titre et introduction peints (§ 4) ; grotte de Shellmon (§ 5) ; alliés visibles dans les combats de boss ;
Digimon dessinés qui ne sont plus coupés par leur cadre ; fonds de combat selon le lieu (avant : une forêt partout hors
de la plage et de la ville) — la rive du Grand Lac (Seadramon se bat devant le lac), le Désert des Poteaux (mesas,
vieux poteaux télégraphiques, buissons secs) et le sommet du Mont Miharashi pour Meramon (crête du cratère qui
rougeoie, fumées, aiguilles de roche, pierres de lave) ; aperçu : `dev/captures/fonds_ch3.png` (local) ;
cinématiques où chacun fait face à son adversaire ; bilans de chapitre avec le bon enfant ; décor du volcan qui
s'affiche même si une image manque. **Partiel** : le standard artistique commun aux chapitres 1 à 3 (§ 15 de la mission)
n'a pas été repris carte par carte cette nuit ; les priorités « ça marche » et « c'est rapide » sont passées d'abord.

## 14. Tests réellement exécutés
- `node dev/tests.js` avant chaque lot publié : 38 tests au début de la nuit → **44 / 44** au dernier lot (nouveaux :
  empreintes et paquets, chambre de Sora, recettes, quêtes annexes, Journal, renaissance). Un arrêt silencieux de la
  suite compte désormais comme un échec (essayé).
- `python dev/versions.py --verifier` après chaque commit : 553 empreintes, 0 fausse.
- Empreintes des 343 cartes avant / après chaque changement de génération ou de retouches : 0 différence (au dernier
  lot, seules la Salle de classe et le Phare du Lac changent, comme voulu : leurs textes).
- Simulations Node : progression des chapitres 1 à 3 (relecteurs), quêtes de bout en bout, postes du Terrain, recettes,
  recrues, lignées (renaissance, dé-digivolution, sauvegarde), pêche (niveaux par carte et chapitre), conditions des
  sorties (chapitre et histoire), objets déplacés (actions), relief annulé, Journal (64 dessins ; l'ancienne version :
  0 / 64), serveur de l'atelier (enregistrement normal, version périmée refusée, ancien atelier accepté).
- Navigateur : écran titre, introduction complète, grotte (3 cartes et transitions), prénom tactile, toucher des choix,
  disposition tactile portrait et paysage, service worker local et en ligne, atelier (démarrage sans erreur, carte du
  Mont Miharashi ; panneaux déplacés), combats avec les trois alliés, fonds de combat (lac, désert, sommet du Mont
  Miharashi contre Meramon), bilan du chapitre 2, commandes tactiles en 640×360, 1024×768 et portrait.
- En ligne (GitHub Pages) après publication : les paquets servis ont les mêmes empreintes qu'en local, le jeu démarre
  sans erreur, service worker actif.

## 15. État du dépôt et déploiement
- Une seule source : `main` sur GitHub, publiée par GitHub Pages ; chaque lot vérifié puis poussé ; propagation
  contrôlée (~1 min).
- Local seulement (non publié, voulu) : l'atelier des cartes (`dev/editeur/`, ignoré par git), les captures
  (`dev/captures/`), tes images d'origine (`assets/ASSETS - Digimon`), tes réglages `.claude/launch.json`.
- Branche locale `carte-monde-vraie` (la vraie carte du monde) : gardée de côté, non poussée, comme demandé (« on va
  faire la carte plus tard »).
- Ancienne copie de travail « rangement » sauvegardée (`_perso/archives/copie_rangement_2026-10-21`) puis retirée.
- Rien à faire de ton côté pour la mise à jour : le téléphone et le PC prennent la nouvelle version au lancement
  suivant.

## 16. Bilan
**Terminé et vérifié** : tout ce qui précède (§ 2 à § 12), sauf ce qui est listé ci-dessous.

**Partiel** :
- Standard artistique des chapitres 1 à 3 (cartes reprises une à une) : non fait cette nuit (les fonds de combat, eux,
  suivent maintenant le lieu).
- Atelier : affichage des PNJ / déclencheurs / rebords, diagnostic d'accessibilité complet, règles des portails.
- Audits : il reste seulement les points marqués « à faire » ou « à décider » en tête de chaque fiche de
  `docs/audits_gamma/` (tout le reste est fait et publié).

**Proposé, non fait** (idées des relecteurs, à choisir) : requêtes des 9 habitants dès le chapitre 1, Bukamon
constructeur du radeau à la Crique, coffre caché du Bosquet, ombre de Kuwagamon qui plonge dans le Grand Arbre, panneaux
vers l'île du tramway, Sora qui suit vraiment au pied du Mont, records du Terrain, coach du matin, cultures de saison,
jour de marché, tour de piste chronométré, étals du Marché vivants.

**Non résolu (il faut tes images ou ta décision)** :
- Planche de Bukamon à refaire ; tailles des bébés et de Motimon à harmoniser (4 vues par Digimon : liste P1 à P4).
- Décor automatique gommé remplacé ailleurs (lac11 : 20 retraits de bottes de foin) : la correction changerait des
  cartes validées.
- Mont Panorama : il n'a plus de Digimon possédé (c'était un double du Meramon du chapitre 3) ; si tu veux un boss là,
  choisis lequel.
- Gabumon de type Glace alors que son Souffle Bleu est un feu bleu : à arbitrer.
- Gymnase : il n'ouvre qu'avec Leomon en ville, qui n'arrive pas avant l'ouverture de la Montagne (réglée au chapitre 10
  dans l'atelier) : il reste donc fermé aux chapitres 1 à 3. Le garder ainsi, ou l'ouvrir autrement ?
- Repères automatiques « Le Phare du lac » sur la Rive Sud et le Pont Numérique (en plus du vrai phare) ; boules de lave
  collées à Meramon dans tes retouches du Mont Miharashi : à revoir dans l'atelier.
- Combat : un grand Champion (Meramon, Greymon...) a la tête cachée par le cadre de ton partenaire, en haut à droite.
  Changer la disposition des cadres (par exemple le tien en bas à droite) est possible, mais c'est un choix d'interface.
- Carte du monde : reportée (branche `carte-monde-vraie`).

## 17. Pour reprendre
1. Lancer le jeu en ligne une fois (la nouvelle version s'installe toute seule).
2. Atelier des cartes : le relancer (LANCER_ATELIER.bat) pour avoir le nouveau serveur ; s'il dit « NON ENREGISTRÉ : le
   fichier des retouches a changé ailleurs », recharger la page (F5).
3. Me dire tes choix pour les points « Non résolu » ci-dessus, et m'envoyer les images de Digimon quand elles sont
   prêtes (liste dans docs/audits_gamma/digimon.md).

## 18. Dernier lot (publié : commit 0fffa96)
- Fonds de combat du Désert des Poteaux et du sommet du Mont Miharashi (Meramon), reflets sur le lac, braises, poussière.
- Biyomon a des nouvelles du chapitre 3 ; le voile qui ferme le Pays de Meramon au chapitre 2 ne renvoie plus « vers le
  grand lac » quand on y est déjà ; le Phare du Lac a son texte ; l'eau « revient peu à peu » au Village des Yokomon
  (textes accordés à l'écran) ; longue-vue sans silhouette de flammes après Meramon.
- Salle de classe : le poste s'appelle « Étude » partout ; les textes du tableau de mémoire, de la longue-vue et des
  formes sont sur leurs objets.
- Coupes du Dojo réservées à leurs stades ; trouvailles au sol jamais dans un coin fermé ; remise du Comptoir aussi sur
  les meubles ; le Résidentiel ne parle plus de quartiers pas encore construits.
- Sauvegarde : « Partie sauvegardée » seulement si c'est vrai ; « Sauvegarder et quitter » ne quitte plus si la
  sauvegarde échoue ; une partie refusée par le navigateur (mémoire pleine) part quand même dans FICHIER.
- Téléphone : commandes dans les bandes libres en 16:9 ; en 4:3, celles qui couvrent la boîte de dialogue s'effacent
  presque pendant les dialogues.
