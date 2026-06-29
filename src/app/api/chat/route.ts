import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const messages = await prisma.chatMessage.findMany({
    include: { user: { select: { id: true, username: true, role: true, avatar: true } } },
    orderBy: { createdAt: "asc" },
    take: 200,
  });

  return NextResponse.json({ messages });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { content, channel } = await request.json();
  if (!content?.trim()) {
    return NextResponse.json({ error: "Message vide" }, { status: 400 });
  }

  const message = await prisma.chatMessage.create({
    data: {
      userId: user.id,
      content: content.trim(),
      channel: channel || "general",
    },
    include: { user: { select: { id: true, username: true, role: true, avatar: true } } },
  });

  return NextResponse.json({ message });
}
