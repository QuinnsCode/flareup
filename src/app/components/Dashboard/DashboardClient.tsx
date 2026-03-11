"use client";
/**
 * src/app/components/Dashboard/DashboardClient.tsx
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { ConnectCloudflareAnalytics } from "@/app/components/Dashboard/ConnectCloudflareAnalytics";
import { BurnBar }     from "@/app/components/Dashboard/BurnBar";
import { CostGrid }    from "@/app/components/Dashboard/CostGrid";
import { ModelTable }  from "@/app/components/Dashboard/ModelTable";
import { StatusBoard } from "@/app/components/Dashboard/StatusBoard";
import { SignupModal } from "@/app/components/SignupModal/SignupModal";
import { fetchStoredUsage } from "@/app/serverActions/cf/fetchStoredUsage";
import { authClient } from "@/lib/auth-client";


interface Session { token: string; accountId: string; }
type LoadState = "idle" | "loading" | "loaded" | "error";

// Guest path — token in headers, never stored
async function fetchGuestUsage(session: Session) {
  const res = await fetch("/api/cf/usage", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CF-Token":   session.token,
      "X-CF-Account": session.accountId,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error((data as any).error ?? "Failed to fetch usage");
  return data;
}

async function loadUsage(session: Session) {
  if (session.token === "__stored__") {
    return fetchStoredUsage(session.accountId);
  }
  return fetchGuestUsage(session);
}

// ── Shimmer (client refresh only — server uses DashboardShimmer in Suspense) ──

function Shimmer() {
  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 32px", borderBottom:"1px solid #1a1a1a", background:"#111", height: 57 }}>
        <div style={{ width: 120, height: 20, borderRadius: 3, background: "#1a1a1a" }} />
        <div style={{ display:"flex", gap: 10 }}>
          {[60,70,90,120].map((w,i) => <div key={i} style={{ width: w, height: 30, borderRadius: 3, background: "#1a1a1a" }} />)}
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))", gap:1, background:"#2a2a2a", margin:"24px 32px", border:"1px solid #2a2a2a", borderRadius:4, overflow:"hidden" }}>
        {Array.from({ length: 8 }).map((_,i) => (
          <div key={i} style={{ background:"#0a0a0a", padding:20, display:"flex", flexDirection:"column" as const, gap:8 }}>
            <div style={{ width: 80, height: 12, borderRadius: 3, background: "#1a1a1a" }} />
            <div style={{ width: 100, height: 28, borderRadius: 3, background: "#1a1a1a" }} />
            <div style={{ width: "70%", height: 11, borderRadius: 3, background: "#1a1a1a" }} />
          </div>
        ))}
      </div>
    </div>
  );
}


// ── Not connected ─────────────────────────────────────────────────────────────

function NotConnected({ onConnected, autoFocus }: {
  onConnected: (token: string, accountId: string) => void;
  autoFocus: boolean;
}) {
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
          <ConnectCloudflareAnalytics onConnected={onConnected} autoFocus={autoFocus} />
          <div className="connect-features">
            <div className="connect-feature"><span>◆</span><span>Token verified read-only on connect — write access rejected</span></div>
            <div className="connect-feature"><span>◆</span><span>Lives in your browser tab only — gone when you close it</span></div>
            <div className="connect-feature"><span>◆</span><span>Workers · KV · D1 · R2 · Workers AI · Durable Objects</span></div>
            <div className="connect-feature" style={{ color: "var(--text-dim)", fontStyle: "italic" }}>
              <span>⬡</span><span>Sign up to store your token encrypted and get automatic alerts</span>
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
    } catch {
      const el = document.createElement("textarea");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".share-popup") && !target.closest(".share-trigger")) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div className="share-popup">
      <div className="share-popup-label">Share FlareUp</div>
      <div className="share-popup-row">
        <input className="share-popup-input" readOnly value={url} onFocus={e => e.target.select()} />
        <button className="share-popup-copy" onClick={handleCopy}>{copied ? "✓ Copied" : "Copy"}</button>
      </div>
    </div>
  );
}

// ── Header ────────────────────────────────────────────────────────────────────

function Header({
  session, fetchedAt, onRefresh, onDisconnect, loading,
  appUrl, isSelfHosted, isStoredSession,
  showAlertsCta, onAlertsClick,
  storedAccounts, onSwitchAccount,
}: {
  session: Session; fetchedAt: string;
  onRefresh: () => void; onDisconnect: () => void; loading: boolean;
  appUrl: string; isSelfHosted: boolean; isStoredSession: boolean;
  showAlertsCta: boolean; onAlertsClick: () => void;
  storedAccounts: { id: string; accountId: string; name: string | null }[];
  onSwitchAccount: (accountId: string) => void;
}) {
  const [shareOpen, setShareOpen] = useState(false);

  return (
    <div className="dash-header">
      <div className="dash-header-left">
        <span className="dash-logo">🔥 FlareUp</span>
        <span className="dash-period">
          {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </span>
        {/* Account switcher for logged-in users with multiple accounts */}
        {storedAccounts.length > 1 && storedAccounts.map(a => (
          <button
            key={a.id}
            className={`action-btn ${a.accountId === session.accountId ? "action-btn--alert" : ""}`}
            onClick={() => onSwitchAccount(a.accountId)}
          >
            {a.name ?? a.accountId.slice(0, 8) + "…"}
          </button>
        ))}
      </div>
      <div className="dash-header-right">
        {!isStoredSession && <span className="dash-meta">acct {session.accountId.slice(0, 8)}…</span>}
        {fetchedAt && <span className="dash-meta">{new Date(fetchedAt).toLocaleTimeString()}</span>}
        <button className="action-btn" onClick={onRefresh} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh"}
        </button>
        <div style={{ position: "relative" }}>
          <button className="action-btn share-trigger" onClick={() => setShareOpen(o => !o)}>Share</button>
          {shareOpen && <SharePopup onClose={() => setShareOpen(false)} appUrl={appUrl} />}
        </div>
        <a href="/" className="action-btn">Home</a>
        {isStoredSession
          ? <a href="/alerts" className="action-btn action-btn--alert">Alerts</a>
          : showAlertsCta && !isSelfHosted
            ? <button className="action-btn action-btn--alert" onClick={onAlertsClick}>Get alerts</button>
            : null
        }
        {isStoredSession
          ? <button className="action-btn action-btn--ghost" onClick={() => authClient.signOut().then(() => window.location.href = "/")}>Sign out</button>
          : <button className="action-btn action-btn--ghost" onClick={onDisconnect}>Disconnect</button>
        }
        {isSelfHosted && !isStoredSession && <a href="/alerts" className="action-btn">Alerts</a>}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function DashboardClient({
  appUrl,
  isSelfHosted,
  storedAccounts = [],
  preloadedData = null,
  preloadedAccountId = null,
}: {
  appUrl: string;
  isSelfHosted: boolean;
  storedAccounts?: { id: string; accountId: string; name: string | null }[];
  preloadedData?: any;
  preloadedAccountId?: string | null;
}) {
  const isStoredSession = !!preloadedAccountId;

  const [session, setSession] = useState<Session | null>(
    preloadedAccountId ? { token: "__stored__", accountId: preloadedAccountId } : null
  );
  const [data,      setData]      = useState<any>(preloadedData);
  const [loadState, setLoadState] = useState<LoadState>(preloadedData ? "loaded" : "idle");
  const [error,     setError]     = useState("");
  const [fetchedAt, setFetchedAt] = useState(preloadedData ? new Date().toISOString() : "");
  const [alertsDismissed, setAlertsDismissed] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);
  const isLoadingRef  = useRef(false);

  useEffect(() => {
    setAlertsDismissed(sessionStorage.getItem("alerts-cta-dismissed") === "1");
  }, []);

  const [autoFocus, setAutoFocus] = useState(false);
  useEffect(() => {
    setAutoFocus(new URLSearchParams(window.location.search).get("connect") === "true");
  }, []);

  const dismissAlerts = useCallback(() => {
    sessionStorage.setItem("alerts-cta-dismissed", "1");
    setAlertsDismissed(true);
  }, []);

  const handleConnected = useCallback((token: string, accountId: string) => {
    if (typeof window !== "undefined" && window.location.search.includes("connect")) {
      const url = new URL(window.location.href);
      url.searchParams.delete("connect");
      window.history.replaceState({}, "", url.toString());
    }
    setSession({ token, accountId });
  }, []);

  const handleDisconnect = useCallback(() => {
    setSession(null); setData(null);
    setLoadState("idle"); setError(""); setFetchedAt("");
  }, []);

  const load = useCallback(async (s: Session) => {
    isLoadingRef.current = true;
    setLoadState("loading"); setError("");
    try {
      const result = await loadUsage(s);
      setData(result);
      setFetchedAt(new Date().toISOString());
      setLoadState("loaded");
    } catch (e: any) {
      setError(e.message ?? "Failed to fetch usage");
      setLoadState("error");
    } finally {
      isLoadingRef.current = false;
    }
  }, []);

  const handleSwitchAccount = useCallback((accountId: string) => {
    const newSession = { token: "__stored__", accountId };
    setSession(newSession);
    load(newSession);
  }, [load]);

  // Only load on session change — not on mount if we have preloaded data
  useEffect(() => {
    if (!session) return;
    if (preloadedData && session.accountId === preloadedAccountId) return;
    load(session);
  }, [session]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!session) return <NotConnected onConnected={handleConnected} autoFocus={autoFocus} />;
  if (loadState === "loading") return <Shimmer />;

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
              <button className="action-btn action-btn--ghost" onClick={handleDisconnect}>
                {isStoredSession ? "Back" : "Disconnect"}
              </button>
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
      {!isStoredSession && <SignupModal open={signupOpen} onClose={() => setSignupOpen(false)} />}
      <div className="page">
        <Header
          session={session}
          fetchedAt={fetchedAt}
          onRefresh={() => load(session)}
          onDisconnect={handleDisconnect}
          loading={isLoadingRef.current}
          appUrl={appUrl}
          isSelfHosted={isSelfHosted}
          isStoredSession={isStoredSession}
          showAlertsCta={!alertsDismissed}
          onAlertsClick={() => setSignupOpen(true)}
          storedAccounts={storedAccounts}
          onSwitchAccount={handleSwitchAccount}
        />
        {!isStoredSession && !alertsDismissed && (
          <div className="alerts-banner">
            <span className="alerts-banner-dot" />
            <span className="alerts-banner-text">
              <strong>Tired of checking this tab?</strong> Get paged when your bill spikes — we watch it for you.
            </span>
            <button className="alerts-banner-cta" onClick={() => setSignupOpen(true)}>Get alerts →</button>
            <button className="alerts-banner-dismiss" onClick={dismissAlerts} aria-label="Dismiss">✕</button>
          </div>
        )}
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
        <CostGrid
          costs={costs} projected={projected} usage={usage}
          alertsDismissed={alertsDismissed || isStoredSession}
          onAlertsClick={() => setSignupOpen(true)}
        />
        <ModelTable models={ai.byModel} />
        <p className="disclaimer">
          Estimates only. GraphQL analytics ≠ your Cloudflare invoice.{" "}
          <a href="https://dash.cloudflare.com" target="_blank" rel="noopener noreferrer">
            Verify at dash.cloudflare.com → Billing
          </a>.
          <br />
          <span style={{ color: "var(--text-dim)", fontStyle: "italic" }}>
            {isStoredSession
              ? "// token stored encrypted server-side. never exposed to the browser."
              : "// your token transits our Worker but is never stored. tab close = gone."
            }
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
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(105deg, transparent 40%, rgba(249,115,22,0.07) 50%, transparent 60%);
    background-size: 200% 100%; background-position: 200% 0;
    transition: background-position 0.4s ease;
  }
  .action-btn:hover::after { background-position: -200% 0; }
  .action-btn:hover    { border-color: rgba(249,115,22,0.5); color: var(--accent); }
  .action-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .action-btn:disabled::after { display: none; }
  .action-btn--alert { border-color: rgba(232,93,4,0.4); color: var(--accent); }
  .action-btn--alert:hover { background: rgba(232,93,4,0.08); border-color: var(--accent); }
  .action-btn--primary { border-color: var(--accent); color: var(--accent); }
  .action-btn--ghost   { color: var(--text-dim); }

  .alerts-banner { display: flex; align-items: center; gap: 12px; padding: 10px 32px; background: rgba(232,93,4,0.05); border-bottom: 1px solid rgba(232,93,4,0.15); font-size: 13px; }
  .alerts-banner-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; background: var(--accent); box-shadow: 0 0 6px var(--accent); animation: pulse 2s infinite; }
  .alerts-banner-text { flex: 1; color: var(--text-muted); }
  .alerts-banner-text strong { color: var(--text); }
  .alerts-banner-cta { padding: 5px 14px; border-radius: 3px; background: var(--accent); color: #fff; border: none; font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; transition: opacity 0.15s; white-space: nowrap; }
  .alerts-banner-cta:hover { opacity: 0.85; }
  .alerts-banner-dismiss { background: none; border: none; cursor: pointer; color: var(--text-dim); font-size: 14px; padding: 2px 6px; transition: color 0.15s; flex-shrink: 0; }
  .alerts-banner-dismiss:hover { color: var(--text-muted); }
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(0.8)} }

  .share-popup { position: absolute; top: calc(100% + 8px); right: 0; background: var(--surface); border: 1px solid var(--border); border-radius: 6px; padding: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.6); min-width: 280px; z-index: 100; animation: share-in 0.15s ease; }
  @keyframes share-in { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
  .share-popup-label { font-size: 11px; color: var(--text-dim); font-family: var(--font-mono); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; }
  .share-popup-row   { display: flex; gap: 6px; }
  .share-popup-input { flex: 1; background: var(--bg); border: 1px solid var(--border); border-radius: 4px; padding: 6px 10px; font-size: 13px; font-family: var(--font-mono); color: var(--text); outline: none; }
  .share-popup-input:focus { border-color: var(--accent); }
  .share-popup-copy { padding: 6px 14px; border-radius: 4px; font-size: 13px; background: var(--accent); color: #fff; border: none; cursor: pointer; font-family: var(--font-body); transition: opacity 0.15s; white-space: nowrap; }
  .share-popup-copy:hover { opacity: 0.85; }

  .section-header { display: flex; align-items: baseline; gap: 12px; padding: 24px 32px 12px; }
  .section-title  { font-size: 13px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; color: var(--text-muted); }
  .section-meta   { font-size: 12px; color: var(--text-dim); font-family: var(--font-mono); }

  .connect-hero { text-align: center; margin-bottom: 40px; }
  .logo-mark  { font-size: 48px; margin-bottom: 16px; }
  .hero-title { font-size: 36px; font-weight: 800; letter-spacing: -1.5px; margin-bottom: 12px; }
  .hero-sub   { font-size: 16px; color: var(--text-muted); line-height: 1.6; }

  .connect-card { width: 100%; max-width: 860px; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 32px; }
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