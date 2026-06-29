import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const url = new URL(request.url);
  const q = url.searchParams.get("q") || "";

  if (!q.trim()) {
    return NextResponse.json({ results: [] });
  }

  const search = `%${q}%`;

  const [users, reports, sanctions, cheats, commands, vehicles, surveillance] = await Promise.all([
    prisma.user.findMany({
      where: { username: { contains: q } },
      select: { id: true, username: true, role: true },
      take: 10,
    }),
    prisma.report.findMany({
      where: {
        OR: [
          { nomPrenom: { contains: q } },
          { discord: { contains: q } },
          { raison: { contains: q } },
        ],
      },
      select: { id: true, type: true, nomPrenom: true, discord: true, raison: true, createdAt: true },
      take: 10,
    }),
    prisma.sanction.findMany({
      where: {
        OR: [
          { infraction: { contains: q } },
          { sanction1: { contains: q } },
          { sanction2: { contains: q } },
          { sanction3: { contains: q } },
        ],
      },
      select: { id: true, infraction: true, sanction1: true, sanction2: true, sanction3: true },
      take: 10,
    }),
    prisma.cheatEntry.findMany({
      where: { name: { contains: q } },
      select: { id: true, name: true, description: true },
      take: 10,
    }),
    prisma.iGCommand.findMany({
      where: { name: { contains: q } },
      select: { id: true, name: true, category: true, description: true },
      take: 10,
    }),
    prisma.vehicleSpawn.findMany({
      where: { name: { contains: q } },
      select: { id: true, name: true, category: true, command: true },
      take: 10,
    }),
    prisma.surveillance.findMany({
      where: {
        OR: [
          { nomPrenom: { contains: q } },
          { discord: { contains: q } },
        ],
      },
      select: { id: true, nomPrenom: true, discord: true, status: true },
      take: 10,
    }),
  ]);

  return NextResponse.json({
    results: {
      users,
      reports,
      sanctions,
      cheats,
      commands,
      vehicles,
      surveillance,
    },
  });
}
