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
    // Motimon, le gardien du calendrier
    async talk() {
      const D = T.date(), say = t => DW.say(t, 'Motimon');
      await say(`Bonjour ! Je tiens le calendrier de l'île. Nous sommes le ${D.weekday.toLowerCase()} ${D.d} ${D.month}, an ${D.year} : c'est ${['le printemps', "l'été", "l'automne", "l'hiver"][D.season]}.`);
      const r = await DW.ask('Que veux-tu savoir ?', ['Voir le calendrier', 'Les saisons', 'La météo du moment', 'Rien, merci'], 'Motimon');
      if (r === 0) await DW.Game.push(new CalendarScene());
      else if (r === 1) { for (const t of SEASON_TXT) await say(t); await say("Chaque mois dure 10 jours. Une année fait 120 jours : les Digimon, eux, ne vivent qu'une vingtaine de jours... Prends soin du tien !"); }
      else if (r === 2) {
        const w = T.weather();
        const info = { clear: 'Beau temps ! Idéal pour explorer.', cloudy: 'Quelques nuages, rien de grave.', rain: "Il pleut : les techniques Eau sont plus fortes, celles de Feu plus faibles.", fog: 'Brume : on y voit mal, reste sur les chemins !',
          snow: 'Il neige : les techniques Glace sont plus fortes.', storm: "ORAGE : les techniques Électrique frappent fort, et ton Digimon se fatigue s'il reste dehors.",
          blizzard: 'TEMPÊTE DE NEIGE : très éprouvant dehors ! Glace plus forte, Feu plus faible.', gale: 'TEMPÊTE : le vent porte les techniques Air, mais épuise les Digimon.',
          heat: 'CANICULE : techniques Feu plus fortes ; ton Digimon a vite faim et se fatigue.' };
        await say(info[w] || 'Le temps est calme.');
        if (T.drought()) await say(`Et nous sommes en pleine SÉCHERESSE (encore ${Math.max(1, Math.ceil((DW.state.drought - DW.state.clock) / 1440))} jour(s)) : la récolte des Champs est maigre.`);
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
