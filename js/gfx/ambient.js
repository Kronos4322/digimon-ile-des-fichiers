'use strict';
// =====================================================================
//  MONDE — ambiances (lumières, particules, fumées, crabes) par type de zone ; le vignettage : gfx/rendu.js
// =====================================================================
(function () {
  const Art = DW.Art, hash = Art.hash;
  const TS = 16;
  const World = DW.World;

  // ------------------------------------------------------------ ambiances
  class Ambient {
    constructor(map) {
      this.type = map.ambient || 'forest';
      this.map = map;
      this.p = []; this.t = 0;
      const th = World.themeOf(map);
      const n = th && this.type === 'forest' ? { autumn: 30, petals: 26, spores: 22, pollen: 20, mist: 14, snow: 60, ember: 30, ash: 34, dust: 22, drip: 16 }[th.particle] || 18 : { forest: 18, beach: 6, village: 22, town: 8, home: 14 }[this.type] || 10;
      this.mist = !!(th && th.mist);
      for (let i = 0; i < n; i++) this.p.push(this.spawn(true));
      this.springs = (map.gfx.objs || []).filter(o => o.kind === 'spring');
      this.glows = (map.gfx.objs || []).filter(o => o.kind === 'glowshroom' || o.kind === 'spring' || o.kind === 'lamp');
      this.flies = this.type === 'forest' && !(th && th.noFlies) ? Array.from({ length: 26 }, () => ({ x: Math.random() * map.w * TS, y: Math.random() * map.h * TS, ph: Math.random() * 6, s: 0.5 + Math.random() })) : [];
      this.digits = [];
      // bâtiments : fenêtres éclairées, cheminées qui fument, feux de cheminée
      // (bâtiment mis à l'échelle du héros : ses fenêtres et sa cheminée suivent — gfx/objects.js : TAILLE_HEROS)
      const OBJ = World.OBJ, at = (o, p) => { const S = (OBJ[o.kind] && OBJ[o.kind]._echelle) || 1; return { x: Math.round(o.x - o.spr.w / 2) + p[0] * S + 1, y: Math.round(o.y - o.spr.h + 1) + p[1] * S + 1 }; };
      this.lit = []; this.smokers = []; this.fires = [];
      for (const o of map.gfx.objs || []) {
        const D = OBJ[o.kind];
        if (!D) continue;
        for (const L of (D.lightsOf ? D.lightsOf(o.v || 0) : D.lights) || []) this.lit.push({ ...at(o, L), r: L[2] * (D._echelle || 1), fire: !!D.fire, col: L[3] });
        if (D.smoke) this.smokers.push({ ...at(o, D.smoke), t: Math.random() });
        if (D.fire) this.fires.push(at(o, D.fire));
        if (o.kind === 'bigfountain' && o.def && o.def.v === 1) this.sprays = (this.sprays || []).concat([at(o, [35, 2])]);
      }
      this.puffs = [];
      // crabes : sur le sable, près de l'eau
      this.crabs = [];
      if (this.type === 'beach') {
        const sand = [];
        map.rows.forEach((r, y) => [...r].forEach((ch, x) => { if ((ch === 's' || ch === '3') && (r[x + 1] === '~' || (map.rows[y + 1] || '')[x] === '~' || r[x + 2] === '~')) sand.push([x, y]); }));
        for (let i = 0; i < Math.min(5, sand.length); i++) { const [x, y] = sand[Math.floor(hash(i, 3, 501) * sand.length)]; this.crabs.push({ x: x * TS + 8, y: y * TS + 12, x0: x * TS + 8, ph: hash(i, 4, 501) * 6, dir: 1 }); }
      }
    }
    spawn(init) {
      const r = Math.random;
      if (this.type === 'forest') {
        const th = World.themeOf(this.map), cols = th ? th.leaves : ['#8ad860', '#c8d860', '#5ab848', '#e8c050'], pk = th ? th.particle : 'leaf';
        const c = cols[Math.floor(r() * cols.length)];
        // spores et pollen : montent doucement en brillant ; pétales et feuilles : tombent en tourbillonnant
        if (pk === 'spores' || pk === 'pollen') return { kind: 'glow', x: r() * DW.W, y: init ? r() * DW.H : DW.H + 4, vx: -2 + r() * 4, vy: -(3 + r() * 6), ph: r() * 6, c };
        if (pk === 'snow') return { kind: 'snow', x: r() * DW.W, y: init ? r() * DW.H : -4, vx: -6 + r() * 4, vy: 10 + r() * 16, ph: r() * 6, s: r() < 0.25 ? 2 : 1 };
        if (pk === 'ember') return { kind: 'ember', x: r() * DW.W, y: init ? r() * DW.H : DW.H + 4, vx: -3 + r() * 6, vy: -(10 + r() * 16), ph: r() * 6, c };
        if (pk === 'ash') return { kind: 'ash', x: r() * DW.W, y: init ? r() * DW.H : -4, vx: 4 + r() * 6, vy: 6 + r() * 8, ph: r() * 6, c };
        if (pk === 'dust') return { kind: 'ash', x: init ? r() * DW.W : -4, y: r() * DW.H, vx: 22 + r() * 18, vy: -2 + r() * 4, ph: r() * 6, c };
        if (pk === 'drip') return { kind: 'drip', x: r() * DW.W, y: init ? r() * DW.H : -4, vx: 0, vy: 60 + r() * 30, ph: r() * 6, c };
        if (pk === 'mist') return { kind: r() < 0.3 ? 'fly' : 'glow', x: r() * DW.W, y: init ? r() * DW.H : DW.H + 4, vx: 2 + r() * 3, vy: -(1 + r() * 2), ph: r() * 6, c };
        return { kind: r() < (pk === 'leaf' ? 0.2 : 0.05) ? 'fly' : pk === 'petals' ? 'petal' : 'leaf', x: r() * DW.W, y: init ? r() * DW.H : -6, vx: -4 + r() * 8 + (pk === 'autumn' ? 6 : 0), vy: 8 + r() * 10, ph: r() * 6, c };
      }
      if (this.type === 'town') return { kind: 'fly', x: r() * DW.W, y: 20 + r() * (DW.H - 40), ph: r() * 6 };
      if (this.type === 'home') return { kind: 'dust', x: r() * DW.W, y: r() * DW.H, ph: r() * 6, s: 0.4 + r() * 0.6 };
      if (this.type === 'beach') return { kind: 'gull', x: init ? r() * DW.W : -20, y: 10 + r() * 80, vx: 14 + r() * 10, ph: r() * 6 };
      return { kind: 'bubble', x: r() * DW.W, y: init ? r() * DW.H : DW.H + 6, vy: -(6 + r() * 10), r: 1.5 + r() * 2.5, ph: r() * 6, c: ['#ffc0e0', '#c0e0ff', '#d0ffd8', '#fff0b0'][Math.floor(r() * 4)] };
    }
    update(dt) {
      this.t += dt;
      for (let i = 0; i < this.p.length; i++) {
        const p = this.p[i];
        if (p.kind === 'snow' || p.kind === 'ash' || p.kind === 'drip') { p.x += (p.vx + Math.sin(this.t * 1.3 + p.ph) * (p.kind === 'drip' ? 0 : 6)) * dt; p.y += p.vy * dt; if (p.y > DW.H + 6 || p.x > DW.W + 6) this.p[i] = this.spawn(false); continue; }
        if (p.kind === 'ember') { p.x += (p.vx + Math.sin(this.t * 2 + p.ph) * 5) * dt; p.y += p.vy * dt; if (p.y < -6) this.p[i] = this.spawn(false); continue; }
        if (p.kind === 'glow') { p.x += (p.vx + Math.sin(this.t * 0.8 + p.ph) * 4) * dt; p.y += p.vy * dt; if (p.y < -6) this.p[i] = this.spawn(false); }
        else if (p.kind === 'petal') { p.x += (p.vx + Math.sin(this.t * 1.6 + p.ph) * 14) * dt; p.y += p.vy * 0.7 * dt; if (p.y > DW.H + 6) this.p[i] = this.spawn(false); }
        else if (p.kind === 'leaf') { p.x += (p.vx + Math.sin(this.t * 2 + p.ph) * 10) * dt; p.y += p.vy * dt; if (p.y > DW.H + 6) this.p[i] = this.spawn(false); }
        else if (p.kind === 'fly') { p.x += Math.sin(this.t * 0.7 + p.ph) * 14 * dt; p.y += Math.cos(this.t * 0.9 + p.ph) * 10 * dt; }
        else if (p.kind === 'dust') { p.x += Math.sin(this.t * 0.3 + p.ph) * 3 * dt; p.y += (Math.cos(this.t * 0.25 + p.ph) * 2 - 1.2) * dt * p.s; if (p.y < -4) p.y = DW.H + 4; }
        else if (p.kind === 'gull') { p.x += p.vx * dt; p.y += Math.sin(this.t + p.ph) * 4 * dt; if (p.x > DW.W + 30) this.p[i] = this.spawn(false); }
        else { p.y += p.vy * dt; p.x += Math.sin(this.t * 1.5 + p.ph) * 6 * dt; if (p.y < -8) this.p[i] = this.spawn(false); }
      }
      for (const s of this.springs) if (Math.random() < dt * 6) this.digits.push({ x: s.x + (Math.random() - 0.5) * 18, y: s.y - 8, life: 1.4, v: Math.random() < 0.5 ? '0' : '1' });
      // crabes qui trottinent ; fumée des cheminées, gouttes des jets d'eau et étincelles des feux
      for (const cr of this.crabs) {
        const k = Math.sin(this.t * 0.5 + cr.ph);
        if (Math.abs(k) > 0.3) cr.x += Math.sign(k) * 9 * dt;
        cr.x = DW.clamp(cr.x, cr.x0 - 14, cr.x0 + 14);
      }
      for (const sm of this.smokers) {
        sm.t -= dt;
        if (sm.t <= 0) { sm.t = 0.35 + Math.random() * 0.3; this.puffs.push({ x: sm.x + (Math.random() - 0.5) * 3, y: sm.y, vx: 4 + Math.random() * 4, vy: -9 - Math.random() * 4, r: 1.6, life: 3.2, max: 3.2 }); }
      }
      for (const sp of this.sprays || []) if (Math.random() < dt * 14) { const a = Math.random() * Math.PI * 2; this.puffs.push({ drop: true, x: sp.x, y: sp.y, vx: Math.cos(a) * 14, vy: -18 - Math.random() * 8, r: 1, life: 1.1, max: 1.1, floor: sp.y + 14 + Math.sin(a) * 4 }); }
      for (const fi of this.fires) if (Math.random() < dt * 5) this.puffs.push({ spark: true, x: fi.x + (Math.random() - 0.5) * 10, y: fi.y - 2, vx: (Math.random() - 0.5) * 8, vy: -14 - Math.random() * 10, r: 1, life: 0.8, max: 0.8 });
      for (let i = this.puffs.length - 1; i >= 0; i--) { const p = this.puffs[i]; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; if (p.drop) { p.vy += 60 * dt; if (p.y > p.floor) p.life = 0; } else if (!p.spark) { p.r += dt * 1.8; p.vx += dt * 2; } if (p.life <= 0) this.puffs.splice(i, 1); }
      for (let i = this.digits.length - 1; i >= 0; i--) { const d = this.digits[i]; d.y -= 14 * dt; d.life -= dt; if (d.life <= 0) this.digits.splice(i, 1); }
    }
    // sources de lumière (coordonnées monde) pour la nuit
    lights() {
      const L = [];
      for (const g of this.glows) if (g.kind === 'lamp') L.push({ x: g.x, y: g.y - 26, r: 46, col: 'rgba(255,200,110,0.6)' }); else L.push({ x: g.x, y: g.y - 8, r: g.kind === 'spring' ? 54 : 40, col: g.kind === 'spring' ? 'rgba(90,230,255,0.55)' : (g.spr === World.obj('glowshroom', 1) ? 'rgba(90,230,255,0.5)' : 'rgba(190,130,255,0.5)') });
      const night = DW.Time.light().dark > 0.3 || !!(this.map.dark && this.map.dark.d > 0.3);
      for (const w of this.lit) if (night || w.fire) L.push({ x: w.x, y: w.y, r: w.fire ? w.r * (0.92 + 0.08 * Math.sin(this.t * 9) + 0.04 * Math.sin(this.t * 23)) : w.r, col: w.fire ? 'rgba(255,150,60,0.7)' : (w.col || 'rgba(255,200,110,0.55)') });
      if (DW.Time.isNight()) for (const f of this.flies) { const k = Math.sin(this.t * 2 * f.s + f.ph); if (k > 0.2) L.push({ x: f.x + Math.sin(this.t * 0.6 + f.ph) * 20, y: f.y + Math.cos(this.t * 0.5 + f.ph) * 14, r: 10, col: 'rgba(220,255,120,0.8)' }); }
      return L;
    }
    // dans le repère du monde (déjà translaté)
    drawWorld(c, cam) {
      if (this.type === 'forest' && cam) {
        const day = !DW.Time.isNight() && DW.Time.weather() === 'clear', dark = DW.Time.light().dark;
        if (day && dark < 0.3) {
          c.save(); c.globalCompositeOperation = 'lighter';
          const x0 = Math.floor(cam.cx / 40) - 1, y0 = Math.floor(cam.cy / 40) - 1;
          for (let gy = y0; gy < y0 + 8; gy++) for (let gx = x0; gx < x0 + 10; gx++) {
            if (hash(gx, gy, 150) > 0.55) continue;
            const x = gx * 40 + hash(gx, gy, 151) * 30 + Math.sin(this.t * 0.5 + gx) * 3, y = gy * 40 + hash(gx, gy, 152) * 30 + Math.cos(this.t * 0.4 + gy) * 2;
            const a = (0.05 + 0.04 * Math.sin(this.t * 0.8 + gx * 2 + gy)) * (1 - dark * 3);
            c.fillStyle = `rgba(255,250,190,${a})`;
            c.beginPath(); c.ellipse(x, y, 7 + hash(gx, gy, 153) * 7, 4 + hash(gx, gy, 154) * 3, 0.3, 0, 7); c.fill();
          }
          c.restore();
        }
        if (DW.Time.isNight() || dark > 0.3) {
          for (const f of this.flies) {
            const k = Math.sin(this.t * 2 * f.s + f.ph);
            if (k < 0) continue;
            const x = Math.round(f.x + Math.sin(this.t * 0.6 + f.ph) * 20), y = Math.round(f.y + Math.cos(this.t * 0.5 + f.ph) * 14);
            c.fillStyle = `rgba(230,255,140,${k})`; c.fillRect(x, y, 1, 1);
            c.fillStyle = `rgba(200,255,100,${k * 0.3})`; c.fillRect(x - 1, y, 3, 1); c.fillRect(x, y - 1, 1, 3);
          }
        }
      }
      for (const cr of this.crabs) {
        const X = Math.round(cr.x), Y = Math.round(cr.y), step = Math.floor(this.t * 8 + cr.ph) % 2;
        c.fillStyle = 'rgba(0,0,0,0.2)'; c.fillRect(X - 2, Y + 2, 6, 1);
        c.fillStyle = '#d8402a'; c.fillRect(X - 2, Y, 5, 2); c.fillRect(X - 3, Y - 1 + step, 1, 1); c.fillRect(X + 3, Y - 1 + (1 - step), 1, 1);
        c.fillStyle = '#f07050'; c.fillRect(X - 1, Y, 3, 1);
        c.fillStyle = '#1a0a0a'; c.fillRect(X - 1, Y - 1, 1, 1); c.fillRect(X + 1, Y - 1, 1, 1);
        c.fillStyle = '#a82a1a'; c.fillRect(X - 3, Y + 2, 1, 1); c.fillRect(X + 3, Y + 2, 1, 1);
      }
      // fumée, étincelles, flammes qui dansent
      for (const p of this.puffs) {
        const k = p.life / p.max;
        if (p.drop) { c.fillStyle = 'rgba(200,240,255,0.85)'; c.fillRect(Math.round(p.x), Math.round(p.y), 1, 1); continue; }
        if (p.spark) { c.fillStyle = `rgba(255,${180 + Math.round(k * 60)},80,${k})`; c.fillRect(Math.round(p.x), Math.round(p.y), 1, 1); continue; }
        c.fillStyle = `rgba(235,235,240,${Math.min(0.5, k * 0.6)})`;
        c.beginPath(); c.arc(p.x, p.y, p.r, 0, 7); c.fill();
      }
      for (const fi of this.fires) {
        for (let i = 0; i < 3; i++) {
          const h = 5 + Math.sin(this.t * 11 + i * 2) * 2 + Math.sin(this.t * 17 + i) * 1.2, x = fi.x - 4 + i * 4;
          c.fillStyle = i === 1 ? 'rgba(255,230,120,0.9)' : 'rgba(255,140,40,0.85)';
          c.beginPath(); c.moveTo(x - 2.4, fi.y + 2); c.quadraticCurveTo(x - 1, fi.y - h * 0.5, x + Math.sin(this.t * 7 + i) * 1.2, fi.y - h); c.quadraticCurveTo(x + 1.6, fi.y - h * 0.4, x + 2.4, fi.y + 2); c.fill();
        }
      }
      c.font = '6px monospace'; c.textAlign = 'center';
      for (const d of this.digits) { c.fillStyle = `rgba(140,255,230,${Math.min(1, d.life)})`; c.fillText(d.v, Math.round(d.x), Math.round(d.y)); }
    }
    // à l'écran
    drawScreen(c, cam) {
      const t = this.t, W = DW.W, H = DW.H;
      if (this.type === 'forest') {
        const thm = World.themeOf(this.map);   // (rais de lumière et vignette : gfx/rendu.js)
        for (const p of this.p) {
          if (p.kind === 'snow') { c.fillStyle = 'rgba(255,255,255,0.9)'; c.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s); continue; }
          if (p.kind === 'ember') { const a = 0.5 + 0.5 * Math.sin(t * 6 + p.ph); c.fillStyle = p.c; c.globalAlpha = a; c.fillRect(Math.round(p.x), Math.round(p.y), 1, 1); c.globalAlpha = a * 0.3; c.fillRect(Math.round(p.x) - 1, Math.round(p.y), 3, 1); c.globalAlpha = 1; continue; }
          if (p.kind === 'ash') { c.fillStyle = p.c; c.globalAlpha = 0.6; c.fillRect(Math.round(p.x), Math.round(p.y), 1, 1); c.globalAlpha = 1; continue; }
          if (p.kind === 'drip') { c.fillStyle = 'rgba(170,210,255,0.6)'; c.fillRect(Math.round(p.x), Math.round(p.y), 1, 2); continue; }
          if (p.kind === 'leaf') { c.fillStyle = p.c; const s = Math.sin(t * 4 + p.ph) > 0; c.fillRect(Math.round(p.x), Math.round(p.y), s ? 2 : 1, s ? 1 : 2); }
          else if (p.kind === 'petal') { c.fillStyle = p.c; const s = Math.sin(t * 5 + p.ph); c.fillRect(Math.round(p.x), Math.round(p.y), s > 0.3 ? 2 : 1, 1); if (s > 0.6) c.fillRect(Math.round(p.x) + 1, Math.round(p.y) + 1, 1, 1); }
          else if (p.kind === 'glow') { const a = 0.45 + 0.4 * Math.sin(t * 2.4 + p.ph); c.fillStyle = p.c; c.globalAlpha = a; c.fillRect(Math.round(p.x), Math.round(p.y), 1, 1); c.globalAlpha = a * 0.35; c.fillRect(Math.round(p.x) - 1, Math.round(p.y), 3, 1); c.fillRect(Math.round(p.x), Math.round(p.y) - 1, 1, 3); c.globalAlpha = 1; }
          // (plus de papillons dessinés à l'écran : ils suivaient la caméra, donc le joueur ; les papillons du décor sont dans gfx/vivant.js)
        }
        // brume qui dérive (Sentier des Murmures)
        if (this.mist) {
          c.save();
          for (let i = 0; i < 5; i++) {
            const x = ((i * 137 + t * (5 + i) - cam.cx * 0.6) % (W + 260) + W + 260) % (W + 260) - 130, y = (i * 61 + Math.sin(t * 0.2 + i) * 12) % H + 20;
            const g = c.createRadialGradient(x, y, 4, x, y, 110);
            g.addColorStop(0, 'rgba(220,245,240,0.16)'); g.addColorStop(1, 'rgba(220,245,240,0)');
            c.fillStyle = g; c.fillRect(x - 110, y - 110, 220, 220);
          }
          c.restore();
        }
        if (thm && thm.tint) { c.fillStyle = thm.tint; c.fillRect(0, 0, W, H); }
      } else if (this.type === 'beach') {
        for (let i = 0; i < 3; i++) {
          const x = ((i * 220 + t * 7 - cam.cx) % 700 + 700) % 700 - 190, y = ((i * 150 + t * 2 - cam.cy) % 460 + 460) % 460 - 110;
          const g = c.createRadialGradient(x, y, 5, x, y, 80);
          g.addColorStop(0, 'rgba(20,40,90,0.10)'); g.addColorStop(1, 'rgba(20,40,90,0)');
          c.fillStyle = g; c.fillRect(x - 80, y - 80, 160, 160);
        }
        for (const p of this.p) {
          const up = Math.sin(t * 7 + p.ph) > 0, X = Math.round(p.x), Y = Math.round(p.y);
          const pts = up ? [[-4, 1], [-3, 0], [-2, -1], [-1, 0], [0, 1], [1, 0], [2, -1], [3, 0], [4, 1]] : [[-4, -1], [-3, -1], [-2, 0], [-1, 0], [0, 1], [1, 0], [2, 0], [3, -1], [4, -1]];
          c.fillStyle = 'rgba(0,0,40,0.18)'; pts.forEach(([a, b2]) => c.fillRect(X + a + 6, Y + b2 + 26, 1, 1));
          c.fillStyle = '#fafcff'; pts.forEach(([a, b2]) => c.fillRect(X + a, Y + b2, 1, 1));
          c.fillStyle = '#9aa0b0'; c.fillRect(X - 4, Y + (up ? 1 : -1), 1, 1); c.fillRect(X + 4, Y + (up ? 1 : -1), 1, 1);
        }
        const g = c.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, 'rgba(255,230,160,0.10)'); g.addColorStop(1, 'rgba(255,230,160,0)');
        c.fillStyle = g; c.fillRect(0, 0, W, H);
      } else if (this.type === 'town') {
        if (!DW.Time.isNight()) for (const p of this.p) {
          const X = Math.round(p.x), Y = Math.round(p.y), open = Math.sin(t * 14 + p.ph) > 0;
          c.fillStyle = ['#ffffff', '#ffd040', '#7ab8ff', '#ff9ac8'][Math.floor(p.ph * 10) % 4];
          if (open) { c.fillRect(X - 2, Y - 1, 2, 2); c.fillRect(X + 1, Y - 1, 2, 2); } else { c.fillRect(X - 1, Y - 2, 1, 3); c.fillRect(X + 1, Y - 2, 1, 3); }
          c.fillStyle = '#3a2a2a'; c.fillRect(X, Y - 1, 1, 3);
        }
        const g = c.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, 'rgba(255,230,170,0.10)'); g.addColorStop(1, 'rgba(255,230,170,0)');
        c.fillStyle = g; c.fillRect(0, 0, W, H);
      } else if (this.type === 'home') {
        // poussière dorée dans la lumière, ambiance chaleureuse
        for (const p of this.p) {
          const a = 0.25 + 0.25 * Math.sin(t * 1.5 + p.ph);
          c.fillStyle = `rgba(255,236,180,${a})`; c.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
        }
        const g = c.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, W * 0.7);
        g.addColorStop(0, 'rgba(255,200,120,0.06)'); g.addColorStop(1, 'rgba(255,170,90,0)');
        c.fillStyle = g; c.fillRect(0, 0, W, H);
      } else {
        for (const p of this.p) {
          c.globalAlpha = 0.55; c.fillStyle = p.c;
          c.beginPath(); c.arc(Math.round(p.x), Math.round(p.y), p.r, 0, 7); c.fill();
          c.globalAlpha = 0.9; c.fillStyle = '#ffffff'; c.fillRect(Math.round(p.x - p.r * 0.4), Math.round(p.y - p.r * 0.5), 1, 1);
        }
        c.globalAlpha = 1;
        const g = c.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, 'rgba(255,200,230,0.12)'); g.addColorStop(1, 'rgba(255,240,200,0.05)');
        c.fillStyle = g; c.fillRect(0, 0, W, H);
      }
    }
  }
  World.Ambient = Ambient;
})();
