// @/app/api/alerts/token.ts

import { env } from "cloudflare:workers";
import { initializeServices } from "@/lib/middlewareFunctions";
import { initAuth } from "@/lib/auth";
import { listTokens, saveToken, deleteToken } from "@/app/services/token/token";

async function getAuthenticatedUser(request: Request) {
  await initializeServices();
  const auth = initAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user ?? null;
}

export async function handleGetTokens(request: Request): Promise<Response> {
  const user = await getAuthenticatedUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const tokens = await listTokens(user.id);
  return Response.json({ tokens });
}

export async function handleSaveToken(request: Request): Promise<Response> {
  const user = await getAuthenticatedUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const kekSecret = (env as any).KEK_SECRET as string | undefined;
  if (!kekSecret) return Response.json({ error: "KEK_SECRET not configured" }, { status: 503 });

  let body: { token: string; accountId: string; name?: string };
  try { body = await request.json(); }
  catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

  if (!body.token || !body.accountId) {
    return Response.json({ error: "token and accountId are required" }, { status: 400 });
  }

  try {
    const record = await saveToken({ userId: user.id, ...body, kekSecret });
    return Response.json({ ok: true, token: record });
  } catch (err: any) {
    return Response.json({ error: err.message ?? "Failed to save token" }, { status: 400 });
  }
}

export async function handleDeleteToken(request: Request): Promise<Response> {
  const user = await getAuthenticatedUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "id is required" }, { status: 400 });

  try {
    await deleteToken(id, user.id);
    return Response.json({ ok: true });
  } catch (err: any) {
    return Response.json({ error: err.message ?? "Failed to delete token" }, { status: 500 });
  }
}