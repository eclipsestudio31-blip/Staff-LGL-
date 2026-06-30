import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { hasMinRole } from "@/lib/roles";
import { prisma } from "@/lib/prisma";

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!hasMinRole(user.role, "A-T")) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const now = new Date();

  const startToday = new Date(now);
  startToday.setHours(0, 0, 0, 0);

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + 1);
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [todayCount, weekCount, monthCount, allHandled] = await Promise.all([
    prisma.bDAEntry.count({ where: { status: "handled", handledAt: { gte: startToday } } }),
    prisma.bDAEntry.count({ where: { status: "handled", handledAt: { gte: startOfWeek } } }),
    prisma.bDAEntry.count({ where: { status: "handled", handledAt: { gte: startOfMonth } } }),
    prisma.bDAEntry.findMany({
      where: { status: "handled", waitTime: { not: null } },
      select: { waitTime: true, handledBy: true, handledAt: true, joinedAt: true },
    }),
  ]);

  const avgWaitTime = allHandled.length > 0
    ? allHandled.reduce((sum, e) => sum + (e.waitTime || 0), 0) / allHandled.length
    : 0;

  const avgHandleTime = allHandled.length > 0
    ? allHandled.reduce((sum, e) => {
        if (e.handledAt && e.joinedAt) {
          return sum + (e.handledAt.getTime() - e.joinedAt.getTime()) / 1000;
        }
        return sum;
      }, 0) / allHandled.length
    : 0;

  const staffMap = new Map<string, number>();
  for (const e of allHandled) {
    if (e.handledBy) {
      staffMap.set(e.handledBy, (staffMap.get(e.handledBy) || 0) + 1);
    }
  }

  const staffRanking = Array.from(staffMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return NextResponse.json({
    today: todayCount,
    week: weekCount,
    month: monthCount,
    avgWaitTime: formatDuration(Math.round(avgWaitTime)),
    avgHandleTime: formatDuration(Math.round(avgHandleTime)),
    staffRanking,
    totalHandled: allHandled.length,
  });
}
