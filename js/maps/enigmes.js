'use strict';
// =====================================================================
//  ÉNIGMES DES DONJONS — briques réutilisables (maps/donjons.js s'en sert)
//  Chaque énigme a un identifiant ; son état est gardé dans state.enigmes[id] = { solved, ... }.
//  - barrier(m, id, cells, msg)   : barrière de données sur des cases, levée quand l'énigme id est résolue
//  - braziers(m, id, spots, order, hint) : vasques à allumer dans l'ordre (une erreur les éteint toutes)
//  - plates(m, id, spots)         : dalles à presser en marchant dessus (toutes)
//  - riddle(m, id, x, y, o)       : stèle qui pose une question (o : { q, choices, answer, ok, ko })
//  - stele(m, x, y, text)         : stèle d'indice (texte simple)
//  Toutes acceptent des coordonnées de la pièce (pièces de DW.Palais, sans mise à l'échelle).
// =====================================================================
(function () {
  const say = (t, s) => DW.say(t, s);
  const all = () => (DW.state.enigmes = DW.state.enigmes || {});
  const E = DW.Enigmes = {
    state: id => (all()[id] = all()[id] || {}),
    solved: id => !!(all()[id] && all()[id].solved),
    async solve(id, ow, msg = 'Un grondement sourd... La barrière de données se dissipe !') {
      E.state(id).solved = true;
      DW.Audio.sfx('super'); if (ow) ow.shake = 0.5;
      await say(msg);
      DW.autosave();
    },
    barrier(m, id, cells, msg = "Une barrière de données ferme le passage. Il doit y avoir un mécanisme quelque part...") {
      for (const [x, y] of cells) m.npcs.push({ obj: 'datagate', x, y, gate: true, cond: () => !E.solved(id), talk: () => say(msg) });
    },
    braziers(m, id, spots, order, hint) {
      const lit = () => E.state(id).seq || [];
      spots.forEach(([x, y], i) => m.npcs.push({ obj: 'brazier', x, y, ov: () => (E.solved(id) || lit().includes(i) ? 1 : 0), talk: async ow => {
        if (E.solved(id) || lit().includes(i)) { await say('La flamme brûle doucement.'); return; }
        if ((await DW.ask('Allumer cette vasque ?')) !== 0) return;
        const S = E.state(id), seq = S.seq = [...lit(), i];
        if (seq[seq.length - 1] !== order[seq.length - 1]) {
          S.seq = []; DW.Audio.sfx('bump'); if (ow) ow.shake = 0.3;
          await say("Toutes les flammes s'éteignent d'un coup... Ce n'était pas le bon ordre.");
          if (hint) await say(`(Indice : ${hint})`);
          return;
        }
        DW.Audio.sfx('fire');
        if (seq.length === order.length) await E.solve(id, ow, 'Les flammes se mettent à danser ensemble... La barrière de données se dissipe !');
        else await say(`La vasque s'embrase ! (${seq.length} / ${order.length})`);
      } }));
    },
    plates(m, id, spots) {
      const pressed = () => (E.state(id).p = E.state(id).p || {});
      spots.forEach(([x, y], i) => {
        m.npcs.push({ obj: 'floorplate', x, y, walk: true, ov: () => (E.solved(id) || pressed()[i] ? 1 : 0), talk: () => say('Une dalle gravée de circuits. Elle semble réagir au poids.') });
        (m.triggers = m.triggers || []).push({ x, y, cond: () => !E.solved(id) && !pressed()[i], run: async ow => {
          pressed()[i] = true; DW.Audio.sfx('select');
          const n = Object.keys(pressed()).length;
          if (n >= spots.length) await E.solve(id, ow, 'Toutes les dalles brillent ! La barrière de données se dissipe !');
          else await say(`La dalle s'illumine sous tes pieds. (${n} / ${spots.length})`);
        } });
      });
    },
    riddle(m, id, x, y, o) {
      m.objects.push({ kind: 'monolith', x, y, w: 1, h: 1 });
      m.signs[`${x},${y}`] = async ow => {
        if (E.solved(id)) { await say(o.done || 'Les inscriptions de la stèle se sont éteintes.'); return; }
        await say(o.q);
        const r = await DW.ask(o.ask || 'Ta réponse ?', o.choices, null, false);
        if (r === o.answer) await E.solve(id, ow, o.ok || 'La stèle brille... La barrière de données se dissipe !');
        else { DW.Audio.sfx('bump'); await say(o.ko || 'La stèle reste muette. Ce n\'est pas la bonne réponse.'); }
      };
    },
    stele(m, x, y, text) {
      m.objects.push({ kind: 'monolith', x, y, w: 1, h: 1 });
      m.signs[`${x},${y}`] = text;
    },
  };
})();
