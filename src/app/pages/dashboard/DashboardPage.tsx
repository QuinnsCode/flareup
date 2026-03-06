/**
 * src/app/pages/dashboard/DashboardPage.tsx
 * Server component — just renders the client shell.
 * Fonts load here so they're server-rendered, no CSP issues.
 */

import DashboardClient from "@/app/components/Dashboard/DashboardClient";

export default async function DashboardPage() {
  return (
    <>
      <DashboardClient />
    </>
  );
}