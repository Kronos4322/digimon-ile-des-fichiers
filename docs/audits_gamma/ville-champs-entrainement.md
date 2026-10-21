# Rapport du relecteur « ville, champs, entraînement » (20/10, lecture seule) — à traiter

> **État après la mission (21/10)** — points 1 à 3, 5 à 15, 17 à 22 : FAITS (publiés). Point 4 (Gymnase ouvert
> seulement avec Leomon, qui n'arrive pas avant l'ouverture de la Montagne, réglée au chapitre 10 dans l'atelier) : à
> décider. Point 16 (noms des cultures des Champs) : à faire. Ajouts 23 à 28 : proposés, non faits.

Preuves : scratchpad/audit_ville (b_postes.js, m_seance.js, c_acces.js, i_arrivees.js, j_halteres.js, g_conseils.js,
e_panneaux.js, h_divers.js, n_trouvailles.js ; copie snap).
OK : accès (ville, Champs, 3 quartiers, Terrain, classe, Gymnase, intérieurs ; 426 arrivées), indices des 9 recrues,
case libre à chaque poste, Gymnase appareil i → séance i.

BLOQUANT
1. cuisine.js:109 nextQuest = 1re recette non apprise (ordre fixe) : Brochette (l.51) veut du Piment (Meramon seul, l.74,
   fin ch3) ; Sorbet (l.55) Glace pilée (Frigimon, région jamais ouverte). → sauter les recettes sans source dispo / réordonner.
2. (retouches gym, retouches_donnees.js bloc gym l.10423-10470) cases N (20,24) (44,24) devenues chemin ; haies = objets
   « hurdle » absents de POSTES (training.js:27) ; panneau 47,24 retiré. → POSTES.hurdle { k:'spd', jeu:'hurdle', nom:'Haies' }.

IMPORTANT
3. Panneaux rocher (PV) / mannequin (Att) à 4-5 cases de leur poste (gym.js:147, x2) ; station() cherche à 3 (training.js:98)
   → séance au panneau avec eq 'atk' → jeu du rocher. Moitié droite du panneau de la 2e haie (gym.js:149) idem.
   → panneau sans eq : viser le poste le plus proche de sa stat (case ou appareil) dans un rayon de 6.
4. Gymnase seulement si Leomon en ville (gymnase.js:31), Leomon boss montagne7 ; sortie est « des: 10 »
   (retouches_donnees.js:9272). → autre condition (chapitre >= 2, Elecmon coach provisoire).
5. Distributeur posé au Terrain (51,8) muet : distrib.js:29-30 sort avant de brancher (l.33-34). → brancher avant le test i < 0.
6. Salle de sport maison (joueur.js:180-181 m.tr += pts) sans plafond ni fatigue/maladie ; sac sport2 de côté = séance
   « Frappe » sans limite. → Training.gain() + Training.blocked().
7. Étal ferme (champs.js:129 ShopScene('fruits'), rang 18 > plafond 4/7/10 items.js:166) vide ; Glacier de Frigimon
   (services.js:28, 110) même liste ; await manquant champs.js:129. → liste « ferme ».
8. Jijimon/Koromon envoient vers Leomon (Alpages Suspendus, fermé) (village.js:377, 445-446) ; « éboulis à l'est » (373).
   → recrues avec hint et zone non verrouillée ; sinon DW.Chapter.objective().
9. Sora jamais chez toi (chapitre3.js:156, 194, 205 ; joueur.js:48-50 KIDS_HOME, ROOMS) → sora + ROOMS.sora + PARTNER.sora.
10. Ingrédient du jour seulement en parlant au PNJ, pas au comptoir (overworld.js:410-418) ; Sel de Gotsumon dès la 1re
    recette (cuisine.js:50, 111). → Cuisine.afterTalk({ sp }) à la fin de chaque service de comptoir.

MINEUR
11. Classe : poste « Étude » = jeu du rocher sous « Méditation » (trainfield.js:40, 173 ; training.js:23) ; tableau de
    mémoire illisible (panneau '3,2' classe.js:24, objet en y 3 palais.js:27).
12. 18 pièces des quartiers : panneaux restés sous les meubles retirés par l'escalier (quartiers.js:186 clearStairs).
13. Maison : panneaux 12,2 et 13,2 restent (joueur.js:218, 228-231) → « De beaux tableaux » devant l'escalier de la cave.
14. « Je sert / Je court / Je fait / Je raconte ce qu'il a vu » (services.js:180 ; story.js:50-52, 75).
15. Enseignes ≠ stock : Grill de Meramon (services.js:27), Tentomon (services.js:30), « Super Viande » (champs.js:168 ; items.js:62).
16. Champs : maïs → Radis faucon, tournesols/ruches → Noix douce, citrouilles → Melon chaîne rang 20 (champs.js:17, 124) ;
    ponton de Gomamon : viandes et remèdes (champs.js:186).
17. Koromon « Médicament (Bazar) » (village.js:368) ; « boutiques ouvrent à 6 h » (village.js:397) ; « Une coupe par jour »
    (interieurs.js:48) ; Champion gagne la Coupe Junior tous les jours (activities.js:113).
18. Relais de Birdramon ouvre le menu de Biyomon signé Biyomon (services.js:116 → village.js:497).
19. Lalamon/Floramon inexistants → 3 Yokomon (grandir.js:266, 295) ; dortoir « maisons reconstruites » (grandir.js:150).
20. sol.js:34-38 trouvailles dans des cases enfermées (30 ville, 30 Champs) → vérifier la liaison au héros.
21. Comptoir du Bazar -15 % pas sur les meubles (joueur.js:382) ; panneau Résidentiel annonce Marché/Numérique trop tôt (quartiers.js:404).
22. Traîneau : « ESPACE : Endurance », « Poste « Endurance » (PV) » (overworld.js:684 ; training.js:111) ; « fatigue +30 % »
    toujours (training.js:225) alors que 20/30/40 (l.80).

AJOUTS : 23 étals du Marché vivants (quartiers.js:415-417) ; 24 records du Terrain + Paquet de cartes au 1er 6/6 ;
25 Elecmon coach du matin (DW.TaiBuddy gym.js:104) ; 26 cultures de saison ; 27 jour de marché le 10 ; 28 tour de piste chronométré.
