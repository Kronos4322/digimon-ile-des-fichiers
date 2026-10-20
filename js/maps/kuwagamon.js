'use strict';
// =====================================================================
//  KUWAGAMON, PREMIER BOSS (fin du chapitre 1)
//  Il se cache dans le Grand Arbre de la Clairière de l'Arrivée (objet « grandarbre », maps/foret.js).
//  1) trois énigmes sont gravées dans l'écorce, l'une après l'autre : à chaque bonne réponse l'écorce se fissure,
//     à la troisième elle éclate et ouvre le tronc ;
//  2) dans l'arbre, Kuwagamon ; les racines se referment : impossible de ressortir sans le battre ;
//  3) victoire : il se désagrège en données (KuwaDefeatScene), fondu au noir, réveil chez Jijimon :
//     la clairière est calme, il te donne le Trophée de Kuwagamon (il ouvre la cave de ta maison) ;
//  4) fin du chapitre 1 (game/chapitre1.js).
// =====================================================================
(function () {
  const { UI, Audio, Game } = DW;
  const W = DW.W, H = DW.H;
  const say = (t, s) => DW.say(t, s);
  const st = () => DW.state;
  const E = DW.Enigmes, RIDDLE = 'kuwa_arbre', J = 'Jijimon';

  // ------------------------------------------------------------ 1) les trois énigmes gravées sur le Grand Arbre
  const RIDDLES = [
    { q: "« Je n'ai pas de jambes et pourtant je cours. Pas de bouche, mais je murmure. Je traverse la forêt sans jamais m'y arrêter. Qui suis-je ? »",
      choices: ['Le vent', 'La rivière', 'Un Digimon'], answer: 1, hint: 'écoute ce qui coule au Sentier des Murmures, au sud...' },
    { q: "« Plus j'ai de gardiens, moins je suis gardé. Qui suis-je ? »",
      choices: ['Un trésor', 'Une porte', 'Un secret'], answer: 2, hint: 'ce que l\'on confie à un ami, en lui demandant de ne le répéter à personne...' },
    { q: "« Je pousse sans graine à l'ombre des grands arbres, et la nuit je luis sans jamais brûler. Qui suis-je ? »",
      choices: ['Une luciole', 'Un champignon lumineux', 'Une étoile'], answer: 1, hint: 'regarde au pied des arbres du Sentier, la nuit...' },
  ];
  const level = () => (E.solved(RIDDLE) ? 3 : E.state(RIDDLE).n || 0);
  DW.Kuwa_level = level;
  async function tree(ow) {
    const s = st();
    if (s.flags.kuwagamon) { await say("Le Grand Arbre est silencieux. Les petits Digimon de la clairière jouent de nouveau à son pied."); return; }
    if (E.solved(RIDDLE)) { await say("Le tronc éclaté s'ouvre sur un passage sombre. De l'intérieur monte un bourdonnement sourd... BZZZZ..."); return; }
    const n = level(), R = RIDDLES[n];
    await say(n ? `L'écorce est fissurée (${n} / 3). D'autres mots se sont allumés plus bas...` : "Un arbre immense, plus vieux que la forêt. De l'intérieur monte un bourdonnement sourd... Des mots luisent, gravés dans l'écorce.");
    await say(R.q);
    const r = await DW.ask('Ta réponse ?', R.choices, null, false);
    if (r !== R.answer) {
      // mauvaise réponse : l'arbre se défend, un Digimon caché dans ses branches attaque (on ne devine plus au hasard)
      Audio.sfx('bump'); ow.shake = 0.6;
      await say("Les mots virent au rouge ! Le bourdonnement enfle... et quelque chose tombe des branches !");
      const list = (DW.getMap('clairiere').encounters || []).filter(e => !e.night && e.sp !== 'kuwagamon'), e = list.length ? DW.weighted(list.map(x => ({ ...x, w: x.w || 1 }))) : { sp: 'kunemon', min: 10, max: 12 };
      if (s.party.some(m => m.hp > 0)) await ow.battle({ enemy: new DW.Digimon(e.sp, DW.rand(e.min, e.max)), intro: "Un Digimon gardien de l'arbre t'attaque !" });
      await say(`(Indice : ${R.hint})`);
      return;
    }
    E.state(RIDDLE).n = n + 1;
    if (n + 1 < 3) {
      Audio.sfx('hit'); ow.shake = 0.5;
      await say(n ? "CRAAAC ! Une deuxième fissure lumineuse zèbre l'écorce. Le bourdonnement devient furieux..." : "CRAC ! Une fissure lumineuse court sur l'écorce. À l'intérieur, quelque chose s'agite...");
      ow.map.populate(); ow.gfx = DW.World.prepare(ow.map);
      DW.autosave(); return;
    }
    // troisième énigme : l'écorce éclate
    E.state(RIDDLE).solved = true;
    Audio.sfx('roar'); ow.shake = 1.6;
    await say("Les fissures s'illuminent toutes ensemble...");
    Audio.sfx('super');
    await DW.fade(1, 0.15, '#ffffff');
    ow.map.populate(); ow.gfx = DW.World.prepare(ow.map);
    await DW.wait(0.2);
    await DW.fade(0, 0.6);
    ow.shake = 1;
    await say("BOUM ! L'écorce explose en mille éclats ! Le tronc s'ouvre sur un passage sombre...");
    DW.autosave();
  }

  // ------------------------------------------------------------ 2) dans l'arbre
  const room = DW.Palais.room('arbre_kuwagamon', 'foret', { music: 'cave', name: 'Cœur du Grand Arbre', w: 20, h: 15,
    floor: { type: 'herring', cols: ['#6a4a2a', '#4a321c', '#2a1a0e'] }, wall: { base: '#5a3a22', alt: '#4a2e1a', pattern: 'stripes', wood: '#2a1a0e' },
    dark: { d: 0.4, col: '#2a1a10' },
    objects: [
      { kind: 'treeroots', v: 0, x: 2, y: 2, w: 2, h: 2, back: true }, { kind: 'treeroots', v: 1, x: 6, y: 2, w: 2, h: 2, back: true },
      { kind: 'treeroots', v: 0, x: 12, y: 2, w: 2, h: 2, back: true }, { kind: 'treeroots', v: 1, x: 16, y: 2, w: 2, h: 2, back: true },
      { kind: 'kuwanest', x: 8, y: 4, w: 4, h: 1 },
      { kind: 'glowshroom', x: 2, y: 4, w: 1, h: 1 }, { kind: 'glowshroom', x: 17, y: 4, w: 1, h: 1 }, { kind: 'glowshroom', x: 3, y: 11, w: 1, h: 1 }, { kind: 'glowshroom', x: 16, y: 12, w: 1, h: 1 },
      { kind: 'hollowlog', x: 14, y: 10, w: 2, h: 1 }, { kind: 'stump', x: 2, y: 8, w: 1, h: 1 }, { kind: 'mossrock', x: 17, y: 8, w: 1, h: 1 },
      { kind: 'fern', x: 5, y: 12, w: 1, h: 1 }, { kind: 'fern', x: 13, y: 5, w: 1, h: 1 }, { kind: 'log', x: 4, y: 6, w: 1, h: 1 }] });
  room.calm = true;
  DW.Palais.entrance('arbre_kuwagamon');
  // la sortie mène devant l'arbre ; elle reste fermée tant que Kuwagamon n'est pas vaincu
  for (const w of room.warps) if (w.to === '?') Object.assign(w, { to: 'clairiere', tx: 27, ty: 11, cond: s => !!s.flags.kuwagamon,
    lock: "Les racines se sont refermées derrière toi ! Kuwagamon ne te laissera pas repartir..." });
  room.onEnter = async ow => {
    if (st().flags.kuwagamon || st().flags.kuwaSeen) return;
    st().flags.kuwaSeen = true;
    DW.Audio.sfx('roar'); ow.shake = 1;
    await say("CRAC ! Les racines se referment derrière toi. Plus moyen de sortir...");
    const pn = (st().party.find(m => m.hp > 0) || st().party[0]).name;
    await say("BZZZZZ... Là, au fond ! Un énorme insecte rouge aux pinces gigantesques !");
    await say("C'est lui qui terrorise la clairière... Il faut l'affronter ! Je suis prêt !", pn);
  };
  room.npcs.push({ sp: 'kuwagamon', x: 9, y: 7, face: 'down', cond: s => !s.flags.kuwagamon, talk: fight });

  async function fight(ow) {
    const s = st();
    await say('BZZZZZZZZZ !!!', 'Kuwagamon');
    if (!s.party.some(m => m.hp > 0)) { await say("Ton partenaire n'est pas en état de se battre... Donne-lui de quoi se soigner (menu → OBJETS)."); return; }
    if ((await DW.ask('Affronter Kuwagamon ?')) !== 0) return;
    const res = await ow.battle({ enemy: new DW.Digimon('kuwagamon', 11), boss: true, canLose: true, intro: 'Kuwagamon fond sur vous, pinces grandes ouvertes !' });
    if (res !== 'win') {
      // le fossé entre les stades : un Disciple n'a presque aucune chance contre un Champion
      const m = s.party[0];
      if (m && m.d.stage !== 'Champion') await say(`Kuwagamon est un CHAMPION... ${m.name} n'a presque aucune chance tant qu'il n'a pas digivolué ! Entraîne-le et regarde sa fiche (onglet Digivolution).`);
      // les racines se rouvrent : Kuwagamon vous chasse de l'arbre (on se réveille chez Jijimon)
      await say("Kuwagamon vous projette contre l'écorce... Les racines s'écartent et vous roulez dehors.");
      st().flags.kuwaSeen = false;   // (en revenant, l'arbre se referme de nouveau derrière toi)
      await ow.bossDefeat("Hohoho... Les petits Digimon de la clairière vous ont ramenés ici. Reprenez des forces : Kuwagamon vous attendra dans son arbre.");
      return;
    }
    s.flags.kuwagamon = true;
    await victory(ow);
  }

  // ------------------------------------------------------------ 3) la défaite de Kuwagamon (petite scène), puis chez Jijimon
  // ~10 s : il rugit et se débat, des fissures de lumière le traversent, un éclat d'Engrenage Noir s'arrache de son dos,
  // il se désagrège en données qui montent, anneaux de lumière, puis blanc. Elle s'ouvre et se ferme sur un fondu (pas de flash).
  class KuwaDefeatScene extends DW.Scene {
    constructor() {
      super();
      this.bg = DW.World.battleBg('foret@deep');
      this.pts = Array.from({ length: 160 }, () => ({ x: 110 + Math.random() * 100, y: 50 + Math.random() * 120, v: 18 + Math.random() * 60, s: 1 + Math.random() * 2, c: Math.random() < 0.5 ? '#ff6a4a' : '#7af0d0', d: Math.random() * 1.5 }));
      this.cracks = Array.from({ length: 9 }, (_, i) => ({ a: i / 9 * Math.PI * 2 + Math.random() * 0.4, l: 18 + Math.random() * 26, t: 2 + i * 0.25 }));
    }
    async enter() {
      await DW.fade(0, 0.6);
      await DW.wait(9.2);
      await DW.fade(1, 0.9, '#ffffff');
      this.close();
    }
    draw(c) {
      const t = this.t, spr = DW.Sprites.battle('kuwagamon'), cx = W / 2, cy = 120;
      c.drawImage(this.bg, 0, 0);
      c.fillStyle = `rgba(0,0,0,${Math.min(0.6, t * 0.15)})`; c.fillRect(0, 0, W, H);
      // le partenaire, de dos, au premier plan
      const pt = (st().party.find(m => m.hp > 0) || st().party[0]);
      if (pt) { const ps = DW.Sprites.battle(pt.sp); DW.Sprites.draw(c, ps, 70, 214, { frame: Math.floor(t * 4), scale: Math.min(1.2, 60 / ps.h) }); }
      const k = Math.max(0, Math.min(1, (t - 4.6) / 2.6));   // désagrégation
      const shake = t < 4.6 ? Math.sin(t * 38) * (2 + t) : 0;
      if (k < 1) {
        c.save(); c.globalAlpha = 1 - k;
        const flash = t > 1 && t < 4.6 && Math.floor(t * 8) % 3 === 0;
        DW.Sprites.draw(c, spr, cx + shake, 176 - k * 40, { frame: Math.floor(t * 6), white: flash ? 0.7 : 0, scale: 1 + k * 0.2 });
        c.restore();
        // fissures de lumière sur son corps
        c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = '#c8fff0'; c.lineWidth = 1.6;
        for (const cr of this.cracks) if (t > cr.t) { const l = Math.min(cr.l, (t - cr.t) * 40); c.globalAlpha = 1 - k; c.beginPath(); c.moveTo(cx + shake, cy); c.lineTo(cx + shake + Math.cos(cr.a) * l, cy + Math.sin(cr.a) * l * 0.8); c.stroke(); }
        c.restore();
      }
      // l'éclat d'Engrenage Noir qui s'arrache (un indice pour la suite de l'histoire)
      if (t > 3.6) {
        const g = Math.min(1, (t - 3.6) / 2), gx = cx + 40 * g, gy = cy - 30 * Math.sin(g * Math.PI) + g * 70, a = t * 6;
        c.save(); c.translate(gx, gy); c.rotate(a); c.fillStyle = '#16121c'; c.strokeStyle = '#6a4a8a'; c.lineWidth = 1;
        c.beginPath(); for (let i = 0; i < 16; i++) { const r = i % 2 ? 7 : 10, an = i / 16 * Math.PI * 2; c.lineTo(Math.cos(an) * r, Math.sin(an) * r); } c.closePath(); c.fill(); c.stroke(); c.restore();
      }
      // données qui s'envolent
      if (t > 4.6) for (const p of this.pts) {
        const tt = t - 4.6 - p.d; if (tt < 0) continue;
        const y = p.y - tt * p.v, a = Math.max(0, 1 - tt / 3.4);
        c.globalAlpha = a; c.fillStyle = p.c; c.fillRect(Math.round(p.x + Math.sin(tt * 3 + p.y) * 8), Math.round(y), p.s, p.s);
      }
      c.globalAlpha = 1;
      // anneaux de lumière
      if (t > 6.6) { c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 3; i++) { const r = ((t - 6.6) * 70 + i * 30) % 200; c.strokeStyle = `rgba(160,255,230,${Math.max(0, 1 - r / 200)})`; c.lineWidth = 2; c.beginPath(); c.ellipse(cx, cy + 40, r, r * 0.4, 0, 0, 7); c.stroke(); } c.restore(); }
      const cap = t < 1.8 ? 'BZZZZZZZZ !!! Kuwagamon se débat de toutes ses forces...' : t < 3.6 ? 'Des fissures de lumière le traversent !' : t < 5.4 ? "Quelque chose de noir s'arrache de son dos..." : t < 7.6 ? 'Kuwagamon se désagrège en données...' : '';
      if (cap) { c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(0, H - 30, W, 20); UI.text(c, cap, W / 2, H - 16, { size: 9, align: 'center' }); }
    }
  }
  async function victory(ow) {
    const s = st(), pn = (s.party.find(m => m.hp > 0) || s.party[0]).name;
    await DW.fade(1, 0.3);   // pas de retour furtif dans l'arbre
    Audio.sfx('super');
    await Game.push(new KuwaDefeatScene());
    await DW.fade(1, 1.2, '#000000');
    s.party.forEach(m => m.heal());
    await ow.charger('maison', 10, 8, 'up');
    await DW.wait(0.6);
    await DW.fade(0, 0.8);
    Audio.play('village');
    await say("Hohoho ! Te voilà ! Les petits Digimon de la clairière sont venus me prévenir en courant...", J);
    await say("Kuwagamon s'est envolé vers la montagne, et la Clairière de l'Arrivée est enfin calme ! Tu as été formidable, avec ton partenaire.", J);
    await say("On a eu chaud, hein ?", pn);
    await say("Tiens, prends ceci. Les Poyomon l'ont taillé pour toi dans une pince que Kuwagamon a perdue : un trophée !", J);
    DW.Trophies.give('kuwagamon'); Audio.sfx('fanfare'); if (DW.Cards) DW.Cards.give('kuwagamon');
    await say('Tu reçois le Trophée de Kuwagamon !');
    await say("Mets-le dans ta maison. Sous le plancher, il y a une vieille cave que je n'ai jamais ouverte : de quoi exposer tes trophées !", J);
    await say("Un éclat noir s'est arraché de son dos, dis-tu ? Kuwagamon n'était pas méchant autrefois... Il n'était pas lui-même. Je me demande ce qui lui est arrivé...", J);
    // le chapitre continue : un enfant humain serait retenu près des cabines de la plage (Shellmon, fin du chapitre 1)
    if (s.hero !== 'tai') {
      await say("Autre chose... Les Bukamon de la plage disent qu'un autre enfant humain, comme toi, est prisonnier près des cabines téléphoniques.", J);
      await say("Les cabines se seraient mises à murmurer des mots... Écoute-les toutes, et remets-les dans l'ordre. Et prépare-toi bien : un énorme coquillage le garde, un Champion !", J);
    } else await say("Et sur la plage, les cabines téléphoniques sonnent sans arrêt... Un gros Digimon s'y cache, paraît-il. Sois prudent !", J);
    DW.autosave();
  }

  DW.Kuwa = { tree, fight, RIDDLE };
})();
