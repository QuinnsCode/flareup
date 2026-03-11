// src/app/actions/contactListJoin.ts
"use server";

import { db } from "@/db";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type SignupResult =
  | { ok: true }
  | { ok: false; error: string };

export async function submitContactListJoin(email: string): Promise<SignupResult> {
  const trimmed = email.trim().toLowerCase();

  if (!trimmed) {
    return { ok: false, error: "Email is required." };
  }

  if (!EMAIL_REGEX.test(trimmed)) {
    return { ok: false, error: "That doesn't look like a valid email." };
  }

  if (trimmed.length > 254) {
    return { ok: false, error: "Email is too long." };
  }

  try {
    await db.emailSignup.create({
      data: { email: trimmed },
    });
    return { ok: true };
  } catch (err: unknown) {
    // Prisma unique constraint violation
    if (
      err instanceof Error &&
      err.message.includes("Unique constraint failed")
    ) {
      return { ok: true }; // silent — already on the list
    }
    console.error("[emailSignup]", err);
    return { ok: false, error: "Something went wrong. Try again in a moment." };
  }
}