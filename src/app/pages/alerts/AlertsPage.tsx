// src/app/pages/alerts/AlertsPage.tsx
import { db } from "@/db";
import { env } from "cloudflare:workers";
import { getAlertConfig } from "@/lib/alerts/config";
import { AlertsClient } from "@/app/components/alerts/AlertsClient";

export default async function AlertsPage({ ctx }: { ctx: any }) {
  const kv           = (env as any).ALERT_CONFIG_KV as KVNamespace;
  const isSelfHosted = !!(env as any).CLOUDFLARE_API_TOKEN;
  const userId       = ctx?.user?.id ?? null;

  if (!isSelfHosted && !userId) {
    return new Response(null, { status: 302, headers: { Location: "/user/login?next=/alerts" } });
  }

  const config = await getAlertConfig(kv);

  let connectedAccounts: { id: string; accountId: string; name: string | null; createdAt: Date }[] = [];
  let recentScans: any[] = [];
  let recentAlerts: any[] = [];
  let userTier: "free" | "starter" | "pro" = "free";

  if (!isSelfHosted && userId) {
    try {
      [connectedAccounts, recentScans, recentAlerts] = await Promise.all([
        db.cloudflareToken.findMany({
          where: { userId },
          select: { id: true, accountId: true, name: true, createdAt: true },
          orderBy: { createdAt: "asc" },
        }),
        db.scanResult.findMany({
          where: { userId },
          select: {
            id: true, accountId: true, scannedAt: true,
            costTotal: true, costProjected: true,
            costWorkers: true, costWorkersAI: true,
            costKV: true, costD1: true, costR2: true,
            costDO: true, costQueues: true,
          },
          orderBy: { scannedAt: "desc" },
          take: 48,
        }),
        db.alertHistory.findMany({
          where: { userId },
          select: {
            id: true, accountId: true, firedAt: true,
            alertKey: true, alertType: true, severity: true,
            costAtFire: true, projectedAtFire: true,
            budgetAtFire: true, pctAtFire: true,
            deliveryEmail: true, deliveryWebhook: true,
          },
          orderBy: { firedAt: "desc" },
          take: 20,
        }),
      ]);

      const sub = await db.stripeSubscription.findUnique({
        where: { userId },
        select: { tier: true },
      });
      userTier = (sub?.tier ?? "free") as "free" | "starter" | "pro";
    } catch (err) {
      console.error("[AlertsPage] DB query failed:", err);
    }
  }

  return (
    <AlertsClient
      initialConfig={config}
      connectedAccounts={connectedAccounts}
      recentScans={recentScans}
      recentAlerts={recentAlerts}
      isSelfHosted={isSelfHosted}
      userTier={userTier}
    />
  );
}