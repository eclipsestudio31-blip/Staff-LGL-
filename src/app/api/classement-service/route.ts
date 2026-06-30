import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const offset = parseInt(searchParams.get("week") || "0", 10);

  const { start, end } = getWeekRange(offset);
  const weekNum = getWeekNumber(start);
  const year = start.getFullYear();

  const sessions = await prisma.serviceSession.findMany({
    where: {
      startTime: { gte: start, lte: end },
    },
    include: { user: { select: { id: true, username: true, role: true, avatar: true } } },
  });

  const ranking = new Map<string, {
    username: string;
    role: string;
    avatar: string | null;
    totalSeconds: number;
    sessionCount: number;
  }>();

  for (const s of sessions) {
    const key = s.userId;
    if (!ranking.has(key)) {
      ranking.set(key, {
        username: s.user.username,
        role: s.user.role,
        avatar: s.user.avatar,
        totalSeconds: 0,
        sessionCount: 0,
      });
    }
    const entry = ranking.get(key)!;
    entry.totalSeconds += s.duration || 0;
    entry.sessionCount += 1;
  }

  const sorted = Array.from(ranking.values()).sort((a, b) => b.totalSeconds - a.totalSeconds);

  return NextResponse.json({
    week: weekNum,
    year,
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    ranking: sorted.map((r, i) => ({
      position: i + 1,
      username: r.username,
      role: r.role,
      avatar: r.avatar,
      totalFormatted: formatDuration(r.totalSeconds),
      totalSeconds: r.totalSeconds,
      sessionCount: r.sessionCount,
    })),
    totalSessions: sessions.length,
  });
}
