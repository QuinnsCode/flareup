/**
 * src/app/pages/dashboard/DashboardPage.tsx
 */
import { Suspense } from "react";
import DashboardClient from "@/app/components/Dashboard/DashboardClient";
import { getAppUrl } from "@/lib/constants";
import { env } from "cloudflare:workers";
import { db } from "@/db";
import { decryptToken } from "@/lib/crypto/envelope";
import { getUsage } from "@/app/services/cfService";

// ── Data loader — async, streams in via Suspense ──────────────────────────────

async function DashboardDataLoader({ ctx, isSelfHosted }: { ctx: any; isSelfHosted: boolean }) {
  const userId = ctx?.user?.id ?? null;

  if (!userId) {
    // Anonymous — no data, show connect screen
    return <DashboardClient appUrl={getAppUrl()} isSelfHosted={isSelfHosted} />;
  }

  let storedAccounts: { id: string; accountId: string; name: string | null }[] = [];
  let preloadedData: any = null;

  const records = await db.cloudflareToken.findMany({
    where: { userId },
    select: { id: true, accountId: true, name: true, encryptedToken: true, encryptedDek: true },
    orderBy: { createdAt: "asc" },
  }) as any[];

  storedAccounts = records.map((r: any) => ({ id: r.id, accountId: r.accountId, name: r.name }));

  if (records.length > 0) {
    try {
      const first = records[0];
      const kek = (env as any).KEK_SECRET as string;
      const token = await decryptToken(
        { encryptedToken: first.encryptedToken, encryptedDek: first.encryptedDek },
        kek
      );
      preloadedData = await getUsage({ token, accountId: first.accountId });
    } catch (err) {
      console.error("[DashboardDataLoader] getUsage failed:", err);
    }
  }

  return (
    <DashboardClient
      appUrl={getAppUrl()}
      isSelfHosted={isSelfHosted}
      storedAccounts={storedAccounts}
      preloadedData={preloadedData}
      preloadedAccountId={storedAccounts[0]?.accountId ?? null}
    />
  );
}

// ── Page — static shell streams immediately, data loader suspends ─────────────

export default async function DashboardPage({ ctx }: { ctx: any }) {
  const isSelfHosted = !!(env as any).CLOUDFLARE_API_TOKEN;

  return (
    <DashboardLayout>
      <Suspense fallback={<Dashboardshimmer />}>
        <DashboardDataLoader ctx={ctx} isSelfHosted={isSelfHosted} />
      </Suspense>
    </DashboardLayout>
  );
}

// ── Static layout wrapper — renders before any async work ────────────────────

function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: layoutCSS }} />
      <div className="dash-layout">
        {children}
      </div>
    </>
  );
}

// ── Shimmer fallback ──────────────────────────────────────────────────────────

function Dashboardshimmer() {
  return (
    <div className="shimmer-page">
      <div className="shimmer-nav">
        <div className="shimmer-block" style={{ width: 100, height: 20 }} />
        <div style={{ display:"flex", gap: 10 }}>
          {[60, 70, 90, 120].map((w, i) => (
            <div key={i} className="shimmer-block" style={{ width: w, height: 30, animationDelay: `${i * 0.05}s` }} />
          ))}
        </div>
      </div>
      <div style={{ margin: "12px 32px 0" }}>
        <div className="shimmer-block" style={{ height: 44 }} />
      </div>
      <div className="shimmer-burnbar">
        <div className="shimmer-block" style={{ width: 160, height: 16 }} />
        <div className="shimmer-block" style={{ height: 6, marginTop: 10 }} />
      </div>
      <div className="shimmer-grid">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="shimmer-card">
            <div className="shimmer-block" style={{ width: 80, height: 12, animationDelay: `${i * 0.05}s` }} />
            <div className="shimmer-block" style={{ width: 100, height: 28, animationDelay: `${i * 0.05 + 0.1}s` }} />
            <div className="shimmer-block" style={{ width: "70%", height: 11, animationDelay: `${i * 0.05 + 0.15}s` }} />
          </div>
        ))}
      </div>
      <div className="shimmer-glow" />
    </div>
  );
}

const layoutCSS = `
  .dash-layout { min-height: 100vh; background: #0a0a0a; }

  .shimmer-page { min-height: 100vh; background: #0a0a0a; position: relative; overflow: hidden; }
  .shimmer-nav { display: flex; align-items: center; justify-content: space-between; padding: 16px 32px; border-bottom: 1px solid #1a1a1a; background: #111; height: 57px; }
  .shimmer-burnbar { padding: 20px 32px; border-bottom: 1px solid #1a1a1a; }
  .shimmer-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1px; background: #2a2a2a; margin: 24px 32px; border: 1px solid #2a2a2a; border-radius: 4px; overflow: hidden; }
  .shimmer-card { background: #0a0a0a; padding: 20px; display: flex; flex-direction: column; gap: 8px; }
  .shimmer-block {
    border-radius: 3px;
    background: linear-gradient(90deg, #1a1a1a 25%, #2a2a2a 50%, #1a1a1a 75%);
    background-size: 200% 100%;
    animation: shimmer-sweep 1.4s ease-in-out infinite;
  }
  .shimmer-glow {
    position: absolute; bottom: -100px; left: 50%;
    transform: translateX(-50%);
    width: 600px; height: 300px;
    background: radial-gradient(ellipse, rgba(232,93,4,0.08) 0%, transparent 70%);
    pointer-events: none;
    animation: shimmer-pulse 2s ease-in-out infinite;
  }
  @keyframes shimmer-sweep { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
  @keyframes shimmer-pulse { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }
`;