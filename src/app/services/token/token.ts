// @/app/services/token/token.ts

import { db } from "@/db";
import { encryptToken, decryptToken } from "@/lib/crypto/envelope";

export async function listTokens(userId: string) {
  return db.cloudflareToken.findMany({
    where: { userId },
    select: { id: true, accountId: true, name: true, createdAt: true, updatedAt: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function saveToken({
  userId,
  token,
  accountId,
  name,
  kekSecret,
}: {
  userId: string;
  token: string;
  accountId: string;
  name?: string;
  kekSecret: string;
}) {
  // Validate token works before storing
  const validateRes = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!validateRes.ok) {
    throw new Error("Invalid Cloudflare token or account ID");
  }

  const envelope = await encryptToken(token, kekSecret);

  return db.cloudflareToken.upsert({
    where: { userId_accountId: { userId, accountId } },
    create: {
      userId,
      accountId,
      name: name ?? null,
      encryptedToken: envelope.encryptedToken,
      encryptedDek:   envelope.encryptedDek,
    },
    update: {
      name:           name ?? undefined,
      encryptedToken: envelope.encryptedToken,
      encryptedDek:   envelope.encryptedDek,
      updatedAt:      new Date(),
    },
    select: { id: true, accountId: true, name: true, createdAt: true },
  });
}

export async function deleteToken(id: string, userId: string) {
  const existing = await db.cloudflareToken.findFirst({ where: { id, userId } });
  if (!existing) throw new Error("Not found");
  await db.cloudflareToken.delete({ where: { id } });
}

export async function getDecryptedToken(userId: string, accountId: string, kekSecret: string) {
  const record = await db.cloudflareToken.findUnique({
    where: { userId_accountId: { userId, accountId } },
  });
  if (!record) throw new Error("Token not found");
  return decryptToken({ encryptedToken: record.encryptedToken, encryptedDek: record.encryptedDek }, kekSecret);
}