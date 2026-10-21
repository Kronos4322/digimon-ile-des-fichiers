'use strict';
// =====================================================================
//  ÉLÉMENT POISON ET GRANDES TECHNIQUES D'ÉLÉMENT
//  - Poison : bulles, dards, boue et nuages toxiques (fort contre Plante, Insecte, Lumière ;
//    faible contre Terre, Poison, Ténèbres ; la Terre le neutralise)
//  - une grande technique spectaculaire par élément (tempête de feu, raz-de-marée, orage, séisme...)
//  - quelques Digimon les apprennent (EXTRA_LEARN) ; d'autres deviennent de type Poison
//  Animations : game/fxelem.js.
// =====================================================================
(function () {
  DW.TYPES.Poison = { c: '#9a48c0' };
  const EFF = DW.EFF, set = (a, list, m) => list.forEach(d => ((EFF[a] = EFF[a] || {})[d] = m));
  set('Poison', ['Plante', 'Insecte', 'Lumière'], 2); set('Poison', ['Terre', 'Poison', 'Ténèbres'], 0.5);
  set('Terre', ['Poison'], 2); set('Insecte', ['Poison'], 0.5);

  const M = DW.MOVES;
  // (une technique déjà apprise en classe — Orage, Séisme, Tempête de Pétales : data/techniques_classe.js — y reste proposée)
  const mv = (id, o, fx) => { const classe = M[id] && M[id].classe; M[id] = Object.assign({ acc: 100 }, o, { fx }); if (classe != null) M[id].classe = classe; };
  // poison
  mv('dard_venin', { name: 'Dard Venimeux', type: 'Poison', pow: 45, st: { s: 'psn', ch: 0.3 }, desc: 'Trois dards empoisonnés lancés en rafale.' }, 'venomsting');
  mv('boue_toxique', { name: 'Boue Toxique', type: 'Poison', pow: 70, acc: 90, st: { s: 'psn', ch: 0.3 }, desc: 'Une grosse boule de boue violette qui éclabousse tout.' }, 'sludge');
  mv('nuage_toxique', { name: 'Nuage Toxique', type: 'Poison', pow: 0, acc: 85, st: { s: 'psn', ch: 1 }, desc: "Un nuage verdâtre qui empoisonne l'adversaire." }, 'toxiccloud');
  mv('jet_acide', { name: "Jet d'Acide", type: 'Poison', pow: 60, acc: 95, sc: { who: 'foe', s: 'def', n: -1, ch: 0.3 }, desc: 'Un jet acide qui ronge la défense.' }, 'acidspray');
  // une grande technique par élément
  mv('tempete_feu', { name: 'Tempête de Feu', type: 'Feu', pow: 100, acc: 85, st: { s: 'brn', ch: 0.2 }, desc: 'Des colonnes de flammes jaillissent tout autour de la cible.' }, 'firestorm');
  mv('raz_de_maree', { name: 'Raz-de-Marée', type: 'Eau', pow: 95, acc: 90, desc: 'Une vague gigantesque déferle sur le terrain.' }, 'tidalwave');
  mv('orage', { name: 'Orage', type: 'Électrique', pow: 95, acc: 85, st: { s: 'par', ch: 0.2 }, desc: 'Des éclairs tombent du ciel les uns après les autres.' }, 'thunderstorm');
  mv('pics_glace', { name: 'Pics de Glace', type: 'Glace', pow: 75, acc: 95, desc: 'Des pics de glace jaillissent du sol sous la cible.' }, 'icespikes');
  mv('seisme', { name: 'Séisme', type: 'Terre', pow: 90, desc: 'La terre tremble et se fend : des rochers jaillissent.' }, 'quake');
  mv('rayon_sacre', { name: 'Rayon Sacré', type: 'Lumière', pow: 85, desc: 'Un pilier de lumière descend du ciel sur la cible.' }, 'holybeam');
  mv('sphere_obscure', { name: 'Sphère Obscure', type: 'Ténèbres', pow: 80, acc: 95, desc: 'Une sphère noire qui aspire la lumière.' }, 'darkorb');
  mv('tempete_petales', { name: 'Tempête de Pétales', type: 'Plante', pow: 80, acc: 95, desc: 'Un tourbillon de pétales tranchants.' }, 'petalstorm');
  // anciennes techniques : leur vraie nature
  for (const id of ['gadoue_nume', 'ordure_toxique', 'champi_bombe']) if (M[id]) M[id].type = 'Poison';
  if (M.ordure_toxique) M.ordure_toxique.fx = 'sludge';
  if (M.jugement) M.jugement.fx = 'holybeam';
  if (M.neant) M.neant.fx = 'darkorb';

  // Digimon de type Poison
  const S = DW.SPECIES;
  if (S.sukamon) S.sukamon.types = ['Poison'];
  if (S.numemon) S.numemon.types = ['Poison', 'Ténèbres'];
  if (S.mushroomon) S.mushroomon.types = ['Plante', 'Poison'];
  // qui apprend quoi (niveau, technique)
  const EXTRA_LEARN = {
    kunemon: [[8, 'dard_venin']], mushroomon: [[9, 'nuage_toxique'], [19, 'jet_acide']], numemon: [[26, 'boue_toxique']], sukamon: [[25, 'jet_acide'], [30, 'boue_toxique']],
    greymon: [[30, 'tempete_feu']], meramon: [[28, 'tempete_feu']], birdramon: [[30, 'tempete_feu']],
    ikkakumon: [[30, 'raz_de_maree']], gomamon: [[20, 'raz_de_maree']], betamon: [[22, 'raz_de_maree']], shellmon: [[28, 'raz_de_maree']],
    kabuterimon: [[30, 'orage']], elecmon: [[21, 'orage']], tentomon: [[22, 'orage']],
    gabumon: [[20, 'pics_glace']], garurumon: [[28, 'pics_glace']], frigimon: [[26, 'pics_glace']],
    gotsumon: [[19, 'seisme']], monochromon: [[30, 'seisme']], tyrannomon: [[32, 'seisme']],
    patamon: [[22, 'rayon_sacre']], angemon: [[28, 'rayon_sacre']],
    devimon: [[0, 'sphere_obscure']], bakemon: [[24, 'sphere_obscure']],
    palmon: [[20, 'tempete_petales']], togemon: [[28, 'tempete_petales']], biyomon: [[24, 'tempete_petales']],
  };
  for (const sp in EXTRA_LEARN) if (S[sp] && S[sp].learn) for (const [lv, id] of EXTRA_LEARN[sp]) if (M[id] && !S[sp].learn.some(([, x]) => x === id)) S[sp].learn.push([lv, id]);
  for (const sp in S) if (S[sp].learn) S[sp].learn.sort((a, b) => a[0] - b[0]);
})();
