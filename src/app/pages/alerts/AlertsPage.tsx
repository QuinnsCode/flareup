// src/app/pages/alerts/AlertsPage.tsx
// Server component — guards against non-self-hosted access

import { env } from "cloudflare:workers";
import { getAlertConfig } from "@/lib/alerts/config";
import { AlertsClient } from "@/app/components/alerts/AlertsClient";

export default async function AlertsPage() {
  const isSelfHosted = !!(env as any).CLOUDFLARE_API_TOKEN;

  if (!isSelfHosted) {
    return new Response(null, {
      status: 302,
      headers: { Location: "/dashboard" },
    });
  }

  const kv = (env as any).ALERT_CONFIG_KV as KVNamespace;
  const config = await getAlertConfig(kv);

  return <AlertsClient initialConfig={config} />;
}