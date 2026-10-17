'use strict';
// =====================================================================
//  CIEL : rendu de la lumière du jour et de la nuit (DW.Time.drawLight), particules de la météo (DW.Time.Weather),
//  horloge à l'écran (DW.Time.drawClock). La simulation (heure, saisons, météo) est dans engine/time.js.
// =====================================================================
(function () {
  const Art = DW.Art, T = DW.Time;
  const W = DW.W, H = DW.H;

  // ------------------------------------------------------------ rendu de l'éclairage
  const lightCv = Art.canvas(W, H), lx = lightCv.getContext('2d');
  const glowCache = {};
  const glow = (r, col) => {
    const key = r + col;
    if (glowCache[key]) return glowCache[key];
    const cv = Art.canvas(r * 2, r * 2), x = cv.getContext('2d');
    const g = x.createRadialGradient(r, r, 0, r, r, r);
    g.addColorStop(0, col); g.addColorStop(0.45, col.replace(/[\d.]+\)$/, m => (parseFloat(m) * 0.5) + ')')); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0, 0, r * 2, r * 2);
    return (glowCache[key] = cv);
  };
  // lights : [{x, y, r, col:'rgba(...)'}] en coordonnées écran
  // force : intensité ; amb : obscurité minimale de la zone { d, col } (grottes, cimetière...)
  T.drawLight = (c, lights, strength = 1, amb) => {
    let { dark, col } = T.light();
    if (amb && amb.d > dark * strength) { dark = amb.d / strength; col = amb.col ? Art.hex(amb.col) : col; }
    const d = Math.min(0.9, dark * strength);
    if (d > 0.005) {
      const m = Art.mix([255, 255, 255], col, Math.min(1, d * 1.35));
      lx.globalCompositeOperation = 'source-over';
      lx.fillStyle = `rgb(${m[0] | 0},${m[1] | 0},${m[2] | 0})`;
      lx.fillRect(0, 0, W, H);
      if (d > 0.15 && lights) {
        lx.globalCompositeOperation = 'lighter';
        for (const L of lights) lx.drawImage(glow(L.r, 'rgba(255,240,210,0.9)'), Math.round(L.x - L.r), Math.round(L.y - L.r));
      }
      c.save(); c.globalCompositeOperation = 'multiply'; c.drawImage(lightCv, 0, 0); c.restore();
      if (d > 0.25 && lights) {
        c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, (d - 0.25) * 2);
        for (const L of lights) if (L.col) c.drawImage(glow(Math.round(L.r * 0.7), L.col), Math.round(L.x - L.r * 0.7), Math.round(L.y - L.r * 0.7));
        c.restore();
      }
    }
  };

  // ------------------------------------------------------------ météo (particules écran)
  class Weather {
    constructor() {
      this.drops = Array.from({ length: 140 }, () => this.drop(true));
      this.splash = [];
      this.fog = Array.from({ length: 7 }, (_, i) => ({ x: Math.random() * W, y: Math.random() * H, r: 60 + Math.random() * 60, v: 3 + Math.random() * 5 }));
      this.flash = 0; this.t = 0;
      this.flakes = Array.from({ length: 110 }, () => this.flake(true));
    }
    flake(init) { return { x: Math.random() * (W + 40), y: init ? Math.random() * H : -6, v: 14 + Math.random() * 22, ph: Math.random() * 6, s: Math.random() < 0.3 ? 2 : 1 }; }
    drop(init) { return { x: Math.random() * (W + 60), y: init ? Math.random() * H : -10 - Math.random() * 40, v: 220 + Math.random() * 80, l: 5 + Math.random() * 4 }; }
    update(dt) {
      this.t += dt;
      const w = T.weather();
      if (w === 'rain' || w === 'storm') {
        const fast = w === 'storm' ? 1.35 : 1;
        for (let i = 0; i < this.drops.length; i++) {
          const d = this.drops[i];
          d.y += d.v * fast * dt; d.x -= d.v * (w === 'storm' ? 0.55 : 0.25) * dt;
          if (d.y > H * (0.3 + (i % 7) / 10)) { if (Math.random() < 0.5) this.splash.push({ x: d.x, y: d.y, t: 0 }); this.drops[i] = this.drop(false); }
        }
        if (w === 'rain' && Math.random() < dt * 0.04) { this.flash = 1; this.bolt = null; DW.wait(0.3).then(() => DW.Audio.sfx('thunder')); }   // (l'orage : gfx/meteo.js)
      }
      if (this.bolt) { this.bolt.t -= dt; if (this.bolt.t <= 0) this.bolt = null; }
      if (w === 'snow' || w === 'blizzard') for (let i = 0; i < this.flakes.length; i++) {
        const f = this.flakes[i], b = w === 'blizzard';
        f.y += f.v * (b ? 2.2 : 1) * dt; f.x += (b ? -120 : Math.sin(this.t * 1.4 + f.ph) * 10 - 6) * dt;
        if (f.x < -10) f.x += W + 40;
        if (f.y > H + 4) this.flakes[i] = this.flake(false);
      }
      for (let i = this.splash.length - 1; i >= 0; i--) { this.splash[i].t += dt; if (this.splash[i].t > 0.25) this.splash.splice(i, 1); }
      this.fog.forEach(f => { f.x += f.v * (w === 'gale' ? 14 : 1) * dt; if (f.x - f.r > W) f.x = -f.r; });
      // tempête : feuilles et poussière emportées par le vent
      if (w === 'gale') { this.leaves = this.leaves || Array.from({ length: 40 }, () => ({ x: Math.random() * W, y: Math.random() * H, v: 140 + Math.random() * 120, ph: Math.random() * 6 })); for (const l of this.leaves) { l.x += l.v * dt; l.y += Math.sin(this.t * 4 + l.ph) * 30 * dt + 10 * dt; if (l.x > W + 10) { l.x = -10; l.y = Math.random() * H; } } }
      if (this.flash > 0) this.flash -= dt * 3;
    }
    draw(c) {
      const w = T.weather();
      if (w === 'rain' || w === 'storm') {
        const sk = w === 'storm' ? 0.55 : 0.25;
        c.strokeStyle = w === 'storm' ? 'rgba(170,190,240,0.65)' : 'rgba(190,210,255,0.55)'; c.lineWidth = w === 'storm' ? 0.9 : 0.7;
        c.beginPath();
        const step = w === 'rain' && T.front && T.front().soft ? 3 : 1;   // pluie douce de printemps
        for (let i = 0; i < this.drops.length; i += step) { const d = this.drops[i]; c.moveTo(d.x, d.y); c.lineTo(d.x + d.l * sk, d.y - d.l * (w === 'storm' ? 1.4 : 1)); }
        c.stroke();
        c.strokeStyle = 'rgba(210,225,255,0.5)';
        for (const s of this.splash) { c.beginPath(); c.ellipse(s.x, s.y, 1 + s.t * 10, 0.5 + s.t * 3, 0, 0, 7); c.stroke(); }
        if (this.flash > 0) { c.fillStyle = `rgba(230,240,255,${this.flash * 0.5})`; c.fillRect(0, 0, W, H); }
        // éclair zigzag pendant l'orage
        if (this.bolt) { c.strokeStyle = 'rgba(255,255,230,0.95)'; c.lineWidth = 1.6; c.beginPath(); let bx = this.bolt.x, by = 0; c.moveTo(bx, by); while (by < H * 0.6) { by += 14 + Math.random() * 10; bx += (Math.random() - 0.5) * 26; c.lineTo(bx, by); } c.stroke(); }
      } else if (w === 'snow' || w === 'blizzard') {
        c.fillStyle = 'rgba(255,255,255,0.92)';
        if (w === 'blizzard') { c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 1; c.beginPath(); for (const f of this.flakes) { c.moveTo(f.x, f.y); c.lineTo(f.x + 6, f.y - 2); } c.stroke(); }
        else for (const f of this.flakes) c.fillRect(Math.round(f.x), Math.round(f.y), f.s, f.s);
        c.fillStyle = w === 'blizzard' ? 'rgba(235,242,255,0.32)' : 'rgba(225,235,250,0.10)'; c.fillRect(0, 0, W, H);
      } else if (w === 'gale') {
        c.strokeStyle = 'rgba(240,235,220,0.35)'; c.lineWidth = 0.8; c.beginPath();
        for (let i = 0; i < 14; i++) { const y = (i * 37 + this.t * 20) % H, x = (i * 71 + this.t * 260) % (W + 80) - 40; c.moveTo(x, y); c.lineTo(x + 30, y + 2); }
        c.stroke();
        for (const l of this.leaves || []) { c.fillStyle = Math.floor(l.ph * 10) % 2 ? '#c8803a' : '#a8642a'; c.fillRect(Math.round(l.x), Math.round(l.y), 2, 1); }
      } else if (w === 'heat') {
        // chaleur : air qui tremble
        c.fillStyle = 'rgba(255,190,90,0.07)'; c.fillRect(0, 0, W, H);
        c.strokeStyle = 'rgba(255,240,210,0.12)'; c.lineWidth = 1;
        for (let i = 0; i < 6; i++) { const y = H - 20 - i * 30; c.beginPath(); for (let x = 0; x <= W; x += 8) c.lineTo(x, y + Math.sin(x * 0.08 + this.t * 3 + i) * 2); c.stroke(); }
      } else if (w === 'fog') {
        for (const f of this.fog) {
          const g = c.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r);
          g.addColorStop(0, 'rgba(235,240,245,0.32)'); g.addColorStop(1, 'rgba(235,240,245,0)');
          c.fillStyle = g; c.fillRect(f.x - f.r, f.y - f.r, f.r * 2, f.r * 2);
        }
      }
    }
  }
  T.Weather = Weather;

  // ------------------------------------------------------------ horloge à l'écran
  T.drawClock = (c, x, y) => {
    const UI = DW.UI, w = 86, h = 22;
    UI.box(c, x, y, w, h);
    const hr = T.hour(), night = T.isNight();
    // cadran : arc jour/nuit
    const cx = x + 12, cy = y + 11;
    c.fillStyle = night ? '#1a2460' : '#5ab0f0';
    c.beginPath(); c.arc(cx, cy, 7, 0, 7); c.fill();
    const a = (hr / 24) * Math.PI * 2 + Math.PI / 2;
    const sx = cx + Math.cos(a) * 4.5, sy = cy + Math.sin(a) * 4.5;
    if (night) { c.fillStyle = '#fff4c0'; c.beginPath(); c.arc(sx, sy, 2.4, 0, 7); c.fill(); c.fillStyle = '#1a2460'; c.beginPath(); c.arc(sx + 1, sy - 0.8, 2, 0, 7); c.fill(); }
    else { c.fillStyle = '#ffd040'; c.beginPath(); c.arc(sx, sy, 2.4, 0, 7); c.fill(); }
    c.strokeStyle = '#0a1830'; c.lineWidth = 0.8; c.beginPath(); c.arc(cx, cy, 7, 0, 7); c.stroke();
    UI.text(c, T.str(), x + 23, y + 11, { size: 9, color: '#ffffff' });
    const D = T.date();
    const tp = DW.Calendar && DW.Calendar.showTemp() ? `  ${T.temp(DW.ow && DW.ow.map.climate)}°` : '';
    UI.text(c, `${D.d} ${D.short} · an ${D.year}${tp}`, x + 23, y + 19, { size: 6, color: '#8ae0f0' });
    c.fillStyle = T.SEASON_COL[D.season]; c.fillRect(x + 4, y + 19, 3, 2);
    // icône météo
    const wx = x + 74, wy = y + 11, wt = T.weather();
    if (wt === 'storm') { c.fillStyle = '#7a84a0'; c.beginPath(); c.ellipse(wx, wy - 2, 6, 3.4, 0, 0, 7); c.fill(); c.fillStyle = '#ffe040'; c.beginPath(); c.moveTo(wx, wy); c.lineTo(wx - 2, wy + 4); c.lineTo(wx, wy + 4); c.lineTo(wx - 1, wy + 7); c.lineTo(wx + 2, wy + 2); c.lineTo(wx, wy + 2); c.fill(); }
    else if (wt === 'blizzard') { c.strokeStyle = '#ffffff'; c.lineWidth = 1; for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(wx - 5, wy + i * 3); c.lineTo(wx + 5, wy + i * 3 - 2); c.stroke(); } }
    else if (wt === 'gale') { c.strokeStyle = '#e0e6ee'; c.lineWidth = 1.2; for (const dy of [-2, 2]) { c.beginPath(); c.moveTo(wx - 5, wy + dy); c.quadraticCurveTo(wx + 3, wy + dy - 3, wx + 5, wy + dy); c.stroke(); } }
    else if (wt === 'heat') { c.fillStyle = '#ff7a20'; c.beginPath(); c.arc(wx, wy, 3.8, 0, 7); c.fill(); c.fillStyle = '#ffd040'; c.beginPath(); c.arc(wx, wy, 2.2, 0, 7); c.fill(); }
    else if (wt === 'snow') { c.fillStyle = '#ffffff'; for (const [ox, oy] of [[-3, -3], [2, -1], [-1, 2], [3, 3]]) { c.fillRect(wx + ox - 1, wy + oy, 3, 1); c.fillRect(wx + ox, wy + oy - 1, 1, 3); } }
    else if (wt === 'rain') { c.fillStyle = '#b8c4d8'; c.beginPath(); c.ellipse(wx, wy - 2, 6, 3.4, 0, 0, 7); c.fill(); c.fillStyle = '#7ab8ff'; for (let i = -1; i <= 1; i++) c.fillRect(wx + i * 3, wy + 3, 1, 3); }
    else if (wt === 'cloudy' || wt === 'fog') { c.fillStyle = wt === 'fog' ? '#e0e6ee' : '#c8d0dc'; c.beginPath(); c.ellipse(wx, wy, 6, 3.6, 0, 0, 7); c.ellipse(wx + 2, wy - 2, 4, 3, 0, 0, 7); c.fill(); }
    else if (night) { c.fillStyle = '#fff0b0'; for (const [ox, oy] of [[-3, -3], [2, 1], [-1, 3]]) c.fillRect(wx + ox, wy + oy, 1, 1); }
    else { c.fillStyle = '#ffd040'; c.beginPath(); c.arc(wx, wy, 3.4, 0, 7); c.fill(); }
  };
})();
