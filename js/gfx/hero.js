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
      skin: '#f4bc8a', hair: '#c8582a', hairL: '#e8804a', style: 'bob', head: 'cap', headCol: '#3a78d8',
      shirt: '#f0c838', sleeve: '#e0b020', deco: 'collar', decoCol: '#f8f0d0', bottom: 'pants', bottomCol: '#4a6aa8', shoe: '#f0eee8', glove: '#f6f6f2' },
    matt: { name: 'Matt', crest: 'Amitié', crestCol: '#3a8ae8', desc: 'Calme et solitaire, il protège son petit frère coûte que coûte.',
      skin: '#f8c898', hair: '#f0d060', hairL: '#fff0a0', style: 'short', head: '',
      shirt: '#3a9a4a', sleeve: '#f0ead0', deco: 'collar', decoCol: '#f0ead0', bottom: 'pants', bottomCol: '#3a5a9a', shoe: '#7a5a3a', glove: null },
    mimi: { name: 'Mimi', crest: 'Pureté', crestCol: '#40b040', desc: 'Rêveuse et sincère, elle a un cœur immense.',
      skin: '#f8cc9c', hair: '#f0a0c0', hairL: '#ffd0e0', style: 'long', head: 'cowboy', headCol: '#f070a8',
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
    skin: '#f6c08c', hair: '#5a3a24', hairL: '#7a5a3a', style: 'short', head: '', headCol: '#e04a3a',
    shirt: '#e8582a', sleeve: '#d84a20', deco: 'stripe', decoCol: '#ffffff', bottom: 'shorts', bottomCol: '#3a5a9a', shoe: '#3a3a4a', glove: null };
  // choix proposés à la création
  DW.LOOK_OPTS = {
    style: [['Garçon (court)', { style: 'short', bottom: 'shorts' }], ['Garçon (en bataille)', { style: 'spiky', bottom: 'pants' }], ['Fille (carré)', { style: 'bob', bottom: 'skirt' }], ['Fille (longs)', { style: 'long', bottom: 'pants' }]],
    gender: ['Garçon', 'Fille'],
    // allures proposées selon le genre choisi
    styles: [
      [['Cheveux courts, short', { style: 'short', bottom: 'shorts' }], ['Cheveux courts, pantalon', { style: 'short', bottom: 'pants' }], ['En bataille, short', { style: 'spiky', bottom: 'shorts' }], ['En bataille, pantalon', { style: 'spiky', bottom: 'pants' }]],
      [['Carré, jupe', { style: 'bob', bottom: 'skirt' }], ['Carré, pantalon', { style: 'bob', bottom: 'pants' }], ['Cheveux longs, jupe', { style: 'long', bottom: 'skirt' }], ['Cheveux longs, pantalon', { style: 'long', bottom: 'pants' }]],
    ],
    hair: [['Châtain', ['#5a3a24', '#7a5a3a']], ['Noir', ['#22222c', '#3a3a48']], ['Blond', ['#e8c060', '#fff0a0']], ['Roux', ['#c8582a', '#e8804a']], ['Bleu nuit', ['#2a3a7a', '#4a5aa8']], ['Rose', ['#e07aa8', '#ffb0d0']]],
    shirt: [['Rouge', '#e04a3a'], ['Orange', '#e8822a'], ['Vert', '#3a9a5a'], ['Bleu', '#2f6ad8'], ['Violet', '#8a4ac8'], ['Turquoise', '#2aa8a8'], ['Blanc', '#f0f0ec']],
    head: [['Rien', ''], ['Casquette', 'cap'], ['Lunettes de plongée', 'goggles'], ['Bob', 'bucket'], ['Lunettes', 'glasses']],
  };
  const lookOf = L => {
    const S = DW.LOOK_OPTS, b = DW.HEROES.perso, o = { ...b };
    if (!L) return o;
    Object.assign(o, L.gender != null ? S.styles[L.gender][L.style || 0][1] : S.style[L.style || 0][1]);   // (anciennes parties : sans genre)
    const [h, hl] = S.hair[L.hair || 0][1]; o.hair = h; o.hairL = hl;
    const sh = S.shirt[L.shirt || 0][1]; o.shirt = sh; o.sleeve = sh; o.crestCol = sh === '#f0f0ec' ? '#5adcc8' : sh;
    o.head = S.head[L.head || 0][1]; o.headCol = sh === '#f0f0ec' ? '#e04a3a' : '#f0f0ec';
    o.bottomCol = o.bottom === 'skirt' ? '#3a5a9a' : o.bottom === 'pants' ? '#4a5a7a' : '#3a5a9a';
    o.name = 'perso' + [L.gender, L.style, L.hair, L.shirt, L.head].join('-');   // (clé du cache des sprites)
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
  function shoe(d, x, y, C, o = {}) {
    d.ell(x, y, 2.9, 1.9, C.shoe, 0, o);
    d.deco.rect(x - 2.9, y + 0.7, 5.8, 1, SOLE);
    d.deco.line(x - 1.2, y - 1, x + 1.2, y - 1, 0.6, tint(C.shoe, 0.45));
  }
  function bottoms(d, C, cx, w, front) {
    const x0 = cx - w / 2;
    if (C.bottom === 'skirt') {
      d.poly([[x0, 21.8], [x0 + w, 21.8], [x0 + w + 2, 27.6], [x0 - 2, 27.6]], C.bottomCol);
      for (let k = 1; k < 4; k++) d.deco.line(x0 - 1 + k * (w + 2) / 4, 22.6, x0 - 2 + k * (w + 4) / 4, 27.4, 0.5, tint(C.bottomCol, -0.25));
      return;
    }
    d.rect(x0, 21.8, w, C.bottom === 'pants' ? 4.6 : 5.2, C.bottomCol, { round: 0.4 });
    if (front) {
      d.deco.line(cx, 23.4, cx, 26.6, 0.6, tint(C.bottomCol, -0.3));
      if (C.bottom === 'shorts') { d.deco.line(x0 + 1, 23, x0 + 2.6, 24.6, 0.5, tint(C.bottomCol, -0.25)); d.deco.line(x0 + w - 1, 23, x0 + w - 2.6, 24.6, 0.5, tint(C.bottomCol, -0.25)); }
    }
    // ceinture et boucle
    d.deco.rect(x0, 21.6, w, 1.2, tint(C.bottomCol, -0.45));
    if (front) d.deco.rect(cx - 1, 21.5, 2, 1.4, '#e8c860');
  }
  function legsFront(d, C, s) {
    const lift = k => (s === k ? 1.8 : 0), legCol = C.bottom === 'pants' ? C.bottomCol : C.skin;
    for (const [x, k] of [[11.4, 1], [16.6, -1]]) {
      d.tube([[x, 25], [x, 31.6 - lift(k)]], 3.6, 3.1, legCol);
      if (C.bottom !== 'pants') d.deco.rect(x - 1.5, 30.2 - lift(k), 3, 1.3, SOCK);
      else d.deco.rect(x - 1.7, 30.4 - lift(k), 3.4, 0.8, tint(C.bottomCol, -0.3));
      shoe(d, x, 33 - lift(k), C);
    }
  }
  function armFront(d, C, sx, ay, far, sleeveCol) {
    const hand = C.glove || C.skin, dir = sx < 14 ? -1 : 1, o = far ? { far: true } : {};
    d.tube([[sx, 16], [sx + dir * 0.9, 20.4 + ay * 0.5], [sx + dir * 0.6, 23.6 + ay]], 2.8, 2.3, C.skin, o);
    d.tube([[sx, 15.6], [sx + dir * 0.7, 18.6]], 3.6, 3.2, sleeveCol, o);
    d.deco.line(sx - 1.6, 18.6, sx + 1.8, 18.6, 0.6, tint(sleeveCol, -0.3));
    d.circ(sx + dir * 0.6, 24.4 + ay, 1.95, hand, o);
    if (C.glove) d.deco.rect(sx + dir * 0.6 - 1.7, 22.6 + ay, 3.4, 0.9, tint(C.glove, -0.15));
  }
  function torsoFront(d, C, back) {
    d.blob([[8.6, 14.8], [19.4, 14.8], [19.8, 22.6], [8.2, 22.6]], C.shirt);
    d.deco.line(10, 20.6, 12.4, 21.4, 0.5, tint(C.shirt, -0.22)); d.deco.line(18, 20.6, 15.8, 21.4, 0.5, tint(C.shirt, -0.22));
    if (back) { d.deco.line(14, 15.6, 14, 21.6, 0.5, tint(C.shirt, -0.2)); return; }
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
  function face(d, C) {
    const iris = C.eye || '#5a3a20';
    for (const x of [11.6, 16.4]) {
      d.deco.ell(x, 9.8, 1.35, 1.7, WHITE, 0, { unlit: true });
      d.deco.ell(x + 0.15, 10.1, 0.95, 1.35, iris, 0, { unlit: true });
      d.deco.ell(x + 0.15, 10.3, 0.5, 0.7, '#1a1008', 0, { unlit: true });
      d.deco.rect(x - 0.4, 9, 0.6, 0.6, WHITE, { unlit: true });
      d.deco.line(x - 1.3, 7.6, x + 1.2, 7.3, 0.6, tint(C.hair, -0.25));
    }
    d.deco.ell(14, 11.6, 0.6, 0.45, tint(C.skin, -0.18));
    d.deco.line(13.1, 13, 14.9, 13, 0.6, MOUTH, { unlit: true });
    d.deco.ell(10.4, 12, 1, 0.55, BLUSH); d.deco.ell(17.6, 12, 1, 0.55, BLUSH);
  }

  // ------------------------------------------------------------ face / dos
  function front(d, ph, back, C) {
    const s = SWING[ph], ay = s * 1.1;
    if (C.style === 'long' && !back) d.blob([[6.6, 8], [21.4, 8], [22.2, 21], [5.8, 21]], C.hair, { far: true });
    legsFront(d, C, s);
    bottoms(d, C, 14, 11, !back);
    armFront(d, C, 8.2, ay, back, C.sleeve);
    armFront(d, C, 19.8, -ay, back, C.sleeve);
    torsoFront(d, C, back);
    if (back && C.style === 'long') d.blob([[6.8, 8], [21.2, 8], [21.8, 21.4], [6.2, 21.4]], C.hair);
    // cou et tête
    d.rect(12.6, 13, 2.8, 2.4, C.skin, { round: 0.3 });
    d.ell(7.9, 9.6, 1.2, 1.6, C.skin); d.ell(20.1, 9.6, 1.2, 1.6, C.skin);
    d.ell(14, 8.6, 6.3, 6.2, C.skin);
    if (!back) {
      if (C.head === 'glasses') { d.deco.circ(11.6, 9.9, 2.1, C.headCol, { shiny: true }); d.deco.circ(16.4, 9.9, 2.1, C.headCol, { shiny: true }); }
      face(d, C);
      if (C.head === 'glasses') d.deco.line(13.6, 9.6, 14.4, 9.6, 0.5, '#5a6a8a');
      hairFront(d, C);
    } else hairBack(d, C);
    hat(d, C, back ? 'back' : 'front');
  }

  function hairFront(d, C) {
    const L = C.hairL, D = tint(C.hair, -0.25);
    if (C.style === 'spiky') {
      d.poly([[7.2, 10.6], [5, 5.2], [8, 5.6], [7, 1.2], [11, 3], [12.8, -0.2], [15.4, 2.4], [18.8, 0.2], [19.6, 4.2], [23, 3.8], [20.8, 10.6], [19.2, 7.4], [16, 6.6], [14, 7.8], [12, 6.6], [8.8, 7.4]], C.hair);
      d.deco.line(9.4, 3.2, 11.6, 5, 0.8, L); d.deco.line(15.6, 2.6, 17, 4.6, 0.8, L); d.deco.line(13, 1.4, 13.6, 4, 0.7, L);
      d.deco.line(8.8, 7.4, 12, 6.6, 0.6, D); d.deco.line(16, 6.6, 19.2, 7.4, 0.6, D);
    } else if (C.style === 'short') {
      d.poly([[7.6, 10.4], [7.2, 5], [9.6, 2.2], [14, 1.4], [18.4, 2.2], [20.8, 5], [20.4, 10.4], [19, 7.2], [16.4, 7.8], [14, 6.2], [11.6, 7.8], [9, 7.2]], C.hair);
      d.deco.line(10.6, 3.2, 12.8, 4.8, 0.8, L); d.deco.line(15.4, 3, 17, 4.2, 0.6, L);
    } else {
      d.poly([[7, 14.4], [6.8, 5], [9.6, 2], [14, 1.4], [18.4, 2], [21.2, 5], [21, 14.4], [19.2, 12.8], [19, 7.4], [15.4, 6.8], [14, 5.8], [12.6, 6.8], [9, 7.4], [8.8, 12.8]], C.hair);
      d.deco.line(10, 3.2, 12.4, 4.8, 0.8, L); d.deco.line(15.8, 2.8, 18, 4.4, 0.8, L);
      d.deco.line(8.2, 8, 8.4, 13.4, 0.6, D); d.deco.line(19.8, 8, 19.6, 13.4, 0.6, D);
    }
  }
  function hairBack(d, C) {
    const L = C.hairL;
    if (C.style === 'spiky') {
      d.poly([[7.4, 13.4], [5, 7.4], [6.8, 3], [10.2, 2.2], [12.8, 0], [16, 1.8], [19.4, 0.8], [21.4, 4.2], [23, 7.8], [20.6, 13.4], [17, 14.6], [11, 14.6]], C.hair);
      d.deco.line(8.4, 4, 11, 9.6, 0.8, L); d.deco.line(15, 3, 16, 11, 0.8, L); d.deco.line(20, 5, 18.2, 11.6, 0.8, L);
    } else {
      const low = C.style === 'short' ? 13.4 : 14.6;
      d.poly([[7.8, low], [6.8, 6], [9.4, 2.2], [14, 1.4], [18.6, 2.2], [21.2, 6], [20.2, low], [14, low + 1]], C.hair);
      d.deco.line(10.8, 3.6, 11.8, 11, 0.8, L); d.deco.line(17.2, 3.6, 16.2, 11, 0.8, L);
    }
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
    const s = SWING[ph], legCol = C.bottom === 'pants' ? C.bottomCol : C.skin, hand = C.glove || C.skin;
    if (C.style === 'long') d.blob([[7.6, 6], [13, 6], [12.6, 21.6], [7.8, 21.6]], C.hair, { far: true });
    // jambe et bras éloignés
    d.tube([[14, 25], [14 - 3 * s, 31.6]], 3.6, 3.1, legCol, { far: true });
    if (C.bottom !== 'pants') d.deco.rect(12.6 - 3 * s, 30.2, 3, 1.3, SOCK);
    shoe(d, 15 - 3 * s, 33, C, { far: true });
    d.tube([[15.2, 16.4], [15.2 + 1.2 * s, 20.2], [15.2 + 2.4 * s, 23.4]], 2.7, 2.3, C.skin, { far: true });
    d.circ(15.2 + 2.4 * s, 24.2, 1.85, hand, { far: true });
    // corps
    bottoms(d, C, 14, 9.8, false);
    d.tube([[14, 25], [14 + 3 * s, 31.6]], 3.6, 3.1, legCol);
    if (C.bottom !== 'pants') d.deco.rect(12.6 + 3 * s, 30.2, 3, 1.3, SOCK);
    shoe(d, 15 + 3 * s, 33, C);
    d.blob([[9, 14.8], [19, 14.8], [19.4, 22.6], [8.6, 22.6]], C.shirt);
    d.deco.line(10.4, 21, 12.6, 21.6, 0.5, tint(C.shirt, -0.22));
    if (C.deco === 'star' || C.deco === 'heart') d.deco.ell(17.4, 18.2, 1.2, 1.5, C.decoCol, 0, { unlit: true });
    else if (C.deco === 'stripe') d.deco.rect(9, 18, 10.2, 1.5, C.decoCol);
    else if (C.deco === 'collar') d.deco.poly([[15.6, 14.6], [18.4, 14.6], [17.8, 17]], C.decoCol, { unlit: true });
    d.tube([[13, 16.6], [13 - 1.2 * s, 20.4], [13 - 2.4 * s, 23.6]], 3, 2.5, C.skin);
    d.tube([[13, 15.6], [13 - 0.5 * s, 18.8]], 3.9, 3.4, C.sleeve);
    d.deco.line(11.2 - 0.5 * s, 18.8, 14.8 - 0.5 * s, 18.8, 0.6, tint(C.sleeve, -0.3));
    d.circ(13 - 2.4 * s, 24.4, 2, hand);
    if (C.glove) d.deco.rect(13 - 2.4 * s - 1.7, 22.6, 3.4, 0.9, tint(C.glove, -0.15));
    // tête de profil
    d.rect(13, 13, 3, 2.4, C.skin, { round: 0.3 });
    d.ell(14.6, 8.6, 6, 6.2, C.skin);
    d.ell(20.4, 10.2, 1.2, 1, C.skin, 0, { noline: true });
    d.ell(12.8, 9.8, 1.2, 1.6, tint(C.skin, -0.05));
    const iris = C.eye || '#5a3a20';
    d.deco.ell(17.8, 9.8, 1.1, 1.7, WHITE, 0, { unlit: true });
    d.deco.ell(18.3, 10.1, 0.75, 1.3, iris, 0, { unlit: true });
    d.deco.rect(17.8, 9, 0.6, 0.6, WHITE, { unlit: true });
    d.deco.line(16.6, 7.4, 19.2, 7.2, 0.6, tint(C.hair, -0.25));
    d.deco.line(18, 13, 19.4, 12.8, 0.6, MOUTH, { unlit: true });
    d.deco.ell(16.2, 12, 0.9, 0.5, BLUSH);
    if (C.style === 'spiky') {
      d.poly([[9.4, 13], [7.4, 9], [4.2, 7.6], [7, 5.2], [6, 1.4], [10.4, 2.6], [12.6, 0.2], [15.2, 2.4], [18, 0.8], [19, 3.8], [21.6, 5.2], [18.4, 6], [15.8, 6.6], [13.4, 7.8], [12.6, 12.6]], C.hair);
      d.deco.line(8.6, 4, 11.4, 6.8, 0.8, C.hairL); d.deco.line(13.6, 2.6, 15, 4.6, 0.7, C.hairL);
    } else {
      const low = C.style === 'short' ? 13 : 14.6;
      d.poly([[9.2, low], [8.4, 6], [10.6, 2.4], [15, 1.6], [19.2, 3.2], [20.6, 6.6], [17.4, 6], [15, 7.2], [13.4, 7.6], [12.8, low]], C.hair);
      d.deco.line(10.6, 3.6, 13.2, 6.2, 0.8, C.hairL);
    }
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
    const s = SWING[ph], legCol = C.bottom === 'pants' ? C.bottomCol : C.skin, hand = C.glove || C.skin;
    if (C.style === 'long' && !back) shifted(d, -1.4).blob([[6.6, 8], [21.4, 8], [22.2, 21], [5.8, 21]], C.hair, { far: true });
    // jambes : foulée en diagonale (celle du fond en retrait)
    const lift = k => (s === k ? 1.6 : 0);
    for (const [x, k, far] of [[11.8, 1, true], [16.6, -1, false]]) {
      const o = far ? { far: true } : {}, sx = x + (far ? -1 : 1) * s * 0.9;
      d.tube([[x, 25], [sx, 31.6 - lift(k)]], 3.6, 3.1, legCol, o);
      if (C.bottom !== 'pants') d.deco.rect(sx - 1.5, 30.2 - lift(k), 3, 1.3, SOCK);
      shoe(d, sx + 0.6, 33 - lift(k), C, o);
    }
    bottoms(d, C, 14.4, 10.4, !back);
    // bras du fond (à gauche, à moitié caché), torse, bras de devant
    d.tube([[9.4, 16], [8.8, 20.4 + s * 0.6], [9 , 23.4 + s]], 2.6, 2.2, C.skin, { far: true });
    d.circ(9, 24.2 + s, 1.8, hand, { far: true });
    d.blob([[9, 14.8], [19.4, 14.8], [19.8, 22.6], [8.6, 22.6]], C.shirt);
    if (!back) {
      const t = shifted(d, 1.4);
      if (C.deco === 'star') { const pts = []; for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 1.1 : 2.4; pts.push([14 + Math.cos(a) * r, 18.4 + Math.sin(a) * r]); } t.deco.poly(pts, C.decoCol, { unlit: true }); }
      else if (C.deco === 'collar') t.deco.poly([[11.6, 14.6], [16.4, 14.6], [14, 17.6]], C.decoCol, { unlit: true });
      else if (C.deco === 'stripe') d.deco.rect(9, 18, 10.8, 1.5, C.decoCol);
      else if (C.deco === 'heart') { t.deco.circ(13.3, 17.6, 0.9, C.decoCol); t.deco.circ(14.7, 17.6, 0.9, C.decoCol); t.deco.poly([[12.4, 17.9], [15.6, 17.9], [14, 19.6]], C.decoCol); }
    } else d.deco.line(13.2, 15.6, 13.2, 21.6, 0.5, tint(C.shirt, -0.2));
    d.tube([[19.2, 16], [19.9, 20.4 - s * 0.6], [19.6, 23.6 - s]], 2.8, 2.3, C.skin);
    d.tube([[19.2, 15.6], [19.8, 18.6]], 3.6, 3.2, C.sleeve);
    d.deco.line(17.6, 18.6, 21.2, 18.6, 0.6, tint(C.sleeve, -0.3));
    d.circ(19.8, 24.4 - s, 1.95, hand);
    if (C.glove) d.deco.rect(18.1, 22.6 - s, 3.4, 0.9, tint(C.glove, -0.15));
    // cou et tête (oreille du côté opposé au regard)
    d.rect(12.8, 13, 2.8, 2.4, C.skin, { round: 0.3 });
    if (!back) d.ell(8.4, 9.8, 1.2, 1.6, C.skin); else d.ell(20.2, 9.8, 1.2, 1.6, C.skin);
    d.ell(14.4, 8.6, 6.2, 6.2, C.skin);
    if (!back) {
      const iris = C.eye || '#5a3a20';
      for (const [x, rx] of [[12.6, 1.05], [17.4, 1.35]]) {
        d.deco.ell(x, 9.8, rx, 1.7, WHITE, 0, { unlit: true });
        d.deco.ell(x + 0.35, 10.1, rx * 0.72, 1.35, iris, 0, { unlit: true });
        d.deco.ell(x + 0.35, 10.3, rx * 0.38, 0.7, '#1a1008', 0, { unlit: true });
        d.deco.rect(x - 0.3, 9, 0.6, 0.6, WHITE, { unlit: true });
        d.deco.line(x - rx, 7.6, x + rx, 7.3, 0.6, tint(C.hair, -0.25));
      }
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
      const cv = Art.canvas(r.w, r.h), x = cv.getContext('2d');
      x.translate(r.w, 0); x.scale(-1, 1); x.drawImage(r.img, 0, 0);
      spr = { img: cv, w: r.w, h: r.h };
    } else {
      const draw = dir === 'right' ? d => side(d, ph, look) : dir === 'downright' ? d => threeQuarter(d, ph, false, look)
        : dir === 'upright' ? d => threeQuarter(d, ph, true, look) : d => front(d, ph, dir === 'up', look);
      spr = Art.render(draw, HW, HH, { silhouettes: false, dither: 0.05 });
    }
    return (cache[key] = spr);
  };
  // portrait en pied, de face, rendu k fois plus fin (menu, fiche du DigiSélectionné)
  DW.Sprites.heroPortrait = (k = 3, id) => {
    const look = DW.heroLook(id), key = 'portrait' + look.name + k;
    return cache[key] || (cache[key] = Art.render(d => front(d, 0, false, look), Math.round(HW * k), Math.round(HH * k), { box: [HW, HH], silhouettes: false, dither: 0.05 }));
  };
})();
