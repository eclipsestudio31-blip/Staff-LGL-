import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, hashPassword, generateTempPassword } from "@/lib/auth";
import { hasMinRole } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { sendWebhook } from "@/lib/webhook";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      role: true,
      avatar: true,
      isActive: true,
      isFirstLogin: true,
      lastLogin: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ users });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!hasMinRole(user.role, "A-T")) {
    return NextResponse.json({ error: "Permissions insuffisantes" }, { status: 403 });
  }

  const allowedCreators = ["Lenny", "Admin", "Mason"];
  if (!allowedCreators.includes(user.username)) {
    return NextResponse.json({ error: "Seuls Lenny, Admin et Mason peuvent créer des comptes" }, { status: 403 });
  }

  const { username, role } = await request.json();
  if (!username || !role) {
    return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    return NextResponse.json({ error: "Cet identifiant existe déjà" }, { status: 409 });
  }

  const tempPassword = generateTempPassword();
  const hashed = await hashPassword(tempPassword);

  const newUser = await prisma.user.create({
    data: { username, password: hashed, role, isFirstLogin: true },
    select: { id: true, username: true, role: true },
  });

  await prisma.staffAction.create({
    data: {
      userId: user.id,
      action: "create_user",
      targetId: newUser.id,
      details: `Création du compte ${username} (${role})`,
    },
  });

  sendWebhook("account_log", [
    { name: "Action", value: "🟢 Création de compte" },
    { name: "Auteur", value: user.discordId ? `<@${user.discordId}>` : user.username },
    { name: "Identifiant", value: username },
    { name: "Rôle", value: role },
    { name: "Mot de passe provisoire", value: `\`${tempPassword}\`` },
  ]);

  return NextResponse.json({ user: newUser, tempPassword });
}

export async function PUT(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!hasMinRole(user.role, "R-S")) {
    return NextResponse.json({ error: "Permissions insuffisantes" }, { status: 403 });
  }

  const { userId, role, isActive } = await request.json();
  if (!userId) return NextResponse.json({ error: "ID manquant" }, { status: 400 });

  const updateData: Record<string, unknown> = {};
  if (role !== undefined) updateData.role = role;
  if (isActive !== undefined) updateData.isActive = isActive;

  const updated = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: { id: true, username: true, role: true, isActive: true },
  });

  await prisma.staffAction.create({
    data: {
      userId: user.id,
      action: role ? "change_role" : "toggle_active",
      targetId: userId,
      details: role ? `Changement de rôle vers ${role}` : `Compte ${isActive ? "activé" : "désactivé"}`,
    },
  });

  return NextResponse.json({ user: updated });
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!hasMinRole(user.role, "A-T")) {
    return NextResponse.json({ error: "Permissions insuffisantes" }, { status: 403 });
  }

  const { userId } = await request.json();
  if (!userId) return NextResponse.json({ error: "ID manquant" }, { status: 400 });

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, username: true, role: true } });
  if (!target) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

  if (hasMinRole(target.role, user.role)) {
    return NextResponse.json({ error: "Vous ne pouvez pas supprimer un membre de même rang ou supérieur" }, { status: 403 });
  }

  await prisma.report.deleteMany({ where: { authorId: userId } });
  await prisma.surveillance.deleteMany({ where: { authorId: userId } });
  await prisma.absence.deleteMany({ where: { userId } });
  await prisma.permanence.deleteMany({ where: { userId } });
  await prisma.serviceSession.deleteMany({ where: { userId } });
  await prisma.planningEntry.deleteMany({ where: { userId } });
  await prisma.notification.deleteMany({ where: { userId } });
  await prisma.loginHistory.deleteMany({ where: { userId } });
  await prisma.chatMessage.deleteMany({ where: { userId } });

  await prisma.user.delete({ where: { id: userId } });

  await prisma.staffAction.create({
    data: {
      userId: user.id,
      action: "delete_user",
      targetId: userId,
      details: `Suppression du compte ${target.username} (${target.role})`,
    },
  });

  sendWebhook("account_log", [
    { name: "Action", value: "🔴 Suppression de compte" },
    { name: "Auteur", value: user.discordId ? `<@${user.discordId}>` : user.username },
    { name: "Identifiant supprimé", value: target.username },
    { name: "Rôle", value: target.role },
  ]);

  return NextResponse.json({ success: true });
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { avatar, discordId } = await request.json();

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { avatar: avatar !== undefined ? (avatar || null) : undefined, discordId: discordId !== undefined ? (discordId || null) : undefined },
    select: { id: true, username: true, avatar: true, discordId: true },
  });

  return NextResponse.json({ user: updated });
}
