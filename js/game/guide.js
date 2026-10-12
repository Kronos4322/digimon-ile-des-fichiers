'use strict';
// =====================================================================
//  ARRIVÉE DANS LE MONDE DIGITAL : la grande discussion avec Jijimon
//  1) le monde : l'Île des Fichiers, les Digimon, la ville en ruines
//  2) le mystère : mémoire perdue, Engrenages Noirs, l'arrivée d'un humain et du Digivice
//  3) l'enquête : ce qu'il faut faire, dans l'ordre
//  4) les règles : en combat tu choisis les techniques ; la Digivolution se fait depuis la table, une fois les critères remplis
//  5) questions libres (soins, entraînement, combats...) — aussi chez Jijimon, menu « Questions »
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
    ["L'enquête", async () => {
      await say("Voici ce que je sais. Un matin, des Engrenages Noirs sont tombés du ciel, comme une pluie d'encre.", J);
      await say("Le soir même, les Digimon de la ville ont tout oublié : leur nom, leurs amis, leur maison. Ils sont partis vivre à l'état sauvage.", J);
      await say("Les plus puissants ont reçu un Engrenage en plein cœur. Ils sont devenus fous et terrorisent leur région. On dit qu'il y en a au moins douze.", J);
      await say("Quelqu'un, quelque part, a lancé ces engrenages. Mais qui ? Et pourquoi ? Les rumeurs parlent d'une ombre au sommet de la Montagne de l'Infini...", J);
      await say("Ton travail : 1) retrouver les Digimon perdus et les aider à se souvenir, 2) libérer ceux qui portent un Engrenage, 3) découvrir qui se cache derrière tout ça.", J);
      await say("Chaque Digimon qui retrouve la mémoire revient en ville et y ouvre un service : boutique, restaurant, clinique... La ville grandit, de « Ruines » à « Mégapole » !", J);
      await say("Et plus la ville grandit, plus de chemins s'ouvrent sur l'île. Certains passages ne s'ouvriront qu'avec l'aide d'un habitant précis.", J);
    }],
    ['Prendre soin de son partenaire', async () => {
      await say("Un Digimon est vivant. Il a FAIM (donne-lui de la viande), il doit aller aux TOILETTES, et il a SOMMEIL le soir (menu → DORMIR).", J);
      await say("S'il ne trouve pas de toilettes à temps... il fait sur place. Ramasse toujours ses crottes : la saleté le rend malade.", J);
      await say("La MALADIE n'arrive jamais par hasard : ce sont les négligences qui s'accumulent. Crottes, faim, épuisement, blessures, nuits blanches... Regarde sa SANTÉ dans sa fiche.", J);
      await say("Un Médicament le guérit, ou une bonne nuit ici. Mais chaque oubli est une ERREUR DE SOIN : trop d'erreurs, et il digivoluera mal... ou vivra moins longtemps.", J);
      await say("Quand il fait une bêtise ou un exploit, parle-lui : félicite-le ou gronde-le. Un Digimon mal élevé désobéit en combat.", J);
      await say("Un Digimon ne vit pas éternellement. Au bout de sa vie, il redevient un DigiŒuf et renaît, plus fort, en gardant une partie de ce qu'il a appris.", J);
    }],
    ['Devenir plus fort', async () => {
      await say("Retiens bien ceci, c'est important : les COMBATS et l'ENTRAÎNEMENT sont deux choses différentes.", J);
      await say("Les combats font monter le NIVEAU. Le niveau fixe le POTENTIEL : jusqu'où ton Digimon peut progresser dans chaque statistique.", J);
      await say("L'entraînement, au Terrain du sud, remplit ce potentiel : PV, PM, Attaque, Défense, Vitesse, Intelligence. Chaque poste a son exercice : ton Digimon court, soulève, frappe... et toi, tu l'aides au bon moment.", J);
      await say("Ce sont les points d'entraînement qui ouvrent les Digivolutions. Regarde la table des Digivolutions (menu) pour savoir quoi travailler.", J);
      await say("Comme dans les vieux récits, les forces se comptent en milliers : un Champion bien entraîné dépasse vite les 2000 PV !", J);
      await say("Et ici, on ne capture pas les Digimon : ils naissent. Elecmon, au Village des Bébés, confie un DigiŒuf par jour.", J);
    }],
    ['Les combats', async () => {
      await say("Les Digimon sauvages se promènent sur les chemins. Certains t'ignorent, d'autres te foncent dessus. Si tu les évites, pas de combat !", J);
      await say("En combat, chaque technique coûte des PM. Les attaques au corps à corps utilisent l'Attaque, celles à distance l'Intelligence.", J);
      await say("La jauge d'ÉNERGIE se remplit au fil des coups : pleine, elle permet le coup spécial de ton Digimon.", J);
      await say("Feu, Eau, Plante, Glace, Lumière, Ténèbres... chaque élément a ses forces et ses faiblesses. Et les attributs aussi : Vaccin bat Virus, Virus bat Données, Données bat Vaccin.", J);
      await say("Si ton équipe est K.O., tu te réveilles ici, chez moi. Hohoho, je veille sur toi !", J);
    }],
  ];

  // ------------------------------------------------------------ les règles (les mêmes pour tout le monde)
  async function explainRules() {
    await say("En combat, c'est TOI qui commandes : à chaque tour, tu choisis la technique de ton partenaire, un objet, ou un autre Digimon.", J);
    await say("Pour digivoluer, ton Digimon doit remplir des conditions : niveau, points d'entraînement, combats gagnés, soins... La table des Digivolutions (menu DIGIVOLUTION) te les montre.", J);
    await say("Quand toutes les conditions sont remplies, le Digivice vibre. C'est alors à toi de décider quand digivoluer, depuis la table.", J);
  }
  // questions libres : renvoie quand le joueur a fini
  async function questions(intro) {
    let q = intro || 'Que veux-tu savoir ?';
    for (;;) {
      const r = await DW.ask(q, TOPICS.map(t => t[0]).concat(["C'est bon, merci !"]), J);
      if (r == null || r < 0 || r >= TOPICS.length) return;
      await TOPICS[r][1]();
      q = 'Autre chose ?';
    }
  }

  // ------------------------------------------------------------ la grande discussion d'arrivée
  async function opening() {
    await DW.wait(0.6);
    const baby = DW.state.party[0] ? DW.state.party[0].name : 'Ton Digimon';
    await say('Mmh... Où est-ce que je suis ? Ma tête tourne...');
    await say(`... ! Un petit Digimon est blotti contre toi. Il ouvre les yeux en même temps que toi.`);
    await say(`Tu es réveillé ! Je m'appelle ${baby}. Je ne t'ai pas quitté une seconde !`, baby);
    await say("Hohoho ! Doucement, doucement. Tu as dormi presque une journée entière.", J);
    await say("Je suis Jijimon, le doyen de la Ville des Fichiers. Je t'ai trouvé évanoui sur la plage, au milieu des cabines téléphoniques.", J);
    await say("Tu es sur l'Île des Fichiers, dans le monde digital. Un monde fait de données... très loin de chez toi, je le crains.", J);
    await say(`Et tu tiens dans ta main un Digivice. Il s'est mis à briller dès que je t'ai trouvé, ${hero()}.`, J);
    await say("C'est bien la première fois que je vois un humain ici. Les vieux récits parlent d'enfants « DigiSélectionnés », appelés quand le monde digital est en danger...", J);
    await say("Et justement, il l'est.", J);
    await TOPICS[1][1]();   // l'enquête
    await say("Je suis trop vieux pour courir l'île. Mais toi... avec un partenaire Digimon à tes côtés, tu pourrais peut-être y arriver.", J);
    await say(`Et ce petit ${baby}... Il dormait à tes pieds sur la plage. Il ne t'a pas quitté depuis : c'est ton partenaire, ça ne fait aucun doute !`, J);
    DW.Audio.sfx('fanfare');
    await say(`${baby} devient ton partenaire !`);
    await say("J'avais préparé un colis pour toi : 5 Viandes et 3 Remèdes. (Et si tu te perds, Koromon, notre petit guide, se promène sur la place !)", J);
    await explainRules();
    await questions("Avant que tu sortes : as-tu des questions ? Je peux t'expliquer comment vit un Digimon, comment il devient fort...");
    await say("Ma porte est toujours ouverte : reviens me poser tes questions, ou dormir ici pour soigner ton équipe.", J);
    await say("(Déplacements : flèches ou ZQSD.  Courir : Maj.  Parler : ESPACE.  Menu : ENTRÉE.)");
  }

  DW.Guide = { TOPICS, opening, questions, explainRules };
})();
