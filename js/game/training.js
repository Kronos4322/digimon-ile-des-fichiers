'use strict';
// =====================================================================
//  ENTRAÎNEMENT (Terrain d'entraînement, au sud de la ville)
//  - Les COMBATS font monter le niveau → le niveau fixe le POTENTIEL :
//    plafond de points d'entraînement par stat = 10 + 3 × niveau + 4 × ABI (max 99).
//  - ABI (comme dans Cyber Sleuth) : +1 à chaque Digivolution, +2 à chaque dé-digivolution ;
//    dé-digivoluer permet donc de dépasser un plafond trop bas.
//  - L'ENTRAÎNEMENT remplit ce potentiel : les points augmentent les stats
//    et sont la condition principale des Digivolutions.
//  - Une séance = un mini-jeu propre au poste, en 3 essais (game/trainingames.js) :
//    le Digimon court, soulève, frappe... Plus la stat est entraînée, plus c'est dur.
//    Raté = 0, réussi = 1, parfait = 2 points. Fatigue +20, +30 ou +40 selon le niveau choisi (LEVELS), 1 h 30.
// =====================================================================
(function () {
  const { UI, Input, Audio, Game } = DW;
  const W = DW.W;
  const STATS = {
    hp: { name: 'Endurance', stat: 'PV', obj: 'weights', desc: 'Soulever les gros rochers.' },
    mp: { name: 'Énergie', stat: 'PM', obj: 'datacrystal', desc: "Canaliser l'énergie du cristal de données." },
    atk: { name: 'Frappe', stat: 'Attaque', obj: 'dummy', desc: 'Frapper le mannequin de paille.' },
    def: { name: 'Garde', stat: 'Défense', obj: 'guardwall', desc: 'Encaisser contre le mur de pierre.' },
    spd: { name: 'Sprint', stat: 'Vitesse', obj: 'hurdle', desc: 'Sauter les haies à toute allure.' },
    int: { name: 'Méditation', stat: 'Intelligence', obj: 'shrine', desc: 'Se concentrer dans le cercle de pierres.' },
  };
  // APPAREILS qui sont des postes partout où on les pose : stat entraînée (k), exercice (jeu : game/trainfield.js) et,
  // pour l'objectif « Statistique », leur propre mélange de stats (base ; sinon celui de la stat : BASE)
  const POSTES = {
    punchbag: { k: 'atk', jeu: 'punchbag', nom: 'Sac de frappe', desc: 'Enchaîner les coups sur le sac de frappe.' },
    epouvantail: { k: 'atk', jeu: 'dummy', nom: 'Épouvantail', desc: "Frapper l'épouvantail : des coups vifs et légers (Attaque, un peu de Vitesse).", base: { atk: 6, spd: 4 } },
    traineau: { k: 'hp', jeu: 'weights', nom: 'Traîneau', desc: 'Tirer le traîneau chargé de pierres (PV, un peu d\'Attaque).', base: { hp: 35, atk: 4 } },
    pneus: { k: 'spd', jeu: 'hurdle', nom: 'Pneus', desc: 'Passer entre les pneus qui se balancent (Vitesse, un peu de Défense).', base: { spd: 6, def: 4 } },
    hurdle: { k: 'spd', jeu: 'hurdle', nom: 'Haies', desc: 'Sauter les haies à toute allure.' },   // (haies posées dans l'atelier des cartes)
  };
  const TOTAL = 300, MINUTES = 90;   // TOTAL : points d'entraînement cumulés, toutes stats (6 avec les PM) ; la fatigue : LEVELS

  const Training = DW.Training = {
    STATS, POSTES, TOTAL,
    // potentiel : ce que le niveau (gagné en combat) permet d'atteindre
    cap: m => Math.min(99, 10 + m.level * 3 + (m.abi || 0) * 4),
    total: m => Object.values(m.tr).reduce((a, b) => a + b, 0),
    totalCap: m => Math.min(600, TOTAL + (m.abi || 0) * 30),
    // ajoute des points (bornés par le potentiel) et renvoie le gain réel
    gain(m, k, n, mode = 'evo') {
      if (mode === 'stat') {   // objectif « Statistiques » : la stat monte directement (ne compte pas pour les Digivolutions)
        m.raw = m.raw || {};
        const g = Math.max(0, Math.min(n, this.cap(m) - (m.raw[k] || 0)));
        m.raw[k] = (m.raw[k] || 0) + g;
        return g;
      }
      const room = Math.min(this.cap(m) - m.tr[k], this.totalCap(m) - this.total(m));
      const g = Math.max(0, Math.min(n, room));
      m.tr[k] += g;
      return g;
    },
    // ---------- objectif « Statistique » : formule de Digimon World 1 (digiworldwiki.com, Training tips)
    // gain = base du poste × bonus (stade, Manuel, coachs) × objet (Super carotte...) × réussite (×0,5 à ×4), arrondi
    // chaque poste monte une stat principale et une secondaire (valeurs affichées, échelle 999 / 9999)
    BASE: { atk: { atk: 8, spd: 2 }, spd: { spd: 8, hp: 10 }, hp: { hp: 45, atk: 2 }, def: { def: 8, int: 2 }, mp: { mp: 45, def: 2 }, int: { int: 8, mp: 10 } },   // (PV / PM : 45, sinon un bébé doublait ses PV en 3 séances)
    STAGE_BONUS: { 'Bébé': -0.55, 'Entraînement': -0.35, 'Disciple': 0, 'Champion': 0.15, 'Ultime': 0.25, 'Méga': 0.35 },   // les petits stades progressent bien moins vite
    // réussite des 3 essais (score 0 à 6) → multiplicateur final (comme le « Bonus Try »)
    tryMult: score => score === 0 ? 0.5 : score <= 2 ? 1 : score <= 4 ? 2 : score === 5 ? 3 : 4,
    statGain(m, k, score, L, boost = 0, eq) {   // (boost : Super carotte, Radis... lus avant la séance par finish ; eq : l'appareil)
      const up = 1 + (this.STAGE_BONUS[m.d.stage] || 0) + (DW.state.bag.manuel_entr ? 0.1 : 0) + Math.min(0.2, (DW.Town.trainBonus ? DW.Town.trainBonus(k) : 0) * 0.1) + (DW.Town.has && DW.Town.has('elecmon') ? 0.1 : 0) + (DW.Collab && DW.Collab.on('muscu') ? 0.1 : 0);
      const item = boost > 0 ? 1.2 : 1;
      const S = DW.SCALE, parts = {};
      m.raw = m.raw || {};
      const B = (POSTES[eq] && POSTES[eq].base) || this.BASE[k];
      for (const s in B) {
        const n = Math.floor(Math.floor(Math.floor(B[s] * up) * item) * this.tryMult(score) * L.mul);
        if (n <= 0) continue;
        // valeur affichée → points « bruts » (bonus = brut × 0,8, puis × l'échelle de la stat)
        const unit = 0.8 * (s === 'hp' ? S.hp : s === 'mp' ? S.mp : S.stat), cap = this.cap(m) * 2.5;
        const before = m.raw[s] || 0, after = Math.min(cap, before + n / unit);
        m.raw[s] = after;
        const real = Math.round((after - before) * unit);
        if (real > 0) parts[s] = real;
      }
      return parts;
    },
    // niveaux de difficulté des séances : facile (moins de points), moyen, difficile (deux fois plus de points)
    LEVELS: [{ name: 'Facile', dif: -0.35, mul: 0.5, tire: 20 }, { name: 'Moyen', dif: 0, mul: 1, tire: 30 }, { name: 'Difficile', dif: 0.3, mul: 2, tire: 40 }],
    // difficulté du mini-jeu selon les points déjà acquis (0 facile → 1 très dur)
    difficulty: (m, k) => Math.min(1, m.tr[k] / 48),
    // raison qui empêche une séance (null : tout va bien)
    blocked(m, k) {
      const S = STATS[k];
      if (m.hp <= 0) return `${m.name} est K.O. Soigne-le d'abord !`;
      if (m.sick) return `${m.name} est malade... Donne-lui un Médicament avant de l'entraîner.`;
      if (m.hurt) return `${m.name} est blessé... Soigne-le avec un Bandage d'abord.`;
      if (m.tired >= 100) return `${m.name} est épuisé... Fais-le dormir${DW.Town.has('mushroomon') ? ' ou mange au Restaurant' : ''}.`;
      if (m.tr[k] >= this.cap(m)) return `${m.name} a atteint son potentiel en ${S.stat} (${this.cap(m)} points). Gagne des niveaux en combat, ou dé-digivolue-le (son ABI monte) pour l'augmenter !`;
      if (this.total(m) >= this.totalCap(m)) return `${m.name} ne peut plus progresser davantage... Dé-digivoluer (table des Digivolutions) augmente son ABI et repousse cette limite.`;
      if (DW.Care && DW.Care.tooHungry(m)) return `${m.name} a trop faim pour s'entraîner... Donne-lui à manger !`;
      return null;
    },
    partsText(parts) { const N = { hp: 'PV', mp: 'PM', atk: 'Attaque', def: 'Défense', spd: 'Vitesse', int: 'Intell.' }; const l = Object.keys(parts).map(s => `${N[s]} +${parts[s]}`); return l.length ? l.join('   ') : 'Potentiel atteint : gagne des niveaux !'; },
    // le poste lui-même (on a pu parler à son panneau, à côté) : la case de poste ou l'appareil de cette stat le plus
    // proche, à 6 cases au plus (avant : 3, et les panneaux du plan agrandi x2 étaient plus loin : la séance se jouait au
    // panneau, avec le mauvais exercice)
    station(ow, k, spot) {
      let best = null, bd = 1e9;
      for (let dy = -6; dy <= 6; dy++) for (let dx = -6; dx <= 6; dx++) {
        const x = spot.x + dx, y = spot.y + dy, d = Math.hypot(dx, dy);
        if (d < bd && DW.World.info(ow.tileAt(x, y)).train === k) { best = { x, y }; bd = d; }
      }
      for (const o of ow.map.objects || []) {
        if (!POSTES[o.kind] || POSTES[o.kind].k !== k) continue;
        const x = o.x + ((o.w || 1) >> 1), y = o.y + (o.h || 1) - 1, d = Math.hypot(x - spot.x, y - spot.y);
        if (d <= 6 && d < bd) { best = { x, y, eq: o.kind }; bd = d; }
      }
      return best || { x: spot.x, y: spot.y };
    },
    // en parlant à un poste : le partenaire de tête s'entraîne (ou un autre, au choix), séances enchaînées depuis l'écran de résultats
    async atSpot(k, spot) {
      const st = DW.state, S = STATS[k];
      if (!S) return;
      if (!st.party.length) { await DW.say("Un poste d'entraînement... Il te faudrait un partenaire Digimon !"); return; }
      // sur la carte : la séance se joue au poste même (game/trainfield.js), sinon l'écran de mini-jeu ; un appareil
      // (traîneau, sac de frappe...) donne son nom au poste
      const at = spot && DW.ow && DW.FieldTrainingScene ? (spot.eq ? { x: spot.x, y: spot.y, eq: spot.eq } : this.station(DW.ow, k, spot)) : null;
      const nom = at && at.eq && POSTES[at.eq] ? POSTES[at.eq].nom : S.name;
      let m = st.party[0];
      if (st.party.length > 1) {
        const r = await DW.ask(`Poste « ${nom} » (${S.stat}). Qui s'entraîne ?`, [m.name, 'Un autre Digimon', 'Annuler']);
        if (r === 1) {
          const i = await Game.push(new DW.PartyScene({ mode: 'select', title: 'ENTRAÎNEMENT' }));
          if (i == null || i < 0) return;
          m = st.party[i];
        } else if (r !== 0) return;
      }
      const why = this.blocked(m, k);
      if (why) { await DW.say(why); return; }
      // objectif et difficulté de la séance (comme dans Digimon World : on peut aussi monter les stats directement)
      const goal = await DW.ask(`Objectif de l'entraînement « ${nom} » ?`, ["Digivolution (points d'entraînement)", `Statistique (${S.stat} directement)`, 'Annuler']);
      if (goal < 0 || goal > 1) return;
      const lv = await DW.ask('Quel niveau de difficulté ?', this.LEVELS.map(L => `${L.name}${L.mul === 1 ? '' : L.mul > 1 ? ' (points ×2)' : ' (points ÷2)'}`).concat(['Annuler']));
      if (lv < 0 || lv > 2) return;
      this.opts = { mode: goal === 1 ? 'stat' : 'evo', level: this.LEVELS[lv] };
      // séances enchaînées ; après chaque séance d'Intelligence, une technique peut être retenue (maps/classe.js)
      for (;;) { const sc = at ? new DW.FieldTrainingScene(m, k, at) : new TrainingScene(m, k), r = await Game.push(sc); if (k === 'int' && DW.Classe) await DW.Classe.after(m, sc.score || 0); if (r !== 'again') break; }
      if (DW.Evo.available(m).length) await DW.say(`Le Digivice vibre... ${m.name} peut digivoluer ! Ouvre sa fiche, onglet Digivolution (ENTRÉE → DIGIMON, puis flèche droite).`);
    },
  };

  // ------------------------------------------------------------ séance : écran « prêt », mini-jeu du poste (trainingames.js), résultats
  class TrainingScene extends DW.Scene {
    constructor(m, k) {
      super();
      this.m = m; this.k = k; this.S = STATS[k];
      this.hits = []; this.pt = []; this.flash = 0; this.shake = 0;
      this.opts = Training.opts || { mode: 'evo', level: Training.LEVELS[1] };
      this.dif = DW.clamp(Training.difficulty(m, k) + this.opts.level.dif, 0, 1);
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
      const bonus = score > 0 ? (DW.Town.has('elecmon') ? 1 : 0) + (DW.Collab && DW.Collab.on('muscu') ? 1 : 0) + Math.min(2, DW.Town.trainBonus ? DW.Town.trainBonus(k) : 0) : 0; // Dojo d'Elecmon, Salle de musculation, coachs recrutés
      this.score = score;
      // Super carotte, Radis, séance avec Tai... (m.boost) et Manuel d'entraînement : comptés pour une séance réussie, puis épuisés
      const boost = score > 0 ? m.boost || 0 : 0, extra = score > 0 ? boost + (DW.state.bag.manuel_entr ? 1 : 0) : 0;
      if (score > 0) m.boost = 0;
      const L = this.opts.level, raw = score + bonus + extra;
      if (this.opts.mode === 'stat') { this.parts = Training.statGain(m, k, score, L, boost, this.eq); this.g = Object.values(this.parts).reduce((a, b) => a + b, 0); }
      else this.g = Training.gain(m, k, raw ? Math.max(1, Math.round(raw * L.mul)) : 0, this.opts.mode);
      m.tired = Math.min(100, m.tired + L.tire);
      if (score >= 5) { m.addHappy(2); DW.Life.moment('good', 'une super séance'); } else if (score === 0) m.addHappy(-2);
      DW.Life.addFat(m, -0.2);   // (une séance fait un peu maigrir ; trop, et les Digivolutions « costaudes » devenaient impossibles)
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
      { const st = this.opts.mode === 'stat', cur = st ? ((m.raw || {})[k] || 0) : m.tr[k]; UI.text(c, `${st ? 'Statistique' : 'Digivolution'} · ${this.opts.level.name}   ·   ${st ? S.stat + ' ' + m.stat(k) : 'Points ' + cur + ' / ' + Training.cap(m)}`, 12, 33, { size: 8, color: '#c8f0ff' }); }
      // panneau du bas
      UI.box(c, 6, 188, W - 12, 46);
      if (this.state === 'ready') {
        const stars = 1 + Math.round(this.dif * 4);
        UI.text(c, S.desc, 16, 202, { size: 8, color: '#ffffff' });
        UI.text(c, `Difficulté ${'★'.repeat(stars)}${'☆'.repeat(5 - stars)}   ·   ${S.stat} actuel : ${this.before}   ·   1 h 30, fatigue +${this.opts.level.tire} %`, 16, 214, { size: 7, color: '#8ae0f0' });
        UI.text(c, 'ESPACE : commencer      ÉCHAP : annuler', W / 2, 228, { size: 8, align: 'center', color: '#ffe070' });
      } else if (play) {
        UI.wrap(c, this.game.hint, W - 80, 8).slice(0, 2).forEach((l, j) => UI.text(c, l, 16, 204 + j * 11, { size: 8, color: '#c8f0ff' }));
        for (let j = 0; j < 3; j++) {
          const h = this.hits[j];
          UI.text(c, h == null ? '·' : h === 2 ? '★' : h ? '●' : '✘', W - 50 + j * 14, 212, { size: 10, align: 'center', color: h == null ? '#5a8aa0' : h ? '#ffe060' : '#ff7a7a' });
        }
        UI.text(c, `Essai ${Math.min(3, this.hits.length + 1)}/3`, W - 36, 228, { size: 7, align: 'center', color: '#8ae0f0' });
      } else {
        UI.text(c, this.parts ? Training.partsText(this.parts) : this.g ? `${S.stat} : ${this.before} → ${this.after}   (+${this.g} pts d'entraînement)` : this.score ? `Potentiel atteint en ${S.stat} : gagne des niveaux !` : 'Séance ratée... Aucun progrès.', 16, 205, { size: 9, color: this.g ? '#7aff8a' : '#ffb070' });
        UI.text(c, this.evo ? 'Le Digivice vibre : Digivolution possible !' : `Réussite ${this.score}/6   ·   1 h 30 a passé`, 16, 217, { size: 8, color: this.evo ? '#ffe070' : '#8ae0f0' });
        UI.text(c, this.next ? 'ESPACE : encore une séance      ÉCHAP : terminer' : 'ESPACE : terminer', W / 2, 230, { size: 7, align: 'center', color: '#ffe070' });
      }
    }
  }
  DW.TrainingScene = TrainingScene;
})();
