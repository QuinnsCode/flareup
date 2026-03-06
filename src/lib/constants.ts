// src/lib/constants.ts
import { env } from "cloudflare:workers";
export const getAppUrl = () => (env as any).APP_URL ?? "flareup.dev";