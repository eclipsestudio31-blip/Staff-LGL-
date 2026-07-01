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
      const leftAt = new Date();
      const waitTimeSec = entry.waitTime ?? Math.floor((leftAt.getTime() - entry.joinedAt.getTime()) / 1000);
      const durationSec = entry.handledAt ? Math.floor((leftAt.getTime() - entry.handledAt.getTime()) / 1000) : 0;

      await prisma.bDAEntry.update({
        where: { id: entry.id },
        data: { status: "left", leftAt },
      });

      const fmt = (sec: number) => {
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = sec % 60;
        if (h > 0) return `${h}h ${m}m ${s}s`;
        if (m > 0) return `${m}m ${s}s`;
        return `${s}s`;
      };

      sendWebhook("bda", [
        { name: "Personne", value: entry.username },
        { name: "Discord ID", value: entry.discordId },
        { name: "Staff", value: entry.handledBy || "Aucun" },
        { name: "Temps d'attente", value: fmt(waitTimeSec) },
        { name: "Durée de prise en charge", value: fmt(durationSec) },
        { name: "Arrivée", value: new Date(entry.joinedAt).toLocaleTimeString("fr-FR", { timeZone: "Europe/Paris" }) },
        { name: "Départ", value: leftAt.toLocaleTimeString("fr-FR", { timeZone: "Europe/Paris" }) },
        { name: "Statut", value: entry.handledBy ? "✅ Pris en charge puis parti" : "❌ Parti sans prise en charge" },
      ]);
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

  const waitTimeSec = Math.floor((Date.now() - entry.joinedAt.getTime()) / 1000);

  let destinationChannelName = "Inconnu";

  if (user.discordId && entry.discordId) {
    try {
      const botUrl = process.env.BOT_API_URL;
      const botKey = process.env.BOT_API_KEY;
      if (!botUrl || !botKey) {
        console.error("[BDA] BOT_API_URL ou BOT_API_KEY manquant");
      } else {
        const res = await fetch(`${botUrl}/api/bda/move`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-api-key": botKey },
          body: JSON.stringify({ discordId: entry.discordId, staffDiscordId: user.discordId }),
        });
        const data = await res.json();
        if (data.success && data.channel) {
          destinationChannelName = data.channel;
        }
      }
    } catch (err) {
      console.error("[BDA] Erreur appel bot:", err);
    }
  }

  const handledAt = new Date();

  const updated = await prisma.bDAEntry.update({
    where: { id },
    data: {
      status: "handled",
      handledBy: user.username,
      handledByUserId: user.id,
      handledAt,
      waitTime: waitTimeSec,
      destinationChannel: destinationChannelName,
    },
  });

  const fmtTime = (d: Date) => d.toLocaleString("fr-FR", {
    timeZone: "Europe/Paris",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const fmtWait = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const pings: string[] = [];
  if (entry.discordId) pings.push(entry.discordId);
  if (user.discordId) pings.push(user.discordId);

  sendWebhook("bda", [
    { name: "Personne prise en charge", value: `${entry.username}\n(${entry.discordId})` },
    { name: "Staff ayant pris en charge", value: `${user.username}\n(${user.discordId || "N/A"})` },
    { name: "Heure d'arrivée", value: fmtTime(new Date(entry.joinedAt)) },
    { name: "Heure de prise en charge", value: fmtTime(handledAt) },
    { name: "Temps d'attente", value: fmtWait(waitTimeSec) },
    { name: "Salon vocal de destination", value: destinationChannelName },
  ], pings.length > 0 ? pings : null);

  return NextResponse.json({ entry: updated });
}
