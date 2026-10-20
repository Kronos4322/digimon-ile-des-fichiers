'use strict';
// =====================================================================
//  EMPREINTES DES DESSINS (outil de développement)
//  Chaque dessin du jeu est réduit à une empreinte (somme de contrôle de ses pixels) : objets du décor (toutes
//  variantes), Digimon (combat, poses, carte), héros, icônes, fonds de combat et quelques cartes entières (sol et
//  décor posé). Avant un nettoyage du code : Empreintes.base() ; après : Empreintes.compare() dit ce qui a changé
//  à l'écran (rien = nettoyage sans effet visible).
//  Dans la console du jeu (python dev/serve.py 8766) :
//    const s = document.createElement('script'); s.src = 'dev/empreintes.js'; document.head.appendChild(s);
//    await Empreintes.base()      — calcule et garde les empreintes dans ce navigateur (localStorage)
//    await Empreintes.compare()   — { changés, disparus, nouveaux } par rapport à la base
// =====================================================================
(function () {
  const CARTES = ['village', 'maison', 'plage', 'clairiere', 'sentier', 'champs', 'berceau', 'residentiel', 'gym', 'montagne0', 'miharashi1', 'miharashi4', 'village_yokomon'];
  const CLE = 'empreintes_base';
  // FNV-1a sur les octets des pixels
  const fnv = d => { let h = 0x811c9dc5; for (let i = 0; i < d.length; i++) { h ^= d[i]; h = Math.imul(h, 0x01000193); } return (h >>> 0).toString(36); };
  const toile = x => x && (x.getContext ? x : x.img || x.canvas || null);
  const empreinte = x => {
    const c = toile(x); if (!c) return 'aucune image';
    return c.width + '×' + c.height + ' ' + fnv(c.getContext('2d').getImageData(0, 0, c.width, c.height).data);
  };
  const texte = s => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); } return (h >>> 0).toString(36); };
  const essai = (E, k, fn) => { try { E[k] = fn(); } catch (e) { E[k] = 'erreur : ' + e.message; } };

  async function calculer(cartes = CARTES) {
    if (DW.Textures) await DW.Textures.charge;
    const E = {}, W = DW.World, OBJ = W.OBJ;
    for (const k of Object.keys(OBJ).sort()) {
      const o = OBJ[k], n = o.n || 1;
      for (let v = 0; v < n; v++) {
        if (o.frames) for (let f = 0; f < o.frames; f++) essai(E, `objet/${k}/${v}/${f}`, () => empreinte(W.objFrame(k, v, f)));
        else essai(E, `objet/${k}/${v}`, () => empreinte(W.obj(k, v)));
      }
    }
    const S = DW.Sprites;
    for (const sp of Object.keys(DW.SPECIES).sort()) {
      essai(E, `digimon/${sp}/combat`, () => S.battle(sp).frames.map(empreinte).join(' | '));
      for (const p of ['attack', 'hurt']) essai(E, `digimon/${sp}/${p}`, () => empreinte(S.pose(sp, p)));
      for (const vue of [null, 'back', 'front']) essai(E, `digimon/${sp}/carte-${vue || 'profil'}`, () => S.ow(sp, vue).frames.map(empreinte).join(' | '));
    }
    for (const dir of ['down', 'up', 'left', 'right']) for (let f = 0; f < 4; f++) essai(E, `heros/${dir}/${f}`, () => empreinte(S.hero(dir, f)));
    for (const id of Object.keys(DW.ITEMS || {}).sort()) essai(E, `icone/${id}`, () => empreinte(DW.Icons.item(id)));
    const fonds = ['foret', 'plage', 'village', ...Object.keys(W.THEMES || {}).map(t => 'foret@' + t)];
    for (const f of fonds) essai(E, `fond/${f}`, () => empreinte(W.battleBg(f)));
    // (le décor posé au hasard — crabes, fleurs... — change d'une partie à l'autre : on le compare à part)
    for (const id of cartes) {
      if (!DW.MAPS[id]) continue;
      essai(E, `carte/${id}/sol`, () => {
        const m = DW.preparerCarte ? DW.preparerCarte(id) : DW.getMap(id);
        W.unprepare(m);
        const g = W.prepare(m);
        E[`carte/${id}/décor`] = texte(JSON.stringify((g.objs || []).map(o => [o.kind, o.v, o.x, o.y])));
        const sol = Array.isArray(g.ground) ? g.ground.map(empreinte).join(' | ') : empreinte(g.ground);
        W.unprepare(m);
        return sol;
      });
    }
    return E;
  }

  window.Empreintes = {
    calculer,
    async base(cartes) {
      const E = await calculer(cartes);
      try { localStorage.setItem(CLE, JSON.stringify(E)); } catch (e) { console.warn('empreintes non gardées :', e.message); }
      return Object.keys(E).length + ' empreintes gardées';
    },
    async compare(cartes) {
      const B = JSON.parse(localStorage.getItem(CLE) || 'null'); if (!B) return 'pas de base : lancer Empreintes.base() avant le nettoyage';
      const E = await calculer(cartes), changés = [], disparus = [], nouveaux = [];
      for (const k in B) if (!(k in E)) disparus.push(k); else if (B[k] !== E[k]) changés.push(k);
      for (const k in E) if (!(k in B)) nouveaux.push(k);
      return { total: Object.keys(E).length, changés, disparus, nouveaux };
    },
  };
})();
