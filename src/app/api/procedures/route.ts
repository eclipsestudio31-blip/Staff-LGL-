import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const steps = await prisma.procedureStep.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json({ steps });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const data = await request.json();
  const step = await prisma.procedureStep.create({
    data: {
      title: data.title,
      content: data.content,
      sortOrder: data.sortOrder ?? 0,
    },
  });

  return NextResponse.json({ step });
}

export async function PUT(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const data = await request.json();
  const step = await prisma.procedureStep.update({
    where: { id: data.id },
    data: {
      title: data.title,
      content: data.content,
      sortOrder: data.sortOrder,
    },
  });

  return NextResponse.json({ step });
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "ID manquant" }, { status: 400 });

  await prisma.procedureStep.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
