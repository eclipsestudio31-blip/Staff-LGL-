import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const entries = await prisma.planningEntry.findMany({
    include: { user: { select: { username: true, role: true } } },
    orderBy: { date: "asc" },
  });

  return NextResponse.json({ entries });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const data = await request.json();
  const entry = await prisma.planningEntry.create({
    data: {
      userId: data.userId || user.id,
      date: new Date(data.date),
      startTime: data.startTime,
      endTime: data.endTime,
    },
  });

  return NextResponse.json({ entry });
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const data = await request.json();
  const entry = await prisma.planningEntry.findUnique({ where: { id: data.id } });
  if (!entry) return NextResponse.json({ error: "Entrée introuvable" }, { status: 404 });

  if (entry.userId !== user.id) {
    return NextResponse.json({ error: "Vous ne pouvez supprimer que vos propres créneaux" }, { status: 403 });
  }

  await prisma.planningEntry.delete({ where: { id: data.id } });
  return NextResponse.json({ success: true });
}

export async function PUT(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const data = await request.json();
  const entry = await prisma.planningEntry.update({
    where: { id: data.id },
    data: { status: data.status, validatedBy: user.id },
  });

  return NextResponse.json({ entry });
}
