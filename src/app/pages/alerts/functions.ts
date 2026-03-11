"use server";
// src/app/pages/alerts/functions.ts

import { db } from "@/db";
import { requestInfo } from "rwsdk/worker";
import { env } from "cloudflare:workers";
import { getAlertConfig, saveAlertConfig } from "@/lib/alerts/config";
import type { AlertConfig } from "@/lib/alerts/config";

export async function getConnectedAccounts() {
  const { ctx } = requestInfo;
  const userId = ctx?.user?.id;
  if (!userId) throw new Response("Unauthorized", { status: 401 });

  return db.cloudflareToken.findMany({
    where: { userId },
    select: { id: true, accountId: true, name: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function saveAlertsConfig(config: AlertConfig) {
  const kv = (env as any).ALERT_CONFIG_KV as KVNamespace;
  await saveAlertConfig(kv, config);
  return { ok: true };
}

export async function deleteCloudflareToken(id: string) {
  const { ctx } = requestInfo;
  const userId = ctx?.user?.id;
  if (!userId) throw new Response("Unauthorized", { status: 401 });

  const existing = await db.cloudflareToken.findFirst({ where: { id, userId } });
  if (!existing) throw new Response("Not found", { status: 404 });

  await db.cloudflareToken.delete({ where: { id } });
  return { ok: true };
}