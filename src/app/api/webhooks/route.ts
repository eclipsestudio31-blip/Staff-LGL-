import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const WEBHOOK_KEYS = [
  "webhook_rapport_ban",
  "webhook_rapport_warn",
  "webhook_rapport_jail",
  "webhook_rapport_tig",
  "webhook_rapport_bug",
  "webhook_rapport_remboursement",
  "webhook_rapport_remboursement_effectue",
  "webhook_absence",
  "webhook_surveillance",
  "webhook_permanence",
  "webhook_doorlock",
  "webhook_service",
];

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const settings = await prisma.setting.findMany({
    where: { key: { in: WEBHOOK_KEYS } },
  });

  const webhooks: Record<string, string> = {};
  settings.forEach((s) => { webhooks[s.key] = s.value; });

  return NextResponse.json({ webhooks });
}

export async function PUT(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const data = await request.json();

  for (const [key, value] of Object.entries(data)) {
    if (WEBHOOK_KEYS.includes(key) && typeof value === "string") {
      if (value.trim()) {
        await prisma.setting.upsert({
          where: { key },
          update: { value: value.trim() },
          create: { key, value: value.trim() },
        });
      } else {
        await prisma.setting.deleteMany({ where: { key } });
      }
    }
  }

  return NextResponse.json({ success: true });
}
