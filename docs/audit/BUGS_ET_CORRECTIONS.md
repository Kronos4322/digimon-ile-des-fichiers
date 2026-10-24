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
| SYS-11 | P3 | Description cassée du Gâteau de fête | corrigé (52ebfcc) |
| SYS-12 | P3 | Fruits à 1000 Bits sans effet propre | corrigé (52ebfcc) : bonheur, discipline, fatigue |
| SYS-13 | P3 | Chiffres des descriptions justes seulement pour un Disciple | corrigé (52ebfcc) : gains par stade dans les textes |
| SYS-14 | P3 | Village des Yokomon : Viande géante deux fois en boutique | corrigé (e862fe0) |
| SYS-15 | P3 | « Sac plein (10 max) » quand ce sont les 20 sortes qui manquent | corrigé (e862fe0) |
| SYS-16 | P3 | Manuel de technique en plein combat, sur le premier Digimon seulement | corrigé (e862fe0) |
| SYS-17 | P3 | Gants de flamme (cadeau unique) vendables | corrigé (52ebfcc) |
| SYS-18 | P3 | Boutique « fruits » jamais ouverte | non corrigé : contenu d'un chapitre futur (aucun marchand de fruits avant le chapitre 4) |
| SYS-19 | P3 | Coffre de la maison et Banque : un seul stock, jamais dit | corrigé (e862fe0) : annoncé par Kunemon et dans l'écran |
| SYS-20 | P3 | Textes de la quête des Bukamon (« Disque PM », Seadramon après sa défaite) | corrigé (e862fe0) |
| SYS-21 | P3 | Demandes de statistiques remplies d'avance | corrigé (21a6651) : 25 % de plus qu'un Digimon jamais entraîné |
| SYS-22 | P3 | Demandes « vaincre » : seules les rencontres visibles comptent | corrigé (e862fe0, 38a2614) : les Digimon cachés dans le décor et le gardien du Grand Arbre comptent aussi |
| SYS-23 | P3 | La soif des Yokomon disparaît si Meramon est calmé avant | corrigé (e862fe0) |
| SYS-24 | P3 | Code mort : le remerciement de Gomamon après la quête | non corrigé : un autre Gomamon vit en ville (pêche), le garder sur la rive en ferait deux |
| SYS-25 | P3 | Revanches contre Shellmon : Bits illimités | corrigé (e862fe0) : prime une fois par jour (l'expérience reste à volonté) |
| SYS-26 | P3 | Défaite et Pilote automatique pas sauvegardés tout de suite | corrigé (e862fe0) |
| SYS-27 | P3 | Stockage presque plein : la copie de secours échoue sans le dire | corrigé (e862fe0) : avertissement |
| SYS-28 | P3 | Objets et techniques inconnus effacés ; version plus récente rétrogradée sans message | corrigé (e862fe0, 69aeb0c), test : objets et techniques gardés à part puis rendus, message au chargement |
| SYS-29 | P3 | Une 2e sauvegarde illisible écrase la 1re | corrigé (e862fe0), test : deux copies gardées |
| SYS-30 | P3 | Supprimer la partie en cours : la sauvegarde automatique la recrée | corrigé (e862fe0) : retour à l'écran titre |
| SYS-31 | P3 | Champs simples non vérifiés au chargement (Bits en texte → NaN) | corrigé (e862fe0), test |
| SYS-32 | P3 | FICHIER : la clé `_remplacee` traitée comme une partie principale | corrigé (e862fe0), test |
| SYS-33 | P3 | FICHIER : erreurs de fusion silencieuses, sauvegarde pendant l'écriture sautée | en partie (e862fe0) : écritures protégées, message « mémoire pleine », écriture relancée ; « la plus récente » dépend encore de l'horloge de chaque appareil |
| SYS-34 | P3 | Silence après un jingle « victory » | corrigé (e862fe0), test |
| SYS-35 | P3 | Pays de Meramon : musique générique | corrigé (e862fe0) : musique du canyon |
| SYS-36 | P3 | L'harmonica de Matt ne revient pas après un combat | corrigé (e862fe0) |
| SYS-37 | P3 | `Audio.stop()` n'annule pas la musique en attente | corrigé (e862fe0) |
| SYS-38 | P3 | Réglages du son limités ; le son continue onglet caché | corrigé (e862fe0, 38a2614) : son suspendu quand le jeu est caché ; volumes de la musique et des bruitages dans les Options |
| SYS-39 | P3 | Manette seule : peut-être aucun son | non vérifié (demande un essai réel avec une manette) |
| SYS-40 | P3 | Distributeur prévu sur « tunnel0 » jamais posé | non corrigé : région d'un chapitre futur |

## Cartes (15 anomalies : 0 P0, 0 P1, 2 P2, 13 P3)

| N° | Gr. | Anomalie | État |
|---|---|---|---|
| C-P2-1 | P2 | Maison de Penguinmon : la sortie renvoie à ~37 cases de la porte | corrigé (94b9945), test |
| C-P2-2 | P2 | L'arbre creux de la Prairie change de place selon l'ordre de préparation | corrigé (94b9945) : (62,25) dans les trois ordres essayés |
| C-P3-1 | P3 | Clairière → Sentier : un arbre de l'atelier sur une voie de sortie | corrigé (a4e0391) : arbre retiré |
| C-P3-2 | P3 | Prairie → Sentier : un arbre de l'atelier sur une voie de sortie | corrigé (a4e0391) : arbre retiré |
| C-P3-3 | P3 | Prairie ↔ Village des Bébés : une voie morte (collision forcée de l'atelier) | corrigé (a4e0391) : passage de 5 voies, toutes praticables |
| C-P3-4 | P3 | Ville → Terrain d'entraînement : sortie de 5 cases pour une entrée de 4 | corrigé (a4e0391) : 4 cases |
| C-P3-5 | P3 | Souterrain de Jijimon : la 2e case de l'escalier arrive dans un mur | corrigé (94b9945) |
| C-P3-6 | P3 | Village des Bébés : 2e voie de la sortie de chez Penguinmon sur un obstacle | corrigé avec C-P2-1 |
| C-P3-7 | P3 | Atelier : lac1 ↔ lac0 se ferme à partir du chapitre 4 (`jusqua: 3`) | corrigé (a4e0391) : ouvert à partir du chapitre 2 |
| C-P3-8 | P3 | Champs : textes de bottes de foin sans bottes de foin | corrigé (94b9945) |
| C-P3-9 | P3 | Ville : deux poteaux effacés dans l'atelier, leurs textes restés | corrigé (a4e0391) : textes retirés (tes nouveaux panneaux les remplacent) |
| C-P3-10 | P3 | Textes posés sur le sol au lieu du décor | corrigé (94b9945, a4e0391) : initiales sur la roche, texte du pont lu depuis le pont |
| C-P3-11 | P3 | Grotte de Sora : rocher et échelle suivis par une comparaison de longueurs | corrigé (a4e0391) : on compare quels objets sont là |
| C-P3-12 | P3 | `OPENS volcan: 3` alors que le Mont Panorama reste fermé | décision du joueur : Mont Panorama fermé pour l'instant ; configuration commentée (94b9945) |
| C-P3-13 | P3 | Grille du monde : 23 chevauchements | décision du joueur : carte du monde mise en pause à ta demande |

Autres constats sur les cartes, relevés avant l'audit :
- 68 bords de décor débordent légèrement de leur case (P3) : non corrigé ;
- 7 espèces de la lignée de Kari ne s'obtiennent pas par un œuf (l'œuf de YukimiBotamon n'est pas dans la liste des œufs) : Kari n'est pas encore dans l'histoire.

## Digimon et combats (32 anomalies : 0 P0, 1 P1, 10 P2, 21 P3)

| N° | Gr. | Anomalie | État |
|---|---|---|---|
| D1 | P1 | L'ABI se gagne en boucle (Digivolution ↔ dé-digivolution) : plafond de 99 par stat dès le N.7 | corrigé (52ebfcc), test : une fois par forme (10 allers-retours : ABI 30 → 3) |
| D2 | P2 | Mode « Statistique » : difficulté figée, gains démesurés (Att +384 en 12 séances) | corrigé (52ebfcc), test : 1,25 fois le mode Digivolution |
| D3 | P2 | Bandage X : n'importe quel Champion devient Monzaemon sans écusson | corrigé (e862fe0, avec SYS-05), test |
| D4 | P2 | MegaKabuterimon, MagnaAngemon et Angewomon sans écusson | corrigé (52ebfcc), test ; Angewomon prend l'écusson de T.K. en attendant celui de Kari |
| D5 | P2 | Un objet de Digivolution fait changer de lignée (dé-digivolution, renaissance) | corrigé (52ebfcc), test |
| D6 | P2 | Ogremon → Etemon et Devimon → Megadramon impossibles | corrigé (52ebfcc), test |
| E1 | P2 | Koromon sans technique de Feu : 21 % de victoires contre les autres Entraînement | corrigé (52ebfcc), test : 79 % |
| E2 | P2 | Birdramon, Garurumon... demandent d'affamer son Digimon | corrigé (52ebfcc), test |
| E3 | P2 | Les éléments décident presque seuls des combats | décision du joueur : gardé tel quel (« Greymon est un Digimon de Feu, c'est normal ») |
| E4 | P2 | Les Méga atteignent 999 partout dès leur arrivée | décision du joueur : « pour plus tard » (hors des chapitres 1 à 3) |
| E5 | P2 | Revanche de Shellmon : environ 2 000 Bits à volonté | corrigé (e862fe0, avec SYS-25) |
| D7 | P3 | Un Digimon K.O. digivolue depuis sa fiche et se relève | corrigé (52ebfcc), test |
| D8 | P3 | Une puce relève un Digimon K.O. | corrigé (e862fe0), test |
| D9 | P3 | Le sommeil ne fait perdre qu'une action | corrigé (52ebfcc), test : 2 actions |
| D10 | P3 | Gain des puces faux hors du stade Disciple | corrigé (52ebfcc) |
| D11 | P3 | « Suivant : 24 240 » au N.100 | corrigé (52ebfcc) |
| D12 | P3 | PV non bornés au chargement | corrigé (52ebfcc), test |
| D13 | P3 | Références mortes (tyrannomon, kunemon2, pagumon) | corrigé (52ebfcc, 7b2ae96) ; la liste des Digimon nocturnes garde des espèces futures |
| D14 | P3 | Pièce de métal et Miroir de lune introuvables | corrigé (52ebfcc) : vendus quand la ville est à 100 % |
| D15 | P3 | Dé-digivolution d'Omegamon : partenaire de fusion perdu | corrigé (52ebfcc) : refusée, avec un message |
| D16 | P3 | La Lutte n'est pas proposée tant qu'une technique de statut est payable | corrigé (52ebfcc), test ; menu à 7 choix regardé à l'écran |
| D17 | P3 | Combat du Dojo d'Elecmon traité comme un combat sauvage | corrigé (52ebfcc, 7b2ae96) : combat amical, plus compté parmi les Digimon de la zone |
| D18 | P3 | Bits selon le Digimon actif au K.O. | corrigé (52ebfcc), test |
| D19 | P3 | Statistiques négatives (Gymnase) | corrigé (52ebfcc), test |
| D20 | P3 | Gomamon → Shellmon sans victoire | corrigé (52ebfcc), test |
| D21 | P3 | 29 espèces sans dessin de secours | non corrigé : le jeu attend toutes les images avant de laisser jouer ; reste le cas d'une image qui ne se télécharge pas |
| D22 | P3 | Le test « Shellmon à mi-vie » ne lisait pas la vraie valeur | corrigé (52ebfcc) |
| D23 | P3 | README périmé (70 espèces) | corrigé (7b2ae96) : 81 espèces, 132 Digivolutions |
| D24 | P3 | La renaissance remet l'ABI à 0 | corrigé, décision du joueur (« on ne remet pas les ABI à zéro ») : l'ABI est gardé à la renaissance, test |
| D25 | P3 | Pas de technique de classe Poison | non corrigé : contenu à créer |
| E6 | P3 | EXP entière pour les Digimon restés au fond | corrigé (52ebfcc), test : la moitié |
| E7 | P3 | L'allié frappe à un pourcentage fixe des PV du boss | gardé : voulu, simple |

## Graphismes (36 anomalies : 0 P0, 3 P1, 9 P2, 24 P3)

Les identifiants de l'audit graphique qui commencent par D (Digimon) sont suffixés ici par « g » pour ne pas se confondre
avec ceux de l'audit des Digimon.

| N° | Gr. | Anomalie | État |
|---|---|---|---|
| T1 | P1 | Le détourage efface les verts du dessin (45 objets perdent 5 % ou plus) | en partie (7b2ae96) : 30 objets refaits avec un détourage net et regardés un à un (jardinières, trèfles, trampoline, buisson fleuri, haie, jeux des villages de bébés, étal de fruits, portail du vent, palmier...) ; 15 gardent l'ancien détourage : objets à lueurs peintes, brindilles, herbes à brins fins, rochers de la plage (le nouveau y laissait du vert citron) |
| T2 | P1 | Yeux d'Agumon et de Palmon troués, griffes de Palmon effilochées | corrigé (7b2ae96) |
| R1 | P1 | L'écran titre imite le logo officiel (™) | corrigé (a66a8c0) : écusson effacé, titre dessiné par le jeu |
| D1g | P2 | Yuramon : vue combat tournée à gauche | corrigé (7b2ae96) |
| D2g | P2 | Togemon : vue profil tournée à gauche | corrigé (7b2ae96) |
| D4g | P2 | Bukamon plus grand que les Disciples | décision du joueur : garder (demandé plusieurs fois) |
| S1 | P2 | Parois des souterrains du volcan rayées | corrigé (905a766) : plus de bandes ; la roche a un grain vertical |
| S2 | P2 | `grotte/dalles_fissurees` : couture horizontale | corrigé (905a766) : raccord sur la période du dessin |
| Z1 | P2 | Arbres et étals flous | en partie (7b2ae96) : les 23 arbres refaits à 210 px (au lieu de 111 à 143) ; étals : leur dessin d'origine est trop petit pour faire mieux |
| Z2 | P2 | Volcan : 2,96 Mo de PNG chargés au démarrage | corrigé (905a766) : 187 Ko de WebP chargés en arrière-plan ; 8,3 Mo avant de jouer au lieu de 11,2 |
| R2 | P2 | Nom de l'application et icônes sous la marque | décision du joueur : jeu de fan, « non officiel » écrit à l'écran titre et dans le README |
| R3 | P2 | Personnages et univers de la franchise | propre à un jeu de fan : mention © Bandai / Toei (écran titre, README) |
| T3 | P3 | La compression WebP verdit le contour | corrigé (2a5548b) : les pixels transparents prennent la couleur du bord avant l'encodage (496 objets) ; excès de vert au contour, ex. jardinière rose +3,4 → −1,1, Pabumon de face +3,8 → −0,4 |
| T4 | P3 | Trous d'épingle au contour des Digimon | corrigé (2a5548b) : la réduction ne fait plus « rebondir » l'opacité au contour ; 116 vues : 37 576 trous d'épingle → 169 (de vrais petits jours du dessin), 12,8 % plus légères |
| T5 | P3 | Poussière verte dans le kit du personnage | corrigé (2a5548b) : 1 197 grains → 0, le reste du kit identique |
| T6 | P3 | Lueurs peintes sur le vert, perdues ou trouées | non corrigé : ces objets gardent l'ancien détourage |
| T7 | P3 | `grotte/porte_tombeau` : trait d'une voisine collé | corrigé (2a5548b) : trait effacé, image recadrée |
| D5g | P3 | Bébés en pixel art plus petits que les autres | corrigé (2220674) : à la taille des autres bébés |
| D6g | P3 | Poses d'attaque coupées par le cadre (jusqu'à 2,9 %) | corrigé (2a5548b) : le cadre s'élargit du côté où l'image penche ; aussi le haut de la tête pendant la respiration et la marche (jusqu'à 8 px pour Kuwagamon) ; 76 images coupées → 0 |
| D7g | P3 | Birdramon et Meramon touchent le bord de leur planche | non corrigé (planche d'origine) |
| D8g | P3 | Liseré olive sur les Digimon orange | corrigé (2a5548b) : la clé verte est démêlée au contour ; Birdramon 3 à 5 % de contour olive → 0,3 à 1,3 % ; Meramon : il reste surtout son trait doré sombre, tel quel dans le dessin |
| S3 | P3 | Coutures sur des textures jamais employées | non corrigé (jamais employées) |
| S4 | P3 | Répétition visible des sols raccordables | non corrigé |
| S5 | P3 | `grotte/herbe` : petite couture | non corrigé |
| S6 | P3 | Herbe ↔ sable sans fondu | corrigé (5653316) : herbe ↔ sable et terre ↔ sable tramés sur 3 à 4 px (vu en jeu : Lac, Dunes) |
| S7 | P3 | Fondus entre cartes calculés sur les palettes | corrigé (5653316) : teinte moyenne des images de sol quand les deux cartes en ont ; 30 paires de voisines avaient un fondu d'herbe faux de plus de 30 (R + G + B) |
| Z3 | P3 | 100 images (1,1 Mo) téléchargées sans être placées | gardé : bibliothèque de l'atelier des cartes (chargée en arrière-plan, après le démarrage) |
| Z4 | P3 | Petits objets trop définis | non corrigé |
| Z5 | P3 | Images HD 2 dans un écran x3 : pixels inégaux | non corrigé |
| O1 | P3 | Fougère dessinée sur le héros | corrigé (45555ca) : le personnage sur une fougère passe devant elle, le bas de la fougère redessiné devant ses pieds |
| O2 | P3 | Base d'un objet sur le haut des herbes hautes | corrigé (45555ca) : le haut des touffes sous le pied d'un objet est redessiné devant lui ; en lisière de forêt, environ 0,5 ms de plus par image |
| O3 | P3 | Silhouette translucide pour le héros seulement | corrigé (45555ca) : aussi pour le partenaire et les habitants à qui l'on parle ; « caché » mesuré sur les vrais pixels des grands objets |
| O4 | P3 | Objets « walk » triés à −10 | corrigé (45555ca) : les petites plantes qui dépassent de leur case passent devant les pieds d'un personnage de la rangée du dessus ; tapis, dalles et portes restent dessous |
| O5 | P3 | Grands Digimon de profil : un objet passe devant leurs côtés | corrigé (45555ca) : les Digimon de plus de 52 px passent devant le décor de leur rangée ; le héros reste devant son partenaire |
| R4 | P3 | Mentions légales incomplètes, README inexact | corrigé (7b2ae96) : README réécrit (© Bandai / Toei, provenance des images, police) |
| R6 | P3 | Images générées par une IA : traçabilité | documenté (README) |
