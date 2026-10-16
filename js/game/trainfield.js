'use strict';
// =====================================================================
//  ENTRAÎNEMENT SUR LE TERRAIN : la séance se joue SUR LA CARTE du centre sportif
//  (caméra zoomée sur le poste), le partenaire utilise vraiment l'équipement :
//    Frappe : il cogne le mannequin   Endurance : il pousse le gros rocher
//    Sprint : il court et saute la haie   Garde : il encaisse les pierres du mur
//    Énergie : il absorbe la lumière du cristal   Méditation : il se concentre
//  3 essais, et CHAQUE POSTE A SON EXERCICE (A = ESPACE ou bouton A, B = ÉCHAP ou bouton B) :
//    mannequin (Attaque)      : marteler A le plus vite possible, la jauge de puissance doit monter haut
//    sac de frappe (Attaque)  : enchaîner les coups demandés (A gauche, B droite) avant la fin du chrono
//    rocher (PV)              : la jauge qui défile, A dans la zone jaune (blanc : parfait)
//    haies (Vitesse)          : il prend son élan ; A pile sur la marque pour sauter la haie
//    mur (Défense)            : une pierre part du mur ; A quand le cercle se referme sur lui
//    cristal (PM)             : MAINTENIR A pour charger l'énergie, relâcher dans la zone (trop : surcharge)
//  Les points, la fatigue et les résultats viennent de game/training.js (TrainingScene).
// =====================================================================
(function () {
  const { UI, Input, Audio } = DW;
  const W = DW.W, H = DW.H, TS = 16, Z = 2;


  // ------------------------------------------------------------ les exercices (un par équipement)
  // chaque jeu : hint, newRep(), update(dt) (seulement entre deux gestes), panel(c, y) (bas de l'écran)
  const bar = (c, x0, y, w, k, col) => { c.fillStyle = '#0a1426'; c.fillRect(x0 - 1, y - 1, w + 2, 10); c.fillStyle = '#2a3a5a'; c.fillRect(x0, y, w, 8); c.fillStyle = col; c.fillRect(x0, y, Math.round(w * DW.clamp(k, 0, 1)), 8); };
  const GAMES = {
    // ROCHER (PV) : la jauge qui défile (zone jaune, centre blanc)
    weights: sc => ({
      hint: 'A quand le curseur passe dans la zone jaune (au centre blanc : parfait !)',
      newRep() { this.t = 0; this.c = 0.3 + Math.random() * 0.4; this.w = 0.24 - sc.dif * 0.12; this.speed = 1.5 + sc.dif * 1.8; },
      update(dt) {
        this.t += dt; this.p = (Math.sin(this.t * this.speed * Math.PI - Math.PI / 2) + 1) / 2;
        if (Input.hit('ok')) { const d = Math.abs(this.p - this.c); sc.rep(d < this.w / 6 ? 2 : d < this.w / 2 ? 1 : 0); }
      },
      panel(c, y) {
        const x0 = 16, w = 220;
        bar(c, x0, y, w, 0, '#000');
        c.fillStyle = '#e8b830'; c.fillRect(x0 + (this.c - this.w / 2) * w, y, this.w * w, 8);
        c.fillStyle = '#ffffff'; c.fillRect(x0 + (this.c - this.w / 6) * w, y, this.w / 3 * w, 8);
        if (!sc.anim) { c.fillStyle = '#ff4040'; c.fillRect(Math.round(x0 + this.p * w) - 1, y - 3, 3, 14); }
        UI.text(c, 'Soulève le rocher : A au bon moment !', 16, y + 22, { size: 7, color: '#c8f0ff' });
      },
    }),
    // MANNEQUIN (Attaque) : marteler A, la puissance doit dépasser les repères
    dummy: sc => ({
      hint: 'Martèle A le plus vite possible : chaque coup fait monter la puissance !',
      newRep() { this.pow = 0; this.max = 0; this.time = 2.4; this.go = false; },
      update(dt) {
        if (Input.hit('ok')) { this.go = true; this.pow = Math.min(1, this.pow + 0.07 * (1 - sc.dif * 0.4) * (sc.m.tired >= 60 ? 0.85 : 1)); sc.tap = 0.14; sc.tapSide = -(sc.tapSide || 1); Audio.sfx('move'); }
        this.pow = Math.max(0, this.pow - dt * (0.22 + sc.dif * 0.2));
        this.max = Math.max(this.max, this.pow);
        if (this.go) this.time -= dt;
        if (this.time <= 0) sc.rep(this.max >= 0.9 ? 2 : this.max >= 0.6 ? 1 : 0);
      },
      panel(c, y) {
        const x0 = 16, w = 220;
        bar(c, x0, y, w, this.pow, this.pow >= 0.9 ? '#ffffff' : this.pow >= 0.6 ? '#ffd040' : '#ff6a3a');
        c.fillStyle = '#ffe070'; c.fillRect(x0 + w * 0.6, y - 3, 1, 14); c.fillStyle = '#ffffff'; c.fillRect(x0 + w * 0.9, y - 3, 1, 14);
        UI.text(c, this.go ? `Puissance max ${Math.round(this.max * 100)} %   ·   ${Math.max(0, this.time).toFixed(1)} s` : 'Frappe le mannequin : martèle A !', 16, y + 22, { size: 7, color: '#c8f0ff' });
      },
    }),
    // SAC DE FRAPPE (Attaque) : enchaîner les coups demandés, gauche (A) et droite (B)
    punchbag: sc => ({
      hint: 'Enchaîne les coups demandés : A = gauche, B = droite. Vite et sans erreur !',
      newRep() { const n = 4 + Math.round(sc.dif * 3); this.seq = Array.from({ length: n }, () => (Math.random() < 0.5 ? 'ok' : 'back')); this.i = 0; this.err = 0; this.time = 1.0 + n * (0.62 - sc.dif * 0.18); this.T = this.time; },
      update(dt) {
        this.time -= dt;
        const k = Input.hit('ok') ? 'ok' : Input.hit('back') ? 'back' : null;
        if (k) {
          if (k === this.seq[this.i]) { this.i++; sc.tap = 0.16; sc.tapSide = k === 'ok' ? -1 : 1; Audio.sfx('hit'); sc.shake = 0.06; }
          else { this.err++; Audio.sfx('bump'); }
        }
        if (this.i >= this.seq.length) sc.rep(this.err === 0 ? 2 : this.err <= 1 ? 1 : 0);
        else if (this.time <= 0 || this.err >= 3) sc.rep(this.i >= this.seq.length - 1 && this.err <= 1 ? 1 : 0);
      },
      panel(c, y) {
        const n = this.seq.length, x0 = 22;
        for (let j = 0; j < n; j++) {
          const done = j < this.i, cur = j === this.i, k = this.seq[j];
          c.fillStyle = done ? '#2a6a3a' : cur ? '#ffe070' : '#2a3a5a'; c.fillRect(x0 + j * 22, y - 4, 18, 14);
          UI.text(c, k === 'ok' ? 'A' : 'B', x0 + j * 22 + 9, y + 6, { size: 9, align: 'center', color: cur ? '#1a1a2a' : done ? '#9affa0' : k === 'ok' ? '#ff9a8a' : '#8ac8ff' });
        }
        bar(c, 16, y + 16, 220, this.time / this.T, '#8ae0f0');
        UI.text(c, `Erreurs ${this.err}/3`, 196, y + 4, { size: 7, color: this.err ? '#ff8a8a' : '#8ae0f0' });
      },
    }),
    // HAIES (Vitesse) : il prend son élan ; A quand il passe sur la marque blanche
    hurdle: sc => ({
      hint: "Il prend son élan... A pile quand il passe sur la marque blanche, devant la haie !",
      // (fenêtre large : « bien » sur toute la marque, « parfait » au centre ; plus lent au début)
      newRep() { this.run = -0.25; this.speed = 0.45 + sc.dif * 0.3; this.mark = 0.3; },
      update(dt) {
        this.run += dt * this.speed;
        if (Input.hit('ok') && this.run > 0) { const d = Math.abs(this.run - this.mark); sc.run0 = this.run; sc.rep(d < 0.05 ? 2 : d < 0.13 ? 1 : 0); return; }
        if (this.run > this.mark + 0.2) { sc.run0 = this.run; sc.rep(0); }
      },
      panel(c, y) {
        UI.text(c, 'Saute au bon moment : A sur la marque blanche !', 16, y + 4, { size: 8, color: '#c8f0ff' });
        bar(c, 16, y + 14, 220, Math.max(0, this.run) / (this.mark + 0.2), '#7aff7a');
        c.fillStyle = 'rgba(255,224,112,0.55)'; c.fillRect(16 + 220 * (this.mark - 0.13) / (this.mark + 0.2), y + 14, 220 * 0.26 / (this.mark + 0.2), 8);
        c.fillStyle = '#ffffff'; c.fillRect(16 + 220 * this.mark / (this.mark + 0.2), y + 11, 2, 14);
      },
    }),
    // MUR (Défense) : une pierre part du mur ; A quand le cercle se referme sur lui
    guardwall: sc => ({
      hint: 'Une pierre arrive ! A quand le cercle se referme sur ton Digimon pour encaisser.',
      newRep() { this.wait = 0.5 + Math.random() * 1.2; this.t = 0; this.dur = (0.95 - sc.dif * 0.3) * (0.85 + Math.random() * 0.3); this.fly = false; },
      update(dt) {
        if (!this.fly) { this.wait -= dt; if (Input.hit('ok')) { sc.rep(0); return; } if (this.wait <= 0) { this.fly = true; Audio.sfx('swoosh'); } return; }   // trop tôt : raté
        this.t += dt;
        const tau = this.dur - this.t;
        if (Input.hit('ok')) { const e = Math.abs(tau); sc.rep(e < 0.06 ? 2 : e < 0.14 ? 1 : 0); return; }
        if (tau < -0.12) sc.rep(0);
      },
      panel(c, y) { UI.text(c, this.fly ? 'Maintenant... attends que le cercle se ferme !' : 'Attention... une pierre va partir du mur !', 16, y + 4, { size: 8, color: this.fly ? '#ffe070' : '#c8f0ff' }); UI.text(c, 'Appuyer trop tôt = raté', 16, y + 20, { size: 7, color: '#8ae0f0' }); },
    }),
    // CRISTAL (PM) : maintenir A pour charger, relâcher dans la zone ; au bout : surcharge
    datacrystal: sc => ({
      hint: "MAINTIENS A pour absorber l'énergie, relâche-le dans la zone bleue. Trop longtemps : surcharge !",
      newRep() { this.e = 0; this.held = false; this.c = 0.55 + Math.random() * 0.3; this.w = 0.2 - sc.dif * 0.08; this.speed = 0.55 + sc.dif * 0.45; },
      update(dt) {
        const down = Input.isDown('ok');
        if (down) { this.held = true; this.e += dt * this.speed * (0.8 + this.e * 0.8); }
        else if (this.held) { const d = Math.abs(this.e - this.c); sc.rep(d < this.w / 6 ? 2 : d < this.w / 2 ? 1 : 0); return; }
        if (this.e >= 1) { sc.shake = 0.3; Audio.sfx('weak'); sc.rep(0); }
        sc.charge = this.e;
      },
      panel(c, y) {
        const x0 = 16, w = 220;
        bar(c, x0, y, w, this.e, '#4ae0f0');
        c.strokeStyle = '#ffffff'; c.lineWidth = 1; c.strokeRect(x0 + (this.c - this.w / 2) * w + 0.5, y - 2.5, this.w * w, 12);
        c.fillStyle = 'rgba(255,255,255,0.5)'; c.fillRect(x0 + (this.c - this.w / 6) * w, y, this.w / 3 * w, 8);
        c.fillStyle = '#ff5a5a'; c.fillRect(x0 + w - 6, y, 6, 8);
        UI.text(c, this.held ? 'Relâche dans la zone !' : 'Maintiens A pour charger...', 16, y + 22, { size: 7, color: '#c8f0ff' });
      },
    }),
  };

  class FieldTrainingScene extends DW.TrainingScene {
    constructor(m, k, spot) {
      super(m, k);
      this.ow = DW.ow; this.spot = spot;
      this.oc = DW.Art.canvas(W, H);
      this.anim = null;   // geste en cours : { res, t }
      this.eq = spot.eq || (DW.World.info(this.ow.tileAt(spot.x, spot.y)).obj) || k;   // l'équipement du poste
      this.tap = 0;
    }
    enter() {
      const ow = this.ow, P = ow.p, s = this.spot, free = (x, y) => !ow.solid(x, y) && !ow.npcAt(x, y);
      ow.locked = true; ow.hidePartner = true;
      // le Digimon s'installe sur une case LIBRE à côté du poste, de préférence à l'opposé du héros
      const pref = P.x < s.x ? 1 : P.x > s.x ? -1 : (free(s.x + 1, s.y) ? 1 : -1);
      this.side = free(s.x + pref, s.y) || !free(s.x - pref, s.y) ? pref : -pref;
      // le héros se met à l'écart pour regarder (jamais sur le chemin de son Digimon), il revient ensuite
      this.home = { x: P.x, y: P.y, dir: P.dir };
      const sd = this.side, spots = [[s.x - 2 * sd, s.y + 1], [s.x - 2 * sd, s.y], [s.x - 2 * sd, s.y + 2], [s.x - sd, s.y + 2], [s.x + 2 * sd, s.y + 2], [s.x, s.y + 3]];
      const w = spots.find(([x, y]) => free(x, y) && !(x === s.x + sd && y === s.y));
      if (w) this.place(w[0], w[1], w[0] < s.x ? 'right' : w[0] > s.x ? 'left' : 'up');
    }
    place(x, y, dir) { Object.assign(this.ow.p, { x, y, sx: x, sy: y, tx: x, ty: y, moving: false, t: 0, dir }); }
    close(r) { const h = this.home; if (h) this.place(h.x, h.y, h.dir); this.ow.locked = false; this.ow.hidePartner = false; super.close(r); }
    // le jeu de la séance, selon l'équipement (les essais sont notés par TrainingScene.hit)
    start() {
      this.state = 'play'; this.readyT = 1.1; this.endT = 1.4; Audio.sfx('buff');
      this.game = (GAMES[this.eq] || GAMES.weights)(this);
      this.game.newRep();
    }
    // un essai terminé : animation du geste, puis essai suivant
    rep(res) {
      this.anim = { res, t: 0 };
      const [x, y] = this.toScreen(this.spot.x * TS + 8, this.spot.y * TS);
      this.hit(res, x, y);
    }
    update(dt) {
      if (this.tap > 0) this.tap -= dt;
      if (this.state === 'play' && this.readyT <= 0) {
        if (this.anim) { this.anim.t += dt; if (this.anim.t > 1.1) { this.anim = null; this.charge = 0; if (this.hits.length < 3) this.game.newRep(); } if (this.hits.length >= 3 && !this.anim) { if ((this.endT -= dt) <= 0) this.finish(); } return; }
        if (this.hits.length >= 3) { if ((this.endT -= dt) <= 0) this.finish(); return; }
        this.game.update(dt);
        return;
      }
      super.update(dt);
    }
    // centre du zoom : le poste, sans sortir de l'écran
    view() {
      const cam = this.ow.camera(), sx = this.spot.x * TS + 8 - cam.cx, sy = this.spot.y * TS + 4 - cam.cy;
      return { cam, x0: DW.clamp(sx - W / (2 * Z), 0, W - W / Z), y0: DW.clamp(sy - H / (2 * Z) + 10, 0, H - H / Z) };
    }
    toScreen(wx, wy) { const v = this.view(); return [(wx - v.cam.cx - v.x0) * Z, (wy - v.cam.cy - v.y0) * Z]; }
    // ---------------------------------------------------------- dessin : la carte zoomée + le partenaire au travail
    draw(c) {
      const g = this.oc.getContext('2d');
      this.ow.draw(g);
      const v = this.view();
      c.save();
      c.imageSmoothingEnabled = false;
      if (this.shake > 0) c.translate(Math.round((Math.random() - 0.5) * 6), 0);
      c.drawImage(this.oc, v.x0, v.y0, W / Z, H / Z, 0, 0, W, H);
      // le partenaire, dans les coordonnées de la carte
      c.save(); c.scale(Z, Z); c.translate(-v.cam.cx - v.x0, -v.cam.cy - v.y0);
      this.drawWork(c);
      c.restore();
      for (const p of this.pt) { c.fillStyle = p.col; c.fillRect(p.x, p.y, 2, 2); }
      if (this.state === 'play' && this.readyT > 0) UI.text(c, this.readyT > 0.35 ? 'Prêt ?' : 'Partez !', W / 2, 110, { size: 16, align: 'center', color: '#ffffff' });
      if (this.flash > 0 && this.fx) UI.text(c, ['RATÉ...', 'BIEN !', 'PARFAIT !'][this.lastRes], this.fx[0], this.fx[1] - 16 - (0.6 - this.flash) * 30, { size: 11, align: 'center', color: ['#ff8a8a', '#ffe070', '#7aff8a'][this.lastRes] });
      c.restore();
      this.drawPanels(c);
    }
    // gestes du partenaire selon le poste
    drawWork(c) {
      const ow = this.ow, m = this.m, k = this.k, s = this.spot, t = this.t, a = this.anim;
      const sx = s.x * TS + 8, sy = s.y * TS + 15;
      const side = this.side || 1;     // (case libre choisie à l'entrée, à l'opposé du héros)
      let x = sx + side * 18, y = sy + 2, moving = false, flip = side > 0, lift = 0;
      const k1 = a ? Math.min(1, a.t / 0.35) : 0, back = a ? Math.max(0, (a.t - 0.6) / 0.5) : 0, power = a ? [0.4, 1, 1.4][a.res] : 0;
      const G = this.game, eq = this.eq;
      if (eq === 'punchbag') x = sx + side * 24;   // (le sac est large : il se place un peu plus loin)
      if (k === 'atk' && !a && this.tap > 0) x = sx + side * ((eq === 'punchbag' ? 24 : 18) - 7 * Math.sin(this.tap / 0.15 * Math.PI)) + (eq === 'punchbag' ? (this.tapSide || 1) * 3 : 0);   // coups rapides
      if (k === 'atk' && a) { x = sx + side * (18 - 12 * k1 + 12 * back); if (a.t > 0.3 && a.t < 0.5) this.shake = Math.max(this.shake, 0.15 * power); }
      else if (k === 'hp' && a) { x = sx + side * (16 - 4 * k1); lift = a.t < 0.8 ? Math.sin(a.t * 30) * power : 0; }
      else if (k === 'spd') {
        // course : il descend la piste en ligne droite et saute la haie (le héros et le panneau restent sur le côté :
        // il ne leur passe plus à travers)
        // il prend son élan (le joueur saute sur la marque), puis finit sa course
        const r0 = a ? (this.run0 || 0.3) : 0, run = a ? Math.min(1, r0 + a.t * 0.8) : Math.max(0, G && G.run != null ? G.run : 0);
        x = sx - 8; y = sy - 20 + 36 * run; moving = (a ? run < 1 : G && G.run > 0); flip = false;
        if (this.state === 'play' && !a && G) { const my = sy - 20 + 36 * G.mark; c.fillStyle = 'rgba(255,255,255,0.85)'; c.fillRect(x - 7, my + 1, 14, 2); }
        if (a) y -= Math.max(0, Math.sin(Math.min(1, a.t / 0.42) * Math.PI)) * (a.res ? 16 : 4);
        if (a && !a.res && a.t > 0.3 && a.t < 0.5) this.shake = Math.max(this.shake, 0.12);
      } else if (k === 'def' && !a && G && G.fly) {
        // la pierre vole du mur vers lui, un cercle se referme
        // (elle part de derrière le mur, haut dans le ciel, et retombe sur lui)
        const pk = Math.min(1.15, G.t / G.dur), x0 = sx + (sx - x) * 1.6, px = DW.lerp(x0, x, pk), py = DW.lerp(sy - 30, y - 10, pk) - Math.sin(Math.min(1, pk) * Math.PI) * 26;
        c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(px, DW.lerp(sy + 2, y + 1, pk), 3, 1, 0, 0, 7); c.fill();
        c.fillStyle = '#7a746a'; c.beginPath(); c.arc(px, py, 4, 0, 7); c.fill(); c.fillStyle = '#b8b2a6'; c.fillRect(px - 2, py - 3, 3, 2);
        const R = 4 + Math.max(0, 1 - pk) * 22; c.strokeStyle = pk > 0.9 ? 'rgba(255,240,120,0.95)' : 'rgba(120,200,255,0.8)'; c.lineWidth = 1; c.beginPath(); c.arc(x, y - 10, R, 0, 7); c.stroke();
        c.strokeStyle = 'rgba(255,255,255,0.5)'; c.beginPath(); c.arc(x, y - 10, 4, 0, 7); c.stroke();
      } else if (k === 'mp' && !a && this.charge > 0) {
        c.save(); c.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 8; i++) { const ang = t * 5 + i, r = 14 - this.charge * 6 + Math.sin(t * 11 + i) * 2; c.fillStyle = this.charge > 0.9 ? 'rgba(255,120,120,0.6)' : 'rgba(120,200,255,0.55)'; c.beginPath(); c.arc(x + Math.cos(ang) * r, y - 10 + Math.sin(ang) * r * 0.6, 0.8 + this.charge * 2, 0, 7); c.fill(); }
        c.restore(); lift = Math.sin(t * 40) * this.charge;
      } else if (k === 'def' && a) {
        // pierres lancées par le mur : il encaisse (moins il bouge, mieux c'est)
        const pk = Math.min(1, a.t / 0.4);
        c.fillStyle = '#8a8478'; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(DW.lerp(sx, x, pk) + i * 3, DW.lerp(sy - 10, y - 10, pk) - Math.sin(pk * Math.PI) * 8 + i * 2, 2.2, 0, 7); c.fill(); }
        if (pk >= 1) x += side * (a.res === 2 ? 0 : a.res ? 2 : 6) * Math.min(1, (a.t - 0.4) * 4);
      } else if ((k === 'mp' || k === 'int') && a) {
        // énergie du cristal (ou concentration) : rayons de lumière vers le partenaire
        c.save(); c.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 6; i++) { const ang = t * 3 + i, r = 10 + Math.sin(t * 9 + i) * 3; c.fillStyle = k === 'mp' ? 'rgba(120,200,255,0.5)' : 'rgba(255,230,140,0.5)'; c.beginPath(); c.arc(x + Math.cos(ang) * r, y - 10 + Math.sin(ang) * r * 0.6, 1.6 * power + 0.5, 0, 7); c.fill(); }
        c.restore(); lift = -Math.abs(Math.sin(a.t * 6)) * 2 * power;
      }
      ow.drawMon(c, m.sp, x, y + lift, flip, moving ? t * 14 : t * 2, moving);
      // réussite : petit saut de joie
      if (a && a.res && a.t > 0.7) { const j = Math.abs(Math.sin((a.t - 0.7) * 12)) * 3; c.fillStyle = '#ffe060'; c.fillRect(x - 1, y - 30 - j, 2, 2); }
    }
    // en-tête, jauge et résultats par-dessus la carte
    drawPanels(c) {
      const m = this.m, k = this.k, S = this.S, Tr = DW.Training;
      UI.box(c, 6, 6, W - 12, 30);
      UI.label(c, 'ENTRAÎNEMENT', 12, 10);
      UI.text(c, `${m.name} — ${S.name} (${S.stat})`, 100, 19, { size: 10, color: '#ffe070' });
      { const st = this.opts.mode === 'stat', cur = st ? ((m.raw || {})[k] || 0) : m.tr[k]; UI.text(c, `${st ? 'Statistique' : 'Digivolution'} · ${this.opts.level.name} · ${st ? S.stat + ' ' + m.stat(k) : 'Points ' + cur + ' / ' + Tr.cap(m)}`, 12, 31, { size: 7, color: '#c8f0ff' }); }
      UI.box(c, 6, 192, W - 12, 42);
      if (this.state === 'ready') {
        UI.text(c, S.desc, 16, 206, { size: 8, color: '#ffffff' });
        UI.text(c, `${S.stat} actuel : ${this.before}   ·   1 h 30 d'entraînement`, 16, 217, { size: 7, color: '#8ae0f0' });
        UI.hints(c, [['ok', 'commencer'], ['back', 'annuler']], W - 14, 229);
      } else if (this.state === 'play') {
        this.game.panel(c, 202);
        for (let j = 0; j < 3; j++) { const h = this.hits[j]; UI.text(c, h == null ? '·' : h === 2 ? '★' : h ? '●' : '✘', W - 60 + j * 14, 212, { size: 10, align: 'center', color: h == null ? '#5a8aa0' : h ? '#ffe060' : '#ff7a7a' }); }
        UI.text(c, `Essai ${Math.min(3, this.hits.length + 1)}/3`, W - 46, 228, { size: 7, align: 'center', color: '#8ae0f0' });
      } else {
        UI.text(c, this.parts ? Tr.partsText(this.parts) : this.g ? `${S.stat} : ${this.before} → ${this.after}   (+${this.g} pts)` : this.score ? `Potentiel atteint en ${S.stat} : gagne des niveaux !` : 'Séance ratée... Aucun progrès.', 16, 205, { size: 9, color: this.g ? '#7aff8a' : '#ffb070' });
        UI.text(c, this.evo ? 'Le Digivice vibre : Digivolution possible !' : `Réussite ${this.score}/6`, 16, 217, { size: 8, color: this.evo ? '#ffe070' : '#8ae0f0' });
        UI.hints(c, this.next ? [['ok', 'encore'], ['back', 'terminer']] : [['ok', 'terminer']], W - 14, 229);
      }
    }
  }
  DW.FieldTrainingScene = FieldTrainingScene;
})();
