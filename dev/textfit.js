'use strict';
// =====================================================================
//  VÉRIFICATION DES TEXTES : chaque texte tient-il dans son cadre ?
//  À lancer dans la console d'une page du jeu (après le chargement) :
//    const s = document.createElement('script'); s.src = 'dev/textfit.js'; document.body.appendChild(s);
//    puis  await DEV.textFit()   → liste des débordements (écran, texte, largeur, cadre)
//  Principe : UI.box et UI.text sont espionnés pendant qu'on dessine chaque écran une fois ;
//  un texte qui sort de l'écran, ou du plus petit cadre qui contient son point de départ, est signalé.
//  Les mêmes écrans sont vérifiés au clavier puis à la manette (les noms des boutons changent la largeur).
// =====================================================================
(function () {
  const DEV = window.DEV = window.DEV || {};
  DEV.textFit = async () => {
    const UI = DW.UI, W = DW.W, H = DW.H, st = DW.state;
    // une partie de test : un partenaire, un sac garni, quelques recrues
    if (!st.party.length) st.party.push(new DW.Digimon('agumon', 24));
    for (const id of DW.ITEM_ORDER.slice(0, 30)) st.bag[id] = 3;
    st.name = st.name || 'Kronos';
    const box = UI.box, text = UI.text, out = [];
    let boxes = [], scene = '';
    UI.box = (c, x, y, w, h, s) => { boxes.push([x, y, w, h]); return box(c, x, y, w, h, s); };
    UI.text = (c, s, x, y, o = {}) => {
      const str = DW.Input.keys(String(s)), size = o.size || 10, tw = UI.measure(c, str, size);
      const x0 = o.align === 'center' ? x - tw / 2 : o.align === 'right' ? x - tw : x, x1 = x0 + tw;
      // plus petit cadre qui contient le point d'ancrage du texte
      let frame = null;
      for (const b of boxes) if (x >= b[0] && x <= b[0] + b[2] && y - size * 0.6 >= b[1] && y <= b[1] + b[3] + 2 && (!frame || b[2] * b[3] < frame[2] * frame[3])) frame = b;
      const L = frame ? frame[0] + 1 : 0, R = frame ? frame[0] + frame[2] - 1 : W;
      if (str.trim() && (x0 < L - 0.5 || x1 > R + 0.5)) out.push({ scene, text: str.slice(0, 60), dépasse: Math.round(Math.max(L - x0, x1 - R)), cadre: frame ? frame.map(Math.round).join(',') : 'écran' });
      return text(c, s, x, y, o);
    };
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const c = cv.getContext('2d');
    const draw = (name, sc, setup) => {
      scene = name; boxes = [];
      try { if (setup) setup(sc); sc.t = 0.5; c.save(); sc.draw(c); c.restore(); } catch (e) { out.push({ scene: name, text: 'ERREUR ' + e.message }); }
    };
    const SCENES = () => [
      ['Menu', new DW.MenuScene()],
      ['Fiche Statut', new DW.SummaryScene(0), s => (s.tab = 0)],
      ['Fiche Techniques', new DW.SummaryScene(0), s => (s.tab = 1)],
      ['Équipe', new DW.PartyScene({ mode: 'view' })],
      ['Sac', new DW.BagScene({})],
      ['Banque', new DW.BankScene()],
      ['DigiDex', new DW.DexScene()],
      ['Boutique', new DW.ShopScene(DW.ITEM_ORDER.slice(0, 12))],
      ['Options', new DW.OptionsScene()],
      ['Digivolutions', new DW.EvoTableScene(0)],
      ['Album', new DW.AlbumScene()],
      ['Journal', DW.Story.JournalScene ? new DW.Story.JournalScene() : null],
      ['Journal Requêtes', DW.Story.JournalScene ? new DW.Story.JournalScene() : null, sc => (sc.tab = 1)],
      ['Journal Écussons', DW.Story.JournalScene ? new DW.Story.JournalScene() : null, sc => (sc.tab = 2)],
      ['Carte du monde', new DW.WorldMapScene()],
      ['DigiFerme', new DW.FarmScene()],
    ];
    const devices = [['clavier', 'key', 'xbox'], ['manette PlayStation', 'pad', 'ps']];
    const keep = [DW.Input.device, DW.Input.padKind];
    for (const [label, dev, kind] of devices) {
      DW.Input.device = dev; DW.Input.padKind = kind;
      for (const [name, sc, setup] of SCENES()) if (sc) draw(`${name} (${label})`, sc, setup);
    }
    [DW.Input.device, DW.Input.padKind] = keep;
    UI.box = box; UI.text = text;
    // un même texte trop long n'est signalé qu'une fois par écran
    const seen = new Set();
    return out.filter(o => { const k = o.scene.replace(/ \(.*\)$/, '') + o.text; if (seen.has(k)) return false; seen.add(k); return true; });
  };
})();
