import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { hasMinRole } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { sendWebhook } from "@/lib/webhook";

const BDA_SECRET = process.env.BDA_SECRET || "bda-webhook-secret-key";

// GET - Récupérer les présences BDA
export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!hasMinRole(user.role, "A-T")) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (status) {
    where.status = status;
  }

  const entries = await prisma.bDAEntry.findMany({
    where,
    orderBy: { joinedAt: "desc" },
    take: 100,
  });

  const waitingCount = await prisma.bDAEntry.count({ where: { status: "waiting" } });

  return NextResponse.json({ entries, waitingCount });
}

// POST - Le bot Discord envoie un update (join/leave)
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { secret, action, discordId, username, avatar } = body;

  if (secret !== BDA_SECRET) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  if (action === "join") {
    const existing = await prisma.bDAEntry.findFirst({
      where: { discordId, status: "waiting" },
    });

    if (!existing) {
      const entry = await prisma.bDAEntry.create({
        data: { discordId, username, avatar },
      });

      sendWebhook("bda", [
        { name: "Nouvelle personne", value: username },
        { name: "Discord ID", value: discordId },
        { name: "Statut", value: "🟠 En attente" },
      ]);

      return NextResponse.json({ entry, isNew: true });
    }

    return NextResponse.json({ entry: existing, isNew: false });
  }

  if (action === "leave") {
    const entry = await prisma.bDAEntry.findFirst({
      where: { discordId, status: { in: ["waiting", "handled"] } },
    });

    if (entry) {
      await prisma.bDAEntry.update({
        where: { id: entry.id },
        data: { status: "left", leftAt: new Date() },
      });
    }

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Action invalide" }, { status: 400 });
}

// PATCH - Prendre en charge
export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!hasMinRole(user.role, "A-T")) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const body = await request.json();
  const { id } = body;

  if (!id) return NextResponse.json({ error: "ID manquant" }, { status: 400 });

  const entry = await prisma.bDAEntry.findUnique({ where: { id } });
  if (!entry) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  if (entry.status !== "waiting") return NextResponse.json({ error: "Déjà géré" }, { status: 400 });

  const updated = await prisma.bDAEntry.update({
    where: { id },
    data: {
      status: "handled",
      handledBy: user.username,
      handledByUserId: user.id,
      handledAt: new Date(),
    },
  });

  return NextResponse.json({ entry: updated });
}
