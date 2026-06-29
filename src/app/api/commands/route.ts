import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const commands = await prisma.iGCommand.findMany({
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ commands });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const data = await request.json();
  const command = await prisma.iGCommand.create({
    data: {
      name: data.name,
      category: data.category,
      description: data.description,
      usage: data.usage,
    },
  });

  return NextResponse.json({ command });
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await request.json();
  await prisma.iGCommand.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
