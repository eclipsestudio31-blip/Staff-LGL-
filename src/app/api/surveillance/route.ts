import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendWebhook } from "@/lib/webhook";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const entries = await prisma.surveillance.findMany({
    include: { author: { select: { username: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ entries });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const data = await request.json();
  const entry = await prisma.surveillance.create({
    data: {
      discord: data.discord,
      nomPrenom: data.nomPrenom,
      licence: data.licence,
      raison: data.raison,
      staffPresent: data.staffPresent,
      authorId: user.id,
    },
  });

  sendWebhook("surveillance", [
    { name: "Staff", value: user.username, inline: true },
    { name: "Joueur", value: data.nomPrenom || "N/A", inline: true },
    { name: "Discord", value: data.discord || "N/A", inline: true },
    { name: "Licence", value: data.licence || "N/A", inline: true },
    { name: "Raison", value: data.raison || "N/A", inline: false },
    { name: "Staff présent", value: data.staffPresent || "N/A", inline: true },
  ], user.discordId);

  return NextResponse.json({ entry });
}

export async function PUT(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const data = await request.json();
  const entry = await prisma.surveillance.update({
    where: { id: data.id },
    data: { status: data.status },
  });

  return NextResponse.json({ entry });
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "ID manquant" }, { status: 400 });

  const entry = await prisma.surveillance.findUnique({ where: { id } });
  if (!entry) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  await prisma.surveillance.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
