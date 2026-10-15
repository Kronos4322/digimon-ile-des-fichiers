'use strict';
// =====================================================================
//  CALENDRIER ET INTEMPÉRIES
//  - Motimon, le gardien du calendrier (ville, à côté du grand panneau), explique les saisons
//    et la météo, et montre le calendrier de l'année (12 mois de 10 jours, 4 saisons).
//  - Intempéries (engine/time.js) : orage, tempête de neige, tempête de vent, canicule.
//    Dehors, elles fatiguent le partenaire (la canicule et la sécheresse donnent aussi faim).
//  - Sécheresse (été, 2 à 4 jours) : la récolte de Palmon baisse (maps/champs.js).
// =====================================================================
(function () {
  const { UI, Input, Audio } = DW;
  const W = DW.W, H = DW.H, T = DW.Time;
  // fatigue par minute de jeu passée dehors
  const TIRE = { storm: 0.05, blizzard: 0.07, gale: 0.03, heat: 0.05 };
  const SEASON_TXT = [
    'Printemps (mars-mai) : douceur et averses, parfois un orage.',
    'Été (juin-août) : longues journées, canicules et orages. Gare aux sécheresses !',
    'Automne (septembre-novembre) : brumes du matin et tempêtes de vent.',
    'Hiver (décembre-février) : la neige tombe, et les tempêtes de neige glacent tout.',
  ];

  const Calendar = DW.Calendar = {
    tick(ow, min) {
      const m = DW.Care.lead();
      if (!m || ow.map.indoor || ow.locked) return;
      const w = T.weather(), k = (TIRE[w] || 0) + (T.drought() ? 0.02 : 0);
      if (!k) return;
      m.tired = Math.min(100, m.tired + k * min);
      if (w === 'heat' || T.drought()) m.hunger = Math.min(100, m.hunger + 0.02 * min);
    },
    // précision de Motimon : elle grandit avec la ville (DW.Town.level)
    //  0-2 : il ne sait pas trop (jours faux, température au hasard)
    //  3-5 : la bonne date, une température approximative
    //  6+ : le CENTRE DE MÉTÉOROLOGIE (antenne) : température exacte et prévisions du lendemain
    //  8+ : la température s'affiche en permanence sur l'horloge
    skill() { const L = DW.Town.level(); return L >= 6 ? 2 : L >= 3 ? 1 : 0; },
    showTemp() { return DW.Town && DW.Town.level() >= 8; },
    // prévision du lendemain : la météo la plus probable de la saison (probabilités réelles du jeu)
    forecast() {
      const list = T.climateList('village'), tot = list.reduce((a, [, w]) => a + w, 0);
      const top = list.slice().sort((a, b) => b[1] - a[1]).slice(0, 2);
      return top.map(([t, w]) => `${T.WNAME[t]} (${Math.round(w / tot * 100)} %)`).join(', puis ');
    },
    async talk() {
      const D = T.date(), say = t => DW.say(t, 'Motimon'), sk = this.skill(), temp = T.temp('village');
      const SEASON = ['le printemps', "l'été", "l'automne", "l'hiver"];
      if (sk === 0) {
        // il débute : il se trompe souvent
        const wrong = T.date(Math.max(0, T.day() + DW.pick([-2, -1, 1, 2])) || T.day() + 1);   // (jamais un jour négatif : « -1 undefined »)
        await say(`Euh... Bonjour ! Je suis censé tenir le calendrier de l'île... On est le ${wrong.d} ${wrong.month}, je crois ? Ou peut-être pas.`);
        await say(`Il fait... ${DW.pick(['chaud', 'froid', 'tiède', 'frais'])} ? Je n'ai pas de thermomètre. Si la ville grandissait, je pourrais m'équiper !`);
      } else if (sk === 1) {
        await say(`Bonjour ! Nous sommes le ${D.weekday.toLowerCase()} ${D.d} ${D.month}, an ${D.year} : c'est ${SEASON[D.season]}.`);
        await say(`Mon vieux thermomètre indique environ ${Math.round(temp / 5) * 5} °C... à peu près.`);
      } else {
        await say(`Bienvenue au Centre de météorologie ! Nous sommes le ${D.weekday.toLowerCase()} ${D.d} ${D.month}, an ${D.year} (${SEASON[D.season]}). Il fait ${temp} °C en ville.`);
      }
      const r = await DW.ask('Que veux-tu savoir ?', ['Voir le calendrier', 'Les saisons', 'La météo', 'Rien, merci'], 'Motimon');
      if (r === 0) {
        if (sk === 0) { await say("Le calendrier ? Euh... je l'ai un peu mélangé. Reviens quand la ville aura grandi !"); return; }
        await DW.Game.push(new CalendarScene());
      } else if (r === 1) {
        if (sk === 0) { await say("Il y a quatre saisons, je crois. Ou cinq ? En tout cas, il neige parfois."); return; }
        for (const t of SEASON_TXT) await say(t);
        await say("Chaque mois dure 10 jours. Une année fait 120 jours : les Digimon, eux, ne vivent qu'une trentaine de jours... Prends soin du tien !");
      } else if (r === 2) {
        const w = T.weather();
        if (sk === 0) { await say(`La météo ? ${DW.pick(['Il va faire beau', 'Il va pleuvoir', 'Il va neiger'])}... je crois. Enfin, regarde le ciel, c'est plus sûr !`); return; }
        const info = { clear: 'Beau temps ! Idéal pour explorer.', cloudy: 'Quelques nuages, rien de grave.', rain: "Il pleut : les techniques Eau sont plus fortes, celles de Feu plus faibles.", fog: 'Brume : on y voit mal, reste sur les chemins !',
          snow: 'Il neige : les techniques Glace sont plus fortes.', storm: "ORAGE : les techniques Électrique frappent fort, et ton Digimon se fatigue s'il reste dehors.",
          blizzard: 'TEMPÊTE DE NEIGE : très éprouvant dehors ! Glace plus forte, Feu plus faible.', gale: 'TEMPÊTE : le vent porte les techniques Air, mais épuise les Digimon.',
          heat: 'CANICULE : techniques Feu plus fortes ; ton Digimon a vite faim et se fatigue.' };
        await say(info[w] || 'Le temps est calme.');
        if (T.drought()) await say(`Et nous sommes en pleine SÉCHERESSE (encore ${Math.max(1, Math.ceil((DW.state.drought - DW.state.clock) / 1440))} jour(s)) : la récolte des Champs est maigre.`);
        if (sk === 2) await say(`Prévisions pour demain : ${this.forecast()}. Montagne : ${T.temp('snow')} °C, volcan : ${T.temp('volcano')} °C.`);
        else await say("Pour les prévisions, il me faudrait un vrai centre de météorologie... La ville doit encore grandir !");
      }
    },
  };

  // ------------------------------------------------------------ écran du calendrier (l'année entière)
  class CalendarScene extends DW.Scene {
    constructor() { super(); this.overlay = true; }
    update() { if (Input.hit('ok') || Input.hit('back')) { Audio.sfx('back'); this.close(); } }
    draw(c) {
      c.fillStyle = 'rgba(6,10,24,0.82)'; c.fillRect(0, 0, W, H);
      UI.box(c, 8, 8, W - 16, H - 16);
      const D = T.date();
      UI.label(c, 'CALENDRIER', 14, 12);
      UI.text(c, `${D.weekday} ${D.d} ${D.month}, an ${D.year}  ·  ${T.weatherName()}${T.drought() ? '  ·  SÉCHERESSE' : ''}`, W / 2 + 20, 24, { size: 8, align: 'center', color: '#ffe070' });
      // 12 mois en 4 colonnes (une par saison), 10 cases par mois
      for (let mo = 0; mo < 12; mo++) {
        const se = Math.floor(mo / 3), col = se, row = mo % 3, x = 18 + col * 74, y = 54 + row * 50;
        c.fillStyle = T.SEASON_COL[se]; c.fillRect(x, y - 9, 66, 2);
        UI.text(c, T.MONTHS[mo], x, y - 11, { size: 7, color: mo === D.m ? '#ffffff' : '#c8d4e8' });
        for (let d = 0; d < 10; d++) {
          const cx = x + (d % 5) * 13, cy = y + Math.floor(d / 5) * 13, today = mo === D.m && d + 1 === D.d;
          c.fillStyle = today ? '#ff5a5a' : mo === D.m && d + 1 < D.d ? '#3a4a6a' : '#1a2440';
          c.fillRect(cx, cy, 11, 11);
          c.strokeStyle = today ? '#ffffff' : 'rgba(140,180,230,0.4)'; c.lineWidth = 1; c.strokeRect(cx + 0.5, cy + 0.5, 10, 10);
          UI.text(c, String(d + 1), cx + 5.5, cy + 8.5, { size: 6, align: 'center', color: today ? '#ffffff' : '#9ab0d8', shadow: false });
        }
      }
      // saisons
      T.SEASONS.forEach((s, i) => UI.text(c, s, 18 + i * 74 + 33, 34, { size: 7, align: 'center', color: T.SEASON_COL[i], bold: true }));
      UI.text(c, 'Printemps : averses, orages · Été : canicule, orages, sécheresse', 18, 206, { size: 6, color: '#c8f0ff' });
      UI.text(c, 'Automne : brume, tempêtes · Hiver : neige, tempêtes de neige', 18, 215, { size: 6, color: '#c8f0ff' });
      UI.hints(c, [['ok', 'fermer']], W - 16, 226);
    }
  }
  DW.CalendarScene = CalendarScene;
})();
