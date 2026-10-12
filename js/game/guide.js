'use strict';
// =====================================================================
//  ARRIVÉE DANS LE MONDE DIGITAL : la grande discussion avec Jijimon
//  1) le monde : l'Île des Fichiers, les Digimon, la ville en ruines
//  2) le mystère : mémoire perdue, Engrenages Noirs, l'arrivée d'un humain et du Digivice
//  3) l'enquête : ce qu'il faut faire, dans l'ordre
//  4) les règles : Digivolution (classiques / Digimon World 1) et combats (manuel / ordres), expliquées en détail
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
      await say("L'entraînement, au Terrain du sud, remplit ce potentiel : PV, PM, Attaque, Défense, Vitesse, Intelligence. Chaque séance est un petit jeu de rythme.", J);
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

  // ------------------------------------------------------------ choix des règles (expliquées en détail)
  async function chooseEvolution() {
    for (;;) {
      const r = await DW.ask("Maintenant, une décision importante : comment ton partenaire va-t-il grandir ?", ['Règles classiques', 'Règles Digimon World 1', 'Explique-moi la différence'], J);
      if (r === 2) {
        await say("RÈGLES CLASSIQUES : c'est TOI qui décides. Quand ton Digimon remplit les conditions, tu choisis sa Digivolution dans la table, au moment que tu veux.", J);
        await say("Tu peux garder jusqu'à 6 Digimon dans ton équipe et alterner en combat. Idéal pour découvrir le jeu tranquillement.", J);
        await say("RÈGLES DIGIMON WORLD 1 : ton Digimon digivolue TOUT SEUL en grandissant. Quand son âge arrive, il prend la meilleure forme dont il remplit les conditions.", J);
        await say("Tu n'as qu'UN seul partenaire à la fois (les autres attendent à la DigiFerme). Bien soigné et entraîné, il deviendra magnifique. Négligé... il deviendra Numemon.", J);
        await say("Dans les deux cas, les soins, l'entraînement et la vie du Digimon comptent. Tu pourras changer d'avis plus tard dans les Options.", J);
        continue;
      }
      if (r < 0) continue;
      st().flags.autoEvo = r === 1; st().flags.solo = r === 1;
      await say(r === 1 ? "Les règles de Digimon World 1 ! Prends bien soin de ton partenaire : il grandira à son rythme." : "Très bien ! Tu décideras toi-même des Digivolutions de tes Digimon.", J);
      return;
    }
  }
  async function chooseBattle() {
    for (;;) {
      const r = await DW.ask("Et en combat ? Veux-tu commander chaque attaque, ou laisser ton partenaire se battre seul en lui donnant des ordres ?", ['Je choisis chaque attaque', 'Il se bat seul (ordres)', 'Explique-moi'], J);
      if (r === 2) {
        await say("CHAQUE ATTAQUE : à chaque tour, tu choisis la technique, l'objet ou le changement de Digimon. Tu contrôles tout.", J);
        await say("ORDRES, comme dans Digimon World 1 : ton partenaire choisit seul ses attaques. Appuie sur ESPACE pendant son tour pour reprendre la main et lui donner un ordre.", J);
        await say("Un Digimon peu discipliné peut aussi n'en faire qu'à sa tête... Ce réglage se change à tout moment dans les Options.", J);
        continue;
      }
      if (r < 0) continue;
      DW.Options.battleMode = r === 1 ? 1 : 0; DW.Options.save();
      await say(r === 1 ? "Les ordres ! Tu fais confiance à ton partenaire, c'est beau." : "Tu commandes tout. Garde la tête froide !", J);
      return;
    }
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
    await say('Mmh... Où est-ce que je suis ? Ma tête tourne...');
    await say("Hohoho ! Doucement, doucement. Tu as dormi presque une journée entière.", J);
    await say("Je suis Jijimon, le doyen de la Ville des Fichiers. Je t'ai trouvé évanoui sur la plage, au milieu des cabines téléphoniques.", J);
    await say("Tu es sur l'Île des Fichiers, dans le monde digital. Un monde fait de données... très loin de chez toi, je le crains.", J);
    await say(`Et tu tiens dans ta main un Digivice. Il s'est mis à briller dès que je t'ai trouvé, ${hero()}.`, J);
    await say("C'est bien la première fois que je vois un humain ici. Les vieux récits parlent d'enfants « DigiSélectionnés », appelés quand le monde digital est en danger...", J);
    await say("Et justement, il l'est.", J);
    await TOPICS[1][1]();   // l'enquête
    await say("Je suis trop vieux pour courir l'île. Mais toi... avec un partenaire Digimon à tes côtés, tu pourrais peut-être y arriver.", J);
    await say("Ce soir-là, seuls trois petits Digimon sont restés en ville : Koromon, Pichimon et Yuramon. Ils t'attendent sur la place. L'un d'eux sera ton partenaire.", J);
    await chooseEvolution();
    await chooseBattle();
    await questions("Avant que tu sortes : as-tu des questions ? Je peux t'expliquer comment vit un Digimon, comment il devient fort...");
    await say("Ma porte est toujours ouverte : reviens me poser tes questions, ou dormir ici pour soigner ton équipe.", J);
    await say("(Déplacements : flèches ou ZQSD.  Courir : Maj.  Parler : ESPACE.  Menu : ENTRÉE.)");
  }

  DW.Guide = { TOPICS, opening, questions, chooseEvolution, chooseBattle };
})();
