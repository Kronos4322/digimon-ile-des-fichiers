'use strict';
// =====================================================================
//  HÉROS : rendu en volume (28x36, proportions façon Digimon World 1), 4 directions × 4 temps de marche
//  Sept DigiDestinés au choix (inspirés de la saison 1) : coiffure, couvre-chef,
//  haut, bas, chaussures et gants paramétrés par DW.HEROES
// =====================================================================
(function () {
  const Art = DW.Art;

  // ------------------------------------------------------------ apparences
  // hair : spiky | short | bob | long      head : goggles | cap | cowboy | bucket | glasses | ''
  // deco : star | collar | stripe | heart | ''   bottom : shorts | pants | skirt
  DW.HEROES = {
    tai: { name: 'Tai', crest: 'Courage', crestCol: '#f08020', desc: 'Fonceur et généreux, il entraîne toujours les autres dans l\'aventure.',
      skin: '#f6c08c', hair: '#7a4220', hairL: '#a0602c', style: 'spiky', head: 'goggles', headCol: '#7e8492',
      shirt: '#2f6ad8', sleeve: '#2a5cc4', deco: 'star', decoCol: '#f8d030', bottom: 'shorts', bottomCol: '#cfb27a', shoe: '#e04a2c', glove: '#f6f6f2' },
    sora: { name: 'Sora', crest: 'Amour', crestCol: '#e83a3a', desc: 'Sportive et attentionnée, elle veille sur tout le groupe.',
      skin: '#f4bc8a', hair: '#c8582a', hairL: '#e8804a', style: 'bob', fem: true, head: 'cap', headCol: '#3a78d8',
      shirt: '#f0c838', sleeve: '#e0b020', deco: 'collar', decoCol: '#f8f0d0', bottom: 'pants', bottomCol: '#4a6aa8', shoe: '#f0eee8', glove: '#f6f6f2' },
    matt: { name: 'Matt', crest: 'Amitié', crestCol: '#3a8ae8', desc: 'Calme et solitaire, il protège son petit frère coûte que coûte.',
      skin: '#f8c898', hair: '#f0d060', hairL: '#fff0a0', style: 'short', head: '',
      shirt: '#3a9a4a', sleeve: '#f0ead0', deco: 'collar', decoCol: '#f0ead0', bottom: 'pants', bottomCol: '#3a5a9a', shoe: '#7a5a3a', glove: null },
    mimi: { name: 'Mimi', crest: 'Pureté', crestCol: '#40b040', desc: 'Rêveuse et sincère, elle a un cœur immense.',
      skin: '#f8cc9c', hair: '#f0a0c0', hairL: '#ffd0e0', style: 'long', fem: true, head: 'cowboy', headCol: '#f070a8',
      shirt: '#e83a5a', sleeve: '#f05a78', deco: 'heart', decoCol: '#ffe0ea', bottom: 'skirt', bottomCol: '#e83a5a', shoe: '#f8e0e8', glove: '#f8f8f8' },
    izzy: { name: 'Izzy', crest: 'Savoir', crestCol: '#9050d0', desc: 'Petit génie de l\'informatique, il veut tout comprendre du Digimonde.',
      skin: '#f0b880', hair: '#a0402a', hairL: '#c86040', style: 'spiky', head: '',
      shirt: '#f08a2a', sleeve: '#e07818', deco: '', bottom: 'shorts', bottomCol: '#6a8a5a', shoe: '#3a5ab0', glove: '#5a8ae0' },
    joe: { name: 'Joe', crest: 'Sincérité', crestCol: '#8a8a98', desc: 'Prudent et responsable, il ne laisse jamais tomber ses amis.',
      skin: '#f6c49a', hair: '#3a4a8a', hairL: '#5a6ab0', style: 'short', head: 'glasses', headCol: '#e8eef8',
      shirt: '#f2f2ee', sleeve: '#e0e0da', deco: 'stripe', decoCol: '#5a8ad0', bottom: 'pants', bottomCol: '#4a5a8a', shoe: '#7a5a3a', glove: null },
    tk: { name: 'T.K.', crest: 'Espoir', crestCol: '#f0d030', desc: 'Le plus jeune, mais aussi le plus optimiste de tous.',
      skin: '#f8cc9c', hair: '#f0d878', hairL: '#fff0b0', style: 'short', head: 'bucket', headCol: '#4aa84a',
      shirt: '#3aa04a', sleeve: '#f0e070', deco: 'stripe', decoCol: '#f0e070', bottom: 'shorts', bottomCol: '#7aa0d8', shoe: '#f0a030', glove: null },
  };
  DW.HERO_ORDER = ['tai', 'sora', 'matt', 'mimi', 'izzy', 'joe', 'tk'];
  // LE HÉROS DU JOUEUR : un enfant qui n'est pas dans l'animé (state.hero = 'perso'), créé au début de la partie.
  // Son apparence est dans state.look ; il délivre les enfants de l'animé chapitre après chapitre.
  DW.HEROES.perso = { name: 'Toi', crest: 'Lien', crestCol: '#5adcc8', desc: 'Un enfant venu d\'ailleurs, qui va délivrer les autres.',
    skin: '#f6c08c', hair: '#5a3a24', hairL: '#7a5a3a', style: 'short', head: '', headCol: '#e04a3a', jacket: true, tee: '#f6f4ee',
    shirt: '#e8582a', sleeve: '#d84a20', deco: 'stripe', decoCol: '#ffffff', bottom: 'shorts', bottomCol: '#3a5a9a', shoe: '#3a3a4a', glove: null };
  // choix proposés à la création
  DW.LOOK_OPTS = {
    style: [['Garçon (court)', { style: 'short', bottom: 'shorts' }], ['Garçon (en bataille)', { style: 'spiky', bottom: 'pants' }], ['Fille (carré)', { style: 'bob', bottom: 'skirt' }], ['Fille (longs)', { style: 'long', bottom: 'pants' }]],
    gender: ['Garçon', 'Fille'],
    // allures proposées selon le genre choisi
    styles: [
      [['Cheveux courts, short', { style: 'short', bottom: 'shorts' }], ['Cheveux courts, pantalon', { style: 'short', bottom: 'pants' }], ['En bataille, short', { style: 'spiky', bottom: 'shorts' }], ['En bataille, pantalon', { style: 'spiky', bottom: 'pants' }],
       ['Courts, pantalon large', { style: 'short', bottom: 'baggy' }], ['En bataille, pantalon large', { style: 'spiky', bottom: 'baggy' }]],
      [['Carré, jupe', { style: 'bob', bottom: 'skirt' }], ['Carré, pantalon', { style: 'bob', bottom: 'pants' }], ['Cheveux longs, jupe', { style: 'long', bottom: 'skirt' }], ['Cheveux longs, pantalon', { style: 'long', bottom: 'pants' }],
       ['Carré, pantalon large', { style: 'bob', bottom: 'baggy' }], ['Longs, pantalon large', { style: 'long', bottom: 'baggy' }]],
    ],
    hair: [['Châtain', ['#5a3a24', '#7a5a3a']], ['Noir', ['#22222c', '#3a3a48']], ['Blond', ['#e8c060', '#fff0a0']], ['Roux', ['#c8582a', '#e8804a']], ['Bleu nuit', ['#2a3a7a', '#4a5aa8']], ['Rose', ['#e07aa8', '#ffb0d0']],
           ['Gris argent', ['#9a9aa8', '#d0d0dc']], ['Blanc', ['#e8e8f0', '#ffffff']], ['Vert', ['#2a8a4a', '#5ac06a']], ['Violet', ['#6a3aa8', '#9a6ad8']], ['Brun foncé', ['#3a2418', '#5a3a28']], ['Bleu ciel', ['#4a9ae0', '#8ac8ff']], ['Rouge vif', ['#c8202a', '#f05a4a']]],
    shirt: [['Rouge', '#e04a3a'], ['Orange', '#e8822a'], ['Vert', '#3a9a5a'], ['Bleu', '#2f6ad8'], ['Violet', '#8a4ac8'], ['Turquoise', '#2aa8a8'], ['Blanc', '#f0f0ec'],
           ['Jaune', '#f0c030'], ['Rose', '#e86aa8'], ['Noir', '#2a2a34'], ['Gris', '#7a7a88'], ['Bleu ciel', '#5ab0f0'], ['Vert pomme', '#7ac83a'], ['Bordeaux', '#8a2a3a'], ['Marron', '#7a4a2a']],
    head: [['Rien', ''], ['Casquette', 'cap'], ['Bonnet', 'beanie'], ['Lunettes de plongée', 'goggles'], ['Bob', 'bucket'], ['Lunettes', 'glasses']],
    // haut (veste ouverte, sweat à capuche façon Digimon World 2003, tee-shirt) et sac à dos
    top: [['Veste ouverte', 'jacket'], ['Sweat à capuche', 'hoodie'], ['Tee-shirt', 'tee']],
    bag: [['Sans sac', false], ['Sac à dos', true]],
    // création détaillée (chaque partie séparée) : coupe, yeux, bas et sa couleur, chaussures
    cut: [['Courts', 'short'], ['En bataille', 'spiky'], ['Carré', 'bob'], ['Longs', 'long']],
    eye: [['Marron', '#5a3a20'], ['Noisette', '#8a5a2a'], ['Vert', '#2a8a4a'], ['Bleu', '#2a6ad8'], ['Gris', '#6a7a8a'], ['Violet', '#7a4ab8'], ['Rouge', '#c83a3a'], ['Doré', '#c8962a'], ['Noir', '#22222a'], ['Turquoise', '#2aa8a8']],
    bottom: [['Short', 'shorts'], ['Pantalon', 'pants'], ['Pantalon large', 'baggy'], ['Jupe', 'skirt']],
    bottomCol: [['Bleu jean', '#3a5a9a'], ['Gris', '#5a5a6a'], ['Noir', '#2a2a32'], ['Beige', '#c8b088'], ['Kaki', '#5a6a3a'], ['Rouge', '#a83a3a'], ['Blanc', '#e8e8e4'],
                ['Bleu marine', '#22305a'], ['Vert', '#2a7a4a'], ['Rose', '#d86a9a'], ['Violet', '#6a3a9a'], ['Marron', '#6a4228'], ['Orange', '#d8702a']],
    shoe: [['Anthracite', '#3a3a4a'], ['Rouge', '#c83a3a'], ['Bleu', '#2f5ad8'], ['Blanc', '#e8e8e8'], ['Jaune', '#e8c040'], ['Vert', '#3a9a5a'], ['Noir', '#1e1e24'], ['Rose', '#e86aa8'], ['Orange', '#e8822a'], ['Violet', '#8a4ac8']],
    skin: [['Claire', '#f6c08c'], ['Très claire', '#fbd8b8'], ['Mate', '#e0a878'], ['Hâlée', '#c08a58'], ['Brune', '#94603a'], ['Foncée', '#6a4228']],
  };
  const lookOf = L => {
    const S = DW.LOOK_OPTS, b = DW.HEROES.perso, o = { ...b };
    if (!L) return o;
    Object.assign(o, L.gender != null ? S.styles[L.gender][L.style || 0][1] : S.style[L.style || 0][1]);   // (anciennes parties : sans genre)
    const [h, hl] = S.hair[L.hair || 0][1]; o.hair = h; o.hairL = hl;
    const sh = S.shirt[L.shirt || 0][1]; o.shirt = sh; o.sleeve = sh; o.crestCol = sh === '#f0f0ec' ? '#5adcc8' : sh;
    // (anciennes parties : l'accessoire n°2 était les lunettes de plongée ; le bonnet s'insère sans rien décaler)
    const HEADS = L.v2 ? S.head : S.head.filter(h => h[1] !== 'beanie');
    o.head = (HEADS[L.head || 0] || HEADS[0])[1]; o.headCol = o.head === 'beanie' ? '#4a4a52' : sh === '#f0f0ec' ? '#e04a3a' : '#f0f0ec';
    o.bottomCol = o.bottom === 'skirt' ? '#3a5a9a' : o.bottom === 'pants' ? '#4a5a7a' : o.bottom === 'baggy' ? '#4a4870' : '#3a5a9a';
    const top = (S.top[L.top || 0] || S.top[0])[1]; o.top = top; o.hoodie = top === 'hoodie'; o.bag = !!(S.bag[L.bag || 0] || S.bag[0])[1]; o.bagCol = '#3a3a42';
    o.fem = L.gender === 1; o.jacket = o.top === 'jacket'; o.tee = sh === '#f0f0ec' ? '#3a4a6a' : '#f6f4ee';   // veste ouverte sur un tee-shirt
    // création détaillée (v3) : coupe, yeux, bas, couleur du bas, chaussures choisis séparément
    if (L.v3) {
      o.style = (S.cut[L.cut || 0] || S.cut[0])[1]; o.eye = (S.eye[L.eye || 0] || S.eye[0])[1];
      if (L.skin) o.skin = (S.skin[L.skin] || S.skin[0])[1];
      o.bottom = (S.bottom[L.bottom || 0] || S.bottom[0])[1]; o.bottomCol = (S.bottomCol[L.bottomCol || 0] || S.bottomCol[0])[1]; o.shoe = (S.shoe[L.shoe || 0] || S.shoe[0])[1];
    }
    o.name = 'perso3-' + [L.gender, L.style, L.hair, L.shirt, L.head, L.top || 0, L.bag || 0, L.v2 ? 1 : 0, L.v3 ? [L.cut, L.eye, L.bottom, L.bottomCol, L.shoe, L.skin || 0].join('.') : ''].join('-');   // (clé du cache des sprites)
    return o;
  };
  DW.lookOf = lookOf;
  DW.heroLook = id => { const k = id || (DW.state && DW.state.hero); return k === 'perso' ? lookOf(DW.state && DW.state.look) : DW.HEROES[k] || DW.HEROES.tai; };

  // Proportions façon Digimon World 1 : ~2,8 têtes, sprite 28×36 (pieds en bas), détails de vêtements.
  const SWING = [0, 1, 0, -1];
  // teinte plus sombre (k<0) ou plus claire (k>0) d'une couleur #rrggbb
  const tint = (col, k) => '#' + Art.mix(Art.hex(col), k < 0 ? [0, 0, 0] : [255, 255, 255], Math.abs(k)).map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
  const SOLE = '#f4f0e8', BLUSH = '#ff9a8a', MOUTH = '#a8503a', WHITE = '#ffffff', SOCK = '#f4f2ec';
  const HW = 28, HH = 36;

  // ------------------------------------------------------------ pièces communes
  // basket : bout renforcé clair, lacets, semelle épaisse
  function shoe(d, x, y, C, o = {}) {
    d.ell(x, y, 2.9, 1.9, C.shoe, 0, o);
    d.deco.ell(x, y + 0.5, 1.9, 0.9, tint(C.shoe, 0.6));                     // bout renforcé
    d.deco.rect(x - 2.9, y + 0.8, 5.8, 1.1, SOLE);                            // semelle
    d.deco.line(x - 2.7, y + 1.9, x + 2.7, y + 1.9, 0.5, tint(C.shoe, -0.45));
    d.deco.line(x - 1.1, y - 1.1, x + 1.1, y - 1.1, 0.45, WHITE); d.deco.line(x - 0.9, y - 0.4, x + 0.9, y - 0.4, 0.45, WHITE);   // lacets
    d.deco.line(x - 2.4, y - 0.2, x - 1.7, y + 0.6, 0.45, tint(C.shoe, 0.35));   // reflet
  }
  function bottoms(d, C, cx, w, front) {
    const x0 = cx - w / 2, B = C.bottomCol, D = tint(B, -0.3), L = tint(B, 0.25);
    if (C.bottom === 'skirt') {
      // jupe plissée : panneaux alternés clair / sombre, ourlet
      d.poly([[x0, 21.8], [x0 + w, 21.8], [x0 + w + 2, 27.6], [x0 - 2, 27.6]], B);
      for (let k = 0; k < 4; k++) {
        const a = x0 + k * w / 4, b = x0 + (k + 0.5) * w / 4, A = x0 - 2 + k * (w + 4) / 4, Bb = x0 - 2 + (k + 0.5) * (w + 4) / 4;
        d.deco.poly([[a, 22.4], [b, 22.4], [Bb, 27.4], [A, 27.4]], tint(B, -0.18));
      }
      d.deco.line(x0 - 2, 27.2, x0 + w + 2, 27.2, 0.7, L);
      d.deco.rect(x0, 21.6, w, 1.1, D);                                        // ceinture
      return;
    }
    d.rect(x0 - (C.bottom === 'baggy' ? 0.6 : 0), 21.8, w + (C.bottom === 'baggy' ? 1.2 : 0), longLegs(C) ? 4.6 : 5.2, B, { round: 0.4 });
    if (front) {
      d.deco.line(cx, 23.4, cx, 26.6, 0.6, D);
      // poches et ourlet du short
      d.deco.line(x0 + 1, 23, x0 + 2.6, 24.6, 0.5, D); d.deco.line(x0 + w - 1, 23, x0 + w - 2.6, 24.6, 0.5, D);
      if (C.bottom === 'shorts') d.deco.line(x0 + 0.4, 26.4, x0 + w - 0.4, 26.4, 0.6, D);
    }
    // ceinture, passants et boucle
    d.deco.rect(x0, 21.6, w, 1.2, tint(B, -0.45));
    d.deco.rect(x0 + 1.6, 21.5, 0.6, 1.5, D); d.deco.rect(x0 + w - 2.2, 21.5, 0.6, 1.5, D);
    if (front) { d.deco.rect(cx - 1, 21.5, 2, 1.4, '#e8c860'); d.deco.rect(cx - 0.4, 21.8, 0.8, 0.8, '#a8843a'); }
  }
  const longLegs = C => C.bottom === 'pants' || C.bottom === 'baggy';
  function legsFront(d, C, s) {
    const lift = k => (s === k ? 1.8 : 0), legCol = longLegs(C) ? C.bottomCol : C.skin, wide = C.bottom === 'baggy';
    for (const [x, k] of [[11.4, 1], [16.6, -1]]) {
      d.tube([[x, 25], [x, 31.6 - lift(k)]], wide ? 4.6 : 3.6, wide ? 4.4 : 3.1, legCol);
      if (wide) { d.deco.rect(x - 2.2, 29.6 - lift(k), 4.4, 1.4, tint(C.bottomCol, 0.3)); d.deco.line(x - 2.2, 29.5 - lift(k), x + 2.2, 29.5 - lift(k), 0.4, tint(C.bottomCol, -0.4)); d.deco.line(x - 0.6, 26, x - 0.9, 29, 0.45, tint(C.bottomCol, -0.3)); shoe(d, x, 33 - lift(k), C); continue; }   // revers retroussés, pli
      if (!longLegs(C)) { d.deco.rect(x - 1.5, 30.2 - lift(k), 3, 1.3, SOCK); d.deco.rect(x - 1.5, 30.2 - lift(k), 3, 0.45, C.crestCol || C.shirt); }   // chaussette à liseré
      else { d.deco.rect(x - 1.7, 30.4 - lift(k), 3.4, 0.8, tint(C.bottomCol, -0.3)); d.deco.line(x + 0.6, 26, x + 0.6, 30, 0.45, tint(C.bottomCol, 0.18)); }   // revers et pli
      shoe(d, x, 33 - lift(k), C);
    }
  }
  function armFront(d, C, sx, ay, far, sleeveCol) {
    const hand = C.glove || C.skin, dir = sx < 14 ? -1 : 1, o = far ? { far: true } : {};
    d.tube([[sx, 16], [sx + dir * 0.9, 20.4 + ay * 0.5], [sx + dir * 0.6, 23.4 + ay]], 2.5, 2.1, C.skin, o);
    d.tube([[sx, 15.6], [sx + dir * 0.6, 18.4]], 3.2, 2.9, sleeveCol, o);
    d.deco.line(sx - 1.4, 18.4, sx + 1.6, 18.4, 0.6, tint(sleeveCol, -0.3));                 // ourlet de la manche
    d.deco.line(sx - dir * 0.8, 16, sx - dir * 0.6, 18, 0.45, tint(sleeveCol, 0.25));          // reflet sur la manche
    d.circ(sx + dir * 0.6, 24.1 + ay, 1.55, hand, o);
    d.deco.line(sx + dir * 0.6 - 0.6, 24.5 + ay, sx + dir * 0.6 + 0.6, 24.5 + ay, 0.4, tint(hand, -0.2));   // doigts repliés
    if (C.glove) d.deco.rect(sx + dir * 0.6 - 1.5, 22.6 + ay, 3, 0.9, tint(C.glove, -0.15));
  }
  function torsoFront(d, C, back) {
    d.blob([[8.6, 14.8], [19.4, 14.8], [19.8, 22.6], [8.2, 22.6]], C.shirt);
    const D = tint(C.shirt, -0.28), L = tint(C.shirt, 0.25);
    d.deco.line(10, 20.6, 12.4, 21.4, 0.5, tint(C.shirt, -0.22)); d.deco.line(18, 20.6, 15.8, 21.4, 0.5, tint(C.shirt, -0.22));
    // coutures sombres : les vêtements se détachent bien les uns des autres
    d.deco.line(8.7, 15.2, 8.4, 22.4, 0.5, tint(C.shirt, -0.55)); d.deco.line(19.3, 15.2, 19.6, 22.4, 0.5, tint(C.shirt, -0.55));
    if (C.hoodie) {
      // sweat à capuche : capuche autour du cou, poche kangourou, cordons, poignets et ceinture côtelés
      d.deco.rect(8.4, 21.4, 11.2, 1.3, D); for (let x = 9; x < 19.5; x += 1.3) d.deco.rect(x, 21.5, 0.4, 1.1, tint(C.shirt, -0.45));
      if (back) { d.deco.poly([[9.6, 14.6], [18.4, 14.6], [17.4, 19.4], [14, 20.4], [10.6, 19.4]], tint(C.shirt, -0.12)); d.deco.line(14, 15, 14, 20, 0.5, D); return; }
      d.deco.poly([[9.2, 14.6], [12.2, 14.6], [13, 16.4], [10.4, 16.6]], tint(C.shirt, -0.15)); d.deco.poly([[15.8, 14.6], [18.8, 14.6], [17.6, 16.6], [15, 16.4]], tint(C.shirt, -0.15));   // capuche
      d.deco.poly([[12.4, 14.7], [15.6, 14.7], [14, 16.2]], tint(C.skin, -0.25));                                                // encolure
      d.deco.line(13.1, 16, 12.9, 18.6, 0.45, WHITE); d.deco.line(14.9, 16, 15.1, 18.6, 0.45, WHITE); d.deco.rect(12.6, 18.4, 0.7, 0.7, '#c8c8d0'); d.deco.rect(14.8, 18.4, 0.7, 0.7, '#c8c8d0');   // cordons
      d.deco.poly([[10.8, 18.8], [17.2, 18.8], [17.8, 21.2], [10.2, 21.2]], tint(C.shirt, -0.12)); d.deco.line(10.6, 18.8, 17.4, 18.8, 0.5, D);   // poche kangourou
      d.deco.rect(12.6, 16.8, 2.8, 1.2, C.crestCol === C.shirt ? '#ffffff' : C.crestCol || '#ffffff');   // petit logo
      return;
    }
    if (C.top === 'tee') {
      d.deco.ell(14, 15, 2.6, 0.9, tint(C.shirt, -0.4)); d.deco.ell(14, 14.8, 2, 0.6, C.skin);   // col rond
      d.deco.rect(8.4, 21.5, 11.2, 0.8, tint(C.shirt, -0.35));
      if (!back) { d.deco.circ(14, 18.4, 1.6, C.crestCol === C.shirt ? '#ffffff' : C.crestCol, { unlit: true }); d.deco.circ(14, 18.4, 0.8, C.shirt, { unlit: true }); }
      return;
    }
    if (C.jacket) {
      // ombres sur les côtés, ourlet côtelé
      d.deco.line(9.2, 15.8, 8.9, 21.4, 0.6, D); d.deco.line(18.8, 15.8, 19.1, 21.4, 0.6, D);
      d.deco.rect(8.4, 21.5, 11.2, 1.1, D); for (let x = 9; x < 19.5; x += 1.4) d.deco.rect(x, 21.6, 0.4, 0.9, tint(C.shirt, -0.42));
    }
    if (back) {
      d.deco.line(14, 15.6, 14, 21.2, 0.5, tint(C.shirt, -0.2));
      if (C.jacket) { d.deco.circ(14, 17.6, 1.7, L); d.deco.circ(14, 17.6, 1.1, C.shirt); d.deco.circ(14, 17.6, 0.5, L); d.deco.rect(10.6, 14.6, 6.8, 1, D); }   // capuche rabattue, logo au dos
      return;
    }
    if (C.jacket) {
      const T = C.tee || '#f6f4ee';
      // pans de la veste en aplats (façon dessin animé) : clair devant, ombre franche sur le bord extérieur
      d.deco.poly([[8.9, 15.2], [12.2, 15], [11.8, 21.4], [8.7, 21.4]], tint(C.shirt, 0.06), { unlit: true });
      d.deco.poly([[15.8, 15], [19.1, 15.2], [19.3, 21.4], [16.2, 21.4]], tint(C.shirt, 0.06), { unlit: true });
      d.deco.poly([[8.9, 15.4], [9.9, 15.4], [9.6, 21.4], [8.7, 21.4]], D, { unlit: true }); d.deco.poly([[18.2, 15.4], [19.1, 15.4], [19.3, 21.4], [18.5, 21.4]], D, { unlit: true });
      d.deco.line(10.6, 15.6, 10.4, 18.6, 0.5, L);                                           // reflet
      d.deco.poly([[12.1, 14.8], [15.9, 14.8], [16.3, 21.4], [11.7, 21.4]], T);           // le tee-shirt sous la veste
      d.deco.poly([[12.1, 19.6], [16.1, 19.6], [16.3, 21.4], [11.7, 21.4]], tint(T, -0.1));   // ombre du bas du tee-shirt
      d.deco.poly([[12.6, 14.8], [15.4, 14.8], [14, 16.4]], tint(T, -0.18));               // encolure
      d.deco.line(12.1, 14.9, 11.7, 21.4, 0.7, D); d.deco.line(15.9, 14.9, 16.3, 21.4, 0.7, D);   // bords de la veste
      d.deco.line(11.2, 15, 12.5, 17.4, 0.6, L); d.deco.line(16.8, 15, 15.5, 17.4, 0.6, L);       // revers
      d.deco.rect(9.4, 19.2, 2, 0.6, D); d.deco.rect(16.6, 19.2, 2, 0.6, D);                    // poches
      d.deco.rect(11.3, 16.4, 0.5, 1.2, '#c8c8d0'); d.deco.rect(16.2, 16.4, 0.5, 1.2, '#c8c8d0'); // tirettes
      // emblème « Lien » sur le tee-shirt
      d.deco.circ(14, 18.7, 1.25, C.crestCol, { unlit: true }); d.deco.circ(14, 18.7, 0.75, T, { unlit: true }); d.deco.circ(14, 18.7, 0.4, C.crestCol, { unlit: true });
      return;
    }
    if (C.deco === 'star') {
      const cx = 14, cy = 18.4, pts = [];
      for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 1.2 : 2.7; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
      d.deco.poly(pts, C.decoCol, { unlit: true });
      d.deco.rect(12.2, 14.6, 3.6, 1.1, SOLE);
    } else if (C.deco === 'collar') d.deco.poly([[11.2, 14.6], [16.8, 14.6], [14, 17.8]], C.decoCol, { unlit: true });
    else if (C.deco === 'stripe') { d.deco.rect(8.6, 18, 11, 1.5, C.decoCol); d.deco.rect(12.4, 14.6, 3.2, 1, tint(C.shirt, -0.2)); }
    else if (C.deco === 'heart') { d.deco.circ(13.2, 17.6, 1, C.decoCol); d.deco.circ(14.8, 17.6, 1, C.decoCol); d.deco.poly([[12.2, 17.9], [15.8, 17.9], [14, 19.8]], C.decoCol); }
    else d.deco.rect(12.4, 14.6, 3.2, 1, tint(C.shirt, -0.2));
  }
  function eye(d, C, x, rx, s) {
    const iris = C.eye || '#5a3a20', lid = tint(C.hair, -0.5);
    d.deco.ell(x, 9.95, rx * 1.1 + 0.18, 2.05, tint(C.skin, -0.55), 0, { unlit: true });                 // contour de l'œil (bien détaché du visage)
    d.deco.ell(x, 9.9, rx * 1.1, 1.9, WHITE, 0, { unlit: true });
    d.deco.ell(x + 0.15, 10.2, rx * 0.82, 1.55, iris, 0, { unlit: true });
    d.deco.ell(x + 0.15, 9.5, rx * 0.82, 0.7, tint(iris, -0.4), 0, { unlit: true });        // haut de l'iris, dans l'ombre de la paupière
    d.deco.ell(x + 0.15, 10.4, rx * 0.4, 0.8, '#140a04', 0, { unlit: true });                // pupille
    d.deco.ell(x + 0.2, 11.2, rx * 0.55, 0.35, tint(iris, 0.35), 0, { unlit: true });        // lumière au bas de l'iris
    d.deco.rect(x - 0.6, 8.9, 0.8, 0.8, WHITE, { unlit: true }); d.deco.rect(x + 0.55, 10.8, 0.4, 0.4, WHITE, { unlit: true });   // deux reflets
    d.deco.line(x - rx * 1.2, 8.3, x + rx * 1.2, 8.05, 0.75, lid, { unlit: true });          // paupière
    if (C.fem) { d.deco.line(x + s * rx * 1.15, 8.15, x + s * rx * 1.7, 7.6, 0.5, lid, { unlit: true }); d.deco.line(x + s * rx * 0.6, 8.05, x + s * rx * 0.95, 7.45, 0.45, lid, { unlit: true }); }   // cils
    d.deco.line(x - rx * 0.9, 6.6, x + rx * 0.9, 6.4, 0.5, tint(C.hair, -0.1));                // sourcil (fin)
  }
  function face(d, C) {
    eye(d, C, 11.6, 1.35, -1); eye(d, C, 16.4, 1.35, 1);
    d.deco.line(14.2, 11.2, 14, 11.9, 0.5, tint(C.skin, -0.22));                            // nez
    d.deco.line(13.2, 13, 14, 13.3, 0.5, MOUTH, { unlit: true }); d.deco.line(14, 13.3, 14.8, 13, 0.5, MOUTH, { unlit: true });   // sourire
    d.deco.ell(10.3, 12.2, 0.8, 0.4, '#f8a890', 0, { unlit: true }); d.deco.ell(17.7, 12.2, 0.8, 0.4, '#f8a890', 0, { unlit: true });   // joues à peine rosées
  }

  // ------------------------------------------------------------ face / dos
  function straps(d, C, back) {
    if (!C.bag) return;
    if (back) {   // le sac sur le dos : rabat, poche, coutures
      d.rect(9.2, 15.2, 9.6, 7.8, C.bagCol, { round: 0.25 });
      d.deco.rect(9.8, 15.6, 8.4, 2.6, tint(C.bagCol, 0.2)); d.deco.line(9.8, 18.2, 18.2, 18.2, 0.5, '#1a1a20');
      d.deco.rect(11.4, 19.4, 5.2, 2.6, tint(C.bagCol, -0.2)); d.deco.rect(13.6, 18.6, 0.8, 1.2, '#d8b040');
      d.deco.line(10.6, 15.2, 10.2, 14.4, 0.8, tint(C.bagCol, -0.3)); d.deco.line(17.4, 15.2, 17.8, 14.4, 0.8, tint(C.bagCol, -0.3));
      return;
    }
    for (const [x0, x1] of [[10.2, 10.8], [17.8, 17.2]]) { d.deco.line(x0, 14.8, x1, 21.2, 1, C.bagCol); d.deco.line(x0 + 0.3, 14.8, x1 + 0.3, 21.2, 0.35, tint(C.bagCol, 0.35)); }   // bretelles
  }
  function front(d, ph, back, C) {
    const s = SWING[ph], ay = s * 1.1;
    if (C.style === 'long' && !back) d.blob([[6.6, 8], [21.4, 8], [22.2, 21], [5.8, 21]], C.hair, { far: true });
    legsFront(d, C, s);
    bottoms(d, C, 14, 11, !back);
    armFront(d, C, 8.2, ay, back, C.sleeve);
    armFront(d, C, 19.8, -ay, back, C.sleeve);
    torsoFront(d, C, back);
    straps(d, C, back);
    if (back && C.style === 'long') d.blob([[6.8, 8], [21.2, 8], [21.8, 21.4], [6.2, 21.4]], C.hair);
    // cou et tête
    d.rect(12.6, 13, 2.8, 2.4, C.skin, { round: 0.3 });
    d.ell(7.9, 9.6, 1.2, 1.6, C.skin); d.ell(20.1, 9.6, 1.2, 1.6, C.skin);
    d.ell(14, 8.6, 6.3, 6.2, C.skin);
    if (!back) {
      d.deco.ell(14, 10.3, 5.3, 4.3, tint(C.skin, 0.03), 0, { unlit: true });   // visage net (le modelé du volume salissait le bas du visage)
      if (C.head === 'glasses') { d.deco.circ(11.6, 9.9, 2.1, C.headCol, { shiny: true }); d.deco.circ(16.4, 9.9, 2.1, C.headCol, { shiny: true }); }
      face(d, C);
      if (C.head === 'glasses') d.deco.line(13.6, 9.6, 14.4, 9.6, 0.5, '#5a6a8a');
      hairFront(d, C);
    } else hairBack(d, C);
    hat(d, C, back ? 'back' : 'front');
  }

  // reflet « en anneau » sur le dessus de la tête, et petites étincelles
  function shine(d, C, cx, cy, rx, ry, a0 = -2.5, a1 = -0.65) {
    const L = C.hairL, n = 7;
    for (let k = 0; k < n; k++) {
      const a = a0 + (a1 - a0) * k / n, b = a0 + (a1 - a0) * (k + 0.8) / n;
      d.deco.line(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, cx + Math.cos(b) * rx, cy + Math.sin(b) * ry, k % 2 ? 0.9 : 1.1, L);
    }
    d.deco.rect(cx + Math.cos(a0 + 0.5) * rx - 0.3, cy + Math.sin(a0 + 0.5) * ry - 0.9, 0.6, 0.6, tint(L, 0.5), { unlit: true });
  }
  // mèche pointue (triangle) qui retombe
  const lock = (d, col, x1, x2, tx, ty, y0) => d.poly([[x1, y0], [x2, y0], [tx, ty]], col);
  function clip(d, C) {   // barrette en étoile (fille)
    if (!C.fem || C.head) return;
    const cx = 18.4, cy = 5.6, pts = [];
    for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 0.7 : 1.6; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
    d.deco.poly(pts, C.crestCol || '#ffd040', { unlit: true }); d.deco.rect(cx - 0.3, cy - 0.5, 0.5, 0.5, WHITE, { unlit: true });
  }
  function hairFront(d, C) {
    const L = C.hairL, D = tint(C.hair, -0.25), DD = tint(C.hair, -0.42);
    d.deco.ell(14, 6.9, 5.2, 0.7, tint(C.skin, -0.1));                    // ombre de la frange sur le front
    if (C.style === 'spiky') {
      d.poly([[7.2, 10.6], [5, 5.2], [8, 5.6], [7, 1.2], [11, 3], [12.8, -0.2], [15.4, 2.4], [18.8, 0.2], [19.6, 4.2], [23, 3.8], [20.8, 10.6], [19.2, 7.4], [16, 6.6], [14, 7.8], [12, 6.6], [8.8, 7.4]], C.hair);
      // pointes qui retombent sur le front
      lock(d, C.hair, 9.6, 11.6, 10.4, 9.4, 6.6); lock(d, C.hair, 12.6, 15, 13.6, 9.8, 6.8); lock(d, C.hair, 16, 18, 17.4, 9.2, 6.8);
      // chaque pointe : un reflet et une ombre
      for (const [x1, y1, x2, y2] of [[9.4, 3.2, 11.6, 5], [15.6, 2.6, 17, 4.6], [13, 1.4, 13.6, 4], [6.6, 3, 8.4, 5.6], [19.4, 2, 19.2, 4.6]]) d.deco.line(x1, y1, x2, y2, 0.8, L);
      for (const [x1, y1, x2, y2] of [[11, 4.4, 10.4, 7], [15.2, 3.8, 15.6, 6.6], [18.6, 4, 18.4, 7]]) d.deco.line(x1, y1, x2, y2, 0.55, DD);
      d.deco.line(8.8, 7.4, 12, 6.6, 0.6, D); d.deco.line(16, 6.6, 19.2, 7.4, 0.6, D);
    } else if (C.style === 'short') {
      d.poly([[7.6, 10.4], [7.2, 5], [9.6, 2.2], [14, 1.4], [18.4, 2.2], [20.8, 5], [20.4, 10.4], [19, 7.2], [16.4, 7.8], [14, 6.2], [11.6, 7.8], [9, 7.2]], C.hair);
      // frange en mèches, pattes devant les oreilles
      lock(d, C.hair, 9.2, 11, 10, 8.8, 6.6); lock(d, C.hair, 11.4, 13.4, 12.4, 9, 6.6); lock(d, C.hair, 14.4, 16.6, 15.4, 8.8, 6.4); lock(d, C.hair, 17, 19, 18.4, 8.8, 6.8);
      d.poly([[7.4, 8.2], [8.8, 8.2], [8.2, 11.8]], C.hair); d.poly([[19.2, 8.2], [20.6, 8.2], [19.8, 11.8]], C.hair);
      for (const [x1, y1, x2, y2] of [[11, 3.4, 11.8, 7.4], [14, 2.6, 14.4, 6.6], [17, 3.4, 16.6, 7.4]]) d.deco.line(x1, y1, x2, y2, 0.5, DD);
      // chaque mèche de la frange : un trait clair au milieu, un sillon sombre entre deux mèches
      for (const [x1, x2] of [[10, 10.1], [12.4, 12.5], [15.4, 15.5], [18.1, 18.3]]) d.deco.line(x1, 6.8, x2, 8.2, 0.4, L);
      for (const x of [11.2, 13.9, 16.8]) d.deco.line(x, 6.4, x + 0.1, 7.8, 0.4, DD);
      d.deco.line(7.6, 6, 8, 10, 0.6, DD); d.deco.line(20.4, 6, 20, 10, 0.6, DD);                        // volume : côtés plus sombres
      shine(d, C, 14, 6.6, 5.4, 4.6);
    } else {
      d.poly([[7, 14.4], [6.8, 5], [9.6, 2], [14, 1.4], [18.4, 2], [21.2, 5], [21, 14.4], [19.2, 12.8], [19, 7.4], [15.4, 6.8], [14, 5.8], [12.6, 6.8], [9, 7.4], [8.8, 12.8]], C.hair);
      // frange balayée sur le côté, mèches qui encadrent le visage
      d.poly([[8.8, 7.0], [13.4, 5.0], [17.6, 6.0], [15.2, 7.0], [12.2, 7.6], [10, 8.2]], C.hair);
      lock(d, C.hair, 16.2, 18.2, 17.8, 8.4, 6.6);
      d.poly([[7, 8], [9, 8.4], [8.6, 14.8], [7.2, 15.4]], C.hair); d.poly([[19, 8.4], [21, 8], [20.8, 15.4], [19.4, 14.8]], C.hair);
      if (C.style === 'bob') { d.deco.ell(7.8, 14.2, 1.2, 0.7, D); d.deco.ell(20.2, 14.2, 1.2, 0.7, D); }    // pointes rentrées du carré
      else { lock(d, C.hair, 6.8, 8.8, 7.4, 17.4, 14.4); lock(d, C.hair, 19.2, 21.2, 20.6, 17.4, 14.4); }   // longues mèches
      d.deco.line(10, 3.2, 12.4, 4.8, 0.8, L); d.deco.line(15.8, 2.8, 18, 4.4, 0.8, L);
      d.deco.line(8.2, 8, 8.4, 13.4, 0.6, D); d.deco.line(19.8, 8, 19.6, 13.4, 0.6, D);
      d.deco.line(11, 7.6, 14.6, 6.2, 0.5, DD);
      shine(d, C, 14, 6.8, 5.8, 4.8);
    }
    clip(d, C);
  }
  function hairBack(d, C) {
    const L = C.hairL, DD = tint(C.hair, -0.42);
    if (C.style === 'spiky') {
      d.poly([[7.4, 13.4], [5, 7.4], [6.8, 3], [10.2, 2.2], [12.8, 0], [16, 1.8], [19.4, 0.8], [21.4, 4.2], [23, 7.8], [20.6, 13.4], [17, 14.6], [11, 14.6]], C.hair);
      d.deco.line(8.4, 4, 11, 9.6, 0.8, L); d.deco.line(15, 3, 16, 11, 0.8, L); d.deco.line(20, 5, 18.2, 11.6, 0.8, L);
      d.deco.line(12.4, 3, 13, 12.6, 0.55, DD); d.deco.line(17.6, 3.4, 16.8, 12.8, 0.55, DD);
    } else {
      const low = C.style === 'short' ? 13.4 : 14.6;
      d.poly([[7.8, low], [6.8, 6], [9.4, 2.2], [14, 1.4], [18.6, 2.2], [21.2, 6], [20.2, low], [14, low + 1]], C.hair);
      d.deco.line(10.8, 3.6, 11.8, 11, 0.8, L); d.deco.line(17.2, 3.6, 16.2, 11, 0.8, L);
      for (const x of [9.6, 12.4, 15.6, 18.4]) d.deco.line(x, 4, x + (14 - x) * 0.1, low - 0.6, 0.5, DD);   // mèches
      if (C.style === 'short') { lock(d, C.hair, 12.4, 15.6, 14, low + 2, low); }                      // petite nuque
      else if (C.style === 'long') for (const x of [8.6, 12, 15.6, 19]) lock(d, C.hair, x - 1.4, x + 1.4, x, 22.2, 20.6);   // pointes des longs cheveux
      shine(d, C, 14, 7, 5.8, 4.6, -2.7, -0.45);
    }
    if (C.fem && !C.head && C.style !== 'spiky') { d.deco.circ(14, 12.2, 1, C.crestCol || '#ffd040', { unlit: true }); }   // chouchou
  }
  // couvre-chef (vue : front | back | side)
  function hat(d, C, v) {
    const col = C.headCol, sd = v === 'side';
    if (C.head === 'goggles') {
      if (v === 'front') {
        d.deco.line(7.4, 6.8, 20.6, 6.8, 1.2, col);
        for (const x of [11.4, 16.6]) { d.deco.circ(x, 6.6, 1.95, '#2a3a4a'); d.deco.circ(x, 6.6, 1.5, '#4aa8f0', { shiny: true }); d.deco.rect(x - 0.7, 5.6, 0.7, 0.7, WHITE, { unlit: true }); }
      } else if (v === 'back') d.deco.line(6.6, 7, 21.4, 7, 1.3, col);
      else {
        d.deco.line(10, 6.4, 20.6, 6, 1.2, col);
        d.deco.circ(19, 6.2, 1.95, '#2a3a4a'); d.deco.circ(19, 6.2, 1.5, '#4aa8f0', { shiny: true });
        d.deco.rect(18.4, 5.2, 0.7, 0.7, WHITE, { unlit: true });
      }
    } else if (C.head === 'beanie') {
      // bonnet de laine (Digimon World 2003) : calotte côtelée, revers épais, petit écusson
      d.ell(sd ? 14.4 : 14, 4.2, 7.2, 4.8, col);
      d.rect(sd ? 7.6 : 6.8, 5.2, sd ? 13.6 : 14.4, 2.6, tint(col, -0.2), { round: 0.4 });
      for (let x = (sd ? 8.6 : 8); x < (sd ? 21 : 20.6); x += 1.4) d.deco.line(x, 5.5, x, 7.5, 0.4, tint(col, -0.42));
      for (let x = 9.5; x < 19.5; x += 2) d.deco.line(x, 1.2, x + (x - 14) * 0.15, 5, 0.4, tint(col, 0.25));
      if (v === 'front') { d.deco.rect(12, 5.6, 4, 1.8, '#e8e8e0'); d.deco.rect(12.6, 6, 2.8, 1, '#c84a3a'); }
    } else if (C.head === 'cap') {
      d.ell(14, 4.4, 6.9, 3.8, col);
      if (v === 'front') d.ell(14, 6.6, 7.2, 1.3, col);
      if (sd) d.ell(19.8, 6.3, 3.4, 1.1, col);
      d.deco.line(8.6, 5.8, 19.4, 5.8, 0.6, tint(col, 0.35));
      d.deco.circ(14, 1.2, 0.8, tint(col, 0.3));
    } else if (C.head === 'cowboy') {
      d.ell(sd ? 14.6 : 14, 5.8, sd ? 9 : 9.8, 1.9, col);
      d.ell(sd ? 14.4 : 14, 3.2, 5.2, 3.2, col);
      d.deco.line(sd ? 9.6 : 9, 4.9, sd ? 19 : 19, 4.9, 1, WHITE);
    } else if (C.head === 'bucket') {
      d.ell(14, 6.6, sd ? 7.8 : 8.2, 1.9, col);
      d.ell(14, 4, 6.4, 3.6, col);
      d.deco.line(sd ? 8.6 : 8.2, 5.6, 19.8, 5.6, 0.6, tint(col, -0.25));
    } else if (C.head === 'glasses' && sd) {
      d.deco.circ(18.8, 9.8, 1.9, col, { shiny: true });
      d.deco.line(12, 9.4, 17.2, 9.6, 0.5, '#5a6a8a');
    }
  }

  // ------------------------------------------------------------ profil (vers la droite)
  function side(d, ph, C) {
    const s = SWING[ph], legCol = longLegs(C) ? C.bottomCol : C.skin, hand = C.glove || C.skin;
    if (C.bag) { d.rect(5.6, 15, 4.4, 8, C.bagCol, { round: 0.3, far: true }); d.deco.rect(5.8, 17.6, 3.6, 2.6, tint(C.bagCol, -0.2)); }   // le sac, dans le dos
    if (C.style === 'long') d.blob([[7.6, 6], [13, 6], [12.6, 21.6], [7.8, 21.6]], C.hair, { far: true });
    // jambe et bras éloignés
    d.tube([[14, 25], [14 - 3 * s, 31.6]], 3.6, 3.1, legCol, { far: true });
    if (!longLegs(C)) d.deco.rect(12.6 - 3 * s, 30.2, 3, 1.3, SOCK);
    shoe(d, 15 - 3 * s, 33, C, { far: true });
    d.tube([[15.2, 16.4], [15.2 + 1.2 * s, 20.2], [15.2 + 2.4 * s, 23.4]], 2.7, 2.3, C.skin, { far: true });
    d.circ(15.2 + 2.4 * s, 24, 1.5, hand, { far: true });
    // corps
    bottoms(d, C, 14, 9.8, false);
    d.tube([[14, 25], [14 + 3 * s, 31.6]], 3.6, 3.1, legCol);
    if (!longLegs(C)) d.deco.rect(12.6 + 3 * s, 30.2, 3, 1.3, SOCK);
    shoe(d, 15 + 3 * s, 33, C);
    d.blob([[9, 14.8], [19, 14.8], [19.4, 22.6], [8.6, 22.6]], C.shirt);
    d.deco.line(10.4, 21, 12.6, 21.6, 0.5, tint(C.shirt, -0.22));
    if (C.deco === 'star' || C.deco === 'heart') d.deco.ell(17.4, 18.2, 1.2, 1.5, C.decoCol, 0, { unlit: true });
    else if (C.deco === 'stripe') d.deco.rect(9, 18, 10.2, 1.5, C.decoCol);
    else if (C.deco === 'collar') d.deco.poly([[15.6, 14.6], [18.4, 14.6], [17.8, 17]], C.decoCol, { unlit: true });
    if (C.bag) d.deco.line(12.2, 15, 11.6, 21, 1, C.bagCol);   // bretelle
    if (C.hoodie) { d.deco.poly([[9.4, 14.6], [12.6, 14.6], [12, 17.4], [9.6, 16.6]], tint(C.shirt, -0.15)); d.deco.rect(13, 18.8, 5.6, 2.4, tint(C.shirt, -0.12)); d.deco.rect(8.8, 21.5, 10.6, 1.1, tint(C.shirt, -0.3)); }
    if (C.jacket) { d.deco.poly([[17.4, 14.8], [19, 14.8], [19.4, 21.4], [17.8, 21.4]], C.tee || '#f6f4ee'); d.deco.line(17.4, 14.9, 17.8, 21.4, 0.6, tint(C.shirt, -0.28)); d.deco.rect(8.8, 21.5, 10.6, 1.1, tint(C.shirt, -0.28)); }
    d.tube([[13, 16.6], [13 - 1.2 * s, 20.4], [13 - 2.4 * s, 23.6]], 3, 2.5, C.skin);
    d.tube([[13, 15.6], [13 - 0.5 * s, 18.6]], 3.4, 3, C.sleeve);
    d.deco.line(11.2 - 0.5 * s, 18.8, 14.8 - 0.5 * s, 18.8, 0.6, tint(C.sleeve, -0.3));
    d.circ(13 - 2.4 * s, 24.2, 1.6, hand);
    if (C.glove) d.deco.rect(13 - 2.4 * s - 1.7, 22.6, 3.4, 0.9, tint(C.glove, -0.15));
    // tête de profil
    d.rect(13, 13, 3, 2.4, C.skin, { round: 0.3 });
    d.ell(14.6, 8.6, 6, 6.2, C.skin);
    d.deco.ell(16.2, 10.3, 4, 4.1, tint(C.skin, 0.03), 0, { unlit: true });   // visage net
    d.ell(20.4, 10.2, 1.2, 1, C.skin, 0, { noline: true });
    d.ell(12.8, 9.8, 1.2, 1.6, tint(C.skin, -0.05));
    const iris = C.eye || '#5a3a20';
    d.deco.ell(17.8, 9.8, 1.15, 1.8, WHITE, 0, { unlit: true });
    d.deco.ell(18.3, 10.1, 0.8, 1.4, iris, 0, { unlit: true });
    d.deco.ell(18.3, 9.5, 0.8, 0.6, tint(iris, -0.4), 0, { unlit: true });
    d.deco.ell(18.4, 10.3, 0.4, 0.75, '#140a04', 0, { unlit: true });
    d.deco.rect(17.7, 8.9, 0.7, 0.7, WHITE, { unlit: true });
    d.deco.line(16.6, 8.2, 19.2, 8, 0.7, tint(C.hair, -0.5), { unlit: true });
    if (C.fem) d.deco.line(19, 8.1, 19.8, 7.5, 0.5, tint(C.hair, -0.5), { unlit: true });
    d.deco.line(16.6, 7, 19.2, 6.8, 0.6, tint(C.hair, -0.25));
    d.deco.line(18, 13, 19.4, 12.8, 0.6, MOUTH, { unlit: true });
    d.deco.ell(16.2, 12, 0.9, 0.5, BLUSH);
    if (C.style === 'spiky') {
      d.poly([[9.4, 13], [7.4, 9], [4.2, 7.6], [7, 5.2], [6, 1.4], [10.4, 2.6], [12.6, 0.2], [15.2, 2.4], [18, 0.8], [19, 3.8], [21.6, 5.2], [18.4, 6], [15.8, 6.6], [13.4, 7.8], [12.6, 12.6]], C.hair);
      d.deco.line(8.6, 4, 11.4, 6.8, 0.8, C.hairL); d.deco.line(13.6, 2.6, 15, 4.6, 0.7, C.hairL);
    } else {
      const low = C.style === 'short' ? 13 : 14.6;
      d.poly([[9.2, low], [8.4, 6], [10.6, 2.4], [15, 1.6], [19.2, 3.2], [20.6, 6.6], [17.4, 6], [15, 7.2], [13.4, 7.6], [12.8, low]], C.hair);
      lock(d, C.hair, 17.4, 20.4, 19.6, 8.8, 6.2);                                                     // frange
      if (C.style === 'long') lock(d, C.hair, 9, 12.6, 10.4, 20.4, 14);
      d.deco.line(10.6, 3.6, 13.2, 6.2, 0.8, C.hairL); d.deco.line(12.6, 3, 14.6, 4.6, 0.6, C.hairL);
      d.deco.line(11.4, 6, 11.8, low - 0.8, 0.5, tint(C.hair, -0.42));
      shine(d, C, 14.4, 6.6, 5.4, 4.4, -2.4, -0.9);
    }
    if (C.fem && !C.head && C.style !== 'spiky') d.deco.circ(10.2, 9.6, 0.9, C.crestCol || '#ffd040', { unlit: true });
    hat(d, C, 'side');
  }

  // ------------------------------------------------------------ trois-quarts (diagonales, vers la droite)
  // même dessin que la face / le dos, mais tourné : tête et visage décalés vers la droite, bras et jambe
  // du fond en retrait, une seule oreille visible, foulée en diagonale
  // d décalé de dx (réutilise les pièces de face : cheveux, chapeau, décor du tee-shirt)
  function shifted(d, dx) {
    const X = p => p.map(([x, y]) => [x + dx, y]);
    const wrap = k => ({
      ell: (x, ...a) => k.ell(x + dx, ...a), circ: (x, ...a) => k.circ(x + dx, ...a), rect: (x, ...a) => k.rect(x + dx, ...a),
      poly: (p, ...a) => k.poly(X(p), ...a), blob: (p, ...a) => k.blob(X(p), ...a), curve: (p, ...a) => k.curve(X(p), ...a), tube: (p, ...a) => k.tube(X(p), ...a),
      line: (x1, y1, x2, y2, ...a) => k.line(x1 + dx, y1, x2 + dx, y2, ...a),
    });
    const o = wrap(d); o.deco = wrap(d.deco); o.eye = (x, ...a) => d.eye(x + dx, ...a);
    return o;
  }
  function threeQuarter(d, ph, back, C) {
    const s = SWING[ph], legCol = longLegs(C) ? C.bottomCol : C.skin, hand = C.glove || C.skin;
    if (C.bag && back) { d.rect(9.4, 15.2, 9.2, 7.6, C.bagCol, { round: 0.25 }); }
    if (C.style === 'long' && !back) shifted(d, -1.4).blob([[6.6, 8], [21.4, 8], [22.2, 21], [5.8, 21]], C.hair, { far: true });
    // jambes : foulée en diagonale (celle du fond en retrait)
    const lift = k => (s === k ? 1.6 : 0);
    for (const [x, k, far] of [[11.8, 1, true], [16.6, -1, false]]) {
      const o = far ? { far: true } : {}, sx = x + (far ? -1 : 1) * s * 0.9;
      d.tube([[x, 25], [sx, 31.6 - lift(k)]], 3.6, 3.1, legCol, o);
      if (!longLegs(C)) d.deco.rect(sx - 1.5, 30.2 - lift(k), 3, 1.3, SOCK);
      shoe(d, sx + 0.6, 33 - lift(k), C, o);
    }
    bottoms(d, C, 14.4, 10.4, !back);
    // bras du fond (à gauche, à moitié caché), torse, bras de devant
    d.tube([[9.4, 16], [8.8, 20.4 + s * 0.6], [9 , 23.4 + s]], 2.6, 2.2, C.skin, { far: true });
    d.circ(9, 24 + s, 1.45, hand, { far: true });
    d.blob([[9, 14.8], [19.4, 14.8], [19.8, 22.6], [8.6, 22.6]], C.shirt);
    if (!back) {
      const t = shifted(d, 1.4);
      if (C.deco === 'star') { const pts = []; for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 1.1 : 2.4; pts.push([14 + Math.cos(a) * r, 18.4 + Math.sin(a) * r]); } t.deco.poly(pts, C.decoCol, { unlit: true }); }
      else if (C.deco === 'collar') t.deco.poly([[11.6, 14.6], [16.4, 14.6], [14, 17.6]], C.decoCol, { unlit: true });
      if (C.jacket) {
        const T = C.tee || '#f6f4ee', D = tint(C.shirt, -0.28);
        t.deco.poly([[12.4, 14.8], [16, 14.8], [16.4, 21.4], [12, 21.4]], T); t.deco.line(12.4, 14.9, 12, 21.4, 0.7, D); t.deco.line(16, 14.9, 16.4, 21.4, 0.7, D);
        t.deco.circ(14.2, 18.7, 1.1, C.crestCol, { unlit: true }); t.deco.circ(14.2, 18.7, 0.6, T, { unlit: true }); d.deco.rect(8.6, 21.5, 11.2, 1.1, D);
      }
      else if (C.deco === 'stripe') d.deco.rect(9, 18, 10.8, 1.5, C.decoCol);
      else if (C.deco === 'heart') { t.deco.circ(13.3, 17.6, 0.9, C.decoCol); t.deco.circ(14.7, 17.6, 0.9, C.decoCol); t.deco.poly([[12.4, 17.9], [15.6, 17.9], [14, 19.6]], C.decoCol); }
    } else d.deco.line(13.2, 15.6, 13.2, 21.6, 0.5, tint(C.shirt, -0.2));
    d.tube([[19.2, 16], [19.9, 20.4 - s * 0.6], [19.6, 23.6 - s]], 2.8, 2.3, C.skin);
    d.tube([[19.2, 15.6], [19.8, 18.4]], 3.2, 2.9, C.sleeve);
    d.deco.line(17.6, 18.6, 21.2, 18.6, 0.6, tint(C.sleeve, -0.3));
    d.circ(19.8, 24.1 - s, 1.55, hand);
    if (C.glove) d.deco.rect(18.1, 22.6 - s, 3.4, 0.9, tint(C.glove, -0.15));
    // cou et tête (oreille du côté opposé au regard)
    d.rect(12.8, 13, 2.8, 2.4, C.skin, { round: 0.3 });
    if (!back) d.ell(8.4, 9.8, 1.2, 1.6, C.skin); else d.ell(20.2, 9.8, 1.2, 1.6, C.skin);
    d.ell(14.4, 8.6, 6.2, 6.2, C.skin);
    if (!back) {
      d.deco.ell(14.8, 10.3, 5, 4.3, tint(C.skin, 0.03), 0, { unlit: true });   // visage net
      eye(d, C, 12.6, 1.05, -1); eye(d, C, 17.4, 1.3, 1);
      if (C.head === 'glasses') { d.deco.circ(12.6, 9.9, 1.8, C.headCol, { shiny: true }); d.deco.circ(17.4, 9.9, 2.1, C.headCol, { shiny: true }); d.deco.line(14.4, 9.6, 15.3, 9.6, 0.5, '#5a6a8a'); }
      d.deco.ell(15.6, 11.6, 0.6, 0.45, tint(C.skin, -0.18));
      d.deco.line(14.6, 13, 16.4, 13, 0.6, MOUTH, { unlit: true });
      d.deco.ell(11.4, 12, 0.8, 0.5, BLUSH); d.deco.ell(18.8, 12, 1, 0.55, BLUSH);
      hairFront(shifted(d, 0.6), C);
    } else hairBack(shifted(d, -0.6), C);
    hat(shifted(d, back ? -0.6 : 0.6), C, back ? 'back' : 'front');
  }

  // ------------------------------------------------------------ cache
  // directions : down, up, right, left, et diagonales downright, upright, downleft, upleft
  const cache = {};
  DW.Sprites.hero = (dir, frame = 0, id) => {
    const look = DW.heroLook(id), key = look.name + dir + frame;
    if (cache[key]) return cache[key];
    const ph = frame % 4;
    let spr;
    if (dir.endsWith('left')) {   // gauche = miroir de la droite (profil et trois-quarts)
      const r = DW.Sprites.hero(dir.replace('left', 'right'), frame, id);
      const cv = Art.canvas(r.img.width, r.img.height), x = cv.getContext('2d');
      x.translate(cv.width, 0); x.scale(-1, 1); Art.drawRaw(x, r.img, 0, 0);
      cv._k = r.img._k;   // (haute définition conservée)
      spr = { img: cv, w: r.w, h: r.h };
    } else {
      const draw = dir === 'right' ? d => side(d, ph, look) : dir === 'downright' ? d => threeQuarter(d, ph, false, look)
        : dir === 'upright' ? d => threeQuarter(d, ph, true, look) : d => front(d, ph, dir === 'up', look);
      spr = Art.render(draw, HW, HH, { silhouettes: false, dither: 0.05 });
    }
    return (cache[key] = spr);
  };
  // portrait en pied, de face, rendu k fois plus fin (menu, fiche du DigiSélectionné)
})();
