"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";

export default function ResetPasswordPage() {
  const [password, setPassword]         = useState("");
  const [confirm, setConfirm]           = useState("");
  const [showPw, setShowPw]             = useState(false);
  const [token, setToken]               = useState("");
  const [isLoading, setIsLoading]       = useState(false);
  const [result, setResult]             = useState("");
  const [ok, setOk]                     = useState(false);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("token");
    if (t) setToken(t);
    else setResult("// invalid or expired reset link");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm)   { setResult("// passwords don't match"); return; }
    if (password.length < 8)    { setResult("// password must be at least 8 characters"); return; }
    setIsLoading(true);
    setResult("");
    try {
      await authClient.resetPassword({ newPassword: password, token });
      setOk(true);
      setResult("// password reset ✓ — redirecting to sign in…");
      setTimeout(() => { window.location.href = "/user/login"; }, 2000);
    } catch (err: any) {
      setResult(err.message ?? "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-card-top" />
          <div className="auth-card-body">
            <div className="auth-logo">🔥</div>
            <div className="auth-title">Reset password</div>
            <div className="auth-hint">// enter your new password below</div>

            {!token && result ? (
              <>
                <div className="auth-result err" style={{ marginTop: 16 }}>{result}</div>
                <a href="/user/forgot-password" className="auth-submit" style={{ marginTop: 16, textAlign: "center", textDecoration: "none", display: "block" }}>
                  Request new link →
                </a>
              </>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 20 }}>
                <div className="auth-field">
                  <label className="auth-label" htmlFor="password">New password</label>
                  <div className="auth-input-wrap">
                    <input id="password" className="auth-input auth-input--pw"
                      type={showPw ? "text" : "password"} placeholder="At least 8 characters"
                      minLength={8} required value={password} onChange={e => setPassword(e.target.value)} />
                    <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(v => !v)}>
                      {showPw ? "hide" : "show"}
                    </button>
                  </div>
                </div>
                <div className="auth-field">
                  <label className="auth-label" htmlFor="confirm">Confirm password</label>
                  <input id="confirm" className="auth-input" type="password" placeholder="Repeat password"
                    minLength={8} required value={confirm} onChange={e => setConfirm(e.target.value)} />
                  {password && confirm && password !== confirm && (
                    <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--red)", marginTop: 4 }}>// passwords don't match</div>
                  )}
                </div>
                {result && <div className={`auth-result ${ok ? "ok" : "err"}`}>{result}</div>}
                <button type="submit" className="auth-submit" disabled={isLoading || !token}>
                  {isLoading ? "// resetting…" : "Reset password →"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --orange: #e85d04; --orange-l: #f48c06;
    --green: #22c55e; --red: #ef4444;
    --bg: #060a06; --bg-2: #0a0f0a; --bg-3: #0f160f;
    --border: rgba(255,255,255,0.05); --border-o: rgba(232,93,4,0.2);
    --text: #e8f0e8; --text-2: #8a9e8a; --text-3: #3a4e3a;
    --mono: 'Share Tech Mono', monospace;
  }
  body { background: var(--bg); }
  .auth-page {
    min-height: 100vh; background: var(--bg); display: flex;
    align-items: center; justify-content: center; padding: 40px 24px;
  }
  .auth-card {
    width: 100%; max-width: 420px;
    background: var(--bg-2); border: 1px solid var(--border-o);
    border-radius: 4px; overflow: hidden;
  }
  .auth-card-top { height: 2px; background: linear-gradient(90deg, #dc2626, #e85d04, #f48c06); }
  .auth-card-body { padding: 32px; }
  .auth-logo { font-size: 32px; margin-bottom: 12px; }
  .auth-title {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 24px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase;
    color: var(--text); margin-bottom: 4px;
  }
  .auth-hint { font-family: var(--mono); font-size: 11px; color: var(--text-3); margin-bottom: 24px; }
  .auth-warn {
    font-family: var(--mono); font-size: 11px; color: var(--orange-l);
    background: rgba(232,93,4,0.06); border: 1px solid var(--border-o);
    border-radius: 3px; padding: 10px 12px; margin-bottom: 16px;
  }
  .auth-field { display: flex; flex-direction: column; gap: 5px; }
  .auth-label {
    font-family: var(--mono); font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase;
    color: var(--text-2); display: flex; align-items: center; justify-content: space-between;
  }
  .auth-label-link { font-size: 10px; color: var(--orange-l); text-decoration: none; text-transform: none; letter-spacing: 0; }
  .auth-label-link:hover { text-decoration: underline; }
  .auth-input {
    background: var(--bg-3); border: 1px solid var(--border-o); border-radius: 3px;
    padding: 10px 13px; font-family: var(--mono); font-size: 12px; color: var(--text);
    outline: none; transition: border-color 0.15s, box-shadow 0.15s; width: 100%;
  }
  .auth-input::placeholder { color: var(--text-3); }
  .auth-input:focus { border-color: var(--orange); box-shadow: 0 0 0 3px rgba(232,93,4,0.08); }
  .auth-input--pw { padding-right: 56px; }
  .auth-input-wrap { position: relative; }
  .auth-pw-toggle {
    position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
    background: none; border: none; color: var(--text-3); cursor: pointer;
    font-family: var(--mono); font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase;
    transition: color 0.15s;
  }
  .auth-pw-toggle:hover { color: var(--text-2); }
  .auth-result {
    font-family: var(--mono); font-size: 11px; padding: 10px 12px;
    border-radius: 3px; letter-spacing: 0.04em;
  }
  .auth-result.ok  { color: var(--green); background: rgba(34,197,94,0.06);  border: 1px solid rgba(34,197,94,0.2); }
  .auth-result.err { color: var(--red);   background: rgba(220,38,38,0.06);  border: 1px solid rgba(220,38,38,0.2); }
  .auth-submit {
    width: 100%; padding: 13px; background: linear-gradient(135deg, #dc2626, #e85d04);
    border: none; border-radius: 3px;
    font-family: 'Barlow Condensed', sans-serif; font-weight: 700;
    font-size: 14px; letter-spacing: 0.14em; text-transform: uppercase;
    color: #fff; cursor: pointer; box-shadow: 0 2px 20px rgba(232,93,4,0.2);
    transition: all 0.2s;
  }
  .auth-submit:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 32px rgba(232,93,4,0.35); }
  .auth-submit:disabled { opacity: 0.35; cursor: not-allowed; transform: none; }
  .auth-footer-link {
    margin-top: 20px; text-align: center;
    font-family: var(--mono); font-size: 11px; color: var(--text-3); letter-spacing: 0.06em;
  }
  .auth-footer-link a { color: var(--orange-l); text-decoration: none; }
  .auth-footer-link a:hover { text-decoration: underline; }
`;