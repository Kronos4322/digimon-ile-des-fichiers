'use strict';
// =====================================================================
//  JIJIMON : le réveil chez lui, puis ses explications (menu « Questions » de Jijimon)
//  Au début, il ne sait presque rien : les habitants sont partis et ont tout oublié, c'est au joueur d'enquêter.
//  Ce qu'il raconte grandit avec ce que le joueur découvre (Kuwagamon, Engrenages Noirs, écussons...).
//  Un sujet peut avoir une condition (3e élément) : il n'apparaît qu'une fois la découverte faite.
// =====================================================================
(function () {
  const say = (t, s) => DW.say(t, s);
  const J = 'Jijimon';
  const st = () => DW.state;
  const hero = () => st().name || 'mon enfant';

  // ------------------------------------------------------------ sujets (questions libres)
  const TOPICS = [
    ['Le monde digital', async () => {
      await say("Le monde digital est né des réseaux de ton monde à toi : chaque donnée qui circule là-bas finit par prendre forme ici.", J);
      await say("Les Digimon sont des « monstres digitaux ». Ils naissent d'un DigiŒuf, grandissent, mangent, dorment... et digivoluent quand ils deviennent assez forts.", J);
      await say("L'Île des Fichiers est un petit bout de ce monde : forêts, plage, montagne, volcan, marais, terre gelée... seize régions en tout.", J);
      await say("Au centre, il y a notre Ville des Fichiers. Autrefois, des dizaines de Digimon y tenaient boutique. Aujourd'hui, il n'en reste que des ruines.", J);
    }],
    ["Ce qui se passe sur l'île", async () => {
      const g = DW.Story.gears ? DW.Story.gears() : 0, f = st().flags;
      await say("Je ne sais pas grand-chose, tu sais... Les habitants de la ville sont partis du jour au lendemain. Ceux que je croise ne se souviennent plus de rien.", J);
      if (!f.kuwagamon) { await say("Les petits Digimon de la forêt disent qu'un énorme insecte rouge terrorise la Clairière de l'Arrivée. Avant, il était doux comme un agneau...", J); return; }
      if (!g) { await say("Kuwagamon n'était pas lui-même, dis-tu ? Comme s'il était... possédé. Et si c'était la même chose pour tous les autres ?", J); await say("Les Digimon que tu retrouves se souviennent parfois de la ville en te voyant. Ramène-les ici !", J); return; }
      await say(`Des Engrenages Noirs plantés dans leur dos... Voilà donc ce qui leur a volé la mémoire ! Tu en as déjà brisé ${g}.`, J);
      await say("Quelqu'un les a lancés sur l'île, c'est certain. Mais qui ? Continue ton enquête : le Journal (menu) garde la trace de tout ce que tu découvres.", J);
    }],
    ['Les écussons et les enfants perdus', async () => {
      await say("Ce portail gravé que tu as vu... Je me souviens d'un vieux récit : des écussons, un pour chaque enfant venu d'un autre monde.", J);
      await say("Sans écusson, un Digimon ne dépasserait pas le stade Champion. Chaque écusson réveillerait le stade Ultime d'une famille de Digimon. Et les sept réunis...", J);
      await say("S'il y a d'autres enfants comme toi sur l'île, ils sont peut-être retenus derrière ces portails. Délivre-les ! (Menu → JOURNAL → ÉCUSSONS)", J);
    }, () => st().flags.crestSeen || (DW.Crests && DW.Crests.count() > 0)],
    ['Prendre soin de son partenaire', async () => {
      await say("Un Digimon est vivant. Il a FAIM (donne-lui de la viande) et SOIF (une rivière, une source, ou une Eau fraîche), il doit aller aux TOILETTES, et il a SOMMEIL le soir (menu → DORMIR).", J);
      await say("Un bébé mange peu ; un Champion, et surtout un gros Digimon, mange beaucoup ! Bien nourri, il prend du POIDS : certaines Digivolutions demandent un Digimon costaud, d'autres un Digimon léger.", J);
      await say("La nourriture ne soigne pas les blessures : pour les PV et les PM, il faut des RAM (au Bazar, ou dans les distributeurs de l'île). Et s'il n'a pas sommeil, il peut juste se reposer une heure ici.", J);
      await say("S'il ne trouve pas de toilettes à temps... il fait sur place. Ramasse toujours ses crottes : la saleté le rend malade.", J);
      await say("La MALADIE n'arrive jamais par hasard : ce sont les négligences qui s'accumulent. Crottes, faim, épuisement, blessures, nuits blanches... Regarde sa SANTÉ dans sa fiche.", J);
      await say("Un Médicament le guérit, ou une bonne nuit ici. Mais chaque oubli est une ERREUR DE SOIN : trop d'erreurs, et il digivoluera mal... ou vivra moins longtemps.", J);
      await say("Quand il fait une bêtise ou un exploit, félicite-le ou gronde-le aussitôt (menu → FÉLICITER / GRONDER). Un Digimon mal élevé désobéit en combat.", J);
      await say("Un Digimon ne vit pas éternellement. Au bout de sa vie, il redevient un DigiŒuf et renaît, plus fort, en gardant une partie de ce qu'il a appris.", J);
    }],
    ['Devenir plus fort', async () => {
      await say("Retiens bien ceci, c'est important : les COMBATS et l'ENTRAÎNEMENT sont deux choses différentes.", J);
      await say("Les combats font monter le NIVEAU. Le niveau fixe le POTENTIEL : jusqu'où ton Digimon peut progresser dans chaque statistique.", J);
      await say("L'entraînement, au Terrain du sud, remplit ce potentiel : PV, PM, Attaque, Défense, Vitesse, Intelligence. Chaque poste a son exercice : ton Digimon court, soulève, frappe... et toi, tu l'aides au bon moment.", J);
      await say("Ce sont les points d'entraînement qui ouvrent les Digivolutions. Regarde sa fiche (menu → DIGIMON, onglet DIGIVOLUTION) pour savoir quoi travailler.", J);
      await say("Et retiens ceci : un CHAMPION est bien plus fort qu'un Disciple. Contre un Champion sauvage, un Disciple n'a presque aucune chance... sauf s'il est très bien entraîné !", J);
      await say("Comme dans les vieux récits, les forces se comptent en milliers : un Champion bien entraîné dépasse vite les 2000 PV !", J);
      await say("Et ici, on ne capture pas les Digimon : ils naissent. Penguinmon, au Village des Bébés, confie un DigiŒuf par jour.", J);
    }],
    ['Les combats', async () => {
      await say("Les Digimon sauvages se promènent sur les chemins. Certains t'ignorent, d'autres te foncent dessus. Si tu les évites, pas de combat !", J);
      await say("En combat, ton Digimon se bat tout seul, avec la technique que tu lui donnes, et il esquive selon sa Vitesse. Toi, tu le diriges : ESPACE ouvre la roue (technique, objet, garde, fuite), et les flèches te permettent de le guider pour esquiver.", J);
      await say("Chaque technique coûte des PM. Les attaques au corps à corps utilisent l'Attaque, celles à distance l'Intelligence.", J);
      await say("La jauge d'ÉNERGIE se remplit au fil des coups : pleine, elle permet le coup spécial de ton Digimon.", J);
      await say("Poison, brûlure, paralysie et sommeil ne durent que quelques tours (le nombre s'affiche à côté du nom). Feu, Eau, Plante, Glace, Lumière, Ténèbres... chaque élément a ses forces et ses faiblesses. Et les attributs aussi : Vaccin bat Virus, Virus bat Données, Données bat Vaccin.", J);
      await say("Si ton équipe est K.O., tu te réveilles ici, chez moi. Hohoho, je veille sur toi !", J);
    }],
  ];

  // ------------------------------------------------------------ les règles (les mêmes pour tout le monde)
  async function explainRules() {
    await say("En combat, ton partenaire se bat tout seul. Toi, tu choisis sa technique, tu lances des objets et tu peux le guider pour esquiver.", J);
    await say("Pour digivoluer, ton Digimon doit remplir des conditions : niveau, points d'entraînement, combats gagnés, poids, soins... Sa fiche (onglet DIGIVOLUTION) te les montre.", J);
    await say("Quand toutes les conditions sont remplies, le Digivice vibre. C'est alors à toi de décider quand digivoluer, depuis la table.", J);
  }
  // questions libres : renvoie quand le joueur a fini
  async function questions(intro) {
    let q = intro || 'Que veux-tu savoir ?';
    for (;;) {
      const list = TOPICS.filter(t => !t[2] || t[2]());
      const r = await DW.ask(q, list.map(t => t[0]).concat(["C'est bon, merci !"]), J);
      if (r == null || r < 0 || r >= list.length) return;
      await list[r][1]();
      q = 'Autre chose ?';
    }
  }

  // ------------------------------------------------------------ la grande discussion d'arrivée
  async function opening() {
    await DW.wait(0.6);
    const baby = DW.state.party[0] ? DW.state.party[0].name : 'Ton Digimon';
    await say('Mmh... Où est-ce que je suis ?');
    await say(`${baby} est blotti contre toi. Il ouvre les yeux en même temps que toi.`);
    await say(`Tu es réveillé ! Moi c'est ${baby} ! Je ne t'ai pas quitté une seconde !`, baby);
    await say("Hohoho ! Doucement... Je suis Jijimon. Je vous ai trouvés tous les deux sur la plage, près des cabines téléphoniques.", J);
    await say(`Un humain... Je n'en avais jamais vu. Tu t'appelles ${hero()} ? Et d'où viens-tu ?... Tu ne sais pas non plus. Hohoho, nous voilà bien.`, J);
    await say("Ici, c'est la Ville des Fichiers. Enfin... ce qu'il en reste. Ses habitants sont partis du jour au lendemain, et ceux que je croise ne se souviennent plus de rien.", J);
    await say("Je ne sais pas ce qui leur est arrivé. Moi, je suis bien trop vieux pour courir l'île... Mais toi, avec ce petit, tu pourrais peut-être le découvrir ?", J);
    DW.Audio.sfx('fanfare');
    await say(`${baby} devient ton partenaire !`);
    await say("Koromon, un petit qui est resté en ville, la connaît par cœur. Va le voir sur la place : il te fera visiter. Et reviens me voir si tu as des questions.", J);
    await say("(Déplacements : flèches ou ZQSD.  Courir : Maj.  Parler : ESPACE.  Menu : ENTRÉE.)");
  }

  DW.Guide = { TOPICS, opening, questions, explainRules };
})();
