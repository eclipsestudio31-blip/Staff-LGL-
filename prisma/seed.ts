import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import * as bcrypt from "bcryptjs";

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

  const adminUsername = "Admin";
  const adminPassword = "Admin123!@#$%^&*";

  const existing = await prisma.user.findUnique({
    where: { username: adminUsername },
  });

  if (existing) {
    await prisma.user.update({
      where: { username: adminUsername },
      data: { isFirstLogin: true },
    });
    console.log(`Compte "${adminUsername}" mis à jour (isFirstLogin: true).`);
    await prisma.$disconnect();
    return;
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  await prisma.user.create({
    data: {
      username: adminUsername,
      password: hashedPassword,
      role: "F",
      isFirstLogin: true,
      isActive: true,
    },
  });

  console.log("=== Compte Admin créé avec succès ===");
  console.log(`Identifiant: ${adminUsername}`);
  console.log(`Mot de passe: ${adminPassword}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("Erreur lors du seed:", e);
  process.exit(1);
});
