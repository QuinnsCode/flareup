"use client";
// src/app/pages/alerts/AlertsClient.tsx

import { useState } from "react";
import type { AlertConfig, WebhookConfig } from "@/lib/alerts/config";

const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  html, body { background: #060a06; }

  :root {
    --orange:   #e85d04;
    --orange-l: #f48c06;
    --red-l:    #ef4444;
    --green-l:  #22c55e;
    --bg:       #060a06;
    --bg-2:     #0a0f0a;
    --bg-3:     #0f160f;
    --border:   rgba(255,255,255,0.05);
    --border-o: rgba(232,93,4,0.2);
    --text:     #e8f0e8;
    --text-2:   #8a9e8a;
    --text-3:   #3a4e3a;
    --mono:     'Share Tech Mono', monospace;
  }

  .alerts-wrap {
    min-height: 100vh;
    background: var(--bg);
    color: var(--text);
    font-family: 'Barlow', sans-serif;
    padding: 0 52px 80px;
  }

  .alerts-inner {
    max-width: 900px;
    margin: 0 auto;
  }

  /* Header — matches dashboard style */
  .alerts-nav {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 0;
    border-bottom: 1px solid var(--border-o);
    margin-bottom: 40px;
    position: sticky; top: 0; z-index: 10;
    background: var(--bg);
  }
  .alerts-nav-left  { display: flex; align-items: center; gap: 16px; }
  .alerts-nav-right { display: flex; align-items: center; gap: 8px; }
  .alerts-logo   { font-family: var(--mono); font-size: 13px; color: var(--orange-l); }
  .alerts-crumb  { font-family: var(--mono); font-size: 11px; color: var(--text-3); }
  .save-status   { font-family: var(--mono); font-size: 11px; color: var(--text-3); letter-spacing: 0.1em; padding: 0 8px; }
  .save-status.saved { color: var(--green-l); }
  .save-status.error { color: var(--red-l); }

  /* Page title */
  .alerts-title-block { margin-bottom: 40px; }
  .alerts-title {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 28px; font-weight: 700;
    letter-spacing: 0.1em; text-transform: uppercase;
    color: var(--text);
  }
  .alerts-sub {
    font-size: 13px; color: var(--text-2);
    margin-top: 6px; font-family: var(--mono);
  }

  .section { margin-bottom: 36px; }
  .section-label {
    font-family: var(--mono); font-size: 10px;
    letter-spacing: 0.16em; text-transform: uppercase;
    color: var(--text-3); margin-bottom: 12px;
    display: flex; align-items: center; gap: 10px;
  }
  .section-label::after { content: ''; flex: 1; height: 1px; background: var(--border); }

  .card { background: var(--bg-2); border: 1px solid var(--border); border-radius: 4px; padding: 24px; }
  .card-orange { border-color: var(--border-o); border-top: 2px solid var(--orange); }

  .budget-row { display: flex; align-items: center; gap: 12px; }
  .input-prefix { font-family: var(--mono); font-size: 18px; color: var(--orange-l); }
  .budget-input {
    background: var(--bg-3); border: 1px solid var(--border-o); border-radius: 3px;
    color: var(--text); font-family: var(--mono); font-size: 24px;
    padding: 10px 16px; width: 160px; outline: none; transition: border-color 0.15s;
  }
  .budget-input:focus { border-color: var(--orange-l); }
  .budget-desc { font-size: 12px; color: var(--text-3); font-family: var(--mono); }

  .tiers-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
  .tier-card {
    background: var(--bg-3); border: 1px solid var(--border); border-radius: 3px;
    padding: 14px; display: flex; flex-direction: column; gap: 6px; transition: border-color 0.15s;
  }
  .tier-card.active { border-color: var(--border-o); }
  .tier-pct { font-family: var(--mono); font-size: 20px; color: var(--orange-l); }
  .tier-pct.critical { color: var(--red-l); }
  .tier-name { font-size: 11px; font-family: var(--mono); color: var(--text-2); text-transform: uppercase; letter-spacing: 0.1em; }
  .tier-toggle { margin-top: 4px; display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 11px; color: var(--text-3); font-family: var(--mono); }
  .tier-toggle input { cursor: pointer; accent-color: var(--orange); }

  .webhook-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
  .webhook-row {
    display: flex; align-items: center; gap: 10px;
    background: var(--bg-3); border: 1px solid var(--border); border-radius: 3px;
    padding: 10px 14px; font-family: var(--mono); font-size: 12px;
  }
  .webhook-name { color: var(--text-2); min-width: 100px; }
  .webhook-url  { color: var(--text-3); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .webhook-type {
    font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase;
    padding: 2px 8px; border-radius: 2px; border: 1px solid var(--border); color: var(--text-3);
  }
  .webhook-type.slack   { color: #4ade80; border-color: rgba(74,222,128,0.2); }
  .webhook-type.discord { color: #818cf8; border-color: rgba(129,140,248,0.2); }
  .webhook-type.generic { color: var(--orange-l); border-color: var(--border-o); }
  .webhook-del { background: none; border: none; color: var(--text-3); cursor: pointer; font-size: 16px; padding: 0 4px; transition: color 0.15s; }
  .webhook-del:hover { color: var(--red-l); }

  .add-webhook { display: flex; flex-direction: column; gap: 8px; padding: 14px; background: var(--bg-3); border: 1px dashed var(--border-o); border-radius: 3px; }
  .add-webhook-row { display: flex; gap: 8px; }
  .field-input {
    background: var(--bg); border: 1px solid var(--border-o); border-radius: 3px;
    color: var(--text); font-family: var(--mono); font-size: 12px;
    padding: 8px 12px; outline: none; transition: border-color 0.15s; width: 100%;
  }
  .field-input:focus { border-color: var(--orange-l); }
  .field-input::placeholder { color: var(--text-3); }
  .field-input.name { width: 160px; flex-shrink: 0; }

  .assign-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 12px; }
  .assign-card { background: var(--bg-3); border: 1px solid var(--border); border-radius: 3px; padding: 12px; }
  .assign-tier-name { font-family: var(--mono); font-size: 11px; color: var(--text-2); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; }
  .assign-webhook-item { display: flex; align-items: center; gap: 6px; font-family: var(--mono); font-size: 11px; color: var(--text-3); cursor: pointer; padding: 2px 0; }
  .assign-webhook-item input { accent-color: var(--orange); cursor: pointer; }

  .btn-primary {
    background: var(--orange); border: 1px solid var(--orange); border-radius: 3px;
    color: #fff; font-family: 'Barlow Condensed', sans-serif; font-size: 12px;
    font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase;
    padding: 9px 20px; cursor: pointer; transition: all 0.15s;
  }
  .btn-primary:hover { background: var(--orange-l); }
  .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }

  .btn-ghost {
    background: transparent; border: 1px solid var(--border-o); border-radius: 3px;
    color: var(--text-2); font-family: 'Barlow Condensed', sans-serif; font-size: 12px;
    font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase;
    padding: 9px 20px; cursor: pointer; transition: all 0.15s;
  }
  .btn-ghost:hover { color: var(--text); border-color: var(--orange-l); }

  .btn-small {
    background: var(--orange); border: none; border-radius: 3px;
    color: #fff; font-family: var(--mono); font-size: 11px;
    padding: 7px 14px; cursor: pointer; transition: opacity 0.15s; white-space: nowrap;
  }
  .btn-small:hover { opacity: 0.85; }
  .btn-small:disabled { opacity: 0.4; cursor: not-allowed; }

  .test-result { font-family: var(--mono); font-size: 11px; padding: 8px 12px; border-radius: 3px; margin-top: 8px; }
  .test-result.ok    { background: rgba(22,163,74,0.08); color: var(--green-l); border: 1px solid rgba(34,197,94,0.2); }
  .test-result.error { background: rgba(220,38,38,0.08); color: var(--red-l);   border: 1px solid rgba(220,38,38,0.2); }

  @media (max-width: 768px) {
    .alerts-wrap { padding: 0 20px 80px; }
    .tiers-grid  { grid-template-columns: repeat(2, 1fr); }
    .assign-grid { grid-template-columns: repeat(2, 1fr); }
  }
`;

function detectType(url: string): "slack" | "discord" | "generic" {
  if (url.includes("hooks.slack.com")) return "slack";
  if (url.includes("discord.com/api/webhooks")) return "discord";
  return "generic";
}

export function AlertsClient({ initialConfig }: { initialConfig: AlertConfig }) {
  const [config, setConfig]       = useState<AlertConfig>(initialConfig);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [newName, setNewName]     = useState("");
  const [newUrl, setNewUrl]       = useState("");
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; ok: boolean; msg: string } | null>(null);

  const save = async () => {
    setSaveStatus("saving");
    try {
      const res = await fetch("/api/alerts/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      setSaveStatus(res.ok ? "saved" : "error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  const addWebhook = () => {
    if (!newUrl.trim()) return;
    const webhook: WebhookConfig = {
      id: crypto.randomUUID(),
      name: newName.trim() || "Webhook",
      url: newUrl.trim(),
      enabled: true,
    };
    setConfig({ ...config, webhooks: [...config.webhooks, webhook] });
    setNewName("");
    setNewUrl("");
  };

  const removeWebhook = (id: string) => {
    setConfig({
      ...config,
      webhooks: config.webhooks.filter(w => w.id !== id),
      tiers: config.tiers.map(t => ({ ...t, webhookIds: t.webhookIds.filter(wid => wid !== id) })),
    });
  };

  const testWebhook = async (webhook: WebhookConfig) => {
    setTestingId(webhook.id);
    setTestResult(null);
    try {
      const res = await fetch("/api/alerts/test-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookUrl: webhook.url, webhookName: webhook.name }),
      });
      const data = await res.json() as any;
      setTestResult({ id: webhook.id, ok: res.ok, msg: res.ok ? "// delivered ✓" : `// failed: ${data.error}` });
    } catch {
      setTestResult({ id: webhook.id, ok: false, msg: "// network error" });
    }
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

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="alerts-wrap">
        <div className="alerts-inner">

          {/* Nav header — same pattern as dashboard */}
          <div className="alerts-nav">
            <div className="alerts-nav-left">
              <span className="alerts-logo">🔥 FlareUp</span>
              <span className="alerts-crumb">// alerts config</span>
            </div>
            <div className="alerts-nav-right">
              {saveStatus !== "idle" && (
                <span className={`save-status ${saveStatus === "saved" ? "saved" : saveStatus === "error" ? "error" : ""}`}>
                  {saveStatus === "saving" ? "// saving..." : saveStatus === "saved" ? "// saved ✓" : "// save failed"}
                </span>
              )}
              <a href="/dashboard"><button className="btn-ghost">← Dashboard</button></a>
              <button className="btn-primary" onClick={save} disabled={saveStatus === "saving"}>
                Save Config
              </button>
            </div>
          </div>

          {/* Title */}
          <div className="alerts-title-block">
            <div className="alerts-title">Alert Configuration</div>
            <div className="alerts-sub">fires when projected month-end spend crosses your budget thresholds</div>
          </div>

          {/* Budget */}
          <div className="section">
            <div className="section-label">Monthly budget</div>
            <div className="card card-orange">
              <div className="budget-row">
                <span className="input-prefix">$</span>
                <input
                  className="budget-input"
                  type="number"
                  min={1}
                  value={config.monthlyBudget}
                  onChange={e => setConfig({ ...config, monthlyBudget: Number(e.target.value) })}
                />
                <span className="budget-desc">
                  // USD / month<br />
                  // alerts fire at 25%, 50%, 75%, 100%
                </span>
              </div>
            </div>
          </div>

          {/* Tiers */}
          <div className="section">
            <div className="section-label">Alert tiers</div>
            <div className="tiers-grid">
              {config.tiers.map(tier => (
                <div key={tier.id} className={`tier-card ${tier.enabled ? "active" : ""}`}>
                  <div className={`tier-pct ${tier.budgetPercent >= 1 ? "critical" : ""}`}>
                    {Math.round(tier.budgetPercent * 100)}%
                  </div>
                  <div className="tier-name">{tier.name}</div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-3)" }}>
                    ${(config.monthlyBudget * tier.budgetPercent).toFixed(0)}
                  </div>
                  <label className="tier-toggle">
                    <input type="checkbox" checked={tier.enabled} onChange={e => toggleTier(tier.id, e.target.checked)} />
                    {tier.enabled ? "enabled" : "disabled"}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Webhooks */}
          <div className="section">
            <div className="section-label">Webhooks</div>
            <div className="card">
              {config.webhooks.length > 0 && (
                <div className="webhook-list">
                  {config.webhooks.map(w => (
                    <div key={w.id}>
                      <div className="webhook-row">
                        <span className="webhook-name">{w.name}</span>
                        <span className="webhook-url">{w.url}</span>
                        <span className={`webhook-type ${detectType(w.url)}`}>{detectType(w.url)}</span>
                        <button className="btn-small" onClick={() => testWebhook(w)} disabled={testingId === w.id}>
                          {testingId === w.id ? "sending..." : "test"}
                        </button>
                        <button className="webhook-del" onClick={() => removeWebhook(w.id)}>×</button>
                      </div>
                      {testResult?.id === w.id && (
                        <div className={`test-result ${testResult.ok ? "ok" : "error"}`}>{testResult.msg}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div className="add-webhook">
                <div className="add-webhook-row">
                  <input className="field-input name" placeholder="// name" value={newName} onChange={e => setNewName(e.target.value)} />
                  <input
                    className="field-input"
                    placeholder="// https://hooks.slack.com/... or discord.com/api/webhooks/..."
                    value={newUrl}
                    onChange={e => setNewUrl(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addWebhook()}
                  />
                  <button className="btn-small" onClick={addWebhook} disabled={!newUrl.trim()}>add</button>
                </div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-3)", letterSpacing: "0.08em" }}>
                  // Slack incoming webhook · Discord webhook · any HTTP POST endpoint
                </div>
              </div>
            </div>
          </div>

          {/* Assign to tiers */}
          {config.webhooks.length > 0 && (
            <div className="section">
              <div className="section-label">Assign webhooks to tiers</div>
              <div className="card">
                <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-3)", marginBottom: 12 }}>
                  // choose which webhooks fire at each threshold
                </div>
                <div className="assign-grid">
                  {config.tiers.map(tier => (
                    <div key={tier.id} className="assign-card">
                      <div className="assign-tier-name">{Math.round(tier.budgetPercent * 100)}% — {tier.name}</div>
                      {config.webhooks.map(w => (
                        <label key={w.id} className="assign-webhook-item">
                          <input
                            type="checkbox"
                            checked={tier.webhookIds.includes(w.id)}
                            onChange={e => toggleTierWebhook(tier.id, w.id, e.target.checked)}
                          />
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
      </div>
    </>
  );
}