import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { hasMinRole } from "@/lib/roles";
import { prisma } from "@/lib/prisma";

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
    return NextResponse.json({ session });
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

    return NextResponse.json({ session: updated });
  }

  return NextResponse.json({ error: "Action invalide" }, { status: 400 });
}
