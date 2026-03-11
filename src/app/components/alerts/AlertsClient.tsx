"use client";
// src/app/components/alerts/AlertsClient.tsx

import { useState } from "react";
import type { AlertConfig, WebhookConfig } from "@/lib/alerts/config";
import { saveAlertsConfig, deleteCloudflareToken } from "@/app/pages/alerts/functions";

// ── Types ─────────────────────────────────────────────────────────────────────

type Tier = "free" | "starter" | "pro";

interface ConnectedAccount {
  id: string; accountId: string; name: string | null; createdAt: Date;
}
interface ScanRow {
  id: string; accountId: string; scannedAt: Date;
  costTotal: number; costProjected: number;
  costWorkers: number; costWorkersAI: number;
  costKV: number; costD1: number; costR2: number;
  costDO: number; costQueues: number;
}
interface AlertRow {
  id: string; accountId: string; firedAt: Date;
  alertKey: string; alertType: string; severity: string;
  costAtFire: number; projectedAtFire: number;
  budgetAtFire: number; pctAtFire: number;
  deliveryEmail: boolean; deliveryWebhook: boolean;
}
interface AlertsClientProps {
  initialConfig:     AlertConfig;
  connectedAccounts?: ConnectedAccount[];
  recentScans?:      ScanRow[];
  recentAlerts?:     AlertRow[];
  isSelfHosted?:     boolean;
  userTier?:         Tier;
}

// ── Tier config ───────────────────────────────────────────────────────────────

const TIER_LIMITS = {
  free:    { scanMin: 120, emailsPerDay: 3,         accounts: 2,  cooldownMin: 120, history: false, digest: "tuesday" },
  starter: { scanMin: 20,  emailsPerDay: 12,        accounts: 5,  cooldownMin: 20,  history: true,  digest: "tue+fri" },
  pro:     { scanMin: 3,   emailsPerDay: Infinity,  accounts: Infinity, cooldownMin: 5, history: true, digest: "custom" },
} as const;

const TIER_LABEL: Record<Tier, string> = { free: "Free", starter: "$1 / mo", pro: "$3 / mo" };
const TIER_ORDER: Tier[] = ["free", "starter", "pro"];

// ── Discrete lever values ─────────────────────────────────────────────────────
// Index = tier index (0=free, 1=starter, 2=pro)

const SCAN_FREQ_VALUES  = [120, 20, 3];   // minutes
const COOLDOWN_VALUES   = [120, 20, 5];   // minutes

function tierIndex(t: Tier) { return TIER_ORDER.indexOf(t); }

function requiredTierForIndex(idx: number): Tier {
  return TIER_ORDER[idx];
}

// ── TrashFire ─────────────────────────────────────────────────────────────────

