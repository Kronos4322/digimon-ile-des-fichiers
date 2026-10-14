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
  const WNAME = { clear: 'Beau temps', cloudy: 'Nuageux', rain: 'Pluie', fog: 'Brume', snow: 'Neige', storm: 'Orage', blizzard: 'Tempête de neige', gale: 'Tempête', heat: 'Canicule' };
  // calendrier : 10 jours par mois, 3 mois par saison, 120 jours par an ; l'aventure commence le 1er mars
  const MONTHS = ['Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre', 'Janvier', 'Février'];
  const MSHORT = ['mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.', 'janv.', 'févr.'];
  const SEASONS = ['Printemps', 'Été', 'Automne', 'Hiver'];
  const SEASON_COL = ['#8ae070', '#ffd040', '#f08a3a', '#bfe4ff'];
  const WEEK = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  const DAYS_M = 10;
  // durée du jour : autour de midi, l'heure « solaire » est étirée (été : jours longs) ou serrée (hiver : jours courts)
  const DAYLEN = [1, 0.86, 1, 1.14];
  // météo selon la saison (zones tempérées : forêt, village, plage) : multiplicateurs, la pluie devient neige en hiver
  const SEASON_W = [{ rain: 1.4, clear: 0.9 }, { rain: 0.5, clear: 1.4, fog: 0.5 }, { fog: 1.8, cloudy: 1.4 }, { snow: 1, clear: 0.8 }];
  // phénomènes de saison (zones tempérées) : orages au printemps et en été, canicule l'été,
  // tempêtes de vent l'automne, tempêtes de neige l'hiver ; pendant une SÉCHERESSE (été), canicule et beau temps seulement
  const SEASON_EXTRA = [[['storm', 6]], [['heat', 18], ['storm', 8]], [['gale', 12], ['storm', 3]], [['blizzard', 12]]];

  // annonce quand un phénomène commence
  const WARN = { storm: 'Un ORAGE éclate ! Tes Digimon se fatiguent dehors (techniques Électrique plus fortes).', blizzard: 'TEMPÊTE DE NEIGE ! Il fait un froid glacial : mieux vaut rester à l\'abri.', gale: 'TEMPÊTE ! Le vent souffle fort (techniques Air plus fortes).', heat: 'CANICULE ! Il fait très chaud : ton Digimon a soif et se fatigue.' };
  const T = DW.Time = {
    RATE: 1, CLIMATES: CLIMATE,
    get st() { return DW.state; },
    hour() { return (this.st.clock / 60) % 24; },
    day() { return Math.floor(this.st.clock / 1440) + 1; },
    MONTHS, SEASONS, SEASON_COL, WEEK,
    // { d (1-10), m (0-11), month, season (0-3), seasonName, year, weekday }
    date(dayN) {
      const n = (dayN || this.day()) - 1, m = Math.floor(n / DAYS_M) % 12;
      return { d: n % DAYS_M + 1, m, month: MONTHS[m], short: MSHORT[m], season: Math.floor(m / 3), seasonName: SEASONS[Math.floor(m / 3)], year: Math.floor(n / (DAYS_M * 12)) + 1, weekday: WEEK[n % 7] };
    },
    season() { return Math.floor((Math.floor((this.day() - 1) / DAYS_M) % 12) / 3); },
    dateStr() { const D = this.date(); return `${D.weekday} ${D.d} ${D.month}, an ${D.year}`; },
    // heure « solaire » (sert à la lumière et à la nuit)
    solar() { const h = this.hour(), f = DAYLEN[this.season()]; return Math.max(0, Math.min(23.99, 12 + (h - 12) * f)); },
    str() { const h = Math.floor(this.hour()), m = Math.floor(this.st.clock % 60); return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`; },
    isNight() { const h = this.solar(); return h >= 19.5 || h < 5.5; },
    phase() { const h = this.hour(); return h < 5.5 ? 'Nuit' : h < 8 ? 'Aube' : h < 17 ? 'Jour' : h < 19.5 ? 'Crépuscule' : 'Nuit'; },
    weather() { return this.st.weather.type; },
    // il pleut (pluie ou orage) : sol mouillé, flaques...
    rainy() { const w = this.weather(); return w === 'rain' || w === 'storm'; },
    // intempérie qui fatigue les Digimon dehors
    harsh() { return ['storm', 'blizzard', 'gale', 'heat'].includes(this.weather()); },
    WNAME,
    weatherName() { return WNAME[this.weather()]; },
    // { dark, col:[r,g,b] } interpolés
    light() {
      const h = this.solar();
      let i = 0;
      while (i < KEYS.length - 2 && KEYS[i + 1][0] <= h) i++;
      const [h0, d0, c0] = KEYS[i], [h1, d1, c1] = KEYS[i + 1];
      const k = (h - h0) / (h1 - h0);
      let dark = d0 + (d1 - d0) * k;
      let col = Art.mix(Art.hex(c0), Art.hex(c1), k);
      const w = this.weather();
      if (w === 'rain') { dark = Math.max(dark, 0.22); col = Art.mix(col, [90, 100, 130], 0.5); }
      else if (w === 'storm') { dark = Math.max(dark, 0.38); col = Art.mix(col, [60, 66, 100], 0.6); }
      else if (w === 'blizzard') { dark = Math.max(dark, 0.2); col = Art.mix(col, [215, 225, 245], 0.6); }
      else if (w === 'gale') { dark = Math.max(dark, 0.14); col = Art.mix(col, [170, 165, 150], 0.4); }
      else if (w === 'heat' && dark < 0.3) { dark = Math.max(dark, 0.08); col = Art.mix(col, [255, 200, 120], 0.6); }
      else if (w === 'cloudy') { dark = Math.max(dark, 0.1); col = Art.mix(col, [140, 150, 170], 0.4); }
      else if (w === 'snow') { dark = Math.max(dark, 0.12); col = Art.mix(col, [200, 215, 240], 0.5); }
      // teinte de la saison en plein jour : été doré, automne cuivré, hiver bleuté
      const se = this.season();
      if (se && dark < 0.2) { const k = 1 - dark / 0.2; dark = Math.max(dark, [0, 0.05, 0.08, 0.07][se] * k); col = Art.mix(col, [[255, 255, 255], [255, 236, 170], [255, 196, 130], [190, 214, 255]][se], k * 0.9); }
      return { dark, col };
    },
    // liste météo de la zone, ajustée à la saison
    climateList(climate) {
      const base = CLIMATE[climate] || CLIMATE.village;
      if (!['forest', 'village', 'beach'].includes(climate || 'village')) return base;
      const se = this.season(), M = SEASON_W[se];
      let list = base.map(([t, w]) => [t, w * (M[t] || 1)]);
      if (se === 3) list = list.map(([t, w]) => [t === 'rain' ? 'snow' : t, t === 'rain' ? w * 2 : w]);
      list = list.concat(SEASON_EXTRA[se]);
      if (this.drought()) list = [['heat', 60], ['clear', 40]];
      return list;
    },
    // température (°C) : saison, heure (plus chaud vers 15 h), météo et climat de la zone
    temp(climate) {
      const se = this.season(), h = this.hour();
      let t = [15, 26, 13, 1][se] + Math.sin((h - 9) / 24 * Math.PI * 2) * 5;
      t += { heat: 9, storm: -3, blizzard: -9, snow: -3, rain: -3, gale: -2, fog: -1, cloudy: -1 }[this.weather()] || 0;
      if (this.drought()) t += 3;
      t += { snow: -16, volcano: 14, beach: 2 }[climate] || 0;
      return Math.round(t);
    },
    // sécheresse en cours (été) : la récolte baisse, les Digimon se fatiguent
    drought() { const d = this.st.drought; return !!d && this.st.clock < d; },
    advance(dt, climate) {
      const st = this.st, se0 = this.season();
      st.clock += dt * this.RATE;
      if (this.season() !== se0) { const D = this.date(); DW.Care && DW.Care.toast(`${D.seasonName} arrive sur l'île ! (${D.d} ${D.month})`, SEASON_COL[D.season]); this.newWeather(climate); }
      if (st.clock >= st.weather.until) this.newWeather(climate);
      else if (climate && !this.climateList(climate).some(([w]) => w === st.weather.type)) this.newWeather(climate);
    },
    newWeather(climate) {
      const st = this.st, list = this.climateList(climate);
      let type = DW.weighted(list.map(([t, w]) => ({ t, w }))).t;
      const h = this.hour();
      if (type === 'fog' && !(h > 4 && h < 11)) type = 'cloudy';
      st.weather = { type, until: st.clock + 90 + Math.random() * 240 };
      // une canicule d'été peut tourner à la sécheresse (2 à 4 jours)
      if (type === 'heat' && !this.drought() && Math.random() < 0.3) {
        st.drought = st.clock + (2 + Math.floor(Math.random() * 3)) * 1440;
        DW.Care && DW.Care.toast('SÉCHERESSE ! Les champs souffrent et les Digimon se fatiguent vite...', '#ffb040');
      } else if (DW.Care && DW.ow && !DW.ow.map.indoor && WARN[type]) DW.Care.toast(WARN[type], '#ffd890');
    },
    // multiplicateur de dégâts selon la météo (style Pokémon)
    weatherMult(type) {
      const w = this.weather();
      if (w === 'rain') return type === 'Eau' ? 1.2 : type === 'Feu' ? 0.8 : 1;
      if (w === 'snow') return type === 'Glace' ? 1.2 : type === 'Feu' ? 0.9 : 1;
      if (w === 'storm') return type === 'Électrique' ? 1.3 : type === 'Eau' ? 1.1 : type === 'Feu' ? 0.8 : 1;
      if (w === 'blizzard') return type === 'Glace' ? 1.3 : type === 'Feu' ? 0.8 : 1;
      if (w === 'gale') return type === 'Air' ? 1.3 : type === 'Insecte' ? 0.9 : 1;
      if (w === 'heat') return type === 'Feu' ? 1.25 : type === 'Plante' ? 0.9 : type === 'Eau' ? 0.9 : 1;
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
        if (Math.random() < dt * (w === 'storm' ? 0.35 : 0.04)) { this.flash = 1; this.bolt = w === 'storm' ? { x: 30 + Math.random() * (W - 60), t: 0.25 } : null; DW.wait(0.3).then(() => DW.Audio.sfx('thunder')); }
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
        for (const d of this.drops) { c.moveTo(d.x, d.y); c.lineTo(d.x + d.l * sk, d.y - d.l * (w === 'storm' ? 1.4 : 1)); }
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
    c.fillStyle = SEASON_COL[D.season]; c.fillRect(x + 4, y + 19, 3, 2);
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
