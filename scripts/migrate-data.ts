import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

function parseDbUrl(url: string) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: Number(parsed.port) || 3306,
    user: parsed.username,
    password: parsed.password,
    database: parsed.pathname.replace("/", ""),
  };
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  const db = parseDbUrl(url);
  const adapter = new PrismaMariaDb({ ...db, connectionLimit: 5 });
  const prisma = new PrismaClient({ adapter });

  console.log("Connected to Railway DB");

  // IGCommand
  const igCommands = [
    { name: "/dealeradmin", category: "Concessionnaire", description: "Gestion de l'ensemble des véhicules", usage: "/dealeradmin" },
    { name: "/kick", category: "Moderation", description: "Expulse un joueur du serveur", usage: "/kick [id] [raison]" },
    { name: "/ban", category: "Moderation", description: "Bannit un joueur du serveur", usage: "/ban [id] [raison] [durée]" },
    { name: "/warn", category: "Moderation", description: "Met un avertissement à un joueur", usage: "/warn [id] [raison]" },
    { name: "/tx", category: "TxAdmin", description: "Accès au TxAdmin", usage: "/tx" },
    { name: "/revive", category: "Médical", description: "Ranime un joueur inconscient", usage: "/revive [id]" },
    { name: "/directsale", category: "Concessionnaire", description: "Vente de véhicule aux joueurs", usage: "/directsale" },
    { name: "/wipe", category: "Moderation", description: "Supprime le personnage d'un joueur pour une création d'un nouveau", usage: "/wipe [id-unique]" },
    { name: "/jail", category: "Moderation", description: "Enferme un joueur en jail", usage: "/jail [id] [durée]" },
    { name: "/heal", category: "Médical", description: "Soigne complètement un joueur", usage: "/heal [id]" },
    { name: "/myfinance", category: "Concessionnaire", description: "Gestion des finances du concessionnaire", usage: "/myfinance" },
    { name: "/freeze", category: "Moderation", description: "Gèle un joueur sur place", usage: "/freeze [id]" },
    { name: "/tig", category: "Moderation", description: "Donne un tig à un joueur", usage: "/tig [id]" },
  ];

  await prisma.iGCommand.deleteMany();
  await prisma.iGCommand.createMany({ data: igCommands });
  console.log(`Inserted ${igCommands.length} IGCommand`);

  // ProcedureStep
  const procedureSteps = [
    {
      title: "Attention — Qui peut effectuer la vérification",
      content: "Seuls les développeurs, administrateurs, responsables et la fondation se réservent le droit d'effectuer une vérification.\n\n• Ne forcez jamais un joueur à partager son écran.\nExpliquez calmement que la vérification est nécessaire et que, s'il refuse, le verdict actuel (ban) restera en vigueur.\nRestez polis et factuels : l'objectif est de vérifier, pas d'accuser sans preuve.\n\nCes vérifications ont uniquement pour but de détecter d'éventuels programmes malveillants pouvant nuire à l'expérience de jeu.\nUn joueur ne sera pas débanni pour cette raison sans une vérification rapide et ciblée.",
      sortOrder: 0,
    },
    {
      title: "1. Vérifier les fichiers récents",
      content: "• Ouvrir la fenêtre Exécuter (Windows + R).\n• Taper « recent » puis valider.\n• Vérifier les derniers fichiers .exe lancés.\n• Noter/capturer tout exécutable suspect.",
      sortOrder: 1,
    },
    {
      title: "2. Vérifier les téléchargements dans le navigateur",
      content: "• Demander au joueur d'ouvrir ses navigateurs principaux.\n• Appuyer sur Ctrl + J pour ouvrir le gestionnaire de téléchargements.\n• Vérifier la liste des fichiers : rechercher des noms suspects (Susano, RedEngine, Eulen, Keyzer…).\n• Si la liste est vide → demander une recherche manuelle dans le dossier téléchargements.\n• Noter et capturer toute preuve.",
      sortOrder: 2,
    },
    {
      title: "3. Consulter l'historique du navigateur",
      content: "• Demander au joueur d'appuyer sur Ctrl + H.\n• Rechercher dans l'historique des termes suspects : susano, eulen, redengine, keyzer…\n• Noter/capturer toute page liée aux cheats.",
      sortOrder: 3,
    },
    {
      title: "4. Rechercher Discord et variantes",
      content: "• Demander au joueur d'ouvrir son navigateur et de taper « Discord ».\n• Vérifier l'existence de liens ou serveurs suspects.\n• Vérifier aussi sur le PC la présence de versions alternatives : Discord, Discord PTB, Discord Canary.\n• Noter/capturer tout lien, serveur ou application liée à des cheats.",
      sortOrder: 4,
    },
    {
      title: "5. Vérifier la présence de Revo Uninstaller",
      content: "• Vérifier si Revo Uninstaller (ou équivalent) est installé.\n• Sa présence peut indiquer que le joueur a tenté d'effacer des traces.\n• Noter et capturer toute preuve de son utilisation récente.",
      sortOrder: 5,
    },
    {
      title: "Conclusion / Interprétation",
      content: "• Si aucune preuve n'est trouvée → on peut estimer à ~70% qu'aucun cheat détectable n'est présent.",
      sortOrder: 6,
    },
    {
      title: "Attention — Bans légitimes",
      content: "Certains bans sont légitimes (NUI, giveweapon, noclip, spawnentities en masse…).\nCes comportements ne sont pas des faux bans et doivent être considérés comme des infractions valides.",
      sortOrder: 7,
    },
  ];

  await prisma.procedureStep.deleteMany();
  await prisma.procedureStep.createMany({ data: procedureSteps });
  console.log(`Inserted ${procedureSteps.length} ProcedureStep`);

  // VehicleSpawn
  const vehicles = [
    { name: "Tol A6", category: "Audi", command: "tola6" },
    { name: "Tol RS5 C20", category: "Audi", command: "tolrs5c20b" },
    { name: "Tol Audi DY", category: "Audi", command: "tolaudidy" },
    { name: "Tol E-Tron 22", category: "Audi", command: "toletron22" },
    { name: "Tol Mans RS6", category: "Audi", command: "tolmansrs6" },
    { name: "Sultan", category: "Audi", command: "sultan" },
    { name: "Tol RS7", category: "Audi", command: "tolrs7" },
    { name: "Tol M2 CS20", category: "BMW", command: "tolm2cs20" },
    { name: "Tol E36 PRB", category: "BMW", command: "tole36prb" },
    { name: "Tol BMW E39", category: "BMW", command: "tolbmwe39" },
    { name: "Tol M3 E92", category: "BMW", command: "tolm3e92" },
    { name: "Tol M5 Perf16", category: "BMW", command: "tolm5perf16" },
    { name: "Tol M5 CS22", category: "BMW", command: "tolm5cs22" },
    { name: "Tol B330i 22", category: "BMW", command: "tolb330i22" },
    { name: "Tol F82", category: "BMW", command: "tolf82st" },
    { name: "Tol G81", category: "BMW", command: "tolg81" },
    { name: "Tol I8 KS", category: "BMW", command: "toli8ks" },
    { name: "Tol M3 E30", category: "BMW", command: "tolm3e30" },
    { name: "Tol M3 E46", category: "BMW", command: "tolm3e46" },
    { name: "Tol M5 E34", category: "BMW", command: "tolm5e34" },
    { name: "Tol X5 H", category: "BMW", command: "tolx5h" },
    { name: "Tol Charger 23D", category: "Dodge", command: "tolcharger23d" },
    { name: "Tol Charger 2", category: "Dodge", command: "tolcharger2" },
    { name: "Tol Demon", category: "Dodge", command: "toldemon" },
    { name: "Tol 24 Dem V1", category: "Dodge", command: "tol24demv1" },
    { name: "Tol 16 Charger", category: "Dodge", command: "tol16charger" },
    { name: "Tol Ram TRX 21", category: "Dodge", command: "tolramtrx21" },
    { name: "Tol TRX LRC", category: "Dodge", command: "toltrxlrc" },
    { name: "Tol 21 TRX S", category: "Dodge", command: "tol21trxs" },
    { name: "Tol 22 F150", category: "Dodge", command: "tol22f150" },
    { name: "Tol 24 TAC", category: "Dodge", command: "tol24tac" },
    { name: "Tol Durgo Beast", category: "Dodge", command: "toldurgobeast" },
    { name: "Tol Shel Range", category: "Dodge", command: "tolshelrange" },
    { name: "Tol SX95", category: "Dodge", command: "tolsx95" },
    { name: "Tol Zekr 09GR", category: "Dodge", command: "tolzekr09gr" },
    { name: "Tol ZL1", category: "Dodge", command: "tolzl1" },
    { name: "Tol Zort V1", category: "Dodge", command: "tolzortv1" },
    { name: "Tol Elantran 22", category: "Honda", command: "tolelantran22" },
    { name: "Tol FK8", category: "Honda", command: "tolfk8" },
    { name: "Tol ID 421B", category: "Honda", command: "tolid421b" },
    { name: "Tol Vel N", category: "Honda", command: "tolveln" },
    { name: "Tol FTY 21", category: "Jaguar", command: "tolfty21" },
    { name: "Tol Peigerzen", category: "Lambo", command: "tolpeigerzen" },
    { name: "Tol EZA", category: "Lambo", command: "toleza" },
    { name: "Tol Inve 23", category: "Lambo", command: "tolinve23" },
    { name: "Tol Murci", category: "Lambo", command: "tolmurci" },
    { name: "Tol Curus", category: "Lambo", command: "tolcurus" },
    { name: "Tol 620R", category: "Mclaren", command: "tol620r" },
    { name: "Tol C63", category: "Mercedes", command: "tolc63" },
    { name: "Tol C63 S23", category: "Mercedes", command: "tolc63s23" },
    { name: "Tol S63 AMG", category: "Mercedes", command: "tols63amay" },
    { name: "Tol E500", category: "Mercedes", command: "tole500" },
    { name: "Tol E63 14", category: "Mercedes", command: "tole6314" },
    { name: "Tol C63 C", category: "Mercedes", command: "tolc63c" },
    { name: "Tol Brag 700", category: "Mercedes", command: "tolbrag700" },
    { name: "Tol GTR", category: "Nissan", command: "tolgtr" },
    { name: "Tol GTR LW", category: "Nissan", command: "tolgtrlw" },
    { name: "Tol GSX 95", category: "Nissan", command: "tolgsx95" },
    { name: "Tol RX8 DY", category: "Nissan", command: "tolrx8dy" },
    { name: "Tol R33", category: "Nissan", command: "tolr33" },
    { name: "Tol F4 R34", category: "Nissan", command: "tolf4r34" },
    { name: "Tol J350Z", category: "Nissan", command: "tolj350z" },
    { name: "Tol Liblc 500", category: "Nissan", command: "tolliblc500" },
    { name: "Tol R34 DYPT", category: "Nissan", command: "tolr34dypt" },
    { name: "Tol R35", category: "Nissan", command: "tolr35" },
    { name: "Tol SGR 20", category: "Nissan", command: "tolsgr20" },
    { name: "Tucson", category: "Nissan", command: "tucson" },
    { name: "308 Hybride", category: "Peugeot", command: "308hybride" },
    { name: "508 SW", category: "Peugeot", command: "508sw" },
    { name: "Rifter Lon", category: "Peugeot", command: "rifterlon" },
    { name: "208", category: "Peugeot", command: "208" },
    { name: "Tol WP 22", category: "Porsche", command: "tolwp22" },
    { name: "Tol CGT", category: "Porsche", command: "tolcgt" },
    { name: "Tol 918 Spyder", category: "Porsche", command: "tol918spyder" },
    { name: "Tol GT P3 22", category: "Porsche", command: "tolgtp322" },
    { name: "Tol Porsche 918", category: "Porsche", command: "tolporsche918" },
    { name: "C3", category: "Citroen", command: "c3" },
    { name: "Clio 4", category: "Citroen", command: "clio4" },
    { name: "Clio 5", category: "Citroen", command: "clio5" },
    { name: "Kangoo", category: "Citroen", command: "kangoo" },
    { name: "Megane Estate", category: "Citroen", command: "meganeestate" },
    { name: "Tol Clio RS", category: "Citroen", command: "tolcliors" },
    { name: "Tol Evo 9", category: "Subaru", command: "tolevo9" },
    { name: "Tol Sub 22", category: "Subaru", command: "tolsub22" },
    { name: "Tol Sub WRX", category: "Subaru", command: "tolsubwrx" },
    { name: "Tol C7", category: "Corvette", command: "tolc7" },
    { name: "Tol RR 14", category: "Range", command: "tolrr14" },
    { name: "Enyaq", category: "Skoda", command: "enyaq" },
    { name: "Ocombi VRS", category: "Skoda", command: "ocombivrs" },
    { name: "Ranger", category: "Skoda", command: "ranger" },
    { name: "E-Golf", category: "Skoda", command: "egolf" },
    { name: "Golf GTE", category: "Skoda", command: "golfgte" },
    { name: "Ocombi", category: "Skoda", command: "ocombi" },
    { name: "Tol Mini CLW", category: "Mini", command: "tolminiclw" },
    { name: "Tol AP 2", category: "Mazda", command: "tolap2" },
    { name: "Tol 400 V1", category: "Toyota", command: "tol400v1" },
    { name: "Tol VTEC 94", category: "Toyota", command: "tolvtec94" },
    { name: "Tol Formentor 21", category: "Cupra", command: "tolfornmentor21" },
    { name: "Tol Assat", category: "Volkswagen", command: "tolassat" },
    { name: "Tol EV6 23", category: "Hyundai", command: "tolev623" },
    { name: "Tol Air 24", category: "Volvo", command: "tola24" },
    { name: "Tol R1T 22", category: "Volvo", command: "tolr1t22" },
    { name: "Tol Star One", category: "Volvo", command: "tolstarone" },
    { name: "Tol 204S Dawn", category: "Rolls", command: "tol204sdawn" },
    { name: "Tol Vit", category: "Rolls", command: "tolvit" },
    { name: "Akuma", category: "Moto", command: "akuma" },
    { name: "Avarus", category: "Moto", command: "avarus" },
    { name: "Bagger", category: "Moto", command: "bagger" },
    { name: "Bati", category: "Moto", command: "bati" },
    { name: "BF400", category: "Moto", command: "bf400" },
    { name: "Carbon RS", category: "Moto", command: "carbonrs" },
    { name: "Cliffhanger", category: "Moto", command: "cliffhanger" },
    { name: "Diablous", category: "Moto", command: "diablous" },
    { name: "Enduro", category: "Moto", command: "enduro" },
    { name: "Hakuchou", category: "Moto", command: "hakuchou" },
    { name: "Manchez", category: "Moto", command: "manchez" },
    { name: "Manchez 2", category: "Moto", command: "manchez2" },
    { name: "YZ450F", category: "Moto", command: "yz450f" },
  ];

  await prisma.vehicleSpawn.deleteMany();
  await prisma.vehicleSpawn.createMany({ data: vehicles });
  console.log(`Inserted ${vehicles.length} VehicleSpawn`);

  await prisma.$disconnect();
  console.log("Migration done!");
}

main().catch((e) => { console.error(e); process.exit(1); });
