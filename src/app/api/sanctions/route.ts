import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const sanctions = await prisma.sanction.findMany({
    orderBy: { infraction: "asc" },
  });

  return NextResponse.json({ sanctions });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const data = await request.json();
  const sanction = await prisma.sanction.create({
    data: {
      infraction: data.infraction,
      sanction1: data.sanction1,
      sanction2: data.sanction2,
      sanction3: data.sanction3,
      description: data.description,
    },
  });

  return NextResponse.json({ sanction });
}

export async function PUT(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const data = await request.json();
  const sanction = await prisma.sanction.update({
    where: { id: data.id },
    data: {
      infraction: data.infraction,
      sanction1: data.sanction1,
      sanction2: data.sanction2,
      sanction3: data.sanction3,
      description: data.description,
    },
  });

  return NextResponse.json({ sanction });
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await request.json();
  await prisma.sanction.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
