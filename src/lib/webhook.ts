/**
 * src/lib/webhook.ts
 *
 * Reusable webhook delivery with:
 * - Slack / Discord payload shaping (sniffed from URL)
 * - Generic JSON fallback
 * - Optional HMAC-SHA256 signature header
 *
 * Usage:
 *   import { sendWebhook, type WebhookPayload } from "@/lib/webhook";
 *   await sendWebhook({ url, payload, secret? });
 */

export type WebhookPayload = {
    type:     "tier" | "service" | "spike" | "test" | "daily";
    severity: "info" | "warning" | "danger" | "critical";
    title:    string;
    message:  string;
    data:     Record<string, unknown>;
  };
  
  type SendOptions = {
    url:     string;
    payload: WebhookPayload;
    secret?: string;
    appUrl?: string;
  };
  
  const SEVERITY_EMOJI: Record<WebhookPayload["severity"], string> = {
    info:     "ℹ️",
    warning:  "⚠️",
    danger:   "🚨",
    critical: "🔥",
  };
  
  // Discord embed colors
  const SEVERITY_COLOR: Record<WebhookPayload["severity"], number> = {
    info:     0x3b82f6,
    warning:  0xf97316,
    danger:   0xef4444,
    critical: 0xdc2626,
  };
  
  // ── Payload shapers ───────────────────────────────────────────────────────────
  
  function shapeSlack(p: WebhookPayload, appUrl?: string): Record<string, unknown> {
    return {
      text: `${SEVERITY_EMOJI[p.severity]} *${p.title}*`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `${SEVERITY_EMOJI[p.severity]} *${p.title}*\n${p.message}`,
          },
        },
        ...(appUrl ? [{
          type: "context",
          elements: [{ type: "mrkdwn", text: `<https://${appUrl}|FlareUp> · ${new Date().toUTCString()}` }],
        }] : []),
      ],
    };
  }
  
  function shapeDiscord(p: WebhookPayload, appUrl?: string): Record<string, unknown> {
    return {
      embeds: [{
        title:       `${SEVERITY_EMOJI[p.severity]} ${p.title}`,
        description: p.message,
        color:       SEVERITY_COLOR[p.severity],
        footer:      { text: appUrl ? `FlareUp · ${appUrl}` : "FlareUp" },
        timestamp:   new Date().toISOString(),
      }],
    };
  }
  
  function shapeGeneric(p: WebhookPayload, appUrl?: string): Record<string, unknown> {
    return {
      source:    "flareup",
      timestamp: new Date().toISOString(),
      ...(appUrl ? { url: appUrl } : {}),
      ...p,
    };
  }
  
  function detectFormat(url: string): "slack" | "discord" | "generic" {
    if (url.includes("hooks.slack.com"))          return "slack";
    if (url.includes("discord.com/api/webhooks")) return "discord";
    return "generic";
  }
  
  // ── Signature ─────────────────────────────────────────────────────────────────
  
  async function sign(body: string, secret: string): Promise<string> {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
    return btoa(String.fromCharCode(...new Uint8Array(sig)));
  }
  
  // ── Main send ─────────────────────────────────────────────────────────────────
  
  export async function sendWebhook({ url, payload, secret, appUrl }: SendOptions): Promise<boolean> {
    const format = detectFormat(url);
  
    const shaped =
      format === "slack"   ? shapeSlack(payload, appUrl) :
      format === "discord" ? shapeDiscord(payload, appUrl) :
                             shapeGeneric(payload, appUrl);
  
    const body = JSON.stringify(shaped);
  
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
  
    if (secret) {
      headers["X-FlareUp-Signature"] = await sign(body, secret);
    }
  
    try {
      const res = await fetch(url, { method: "POST", headers, body });
      return res.ok;
    } catch {
      return false;
    }
  }