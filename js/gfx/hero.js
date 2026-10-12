'use strict';
// =====================================================================
//  HÉROS : rendu en volume (24x30), 4 directions × 4 temps de marche
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
  DW.heroLook = id => DW.HEROES[id || (DW.state && DW.state.hero)] || DW.HEROES.tai;

  const SWING = [0, 1, 0, -1];
  // teinte plus sombre (k<0) ou plus claire (k>0) d'une couleur #rrggbb
  const tint = (col, k) => '#' + Art.mix(Art.hex(col), k < 0 ? [0, 0, 0] : [255, 255, 255], Math.abs(k)).map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
  const EYE = '#2a1a10', SOLE = '#f4f0e8', BLUSH = '#ff9a8a', MOUTH = '#b0603a';

  // ------------------------------------------------------------ face / dos
  function front(d, ph, back, C) {
    const s = SWING[ph], lift = k => (s === k ? 1.6 : 0);
    const legCol = C.bottom === 'pants' ? C.bottomCol : C.skin;
    // cheveux longs : derrière les épaules
    if (C.style === 'long' && !back) d.blob([[5.2, 8], [18.8, 8], [19.6, 18.4], [4.4, 18.4]], C.hair, { far: true });
    // jambes et chaussures
    d.tube([[10, 21], [10, 26.5 - lift(1)]], 3.2, 3, legCol);
    d.tube([[14, 21], [14, 26.5 - lift(-1)]], 3.2, 3, legCol);
    d.ell(10, 27.6 - lift(1), 2.4, 1.5, C.shoe); d.ell(14, 27.6 - lift(-1), 2.4, 1.5, C.shoe);
    d.deco.rect(8, 28.2 - lift(1), 4, 0.8, SOLE); d.deco.rect(12, 28.2 - lift(-1), 4, 0.8, SOLE);
    // bas du corps
    if (C.bottom === 'skirt') d.poly([[7.6, 18.4], [16.4, 18.4], [18, 23.4], [6, 23.4]], C.bottomCol);
    else {
      d.rect(7.6, 18.6, 8.8, 4, C.bottomCol, { round: 0.5 });
      d.deco.line(12, 20, 12, 22.4, 0.6, tint(C.bottomCol, -0.3));
    }
    // bras (derrière le torse)
    const ay = s * 0.8, hand = C.glove || C.skin;
    d.tube([[6.4, 15], [5.6, 20 + ay]], 2.6, 2.2, C.skin, { far: back });
    d.tube([[17.6, 15], [18.4, 20 - ay]], 2.6, 2.2, C.skin, { far: back });
    d.circ(5.6, 20.6 + ay, 1.7, hand); d.circ(18.4, 20.6 - ay, 1.7, hand);
    // torse
    d.blob([[7, 13], [17, 13], [17.4, 20], [6.6, 20]], C.shirt);
    d.ell(6.8, 14.4, 2, 1.8, C.sleeve); d.ell(17.2, 14.4, 2, 1.8, C.sleeve);
    if (!back) {
      if (C.deco === 'star') {
        d.deco.poly([[12, 14.2], [12.8, 15.8], [14.4, 16], [13.2, 17], [13.6, 18.6], [12, 17.8], [10.4, 18.6], [10.8, 17], [9.6, 16], [11.2, 15.8]], C.decoCol, { unlit: true });
        d.deco.rect(10.4, 12.8, 3.2, 1, SOLE);
      } else if (C.deco === 'collar') d.deco.poly([[9.4, 12.8], [14.6, 12.8], [12, 15.6]], C.decoCol, { unlit: true });
      else if (C.deco === 'stripe') d.deco.rect(7, 16, 10.2, 1.4, C.decoCol);
      else if (C.deco === 'heart') { d.deco.circ(11.3, 15.6, 0.9, C.decoCol); d.deco.circ(12.7, 15.6, 0.9, C.decoCol); d.deco.poly([[10.4, 15.9], [13.6, 15.9], [12, 17.6]], C.decoCol); }
    } else if (C.style === 'long') d.blob([[5.4, 8], [18.6, 8], [19.2, 18.6], [4.8, 18.6]], C.hair);
    // tête
    d.ell(12, 8.6, 5.8, 5.4, C.skin);
    if (!back) {
      if (C.head === 'glasses') { d.deco.circ(10, 9.8, 1.8, C.headCol, { shiny: true }); d.deco.circ(14, 9.8, 1.8, C.headCol, { shiny: true }); d.deco.line(11.8, 9.6, 12.2, 9.6, 0.5, '#5a6a8a'); }
      d.deco.ell(10, 10, 0.75, 1.2, EYE, 0, { unlit: true }); d.deco.ell(14, 10, 0.75, 1.2, EYE, 0, { unlit: true });
      d.deco.rect(9.7, 9.1, 0.6, 0.5, '#ffffff', { unlit: true }); d.deco.rect(13.7, 9.1, 0.6, 0.5, '#ffffff', { unlit: true });
      d.deco.line(11.3, 12.4, 12.7, 12.4, 0.6, MOUTH, { unlit: true });
      d.deco.ell(8.8, 11.6, 0.9, 0.5, BLUSH); d.deco.ell(15.2, 11.6, 0.9, 0.5, BLUSH);
      hairFront(d, C);
    } else hairBack(d, C);
    hat(d, C, back ? 'back' : 'front');
  }

  function hairFront(d, C) {
    if (C.style === 'spiky') {
      d.poly([[5.4, 10], [3.6, 5], [6.4, 5.6], [5.6, 1.6], [9.4, 3.4], [11, 0.4], [13.6, 2.8], [16.6, 0.8], [17.4, 4.4], [20.4, 4], [18.6, 10], [17.2, 7.2], [14, 6.4], [12, 7.4], [10, 6.4], [6.8, 7.2]], C.hair);
      d.deco.line(8, 3.6, 10, 5, 0.7, C.hairL); d.deco.line(14, 3, 15.4, 4.8, 0.7, C.hairL);
    } else if (C.style === 'short') {
      d.poly([[6, 9.6], [5.6, 5], [8, 2.4], [12, 1.6], [16, 2.4], [18.4, 5], [18, 9.6], [16.8, 6.8], [14.4, 7.4], [12, 6], [9.6, 7.4], [7.2, 6.8]], C.hair);
      d.deco.line(9, 3.4, 11, 4.6, 0.7, C.hairL);
    } else {
      // carré (bob) ou cheveux longs : mèches qui encadrent le visage
      d.poly([[5.4, 13], [5.2, 5], [8, 2.2], [12, 1.6], [16, 2.2], [18.8, 5], [18.6, 13], [16.9, 11.6], [16.8, 7], [13.4, 6.6], [12, 5.6], [10.6, 6.6], [7.2, 7], [7.1, 11.6]], C.hair);
      d.deco.line(8.4, 3.4, 10.6, 4.6, 0.7, C.hairL); d.deco.line(14, 3, 16, 4.4, 0.7, C.hairL);
    }
  }
  function hairBack(d, C) {
    if (C.style === 'spiky') {
      d.poly([[5.6, 12.4], [3.6, 7], [5.4, 3], [8.4, 2.2], [11, 0.4], [14, 2], [17, 1], [19, 4], [20.4, 7.4], [18.4, 12.4], [15, 13.6], [9, 13.6]], C.hair);
      d.deco.line(6.6, 4, 9, 9, 0.7, C.hairL); d.deco.line(13, 3, 14, 10, 0.7, C.hairL); d.deco.line(17.6, 5, 16, 11, 0.7, C.hairL);
    } else {
      const low = C.style === 'short' ? 12.4 : 13.6;
      d.poly([[6, low], [5.2, 6], [7.6, 2.4], [12, 1.6], [16.4, 2.4], [18.8, 6], [18, low], [12, low + 1]], C.hair);
      d.deco.line(9, 3.6, 10, 10, 0.7, C.hairL); d.deco.line(15, 3.6, 14, 10, 0.7, C.hairL);
    }
  }
  // couvre-chef (vue : front | back | side)
  function hat(d, C, v) {
    const col = C.headCol, sd = v === 'side';
    if (C.head === 'goggles') {
      if (v === 'front') {
        d.deco.line(5.6, 6.8, 18.4, 6.8, 1.1, col);
        d.deco.circ(9.6, 6.6, 1.7, '#4aa8f0', { shiny: true }); d.deco.circ(14.4, 6.6, 1.7, '#4aa8f0', { shiny: true });
        d.deco.rect(9, 5.8, 0.7, 0.6, '#ffffff', { unlit: true }); d.deco.rect(13.8, 5.8, 0.7, 0.6, '#ffffff', { unlit: true });
      } else if (v === 'back') d.deco.line(4.6, 7, 19.4, 7, 1.2, col);
      else {
        d.deco.line(8, 6.4, 18, 6, 1.1, col);
        d.deco.circ(16.6, 6.2, 1.7, '#4aa8f0', { shiny: true });
        d.deco.rect(16, 5.4, 0.7, 0.6, '#ffffff', { unlit: true });
      }
    } else if (C.head === 'cap') {
      d.ell(sd ? 12 : 12, 4.4, sd ? 6 : 6.6, 3.6, col);
      if (v === 'front') d.ell(12, 6.4, 6.8, 1.2, col);
      if (sd) d.ell(17.2, 6.2, 3, 1, col);
      d.deco.line(sd ? 8 : 7, 5.6, sd ? 17 : 17, 5.6, 0.6, tint(col, 0.35));
    } else if (C.head === 'cowboy') {
      d.ell(sd ? 12.6 : 12, 5.6, sd ? 8.6 : 9.2, 1.8, col);
      d.ell(sd ? 12.4 : 12, 3.2, 4.8, 3, col);
      d.deco.line(sd ? 8 : 7.4, 4.8, sd ? 16.8 : 16.6, 4.8, 0.9, '#ffffff');
    } else if (C.head === 'bucket') {
      d.ell(12, 6.4, sd ? 7.4 : 7.8, 1.8, col);
      d.ell(12, 4, 6, 3.4, col);
      d.deco.line(sd ? 7 : 6.6, 5.4, 17.4, 5.4, 0.6, tint(col, -0.25));
    } else if (C.head === 'glasses' && sd) {
      d.deco.circ(16.4, 9.6, 1.6, col, { shiny: true });
      d.deco.line(10, 9.2, 15, 9.4, 0.5, '#5a6a8a');
    }
  }

  // ------------------------------------------------------------ profil
  function side(d, ph, C) {
    const s = SWING[ph], legCol = C.bottom === 'pants' ? C.bottomCol : C.skin, hand = C.glove || C.skin;
    if (C.style === 'long') d.blob([[6, 6], [11, 6], [10.6, 19], [6.2, 19]], C.hair, { far: true });
    // jambe et bras éloignés
    d.tube([[12, 21], [12 - 2.6 * s, 26.6]], 3.2, 3, legCol, { far: true });
    d.ell(12.8 - 2.6 * s, 27.6, 2.6, 1.5, C.shoe, 0, { far: true });
    d.tube([[12, 14.6], [12 + 2.4 * s, 19.6]], 2.4, 2.2, C.skin, { far: true });
    d.circ(12 + 2.4 * s, 20.2, 1.6, hand, { far: true });
    // corps
    if (C.bottom === 'skirt') d.poly([[8.4, 18.4], [16, 18.4], [17.6, 23.4], [7, 23.4]], C.bottomCol);
    else d.rect(8.4, 18.6, 7.6, 4, C.bottomCol, { round: 0.5 });
    d.tube([[12, 21], [12 + 2.6 * s, 26.6]], 3.2, 3, legCol);
    d.ell(12.8 + 2.6 * s, 27.6, 2.6, 1.5, C.shoe);
    d.deco.rect(10.4 + 2.6 * s, 28.2, 5, 0.8, SOLE);
    d.blob([[8.6, 13], [15.4, 13], [16, 20], [8.2, 20]], C.shirt);
    if (C.deco === 'star' || C.deco === 'heart') d.deco.ell(14.8, 16.4, 1.2, 1.4, C.decoCol, 0, { unlit: true });
    else if (C.deco === 'stripe') d.deco.rect(8.6, 16, 7.2, 1.4, C.decoCol);
    else if (C.deco === 'collar') d.deco.poly([[13, 12.8], [15.6, 12.8], [15, 15]], C.decoCol, { unlit: true });
    d.ell(12, 14.6, 2.2, 1.9, C.sleeve);
    d.tube([[12, 15], [12 - 2.4 * s, 19.8]], 2.6, 2.2, C.skin);
    d.circ(12 - 2.4 * s, 20.4, 1.7, hand);
    // tête de profil
    d.ell(12.6, 8.6, 5.4, 5.4, C.skin);
    d.ell(17.4, 10, 1.2, 1, C.skin, 0, { noline: true });
    d.deco.ell(15.4, 9.8, 0.7, 1.2, EYE, 0, { unlit: true });
    d.deco.rect(15.2, 8.9, 0.5, 0.5, '#ffffff', { unlit: true });
    d.deco.line(15.4, 12.6, 16.6, 12.4, 0.6, MOUTH, { unlit: true });
    d.deco.ell(14, 11.6, 0.8, 0.5, BLUSH);
    if (C.style === 'spiky') {
      d.poly([[7.4, 12], [5.6, 8.4], [2.6, 7], [5.4, 5], [4.4, 1.6], [8.4, 2.6], [10.6, 0.4], [13, 2.4], [15.6, 1], [16.6, 3.8], [19, 5], [16, 5.8], [13.6, 6.4], [11.4, 7.6], [10.6, 11.6]], C.hair);
      d.deco.line(7, 4, 9.6, 6.6, 0.7, C.hairL);
    } else {
      const low = C.style === 'short' ? 12 : 13.6;
      d.poly([[7.4, low], [6.6, 6], [8.6, 2.6], [12.6, 1.8], [16.6, 3.2], [18, 6.4], [15, 5.8], [12.6, 7], [11.2, 7.4], [10.8, low]], C.hair);
      d.deco.line(8.6, 3.6, 11, 6, 0.7, C.hairL);
    }
    hat(d, C, 'side');
  }

  // ------------------------------------------------------------ cache
  const cache = {};
  DW.Sprites.hero = (dir, frame = 0, id) => {
    const look = DW.heroLook(id), key = look.name + dir + frame;
    if (cache[key]) return cache[key];
    const ph = frame % 4;
    let spr;
    if (dir === 'left') {
      const r = DW.Sprites.hero('right', frame, id);
      const cv = Art.canvas(r.w, r.h), x = cv.getContext('2d');
      x.translate(r.w, 0); x.scale(-1, 1); x.drawImage(r.img, 0, 0);
      spr = { img: cv, w: r.w, h: r.h };
    } else {
      const draw = dir === 'right' ? d => side(d, ph, look) : d => front(d, ph, dir === 'up', look);
      spr = Art.render(draw, 24, 30, { silhouettes: false, dither: 0.05 });
    }
    return (cache[key] = spr);
  };
})();
