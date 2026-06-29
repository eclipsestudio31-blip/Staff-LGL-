import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendWebhook } from "@/lib/webhook";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const absences = await prisma.absence.findMany({
    include: { user: { select: { username: true, role: true } } },
    orderBy: { date: "desc" },
  });

  return NextResponse.json({ absences });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const data = await request.json();
  const absence = await prisma.absence.create({
    data: {
      userId: data.userId || user.id,
      date: new Date(data.date),
      endDate: data.endDate ? new Date(data.endDate) : null,
      reason: data.reason,
    },
    include: { user: { select: { username: true, role: true } } },
  });

  const allStaff = await prisma.user.findMany({
    where: { id: { not: user.id }, isActive: true },
    select: { id: true },
  });

  const dateStr = data.endDate
    ? `du ${new Date(data.date).toLocaleDateString("fr-FR")} au ${new Date(data.endDate).toLocaleDateString("fr-FR")}`
    : `le ${new Date(data.date).toLocaleDateString("fr-FR")}`;

  await prisma.notification.createMany({
    data: allStaff.map((s) => ({
      userId: s.id,
      title: "Nouvelle absence",
      message: `${user.username} est absent(e) ${dateStr}${data.reason ? ` — ${data.reason}` : ""}`,
      type: "absence",
      link: "/absences",
    })),
  });

  sendWebhook("absence", [
    { name: "Membre", value: user.username, inline: true },
    { name: "Date", value: dateStr, inline: true },
    { name: "Raison", value: data.reason || "Non précisé", inline: false },
  ], ["1489713330460295280", "1475156411716599819"]);

  return NextResponse.json({ absence });
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "ID manquant" }, { status: 400 });

  const absence = await prisma.absence.findUnique({ where: { id } });
  if (!absence) return NextResponse.json({ error: "Absence introuvable" }, { status: 404 });

  if (absence.userId !== user.id) {
    return NextResponse.json({ error: "Vous ne pouvez supprimer que vos propres absences" }, { status: 403 });
  }

  await prisma.absence.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
