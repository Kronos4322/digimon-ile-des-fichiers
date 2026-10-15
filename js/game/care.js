'use strict';
// =====================================================================
//  SOINS DU PARTENAIRE (comme Digimon World 1) — Digimon de tête uniquement
//  - FAIM (0-100) : monte avec le temps (+1 toutes les 10 min de jeu).
//    Équilibre : 1 journée = 1440 min = +144 de faim ≈ 2 Viandes et demie (60 chacune),
//    le DigiChamp de Tanemon en donne 3 par jour → de quoi tenir dès le début, sans surplus.
//    À 70 : il réclame à manger. À 100 : il perd du bonheur et ne s'entraîne plus.
//    Viande / Super Viande (SAC) ou le Restaurant de Mushroomon le nourrissent.
//  - TOILETTES (0-100) : montent avec le temps et après chaque repas.
//    À 75 : il faut trouver des toilettes. À 100 : petit accident sur la carte
//    (bonheur -6). On nettoie en se plaçant devant et en appuyant sur ESPACE.
//  - SOIF (0-100) : monte un peu plus vite que la faim (deux fois plus par forte chaleur ou sécheresse).
//    On boit à une rivière, un étang, une source (ESPACE devant l'eau), ou une Eau fraîche (distributeurs).
//    À 70 : il réclame à boire. À 100 : il perd du bonheur.
//  Pendant le SOMMEIL (et le repos), faim, soif et toilettes montent beaucoup moins vite.
//  Les Digimon qui ne sont pas en tête ne changent pas.
// =====================================================================
(function () {
  const { UI, Audio } = DW;
  const HUNGER_RATE = 1 / 10, NEED_RATE = 1 / 14, THIRST_RATE = 1 / 9;   // toilettes : ≈ 2 passages par jour (temps + repas)
  const REST = 0.25;
  // APPÉTIT : un bébé mange peu, un Champion beaucoup ; les gros Digimon (lourds) mangent encore plus
  const STAGE_EAT = { 'Bébé': 0.45, 'Entraînement': 0.7, 'Disciple': 1, 'Champion': 1.45, 'Ultime': 1.8, 'Méga': 2.1 };
  const appetite = m => { const kg = m.d.kg || 20; return (STAGE_EAT[m.d.stage] || 1) * (kg >= 150 ? 1.4 : kg >= 60 ? 1.2 : kg <= 8 ? 0.9 : 1); };   // pendant le sommeil ou le repos : besoins 4 fois plus lents

  const Care = DW.Care = {
    appetite,
    appetiteLabel: m => { const a = appetite(m); return a < 0.6 ? 'petit' : a < 0.95 ? 'modéré' : a < 1.3 ? 'normal' : a < 1.7 ? 'gros' : 'énorme'; },
    toasts: [],
    lead: () => DW.state.party[0] || null,
    tooHungry: m => m === Care.lead() && m.hunger >= 90,
    toast(text, col = '#ffe070') { this.toasts.push({ text, col, t: 0 }); if (this.toasts.length > 3) this.toasts.shift(); Audio.sfx('status'); },
    // appelé à chaque image depuis l'exploration (le temps de jeu écoulé est lu sur l'horloge)
    update(ow, dt) {
      for (let i = this.toasts.length - 1; i >= 0; i--) if ((this.toasts[i].t += dt) > 4.5) this.toasts.splice(i, 1);
      const st = DW.state, m = this.lead();
      if (st.careClock == null || st.careClock > st.clock) st.careClock = st.clock;
      const min = Math.min(600, st.clock - st.careClock);
      if (min < 1) return;
      st.careClock = st.clock;
      if (!m) return;
      const h0 = m.hunger, n0 = m.need, t0 = m.thirst || 0;
      const ap = appetite(m);
      m.hunger = Math.min(100, m.hunger + min * HUNGER_RATE * ap);
      m.need = Math.min(100, m.need + min * NEED_RATE);
      const hot = DW.Time.weather() === 'heat' || !!(DW.Time.drought && DW.Time.drought());
      m.thirst = Math.min(100, t0 + min * THIRST_RATE * (hot ? 2 : 1) * (0.6 + ap * 0.4));
      if (t0 < 70 && m.thirst >= 70) this.toast(`${m.name} a soif ! (rivière, source, ou Eau fraîche)`);
      if (t0 < 100 && m.thirst >= 100) this.toast(`${m.name} meurt de soif !`, '#ff8a8a');
      if (m.thirst >= 100) { m.dry = (m.dry || 0) + min; if (m.dry >= 30) { m.dry -= 30; m.addHappy(-2); } }
      if (h0 < 70 && m.hunger >= 70) this.toast(`${m.name} a faim ! (Viande : ENTRÉE → SAC)`);
      if (h0 < 100 && m.hunger >= 100) this.toast(`${m.name} meurt de faim !`, '#ff8a8a');
      if (m.hunger >= 100) {
        m.starve = (m.starve || 0) + min;
        if (m.starve >= 30) { m.starve -= 30; m.addHappy(-2); }
      }
      if (n0 < 75 && m.need >= 75) this.toast(`${m.name} doit aller aux toilettes !`);
      if (m.need >= 100) this.accident(ow, m);
      DW.Life.update(ow, min);
      if (DW.Calendar) DW.Calendar.tick(ow, min);   // intempéries (game/calendrier.js)
    },
    // accident : une petite crotte apparaît là où se trouve le partenaire
    accident(ow, m) {
      const st = DW.state;
      m.need = 0; m.addHappy(-6); DW.Life.addGerms(m, 12);
      const F = ow.f, x = F.moving ? F.tx : F.x, y = F.moving ? F.ty : F.y;
      const L = st.poops[ow.mapId] = st.poops[ow.mapId] || [];
      if (!L.some(p => p[0] === x && p[1] === y) && !(x === ow.p.x && y === ow.p.y) && L.length < 12) L.push([x, y]);
      st.poopCount = (st.poopCount || 0) + 1;
      this.toast(`Oh non... ${m.name} n'a pas pu se retenir ! (bonheur -6)`, '#ffb070');
      DW.Life.mistake(m, 'accident'); DW.Life.moment('bad', 'un accident');
    },
    poopAt(mapId, x, y) { const L = DW.state.poops[mapId]; return !!L && L.some(p => p[0] === x && p[1] === y); },
    async clean(mapId, x, y) {
      const L = DW.state.poops[mapId];
      await DW.say('Une petite crotte... Tu la ramasses et tu nettoies.');
      L.splice(L.findIndex(p => p[0] === x && p[1] === y), 1);
      Audio.sfx('swoosh');
    },
    // temps qui passe en dormant ou en se reposant (min minutes) : besoins ralentis, l'horloge des soins suit
    rest(min, sleeping = true) {
      const st = DW.state, k = sleeping ? REST : 0.5;
      st.clock += min; st.careClock = st.clock;
      for (const d of st.party) {
        d.hunger = Math.min(95, d.hunger + min * HUNGER_RATE * k * appetite(d));
        d.need = Math.min(90, d.need + min * NEED_RATE * k);
        d.thirst = Math.min(95, (d.thirst || 0) + min * THIRST_RATE * k);
      }
    },
    // boire (eau de la nature) : renvoie vrai s'il avait soif
    drink(m, amt = 60) { const t = m.thirst || 0; m.thirst = Math.max(0, t - amt); m.dry = 0; if (t >= 40) m.addHappy(2); return t > 5; },
    // nourrir : renvoie un message
    feed(m, amt) {
      const before = m.hunger;
      m.hunger = Math.max(0, m.hunger - amt);
      const eaten = before - m.hunger;
      m.need = Math.min(99, m.need + eaten * 0.5);
      if (before >= 40) m.addHappy(3);
      DW.Life.addFat(m, eaten / 40 / appetite(m));   // un repas complet : +1,5 environ (trop nourrir un petit mangeur le fait grossir vite)   // trop nourrir un petit mangeur le fait grossir vite
      m.starve = 0;
      return eaten > 0;
    },
    // toilettes : on peut y aller dès que l'envie est là ; plus on attend, plus le soulagement est grand
    async toilet() {
      const m = this.lead();
      if (!m) { await DW.say('Des toilettes toutes propres, avec un petit lavabo. Il y a même du papier !'); return; }
      if (m.need < 15) { await DW.say(`Des toilettes toutes propres. ${m.name} n'a pas envie pour l'instant.`); return; }
      if ((await DW.ask(`Emmener ${m.name} aux toilettes ?`)) !== 0) return;
      Audio.sfx('door');
      await DW.fade(1, 0.25);
      await DW.wait(0.5);
      Audio.sfx('flush');
      await DW.wait(0.7);
      const gain = m.need >= 75 ? 6 : m.need >= 40 ? 4 : 2;
      m.need = 0; m.addHappy(gain); m.germs = Math.max(0, (m.germs || 0) - 4);
      await DW.fade(0, 0.25);
      await DW.say(`${m.name} ressort tout content, les mains lavées. Ouf, quel soulagement ! (bonheur +${gain})`);
    },
    // phrase du partenaire selon ses besoins (ou null)
    talkLine(m) {
      if (m !== this.lead()) return null;
      if (m.hunger >= 90) return `${m.name} : J'ai trop faiiim... Donne-moi de la viande, s'il te plaît !`;
      if ((m.thirst || 0) >= 90) return `${m.name} : J'ai la gorge toute sèche... De l'eau, vite !`;
      if (m.need >= 75) return `${m.name} se tortille... Il faut vite trouver des toilettes !`;
      if (m.hunger >= 70) return `${m.name} : Mon ventre gargouille... On mange bientôt ?`;
      return null;
    },

    // ---------------------------------------------------------- affichage
    // bulle au-dessus du partenaire quand il a un besoin
    // grande bulle au-dessus du partenaire : ses besoins défilent l'un après l'autre (faim, toilettes,
    // maladie, blessure = pansement, fatigue, sommeil, tristesse, bêtise / exploit)
    drawBubble(c, m, x, y, t) {
      if (!m || m !== this.lead()) return;
      const list = DW.Life.needs(m);
      if (!list.length) return;
      const icon = list[Math.floor(t / 1.4) % list.length];
      const bx = x + 9, by = Math.round(y - 38 + Math.sin(t * 4) * 1.2);
      c.fillStyle = '#ffffff'; c.strokeStyle = '#203040'; c.lineWidth = 1.2;
      c.beginPath(); c.ellipse(bx, by, 11, 9.5, 0, 0, 7); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(bx - 6, by + 7); c.lineTo(bx - 9, by + 13); c.lineTo(bx - 2, by + 8.5); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#ffffff'; c.fillRect(bx - 6, by + 6, 5, 3);
      if (list.length > 1) for (let i = 0; i < list.length; i++) { c.fillStyle = list[i] === icon ? '#203040' : '#b0c0d0'; c.fillRect(bx - list.length * 2 + i * 4, by + 11, 2, 2); }
      if (icon === 'food') c.drawImage(DW.Icons.item('viande'), bx - 8, by - 8, 16, 16);
      else if (icon === 'drink') { c.fillStyle = '#3aa0ff'; c.beginPath(); c.moveTo(bx, by - 7); c.quadraticCurveTo(bx + 6, by + 1, bx, by + 5); c.quadraticCurveTo(bx - 6, by + 1, bx, by - 7); c.fill(); c.fillStyle = '#c8ecff'; c.fillRect(bx - 2, by - 1, 1.5, 3); }
      else if (icon === 'need') this.drawPoop(c, bx, by + 4, 1);
      else if (icon === 'sick') { c.fillStyle = '#7ac040'; c.beginPath(); c.arc(bx, by, 6, 0, 7); c.fill(); c.fillStyle = '#1a2a10'; c.fillRect(bx - 3, by - 2, 2, 2); c.fillRect(bx + 1, by - 2, 2, 2); c.fillRect(bx - 3, by + 2, 6, 1.5); c.fillStyle = '#a0e0ff'; c.fillRect(bx + 5, by - 6, 2, 3); }
      else if (icon === 'hurt') { c.save(); c.translate(bx, by); c.rotate(-0.5); c.fillStyle = '#f0d8b0'; c.fillRect(-8, -3, 16, 6); c.fillStyle = '#e8c090'; c.fillRect(-3, -3, 6, 6); c.fillStyle = '#c8a070'; for (const dx of [-1.5, 1.5]) for (const dy of [-1.5, 1.5]) c.fillRect(dx - 0.5, dy - 0.5, 1, 1); c.restore(); }
      else if (icon === 'lowhp') { c.fillStyle = '#e84a5a'; c.beginPath(); c.arc(bx - 2.6, by - 1.6, 3.2, 0, 7); c.arc(bx + 2.6, by - 1.6, 3.2, 0, 7); c.fill(); c.beginPath(); c.moveTo(bx - 5.6, by - 0.4); c.lineTo(bx, by + 5.6); c.lineTo(bx + 5.6, by - 0.4); c.fill(); c.fillStyle = '#ffffff'; c.fillRect(bx - 1, by - 3, 2, 5); c.fillRect(bx - 2.5, by - 1.5, 5, 2); }
      else if (icon === 'tired') { c.fillStyle = '#5a8ad8'; c.beginPath(); c.moveTo(bx + 3, by - 7); c.quadraticCurveTo(bx + 8, by, bx + 3, by + 3); c.quadraticCurveTo(bx - 2, by, bx + 3, by - 7); c.fill(); c.fillStyle = '#203040'; c.fillRect(bx - 7, by + 1, 3, 1); c.fillRect(bx - 2, by + 1, 3, 1); }
      else if (icon === 'sad') { c.strokeStyle = '#3a5ab0'; c.lineWidth = 1.2; c.beginPath(); c.arc(bx, by, 6, 0, 7); c.stroke(); c.fillStyle = '#3a5ab0'; c.fillRect(bx - 3, by - 2, 1.5, 1.5); c.fillRect(bx + 1.5, by - 2, 1.5, 1.5); c.beginPath(); c.arc(bx, by + 4, 2.5, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); }
      else if (icon === 'good' || icon === 'bad') { c.fillStyle = icon === 'good' ? '#e8a020' : '#c84a4a'; c.font = DW.UI.font(14, true); c.textAlign = 'center'; c.fillText(icon === 'good' ? '★' : '!', bx, by + 5); }
      else { c.fillStyle = '#3a5ab0'; c.font = DW.UI.font(10, true); c.textAlign = 'center'; c.fillText('Zz', bx, by + 4); }
      c.textAlign = 'left';
    },
    drawPoop(c, x, y, s = 1) {
      c.save(); c.translate(x, y); c.scale(s, s);
      c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(0, 1, 6, 2, 0, 0, 7); c.fill();
      const tiers = [[0, 0, 5.5, 2.6], [0, -2.8, 4.2, 2.2], [0.4, -5.2, 2.8, 1.8]];
      for (const [dx, dy, rx, ry] of tiers) {
        c.fillStyle = '#5a3a1c'; c.beginPath(); c.ellipse(dx, dy, rx, ry, 0, 0, 7); c.fill();
        c.fillStyle = '#8a5a2c'; c.beginPath(); c.ellipse(dx - rx * 0.25, dy - ry * 0.35, rx * 0.6, ry * 0.5, 0, 0, 7); c.fill();
      }
      c.fillStyle = '#c89060'; c.fillRect(-2, -7, 1, 1);
      c.restore();
    },
    // jauges en haut à gauche (sous le bandeau de zone)
    drawHUD(c, m, x, y) {
      if (!m) return;
      UI.box(c, x, y, 58, 31);
      const row = (yy, label, v, col, warn) => {
        UI.text(c, label, x + 5, yy + 4, { size: 7, color: warn ? '#ff8a8a' : '#c8f0ff' });
        UI.bar(c, x + 24, yy, 29, 4, v / 100, warn ? '#ff5a5a' : col);
      };
      row(y + 6, 'Faim', m.hunger, '#f0b040', m.hunger >= 70);
      row(y + 15, 'Soif', m.thirst || 0, '#3aa0ff', (m.thirst || 0) >= 70);
      row(y + 24, 'WC', m.need, '#a07850', m.need >= 75);
    },
    // jauges de bonheur et de discipline du partenaire (en bas à droite de l'écran)
    drawMood(c, m, x, y) {
      if (!m) return;
      UI.box(c, x, y, 82, 22);
      const disc = m.disc != null ? m.disc : 40;
      const row = (yy, label, v, col, warn) => {
        UI.text(c, label, x + 5, yy + 4, { size: 7, color: warn ? '#ff8a8a' : '#c8f0ff' });
        UI.bar(c, x + 48, yy, 29, 4, v / 100, warn ? '#ff5a5a' : col);
      };
      row(y + 6, 'Bonheur', m.happy, '#ff7ab8', m.happy < 25);
      row(y + 15, 'Discipline', disc, '#5ab0ff', disc < 20);
    },
    drawToasts(c) {
      this.toasts.forEach((o, i) => {
        const a = Math.min(1, o.t / 0.2, (4.5 - o.t) / 0.5);
        c.globalAlpha = Math.max(0, a);
        const w = UI.measure(c, o.text, 8) + 16, y = DW.H - 52 - (this.toasts.length - 1 - i) * 20;   // au-dessus des jauges du bas
        UI.box(c, (DW.W - w) / 2, y, w, 17);
        UI.text(c, o.text, DW.W / 2, y + 12, { size: 8, align: 'center', color: o.col });
        c.globalAlpha = 1;
      });
    },
  };
})();
