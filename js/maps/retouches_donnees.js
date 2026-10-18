'use strict';
// =====================================================================
//  RETOUCHES DES CARTES — fichier ÉCRIT PAR L'ÉDITEUR DE CARTES (dossier editeur/, sur le PC du créateur).
//  Ne pas modifier à la main : l'éditeur le réécrit en entier à chaque sauvegarde.
//  cartes[id] : { theme, falaise, cases: { "x,y": caractère }, niveaux: { "x,y": altitude }, ajouts: [objets], retraits: ["sorte@x,y"] }
//  puzzle : { pieces, passages } (remplace celui de maps/puzzle.js) ou null
//  modeles : compositions réutilisables de l'éditeur (bosquets, ruines...) : { nom: { w, h, cases, objets } }
// =====================================================================
DW.RETOUCHES = {
 "version": 1,
 "cartes": {},
 "puzzle": null,
 "modeles": {}
};
