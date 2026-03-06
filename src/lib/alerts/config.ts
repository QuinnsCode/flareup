/**
 * src/lib/alerts/config.ts
 * Alert configuration — stored in ALERT_CONFIG_KV
 */

import { sendWebhook, type WebhookPayload as AlertPayload } from "@/lib/webhook";

export type WebhookConfig = {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
};

export type AlertTier = {
  id: string;
  name: string;                    // e.g. "heads-up", "warning", "on-fire"
  budgetPercent: number;           // 0.25 = 25% of monthly budget
  webhookIds: string[];
  repeatEveryMinutes?: number;
  enabled: boolean;
};

export type ServiceRule = {
  id: string;
  service: keyof ServiceThresholds;
  metric: string;
  threshold: number;
  webhookIds: string[];
  enabled: boolean;
};

export type ServiceThresholds = {
  workersAI: {
    dailyNeurons?: number;
    monthlyNeurons?: number;
  };
  kv: {
    dailyReads?: number;
    monthlyReads?: number;
    monthlyWrites?: number;
  };
  d1: {
    monthlyRowsRead?: number;
    monthlyRowsWritten?: number;
  };
  r2: {
    monthlyClassAOps?: number;
    monthlyClassBOps?: number;
  };
  workers: {
    monthlyRequests?: number;
  };
  durableObjects: {
    monthlyRequests?: number;
  };
};

export type SpikeConfig = {
  enabled: boolean;
  multiplier: number;              // e.g. 3 = alert if today > 3x 7-day avg
  windowDays: number;
  webhookIds: string[];
};

export type AlertConfig = {
  monthlyBudget: number;           // USD
  webhooks: WebhookConfig[];
  tiers: AlertTier[];
  serviceRules: ServiceRule[];
  spike: SpikeConfig;
  updatedAt: string;
};

export { type AlertPayload };

export const DEFAULT_ALERT_CONFIG: AlertConfig = {
  monthlyBudget: 50,
  webhooks: [],
  tiers: [
    { id: "tier-1", name: "Heads Up",   budgetPercent: 0.25, webhookIds: [], enabled: true },
    { id: "tier-2", name: "Warning",    budgetPercent: 0.5,  webhookIds: [], enabled: true },
    { id: "tier-3", name: "Danger",     budgetPercent: 0.75, webhookIds: [], enabled: true },
    { id: "tier-4", name: "🔥 On Fire", budgetPercent: 1.0,  webhookIds: [], repeatEveryMinutes: 30, enabled: true },
  ],
  serviceRules: [],
  spike: {
    enabled: true,
    multiplier: 3,
    windowDays: 7,
    webhookIds: [],
  },
  updatedAt: new Date().toISOString(),
};

const CONFIG_KEY = "alert_config";

export async function getAlertConfig(kv: KVNamespace): Promise<AlertConfig> {
  const raw = await kv.get(CONFIG_KEY);
  if (!raw) return DEFAULT_ALERT_CONFIG;
  try {
    return JSON.parse(raw) as AlertConfig;
  } catch {
    return DEFAULT_ALERT_CONFIG;
  }
}

export async function saveAlertConfig(
  kv: KVNamespace,
  config: AlertConfig
): Promise<void> {
  config.updatedAt = new Date().toISOString();
  await kv.put(CONFIG_KEY, JSON.stringify(config));
}

/**
 * Evaluate alert tiers against projected spend and fire webhooks.
 */
export async function evaluateAndAlert(
  config: AlertConfig,
  projectedTotal: number,
  currentTotal: number,
  appUrl?: string,
): Promise<void> {
  const webhookMap = new Map(config.webhooks.map((w) => [w.id, w]));

  for (const tier of config.tiers) {
    if (!tier.enabled) continue;

    const threshold = config.monthlyBudget * tier.budgetPercent;
    if (projectedTotal < threshold) continue;

    const severity: AlertPayload["severity"] =
      tier.budgetPercent >= 1.0  ? "critical" :
      tier.budgetPercent >= 0.75 ? "danger"   :
      tier.budgetPercent >= 0.5  ? "warning"  : "info";

    const payload: AlertPayload = {
      type: "tier",
      severity,
      title: `FlareUp: ${tier.name} — ${Math.round(tier.budgetPercent * 100)}% of budget`,
      message:
        `Projected month-end: $${projectedTotal.toFixed(2)} ` +
        `(${Math.round((projectedTotal / config.monthlyBudget) * 100)}% of $${config.monthlyBudget} budget). ` +
        `Current MTD: $${currentTotal.toFixed(2)}.`,
      data: {
        tier: tier.name,
        budgetPercent: tier.budgetPercent,
        monthlyBudget: config.monthlyBudget,
        projectedTotal,
        currentTotal,
      },
    };

    for (const webhookId of tier.webhookIds) {
      const webhook = webhookMap.get(webhookId);
      if (webhook?.enabled) {
        await sendWebhook({ url: webhook.url, payload, appUrl });
      }
    }
  }
}