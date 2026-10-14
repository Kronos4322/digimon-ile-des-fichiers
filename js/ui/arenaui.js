'use strict';
// =====================================================================
//  RENDU DU COMBAT EN ARÈNE (logique : game/arena.js)
//  terrain de la région, zones d'impact qui s'allument, Digimon à l'échelle de la profondeur,
//  barres de vie en haut, journal et aide en bas, menu des techniques (le temps s'arrête)
// =====================================================================
(function () {
  const { UI } = DW;
  const W = DW.W, H = DW.H, A = DW.ArenaScene, F = A.FIELD, G = A.GRID;

  Object.assign(A.prototype, {
    drawArenaBg(c) {
      c.drawImage(DW.World.battleBg(this.bg), 0, 0);
      c.fillStyle = 'rgba(255,255,255,0.9)';
      this.clouds.forEach(cl => { c.beginPath(); c.ellipse(cl.x, cl.y, 20 * cl.s + 8, 5 * cl.s + 3, 0, 0, 7); c.ellipse(cl.x + 10, cl.y - 4, 11 * cl.s + 4, 6 * cl.s + 2, 0, 0, 7); c.fill(); });
      // bord du terrain : léger assombrissement au-delà
      c.fillStyle = 'rgba(0,0,0,0.12)';
      c.fillRect(0, F.y1 + 6, W, H - F.y1 - 6);
    },
    // zones d'impact (outil de mise au point : plus affichées en jeu, le quadrillage reste caché)
    drawZones(c) {
      for (const side of ['e', 'p']) {
        const cs = this.B[side].cast;
        if (!cs || !cs.zone || (cs.phase !== 'wind' && cs.phase !== 'fly')) continue;
        const col = side === 'e' ? '255,70,60' : '255,210,60', a = 0.22 + 0.14 * Math.sin(this.t * 14);
        for (const k of cs.zone) {
          const [cx, cy] = k.split(',').map(Number), x = F.x0 + cx * G.w, y = F.y0 + cy * G.h;
          c.fillStyle = `rgba(${col},${a})`; c.fillRect(x + 1, y + 1, G.w - 2, G.h - 2);
          c.strokeStyle = `rgba(${col},0.8)`; c.lineWidth = 1; c.strokeRect(Math.round(x) + 1.5, Math.round(y) + 1.5, Math.round(G.w) - 3, Math.round(G.h) - 3);
        }
      }
    },
    // carte de combat : sol, eau, herbes, puis décor, Digimon et héros triés en profondeur
    drawField(c) {
      const g = this.gfx, m = this.field;
      c.drawImage(g.ground, 0, 0);
      if (g.water && g.water.frames.length) c.drawImage(g.water.frames[Math.floor(this.t * g.fps) % g.water.frames.length], g.water.x, g.water.y);
      for (const tg of g.tall) c.drawImage(DW.World.tall(tg.kind, tg.v, [0, 1, 2, 1][Math.floor(this.t * 1.6 + tg.tx * 0.4) % 4]), tg.tx * 16, tg.ty * 16 - 8);
      const list = g.objs.map(o => ({ s: o.s !== undefined ? o.s : o.sort, o }));
      for (const side of ['p', 'e']) list.push({ s: this.B[side].y / 16, side });
      list.push({ s: this.hero.y / 16, hero: true });
      list.sort((a, b) => a.s - b.s);
      for (const e of list) {
        if (e.side) this.drawBody(c, e.side);
        else if (e.hero) {
          const spr = DW.Sprites.hero('right', 0);
          const hx = this.hero.x, hy = this.hero.y;
          c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(hx, hy, 7.5, 2.8, 0, 0, 7); c.fill();
          c.drawImage(spr.img, Math.round(hx - spr.w / 2), Math.round(hy + 2 - spr.h));
        } else {
          const o = e.o, s = o.spr, img = o.sprs ? o.sprs[Math.floor(this.t * o.fps + o.x * 0.013) % o.sprs.length].img : s.img;
          c.drawImage(img, Math.round(o.x - s.w / 2), Math.round(o.y - s.h + 1));
        }
      }
    },
    drawBody(c, side) {
      const s = this.spr[side], m = this.mon(side), b = this.B[side];
      if (!s.vis || !m) return;
      const sc = this.scaleOf(side);
      // ombre
      c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(b.x, b.y, 16 * sc / 0.7, 4.5 * sc / 0.7, 0, 0, 7); c.fill();
      if (s.blink > 0 && Math.floor(s.blink * 20) % 2) return;
      // l'élan des effets (s.dx) pousse le Digimon vers son adversaire
      const o = this.B[side === 'p' ? 'e' : 'p'], f = (side === 'p' ? 1 : -1) * (s.dx || 0) * 0.6, d = Math.hypot(o.x - b.x, o.y - b.y) || 1;
      const x = b.x + (o.x - b.x) / d * f, y = b.y + (o.y - b.y) / d * f + Math.abs(Math.sin(this.t * 9)) * (Math.hypot(b.vx, b.vy) > 20 ? -2 : 0);
      const opt = { scale: sc, flip: b.face < 0, white: s.white, alpha: s.alpha, frame: Math.floor(this.t * 4 + (side === 'e' ? 2 : 0)) };
      if (s.pose) DW.Sprites.draw(c, DW.Sprites.pose(m.sp, s.pose), x, y, opt);
      else DW.Sprites.draw(c, DW.Sprites.battle(m.sp), x, y, opt);
      // préparation d'une attaque / sommeil
      const top = y - DW.Sprites.battle(m.sp).h * sc - 4;
      if (b.cast && (b.cast.phase === 'wind' || b.cast.phase === 'approach')) UI.text(c, '!', x, top + Math.sin(this.t * 20), { size: 12, align: 'center', bold: true, color: side === 'e' ? '#ff6050' : '#ffe040' });
      else if (m.status === 'slp') UI.text(c, 'z', x + 8, top + Math.sin(this.t * 3) * 2, { size: 9, align: 'center', color: '#c8d4ff' });
      // combat sur place (comme Digimon World 1) : barre de vie au-dessus de l'adversaire
      if (side === 'e' && this.field && this.hud.e) {
        const r = this.hpShow.e / m.maxHp, bw = 34, bx = Math.round(x - bw / 2), by = Math.round(top - 9);
        c.fillStyle = '#0a1426'; c.fillRect(bx - 1, by - 1, bw + 2, 5);
        c.fillStyle = UI.hpColor(r); c.fillRect(bx, by, Math.round(bw * r), 3);
        UI.text(c, `${m.name} N.${m.level}`, x, by - 3, { size: 6, align: 'center', color: '#ffffff' });
        if (m.status) UI.tag(c, DW.STATUS_NAME[m.status], bx + bw + 3, by - 4, DW.STATUS_COL[m.status], 6);
      }
      if (side === 'p' && this.fleeT > 0) {
        c.fillStyle = '#10141e'; c.fillRect(x - 15, y + 5, 30, 4); c.fillStyle = '#8ad0ff'; c.fillRect(x - 14, y + 6, 28 * Math.min(1, this.fleeT), 2);
        UI.text(c, 'fuite...', x, y + 16, { size: 6, align: 'center', color: '#8ad0ff' });
      }
    },
    drawMini(c, side, x, y, w) {
      const m = this.mon(side);
      if (!m || !this.hud[side]) return;
      const right = side === 'p';
      UI.box(c, x, y, w, side === 'p' ? 40 : 32);
      UI.text(c, m.name, x + 7, y + 12, { size: 9, bold: true });
      UI.text(c, `N.${m.level}`, x + w - 7, y + 12, { size: 8, align: 'right', color: '#ffd860' });
      if (m.status) UI.tag(c, DW.STATUS_NAME[m.status] + (m.stS > 0 && m.status !== 'slp' ? ' ' + Math.ceil(m.stS) : ''), x + 9 + UI.measure(c, m.name, 9, true), y + 4, DW.STATUS_COL[m.status]);
      const r = this.hpShow[side] / m.maxHp;
      UI.text(c, 'PV', x + 7, y + 22, { size: 6, bold: true, color: '#ffd860' });
      UI.bar(c, x + 20, y + 18, w - 28, 4, r, UI.hpColor(r));
      if (right) {
        UI.text(c, `${Math.ceil(this.hpShow.p)}/${m.maxHp}`, x + w - 7, y + 32, { size: 7, align: 'right' });
        UI.text(c, `PM ${m.mp}/${m.maxMp}`, x + 7, y + 32, { size: 7, color: '#8ad0ff' });
      }
      if (DW.sigOf(m)) this.drawEnergy(c, side, x + 4, y + (right ? 44 : 36), w - 44);
      if (!right && this.st.owned[m.sp]) { c.fillStyle = '#ffd040'; c.beginPath(); c.arc(x + w - 4, y + 26, 2, 0, 7); c.fill(); }
    },
    // roue de commandes, toujours visible (en grand quand elle est ouverte)
    drawWheel(c) {
      const open = this.mode === 'acmd' && this.sub === 'wheel', cx = 252, cy = 166, k = open ? 1 : 0.72;
      c.save(); c.globalAlpha = open ? 1 : 0.8;
      c.translate(cx, cy); c.scale(k, k);
      c.strokeStyle = 'rgba(74,184,240,0.7)'; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, 30, 0, 7); c.stroke();
      c.strokeStyle = 'rgba(74,184,240,0.3)'; c.lineWidth = 1; c.beginPath(); c.arc(0, 0, 36 + Math.sin(this.t * 3) * 1.5, 0, 7); c.stroke();
      const g = c.createRadialGradient(0, 0, 4, 0, 0, 22); g.addColorStop(0, '#2a5ac8'); g.addColorStop(1, '#0a1a44');
      c.fillStyle = g; c.beginPath(); c.arc(0, 0, 21, 0, 7); c.fill(); c.strokeStyle = '#bff4ff'; c.lineWidth = 1.5; c.stroke();
      const P = this.active, mv = P && P.moves[DW.clamp(this.lastMove || 0, 0, Math.max(0, P.moves.length - 1))];
      UI.text(c, 'Attaque', 0, -1, { size: 9, align: 'center', bold: true, color: '#ffffff' });
      if (mv) { const f = UI.fit(c, DW.MOVES[mv.id].name, 38, 6, 5); UI.text(c, f.s, 0, 8, { size: f.size, align: 'center', color: '#bfe8ff' }); }
      const seg = [[0, -38, 'Garde', this.guardCd > 0], [42, 0, 'Techn.', false], [-42, 0, 'Objets', this.throwCd > 0], [0, 38, 'Fuite', !this.wild]];
      for (const [x, y, t, off] of seg) {
        DW.UI.dw3(c, x - 20, y - 8, 40, 15, false);
        UI.text(c, t, x, y + 3, { size: 8, align: 'center', bold: true, color: off ? '#6a7a9a' : '#e8f8ff' });
      }
      c.restore();
    },
    drawCmd(c) {
      const P = this.active, L = this.cmdList(), x = 104, w = 136, rowH = 13, h = 22 + L.length * rowH + 22, y = 210 - h;
      if (!L.length) return;
      UI.box(c, x, y, w, h);
      UI.text(c, this.sub === 'items' ? 'OBJETS (lancer)' : 'TECHNIQUES', x + 8, y + 12, { size: 8, bold: true, color: '#ffe070' });
      L.forEach((it, i) => {
        const yy = y + 26 + i * rowH;
        if (it.k === 'item') { UI.text(c, 'Objets ▶', x + 16, yy, { size: 8, color: this.throwCd > 0 ? '#8a8aa0' : '#ffffff' }); }
        else if (it.k === 'use') {
          c.drawImage(DW.Icons.item(it.id), x + 14, yy - 9, 10, 10);
          const nm = UI.fit(c, DW.ITEMS[it.id].name, w - 50, 8);
          UI.text(c, nm.s, x + 27, yy, { size: nm.size });
          UI.text(c, '×' + it.n, x + w - 8, yy, { size: 7, align: 'right', color: '#c8d4ff' });
        }
        else {
          const ok = P.canPay(it.id), cost = DW.mpCost(it.id);
          UI.text(c, DW.MOVES[it.id].name, x + 16, yy, { size: 8, color: ok ? '#fff' : '#8a8aa0' });
          UI.text(c, cost ? String(cost) : '—', x + w - 8, yy, { size: 7, align: 'right', color: ok ? '#9ad0ff' : '#f05050' });
        }
        if (i === this.cmd) UI.cursor(c, x + 6, yy - 3.5, this.t);
      });
      const it = L[this.cmd];
      const info = it.k === 'use' ? (DW.ITEMS[it.id].desc || '').slice(0, 34) : (() => { const mv = DW.MOVES[it.id]; return `${A.SHAPE_NAME[A.shapeOf(mv, false)]}${mv.pow ? ' · puiss. ' + mv.pow : ''}`; })();
      UI.text(c, info, x + 8, y + h - 8, { size: 7, color: '#c8d4ff' });
    },
    drawLog(c) {
      UI.box(c, 4, 214, W - 8, 24);
      if (this.log) UI.text(c, UI.wrap(c, this.log.text, 300, 8)[0], 12, 224, { size: 8 });
      const hints = this.mode === 'acmd' ? (this.sub === 'wheel' ? [['ok', 'attaque'], ['back', 'fermer']] : [['ok', 'choisir'], ['back', 'roue']])
        : [['ok', 'roue'], ['run', 'sprint'], ...(this.energy.p >= 100 && DW.sigOf(this.active) ? [['menu', 'spécial !']] : [])];
      UI.hints(c, hints, W - 10, 235);
      if (this.mode !== 'acmd') UI.text(c, 'flèches : bouger', 12, 235, { size: 6, color: '#8aa0c8', shadow: false });
    },
    draw(c) {
      const sx = this.shake > 0 ? Math.round((Math.random() - 0.5) * 8 * this.shake) : 0;
      c.save(); c.translate(sx, 0);
      if (this.field) { c.fillStyle = '#10180e'; c.fillRect(0, 0, W, H); c.translate(-Math.round(this.cam.x), -Math.round(this.cam.y)); this.drawField(c); }
      else {
        this.drawArenaBg(c);
        for (const side of ['p', 'e'].sort((a, b) => this.B[a].y - this.B[b].y)) this.drawBody(c, side);
      }
      for (const f of this.fx) {
        if (f.t < 0) continue;
        const k = f.t / f.dur;
        const x = DW.lerp(f.x0, f.x1, k), y = DW.lerp(f.y0, f.y1, k) - Math.sin(k * Math.PI) * 12 + Math.sin(f.ph + k * 20) * f.wob;
        c.fillStyle = f.col; c.beginPath(); c.arc(x, y, f.size * (1 - k * 0.3), 0, 7); c.fill();
      }
      for (const p of this.pt) { c.globalAlpha = Math.max(0, Math.min(1, p.life / (p.max * 0.5))); c.fillStyle = p.col; c.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size); }
      c.globalAlpha = 1;
      for (const e of this.fxd) if (e.t >= 0) { c.save(); e.draw(c, Math.min(1, e.t / e.dur), e.t); c.restore(); }
      // objets lancés par le héros
      for (const f of this.throws || []) if (f.x != null) { c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(f.x, this.B.p.y, 4, 1.5, 0, 0, 7); c.fill(); c.drawImage(DW.Icons.item(f.id), Math.round(f.x - 7), Math.round(f.y - 7), 14, 14); }
      // nombres et mots qui s'envolent
      for (const p of this.pops) {
        const k = p.t / 1.1;
        c.globalAlpha = Math.min(1, (1 - k) * 2.5);
        UI.text(c, p.text, p.x, p.y - k * 18, { size: p.big ? 12 : 8, align: 'center', bold: true, color: p.col });
      }
      c.globalAlpha = 1;
      c.restore();
      this.weather.draw(c); DW.Time.drawLight(c, null, this.field && this.field.indoor ? 0.75 : 0.55, this.field && this.field.dark);
      if (this.flash > 0) { c.fillStyle = `rgba(255,255,255,${Math.min(0.7, this.flash)})`; c.fillRect(0, 0, W, H); }
      if (!this.field) this.drawMini(c, 'e', 4, 4, 138);
      else if (this.hud.e && DW.sigOf(this.enemy)) this.drawEnergy(c, 'e', 8, 8, 80);
      this.drawMini(c, 'p', 172, 4, 144);
      this.drawBanner(c);
      if (this.mode === 'msg' || this.mode === 'charge') this.drawBottom(c);
      else if (this.live) { this.drawLog(c); this.drawWheel(c); if (this.mode === 'acmd') this.drawCmd(c); }
      this.drawOverlays(c);
    },
  });
})();
