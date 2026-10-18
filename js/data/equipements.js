'use strict';
// =====================================================================
//  ÉQUIPEMENTS (comme dans Digimon World 2003) : chaque Digimon porte une ARME, une ARMURE et un ACCESSOIRE.
//  Ce sont des objets du sac (use: 'equip') : on les donne à un Digimon depuis le sac, l'ancien revient dans le sac ;
//  l'onglet « Équipement » de la fiche du Digimon les montre et permet de les retirer.
//  st : bonus en points de puce tant que l'objet est porté (1 point = +4 en stat, +20 PV / PM : DW.SCALE).
//  tier : rang de boutique (le Bazar les vend quand la ville grandit, plafonné par le chapitre : data/items.js).
// =====================================================================
(function () {
  const I = DW.ITEMS;
  DW.EQUIP_SLOTS = [['arme', 'Arme', 'claw'], ['armure', 'Armure', 'armor'], ['acc', 'Accessoire', 'ring']];
  const E = {
    // ------------------------------------------------------------ armes : l'Attaque
    griffes_bronze: ['arme', 'Griffes de bronze', 400, 0, { atk: 4 }, '#c8884a', 'Des griffes de bronze à enfiler. Attaque en hausse.'],
    crocs_acier:    ['arme', "Crocs d'acier", 1200, 3, { atk: 8 }, '#a8b0c0', "Des crocs d'acier qui mordent fort."],
    gants_flamme:   ['arme', 'Gants de flamme', 2500, 99, { atk: 10, int: 3 }, '#ff7a30', 'Cadeau de Meramon. Des gants qui ne refroidissent jamais.'],
    lame_digitale:  ['arme', 'Lame digitale', 3000, 6, { atk: 14, spd: 2 }, '#5ad8ff', 'Une lame de données pures, légère et tranchante.'],
    marteau_titan:  ['arme', 'Marteau Titan', 6000, 9, { atk: 22, spd: -3 }, '#8a7a6a', 'Énorme et lourd : il frappe fort, mais ralentit.'],
    epee_chrome:    ['arme', 'Épée Chrome Digizoïde', 15000, 13, { atk: 32 }, '#f0f4ff', 'Forgée dans le métal le plus dur du Digimonde.'],
    // ------------------------------------------------------------ armures : la Défense et les PV
    veste_cuir:     ['armure', 'Veste de cuir', 400, 0, { def: 4 }, '#8a5a34', 'Une veste solide pour les petits Digimon aventureux.'],
    plastron_bronze:['armure', 'Plastron de bronze', 1200, 3, { def: 8, hp: 4 }, '#c8884a', 'Protège bien le torse.'],
    armure_digitale:['armure', 'Armure digitale', 3200, 6, { def: 14, hp: 8 }, '#5ad8ff', 'Des plaques de données qui encaissent les coups.'],
    carapace_mono:  ['armure', 'Carapace de Monochromon', 6500, 9, { def: 22, spd: -2 }, '#6a7a8a', 'Dure comme le diamant... et lourde.'],
    armure_chrome:  ['armure', 'Armure Chrome Digizoïde', 16000, 13, { def: 32, hp: 16 }, '#f0f4ff', "L'armure ultime. Presque rien ne la traverse."],
    // ------------------------------------------------------------ accessoires : Vitesse, Intelligence, PM...
    bandeau:        ['acc', 'Bandeau', 300, 0, { spd: 4 }, '#e04a4a', 'Un bandeau de sportif. On se sent plus rapide !'],
    lunettes:       ['acc', 'Lunettes d\'aviateur', 900, 2, { int: 3, spd: 3 }, '#f0c040', 'Comme celles de Tai. On voit plus loin, on va plus vite.'],
    anneau_pm:      ['acc', 'Anneau PM', 1500, 4, { mp: 8, int: 4 }, '#5a8aff', 'Un anneau qui garde de l\'énergie pour les techniques.'],
    plume_ardente:  ['acc', 'Plume ardente', 3500, 7, { spd: 10, atk: 2 }, '#ff8a3a', 'Une plume de Birdramon. Légère comme le vent.'],
    pendentif:      ['acc', 'Pendentif Écusson', 9000, 11, { hp: 4, mp: 4, atk: 4, def: 4, spd: 4, int: 4 }, '#ffd040', 'Un pendentif qui brille comme un Écusson. Tout augmente un peu.'],
  };
  // (échelle de DW.SCALE, game/monster.js : 1 point = +4 en stat, +20 PV / PM)
  const NAMES = { hp: 'PV', mp: 'PM', atk: 'Att', def: 'Déf', spd: 'Vit', int: 'Int' };
  DW.equipText = st => Object.entries(st).map(([k, v]) => `${NAMES[k]} ${v > 0 ? '+' : ''}${v * (k === 'hp' || k === 'mp' ? 20 : 4)}`).join(', ');
  for (const id in E) {
    const [slot, name, price, tier, st, col, desc] = E[id], ic = DW.EQUIP_SLOTS.find(s => s[0] === slot)[2];
    I[id] = { name, price, tier, use: 'equip', slot, st, icon: [ic, col], desc: `${desc} (${DW.equipText(st)})` };
    DW.ITEM_ORDER.push(id);
  }
  // le Bazar les vend (les meilleurs seulement quand la ville a grandi, et selon le chapitre)
  DW.SHOPS.bazar.push(...Object.keys(E).filter(id => E[id][3] < 99));
  // bonus d'équipement d'un Digimon (points de puce)
  DW.equipBonus = (m, k) => { let b = 0; if (m.equip) for (const s in m.equip) { const it = I[m.equip[s]]; if (it && it.st && it.st[k]) b += it.st[k]; } return b; };
})();
