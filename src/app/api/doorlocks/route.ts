import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasMinRole } from "@/lib/roles";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!hasMinRole(user.role, "A-T")) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const doors = await prisma.doorLock.findMany({
    orderBy: { id: "asc" },
  });

  const result = doors.map((d) => {
    const data = d.data as Record<string, unknown>;
    const coords = data?.coords as { x?: number; y?: number; z?: number } | undefined;
    return {
      id: d.id,
      name: d.name,
      state: d.state,
      passcode: d.passcode || null,
      groups: d.groups,
      maxDistance: d.maxDistance,
      coords: coords ? {
        x: Math.round(coords.x! * 100) / 100,
        y: Math.round(coords.y! * 100) / 100,
        z: Math.round(coords.z! * 100) / 100,
      } : null,
    };
  });

  return NextResponse.json({ doors: result, total: result.length });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!hasMinRole(user.role, "A-T")) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const body = await request.json();
  const { doorlockId, discordId } = body;

  if (!doorlockId || !discordId) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
  }

  const door = await prisma.doorLock.findUnique({ where: { id: doorlockId } });
  if (!door) return NextResponse.json({ error: "Porte introuvable" }, { status: 404 });

  const viewer = await prisma.user.findFirst({ where: { discordId } });
  const viewerName = viewer?.username || "Inconnu";

  const groupsObj = (door.groups && typeof door.groups === "object" ? door.groups : {}) as Record<string, number>;
  const groupNames = Object.keys(groupsObj).join(", ") || "Aucun";

  const webhookUrl = await prisma.setting.findUnique({
    where: { key: "webhook_doorlock" },
  });

  if (webhookUrl?.value) {
    const embed = {
      title: "Doorlock - Code Consulté",
      color: 0xef4444,
      description: [
        `**Porte :** ${door.name}`,
        `**ID :** ${door.id}`,
        `**Groupe(s) :** ${groupNames}`,
        `**Code :** ${door.passcode || "Aucun"}`,
        `**Consulté par :** ${viewerName}`,
        `**Discord ID :** ${discordId}`,
      ].join("\n"),
      timestamp: new Date().toISOString(),
    };

    try {
      await fetch(webhookUrl.value, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: `<@698156151765991495> <@1086766492873404499>`,
          embeds: [embed],
        }),
      });
    } catch (err) {
      console.error("[WEBHOOK DOORLOCK] Failed:", err);
    }
  }

  return NextResponse.json({ passcode: door.passcode || "Aucun code" });
}
