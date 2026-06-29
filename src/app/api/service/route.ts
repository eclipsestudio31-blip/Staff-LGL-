import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { hasMinRole } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { sendWebhookAndGetId, editWebhookMessage } from "@/lib/webhook";

const DISCORD_PINGS = ["698156151765991495"];

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const parts: string[] = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (s > 0 || parts.length === 0) parts.push(`${s}s`);
  return parts.join(" ");
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const seeAll = hasMinRole(user.role, "A-T") || hasMinRole(user.role, "R-S");

  const sessions = await prisma.serviceSession.findMany({
    where: seeAll ? {} : { userId: user.id },
    include: { user: { select: { username: true, role: true, avatar: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ sessions });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { action, targetUserId } = await request.json();

  if (action === "start") {
    const existing = await prisma.serviceSession.findFirst({
      where: { userId: user.id, isActive: true },
    });
    if (existing) {
      return NextResponse.json({ error: "Service déjà actif" }, { status: 400 });
    }

    const session = await prisma.serviceSession.create({
      data: { userId: user.id },
    });

    const startTime = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

    const webhookMsgId = await sendWebhookAndGetId("service", [
      { name: "Membre", value: user.username },
      { name: "Statut", value: "🟢 Prise de service" },
      { name: "Heure de début", value: startTime },
      { name: "Heure de fin", value: "⏳ En cours..." },
    ], DISCORD_PINGS, 0x22c55e);

    if (webhookMsgId) {
      await prisma.serviceSession.update({
        where: { id: session.id },
        data: { webhookMessageId: webhookMsgId },
      });
    }

    return NextResponse.json({ session: { ...session, webhookMessageId: webhookMsgId } });
  }

  if (action === "stop") {
    const isForceStop = targetUserId && targetUserId !== user.id && hasMinRole(user.role, "A-T");
    const stopUserId = isForceStop ? targetUserId : user.id;

    const session = await prisma.serviceSession.findFirst({
      where: { userId: stopUserId, isActive: true },
    });
    if (!session) {
      return NextResponse.json({ error: "Aucun service actif" }, { status: 400 });
    }

    const now = new Date();
    const duration = Math.floor((now.getTime() - session.startTime.getTime()) / 1000);

    const updated = await prisma.serviceSession.update({
      where: { id: session.id },
      data: { endTime: now, duration, isActive: false },
    });

    const startTime = session.startTime.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    const endTime = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    const durationStr = formatDuration(duration);

    if (session.webhookMessageId) {
      await editWebhookMessage("service", session.webhookMessageId, [
        { name: "Membre", value: user.username },
        { name: "Statut", value: "🔴 Fin de service" },
        { name: "Heure de début", value: startTime },
        { name: "Heure de fin", value: endTime },
        { name: "Durée totale", value: durationStr },
      ], 0xef4444);
    } else {
      const stopUser = isForceStop
        ? await prisma.user.findUnique({ where: { id: stopUserId }, select: { username: true } })
        : user;

      await sendWebhookAndGetId("service", [
        { name: "Membre", value: stopUser?.username || "Inconnu" },
        { name: "Statut", value: "🔴 Fin de service" },
        { name: "Heure de début", value: startTime },
        { name: "Heure de fin", value: endTime },
        { name: "Durée totale", value: durationStr },
      ], DISCORD_PINGS, 0xef4444);
    }

    return NextResponse.json({ session: updated });
  }

  return NextResponse.json({ error: "Action invalide" }, { status: 400 });
}
