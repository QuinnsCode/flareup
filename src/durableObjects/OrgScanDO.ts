// @/durableObjects/OrgScanDO.ts
/**
 * OrgScanDO — one per org slug
 *
 * Handles the full scan lifecycle per org:
 * - Rate limiting (tier-based scan frequency)
 * - CF token decryption + GraphQL fetch
 * - Cost estimation + projection
 * - Alert threshold evaluation
 * - Email + webhook delivery
 * - Writes ScanResult + AlertHistory to D1
 * - Self-scheduling via alarms (future)
 *
 * Worker wires:
 *   export { OrgScanDO } from "@/durableObjects/OrgScanDO"
 *
 * wrangler.jsonc:
 *   { "name": "ORG_SCAN_DO", "class_name": "OrgScanDO" }
 *   migrations: [{ "tag": "v3", "new_sqlite_classes": ["OrgScanDO"] }]
 */

import { DurableObject } from "cloudflare:workers";
import { decryptToken } from "@/lib/crypto/envelope";
import { fetchAllUsage } from "@/lib/cf/client";
import { estimateCosts, projectMonthEnd } from "@/lib/cf/pricing";
import { db } from "@/db";
import { initializeServices } from "@/lib/middlewareFunctions";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ScanTier = "free" | "starter" | "pro";

const TIER_SCAN_INTERVALS: Record<ScanTier, number> = {
  free:    2 * 60 * 60 * 1000,  // 2 hours
  starter: 20 * 60 * 1000,       // 20 minutes
  pro:     3 * 60 * 1000,        // 3 minutes
};

const TIER_SCANS_PER_DAY: Record<ScanTier, number> = {
  free:    12,
  starter: 72,
  pro:     Infinity,
};

interface OrgScanState {
  scansToday:  number;
  scanResetAt: number; // unix ms — next midnight
  lastScanAt:  number; // unix ms
}

interface ServiceBaseline {
  avg7d:   number;
  samples: number[]; // last 7 daily totals
}

type OrgBaseline = Record<string, ServiceBaseline>;

interface AlertCooldown {
  lastFiredAt: number;
  fireCount:   number;
  snoozedUntil?: number;
}

type OrgAlertState = Record<string, AlertCooldown>;

interface OrgRateLimit {
  emailCount:        number;
  emailWindowStart:  number;
  webhookCount:      number;
  webhookWindowStart: number;
}

// ── Scan payload from queue ───────────────────────────────────────────────────

export interface ScanPayload {
  userId:         string;
  orgId:          string;
  orgSlug:        string;
  accountId:      string;
  encryptedToken: string;
  encryptedDek:   string;
  tier:           ScanTier;
  kekSecret:      string;
  appUrl:         string;
  resendApiKey:   string;
  userEmail:      string;
  alertConfig: {
    monthlyBudget: number;
    webhooks: Array<{ id: string; url: string; name: string; enabled: boolean }>;
    tiers: Array<{ id: string; budgetPercent: number; name: string; enabled: boolean; webhookIds: string[] }>;
  };
}

// ── Alert email copy ──────────────────────────────────────────────────────────

const ESCALATION_SERIES = [
  { subject: "🔥 FlareUp — budget threshold hit", tone: "heads up" },
  { subject: "🔥🔥 FlareUp — still burning", tone: "mild concern" },
  { subject: "🚨 FlareUp — this is getting serious", tone: "urgent" },
  { subject: "💀 FlareUp — we tried to warn you (3x)", tone: "exasperated" },
  { subject: "👋 FlareUp — just checking in again", tone: "passive aggressive" },
  { subject: "🫠 FlareUp — have you considered turning it off?", tone: "resigned" },
  { subject: "📞 FlareUp — we're calling your mom", tone: "absurdist" },
];

// ── DO ────────────────────────────────────────────────────────────────────────

export class OrgScanDO extends DurableObject {
  private state: DurableObjectState;
  private env:   any;

