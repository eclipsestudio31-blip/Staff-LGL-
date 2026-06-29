import "dotenv/config";
import { readFileSync } from "fs";
import { join } from "path";
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
  connectionLimit: 5,
});

const prisma = new PrismaClient({ adapter });

interface DoorLockData {
  id: number;
  name: string;
  state: number;
  passcode: string | null;
  groups: Record<string, number>;
  maxDistance: number;
  data: Record<string, unknown>;
}

async function main() {
  const jsonPath = join(__dirname, "..", "doorlocks-data.json");
  let data: DoorLockData[];

  try {
    data = JSON.parse(readFileSync(jsonPath, "utf-8"));
  } catch {
    console.error("doorlocks-data.json not found. Run: npx tsx scripts/parse-doorlocks.ts");
    process.exit(1);
  }

  console.log(`Seeding ${data.length} doorlocks...`);

  await prisma.doorLock.deleteMany();

  const batchSize = 50;
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    await prisma.doorLock.createMany({
      data: batch.map((d) => ({
        id: d.id,
        name: d.name,
        state: d.state,
        passcode: d.passcode,
        groups: d.groups as unknown as Record<string, never>,
        maxDistance: d.maxDistance,
        data: d.data as unknown as Record<string, never>,
      })),
    });
    console.log(`  Inserted ${Math.min(i + batchSize, data.length)}/${data.length}`);
  }

  console.log("Done!");
  const count = await prisma.doorLock.count();
  console.log(`Total doorlocks in database: ${count}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
