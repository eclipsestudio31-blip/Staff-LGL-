import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import * as bcrypt from "bcryptjs";

async function main() {
  const adapter = new PrismaMariaDb({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "",
    database: "staff_rp",
    connectionLimit: 5,
  });
  const prisma = new PrismaClient({ adapter });

  const adminUsername = "Admin";
  const adminPassword = "Admin123!@#$%^&*";

  const existing = await prisma.user.findUnique({
    where: { username: adminUsername },
  });

  if (existing) {
    console.log(`L'utilisateur "${adminUsername}" existe déjà.`);
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
  console.log("Vous devrez changer le mot de passe à la première connexion.");

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("Erreur lors du seed:", e);
  process.exit(1);
});