  constructor(state: DurableObjectState, env: any) {
    super(state, env);
    this.state = state;
    this.env   = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url  = new URL(request.url);
    const path = url.pathname;

    if (path === "/scan" && request.method === "POST") {
      const payload = await request.json() as ScanPayload;
      return this.handleScan(payload);
    }

    if (path === "/state" && request.method === "GET") {
      return this.handleGetState();
    }

    if (path === "/snooze" && request.method === "POST") {
      const { alertKey, untilMs } = await request.json() as { alertKey: string; untilMs: number };
      return this.handleSnooze(alertKey, untilMs);
    }

    if (path === "/reset-scan-count" && request.method === "POST") {
      await this.state.storage.put<OrgScanState>("scanState", {
        scansToday: 0,
        scanResetAt: this.nextMidnight(),
        lastScanAt: 0,
      });
      return Response.json({ ok: true });
    }

    return Response.json({ error: "Not found" }, { status: 404 });
  }

  // ── Alarm — resets daily scan counter ──────────────────────────────────────
  async alarm() {
    const scanState = await this.state.storage.get<OrgScanState>("scanState");
    if (scanState) {
      await this.state.storage.put<OrgScanState>("scanState", {
        ...scanState,
        scansToday: 0,
        scanResetAt: this.nextMidnight(),
      });
    }
    // Reschedule for next midnight
    await this.state.storage.setAlarm(this.nextMidnight());
  }

  // ── Main scan handler ───────────────────────────────────────────────────────
  private async handleScan(payload: ScanPayload): Promise<Response> {
    try {
      await initializeServices();

      // 1. Check rate limits
      const rateLimitResult = await this.checkRateLimit(payload.tier);
      if (!rateLimitResult.allowed) {
        return Response.json({ ok: false, reason: rateLimitResult.reason });
      }

      // 2. Decrypt token
      let plainToken: string;
      try {
        plainToken = await decryptToken(
          { encryptedToken: payload.encryptedToken, encryptedDek: payload.encryptedDek },
          payload.kekSecret
        );
      } catch {
        return Response.json({ ok: false, reason: "token_decrypt_failed" }, { status: 400 });
      }

      // 3. Fetch CF usage
      const usage = await fetchAllUsage({ token: plainToken, accountId: payload.accountId });

      const w   = usage.workers.status        === "ok" ? usage.workers.data        : { requests: 0, cpuTimeMs: 0 };
      const ai  = usage.workersAI.status      === "ok" ? usage.workersAI.data      : { neurons: 0, requests: 0, byModel: [] };
      const kv  = usage.kv.status             === "ok" ? usage.kv.data             : { reads: 0, writes: 0, deletes: 0, lists: 0 };
      const d1  = usage.d1.status             === "ok" ? usage.d1.data             : { rowsRead: 0, rowsWritten: 0 };
      const r2  = usage.r2.status             === "ok" ? usage.r2.data             : { classAOps: 0, classBOps: 0, storageGB: 0 };
      const doU = usage.durableObjects.status === "ok" ? usage.durableObjects.data : { requests: 0, durationMs: 0 };
      const q   = usage.queues.status         === "ok" ? usage.queues.data         : { operations: 0 };

      // 4. Estimate costs
      const costs     = estimateCosts({ workers: w, workersAI: ai, kv, d1, r2, durableObjects: doU, queues: q });
      const projected = projectMonthEnd(costs);

      // 5. Update scan state
      await this.incrementScanCount();

      // 6. Update 7d baseline
      await this.updateBaseline("total", costs.total);

      // 7. Write ScanResult to D1
      const scanId = crypto.randomUUID();
      await db.scanResult.create({
        data: {
          id:             scanId,
          orgId:          payload.orgId,
          userId:         payload.userId,
          accountId:      payload.accountId,
          costWorkers:    costs.workers   ?? 0,
          costWorkersAI:  costs.workersAI ?? 0,
          costKV:         costs.kv        ?? 0,
          costD1:         costs.d1        ?? 0,
          costR2:         costs.r2        ?? 0,
          costDO:         costs.durableObjects ?? 0,
          costQueues:     costs.queues    ?? 0,
          costTotal:      costs.total,
          costProjected:  projected.total,
          workersRequests:   w.requests      ?? null,
          workersAINeurons:  ai.neurons      ?? null,
          kvReads:           kv.reads        ?? null,
          kvWrites:          kv.writes       ?? null,
          d1RowsRead:        d1.rowsRead     ?? null,
          d1RowsWritten:     d1.rowsWritten  ?? null,
          r2ClassAOps:       r2.classAOps    ?? null,
          r2ClassBOps:       r2.classBOps    ?? null,
          r2StorageGB:       r2.storageGB    ?? null,
          doRequests:        doU.requests    ?? null,
          doDurationMs:      doU.durationMs  ?? null,
          queueOperations:   q.operations    ?? null,
        },
      });

      // 8. Evaluate alert thresholds
      await this.evaluateAlerts(payload, costs.total, projected.total);

      return Response.json({ ok: true, scanId, costTotal: costs.total, projected: projected.total });

    } catch (err: any) {
      console.error("[OrgScanDO] scan error:", err);
      return Response.json({ ok: false, error: err.message }, { status: 500 });
    }
  }

