'use strict';
// =====================================================================
//  ACTIVITÉS (comme dans Digimon World 1)
//  - TOURNOIS au Colisée des Scarabées : 4 coupes (Junior, Disciple, Champion, Ultime), 3 manches,
//    une fois par jour et par coupe ; trophées, Bits et cartes à gagner.
//  - CURLING dans la Plaine des Bonshommes (Terre Gelée) : 3 lancers, viser le centre.
//  - CHASSE AU TRÉSOR dans les Rails Abandonnés (Tunnel Foreur) : 6 coups de pioche, indices chaud / froid.
//  - PÊCHE au Ponton des Pêcheurs (Lac du Tramway) : ferrer au bon moment, 3 fois par jour.
//  - CARTES DIGIMON : paquets de 3 cartes (Bazar, prix des activités), album à compléter (Menu → ALBUM).
//  Chaque activité est un panneau posé près du carrefour de sa sous-zone (map.activity).
// =====================================================================
(function () {
  const { UI, Input, Audio, Game } = DW;
  const W = DW.W, H = DW.H;
  const say = (t, s) => DW.say(t, s);
  const day = () => Math.floor(DW.state.clock / 1440);
  const once = (key, n = 1) => { const f = DW.state.flags, k = 'act_' + key; if (!f[k] || f[k].d !== day()) f[k] = { d: day(), n: 0 }; return f[k].n < n ? f[k] : null; };
  const reward = (id, n = 1) => { const extra = DW.giveItem(id, n); Audio.sfx('buy'); return `${DW.ITEMS[id].name}${n > 1 ? ' ×' + n : ''}${DW.extraMsg(extra)}`; };

  // ------------------------------------------------------------ cartes Digimon
  const RAR = { 'Bébé': 30, 'Entraînement': 26, 'Disciple': 20, 'Champion': 12, 'Ultime': 5, 'Méga': 1.5 };
  const Cards = DW.Cards = {
    all: () => DW.DEX_ORDER.filter(sp => DW.SPECIES[sp]),
    draw() { return DW.weighted(Cards.all().map(sp => ({ sp, w: RAR[DW.SPECIES[sp].stage] || 10 }))).sp; },
    async openPack() {
      const st = DW.state; st.cards = st.cards || {};
      const got = [Cards.draw(), Cards.draw(), Cards.draw()];
      got.forEach(sp => (st.cards[sp] = (st.cards[sp] || 0) + 1));
      await Game.push(new PackScene(got));
    },
    count: () => Object.keys(DW.state.cards || {}).length,
  };
  function card(c, sp, x, y, w, h, owned, t, glow) {
    const d = DW.SPECIES[sp], stage = d.stage, col = { 'Bébé': '#c8d8e8', 'Entraînement': '#b8e0b0', 'Disciple': '#e8d890', 'Champion': '#f0b070', 'Ultime': '#e88ac8', 'Méga': '#ffd040' }[stage] || '#ccc';
    c.fillStyle = '#0a0e18'; c.fillRect(x + 1, y + 1, w, h);
    c.fillStyle = owned ? col : '#2a3040'; c.fillRect(x, y, w, h);
    c.fillStyle = owned ? '#10203a' : '#1a1e28'; c.fillRect(x + 2, y + 2, w - 4, h - 12);
    if (glow) { c.fillStyle = `rgba(255,255,255,${0.15 + 0.1 * Math.sin(t * 6)})`; c.fillRect(x + 2, y + 2, w - 4, h - 12); }
    const spr = DW.Sprites.battle(sp), k = Math.min((w - 6) / spr.w, (h - 16) / spr.h, 1);
    DW.Sprites.draw(c, spr, x + w / 2, y + h - 12, { scale: k, silhouette: !owned, frame: 0 });
    UI.text(c, owned ? d.name : '???', x + w / 2, y + h - 3, { size: 6, align: 'center', color: '#1a1a2a', shadow: false });
  }
  class PackScene extends DW.Scene {
    constructor(list) { super(); this.list = list; this.flip = { v: 0 }; }
    enter() { Audio.sfx('evolve'); DW.tween(this.flip, { v: 3 }, 1.6, DW.linear); }
    update() { if (this.flip.v >= 3 && Input.hit('ok')) this.close(); }
    draw(c) {
      UI.menuBg(c, this.t, 'PAQUET DE CARTES');
      this.list.forEach((sp, i) => {
        const x = 34 + i * 88, y = 50, shown = this.flip.v > i + 0.5;
        if (shown) card(c, sp, x, y, 76, 104, true, this.t, true);
        else { c.fillStyle = '#3a6ad8'; c.fillRect(x, y, 76, 104); c.fillStyle = '#f0c030'; c.fillRect(x + 8, y + 8, 60, 88); c.fillStyle = '#3a6ad8'; UI.text(c, 'DIGIMON', x + 38, y + 56, { size: 10, align: 'center', color: '#3a6ad8', shadow: false }); }
      });
      UI.box(c, 14, 174, 292, 50);
      UI.text(c, this.flip.v >= 3 ? `Tu obtiens 3 cartes ! Album : ${Cards.count()} / ${Cards.all().length}` : 'On ouvre le paquet...', 24, 194, { size: 10 });
      if (this.flip.v >= 3) UI.text(c, 'ESPACE', 296, 216, { size: 7, align: 'right', color: '#9ab0e8' });
    }
  }
  class AlbumScene extends DW.Scene {
    constructor() { super(); this.i = 0; this.page = 0; }
    get list() { return Cards.all(); }
    update() {
      const n = this.list.length;
      if (Input.hit('left')) { this.i = (this.i + n - 1) % n; Audio.sfx('move'); }
      if (Input.hit('right')) { this.i = (this.i + 1) % n; Audio.sfx('move'); }
      if (Input.hit('up')) { this.i = Math.max(0, this.i - 6); Audio.sfx('move'); }
      if (Input.hit('down')) { this.i = Math.min(n - 1, this.i + 6); Audio.sfx('move'); }
      if (Input.hit('back') || Input.hit('ok')) { Audio.sfx('back'); this.close(); }
    }
    draw(c) {
      const st = DW.state, cards = st.cards || {}, L = this.list, page = Math.floor(this.i / 12);
      UI.menuBg(c, this.t, 'ALBUM DE CARTES');
      UI.text(c, `${Cards.count()} / ${L.length}`, W - 12, 17, { size: 9, align: 'right', color: '#ffe070' });
      L.slice(page * 12, page * 12 + 12).forEach((sp, j) => {
        const x = 12 + (j % 6) * 50, y = 28 + Math.floor(j / 6) * 72, idx = page * 12 + j;
        card(c, sp, x, y, 46, 66, !!cards[sp], this.t, idx === this.i);
        if (idx === this.i) { c.strokeStyle = '#ffffff'; c.lineWidth = 1.5; c.strokeRect(x - 1, y - 1, 48, 68); }
        if (cards[sp] > 1) UI.text(c, `×${cards[sp]}`, x + 44, y + 9, { size: 6, align: 'right', color: '#ffe070' });
      });
      const sp = L[this.i], d = DW.SPECIES[sp], own = !!cards[sp];
      UI.box(c, 6, 176, W - 12, 58);
      UI.text(c, own ? `${d.name} — ${d.stage}` : '??? (carte manquante)', 14, 192, { size: 9, color: '#ffe070' });
      UI.wrap(c, own ? d.desc : 'Gagne des paquets de cartes (Bazar de Gotsumon, tournois, curling, chasse au trésor) pour la trouver.', 290, 8).slice(0, 3).forEach((l, j) => UI.text(c, l, 14, 205 + j * 10, { size: 8, color: '#c8f0ff' }));
      UI.text(c, `Page ${page + 1} / ${Math.ceil(L.length / 12)}`, W - 12, 231, { size: 6, align: 'right', color: '#7a8ab8', shadow: false });
    }
  }
  DW.AlbumScene = AlbumScene;

  // ------------------------------------------------------------ tournois
  const CUPS = [
    { name: 'Coupe Junior', stages: ['Bébé', 'Entraînement'], lv: [4, 6, 8], prize: 150 },
    { name: 'Coupe Disciple', stages: ['Disciple'], lv: [10, 13, 16], prize: 400 },
    { name: 'Coupe Champion', stages: ['Champion'], lv: [20, 24, 28], prize: 1000 },
    { name: 'Coupe Ultime', stages: ['Ultime'], lv: [34, 38, 42], prize: 2500 },
  ];
  const ORDER = ['Bébé', 'Entraînement', 'Disciple', 'Champion', 'Ultime', 'Méga'];
  async function tournament() {
    const st = DW.state, m = st.party[0];
    await say("Bienvenue au Colisée des Scarabées ! Ici se tiennent les grands tournois de l'île. Trois combats d'affilée, sans fuite possible !");
    if (!m) { await say("Il te faut un partenaire Digimon pour t'inscrire !"); return; }
    const maxStage = Math.max(...st.party.map(p => ORDER.indexOf(p.d.stage)));
    const names = CUPS.map(cu => `${cu.name}${(st.flags.cups || {})[cu.name] ? ' ★' : ''}`).concat(['Annuler']);
    const r = await DW.choose(names, { y: 30 });
    if (r < 0 || r >= CUPS.length) return;
    const cup = CUPS[r];
    if (ORDER.indexOf(cup.stages[0]) > maxStage) { await say(`Ton équipe n'est pas encore assez évoluée pour la ${cup.name}.`); return; }
    if (!once('cup_' + r)) { await say(`La ${cup.name} a déjà eu lieu aujourd'hui. Reviens demain !`); return; }
    once('cup_' + r).n++;
    const pool = Object.keys(DW.SPECIES).filter(sp => cup.stages.includes(DW.SPECIES[sp].stage) && !DW.SPECIES[sp].npc);
    for (let i = 0; i < 3; i++) {
      const enemy = new DW.Digimon(DW.pick(pool), cup.lv[i]);
      const res = await DW.ow.battle({ enemy, boss: true, canLose: true, music: 'battle', intro: `${cup.name} — manche ${i + 1} / 3 : ${enemy.name} entre dans l'arène !` });
      if (res !== 'win') { await say(`Éliminé à la manche ${i + 1}... Entraîne-toi et reviens tenter ta chance !`); st.party.forEach(p => { if (p.hp <= 0) p.hp = 1; }); return; }
      if (i < 2) await say(`Victoire ! Manche ${i + 2} : tiens-toi prêt !`);
    }
    Audio.sfx('fanfare');
    st.flags.cups = st.flags.cups || {}; const first = !st.flags.cups[cup.name]; st.flags.cups[cup.name] = true;
    st.bits += cup.prize;
    await say(`Tu remportes la ${cup.name} ! ${first ? 'Un trophée rejoint ta collection ! ' : ''}Prix : ${cup.prize} Bits et ${reward('cartes', first ? 3 : 1)} !`);
    st.party.forEach(p => p.addHappy(5));
  }

  // ------------------------------------------------------------ curling
  class CurlingScene extends DW.Scene {
    constructor() { super(); this.throws = []; this.phase = 'aim'; this.pw = 0; this.dir = 1; this.stone = null; this.score = 0; }
    update(dt) {
      if (this.phase === 'aim') {
        this.pw += this.dir * dt * 1.4; if (this.pw > 1) { this.pw = 1; this.dir = -1; } if (this.pw < 0) { this.pw = 0; this.dir = 1; }
        if (Input.hit('ok')) { this.stone = { x: 160, y: 214, v: 140 + this.pw * 230, drift: (Math.random() - 0.5) * 18 }; this.phase = 'slide'; Audio.sfx('swoosh'); }
      } else if (this.phase === 'slide') {
        const s = this.stone; s.y -= s.v * dt; s.x += s.drift * dt; s.v = Math.max(0, s.v - 243 * dt); // freinage réglé : la zone verte de la jauge mène au centre
        if (s.v <= 0 || s.y < 6) {
          const d = Math.hypot(s.x - 160, s.y - 46), pts = s.y < 6 ? 0 : d < 8 ? 10 : d < 18 ? 6 : d < 30 ? 3 : d < 42 ? 1 : 0;
          this.throws.push({ x: s.x, y: s.y, pts }); this.score += pts; Audio.sfx(pts >= 6 ? 'levelup' : pts ? 'select' : 'bump');
          this.stone = null; this.phase = this.throws.length >= 3 ? 'done' : 'aim';
        }
      } else if (Input.hit('ok')) this.close(this.score);
    }
    draw(c) {
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#d8eefc'); g.addColorStop(1, '#f4fbff');
      c.fillStyle = '#5a7a9a'; c.fillRect(0, 0, W, H);
      c.fillStyle = g; c.fillRect(110, 0, 100, H);
      for (const [r, col] of [[42, '#3a6ad8'], [30, '#ffffff'], [18, '#d83a3a'], [8, '#ffffff']]) { c.fillStyle = col; c.beginPath(); c.ellipse(160, 46, r, r * 0.9, 0, 0, 7); c.fill(); }
      c.strokeStyle = 'rgba(120,160,200,0.4)'; for (let y = 0; y < H; y += 12) { c.beginPath(); c.moveTo(112, y); c.lineTo(208, y + 4); c.stroke(); }
      const stone = (x, y, col) => { c.fillStyle = '#2a2a34'; c.beginPath(); c.ellipse(x, y + 1, 6, 4.4, 0, 0, 7); c.fill(); c.fillStyle = col; c.beginPath(); c.ellipse(x, y - 1, 5.4, 4, 0, 0, 7); c.fill(); c.fillStyle = '#f0f0f0'; c.fillRect(x - 1, y - 4, 2, 3); };
      this.throws.forEach(t => stone(t.x, t.y, '#e0c040'));
      if (this.stone) stone(this.stone.x, this.stone.y, '#e0c040'); else if (this.phase === 'aim') stone(160, 214, '#e0c040');
      UI.box(c, 4, 4, 100, 40); UI.text(c, 'CURLING', 54, 18, { size: 9, align: 'center', color: '#ffe070' }); UI.text(c, `Score : ${this.score}`, 54, 34, { size: 9, align: 'center' });
      UI.box(c, 216, 4, 100, 40); UI.text(c, `Lancer ${Math.min(3, this.throws.length + 1)} / 3`, 266, 18, { size: 8, align: 'center' }); UI.text(c, 'Centre = 10 pts', 266, 32, { size: 7, align: 'center', color: '#8ae0f0' });
      if (this.phase === 'aim') {
        UI.box(c, 216, 170, 100, 60); UI.text(c, 'PUISSANCE', 266, 184, { size: 7, align: 'center', color: '#8ae0f0' });
        c.fillStyle = '#10141e'; c.fillRect(226, 192, 80, 10); c.fillStyle = this.pw > 0.55 && this.pw < 0.72 ? '#5aff8a' : '#ffd040'; c.fillRect(226, 192, 80 * this.pw, 10);
        c.strokeStyle = '#5aff8a'; c.strokeRect(226 + 80 * 0.55, 191, 80 * 0.17, 12);
        UI.text(c, 'ESPACE : lancer', 266, 222, { size: 7, align: 'center' });
      }
      if (this.phase === 'done') { UI.box(c, 60, 96, 200, 48); UI.text(c, `Total : ${this.score} points !`, 160, 116, { size: 11, align: 'center', color: '#ffe070' }); UI.text(c, 'ESPACE', 160, 134, { size: 7, align: 'center' }); }
    }
  }
  async function curling() {
    await say("Bienvenue au curling de la Terre Gelée ! Fais glisser la pierre jusqu'au centre de la cible. Trois lancers !");
    if (!once('curling')) { await say("La piste doit regeler... Reviens demain !"); return; }
    once('curling').n++;
    const s = await Game.push(new CurlingScene());
    const prize = s >= 24 ? reward('cartes', 2) : s >= 14 ? reward('super_viande') : s >= 6 ? reward('viande', 2) : null;
    await say(prize ? `${s} points ! Bravo, tu gagnes : ${prize} !` : `${s} points... La glace est traîtresse. Retente ta chance demain !`);
  }

  // ------------------------------------------------------------ chasse au trésor
  class DigScene extends DW.Scene {
    constructor() {
      super(); this.cols = 6; this.rows = 4; this.cur = 0; this.left = 6; this.found = []; this.dug = {};
      const cells = [...Array(24).keys()].sort(() => Math.random() - 0.5);
      this.tre = cells.slice(0, 3).map((k, i) => ({ k, id: [DW.pick(['gland_or', 'cartes', 'puce_pv']), DW.pick(['reveil', 'soin_m', 'pm_m']), DW.pick(['super_viande', 'digipomme', 'pomme_bleue'])][i] }));
      this.msg = 'Choisis où creuser ! (6 coups de pioche)';
    }
    update() {
      if (this.left <= 0 || this.found.length === 3) { if (Input.hit('ok')) this.close(this.found); return; }
      const c = this.cols;
      if (Input.hit('left')) this.cur = (this.cur + 23) % 24; if (Input.hit('right')) this.cur = (this.cur + 1) % 24;
      if (Input.hit('up')) this.cur = (this.cur + 24 - c) % 24; if (Input.hit('down')) this.cur = (this.cur + c) % 24;
      if (Input.hit('ok') && !this.dug[this.cur]) {
        this.dug[this.cur] = true; this.left--; Audio.sfx('hit');
        const t = this.tre.find(t => t.k === this.cur && !t.got);
        if (t) { t.got = true; this.found.push(t.id); this.msg = `Trésor ! ${DW.ITEMS[t.id].name} !`; Audio.sfx('buy'); }
        else {
          const x = this.cur % c, y = Math.floor(this.cur / c);
          const d = Math.min(...this.tre.filter(t => !t.got).map(t => Math.abs(t.k % c - x) + Math.abs(Math.floor(t.k / c) - y)));
          this.msg = d <= 1 ? 'Brûlant ! Un trésor est tout près !' : d <= 2 ? 'Chaud...' : d <= 3 ? 'Tiède.' : 'Froid. Rien par ici.';
        }
        if (this.left <= 0 || this.found.length === 3) this.msg += '  (ESPACE)';
      }
    }
    draw(c) {
      c.fillStyle = '#1e1814'; c.fillRect(0, 0, W, H);
      UI.box(c, 4, 4, W - 8, 22); UI.text(c, `CHASSE AU TRÉSOR — Coups restants : ${this.left}   Trouvés : ${this.found.length} / 3`, 12, 18, { size: 8 });
      for (let k = 0; k < 24; k++) {
        const x = 40 + (k % this.cols) * 40, y = 34 + Math.floor(k / this.cols) * 36, dug = this.dug[k];
        c.fillStyle = dug ? '#3a2a20' : ['#6a5a4a', '#7a6a58', '#5e5040'][k % 3]; c.fillRect(x, y, 36, 32);
        c.fillStyle = 'rgba(255,255,255,0.12)'; if (!dug) c.fillRect(x + 3, y + 3, 14, 4);
        const t = this.tre.find(t => t.k === k && t.got);
        if (t) c.drawImage(DW.Icons.item(t.id), x + 10, y + 8, 16, 16);
        else if (dug) { c.fillStyle = '#120c08'; c.beginPath(); c.ellipse(x + 18, y + 18, 9, 6, 0, 0, 7); c.fill(); }
        if (k === this.cur) { c.strokeStyle = '#ffe070'; c.lineWidth = 2; c.strokeRect(x - 1, y - 1, 38, 34); }
      }
      UI.box(c, 6, 186, W - 12, 46); UI.text(c, this.msg, 16, 210, { size: 10, color: '#ffe070' });
    }
  }
  async function treasure() {
    await say("Un vieux panneau : « Galerie de la chasse au trésor. Creusez, et vous trouverez ! » Des outils de mineur traînent ici.");
    if (!once('dig')) { await say("Tu as déjà fouillé la galerie aujourd'hui. La roche doit se reposer !"); return; }
    once('dig').n++;
    const got = await Game.push(new DigScene());
    for (const id of got) DW.giveItem(id, 1);
    await say(got.length ? `Tu ramènes : ${got.map(id => DW.ITEMS[id].name).join(', ')} !` : "Rien du tout... Les trésors sont bien cachés !");
  }

  // ------------------------------------------------------------ pêche
  class FishScene extends DW.Scene {
    constructor() { super(); this.wait = 1.2 + Math.random() * 2.8; this.bite = 0; this.res = null; }
    update(dt) {
      if (this.res) { if (Input.hit('ok')) this.close(this.res); return; }
      if (this.bite > 0) { this.bite -= dt; if (Input.hit('ok')) { this.res = 'catch'; Audio.sfx('buy'); } else if (this.bite <= 0) { this.res = 'miss'; Audio.sfx('back'); } return; }
      if (Input.hit('ok')) { this.res = 'early'; Audio.sfx('bump'); return; }
      this.wait -= dt; if (this.wait <= 0) { this.bite = 0.55; Audio.sfx('select'); }
    }
    draw(c) {
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#5ab0e0'); g.addColorStop(1, '#1a4a8a');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      for (let i = 0; i < 12; i++) { c.fillStyle = 'rgba(255,255,255,0.25)'; c.fillRect((i * 37 + this.t * 10) % W, 40 + (i * 23) % 150, 10, 1); }
      const bob = this.bite > 0 ? Math.sin(this.t * 40) * 4 : Math.sin(this.t * 2) * 1.5;
      c.strokeStyle = '#2a2a2a'; c.beginPath(); c.moveTo(40, 0); c.quadraticCurveTo(120, 40, 160, 120 + bob); c.stroke();
      c.fillStyle = '#e04a3a'; c.beginPath(); c.arc(160, 120 + bob, 4, Math.PI, 0); c.fill(); c.fillStyle = '#ffffff'; c.beginPath(); c.arc(160, 120 + bob, 4, 0, Math.PI); c.fill();
      if (this.bite > 0) UI.text(c, '!', 172, 108, { size: 18, color: '#ffe040', bold: true });
      UI.box(c, 6, 190, W - 12, 42);
      const t = this.res === 'catch' ? 'Ferré ! Quelque chose a mordu !' : this.res === 'miss' ? 'Trop tard... Le poisson s\'est enfui.' : this.res === 'early' ? 'Trop tôt ! Tu as fait fuir les poissons.' : 'Attends que ça morde... puis ESPACE !';
      UI.text(c, t, 16, 214, { size: 10, color: this.res === 'catch' ? '#ffe070' : '#ffffff' });
    }
  }
  async function fishing() {
    await say('Un ponton de pêche. Une vieille canne est posée là, prête à servir.');
    if (!once('fish', 3)) { await say('Les poissons ne mordent plus pour aujourd\'hui. Reviens demain !'); return; }
    once('fish', 3).n++;
    const r = await Game.push(new FishScene());
    if (r !== 'catch') return;
    const x = Math.random();
    const prize = x < 0.02 ? reward('digibar') : x < 0.06 ? reward('truite_noire') : x < 0.12 ? reward('digisilure') : x < 0.3 ? reward('digitruite') : x < 0.6 ? reward('digivivaneau') : reward('digianchois', 2);
    await say(`Tu remontes : ${prize} !`);
  }

  // ------------------------------------------------------------ installation dans les sous-zones
  const ACT = { scarabees9: { run: tournament, name: 'tournoi' }, gel3: { run: curling, name: 'curling' }, tunnel2: { run: treasure, name: 'trésor' }, lac3: { run: fishing, name: 'pêche' } };
  for (const id in ACT) if (DW.MAPS[id]) DW.MAPS[id].activity = ACT[id];
  DW.Activities = { tournament, curling, treasure, fishing, scenes: { PackScene, CurlingScene, DigScene, FishScene } };
})();
