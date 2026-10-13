'use strict';
// =====================================================================
//  MAISON DU JOUEUR — à l'est de la maison de Jijimon (Ville des Fichiers)
//  On l'aménage en achetant des meubles au Bazar de Gotsumon (rayon « Meubles »).
//  Chaque meuble sert vraiment : lit (repos, soins, sauvegarde), coffre (objets en trop),
//  frigo (en-cas du jour), cuisine (recettes), haltères (entraînement maison), télé (rumeurs),
//  ordinateur (DigiFerme), bibliothèque (discipline), aquarium et plantes (bonheur), toilettes.
// =====================================================================
(function () {
  const { say, st, healAll } = DW.MapKit;
  const MAPS = DW.MAPS;
  const W = 16, H = 12, DOOR_X = 7;
  const day = () => DW.Time.day();
  const lead = () => st().party[0];
  // une fois par jour et par meuble
  const once = key => { const s = st(), h = s.home; if (!h.used || h.used.day !== day()) h.used = { day: day(), k: [] }; if (h.used.k.includes(key)) return false; h.used.k.push(key); return true; };

  // ------------------------------------------------------------ catalogue des meubles (prix, objet posé, usage)
  const FURN = {
    lit:      { name: 'Lit douillet', price: 0, objs: [{ kind: 'bed', x: 1, y: 3, w: 2, h: 2 }], desc: 'Dormir : soigne toute l\'équipe, sauvegarde, et fait passer la nuit.' },
    coffre:   { name: 'Coffre', price: 0, objs: [{ kind: 'chest', x: 1, y: 6, w: 1, h: 1, small: true }], desc: 'Range les objets que ton sac ne peut pas porter.' },
    toilettes:{ name: 'Toilettes privées', price: 600, objs: [{ kind: 'toilet', x: 13, y: 5, w: 2, h: 1 }], desc: 'Des toilettes rien qu\'à vous : plus besoin de courir dehors !' },
    plantes:  { name: 'Plantes vertes', price: 500, objs: [{ kind: 'bigplant', x: 14, y: 9, w: 1, h: 1, small: true }, { kind: 'flowerpots', v: 1, x: 3, y: 6, w: 2, h: 1 }], desc: 'Les arroser chaque jour rend ton partenaire heureux (bonheur +3).' },
    frigo:    { name: 'Réfrigérateur', price: 1200, objs: [{ kind: 'fridge', x: 13, y: 3, w: 1, h: 1, small: true }], desc: 'Chaque jour, un en-cas s\'y trouve (viande, pain, fruit...).' },
    tele:     { name: 'Télévision', price: 1000, objs: [{ kind: 'crttv', x: 5, y: 3, w: 2, h: 1 }], desc: 'Les nouvelles de l\'île et des rumeurs. Regarder ensemble rend heureux.' },
    biblio:   { name: 'Bibliothèque', price: 1500, objs: [{ kind: 'bookshelf', v: 1, x: 3, y: 3, w: 2, h: 1 }], desc: 'Lire une histoire chaque jour à ton partenaire : discipline +5.' },
    cuisine:  { name: 'Cuisine équipée', price: 2500, objs: [{ kind: 'kitchen', x: 9, y: 3, w: 4, h: 1 }], desc: 'Cuisine tes recettes à la maison, quand tu veux.' },
    halteres: { name: 'Coin musculation', price: 3000, objs: [{ kind: 'weights', x: 4, y: 9, w: 1, h: 1, small: true }, { kind: 'cushion', x: 5, y: 9, w: 1, h: 1, small: true }], desc: 'Un entraînement maison par jour : +2 points dans la statistique de ton choix (fatigue).' },
    aquarium: { name: 'Aquarium', price: 2000, objs: [{ kind: 'aquarium', x: 11, y: 10, w: 3, h: 1 }], desc: 'Regarder les poissons détend : bonheur +5 une fois par jour.' },
    ordi:     { name: 'Ordinateur', price: 4000, objs: [{ kind: 'computer', x: 11, y: 7, w: 2, h: 1 }], desc: 'Gère ta DigiFerme depuis la maison.' },
    tapis:    { name: 'Grand tapis et canapé', price: 1800, objs: [{ kind: 'bigrug', v: 1, x: 2, y: 7, w: 4, h: 2, walk: true }, { kind: 'sofa', v: 0, x: 1, y: 10, w: 3, h: 1 }], desc: 'Un salon confortable : ton partenaire se repose mieux (le lit rend aussi +5 de bonheur).' },
    tableau:  { name: 'Tableaux', price: 800, objs: [{ kind: 'painting', v: 0, x: 9, y: 1, w: 2, h: 1, back: true, oy: 6 }, { kind: 'painting', v: 1, x: 12, y: 1, w: 2, h: 1, back: true, oy: 6 }], desc: 'De beaux tableaux aux murs. Pour le plaisir des yeux.' },
  };
  const ORDER = Object.keys(FURN);
  const owned = id => !!(st().home && st().home.owned[id]);

  // ------------------------------------------------------------ usages
  const USE = {
    async lit() {
      const night = DW.Time.isNight();
      if ((await DW.ask(night ? 'Dormir jusqu\'au matin ?' : 'Faire une sieste ?')) !== 0) return;
      const s = st();
      if (night) { const h = DW.Time.hour(); s.clock += ((h < 7 ? 7 - h : 31 - h) * 60); } else s.clock += 120;
      s.heal = { map: 'maison_joueur', x: 3, y: 5 };
      if (owned('tapis')) s.party.forEach(m => m.addHappy(5));
      s.party.forEach(m => { m.tired = 0; });
      await healAll(night ? 'Bonne nuit... Toute l\'équipe se réveille en pleine forme !' : 'Toute l\'équipe est reposée !');
      DW.autosave();
      await say('(Partie sauvegardée.)');
    },
    async coffre() { await DW.Game.push(new DW.BankScene()); },
    async toilettes() { await DW.Care.toilet(); },
    async plantes() {
      if (!once('plantes')) { await say('Les plantes sont bien arrosées. Elles ont l\'air heureuses.'); return; }
      st().party.forEach(m => m.addHappy(3)); DW.Audio.sfx('water');
      await say('Tu arroses les plantes avec ton partenaire. Ça sent bon la terre mouillée ! (bonheur +3)');
    },
    async frigo() {
      if (!once('frigo')) { await say('Le frigo est vide... Il sera rempli demain.'); return; }
      const id = DW.pick(['viande', 'viande', 'pain', 'brioche', 'pomme_bleue', 'baie_rouge', 'digichampi', 'croissant']);
      const extra = DW.giveItem(id); DW.Audio.sfx('buy');
      await say(`Dans le frigo : ${DW.ITEMS[id].name} !${DW.extraMsg(extra)}`);
    },
    async tele() {
      const s = st();
      await say(DW.pick([
        'Météo de l\'île : « ' + DW.Time.weatherName() + ' » en ce moment. Saison : ' + DW.Time.date().seasonName + '.',
        'Flash spécial : des Engrenages Noirs auraient été vus dans les régions lointaines...',
        'Recette du jour : viande + piment de Meramon = Brochette pimentée ! Ça donne de la force.',
        'Le saviez-vous ? Un Digimon bien discipliné obéit mieux en combat.',
        'Interview de Jijimon : « La ville grandit grâce à vous tous, hohoho ! »',
        'Rubrique pêche : les gros poissons mordent surtout le matin.',
        'Pub : « Bazar de Gotsumon, tout pour la maison ! »',
      ]));
      if (once('tele') && lead()) { lead().addHappy(3); await say(`${lead().name} a adoré regarder la télé avec toi ! (bonheur +3)`); }
      void s;
    },
    async biblio() {
      const m = lead(); if (!m) return;
      if (!once('biblio')) { await say(`${m.name} a déjà eu son histoire aujourd'hui.`); return; }
      DW.Life && DW.Life.addDisc ? DW.Life.addDisc(m, 5) : (m.disc = Math.min(100, (m.disc || 0) + 5));
      await say(`Tu lis « ${DW.pick(['Les Sept Écussons', 'Le Digivice perdu', 'La légende du Pont de l\'Infini', 'Agumon et le grand gâteau'])} » à ${m.name}. Il écoute très sagement. (discipline +5)`);
    },
    async cuisine() { await DW.Cuisine.cook('Maison'); },
    async halteres() {
      const m = lead(); if (!m) return;
      if (!once('halteres')) { await say(`${m.name} s'est déjà entraîné à la maison aujourd'hui.`); return; }
      const K = ['hp', 'mp', 'atk', 'def', 'spd', 'int'], NAMES = ['PV', 'PM', 'Attaque', 'Défense', 'Vitesse', 'Intelligence'];
      const i = await DW.ask('Quelle statistique travailler ?', ['PV', 'PM', 'Attaque', 'Défense', 'Vitesse', 'Intelligence', 'Annuler']);
      if (i < 0 || i > 5) { st().home.used.k = st().home.used.k.filter(k => k !== 'halteres'); return; }
      m.tr = m.tr || {}; const v0 = K[i] === 'hp' ? m.maxHp : K[i] === 'mp' ? m.maxMp : m.stat(K[i]);
      m.tr[K[i]] = (m.tr[K[i]] || 0) + 2; m.tired = Math.min(100, (m.tired || 0) + 15);
      const v1 = K[i] === 'hp' ? m.maxHp : K[i] === 'mp' ? m.maxMp : m.stat(K[i]);
      DW.Audio.sfx('super');
      await say(`Une, deux ! ${m.name} s'entraîne dur. ${NAMES[i]} +${Math.max(1, v1 - v0)} ! (fatigue +15)`);
    },
    async aquarium() {
      if (!once('aquarium')) { await say('Les poissons font des bulles. Blop, blop.'); return; }
      st().party.forEach(m => m.addHappy(5));
      await say('Vous regardez les poissons nager tranquillement... Quel calme ! (bonheur +5)');
    },
    async ordi() { await DW.Game.push(new DW.FarmScene()); },
    async tapis() { await say('Le canapé est moelleux. Ton partenaire adore s\'y rouler en boule.'); },
    async tableau() { await say('De beaux tableaux : un paysage de l\'île, et un coucher de soleil sur la plage.'); },
  };

  // ------------------------------------------------------------ la pièce, reconstruite selon les meubles possédés
  const rows = () => ['0'.repeat(W), '0' + '2'.repeat(W - 2) + '0', '0' + '2'.repeat(W - 2) + '0',
    ...Array.from({ length: H - 4 }, () => '0' + '1'.repeat(W - 2) + '0'), '0'.repeat(DOOR_X) + '11' + '0'.repeat(W - DOOR_X - 2)];
  MAPS.maison_joueur = {
    name: 'Ma maison', music: 'village', bg: 'foret', ambient: 'home', climate: 'village', region: 'village', indoor: true,
    floor: { type: 'herring', cols: ['#d8a868', '#b07e48', '#7a5430'] }, wall: { base: '#f4ead4', alt: '#e8d8b8', pattern: 'stripes', wood: '#8a5a32' },
    rows: rows(), objects: [], npcs: [], signs: {},
    warps: [{ x: DOOR_X, y: H - 1, w: 2, h: 1, dir: 'down', to: 'village', tx: 62, ty: 12, _zt: true }],
    entry: { x: DOOR_X, y: H - 2 },
    build() {
      const s = st();
      if (!s.home) s.home = { owned: { lit: true, coffre: true } };
      if (DW.HOME_DOOR) Object.assign(this.warps[0], { tx: DW.HOME_DOOR.x, ty: DW.HOME_DOOR.y + 1 });
      const cave = DW.Trophies && DW.Trophies.count() > 0;   // le premier trophée ouvre la cave (game/trophees.js)
      const version = ORDER.filter(owned).join(',') + (cave ? '|cave' : '');
      if (this.version === version && this.objects.length) return;
      this.version = version;
      this.objects = [{ kind: 'window', v: 0, x: 3, y: 1, w: 2, h: 2, back: true, oy: -6 }, { kind: 'window', v: 0, x: 6, y: 1, w: 2, h: 2, back: true, oy: -6 }];
      this.signs = {};
      for (const id of ORDER) if (owned(id)) for (const o of FURN[id].objs) {
        this.objects.push({ ...o });
        if (o.back || o.walk) continue;
        for (let x = o.x; x < o.x + (o.w || 1); x++) for (let y = o.y + (o.h || 1) - 1; y < o.y + (o.h || 1); y++) this.signs[`${x},${y}`] = () => USE[id]();
      }
      if (owned('tableau')) this.signs['9,2'] = this.signs['10,2'] = this.signs['12,2'] = this.signs['13,2'] = () => USE.tableau();
      // escalier de la cave aux trophées
      this.doors = [];
      if (cave) {
        this.objects = this.objects.filter(o => !(o.x < 14 && o.x + (o.w || 1) > 12 && (o.back || o.y <= 4)));
        this.objects.push({ kind: 'stairsdown', x: 12, y: 1, w: 2, h: 2, back: true });
        this.doors.push({ x: 12, y: 2, w: 2, dir: 'up', to: 'cave_joueur', tx: 7, ty: 3 });
      }
      DW.World.unprepare(this);
    },
    async onEnter() {
      const s = st();
      if (s.flags.homeIntro) return;
      s.flags.homeIntro = true;
      await DW.wait(0.4);
      await say('Voici ta maison ! Jijimon l\'a préparée pour toi : un lit et un coffre, pour commencer.');
      await say('Au Bazar de Gotsumon, le rayon « Meubles » vend de quoi l\'aménager. Chaque meuble a son utilité !');
    },
  };

  // ------------------------------------------------------------ rayon « Meubles » (Bazar de Gotsumon)
  async function furnitureShop() {
    const s = st();
    if (!s.home) s.home = { owned: { lit: true, coffre: true } };
    for (;;) {
      const list = ORDER.filter(id => !owned(id));
      if (!list.length) { await say('Ta maison est entièrement meublée ! Bravo !', 'Gotsumon'); return; }
      const i = await DW.choose(list.map(id => `${FURN[id].name} — ${FURN[id].price} B`).concat(['Quitter']), { y: 8 });
      if (i < 0 || i >= list.length) return;
      const F = FURN[list[i]];
      if ((await DW.ask(`${F.name} (${F.price} Bits) : ${F.desc} L'acheter ?`)) !== 0) continue;
      if (s.bits < F.price) { await say('Tu n\'as pas assez de Bits...', 'Gotsumon'); continue; }
      s.bits -= F.price; s.home.owned[list[i]] = true; DW.Audio.sfx('buy');
      await say(`Merci ! Je fais livrer « ${F.name} » chez toi tout de suite !`, 'Gotsumon');
    }
  }
  DW.Home = { FURN, furnitureShop, owned };
})();