  // ── Rate limiting ───────────────────────────────────────────────────────────
  private async checkRateLimit(tier: ScanTier): Promise<{ allowed: boolean; reason?: string }> {
    const now      = Date.now();
    const maxScans = TIER_SCANS_PER_DAY[tier];
    const minGap   = TIER_SCAN_INTERVALS[tier];

    let scanState = await this.state.storage.get<OrgScanState>("scanState");

    if (!scanState) {
      scanState = { scansToday: 0, scanResetAt: this.nextMidnight(), lastScanAt: 0 };
    }

    // Reset daily counter if past midnight
    if (now >= scanState.scanResetAt) {
      scanState = { scansToday: 0, scanResetAt: this.nextMidnight(), lastScanAt: scanState.lastScanAt };
      await this.state.storage.setAlarm(scanState.scanResetAt);
    }

    if (scanState.scansToday >= maxScans) {
      return { allowed: false, reason: "daily_limit_reached" };
    }

    if (now - scanState.lastScanAt < minGap) {
      return { allowed: false, reason: "too_soon" };
    }

    return { allowed: true };
  }

  private async incrementScanCount(): Promise<void> {
    const now       = Date.now();
    let scanState   = await this.state.storage.get<OrgScanState>("scanState");
    if (!scanState) {
      scanState = { scansToday: 0, scanResetAt: this.nextMidnight(), lastScanAt: 0 };
    }
    await this.state.storage.put<OrgScanState>("scanState", {
      ...scanState,
      scansToday: scanState.scansToday + 1,
      lastScanAt: now,
    });
  }

  // ── Baseline ────────────────────────────────────────────────────────────────
  private async updateBaseline(service: string, todayCost: number): Promise<void> {
    const baseline = await this.state.storage.get<OrgBaseline>("baseline") ?? {};
    const entry    = baseline[service] ?? { avg7d: 0, samples: [] };

    const samples  = [...entry.samples, todayCost].slice(-7);
    const avg7d    = samples.reduce((a, b) => a + b, 0) / samples.length;

    baseline[service] = { avg7d, samples };
    await this.state.storage.put<OrgBaseline>("baseline", baseline);
  }

