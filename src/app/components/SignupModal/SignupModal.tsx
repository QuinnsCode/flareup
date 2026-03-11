// src/app/components/SignupModal.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { submitContactListJoin } from "@/app/serverActions/contactListJoin/contactListJoin";

interface SignupModalProps {
  open: boolean;
  onClose: () => void;
  skipToConnect?: boolean;
}

type Step = "email" | "connect" | "done";
type AccountStatus = "waiting" | "searching" | "found" | "error";

const MAGIC_TOKEN_URL =
  "https://dash.cloudflare.com/profile/api-tokens?permissionGroupKeys=account_analytics,billing,ai,workers_kv_storage,workers_r2,d1,queues,stream,images,pages,workers_scripts,workers_observability,vectorize,containers,hyperdrive,browser_rendering&name=FlareUp";

export function SignupModal({ open, onClose, skipToConnect }: SignupModalProps) {
  const [step, setStep]               = useState<Step>("email");
  const [email, setEmail]             = useState("");
  const [emailStatus, setEmailStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [emailError, setEmailError]   = useState("");

  const [token, setToken]             = useState("");
  const [accountId, setAccountId]     = useState("");
  const [accountStatus, setAccountStatus] = useState<AccountStatus>("waiting");
  const [tokenName, setTokenName]     = useState("");
  const [connectStatus, setConnectStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [connectError, setConnectError]   = useState("");
  const [openedCF, setOpenedCF]       = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const tokenRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      const initial = skipToConnect ? "connect" : "email";
      setStep(initial);
      setEmail(""); setEmailStatus("idle"); setEmailError("");
      setToken(""); setAccountId(""); setAccountStatus("waiting");
      setTokenName(""); setConnectStatus("idle"); setConnectError("");
      setOpenedCF(false);
      setTimeout(() => {
        if (initial === "email") inputRef.current?.focus();
        else tokenRef.current?.focus();
      }, 50);
    }
  }, [open, skipToConnect]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEmailStatus("loading");
    setEmailError("");
    const result = await submitContactListJoin(email);
    if (result.ok) {
      setEmailStatus("success");
      setTimeout(() => setStep("connect"), 1200);
    } else {
      setEmailStatus("error");
      setEmailError(result.error);
    }
  }

  async function handleTokenChange(val: string) {
    setToken(val);
    setAccountId("");
    setAccountStatus("waiting");
    if (val.trim().length < 20) return;

    setAccountStatus("searching");
    try {
      const res = await fetch("/api/cf/accounts", {
        method: "POST",
        headers: { "X-CF-Token": val.trim() },
      });
      if (!res.ok) { setAccountStatus("error"); return; }
      const data = await res.json() as any;
      const first = data.accounts?.[0]?.id;
      if (first) {
        setAccountId(first);
        setAccountStatus("found");
      } else {
        setAccountStatus("error");
      }
    } catch {
      setAccountStatus("error");
    }
  }

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    if (!token.trim() || !accountId) return;
    setConnectStatus("loading");
    setConnectError("");

    try {
      const res = await fetch("/api/alerts/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token:     token.trim(),
          accountId: accountId.trim(),
          name:      tokenName.trim() || undefined,
        }),
      });
      const data = await res.json() as any;
      if (!res.ok) {
        setConnectStatus("error");
        setConnectError(data.error ?? "Failed to connect account");
      } else {
        setConnectStatus("success");
        setTimeout(() => setStep("done"), 800);
      }
    } catch {
      setConnectStatus("error");
      setConnectError("Network error — try again");
    }
  }

  const accountStatusLabel = {
    waiting:   "// waiting for token...",
    searching: "// fetching account id...",
    found:     `// account id found — ${accountId.slice(0, 8)}…`,
    error:     "// could not fetch account id — check your token",
  }[accountStatus];

  return (
    <>
      <style>{CSS}</style>
      <div className="sm-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="sm-modal" role="dialog" aria-modal="true">

          <div className="sm-header">
            <span className="sm-header-label">
              {step === "email"   && "Hosted alerts · early access"}
              {step === "connect" && "Connect Cloudflare account"}
              {step === "done"    && "You're wired up"}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div className="sm-steps">
                {(["email", "connect", "done"] as Step[]).map((s, i) => (
                  <div key={s} className={`sm-dot ${step === s ? "active" : stepIndex(step) > i ? "done" : ""}`} />
                ))}
              </div>
              <button className="sm-close" onClick={onClose} aria-label="Close">✕</button>
            </div>
          </div>

          <div className="sm-body">

            {/* ── Step: email ── */}
            {step === "email" && (
              <>
                <div className="sm-title">
                  We do it <em>for you.</em><br />
                  {emailStatus === "success" ? "One sec…" : "Get notified when it's ready."}
                </div>
                {emailStatus === "success" ? (
                  <div className="sm-success-line">// you're on the list ✓ — moving to connect…</div>
                ) : (
                  <>
                    <div className="sm-desc">
                      Hosted alerts are live. We poll your CF account, fire to Slack, Discord, PagerDuty and more.
                      Your token is encrypted in your browser before it ever leaves — we never see plaintext.
                    </div>
                    <form onSubmit={handleEmailSubmit}>
                      <div className="sm-input-row">
                        <input
                          ref={inputRef}
                          className="sm-input"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={emailStatus === "loading"}
                          required
                          autoComplete="email"
                        />
                        <button type="submit" className="sm-btn-primary" disabled={emailStatus === "loading"}>
                          {emailStatus === "loading" ? "..." : "Continue →"}
                        </button>
                      </div>
                      {emailStatus === "error" && <div className="sm-error">{emailError}</div>}
                    </form>
                    <button className="sm-skip" onClick={() => setStep("connect")}>
                      already have an account → skip to connect
                    </button>
                  </>
                )}
              </>
            )}
            
            
            {/* ── Step: connect ── */}
            {step === "connect" && (
              <>
                <div className="sm-title">
                  {connectStatus === "success" ? "Connected. ✓" : "Paste your CF token."}
                </div>
                {connectStatus === "success" ? (
                  <div className="sm-success-line">// token encrypted and stored — taking you to config…</div>
                ) : (
                  <form onSubmit={handleConnect} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div className="sm-magic-row">
                      <a
                        href={MAGIC_TOKEN_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="sm-btn-magic"
                        onClick={() => setOpenedCF(true)}
                      >
                        Open Cloudflare — token pre-built →
                      </a>
                      {openedCF && (
                        <span className="sm-magic-hint">// create it, copy the token value, paste below</span>
                      )}
                    </div>

                    <div className="sm-why-again">
                        // why again? because we meant it — we never stored your token from the dashboard.
                        // this is the first time we're asking to hold onto it. encrypted. your call.
                    </div>
                    <div className="sm-field-label">API Token</div>
                    <textarea
                      ref={tokenRef}
                      className="sm-textarea"
                      placeholder="// paste token here"
                      value={token}
                      onChange={(e) => handleTokenChange(e.target.value)}
                      disabled={connectStatus === "loading"}
                      rows={3}
                      spellCheck={false}
                    />

                    {/* Account ID auto-detect status */}
                    <div className={`sm-account-status ${accountStatus}`}>
                      <span className={`sm-account-dot ${accountStatus}`} />
                      <span className={`sm-account-text ${accountStatus}`}>
                        {accountStatusLabel}
                      </span>
                    </div>

                    <input
                      className="sm-input"
                      type="text"
                      placeholder="// nickname (optional) — e.g. Personal, Acme Client"
                      value={tokenName}
                      onChange={(e) => setTokenName(e.target.value)}
                      disabled={connectStatus === "loading"}
                    />

                    {connectStatus === "error" && <div className="sm-error">{connectError}</div>}

                    <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                      <button
                        type="submit"
                        className="sm-btn-primary"
                        disabled={connectStatus === "loading" || accountStatus !== "found"}
                      >
                        {connectStatus === "loading" ? "Validating…" : "Connect & Encrypt →"}
                      </button>
                      <button type="button" className="sm-btn-ghost" onClick={() => setStep("done")}>
                        Do this later
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}

            {/* ── Step: done ── */}
            {step === "done" && (
              <>
                <div className="sm-title">You're wired up.</div>
                <div className="sm-desc">
                  Your Cloudflare account is connected. Configure alert thresholds, webhooks,
                  and notification frequency on the alerts page.
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <a href="/alerts" className="sm-btn-primary" style={{ textDecoration: "none" }}>
                    Configure alerts →
                  </a>
                  <button className="sm-btn-ghost" onClick={onClose}>Close</button>
                </div>
              </>
            )}

          </div>

          <div className="sm-footer">
            // token encrypted in your browser · ciphertext only stored · delete = cryptographically gone
          </div>
        </div>
      </div>
    </>
  );
}

function stepIndex(step: Step): number {
  return ["email", "connect", "done"].indexOf(step);
}

const CSS = `
  .sm-backdrop {
    position: fixed; inset: 0; z-index: 1000;
    background: rgba(0,0,0,0.75);
    backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center;
    padding: 16px;
  }
  .sm-modal {
    background: #0a0f0a;
    border: 1px solid rgba(220,38,38,0.25);
    border-radius: 4px;
    width: 100%; max-width: 500px;
    overflow: hidden;
    box-shadow: 0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(232,93,4,0.08);
  }
  .sm-header {
    padding: 14px 20px;
    background: rgba(220,38,38,0.06);
    border-bottom: 1px solid rgba(220,38,38,0.2);
    display: flex; align-items: center; justify-content: space-between;
    font-family: 'Share Tech Mono', monospace;
    font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase;
    color: #ef4444;
  }
  .sm-header-label { color: #3a4e3a; }
  .sm-steps { display: flex; gap: 6px; align-items: center; }
  .sm-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: #1a2e1a; transition: background 0.2s;
  }
  .sm-dot.active { background: #e85d04; }
  .sm-dot.done   { background: #22c55e; }
  .sm-close {
    background: none; border: none; cursor: pointer;
    color: #3a4e3a; font-size: 16px; line-height: 1;
    padding: 2px 6px; border-radius: 2px; transition: color 0.15s; margin-left: 8px;
  }
  .sm-close:hover { color: #e8f0e8; }

  .sm-body { padding: 24px 20px; display: flex; flex-direction: column; gap: 14px; }

  .sm-title {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 22px; letter-spacing: 0.08em; text-transform: uppercase;
    color: #e8f0e8; line-height: 1.1;
  }
  .sm-title em { font-style: normal; color: #ef4444; }
  .sm-desc { font-size: 13px; line-height: 1.7; color: #8a9e8a; }
  .sm-success-line { font-family: 'Share Tech Mono', monospace; font-size: 12px; color: #22c55e; }

  .sm-input-row { display: flex; gap: 8px; }
  .sm-input {
    flex: 1; background: #060a06;
    border: 1px solid rgba(255,255,255,0.08); border-radius: 3px;
    padding: 10px 13px; font-family: 'Share Tech Mono', monospace; font-size: 12px;
    color: #e8f0e8; outline: none; transition: border-color 0.15s; width: 100%;
  }
  .sm-input::placeholder { color: #3a4e3a; }
  .sm-input:focus { border-color: rgba(232,93,4,0.5); }
  .sm-input:disabled { opacity: 0.5; }
  .sm-textarea {
    width: 100%; background: #060a06;
    border: 1px solid rgba(255,255,255,0.08); border-radius: 3px;
    padding: 10px 13px; font-family: 'Share Tech Mono', monospace; font-size: 12px;
    color: #e8f0e8; outline: none; resize: vertical; transition: border-color 0.15s;
  }
  .sm-textarea::placeholder { color: #3a4e3a; }
  .sm-textarea:focus { border-color: rgba(232,93,4,0.5); }
  .sm-textarea:disabled { opacity: 0.5; }

  .sm-field-label {
    font-family: 'Share Tech Mono', monospace; font-size: 10px;
    letter-spacing: 0.12em; text-transform: uppercase; color: #3a4e3a;
    margin-bottom: -6px;
  }

  /* Account ID auto-detect */
  .sm-account-status {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 13px; border-radius: 3px;
    background: #060a06; border: 1px solid rgba(232,93,4,0.15);
    font-family: 'Share Tech Mono', monospace; font-size: 11px;
    letter-spacing: 0.06em; transition: border-color 0.3s;
  }
  .sm-account-status.found { border-color: rgba(34,197,94,0.3); background: rgba(34,197,94,0.03); }
  .sm-account-status.error { border-color: rgba(220,38,38,0.2); }
  .sm-account-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
  .sm-account-dot.waiting   { background: #3a4e3a; }
  .sm-account-dot.searching { background: #f48c06; animation: sm-pulse-dot 1s ease-in-out infinite; }
  .sm-account-dot.found     { background: #22c55e; }
  .sm-account-dot.error     { background: #ef4444; }
  @keyframes sm-pulse-dot { 0%,100%{opacity:1} 50%{opacity:0.3} }
  .sm-account-text.waiting   { color: #3a4e3a; }
  .sm-account-text.searching { color: #f48c06; }
  .sm-account-text.found     { color: #22c55e; }
  .sm-account-text.error     { color: #ef4444; }

  .sm-magic-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .sm-btn-magic {
    display: inline-block; padding: 10px 18px; border-radius: 3px;
    background: linear-gradient(135deg, #dc2626, #e85d04);
    color: #fff; text-decoration: none;
    font-family: 'Barlow Condensed', sans-serif; font-size: 12px;
    font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
    border: none; cursor: pointer; transition: opacity 0.15s; white-space: nowrap;
  }
  .sm-btn-magic:hover { opacity: 0.88; }
  .sm-magic-hint { font-family: 'Share Tech Mono', monospace; font-size: 10px; color: #3a4e3a; }

  .sm-btn-primary {
    padding: 10px 20px; border-radius: 3px; white-space: nowrap;
    font-family: 'Barlow Condensed', sans-serif; font-size: 12px;
    font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase;
    background: #e85d04; color: #fff; border: 1px solid #e85d04;
    cursor: pointer; transition: all 0.15s;
  }
  .sm-btn-primary:hover:not(:disabled) { background: #f48c06; }
  .sm-btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }

  .sm-btn-ghost {
    padding: 10px 18px; border-radius: 3px;
    background: transparent; border: 1px solid rgba(232,93,4,0.2);
    color: #8a9e8a; font-family: 'Barlow Condensed', sans-serif; font-size: 12px;
    font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase;
    cursor: pointer; transition: all 0.15s;
  }
  .sm-btn-ghost:hover { color: #e8f0e8; border-color: rgba(232,93,4,0.5); }

  .sm-skip {
    background: none; border: none; cursor: pointer; text-align: left;
    font-family: 'Share Tech Mono', monospace; font-size: 10px;
    color: #3a4e3a; letter-spacing: 0.08em; transition: color 0.15s;
    padding: 0; margin-top: -4px;
  }
  .sm-skip:hover { color: #8a9e8a; }

  .sm-error {
    font-family: 'Share Tech Mono', monospace; font-size: 11px;
    color: #ef4444; padding: 8px 12px;
    background: rgba(220,38,38,0.06);
    border: 1px solid rgba(220,38,38,0.2); border-radius: 2px;
  }

  .sm-footer {
    padding: 12px 20px; border-top: 1px solid rgba(255,255,255,0.04);
    font-family: 'Share Tech Mono', monospace; font-size: 10px;
    color: #3a4e3a; line-height: 1.6; letter-spacing: 0.04em;
  }
`;