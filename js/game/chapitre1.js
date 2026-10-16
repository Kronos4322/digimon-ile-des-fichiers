'use strict';
// =====================================================================
//  CHAPITRE 1 — « L'Île des Fichiers » : de l'arrivée jusqu'à la victoire contre Kuwagamon
//  - cartons de chapitre (ChapterScene) : au début de la partie et à la fin du chapitre
//  - visite guidée de Koromon : ta maison, le panneau de la ville, la route des Champs (nourriture)
//  - panneau devant la maison de Jijimon : ce qu'on trouve en ville et au jardin, mis à jour à chaque arrivée
//  (la bande-annonce est dans ui/intro.js, le réveil chez Jijimon dans game/guide.js, Kuwagamon dans maps/foret.js)
// =====================================================================
(function () {
  const { UI, Input, Audio, Game } = DW;
  const W = DW.W, H = DW.H;
  const say = (t, s) => DW.say(t, s);
  const st = () => DW.state;
  const K = 'Koromon';

  // ------------------------------------------------------------ carton de chapitre (écran noir, titre, sous-titre)
  class ChapterScene extends DW.Scene {
    constructor(top, title, sub) { super(); this.top = top; this.title = title; this.sub = sub || ''; }
    update() { if (this.t > 4.2 || (this.t > 1 && (Input.hit('ok') || Input.hit('back')))) this.close(); }
    draw(c) {
      const t = this.t, a = Math.max(0, Math.min(1, t / 0.6, (4.2 - t) / 0.6));
      c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
      // lignes de données qui montent, à peine visibles
      c.font = UI.font(8);
      for (let i = 0; i < 26; i++) { const x = (i * 37) % W, y = H - ((t * 40 + i * 53) % (H + 40)); c.fillStyle = `rgba(90,220,200,${0.12 * a})`; c.fillText(i % 2 ? '1' : '0', x, y); }
      c.globalAlpha = a;
      const k = Math.min(1, t / 0.9), w = 220 * DW.ease(k);
      c.fillStyle = '#5adcc8'; c.fillRect(W / 2 - w / 2, 106, w, 1); c.fillRect(W / 2 - w / 2, 150, w, 1);
      UI.text(c, this.top, W / 2, 98, { size: 9, align: 'center', color: '#5adcc8' });
      UI.text(c, this.title, W / 2, 134, { size: 18, align: 'center', color: '#ffffff' });
      if (this.sub) UI.text(c, this.sub, W / 2, 168, { size: 8, align: 'center', color: '#a8c8d8' });
      c.globalAlpha = 1;
    }
  }
  DW.ChapterScene = ChapterScene;

  // ------------------------------------------------------------ panneau de la ville (devant la maison de Jijimon)
  // le texte se met à jour à chaque nouvel habitant : ce qu'on trouve en ville et au jardin
  const BUILT = {
    gotsumon: 'le Bazar de Gotsumon (RAM, viandes, remèdes, sacs, meubles)', elecmon: 'le Dojo d\'Elecmon (entraînement plus efficace)',
    mushroomon: 'le Restaurant de Mushroomon (repas, recettes)', yokomon: 'le Jardin de Yokomon (la DigiFerme, où se reposent tes autres Digimon)',
    betamon: 'la fontaine de Betamon (elle soigne ton équipe)', biyomon: 'la Poste de Biyomon (vols rapides, nouvelles)',
    kunemon: 'la Banque de Kunemon (objets en trop)', palmon: 'la Grange de Palmon, aux Champs (récolte chaque jour)',
    gomamon: 'le ponton de Gomamon, aux Champs (pêche)',
  };
  async function townSign() {
    const T = DW.Town, here = T.RECRUITS.filter(r => T.has(r.id));
    await say(`VILLE DES FICHIERS — ${T.label()}.  Ici : la maison de Jijimon (repos, conseils) et ta maison, juste à l'est.`);
    const shops = here.map(r => BUILT[r.id]).filter(Boolean);
    await say(shops.length ? `En ville : ${shops.join(' ; ')}.` : "Les boutiques sont vides : leurs habitants sont partis. Retrouve-les sur l'île et ramène-les ici !");
    const others = here.filter(r => !BUILT[r.id]).length;
    if (others) await say(`${others} autre${others > 1 ? 's' : ''} habitant${others > 1 ? 's' : ''} ${others > 1 ? 'tiennent' : 'tient'} un stand en ville ou aux Champs : leur enseigne dit ce qu'ils proposent.`);
    await say("Au sud-ouest : le Quartier des Champs (la Digiviande de Tanemon, chaque jour).  Au sud : le Terrain d'entraînement.  À l'ouest : la plage, puis la forêt.");
  }

  // ------------------------------------------------------------ visite guidée de Koromon (premier échange)
  const villageSpot = (find, dy = 1) => {
    const m = DW.getMap('village'), d = find(m);
    return d ? [d.x, d.y + dy] : null;
  };
  async function goTo(ow, p, face = 'up') {
    if (!p) return;
    await DW.fade(1, 0.3);
    ow.load('village', p[0], p[1], face);
    ow.banner.t = 99;
    // Koromon suit, juste à côté du héros (pas sur la case de son partenaire)
    const k = (ow.map.npcs || []).find(n => n.sp === 'koromon' && !n.story);
    if (k) for (const [dx, dy] of [[1, 0], [-1, 0], [1, 1], [-1, 1]]) if (!ow.solid(p[0] + dx, p[1] + dy) && !(ow.f.x === p[0] + dx && ow.f.y === p[1] + dy)) { Object.assign(k, { x: p[0] + dx, y: p[1] + dy, hx: null, hy: null, home: [p[0] + dx, p[1] + dy], face: dx > 0 ? 'left' : 'right' }); break; }
    await DW.wait(0.2);
    await DW.fade(0, 0.3);
  }
  async function tour(ow) {
    const s = st();
    await say("Ko-ko ! C'est toi, l'humain que Jijimon a trouvé à l'entrée de la ville ? Moi c'est Koromon ! Je suis resté en ville quand tous les autres sont partis.", K);
    if ((await DW.ask('Je te fais visiter ?', ['Oui !', 'Plus tard'], K)) !== 0) { await say('D\'accord ! Reviens me voir quand tu veux, je ne bouge pas de la place.', K); return; }
    // 1) ta maison
    await goTo(ow, DW.HOME_DOOR ? [DW.HOME_DOOR.x, DW.HOME_DOOR.y + 2] : null);
    await say("Voilà ta maison ! Bon... c'est une cabane qui tombe en ruine. Mais elle est à toi : un lit pour dormir quand ton partenaire a sommeil, et un coffre. Plus tu la meubles, plus elle sera belle !", K);
    await say("Ton sac est petit : quand il est plein, tu ne ramasses plus rien ! Range tes affaires dans le coffre. Plus tard, le Bazar vendra des meubles : un frigo pour la nourriture, et bien d'autres choses.", K);
    // 2) le panneau de la ville, devant chez Jijimon
    await goTo(ow, villageSpot(m => (m.doors || []).find(d => d.to === 'maison'), 2));
    await say("Ici, c'est chez Jijimon. Le grand panneau à droite de sa maison explique tout ce qu'on trouve en ville. Chaque fois que quelqu'un revient habiter ici, une nouvelle note y est épinglée !", K);
    // 3) la route des Champs : la nourriture
    await goTo(ow, DW.MapKit.zpt('village', 5, 23), 'down');   // en haut du chemin des Champs
    await say("Par là, au sud-ouest : le Quartier des Champs. Tanemon y fait pousser de la Digiviande ! Quand ton partenaire a faim, va le voir : il t'en donne 3 par jour.", K);
    await say("Et pour la soif, il y a de l'eau partout : la rivière, l'étang... Mais pas l'eau de mer, hein ! Pour te soigner, le distributeur de la place vend des RAM, en attendant que le Bazar rouvre.", K);
    await say("Au sud, il y a le Terrain d'entraînement : c'est là que ton partenaire devient plus fort. À l'ouest, la plage... et au-delà, la forêt.", K);
    await say("Ton partenaire est encore un bébé : commence par les DUNES, à l'ouest de la plage. Les Digimon y sont tout petits. Ensuite le Bosquet des Pousses, puis la forêt !", K);
    await say("Les habitants sont partis vers la forêt, je crois. Si tu en croises un, parle-lui : il se souviendra peut-être de la ville !", K);
    // retour devant la maison de Jijimon, avec ton partenaire
    await goTo(ow, villageSpot(m => (m.doors || []).find(d => d.to === 'maison'), 2), 'down');
    await say("Voilà, tu sais tout ! Moi, je reste sur la place. Reviens me voir si tu te perds. Bonne chance !", K);
    s.flags.tour = true;
    DW.autosave();
  }

  // ------------------------------------------------------------ bilan de fin de chapitre (écran de récapitulatif)
  class RecapScene extends DW.Scene {
    constructor(lines, title) { super(); this.lines = lines; this.title = title; }
    update() { if (this.t > 1.2 && (Input.hit('ok') || Input.hit('back'))) this.close(); }
    draw(c) {
      const t = this.t;
      c.fillStyle = '#04101e'; c.fillRect(0, 0, W, H);
      c.strokeStyle = 'rgba(90,220,200,0.12)';
      for (let x = (t * 10) % 16; x < W; x += 16) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); }
      UI.text(c, this.title, W / 2, 30, { size: 14, align: 'center', color: '#5adcc8' });
      c.fillStyle = '#5adcc8'; c.fillRect(40, 38, W - 80, 1);
      const m = st().party[0];
      if (m) DW.Sprites.draw(c, DW.Sprites.battle(m.sp), 54, 150, { frame: Math.floor(t * 4), scale: Math.min(1, 70 / DW.Sprites.battle(m.sp).h) });
      // Tai et Agumon, délivrés pendant ce chapitre
      if ((st().kids || {}).tai) {
        // (côte à côte, au-dessus de « ESPACE : continuer »)
        const hs = DW.Sprites.hero('down', Math.floor(t * 3) % 2 ? 0 : 2, 'tai'); c.drawImage(hs.img, 26, 162, hs.w * 1.4, hs.h * 1.4);
        DW.Sprites.draw(c, DW.Sprites.battle('agumon'), 84, 206, { frame: Math.floor(t * 4) + 1, scale: 0.55 });
      }
      this.lines.forEach(([k, v], i) => {
        const a = DW.clamp((t - 0.3 - i * 0.25) / 0.3, 0, 1);
        c.globalAlpha = a;
        UI.text(c, k, 124, 58 + i * 16, { size: 8, color: '#a8c8d8' });
        UI.text(c, v, W - 20, 58 + i * 16, { size: 9, align: 'right', color: '#ffffff' });
        c.globalAlpha = 1;
      });
      if (t > 1.2) UI.text(c, 'ESPACE : continuer', W / 2, H - 14, { size: 8, align: 'center', color: '#ffe070' });
    }
  }
  DW.RecapScene = RecapScene;

  // ------------------------------------------------------------ fin du chapitre 1 (après Kuwagamon)
  async function end1() {
    const s = st();
    if (s.flags.chapter >= 2) return;
    s.flags.chapter = 2;
    Audio.play('victory');
    await DW.wait(0.8);
    await Game.push(new ChapterScene('FIN DU CHAPITRE 1', "L'Île des Fichiers", s.kids && s.kids.tai ? 'Tai et Greymon sont libres. Mais où sont les autres enfants ?' : 'Shellmon est vaincu. Mais pourquoi les Digimon ont-ils tout oublié ?'));
    // le bilan : temps, partenaire, ville, combats, boss facultatifs
    const m = s.party[0], T = DW.Town, rec = T.RECRUITS.filter(r => T.has(r.id)).length;
    const days = Math.floor(s.clock / 1440) + 1, wins = s.party.reduce((a, d) => a + (d.wins || 0), 0);
    const tm = Math.floor((s.time || 0) / 60), hm = `${Math.floor(tm / 60)} h ${String(tm % 60).padStart(2, '0')}`;
    await Game.push(new RecapScene([
      ['Jours passés sur l\'île', String(days)],
      ['Temps de jeu', hm],
      ['Partenaire', m ? `${m.name} · N.${m.level}` : '-'],
      ['Habitants revenus en ville', `${rec} / ${T.RECRUITS.length}`],
      ['Développement de la ville', `${T.progress()} %`],
      ['Combats gagnés', String(wins)],
      ['Kuwagamon', s.flags.kuwagamon ? 'vaincu !' : '-'],
      ['Shellmon', s.flags.shellmon ? 'vaincu !' : 'toujours sur la plage...'],
      ['Album de l\'île', `${DW.Cards ? DW.Cards.ch1Count() : 0} / ${DW.Cards ? DW.Cards.CH1.length : 12} cartes`],
      ['Bits', String(s.bits)],
    ], 'BILAN DU CHAPITRE 1'));
    await say("Les chemins de toute l'île sont ouverts : la montagne, le lac, les brumes, le marais... Chaque région cache un Digimon qui a perdu la mémoire.", 'Jijimon');
    await say("Retrouve-les, ramène les habitants en ville, et découvre qui leur a fait ça. Moi, je garde la maison. Hohoho !", 'Jijimon');
    await say("Ah, et une bonne nouvelle : Leomon vient d'ouvrir le GYMNASE, au Terrain d'entraînement. Il y endurcit les Digimon contre les éléments : le feu, l'eau, la glace... Va le voir !", 'Jijimon');
    await Game.push(new ChapterScene('CHAPITRE 2', 'Le Lac et le Loup', 'Un serpent de mer garde le lac... et un garçon blond a été vu sur ses rives.'));
    DW.autosave();
  }

  // ------------------------------------------------------------ zones ouvertes pendant le chapitre 1
  // La ville, la plage et la forêt (dont le Sentier et le Village des Bébés, où vit Elecmon) ; tout le reste
  // ouvre après Kuwagamon. Renvoie le message de blocage, ou null si la carte est accessible.
  const CH1 = new Set(['village', 'foret', 'plage']), CH1_CLOSED = new Set(['crique']);
  function lock(to) {
    if ((st().flags.chapter || 1) >= 2 || !DW.MAPS[to]) return null;   // (ouvert à la fin du chapitre 1 : après Shellmon)
    const m = DW.MAPS[to];
    if (CH1.has(m.region) && !CH1_CLOSED.has(to)) return null;
    return "Un étrange voile de données bloque le passage... Il est apparu en même temps que les monstres de la forêt et de la plage. Il faut d'abord rétablir le calme sur cette partie de l'île.";
  }

  // ------------------------------------------------------------ « Précédemment... » (au chargement d'une partie)
  function objective() {
    const s = st(), f = s.flags;
    if (!f.starter) return 'Ton bébé Digimon t\'attend sur la place de la ville.';
    if (!f.kuwagamon) return 'Kuwagamon, le monstre rouge, se cache dans le Grand Arbre de la Clairière de l\'Arrivée. Entraîne ton Digimon avant de l\'affronter : des mots gravés dans l\'écorce gardent l\'entrée.';
    if (!f.shellLair) return 'Kuwagamon est vaincu. Sur la plage, les cabines téléphoniques murmurent chacune un mot... Dans le bon ordre, c\'est un appel au secours.';
    if (!(s.kids || {}).tai && s.hero !== 'tai') return 'Le sable s\'est ouvert sous les cabines. Tout au fond de l\'antre, Shellmon retient un enfant prisonnier.';
    return 'Tai est libre et vit chez toi. On raconte qu\'un garçon blond a été vu près du grand lac...';
  }
  async function previously() {
    const s = st(), m = s.party[0];
    await say(`PRÉCÉDEMMENT... Jour ${Math.floor(s.clock / 1440) + 1}.${m ? ` ${m.name} (${m.d.stage}, niveau ${m.level}) est à tes côtés.` : ''}`);
    await say(objective());
  }

  DW.Chapter = { ChapterScene, townSign, tour, end1, lock, objective, previously };
})();
