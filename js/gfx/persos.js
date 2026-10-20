'use strict';
// =====================================================================
//  PERSONNAGE DU JOUEUR, ASSEMBLÉ (création du personnage : ui/intro.js « QUI ES-TU ? »)
//  Le kit d'habillage dessiné par le joueur (ses planches PErsonnages/, découpées par dev/kit_persos.py :
//  assets/commun/kit/<catégorie>.png et leurs repères DW.KIT, gfx/kit_donnees.js) : on empile les pièces sur un repère
//  commun (le haut du cou en 0, 0 ; le corps fait KIT.HB pixels du cou aux pieds) :
//    sac (derrière) > corps (ou ensemble) > bas > chaussures > haut > accessoires > tête > lunettes > chapeau
//  La peau des pièces (cou d'un haut, jambes d'un bas, visage) prend la teinte du corps choisi.
//  Choix ch = { g (0 garçon, 1 fille), corps, tete, haut (les filles : 30 et plus = un ensemble), bas, chaus, chapeau, sac, acc }
//  (-1 : aucun ; chaussures, chapeau, sac, accessoire). Le petit sprite de marche (gfx/hero.js) reprend ses couleurs (look).
//  Les planches ne sont chargées qu'à l'ouverture de la création (charger) : le démarrage du jeu n'attend pas.
// =====================================================================
(function () {
  const nav = typeof Image !== 'undefined' && typeof document !== 'undefined';
  const racine = nav && document.currentScript ? document.currentScript.src.replace(/js\/gfx\/persos\.js(\?.*)?$/, '') : '';
  const K = DW.KIT, HB = K.HB;
  const CATS = ['corps_f', 'corps_g', 'tete_f', 'tete_g', 'haut', 'ensemble', 'bas_f', 'bas_g', 'chaus', 'chapeau', 'sac', 'acc'];
  const img = {};
  let charge = null, fait = false;
  const charger = () => charge || (charge = new Promise(fin => {
    if (!nav) { fait = true; fin(); return; }
    let reste = CATS.length;
    for (const n of CATS) {
      const im = new Image();
      im.onload = im.onerror = () => { if (im.naturalWidth) img[n] = im; if (--reste === 0) { fait = true; fin(); } };
      im.src = racine + 'assets/commun/kit/' + n + '.png';
    }
  }));

  // ------------------------------------------------------------ les choix possibles
  const NB_HAUTS = K.haut.length, NB_ENS = K.ensemble.length;
  const nombre = (k, g) => ({ g: 2, corps: K.corps_f.length, tete: (g ? K.tete_f : K.tete_g).length, haut: NB_HAUTS + (g ? NB_ENS : 0),
    bas: (g ? K.bas_f : K.bas_g).length, chaus: K.chaus.length + 1, chapeau: K.chapeau.length + 1, sac: K.sac.length + 1, acc: K.acc.length + 1 })[k];
  const ensemble = ch => ch.g && ch.haut >= NB_HAUTS;
  // le nom d'un choix (menus)
  function nom(ch, k) {
    const v = ch[k], aucun = v < 0;
    switch (k) {
      case 'g': return ch.g ? 'Fille' : 'Garçon';
      case 'corps': return `Teinte ${v + 1}`;
      case 'tete': return `${v + 1} / ${nombre('tete', ch.g)}`;
      case 'haut': return ensemble(ch) ? K.ensemble[v - NB_HAUTS].nom : K.haut[v].nom;
      case 'bas': return ensemble(ch) ? '(avec l\'ensemble)' : (ch.g ? K.bas_f : K.bas_g)[v].nom;
      case 'chaus': return aucun ? 'Pieds nus' : K.chaus[v].nom;
      case 'chapeau': return aucun ? 'Rien' : K.chapeau[v].nom;
      case 'sac': return aucun ? 'Sans sac' : K.sac[v].nom;
      case 'acc': return aucun ? 'Aucun' : K.acc[v].nom;
    }
    return '';
  }
  // un choix tiré au sort (toujours habillé et chaussé)
  function hasard(g) {
    const R = n => Math.floor(Math.random() * n), ch = { g };
    ch.corps = R(K.corps_f.length); ch.tete = R(nombre('tete', g)); ch.haut = R(nombre('haut', g)); ch.bas = R(nombre('bas', g));
    ch.chaus = R(K.chaus.length); ch.chapeau = Math.random() < 0.35 && !(g ? K.tete_f : K.tete_g)[ch.tete].coiffe ? R(K.chapeau.length) : -1;
    ch.sac = Math.random() < 0.4 ? R(K.sac.length) : -1; ch.acc = Math.random() < 0.35 ? R(K.acc.length) : -1;
    return ch;
  }
  const DEFAUT = [{ g: 0, corps: 0, tete: 0, haut: 10, bas: 1, chaus: 10, chapeau: 0, sac: -1, acc: 5 },
    { g: 1, corps: 0, tete: 20, haut: 0, bas: 0, chaus: 0, chapeau: -1, sac: -1, acc: -1 }];
  // un choix incomplet ou d'une ancienne version : complété, ramené dans les bornes
  function valide(ch) {
    const g = ch && ch.g ? 1 : 0, o = { ...DEFAUT[g], ...(ch || {}), g };
    for (const k of ['corps', 'tete', 'haut', 'bas', 'chaus', 'chapeau', 'sac', 'acc']) {
      const n = nombre(k, g), vide = ['chaus', 'chapeau', 'sac', 'acc'].includes(k);
      if (typeof o[k] !== 'number' || o[k] < (vide ? -1 : 0) || o[k] >= (vide ? n - 1 : n)) o[k] = DEFAUT[g][k];
    }
    return o;
  }

  // ------------------------------------------------------------ pièces (découpées dans leur planche ; peau à la teinte du corps)
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const pieces = {};
  function piece(cat, p, peau) {
    const cle = cat + ':' + p.r.join(',') + ':' + (peau || '');
    if (pieces[cle]) return pieces[cle];
    const [x, y, w, h] = p.r, cv = DW.Art.canvas(w, h), c = cv.getContext('2d');
    c.drawImage(img[cat], x, y, w, h, 0, 0, w, h);
    if (peau && p.peau) {
      const s = hex(p.peau), d = hex(peau);
      if (Math.abs(s[0] - d[0]) + Math.abs(s[1] - d[1]) + Math.abs(s[2] - d[2]) > 30) {
        const D = c.getImageData(0, 0, w, h), a = D.data, k = [d[0] / Math.max(1, s[0]), d[1] / Math.max(1, s[1]), d[2] / Math.max(1, s[2])];
        for (let i = 0; i < a.length; i += 4) {
          if (a[i + 3] < 60 || a[i] <= a[i + 2]) continue;
          const e = Math.abs(a[i] - s[0]) + Math.abs(a[i + 1] - s[1]) * 1.2 + Math.abs(a[i + 2] - s[2]);
          if (e >= 80) continue;
          const t = Math.min(1, (80 - e) / 35);
          for (let j = 0; j < 3; j++) a[i + j] = a[i + j] * (1 - t) + Math.min(255, a[i + j] * k[j]) * t;
        }
        c.putImageData(D, 0, 0);
      }
    }
    return (pieces[cle] = cv);
  }

  // ------------------------------------------------------------ assemblage
  const CW = 260, CH = 380, X0 = 130, Y0 = 140;   // le canevas du personnage ; le haut du cou en (X0, Y0)
  const cache = {};
  function image(ch0) {
    if (!fait) return null;
    const ch = valide(ch0), cle = JSON.stringify(ch);
    if (cache[cle]) return cache[cle];
    const g = ch.g, B = (g ? K.corps_f : K.corps_g)[ch.corps], T = (g ? K.tete_f : K.tete_g)[ch.tete];
    if (!img[g ? 'corps_f' : 'corps_g'] || !img[g ? 'tete_f' : 'tete_g']) return null;
    const cv = DW.Art.canvas(CW, CH), c = cv.getContext('2d'), peau = B.peau;
    c.imageSmoothingEnabled = true;
    // une pièce, son point d'ancrage en (x, y) du repère
    const pose = (cat, p, x, y, avecPeau) => { if (!img[cat]) return; const im = piece(cat, p, avecPeau ? peau : null); c.drawImage(im, Math.round(X0 + x - p.a[0]), Math.round(Y0 + y - p.a[1])); };
    const pieds = B.pieds, menton = K.menton, H = ch.chapeau >= 0 ? K.chapeau[ch.chapeau] : null, A = ch.acc >= 0 ? K.acc[ch.acc] : null;
    if (ch.sac >= 0) pose('sac', K.sac[ch.sac], 0.17 * HB, K.taille - 0.02 * HB);
    if (H && H.derriere) pose('chapeau', H, 0, menton - H.dy * HB);
    if (ensemble(ch)) pose('ensemble', K.ensemble[ch.haut - NB_HAUTS], 0, 0, true);
    else {
      pose(g ? 'corps_f' : 'corps_g', B, 0, 0);
      if (g) pose('bas_f', K.bas_f[ch.bas], 0, pieds, true); else pose('bas_g', K.bas_g[ch.bas], 0, K.taille - 2, true);
    }
    if (ch.chaus >= 0) pose('chaus', K.chaus[ch.chaus], 0, pieds + 2);
    if (!ensemble(ch)) pose('haut', K.haut[ch.haut], 0, K.epaule - 3, true);
    if (A) {
      const [m1, m2] = B.mains;
      if (A.ou === 'mains') { pose('acc', A.p[0], m1[0], m1[1] - 4); pose('acc', A.p[1] || A.p[0], m2[0], m2[1] - 4); }
      else if (A.ou === 'poignets') { pose('acc', A.p[0], m1[0], m1[1] - 0.06 * HB); pose('acc', A.p[1] || A.p[0], m2[0], m2[1] - 0.06 * HB); }
      else if (A.ou === 'poignet') pose('acc', A.p[0], m1[0], m1[1] - 0.06 * HB);
      else if (A.ou === 'hanche') pose('acc', A.p[0], 0, K.taille + 0.05 * HB);
      else if (A.ou === 'cou') pose('acc', A.p[0], 0, K.epaule + 0.06 * HB);
      else if (A.ou === 'poitrine') pose('acc', A.p[0], 0, K.epaule + A.p[0].r[3] / 2 - 4);
    }
    pose(g ? 'tete_f' : 'tete_g', T, 0, menton, true);
    if (A && A.ou === 'yeux') pose('acc', A.p[0], 0, menton - 0.2 * HB);
    if (H && !H.derriere) pose('chapeau', H, 0, menton - H.dy * HB);
    return (cache[cle] = { cv, pieds: Y0 + pieds + 2 });
  }
  // dessine le personnage, les pieds en (x, y) ; h : hauteur d'un corps de fille avec sa tête (les garçons, plus trapus, sont un peu
  // plus petits) ; rien si les planches ne sont pas (encore) là
  function dessiner(c, ch, x, y, h) {
    const P = image(ch); if (!P) return false;
    const k = h / (HB * 1.55); c.save(); c.imageSmoothingEnabled = true;
    c.drawImage(P.cv, Math.round(x - X0 * k), Math.round(y - P.pieds * k), Math.round(CW * k), Math.round(CH * k)); c.restore();
    return true;
  }

  // ------------------------------------------------------------ le petit sprite de marche (DW.state.look, gfx/hero.js) : couleurs voisines
  function proche(h, liste, f = v => v) {
    if (!h) return 0;
    const a = hex(h); let best = 0, d0 = 1e9;
    liste.forEach((v, i) => { const b = hex(f(v)), d = (a[0] - b[0]) ** 2 * 0.3 + (a[1] - b[1]) ** 2 * 0.59 + (a[2] - b[2]) ** 2 * 0.11; if (d < d0) { d0 = d; best = i; } });
    return best;
  }
  function look(ch0, baby) {
    const ch = valide(ch0), g = ch.g, S = DW.LOOK_OPTS, T = (g ? K.tete_f : K.tete_g)[ch.tete], B = (g ? K.corps_f : K.corps_g)[ch.corps];
    const E = ensemble(ch), Hh = E ? K.ensemble[ch.haut - NB_HAUTS] : K.haut[ch.haut], Bs = E ? null : (g ? K.bas_f : K.bas_g)[ch.bas];
    const H = ch.chapeau >= 0 ? K.chapeau[ch.chapeau] : null, A = ch.acc >= 0 ? K.acc[ch.acc] : null;
    const idx = (liste, v) => Math.max(0, liste.findIndex(e => e[1] === v));
    const tete = H && H.type ? H.type : A && A.ou === 'yeux' ? 'glasses' : T.coiffe || '';   // (une tête de sa planche peut déjà porter un chapeau)
    return {
      gender: g, style: 0, v2: true, v3: true, baby,
      skin: proche(B.peau, S.skin, v => v[1]), cut: idx(S.cut, T.coupe), hair: proche(T.cheveux, S.hair, v => v[1][0]), eye: 0,
      shirt: proche(Hh.coul, S.shirt, v => v[1]), top: idx(S.top, Hh.type || (g ? 'tee' : 'jacket')),
      bottom: idx(S.bottom, Bs ? Bs.type : 'skirt'), bottomCol: proche(Bs ? Bs.coul : Hh.coul, S.bottomCol, v => v[1]),
      shoe: ch.chaus >= 0 ? proche(K.chaus[ch.chaus].coul, S.shoe, v => v[1]) : 0, head: idx(S.head, tete), bag: ch.sac >= 0 ? 1 : 0,
    };
  }
  DW.Perso = { charger, pret: () => fait, nombre, nom, hasard, valide, ensemble, image, dessiner, look, DEFAUT };
})();
