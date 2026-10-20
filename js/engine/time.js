'use strict';
// =====================================================================
//  TEMPS : horloge (1 s réelle = 1 min de jeu), calendrier et saisons, simulation de la météo (rendu : gfx/ciel.js)
// =====================================================================
(function () {
  const Art = DW.Art;
  // images-clés de la lumière : [heure, obscurité, teinte]
  const KEYS = [
    // aube bleu-violet → lever rose orangé → matinée dorée et douce → midi neutre → après-midi chaud →
    // coucher orange puis rose pourpre → crépuscule violet → nuit bleue
    [0, 0.66, '#0c1440'], [4.5, 0.64, '#0c1440'], [5.5, 0.42, '#3a2a70'], [6.5, 0.22, '#ff8a6a'], [7.5, 0.1, '#ffc088'],
    [8.5, 0.05, '#ffe2b0'], [10, 0.02, '#fff4dc'], [11.5, 0, '#ffffff'], [14.5, 0, '#ffffff'], [16, 0.03, '#fff0d0'],
    [17, 0.08, '#ffcf8a'], [18, 0.18, '#ff9a5a'], [18.8, 0.3, '#ff6a6a'], [19.5, 0.44, '#8a3a8a'],
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

  // ÉPISODES MÉTÉO DE PLUSIEURS JOURS (vraie logique sur l'année, zones tempérées : forêt, village, plage)
  //   printemps : temps doux, pluies douces (les fleurs éclosent), parfois orageux
  //   été       : grand beau, VAGUES DE CHALEUR qui durent (soif, fatigue, puis sécheresse), orages violents
  //   automne   : brumes, coups de vent, été indien
  //   hiver     : épisodes neigeux de plusieurs jours (le sol devient blanc), grisaille, froid sec
  const REGIMES = [
    [{ id: 'doux', name: 'Temps doux', days: [2, 3], w: 40, list: [['clear', 60], ['cloudy', 30], ['rain', 10]] },
     { id: 'giboulees', name: 'Pluies de printemps', days: [1, 3], w: 45, soft: true, list: [['rain', 60], ['cloudy', 30], ['clear', 10]] },
     { id: 'orageux', name: 'Temps orageux', days: [1, 1], w: 15, list: [['storm', 40], ['rain', 35], ['cloudy', 25]] }],
    [{ id: 'beau', name: 'Grand beau temps', days: [2, 4], w: 40, list: [['clear', 80], ['cloudy', 20]] },
     { id: 'canicule', name: 'Vague de chaleur', days: [3, 6], w: 35, hot: true, list: [['heat', 80], ['clear', 20]] },
     { id: 'orages', name: "Orages d'été", days: [1, 2], w: 25, violent: true, list: [['storm', 55], ['heat', 20], ['cloudy', 25]] }],
    [{ id: 'brumes', name: "Brumes d'automne", days: [2, 3], w: 40, fogAll: true, list: [['fog', 45], ['cloudy', 35], ['clear', 20]] },
     { id: 'vent', name: 'Coups de vent', days: [1, 3], w: 30, list: [['gale', 45], ['rain', 30], ['cloudy', 25]] },
     { id: 'indien', name: 'Été indien', days: [1, 3], w: 30, list: [['clear', 65], ['cloudy', 35]] }],
    [{ id: 'neige', name: 'Épisode neigeux', days: [3, 5], w: 50, list: [['snow', 55], ['blizzard', 15], ['cloudy', 30]] },
     { id: 'grisaille', name: 'Grisaille', days: [2, 4], w: 30, fogAll: true, list: [['cloudy', 50], ['fog', 30], ['snow', 20]] },
     { id: 'froid', name: 'Froid sec', days: [1, 3], w: 20, list: [['clear', 75], ['cloudy', 25]] }],
  ];
  const TEMPERATE = ['forest', 'village', 'beach'];

  // alerte quand un phénomène commence (envoyée par Motimon s'il en est capable : game/calendrier.js)
  const WARN = { storm: 'Un ORAGE éclate ! Mets-toi à l\'abri le temps que l\'orage passe : la foudre peut frapper ton Digimon !', blizzard: 'TEMPÊTE DE NEIGE ! Il fait un froid glacial : mieux vaut rester à l\'abri.', gale: 'TEMPÊTE ! Le vent souffle fort (techniques Air plus fortes).', heat: 'CANICULE ! Il fait très chaud : ton Digimon a soif et se fatigue.' };
  DW.Time = {
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
    // heure « solaire » (sert à la lumière et à la nuit)
    solar() { const h = this.hour(), f = DAYLEN[this.season()]; return Math.max(0, Math.min(23.99, 12 + (h - 12) * f)); },
    str() { const h = Math.floor(this.hour()), m = Math.floor(this.st.clock % 60); return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`; },
    isNight() { const h = this.solar(); return h >= 19.5 || h < 5.5; },
    weather() { return this.st.weather.type; },
    // il pleut (pluie ou orage) : sol mouillé, flaques...
    rainy() { const w = this.weather(); return w === 'rain' || w === 'storm'; },
    // intempérie qui fatigue les Digimon dehors
    WNAME, WARN,
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
      else if (w === 'storm') { dark = Math.max(dark, 0.6); col = Art.mix(col, [40, 46, 90], 0.8); }   // orage : ciel noir bleuté (gfx/meteo.js)
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
      if (!TEMPERATE.includes(climate || 'village')) return base;
      if (this.drought()) return [['heat', 60], ['clear', 40]];
      return this.front().list.map(x => [...x]);
    },
    // épisode météo en cours (plusieurs jours) ; un nouveau commence quand il se termine ou que la saison change
    front() {
      const st = this.st, se = this.season();
      let F = st.front && REGIMES[st.front.season] && REGIMES[st.front.season].find(r => r.id === st.front.id);
      if (!F || st.front.season !== se || st.clock >= st.front.until) {
        F = DW.weighted(REGIMES[se].map(r => ({ ...r })));
        const days = F.days[0] + Math.floor(Math.random() * (F.days[1] - F.days[0] + 1));
        st.front = { id: F.id, season: se, until: st.clock + days * 1440 };
        // une vague de chaleur qui dure tourne à la SÉCHERESSE à partir du 3e jour
        if (F.hot && days >= 4) { st.droughtFrom = st.clock + 2 * 1440; st.drought = st.front.until; }
      }
      return F;
    },
    frontInfo() { const F = this.front(), st = this.st; return { ...F, daysLeft: Math.max(1, Math.ceil((st.front.until - st.clock) / 1440)) }; },
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
    drought() { const st = this.st, d = st.drought; return !!d && st.clock < d && st.clock >= (st.droughtFrom || 0); },
    advance(dt, climate) {
      const st = this.st, se0 = this.season();
      st.clock += dt * this.RATE;
      // neige au sol (elle s'accumule pendant les chutes, fond au redoux) et fleurs du printemps (après la pluie)
      const mn = dt * this.RATE, w = st.weather && st.weather.type, se = this.season();
      st.snow = Math.max(0, Math.min(1, (st.snow || 0) + (w === 'blizzard' ? mn / 90 : w === 'snow' ? mn / 200 : se === 3 ? (w === 'clear' ? -mn / 900 : 0) : -mn / 240)));
      st.bloom = Math.max(0, Math.min(1, (st.bloom || 0) + (se === 0 ? (w === 'rain' ? mn / 300 : 0) : -mn / 2000)));
      if (this.season() !== se0) { const D = this.date(); DW.Care && DW.Care.toast(`${D.seasonName} arrive sur l'île ! (${D.d} ${D.month})`, SEASON_COL[D.season]); this.newWeather(climate); }
      // le temps suivant se prépare une demi-heure avant (Motimon, au Centre de météorologie, peut l'annoncer)
      if (!st.nextW && st.clock >= st.weather.until - 30) { st.nextW = this.roll(climate); DW.Calendar && DW.Calendar.alert('soon', st.nextW); }
      if (st.clock >= st.weather.until || (st.front && st.clock >= st.front.until)) this.newWeather(climate);
      else if (climate && !this.climateList(climate).some(([w]) => w === st.weather.type)) this.newWeather(climate);
    },
    roll(climate) { return DW.weighted(this.climateList(climate).map(([t, w]) => ({ t, w }))).t; },
    newWeather(climate) {
      const st = this.st, list = this.climateList(climate);
      let type = st.nextW && list.some(([w]) => w === st.nextW) ? st.nextW : this.roll(climate);
      st.nextW = null;
      const h = this.hour();
      const fogAll = TEMPERATE.includes(climate || 'village') && this.front().fogAll;   // brumes d'automne, grisaille : toute la journée
      if (type === 'fog' && !fogAll && !(h > 4 && h < 11)) type = 'cloudy';
      const was = st.weather && st.weather.type;
      st.weather = { type, until: st.clock + 90 + Math.random() * 240 };
      // (pas d'annonce automatique : seul Motimon prévient, selon son niveau)
      if (this.drought() && !st.droughtSaid) { st.droughtSaid = true; DW.Calendar && DW.Calendar.alert('drought'); }
      if (!this.drought()) st.droughtSaid = false;
      if (type !== was && WARN[type]) DW.Calendar && DW.Calendar.alert('now', type);
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

})();
