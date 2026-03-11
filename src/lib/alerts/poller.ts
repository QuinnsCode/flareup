/**
 * src/lib/alerts/poller.ts
 *
 * Hosted alerts poller — loops all CloudflareToken rows,
 * decrypts each, fetches CF usage, evaluates alert tiers,
 * fires webhooks via evaluateAndAlert (same as self-hosted cron).
 */

import { db } from "@/db";
import { decryptToken } from "@/lib/crypto/envelope";
import { getAlertConfig, evaluateAndAlert } from "@/lib/alerts/config";
import { fetchAllUsage } from "@/lib/cf/client";
import { estimateCosts, projectMonthEnd } from "@/lib/cf/pricing";

export async function runHostedAlertPoller(env: any): Promise<void> {
  const kekSecret = env.KEK_SECRET as string | undefined;
  const kv        = env.ALERT_CONFIG_KV as KVNamespace | undefined;
  const appUrl    = env.APP_URL as string ?? "flareup.dev";

  if (!kekSecret || !kv) {
    console.warn("[hosted-poller] missing KEK_SECRET or ALERT_CONFIG_KV");
    return;
  }

  const rows = await db.cloudflareToken.findMany({
    select: {
      userId:         true,
      accountId:      true,
      encryptedToken: true,
      encryptedDek:   true,
    },
  });

  if (rows.length === 0) return;

  await Promise.allSettled(
    rows.map(async (row) => {
      try {
        const token = await decryptToken(
          { encryptedToken: row.encryptedToken, encryptedDek: row.encryptedDek },
          kekSecret
        );

        const config = await getAlertConfig(kv);

        const usage = await fetchAllUsage({ token, accountId: row.accountId });

        const w   = usage.workers.status        === "ok" ? usage.workers.data        : { requests: 0, cpuTimeMs: 0 };
        const ai  = usage.workersAI.status      === "ok" ? usage.workersAI.data      : { neurons: 0, requests: 0, byModel: [] };
        const kv2 = usage.kv.status             === "ok" ? usage.kv.data             : { reads: 0, writes: 0, deletes: 0, lists: 0 };
        const d1  = usage.d1.status             === "ok" ? usage.d1.data             : { rowsRead: 0, rowsWritten: 0 };
        const r2  = usage.r2.status             === "ok" ? usage.r2.data             : { classAOps: 0, classBOps: 0, storageGB: 0 };
        const doU = usage.durableObjects.status === "ok" ? usage.durableObjects.data : { requests: 0, durationMs: 0 };
        const q   = usage.queues.status         === "ok" ? usage.queues.data         : { operations: 0 };

        const costs     = estimateCosts({ workers: w, workersAI: ai, kv: kv2, d1, r2, durableObjects: doU, queues: q });
        const projected = projectMonthEnd(costs);

        await evaluateAndAlert(config, projected.total, costs.total, appUrl);
      } catch (err) {
        console.error(`[hosted-poller] failed for accountId=${row.accountId}:`, err);
      }
    })
  );
}