  // ── Alert evaluation ────────────────────────────────────────────────────────
  private async evaluateAlerts(payload: ScanPayload, currentCost: number, projectedCost: number): Promise<void> {
    const now        = Date.now();
    const alertState = await this.state.storage.get<OrgAlertState>("alertState") ?? {};
    const budget     = payload.alertConfig.monthlyBudget;

    for (const tier of payload.alertConfig.tiers) {
      if (!tier.enabled) continue;

      const threshold = budget * tier.budgetPercent;
      if (projectedCost < threshold) continue;

      const alertKey = `budget_${Math.round(tier.budgetPercent * 100)}`;
      const cooldown = alertState[alertKey];

      // Check snooze
      if (cooldown?.snoozedUntil && now < cooldown.snoozedUntil) continue;

      // Cooldown: 2hr for free, 20min for starter, 5min for pro
      const cooldownMs = payload.tier === "pro" ? 5 * 60 * 1000
                       : payload.tier === "starter" ? 20 * 60 * 1000
                       : 2 * 60 * 60 * 1000;

      if (cooldown && now - cooldown.lastFiredAt < cooldownMs) continue;

      // Fire the alert
      const fireCount  = (cooldown?.fireCount ?? 0) + 1;
      const severity   = tier.budgetPercent >= 1 ? "nuclear"
                       : tier.budgetPercent >= 0.75 ? "critical"
                       : tier.budgetPercent >= 0.5 ? "warning"
                       : "info";

      // Update cooldown state
      alertState[alertKey] = { lastFiredAt: now, fireCount, snoozedUntil: cooldown?.snoozedUntil };
      await this.state.storage.put<OrgAlertState>("alertState", alertState);

      // Write AlertHistory to D1
      await db.alertHistory.create({
        data: {
          id:              crypto.randomUUID(),
          orgId:           payload.orgId,
          userId:          payload.userId,
          accountId:       payload.accountId,
          alertKey,
          alertType:       "budget",
          severity,
          costAtFire:      currentCost,
          projectedAtFire: projectedCost,
          budgetAtFire:    budget,
          pctAtFire:       tier.budgetPercent,
          deliveryEmail:   false,
          deliveryWebhook: false,
        },
      });

      // Fire webhooks
      const webhooksToFire = payload.alertConfig.webhooks.filter(
        w => w.enabled && tier.webhookIds.includes(w.id)
      );
      for (const webhook of webhooksToFire) {
        await this.sendWebhook(webhook.url, {
          type:      "budget_alert",
          severity,
          alertKey,
          title:     `🔥 FlareUp — ${tier.name} budget threshold hit`,
          message:   `Projected month-end spend $${projectedCost.toFixed(2)} has crossed ${Math.round(tier.budgetPercent * 100)}% of your $${budget} budget.`,
          data: {
            currentCost,
            projectedCost,
            budget,
            pct:       tier.budgetPercent,
            accountId: payload.accountId,
            orgSlug:   payload.orgSlug,
          },
        }, payload.appUrl);
      }

      // Send alert email (rate limited)
      await this.sendAlertEmail(payload, {
        severity,
        alertKey,
        fireCount,
        tierName:      tier.name,
        budgetPct:     tier.budgetPercent,
        currentCost,
        projectedCost,
        budget,
      });
    }

    // Spike detection — 3x 7d baseline
    const baseline = await this.state.storage.get<OrgBaseline>("baseline") ?? {};
    const totalBaseline = baseline["total"];
    if (totalBaseline && totalBaseline.avg7d > 0) {
      const spikeMultiplier = currentCost / totalBaseline.avg7d;
      if (spikeMultiplier >= 3) {
        const alertKey   = "spike_3x";
        const cooldown   = alertState[alertKey];
        const cooldownMs = 30 * 60 * 1000; // 30min spike cooldown

        if (!cooldown || now - cooldown.lastFiredAt >= cooldownMs) {
          alertState[alertKey] = { lastFiredAt: now, fireCount: (cooldown?.fireCount ?? 0) + 1 };
          await this.state.storage.put<OrgAlertState>("alertState", alertState);

          await db.alertHistory.create({
            data: {
              id:              crypto.randomUUID(),
              orgId:           payload.orgId,
              userId:          payload.userId,
              accountId:       payload.accountId,
              alertKey,
              alertType:       "spike",
              severity:        "critical",
              costAtFire:      currentCost,
              projectedAtFire: 0,
              budgetAtFire:    budget,
              pctAtFire:       0,
              deliveryEmail:   false,
              deliveryWebhook: false,
            },
          });

          await this.sendAlertEmail(payload, {
            severity:      "critical",
            alertKey,
            fireCount:     alertState[alertKey].fireCount,
            tierName:      "Spike Detected",
            budgetPct:     0,
            currentCost,
            projectedCost: 0,
            budget,
            isSpike:       true,
            spikeMultiplier,
          });
        }
      }
    }
  }

