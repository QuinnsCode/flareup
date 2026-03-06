"use client";
/**
 * src/app/pages/dashboard/DashboardClient.tsx
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { ConnectCloudflareAnalytics } from "@/app/components/Dashboard/ConnectCloudflareAnalytics";
import { BurnBar }     from "@/app/components/Dashboard/BurnBar";
import { CostGrid }    from "@/app/components/Dashboard/CostGrid";
import { ModelTable }  from "@/app/components/Dashboard/ModelTable";
import { StatusBoard } from "@/app/components/Dashboard/StatusBoard";

interface Session { token: string; accountId: string; }
type LoadState = "idle" | "loading" | "loaded" | "error";

async function fetchUsageFromServer(session: Session) {
  const res = await fetch("/api/cf/usage", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CF-Token":   session.token,
      "X-CF-Account": session.accountId,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to fetch usage");
  return data;
}

// ── Shimmer ───────────────────────────────────────────────────────────────────

function ShimmerBlock({ w, h, delay = 0 }: { w?: number | string; h: number; delay?: number }) {
  return (
    <div className="shimmer-block" style={{ width: w ?? "100%", height: h, animationDelay: `${delay}s` }} />
  );
}

function Shimmer() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: shimmerCSS }} />
      <div className="shimmer-page">
        {/* Header — matches real header height/layout exactly to prevent shift */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 32px", borderBottom:"1px solid #1a1a1a", background:"#111", height: 57 }}>
          <div style={{ display:"flex", gap:16, alignItems:"center" }}>
            <ShimmerBlock w={100} h={20} />
            <ShimmerBlock w={80} h={14} delay={0.05} />
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <ShimmerBlock w={60}  h={30} delay={0.05} />
            <ShimmerBlock w={70}  h={30} delay={0.1} />
            <ShimmerBlock w={90}  h={30} delay={0.15} />
            <ShimmerBlock w={120} h={30} delay={0.2} />
          </div>
        </div>
        {/* Status bar */}
        <div style={{ margin:"12px 32px 0" }}>
          <ShimmerBlock h={44} delay={0.1} />
        </div>
        {/* Burn bar */}
        <div style={{ padding:"20px 32px", borderBottom:"1px solid #1a1a1a" }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
            <ShimmerBlock w={160} h={16} delay={0.15} />
            <ShimmerBlock w={120} h={16} delay={0.2} />
          </div>
          <ShimmerBlock h={6} delay={0.2} />
        </div>
        {/* Cost grid */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))", gap:1, background:"#2a2a2a", margin:"24px 32px", border:"1px solid #2a2a2a", borderRadius:4, overflow:"hidden" }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ background:"#0a0a0a", padding:20, display:"flex", flexDirection:"column" as const, gap:8 }}>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <ShimmerBlock w={20} h={20} delay={i * 0.05} />
                <ShimmerBlock w={80} h={12} delay={i * 0.05 + 0.05} />
              </div>
              <ShimmerBlock w={100} h={28} delay={i * 0.05 + 0.1} />
              <ShimmerBlock w={120} h={11} delay={i * 0.05 + 0.15} />
              <ShimmerBlock w={"70%"} h={11} delay={i * 0.05 + 0.2} />
            </div>
          ))}
        </div>
        <div className="shimmer-glow" />
      </div>
    </>
  );
}

const shimmerCSS = `
  .shimmer-page { min-height: 100vh; background: #0a0a0a; position: relative; overflow: hidden; font-family: system-ui; }
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
  @keyframes shimmer-sweep {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  @keyframes shimmer-pulse {
    0%,100% { opacity: 0.6; transform: translateX(-50%) scale(1); }
    50%     { opacity: 1;   transform: translateX(-50%) scale(1.05); }
  }
`;

// ── Not connected ─────────────────────────────────────────────────────────────

