"use server";
// src/app/serverActions/cf/fetchStoredUsage.ts

import { getRequestInfo } from "rwsdk/worker";
import { db } from "@/db";
import { decryptToken } from "@/lib/crypto/envelope";
import { getUsage } from "@/app/services/cfService";
import { env } from "cloudflare:workers";

export async function fetchStoredUsage(accountId: string): Promise<any> {
  const { ctx } = getRequestInfo();
  const userId = ctx?.user?.id;
  if (!userId) throw new Error("Unauthorized");

  const record = await db.cloudflareToken.findFirst({
    where: { userId, accountId },
    select: { encryptedToken: true, encryptedDek: true },
  }) as any;

  if (!record) throw new Error("Account not found");

  const kek = (env as any).KEK_SECRET as string;
  const token = await decryptToken(
    { encryptedToken: record.encryptedToken, encryptedDek: record.encryptedDek },
    kek
  );

  return getUsage({ token, accountId });
}