function TrashFire({ tier }: { tier: Tier }) {
  const frames = {
    free:    { emoji: "🔥", can: "🗑️", label: "fully ablaze",   sub: "// your bill is a dumpster fire", color: "#ef4444" },
    starter: { emoji: "🌫️", can: "🗑️", label: "smoldering",     sub: "// you've got eyes on it",        color: "#f48c06" },
    pro:     { emoji: "🪣", can: "🗑️", label: "extinguished",   sub: "// fireproof. nice.",             color: "#22c55e" },
  };
  const f = frames[tier];
  return (
    <div className="trashfire">
      <div className="trashfire-visual">
        <span className="trashfire-can">{f.can}</span>
        <span className="trashfire-flame" style={{ color: f.color }}>{f.emoji}</span>
      </div>
      <div className="trashfire-info">
        <div className="trashfire-label" style={{ color: f.color }}>{f.label.toUpperCase()}</div>
        <div className="trashfire-sub">{f.sub}</div>
        <div className="trashfire-tier">
          {TIER_ORDER.map(t => (
            <span key={t} className={`tier-pip ${tier === t ? "active" : ""}`}
              style={tier === t ? { background: f.color, borderColor: f.color } : {}}>
              {TIER_LABEL[t as Tier]}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── DiscreteLever ─────────────────────────────────────────────────────────────
// values: array of [free_val, starter_val, pro_val]
// valueIndex: current selected index (0–2)
// userTier: what the user actually has — caps what's "owned"

function DiscreteLever({
  label,
  values,
  valueIndex,
  displayValue,
  userTier,
  onChange,
  description,
}: {
  label: string;
  values: number[];
  valueIndex: number;
  displayValue: (v: number) => string;
  userTier: Tier;
  onChange: (idx: number) => void;
  description: string;
}) {
  const userTierIdx = tierIndex(userTier);
  const selectedTier = requiredTierForIndex(valueIndex);
  const isUpgrade = valueIndex > userTierIdx;
  const upgradeLabel = isUpgrade ? TIER_LABEL[selectedTier] : null;
  const pct = (valueIndex / (values.length - 1)) * 100;

  // Tick labels
  const tickLabels = ["Free", "$1/mo", "$3/mo"];

  return (
    <div className="lever">
      <div className="lever-top">
        <span className="lever-label">{label}</span>
        <span className="lever-value" style={{ color: isUpgrade ? "#ef4444" : "var(--orange-l)" }}>
          {displayValue(values[valueIndex])}
        </span>
        {isUpgrade && (
          <span className="lever-lock lever-lock--upgrade">
            ↑ {upgradeLabel}
          </span>
        )}
      </div>
      <div className="lever-track-wrap">
        <input
          type="range"
          min={0}
          max={values.length - 1}
          step={1}
          value={valueIndex}
          className="lever-range"
          style={{
            "--pct": `${pct}%`,
            "--fill": isUpgrade ? "#ef4444" : "var(--orange)",
          } as any}
          onChange={e => onChange(Number(e.target.value))}
        />
        <div className="lever-ticks">
          {tickLabels.map((t, i) => (
            <span
              key={i}
              className={`lever-tick ${i <= userTierIdx ? "owned" : "locked"} ${i === valueIndex ? "selected" : ""}`}
            >
              {t}
            </span>
          ))}
        </div>
      </div>
      {isUpgrade && (
        <div className="lever-upgrade-nudge">
          <span>this setting requires</span>
          <a href="/account/billing" className="upgrade-link">{upgradeLabel} →</a>
        </div>
      )}
      <div className="lever-desc">{description}</div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt$(n: number) { return `$${n.toFixed(2)}`; }
function fmtPct(n: number) { return `${Math.round(n * 100)}%`; }
function fmtTime(d: Date) { return new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }
function fmtDate(d: Date) { return new Date(d).toLocaleDateString([], { month: "short", day: "numeric" }); }
function maskId(id: string) { return id.length < 8 ? id : `${id.slice(0, 4)}••••${id.slice(-4)}`; }

function fmtScanFreq(min: number) {
  if (min < 60) return `every ${min}min`;
  return `every ${min / 60}hr`;
}
function fmtEmails(n: number) { return n === Infinity ? "unlimited" : `${n}/day`; }
function fmtAccounts(n: number) { return n === Infinity ? "unlimited" : `${n} accounts`; }
function fmtCooldown(min: number) {
  if (min < 60) return `${min}min cooldown`;
  return `${min / 60}hr cooldown`;
}

const SEVERITY_COLOR: Record<string, string> = {
  info: "#8a9e8a", warning: "#f48c06", critical: "#ef4444", nuclear: "#dc2626",
};
const SERVICE_LABELS: Record<string, string> = {
  costWorkers: "Workers", costWorkersAI: "AI", costKV: "KV",
  costD1: "D1", costR2: "R2", costDO: "DO", costQueues: "Queues",
};

function detectType(url: string) {
  if (url.includes("hooks.slack.com"))          return "slack";
  if (url.includes("discord.com/api/webhooks")) return "discord";
  if (url.includes("events.pagerduty.com"))     return "pagerduty";
  if (url.includes("webhook.office.com"))       return "teams";
  if (url.includes("linear.app"))               return "linear";
  if (url.includes("api.datadoghq"))            return "datadog";
  return "generic";
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function AlertsClient({
  initialConfig,
  connectedAccounts = [],
  recentScans = [],
  recentAlerts = [],
  isSelfHosted = false,
  userTier = "free",
}: AlertsClientProps) {
  const hasData = connectedAccounts.length > 0 && recentScans.length > 0;
  const [tab, setTab] = useState<"dashboard" | "config">(hasData ? "dashboard" : "config");
  const limits = TIER_LIMITS[userTier];
  const userTierIdx = tierIndex(userTier);

  // Config state
  const [config, setConfig]         = useState<AlertConfig>(initialConfig);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [newName, setNewName]       = useState("");
  const [newUrl, setNewUrl]         = useState("");
  const [testingId, setTestingId]   = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; ok: boolean; msg: string } | null>(null);
  const [accounts, setAccounts]     = useState<ConnectedAccount[]>(connectedAccounts);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Discrete lever indices — default to user's current tier index
  const [scanFreqIdx, setScanFreqIdx] = useState(userTierIdx);
  const [cooldownIdx, setCooldownIdx] = useState(userTierIdx);

  // Dashboard state
  const [selectedAccount, setSelectedAccount] = useState("all");

  // ── Config handlers ─────────────────────────────────────────────────────────
  const save = async () => {
    setSaveStatus("saving");
    try {
      await saveAlertsConfig(config);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch { setSaveStatus("error"); setTimeout(() => setSaveStatus("idle"), 3000); }
  };

  const addWebhook = () => {
    if (!newUrl.trim()) return;
    const webhook: WebhookConfig = {
      id: crypto.randomUUID(),
      name: newName.trim() || detectType(newUrl.trim()),
      url: newUrl.trim(), enabled: true,
    };
    setConfig({ ...config, webhooks: [...config.webhooks, webhook] });
    setNewName(""); setNewUrl("");
  };

  const removeWebhook = (id: string) => {
    setConfig({
      ...config,
      webhooks: config.webhooks.filter(w => w.id !== id),
      tiers: config.tiers.map(t => ({ ...t, webhookIds: t.webhookIds.filter(wid => wid !== id) })),
    });
  };

  const testWebhook = async (webhook: WebhookConfig) => {
    setTestingId(webhook.id); setTestResult(null);
    try {
      const res  = await fetch("/api/alerts/test-webhook", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookUrl: webhook.url, webhookName: webhook.name }),
      });
      const data = await res.json() as any;
      setTestResult({ id: webhook.id, ok: res.ok, msg: res.ok ? "// delivered ✓" : `// failed: ${data.error}` });
    } catch { setTestResult({ id: webhook.id, ok: false, msg: "// network error" }); }
    setTestingId(null);
  };

  const toggleTierWebhook = (tierId: string, webhookId: string, checked: boolean) => {
    setConfig({
      ...config,
      tiers: config.tiers.map(t => {
        if (t.id !== tierId) return t;
        return { ...t, webhookIds: checked ? [...t.webhookIds, webhookId] : t.webhookIds.filter(id => id !== webhookId) };
      }),
    });
  };

  const toggleTier = (tierId: string, enabled: boolean) => {
    setConfig({ ...config, tiers: config.tiers.map(t => t.id === tierId ? { ...t, enabled } : t) });
  };

  const removeAccount = async (id: string) => {
    setDeletingId(id);
    try { await deleteCloudflareToken(id); setAccounts(accounts.filter(a => a.id !== id)); } catch {}
    setDeletingId(null);
  };

  // ── Dashboard computed ──────────────────────────────────────────────────────
  const filteredScans  = selectedAccount === "all" ? recentScans  : recentScans.filter(s => s.accountId === selectedAccount);
  const filteredAlerts = selectedAccount === "all" ? recentAlerts : recentAlerts.filter(a => a.accountId === selectedAccount);
  const latest    = filteredScans[0];
  const prev      = filteredScans[1];
  const costDelta = latest && prev ? latest.costTotal - prev.costTotal : 0;
  const sparkData = [...filteredScans].reverse().slice(-12).map(s => s.costTotal);
  const sparkMax  = Math.max(...sparkData, 0.01);
  const services  = latest ? Object.entries(SERVICE_LABELS).map(([key, label]) => ({
    label, value: (latest as any)[key] as number,
  })).filter(s => s.value > 0).sort((a, b) => b.value - a.value) : [];

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="alerts-wrap">
        <div className="alerts-inner">

          {/* Nav */}
          <div className="alerts-nav">
            <div className="alerts-nav-left">
              <span className="alerts-logo">🔥 FlareUp</span>
              {hasData && (
                <div className="tab-group">
                  <button className={`tab-btn ${tab === "dashboard" ? "active" : ""}`} onClick={() => setTab("dashboard")}>Dashboard</button>
                  <button className={`tab-btn ${tab === "config" ? "active" : ""}`} onClick={() => setTab("config")}>Config</button>
                </div>
              )}
            </div>
            <div className="alerts-nav-right">
              {tab === "config" && saveStatus !== "idle" && (
                <span className={`save-status ${saveStatus === "saved" ? "saved" : saveStatus === "error" ? "error" : ""}`}>
                  {saveStatus === "saving" ? "// saving..." : saveStatus === "saved" ? "// saved ✓" : "// save failed"}
                </span>
              )}
              <a href="/dashboard"><button className="btn-ghost">← Dashboard</button></a>
              {tab === "config" && <button className="btn-primary" onClick={save} disabled={saveStatus === "saving"}>Save Config</button>}
            </div>
          </div>

          {/* ── DASHBOARD ─────────────────────────────────────────────────── */}
          {tab === "dashboard" && (
            <div>
              <div className="page-header">
                <div className="page-title">Alert Dashboard</div>
                <div className="page-sub">// real-time Cloudflare cost monitoring</div>
              </div>

              {accounts.length > 1 && (
                <div className="account-tabs">
                  <button className={`acct-tab ${selectedAccount === "all" ? "active" : ""}`} onClick={() => setSelectedAccount("all")}>All accounts</button>
                  {accounts.map(a => (
                    <button key={a.id} className={`acct-tab ${selectedAccount === a.accountId ? "active" : ""}`} onClick={() => setSelectedAccount(a.accountId)}>
                      {a.name || maskId(a.accountId)}
                    </button>
                  ))}
                </div>
              )}

              <div className="stat-grid">
                <div className="stat-card">
                  <div className="stat-label">// current spend</div>
                  <div className="stat-value">{latest ? fmt$(latest.costTotal) : "—"}</div>
                  {costDelta !== 0 && <div className={`stat-delta ${costDelta > 0 ? "up" : "down"}`}>{costDelta > 0 ? "▲" : "▼"} {fmt$(Math.abs(costDelta))} vs prev scan</div>}
                </div>
                <div className="stat-card">
                  <div className="stat-label">// projected month-end</div>
                  <div className="stat-value">{latest ? fmt$(latest.costProjected) : "—"}</div>
                  {latest && config.monthlyBudget > 0 && <div className="stat-sub">{fmtPct(latest.costProjected / config.monthlyBudget)} of ${config.monthlyBudget} budget</div>}
                </div>
                <div className="stat-card">
                  <div className="stat-label">// alerts fired</div>
                  <div className="stat-value">{filteredAlerts.length}</div>
                  <div className="stat-sub">last {recentAlerts.length} logged</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">// budget</div>
                  <div className="stat-value">{config.monthlyBudget > 0 ? fmt$(config.monthlyBudget) : "not set"}</div>
                  {latest && config.monthlyBudget > 0 && (
                    <div className="stat-sub progress-wrap">
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${Math.min(100, (latest.costTotal / config.monthlyBudget) * 100)}%`, background: latest.costTotal / config.monthlyBudget > 0.75 ? "#ef4444" : "#e85d04" }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="dash-cols">
                <div className="dash-col">
                  <div className="section">
                    <div className="section-label">Cost trend — last {sparkData.length} scans</div>
                    <div className="card">
                      {sparkData.length > 1 ? (
                        <div className="sparkline-wrap">
                          <svg viewBox={`0 0 ${sparkData.length * 20} 60`} className="sparkline-svg" preserveAspectRatio="none">
                            <polyline points={sparkData.map((v, i) => `${i * 20 + 10},${60 - (v / sparkMax) * 50}`).join(" ")} fill="none" stroke="#e85d04" strokeWidth="1.5" strokeLinejoin="round" />
                            {sparkData.map((v, i) => <circle key={i} cx={i * 20 + 10} cy={60 - (v / sparkMax) * 50} r="2.5" fill="#e85d04" />)}
                          </svg>
                          <div className="sparkline-labels"><span>{fmt$(Math.min(...sparkData))}</span><span>{fmt$(Math.max(...sparkData))}</span></div>
                        </div>
                      ) : <div className="empty-inline">// need 2+ scans for trend</div>}
                    </div>
                  </div>
                  {services.length > 0 && (
                    <div className="section">
                      <div className="section-label">Service breakdown — latest scan</div>
                      <div className="card">
                        {services.map(s => (
                          <div key={s.label} className="service-row">
                            <span className="service-label">{s.label}</span>
                            <div className="service-bar-wrap"><div className="service-bar" style={{ width: `${(s.value / (latest?.costTotal || 1)) * 100}%` }} /></div>
                            <span className="service-value">{fmt$(s.value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="dash-col">
                  <div className="section">
                    <div className="section-label">Recent alerts</div>
                    <div className="card" style={{ padding: 0 }}>
                      {filteredAlerts.length === 0 ? (
                        <div className="empty-inline" style={{ padding: 24 }}>// no alerts fired yet</div>
                      ) : (
                        <div className="alert-list">
                          {filteredAlerts.map(a => (
                            <div key={a.id} className="alert-row">
                              <div className="alert-row-top">
                                <span className="alert-severity" style={{ color: SEVERITY_COLOR[a.severity] ?? "#8a9e8a" }}>{a.severity}</span>
                                <span className="alert-key">{a.alertKey}</span>
                                <span className="alert-time">{fmtDate(a.firedAt)} {fmtTime(a.firedAt)}</span>
                              </div>
                              <div className="alert-row-bot">
                                <span>spend {fmt$(a.costAtFire)}</span><span>→</span>
                                <span>projected {fmt$(a.projectedAtFire)}</span>
                                <span className="alert-acct">{maskId(a.accountId)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="section">
                    <div className="section-label">Scan history</div>
                    <div className="card" style={{ padding: 0 }}>
                      <div className="scan-list">
                        {filteredScans.slice(0, 10).map(s => (
                          <div key={s.id} className="scan-row">
                            <span className="scan-time">{fmtDate(s.scannedAt)} {fmtTime(s.scannedAt)}</span>
                            <span className="scan-acct">{maskId(s.accountId)}</span>
                            <span className="scan-cost">{fmt$(s.costTotal)}</span>
                            <span className="scan-proj" title="projected">{fmt$(s.costProjected)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── CONFIG ────────────────────────────────────────────────────── */}
          {tab === "config" && (
            <div>
              <div className="page-header">
                <div className="page-title">Alert Config</div>
                <div className="page-sub">// configure thresholds, webhooks, and monitoring levers</div>
              </div>

              {/* Trash fire */}
              <div className="section">
                <TrashFire tier={userTier} />
              </div>

              {/* Monitoring levers */}
              <div className="section">
                <div className="section-label">Monitoring levers</div>
                <div className="card levers-card">

                  <DiscreteLever
                    label="Scan frequency"
                    values={SCAN_FREQ_VALUES}
                    valueIndex={scanFreqIdx}
                    displayValue={fmtScanFreq}
                    userTier={userTier}
                    onChange={setScanFreqIdx}
                    description="How often FlareUp checks your Cloudflare usage. Free: 2hr · $1: 20min · $3: 3min"
                  />

                  {/* Alert emails — read-only display, no slider (tier-fixed) */}
                  <div className="lever">
                    <div className="lever-top">
                      <span className="lever-label">Alert emails / day</span>
                      <span className="lever-value">{fmtEmails(limits.emailsPerDay)}</span>
                      {userTier === "free" && <span className="lever-lock">↑ $1 / mo</span>}
                    </div>
                    <div className="lever-static-bar">
                      <div className="lever-static-fill" style={{ width: userTier === "free" ? "33%" : userTier === "starter" ? "66%" : "100%" }} />
                      <div className="lever-ticks">
                        <span className="lever-tick owned selected">3/day</span>
                        <span className={`lever-tick ${userTierIdx >= 1 ? "owned selected" : "locked"}`}>12/day</span>
                        <span className={`lever-tick ${userTierIdx >= 2 ? "owned selected" : "locked"}`}>∞</span>
                      </div>
                    </div>
                    <div className="lever-desc">Max alert emails per day. Free: 3 · $1: 12 · $3: unlimited</div>
                  </div>

                  {/* Connected accounts — read-only display */}
                  <div className="lever">
                    <div className="lever-top">
                      <span className="lever-label">Connected accounts</span>
                      <span className="lever-value">{fmtAccounts(limits.accounts)}</span>
                      {userTier === "free" && <span className="lever-lock">↑ $1 / mo</span>}
                    </div>
                    <div className="lever-static-bar">
                      <div className="lever-static-fill" style={{ width: userTier === "free" ? "33%" : userTier === "starter" ? "66%" : "100%" }} />
                      <div className="lever-ticks">
                        <span className="lever-tick owned selected">2</span>
                        <span className={`lever-tick ${userTierIdx >= 1 ? "owned selected" : "locked"}`}>5</span>
                        <span className={`lever-tick ${userTierIdx >= 2 ? "owned selected" : "locked"}`}>∞</span>
                      </div>
                    </div>
                    <div className="lever-desc">Number of Cloudflare accounts you can monitor. Free: 2 · $1: 5 · $3: unlimited</div>
                  </div>

                  <DiscreteLever
                    label="Alert cooldown"
                    values={COOLDOWN_VALUES}
                    valueIndex={cooldownIdx}
                    displayValue={fmtCooldown}
                    userTier={userTier}
                    onChange={setCooldownIdx}
                    description="Minimum time between repeated alerts for the same threshold. Free: 2hr · $1: 20min · $3: 5min"
                  />

                  {/* Digest row */}
                  <div className="lever">
                    <div className="lever-top">
                      <span className="lever-label">Digest emails</span>
                      <span className="lever-value">
                        {userTier === "free" ? "Tuesday Terrors" : userTier === "starter" ? "Tue + Fri" : "custom schedule"}
                      </span>
                      {userTier === "free" && <span className="lever-lock">↑ $1 / mo</span>}
                    </div>
                    <div className="digest-chips">
                      <span className="digest-chip active">Tuesday Terrors</span>
                      <span className={`digest-chip ${userTier !== "free" ? "active" : "locked"}`}>
                        Flareup Fridays {userTier === "free" && "🔒"}
                      </span>
                      <span className={`digest-chip ${userTier === "pro" ? "active" : "locked"}`}>
                        Custom schedule {userTier !== "pro" && "🔒"}
                      </span>
                    </div>
                    <div className="lever-desc">Weekly health digests. Free: Tuesdays · $1: + Fridays · $3: custom</div>
                  </div>

                  {/* History row */}
                  <div className="lever">
                    <div className="lever-top">
                      <span className="lever-label">Alert history</span>
                      <span className="lever-value">
                        {userTier === "free" ? "none" : userTier === "starter" ? "90 days" : "full history"}
                      </span>
                      {userTier === "free" && <span className="lever-lock">↑ $1 / mo</span>}
                    </div>
                    <div className="history-bar">
                      <div className="history-fill" style={{
                        width: userTier === "free" ? "0%" : userTier === "starter" ? "50%" : "100%",
                        background: userTier === "pro" ? "#22c55e" : "#e85d04",
                      }} />
                    </div>
                    <div className="lever-desc">How long alert history is retained. Free: none · $1: 90 days · $3: unlimited</div>
                  </div>

                  {userTier !== "pro" && (
                    <div className="upgrade-nudge">
                      <span>want more fire control?</span>
                      <a href="/account/billing" className="upgrade-link">upgrade plan →</a>
                    </div>
                  )}
                </div>
              </div>

              {/* Connected accounts */}
              {!isSelfHosted && (
                <div className="section">
                  <div className="section-label">Connected Cloudflare accounts</div>
                  <div className="card card-orange">
                    {accounts.length === 0 ? (
                      <div className="empty-state">
                        <div className="empty-title">No accounts connected</div>
                        <div className="empty-desc">// add a Cloudflare API token to start monitoring</div>
                      </div>
                    ) : (
                      <div className="account-list">
                        {accounts.map(a => (
                          <AccountRow key={a.id} account={a} deleting={deletingId === a.id} onDelete={() => removeAccount(a.id)} />
                        ))}
                      </div>
                    )}
                    <button className="btn-small" onClick={() => window.location.href = "/dashboard"} style={{ marginTop: accounts.length ? 12 : 0 }}>
                      + Connect account
                    </button>
                  </div>
                </div>
              )}

              {/* Budget */}
              <div className="section">
                <div className="section-label">Monthly budget</div>
                <div className="card">
                  <div className="budget-row">
                    <span className="input-prefix">$</span>
                    <input className="budget-input" type="number" min={0} step={1}
                      value={config.monthlyBudget}
                      onChange={e => setConfig({ ...config, monthlyBudget: Number(e.target.value) })} />
                    <span className="budget-desc">// alerts fire when projected spend crosses threshold</span>
                  </div>
                </div>
              </div>

              {/* Alert tiers */}
              <div className="section">
                <div className="section-label">Alert thresholds</div>
                <div className="card">
                  <div className="tiers-grid">
                    {config.tiers.map(tier => (
                      <div key={tier.id} className={`tier-card ${tier.enabled ? "active" : ""}`}>
                        <div className={`tier-pct ${tier.budgetPercent >= 1 ? "critical" : ""}`}>{fmtPct(tier.budgetPercent)}</div>
                        <div className="tier-name">{tier.name}</div>
                        <div className="tier-dollar">{config.monthlyBudget > 0 ? fmt$(config.monthlyBudget * tier.budgetPercent) : "—"}</div>
                        <label className="tier-toggle">
                          <input type="checkbox" checked={tier.enabled} onChange={e => toggleTier(tier.id, e.target.checked)} />
                          {tier.enabled ? "enabled" : "disabled"}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Webhooks */}
              <div className="section">
                <div className="section-label">Webhook destinations</div>
                <div className="card">
                  {config.webhooks.length > 0 && (
                    <div className="webhook-list">
                      {config.webhooks.map(w => (
                        <div key={w.id} className="webhook-row">
                          <span className={`webhook-type ${detectType(w.url)}`}>{detectType(w.url)}</span>
                          <span className="webhook-name">{w.name}</span>
                          <span className="webhook-url">{w.url}</span>
                          <button className="btn-small" disabled={testingId === w.id} onClick={() => testWebhook(w)}>{testingId === w.id ? "..." : "test"}</button>
                          <button className="webhook-del" onClick={() => removeWebhook(w.id)}>×</button>
                          {testResult?.id === w.id && <span className={`test-result ${testResult.ok ? "ok" : "error"}`}>{testResult.msg}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="add-webhook">
                    <div className="add-webhook-row">
                      <input className="field-input name" placeholder="// name (optional)" value={newName} onChange={e => setNewName(e.target.value)} />
                      <input className="field-input" placeholder="// webhook url" value={newUrl} onChange={e => setNewUrl(e.target.value)} />
                      <button className="btn-small" onClick={addWebhook} disabled={!newUrl.trim()}>Add</button>
                    </div>
                  </div>
                </div>
              </div>

              {config.webhooks.length > 0 && (
                <div className="section">
                  <div className="section-label">Assign webhooks to tiers</div>
                  <div className="card">
                    <div className="assign-grid">
                      {config.tiers.map(tier => (
                        <div key={tier.id} className="assign-card">
                          <div className="assign-tier-name">{fmtPct(tier.budgetPercent)} — {tier.name}</div>
                          {config.webhooks.map(w => (
                            <label key={w.id} className="assign-webhook-item">
                              <input type="checkbox" checked={tier.webhookIds.includes(w.id)} onChange={e => toggleTierWebhook(tier.id, w.id, e.target.checked)} />
                              {w.name}
                            </label>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </>
  );
}

// ── AccountRow ────────────────────────────────────────────────────────────────

function AccountRow({ account, deleting, onDelete }: { account: ConnectedAccount; deleting: boolean; onDelete: () => void }) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied]     = useState(false);
  const masked = `${account.accountId.slice(0, 4)}••••${account.accountId.slice(-4)}`;
  const copy = () => {
    navigator.clipboard.writeText(account.accountId).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
  };
  return (
    <div className="account-row">
      <span className="account-icon">☁</span>
      <div className="account-info">
        <div className="account-name">{account.name || "Unnamed account"}</div>
        <div className="account-id">
          <span style={{ cursor: "pointer" }} onClick={() => setRevealed(v => !v)}>{revealed ? account.accountId : masked}</span>
          <button className="id-copy" onClick={copy}>{copied ? "✓" : "copy"}</button>
        </div>
      </div>
      <span className="account-badge">connected</span>
      <button className="webhook-del" disabled={deleting} onClick={onDelete} style={{ marginLeft: 8 }}>{deleting ? "…" : "×"}</button>
    </div>
  );
}

// ── CSS ───────────────────────────────────────────────────────────────────────

const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #060a06; }
  :root {
    --orange: #e85d04; --orange-l: #f48c06; --red-l: #ef4444; --green-l: #22c55e;
    --bg: #060a06; --bg-2: #0a0f0a; --bg-3: #0f160f;
    --border: rgba(255,255,255,0.05); --border-o: rgba(232,93,4,0.2);
    --text: #e8f0e8; --text-2: #8a9e8a; --text-3: #3a4e3a;
    --mono: 'Share Tech Mono', monospace;
  }
  .alerts-wrap { min-height: 100vh; background: var(--bg); color: var(--text); font-family: 'Barlow', sans-serif; padding: 0 52px 80px; }
  .alerts-inner { max-width: 980px; margin: 0 auto; }
  .alerts-nav { display: flex; align-items: center; justify-content: space-between; padding: 16px 0; border-bottom: 1px solid var(--border-o); margin-bottom: 40px; position: sticky; top: 0; z-index: 10; background: var(--bg); }
  .alerts-nav-left { display: flex; align-items: center; gap: 20px; }
  .alerts-nav-right { display: flex; align-items: center; gap: 8px; }
  .alerts-logo { font-family: var(--mono); font-size: 13px; color: var(--orange-l); }
  .tab-group { display: flex; gap: 2px; background: var(--bg-3); border: 1px solid var(--border-o); border-radius: 3px; padding: 2px; }
  .tab-btn { background: none; border: none; color: var(--text-3); font-family: var(--mono); font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; padding: 6px 14px; cursor: pointer; border-radius: 2px; transition: all 0.15s; }
  .tab-btn:hover { color: var(--text-2); }
  .tab-btn.active { background: var(--orange); color: #fff; }
  .page-header { margin-bottom: 32px; }
  .page-title { font-family: 'Barlow Condensed', sans-serif; font-size: 28px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; }
  .page-sub { font-size: 12px; color: var(--text-3); margin-top: 4px; font-family: var(--mono); }

  /* Trash fire */
  .trashfire { display: flex; align-items: center; gap: 24px; background: var(--bg-2); border: 1px solid var(--border-o); border-radius: 4px; padding: 20px 24px; margin-bottom: 4px; }
  .trashfire-visual { position: relative; font-size: 40px; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; }
  .trashfire-can { font-size: 36px; }
  .trashfire-flame { position: absolute; top: -10px; right: -6px; font-size: 24px; }
  .trashfire-info { flex: 1; }
  .trashfire-label { font-family: 'Barlow Condensed', sans-serif; font-size: 20px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; }
  .trashfire-sub { font-family: var(--mono); font-size: 11px; color: var(--text-3); margin-top: 2px; }
  .trashfire-tier { display: flex; gap: 6px; margin-top: 10px; }
  .tier-pip { font-family: var(--mono); font-size: 10px; padding: 4px 10px; border: 1px solid var(--border); border-radius: 2px; color: var(--text-3); transition: all 0.2s; }
  .tier-pip.active { color: #fff; }

  /* Levers */
  .levers-card { display: flex; flex-direction: column; gap: 0; padding: 0; overflow: hidden; }
  .lever { padding: 18px 20px; border-bottom: 1px solid var(--border); }
  .lever:last-child { border-bottom: none; }
  .lever-top { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
  .lever-label { font-family: var(--mono); font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-2); flex: 1; }
  .lever-value { font-family: 'Barlow Condensed', sans-serif; font-size: 16px; font-weight: 700; color: var(--orange-l); letter-spacing: 0.06em; }
  .lever-lock { font-family: var(--mono); font-size: 10px; color: var(--text-3); background: var(--bg-3); border: 1px solid var(--border); border-radius: 2px; padding: 2px 8px; }
  .lever-lock--upgrade { color: #ef4444; border-color: rgba(239,68,68,0.3); background: rgba(239,68,68,0.08); }

  /* Discrete range */
  .lever-track-wrap { margin-bottom: 4px; }
  .lever-range {
    -webkit-appearance: none; appearance: none;
    width: 100%; height: 4px; border-radius: 2px; outline: none; cursor: pointer;
    background: linear-gradient(to right, var(--fill, var(--orange)) 0%, var(--fill, var(--orange)) var(--pct, 0%), var(--bg-3) var(--pct, 0%), var(--bg-3) 100%);
  }
  .lever-range::-webkit-slider-thumb {
    -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%;
    background: var(--fill, var(--orange-l)); border: 2px solid var(--bg);
    box-shadow: 0 0 0 2px var(--fill, var(--orange));
    cursor: pointer;
  }

  /* Tick labels under discrete slider */
  .lever-ticks { display: flex; justify-content: space-between; margin-top: 6px; }
  .lever-tick { font-family: var(--mono); font-size: 10px; color: var(--text-3); }
  .lever-tick.owned { color: var(--text-3); }
  .lever-tick.locked { color: var(--text-3); opacity: 0.4; }
  .lever-tick.selected { color: var(--orange-l); font-weight: bold; }
  .lever-tick.locked.selected { color: #ef4444; }

  /* Inline upgrade nudge on lever */
  .lever-upgrade-nudge {
    display: flex; align-items: center; gap: 8px;
    font-family: var(--mono); font-size: 10px; color: #ef4444;
    background: rgba(239,68,68,0.06); border: 1px solid rgba(239,68,68,0.2);
    border-radius: 2px; padding: 6px 12px; margin: 6px 0;
  }
  .upgrade-link { color: var(--orange-l); text-decoration: none; font-weight: bold; }
  .upgrade-link:hover { text-decoration: underline; }

  /* Static bar (read-only levers) */
  .lever-static-bar { margin-bottom: 4px; }
  .lever-static-fill { height: 4px; background: var(--orange); border-radius: 2px; margin-bottom: 6px; transition: width 0.3s; }

  .lever-desc { font-family: var(--mono); font-size: 10px; color: var(--text-3); letter-spacing: 0.04em; margin-top: 6px; }

  /* Digest chips */
  .digest-chips { display: flex; gap: 6px; margin-bottom: 8px; flex-wrap: wrap; }
  .digest-chip { font-family: var(--mono); font-size: 10px; padding: 4px 10px; border-radius: 2px; border: 1px solid var(--border); color: var(--text-3); }
  .digest-chip.active { border-color: var(--border-o); color: var(--orange-l); background: rgba(232,93,4,0.06); }
  .digest-chip.locked { opacity: 0.4; }

  /* History bar */
  .history-bar { height: 4px; background: var(--bg-3); border-radius: 2px; overflow: hidden; margin-bottom: 8px; }
  .history-fill { height: 100%; border-radius: 2px; transition: width 0.4s; }

  /* Bottom upgrade nudge */
  .upgrade-nudge { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 14px 20px; background: rgba(232,93,4,0.04); border-top: 1px solid var(--border-o); font-family: var(--mono); font-size: 11px; color: var(--text-3); }

  /* Dashboard */
  .account-tabs { display: flex; gap: 4px; margin-bottom: 24px; flex-wrap: wrap; }
  .acct-tab { background: var(--bg-3); border: 1px solid var(--border); border-radius: 3px; color: var(--text-3); font-family: var(--mono); font-size: 11px; padding: 6px 14px; cursor: pointer; transition: all 0.15s; }
  .acct-tab:hover { border-color: var(--border-o); color: var(--text-2); }
  .acct-tab.active { border-color: var(--orange); color: var(--orange-l); background: rgba(232,93,4,0.06); }
  .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 32px; }
  .stat-card { background: var(--bg-2); border: 1px solid var(--border-o); border-radius: 4px; padding: 18px 20px; }
  .stat-label { font-family: var(--mono); font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--text-3); margin-bottom: 8px; }
  .stat-value { font-family: 'Barlow Condensed', sans-serif; font-size: 28px; font-weight: 700; color: var(--text); letter-spacing: 0.04em; }
  .stat-delta { font-family: var(--mono); font-size: 11px; margin-top: 4px; }
  .stat-delta.up { color: var(--red-l); }
  .stat-delta.down { color: var(--green-l); }
  .stat-sub { font-family: var(--mono); font-size: 10px; color: var(--text-3); margin-top: 6px; }
  .progress-wrap { margin-top: 10px; }
  .progress-bar { height: 3px; background: var(--bg-3); border-radius: 2px; overflow: hidden; }
  .progress-fill { height: 100%; border-radius: 2px; transition: width 0.3s; }
  .dash-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
  .dash-col { display: flex; flex-direction: column; }
  .sparkline-wrap { display: flex; flex-direction: column; gap: 8px; }
  .sparkline-svg { width: 100%; height: 60px; display: block; }
  .sparkline-labels { display: flex; justify-content: space-between; font-family: var(--mono); font-size: 10px; color: var(--text-3); }
  .service-row { display: flex; align-items: center; gap: 10px; padding: 6px 0; border-bottom: 1px solid var(--border); }
  .service-row:last-child { border-bottom: none; }
  .service-label { font-family: var(--mono); font-size: 11px; color: var(--text-2); width: 80px; flex-shrink: 0; }
  .service-bar-wrap { flex: 1; height: 4px; background: var(--bg-3); border-radius: 2px; overflow: hidden; }
  .service-bar { height: 100%; background: var(--orange); border-radius: 2px; }
  .service-value { font-family: var(--mono); font-size: 11px; color: var(--text-3); width: 60px; text-align: right; }
  .alert-list { display: flex; flex-direction: column; }
  .alert-row { padding: 12px 16px; border-bottom: 1px solid var(--border); }
  .alert-row:last-child { border-bottom: none; }
  .alert-row-top { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
  .alert-severity { font-family: var(--mono); font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; font-weight: 700; }
  .alert-key { font-family: var(--mono); font-size: 11px; color: var(--text-2); flex: 1; }
  .alert-time { font-family: var(--mono); font-size: 10px; color: var(--text-3); }
  .alert-row-bot { display: flex; align-items: center; gap: 8px; font-family: var(--mono); font-size: 10px; color: var(--text-3); }
  .alert-acct { margin-left: auto; }
  .empty-inline { font-family: var(--mono); font-size: 11px; color: var(--text-3); }
  .scan-list { display: flex; flex-direction: column; }
  .scan-row { display: flex; align-items: center; gap: 12px; padding: 10px 16px; border-bottom: 1px solid var(--border); font-family: var(--mono); font-size: 11px; }
  .scan-row:last-child { border-bottom: none; }
  .scan-time { color: var(--text-3); flex: 1; }
  .scan-acct { color: var(--text-3); }
  .scan-cost { color: var(--text); min-width: 60px; text-align: right; }
  .scan-proj { color: var(--text-3); min-width: 60px; text-align: right; }

  /* Shared */
  .save-status { font-family: var(--mono); font-size: 11px; color: var(--text-3); letter-spacing: 0.1em; padding: 0 8px; }
  .save-status.saved { color: var(--green-l); }
  .save-status.error { color: var(--red-l); }
  .section { margin-bottom: 28px; }
  .section-label { font-family: var(--mono); font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--text-3); margin-bottom: 12px; display: flex; align-items: center; gap: 10px; }
  .section-label::after { content: ''; flex: 1; height: 1px; background: var(--border); }
  .card { background: var(--bg-2); border: 1px solid var(--border); border-radius: 4px; padding: 20px; }
  .card-orange { border-color: var(--border-o); border-top: 2px solid var(--orange); }
  .account-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
  .account-row { display: flex; align-items: center; gap: 12px; background: var(--bg-3); border: 1px solid var(--border-o); border-radius: 3px; padding: 12px 16px; }
  .account-icon { font-size: 20px; color: var(--orange-l); flex-shrink: 0; }
  .account-info { flex: 1; }
  .account-name { font-family: var(--mono); font-size: 13px; color: var(--text); }
  .account-id { font-family: var(--mono); font-size: 10px; color: var(--text-3); margin-top: 2px; display: flex; align-items: center; gap: 8px; }
  .account-badge { font-family: var(--mono); font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--green-l); padding: 3px 8px; border: 1px solid rgba(34,197,94,0.2); border-radius: 2px; }
  .id-copy { background: none; border: none; color: var(--text-3); cursor: pointer; font-family: var(--mono); font-size: 10px; padding: 0 4px; transition: color 0.15s; }
  .id-copy:hover { color: var(--text-2); }
  .empty-state { text-align: center; padding: 20px 0; }
  .empty-title { font-family: 'Barlow Condensed', sans-serif; font-size: 18px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-2); }
  .empty-desc { font-family: var(--mono); font-size: 11px; color: var(--text-3); margin-top: 6px; }
  .budget-row { display: flex; align-items: center; gap: 12px; }
  .input-prefix { font-family: var(--mono); font-size: 18px; color: var(--orange-l); }
  .budget-input { background: var(--bg-3); border: 1px solid var(--border-o); border-radius: 3px; color: var(--text); font-family: var(--mono); font-size: 24px; padding: 10px 16px; width: 160px; outline: none; transition: border-color 0.15s; }
  .budget-input:focus { border-color: var(--orange-l); }
  .budget-desc { font-size: 12px; color: var(--text-3); font-family: var(--mono); }
  .tiers-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
  .tier-card { background: var(--bg-3); border: 1px solid var(--border); border-radius: 3px; padding: 14px; display: flex; flex-direction: column; gap: 6px; }
  .tier-card.active { border-color: var(--border-o); }
  .tier-pct { font-family: var(--mono); font-size: 20px; color: var(--orange-l); }
  .tier-pct.critical { color: var(--red-l); }
  .tier-name { font-size: 11px; font-family: var(--mono); color: var(--text-2); text-transform: uppercase; letter-spacing: 0.1em; }
  .tier-dollar { font-family: var(--mono); font-size: 11px; color: var(--text-3); }
  .tier-toggle { display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 11px; color: var(--text-3); font-family: var(--mono); }
  .tier-toggle input { cursor: pointer; accent-color: var(--orange); }
  .webhook-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
  .webhook-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; background: var(--bg-3); border: 1px solid var(--border); border-radius: 3px; padding: 10px 14px; font-family: var(--mono); font-size: 12px; }
  .webhook-name { color: var(--text-2); min-width: 100px; }
  .webhook-url { color: var(--text-3); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .webhook-type { font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; padding: 2px 8px; border-radius: 2px; border: 1px solid var(--border); color: var(--text-3); }
  .webhook-type.slack   { color: #4ade80; border-color: rgba(74,222,128,0.2); }
  .webhook-type.discord { color: #818cf8; border-color: rgba(129,140,248,0.2); }
  .webhook-type.pagerduty { color: #22d3ee; border-color: rgba(34,211,238,0.2); }
  .webhook-type.teams   { color: #60a5fa; border-color: rgba(96,165,250,0.2); }
  .webhook-type.linear  { color: #a78bfa; border-color: rgba(167,139,250,0.2); }
  .webhook-type.datadog { color: #fb923c; border-color: rgba(251,146,60,0.2); }
  .webhook-type.generic { color: var(--orange-l); border-color: var(--border-o); }
  .webhook-del { background: none; border: none; color: var(--text-3); cursor: pointer; font-size: 16px; padding: 0 4px; transition: color 0.15s; }
  .webhook-del:hover { color: var(--red-l); }
  .add-webhook { display: flex; flex-direction: column; gap: 8px; padding: 14px; background: var(--bg-3); border: 1px dashed var(--border-o); border-radius: 3px; }
  .add-webhook-row { display: flex; gap: 8px; }
  .field-input { background: var(--bg); border: 1px solid var(--border-o); border-radius: 3px; color: var(--text); font-family: var(--mono); font-size: 12px; padding: 8px 12px; outline: none; transition: border-color 0.15s; width: 100%; }
  .field-input:focus { border-color: var(--orange-l); }
  .field-input::placeholder { color: var(--text-3); }
  .field-input.name { width: 160px; flex-shrink: 0; }
  .assign-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
  .assign-card { background: var(--bg-3); border: 1px solid var(--border); border-radius: 3px; padding: 12px; }
  .assign-tier-name { font-family: var(--mono); font-size: 11px; color: var(--text-2); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; }
  .assign-webhook-item { display: flex; align-items: center; gap: 6px; font-family: var(--mono); font-size: 11px; color: var(--text-3); cursor: pointer; padding: 2px 0; }
  .assign-webhook-item input { accent-color: var(--orange); cursor: pointer; }
  .btn-primary { background: var(--orange); border: 1px solid var(--orange); border-radius: 3px; color: #fff; font-family: 'Barlow Condensed', sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; padding: 9px 20px; cursor: pointer; transition: all 0.15s; }
  .btn-primary:hover { background: var(--orange-l); }
  .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
  .btn-ghost { background: transparent; border: 1px solid var(--border-o); border-radius: 3px; color: var(--text-2); font-family: 'Barlow Condensed', sans-serif; font-size: 12px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; padding: 9px 20px; cursor: pointer; transition: all 0.15s; text-decoration: none; display: inline-block; }
  .btn-ghost:hover { color: var(--text); border-color: var(--orange-l); }
  .btn-small { background: var(--orange); border: none; border-radius: 3px; color: #fff; font-family: var(--mono); font-size: 11px; padding: 7px 14px; cursor: pointer; transition: opacity 0.15s; white-space: nowrap; }
  .btn-small:hover { opacity: 0.85; }
  .btn-small:disabled { opacity: 0.4; cursor: not-allowed; }
  .test-result { font-family: var(--mono); font-size: 11px; padding: 4px 8px; border-radius: 3px; }
  .test-result.ok    { color: var(--green-l); }
  .test-result.error { color: var(--red-l); }
  @media (max-width: 900px) {
    .alerts-wrap { padding: 0 20px 80px; }
    .stat-grid { grid-template-columns: repeat(2, 1fr); }
    .dash-cols  { grid-template-columns: 1fr; }
    .tiers-grid  { grid-template-columns: repeat(2, 1fr); }
    .assign-grid { grid-template-columns: repeat(2, 1fr); }
  }
`;