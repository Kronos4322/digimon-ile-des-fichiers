# Rapport du relecteur « chapitres 2 et 3 » (20/10, lecture seule) — à traiter

> **État après la mission (21/10)** — points 1 à 14, 16 à 18 : FAITS (publiés). Point 6 : ta retouche qui retire la
> feuille rouge est gardée, la veillée la raconte sans qu'elle soit posée. Point 15 : le vrai phare (lac9) a son texte ;
> les repères automatiques « Le Phare du lac » de la Rive Sud et du Pont Numérique restent (décor automatique : à
> décider). Point 19 (boules de lave collées à Meramon, retouches de miharashi4) : à revoir dans l'atelier.
> Ajouts : 21 (attendre le soir sur l'île), 22 (« que faire maintenant ? » chez Jijimon), 23 (texte du phare),
> 27 (Yokomon de l'oasis), 29 (épave) : FAITS ; 20, 24, 25, 26, 28 : proposés, non faits.

Verdict : jouables jusqu'au bout (héros original), simulation Node de la Rive Sud au carton « Chapitre 4 ».
Outils : scratchpad/audit_ch23 (dump.js, simu.js, simu2.js, logs, dump_lac.json, dump_mih.json).

BLOQUANT
1. Anciennes parties héros enfant (sauvegarde.js:17 hero:'tai') : Seadramon reste boss de lac7 (story.js:140,
   chapitre2.js:11), rien n'appelle end2 → ch2 sans fin. → end2 après Seadramon de lac7, ou convertir en héros original.

IMPORTANT
2. chapitre2.js:205 horloge à 6 h sans compter la veillée comme nuit → « nuit blanche », faim/soif 95.
   → après 205 : for (const d of s.party) d.slept = s.clock; s.careClock = s.clock;
3. Indices faux : Monochromon Terre/Feu → conseiller l'Eau (x1,8) (chapitre2.js:131, village.js:513 disent feu+élec) ;
   Meramon Feu → « l'eau et la terre » (chapitre3.js:116 dit eau et glace).
4. Sora annoncée chez toi (chapitre3.js:157, :194) mais KIDS_HOME = Tai, Matt (joueur.js:48, 71-100) ; donjons.js:142-143
   la place chez Jijimon ; Biyomon de Sora nulle part. → chambre Sora (modèle Matt joueur.js:91), exclure Sora donjons.js:143.
5. (atelier) cabines de toilettes retirées (lac0 42,60 ; lac1 51,35 ; lac4 72,37 ; lac8 25,41 ; miharashi4 91,32) :
   cases « toilettes » invisibles (panneaux restent regions.js:361, retouches.js:55) ; « toilet » posées sans action
   (overworld.js:417-423). → retirer panneaux sous objet retiré ; DW.Care.toilet pour les objets « toilet ».
6. (atelier) retouche « seatail@52,47 » de lac2 retire la feuille rouge dont la scène dépend (chapitre2.js:77, :166,
   village.js:514). → annuler cette retouche.
7. Biyomon (village.js:506-515) sans nouvelles du ch3 alors que Jijimon (chapitre2.js:379) y renvoie. → 3 nouvelles.

MINEUR
8. Plaine des Panneaux : panneau 91,20 sur forêt (miharashi.js:212) ; panneau du Désert sans « ↓ Plaine » (213). → freeNear.
9. Rive Sud sortie ouest fermée « Monochromon te barre la route » (chapitre2.js:105) alors qu'il est à l'est (87,35).
10. Passage Rosière → Désert pendant ch2 : seul verrou chapitre1.js:172, pas de voile, message inadapté. → {des:3}.
11. Région « Lac du Tramway » = nom de la carte de l'île (regions.js:555) ; vol Biyomon et passeur → Rive Sud. → « Grand Lac ».
12. Bilans ch2/ch3 dessinent Tai+Agumon en dur (chapitre1.js:110-115). → enfant du chapitre en paramètre.
13. Carton « CHAPITRE 4 » (chapitre3.js:196) sans contenu → « À suivre ». Ch4 : Rosière ↔ Rive Sud à sens unique
    ({jusqua:3} écrasée côté lac0 par chapitre2.js:105).
14. Journal : Pays de Meramon absent (story.js:19-36), Engrenage de Meramon compté « volcan » (chapitre3.js:126) →
    « ??? — Libérée » Mont Panorama.
15. decor.js:54,135 pose « Le Phare du lac » (thème spring) sur Rive Sud et Pont Numérique ; vrai phare lac9 sans texte (regions.js:564).
16. Textes village : panneau « y puisent l'eau » (regions.js:590) ; « le lac se remplit » (chapitre3.js:60) mais seule la
    fontaine change ; épave sans texte ; longue-vue (miharashi.js:429) ; poteaux « nulle part » (chapitre3.js:39) vs panneau.
17. Meramon : « veiller sur la source » (chapitre3.js:147) puis « part s'installer en Ville » (:159, town.js:71).
18. Boss sauvages : Meramon et Birdramon (wild.js:28), Seadramon dès lac7 (wild.js:21) → champ ch (wild.js:74).
19. (atelier) boules de lave collées à Meramon (49,29 et 46,31) ; code les tient à 6 cases (miharashi.js:330, 494).

AJOUTS ch2 : 20 panneaux vers l'île (fourche Rive Sud, Cascade lac6) + harmonica la nuit dès lac6 ; 21 « Attendre le soir »
sur l'île (couverture du tramway, chapitre2.js:70) ; 22 « Que faire maintenant ? » chez Jijimon (guide.js:15,
DW.Chapter.objective()) ; 23 texte du phare lac9 ; 24 panneau Clairière (foret.js:45) Nord Rive Sud / Ouest Désert.
AJOUTS ch3 : 25 Sora suit vraiment (au pied du Mont) ; 26 piste à la maison (Tai/Matt : fille au chapeau bleu) ;
27 Yokomon assoiffé à l'oasis du Désert (miharashi.js:206) ; 28 prévenir avant Meramon si Sora pas rencontrée
(chapitre3.js:102-107) ; 29 épave : panneau, banc de sable après le retour de l'eau, trouvaille.
