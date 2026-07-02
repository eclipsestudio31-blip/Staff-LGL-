import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const url = process.env.DATABASE_URL;
if (!url) { console.log("No DATABASE_URL, skipping seed"); process.exit(0); }

const parsed = new URL(url);
const adapter = new PrismaMariaDb({
  host: parsed.hostname,
  port: Number(parsed.port) || 3306,
  user: parsed.username,
  password: parsed.password,
  database: parsed.pathname.replace("/", ""),
});

const prisma = new PrismaClient({ adapter });

const sanctions = [
  { infraction: "Troll / nuisance volontaire", description: "Actes répétés pour gêner le RP", sanction1: "Avertissement", sanction2: "Jail 30min + Avertissement", sanction3: "Jail 60min + Avertissement" },
  { infraction: "Spam chat / vocal", description: "Flood texte ou micro spam", sanction1: "Avertissement", sanction2: "Kick + Avertissement", sanction3: "Jail 60min + Avertissement" },
  { infraction: "Non-respect du RP / FearRP / Powergaming", description: "Actions irréalistes, refus de RP, COPBAIT", sanction1: "Avertissement", sanction2: "Jail 60min + Avertissement", sanction3: "Ban 12h + Avertissement" },
  { infraction: "Utilisation d'un skin interdit", description: "Skin invisible / non RP", sanction1: "Avertissement", sanction2: "Kick + Avertissement", sanction3: "Ban 12h + Avertissement" },
  { infraction: "No Fear RP / No Pain RP", description: "Ignorer blessures ou menaces", sanction1: "Avertissement", sanction2: "Kick + Avertissement", sanction3: "Ban 12h + Avertissement" },
  { infraction: "Carkill", description: "Utiliser un véhicule comme arme", sanction1: "Jail 60min + Avertissement", sanction2: "Ban 24h + Avertissement", sanction3: "Ban 7j" },
  { infraction: "Comportement toxique / harcèlement HRP", description: "Attaques répétées, attitude nuisible", sanction1: "Kick + Avertissement", sanction2: "Ban 24h + Avertissement", sanction3: "Ban 7j" },
  { infraction: "Métagaming", description: "Utilisation d'infos HRP en RP", sanction1: "Jail 30min + Avertissement", sanction2: "Ban 24h + Avertissement", sanction3: "Ban 7j" },
  { infraction: "Vol de véhicule police/EMS", description: "Vol d'un véhicule police/EMS", sanction1: "Jail 30min + Avertissement", sanction2: "Ban 24h + Avertissement", sanction3: "Ban 7j" },
  { infraction: "Déconnexion en scène", description: "Quitter pour éviter conséquence RP", sanction1: "Ban 24h + Avertissement", sanction2: "Ban 24h + Avertissement", sanction3: "Ban 7j" },
  { infraction: "Insultes / provocations HRP", description: "Langage offensant hors RP, attaques personnelles", sanction1: "Avertissement et/ou Ban 12h (selon gravité)", sanction2: "Ban 24h + Avertissement", sanction3: "Ban 7j" },
  { infraction: "Armes interdites / spawn illégal", description: "Armes cheat ou non autorisées", sanction1: "Ban permanent", sanction2: "Ban permanent", sanction3: "Ban permanent" },
  { infraction: "StreamHack", description: "Suivre un streamer pour l'attaquer", sanction1: "Ban 7j", sanction2: "Ban permanent", sanction3: "Ban permanent" },
  { infraction: "Usurpation d'identité RP", description: "Jouer un faux staff ou admin", sanction1: "Ban 7j + Avertissement", sanction2: "Ban permanent", sanction3: "" },
  { infraction: "Exploitation de bug", description: "Utilisation volontaire de glitch", sanction1: "Ban 7j", sanction2: "Ban permanent", sanction3: "" },
  { infraction: "Duplication d'objets", description: "Création illégale d'items", sanction1: "Ban permanent", sanction2: "", sanction3: "" },
  { infraction: "Cheat / Mod menu", description: "Utilisation de logiciel interdit", sanction1: "Ban permanent", sanction2: "", sanction3: "" },
  { infraction: "Menaces graves IRL", description: "Menace de mort ou harcèlement réel", sanction1: "Ban permanent", sanction2: "", sanction3: "" },
  { infraction: "Arnaque HRP (hors RP)", description: "Scam via Discord, OOC", sanction1: "Ban permanent", sanction2: "", sanction3: "" },
];

async function main() {
  const count = await prisma.sanction.count();
  if (count > 0) {
    console.log(`${count} sanctions existantes. Suppression...`);
    await prisma.sanction.deleteMany();
  }

  for (const s of sanctions) {
    await prisma.sanction.create({ data: s });
    console.log(`✓ ${s.infraction}`);
  }

  console.log(`\n${sanctions.length} sanctions créées.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
