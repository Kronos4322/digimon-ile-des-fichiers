'use strict';
// =====================================================================
//  ENTRAÎNEMENT SUR LE TERRAIN : la séance se joue SUR LA CARTE du centre sportif
//  (caméra zoomée sur le poste), le partenaire utilise vraiment l'équipement :
//    Frappe : il cogne le mannequin   Endurance : il pousse le gros rocher
//    Sprint : il court et saute la haie   Garde : il encaisse les pierres du mur
//    Énergie : il absorbe la lumière du cristal   Méditation : il se concentre
//  3 essais : une jauge défile, ESPACE au bon moment (zone jaune = bien, blanche = parfait).
//  Les points, la fatigue et les résultats viennent de game/training.js (TrainingScene).
// =====================================================================
(function () {
  const { UI, Input, Audio } = DW;
  const W = DW.W, H = DW.H, TS = 16, Z = 2;

  class FieldTrainingScene extends DW.TrainingScene {
    constructor(m, k, spot) {
      super(m, k);
      this.ow = DW.ow; this.spot = spot;
      this.oc = DW.Art.canvas(W, H);
      this.anim = null;   // geste en cours : { res, t }
    }
    enter() { this.ow.locked = true; this.ow.hidePartner = true; }
    close(r) { this.ow.locked = false; this.ow.hidePartner = false; super.close(r); }
    // le jeu de la séance : la jauge (les essais sont notés par TrainingScene.hit)
    start() {
      this.state = 'play'; this.readyT = 1.1; this.endT = 1.4; Audio.sfx('buff');
      const sc = this;
      this.game = {
        hint: 'ESPACE quand le curseur passe dans la zone jaune (au centre blanc : parfait !)',
        newRep() { this.t = 0; this.c = 0.3 + Math.random() * 0.4; this.w = 0.24 - sc.dif * 0.12; this.speed = 1.5 + sc.dif * 1.8; this.waiting = true; },
        update(dt) {
          if (sc.anim) { sc.anim.t += dt; if (sc.anim.t > 1.1) { sc.anim = null; if (sc.hits.length < 3) this.newRep(); } return; }
          if (!this.waiting) this.newRep();
          this.t += dt;
          this.p = (Math.sin(this.t * this.speed * Math.PI - Math.PI / 2) + 1) / 2;
          if (Input.hit('ok')) {
            const d = Math.abs(this.p - this.c), res = d < this.w / 6 ? 2 : d < this.w / 2 ? 1 : 0;
            this.waiting = false;
            sc.anim = { res, t: 0 };
            const [x, y] = sc.toScreen(sc.spot.x * TS + 8, sc.spot.y * TS);
            sc.hit(res, x, y);
          }
        },
        draw() {},
      };
      this.game.newRep();
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
      const P = ow.pos(ow.p), side = P.x * TS + 8 < sx ? -1 : 1;     // le partenaire se place du côté du héros
      let x = sx + side * 18, y = sy + 2, moving = false, flip = side > 0, lift = 0;
      const k1 = a ? Math.min(1, a.t / 0.35) : 0, back = a ? Math.max(0, (a.t - 0.6) / 0.5) : 0, power = a ? [0.4, 1, 1.4][a.res] : 0;
      if (k === 'atk' && a) { x = sx + side * (18 - 12 * k1 + 12 * back); if (a.t > 0.3 && a.t < 0.5) this.shake = Math.max(this.shake, 0.15 * power); }
      else if (k === 'hp' && a) { x = sx + side * (16 - 4 * k1); lift = a.t < 0.8 ? Math.sin(a.t * 30) * power : 0; }
      else if (k === 'spd') {
        // course : il part de loin, accélère et saute la haie
        const run = a ? Math.min(1, a.t / 0.9) : 0;
        x = sx + side * (40 - 80 * run); moving = !!a && run < 1; flip = side > 0;
        if (a) y -= Math.max(0, Math.sin(Math.min(1, Math.max(0, (run - 0.35) / 0.3)) * Math.PI)) * (a.res ? 14 : 4);
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
      { const st = this.opts.mode === 'stat', cur = st ? ((m.raw || {})[k] || 0) : m.tr[k]; UI.text(c, `${st ? 'Statistique' : 'Digivolution'} · ${this.opts.level.name} · Points ${cur} / ${Tr.cap(m)} · Fatigue ${m.tired} %`, 12, 31, { size: 7, color: '#c8f0ff' }); }
      UI.box(c, 6, 192, W - 12, 42);
      if (this.state === 'ready') {
        UI.text(c, S.desc, 16, 206, { size: 8, color: '#ffffff' });
        UI.text(c, `${S.stat} actuel : ${this.before}   ·   1 h 30 d'entraînement`, 16, 217, { size: 7, color: '#8ae0f0' });
        UI.hints(c, [['ok', 'commencer'], ['back', 'annuler']], W - 14, 229);
      } else if (this.state === 'play') {
        // jauge
        const G = this.game, x0 = 16, w = 220, y = 202;
        c.fillStyle = '#0a1426'; c.fillRect(x0 - 1, y - 1, w + 2, 10);
        c.fillStyle = '#2a3a5a'; c.fillRect(x0, y, w, 8);
        if (G.c != null) {
          c.fillStyle = '#e8b830'; c.fillRect(x0 + (G.c - G.w / 2) * w, y, G.w * w, 8);
          c.fillStyle = '#ffffff'; c.fillRect(x0 + (G.c - G.w / 6) * w, y, G.w / 3 * w, 8);
          if (!this.anim) { c.fillStyle = '#ff4040'; c.fillRect(Math.round(x0 + G.p * w) - 1, y - 3, 3, 14); }
        }
        UI.text(c, 'ESPACE au bon moment !', 16, 224, { size: 7, color: '#c8f0ff' });
        for (let j = 0; j < 3; j++) { const h = this.hits[j]; UI.text(c, h == null ? '·' : h === 2 ? '★' : h ? '●' : '✘', W - 60 + j * 14, 212, { size: 10, align: 'center', color: h == null ? '#5a8aa0' : h ? '#ffe060' : '#ff7a7a' }); }
        UI.text(c, `Essai ${Math.min(3, this.hits.length + 1)}/3`, W - 46, 228, { size: 7, align: 'center', color: '#8ae0f0' });
      } else {
        UI.text(c, this.g ? `${S.stat} : ${this.before} → ${this.after}   (+${this.g} pts)` : this.score ? `Potentiel atteint en ${S.stat} : gagne des niveaux !` : 'Séance ratée... Aucun progrès.', 16, 205, { size: 9, color: this.g ? '#7aff8a' : '#ffb070' });
        UI.text(c, this.evo ? 'Le Digivice vibre : Digivolution possible !' : `Réussite ${this.score}/6 · Fatigue ${m.tired} %`, 16, 217, { size: 8, color: this.evo ? '#ffe070' : '#8ae0f0' });
        UI.hints(c, this.next ? [['ok', 'encore'], ['back', 'terminer']] : [['ok', 'terminer']], W - 14, 229);
      }
    }
  }
  DW.FieldTrainingScene = FieldTrainingScene;
})();