function NotConnected({ onConnected }: { onConnected: (token: string, accountId: string) => void }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: pageCSS }} />
      <div className="page page--centered">
        <div className="connect-hero">
          <div className="logo-mark">🔥</div>
          <h1 className="hero-title">FlareUp</h1>
          <p className="hero-sub">Cloudflare billing visibility.<br />Before the $8,000 surprise.</p>
        </div>
        <div className="connect-card">
          <div className="connect-card-header">
            <h2>Connect your Cloudflare account</h2>
            <p>Paste a read-only API token. FlareUp rejects anything with write access — your infra stays untouchable.</p>
          </div>
          <ConnectCloudflareAnalytics onConnected={onConnected} />
          <div className="connect-features">
            <div className="connect-feature"><span>◆</span><span>Token verified read-only on connect — write access rejected</span></div>
            <div className="connect-feature"><span>◆</span><span>Lives in your browser tab only — gone when you close it</span></div>
            <div className="connect-feature"><span>◆</span><span>Workers · KV · D1 · R2 · Workers AI · Durable Objects</span></div>
            <div className="connect-feature" style={{ color: "var(--text-dim)", fontStyle: "italic" }}>
              <span>⬡</span><span>Self-host and set <code style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>CLOUDFLARE_API_TOKEN</code> to unlock webhook alerts</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Share popup ───────────────────────────────────────────────────────────────

