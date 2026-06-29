import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const cheats = await prisma.cheatEntry.findMany({
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ cheats });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const data = await request.json();
  const cheat = await prisma.cheatEntry.create({
    data: {
      name: data.name,
      description: data.description,
      symptoms: data.symptoms,
      verification: data.verification,
      sanction: data.sanction,
    },
  });

  return NextResponse.json({ cheat });
}

export async function PUT(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const data = await request.json();
  const cheat = await prisma.cheatEntry.update({
    where: { id: data.id },
    data: {
      name: data.name,
      description: data.description,
      symptoms: data.symptoms,
      verification: data.verification,
      sanction: data.sanction,
    },
  });

  return NextResponse.json({ cheat });
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await request.json();
  await prisma.cheatEntry.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
