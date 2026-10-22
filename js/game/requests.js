'use strict';
// =====================================================================
//  REQUÊTES DES HABITANTS
//  Chaque Digimon recruté en ville a des demandes à son image (Meramon veut de la viande,
//  Leomon veut que tu battes des Digimon, Garurumon que ton partenaire soit rapide...).
//  Une demande à la fois par habitant, renouvelée chaque jour. Récompense : Bits + un objet de son domaine.
//  Au bout de 3 demandes, il te confie SON objet de Digivolution (Leomon → Crinière de feu, etc.) :
//  chaque recrue ouvre une voie d'évolution.
//  Types : item (apporter un objet), defeat (vaincre des sauvages d'un élément), stat (stat du partenaire).
// =====================================================================
(function () {
  const st = () => DW.state;
  const say = (t, s) => DW.say(t, s);
  const STAT = { hp: 'PV', atk: 'Attaque', def: 'Défense', spd: 'Vitesse', int: 'Intelligence' };

  // demandes possibles et récompenses, par habitant (les autres utilisent PROFILE.default)
  // item : [id, quantité] ; defeat : [élément, nombre] ; stat : [stat, valeur minimale]
  const PROFILE = {
    leomon:      { asks: [['defeat', 'Terre', 3], ['defeat', 'Ténèbres', 2], ['stat', 'atk', 120]], gifts: ['disque_atk', 'steak'], evo: 'criniere' },
    garurumon:   { asks: [['stat', 'spd', 120], ['defeat', 'Glace', 2], ['item', 'viande', 3]], gifts: ['disque_vit', 'feuille_vite'], evo: 'cristal_bleu' },
    greymon:     { asks: [['defeat', 'Feu', 3], ['item', 'super_viande', 1], ['stat', 'hp', 900]], gifts: ['steak', 'soin_m'], evo: 'griffes_grey' },
    kabuterimon: { asks: [['defeat', 'Insecte', 3], ['stat', 'def', 110], ['item', 'disque_pm', 2]], gifts: ['disque_def', 'pm_m'], evo: 'casque_corne' },
    monochromon: { asks: [['stat', 'def', 120], ['defeat', 'Terre', 3], ['item', 'digichampi', 2]], gifts: ['disque_def', 'glace_force'], evo: 'pierre_mono' },
    meramon:     { asks: [['item', 'viande', 3], ['item', 'super_viande', 1], ['defeat', 'Feu', 2]], gifts: ['surlonge', 'steak'], evo: 'boule_feu' },
    frigimon:    { asks: [['defeat', 'Glace', 2], ['item', 'pomme_bleue', 1], ['item', 'digichampi', 2]], gifts: ['champi_glace', 'baie_rouge'], evo: 'cristal_glace' },
    birdramon:   { asks: [['defeat', 'Air', 3], ['stat', 'spd', 110], ['item', 'viande', 2]], gifts: ['disque_vit', 'pilote_auto'], evo: 'aile_flamme' },
    centarumon:  { asks: [['item', 'bandage', 2], ['item', 'medoc', 1], ['defeat', 'Terre', 2]], gifts: ['soin_m', 'omnipotent'], evo: 'sabot_fer' },
    andromon:    { asks: [['item', 'disque_pm', 2], ['defeat', 'Électrique', 3], ['stat', 'int', 110]], gifts: ['pm_m', 'puce_pm'], evo: 'piece_cyber' },
    drimogemon:  { asks: [['defeat', 'Terre', 3], ['item', 'digichampi', 3], ['stat', 'atk', 110]], gifts: ['gland_or', 'super_carotte'], evo: 'foreuse' },
    seadramon:   { asks: [['item', 'digianchois', 2], ['defeat', 'Eau', 3], ['item', 'digitruite', 1]], gifts: ['digitruite', 'pm_m'], evo: 'gourde' },
    shellmon:    { asks: [['item', 'digianchois', 2], ['item', 'digivivaneau', 1], ['defeat', 'Eau', 2]], gifts: ['digisilure', 'soin_m'], evo: 'coquille' },
    unimon:      { asks: [['stat', 'int', 110], ['defeat', 'Air', 2], ['item', 'pomme_bleue', 1]], gifts: ['baie_calme', 'pm_m'], evo: 'unicorne' },
    ogremon:     { asks: [['defeat', 'Ténèbres', 3], ['stat', 'atk', 120], ['item', 'viande', 3]], gifts: ['disque_atk', 'fruit_force'], evo: 'massue' },
    bakemon:     { asks: [['defeat', 'Ténèbres', 2], ['item', 'viande_moisie', 2], ['item', 'champi_joie', 1]], gifts: ['super_reveil', 'champi_joie'], evo: 'haillon' },
    okuwamon:    { asks: [['defeat', 'Insecte', 3], ['stat', 'atk', 130], ['item', 'steak', 1]], gifts: ['s_disque_atk', 'fruit_force'], evo: 'machoire' },
    megadramon:  { asks: [['defeat', 'Air', 3], ['stat', 'spd', 140], ['item', 'pm_g', 1]], gifts: ['s_disque_vit', 'puce_spd'], evo: 'mega_main' },
    piximon:     { asks: [['stat', 'int', 130], ['item', 'digipomme', 1], ['defeat', 'Lumière', 2]], gifts: ['manuel', 'digipomme'], evo: 'petite_lance' },
    monzaemon:   { asks: [['item', 'pomme_bleue', 2], ['item', 'cartes', 1], ['defeat', 'Ténèbres', 2]], gifts: ['melon', 'cartes'], evo: 'x_bandage' },
    etemon:      { asks: [['item', 'cartes', 2], ['item', 'gland_or', 1], ['defeat', 'Ténèbres', 3]], gifts: ['cartes', 'gland_or'], evo: 'banane_or' },
    skullgreymon:{ asks: [['defeat', 'Ténèbres', 4], ['stat', 'atk', 150], ['item', 'steak', 2]], gifts: ['s_disque_atk', 'surlonge'], evo: 'os_fatal' },
    gekomon:     { asks: [['item', 'digianchois', 3], ['defeat', 'Eau', 2], ['item', 'pomme_bleue', 1]], gifts: ['baie_rouge', 'oreiller'] },
    lillymon:    { asks: [['item', 'digichampi', 2], ['defeat', 'Plante', 3], ['item', 'pomme_bleue', 1]], gifts: ['orange_bana', 'noix_douce'] },
    togemon:     { asks: [['defeat', 'Plante', 3], ['item', 'figue', 1], ['stat', 'def', 110]], gifts: ['manuel', 'super_carotte'] },
    tentomon:    { asks: [['item', 'disque_pm', 2], ['defeat', 'Électrique', 2], ['stat', 'int', 100]], gifts: ['double_disk', 'pm_m'] },
    default:     { asks: [['item', 'viande', 2], ['defeat', null, 3], ['item', 'digichampi', 2]], gifts: ['soin_m', 'super_viande'] },
  };
  const prof = sp => PROFILE[sp] || PROFILE.default;
  const R = () => { const s = st(); return (s.requests = s.requests || {}); };   // { sp: { k, n, done, accepted, day, count } }
  const today = () => DW.Time.day();

  function describe(q) {
    if (q.k === 'item') return `m'apporter ${q.n} × ${DW.ITEMS[q.a].name}`;
    if (q.k === 'defeat') return `vaincre ${q.n} Digimon sauvage${q.n > 1 ? 's' : ''}${q.a ? ` de type ${q.a}` : ''}`;
    return `que ton partenaire atteigne ${q.n} en ${STAT[q.a]}`;
  }
  // nouvelle demande du jour (choisie dans le profil, adaptée à la progression)
  function roll(sp) {
    const P = prof(sp), r = R(), cur = r[sp] || { count: 0 };
    const [k, a, n] = P.asks[(cur.count + today()) % P.asks.length];
    const lv = st().party[0] ? st().party[0].level : 5, scale = k === 'stat' ? Math.max(0.5, Math.min(2.5, lv / 20)) : 1;
    r[sp] = { k, a, n: k === 'stat' ? Math.round(n * scale) : n, prog: 0, accepted: false, done: false, day: today(), count: cur.count, evoDue: cur.evoDue || undefined };
    return r[sp];
  }
  function current(sp) { const q = R()[sp]; return q && q.day === today() ? q : null; }

  const Requests = DW.Requests = {
    PROFILE,
    // l'habitant a-t-il une demande à faire ou à rendre ? (pour le « ! » au-dessus de sa tête)
    has(sp) { if (!DW.Town.has(sp)) return false; const q = current(sp); return !q || (!q.done && (!q.accepted || Requests.ready(sp, q))); },
    ready(sp, q) {
      q = q || current(sp); if (!q || !q.accepted || q.done) return false;
      if (q.k === 'item') return (st().bag[q.a] || 0) >= q.n;
      if (q.k === 'defeat') return q.prog >= q.n;
      const m = st().party[0]; return !!m && m.stat(q.a) >= q.n;
    },
    // à appeler après chaque victoire contre un sauvage
    onWin(sp) {
      const T = DW.SPECIES[sp] && DW.SPECIES[sp].types || [];
      for (const who in R()) { const q = R()[who]; if (q.day === today() && q.accepted && !q.done && q.k === 'defeat' && (!q.a || T.includes(q.a))) q.prog++; }
    },
    list() { return Object.entries(R()).filter(([sp, q]) => q.day === today() && q.accepted && !q.done && DW.Town.has(sp)); },
    // dialogue avec l'habitant ; renvoie true si la conversation a porté sur une demande
    async talk(sp) {
      const name = DW.SPECIES[sp].name, P = prof(sp);
      let q = current(sp);
      if (!q) q = roll(sp);
      if (q.done) return false;
      if (q.accepted) {
        if (!Requests.ready(sp, q)) { await say(`Tu n'as pas oublié ? J'aimerais ${describe(q)}.${q.k === 'defeat' ? ` (${q.prog}/${q.n})` : ''}`, name); return false; }
        if (q.k === 'item') st().bag[q.a] -= q.n;
        q.done = true; q.count++;
        const gift = DW.pick(P.gifts), bits = 150 + q.count * 100 + (st().party[0] ? st().party[0].level * 10 : 0);
        st().bits += bits; const extra = DW.giveItem(gift, 1); DW.Audio.sfx('levelup');
        await say(`Merci, tu es formidable ! Voilà pour toi : ${bits} Bits et ${DW.ITEMS[gift].name} !${DW.extraMsg(extra)}`, name);
        if (st().party[0]) st().party[0].addHappy(3);
        // (l'objet de Digivolution, à la 3e demande ; sac plein : il attend la prochaine demande réussie)
        if (P.evo && (q.count === 3 || q.evoDue) && DW.ITEMS[P.evo]) {
          // (sac plein : il part au coffre de ta maison — game/objets.js)
          const reste = DW.giveItem(P.evo, 1); q.evoDue = false; DW.Audio.sfx('fanfare');
          await say(`Tu m'as tellement aidé... Prends ceci : ${DW.ITEMS[P.evo].name}. C'est le secret de ma propre Digivolution. Il fera de ton partenaire un ${DW.SPECIES[DW.ITEMS[P.evo].to].name} !${DW.extraMsg(reste)}`, name);
        }
        DW.autosave();
        return true;
      }
      if (q.later === today()) return false;   // (« Plus tard » : pas avant demain ; son service reste ouvert)
      const r = await DW.ask(`J'ai un service à te demander : ${describe(q)}. Tu veux bien ?`, ['Oui', 'Plus tard'], name);
      if (r !== 0) { q.later = today(); return false; }
      q.accepted = true;
      await say(P.evo && q.count < 3 ? `Super ! Aide-moi encore ${3 - q.count} fois et je te confierai quelque chose de très précieux...` : 'Super ! Je compte sur toi.', name);
      return true;
    },
  };
})();
