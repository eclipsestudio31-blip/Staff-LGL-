import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, hashPassword, validatePassword, verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { newPassword, userId, discordId } = await request.json();

    if (!newPassword) {
      return NextResponse.json({ error: "Nouveau mot de passe requis" }, { status: 400 });
    }

    const errors = validatePassword(newPassword);
    if (errors.length > 0) {
      return NextResponse.json({ error: errors[0] }, { status: 400 });
    }

    let targetUserId = userId;

    if (!targetUserId) {
      const user = await getCurrentUser(request);
      if (!user) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
      }
      targetUserId = user.id;
    }

    const hashed = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: targetUserId },
      data: { password: hashed, isFirstLogin: false, ...(discordId ? { discordId } : {}) },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
