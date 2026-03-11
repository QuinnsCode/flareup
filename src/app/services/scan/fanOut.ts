// @/app/services/scan/fanOut.ts
// Builds scan payloads for all hosted users — called from scheduled handler
// Imports db directly so worker.tsx stays db-free

import { db } from "@/db";
import type { ScanPayload, ScanTier } from "@/durableObjects/OrgScanDO";

export async function buildScanPayloads(env: any): Promise<ScanPayload[]> {
  const tokens = await db.cloudflareToken.findMany({
    include: {
      user: {
        select: {
          id:    true,
          email: true,
          squeezeSubscription: { select: { tier: true } },
          members: {
            select: {
              organization: { select: { id: true, slug: true } }
            },
            take:    1,
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });

  const kekSecret    = env.KEK_SECRET    as string;
  const resendApiKey = env.RESEND_API_KEY as string;
  const appUrl       = env.APP_URL        as string;

  const payloads: ScanPayload[] = [];

  for (const token of tokens) {
    const user   = token.user;
    const member = user.members[0];
    if (!member) continue;

    const org  = member.organization;
    const tier = (user.squeezeSubscription?.tier ?? "free") as ScanTier;

    let alertConfig: ScanPayload["alertConfig"] = {
      monthlyBudget: 50,
      webhooks:      [],
      tiers: [
        { id: "t25",  budgetPercent: 0.25, name: "Warning",  enabled: true, webhookIds: [] },
        { id: "t50",  budgetPercent: 0.50, name: "Alert",    enabled: true, webhookIds: [] },
        { id: "t75",  budgetPercent: 0.75, name: "Critical", enabled: true, webhookIds: [] },
        { id: "t100", budgetPercent: 1.00, name: "Nuclear",  enabled: true, webhookIds: [] },
      ],
    };

    try {
      const raw = await env.ALERT_CONFIG_KV.get(`alert:${token.accountId}`);
      if (raw) alertConfig = JSON.parse(raw);
    } catch {}

    payloads.push({
      userId:         user.id,
      orgId:          org.id,
      orgSlug:        org.slug ?? "",
      accountId:      token.accountId,
      encryptedToken: token.encryptedToken,
      encryptedDek:   token.encryptedDek,
      tier,
      kekSecret,
      appUrl,
      resendApiKey,
      userEmail:      user.email ?? "",
      alertConfig,
    });
  }

  return payloads;
}