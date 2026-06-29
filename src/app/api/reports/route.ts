import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { hasMinRole } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { sendWebhook } from "@/lib/webhook";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const reports = await prisma.report.findMany({
    include: { author: { select: { username: true, role: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ reports });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const data = await request.json();
  const report = await prisma.report.create({
    data: {
      type: data.type,
      discord: data.discord || null,
      nomPrenom: data.nomPrenom || null,
      licence: data.licence || null,
      raison: data.raison || null,
      duree: data.duree || null,
      tigCount: data.tigCount ? Number(data.tigCount) : null,
      staffPresent: data.staffPresent || null,
      preuves: data.preuves || null,
      bugName: data.bugName || null,
      bugSeverity: data.bugSeverity || null,
      bugCapture: data.bugCapture || null,
      bugVideo: data.bugVideo || null,
      bugAuthor: data.bugAuthor || null,
      authorId: user.id,
    },
  });

  const allStaff = await prisma.user.findMany({
    where: { id: { not: user.id }, isActive: true },
    select: { id: true },
  });

  if (allStaff.length > 0) {
    await prisma.notification.createMany({
      data: allStaff.map((s) => ({
        userId: s.id,
        title: "Nouveau rapport",
        message: `${user.username} a créé un rapport ${data.type} pour ${data.nomPrenom || "N/A"}`,
        type: "report",
        link: "/rapports",
      })),
    });
  }

  const webhookType = `rapport_${data.type}`;
  const webhookFields = [
    { name: "Staff", value: user.username, inline: true },
    { name: "Joueur", value: data.nomPrenom || "N/A", inline: true },
    { name: "Discord", value: data.discord || "N/A", inline: true },
    { name: "Licence", value: data.licence || "N/A", inline: true },
    { name: "Raison", value: data.raison || "N/A", inline: false },
  ];
  if (data.duree) webhookFields.push({ name: "Durée", value: data.duree, inline: true });
  if (data.tigCount) webhookFields.push({ name: "TIG", value: String(data.tigCount), inline: true });
  if (data.staffPresent) webhookFields.push({ name: "Staff présent", value: data.staffPresent, inline: true });
  if (data.preuves) webhookFields.push({ name: "Preuves", value: data.preuves, inline: false });
  if (data.type === "bug") {
    if (data.bugName) webhookFields.push({ name: "Bug", value: data.bugName, inline: true });
    if (data.bugSeverity) webhookFields.push({ name: "Gravité", value: data.bugSeverity, inline: true });
  }
  try {
    await sendWebhook(webhookType, webhookFields, user.discordId);
  } catch (e) {
    console.error("[REPORT] Webhook failed:", e);
  }

  return NextResponse.json({ report });
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { reportId } = await request.json();
  if (!reportId) return NextResponse.json({ error: "ID manquant" }, { status: 400 });

  const report = await prisma.report.findUnique({ where: { id: reportId }, select: { id: true, authorId: true } });
  if (!report) return NextResponse.json({ error: "Rapport introuvable" }, { status: 404 });

  const canDeleteAll = hasMinRole(user.role, "A-T");
  if (!canDeleteAll && report.authorId !== user.id) {
    return NextResponse.json({ error: "Vous ne pouvez supprimer que vos propres rapports" }, { status: 403 });
  }

  await prisma.report.delete({ where: { id: reportId } });

  return NextResponse.json({ success: true });
}
