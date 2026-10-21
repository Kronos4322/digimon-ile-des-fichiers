# Rapport du relecteur « chapitre 1 » (20/10, lecture seule, lignes du commit 36e6e97) — à traiter

> **État après la mission (21/10)** — points 1 à 15 : FAITS (publiés). Ajouts : B (cartes d'album données à la
> rencontre) FAIT ; A (requêtes des 9 habitants), C (Bukamon constructeur du radeau), D (coffre caché du Bosquet),
> E (ombre de Kuwagamon qui plonge dans le Grand Arbre) : proposés, non faits.
> (Les numéros de ligne datent de l'audit ; les scripts de preuve étaient temporaires.)

Preuves : scratchpad/audit_ch1 (sim.js, reach.js, checks.js). Aucun blocage : simulation complète (starter → kuwaChase →
tour → kuwaSeen → kuwagamon → shellLair → shellmon → chapitre 2), 21 cartes accessibles, défaites gérées, Champion
atteignable avant Kuwagamon (~17-22 victoires de 12 à 15).

IMPORTANT
1. Kuwagamon annoncé au ravin : Tanemon du Sentier (foret.js:82), carte du monde Lisière (worldmap.js:24) ; il est dans le
   Grand Arbre de la Clairière (foret.js:27-28, chapitre1.js:182). → réécrire vers la Clairière.
2. Pas d'objectif consultable : DW.Chapter.objective() (chapitre1.js:179-186) seulement dans « Précédemment » (6 h, title.js).
   Journal ch1 : 16 régions « ??? » et « Brise 12 engrenages pour affronter leur maître » (story.js:276-280) ; REQUÊTES
   promet des « ! » jamais vus au ch1 (story.js:289 ; story.js:130, overworld.js:656). → ligne OBJECTIF en tête du Journal
   et dans les conseils de Jijimon (village.js:443).
3. Indices de recrue (Jijimon village.js:445-446, Koromon village.js:363, 377) = 1re recrue absente de RECRUITS (town.js:10-20) :
   Yokomon à la Clairière avant Kuwagamon (foret.js:35) ; pas « la nuit » (Mushroomon) ni « 16 h-19 h » (Gomamon) ; après
   les 9 → Alpages Suspendus (montagne7, fermé ch10). → filtre de Biyomon (village.js:505, 516 : zone ouverte, hint).
4. Koromon (village.js:373) « éboulis à l'est, ronces aux Champs, Bois Brumeux… les Digimon t'aideront » : portes remplacées
   par les règles de l'atelier (voile, ch4 retouches_donnees.js:2554, ch10 9222, 10107, 10121). → réécrire.
5. Défi de recrue (common.js:250-255) : niveau non annoncé, fuite impossible (battle.js:99), défaite = K.O. (overworld.js:514 ;
   3 K.O. = mort life.js:68) et -10 % Bits. Ex. Gotsumon N.6 (Plage) contre bébé N.4. Mauvaise réponse au Grand Arbre :
   combat sauvage N.10-12 sans avertissement (kuwagamon.js:39-43). → « Relever le défi de Gotsumon (niveau 6) ? » ou
   canLose: true ; prévenir avant l'énigme.
6. Tutoriel combat périmé (guide.js:56 : roue, esquive — ancien combat en arène retiré options.js:18) ; vrai menu
   Combat / Objet / Digimon / Fuite (battleui.js:148) ; battle.js:282 « ATTAQUE puis ENTRÉE ».

MINEUR
7. Gardien du Village des Bébés : worldmap.js:29 et Punimon (berceau.js:163) disent Elecmon ; c'est Penguinmon (berceau.js:104).
8. Kuwagamon « se désagrège en données » (kuwagamon.js:165) puis « s'est envolé vers la montagne » (181) ; Poyomon parlent
   du « monstre rouge » après sa défaite (yokomon.js:51 dépend du puits).
9. Panneau Plage « Nord : Forêt de l'Arrivée » (plage.js:179) → Lisière du Ravin ; Lisière sans panneau (foret.js:208).
10. Panneau ville « Ouest : Plage des Cabines » (village.js:288, 8,24) au bout de l'ancienne route ; vraie sortie nord-ouest (0,2).
11. Koromon (chapitre1.js:86, 88) : distributeur « de la place » (en 64,32, à l'est) ; Dunes « à l'ouest de la plage » (nord-ouest).
12. Tanemon (champs.js:142) « plus que moi en ville » vs Koromon (chapitre1.js:74) et Motimon (village.js:315).
13. « L'Embarcadère du lac » dans la Clairière (thème spring, decor.js:54) ; retrait « dock@39,27 » ne vaut que pour la case
    (decor.js:147) ; en Node le quai réapparaît en 42,30. → noLandmark: true sur la Clairière.
14. Album ch1 (activities.js:34) : Botamon, Koromon, Agumon, Tanemon seulement en paquets (~30 paquets) → récompense de
    Jijimon (village.js:412-417) très longue.
15. Commentaires périmés : chapitre1.js:3, kuwagamon.js:3 et 10, flags.js:31 (fin ch1 = Shellmon, antre.js:257) ;
    chapitre1.js:159 Elecmon au Village des Bébés ; chapitre1.js:148 branche morte.

AJOUTS : A requêtes des 9 habitants (PROFILE.default requests.js:45 ; DW.Requests.talk dans village.js:456-531 ; « ! »
overworld.js:656) ; B cartes garanties (Koromon chapitre1.js:93, Tanemon champs.js:140, Botamon berceau.js:102, Agumon
antre.js:246) ; C Bukamon constructeur du radeau à la Crique (plage.js:180, 60) : 2 Eaux fraîches → paquet ; annonce Whamon ;
D coffre caché Bosquet (9,22 rivage.js:67) avec DW.Palais.treasure : Disque PM + Pomme bleue ; E ombre de Kuwagamon qui
plonge dans le Grand Arbre (ow.flyers, debut.js:74-90).
