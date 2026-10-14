'use strict';
// =====================================================================
//  AFFICHAGE DU COMBAT : fond, Digimon, effets, jauges (PV, PM, énergie), bandeau,
//  menus du bas, panneau de montée de niveau. La logique du combat est dans game/battle.js.
// =====================================================================
(function () {
  const { UI } = DW;
  const W = DW.W, H = DW.H, POS = DW.BattleScene.POS;

  // cadre façon Digimon World 2003 : bleu nuit dégradé, liseré cyan, coin bas-droit coupé
  function dw3(c, x, y, w, h, sel) {
    const k = Math.min(8, h / 2);
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + w, y); c.lineTo(x + w, y + h - k); c.lineTo(x + w - k, y + h); c.lineTo(x, y + h); c.closePath();
    const g = c.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, sel ? '#2a5ac8' : '#16306e'); g.addColorStop(1, sel ? '#163a8a' : '#0a1a44');
    c.fillStyle = g; c.fill();
    c.strokeStyle = sel ? '#bff4ff' : '#4ab8f0'; c.lineWidth = 1.5; c.stroke();
    c.strokeStyle = 'rgba(140,220,255,0.35)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x + 2, y + 2.5); c.lineTo(x + w - 2, y + 2.5); c.stroke();
  }
  DW.UI.dw3 = dw3;
  Object.assign(DW.BattleScene.prototype, {
    drawBg(c) {
      const t = this.t;
      c.drawImage(DW.World.battleBg(this.bg), 0, 0);
      // nuages
      c.fillStyle = 'rgba(255,255,255,0.9)';
      this.clouds.forEach(cl => {
        c.beginPath(); c.ellipse(cl.x, cl.y, 20 * cl.s + 8, 5 * cl.s + 3, 0, 0, 7); c.ellipse(cl.x + 10, cl.y - 4, 11 * cl.s + 4, 6 * cl.s + 2, 0, 0, 7); c.fill();
        c.fillStyle = 'rgba(200,220,255,0.6)'; c.fillRect(cl.x - 18 * cl.s - 6, cl.y + 2, 36 * cl.s + 14, 2); c.fillStyle = 'rgba(255,255,255,0.9)';
      });
      const base = this.bg.split('@')[0];
      if (base === 'plage') {
        c.fillStyle = 'rgba(200,240,255,0.8)';
        for (let i = 0; i < 18; i++) {
          const x = ((i * 53 + t * (6 + (i % 3) * 3)) % (W + 20)) - 10, y = 72 + (i % 6) * 4.5;
          if (Math.sin(t * 2 + i) > -0.2) c.fillRect(Math.round(x), Math.round(y), 4 + (i % 3) * 2, 1);
        }
      } else if (base === 'foret') {
        c.save(); c.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 3; i++) {
          const x = 60 + i * 110 + Math.sin(t * 0.4 + i) * 8, a = 0.06 + 0.03 * Math.sin(t * 0.7 + i * 2);
          const g = c.createLinearGradient(x, 0, x - 50, 200);
          g.addColorStop(0, `rgba(255,250,200,${a})`); g.addColorStop(1, 'rgba(255,250,200,0)');
          c.fillStyle = g; c.beginPath(); c.moveTo(x, 0); c.lineTo(x + 24, 0); c.lineTo(x - 40, 200); c.lineTo(x - 80, 200); c.fill();
        }
        c.restore();
      }
      DW.World.platform(c, this.bg, POS.e.x, POS.e.y - 3, 56, 12);
      DW.World.platform(c, this.bg, POS.p.x, POS.p.y - 3, 64, 14);
    },
    drawMon(c, side) {
      const s = this.spr[side], m = this.mon(side);
      if (!s.vis || !m) return;
      if (s.blink > 0 && Math.floor(s.blink * 20) % 2) return;
      const spr = DW.Sprites.battle(m.sp);
      const frame = Math.floor(this.t * 4 + (side === 'e' ? 2 : 0));
      if (s.pose) { DW.Sprites.draw(c, DW.Sprites.pose(m.sp, s.pose), POS[side].x + s.dx, POS[side].y + s.dy, { scale: s.scale, flip: side === 'e', white: s.white, alpha: s.alpha }); return; }
      DW.Sprites.draw(c, spr, POS[side].x + s.dx, POS[side].y + s.dy, { scale: s.scale, flip: side === 'e', white: s.white, alpha: s.alpha, frame });
    },
    drawHud(c) {
      if (this.hud.e) {
        const E = this.enemy;
        dw3(c, 8, 8, 136, 42);
        UI.text(c, E.name, 15, 24, { size: 10, bold: true });
        UI.text(c, `N.${E.level}`, 137, 24, { size: 9, align: 'right', color: '#ffd860' });
        if (E.status) UI.tag(c, DW.STATUS_NAME[E.status] + (E.stT > 0 && E.status !== 'slp' ? ' ' + E.stT : ''), 15 + UI.measure(c, E.name, 10, true) + 4, 15, DW.STATUS_COL[E.status]);
        UI.text(c, 'PV', 15, 35, { size: 7, bold: true, color: '#ffd860' });
        const r = this.hpShow.e / E.maxHp;
        UI.bar(c, 29, 30, 108, 4, r, UI.hpColor(r));
        let x = 15;
        E.d.types.forEach(t => { x += UI.typeTag(c, t, x, 38, 6) + 2; });
        UI.tag(c, E.d.attr.toUpperCase(), x + 1, 38, '#4a5a90', 6);
        if (this.st.owned[E.sp]) { c.fillStyle = '#ffd040'; c.beginPath(); c.arc(137, 42, 2.4, 0, 7); c.fill(); }
        if (DW.sigOf(E)) this.drawEnergy(c, 'e', 12, 54, 88);
      }
      if (this.hud.p && this.active) {
        const P = this.active;
        dw3(c, 174, 8, 140, 52);
        UI.text(c, P.name, 181, 22, { size: 10, bold: true });
        UI.text(c, `N.${P.level}`, 308, 22, { size: 9, align: 'right', color: '#ffd860' });
        if (P.status) UI.tag(c, DW.STATUS_NAME[P.status] + (P.stT > 0 && P.status !== 'slp' ? ' ' + P.stT : ''), 181 + UI.measure(c, P.name, 10, true) + 4, 13, DW.STATUS_COL[P.status]);
        UI.text(c, 'PV', 181, 33, { size: 7, bold: true, color: '#ffd860' });
        const r = this.hpShow.p / P.maxHp;
        UI.bar(c, 195, 28, 114, 4, r, UI.hpColor(r));
        UI.text(c, `${Math.ceil(this.hpShow.p)} / ${P.maxHp}`, 308, 46, { size: 9, align: 'right' });
        UI.text(c, `PM ${P.mp}/${P.maxMp}`, 181, 46, { size: 8, color: '#8ad0ff' });
        UI.text(c, 'EXP', 181, 55.5, { size: 6, bold: true, color: '#7ac0ff' });
        UI.bar(c, 195, 52, 112, 2, this.xpShow.v, '#48a8f8');
        if (DW.sigOf(P)) this.drawEnergy(c, 'p', 176, 64, 96);
      }
    },
    drawEnergy(c, side, x, y, w) {
      const v = this.energyShow[side], full = this.energy[side] >= 100;
      c.fillStyle = '#0a1426'; c.fillRect(x - 1, y - 1, w + 2, 5);
      const g = c.createLinearGradient(x, 0, x + w, 0);
      g.addColorStop(0, '#ff9a3a'); g.addColorStop(1, full ? '#fff070' : '#ffd040');
      c.fillStyle = g; c.fillRect(x, y, Math.round(w * v / 100), 3);
      if (full) { c.fillStyle = `rgba(255,255,220,${0.4 + 0.4 * Math.sin(this.t * 10)})`; c.fillRect(x, y, w, 3); }
      UI.text(c, full ? 'SPÉCIAL !' : 'ÉNERGIE', x + w + 3, y + 4, { size: 6, color: full ? '#fff070' : '#ffb060' });
    },
    drawBanner(c) {
      const b = this.banner;
      if (!b) return;
      const k = Math.min(1, b.t * 4), y = b.side === 'p' ? 70 : 96;
      c.fillStyle = 'rgba(10,10,30,0.75)'; c.fillRect(0, y - 16, W, 30);
      c.fillStyle = b.side === 'p' ? '#ffb040' : '#ff5a5a'; c.fillRect(0, y - 16, W, 2); c.fillRect(0, y + 12, W, 2);
      UI.text(c, `★ ${b.text} ★`, W / 2 + (1 - k) * (b.side === 'p' ? -200 : 200), y + 4, { size: 14, align: 'center', color: '#fff4c0', bold: true });
    },
    drawBottom(c) {
      if (this.mode === 'charge' && this.chg) {
        const g = this.chg, w = 220, x = (W - w) / 2, y = 196, f = g.v / 100;
        UI.box(c, 4, 180, 312, 56);
        UI.text(c, 'CHARGE !', W / 2, 192, { size: 10, align: 'center', bold: true, color: '#fff070' });
        c.fillStyle = '#10141e'; c.fillRect(x - 2, y - 2, w + 4, 16);
        const col = f >= 0.95 ? (Math.floor(this.t * 12) % 2 ? '#ffffff' : '#ffe040') : f > 0.6 ? '#ff8a2a' : '#ffd040';
        c.fillStyle = col; c.fillRect(x, y + (g.pop ? -1 : 0), w * f, 12 + (g.pop ? 2 : 0));
        for (let i = 1; i < 10; i++) { c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(x + i * w / 10, y, 1, 12); }
        c.fillStyle = '#5ac0ff'; c.fillRect(x, y + 15, w * Math.max(0, g.t / g.T), 2);
        UI.hints(c, [['ok', 'appuie vite pour charger !']], W / 2 + 70, 228);
        return;
      }
      if (this.mode === 'moves') {
        UI.box(c, 4, 180, 206, 56);
        const P = this.active;
        P.moves.forEach((m, i) => {
          const x = 20 + (i % 2) * 96, y = 194 + (i >> 1) * 16;
          UI.text(c, DW.MOVES[m.id].name, x, y, { size: 8, color: P.canPay(m.id) ? '#fff' : '#8a8aa0' });
        });
        UI.cursor(c, 10 + (this.mcursor % 2) * 96, 190.5 + (this.mcursor >> 1) * 16, this.t);
        const mm = P.moves[this.mcursor], mv = DW.MOVES[mm.id];
        UI.box(c, 212, 180, 104, 56);
        const cost = DW.mpCost(mm.id);
        UI.text(c, cost ? `${cost} PM` : 'Gratuit', 220, 196, { size: 9, color: P.canPay(mm.id) ? '#9ad0ff' : '#f05050' });
        UI.text(c, `${P.mp}/${P.maxMp}`, 308, 196, { size: 8, align: 'right', color: '#c8d4ff' });
        UI.typeTag(c, mv.type, 220, 202, 7);
        const tm = DW.typeMult(mv.type, this.enemy.d.types);
        if (mv.pow && this.st.seen[this.enemy.sp] && tm !== 1)
          UI.text(c, tm > 1 ? 'Efficace !' : 'Peu efficace', 308, 210, { size: 7, align: 'right', color: tm > 1 ? '#80ff80' : '#ffa080' });
        UI.text(c, mv.pow ? `Puissance ${mv.pow}` : 'Attaque de statut', 220, 229, { size: 8, color: '#c8d4ff' });
        const sig = DW.sigOf(P);
        if (sig && this.energy.p >= 100) { UI.box(c, 4, 160, 206, 18, 'dwsel'); UI.text(c, `ENTRÉE : ★ ${DW.MOVES[sig].name} (spécial)`, 12, 172, { size: 8, color: '#fff070' }); }
        return;
      }
      UI.box(c, 4, 180, 312, 56);
      if (this.mode === 'cmd') {
        UI.wrap(c, this.text, 160, 10).forEach((l, i) => UI.text(c, l, 16, 200 + i * 14));
        const labels = ['Combat', 'Objet', 'Digimon', 'Fuite'];
        labels.forEach((s, i) => {
          const y = 92 + i * 21, sel = i === this.cursor, x = 10 + (sel ? 4 : 0);
          // case carrée (pleine quand choisie), puis le bandeau
          c.fillStyle = '#0a1a44'; c.fillRect(x, y + 3, 11, 11); c.strokeStyle = '#4ab8f0'; c.lineWidth = 1; c.strokeRect(x + 0.5, y + 3.5, 10, 10);
          if (sel) { c.fillStyle = '#e8f8ff'; c.beginPath(); c.arc(x + 5.5, y + 8.5, 3, 0, 7); c.fill(); }
          dw3(c, x + 15, y, 92, 17, sel);
          UI.text(c, s, x + 22, y + 12.5, { size: 10, bold: true, color: sel ? '#ffffff' : '#c8e8ff' });
        });
        return;
      }
      let n = Math.floor(this.shown);
      UI.wrap(c, this.text, 290, 10).slice(0, 3).forEach((l, i) => {
        UI.text(c, l.slice(0, Math.max(0, n)), 16, 200 + i * 14);
        n -= l.length;
      });
    },
    draw(c) {
      const sx = this.shake > 0 ? Math.round((Math.random() - 0.5) * 8 * this.shake) : 0;
      c.save(); c.translate(sx, 0);
      this.drawBg(c);
      this.drawMon(c, 'e');
      this.drawMon(c, 'p');
      for (const f of this.fx) {
        if (f.t < 0) continue;
        const k = f.t / f.dur;
        const x = DW.lerp(f.x0, f.x1, k), y = DW.lerp(f.y0, f.y1, k) - Math.sin(k * Math.PI) * 12 + Math.sin(f.ph + k * 20) * f.wob;
        c.fillStyle = f.col; c.beginPath(); c.arc(x, y, f.size * (1 - k * 0.3), 0, 7); c.fill();
      }
      for (const p of this.pt) {
        c.globalAlpha = Math.max(0, Math.min(1, p.life / (p.max * 0.5)));
        c.fillStyle = p.col; c.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
      }
      c.globalAlpha = 1;
      for (const e of this.fxd) if (e.t >= 0) { c.save(); e.draw(c, Math.min(1, e.t / e.dur), e.t); c.restore(); }
      c.restore();
      this.weather.draw(c);
      DW.Time.drawLight(c, null, 0.55);
      if (this.flash > 0) { c.fillStyle = `rgba(255,255,255,${Math.min(0.7, this.flash)})`; c.fillRect(0, 0, W, H); }
      this.drawHud(c);
      this.drawBanner(c);
      this.drawBottom(c);
      this.drawOverlays(c);
    },
    // panneau de niveau gagné + bandes noires d'entrée (aussi pour l'arène)
    drawOverlays(c) {
      if (this.lvPanel) {
        const { m, before, after } = this.lvPanel;
        UI.box(c, 196, 52, 118, 130);
        UI.label(c, 'NIVEAU ' + m.level, 202, 57);
        [['hp', 'PV'], ['mp', 'PM'], ['atk', 'Attaque'], ['def', 'Défense'], ['spd', 'Vitesse'], ['int', 'Intell.']].forEach(([k, lab], j) => {
          const y = 82 + j * 16;
          UI.text(c, lab, 204, y, { size: 9, color: '#8ae0f0' });
          UI.text(c, String(after[k]), 276, y, { size: 9, align: 'right' });
          UI.text(c, '+' + (after[k] - before[k]), 306, y, { size: 9, align: 'right', color: '#7aff8a' });
        });
      }
      if (this.bars.v > 0) {
        const h = this.bars.v * H / 2;
        c.fillStyle = '#000'; c.fillRect(0, 0, W, h); c.fillRect(0, H - h, W, h);
      }
    },
  });
})();
