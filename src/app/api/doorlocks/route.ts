import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasMinRole } from "@/lib/roles";
import { sendWebhook } from "@/lib/webhook";

const DISCORD_PINGS = ["698156151765991495", "1086766492873404499"];

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

  sendWebhook("doorlock", [
    { name: "Porte", value: door.name },
    { name: "ID", value: String(door.id) },
    { name: "Groupe(s)", value: groupNames },
    { name: "Code", value: door.passcode || "Aucun" },
    { name: "Consulté par", value: viewerName },
    { name: "Discord ID", value: discordId },
  ], DISCORD_PINGS);

  return NextResponse.json({ passcode: door.passcode || "Aucun code" });
}
