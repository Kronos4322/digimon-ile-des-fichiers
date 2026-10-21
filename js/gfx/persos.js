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
  const racine = !nav ? '' : window.RACINE_JEU != null ? window.RACINE_JEU : document.currentScript ? document.currentScript.src.replace(/js\/gfx\/persos\.js(\?.*)?$/, '') : '';   // (RACINE_JEU : js/scripts.js ; un paquet n'a pas le nom de ce fichier)
  const K = DW.KIT, HB = K.HB;
  const CATS = ['corps_f', 'corps_g', 'tete_f', 'tete_g', 'haut', 'ensemble', 'bas_f', 'bas_g', 'chaus', 'chapeau', 'sac', 'acc'];
  const img = {};
  let charge = null, fait = false;
  const charger = () => {
    // (une planche ratée trois fois — réseau coupé — est redemandée à l'ouverture suivante de la création)
    if (fait && nav && CATS.some(n => !img[n])) { charge = null; fait = false; }
    return charge || (charge = new Promise(fin => {
      if (!nav) { fait = true; fin(); return; }
      const manquent = CATS.filter(n => !img[n]);
      let reste = manquent.length;
      if (!reste) { fait = true; fin(); return; }
      // (une planche ratée est redemandée deux fois : sinon « Chargement... » restait affiché pour toujours)
      const essai = (n, k) => {
        const im = new Image();
        im.onload = im.onerror = () => {
          if (im.naturalWidth) img[n] = im;
          else if (k < 2) { setTimeout(() => essai(n, k + 1), 600 * (k + 1)); return; }
          if (--reste === 0) { fait = true; fin(); }
        };
        im.src = racine + 'assets/commun/kit/' + n + '.png' + DW.versionImage('commun/kit/' + n + '.png');   // (adresse versionnée : sw.js)
      };
      for (const n of manquent) essai(n, 0);
    }));
  };

  // ------------------------------------------------------------ les choix possibles
  const NB_HAUTS = K.haut.length, NB_ENS = K.ensemble.length;
  // (la planche des bas de garçons contient deux jupes : un garçon ne les porte pas, on les saute)
  const BAS_G_OK = K.bas_g.map((b, i) => (b.type === 'skirt' ? -1 : i)).filter(i => i >= 0);
  const nombre = (k, g) => ({ corps: K.corps_f.length, tete: (g ? K.tete_f : K.tete_g).length, haut: NB_HAUTS + (g ? NB_ENS : 0),
    bas: (g ? K.bas_f : K.bas_g).length, chaus: K.chaus.length + 1, chapeau: K.chapeau.length + 1, sac: K.sac.length + 1, acc: K.acc.length + 1 })[k];
  const ensemble = ch => ch.g && ch.haut >= NB_HAUTS;
  const DEFAUT = [{ g: 0, corps: 0, tete: 0, haut: 10, bas: 1, chaus: 10, chapeau: 0, sac: -1, acc: 5 },
    { g: 1, corps: 0, tete: 20, haut: 0, bas: 0, chaus: 0, chapeau: -1, sac: -1, acc: -1 }];
  // un choix incomplet ou d'une ancienne version : complété, ramené dans les bornes
  function valide(ch) {
    const g = ch && ch.g ? 1 : 0, o = { ...DEFAUT[g], ...(ch || {}), g };
    for (const k of ['corps', 'tete', 'haut', 'bas', 'chaus', 'chapeau', 'sac', 'acc']) {
      const n = nombre(k, g), vide = ['chaus', 'chapeau', 'sac', 'acc'].includes(k);
      if (typeof o[k] !== 'number' || o[k] < (vide ? -1 : 0) || o[k] >= (vide ? n - 1 : n)) o[k] = DEFAUT[g][k];
    }
    if (!g && o.bf) { o.bf = 1; if (K.bas_f[o.bas].type === 'skirt') o.bas = 3; }
    else if (!g && !BAS_G_OK.includes(o.bas)) o.bas = DEFAUT[0].bas;
    return o;
  }

  // ------------------------------------------------------------ pièces (découpées dans leur planche ; peau à la teinte du corps)
  const hex = DW.Art.hex;
  const pieces = {};
  function piece(cat, p, peau) {
    const cle = cat + ':' + p.r.join(',') + ':' + (peau || '');
    // (zone où la pièce montre de la peau : le cou d'un haut ; ailleurs, toute la pièce mais avec une tolérance serrée,
    //  sinon un chemisier crème ou un pantalon beige prenait la couleur de la peau : « ventre nu »)
    const zoneY = cat === 'haut' ? 0.3 : 1;
    if (pieces[cle]) return pieces[cle];
    const [x, y, w, h] = p.r, cv = DW.Art.canvas(w, h), c = cv.getContext('2d');
    c.drawImage(img[cat], x, y, w, h, 0, 0, w, h);
    if (peau && p.peau) {
      const s = hex(p.peau), d = hex(peau);
      if (Math.abs(s[0] - d[0]) + Math.abs(s[1] - d[1]) + Math.abs(s[2] - d[2]) > 30) {
        const D = c.getImageData(0, 0, w, h), a = D.data, k = [d[0] / Math.max(1, s[0]), d[1] / Math.max(1, s[1]), d[2] / Math.max(1, s[2])];
        const iMax = Math.round(h * zoneY) * w * 4;
        for (let i = 0; i < Math.min(a.length, iMax); i += 4) {
          if (a[i + 3] < 60 || a[i] <= a[i + 2]) continue;
          const e = Math.abs(a[i] - s[0]) + Math.abs(a[i + 1] - s[1]) * 1.2 + Math.abs(a[i + 2] - s[2]);
          if (e >= 46) continue;
          const t = Math.min(1, (46 - e) / 20);
          for (let j = 0; j < 3; j++) a[i + j] = a[i + j] * (1 - t) + Math.min(255, a[i + j] * k[j]) * t;
        }
        c.putImageData(D, 0, 0);
      }
    }
    return (pieces[cle] = cv);
  }

  // ------------------------------------------------------------ chaussures
  // Les bas des FILLES (et leurs ensembles) sont dessinés avec leurs chaussures, à la bonne taille : on n'en pose pas
  // d'autres par-dessus (sinon deux paires l'une sur l'autre, trop grandes : des « bottes » sur tout le monde).
  // Les GARÇONS ont les pieds nus : chaque paire du kit (dessinée plus grande que les corps) est coupée en deux, et chaque
  // chaussure, ramenée à la largeur du pied, est posée sous sa jambe.
  const chausses = (g, ch) => !g && !(ch && ch.bf);
  const LARGEUR_PIED = 1.12;   // largeur d'une chaussure : 1,12 fois celle du pied nu
  const opaques = (cv, y) => {   // segments de pixels opaques sur une rangée d'une pièce
    const w = cv.width, d = cv.getContext('2d').getImageData(0, Math.max(0, Math.min(cv.height - 1, Math.round(y))), w, 1).data, out = [];
    let s = -1;
    for (let x = 0; x <= w; x++) { const op = x < w && d[x * 4 + 3] > 100; if (op && s < 0) s = x; if (!op && s >= 0) { out.push([s, x - 1]); s = -1; } }
    return out;
  };
  const deuxPlus = L => L.filter(s => s[1] - s[0] >= 4).sort((a, b) => (b[1] - b[0]) - (a[1] - a[0])).slice(0, 2).sort((a, b) => a[0] - b[0]);
  // les deux pieds nus d'un corps : centre (par rapport au point d'ancrage) et largeur, juste au-dessus du sol
  const piedsNus = {};
  function piedsDe(cat, B) {
    const cle = cat + ':' + B.r.join(','); if (piedsNus[cle]) return piedsNus[cle];
    const S = deuxPlus(opaques(piece(cat, B), B.a[1] + B.pieds - 5));
    return (piedsNus[cle] = S.length === 2 ? S.map(([a, b]) => ({ x: (a + b) / 2 - B.a[0], w: b - a + 1 })) : [{ x: -0.09 * HB, w: 0.13 * HB }, { x: 0.08 * HB, w: 0.13 * HB }]);
  }
  // la demi-largeur des hanches d'un corps nu (sous la taille, au-dessus des mains), et celle d'un bas complet du kit
  const largeurs = {};
  function hanches(cat, B) {
    const cle = 'h:' + cat + ':' + B.r.join(','); if (largeurs[cle] != null) return largeurs[cle];
    const cv = piece(cat, B); let m = 0;
    for (let y = K.taille + 20; y <= K.taille + 40; y += 2) for (const [a, b] of opaques(cv, B.a[1] + y)) if (a <= B.a[0] && b >= B.a[0]) m = Math.max(m, B.a[0] - a, b - B.a[0]);
    return (largeurs[cle] = m || 32);
  }
  function hanchesBas(p) {
    const cle = 'b:' + p.r.join(','); if (largeurs[cle] != null) return largeurs[cle];
    const cv = piece('bas_f', p); let m = 0;
    for (let y = 12; y <= 30; y += 2) for (const [a, b] of opaques(cv, y)) if (a <= p.a[0] && b >= p.a[0]) m = Math.max(m, p.a[0] - a, b - p.a[0]);
    return (largeurs[cle] = m || 34);
  }
  // le poing nu d'un corps (main i) : centre (par rapport au point d'ancrage), largeur et bas
  const poings = {};
  function poingDe(cat, B, i) {
    const cle = cat + ':' + B.r.join(',') + ':' + i; if (poings[cle]) return poings[cle];
    const cv = piece(cat, B), hx = Math.round(B.a[0] + B.mains[i][0]), hy = Math.round(B.a[1] + B.mains[i][1]);
    let x0 = hx, x1 = hx, bas = hy, vu = false;
    for (let y = hy - 8; y < Math.min(cv.height, hy + 24); y++) {
      // (le morceau opaque de la rangée qui contient la main, ou le plus proche : pas la cuisse d'à côté)
      const S = opaques(cv, y).filter(([a, b]) => b >= hx - 6 && a <= hx + 6);
      if (!S.length) { if (vu && y > hy) break; continue; }
      const [a, b] = S.reduce((m, s) => (Math.abs((s[0] + s[1]) / 2 - hx) < Math.abs((m[0] + m[1]) / 2 - hx) ? s : m));
      if (y >= hy - 2) { x0 = Math.min(x0, a); x1 = Math.max(x1, b); }
      bas = y; vu = true;
    }
    return (poings[cle] = { x: (x0 + x1) / 2 - B.a[0], w: x1 - x0 + 1, bas: bas - B.a[1] });
  }
  // une paire du kit coupée en deux : pour chaque chaussure, son image, le centre de sa semelle et sa largeur
  const paires = {};
  function paire(p) {
    const cle = p.r.join(','); if (paires[cle]) return paires[cle];
    const cv = piece('chaus', p), w = cv.width, h = cv.height;
    const S = deuxPlus(opaques(cv, h - 4)), coupe = S.length === 2 ? Math.round((S[0][1] + S[1][0]) / 2) : Math.round(w / 2);
    // (large : la plus grande largeur de la chaussure, tige de botte comprise)
    const moitie = (x0, x1, s) => {
      const c = DW.Art.canvas(x1 - x0, h), cc = c.getContext('2d'); cc.drawImage(cv, x0, 0, x1 - x0, h, 0, 0, x1 - x0, h);
      // (seulement la chaussure : les colonnes séparées d'elle par du vide — un éclat de l'autre chaussure — sont effacées)
      { const D = cc.getImageData(0, 0, x1 - x0, h), e = D.data, w = x1 - x0, plein = x => { for (let y = 0; y < h; y++) if (e[(y * w + x) * 4 + 3] > 100) return true; return false; };
        const m = Math.max(0, Math.min(w - 1, Math.round(s ? (s[0] + s[1]) / 2 - x0 : w / 2)));
        let g = m, dd = m; while (g > 0 && plein(g - 1)) g--; while (dd < w - 1 && plein(dd + 1)) dd++;
        if (plein(m)) { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (x < g || x > dd) e[(y * w + x) * 4 + 3] = 0; cc.putImageData(D, 0, 0); } }
      const d = cc.getImageData(0, 0, x1 - x0, h).data; let a = x1 - x0, b = -1;
      for (let y = 0; y < h; y++) for (let x = 0; x < x1 - x0; x++) if (d[(y * (x1 - x0) + x) * 4 + 3] > 100) { if (x < a) a = x; if (x > b) b = x; }
      return { cv: c, x: s ? (s[0] + s[1]) / 2 - x0 : (x1 - x0) / 2, w: s ? s[1] - s[0] + 1 : x1 - x0, large: b >= a ? b - a + 1 : x1 - x0 };
    };
    return (paires[cle] = [moitie(0, coupe, S[0]), moitie(coupe, w, S[1])]);
  }

  // ------------------------------------------------------------ assemblage
  const CW = 260, CH = 380, X0 = 130, Y0 = 140;   // le canevas du personnage ; le haut du cou en (X0, Y0)
  const cache = {};
  // (une planche du kit qui n'a pas pu être chargée, ou un canevas refusé par le navigateur : pas de personnage assemblé,
  //  au lieu d'une erreur qui bloquait la création — le héros restait seul au camp, la partie figée)
  function image(ch0) {
    if (!fait) return null;
    try { return assembler(ch0); } catch (e) { console.warn('[persos] personnage assemblé impossible :', e); return null; }
  }
  function assembler(ch0) {
    const ch = valide(ch0), cle = JSON.stringify(ch);
    if (cache[cle]) return cache[cle];
    const g = ch.g, B = (g ? K.corps_f : K.corps_g)[ch.corps], T = (g ? K.tete_f : K.tete_g)[ch.tete];
    if (!img[g ? 'corps_f' : 'corps_g'] || !img[g ? 'tete_f' : 'tete_g']) return null;
    const cv = DW.Art.canvas(CW, CH), c = cv.getContext('2d'), peau = B.peau;
    c.imageSmoothingEnabled = true;
    // une pièce, son point d'ancrage en (x, y) du repère
    const pose = (cat, p, x, y, avecPeau) => { if (!img[cat]) return; const im = piece(cat, p, avecPeau ? peau : null); c.drawImage(im, Math.round(X0 + x - p.a[0]), Math.round(Y0 + y - p.a[1])); };
    // les gants du kit sont dessinés doigts en l'air : retournés (le poignet en haut, les doigts en bas, comme la main qui
    // pend) et grossis pour couvrir tout le poing, le bout des doigts au bas du poing (règle du joueur : comme les
    // chaussures, ils cachent le corps)
    const gant = (p, i) => {
      if (!img.acc) return;
      const F = poingDe(g ? 'corps_f' : 'corps_g', B, i), im = piece('acc', p), k = Math.max(1, (F.w + 4) / im.width), W = im.width * k, Hh = im.height * k;
      c.save(); c.translate(X0 + F.x, Y0 + F.bas + 2); c.scale(1, -1); c.drawImage(im, -W / 2, 0, W, Hh); c.restore();
    };
    // les chaussures d'un garçon d'avant le bas complet (le kit les dessine par paires : chacune sous sa jambe). Elles cachent
    // le pied nu (ce qui dépasse à côté d'elles sous leur haut est effacé) ; le pantalon vient par-dessus
    const chaussures = sur => {
      const P = piedsDe(g ? 'corps_f' : 'corps_g', B), S = paire(K.chaus[ch.chaus]);
      const J = jambes(c, P, Math.round(Y0 + B.pieds - 0.24 * HB), Math.round(Y0 + B.pieds - 2)), ecart = Math.abs(J[1].x - J[0].x);
      const L = DW.Art.canvas(CW, CH), lc = L.getContext('2d'); lc.imageSmoothingEnabled = true;
      for (let i = 0; i < 2; i++) {
        const s = S[i], k = Math.min(Math.max(P[i].w * LARGEUR_PIED / s.w, (J[i].w + 2) / s.large), (ecart - (sur ? 1 : 3)) / s.large);
        const W = s.cv.width * k, Hs = s.cv.height * k;
        lc.drawImage(s.cv, J[i].x - s.x * k, Y0 + B.pieds + 3 - Hs, W, Hs);
      }
      cacherSous(c, L, Math.floor(Math.min(J[0].x0, J[1].x0)) - 3, Math.ceil(Math.max(J[0].x1, J[1].x1)) + 3);
      c.drawImage(L, 0, 0);
    };
    // UN BAS COMPLET (règle du joueur, 21/10 : « un ensemble homogène et unique ») : les garçons portent, comme les filles, un
    // bas du kit dessiné d'un seul tenant (jambes, vêtement et chaussures ensemble) ; leurs jambes nues et leurs hanches sont
    // effacées sous la taille (pas leurs bras), puis le bas est posé, à la hauteur de leurs jambes et à la largeur de leurs
    // hanches (les garçons sont plus trapus)
    const basComplet = p => {
      if (!img.bas_f) return;
      const cat = g ? 'corps_f' : 'corps_g', basMains = Math.max(...B.mains.map(m => m[1])) + 12;
      // (le masque des hanches et des jambes est pris sur le corps nu, où les bras pendent à part : un sac ou un bras posé
      //  contre la hanche n'est pas effacé avec elle)
      const cv = piece(cat, B), ox = Math.round(X0 - B.a[0]), oy = Math.round(Y0 - B.a[1]);
      const D = c.getImageData(0, 0, CW, CH), d = D.data;
      for (let yp = Math.round(B.a[1] + K.taille + 4); yp < cv.height; yp++) {
        const y = oy + yp; if (y < 0 || y >= CH) continue;
        for (const [a, b] of opaques(cv, yp)) {
          if (Math.abs((a + b) / 2 - B.a[0]) >= (yp - B.a[1] > basMains ? 36 : 28)) continue;
          for (let x = Math.max(0, ox + a); x <= Math.min(CW - 1, ox + b); x++) d[(y * CW + x) * 4 + 3] = 0;
        }
      }
      c.putImageData(D, 0, 0);
      const ky = (B.pieds - K.taille + 4) / p.a[1], kx = Math.max(ky, hanches(cat, B) / hanchesBas(p));
      const im = piece('bas_f', p, peau);
      c.drawImage(im, Math.round(X0 - p.a[0] * kx), Math.round(Y0 + B.pieds + 1 - p.a[1] * ky), Math.round(im.width * kx), Math.round(im.height * ky));
    };
    const pieds = B.pieds, menton = K.menton, H = ch.chapeau >= 0 ? K.chapeau[ch.chapeau] : null, A = ch.acc >= 0 ? K.acc[ch.acc] : null;
    if (ch.sac >= 0) pose('sac', K.sac[ch.sac], 0.17 * HB, K.taille - 0.02 * HB);
    if (H && H.derriere) pose('chapeau', H, 0, menton - H.dy * HB);
    if (ensemble(ch)) pose('ensemble', K.ensemble[ch.haut - NB_HAUTS], 0, 0, true);
    else {
      pose(g ? 'corps_f' : 'corps_g', B, 0, 0);
      if (g) pose('bas_f', K.bas_f[ch.bas], 0, pieds, true);
      else if (ch.bf) basComplet(K.bas_f[ch.bas]);
      // (personnage d'avant : son bas de garçon, et ses chaussures dessous — le pantalon tombe dessus)
      else if (ch.chaus >= 0) { chaussures(false); pose('bas_g', K.bas_g[ch.bas], 0, K.taille - 2, true); }
      else pose('bas_g', K.bas_g[ch.bas], 0, K.taille - 2, true);
    }
    if (!ensemble(ch)) pose('haut', K.haut[ch.haut], 0, K.epaule - 3, true);
    if (A) {
      const [m1, m2] = B.mains;
      if (A.ou === 'mains') { gant(A.p[0], 0); gant(A.p[1] || A.p[0], 1); }
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
  // les deux jambes (pantalon compris) du personnage en cours d'assemblage, entre les rangées y0 et y1 (la hauteur des
  // chaussures) : centre, bords et largeur de chacune, au plus large ; deux jambes collées sont séparées au milieu des pieds
  function jambes(c, P, y0, y1) {
    const px = P.map(p => X0 + p.x), mil = (px[0] + px[1]) / 2, out = px.map((x, i) => ({ x0: x - P[i].w / 2, x1: x + P[i].w / 2 }));
    const D = c.getImageData(0, y0, CW, y1 - y0 + 1).data;
    for (let r = 0; r <= y1 - y0; r++) {
      const segs = []; let s = -1;
      for (let x = 0; x <= CW; x++) { const op = x < CW && D[(r * CW + x) * 4 + 3] > 100; if (op && s < 0) s = x; if (!op && s >= 0) { segs.push([s, x - 1]); s = -1; } }
      px.forEach((x, i) => {
        const seg = segs.find(([a, b]) => a <= x + 3 && b >= x - 3); if (!seg) return;
        const a = i ? Math.max(seg[0], mil + 1) : seg[0], b = i ? seg[1] : Math.min(seg[1], mil - 1);
        out[i].x0 = Math.min(out[i].x0, a); out[i].x1 = Math.max(out[i].x1, b);
      });
    }
    return out.map(o => ({ x: (o.x0 + o.x1) / 2, x0: o.x0, x1: o.x1, w: o.x1 - o.x0 + 1 }));
  }
  // sous la ligne des chaussures (calque L), entre les colonnes xa et xb : tout ce qui n'est pas une chaussure est effacé
  // (colonne par colonne, à partir du haut de la chaussure la plus proche : la jambe au-dessus reste entière)
  function cacherSous(c, L, xa, xb) {
    xa = Math.max(0, xa); xb = Math.min(CW - 1, xb);
    const l = L.getContext('2d').getImageData(0, 0, CW, CH).data, haut = new Array(CW).fill(-1);
    for (let x = xa; x <= xb; x++) for (let y = 0; y < CH; y++) if (l[(y * CW + x) * 4 + 3] > 40) { haut[x] = y; break; }
    // (les chaussures : groupes de colonnes ; sous le point le plus haut d'une chaussure, seule la chaussure se voit — pas
    //  de pantalon ni de peau qui dépasse sur les côtés, même le long du col d'une botte)
    const groupes = [];
    for (let x = xa; x <= xb; x++) if (haut[x] >= 0) { const G = groupes[groupes.length - 1]; if (G && x - G.b <= 2) { G.b = x; G.h = Math.min(G.h, haut[x]); } else groupes.push({ a: x, b: x, h: haut[x] }); }
    if (!groupes.length) return;
    const D = c.getImageData(0, 0, CW, CH), d = D.data;
    const loin = (G, x) => (x < G.a ? G.a - x : x > G.b ? x - G.b : 0);
    for (let x = xa; x <= xb; x++) {
      const h = groupes.reduce((m, G) => (loin(G, x) < loin(m, x) ? G : m)).h;   // (sa chaussure, ou la plus proche)
      for (let y = h; y < CH; y++) { const i = (y * CW + x) * 4; if (l[i + 3] <= 40) d[i + 3] = 0; }
    }
    c.putImageData(D, 0, 0);
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
  // couleur dominante d'une pièce (pixels opaques, sans le contour sombre ; sans la peau si on la donne) ; y0-y1 : bande (0 à 1)
  function dominante(cv, y0 = 0, y1 = 1, sauf, filtre) {
    const w = cv.width, h = cv.height, d = cv.getContext('2d').getImageData(0, Math.floor(h * y0), w, Math.max(1, Math.floor(h * (y1 - y0)))).data;
    const pal = {}; let best = null, nb = 0;
    for (let i = 0; i < d.length; i += 8) {
      if (d[i + 3] < 200) continue;
      const r = d[i], g = d[i + 1], b = d[i + 2], l = r * 0.3 + g * 0.59 + b * 0.11;
      if (l < 38 || l > 248) continue;
      if (sauf && Math.abs(r - sauf[0]) + Math.abs(g - sauf[1]) + Math.abs(b - sauf[2]) < 60) continue;
      if (filtre && !filtre(r, g, b)) continue;
      const k = (r >> 4) + ',' + (g >> 4) + ',' + (b >> 4), e = pal[k] || (pal[k] = [0, 0, 0, 0]);
      e[0] += r; e[1] += g; e[2] += b; e[3]++;
      if (e[3] > nb) { nb = e[3]; best = e; }
    }
    if (!best) return null;
    return '#' + [0, 1, 2].map(j => Math.round(best[j] / best[3]).toString(16).padStart(2, '0')).join('');
  }
  // couleur des chaussures : la plus présente HORS du blanc (semelles, lacets, chaussettes), sauf si elles sont surtout blanches
  function couleurChaussures(cv, y0, y1, sauf) {
    const blanc = (r, g, b) => r * 0.3 + g * 0.59 + b * 0.11 > 165 && Math.max(r, g, b) - Math.min(r, g, b) < 45;   // (blanc et son ombre grise)
    const w = cv.width, h = cv.height, d = cv.getContext('2d').getImageData(0, Math.floor(h * y0), w, Math.max(1, Math.floor(h * (y1 - y0)))).data;
    // (groupes larges : les nuances d'une même couleur — rouge clair, rouge, rouge sombre — comptent ensemble)
    const groupes = {}, blancs = [0, 0, 0, 0]; let nb = 0, best = null;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], g = d[i + 1], b = d[i + 2];
      if (d[i + 3] < 200 || r * 0.3 + g * 0.59 + b * 0.11 < 38) continue;
      if (sauf && Math.abs(r - sauf[0]) + Math.abs(g - sauf[1]) + Math.abs(b - sauf[2]) < 60) continue;
      nb++;
      const e = blanc(r, g, b) ? blancs : groupes[(r >> 5) + ',' + (g >> 5) + ',' + (b >> 5)] || (groupes[(r >> 5) + ',' + (g >> 5) + ',' + (b >> 5)] = [0, 0, 0, 0]);
      e[0] += r; e[1] += g; e[2] += b; e[3]++;
      if (e !== blancs && (!best || e[3] > best[3])) best = e;
    }
    if (!nb) return null;
    const E = blancs[3] > nb * 0.6 || !best ? blancs : best;
    return '#' + [0, 1, 2].map(j => Math.round(E[j] / E[3]).toString(16).padStart(2, '0')).join('');
  }
  // peau mesurée sur les mains du corps (là où il n'y a jamais de vêtement)
  function peauMesuree(cat, B) {
    const cv = piece(cat, B), d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data, s = [0, 0, 0, 0];
    for (const [mx, my] of B.mains) {
      const cx = Math.round(B.a[0] + mx), cy = Math.round(B.a[1] + my);
      for (let y = cy - 3; y <= cy + 3; y++) for (let x = cx - 3; x <= cx + 3; x++) {
        if (x < 0 || y < 0 || x >= cv.width || y >= cv.height) continue;
        const i = (y * cv.width + x) * 4; if (d[i + 3] < 200 || d[i] + d[i + 1] + d[i + 2] < 150) continue;
        s[0] += d[i]; s[1] += d[i + 1]; s[2] += d[i + 2]; s[3]++;
      }
    }
    return s[3] ? '#' + [0, 1, 2].map(j => Math.round(s[j] / s[3]).toString(16).padStart(2, '0')).join('') : B.peau;
  }
  const eclaircir = (h, k) => '#' + hex(h).map(v => Math.round(v + (255 - v) * k).toString(16).padStart(2, '0')).join('');
  // les vraies couleurs du personnage assemblé (null si les planches ne sont pas encore chargées)
  // (même chose : sans les planches, le petit sprite garde ses couleurs par défaut)
  function couleurs(ch0) {
    if (!fait) return null;
    try { return couleursKit(ch0); } catch (e) { console.warn('[persos] couleurs du kit indisponibles :', e); return null; }
  }
  function couleursKit(ch0) {
    const ch = valide(ch0), g = ch.g, B = (g ? K.corps_f : K.corps_g)[ch.corps], T = (g ? K.tete_f : K.tete_g)[ch.tete];
    const cB = g ? 'corps_f' : 'corps_g', cT = g ? 'tete_f' : 'tete_g'; if (!img[cB] || !img[cT]) return null;
    // peau : la teinte de peau la plus présente sur le corps (rouge > vert > bleu, ni grise ni saturée comme un tissu)
    const peauOk = (r, g, b) => r > g && g > b && r - b > 30 && r - b < 150 && g - b > 8;
    const moyenne = (cv, ok) => { const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data, m = [0, 0, 0, 0];
      for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 200 && ok(d[i], d[i + 1], d[i + 2])) { m[0] += d[i]; m[1] += d[i + 1]; m[2] += d[i + 2]; m[3]++; }
      return m[3] > 30 ? '#' + [0, 1, 2].map(j => Math.round(m[j] / m[3]).toString(16).padStart(2, '0')).join('') : null; };
    // la peau qu'on VOIT : les joues du personnage assemblé (une tête du kit peut être plus foncée que le corps choisi)
    const joues = () => { const I = image(ch); if (!I) return null; const c = I.cv.getContext('2d'), m = [0, 0, 0, 0], yj = Y0 + K.menton;
      for (const sx of [-1, 1]) { const d = c.getImageData(X0 + sx * 16 - 5, yj - 34, 10, 14).data;
        for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 200 && peauOk(d[i], d[i + 1], d[i + 2])) { m[0] += d[i]; m[1] += d[i + 1]; m[2] += d[i + 2]; m[3]++; } }
      return m[3] > 20 ? '#' + [0, 1, 2].map(j => Math.round(m[j] / m[3]).toString(16).padStart(2, '0')).join('') : null; };
    const peau = joues() || moyenne(piece(cB, B), peauOk) || peauMesuree(cB, B), P = hex(peau), E = ensemble(ch);
    const cheveux = dominante(piece(cT, T), 0, 0.35, P) || T.cheveux;
    const haut = E ? dominante(piece('ensemble', K.ensemble[ch.haut - NB_HAUTS]), 0.12, 0.45, P) : dominante(piece('haut', K.haut[ch.haut]), 0.25, 1, P);
    // (le bas d'une fille montre aussi ses jambes, de la peau d'origine de la planche : ce n'est pas la couleur du vêtement)
    const F = g || ch.bf, Bs = E ? null : (F ? K.bas_f : K.bas_g)[ch.bas], pB = F && Bs && Bs.peau ? hex(Bs.peau) : null;   // (F : un bas complet)
    const pasPeau = (r, v, b) => !pB || Math.abs(r - pB[0]) + Math.abs(v - pB[1]) + Math.abs(b - pB[2]) >= 45;
    const bas = E ? dominante(piece('ensemble', K.ensemble[ch.haut - NB_HAUTS]), 0.55, 0.85, P) : dominante(piece(F ? 'bas_f' : 'bas_g', Bs), 0, F ? 0.5 : 1, P, pasPeau);
    // (bas complet : les chaussures dessinées avec lui, au bas de la pièce ; garçons d'avant : la paire du kit)
    const chaus = !chausses(g, ch) ? couleurChaussures(E ? piece('ensemble', K.ensemble[ch.haut - NB_HAUTS]) : piece('bas_f', K.bas_f[ch.bas]), 0.8, 1, P)
      : ch.chaus >= 0 ? couleurChaussures(piece('chaus', K.chaus[ch.chaus]), 0.4, 1) : null;
    const chap = ch.chapeau >= 0 ? dominante(piece('chapeau', K.chapeau[ch.chapeau])) : null;
    return { skin: peau, hair: cheveux, hairL: eclaircir(cheveux, 0.3), shirt: haut || '#e04a3a', bottomCol: bas || '#3a5a9a', shoe: chaus || '#3a3a4a', headCol: chap };
  }
  function look(ch0, baby) {
    const ch = valide(ch0), g = ch.g, S = DW.LOOK_OPTS, T = (g ? K.tete_f : K.tete_g)[ch.tete], B = (g ? K.corps_f : K.corps_g)[ch.corps];
    const E = ensemble(ch), Hh = E ? K.ensemble[ch.haut - NB_HAUTS] : K.haut[ch.haut], Bs = E ? null : (g || ch.bf ? K.bas_f : K.bas_g)[ch.bas];
    const H = ch.chapeau >= 0 ? K.chapeau[ch.chapeau] : null, A = ch.acc >= 0 ? K.acc[ch.acc] : null;
    const idx = (liste, v) => Math.max(0, liste.findIndex(e => e[1] === v));
    const tete = H && H.type ? H.type : A && A.ou === 'yeux' ? 'glasses' : T.coiffe || '';   // (une tête de sa planche peut déjà porter un chapeau)
    return {
      gender: g, style: 0, v2: true, v3: true, baby,
      skin: proche(B.peau, S.skin, v => v[1]), cut: idx(S.cut, T.coupe), hair: proche(T.cheveux, S.hair, v => v[1][0]), eye: 0,
      shirt: proche(Hh.coul, S.shirt, v => v[1]), top: idx(S.top, Hh.type || (g ? 'tee' : 'jacket')),
      bottom: idx(S.bottom, Bs ? Bs.type : 'skirt'), bottomCol: proche(Bs ? Bs.coul : Hh.coul, S.bottomCol, v => v[1]),
      shoe: ch.chaus >= 0 ? proche(K.chaus[ch.chaus].coul, S.shoe, v => v[1]) : 0, head: idx(S.head, tete), bag: ch.sac >= 0 ? 1 : 0,
      cols: couleurs(ch) || undefined,   // (les vraies couleurs : le petit sprite ressemble au personnage créé — gfx/hero.js)
    };
  }
  // PERSONNAGES FIXES (règle du joueur) : 8 enfants inspirés des DigiSauveurs de la saison 1, assemblés avec son kit ;
  // on en choisit un (plus de création pièce par pièce). bebe : la lignée de l'enfant qui l'inspire (DW.HERO_LINE)
  // (sans chapeau : ceux du kit se posent mal sur les têtes — règle du joueur ; bf : les garçons aussi portent un bas complet
  //  du kit, jambes et chaussures dessinées avec — règle du joueur, 21/10 : « un ensemble homogène et unique »)
  const PRESETS = [
    { nom: 'Inspiré de Tai', bebe: 'tai', ch: { g: 0, corps: 1, tete: 0, haut: 11, bas: 0, bf: 1, chaus: -1, chapeau: -1, sac: -1, acc: 5 } },
    { nom: 'Inspiré de Matt', bebe: 'matt', ch: { g: 0, corps: 0, tete: 1, haut: 22, bas: 3, bf: 1, chaus: -1, chapeau: -1, sac: -1, acc: -1 } },
    { nom: 'Inspirée de Sora', bebe: 'sora', ch: { g: 1, corps: 2, tete: 26, haut: 14, bas: 0, chaus: 11, chapeau: -1, sac: -1, acc: 5 } },
    { nom: 'Inspiré d’Izzy', bebe: 'izzy', ch: { g: 0, corps: 7, tete: 6, haut: 15, bas: 2, bf: 1, chaus: -1, chapeau: -1, sac: 3, acc: 9 } },
    { nom: 'Inspirée de Mimi', bebe: 'mimi', ch: { g: 1, corps: 3, tete: 23, haut: 18, bas: 6, chaus: 7, chapeau: -1, sac: -1, acc: -1 } },
    { nom: 'Inspiré de Joe', bebe: 'joe', ch: { g: 0, corps: 3, tete: 8, haut: 13, bas: 5, bf: 1, chaus: -1, chapeau: -1, sac: 13, acc: 0 } },
    { nom: 'Inspiré de T.K.', bebe: 'tk', ch: { g: 0, corps: 4, tete: 1, haut: 12, bas: 9, bf: 1, chaus: -1, chapeau: -1, sac: -1, acc: -1 } },
    { nom: 'Inspirée de Kari', bebe: 'kari', ch: { g: 1, corps: 0, tete: 20, haut: 4, bas: 8, chaus: 12, chapeau: -1, sac: -1, acc: 10 } },
  ];
  DW.Perso = { PRESETS, charger, valide, dessiner, look, couleurs, vider: () => { for (const k in cache) delete cache[k]; } };
})();
