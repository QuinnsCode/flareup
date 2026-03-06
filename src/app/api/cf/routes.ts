/**
 * src/app/api/cf/routes.ts
 *
 * Thin HTTP handlers for /api/cf/* routes.
 * No business logic here — just parse headers, call service, return JSON.
 */

import { validateToken, resolveAccounts, getUsage } from "@/app/services/cfService";
import { CF_GRAPHQL_ENDPOINT } from "@/lib/cf/client";

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-CF-Token, X-CF-Account",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

function err(message: string, status = 400): Response {
  return json({ error: message }, status);
}

function getToken(request: Request)     { return request.headers.get("X-CF-Token")?.trim(); }
function getAccountId(request: Request) { return request.headers.get("X-CF-Account")?.trim(); }

export function handleOptions(): Response {
  return new Response(null, { status: 204, headers: CORS });
}

export async function handleValidate(request: Request): Promise<Response> {
  let body: { token?: string };
  try { body = await request.json(); }
  catch { return err("Invalid JSON"); }

  const token = body.token?.trim();
  if (!token) return err("Missing token");

  try {
    const result = await validateToken(token);
    return json(result);
  } catch (e: any) {
    return err(e.message ?? "Token validation failed", 401);
  }
}

export async function handleAccounts(request: Request): Promise<Response> {
  const token = getToken(request);
  if (!token) return err("Missing X-CF-Token header", 401);

  try {
    const accounts = await resolveAccounts(token);
    return json({ ok: true, accounts });
  } catch (e: any) {
    return err(e.message ?? "Failed to fetch accounts", 502);
  }
}

export async function handleUsage(request: Request): Promise<Response> {
  const token     = getToken(request);
  const accountId = getAccountId(request);

  if (!token)     return err("Missing X-CF-Token header",   401);
  if (!accountId) return err("Missing X-CF-Account header", 401);

  try {
    const result = await getUsage({ token, accountId });
    return json(result);
  } catch (e: any) {
    return err(`Failed to fetch usage: ${e.message}`, 502);
  }
}

export async function handleGraphQL(request: Request): Promise<Response> {
  const token     = getToken(request);
  const accountId = getAccountId(request);

  if (!token)     return err("Missing X-CF-Token header",   401);
  if (!accountId) return err("Missing X-CF-Account header", 401);

  let body: unknown;
  try { body = await request.json(); }
  catch { return err("Invalid JSON body"); }

  const cfRes = await fetch(CF_GRAPHQL_ENDPOINT, {
    method:  "POST",
    headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  });

  return json(await cfRes.json(), cfRes.status);
}