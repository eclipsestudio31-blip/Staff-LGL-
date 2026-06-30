import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { hasMinRole } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { sendWebhookAndGetId } from "@/lib/webhook";

function getWeekRange(weekOffset: number) {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - now.getDay() + 1 + weekOffset * 7);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { start: monday, end: sunday };
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

const MEDALS = ["🥇", "🥈", "🥉"];

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!hasMinRole(user.role, "A-T")) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const weekOffset = body.weekOffset || 0;

  const { start, end } = getWeekRange(weekOffset);
  const weekNum = getWeekNumber(start);
  const year = start.getFullYear();

  const sessions = await prisma.serviceSession.findMany({
    where: {
      startTime: { gte: start, lte: end },
    },
    include: { user: { select: { username: true, role: true } } },
  });

  if (sessions.length === 0) {
    return NextResponse.json({ message: "Aucun service cette semaine" });
  }

  const ranking = new Map<string, {
    username: string;
    role: string;
    totalSeconds: number;
    sessionCount: number;
  }>();

  for (const s of sessions) {
    const key = s.userId;
    if (!ranking.has(key)) {
      ranking.set(key, {
        username: s.user.username,
        role: s.user.role,
        totalSeconds: 0,
        sessionCount: 0,
      });
    }
    const entry = ranking.get(key)!;
    entry.totalSeconds += s.duration || 0;
    entry.sessionCount += 1;
  }

  const sorted = Array.from(ranking.values()).sort((a, b) => b.totalSeconds - a.totalSeconds);

  const monday = start.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
  const sunday = end.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit" });

  const lines = sorted.map((r, i) => {
    const medal = i < 3 ? MEDALS[i] : `#${i + 1}`;
    return `${medal} **${r.username}** — ${formatDuration(r.totalSeconds)} (${r.sessionCount} service${r.sessionCount > 1 ? "s" : ""})`;
  }).join("\n");

  const totalSeconds = sorted.reduce((sum, r) => sum + r.totalSeconds, 0);

  const description = [
    `**Semaine ${weekNum}** (${monday} → ${sunday})`,
    "",
    lines,
    "",
    "---",
    `📊 **${sessions.length}** services • 👥 **${sorted.length}** membre(s) actifs • ⏱️ **${formatDuration(totalSeconds)}** total`,
    "",
    "_Pauses déduites — Demandé par lenky.ytb_",
  ].join("\n");

  const webhookMsgId = await sendWebhookAndGetId("service_semaine", [
    { name: "🏆 Classement du service", value: description, inline: false },
  ], ["840233063140163605", "482084142062764033"], 0xf59e0b);

  return NextResponse.json({ success: true, messageId: webhookMsgId, count: sessions.length });
}
