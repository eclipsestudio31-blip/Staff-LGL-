import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendWebhook } from "@/lib/webhook";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const permanences = await prisma.permanence.findMany({
    include: { user: { select: { username: true, role: true } } },
    orderBy: { date: "desc" },
  });

  return NextResponse.json({ permanences });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const data = await request.json();

  if (Array.isArray(data.slots)) {
    const created = [];
    const conflicts = [];

    for (const slot of data.slots) {
      const existing = await prisma.permanence.findUnique({
        where: { date_startTime: { date: new Date(slot.date), startTime: slot.startTime } },
      });
      if (existing) {
        conflicts.push(`${slot.startTime}`);
        continue;
      }
      const p = await prisma.permanence.create({
        data: {
          userId: user.id,
          date: new Date(slot.date),
          startTime: slot.startTime,
          endTime: slot.endTime,
        },
        include: { user: { select: { username: true, role: true } } },
      });
      created.push(p);
    }

    if (created.length > 0) {
      const allStaff = await prisma.user.findMany({
        where: { id: { not: user.id }, isActive: true },
        select: { id: true },
      });

      await prisma.notification.createMany({
        data: allStaff.map((s) => ({
          userId: s.id,
          title: "Nouvelle permanence",
          message: `${user.username} a pris ${created.length} créneau(x) de permanence`,
          type: "permanence",
          link: "/permanence",
        })),
      });

      const slotsList = created.map((p) => {
        const dateStr = new Date(p.date).toLocaleDateString("fr-FR");
        return `• ${dateStr} de **${p.startTime}** à **${p.endTime}**`;
      }).join("\n");

      sendWebhook("permanence", [
        { name: "Membre", value: user.username },
        { name: "Créneaux", value: slotsList },
      ], user.discordId);
    }

    return NextResponse.json({ created, conflicts });
  }

  const existing = await prisma.permanence.findUnique({
    where: { date_startTime: { date: new Date(data.date), startTime: data.startTime } },
  });
  if (existing) {
    return NextResponse.json({ error: "Ce créneau est déjà pris" }, { status: 409 });
  }

  const permanence = await prisma.permanence.create({
    data: {
      userId: user.id,
      date: new Date(data.date),
      startTime: data.startTime,
      endTime: data.endTime,
    },
    include: { user: { select: { username: true, role: true } } },
  });

  const allStaff = await prisma.user.findMany({
    where: { id: { not: user.id }, isActive: true },
    select: { id: true },
  });

  await prisma.notification.createMany({
    data: allStaff.map((s) => ({
      userId: s.id,
      title: "Nouvelle permanence",
      message: `${user.username} a pris la permanence le ${new Date(data.date).toLocaleDateString("fr-FR")} de ${data.startTime} à ${data.endTime}`,
      type: "permanence",
      link: "/permanence",
    })),
  });

  sendWebhook("permanence", [
    { name: "Membre", value: user.username, inline: true },
    { name: "Date", value: new Date(data.date).toLocaleDateString("fr-FR"), inline: true },
    { name: "Créneau", value: `${data.startTime} - ${data.endTime}`, inline: true },
  ], user.discordId);

  return NextResponse.json({ permanence });
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "ID manquant" }, { status: 400 });

  const permanence = await prisma.permanence.findUnique({ where: { id } });
  if (!permanence) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  if (permanence.userId !== user.id) {
    return NextResponse.json({ error: "Vous ne pouvez supprimer que vos propres permanences" }, { status: 403 });
  }

  await prisma.permanence.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
