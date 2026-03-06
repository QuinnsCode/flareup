/**
 * src/app/services/cfService.ts
 *
 * Business logic for Cloudflare usage + token validation.
 * Used by API routes, server actions, and cron handler.
 * No request/response concerns here — just data.
 */

import { fetchAllUsage, verifyToken, CF_API_BASE, type CFCredentials, type ProductUsage } from "@/lib/cf/client";
import { estimateCosts, projectMonthEnd, type CostBreakdown } from "@/lib/cf/pricing";

export type UsageResponse = {
  usage:         ProductUsage;
  costs:         CostBreakdown;
  projected:     CostBreakdown;
  billingPeriod: {
    start:       string;
    end:         string;
    dayOfMonth:  number;
    daysInMonth: number;
  };
  fetchedAt:     string;
  disclaimer:    string;
};

export async function getUsage(creds: CFCredentials): Promise<UsageResponse> {
  const usage = await fetchAllUsage(creds);

  const w   = usage.workers.status        === "ok" ? usage.workers.data        : { requests: 0, cpuTimeMs: 0 };
  const ai  = usage.workersAI.status      === "ok" ? usage.workersAI.data      : { neurons: 0, requests: 0, byModel: [] };
  const kv  = usage.kv.status             === "ok" ? usage.kv.data             : { reads: 0, writes: 0, deletes: 0, lists: 0 };
  const d1  = usage.d1.status             === "ok" ? usage.d1.data             : { rowsRead: 0, rowsWritten: 0 };
  const r2  = usage.r2.status             === "ok" ? usage.r2.data             : { classAOps: 0, classBOps: 0, storageGB: 0 };
  const doU = usage.durableObjects.status === "ok" ? usage.durableObjects.data : { requests: 0, durationMs: 0 };
  const q   = usage.queues.status         === "ok" ? usage.queues.data         : { operations: 0 };

  const costs     = estimateCosts({ workers: w, workersAI: ai, kv, d1, r2, durableObjects: doU, queues: q });
  const projected = projectMonthEnd(costs);
  const now       = new Date();

  return {
    usage,
    costs,
    projected,
    billingPeriod: {
      start:       new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0],
      end:         now.toISOString().split("T")[0],
      dayOfMonth:  now.getDate(),
      daysInMonth: new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(),
    },
    fetchedAt:  now.toISOString(),
    disclaimer: "Estimates only. GraphQL analytics ≠ your invoice. Verify at dash.cloudflare.com → Billing.",
  };
}

export type ValidateResult = {
  ok:       boolean;
  tokenId:  string;
  readOnly: boolean;
  message:  string;
};

export async function validateToken(token: string): Promise<ValidateResult> {
  // verifyToken in client.ts already checks read-only and throws if not
  const { id } = await verifyToken(token);
  return {
    ok:       true,
    tokenId:  id,
    readOnly: true,
    message:  "Token verified — read-only access confirmed.",
  };
}

export async function resolveAccounts(token: string): Promise<{ id: string; name: string }[]> {
  const res = await fetch(`${CF_API_BASE}/accounts?per_page=5`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch accounts");
  const data = await res.json() as any;
  return (data.result ?? []).map((a: any) => ({ id: a.id, name: a.name }));
}