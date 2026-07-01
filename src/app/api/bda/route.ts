import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { hasMinRole } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { getWebhookUrl } from "@/lib/webhook";

const BDA_SECRET = process.env.BDA_SECRET || "bda-webhook-secret-key";

function fmtTime(d: Date) {
  return d.toLocaleString("fr-FR", {
    timeZone: "Europe/Paris",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtWait(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

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

      return NextResponse.json({ entry, isNew: true });
    }

    return NextResponse.json({ entry: existing, isNew: false });
  }

  if (action === "leave") {
    const entry = await prisma.bDAEntry.findFirst({
      where: { discordId, status: { in: ["waiting", "handled"] } },
      include: { handledByUser: { select: { discordId: true } } },
    });

    if (entry) {
      const leftAt = new Date();
      const waitTimeSec = entry.waitTime ?? Math.floor((leftAt.getTime() - entry.joinedAt.getTime()) / 1000);
      const durationSec = entry.handledAt ? Math.floor((leftAt.getTime() - entry.handledAt.getTime()) / 1000) : 0;

      await prisma.bDAEntry.update({
        where: { id: entry.id },
        data: { status: "left", leftAt },
      });

      const pings: string[] = [];
      if (entry.discordId) pings.push(`<@${entry.discordId}>`);
      if (entry.handledByUser?.discordId) pings.push(`<@${entry.handledByUser.discordId}>`);

      const mentionStr = (id: string | null | undefined) => id ? `<@${id}>` : "N/A";
      const staffDiscordId = entry.handledByUser?.discordId ?? null;

      const embed = {
        title: "Bureau d'Accueil – Récapitulatif",
        color: entry.handledBy ? 0x22c55e : 0xef4444,
        fields: [
          { name: "Personne", value: `${entry.username}\n${mentionStr(entry.discordId)}`, inline: true },
          { name: "Staff", value: entry.handledBy ? `${entry.handledBy}\n${mentionStr(staffDiscordId)}` : "Aucun", inline: true },
          { name: "Statut", value: entry.handledBy ? "✅ Pris en charge" : "❌ Parti sans prise en charge", inline: true },
          { name: "Heure d'arrivée", value: fmtTime(new Date(entry.joinedAt)), inline: true },
          { name: "Heure de prise en charge", value: entry.handledAt ? fmtTime(new Date(entry.handledAt)) : "N/A", inline: true },
          { name: "Heure de départ", value: fmtTime(leftAt), inline: true },
          { name: "Temps d'attente", value: fmtWait(waitTimeSec), inline: true },
          { name: "Durée de prise en charge", value: entry.handledAt ? fmtWait(durationSec) : "N/A", inline: true },
          { name: "Salon de destination", value: entry.destinationChannel || "N/A", inline: true },
        ],
        timestamp: new Date().toISOString(),
        footer: { text: `BDA Bot – Système de prise en charge • ${leftAt.toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" })} ${leftAt.toLocaleTimeString("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit" })}` },
      };

      try {
        const url = await getWebhookUrl("bda");
        if (url) {
          await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              content: pings.length > 0 ? pings.join(" ") : undefined,
              embeds: [embed],
            }),
          });
        }
      } catch (err) {
        console.error("[BDA] Erreur webhook:", err);
      }
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

  const updated = await prisma.bDAEntry.update({
    where: { id },
    data: {
      status: "handled",
      handledBy: user.username,
      handledByUserId: user.id,
      handledAt: new Date(),
      waitTime: waitTimeSec,
    },
  });

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
          await prisma.bDAEntry.update({
            where: { id },
            data: { destinationChannel: destinationChannelName },
          });
        }
      }
    } catch (err) {
      console.error("[BDA] Erreur appel bot:", err);
    }
  }

  return NextResponse.json({ entry: updated });
}
