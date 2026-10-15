'use strict';
// =====================================================================
//  INTRODUCTION : choix du DigiSélectionné, le camp d'été sous la neige,
//  le Digivice qui tombe du ciel, le tunnel numérique, la chute vers
//  l'Île des Fichiers, puis le réveil chez Jijimon
// =====================================================================
(function () {
  const { UI, Input, Audio, Game } = DW;
  const W = DW.W, H = DW.H;
  const DIRS = ['down', 'left', 'up', 'right'];

  // ------------------------------------------------------------ blason (badge rond + losange)
  function crest(c, x, y, r, col, t) {
    c.save(); c.translate(x, y);
    c.fillStyle = 'rgba(255,255,255,0.12)'; c.beginPath(); c.arc(0, 0, r + 3 + Math.sin(t * 3), 0, 7); c.fill();
    c.fillStyle = '#20202a'; c.beginPath(); c.arc(0, 0, r + 1, 0, 7); c.fill();
    c.fillStyle = col; c.beginPath(); c.arc(0, 0, r, 0, 7); c.fill();
    c.fillStyle = '#ffffff'; c.globalAlpha = 0.85;
    c.beginPath(); c.moveTo(0, -r * 0.6); c.lineTo(r * 0.45, 0); c.lineTo(0, r * 0.6); c.lineTo(-r * 0.45, 0); c.closePath(); c.fill();
    c.globalAlpha = 1; c.restore();
  }

  // ------------------------------------------------------------ création du personnage (un enfant qui n'est pas dans l'animé)
  // Haut/Bas : ligne   Gauche/Droite : choix   ESPACE : valider (sur la dernière ligne)
  class CreateScene extends DW.Scene {
    constructor() {
      super();
      const L = DW.LOOK_OPTS;
      this.rows = [['Je suis', L.gender, 'gender'], ['Allure', L.styles[0].map(x => x[0]), 'style'], ['Cheveux', L.hair.map(x => x[0]), 'hair'], ['Tenue', L.shirt.map(x => x[0]), 'shirt'],
        ['Accessoire', L.head.map(x => x[0]), 'head'], ['DigiŒuf', Object.values(DW.HERO_LINE).map(l => l.baby), 'baby'], ['C\'est moi !', [''], null]];
      this.r = 0; this.v = { gender: 0, style: 0, hair: 0, shirt: 0, head: 0, baby: 0 };
      DW.state.hero = 'perso'; this.apply();
    }
    apply() {
      const v = this.v;
      this.rows[1][1] = DW.LOOK_OPTS.styles[v.gender].map(x => x[0]);   // l'allure dépend du genre
      DW.state.look = { gender: v.gender, style: v.style, hair: v.hair, shirt: v.shirt, head: v.head, baby: Object.values(DW.HERO_LINE)[v.baby].baby };
    }
    update() {
      const n = this.rows.length, R = this.rows[this.r];
      if (Input.hit('up')) { this.r = (this.r + n - 1) % n; Audio.sfx('move'); }
      if (Input.hit('down')) { this.r = (this.r + 1) % n; Audio.sfx('move'); }
      const d = Input.hit('left') ? -1 : Input.hit('right') ? 1 : 0;
      if (d && R[2]) { const k = R[2], m = R[1].length; this.v[k] = (this.v[k] + d + m) % m; if (k === 'gender') this.v.style = 0; Audio.sfx('move'); this.apply(); }
      if (Input.hit('ok')) { if (this.r === n - 1) { Audio.sfx('select'); this.close('perso'); } else { this.r++; Audio.sfx('select'); } }
    }
    draw(c) {
      const t = this.t, look = DW.heroLook('perso');
      UI.menuBg(c, t);
      UI.text(c, 'QUI ES-TU ?', W / 2, 17, { size: 11, align: 'center', bold: true, color: '#ffe680' });
      // le personnage tourne sur lui-même
      const cx = 78, g = c.createRadialGradient(cx, 130, 4, cx, 130, 64);
      g.addColorStop(0, look.crestCol + 'aa'); g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g; c.fillRect(cx - 70, 60, 140, 120);
      // socle de pierre claire (pas une flaque !) et faisceau de lumière venu d'en haut
      c.save(); c.globalCompositeOperation = 'lighter';
      const beam = c.createLinearGradient(0, 40, 0, 160); beam.addColorStop(0, 'rgba(255,240,200,0)'); beam.addColorStop(1, 'rgba(255,240,200,0.22)');
      c.fillStyle = beam; c.beginPath(); c.moveTo(cx - 18, 40); c.lineTo(cx + 18, 40); c.lineTo(cx + 36, 160); c.lineTo(cx - 36, 160); c.fill();
      c.restore();
      c.fillStyle = '#3a3448'; c.beginPath(); c.ellipse(cx, 164, 36, 9, 0, 0, 7); c.fill();
      c.fillStyle = '#8a86a0'; c.beginPath(); c.ellipse(cx, 160, 34, 8, 0, 0, 7); c.fill();
      c.fillStyle = '#b8b4cc'; c.beginPath(); c.ellipse(cx, 159, 28, 5.6, 0, 0, 7); c.fill();
      c.strokeStyle = look.crestCol; c.lineWidth = 1; c.beginPath(); c.ellipse(cx, 159, 24 + Math.sin(t * 3), 4.6, 0, 0, 7); c.stroke();
      for (let i = 0; i < 10; i++) { const a = t * 0.8 + i / 10 * Math.PI * 2, px = cx + Math.cos(a) * 40, py = 120 + Math.sin(a) * 9 - ((t * 12 + i * 9) % 50); c.fillStyle = 'rgba(255,240,200,0.7)'; c.fillRect(Math.round(px), Math.round(py), 1, 1); }
      const dir = DIRS[Math.floor(t / 0.9) % 4], fr = Math.floor(t * 6) % 4;
      c.imageSmoothingEnabled = false;
      c.drawImage(DW.Sprites.hero(dir, fr, 'perso').img, Math.round(cx - 29), 86, 58, 75);
      // l'œuf choisi et son bébé
      const baby = DW.state.look.baby, line = DW.heroLine('perso');
      DW.Sprites.draw(c, DW.Sprites.battle(baby), cx, 200, { frame: Math.floor(t * 4) });
      UI.text(c, `${DW.SPECIES[baby].name} → ${DW.SPECIES[line.partner].name}`, cx, 214, { size: 7, align: 'center', color: '#ffe680' });
      // les lignes de choix
      this.rows.forEach(([label, opts, k], i) => {
        const y = 32 + i * 25, on = i === this.r;
        UI.box(c, 150, y, 160, 22, on ? 'dwsel' : 'dw');
        if (!k) { UI.text(c, label, 230, y + 14, { size: 10, align: 'center', bold: true, color: on ? '#ffe070' : '#ffffff' }); return; }
        UI.text(c, label, 156, y + 9, { size: 7, color: '#8ae0f0' });
        const val = k === 'baby' ? DW.SPECIES[opts[this.v[k]]].name : opts[this.v[k]];
        UI.text(c, (on ? '◀ ' : '') + val + (on ? ' ▶' : ''), 304, y + 17, { size: 9, align: 'right', color: '#ffffff' });
      });
      UI.text(c, '▲▼ choisir la ligne   ◀ ▶ changer   ESPACE valider', W / 2, 232, { size: 7, align: 'center', color: '#7a8ab8' });
    }
  }
  DW.CreateScene = CreateScene;

  // ------------------------------------------------------------ choix du personnage (anciennes parties : un des enfants de l'animé)
  class CharScene extends DW.Scene {
    constructor() { super(); this.i = 0; this.slide = { v: 0 }; }
    move(d) {
      const n = DW.HERO_ORDER.length;
      this.i = (this.i + d + n) % n; Audio.sfx('move');
      this.slide.v = d * 40; DW.tween(this.slide, { v: 0 }, 0.25);
    }
    update() {
      if (Input.hit('left')) this.move(-1);
      if (Input.hit('right')) this.move(1);
      if (Input.hit('ok')) { Audio.sfx('select'); this.close(DW.HERO_ORDER[this.i]); }
    }
    draw(c) {
      const t = this.t, id = DW.HERO_ORDER[this.i], L = DW.HEROES[id];
      UI.menuBg(c, t);
      UI.text(c, 'QUI ES-TU ?', W / 2, 17, { size: 11, align: 'center', bold: true, color: '#ffe680' });
      // vignettes de tous les personnages
      DW.HERO_ORDER.forEach((k, j) => {
        const x = W / 2 - 3.5 * 34 + j * 34 + 5, sel = j === this.i;
        c.fillStyle = sel ? 'rgba(255,230,120,0.25)' : 'rgba(0,0,0,0.3)';
        c.fillRect(x - 2, 24, 28, 34);
        if (sel) { c.strokeStyle = '#ffe680'; c.lineWidth = 1; c.strokeRect(x - 1.5, 24.5, 27, 33); }
        c.globalAlpha = sel ? 1 : 0.55;
        c.drawImage(DW.Sprites.hero('down', 0, k).img, x - 1, 24.5, 26, 33);
        c.globalAlpha = 1;
      });
      // halo + socle à la couleur du blason
      const cx = W / 2 + this.slide.v;
      const g = c.createRadialGradient(cx, 140, 4, cx, 140, 70);
      g.addColorStop(0, L.crestCol + 'aa'); g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g; c.fillRect(cx - 80, 60, 160, 110);
      c.fillStyle = 'rgba(0,0,0,0.45)'; c.beginPath(); c.ellipse(cx, 150, 34, 7, 0, 0, 7); c.fill();
      c.strokeStyle = L.crestCol; c.lineWidth = 1; c.beginPath(); c.ellipse(cx, 150, 34 + Math.sin(t * 3) * 2, 7, 0, 0, 7); c.stroke();
      // le personnage tourne sur lui-même en marchant sur place
      const dir = DIRS[Math.floor(t / 0.9) % 4], fr = Math.floor(t * 6) % 4;
      const spr = DW.Sprites.hero(dir, fr, id).img;
      c.imageSmoothingEnabled = false;
      c.drawImage(spr, Math.round(cx - 29), 76, 58, 75);
      // flèches
      const bob = Math.sin(t * 6) * 2;
      UI.text(c, '◀', 96 - bob, 120, { size: 12, align: 'center', color: '#ffe680' });
      UI.text(c, '▶', 224 + bob, 120, { size: 12, align: 'center', color: '#ffe680' });
      // nom, blason, description
      UI.text(c, L.name, W / 2, 170, { size: 14, align: 'center', bold: true });
      crest(c, W / 2 - 48, 181, 4, L.crestCol, t);
      UI.text(c, 'Blason : ' + L.crest, W / 2 + 4, 184, { size: 8, align: 'center', color: L.crestCol });
      const line = DW.heroLine(id);
      UI.text(c, `Partenaire : ${DW.SPECIES[line.partner].name}`, W / 2 + 70, 150, { size: 7, align: 'left', color: '#ffe680' });
      UI.text(c, `(${DW.SPECIES[line.baby].name})`, W / 2 + 70, 160, { size: 7, align: 'left', color: '#c8d0e8' });
      UI.box(c, 14, 190, 292, 44, 'dark');
      UI.wrap(c, L.desc, 276, 9).forEach((l, k) => UI.text(c, l, 24, 205 + k * 12, { size: 9 }));
      UI.text(c, '◀ ▶ choisir   ESPACE valider', W - 20, 229, { size: 7, align: 'right', color: '#7a8ab8' });
    }
  }
  DW.CharScene = CharScene;

  // ------------------------------------------------------------ cinématique
  class IntroScene extends DW.Scene {
    constructor() {
      super();
      this.mode = 'camp';
      this.cap = { a: 0 }; this.line = '';
      this.bars = { v: 0 }; this.aurora = { v: 0 }; this.snowOn = false;
      this.dv = { y: -30, on: false, glow: 0, landed: false };
      this.beam = { v: 0 }; this.lift = { v: 0 }; this.pix = { v: 0 }; this.zoom = { v: 0 };
      this.snow = Array.from({ length: 80 }, () => ({ x: Math.random() * W, y: Math.random() * H, s: 8 + Math.random() * 18, w: Math.random() * 6 }));
      this.stars = Array.from({ length: 70 }, () => ({ x: Math.random() * W, y: Math.random() * 120, p: Math.random() * 6 }));
      this.streaks = Array.from({ length: 70 }, () => this.streak(true));
      this.clouds = Array.from({ length: 16 }, () => this.cloud(true));
      this.buf = DW.Art.canvas(W, H); this.small = DW.Art.canvas(W, H);
      this.heroDir = 'up';   // le héros est toujours vu de dos (c'est le joueur)
    }
    streak(init) { return { a: Math.random() * Math.PI * 2, r: init ? Math.random() * 200 : 4 + Math.random() * 10, v: 1.6 + Math.random() * 1.6, h: Math.random() }; }
    cloud(init) { return { a: Math.random() * Math.PI * 2, r: init ? Math.random() * 220 : 2 + Math.random() * 8, s: 0.5 + Math.random() * 0.8 }; }
    enter() { this.run(); }
    // fondu enchaîné : l'image actuelle est gardée, puis s'efface sur la nouvelle scène
    cut(mode, dur = 0.9) {
      if (!this.xbuf) this.xbuf = DW.Art.canvas(W, H);
      const x = this.xbuf.getContext('2d'); x.clearRect(0, 0, W, H);
      const cap = this.cap.a; this.cap.a = 0; this.draw(x); this.cap.a = cap;
      this.mode = mode; this.xf = { v: 1 };
      return DW.tween(this.xf, { v: 0 }, dur);
    }
    // légende de bas d'écran (bandes cinéma)
    async show(txt, hold = 3.0) {
      this.line = txt; this.skip = false;
      await DW.tween(this.cap, { a: 1 }, 0.5);
      let t = 0;
      while (t < hold && !this.skip) { await DW.wait(0.05); t += 0.05; }
      await DW.tween(this.cap, { a: 0 }, 0.35);
    }
    update() { if (Input.hit('ok')) this.skip = true; }
    async run() {
      const st = DW.state;
      // 1) qui es-tu ? (un enfant qui n'est pas dans l'animé : il va délivrer les autres)
      st.hero = await Game.push(new CreateScene());
      st.name = await Game.push(new DW.NameScene(st.look && st.look.gender ? 'Aiko' : 'Kenji'));
      // les autres enfants du camp : les sept de l'animé (ils seront séparés en arrivant sur l'île)
      const others = DW.HERO_ORDER.filter(k => k !== st.hero);
      const SPOTS = [[24, 206, 'right'], [124, 208, 'right'], [152, 214, 'left'], [180, 210, 'left'], [238, 200, 'left'], [266, 208, 'left'], [294, 202, 'left']];   // loin de la tente (x 48-110)
      this.kids = others.map((k, i) => ({ id: k, x: SPOTS[i][0], y: SPOTS[i][1], dir: SPOTS[i][2] }));
      // 2) le camp d'été
      await DW.fade(1, 0.4);
      Audio.play('village');
      await DW.fade(0, 0.8);
      DW.tween(this.bars, { v: 1 }, 1);
      await this.show("Été. Un camp de vacances au cœur des montagnes.");
      await this.show(`${others.length + 1 === 8 ? 'Huit' : 'Sept'} enfants autour du feu : toi, ${st.name}... et ${others.length === 7 ? 'sept' : 'six'} autres.`, 2.6);
      this.snowOn = true;
      await this.show("Soudain... il se met à neiger, en plein mois d'août.");
      DW.tween(this.aurora, { v: 1 }, 2.5);
      await this.show('Une aurore étrange illumine le ciel.');
      // 3) sept Digivices tombent du ciel, un pour chaque enfant
      this.dv.on = true; Audio.sfx('capsule');
      await DW.tween(this.dv, { y: 194 }, 1.3, t => t * t);
      this.dv.landed = true; Audio.sfx('hit'); this.flash = 1;
      await DW.wait(0.4);
      this.heroDir = 'up';   // le héros reste de dos : c'est toi
      await this.show('De petits objets lumineux tombent du ciel, un aux pieds de chaque enfant : des Digivices !');
      // 4) ils s'illuminent et emportent tout le monde
      DW.tween(this.dv, { glow: 1 }, 1.2);
      Audio.sfx('evolve');
      await this.show(`${st.name}... Les Digivices se mettent à briller de plus en plus fort !`, 2.4);
      Audio.stop();
      DW.tween(this.beam, { v: 1 }, 0.8);
      await DW.tween(this.lift, { v: 1 }, 1.4);
      Audio.sfx('super');
      await DW.tween(this.pix, { v: 1 }, 0.9, DW.linear);
      // 5) tunnel numérique : les sept enfants ensemble
      this.cut('tunnel', 0.7); this.flash = 0.6; Audio.sfx('evolve');
      this.show("Une vague de lumière vous emporte tous vers un autre monde...", 2.6);   // (tous les enfants ensemble)
      await DW.wait(4.2);
      // 6) au-dessus de l'île : les enfants sont séparés, chacun tombe ailleurs (au hasard)
      this.cut('sky', 1.2); Audio.sfx('swoosh');
      this.scatter = { v: 0, pts: this.landingPoints(others.length) };
      this.show("Le Digimonde... L'Île des Fichiers. Mais la lumière se brise : les enfants sont séparés !", 3.2);
      await DW.tween(this.scatter, { v: 1 }, 3.4, t => t * (2 - t));
      Audio.sfx('hit');
      await DW.wait(0.6);
      this.show('Chacun tombe ailleurs sur l\'île... Et toi, droit vers une plage.', 2.6);
      await DW.tween(this.zoom, { v: 1 }, 4.2, t => t * t * (3 - 2 * t));
      Audio.sfx('swoosh');
      // 7) la plage des cabines : on voit le héros tomber, puis un DigiŒuf, qui éclot
      const baby = DW.heroLine().baby, bname = DW.SPECIES[baby].name;
      const B = this.B = { baby, hero: { y: -60, landed: 0, rot: 0 }, puff: 0, egg: { x: 196, y: -40, rot: 0, crack: 0, open: 0 }, mon: { a: 0, x: 196 }, jiji: { x: 360 } };
      Audio.play('beach');
      await this.cut('beach', 1.1);
      await DW.tween(B.hero, { y: 186, rot: Math.PI * 2.5 }, 1.0, t => t * t);
      B.hero.landed = 1; this.flash = 0.7; this.shake = 0.6; Audio.sfx('hit');
      DW.tween(B, { puff: 1 }, 0.9);
      await DW.wait(0.8);
      await this.show('Le bruit des vagues... Tu es étendu sur une plage inconnue.', 2.6);
      Audio.sfx('swoosh');
      await DW.tween(B.egg, { y: 182 }, 1.1, t => t * t);
      Audio.sfx('hit'); this.flash = 0.6;
      await this.show('Quelque chose est tombé du ciel juste à côté de toi : un DigiŒuf !', 2.4);
      for (let i = 0; i < 6; i++) { Audio.sfx('capsule'); await DW.tween(B.egg, { rot: i % 2 ? -0.22 : 0.22 }, 0.12); }
      B.egg.rot = 0;
      DW.tween(B.egg, { crack: 1 }, 0.9);
      await this.show('Il tremble... il se fendille...', 1.6);
      Audio.sfx('evolve'); this.flash = 1; B.egg.open = 1;
      await DW.tween(B.mon, { a: 1 }, 0.5);
      await this.show(`${bname} est né ! Il vient se blottir contre toi.`, 2.4);
      await DW.tween(B.mon, { x: 172 }, 0.8);
      DW.tween(B.jiji, { x: 228 }, 2.8);
      await this.show("Au loin, une silhouette s'approche lentement sur le sable...", 2.6);
      await DW.fade(1, 0.8);
      await DW.wait(0.4);
      // carton du chapitre 1 (game/chapitre1.js) ; la vidéo reste au noir derrière (pas de retour furtif sur la plage)
      this.mode = 'black';
      DW.fade(0, 0.01);
      await Game.push(new DW.ChapterScene('CHAPITRE 1', "L'Île des Fichiers", 'Une île faite de données... et des Digimon qui ont tout oublié.'));
      await DW.fade(1, 0.01);
      DW.startGame(true);
    }
    // points d'arrivée des autres enfants : des cases de terre ferme de l'île, au hasard, bien espacées (coordonnées de l'image de l'île)
    landingPoints(n) {
      const img = DW.islandImage(), d = img.getContext('2d').getImageData(0, 0, img.width, img.height).data, out = [];
      const land = (x, y) => { const i = (y * img.width + x) * 4; return !(d[i + 2] > d[i] + 30 && d[i + 2] > d[i + 1]); };   // pas de bleu dominant = pas la mer
      for (let tries = 0; out.length < n && tries < 4000; tries++) {
        const x = 70 + Math.floor(Math.random() * 180), y = 40 + Math.floor(Math.random() * 160);
        if (land(x, y) && Math.hypot(x - 122, y - 206) > 30 && out.every(([a, b]) => Math.hypot(a - x, b - y) > 34)) out.push([x, y]);
      }
      return out;
    }
    tick(dt) {
      const t = this.t;
      if (this.flash > 0) this.flash -= dt * 2.2;
      if (this.shake > 0) this.shake -= dt;
      if (this.snowOn) this.snow.forEach(s => { s.y += s.s * dt; s.x += Math.sin(t + s.w) * 0.2; if (s.y > H) { s.y = -4; s.x = Math.random() * W; } });
      if (this.mode === 'tunnel') this.streaks.forEach((s, i) => { s.r *= 1 + s.v * dt; if (s.r > 260) this.streaks[i] = this.streak(false); });
      if (this.mode === 'sky') this.clouds.forEach((s, i) => { s.r *= 1 + (1.2 + this.zoom.v * 2) * s.s * dt; if (s.r > 300) this.clouds[i] = this.cloud(false); });
    }

    // ---------------------------------------------------------- camp de nuit
    drawCamp(c) {
      const t = this.t, A = this.aurora.v;
      const g = c.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#020414'); g.addColorStop(0.6, '#0c1838'); g.addColorStop(1, '#14284a');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      this.stars.forEach(s => { c.fillStyle = `rgba(255,255,255,${0.35 + 0.35 * Math.sin(t * 2 + s.p)})`; c.fillRect(Math.round(s.x), Math.round(s.y), 1, 1); });
      // aurore en rubans
      if (A > 0) {
        c.save(); c.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 5; i++) {
          c.fillStyle = `rgba(${60 + i * 36},255,${190 - i * 24},${0.07 * A})`;
          c.beginPath(); c.moveTo(0, 30 + i * 9);
          for (let x = 0; x <= W; x += 8) c.lineTo(x, 30 + i * 9 + Math.sin(x / 38 + t * 0.8 + i) * 14 + Math.sin(x / 13 + t) * 3);
          c.lineTo(W, 0); c.lineTo(0, 0); c.fill();
        }
        c.restore();
      }
      // montagnes (deux plans) et sapins
      c.fillStyle = '#16244a';
      c.beginPath(); c.moveTo(0, 150); c.lineTo(50, 104); c.lineTo(90, 132); c.lineTo(150, 86); c.lineTo(210, 126); c.lineTo(262, 96); c.lineTo(320, 136); c.lineTo(320, 240); c.lineTo(0, 240); c.fill();
      c.fillStyle = '#e8f0ff'; c.globalAlpha = 0.35;
      c.beginPath(); c.moveTo(150, 86); c.lineTo(138, 96); c.lineTo(146, 94); c.lineTo(152, 99); c.lineTo(162, 95); c.fill(); c.globalAlpha = 1;
      c.fillStyle = '#0c1630';
      c.beginPath(); c.moveTo(0, 182); c.lineTo(60, 140); c.lineTo(120, 172); c.lineTo(190, 128); c.lineTo(260, 166); c.lineTo(320, 146); c.lineTo(320, 240); c.lineTo(0, 240); c.fill();
      c.fillStyle = '#07101e';
      for (let i = 0; i < 14; i++) {
        const x = i * 24 + (i % 3) * 5, b = 182 + (i % 2) * 4, h = 26 + (i * 7) % 14;
        c.beginPath(); c.moveTo(x, b - h); c.lineTo(x - 8, b); c.lineTo(x + 8, b); c.fill();
      }
      // sol enneigé progressivement
      c.fillStyle = '#0e1c2a'; c.fillRect(0, 184, W, 56);
      if (this.snowOn) { c.fillStyle = `rgba(220,235,255,${Math.min(0.35, this.t * 0.01)})`; c.fillRect(0, 184, W, 56); }
      // feu de camp et sa lueur
      const fl = 0.8 + 0.2 * Math.sin(t * 13) * Math.sin(t * 7);
      const fg = c.createRadialGradient(208, 196, 2, 208, 196, 70 * fl);
      fg.addColorStop(0, 'rgba(255,170,80,0.45)'); fg.addColorStop(1, 'rgba(255,120,40,0)');
      c.fillStyle = fg; c.fillRect(130, 120, 160, 120);
      c.fillStyle = '#4a2a14'; c.fillRect(198, 200, 20, 3); c.fillRect(202, 198, 12, 2);
      for (let i = 0; i < 3; i++) {
        c.fillStyle = ['#ff6a20', '#ffb040', '#fff0a0'][i];
        const h = (12 - i * 3.5) * fl;
        c.beginPath(); c.moveTo(208 - (6 - i * 2), 199); c.quadraticCurveTo(208 + Math.sin(t * 9 + i) * 2, 199 - h * 1.6, 208 + (6 - i * 2), 199); c.fill();
      }
      // tente
      c.fillStyle = '#c84a2a'; c.beginPath(); c.moveTo(48, 200); c.lineTo(78, 158); c.lineTo(110, 200); c.fill();
      c.fillStyle = '#8a2e1a'; c.beginPath(); c.moveTo(72, 200); c.lineTo(78, 172); c.lineTo(86, 200); c.fill();
      c.fillStyle = '#e8705a'; c.fillRect(77, 158, 2, 4);
      // le héros (soulevé par la lumière à la fin)
      const lift = this.lift.v * 44, hx = 150, hy = 202 - lift;
      if (this.beam.v > 0) {
        c.save(); c.globalCompositeOperation = 'lighter';
        const bw = 14 + 10 * this.beam.v + Math.sin(t * 20) * 2;
        const bg = c.createLinearGradient(hx - bw, 0, hx + bw, 0);
        bg.addColorStop(0, 'rgba(120,255,200,0)'); bg.addColorStop(0.5, `rgba(200,255,230,${0.8 * this.beam.v})`); bg.addColorStop(1, 'rgba(120,255,200,0)');
        c.fillStyle = bg; c.fillRect(hx - bw, 0, bw * 2, 206);
        c.restore();
      }
      // les autres enfants (chacun son faisceau, soulevés en même temps)
      for (const k of this.kids || []) {
        const ky = k.y - lift;
        if (this.beam.v > 0) { c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(180,255,220,${0.35 * this.beam.v})`; c.fillRect(k.x - 8, 0, 16, k.y + 4); c.restore(); }
        c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.ellipse(k.x, k.y, 7 * (1 - this.lift.v * 0.5), 2, 0, 0, 7); c.fill();
        c.drawImage(DW.Sprites.hero(k.dir, 0, k.id).img, k.x - 14, ky - 36);
        if (this.dv.on && this.lift.v < 0.5) {   // le Digivice de chacun, qui tombe puis brille à ses pieds
          const dy = Math.min(this.dv.y, k.y - 6) + (k.x % 7);
          c.save(); c.globalCompositeOperation = 'lighter';
          const rg = c.createRadialGradient(k.x + 6, dy, 1, k.x + 6, dy, 6 + 14 * this.dv.glow);
          rg.addColorStop(0, 'rgba(200,255,230,0.9)'); rg.addColorStop(1, 'rgba(80,255,160,0)');
          c.fillStyle = rg; c.fillRect(k.x - 20, dy - 26, 52, 52); c.restore();
        }
      }
      c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.ellipse(hx, 202, 8 * (1 - this.lift.v * 0.5), 2, 0, 0, 7); c.fill();
      const spr = DW.Sprites.hero(this.heroDir, 0).img;
      c.drawImage(spr, hx - 14, hy - 36);
      // le Digivice : traînée en tombant, puis éclat au sol
      if (this.dv.on && this.lift.v < 0.5) {
        const dx = 162, dy = this.dv.y;
        if (!this.dv.landed) {
          const tg = c.createLinearGradient(0, dy - 60, 0, dy);
          tg.addColorStop(0, 'rgba(160,255,210,0)'); tg.addColorStop(1, 'rgba(200,255,230,0.9)');
          c.fillStyle = tg; c.fillRect(dx - 1, dy - 60, 3, 60);
        }
        const gl = 0.5 + 0.5 * this.dv.glow;
        c.save(); c.globalCompositeOperation = 'lighter';
        const rg = c.createRadialGradient(dx, dy, 1, dx, dy, 10 + 26 * this.dv.glow + Math.sin(t * 8) * 3);
        rg.addColorStop(0, `rgba(200,255,230,${gl})`); rg.addColorStop(1, 'rgba(80,255,160,0)');
        c.fillStyle = rg; c.fillRect(dx - 50, dy - 50, 100, 100);
        c.restore();
        c.save(); c.translate(dx, dy - 3); c.scale(0.12, 0.12); DW.drawDigivice(c, 0, 0, 1, t); c.restore();
        // anneaux d'énergie
        for (let i = 0; i < 3 && this.dv.glow > 0; i++) {
          const k = (t * 0.8 + i / 3) % 1;
          c.strokeStyle = `rgba(150,255,200,${(1 - k) * this.dv.glow})`; c.lineWidth = 1;
          c.beginPath(); c.ellipse(dx, dy, 6 + k * 40, 2 + k * 10, 0, 0, 7); c.stroke();
        }
      }
      if (this.snowOn) { c.fillStyle = '#ffffff'; this.snow.forEach(s => c.fillRect(Math.round(s.x), Math.round(s.y), s.s > 20 ? 2 : 1, 1)); }
    }

    // ---------------------------------------------------------- tunnel numérique
    drawTunnel(c) {
      const t = this.t, cx = W / 2 + Math.sin(t * 1.3) * 10, cy = H / 2 + Math.cos(t * 1.1) * 6;
      const g = c.createRadialGradient(cx, cy, 2, cx, cy, 220);
      g.addColorStop(0, '#d8fff0'); g.addColorStop(0.08, '#3ac8a0'); g.addColorStop(0.35, '#0a3a5a'); g.addColorStop(1, '#020818');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      // anneaux hexagonaux qui foncent vers nous
      c.save(); c.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 16; i++) {
        const z = ((i / 16) + t * 0.45) % 1, r = 6 * Math.pow(45, z), a = Math.min(1, z * 3) * (1 - z) * 0.9;
        const hue = (i * 40 + t * 90) % 360;
        c.strokeStyle = `hsla(${hue},100%,65%,${a})`; c.lineWidth = 1 + z * 4;
        c.beginPath();
        for (let k = 0; k <= 6; k++) { const an = k * Math.PI / 3 + t * 0.6 + i * 0.2; c.lineTo(cx + Math.cos(an) * r, cy + Math.sin(an) * r * 0.85); }
        c.stroke();
      }
      // traînées de lumière
      this.streaks.forEach(s => {
        const x1 = cx + Math.cos(s.a) * s.r, y1 = cy + Math.sin(s.a) * s.r, r2 = s.r * 1.18;
        c.strokeStyle = `hsla(${140 + s.h * 80},100%,75%,${Math.min(1, s.r / 120)})`; c.lineWidth = Math.max(0.6, s.r / 90);
        c.beginPath(); c.moveTo(x1, y1); c.lineTo(cx + Math.cos(s.a) * r2, cy + Math.sin(s.a) * r2); c.stroke();
      });
      c.restore();
      // les six autres enfants, qui tournoient autour
      (this.kids || []).forEach((k, i) => {
        const a = t * 0.9 + i * Math.PI / 3, r = 62 + Math.sin(t * 1.4 + i) * 10, sp = DW.Sprites.hero(DIRS[Math.floor(t * 4 + i) % 4], 1, k.id).img;
        c.save(); c.translate(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.7); c.rotate(Math.sin(t * 2 + i) * 0.8); c.scale(0.9, 0.9);
        c.shadowColor = '#c8ffe8'; c.shadowBlur = 6; c.drawImage(sp, -14, -18); c.restore();
      });
      // le héros qui tournoie au centre, nimbé de lumière
      const spr = DW.Sprites.hero('up', Math.floor(t * 6) % 4).img;   // de dos
      c.save(); c.translate(cx, cy); c.rotate(Math.sin(t * 1.7) * 0.6); const sc = 1.4 + Math.sin(t * 2) * 0.1; c.scale(sc, sc);
      c.shadowColor = '#c8ffe8'; c.shadowBlur = 8;
      c.drawImage(spr, -14, -18);
      c.restore();
    }

    // ---------------------------------------------------------- chute vers l'île
    drawSky(c) {
      const t = this.t, z = this.zoom.v;
      // la mer tout autour, l'île qui grandit, centrée peu à peu sur la plage
      const s = 0.4 + z * z * 2.8, fx = DW.lerp(160, 122, z), fy = DW.lerp(122, 206, z);
      // l'océan, avec sa houle, sur tout l'écran
      const og = c.createRadialGradient(W / 2, H / 2, 20, W / 2, H / 2, 260); og.addColorStop(0, '#1e5aa8'); og.addColorStop(1, '#0a2a66');
      c.fillStyle = og; c.fillRect(0, 0, W, H);
      c.strokeStyle = 'rgba(160,210,255,0.18)'; c.lineWidth = 1;
      for (let i = 0; i < 26; i++) { const yy = ((i * 23 + t * 6) % (H + 20)) - 10, xx = (i * 61) % W; c.beginPath(); c.moveTo(xx, yy); c.quadraticCurveTo(xx + 8, yy - 3, xx + 16, yy); c.stroke(); }
      // l'île, détourée (masque radial : pas de rectangle)
      if (!this.isle) {
        const im = DW.islandImage(), cv = DW.Art.canvas(im.width, im.height), x = cv.getContext('2d');
        x.drawImage(im, 0, 0); x.globalCompositeOperation = 'destination-in';
        const mg = x.createRadialGradient(160, 122, 70, 160, 122, 150); mg.addColorStop(0, 'rgba(0,0,0,1)'); mg.addColorStop(1, 'rgba(0,0,0,0)');
        x.fillStyle = mg; x.fillRect(0, 0, im.width, im.height);
        this.isle = cv;
      }
      c.save(); c.translate(W / 2, H / 2); c.scale(s, s); c.translate(-fx, -fy);
      c.imageSmoothingEnabled = false; c.drawImage(this.isle, 0, 0);
      c.restore();
      // brume d'altitude qui se dissipe
      c.fillStyle = `rgba(200,230,255,${0.45 * (1 - z) * (this.scatter ? 1 - this.scatter.v * 0.6 : 1)})`; c.fillRect(0, 0, W, H);
      // les comètes des enfants (couleur de leur écusson) qui se séparent et tombent chacune ailleurs
      if (this.scatter && z < 0.98) {
        const k = this.scatter.v, toScreen = (ix, iy) => [W / 2 + (ix - fx) * s, H / 2 + (iy - fy) * s];
        c.save(); c.globalCompositeOperation = 'lighter';
        (this.kids || []).forEach((kid, i) => {
          const P = this.scatter.pts[i]; if (!P) return;
          const [tx, ty] = toScreen(P[0], P[1]), sx = W / 2 + (i - 2.5) * 10, sy = -10;
          const kk = Math.min(1, k * 1.15 - i * 0.02), x = DW.lerp(sx, tx, kk), y = DW.lerp(sy, ty, kk), col = (DW.HEROES[kid.id] || {}).crestCol || '#ffffff';
          c.strokeStyle = col; c.globalAlpha = 0.5; c.lineWidth = 2; c.beginPath(); c.moveTo(DW.lerp(sx, tx, Math.max(0, kk - 0.25)), DW.lerp(sy, ty, Math.max(0, kk - 0.25))); c.lineTo(x, y); c.stroke();
          c.globalAlpha = 1; c.fillStyle = col; c.beginPath(); c.arc(x, y, kk >= 1 ? 3 + Math.sin(t * 6 + i) : 2.4, 0, 7); c.fill();
          if (kk >= 1) { c.globalAlpha = 0.4; c.beginPath(); c.arc(x, y, 7 + (t * 10 + i) % 6, 0, 7); c.stroke(); c.globalAlpha = 1; }
        });
        c.restore();
      }
      // nuages qui défilent vers l'extérieur
      this.clouds.forEach(cl => {
        const x = W / 2 + Math.cos(cl.a) * cl.r, y = H / 2 + Math.sin(cl.a) * cl.r * 0.8, rr = 6 + cl.r * 0.25;
        c.fillStyle = `rgba(255,255,255,${Math.min(0.75, cl.r / 80) * (1 - z * 0.6)})`;
        c.beginPath(); c.ellipse(x, y, rr * 1.6, rr * 0.8, 0, 0, 7); c.ellipse(x + rr * 0.8, y - rr * 0.3, rr, rr * 0.6, 0, 0, 7); c.fill();
      });
      // lignes de vent
      c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 1;
      for (let i = 0; i < 10; i++) { const x = (i * 37 + 13) % W, y = (H - ((t * 260 + i * 53) % (H + 40))); c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 18); c.stroke(); }
      // le héros en chute libre, vu de dos, qui rapetisse en approchant du sol
      if (this.scatter && this.scatter.v < 1 && z === 0) {
        const hc = (DW.HEROES[DW.state.hero] || {}).crestCol || '#ffffff', y = DW.lerp(-10, H / 2 - 10, this.scatter.v);
        c.fillStyle = hc; c.beginPath(); c.arc(W / 2, y, 3.4, 0, 7); c.fill();
        c.strokeStyle = hc; c.globalAlpha = 0.5; c.lineWidth = 2; c.beginPath(); c.moveTo(W / 2, y - 30); c.lineTo(W / 2, y); c.stroke(); c.globalAlpha = 1;
        return;
      }
      const sc = 1.6 - z * 0.9, spr = DW.Sprites.hero('up', Math.floor(t * 8) % 4).img;
      c.save(); c.translate(W / 2 + Math.sin(t * 2) * 6, H / 2 - 20 + Math.cos(t * 1.6) * 4); c.rotate(Math.sin(t * 3) * 0.25); c.scale(sc, sc);
      c.drawImage(spr, -14, -18); c.restore();
    }

    // ---------------------------------------------------------- la plage de l'arrivée (aube)
    drawBeach(c) {
      const t = this.t, B = this.B, O = (k, v) => DW.World.obj(k, v || 0);
      c.save();
      if (this.shake > 0) c.translate(Math.round((Math.random() - 0.5) * 6 * this.shake), 0);
      // ciel de l'aube, nuages, soleil
      const g = c.createLinearGradient(0, 0, 0, 92);
      g.addColorStop(0, '#f0a07a'); g.addColorStop(0.45, '#f8cfa0'); g.addColorStop(1, '#c8ecf4');
      c.fillStyle = g; c.fillRect(-10, 0, W + 20, 92);
      const sg = c.createRadialGradient(72, 80, 4, 72, 80, 60); sg.addColorStop(0, 'rgba(255,250,210,0.9)'); sg.addColorStop(1, 'rgba(255,240,200,0)');
      c.fillStyle = sg; c.fillRect(0, 20, 150, 80);
      c.fillStyle = '#fff6d0'; c.beginPath(); c.arc(72, 80, 15, 0, 7); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.75)';
      for (const [x, y, w] of [[150, 30, 40], [230, 18, 54], [40, 22, 30], [290, 48, 34]]) { const ox = (t * 3) % 360; const X = ((x + ox) % (W + 80)) - 40; c.beginPath(); c.ellipse(X, y, w * 0.5, 5, 0, 0, 7); c.ellipse(X + w * 0.2, y - 4, w * 0.3, 5, 0, 0, 7); c.fill(); }
      // îlots au loin
      c.fillStyle = '#6a8ab0'; c.beginPath(); c.moveTo(196, 86); c.quadraticCurveTo(222, 72, 252, 86); c.fill();
      c.beginPath(); c.moveTo(262, 87); c.quadraticCurveTo(278, 79, 296, 87); c.fill();
      // mer turquoise, reflet du soleil, vagues
      const sea = c.createLinearGradient(0, 86, 0, 134); sea.addColorStop(0, '#2a7ec8'); sea.addColorStop(0.6, '#3ab8d8'); sea.addColorStop(1, '#7ae4e0');
      c.fillStyle = sea; c.fillRect(-10, 86, W + 20, 48);
      for (let i = 0; i < 9; i++) { const y = 90 + i * 4.5, w = 10 + i * 2; c.fillStyle = `rgba(255,240,200,${0.55 - i * 0.05})`; c.fillRect(72 - w / 2 + Math.sin(t * 3 + i) * 3, y, w, 1); }
      c.fillStyle = 'rgba(255,255,255,0.55)';
      for (let i = 0; i < 6; i++) { const y = 92 + i * 7, o = (t * (10 + i * 4) + i * 37) % 64; for (let x = -64 + o; x < W; x += 64) c.fillRect(x, y, 16 - i, 1); }
      // sable mouillé, écume ondulée, sable sec avec grains et coquillages
      c.fillStyle = '#d8b878'; c.fillRect(-10, 130, W + 20, 10);
      c.fillStyle = '#ecd29a'; c.fillRect(-10, 138, W + 20, H - 138);
      c.fillStyle = '#f4fcff';
      for (let x = 0; x < W; x += 4) { const y = 129 + Math.sin(x * 0.06 + t * 1.8) * 2 + Math.sin(x * 0.17 - t) * 0.8; c.fillRect(x, y, 4, 1.6); }
      for (let i = 0; i < 70; i++) { const x = (i * 97) % W, y = 142 + (i * 53) % 96; c.fillStyle = i % 3 ? 'rgba(180,140,80,0.35)' : 'rgba(255,250,230,0.5)'; c.fillRect(x, y, 1, 1); }
      for (const [x, y, col] of [[40, 210, '#f0a0b8'], [118, 222, '#f8e0c0'], [260, 216, '#f0a040'], [212, 230, '#f8e0c0']]) { c.fillStyle = col; c.beginPath(); c.ellipse(x, y, 2.4, 1.6, 0, 0, 7); c.fill(); }
      // les cabines téléphoniques (avec leur ombre), deux palmiers
      // mouettes au loin
      c.strokeStyle = '#4a4a5a'; c.lineWidth = 1;
      for (let i = 0; i < 3; i++) { const bx = ((t * (14 + i * 5) + i * 110) % (W + 40)) - 20, by = 40 + i * 12 + Math.sin(t * 2 + i) * 3, wv = Math.sin(t * 8 + i) * 2; c.beginPath(); c.moveTo(bx - 4, by - wv); c.lineTo(bx, by); c.lineTo(bx + 4, by - wv); c.stroke(); }
      // reflets qui scintillent sur la mer
      for (let i = 0; i < 14; i++) { const sx = (i * 47 + 13) % W, sy = 92 + (i * 17) % 34; if (Math.sin(t * 5 + i * 1.7) > 0.7) { c.fillStyle = '#ffffff'; c.fillRect(sx, sy, 2, 1); } }
      // les cabines (au fond, à droite des palmiers) et deux palmiers en arrière-plan, loin du chemin de Jijimon
      for (const x of [112, 136, 160]) { const b = O('booth'); c.fillStyle = 'rgba(80,60,30,0.25)'; c.beginPath(); c.ellipse(x + b.w * 0.33 + 4, 134, 9, 2, 0, 0, 7); c.fill(); c.drawImage(b.img, x, 134 - b.h * 0.66, b.w * 0.66, b.h * 0.66); }
      const p = O('palm'), p2 = O('palm', 1);
      c.fillStyle = 'rgba(80,60,30,0.25)'; c.beginPath(); c.ellipse(36, 160, 16, 3, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(W - 30, 156, 16, 3, 0, 0, 7); c.fill();
      c.drawImage(p2.img, 8, 160 - p2.h * 1.1, p2.w * 1.1, p2.h * 1.1);
      c.drawImage(p.img, W - 58, 156 - p.h * 1.0, p.w * 1.0, p.h * 1.0);
      // le héros : il tombe du ciel dans une traînée de lumière, soulève un nuage de sable, puis reste étendu
      const hb = DW.Sprites.hero('up', 0), hs = { img: hb.img, w: hb.w * 1.4, h: hb.h * 1.4 }, hc = (DW.HEROES[DW.state.hero] || {}).crestCol || '#ffffff';   // de dos
      if (!B.hero.landed) {
        c.save(); c.globalCompositeOperation = 'lighter'; const tg = c.createLinearGradient(0, B.hero.y - 90, 0, B.hero.y);
        tg.addColorStop(0, 'rgba(255,255,255,0)'); tg.addColorStop(1, hc); c.fillStyle = tg; c.globalAlpha = 0.6; c.fillRect(146, B.hero.y - 90, 8, 90); c.restore();
        c.save(); c.translate(150, B.hero.y - 10); c.rotate(B.hero.rot); c.drawImage(hs.img, -hs.w / 2, -hs.h / 2, hs.w, hs.h); c.restore();
      } else {
        c.fillStyle = 'rgba(80,60,30,0.3)'; c.beginPath(); c.ellipse(150, 194, 26, 5, 0, 0, 7); c.fill();
        c.save(); c.translate(150, 186); c.rotate(-Math.PI / 2); c.drawImage(hs.img, -hs.w / 2, -hs.h / 2, hs.w, hs.h); c.restore();
        if (B.puff > 0 && B.puff < 1) for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI, r = 6 + B.puff * 26; c.fillStyle = `rgba(240,220,170,${0.8 * (1 - B.puff)})`; c.beginPath(); c.arc(150 + Math.cos(a) * r * 1.4, 190 - Math.sin(a) * r * 0.6, 4 + B.puff * 5, 0, 7); c.fill(); }
      }
      // l'œuf, qui tremble, se fend, puis s'ouvre
      if (B.egg.open < 1) {
        const e = DW.eggSprite(B.baby), es = 0.62;
        c.fillStyle = 'rgba(80,60,30,0.3)'; c.beginPath(); c.ellipse(B.egg.x, B.egg.y, 8, 2, 0, 0, 7); c.fill();
        c.save(); c.translate(B.egg.x, B.egg.y); c.rotate(B.egg.rot); c.scale(es, es); c.drawImage(e.img, -e.w / 2, -e.h);
        if (B.egg.crack > 0) { c.strokeStyle = '#3a2a1a'; c.lineWidth = 1; c.beginPath(); c.moveTo(-8, -20); c.lineTo(-3, -16 - 6 * B.egg.crack); c.lineTo(2, -21); c.lineTo(7, -15 - 4 * B.egg.crack); c.stroke(); }
        c.restore();
      } else if (B.mon.a < 1) {
        c.fillStyle = '#fff8e8'; c.beginPath(); c.arc(B.egg.x - 8, B.egg.y - 4, 6, 0, Math.PI); c.fill(); c.beginPath(); c.arc(B.egg.x + 8, B.egg.y - 4, 6, 0, Math.PI); c.fill();
      }
      if (B.mon.a > 0) {
        const sp = DW.Sprites.battle(B.baby), sc = Math.min(1, 26 / sp.h);
        c.globalAlpha = B.mon.a;
        DW.Sprites.draw(c, sp, B.mon.x, 190 - Math.abs(Math.sin(t * 6)) * 3, { frame: Math.floor(t * 4), scale: sc, flip: true });
        c.globalAlpha = 1;
      }
      // Jijimon qui arrive
      if (B.jiji.x < W + 30) { const j = DW.Sprites.ow('jijimon'); c.fillStyle = 'rgba(80,60,30,0.3)'; c.beginPath(); c.ellipse(B.jiji.x, 204, 12, 3, 0, 0, 7); c.fill(); DW.Sprites.draw(c, j, B.jiji.x, 204 + Math.abs(Math.sin(t * 5)) * 1.5, { frame: Math.floor(t * 4) }); }
      // lumière du matin : halo chaud et coins assombris
      const lg = c.createRadialGradient(72, 70, 10, 140, 120, 260); lg.addColorStop(0, 'rgba(255,220,160,0.18)'); lg.addColorStop(0.6, 'rgba(255,200,140,0)'); lg.addColorStop(1, 'rgba(20,10,30,0.35)');
      c.fillStyle = lg; c.fillRect(0, 0, W, H);
      c.restore();
    }

    draw(c) {
      if (this.mode === 'black') { c.fillStyle = '#000'; c.fillRect(0, 0, W, H); return; }
      if (this.mode === 'beach') this.drawBeach(c);
      else if (this.mode === 'camp') {
        if (this.pix.v > 0) {
          // le camp se décompose en pixels avant le passage dans le Digimonde
          const bc = this.buf.getContext('2d'); this.drawCamp(bc);
          const b = 1 + Math.floor(this.pix.v * 18), sw = Math.ceil(W / b), sh = Math.ceil(H / b);
          const sc = this.small.getContext('2d'); sc.imageSmoothingEnabled = true;
          sc.clearRect(0, 0, W, H); sc.drawImage(this.buf, 0, 0, sw, sh);
          c.imageSmoothingEnabled = false; c.drawImage(this.small, 0, 0, sw, sh, 0, 0, sw * b, sh * b);
          c.fillStyle = `rgba(210,255,235,${this.pix.v * 0.85})`; c.fillRect(0, 0, W, H);
        } else this.drawCamp(c);
      } else if (this.mode === 'tunnel') this.drawTunnel(c);
      else this.drawSky(c);
      if (this.xf && this.xf.v > 0) { c.globalAlpha = this.xf.v; c.drawImage(this.xbuf, 0, 0); c.globalAlpha = 1; }
      if (this.flash > 0) { c.fillStyle = `rgba(255,255,255,${Math.min(1, this.flash)})`; c.fillRect(0, 0, W, H); }
      // bandes cinéma + légende
      const bh = Math.round(22 * this.bars.v);
      c.fillStyle = '#000'; c.fillRect(0, 0, W, bh); c.fillRect(0, H - bh, W, bh);
      if (this.cap.a > 0) {
        c.globalAlpha = this.cap.a;
        const ls = UI.wrap(c, this.line, 296, 9).slice(0, 2), y0 = H - 26 - (ls.length - 1) * 12;
        c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(0, y0 - 12, W, ls.length * 12 + 7);
        ls.forEach((l, i) => UI.text(c, l, W / 2, y0 + i * 12, { size: 9, align: 'center' }));
        c.globalAlpha = 1;
      }
    }
  }
  DW.IntroScene = IntroScene;

  // ------------------------------------------------------------ réveil : les paupières s'ouvrent
  class WakeScene extends DW.Scene {
    constructor() { super(); this.overlay = true; }
    update() { if (this.t > 3.0) this.close(); }
    draw(c) {
      const t = this.t;
      // ouverture : entrouvert, se referme, puis s'ouvre en grand
      const o = t < 0.5 ? 0 : t < 1.1 ? (t - 0.5) / 0.6 * 0.35 : t < 1.5 ? 0.35 * (1 - (t - 1.1) / 0.4) : t < 1.8 ? 0 : Math.min(1, (t - 1.8) / 1.0);
      const e = DW.ease(o), gap = e * (H / 2 + 40);
      // flou de réveil : voile clair qui se dissipe
      c.fillStyle = `rgba(20,16,30,${0.6 * (1 - e)})`; c.fillRect(0, 0, W, H);
      c.fillStyle = '#000';
      c.beginPath(); c.moveTo(0, 0); c.lineTo(W, 0); c.lineTo(W, H / 2 - gap); c.quadraticCurveTo(W / 2, H / 2 - gap * 1.6, 0, H / 2 - gap); c.fill();
      c.beginPath(); c.moveTo(0, H); c.lineTo(W, H); c.lineTo(W, H / 2 + gap); c.quadraticCurveTo(W / 2, H / 2 + gap * 1.6, 0, H / 2 + gap); c.fill();
    }
  }
  DW.WakeScene = WakeScene;
})();
