import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { hasMinRole } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { sendWebhook } from "@/lib/webhook";

const SEMAINE_PINGS = ["840233063140163605", "482084142062764033"];

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!hasMinRole(user.role, "A-T")) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Lundi
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6); // Dimanche
  endOfWeek.setHours(23, 59, 59, 999);

  const sessions = await prisma.serviceSession.findMany({
    where: {
      startTime: { gte: startOfWeek, lte: endOfWeek },
    },
    include: { user: { select: { username: true, role: true, discordId: true } } },
    orderBy: { startTime: "asc" },
  });

  if (sessions.length === 0) {
    return NextResponse.json({ message: "Aucun service cette semaine" });
  }

  const grouped = sessions.reduce((acc, s) => {
    const name = s.user.username;
    if (!acc[name]) acc[name] = [];
    acc[name].push(s);
    return acc;
  }, {} as Record<string, typeof sessions>);

  const summary = Object.entries(grouped).map(([name, sess]) => {
    const totalSec = sess.reduce((sum, s) => sum + (s.duration || 0), 0);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    return `• ${name} : ${h}h ${m}m (${sess.length} service${sess.length > 1 ? "s" : ""})`;
  }).join("\n");

  const monday = startOfWeek.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
  const sunday = endOfWeek.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit" });

  sendWebhook("service", [
    { name: "Période", value: `Semaine du ${monday} au ${sunday}` },
    { name: "Récapitulatif", value: summary || "Aucun service" },
    { name: "Total services", value: String(sessions.length) },
    { name: "Membres actifs", value: String(Object.keys(grouped).length) },
  ], SEMAINE_PINGS);

  return NextResponse.json({ success: true, count: sessions.length });
}