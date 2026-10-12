'use strict';
// =====================================================================
//  PLAGE DES CABINES
// =====================================================================
(function () {
  const { say, st, rle, paint, healAll, recruitNPC, zoomMap } = DW.MapKit;
  const MAPS = DW.MAPS;
  async function boothEvent(ow) {
    const s = st();
    if (s.flags.shellmon) { await say('Le combiné est muet... Que font des cabines téléphoniques sur cette plage ?'); return; }
    DW.Audio.sfx('ring');
    await say('Driiing ! Driiing ! Toutes les cabines se mettent à sonner en même temps !');
    const r = await DW.ask('Décrocher le téléphone ?');
    if (r !== 0) { await say("Les sonneries s'arrêtent d'un coup... C'était bizarre."); return; }
    await say('Allô ?... Seul un étrange bruit de vagues te répond.');
    DW.Audio.sfx('roar'); ow.shake = 1;
    await DW.wait(0.7);
    await say('BOUM ! Un énorme coquillage jaillit du sable !');
    const pn = (s.party.find(m => m.hp > 0) || s.party[0]).name;
    await say("C'est Shellmon ! Il croit qu'on veut lui voler sa plage ! Attention, il est très fort !", pn);
    const res = await ow.battle({ enemy: new DW.Digimon('shellmon', 11), boss: true, intro: 'Shellmon surgit de son coquillage !' });
    if (res === 'win') {
      s.flags.shellmon = true;
      await say('Shellmon replonge dans la mer en grommelant...');
      DW.giveItem('super_viande', 2); s.bits += 300;
      DW.Audio.sfx('buy');
      await say('Tu trouves 2 Super Viandes et 300 Bits dans le sable !');
    }
  }

  // ------------------------------------------------------------ PLAGE DES CABINES (40x28)
  MAPS.plage = {
    name: 'Plage des Cabines', music: 'beach', bg: 'plage', ambient: 'beach', theme: 'beach', climate: 'beach', region: 'plage', rate: 0.12,
    rows: [
      'T17 . = . T20',
      'T .3 f .5 ,4 .4 = .6 ,5 .4 f .5',
      'T .5 ,4 .8 =22',
      'T .2 r .7 f .6 = .2 S .8 b .9',
      'C17 ^3 C20',
      'R s2 ;4 s24 p s7 R',
      'R s ;5 s8 R s14 ;3 s6 R',
      'R p ;4 s23 p s4 ~6',
      'R s ;3 s27 R ~7',
      'R s30 R ~8',
      'R s30 ~9',
      'R s6 P s P s P s P s P s P s11 ~11',
      'R s28 R ~10',
      'R s5 ;4 s19 ~11',
      'p s4 ;6 s17 R ~11',
      'R s5 ;4 s8 ;5 s5 ~12',
      'R s16 ;6 s5 ~12',
      'R s4 R s11 ;6 s5 ~12',
      'R s9 ;5 s8 p s3 ~13',
      'p s8 ;5 s12 ~14',
      'R s11 R s12 ~15',
      '~3 s20 ~17',
      '~6 s12 ~2 _ ~19',
      '~20 _ ~19',
      '~20 _ ~19',
      '~19 _3 ~18',
      '~40',
      '~40',
    ].map(rle).map((r, y) => [...r].map((ch, x) => {
      // coquillages et étoiles de mer semés sur le sable sec
      if (ch === 's' && y > 4 && y < 21 && DW.Art.hash(x, y, 77) < 0.08) return '3';
      // bordure ouest : bosquet de palmiers plutôt qu'une pile de rochers
      if (x === 0 && (ch === 'R' || ch === 'p')) return y % 3 === 1 ? 'R' : 'p';
      return ch;
    }).join('')).map((r, y) => {
      // bois flotté, rochers à cuvette, château de sable
      const put = { 9: [[14, '9']], 12: [[27, '8']], 17: [[9, '6']], 18: [[25, '8']], 20: [[20, '6']] }[y] || [];
      for (const [x, ch] of put) r = r.slice(0, x) + ch + r.slice(x + 1);
      return r;
    }),
    objects: [{ kind: 'rowboat', x: 21, y: 23, w: 2, h: 1, oy: 2 }],
    encounters: [
      // première zone : surtout des bébés et des Digimon d'Entraînement ; les Disciples sont rares (et ne chassent pas un bébé)
      { sp: 'pichimon', min: 2, max: 3, w: 35 },
      { sp: 'punimon', min: 2, max: 3, w: 15 },
      { sp: 'bukamon', min: 3, max: 4, w: 20 },
      { sp: 'betamon', min: 3, max: 3, w: 12 },
      { sp: 'gotsumon', min: 3, max: 3, w: 10 },
      { sp: 'kunemon', min: 3, max: 3, w: 8 },
    ],
    warps: [
      { x: 17, y: 0, w: 3, h: 1, dir: 'up', to: 'lisiere', tx: 17, ty: 31 },
      { x: 39, y: 1, w: 1, h: 3, dir: 'right', to: 'village', tx: 0, ty: 13 },
    ],
    npcs: [
      recruitNPC({ sp: 'gotsumon', x: 29, y: 8, lvl: 5, face: 'left',
        lines: ["Grrr ! Je suis Gotsumon. Je casse des cailloux pour me calmer...", "Avant, j'avais une place en ville. Mais je n'ai plus le cœur à rien. Sauf si tu me bats !"],
        win: "Bah... T'es costaud ! Allez, je rentre en ville. Tu vas voir ce que tu vas voir !" }),
      recruitNPC({ sp: "gomamon", x: 26, y: 16, lvl: 6, face: "right",
        lines: ["Yo ! Moi c'est Gomamon ! Les vagues, la pêche... la belle vie !", "Mais j'aimerais bien un coin d'eau douce tranquille. Bats-moi et je te suis !"],
        win: "Bien joué ! Allez, je viens en ville. J'ai repéré un endroit parfait..." }),
    ],
    triggers: [],
    signs: {
      '21,3': 'Nord : Forêt de l\'Arrivée.  Est : Ville des Fichiers.  Les cabines téléphoniques sonnent parfois toutes seules...',
    },
    tileActs: { P: boothEvent },
  };
  zoomMap(MAPS.plage, 'plage');   // plan agrandi ×2 (maps/common.js)

})();
