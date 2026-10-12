'use strict';
// =====================================================================
//  ENTRAÎNEMENT (Terrain d'entraînement, au sud de la ville)
//  - Les COMBATS font monter le niveau → le niveau fixe le POTENTIEL :
//    plafond de points d'entraînement par stat = 6 + 2 × niveau (max 64).
//  - L'ENTRAÎNEMENT remplit ce potentiel : les points augmentent les stats
//    et sont la condition principale des Digivolutions.
//  - Une séance = mini-jeu de timing en 3 essais (ESPACE au bon moment).
//    Plus la stat est entraînée, plus la zone est étroite et le curseur rapide.
//    Raté = 0, réussi = 1, parfait = 2 points. Fatigue +30, 1 h 30.
// =====================================================================
(function () {
  const { UI, Input, Audio, Game } = DW;
  const W = DW.W, H = DW.H;
  const STATS = {
    hp: { name: 'Endurance', stat: 'PV', obj: 'weights', desc: 'Soulever les gros rochers.' },
    mp: { name: 'Énergie', stat: 'PM', obj: 'datacrystal', desc: "Canaliser l'énergie du cristal de données." },
    atk: { name: 'Frappe', stat: 'Attaque', obj: 'dummy', desc: 'Frapper le mannequin de paille.' },
    def: { name: 'Garde', stat: 'Défense', obj: 'guardwall', desc: 'Encaisser contre le mur de pierre.' },
    spd: { name: 'Sprint', stat: 'Vitesse', obj: 'hurdle', desc: 'Sauter les haies à toute allure.' },
    int: { name: 'Méditation', stat: 'Intelligence', obj: 'shrine', desc: 'Se concentrer dans le cercle de pierres.' },
  };
  const TOTAL = 300, TIRE = 30, MINUTES = 90;   // TOTAL : points d'entraînement cumulés, toutes stats (6 avec les PM)

  const Training = DW.Training = {
    STATS, TOTAL,
    // potentiel : ce que le niveau (gagné en combat) permet d'atteindre
    cap: m => Math.min(64, 6 + m.level * 2),
    total: m => Object.values(m.tr).reduce((a, b) => a + b, 0),
    // ajoute des points (bornés par le potentiel) et renvoie le gain réel
    gain(m, k, n) {
      const room = Math.min(this.cap(m) - m.tr[k], TOTAL - this.total(m));
      const g = Math.max(0, Math.min(n, room));
      m.tr[k] += g;
      return g;
    },
    // difficulté du mini-jeu selon les points déjà acquis (0 facile → 1 très dur)
    difficulty: (m, k) => Math.min(1, m.tr[k] / 48),
    // script lancé en parlant à un poste d'entraînement (k = stat travaillée)
    async atSpot(k) {
      const st = DW.state, S = STATS[k];
      if (!S) return;
      if (!st.party.length) { await DW.say("Un poste d'entraînement... Il te faudrait un partenaire Digimon !"); return; }
      await DW.say(`Poste « ${S.name} » (${S.stat}) : ${S.desc} Une séance dure 1 h 30 et fatigue beaucoup.`);
      while (true) {
        const i = await Game.push(new DW.PartyScene({ mode: 'select', title: 'ENTRAÎNEMENT' }));
        if (i == null || i < 0) return;
        const m = st.party[i];
        if (m.hp <= 0) { await DW.say(`${m.name} est K.O. Soigne-le d'abord !`); continue; }
        if (m.sick) { await DW.say(`${m.name} est malade... Donne-lui un Médicament avant de l'entraîner.`); continue; }
        if (m.hurt) { await DW.say(`${m.name} est blessé... Soigne-le avec un Bandage d'abord.`); continue; }
        if (m.tired >= 100) { await DW.say(`${m.name} est épuisé... Fais-le dormir chez Jijimon ou mange au restaurant.`); continue; }
        if (m.tr[k] >= this.cap(m)) { await DW.say(`${m.name} a atteint son potentiel en ${S.stat} (${this.cap(m)} points). Gagne des niveaux en combat pour l'augmenter !`); continue; }
        if (this.total(m) >= TOTAL) { await DW.say(`${m.name} ne peut plus progresser davantage...`); continue; }
        if (DW.Care && DW.Care.tooHungry(m)) { await DW.say(`${m.name} a trop faim pour s'entraîner... Donne-lui à manger !`); continue; }
        await Game.push(new TrainingScene(m, k));
        if (DW.Evo.available(m).length) await DW.say(`Le Digivice vibre... ${m.name} est prêt à digivoluer ! Consulte la table des Digivolutions (ENTRÉE).`);
        const again = await DW.ask('Encore une séance ?');
        if (again !== 0) return;
      }
    },
  };

  // ------------------------------------------------------------ séance (mini-jeu de timing)
  class TrainingScene extends DW.Scene {
    constructor(m, k) {
      super();
      this.m = m; this.k = k; this.S = STATS[k];
      this.round = 0; this.hits = []; this.pt = []; this.flash = 0;
      const dif = Training.difficulty(m, k);
      this.zone = 0.28 - dif * 0.17;            // largeur de la zone réussie (fraction de la jauge)
      this.speed = 0.9 + dif * 1.3;             // allers-retours par seconde
      if (m.tired >= 60) this.speed *= 1.15;    // fatigué : plus difficile
      this.before = m.stat(k);
      this.state = 'play';
      this.newRound();
      Audio.sfx('buff');
    }
    newRound() { this.zx = 0.12 + Math.random() * (0.76 - this.zone); this.ph = Math.random() * 0.3; this.wait = 0.5; }
    get cursor() { const p = this.ph % 2; return p < 1 ? p : 2 - p; }
    update(dt) {
      if (this.state === 'done') { if (Input.hit('ok') || Input.hit('back')) { Audio.sfx('select'); this.close(); } return; }
      if (this.wait > 0) { this.wait -= dt; return; }
      this.ph += dt * this.speed * 2;
      if (Input.hit('ok')) {
        const c = this.cursor, mid = this.zx + this.zone / 2;
        const res = Math.abs(c - mid) <= this.zone * 0.17 ? 2 : Math.abs(c - mid) <= this.zone / 2 ? 1 : 0;
        this.hits.push(res); this.lastRes = res; this.flash = 0.45;
        Audio.sfx(res === 2 ? 'super' : res ? 'hit' : 'weak');
        const n = res ? 8 + res * 4 : 3;
        for (let i = 0; i < n; i++) this.pt.push({ x: 196, y: 124, vx: (Math.random() - 0.4) * 130, vy: -40 - Math.random() * 70, life: 0.7, col: res === 2 ? '#fff080' : res ? '#e8c860' : '#8a8a8a' });
        if (++this.round >= 3) this.finish(); else this.newRound();
      }
    }
    finish() {
      const m = this.m, k = this.k;
      const score = this.hits.reduce((a, b) => a + b, 0);                 // 0 à 6
      const bonus = score > 0 ? (DW.Town.has('elecmon') ? 1 : 0) + Math.min(2, DW.Town.trainBonus ? DW.Town.trainBonus(k) : 0) : 0; // Dojo d'Elecmon + coachs recrutés
      this.score = score;
      this.g = Training.gain(m, k, score + bonus);
      m.tired = Math.min(100, m.tired + TIRE);
      if (score >= 5) { m.addHappy(2); DW.Life.moment('good', 'une super séance'); } else if (score === 0) m.addHappy(-2);
      DW.Life.addFat(m, -1);
      DW.state.clock += MINUTES;
      this.after = m.stat(k);
      if (k === 'hp') m.hp = Math.min(m.maxHp, m.hp + (this.after - this.before));
      if (k === 'mp') m.mp = Math.min(m.maxMp, m.mp + (this.after - this.before));
      this.state = 'done';
      Audio.sfx(this.g ? 'levelup' : 'back');
    }
    tick(dt) {
      if (this.flash > 0) this.flash -= dt;
      for (let i = this.pt.length - 1; i >= 0; i--) { const p = this.pt[i]; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 140 * dt; p.life -= dt; if (p.life <= 0) this.pt.splice(i, 1); }
    }
    draw(c) {
      const t = this.t, k = this.k, m = this.m, S = this.S, play = this.state === 'play';
      c.drawImage(DW.World.battleBg('foret@town'), 0, 0);
      DW.World.platform(c, 'foret@town', 160, 168, 100, 18);
      // poste d'entraînement
      const O = DW.World.obj(S.obj, 0);
      c.drawImage(O.img, 222 - O.w, 168 - O.h * 2, O.w * 2, O.h * 2);
      // Digimon : petite animation d'effort, élan quand on appuie
      const hit = this.flash > 0;
      let x = 130, y = 170;
      if (play && k === 'spd') x = 130 + Math.sin(t * 7) * 24;
      if (play && k === 'hp') y = 170 - Math.abs(Math.sin(t * 4)) * 4;
      if (hit && this.lastRes) x += Math.sin((0.45 - this.flash) / 0.45 * Math.PI) * 40;
      if ((k === 'int' || k === 'mp') && play) {
        c.save(); c.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 3; i++) { c.strokeStyle = `rgba(120,220,255,${0.35 - i * 0.1})`; c.lineWidth = 1.5; c.beginPath(); c.ellipse(x, y - 30, 36 + i * 10 + Math.sin(t * 4) * 4, 12 + i * 4, 0, 0, 7); c.stroke(); }
        c.restore();
      }
      const pose = hit ? (this.lastRes ? 'attack' : 'hurt') : null;
      DW.Sprites.draw(c, pose ? DW.Sprites.pose(m.sp, pose) : DW.Sprites.battle(m.sp), x, y, { frame: Math.floor(t * (play ? 7 : 4)) });
      for (const p of this.pt) { c.fillStyle = p.col; c.fillRect(p.x, p.y, 2, 2); }
      if (hit) UI.text(c, ['RATÉ...', 'BIEN !', 'PARFAIT !'][this.lastRes], 196, 92 - (0.45 - this.flash) * 30, { size: 11, align: 'center', color: ['#ff8a8a', '#ffe070', '#7aff8a'][this.lastRes] });
      // en-tête
      UI.box(c, 6, 6, W - 12, 34);
      UI.label(c, 'ENTRAÎNEMENT', 12, 10);
      UI.text(c, `${m.name} — ${S.name} (${S.stat})`, 100, 19, { size: 10, color: '#ffe070' });
      UI.text(c, `Points ${m.tr[k]} / potentiel ${Training.cap(m)}   ·   Fatigue ${m.tired} %`, 12, 33, { size: 8, color: '#c8f0ff' });
      // jauge
      UI.box(c, 6, 188, W - 12, 46);
      if (play) {
        const bx = 18, bw = W - 82, by = 198;
        c.fillStyle = '#06121a'; c.fillRect(bx - 1, by - 1, bw + 2, 12);
        c.fillStyle = '#28465a'; c.fillRect(bx, by, bw, 10);
        c.fillStyle = '#3cbc6c'; c.fillRect(bx + this.zx * bw, by, this.zone * bw, 10);
        c.fillStyle = '#ffe060'; c.fillRect(bx + (this.zx + this.zone * 0.33) * bw, by, this.zone * 0.34 * bw, 10);
        const cx = bx + this.cursor * bw;
        c.fillStyle = '#ffffff'; c.fillRect(Math.round(cx) - 1, by - 3, 3, 16);
        for (let j = 0; j < 3; j++) {
          const h = this.hits[j];
          UI.text(c, h == null ? '·' : h === 2 ? '★' : h ? '●' : '✘', W - 54 + j * 14, 208, { size: 10, align: 'center', color: h == null ? '#5a8aa0' : h ? '#ffe060' : '#ff7a7a' });
        }
        UI.text(c, `Essai ${Math.min(3, this.round + 1)}/3 — ESPACE dans la zone verte (jaune = parfait)`, 18, 226, { size: 7, color: '#8ae0f0' });
      } else {
        UI.text(c, this.g ? `${S.stat} : ${this.before} → ${this.after}   (+${this.g} pts d'entraînement)` : this.score ? `Potentiel atteint en ${S.stat} : gagne des niveaux !` : 'Séance ratée... Aucun progrès.', 16, 205, { size: 9, color: this.g ? '#7aff8a' : '#ffb070' });
        UI.text(c, `Réussite ${this.score}/6   ·   Fatigue ${m.tired} %   ·   1 h 30 a passé`, 16, 221, { size: 8, color: '#8ae0f0' });
        UI.downArrow(c, W - 18, 222, t);
      }
    }
  }
  DW.TrainingScene = TrainingScene;
})();
