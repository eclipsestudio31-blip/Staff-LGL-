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
  service: "Service",
  service_semaine: "Service de la Semaine",
  bda: "Bureau d'Accueil",
};

export async function getWebhookUrl(type: string): Promise<string | null> {
  const setting = await prisma.setting.findUnique({ where: { key: `webhook_${type}` } });
  return setting?.value || null;
}

export async function sendWebhook(
  type: string,
  fields: { name: string; value: string; inline?: boolean }[],
  mentionDiscordIds?: string[] | string | null
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

  if (mentionDiscordIds) {
    const ids = Array.isArray(mentionDiscordIds) ? mentionDiscordIds : [mentionDiscordIds];
    body.content = ids.filter(Boolean).map((id) => `<@${id}>`).join(" ");
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

export async function sendWebhookAndGetId(
  type: string,
  fields: { name: string; value: string; inline?: boolean }[],
  mentionDiscordIds?: string[] | string | null,
  color?: number
): Promise<string | null> {
  const url = await getWebhookUrl(type);
  if (!url) return null;

  const description = fields.map((f) => `**${f.name} :** ${f.value || "N/A"}`).join("\n");

  const embed = {
    title: TYPE_LABELS[type] || type,
    color: color || 0x3b82f6,
    description,
    timestamp: new Date().toISOString(),
  };

  const body: Record<string, unknown> = { embeds: [embed] };

  if (mentionDiscordIds) {
    const ids = Array.isArray(mentionDiscordIds) ? mentionDiscordIds : [mentionDiscordIds];
    body.content = ids.filter(Boolean).map((id) => `<@${id}>`).join(" ");
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return data?.id || null;
  } catch (err) {
    console.error(`[WEBHOOK] Failed to send ${type}:`, err);
    return null;
  }
}

export async function editWebhookMessage(
  type: string,
  messageId: string,
  fields: { name: string; value: string; inline?: boolean }[],
  color?: number
) {
  const url = await getWebhookUrl(type);
  if (!url || !messageId) return;

  const description = fields.map((f) => `**${f.name} :** ${f.value || "N/A"}`).join("\n");

  const embed = {
    title: TYPE_LABELS[type] || type,
    color: color || 0x3b82f6,
    description,
    timestamp: new Date().toISOString(),
  };

  const editUrl = `${url}/messages/${messageId}`;

  try {
    await fetch(editUrl, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] }),
    });
  } catch (err) {
    console.error(`[WEBHOOK] Failed to edit ${type} message:`, err);
  }
}
