# Anomalies et corrections

Registre de toutes les anomalies relevées par l'audit intégral du 21-22/10/2026, avec ce qui en a été fait.
Les fiches complètes (fichier:ligne, reproduction, impact) sont dans `rapports/`. Le domaine est donné par le préfixe :
- **SYS** : systèmes (objets, quêtes, sauvegardes, sons) ;
- **D / E** : Digimon et combats (D : bug ; E : équilibrage) ;
- **C** : cartes ;
- **G** : graphismes.

**Gravités** :
- **P0** : bloquant (partie perdue ou bloquée) ;
- **P1** : majeur ;
- **P2** : notable, mais localisé ;
- **P3** : mineur.

**États** :
- **corrigé** (commit) : corrigé et vérifié ; « test » quand un test automatique le couvre désormais ;
- **en partie** : une partie seulement est corrigée, le reste est dit ;
- **décision du joueur** : question de conception, laissée telle quelle en attendant ton avis ;
- **non corrigé** : laissé, avec la raison.

## Systèmes (40 anomalies : 1 P0, 3 P1, 6 P2, 30 P3)

| N° | Gr. | Anomalie | État |
|---|---|---|---|
| SYS-01 | P0 | Jeu fermé pendant le bilan d'un chapitre : partie rouverte au chapitre précédent, boss vaincu, bloquée pour toujours | corrigé (e862fe0), test : sauvegarde dès le nouveau chapitre, parties touchées réparées au chargement |
| SYS-02 | P1 | Principale abîmée : l'emplacement paraît vide, la précédente lisible est écrasée | corrigé (e862fe0), test |
| SYS-03 | P1 | FICHIER : la partie locale remplacée est perdue à la sauvegarde suivante | corrigé (e862fe0), test |
| SYS-04 | P1 | Deux « Nouvelle partie » sur un emplacement : la première partie disparaît | corrigé (e862fe0), test : deux parties mises de côté |
| SYS-05 | P2 | Bandage X (coffre du chapitre 3) : un Ultime sans écusson ; aucun objet de Digivolution ne vérifie les écussons | corrigé (e862fe0), test |
| SYS-06 | P2 | Sac plein : la Canne à pêche est perdue pour toujours | corrigé (e862fe0) : coffre, et Gomamon en redonne une si elle a disparu |
| SYS-07 | P2 | Sac plein : récompenses uniques perdues, « laissé sur place » faux | corrigé (e862fe0), test : récompense au coffre (nourriture au frigo), message juste |
| SYS-08 | P2 | Champignon de luxe à 20 % (≈ 10 par jour dès le chapitre 1) | corrigé (e862fe0) : 2 % |
| SYS-09 | P2 | Après un chargement de secours, la copie de secours devient illisible | corrigé (e862fe0), test |
| SYS-10 | P2 | Séquenceur : notes en retard jouées toutes à la fois | corrigé (e862fe0), test |
| SYS-11 | P3 | Description cassée du Gâteau de fête | voir l'agent Digimon (§ Digimon et combats) |
| SYS-12 | P3 | Fruits à 1000 Bits sans effet propre | voir l'agent Digimon |
| SYS-13 | P3 | Chiffres des descriptions justes seulement pour un Disciple | voir l'agent Digimon (D10) |
| SYS-14 | P3 | Village des Yokomon : Viande géante deux fois en boutique | corrigé (e862fe0) |
| SYS-15 | P3 | « Sac plein (10 max) » quand ce sont les 20 sortes qui manquent | corrigé (e862fe0) |
| SYS-16 | P3 | Manuel de technique en plein combat, sur le premier Digimon seulement | corrigé (e862fe0) |
| SYS-17 | P3 | Gants de flamme (cadeau unique) vendables | voir l'agent Digimon |
| SYS-18 | P3 | Boutique « fruits » jamais ouverte | non corrigé : contenu d'un chapitre futur (aucun marchand de fruits avant le chapitre 4) |
| SYS-19 | P3 | Coffre de la maison et Banque : un seul stock, jamais dit | corrigé (e862fe0) : annoncé par Kunemon et dans l'écran |
| SYS-20 | P3 | Textes de la quête des Bukamon (« Disque PM », Seadramon après sa défaite) | corrigé (e862fe0) |
| SYS-21 | P3 | Demandes de statistiques remplies d'avance | corrigé (21a6651) : 25 % de plus qu'un Digimon jamais entraîné |
| SYS-22 | P3 | Demandes « vaincre » : seules les rencontres visibles comptent | en partie (e862fe0) : les Digimon cachés dans le décor comptent ; le gardien du Grand Arbre non |
| SYS-23 | P3 | La soif des Yokomon disparaît si Meramon est calmé avant | corrigé (e862fe0) |
| SYS-24 | P3 | Code mort : le remerciement de Gomamon après la quête | non corrigé : un autre Gomamon vit en ville (pêche), le garder sur la rive en ferait deux |
| SYS-25 | P3 | Revanches contre Shellmon : Bits illimités | corrigé (e862fe0) : prime une fois par jour (l'expérience reste à volonté) |
| SYS-26 | P3 | Défaite et Pilote automatique pas sauvegardés tout de suite | corrigé (e862fe0) |
| SYS-27 | P3 | Stockage presque plein : la copie de secours échoue sans le dire | corrigé (e862fe0) : avertissement |
| SYS-28 | P3 | Objets et techniques inconnus effacés ; version plus récente rétrogradée sans message | en partie (e862fe0), test : objets gardés à part et rendus, message ; les techniques inconnues sont encore retirées (dans `game/monster.js`) |
| SYS-29 | P3 | Une 2e sauvegarde illisible écrase la 1re | corrigé (e862fe0), test : deux copies gardées |
| SYS-30 | P3 | Supprimer la partie en cours : la sauvegarde automatique la recrée | corrigé (e862fe0) : retour à l'écran titre |
| SYS-31 | P3 | Champs simples non vérifiés au chargement (Bits en texte → NaN) | corrigé (e862fe0), test |
| SYS-32 | P3 | FICHIER : la clé `_remplacee` traitée comme une partie principale | corrigé (e862fe0), test |
| SYS-33 | P3 | FICHIER : erreurs de fusion silencieuses, sauvegarde pendant l'écriture sautée | en partie (e862fe0) : écritures protégées, message « mémoire pleine », écriture relancée ; « la plus récente » dépend encore de l'horloge de chaque appareil |
| SYS-34 | P3 | Silence après un jingle « victory » | corrigé (e862fe0), test |
| SYS-35 | P3 | Pays de Meramon : musique générique | corrigé (e862fe0) : musique du canyon |
| SYS-36 | P3 | L'harmonica de Matt ne revient pas après un combat | corrigé (e862fe0) |
| SYS-37 | P3 | `Audio.stop()` n'annule pas la musique en attente | corrigé (e862fe0) |
| SYS-38 | P3 | Réglages du son limités ; le son continue onglet caché | en partie (e862fe0) : son suspendu quand le jeu est caché ; pas encore de réglage de volume |
| SYS-39 | P3 | Manette seule : peut-être aucun son | non vérifié (demande un essai réel avec une manette) |
| SYS-40 | P3 | Distributeur prévu sur « tunnel0 » jamais posé | non corrigé : région d'un chapitre futur |

## Cartes (15 anomalies : 0 P0, 0 P1, 2 P2, 13 P3)

| N° | Gr. | Anomalie | État |
|---|---|---|---|
| C-P2-1 | P2 | Maison de Penguinmon : la sortie renvoie à ~37 cases de la porte | corrigé (94b9945), test |
| C-P2-2 | P2 | L'arbre creux de la Prairie change de place selon l'ordre de préparation | corrigé (94b9945) : (62,25) dans les trois ordres essayés |
| C-P3-1 | P3 | Clairière → Sentier : un arbre de l'atelier sur une voie de sortie | décision du joueur : retouche de l'atelier (l'arrivée est décalée d'une case, sans blocage) |
| C-P3-2 | P3 | Prairie → Sentier : un arbre de l'atelier sur une voie de sortie | décision du joueur : idem |
| C-P3-3 | P3 | Prairie ↔ Village des Bébés : une voie morte (collision forcée de l'atelier) | décision du joueur : retouche de l'atelier |
| C-P3-4 | P3 | Ville → Terrain d'entraînement : sortie de 5 cases pour une entrée de 4 | décision du joueur : retouche de l'atelier (la 5e voie arrive décalée d'une case) |
| C-P3-5 | P3 | Souterrain de Jijimon : la 2e case de l'escalier arrive dans un mur | corrigé (94b9945) |
| C-P3-6 | P3 | Village des Bébés : 2e voie de la sortie de chez Penguinmon sur un obstacle | corrigé avec C-P2-1 |
| C-P3-7 | P3 | Atelier : lac1 ↔ lac0 se ferme à partir du chapitre 4 (`jusqua: 3`) | décision du joueur : sans effet tant que le chapitre 4 n'existe pas |
| C-P3-8 | P3 | Champs : textes de bottes de foin sans bottes de foin | corrigé (94b9945) |
| C-P3-9 | P3 | Ville : deux poteaux effacés dans l'atelier, leurs textes restés | décision du joueur : remettre les poteaux ou retirer les textes dans l'atelier |
| C-P3-10 | P3 | Textes posés sur le sol au lieu du décor | en partie (94b9945) : souterrain corrigé ; pont de lave de la grotte de Sora en attente (fichier modifié par l'agent images) |
| C-P3-11 | P3 | Grotte de Sora : rocher et échelle suivis par une comparaison de longueurs | non corrigé pour l'instant (même fichier) : sans effet en partie normale |
| C-P3-12 | P3 | `OPENS volcan: 3` alors que le Mont Panorama reste fermé | commenté (94b9945) ; la fermeture est ta décision |
| C-P3-13 | P3 | Grille du monde : 23 chevauchements | non corrigé : carte du monde mise en pause à ta demande |

Autres constats sur les cartes, relevés avant l'audit :
- 68 bords de décor débordent légèrement de leur case (P3) : non corrigé ;
- 7 espèces de la lignée de Kari ne s'obtiennent pas par un œuf (l'œuf de YukimiBotamon n'est pas dans la liste des œufs) : Kari n'est pas encore dans l'histoire.

## Digimon et combats (32 anomalies : 0 P0, 1 P1, 10 P2, 21 P3)

En cours de correction (agent Digimon) : tableau rempli à la fusion de ses corrections.

## Graphismes (36 anomalies : 0 P0, 3 P1, 9 P2, 24 P3)

En cours de correction (agent images) : tableau rempli à la fusion de ses corrections.
