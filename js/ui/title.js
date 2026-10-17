'use strict';
// =====================================================================
//  ÉCRAN TITRE
//  1) démarrage du Digivice (pluie de données, barre de chargement, éclair)
//  2) panorama de l'Île des Fichiers au crépuscule, en couches (parallaxe) :
//     ciel, nuages, Montagne de l'Infini, ville et moulin, mer scintillante,
//     héros et partenaire au premier plan, oiseaux, Birdramon, données qui montent
//  3) logo qui arrive avec un choc lumineux, reflet qui balaie l'écusson
//  4) menu qui glisse ; transition « numérique » en cases de données
// =====================================================================
(function () {
  const { UI, Input, Audio, Game } = DW;
  const W = DW.W, H = DW.H;
  const HZ = 152; // ligne d'horizon (mer)

  // ------------------------------------------------------------ couches du décor (rendues une fois)
  const cache = {};
  const layer = (k, fn) => cache[k] || (cache[k] = fn());
  const cv = () => DW.Art.canvas(W, H);

  // ciel du crépuscule, étoiles, soleil
  const skyLayer = () => layer('sky', () => {
    const Art = DW.Art, c0 = cv(), c = c0.getContext('2d');
    const sky = ['#0e0a30', '#1c1448', '#34195e', '#5a2270', '#8a2e78', '#c04a78', '#ee6e6e', '#ff9a68', '#ffc27a', '#ffe0a0'].map(Art.hex);
    const id = c.createImageData(W, HZ), d = id.data;
    for (let y = 0; y < HZ; y++) for (let x = 0; x < W; x++) {
      const k = Math.pow(y / HZ, 1.15) * (sky.length - 1) + Art.bayer(x, y) * 0.9;
      let col = sky[DW.clamp(Math.round(k), 0, sky.length - 1)];
      if (y < 60 && Art.hash(x, y, 5) < 0.004) col = Art.mix(col, [255, 255, 255], 0.8);
      const i = (y * W + x) * 4; d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = 255;
    }
    c.putImageData(id, 0, 0);
    const sx = 236, sy = HZ - 6;
    const g = c.createRadialGradient(sx, sy, 4, sx, sy, 110);
    g.addColorStop(0, 'rgba(255,244,200,0.95)'); g.addColorStop(0.18, 'rgba(255,210,150,0.5)'); g.addColorStop(1, 'rgba(255,160,120,0)');
    c.fillStyle = g; c.fillRect(0, 0, W, HZ);
    c.fillStyle = '#fff4cc'; c.beginPath(); c.arc(sx, HZ, 19, Math.PI, 0); c.fill();
    return c0;
  });
  // Montagne de l'Infini et relief de l'île (silhouettes violettes avec liseré doré)
  const islandLayer = () => layer('island', () => {
    const Art = DW.Art, c0 = cv(), c = c0.getContext('2d');
    const ridge = [];
    for (let x = 0; x <= W; x += 2) {
      const m = Math.max(0, 1 - Math.abs(x - 108) / 64);
      const hill = Math.max(0, 1 - Math.abs(x - 200) / 80) * 20 + Math.max(0, 1 - Math.abs(x - 40) / 40) * 10;
      ridge.push([x, HZ - 10 - Math.pow(m, 1.5) * 70 - hill - Art.noise(x * 0.08, 1, 4) * 6]);
    }
    c.fillStyle = '#2c1c48';
    c.beginPath(); c.moveTo(0, HZ); ridge.forEach(([x, y]) => c.lineTo(x, y)); c.lineTo(W, HZ); c.fill();
    // côté éclairé par le soleil couchant
    c.fillStyle = 'rgba(255,170,120,0.35)';
    ridge.forEach(([x, y], i) => { const n = ridge[i + 1]; if (n && n[1] < y) return; if (x > 108) c.fillRect(x, Math.round(y), 2, 2); });
    // neige au sommet
    c.fillStyle = '#e8d8f0';
    ridge.forEach(([x, y]) => { if (y < HZ - 64) c.fillRect(x, Math.round(y), 2, Math.round((HZ - 64 - y) * 0.6) + 1); });
    // forêt (arbres teintés)
    const tree = Art.tint(DW.World.obj('tree', 0).img, '#1e1438'), oak = Art.tint(DW.World.obj('tree', 3).img, '#22163e');
    for (let x = -10; x < W; x += 9) { const t = (x / 9) % 3 ? tree : oak, y = HZ - 14 + Art.hash(x, 1, 7) * 6; c.drawImage(t, x, y - 22, 20, 26); }
    // la Ville des Fichiers (silhouettes + fenêtres)
    c.fillStyle = '#1a1030';
    c.fillRect(150, HZ - 16, 14, 10); c.beginPath(); c.moveTo(146, HZ - 15); c.lineTo(157, HZ - 25); c.lineTo(168, HZ - 15); c.fill();
    c.fillRect(172, HZ - 13, 10, 8); c.beginPath(); c.moveTo(169, HZ - 12); c.lineTo(177, HZ - 19); c.lineTo(185, HZ - 12); c.fill();
    c.beginPath(); c.ellipse(195, HZ - 14, 8, 6, 0, Math.PI, 0); c.fill(); c.fillRect(191, HZ - 14, 8, 8);
    c.fillRect(126, HZ - 12, 12, 7);
    return c0;
  });
  // mer (fond) : dégradé violet-orangé
  const seaLayer = () => layer('sea', () => {
    const Art = DW.Art, c0 = cv(), c = c0.getContext('2d');
    const sea = ['#f08a72', '#c05a7a', '#7a3474', '#4a2266', '#2a1650'].map(Art.hex);
    const id = c.createImageData(W, H - HZ), d = id.data;
    for (let y = 0; y < H - HZ; y++) for (let x = 0; x < W; x++) {
      const k = y / (H - HZ);
      let col = sea[DW.clamp(Math.round(k * 5 + Art.bayer(x, y) * 0.8 - 0.4), 0, 4)];
      if (Math.sin(x * 0.11 + y * 0.9 + Art.noise(x * 0.05, y * 0.2, 3) * 6) > 0.94) col = Art.mix(col, [255, 210, 170], 0.3);
      const i = (y * W + x) * 4; d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = 255;
    }
    c.putImageData(id, 0, HZ);
    return c0;
  });
  // premier plan : falaise herbeuse et palmiers
  const frontLayer = () => layer('front', () => {
    const Art = DW.Art, c0 = cv(), c = c0.getContext('2d');
    c.fillStyle = '#1a0e26';
    c.beginPath(); c.moveTo(0, 196);
    for (let x = 0; x <= W; x += 4) c.lineTo(x, 190 + Math.sin(x * 0.02) * 6 + Art.noise(x * 0.1, 3, 9) * 6 + (x > 200 ? (x - 200) * 0.05 : 0));
    c.lineTo(W, H); c.lineTo(0, H); c.fill();
    c.fillStyle = '#2c1838';
    for (let x = 0; x <= W; x += 3) { const y = 190 + Math.sin(x * 0.02) * 6 + Art.noise(x * 0.1, 3, 9) * 6 + (x > 200 ? (x - 200) * 0.05 : 0); c.fillRect(x, Math.round(y) - 1, 2, 2); if (Art.hash(x, 2, 3) < 0.35) c.fillRect(x, Math.round(y) - 4, 1, 3); }
    return c0;
  });
  const palms = () => layer('palms', () => [DW.Art.tint(DW.World.obj('palm', 0).img, '#160a22'), DW.Art.tint(DW.World.obj('palm', 1).img, '#160a22')]);
  const millFrames = () => layer('mill', () => DW.World.objFrames('windmill', 1).map(f => DW.Art.tint(f.img, '#1a1030')));
  const birdramon = () => layer('bird', () => DW.Art.tint(DW.Sprites.battle('birdramon').img, '#2a1438'));

  // ------------------------------------------------------------ logo (écusson style Digimon World)
  function logo() {
    return layer('logo', () => {
      const LW = 280, LH = 100, c0 = DW.Art.canvas(LW, LH), c = c0.getContext('2d');
      const cx = LW / 2, cy = 50;
      const shield = (pad, fill, stroke, lw) => {
        c.beginPath();
        c.moveTo(cx - 118 + pad, cy - 18 + pad * 0.3);
        c.quadraticCurveTo(cx - 70, cy - 34 + pad, cx, cy - 46 + pad);
        c.quadraticCurveTo(cx + 70, cy - 34 + pad, cx + 118 - pad, cy - 18 + pad * 0.3);
        c.lineTo(cx + 118 - pad, cy + 18 - pad * 0.3);
        c.quadraticCurveTo(cx + 70, cy + 34 - pad, cx, cy + 46 - pad);
        c.quadraticCurveTo(cx - 70, cy + 34 - pad, cx - 118 + pad, cy + 18 - pad * 0.3);
        c.closePath();
        if (fill) { c.fillStyle = fill; c.fill(); }
        if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw; c.stroke(); }
      };
      shield(0, '#0a1440', '#050a20', 3);
      shield(3, null, '#f0c030', 2.4);
      const g = c.createLinearGradient(0, cy - 40, 0, cy + 40);
      g.addColorStop(0, '#3a7ae8'); g.addColorStop(0.5, '#1a3aa8'); g.addColorStop(1, '#0c1a66');
      shield(6, g, '#7ab0ff', 1);
      c.fillStyle = '#f0c030';
      c.beginPath(); c.ellipse(cx, cy - 33, 38, 8, 0, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.ellipse(cx, cy + 33, 44, 8, 0, 0, Math.PI * 2); c.fill();
      c.font = '7px "Press Start 2P", monospace'; c.textAlign = 'center'; c.fillStyle = '#1a2a6a';
      c.fillText('DIGITAL', cx, cy - 29.5); c.fillText('MONSTERS', cx, cy + 36.5);
      c.font = '26px "Press Start 2P", monospace'; c.lineJoin = 'round';
      c.lineWidth = 8; c.strokeStyle = '#06102e'; c.strokeText('DIGIMON', cx, cy + 13);
      c.lineWidth = 4; c.strokeStyle = '#2a5ad8'; c.strokeText('DIGIMON', cx, cy + 13);
      const tg = c.createLinearGradient(0, cy - 12, 0, cy + 14);
      tg.addColorStop(0, '#fff6a0'); tg.addColorStop(0.45, '#ffd030'); tg.addColorStop(0.55, '#f0a018'); tg.addColorStop(1, '#ffcf40');
      c.fillStyle = tg; c.fillText('DIGIMON', cx, cy + 13);
      c.fillStyle = 'rgba(255,255,255,0.45)'; c.fillRect(cx - 104, cy - 1, 208, 1.5);
      return c0;
    });
  }
  // reflet qui balaie le logo (limité à la forme du logo)
  const shineCv = DW.Art.canvas(280, 100), shineCtx = shineCv.getContext('2d');
  function logoShine(k) {
    const L = logo(), c = shineCtx;
    c.clearRect(0, 0, 280, 100);
    c.drawImage(L, 0, 0);
    c.globalCompositeOperation = 'source-atop';
    const x = -60 + k * 400, g = c.createLinearGradient(x - 30, 0, x + 30, 100);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.7)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.fillRect(0, 0, 280, 100);
    c.globalCompositeOperation = 'source-over';
    return shineCv;
  }

  // ------------------------------------------------------------ Digivice (démarrage)
  function digivice(c, x, y, k, t) {
    c.save(); c.translate(x, y);
    c.globalAlpha = Math.min(1, k * 2);
    c.fillStyle = '#e8ecf4'; c.strokeStyle = '#8ab0ff'; c.lineWidth = 2;
    const r = (x0, y0, w, h, rr) => { c.beginPath(); c.moveTo(x0 + rr, y0); c.arcTo(x0 + w, y0, x0 + w, y0 + h, rr); c.arcTo(x0 + w, y0 + h, x0, y0 + h, rr); c.arcTo(x0, y0 + h, x0, y0, rr); c.arcTo(x0, y0, x0 + w, y0, rr); c.closePath(); };
    r(-26, -34, 52, 68, 14); c.fill(); c.stroke();
    c.fillStyle = '#1a2a3a'; r(-17, -24, 34, 28, 4); c.fill();
    // écran : onde qui s'allume
    c.strokeStyle = `rgba(90,255,160,${0.6 + 0.4 * Math.sin(t * 10)})`; c.lineWidth = 1.2; c.beginPath();
    for (let i = 0; i <= 30; i++) { const xx = -15 + i; c.lineTo(xx, -10 + Math.sin(i * 0.6 + t * 12) * 6 * k); }
    c.stroke();
    c.fillStyle = '#4a7ae8'; c.beginPath(); c.arc(0, 18, 6, 0, 7); c.fill();
    c.fillStyle = '#c8d4e8'; c.fillRect(-20, 12, 6, 4); c.fillRect(14, 12, 6, 4);
    c.restore();
  }

  DW.drawDigivice = digivice;

  // ------------------------------------------------------------ choix d'un des 3 emplacements de sauvegarde
  class SlotScene extends DW.Scene {
    constructor(mode) {
      super(); this.overlay = true; this.mode = mode; this.info = [1, 2, 3].map(n => DW.saveInfo(n)); this.i = Math.max(0, this.info.findIndex(x => (mode === 'load' ? !!x : !x)));
      // pour reprendre : chaque emplacement peut avoir plusieurs versions (◀ ▶)
      this.vars = [1, 2, 3].map(n => (DW.saveVariants ? DW.saveVariants(n) : [])); this.vi = [0, 0, 0];
      if (mode === 'load') this.vars.forEach((V, k) => { if (!this.info[k] && V.length) this.info[k] = V[0].info; });
    }
    update() {
      if (Input.hit('up')) { this.i = (this.i + 2) % 3; Audio.sfx('move'); }
      if (Input.hit('down')) { this.i = (this.i + 1) % 3; Audio.sfx('move'); }
      const V = this.vars[this.i];
      if (this.mode === 'load' && V.length > 1 && (Input.hit('left') || Input.hit('right'))) { this.vi[this.i] = (this.vi[this.i] + (Input.hit('left') ? V.length - 1 : 1)) % V.length; this.info[this.i] = V[this.vi[this.i]].info; Audio.sfx('move'); }
      if (Input.hit('back')) { Audio.sfx('back'); this.close(-1); return; }
      if (Input.hit('ok')) {
        if (this.mode === 'load' && !this.info[this.i]) { Audio.sfx('bump'); return; }
        if (this.mode === 'load' && V.length && V[this.vi[this.i]].kind !== 'actuelle') DW.restoreVariant(this.i + 1, V[this.vi[this.i]].kind);
        Audio.sfx('select'); this.close(this.i + 1);
      }
    }
    draw(c) {
      c.fillStyle = 'rgba(0,8,20,0.82)'; c.fillRect(0, 0, W, H);
      UI.box(c, 40, 16, W - 80, 20, 'dwsel');
      UI.text(c, this.mode === 'load' ? 'CONTINUER — choisis ta partie' : 'NOUVELLE PARTIE — choisis un emplacement', W / 2, 30, { size: 9, align: 'center' });
      this.info.forEach((o, k) => {
        const y = 46 + k * 56, on = k === this.i;
        UI.box(c, 24, y, W - 48, 50, on ? 'dwsel' : 'dw');
        UI.text(c, `Emplacement ${k + 1}`, 34, y + 14, { size: 8, color: '#8ae0f0' });
        if (!o) { UI.text(c, '— vide —', W / 2, y + 32, { size: 9, align: 'center', color: '#7a8ab8' }); return; }
        if (o.partner) { const sp = DW.Sprites.battle(o.partner); DW.Sprites.draw(c, sp, 60, y + 46, { scale: Math.min(1, 30 / sp.h, 34 / sp.w), frame: on ? Math.floor(this.t * 4) : 0 }); }
        UI.text(c, o.name, 90, y + 28, { size: 10, color: '#ffe070' });
        UI.text(c, `${o.partner ? DW.SPECIES[o.partner].name + ' N.' + o.level : ''}   Jour ${o.day}   ${Math.floor(o.time / 3600)} h ${String(Math.floor(o.time / 60) % 60).padStart(2, '0')}`, 90, y + 41, { size: 7, color: '#c8f0ff' });
        UI.text(c, UI.fit(c, o.place, 110, 7).s, W - 34, y + 14, { size: 7, align: 'right', color: '#c8f0ff' });
        const V = this.vars[k];
        if (this.mode === 'load' && V.length > 1) UI.text(c, `${on ? '◀ ' : ''}${V[this.vi[k]].label}${on ? ' ▶' : ''}`, W - 34, y + 28, { size: 7, align: 'right', color: V[this.vi[k]].kind === 'actuelle' ? '#9ab0e8' : '#ffb070' });
      });
      UI.hints(c, [['ok', 'choisir'], ['back', 'retour']], W - 12, H - 8);
    }
  }
  DW.SlotScene = SlotScene;

  // ------------------------------------------------------------ scène
  class TitleScene extends DW.Scene {
    constructor() {
      super();
      this.phase = 'boot'; this.started = false; this.info = [1, 2, 3].map(n => DW.saveInfo(n)).filter(Boolean).sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0))[0] || null; this.i = this.info ? 1 : 0;   // la partie la plus récente (3 emplacements)
      this.rain = Array.from({ length: 34 }, (_, i) => ({ x: i * 10 + 3, y: Math.random() * -H, s: 60 + Math.random() * 90, n: 6 + Math.floor(Math.random() * 10) }));
      this.motes = Array.from({ length: 26 }, () => this.mote(true));
      this.birds = Array.from({ length: 5 }, (_, i) => ({ x: Math.random() * W, y: 30 + Math.random() * 50, v: 8 + Math.random() * 8, ph: Math.random() * 6 }));
      this.boot = { v: 0 }; this.logoIn = { v: 0 }; this.menuIn = { v: 0 }; this.flashA = 0; this.wipe = null;
      this.bootT = 0;
    }
    mote(init) { return { x: 60 + Math.random() * 200, y: init ? HZ - Math.random() * 100 : HZ - 6, v: 6 + Math.random() * 10, ph: Math.random() * 6, ch: Math.random() < 0.5 ? '0' : '1' }; }
    get opts() { return this.info ? ['NOUVELLE PARTIE', 'CONTINUER'] : ['NOUVELLE PARTIE']; }
    toTitle() {
      if (this.phase !== 'boot') return;
      this.phase = 'press'; this.flashA = 1; Audio.sfx('evolve');
      DW.tween(this.logoIn, { v: 1 }, 0.7);
    }
    update(dt) {
      if (this.phase === 'boot') {
        this.bootT += dt;
        if (this.bootT > 2.6 || Input.hit('ok')) this.toTitle();
        return;
      }
      if (this.wipe) return;
      if (this.phase === 'press') {
        if (Input.hit('ok') && this.logoIn.v > 0.6) { this.phase = 'menu'; Audio.sfx('select'); Audio.play('title'); DW.tween(this.menuIn, { v: 1 }, 0.45); }
        return;
      }
      const n = this.opts.length;
      if (Input.hit('up')) { this.i = (this.i + n - 1) % n; Audio.sfx('move'); }
      if (Input.hit('down')) { this.i = (this.i + 1) % n; Audio.sfx('move'); }
      if (Input.hit('ok') && !this.busy) this.choose(this.i === 1);
    }
    // NOUVELLE PARTIE demande confirmation si une partie existe ; CONTINUER ne lance jamais
    // une nouvelle partie en silence quand la sauvegarde est illisible
    async choose(cont) {
      this.busy = true;
      try {
        // choix de l'emplacement (3 sauvegardes)
        const slot = await Game.push(new SlotScene(cont ? 'load' : 'new'));
        if (!(slot >= 1)) return;
        const had = DW.saveInfo(slot);
        DW.slot = slot;
        if (cont && !DW.load()) {
          Audio.sfx('back');
          await DW.say('Impossible de lire la sauvegarde... Elle est conservée telle quelle : rien n\'a été effacé.');
          return;
        }
        if (!cont && had && (await DW.ask(`L'emplacement ${slot} contient déjà une partie (${had.name}). Elle sera remplacée dès ta prochaine sauvegarde. Commencer quand même ?`, ['Non', 'Oui'])) !== 1) return;
        Audio.sfx('evolve');
        this.wipe = { t: 0, done: () => {
          if (cont) {
            DW.fade(1, 0.01).then(() => {
              DW.startGame(false);
              if (DW.loadNote && DW.ow) { const note = DW.loadNote; DW.ow.runScript(() => DW.say(note)); }
              // retour après une longue pause (plus de 6 h réelles) : « Précédemment... »
              else if (DW.ow && DW.Chapter && DW.Chapter.previously && Date.now() - (DW.state.savedAt || 0) > 6 * 3600 * 1000) DW.ow.runScript(() => DW.Chapter.previously());
            });
            return;
          }
          if (had) DW.archiveSave(slot);   // l'ancienne partie est mise de côté (récupérable depuis « Continuer »)
          DW.state = DW.newState();
          DW.fade(1, 0.01).then(() => { Game.replaceAll(new DW.IntroScene()); DW.fade(0, 0.6); });
        } };
      } finally { this.busy = false; }
    }
    tick(dt) {
      const t = this.t;
      this.rain.forEach(r => { r.y += r.s * dt; if (r.y > H + 60) { r.y = -Math.random() * 80; r.s = 60 + Math.random() * 90; } });
      this.motes.forEach((m, i) => { m.y -= m.v * dt; m.x += Math.sin(t + m.ph) * 4 * dt; if (m.y < 20) this.motes[i] = this.mote(false); });
      this.birds.forEach(b => { b.x += b.v * dt; if (b.x > W + 10) { b.x = -10; b.y = 30 + Math.random() * 50; } });
      if (this.flashA > 0) this.flashA -= dt * 1.8;
      if (this.wipe) { this.wipe.t += dt; if (this.wipe.t > 1.25 && this.wipe.done) { const d = this.wipe.done; this.wipe.done = null; d(); } }
    }
    // ---------------------------------------------------------- dessin
    drawBoot(c) {
      const t = this.t, k = Math.min(1, this.bootT / 1.6);
      c.fillStyle = '#020806'; c.fillRect(0, 0, W, H);
      c.font = UI.font(8); c.textAlign = 'center';
      this.rain.forEach(r => {
        for (let j = 0; j < r.n; j++) {
          const y = r.y - j * 9; if (y < -8 || y > H + 8) continue;
          c.fillStyle = j === 0 ? 'rgba(220,255,230,0.9)' : `rgba(60,255,120,${0.5 - j * 0.04})`;
          c.fillText(((r.x * 7 + j * 3 + Math.floor(t * 8)) % 3) ? '0' : '1', r.x, y);
        }
      });
      c.fillStyle = 'rgba(2,8,6,0.55)'; c.fillRect(0, 0, W, H);
      digivice(c, W / 2, 96, k, t);
      UI.text(c, 'INITIALISATION DU DIGIVICE...', W / 2, 160, { size: 9, align: 'center', color: '#7aff9a' });
      c.fillStyle = '#0a2a18'; c.fillRect(80, 170, 160, 6);
      c.fillStyle = '#5aff8a'; c.fillRect(80, 170, Math.round(160 * Math.min(1, this.bootT / 2.4)), 6);
      UI.text(c, 'ESPACE : passer', W / 2, 228, { size: 7, align: 'center', color: '#3a8a5a' });
    }
    drawScene(c) {
      const t = this.t, par = Math.sin(t * 0.15);
      c.drawImage(skyLayer(), 0, 0);
      // rayons du soleil
      c.save(); c.globalCompositeOperation = 'lighter'; c.translate(236, HZ);
      for (let i = 0; i < 9; i++) {
        c.rotate(Math.PI / 9);
        c.fillStyle = `rgba(255,200,140,${0.05 + 0.03 * Math.sin(t * 1.2 + i)})`;
        c.beginPath(); c.moveTo(0, 0); c.lineTo(-240, -10); c.lineTo(-240, 10); c.fill();
      }
      c.restore();
      // nuages en couches
      for (let L = 0; L < 3; L++) {
        const sp = 3 + L * 4, y0 = 22 + L * 26;
        for (let i = 0; i < 4; i++) {
          const x = ((i * 120 + t * sp + L * 50) % (W + 160)) - 80, y = y0 + (i % 2) * 6;
          c.fillStyle = L === 2 ? 'rgba(255,190,170,0.55)' : 'rgba(200,150,190,0.35)';
          c.beginPath(); c.ellipse(x, y, 34 - L * 4, 7, 0, 0, 7); c.ellipse(x + 16, y - 4, 18, 6, 0, 0, 7); c.fill();
          c.fillStyle = 'rgba(255,220,180,0.45)'; c.fillRect(Math.round(x - 26), Math.round(y + 4), 50, 1);
        }
      }
      // Birdramon qui traverse le ciel
      const bx = ((t * 22) % (W + 260)) - 120, by = 46 + Math.sin(t * 0.8) * 6, B = birdramon();
      c.save(); c.translate(bx, by); c.scale(-0.55, 0.55); c.drawImage(B, -B.width / 2, -B.height / 2); c.restore();
      // île (léger effet de parallaxe)
      c.drawImage(islandLayer(), Math.round(par * 2), 0);
      // lueur numérique au sommet de la Montagne de l'Infini
      c.save(); c.globalCompositeOperation = 'lighter';
      const gl = c.createRadialGradient(108 + par * 2, HZ - 84, 2, 108 + par * 2, HZ - 84, 30);
      gl.addColorStop(0, `rgba(120,255,180,${0.35 + 0.2 * Math.sin(t * 2)})`); gl.addColorStop(1, 'rgba(60,255,140,0)');
      c.fillStyle = gl; c.fillRect(60, HZ - 120, 100, 80);
      c.restore();
      // moulin de la ville qui tourne, fenêtres allumées
      const mf = millFrames(), m = mf[Math.floor(t * 5) % mf.length];
      c.drawImage(m.canvas || m, 206 + par * 2, HZ - 34, 19, 28);
      for (const [x, y] of [[152, HZ - 13], [158, HZ - 13], [175, HZ - 10], [194, HZ - 11]]) { c.fillStyle = `rgba(255,220,140,${0.7 + 0.3 * Math.sin(t * 3 + x)})`; c.fillRect(x + Math.round(par * 2), y, 2, 2); }
      // mer et reflets du soleil
      c.drawImage(seaLayer(), 0, 0);
      for (let i = 0; i < 18; i++) {
        const y = HZ + 2 + i * 2.6, w = 10 + i * 3 + Math.sin(t * 2 + i) * 4;
        c.fillStyle = `rgba(255,224,170,${0.6 - i * 0.03})`;
        c.fillRect(Math.round(236 - w / 2 + Math.sin(t * 1.3 + i * 1.7) * 3), Math.round(y), Math.round(w), 1);
      }
      for (let i = 0; i < 24; i++) { const x = (i * 47 + t * 6) % W, y = HZ + 6 + (i * 13) % 50; if (Math.sin(t * 3 + i) > 0.6) { c.fillStyle = 'rgba(255,230,200,0.7)'; c.fillRect(Math.round(x), Math.round(y), 2, 1); } }
      // données qui montent de l'île
      c.font = UI.font(6); c.textAlign = 'center';
      this.motes.forEach(mo => { c.fillStyle = `rgba(140,255,190,${Math.min(0.6, (HZ - mo.y) / 60)})`; c.fillText(mo.ch, mo.x, mo.y); });
      // oiseaux
      c.fillStyle = '#2a1438';
      this.birds.forEach(b => { const f = Math.sin(t * 8 + b.ph) > 0 ? 1 : 0; c.fillRect(Math.round(b.x) - 2, Math.round(b.y) - f, 2, 1); c.fillRect(Math.round(b.x) + 1, Math.round(b.y) - f, 2, 1); c.fillRect(Math.round(b.x), Math.round(b.y), 1, 1); });
      // premier plan : falaise, palmiers qui se balancent, héros et partenaire de dos
      c.drawImage(frontLayer(), 0, 0);
      const [p0, p1] = palms();
      c.save(); c.translate(-6, 238); c.rotate(Math.sin(t * 0.9) * 0.02); c.drawImage(p0, -10, -140, 96, 140); c.restore();
      c.save(); c.translate(W - 40, 240); c.rotate(Math.sin(t * 0.8 + 1) * 0.02); c.drawImage(p1, -40, -126, 88, 126); c.restore();
      const hero = DW.Sprites.hero('up', 0), hx = 128, hy = 232;   // (au premier plan, sur la falaise sombre : pas dans la mer)
      c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(hx, hy + 2, 9, 2.6, 0, 0, 7); c.fill();
      c.drawImage(hero.img, Math.round(hx - hero.w), Math.round(hy - hero.h * 2), hero.w * 2, hero.h * 2);
      DW.Sprites.draw(c, DW.Sprites.battle('agumon'), 164, 234, { frame: Math.floor(t * 4), scale: 0.62, flip: true });
      // voile de lumière chaude
      const v = c.createLinearGradient(0, 0, 0, H); v.addColorStop(0, 'rgba(20,10,50,0.25)'); v.addColorStop(0.55, 'rgba(255,140,90,0)'); v.addColorStop(1, 'rgba(20,6,30,0.35)');
      c.fillStyle = v; c.fillRect(0, 0, W, H);
    }
    drawLogo(c) {
      const t = this.t, k = this.logoIn.v, e = 1 - Math.pow(1 - k, 3);
      const up = this.menuIn.v * 6, cx = W / 2, cy = 44 - up;
      const sc = (1 + (1 - e) * 1.4) * 0.78;
      // halo derrière le logo
      c.save(); c.globalCompositeOperation = 'lighter';
      const g = c.createRadialGradient(cx, cy, 6, cx, cy, 120);
      g.addColorStop(0, `rgba(160,255,200,${0.45 * e})`); g.addColorStop(1, 'rgba(0,80,40,0)');
      c.fillStyle = g; c.fillRect(0, 0, W, 110);
      c.restore();
      const sw = (t * 0.35) % 1.6, L = sw < 1 ? logoShine(sw) : logo();
      c.save(); c.globalAlpha = Math.min(1, k * 2); c.translate(cx, cy + Math.sin(t * 1.5) * 1.2); c.scale(sc, sc);
      c.drawImage(L, -140, -50);
      c.restore();
      c.globalAlpha = Math.min(1, Math.max(0, k * 2 - 1));
      c.font = '10px "Press Start 2P", monospace'; c.textAlign = 'center'; c.lineJoin = 'round';
      c.lineWidth = 4; c.strokeStyle = '#06102e'; c.strokeText("L'ILE DES FICHIERS", cx, cy + 52);
      const sg = c.createLinearGradient(0, cy + 42, 0, cy + 53); sg.addColorStop(0, '#fff6a0'); sg.addColorStop(1, '#f0a018');
      c.fillStyle = sg; c.fillText("L'ILE DES FICHIERS", cx, cy + 52);
      const ix = cx - c.measureText("L'ILE DES FICHIERS").width / 2 + c.measureText("L'").width + c.measureText('I').width / 2;
      c.fillStyle = '#06102e'; c.fillRect(ix - 4, cy + 37, 8, 4);
      c.fillStyle = '#fff6a0'; c.fillRect(ix - 3, cy + 39, 2, 1); c.fillRect(ix - 1, cy + 38, 2, 1); c.fillRect(ix + 1, cy + 39, 2, 1);
      c.globalAlpha = 1;
    }
    drawMenu(c) {
      const t = this.t, k = this.menuIn.v, e = 1 - Math.pow(1 - k, 3);
      if (this.phase === 'press') {
        if (this.logoIn.v > 0.9 && Math.floor(t * 2) % 2 === 0) UI.text(c, 'APPUIE SUR ESPACE', W / 2, 168, { size: 11, align: 'center', color: '#ffffff' });
        return;
      }
      const bw = 132, bx = (this.info ? 14 : W / 2 - bw / 2), by = 146 + (1 - e) * 100;
      UI.box(c, bx, by, bw, this.opts.length * 16 + 10);
      this.opts.forEach((o, i) => UI.text(c, o, bx + 22, by + 16 + i * 16, { size: 10, color: i === this.i ? '#ffe070' : '#bfeaf6' }));
      UI.cursor(c, bx + 9, by + 12.5 + this.i * 16, t);
      if (this.info) {
        const I = this.info, px = 154 + (1 - e) * 180;
        UI.box(c, px, 140, W - 154 - 8, 52, this.i === 1 ? 'dwsel' : 'dw');
        UI.text(c, I.name, px + 8, 154, { size: 10, color: '#ffe070' });
        // (colonne de droite réservée au partenaire : le texte ne passe plus dessous)
        const pw = W - 154 - 8, cut = (txt, n) => (txt.length > n ? txt.slice(0, n - 1) + '…' : txt);
        UI.text(c, cut(I.place, 24), px + 8, 167, { size: 8 });
        const m = Math.floor(I.time / 60);
        UI.text(c, `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}  ·  Jour ${I.day}  ·  Dex ${I.dex}`, px + 8, 180, { size: 7, color: '#8ae0f0' });
        if (I.partner && DW.SPECIES[I.partner]) {
          const spr = DW.Sprites.ow(I.partner), k = Math.min(1, 26 / spr.h, 26 / spr.w);
          DW.Sprites.draw(c, spr, px + pw - 18, 187, { frame: Math.floor(t * 2), scale: k });
          UI.text(c, `N.${I.level}`, px + pw - 8, 154, { size: 8, align: 'right', color: '#8ae0f0' });
        }
      }
    }
    // transition : l'écran se défait en cases de données vertes, puis éclair blanc
    drawWipe(c) {
      const w = this.wipe; if (!w) return;
      const S = 16, cols = W / S, rows = H / S;
      c.font = UI.font(8); c.textAlign = 'center';
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
        const d = Math.hypot(x - cols / 2, y - rows / 2) / Math.hypot(cols / 2, rows / 2), st = d * 0.6 + DW.Art.hash(x, y, 9) * 0.25, k = (w.t - st) / 0.25;
        if (k <= 0) continue;
        if (k < 1) { c.fillStyle = `rgba(90,255,150,${0.85 - k * 0.4})`; c.fillRect(x * S, y * S, S, S); c.fillStyle = '#0a2a14'; c.fillText(DW.Art.hash(x, y, 3) < 0.5 ? '0' : '1', x * S + 8, y * S + 11); }
        else { c.fillStyle = '#04100a'; c.fillRect(x * S, y * S, S, S); }
      }
      if (w.t > 1.05) { c.fillStyle = `rgba(255,255,255,${Math.min(1, (w.t - 1.05) * 5)})`; c.fillRect(0, 0, W, H); }
    }
    draw(c) {
      if (this.phase === 'boot') { this.drawBoot(c); return; }
      this.drawScene(c);
      for (let y = 0; y < H; y += 2) { c.fillStyle = 'rgba(0,0,0,0.07)'; c.fillRect(0, y, W, 1); }
      this.drawLogo(c);
      this.drawMenu(c);
      UI.text(c, 'Jeu de fan non officiel — Digimon © Bandai / Toei Animation', W / 2, 236, { size: 7, align: 'center', color: '#c8b8e0' });
      if (this.flashA > 0) { c.fillStyle = `rgba(255,255,255,${Math.min(1, this.flashA)})`; c.fillRect(0, 0, W, H); }
      this.drawWipe(c);
    }
  }
  DW.TitleScene = TitleScene;
})();