function SharePopup({ onClose, appUrl }: { onClose: () => void; appUrl: string }) {
  const [copied, setCopied] = useState(false);
  const url = `https://${appUrl}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const el = document.createElement("textarea");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".share-popup") && !target.closest(".share-trigger")) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div className="share-popup">
      <div className="share-popup-label">Share FlareUp</div>
      <div className="share-popup-row">
        <input
          className="share-popup-input"
          readOnly
          value={url}
          onFocus={e => e.target.select()}
        />
        <button className="share-popup-copy" onClick={handleCopy}>
          {copied ? "✓ Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}

// ── Header ────────────────────────────────────────────────────────────────────

function Header({ session, fetchedAt, onRefresh, onDisconnect, loading, appUrl, isSelfHosted }: {
  session: Session; fetchedAt: string;
  onRefresh: () => void; onDisconnect: () => void; loading: boolean;
  appUrl: string;
  isSelfHosted: boolean,
}) {
  const [shareOpen, setShareOpen] = useState(false);

  return (
    <div className="dash-header">
      <div className="dash-header-left">
        <span className="dash-logo">🔥 FlareUp</span>
        <span className="dash-period">
          {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </span>
      </div>
      <div className="dash-header-right">
        <span className="dash-meta">acct {session.accountId.slice(0, 8)}…</span>
        {fetchedAt && <span className="dash-meta">{new Date(fetchedAt).toLocaleTimeString()}</span>}
        <button className="action-btn" onClick={onRefresh} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh"}
        </button>
        {/* Share button + popup */}
        <div style={{ position: "relative" }}>
          <button
            className="action-btn share-trigger"
            onClick={() => setShareOpen(o => !o)}
          >
            Share
          </button>
          {shareOpen && <SharePopup onClose={() => setShareOpen(false)} appUrl={appUrl} />}
        </div>
        <a href="/" className="action-btn">Home</a>
        <button className="action-btn action-btn--ghost" onClick={onDisconnect}>Disconnect</button>
        {isSelfHosted && <a href="/alerts" className="action-btn">Alerts</a>}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function DashboardClient({ appUrl, isSelfHosted }: { appUrl: string; isSelfHosted: boolean }) {
  const [session,   setSession]   = useState<Session | null>(null);
  const [data,      setData]      = useState<any>(null);
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [error,     setError]     = useState("");
  const [fetchedAt, setFetchedAt] = useState("");
  const isLoadingRef = useRef(false);

  const handleConnected = useCallback((token: string, accountId: string) => {
    setSession({ token, accountId });
  }, []);

  const handleDisconnect = useCallback(() => {
    setSession(null);
    setData(null);
    setLoadState("idle");
    setError("");
    setFetchedAt("");
  }, []);

  const load = useCallback(async (s: Session) => {
    isLoadingRef.current = true;
    setLoadState("loading");
    setError("");
    try {
      const result = await fetchUsageFromServer(s);
      setData(result);
      setFetchedAt(new Date().toISOString());
      isLoadingRef.current = false;
      setLoadState("loaded");
    } catch (e: any) {
      setError(e.message ?? "Failed to fetch usage");
      isLoadingRef.current = false;
      setLoadState("error");
    }
  }, []);

  useEffect(() => {
    if (session) load(session);
  }, [session, load]);

  if (!session) return <NotConnected onConnected={handleConnected} />;

  // Render shimmer immediately — no waiting, no layout shift
  if (loadState === "idle" || loadState === "loading") return <Shimmer />;

  if (loadState === "error") {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: pageCSS }} />
        <div className="page page--centered">
          <div className="error-card">
            <div className="error-icon">⚠</div>
            <h2>Failed to fetch usage</h2>
            <p className="error-message">{error}</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button className="action-btn" onClick={() => load(session)}>Retry</button>
              <button className="action-btn action-btn--ghost" onClick={handleDisconnect}>Disconnect</button>
            </div>
          </div>
        </div>
      </>
    );
  }

  const { usage, costs, projected, billingPeriod } = data ?? {};
  const now         = new Date();
  const daysInMonth = billingPeriod?.daysInMonth ?? new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const ai          = usage?.workersAI?.status === "ok" ? usage.workersAI.data : { byModel: [] };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: pageCSS }} />
      <div className="page">
        <Header
          session={session}
          fetchedAt={fetchedAt}
          onRefresh={() => load(session)}
          onDisconnect={handleDisconnect}
          loading={isLoadingRef.current}
          appUrl={appUrl}
          isSelfHosted={isSelfHosted}
        />
        <StatusBoard usage={usage} />
        <BurnBar
          current={costs?.total ?? 0}
          projected={projected?.total ?? 0}
          budget={100}
          dayOfMonth={now.getDate()}
          daysInMonth={daysInMonth}
        />
        <div className="section-header">
          <h2 className="section-title">Cost by service</h2>
          <span className="section-meta">projected month-end</span>
        </div>
        <CostGrid costs={costs} projected={projected} usage={usage} />
        <ModelTable models={ai.byModel} />
        <p className="disclaimer">
          Estimates only. GraphQL analytics ≠ your Cloudflare invoice.{" "}
          <a href="https://dash.cloudflare.com" target="_blank" rel="noopener noreferrer">
            Verify at dash.cloudflare.com → Billing
          </a>.
          <br />
          <span style={{ color: "var(--text-dim)", fontStyle: "italic" }}>
            // your token transits our Worker but is never stored. tab close = gone.
          </span>
        </p>
      </div>
    </>
  );
}

// ── Page styles ───────────────────────────────────────────────────────────────

const pageCSS = `
  :root {
    --bg: #0a0a0a; --surface: #111111; --surface2: #1a1a1a;
    --border: #2a2a2a; --text: #e8e8e8; --text-muted: #666;
    --text-dim: #444; --red: #ef4444; --amber: #f97316;
    --yellow: #eab308; --green: #22c55e; --accent: #f97316;
    --font-mono: 'Share Tech Mono', monospace;
    --font-body: 'Barlow', system-ui, sans-serif;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  .page { min-height: 100vh; background: var(--bg); color: var(--text); font-family: var(--font-body); padding: 0 0 64px; }
  .page--centered { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px 24px; }

  .dash-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 32px; border-bottom: 1px solid var(--border); background: var(--surface); position: sticky; top: 0; z-index: 10; }
  .dash-header-left  { display: flex; align-items: center; gap: 16px; }
  .dash-header-right { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .dash-logo   { font-size: 18px; font-weight: 700; letter-spacing: -0.5px; }
  .dash-period { font-size: 13px; color: var(--text-muted); font-family: var(--font-mono); }
  .dash-meta   { font-size: 12px; color: var(--text-dim);   font-family: var(--font-mono); }

  .action-btn {
    padding: 6px 14px; border-radius: 4px; font-size: 12px;
    font-family: var(--font-mono); letter-spacing: 0.06em; text-transform: uppercase;
    cursor: pointer; border: 1px solid var(--border);
    background: var(--surface2); color: var(--text-muted);
    transition: color 0.15s, border-color 0.15s;
    text-decoration: none; display: inline-block;
    position: relative; overflow: hidden;
  }
  .action-btn::after {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(105deg, transparent 40%, rgba(249,115,22,0.07) 50%, transparent 60%);
    background-size: 200% 100%;
    background-position: 200% 0;
    transition: background-position 0.4s ease;
  }
  .action-btn:hover::after  { background-position: -200% 0; }
  .action-btn:hover    { border-color: rgba(249,115,22,0.5); color: var(--accent); }
  .action-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .action-btn:disabled::after { display: none; }
  .action-btn--primary { border-color: var(--accent); color: var(--accent); }
  .action-btn--ghost   { color: var(--text-dim); }

  /* Share popup */
  .share-popup {
    position: absolute; top: calc(100% + 8px); right: 0;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 6px; padding: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.6);
    min-width: 280px; z-index: 100;
    animation: share-in 0.15s ease;
  }
  @keyframes share-in {
    from { opacity: 0; transform: translateY(-4px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .share-popup-label { font-size: 11px; color: var(--text-dim); font-family: var(--font-mono); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; }
  .share-popup-row   { display: flex; gap: 6px; }
  .share-popup-input {
    flex: 1; background: var(--bg); border: 1px solid var(--border);
    border-radius: 4px; padding: 6px 10px;
    font-size: 13px; font-family: var(--font-mono); color: var(--text);
    outline: none;
  }
  .share-popup-input:focus { border-color: var(--accent); }
  .share-popup-copy {
    padding: 6px 14px; border-radius: 4px; font-size: 13px;
    background: var(--accent); color: #fff; border: none;
    cursor: pointer; font-family: var(--font-body);
    transition: opacity 0.15s; white-space: nowrap;
  }
  .share-popup-copy:hover { opacity: 0.85; }

  .section-header { display: flex; align-items: baseline; gap: 12px; padding: 24px 32px 12px; }
  .section-title  { font-size: 13px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; color: var(--text-muted); }
  .section-meta   { font-size: 12px; color: var(--text-dim); font-family: var(--font-mono); }

  .connect-hero { text-align: center; margin-bottom: 40px; }
  .logo-mark  { font-size: 48px; margin-bottom: 16px; }
  .hero-title { font-size: 36px; font-weight: 800; letter-spacing: -1.5px; margin-bottom: 12px; }
  .hero-sub   { font-size: 16px; color: var(--text-muted); line-height: 1.6; }

  .connect-card { width: 100%; max-width: 480px; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 32px; }
  .connect-card-header { margin-bottom: 24px; }
  .connect-card-header h2 { font-size: 18px; font-weight: 600; margin-bottom: 8px; }
  .connect-card-header p  { font-size: 14px; color: var(--text-muted); line-height: 1.5; }
  .connect-features { margin-top: 24px; display: flex; flex-direction: column; gap: 8px; }
  .connect-feature  { display: flex; gap: 10px; font-size: 13px; color: var(--text-muted); }
  .connect-feature span:first-child { color: var(--accent); }

  .error-card { max-width: 480px; text-align: center; background: var(--surface); border: 1px solid #3d0000; border-radius: 8px; padding: 40px; }
  .error-icon { font-size: 32px; color: var(--amber); margin-bottom: 16px; }
  .error-card h2 { font-size: 20px; margin-bottom: 12px; }
  .error-message { font-size: 14px; color: var(--text-muted); margin-bottom: 24px; font-family: var(--font-mono); }

  .disclaimer { font-size: 12px; color: var(--text-dim); text-align: center; margin-top: 40px; padding: 0 32px; line-height: 1.8; }
  .disclaimer a { color: var(--text-dim); }

  /* BurnBar */
  .burn-bar-wrap { padding: 20px 32px; border-bottom: 1px solid var(--border); }
  .burn-bar-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 10px; flex-wrap: wrap; gap: 8px; }
  .burn-bar-left  { display: flex; align-items: baseline; gap: 12px; }
  .burn-bar-right { display: flex; align-items: baseline; gap: 12px; font-size: 12px; color: var(--text-dim); font-family: var(--font-mono); }
  .burn-label      { font-size: 13px; font-weight: 700; letter-spacing: 0.05em; font-family: var(--font-mono); }
  .burn-projection { font-size: 20px; font-weight: 700; color: var(--text); }
  .burn-track { position: relative; height: 6px; background: var(--surface2); border-radius: 3px; overflow: hidden; }
  .burn-fill-projected { position: absolute; top: 0; left: 0; height: 100%; border-radius: 3px; transition: width 0.6s ease; }
  .burn-fill-current   { position: absolute; top: 0; left: 0; height: 100%; border-radius: 3px; transition: width 0.6s ease; }
  .burn-budget-line    { position: absolute; top: 0; right: 0; width: 2px; height: 100%; background: var(--border); }
  .burn-legend { display: flex; gap: 16px; margin-top: 8px; font-size: 11px; font-family: var(--font-mono); flex-wrap: wrap; }

  /* CostGrid */
  .cost-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1px; background: var(--border); margin: 0 32px 24px; border: 1px solid var(--border); border-radius: 4px; overflow: hidden; }
  .cost-card { background: var(--bg); padding: 20px; display: flex; flex-direction: column; gap: 4px; transition: background 0.15s; }
  .cost-card:hover { background: var(--surface); }
  .cost-card--top  { background: var(--surface); }
  .cost-card--warn { border-left: 2px solid var(--amber); }
  .cost-card--error { border-left: 2px solid var(--red); }
  .cost-card--base { border-left: 2px solid var(--border); }
  .cost-card-header { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
  .cost-card-icon  { font-size: 16px; }
  .cost-card-label { font-size: 12px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; flex: 1; }
  .cost-card-badge { font-size: 9px; font-family: var(--font-mono); padding: 2px 6px; border-radius: 2px; background: var(--surface2); color: var(--amber); border: 1px solid var(--amber); letter-spacing: 0.1em; }
  .cost-card-badge--error { color: var(--red); border-color: var(--red); }
  .cost-card-projected { font-size: 22px; font-weight: 700; color: var(--text); font-family: var(--font-mono); }
  .cost-card-mtd    { font-size: 11px; color: var(--text-dim); font-family: var(--font-mono); }
  .cost-card-detail { font-size: 11px; color: var(--text-dim); margin-top: 4px; }
  .cost-card-error-msg { font-size: 12px; color: var(--red); font-family: var(--font-mono); }

  /* ModelTable */
  .model-table-wrap { margin: 0 32px 24px; }
  .model-table { width: 100%; border-collapse: collapse; font-size: 13px; font-family: var(--font-mono); }
  .model-table th { text-align: left; font-size: 11px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.1em; padding: 8px 12px; border-bottom: 1px solid var(--border); font-weight: 600; }
  .model-table td { padding: 10px 12px; border-bottom: 1px solid #1a1a1a; color: var(--text-muted); }
  .model-table tr:hover td { background: var(--surface); }
  .model-row--top td { color: var(--text); }
  .model-id { max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .model-top-marker { color: var(--amber); }
  .model-cost { color: var(--amber); }
  .text-right { text-align: right; }
  .share-bar-wrap { display: flex; align-items: center; gap: 8px; justify-content: flex-end; }
  .share-bar { height: 4px; background: var(--accent); border-radius: 2px; min-width: 2px; max-width: 60px; opacity: 0.6; }
  .table-disclaimer { font-size: 11px; color: var(--text-dim); margin-top: 12px; font-family: var(--font-mono); }

  @media (max-width: 640px) {
    .dash-header { padding: 12px 16px; flex-direction: column; gap: 12px; align-items: flex-start; }
    .cost-grid { margin: 0 16px 24px; }
    .model-table-wrap { margin: 0 16px 24px; }
    .burn-bar-wrap { padding: 16px; }
  }
`;