  // ── Webhook delivery ────────────────────────────────────────────────────────
  private async sendWebhook(url: string, payload: any, appUrl?: string): Promise<void> {
    try {
      await fetch(url, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ ...payload, source: "flareup", appUrl }),
      });
    } catch (err) {
      console.error("[OrgScanDO] webhook failed:", err);
    }
  }

  // ── Email delivery ──────────────────────────────────────────────────────────
  private async sendAlertEmail(payload: ScanPayload, alert: {
    severity:       string;
    alertKey:       string;
    fireCount:      number;
    tierName:       string;
    budgetPct:      number;
    currentCost:    number;
    projectedCost:  number;
    budget:         number;
    isSpike?:       boolean;
    spikeMultiplier?: number;
  }): Promise<void> {
    if (!payload.resendApiKey || !payload.userEmail) return;

    // Rate limit: max 12 emails per hour
    const now       = Date.now();
    const rateLimit = await this.state.storage.get<OrgRateLimit>("rateLimit") ?? {
      emailCount: 0, emailWindowStart: now,
      webhookCount: 0, webhookWindowStart: now,
    };

    const windowMs = 60 * 60 * 1000; // 1 hour
    const maxEmails = payload.tier === "free" ? 3 : payload.tier === "starter" ? 12 : 12;

    if (now - rateLimit.emailWindowStart > windowMs) {
      rateLimit.emailCount       = 0;
      rateLimit.emailWindowStart = now;
    }

    if (rateLimit.emailCount >= maxEmails) return;

    rateLimit.emailCount++;
    await this.state.storage.put<OrgRateLimit>("rateLimit", rateLimit);

    // Pick escalation subject
    const seriesIdx = Math.min(alert.fireCount - 1, ESCALATION_SERIES.length - 1);
    const series    = ESCALATION_SERIES[seriesIdx];

    const subject = alert.isSpike
      ? `🚨 FlareUp — ${alert.spikeMultiplier?.toFixed(1)}x cost spike detected`
      : series.subject;

    const body = alert.isSpike
      ? `Your Cloudflare spend is ${alert.spikeMultiplier?.toFixed(1)}x your 7-day average.\n\nCurrent: $${alert.currentCost.toFixed(2)}\nAccount: ${payload.accountId}`
      : `Your projected month-end spend of $${alert.projectedCost.toFixed(2)} has crossed ${Math.round(alert.budgetPct * 100)}% of your $${alert.budget} budget.\n\nCurrent spend: $${alert.currentCost.toFixed(2)}\nAccount: ${payload.accountId}\n\nManage alerts: https://${payload.orgSlug}.${payload.appUrl}/alerts`;

    try {
      await fetch("https://api.resend.com/emails", {
        method:  "POST",
        headers: {
          "Authorization": `Bearer ${payload.resendApiKey}`,
          "Content-Type":  "application/json",
        },
        body: JSON.stringify({
          from:    `FlareUp <alerts@flareup.dev>`,
          to:      [payload.userEmail],
          subject,
          text:    body,
        }),
      });
    } catch (err) {
      console.error("[OrgScanDO] email failed:", err);
    }
  }

  // ── State endpoint ──────────────────────────────────────────────────────────
  private async handleGetState(): Promise<Response> {
    const [scanState, baseline, alertState, rateLimit] = await Promise.all([
      this.state.storage.get<OrgScanState>("scanState"),
      this.state.storage.get<OrgBaseline>("baseline"),
      this.state.storage.get<OrgAlertState>("alertState"),
      this.state.storage.get<OrgRateLimit>("rateLimit"),
    ]);
    return Response.json({ scanState, baseline, alertState, rateLimit });
  }

  // ── Snooze ──────────────────────────────────────────────────────────────────
  private async handleSnooze(alertKey: string, untilMs: number): Promise<Response> {
    const alertState = await this.state.storage.get<OrgAlertState>("alertState") ?? {};
    alertState[alertKey] = { ...(alertState[alertKey] ?? { lastFiredAt: 0, fireCount: 0 }), snoozedUntil: untilMs };
    await this.state.storage.put<OrgAlertState>("alertState", alertState);
    return Response.json({ ok: true });
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────
  private nextMidnight(): number {
    const d = new Date();
    d.setUTCHours(24, 0, 0, 0);
    return d.getTime();
  }
}