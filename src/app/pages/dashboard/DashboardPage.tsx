/**
 * src/app/pages/dashboard/DashboardPage.tsx
 * Server component — just renders the client shell.
 * Fonts load here so they're server-rendered, no CSP issues.
 */

import DashboardClient from "@/app/components/Dashboard/DashboardClient";
import { getAppUrl } from "@/lib/constants";
import { env } from "cloudflare:workers";

export default async function DashboardPage() {
  const isSelfHosted = !!(env as any).CLOUDFLARE_API_TOKEN;

  return (
    <DashboardClient appUrl={getAppUrl()} isSelfHosted={isSelfHosted} />
  );
}