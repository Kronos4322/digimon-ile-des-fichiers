'use strict';
// =====================================================================
//  L'ANTRE DE SHELLMON — boss final du chapitre 1 (épisode 2 de l'animé : les cabines de la plage)
//  1) après Kuwagamon, chaque cabine de la plage murmure un mot ; écoutées dans le bon ordre (« Aide-moi,
//     je suis sous le sable »), elles font s'ouvrir le sable : on descend dans l'antre ;
//  2) trois salles de combat sous la plage, aux Digimon de plus en plus forts ;
//  3) au fond, Shellmon garde Tai et Agumon prisonniers. À la moitié de ses PV, Tai est libéré :
//     Agumon digivolue en Greymon et combat à tes côtés (allié automatique, game/arena.js et battle.js) ;
//  4) victoire : trophée de Shellmon (cave de ta maison), Tai s'installe dans sa chambre chez toi,
//     fin du chapitre 1. Ensuite Shellmon reste là : on peut le réaffronter pour l'expérience.
// =====================================================================
(function () {
  const MAPS = DW.MAPS, P = DW.Palais;
  const say = (t, s) => DW.say(t, s);
  const st = () => DW.state;
  const perso = () => st().hero !== 'tai';   // (anciennes parties où l'on incarne Tai : pas de prisonnier)

  // ------------------------------------------------------------ 1) l'énigme des cabines
  // les 6 cabines (de gauche à droite) murmurent chacune un mot ; l'ordre de la phrase ouvre le passage
  const WORDS = ['sable', 'Aide-moi', 'sous', 'je', 'le', 'suis'];
  const ORDER = [1, 3, 5, 2, 4, 0];   // « Aide-moi, je suis sous le sable »
  async function booth(ow, i) {
    const s = st(), f = s.flags;
    if (f.shellLair) {
      if ((await DW.ask("Le sable s'est effondré sous les cabines : un passage descend dans le noir. Descendre ?")) !== 0) return;
      DW.Audio.sfx('swoosh'); await DW.fade(1, 0.4);
      ow.load('antre1', 10, 12, 'up'); await DW.fade(0, 0.4);
      return;
    }
    DW.Audio.sfx('ring');
    await say('Driiing ! La cabine sonne...');
    if ((await DW.ask('Décrocher ?')) !== 0) return;
    await say(`Une petite voix lointaine murmure un seul mot : « ... ${WORDS[i]} ... »`);
    const pos = f.boothPos || 0;
    if (ORDER[pos] === i) f.boothPos = pos + 1; else f.boothPos = ORDER[0] === i ? 1 : 0;
    if (f.boothPos < ORDER.length) return;
    // la phrase est complète : le sable s'ouvre
    f.shellLair = true; f.boothPos = 0;
    await say(perso() ? "« Aide-moi, je suis sous le sable ! » Toutes les cabines sonnent ensemble, puis se taisent..." : 'Toutes les cabines sonnent ensemble, puis se taisent...');
    DW.Audio.sfx('roar'); ow.shake = 1.4;
    await say("Le sable tremble... et s'effondre sous les cabines ! Un passage s'ouvre vers les profondeurs.");
    DW.autosave();
  }

  // ------------------------------------------------------------ 2) les salles de l'antre
  // un temple ensablé sous la plage (inspiré du temple de Pharaomon, Digimon World 2003) : grès, piliers, braseros, gravures
  const floor = { type: 'stone', cols: ['#e0c890', '#c8a868', '#8a6a3a'] }, wall = { base: '#d8b878', alt: '#c4a060', pattern: 'brick', wood: '#7a5a2a' };
  const dark = { d: 0.4, col: '#0e1a24' };
  const deco = (x, y, kind, v = 0) => ({ kind, v, x, y, w: 1, h: 1, small: true });
  // piliers gravés le long des murs, braseros aux portes, fresques au mur du fond
  const temple = (extra = []) => [
    { kind: 'monolith', v: 0, x: 3, y: 4, w: 1, h: 1 }, { kind: 'monolith', v: 0, x: 16, y: 4, w: 1, h: 1 },
    { kind: 'monolith', v: 0, x: 3, y: 10, w: 1, h: 1 }, { kind: 'monolith', v: 0, x: 16, y: 10, w: 1, h: 1 },
    { kind: 'brazier', v: 0, x: 1, y: 6, w: 1, h: 1, small: true }, { kind: 'brazier', v: 0, x: 18, y: 6, w: 1, h: 1, small: true },
    { kind: 'torch', v: 0, x: 6, y: 1, w: 1, h: 1, back: true, oy: 4 }, { kind: 'torch', v: 0, x: 13, y: 1, w: 1, h: 1, back: true, oy: 4 },
    ...extra];
  P.room('antre1', 'plage', { name: 'Antre de Shellmon — Galerie de sable', w: 20, h: 15, dark, floor, wall, music: 'cave',
    enc: [{ sp: 'bukamon', min: 10, max: 11, w: 30 }, { sp: 'betamon', min: 10, max: 12, w: 40 }, { sp: 'gotsumon', min: 11, max: 12, w: 20 }],
    objects: temple([deco(6, 11, 'sacks')]) });
  P.room('antre2', 'plage', { name: 'Antre de Shellmon — Grotte des marées', w: 20, h: 15, dark, floor, wall, music: 'cave',
    enc: [{ sp: 'betamon', min: 12, max: 13, w: 40 }, { sp: 'gotsumon', min: 12, max: 13, w: 30 }, { sp: 'kunemon', min: 12, max: 14, w: 20 }],
    objects: temple([deco(12, 11, 'crates')]) });
  P.room('antre3', 'plage', { name: 'Antre de Shellmon — Couloir des coquillages', w: 20, h: 15, dark, floor, wall, music: 'cave',
    enc: [{ sp: 'betamon', min: 14, max: 15, w: 40 }, { sp: 'gotsumon', min: 14, max: 15, w: 30 }, { sp: 'mushroomon', min: 14, max: 15, w: 20 }],
    objects: temple() });
  const lair = P.room('antre_shellmon', 'plage', { name: 'Antre de Shellmon — La grande coquille', w: 20, h: 15, dark: { d: 0.5, col: '#0a1420' }, floor, wall, music: 'cave',
    objects: temple([{ kind: 'totem', v: 0, x: 9, y: 1, w: 2, h: 1, back: true, oy: 2 }]) });
  MAPS.antre1.signs['6,2'] = MAPS.antre1.signs['13,2'] = "Une fresque gravée dans le grès : un coquillage géant enroulé autour d'une pyramide... et des enfants qui tombent du ciel.";
  MAPS.antre2.signs['6,2'] = MAPS.antre2.signs['13,2'] = "Une fresque : un petit Digimon orange, entouré de flammes, grandit jusqu'à devenir un dinosaure immense.";
  P.side('antre1', 'antre2'); P.side('antre2', 'antre3'); P.side('antre3', 'antre_shellmon');
  // sortie de la première salle : retour sur la plage, devant les cabines
  { const e = P.entrance('antre1'), [tx, ty] = DW.MapKit.zpt('plage', 18, 27); MAPS.antre1.warps[MAPS.antre1.warps.length - 1] = { x: e.x, y: e.y + 1, w: 2, h: 1, dir: 'down', to: 'plage', tx, ty }; }
  // un repos avant le boss : une flaque d'eau claire dans la troisième salle
  MAPS.antre3.signs['10,3'] = async () => { DW.Audio.sfx('water'); DW.state.party.forEach(m => { if (m.hp > 0) { m.hp = Math.min(m.maxHp, m.hp + Math.ceil(m.maxHp * 0.25)); m.mp = Math.min(m.maxMp, m.mp + Math.ceil(m.maxMp * 0.25)); } }); await say("Une source d'eau claire suinte de la roche. Ton équipe boit et reprend un peu de forces (PV et PM +25 %)."); };
  MAPS.antre3.objects.push({ kind: 'spring', x: 10, y: 3, w: 1, h: 1, small: true });

  // ------------------------------------------------------------ 3) Shellmon, Tai et Agumon
  lair.npcs.push(
    { sp: 'shellmon', x: 9, y: 6, face: 'down', talk: ow => fight(ow) },
    { hero: 'tai', x: 14, y: 4, face: 'down', cond: s => perso() && !(s.kids || {}).tai, talk: () => say("À l'aide ! Ce gros coquillage nous retient depuis qu'on est tombés sur l'île... Agumon n'a plus de forces !", 'Tai') },
    { sp: 'agumon', x: 15, y: 4, face: 'left', cond: s => perso() && !(s.kids || {}).tai, talk: () => say('Tai... j\'ai faim... Je ne peux plus rien faire...', 'Agumon') },
  );
  async function fight(ow) {
    const s = st(), first = !s.flags.shellmon;
    if (!s.party.some(m => m.hp > 0)) { await say("Ton partenaire n'est pas en état de se battre... Soigne-le d'abord."); return; }
    await say(first ? 'GRRRAAAH ! Personne ne touche à mes prisonniers !' : 'Encore toi ?! Cette fois, je vais t\'écraser !', 'Shellmon');
    if ((await DW.ask(first ? 'Affronter Shellmon ? (un Champion très puissant)' : 'Affronter Shellmon de nouveau ?')) !== 0) return;
    // premier combat : niveau 16, Tai et Greymon arrivent à mi-vie ; ensuite il suit ton niveau (de l'expérience à volonté)
    const top = Math.max(...s.party.map(m => m.level || 1));
    const lvl = first ? 16 : Math.min(60, Math.max(16, top + 1));
    const ally = first && perso() ? { at: 0.5, from: 'agumon', sp: 'greymon', lvl: 16, hero: 'tai', name: 'Tai', move: 'mega_flamme',
      join: "CRAC ! Le coquillage qui retenait Tai se fend ! « Agumon, on s'y met aussi ! »" } : null;
    const res = await ow.battle({ enemy: new DW.Digimon('shellmon', lvl), boss: true, canLose: true, ally, intro: 'Shellmon déploie ses tentacules !' });
    if (res !== 'win') { await say(first ? 'Shellmon est bien trop fort... Entraîne-toi, digivolue, et reviens délivrer Tai !' : 'Shellmon retourne se tapir dans sa coquille...'); return; }
    if (!first) { s.bits += 30 * lvl; await say(`Shellmon s'enfonce dans le sable en grommelant. (+${30 * lvl} Bits)`); return; }
    s.flags.shellmon = true;
    if (perso()) {
      await say("Shellmon s'effondre dans un grand nuage de sable !");
      await say("On a réussi ! Merci ! Sans toi, on y serait encore. Moi c'est Tai !", 'Tai');
      await say(`${s.name} ? Tu étais au camp, toi aussi ! Alors on est tous tombés sur l'île... Les autres doivent être quelque part.`, 'Tai');
      await say("Je peux venir chez toi ? Agumon et moi, on n'a nulle part où aller. Et dès que tu entends parler de Matt ou des autres, préviens-moi !", 'Tai');
      DW.Crests.freeKid('tai');
      DW.Audio.sfx('fanfare');
      await say('Tai et Agumon sont délivrés ! Ils s\'installent dans une chambre de ta maison.');
    }
    DW.Trophies.give('shellmon'); DW.Audio.sfx('fanfare');
    await say('Tu reçois le Trophée de Shellmon ! (Il rejoint la cave de ta maison.)');
    const extra = DW.giveItem('soin_m', 3) + DW.giveItem('pm_m', 2); s.bits += 800;
    await say(`Dans la coquille vide, tu trouves 3 RAM PV+, 2 RAM PM+ et 800 Bits !${DW.extraMsg(extra)}`);
    await say('(Shellmon reviendra hanter son antre : tu pourras l\'y affronter de nouveau pour t\'entraîner.)');
    DW.autosave();
    await DW.Chapter.end1();
  }

  // ------------------------------------------------------------ arène du combat : la grande coquille
  DW.ArenaScene.FIELDS.antre = () => {
    const W = 36, H = 24, CX = W / 2, CY = H / 2 + 0.5, RX = 15.5, RY = 9.6, rows = [];
    for (let y = 0; y < H; y++) { let r = ''; for (let x = 0; x < W; x++) { const d = Math.hypot((x + 0.5 - CX) / RX, (y + 0.5 - CY) / RY); r += d >= 1 ? 'C' : DW.Art.hash(x, y, 91) < 0.06 ? '3' : 's'; } rows.push(r); }
    const objects = [{ kind: 'tidepool', x: 6, y: 7, w: 2, h: 1, small: true }, { kind: 'tidepool', x: 28, y: 15, w: 2, h: 1, small: true }, { kind: 'driftwood', x: 26, y: 6, w: 2, h: 1, small: true }, { kind: 'driftwood', x: 8, y: 16, w: 2, h: 1, small: true }];
    return { name: 'La grande coquille', rows, w: W, h: H, theme: 'beach', climate: 'beach', ambient: 'beach', bg: 'plage', indoor: true, lush: false, dense: false,
      dark: { d: 0.35, col: '#0a1420' }, npcs: [], warps: [], triggers: [], objects };
  };
  // les combats de la grande coquille se déroulent dans cette arène
  const battle0 = DW.Overworld.prototype.battle;
  DW.Overworld.prototype.battle = function (o) { if (this.mapId === 'antre_shellmon' && o && o.enemy && o.enemy.sp === 'shellmon' && !o.field) o = { ...o, field: 'antre' }; return battle0.call(this, o); };

  DW.Antre = { booth, fight, WORDS, ORDER };
})();
