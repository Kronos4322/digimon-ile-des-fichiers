'use strict';
// =====================================================================
//  DÉBUT DE PARTIE, DANS LE JEU (épisode 1) — sur la carte de la Clairière de l'Arrivée
//  1) le héros atterrit dans l'herbe, seul ; il marche tout seul, cherche les autres, appelle... personne ;
//  2) un buisson remue : son bébé Digimon en sort, ils se parlent, il devient son partenaire (il le suit) ;
//  3) ils avancent ensemble ; une ombre passe : Kuwagamon survole la clairière, fait demi-tour et fond sur eux ;
//  4) le bébé crache ses bulles, ils s'enfuient vers la ville ; noir... réveil chez Jijimon.
//  Tout se joue avec le moteur du jeu (déplacements pas à pas, le partenaire qui suit, Kuwagamon qui vole
//  au-dessus de la carte : ow.flyers), le joueur ne contrôle rien pendant la scène.
// =====================================================================
(function () {
  const TS = 16;
  const say = (t, s) => DW.say(t, s);
  const wait = s => DW.wait(s);

  // le héros fait n pas dans une direction (s'arrête devant un obstacle)
  async function walk(ow, dir, n) {
    const D = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[dir];
    for (let i = 0; i < n; i++) {
      if (ow.solid(ow.p.x + D[0], ow.p.y + D[1])) { ow.p.dir = dir; break; }
      await ow.forceStep(dir);
    }
  }
  // un PNJ fait un pas (animation de marche du moteur)
  async function npcStep(ow, n, dir) {
    const D = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[dir];
    if (D[0]) n.face = D[0] > 0 ? 'right' : 'left';
    n.mv = { sx: n.x, sy: n.y, t: 0 }; n.x += D[0]; n.y += D[1];
    await wait(0.32);
  }
  // Kuwagamon qui vole au-dessus de la carte (coordonnées monde, en pixels) : déplacement en douceur
  const fly = (f, to, dur, ease) => DW.tween(f, to, dur, ease);

  async function run(ow) {
    const s = DW.state, baby = DW.heroLine().baby, bname = DW.SPECIES[baby].name;
    ow.wilds = []; ow.cine = true;   // (scène jouée : pas de jauges ni d'horloge à l'écran)
    await DW.fade(0, 1.2);
    DW.Audio.play('forest');
    ow.shake = 0.5; DW.Audio.sfx('hit');
    await wait(0.6);
    await say(`Aïe aïe aïe... Tu es ${DW.gn('tombé', 'tombée')} dans l'herbe, au milieu d'une clairière. Autour de toi, une forêt immense et inconnue.`);
    // 1) il cherche les autres
    await walk(ow, 'left', 3);
    await say(`« Ohé ! Il y a quelqu'un ?! Tai ? Sora ?... »`, s.name);
    await walk(ow, 'right', 6);
    ow.p.dir = 'up'; await wait(0.4);
    await say(`« Matt ? Izzy ?... Quelqu'un ?! »`, s.name);
    await walk(ow, 'down', 2);
    await say("Personne ne répond. Juste le vent dans les arbres... et des bruits étranges, tout autour.");
    await say(`Tu as peur. Tu es ${DW.gn('tout seul', 'toute seule')}.`);
    // 2) le bébé sort d'un buisson
    DW.Audio.sfx('swoosh');
    const bx = ow.p.x + 4, by = ow.p.y;
    const n = { sp: baby, x: bx, y: by, face: 'left', debut: true };
    ow.map.npcs.push(n);
    ow.rustle[bx + ',' + by] = 1;
    await wait(0.8);
    ow.p.dir = 'right';
    await npcStep(ow, n, 'left'); await npcStep(ow, n, 'left');
    DW.Audio.sfx('select');
    await say(`Coucou ! N'aie pas peur ! Je suis ${bname}... Je t'attendais !`, bname);
    await say(`Tu... tu m'attendais ? Moi, c'est ${s.name}.`, s.name);
    await say(`${s.name} ! Je savais qu'un humain viendrait. Je suis ton partenaire ! Viens, ne restons pas ici, la forêt n'est pas sûre...`, bname);
    // il devient le partenaire : il suit le héros
    ow.map.npcs.splice(ow.map.npcs.indexOf(n), 1);
    const m = new DW.Digimon(baby, 4); m.happy = 70; DW.addDigimon(m); s.flags.starter = baby;
    Object.assign(ow.f, { x: n.x, y: n.y, sx: n.x, sy: n.y, tx: n.x, ty: n.y, moving: false, face: 'left' });
    DW.Audio.sfx('fanfare');
    await say(`${bname} devient ton partenaire !`);
    // 3) ils avancent ensemble... Kuwagamon
    await walk(ow, 'down', 3);
    await walk(ow, 'left', 2);
    const hx = ow.p.x * TS + 8, hy = ow.p.y * TS;
    const K = { sp: 'kuwagamon', x: hx - 260, y: hy - 75, s: 0.55, sil: true, flip: false, shadow: 0.3 };   // (il file vers la droite)
    ow.flyers = [K];
    DW.Audio.sfx('roar');
    await say('BZZZZZZ... Un bourdonnement énorme fait trembler les feuilles.');
    await fly(K, { x: hx + 260, y: hy - 55 }, 2.2, DW.linear);   // (assez bas pour passer dans le champ de la caméra)
    await say("Une grande ombre rouge passe au-dessus de la clairière... puis fait demi-tour !");
    DW.Audio.play('boss');
    Object.assign(K, { flip: true, sil: false, s: 0.8 });   // (demi-tour : il fonce vers la gauche, sur vous)
    DW.Audio.sfx('swoosh');
    await fly(K, { x: hx + 70, y: hy + 6, s: 1 }, 1.2, t => t * t);
    ow.shake = 0.8; DW.Audio.sfx('hit');
    await say(`Un insecte géant aux pinces énormes ! C'est Kuwagamon ! Cours, ${s.name} !`, bname);
    DW.Audio.sfx('water');
    if (DW.Companion) DW.Companion.emote(ow, '!', 1.4);
    await say(`${bname} crache ses petites bulles de toutes ses forces... Kuwagamon, surpris, recule !`);
    // 4) la fuite, vers la ville
    fly(K, { x: hx + 140, y: hy - 60 }, 1.4);
    await walk(ow, 'left', 4);
    await walk(ow, 'down', 3);
    await say("Vous courez à perdre haleine, loin de la clairière... vers des toits, au loin.");
    await DW.fade(1, 1.0);
    ow.flyers = null; ow.cine = false;
    s.flags.kuwaChase = true;
    // réveil chez Jijimon (comme avant)
    await ow.charger('maison', 12, 5, 'down');
    DW.Audio.play('village');
    DW.fade(0, 0.8);   // (comme une partie normale : le réveil se fait sur l'image, sinon tout restait noir)
    await DW.Game.push(new DW.WakeScene());
    await DW.Story.opening();
    DW.autosave();
  }

  DW.Debut = { run, walk, npcStep };
})();
