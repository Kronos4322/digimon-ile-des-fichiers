'use strict';
// =====================================================================
//  KUWAGAMON, PREMIER BOSS (fin du chapitre 1)
//  Il se cache dans le Grand Arbre de la Clairière de l'Arrivée (objet « grandarbre », maps/foret.js).
//  1) une énigme est gravée dans l'écorce : la bonne réponse ouvre le tronc ;
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

  // ------------------------------------------------------------ 1) l'énigme gravée sur le Grand Arbre
  async function tree(ow) {
    const s = st();
    if (s.flags.kuwagamon) { await say("Le Grand Arbre est silencieux. Les petits Digimon de la clairière jouent de nouveau à son pied."); return; }
    if (E.solved(RIDDLE)) { await say("Le tronc est ouvert. De l'intérieur monte un bourdonnement sourd... BZZZZ..."); return; }
    await say("Un arbre immense, plus vieux que la forêt. De l'intérieur monte un bourdonnement sourd...");
    await say("Des mots luisent, gravés dans l'écorce : « Je n'ai pas de jambes et pourtant je cours. Pas de bouche, mais je murmure. Je traverse la forêt sans jamais m'y arrêter. Qui suis-je ? »");
    const r = await DW.ask('Ta réponse ?', ['Le vent', 'La rivière', 'Un Digimon']);
    if (r !== 1) { Audio.sfx('bump'); await say("Les mots s'éteignent puis se rallument, patients. Ce n'est pas la bonne réponse."); await say('(Indice : écoute ce qui coule au Sentier des Murmures, au sud...)'); return; }
    E.state(RIDDLE).solved = true;
    Audio.sfx('roar'); ow.shake = 0.8;
    await say("Les racines craquent... L'écorce s'écarte lentement : le tronc s'ouvre sur un passage sombre !");
    await DW.fade(1, 0.3);
    ow.load(ow.mapId, ow.p.x, ow.p.y, ow.p.dir);   // l'arbre s'affiche ouvert
    await DW.fade(0, 0.3);
    DW.autosave();
  }

  // ------------------------------------------------------------ 2) dans l'arbre
  const room = DW.Palais.room('arbre_kuwagamon', 'foret', { name: 'Cœur du Grand Arbre', w: 20, h: 15,
    floor: { type: 'herring', cols: ['#6a4a2a', '#4a321c', '#2a1a0e'] }, wall: { base: '#5a3a22', alt: '#4a2e1a', pattern: 'stripes', wood: '#2a1a0e' },
    dark: { d: 0.4, col: '#2a1a10' },
    objects: [{ kind: 'glowshroom', x: 3, y: 4, w: 1, h: 1 }, { kind: 'glowshroom', x: 16, y: 5, w: 1, h: 1 }, { kind: 'glowshroom', x: 4, y: 11, w: 1, h: 1 },
      { kind: 'log', x: 14, y: 11, w: 1, h: 1 }, { kind: 'stump', x: 2, y: 8, w: 1, h: 1 }, { kind: 'mossrock', x: 17, y: 9, w: 1, h: 1 }] });
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
  room.npcs.push({ sp: 'kuwagamon', x: 9, y: 6, face: 'down', cond: s => !s.flags.kuwagamon, talk: fight });

  async function fight(ow) {
    const s = st();
    await say('BZZZZZZZZZ !!!', 'Kuwagamon');
    if (!s.party.some(m => m.hp > 0)) { await say("Ton partenaire n'est pas en état de se battre... Donne-lui de quoi se soigner (menu → OBJETS)."); return; }
    if ((await DW.ask('Affronter Kuwagamon ?')) !== 0) return;
    const res = await ow.battle({ enemy: new DW.Digimon('kuwagamon', 9), boss: true, canLose: true, intro: 'Kuwagamon fond sur vous, pinces grandes ouvertes !' });
    if (res !== 'win') return;
    s.flags.kuwagamon = true;
    await victory(ow);
  }

  // ------------------------------------------------------------ 3) la défaite de Kuwagamon (petite scène), puis chez Jijimon
  class KuwaDefeatScene extends DW.Scene {
    constructor() {
      super();
      this.bg = DW.World.battleBg('foret@deep');
      this.pts = Array.from({ length: 90 }, () => ({ x: 120 + Math.random() * 80, y: 60 + Math.random() * 110, v: 20 + Math.random() * 50, s: 1 + Math.random() * 2, c: Math.random() < 0.5 ? '#ff6a4a' : '#7af0d0' }));
    }
    update() { if (this.t > 5.2) this.close(); }
    draw(c) {
      const t = this.t, spr = DW.Sprites.battle('kuwagamon');
      c.drawImage(this.bg, 0, 0);
      c.fillStyle = `rgba(0,0,0,${Math.min(0.55, t * 0.2)})`; c.fillRect(0, 0, W, H);
      // 1) il vacille et clignote ; 2) il se désagrège en données qui s'envolent ; 3) éclair blanc
      const k = Math.max(0, Math.min(1, (t - 1.6) / 2.2)), shake = t < 1.6 ? Math.sin(t * 40) * 3 : 0;
      if (k < 1) {
        c.globalAlpha = 1 - k;
        const flash = t < 1.6 && Math.floor(t * 10) % 2;
        DW.Sprites.draw(c, spr, W / 2 + shake, 176 - k * 30, { frame: Math.floor(t * 4), white: flash ? 0.8 : 0 });
        c.globalAlpha = 1;
      }
      if (t > 1.6) for (const p of this.pts) {
        const tt = t - 1.6, y = p.y - tt * p.v, a = Math.max(0, 1 - tt / 3);
        c.globalAlpha = a; c.fillStyle = p.c; c.fillRect(Math.round(p.x + Math.sin(tt * 3 + p.y) * 6), Math.round(y), p.s, p.s);
      }
      c.globalAlpha = 1;
      if (t > 4.2) { c.fillStyle = `rgba(255,255,255,${Math.min(1, (t - 4.2) / 0.8)})`; c.fillRect(0, 0, W, H); }
      const cap = t < 1.6 ? 'Kuwagamon vacille...' : t < 4.2 ? 'Kuwagamon se désagrège en données...' : '';
      if (cap) { c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(0, H - 30, W, 20); UI.text(c, cap, W / 2, H - 16, { size: 9, align: 'center' }); }
    }
  }
  async function victory(ow) {
    const s = st(), pn = (s.party.find(m => m.hp > 0) || s.party[0]).name;
    Audio.sfx('super');
    await Game.push(new KuwaDefeatScene());
    await DW.fade(1, 0.01, '#ffffff'); await DW.fade(1, 0.8, '#000000');
    s.party.forEach(m => m.heal());
    ow.load('maison', 10, 8, 'up');
    await DW.wait(0.6);
    await DW.fade(0, 0.8);
    Audio.play('village');
    await say("Hohoho ! Te voilà ! Les petits Digimon de la clairière sont venus me prévenir en courant...", J);
    await say("Kuwagamon s'est envolé vers la montagne, et la Clairière de l'Arrivée est enfin calme ! Tu as été formidable, avec ton partenaire.", J);
    await say("On a eu chaud, hein ?", pn);
    await say("Tiens, prends ceci. Les Yokomon l'ont taillé pour toi dans une pince que Kuwagamon a perdue : un trophée !", J);
    DW.Trophies.give('kuwagamon'); Audio.sfx('fanfare');
    await say('Tu reçois le Trophée de Kuwagamon !');
    await say("Mets-le dans ta maison. Sous le plancher, il y a une vieille cave que je n'ai jamais ouverte : de quoi exposer tes trophées !", J);
    await say("Mais dis-moi... Kuwagamon n'était pas méchant autrefois. Il n'était pas lui-même. Je me demande ce qui lui est arrivé...", J);
    DW.autosave();
    await DW.Chapter.end1();
  }

  DW.Kuwa = { tree, fight, RIDDLE };
})();
