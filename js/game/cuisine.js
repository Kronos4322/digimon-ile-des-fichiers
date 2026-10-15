'use strict';
// =====================================================================
//  CUISINE — chaque Digimon installé en ville offre un ingrédient par jour (en lui parlant),
//  et les recettes se cuisinent au Restaurant de Mushroomon (puis dans la maison du joueur).
//  Les plats rendent heureux, rassasient et augmentent les statistiques pour toujours (chip).
// =====================================================================
(function () {
  const { UI, Input, Audio } = DW;
  const I = DW.ITEMS;
  const st = () => DW.state;
  const today = () => DW.Time.day();

  // ------------------------------------------------------------ ingrédients (se mangent aussi tels quels)
  const INGR = {
    miel:        { name: 'Miel doré', price: 300, use: 'heal', amt: 200, food: 10, happy: 4, icon: ['jar', '#f0b020'], desc: 'Un pot de miel des fleurs de l\'île. Ingrédient de cuisine (un peu de bonheur si on le mange).' },
    piment:      { name: 'Piment de feu', price: 300, use: 'heal', amt: 100, food: 5, icon: ['veg', '#e8301a'], desc: 'Il brûle la langue ! Ingrédient de cuisine.' },
    eau_source:  { name: 'Eau de source', price: 150, use: 'heal', food: 0, drink: 80, icon: ['potion', '#6ac8f0'], desc: 'Une eau pure et fraîche : étanche la soif. Ingrédient de cuisine.' },
    sel:         { name: 'Sel de roche', price: 150, use: 'none', icon: ['jar', '#e8e4dc'], desc: 'Du sel taillé dans la roche par Gotsumon. Ingrédient de cuisine.' },
    lait:        { name: 'Lait de cactus', price: 300, use: 'heal', amt: 300, food: 15, icon: ['potion', '#f4f4ec'], desc: 'Doux et crémeux (mieux vaut ne pas demander). Ingrédient de cuisine.' },
    truffe:      { name: 'Truffe des bois', price: 1200, use: 'heal', amt: 200, food: 10, icon: ['mush', '#5a4030'], desc: 'Un champignon rare au parfum puissant. Ingrédient de cuisine.' },
    sucre:       { name: 'Sucre d\'ourson', price: 300, use: 'heal', food: 5, happy: 3, icon: ['jar', '#f8b8d0'], desc: 'Des cristaux roses et sucrés. Ingrédient de cuisine.' },
    algue:       { name: 'Algue marine', price: 200, use: 'heal', amt: 200, food: 10, icon: ['veg', '#2a8a5a'], desc: 'Elle sent bon l\'océan. Ingrédient de cuisine.' },
    glace_pilee: { name: 'Glace pilée', price: 200, use: 'heal', food: 5, tired: 30, icon: ['potion', '#c8f0ff'], desc: 'Rafraîchissante : un peu moins de fatigue. Ingrédient de cuisine.' },
    farine:      { name: 'Farine', price: 100, tier: 0, use: 'none', icon: ['jar', '#f8f4e8'], desc: 'De la farine de la boulangerie. Ingrédient de cuisine.' },
    riz:         { name: 'Riz', price: 120, tier: 0, use: 'heal', amt: 200, food: 20, icon: ['jar', '#f4f0e4'], desc: 'Un sac de riz. Ingrédient de cuisine.' },
  };
  // ------------------------------------------------------------ plats cuisinés
  const DISH = {
    brochette:   { name: 'Brochette pimentée', price: 1200, use: 'heal', amt: 800, food: 60, happy: 5, chip: { atk: 2 }, icon: ['bowl', '#c84a2a'], desc: 'Viande grillée au piment. Attaque +8 pour toujours !' },
    grillade:    { name: 'Grillade au sel', price: 900, use: 'heal', amt: 1200, food: 80, chip: { hp: 4 }, icon: ['bowl', '#a8643a'], desc: 'Simple et parfaite. PV max +80 pour toujours.' },
    soupe:       { name: 'Soupe aux champignons', price: 900, use: 'heal', amt: 600, mp: 600, food: 50, chip: { mp: 4 }, icon: ['bowl', '#c89a6a'], desc: 'Chaude et parfumée. PM max +80 pour toujours.' },
    ragout:      { name: 'Ragoût du potager', price: 2000, use: 'heal', full: true, food: 90, happy: 5, chip: { hp: 5, def: 1 }, icon: ['bowl', '#d88a3a'], desc: 'Tous les PV. PV max +100 et Défense +4 pour toujours.' },
    poisson_miel:{ name: 'Poisson laqué au miel', price: 1500, use: 'heal', amt: 900, food: 60, happy: 5, chip: { int: 2 }, icon: ['bowl', '#e0a040'], desc: 'Sucré-salé. Intelligence +8 pour toujours !' },
    sushi:       { name: 'Sushis de l\'île', price: 1500, use: 'heal', amt: 700, food: 50, chip: { spd: 2, int: 1 }, icon: ['bowl', '#f4f0e4'], desc: 'Vitesse +8 et Intelligence +4 pour toujours.' },
    curry:       { name: 'Curry de Meramon', price: 2000, use: 'heal', amt: 1500, food: 90, chip: { atk: 1, def: 2 }, icon: ['bowl', '#e0a020'], desc: 'Ça pique ! Attaque +4 et Défense +8 pour toujours.' },
    salade:      { name: 'Salade croquante', price: 1200, use: 'heal', amt: 400, food: 40, fat: -2, chip: { def: 2 }, icon: ['bowl', '#6ac850'], desc: 'Légère : fait perdre du poids. Défense +8 pour toujours.' },
    tarte_maison:{ name: 'Tarte maison', price: 1500, use: 'heal', amt: 1000, food: 60, happy: 25, chip: { spd: 2 }, icon: ['cake', '#e03a4a'], desc: 'Comme à la maison ! Très heureux. Vitesse +8 pour toujours.' },
    pain_miel:   { name: 'Pain au miel', price: 700, use: 'heal', amt: 600, food: 50, happy: 8, tired: 100, icon: ['bread', '#e8a83a'], desc: 'Réconfortant : la fatigue disparaît et le moral remonte.' },
    sorbet:      { name: 'Sorbet de Frigimon', price: 900, use: 'heal', food: 20, happy: 15, disc: 10, tired: 100, icon: ['cake', '#f0a020'], desc: 'Frais ! Bonheur +15, discipline +10, plus de fatigue.' },
    smoothie:    { name: 'Smoothie bleu', price: 1200, use: 'heal', mpFull: true, food: 30, happy: 10, chip: { mp: 3 }, icon: ['potion', '#5a8ae0'], desc: 'Tous les PM. PM max +60 pour toujours.' },
    gratin:      { name: 'Gratin à la truffe', price: 4000, use: 'heal', full: true, food: 90, happy: 10, chip: { hp: 2, mp: 2, atk: 1, def: 1, spd: 1, int: 1 }, icon: ['bowl', '#f0d070'], desc: 'Un délice rare. Toutes les statistiques augmentent un peu, pour toujours.' },
    festin:      { name: 'Festin de l\'Île', price: 9000, use: 'heal', full: true, mpFull: true, food: 100, happy: 30, life: 1, chip: { hp: 4, mp: 4, atk: 2, def: 2, spd: 2, int: 2 }, icon: ['bowl', '#ffd040'], desc: 'Le plat légendaire : rassasie, la vie s\'allonge d\'un jour et toutes les statistiques montent !' },
  };
  for (const [id, it] of Object.entries({ ...INGR, ...DISH })) { DW.foodRule(it); I[id] = it; if (!DW.ITEM_ORDER.includes(id)) DW.ITEM_ORDER.push(id); }   // (la nourriture ne soigne pas : items.js)
  DW.SHOPS.boulangerie.push('farine');
  DW.SHOPS.resto.splice(2, 0, 'riz');

  // ------------------------------------------------------------ recettes : [plat, {ingrédient: quantité}]
  const RECIPES = [
    ['grillade', { viande: 1, sel: 1 }],
    ['brochette', { viande: 1, piment: 1 }],
    ['soupe', { digichampi: 2, eau_source: 1 }],
    ['pain_miel', { farine: 1, miel: 1 }],
    ['salade', { radis: 1, super_carotte: 1, sel: 1 }],
    ['sorbet', { glace_pilee: 1, orange_bana: 1 }],
    ['smoothie', { lait: 1, pomme_bleue: 1 }],
    ['poisson_miel', { digianchois: 1, miel: 1 }],
    ['sushi', { riz: 1, algue: 1, digianchois: 1 }],
    ['tarte_maison', { farine: 1, baie_rouge: 1, sucre: 1 }],
    ['curry', { riz: 1, piment: 1, viande: 1 }],
    ['ragout', { super_carotte: 1, super_legume: 1, eau_source: 1 }],
    ['gratin', { truffe: 1, lait: 1, super_legume: 1 }],
    ['festin', { super_viande: 1, truffe: 1, miel: 1, noix_douce: 1 }],
  ];

  // ------------------------------------------------------------ le cadeau du jour de chaque habitant
  const PRODUCE = {
    yokomon: ['miel', 1, 'Les fleurs du Jardin ont donné du miel'],
    mushroomon: ['digichampi', 2, 'J\'ai cueilli des champignons ce matin'],
    betamon: ['eau_source', 2, 'L\'eau de la fontaine est si pure'],
    gotsumon: ['sel', 2, 'J\'ai taillé un peu de sel dans la roche'],
    kunemon: ['grosse_baie', 1, 'J\'ai trouvé une baie énorme'],
    biyomon: ['baie_rouge', 1, 'En volant, j\'ai cueilli des baies'],
    meramon: ['piment', 2, 'Mes piments ont bien poussé au chaud'],
    frigimon: ['glace_pilee', 2, 'Un peu de glace pilée, toute fraîche'],
    togemon: ['lait', 1, 'Voilà du lait de cactus'],
    centarumon: ['truffe', 1, 'J\'ai déterré une truffe en forêt'],
    monzaemon: ['sucre', 2, 'Du sucre, pour la douceur'],
    gekomon: ['algue', 2, 'Des algues du marais, bien fraîches'],
    tentomon: ['miel', 1, 'Les abeilles m\'ont laissé un peu de miel'],
    etemon: ['orange_bana', 1, 'Un fruit de la jungle, baby'],
    numemon: ['viande_moisie', 1, 'Euh... Je l\'ai trouvée par terre'],
    agumon: ['viande', 1, 'J\'ai gardé un morceau de viande pour toi'],
    ogremon: ['viande', 1, 'Hmpf. Prends ça'],
  };
  async function afterTalk(n) {
    const sp = n && n.sp, P = PRODUCE[sp];
    if (!P || n.recruit || n.gear || !DW.Town.has(sp)) return;
    const s = st();
    if (!s.produce || s.produce.day !== today()) s.produce = { day: today(), got: [] };
    if (s.produce.got.includes(sp)) return;
    s.produce.got.push(sp);
    const [id, k, line] = P, name = DW.SPECIES[sp].name;
    const extra = DW.giveItem(id, k);
    Audio.sfx('buy');
    await DW.say(`${line}... Tiens, c'est pour toi !`, name);
    await DW.say(`Tu reçois : ${I[id].name}${k > 1 ? ' ×' + k : ''} !${DW.extraMsg(extra)}`);
    if (!s.flags.cuisineTip) {
      s.flags.cuisineTip = true;
      await DW.say(DW.Town.has('mushroomon') ? '(Chaque habitant de la ville t\'offre un ingrédient par jour. Au Restaurant, Mushroomon t\'apprendra à les cuisiner en bons petits plats !)' : '(Chaque habitant de la ville t\'offre un ingrédient par jour. Garde-les précieusement : ils serviront un jour à cuisiner.)');
    }
  }

  // ------------------------------------------------------------ écran de cuisine
  const have = id => st().bag[id] || 0;
  const can = r => Object.entries(r[1]).every(([id, n]) => have(id) >= n);
  class CookScene extends DW.Scene {
    constructor(where) { super(); this.where = where || 'Restaurant'; this.i = 0; this.top = 0; this.cook = 0; this.bub = []; }
    update() {
      if (this.cook > 0) return;
      const n = RECIPES.length + 1;
      if (Input.hit('up')) { this.i = (this.i + n - 1) % n; Audio.sfx('move'); }
      if (Input.hit('down')) { this.i = (this.i + 1) % n; Audio.sfx('move'); }
      if (Input.hit('back')) { Audio.sfx('back'); this.close(); return; }
      if (Input.hit('ok')) {
        if (this.i >= RECIPES.length) { Audio.sfx('back'); this.close(); return; }
        const r = RECIPES[this.i];
        if (!can(r)) { Audio.sfx('bump'); this.msg = 'Il manque des ingrédients !'; this.msgT = 2; return; }
        if (!DW.bagRoom(r[0])) { Audio.sfx('bump'); this.msg = `Sac plein (${DW.BAG_MAX} max) !`; this.msgT = 2; return; }
        for (const [id, k] of Object.entries(r[1])) st().bag[id] -= k;
        Audio.sfx('select'); this.cook = 1.4; this.dish = r[0];
      }
      if (this.i < this.top) this.top = this.i; if (this.i > this.top + 7) this.top = this.i - 7;
    }
    tick(dt) {
      if (this.msgT > 0) this.msgT -= dt;
      if (this.cook > 0) {
        if (Math.random() < 0.5) this.bub.push({ x: 268 + (Math.random() - 0.5) * 30, y: 120, v: 10 + Math.random() * 20, t: 0 });
        this.cook -= dt;
        if (this.cook <= 0) {
          this.cook = 0; DW.giveItem(this.dish); Audio.sfx('heal');
          const s = st(); s.cooked = s.cooked || {}; s.cooked[this.dish] = (s.cooked[this.dish] || 0) + 1;
          this.msg = `${I[this.dish].name} : c'est prêt !`; this.msgT = 2.5;
        }
      }
      this.bub.forEach(b => { b.t += dt; b.y -= b.v * dt; }); this.bub = this.bub.filter(b => b.t < 1.2);
    }
    draw(c) {
      const s = st();
      UI.menuBg(c, this.t, 'CUISINE — ' + this.where.toUpperCase());
      UI.box(c, 8, 26, 168, 150);
      const rows = RECIPES.concat([null]).slice(this.top, this.top + 8);
      rows.forEach((r, k) => {
        const y = 44 + k * 16;
        if (!r) { UI.text(c, 'QUITTER', 26, y, { size: 10, color: '#9ab0e8' }); return; }
        c.drawImage(DW.Icons.item(r[0]), 12, y - 11, 12, 12);
        const known = s.cooked && s.cooked[r[0]];
        UI.text(c, I[r[0]].name, 26, y, { size: 8, color: can(r) ? '#7aff8a' : '#c8d0e8' });
        if (known) UI.text(c, '★', 170, y, { size: 7, align: 'right', color: '#ffd860' });
      });
      if (this.top > 0) UI.text(c, '▲', 92, 34, { size: 7, align: 'center', color: '#ffe070' });
      if (this.top + 8 < RECIPES.length + 1) UI.text(c, '▼', 92, 174, { size: 7, align: 'center', color: '#ffe070' });
      UI.cursor(c, 15, 40.5 + (this.i - this.top) * 16, this.t);
      // ingrédients de la recette choisie
      UI.box(c, 182, 26, 130, 150);
      const r = RECIPES[this.i];
      if (r && this.cook <= 0) {
        UI.text(c, 'INGRÉDIENTS', 247, 40, { size: 8, align: 'center', bold: true, color: '#ffe070' });
        Object.entries(r[1]).forEach(([id, n], k) => {
          const y = 58 + k * 16, ok = have(id) >= n;
          c.drawImage(DW.Icons.item(id), 188, y - 11, 12, 12);
          UI.text(c, I[id].name, 202, y, { size: 7, color: ok ? '#ffffff' : '#ff9a8a' });
          UI.text(c, `${Math.min(have(id), 99)}/${n}`, 306, y, { size: 7, align: 'right', color: ok ? '#7aff8a' : '#ff9a8a' });
        });
        const big = DW.Icons.item(r[0]);
        c.drawImage(big, 231, 128, 32, 32);
        UI.text(c, `Dans le sac : ${have(r[0])}`, 247, 170, { size: 7, align: 'center', color: '#9ab0e8' });
      }
      if (this.cook > 0) {
        // marmite qui bout
        const x = 247, y = 112;
        c.fillStyle = '#3a3a44'; c.beginPath(); c.ellipse(x, y + 10, 30, 16, 0, 0, Math.PI); c.fill();
        c.fillRect(x - 30, y - 4, 60, 14);
        c.fillStyle = '#e8a040'; c.beginPath(); c.ellipse(x, y - 4, 28, 6, 0, 0, 7); c.fill();
        c.fillStyle = '#ff7a2a'; for (let k = 0; k < 5; k++) { const fx = x - 20 + k * 10, fh = 6 + Math.sin(this.t * 20 + k) * 3; c.beginPath(); c.moveTo(fx - 4, y + 30); c.lineTo(fx, y + 30 - fh - 6); c.lineTo(fx + 4, y + 30); c.fill(); }
        c.fillStyle = 'rgba(255,255,255,0.8)'; this.bub.forEach(b => { c.beginPath(); c.arc(b.x - 21, b.y, 2 + b.t * 3, 0, 7); c.fill(); });
        UI.text(c, 'Ça mijote...', x, 60, { size: 9, align: 'center', color: '#ffe070' });
      }
      UI.box(c, 8, 180, 304, 54);
      if (r) UI.wrap(c, I[r[0]].desc, 290, 8).slice(0, 3).forEach((l, k) => UI.text(c, l, 16, 196 + k * 11, { size: 8, color: '#c8f0ff' }));
      else UI.text(c, 'Les ingrédients se récoltent auprès des habitants de la ville (un cadeau par jour).', 16, 200, { size: 7, color: '#c8f0ff' });
      if (this.msgT > 0) UI.text(c, this.msg, 160, 20, { size: 8, align: 'center', color: '#7aff8a' });
    }
  }

  DW.Cuisine = { INGR, DISH, RECIPES, PRODUCE, afterTalk, CookScene, cook: where => DW.Game.push(new CookScene(where)) };
})();
