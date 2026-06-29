import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const vehicles = await prisma.vehicleSpawn.findMany({
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ vehicles });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const data = await request.json();
  const vehicle = await prisma.vehicleSpawn.create({
    data: {
      name: data.name,
      category: data.category,
      command: data.command,
    },
  });

  return NextResponse.json({ vehicle });
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await request.json();
  await prisma.vehicleSpawn.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
