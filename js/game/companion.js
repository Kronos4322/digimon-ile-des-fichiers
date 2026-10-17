'use strict';
// =====================================================================
//  LE PARTENAIRE SUR LA CARTE (comme dans Digimon World)
//  Quand le héros s'arrête, le partenaire vit sa vie : il regarde autour de lui,
//  sautille, fait un pas de côté, montre son humeur (bulles d'émotion), s'endort
//  la nuit... Et en marchant, il lui arrive de déterrer un objet (3 fois par jour).
// =====================================================================
(function () {
  const { Audio } = DW;
  const WANDER_T = 0.32;

  const state = ow => ow.comp || (ow.comp = { idle: 0, next: 2.5, hop: 0, emote: null, sleep: false, steps: 0, findAt: 220 });

  // humeur du partenaire → bulle d'émotion
  function mood(m) {
    if (m.hp < m.maxHp / 3 || m.tired >= 60) return 'sweat';
    if (m.happy >= 80) return DW.pick(['heart', 'note']);
    if (m.happy >= 55) return DW.pick(['note', '?']);
    return DW.pick(['?', '...']);
  }

  const Companion = DW.Companion = {
    emote(ow, k, dur = 1.6) { state(ow).emote = { k, t: 0, dur }; },
    wake(ow) {
      const C = state(ow), F = ow.f;
      C.idle = 0; C.sleep = false; C.next = 2 + Math.random() * 2;
      // un pas de côté en cours se termine aussitôt (le héros repart)
      if (F.moving && !ow.p.moving) Object.assign(F, { moving: false, x: F.tx, y: F.ty, sx: F.tx, sy: F.ty, t: 0 });
    },

    update(ow, dt) {
      const P = ow.p, F = ow.f, pt = ow.partner, C = state(ow);
      if (C.emote) { C.emote.t += dt; if (C.emote.t > C.emote.dur) C.emote = null; }
      C.hop = Math.max(0, C.hop - dt);
      if (!pt || P.moving) { C.idle = 0; C.sleep = false; return; }
      C.idle += dt;
      // pas de côté en cours
      if (F.moving) {
        F.t += dt / WANDER_T;
        if (F.t >= 1) Object.assign(F, { moving: false, x: F.tx, y: F.ty, sx: F.tx, sy: F.ty, t: 0 });
        return;
      }
      // à ses heures de sommeil (la nuit pour un diurne, le jour pour un nocturne), il finit par s'assoupir près du héros
      if (DW.Life.sleepy(pt) && !ow.map.indoor && C.idle > 9) { C.sleep = true; return; }
      if (C.idle < 1.5) return;
      C.next -= dt;
      if (C.next > 0) return;
      C.next = 2.2 + Math.random() * 3.2;
      const r = Math.random();
      if (r < 0.32) { F.face = F.face === 'left' ? 'right' : 'left'; F.back = false; }
      else if (r < 0.52) { C.hop = 0.5; Audio.sfx('text'); }
      else if (r < 0.78) {
        // petit pas vers une case libre à côté du héros
        const cand = [];
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const x = P.x + dx, y = P.y + dy;
          if ((dx || dy) && !(x === F.x && y === F.y) && Math.abs(x - F.x) + Math.abs(y - F.y) <= 2 && !ow.solid(x, y)) cand.push([x, y]);
        }
        if (cand.length) {
          const [x, y] = DW.pick(cand);
          if (x > F.x) F.face = 'right'; else if (x < F.x) F.face = 'left'; F.back = false;
          Object.assign(F, { moving: true, sx: F.x, sy: F.y, tx: x, ty: y, t: 0 });
        }
      } else Companion.emote(ow, mood(pt));
    },

    // dessin du partenaire (sautillement, sommeil) + bulle d'émotion
    draw(ow, c, pt, x, y) {
      const C = state(ow), F = ow.f, t = ow.t;
      if (C.sleep) {
        ow.drawMon(c, pt.sp, x, y, F.face === 'left', 0, false);
        for (let i = 0; i < 3; i++) {
          const k = (t * 0.5 + i / 3) % 1;
          c.globalAlpha = Math.min(1, (1 - k) * 1.6);
          DW.UI.text(c, i % 2 ? 'Z' : 'z', x + 6 + k * 10, y - 16 - k * 16, { size: 8 + i * 2, bold: true, color: '#ffffff', shadowColor: 'rgba(20,30,80,0.9)' });
          c.globalAlpha = 1;
        }
        return;
      }
      const hop = C.hop > 0 ? Math.sin((1 - C.hop / 0.5) * Math.PI) * 5 : 0;
      if (DW.Meteo && DW.Meteo.fear > 0) x += Math.round((Math.random() - 0.5) * 2.4);   // il tremble de peur (orage)
      ow.drawMon(c, pt.sp, x, y - hop, F.face === 'left', F.moving ? t * 14 : t * 1.6, F.moving, F.back);
      const busy = pt.need >= 75 || pt.hunger >= 70;
      DW.Care.drawBubble(c, pt, x, y, t);
      if (C.emote && !busy) this.drawEmote(c, C.emote, x, y - hop);
    },
    drawEmote(c, e, x, y) {
      const pop = Math.min(1, e.t * 6), fade = Math.min(1, (e.dur - e.t) * 4);
      const bx = x + 8, by = Math.round(y - 30 + Math.sin(e.t * 5) * 1);
      c.save(); c.globalAlpha = fade; c.translate(bx, by); c.scale(pop, pop);
      c.fillStyle = '#fff'; c.strokeStyle = '#203040'; c.lineWidth = 1;
      c.beginPath(); c.ellipse(0, 0, 7, 6, 0, 0, 7); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(-4, 5); c.lineTo(-6, 9); c.lineTo(-1, 5.5); c.fill();
      if (e.k === 'heart') {
        c.fillStyle = '#e83a5a';
        c.beginPath(); c.arc(-1.6, -1, 2, 0, 7); c.arc(1.6, -1, 2, 0, 7); c.fill();
        c.beginPath(); c.moveTo(-3.5, -0.2); c.lineTo(3.5, -0.2); c.lineTo(0, 3.6); c.fill();
      } else if (e.k === 'sweat') {
        c.fillStyle = '#4a9ae8'; c.beginPath(); c.moveTo(0, -4); c.quadraticCurveTo(3, 1, 0, 3); c.quadraticCurveTo(-3, 1, 0, -4); c.fill();
      } else {
        const ch = { note: '♪', '!': '!', '?': '?', '...': '...' }[e.k] || '?';
        const col = { note: '#3a6ad8', '!': '#e03a2a', '?': '#3a8a4a', '...': '#5a6a8a' }[e.k] || '#333';
        c.font = DW.UI.font(e.k === '...' ? 7 : 9); c.textAlign = 'center'; c.fillStyle = col; c.fillText(ch, 0, e.k === '...' ? 1 : 3.4);
      }
      c.restore();
    },

    // pendant la marche : le partenaire déterre parfois un objet (3 fois par jour au plus)
    stepFind(ow) {
      const C = state(ow), st = DW.state, pt = ow.partner;
      if (!pt || ow.map.indoor) return null;
      C.steps++;
      if (C.steps < C.findAt) return null;
      const day = DW.Time.day();
      if (st.flags.findDay !== day) { st.flags.findDay = day; st.flags.findN = 0; }
      if (st.flags.findN >= 3) return null;
      C.steps = 0; C.findAt = 180 + Math.floor(Math.random() * 180);
      // une Digiviande ou un DigiChampignon apparaît au sol près du héros (game/sol.js) : le partenaire le signale
      // d'un « ! », mais c'est au joueur d'aller le ramasser (3 par jour au plus)
      if (!DW.Ground || !DW.Ground.spawn(ow)) return null;
      st.flags.findN++;
      Companion.emote(ow, '!', 1.4);
      return null;
    },
  };
})();
