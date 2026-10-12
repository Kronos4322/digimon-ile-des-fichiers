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

  // ------------------------------------------------------------ choix du personnage
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
        c.drawImage(DW.Sprites.hero('down', 0, k).img, x, 26);
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
      c.drawImage(spr, Math.round(cx - 30), 77, 60, 75);
      // flèches
      const bob = Math.sin(t * 6) * 2;
      UI.text(c, '◀', 96 - bob, 120, { size: 12, align: 'center', color: '#ffe680' });
      UI.text(c, '▶', 224 + bob, 120, { size: 12, align: 'center', color: '#ffe680' });
      // nom, blason, description
      UI.text(c, L.name, W / 2, 170, { size: 14, align: 'center', bold: true });
      crest(c, W / 2 - 48, 181, 4, L.crestCol, t);
      UI.text(c, 'Blason : ' + L.crest, W / 2 + 4, 184, { size: 8, align: 'center', color: L.crestCol });
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
      this.heroDir = 'down';
    }
    streak(init) { return { a: Math.random() * Math.PI * 2, r: init ? Math.random() * 200 : 4 + Math.random() * 10, v: 1.6 + Math.random() * 1.6, h: Math.random() }; }
    cloud(init) { return { a: Math.random() * Math.PI * 2, r: init ? Math.random() * 220 : 2 + Math.random() * 8, s: 0.5 + Math.random() * 0.8 }; }
    enter() { this.run(); }
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
      // 1) qui es-tu ?
      st.hero = await Game.push(new CharScene());
      st.name = await Game.push(new DW.NameScene(DW.HEROES[st.hero].name));
      // 2) le camp d'été
      await DW.fade(1, 0.4);
      Audio.play('village');
      await DW.fade(0, 0.8);
      DW.tween(this.bars, { v: 1 }, 1);
      await this.show("Été. Un camp de vacances au cœur des montagnes.");
      this.snowOn = true;
      await this.show("Soudain... il se met à neiger, en plein mois d'août.");
      DW.tween(this.aurora, { v: 1 }, 2.5);
      await this.show('Une aurore étrange illumine le ciel.');
      // 3) le Digivice tombe du ciel
      this.dv.on = true; Audio.sfx('capsule');
      await DW.tween(this.dv, { y: 194 }, 1.3, t => t * t);
      this.dv.landed = true; Audio.sfx('hit'); this.flash = 1;
      await DW.wait(0.4);
      this.heroDir = 'down';
      await this.show('Un petit objet lumineux tombe à tes pieds : un Digivice !');
      // 4) il s'illumine et t'aspire
      DW.tween(this.dv, { glow: 1 }, 1.2);
      Audio.sfx('evolve');
      await this.show(`${st.name}... Le Digivice se met à briller de plus en plus fort !`, 2.4);
      Audio.stop();
      DW.tween(this.beam, { v: 1 }, 0.8);
      await DW.tween(this.lift, { v: 1 }, 1.4);
      Audio.sfx('super');
      await DW.tween(this.pix, { v: 1 }, 0.9, DW.linear);
      // 5) tunnel numérique
      this.mode = 'tunnel'; this.flash = 1; Audio.sfx('evolve');
      this.show("Une vague de lumière t'emporte vers un autre monde...", 2.6);
      await DW.wait(4.2);
      // 6) chute dans le ciel du Digimonde, vers l'Île des Fichiers
      this.mode = 'sky'; this.flash = 1; Audio.sfx('swoosh');
      this.show("Le Digimonde... et, tout en bas, l'Île des Fichiers.", 2.4);
      await DW.tween(this.zoom, { v: 1 }, 4.6, t => t * t * (3 - 2 * t));
      Audio.sfx('hit');
      await DW.fade(1, 0.15, '#ffffff');
      await DW.wait(0.2);
      await DW.fade(1, 0.6, '#000000');
      await DW.wait(0.8);
      DW.startGame(true);
    }
    tick(dt) {
      const t = this.t;
      if (this.flash > 0) this.flash -= dt * 2.2;
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
      c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.ellipse(hx, 202, 8 * (1 - this.lift.v * 0.5), 2, 0, 0, 7); c.fill();
      const spr = DW.Sprites.hero(this.heroDir, 0).img;
      c.drawImage(spr, hx - 12, hy - 30);
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
      // le héros qui tournoie au centre, nimbé de lumière
      const spr = DW.Sprites.hero(DIRS[Math.floor(t * 5) % 4], 1).img;
      c.save(); c.translate(cx, cy); c.rotate(Math.sin(t * 1.7) * 0.6); const sc = 1.4 + Math.sin(t * 2) * 0.1; c.scale(sc, sc);
      c.shadowColor = '#c8ffe8'; c.shadowBlur = 8;
      c.drawImage(spr, -12, -15);
      c.restore();
    }

    // ---------------------------------------------------------- chute vers l'île
    drawSky(c) {
      const t = this.t, z = this.zoom.v;
      // la mer tout autour, l'île qui grandit, centrée peu à peu sur la plage
      c.fillStyle = '#103278'; c.fillRect(0, 0, W, H);
      const s = 0.4 + z * z * 2.8, fx = DW.lerp(160, 122, z), fy = DW.lerp(122, 206, z);
      c.save(); c.translate(W / 2, H / 2); c.scale(s, s); c.translate(-fx, -fy);
      c.imageSmoothingEnabled = false; c.drawImage(DW.islandImage(), 0, 0);
      c.restore();
      // brume d'altitude qui se dissipe
      c.fillStyle = `rgba(200,230,255,${0.55 * (1 - z)})`; c.fillRect(0, 0, W, H);
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
      const sc = 1.6 - z * 0.9, spr = DW.Sprites.hero('up', Math.floor(t * 8) % 4).img;
      c.save(); c.translate(W / 2 + Math.sin(t * 2) * 6, H / 2 - 20 + Math.cos(t * 1.6) * 4); c.rotate(Math.sin(t * 3) * 0.25); c.scale(sc, sc);
      c.drawImage(spr, -12, -15); c.restore();
    }

    draw(c) {
      if (this.mode === 'camp') {
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
      if (this.flash > 0) { c.fillStyle = `rgba(255,255,255,${Math.min(1, this.flash)})`; c.fillRect(0, 0, W, H); }
      // bandes cinéma + légende
      const bh = Math.round(22 * this.bars.v);
      c.fillStyle = '#000'; c.fillRect(0, 0, W, bh); c.fillRect(0, H - bh, W, bh);
      if (this.cap.a > 0) {
        c.globalAlpha = this.cap.a;
        const ls = UI.wrap(c, this.line, 290, 10), y0 = ls.length > 1 ? H - 26 : H - 18;
        c.fillStyle = 'rgba(0,0,0,0.55)'; c.fillRect(0, y0 - 14, W, ls.length * 13 + 8);
        ls.forEach((l, i) => UI.text(c, l, W / 2, y0 + i * 13, { size: 10, align: 'center' }));
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
