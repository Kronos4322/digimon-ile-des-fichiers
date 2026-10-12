# DIGIMON — L'Île des Fichiers

Jeu de fan non officiel inspiré de la saison 1 de Digimon Adventure, avec une ambiance visuelle
façon *Digimon World* (sprites « pré-rendus 3D », interface bleu-canard) et une logique de jeu
à la Pokémon (combats au tour par tour, capture, niveaux, Digivolution).

## Lancer le jeu
Double-clique sur `index.html` (navigateur récent). Internet sert uniquement aux polices.

## Commandes
| Action | Touches |
|---|---|
| Se déplacer | Flèches ou ZQSD |
| Courir | Maj (Shift) |
| Parler / interagir / valider | Espace |
| Menu | Entrée (ou Échap) |
| Retour | Échap ou Retour arrière |
| Couper le son | M |

La partie est **sauvegardée automatiquement** à chaque changement de zone, après chaque combat
et au choix du partenaire (icône de disquette en bas à droite). « Continuer » sur l'écran titre.

## Contenu actuel (v0.9)
- **Départ en ville** : on se réveille dans la maison de Jijimon, puis on choisit son partenaire sur la place
  (Koromon, Bukamon ou Tanemon) ; les deux autres partent explorer l'île. La ville est alors **vide** : seul **Botamon**
  s'y promène et donne des conseils selon la situation. Un autre **Tanemon** tient le **DigiChamp** (Quartier des Champs) :
  3 Viandes par jour. Faim : +1 toutes les 10 min de jeu (≈ 2,5 Viandes par jour), toilettes ≈ 2 fois par jour.
- **Sac limité à 10 exemplaires par objet** : le surplus est mis de côté ; la **Banque** (à reconstruire) permet de
  déposer et retirer les objets.
- **Ville redessinée** : étang et ruisseau, grande fontaine, grand arbre, potager, allées, fenêtres éclairées la nuit,
  cheminées qui fument, Digimon qui se promènent. Les futurs bâtiments restent cachés jusqu'à leur construction.
- **Quartiers** : la ville grandit en plusieurs cartes. **Quartier des Champs** (sud-ouest) : moulin, champs, verger,
  étang avec cascade et rondins vers un îlot. Intérieurs du Bazar, du Dojo, du Restaurant et de la Serre (DigiFerme).
  9 habitants à retrouver (Gotsumon, Betamon, Elecmon, Mushroomon, Yokomon, Palmon, Biyomon, Kunemon, Gomamon) :
  Ruines → Campement → Hameau → Petit village → Village → Bourg → Petite ville → Ville → Grande ville (puis Cité, Métropole, Mégapole).
- **Combats** : jauge d'énergie et **coup spécial** de chaque Digimon (Flamme Bébé, Méga Flamme, Torpille Harpon…),
  apprentissage des techniques **observées** chez l'ennemi, écran de comparaison avant d'oublier une technique.
- **Zones** : chaque zone a son identité (printemps, sous-bois brumeux, prairie dorée, bois profond, automne, plage vivante),
  Terrain d'entraînement façon Digimon World (piste ovale, panneaux à pictogrammes, jardin zen, gradins).
- Vie de quartier : visiteurs selon l'heure, linge, enseignes qui se balancent ; flaques et reflets sous la pluie.
- **Reconstruction** : 5 Digimon à retrouver et convaincre (souvent en les battant). Chacun construit son bâtiment :
  Gotsumon (Plage) → Bazar · Betamon (Bois des Géants) → Fontaine de soins · Elecmon (Sentier) → Dojo ·
  Mushroomon (Prairie, la nuit) → Restaurant · Yokomon (Clairière, après Kuwagamon) → Jardin et DigiFerme.
  À chaque arrivée, la ville monte de niveau (0 à 5) et s'embellit : pavés réparés, fleurs, lanternes, bancs, fanions.
- **Exploration depuis la ville** : Plage → Lisière du Ravin → Bois des Géants → Sentier des Murmures (+ Prairie des Lucioles)
  → Clairière au cœur de la forêt, gardée par **Kuwagamon**. Les Digimon sauvages sont plus forts loin de la ville.
- **Combats ≠ entraînement** : les combats donnent de l'EXP → le **niveau** fixe le **potentiel** (6 + 2 × niveau points
  d'entraînement par stat, max 64). Le **Terrain d'entraînement** (au sud de la ville) remplit ce potentiel avec un
  mini-jeu de timing (3 essais, ESPACE dans la zone verte, de plus en plus dur). Les **Digivolutions** demandent un niveau
  + des **points d'entraînement** (+ victoires, bonheur) et se déclenchent depuis la **table des Digivolutions** (jamais automatiques).
- **Soins du partenaire** (Digimon de tête, comme DW1) : **faim** (Viande, Super Viande, Restaurant) et **toilettes**
  (Ville, Terrain d'entraînement, Bois des Géants). Sinon : petit accident sur la carte, bonheur en baisse, à nettoyer avec ESPACE.
- Rencontres dans toutes les herbes hautes (une au plus tard tous les 9 pas), aucune en ville.
- Jour/nuit, météo, carte de l'île, fiche Digimon, entraînement, sauvegarde automatique, retour à l'écran titre depuis le menu.

## Organisation du code
Voir **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** (arborescence, ordre de chargement, recettes pour ajouter
un Digimon, une attaque, une zone). Outils : `python dev/serve.py` puis `dev/gallery.html` (sprites) et
`dev/check.html` (vérification des cartes).

## Pistes pour la suite
- Améliorer la plage et le village au même niveau que la forêt
- Montagne de l'Infini, Devimon, Leomon / Ogremon, l'Usine, Andromon...
- Autres enfants DigiDestinés, Écussons et Tags
