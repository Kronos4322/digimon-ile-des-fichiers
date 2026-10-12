'use strict';
// =====================================================================
//  ENTRAÎNEMENT (Terrain d'entraînement, au sud de la ville)
//  - Les COMBATS font monter le niveau → le niveau fixe le POTENTIEL :
//    plafond de points d'entraînement par stat = 6 + 2 × niveau (max 64).
//  - L'ENTRAÎNEMENT remplit ce potentiel : les points augmentent les stats
//    et sont la condition principale des Digivolutions.
//  - Une séance = un mini-jeu propre au poste, en 3 essais (game/trainingames.js) :
//    le Digimon court, soulève, frappe... Plus la stat est entraînée, plus c'est dur.
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
    // raison qui empêche une séance (null : tout va bien)
    blocked(m, k) {
      const S = STATS[k];
      if (m.hp <= 0) return `${m.name} est K.O. Soigne-le d'abord !`;
      if (m.sick) return `${m.name} est malade... Donne-lui un Médicament avant de l'entraîner.`;
      if (m.hurt) return `${m.name} est blessé... Soigne-le avec un Bandage d'abord.`;
      if (m.tired >= 100) return `${m.name} est épuisé... Fais-le dormir ou mange au restaurant.`;
      if (m.tr[k] >= this.cap(m)) return `${m.name} a atteint son potentiel en ${S.stat} (${this.cap(m)} points). Gagne des niveaux en combat pour l'augmenter !`;
      if (this.total(m) >= TOTAL) return `${m.name} ne peut plus progresser davantage...`;
      if (DW.Care && DW.Care.tooHungry(m)) return `${m.name} a trop faim pour s'entraîner... Donne-lui à manger !`;
      return null;
    },
    // en parlant à un poste : le partenaire de tête s'entraîne (ou un autre, au choix), séances enchaînées depuis l'écran de résultats
    async atSpot(k) {
      const st = DW.state, S = STATS[k];
      if (!S) return;
      if (!st.party.length) { await DW.say("Un poste d'entraînement... Il te faudrait un partenaire Digimon !"); return; }
      let m = st.party[0];
      if (st.party.length > 1) {
        const r = await DW.ask(`Poste « ${S.name} » (${S.stat}). Qui s'entraîne ?`, [m.name, 'Un autre Digimon', 'Annuler']);
        if (r === 1) {
          const i = await Game.push(new DW.PartyScene({ mode: 'select', title: 'ENTRAÎNEMENT' }));
          if (i == null || i < 0) return;
          m = st.party[i];
        } else if (r !== 0) return;
      }
      const why = this.blocked(m, k);
      if (why) { await DW.say(why); return; }
      while ((await Game.push(new TrainingScene(m, k))) === 'again') { /* séance suivante */ }
      if (DW.Evo.available(m).length) await DW.say(`Le Digivice vibre... ${m.name} peut digivoluer ! Ouvre la table des Digivolutions (ENTRÉE → DIGIVOLUTION).`);
    },
  };

  // ------------------------------------------------------------ séance : écran « prêt », mini-jeu du poste (trainingames.js), résultats
  class TrainingScene extends DW.Scene {
    constructor(m, k) {
      super();
      this.m = m; this.k = k; this.S = STATS[k];
      this.hits = []; this.pt = []; this.flash = 0; this.shake = 0;
      this.dif = Training.difficulty(m, k);
      this.before = m.stat(k);
      this.state = 'ready';   // ready → play (3 essais) → done
    }
    start() { this.state = 'play'; this.game = new DW.TRAIN_GAMES[this.k](this); this.endT = 1; this.readyT = 1.1; Audio.sfx('buff'); }
    // un essai noté par le mini-jeu : 0 raté, 1 bien, 2 parfait (x, y : où faire jaillir les étincelles)
    hit(res, x = 160, y = 110) {
      if (this.hits.length >= 3) return;
      this.hits.push(res); this.lastRes = res; this.flash = 0.6; this.fx = [x, y];
      Audio.sfx(res === 2 ? 'super' : res ? 'hit' : 'weak');
      const n = res ? 8 + res * 4 : 3;
      for (let i = 0; i < n; i++) this.pt.push({ x, y, vx: (Math.random() - 0.5) * 130, vy: -40 - Math.random() * 70, life: 0.7, col: res === 2 ? '#fff080' : res ? '#e8c860' : '#8a8a8a' });
    }
    update(dt) {
      if (this.state === 'ready') {
        if (Input.hit('ok')) this.start();
        else if (Input.hit('back')) { Audio.sfx('back'); this.close('stop'); }
        return;
      }
      if (this.state === 'done') {
        if (Input.hit('ok')) { Audio.sfx('select'); this.close(this.next ? 'again' : 'stop'); }
        else if (Input.hit('back')) { Audio.sfx('back'); this.close('stop'); }
        return;
      }
      if (this.readyT > 0) { this.readyT -= dt; return; }
      this.game.update(dt);
      if (this.hits.length >= 3 && (this.endT -= dt) <= 0) this.finish();
    }
    finish() {
      const m = this.m, k = this.k;
      const score = this.hits.reduce((a, b) => a + b, 0);                 // 0 à 6
      const bonus = score > 0 ? (DW.Town.has('elecmon') ? 1 : 0) + Math.min(2, DW.Town.trainBonus ? DW.Town.trainBonus(k) : 0) : 0; // Dojo d'Elecmon + coachs recrutés
      this.score = score;
      const extra = score > 0 ? (m.boost || 0) + (DW.state.bag.manuel_entr ? 1 : 0) : 0;   // Super carotte, Radis... et Manuel d'entraînement
      if (score > 0) m.boost = 0;
      this.g = Training.gain(m, k, score + bonus + extra);
      m.tired = Math.min(100, m.tired + TIRE);
      if (score >= 5) { m.addHappy(2); DW.Life.moment('good', 'une super séance'); } else if (score === 0) m.addHappy(-2);
      DW.Life.addFat(m, -1);
      DW.state.clock += MINUTES;
      this.after = m.stat(k);
      if (k === 'hp') m.hp = Math.min(m.maxHp, m.hp + (this.after - this.before));
      if (k === 'mp') m.mp = Math.min(m.maxMp, m.mp + (this.after - this.before));
      this.state = 'done';
      this.next = !Training.blocked(m, k);              // une autre séance est-elle possible ?
      this.evo = DW.Evo.available(m).length > 0;
      Audio.sfx(this.g ? 'levelup' : 'back');
    }
    tick(dt) {
      if (this.flash > 0) this.flash -= dt;
      if (this.shake > 0) this.shake -= dt;
      for (let i = this.pt.length - 1; i >= 0; i--) { const p = this.pt[i]; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 140 * dt; p.life -= dt; if (p.life <= 0) this.pt.splice(i, 1); }
    }
    draw(c) {
      const t = this.t, k = this.k, m = this.m, S = this.S, play = this.state === 'play';
      c.save();
      if (this.shake > 0) c.translate(Math.round((Math.random() - 0.5) * 6), 0);
      if (play) this.game.draw(c);
      else {
        // écran de préparation / résultats : le Digimon devant son poste
        c.drawImage(DW.World.battleBg('foret@town'), 0, 0);
        DW.World.platform(c, 'foret@town', 160, 168, 100, 18);
        const O = DW.World.obj(S.obj, 0);
        c.drawImage(O.img, 222 - O.w, 168 - O.h * 2, O.w * 2, O.h * 2);
        const happy = this.state === 'done' && this.g;
        DW.Sprites.draw(c, happy ? DW.Sprites.pose(m.sp, 'attack') : DW.Sprites.battle(m.sp), 130, 170 - (happy ? Math.abs(Math.sin(t * 6)) * 4 : 0), { frame: Math.floor(t * 4) });
      }
      for (const p of this.pt) { c.fillStyle = p.col; c.fillRect(p.x, p.y, 2, 2); }
      if (play && this.readyT > 0) UI.text(c, this.readyT > 0.35 ? 'Prêt ?' : 'Partez !', W / 2, 110, { size: 16, align: 'center', color: '#ffffff' });
      if (this.flash > 0 && this.fx) UI.text(c, ['RATÉ...', 'BIEN !', 'PARFAIT !'][this.lastRes], this.fx[0], this.fx[1] - 16 - (0.6 - this.flash) * 30, { size: 11, align: 'center', color: ['#ff8a8a', '#ffe070', '#7aff8a'][this.lastRes] });
      c.restore();
      // en-tête
      UI.box(c, 6, 6, W - 12, 34);
      UI.label(c, 'ENTRAÎNEMENT', 12, 10);
      UI.text(c, `${m.name} — ${S.name} (${S.stat})`, 100, 19, { size: 10, color: '#ffe070' });
      UI.text(c, `Points ${m.tr[k]} / potentiel ${Training.cap(m)}   ·   Fatigue ${m.tired} %`, 12, 33, { size: 8, color: '#c8f0ff' });
      // panneau du bas
      UI.box(c, 6, 188, W - 12, 46);
      if (this.state === 'ready') {
        const stars = 1 + Math.round(this.dif * 4);
        UI.text(c, S.desc, 16, 202, { size: 8, color: '#ffffff' });
        UI.text(c, `Difficulté ${'★'.repeat(stars)}${'☆'.repeat(5 - stars)}   ·   ${S.stat} actuel : ${this.before}   ·   1 h 30, fatigue +${TIRE} %`, 16, 214, { size: 7, color: '#8ae0f0' });
        UI.text(c, 'ESPACE : commencer      ÉCHAP : annuler', W / 2, 228, { size: 8, align: 'center', color: '#ffe070' });
      } else if (play) {
        UI.wrap(c, this.game.hint, W - 80, 8).slice(0, 2).forEach((l, j) => UI.text(c, l, 16, 204 + j * 11, { size: 8, color: '#c8f0ff' }));
        for (let j = 0; j < 3; j++) {
          const h = this.hits[j];
          UI.text(c, h == null ? '·' : h === 2 ? '★' : h ? '●' : '✘', W - 50 + j * 14, 212, { size: 10, align: 'center', color: h == null ? '#5a8aa0' : h ? '#ffe060' : '#ff7a7a' });
        }
        UI.text(c, `Essai ${Math.min(3, this.hits.length + 1)}/3`, W - 36, 228, { size: 7, align: 'center', color: '#8ae0f0' });
      } else {
        UI.text(c, this.g ? `${S.stat} : ${this.before} → ${this.after}   (+${this.g} pts d'entraînement)` : this.score ? `Potentiel atteint en ${S.stat} : gagne des niveaux !` : 'Séance ratée... Aucun progrès.', 16, 205, { size: 9, color: this.g ? '#7aff8a' : '#ffb070' });
        UI.text(c, this.evo ? 'Le Digivice vibre : Digivolution possible !' : `Réussite ${this.score}/6   ·   Fatigue ${m.tired} %   ·   1 h 30 a passé`, 16, 217, { size: 8, color: this.evo ? '#ffe070' : '#8ae0f0' });
        UI.text(c, this.next ? 'ESPACE : encore une séance      ÉCHAP : terminer' : 'ESPACE : terminer', W / 2, 230, { size: 7, align: 'center', color: '#ffe070' });
      }
    }
  }
  DW.TrainingScene = TrainingScene;
})();
