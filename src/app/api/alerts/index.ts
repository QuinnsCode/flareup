/**
 * /api/alerts/* routes
 *
 * GET  /api/alerts/config       — get current alert config
 * POST /api/alerts/config       — save alert config
 * POST /api/alerts/test-webhook — fire a test webhook
 */

import { getAlertConfig, saveAlertConfig, type AlertConfig } from "@/lib/alerts/config";
import { sendWebhook } from "@/lib/webhook";
import { env } from "cloudflare:workers";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function handleGetConfig(): Promise<Response> {
  const kv = (env as any).ALERT_CONFIG_KV as KVNamespace;
  const config = await getAlertConfig(kv);
  return json(config);
}

export async function handleSaveConfig(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  let config: AlertConfig;
  try {
    config = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (typeof config.monthlyBudget !== "number" || config.monthlyBudget <= 0) {
    return json({ error: "monthlyBudget must be a positive number" }, 400);
  }

  if (!Array.isArray(config.webhooks) || !Array.isArray(config.tiers)) {
    return json({ error: "webhooks and tiers must be arrays" }, 400);
  }

  const kv = (env as any).ALERT_CONFIG_KV as KVNamespace;
  await saveAlertConfig(kv, config);

  return json({ ok: true, savedAt: new Date().toISOString() });
}

export async function handleTestWebhook(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  let body: { webhookUrl?: string; webhookName?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (!body.webhookUrl) {
    return json({ error: "Missing webhookUrl" }, 400);
  }

  const appUrl = (env as any).APP_URL as string | undefined;

  const success = await sendWebhook({
    url: body.webhookUrl,
    payload: {
      type: "test",
      severity: "info",
      title: "🔥 FlareUp test alert",
      message: "This is a test notification from FlareUp. Your webhook is configured correctly.",
      data: { test: true, timestamp: new Date().toISOString() },
    },
    appUrl,
  });

  if (!success) {
    return json({ error: "Webhook delivery failed. Check the URL and try again." }, 502);
  }

  return json({ ok: true, message: "Test webhook delivered successfully." });
}