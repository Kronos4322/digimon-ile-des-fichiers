'use strict';
// =====================================================================
//  TEMPS : horloge (1 s réelle = 1 min de jeu), jour/nuit, météo
// =====================================================================
(function () {
  const Art = DW.Art;
  const W = DW.W, H = DW.H;
  // images-clés de la lumière : [heure, obscurité, teinte]
  const KEYS = [
    [0, 0.66, '#0c1440'], [4.5, 0.64, '#0c1440'], [5.5, 0.42, '#3a2a70'], [6.5, 0.2, '#ff8a6a'], [7.5, 0.05, '#ffd0a0'],
    [8.5, 0, '#ffffff'], [16.5, 0, '#ffffff'], [17.5, 0.12, '#ffb070'], [18.5, 0.26, '#ff6a5a'], [19.5, 0.44, '#6a3a8a'],
    [20.5, 0.62, '#0c1440'], [24, 0.66, '#0c1440'],
  ];
  const CLIMATE = {
    forest: [['clear', 50], ['cloudy', 15], ['rain', 22], ['fog', 13]],
    beach: [['clear', 70], ['cloudy', 15], ['rain', 15]],
    village: [['clear', 80], ['cloudy', 12], ['rain', 8]],
    // pas de pluie sur la neige ni sur le volcan (la neige et les cendres viennent du thème de la zone)
    snow: [['clear', 45], ['cloudy', 35], ['fog', 20]],
    volcano: [['clear', 55], ['cloudy', 45]],
  };
  const WNAME = { clear: 'Beau temps', cloudy: 'Nuageux', rain: 'Pluie', fog: 'Brume' };

  const T = DW.Time = {
    RATE: 1, CLIMATES: CLIMATE,
    get st() { return DW.state; },
    hour() { return (this.st.clock / 60) % 24; },
    day() { return Math.floor(this.st.clock / 1440) + 1; },
    str() { const h = Math.floor(this.hour()), m = Math.floor(this.st.clock % 60); return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`; },
    isNight() { const h = this.hour(); return h >= 19.5 || h < 5.5; },
    phase() { const h = this.hour(); return h < 5.5 ? 'Nuit' : h < 8 ? 'Aube' : h < 17 ? 'Jour' : h < 19.5 ? 'Crépuscule' : 'Nuit'; },
    weather() { return this.st.weather.type; },
    weatherName() { return WNAME[this.weather()]; },
    // { dark, col:[r,g,b] } interpolés
    light() {
      const h = this.hour();
      let i = 0;
      while (i < KEYS.length - 2 && KEYS[i + 1][0] <= h) i++;
      const [h0, d0, c0] = KEYS[i], [h1, d1, c1] = KEYS[i + 1];
      const k = (h - h0) / (h1 - h0);
      let dark = d0 + (d1 - d0) * k;
      let col = Art.mix(Art.hex(c0), Art.hex(c1), k);
      const w = this.weather();
      if (w === 'rain') { dark = Math.max(dark, 0.22); col = Art.mix(col, [90, 100, 130], 0.5); }
      else if (w === 'cloudy') { dark = Math.max(dark, 0.1); col = Art.mix(col, [140, 150, 170], 0.4); }
      return { dark, col };
    },
    advance(dt, climate) {
      const st = this.st;
      st.clock += dt * this.RATE;
      if (st.clock >= st.weather.until) this.newWeather(climate);
      else if (climate && CLIMATE[climate] && !CLIMATE[climate].some(([w]) => w === st.weather.type)) this.newWeather(climate);
    },
    newWeather(climate) {
      const st = this.st, list = CLIMATE[climate] || CLIMATE.village;
      let type = DW.weighted(list.map(([t, w]) => ({ t, w }))).t;
      const h = this.hour();
      if (type === 'fog' && !(h > 4 && h < 11)) type = 'cloudy';
      st.weather = { type, until: st.clock + 90 + Math.random() * 240 };
    },
    // multiplicateur de dégâts selon la météo (style Pokémon)
    weatherMult(type) {
      const w = this.weather();
      if (w === 'rain') return type === 'Eau' ? 1.2 : type === 'Feu' ? 0.8 : 1;
      return 1;
    },
  };

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
    }
    drop(init) { return { x: Math.random() * (W + 60), y: init ? Math.random() * H : -10 - Math.random() * 40, v: 220 + Math.random() * 80, l: 5 + Math.random() * 4 }; }
    update(dt) {
      this.t += dt;
      const w = T.weather();
      if (w === 'rain') {
        for (let i = 0; i < this.drops.length; i++) {
          const d = this.drops[i];
          d.y += d.v * dt; d.x -= d.v * 0.25 * dt;
          if (d.y > H * (0.3 + (i % 7) / 10)) { if (Math.random() < 0.5) this.splash.push({ x: d.x, y: d.y, t: 0 }); this.drops[i] = this.drop(false); }
        }
        if (Math.random() < dt * 0.04) { this.flash = 1; DW.wait(0.3).then(() => DW.Audio.sfx('thunder')); }
      }
      for (let i = this.splash.length - 1; i >= 0; i--) { this.splash[i].t += dt; if (this.splash[i].t > 0.25) this.splash.splice(i, 1); }
      this.fog.forEach(f => { f.x += f.v * dt; if (f.x - f.r > W) f.x = -f.r; });
      if (this.flash > 0) this.flash -= dt * 3;
    }
    draw(c) {
      const w = T.weather();
      if (w === 'rain') {
        c.strokeStyle = 'rgba(190,210,255,0.55)'; c.lineWidth = 0.7;
        c.beginPath();
        for (const d of this.drops) { c.moveTo(d.x, d.y); c.lineTo(d.x + d.l * 0.25, d.y - d.l); }
        c.stroke();
        c.strokeStyle = 'rgba(210,225,255,0.5)';
        for (const s of this.splash) { c.beginPath(); c.ellipse(s.x, s.y, 1 + s.t * 10, 0.5 + s.t * 3, 0, 0, 7); c.stroke(); }
        if (this.flash > 0) { c.fillStyle = `rgba(230,240,255,${this.flash * 0.5})`; c.fillRect(0, 0, W, H); }
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
    UI.text(c, `Jour ${T.day()}`, x + 23, y + 19, { size: 6, color: '#8ae0f0' });
    // icône météo
    const wx = x + 74, wy = y + 11, wt = T.weather();
    if (wt === 'rain') { c.fillStyle = '#b8c4d8'; c.beginPath(); c.ellipse(wx, wy - 2, 6, 3.4, 0, 0, 7); c.fill(); c.fillStyle = '#7ab8ff'; for (let i = -1; i <= 1; i++) c.fillRect(wx + i * 3, wy + 3, 1, 3); }
    else if (wt === 'cloudy' || wt === 'fog') { c.fillStyle = wt === 'fog' ? '#e0e6ee' : '#c8d0dc'; c.beginPath(); c.ellipse(wx, wy, 6, 3.6, 0, 0, 7); c.ellipse(wx + 2, wy - 2, 4, 3, 0, 0, 7); c.fill(); }
    else if (night) { c.fillStyle = '#fff0b0'; for (const [ox, oy] of [[-3, -3], [2, 1], [-1, 3]]) c.fillRect(wx + ox, wy + oy, 1, 1); }
    else { c.fillStyle = '#ffd040'; c.beginPath(); c.arc(wx, wy, 3.4, 0, 7); c.fill(); }
  };
})();
