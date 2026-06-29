import { prisma } from "./prisma";

const TYPE_LABELS: Record<string, string> = {
  rapport_ban: "Rapport Ban",
  rapport_warn: "Rapport Warn",
  rapport_jail: "Rapport Jail",
  rapport_tig: "Rapport TIG",
  rapport_bug: "Rapport Bug",
  rapport_remboursement: "Demande de Remboursement",
  rapport_remboursement_effectue: "Remboursement Effectué",
  absence: "Absence",
  surveillance: "Surveillance",
  permanence: "Permanence",
  doorlock: "Doorlock - Code Consulté",
};

export async function getWebhookUrl(type: string): Promise<string | null> {
  const setting = await prisma.setting.findUnique({ where: { key: `webhook_${type}` } });
  return setting?.value || null;
}

export async function sendWebhook(
  type: string,
  fields: { name: string; value: string; inline?: boolean }[],
  mentionDiscordId?: string | null
) {
  const url = await getWebhookUrl(type);
  if (!url) return;

  const description = fields.map((f) => `**${f.name} :** ${f.value || "N/A"}`).join("\n");

  const embed = {
    title: TYPE_LABELS[type] || type,
    color: 0xef4444,
    description,
    timestamp: new Date().toISOString(),
  };

  const body: Record<string, unknown> = { embeds: [embed] };

  if (mentionDiscordId) {
    body.content = `<@${mentionDiscordId}>`;
  }

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.error(`[WEBHOOK] Failed to send ${type}:`, err);
  }
}
