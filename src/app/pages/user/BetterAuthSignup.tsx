"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import type { AppContext } from "@/worker";

export default function BetterAuthSignup({ ctx }: { ctx: AppContext }) {
  const [displayName, setDisplayName]       = useState("");
  const [email, setEmail]                   = useState("");
  const [password, setPassword]             = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [workspaceName, setWorkspaceName]   = useState("");
  const [workspaceSlug, setWorkspaceSlug]   = useState("");
  const [agreedToTerms, setAgreedToTerms]   = useState(false);
  const [showPassword, setShowPassword]     = useState(false);
  const [showConfirm, setShowConfirm]       = useState(false);
  const [result, setResult]                 = useState("");
  const [resultType, setResultType]         = useState<"error" | "success">("error");
  const [isPending, startTransition]        = useTransition();
  const [isHydrated, setIsHydrated]         = useState(false);
  const [slugAvailable, setSlugAvailable]   = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug]     = useState(false);

  const debounceRef      = useRef<NodeJS.Timeout | null>(null);
  const abortRef         = useRef<AbortController | null>(null);

  useEffect(() => { setIsHydrated(true); }, []);

  useEffect(() => {
    if (ctx.user && isHydrated) window.location.href = "/dashboard";
  }, [ctx.user, isHydrated]);

  // Auto-fill workspace name from display name
  useEffect(() => {
    if (displayName && !workspaceName) setWorkspaceName(`${displayName}'s workspace`);
  }, [displayName]);

  // Auto-generate slug from workspace name
  useEffect(() => {
    if (workspaceName) {
      const slug = workspaceName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      setWorkspaceSlug(slug);
    }
  }, [workspaceName]);

  // Check slug availability (debounced)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();
    if (!workspaceSlug || workspaceSlug.length < 6) { setSlugAvailable(null); setCheckingSlug(false); return; }

    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;
      setCheckingSlug(true);
      try {
        const res = await fetch(`/api/main/check-username?username=${workspaceSlug}`, { signal: controller.signal });
        if (!controller.signal.aborted) {
          const { available } = await res.json() as any;
          setSlugAvailable(available);
        }
      } catch (e) {
        if (e instanceof Error && e.name === 'AbortError') return;
        if (!controller.signal.aborted) setSlugAvailable(null);
      } finally {
        if (!controller.signal.aborted) setCheckingSlug(false);
      }
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [workspaceSlug]);

  if (ctx.user) return (
    <>
      <style>{CSS}</style>
      <div className="su-page su-page--centered">
        <div className="su-card" style={{ textAlign: "center", padding: "40px" }}>
          <div className="su-title">Redirecting…</div>
          <div className="su-hint">// taking you to your dashboard</div>
        </div>
      </div>
    </>
  );

  const handleSignup = async () => {
    try {
      setResult("");
      if (password !== confirmPassword)      { setResultType("error"); setResult("Passwords do not match"); return; }
      if (password.length < 8)               { setResultType("error"); setResult("Password must be at least 8 characters"); return; }
      if (workspaceSlug.length < 6)          { setResultType("error"); setResult("Workspace URL must be at least 6 characters"); return; }
      if (slugAvailable === false)           { setResultType("error"); setResult("That workspace URL is already taken"); return; }
      if (!agreedToTerms)                    { setResultType("error"); setResult("You must agree to the Terms of Service"); return; }

      const { signupWithOrg } = await import("@/app/serverActions/admin/signup");
      const formData = new FormData();
      formData.append('username',      workspaceSlug);
      formData.append('displayName',   displayName);
      formData.append('email',         email);
      formData.append('password',      password);
      formData.append('lairName',      workspaceName);   // server action expects lairName
      formData.append('selectedTier',  'free');

      const res = await signupWithOrg(formData);
      if (!res.success) { setResultType("error"); setResult(`Signup failed: ${res.error}`); return; }

      setResultType("success");
      setResult("// account created — redirecting…");
      setTimeout(() => { window.location.href = res.redirectUrl!; }, 1200);
    } catch (err) {
      setResultType("error");
      setResult(`Signup failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName || !email || !password || !confirmPassword || !workspaceName || !workspaceSlug) {
      setResultType("error"); setResult("All fields are required"); return;
    }
    startTransition(() => void handleSignup());
  };

  const canSubmit = !isPending && !!displayName && !!email && !!password && !!confirmPassword
    && workspaceSlug.length >= 6 && slugAvailable !== false && agreedToTerms;

  return (
    <>
      <style>{CSS}</style>
      <div className="su-page">
        <div className="su-layout">

          {/* Left — branding */}
          <div className="su-brand">
            <div className="su-brand-logo">🔥</div>
            <div className="su-brand-name">FlareUp</div>
            <div className="su-brand-tagline">Cloudflare billing visibility.<br />Before the $8,000 surprise.</div>
            <div className="su-brand-features">
              <div className="su-feature"><span className="su-feature-dot" />Workers · KV · D1 · R2 · AI</div>
              <div className="su-feature"><span className="su-feature-dot" />Webhook alerts to Slack, Discord, PagerDuty</div>
              <div className="su-feature"><span className="su-feature-dot" />Your subdomain, your dashboard</div>
              <div className="su-feature"><span className="su-feature-dot" />Free — no credit card required</div>
            </div>
          </div>

          {/* Right — form */}
          <div className="su-form-wrap">
            <div className="su-card">
              <div className="su-card-top" />
              <div className="su-card-body">

                <div className="su-title">Create account</div>
                <div className="su-hint">// free forever · no card required</div>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 0 }}>

                  {/* Account info */}
                  <div className="su-section-label">Account</div>

                  <div className="su-field">
                    <label className="su-label" htmlFor="displayName">Display name</label>
                    <input id="displayName" className="su-input" type="text" placeholder="Jane Smith"
                      value={displayName} onChange={e => setDisplayName(e.target.value)} required autoComplete="name" />
                  </div>

                  <div className="su-field">
                    <label className="su-label" htmlFor="email">Email</label>
                    <input id="email" className="su-input" type="email" placeholder="you@example.com"
                      value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
                  </div>

                  <div className="su-field">
                    <label className="su-label" htmlFor="password">Password</label>
                    <div className="su-input-wrap">
                      <input id="password" className="su-input su-input--pw" type={showPassword ? "text" : "password"}
                        placeholder="At least 8 characters" minLength={8} required
                        value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" />
                      <button type="button" className="su-pw-toggle" onClick={() => setShowPassword(v => !v)}>
                        {showPassword ? "hide" : "show"}
                      </button>
                    </div>
                  </div>

                  <div className="su-field">
                    <label className="su-label" htmlFor="confirmPassword">Confirm password</label>
                    <div className="su-input-wrap">
                      <input id="confirmPassword" className="su-input su-input--pw" type={showConfirm ? "text" : "password"}
                        placeholder="Repeat password" minLength={8} required
                        value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} autoComplete="new-password" />
                      <button type="button" className="su-pw-toggle" onClick={() => setShowConfirm(v => !v)}>
                        {showConfirm ? "hide" : "show"}
                      </button>
                    </div>
                    {password && confirmPassword && password !== confirmPassword && (
                      <div className="su-field-error">// passwords don't match</div>
                    )}
                  </div>

                  {/* Workspace */}
                  <div className="su-section-label" style={{ marginTop: 20 }}>Workspace</div>

                  <div className="su-field">
                    <label className="su-label" htmlFor="workspaceName">Workspace name</label>
                    <input id="workspaceName" className="su-input" type="text" placeholder="Acme Corp"
                      value={workspaceName} onChange={e => setWorkspaceName(e.target.value)} required />
                    <div className="su-field-hint">// your dashboard display name</div>
                  </div>

                  <div className="su-field">
                    <label className="su-label" htmlFor="workspaceSlug">
                      Workspace URL
                      <span className="su-slug-status">
                        {checkingSlug && <span className="su-slug-checking">// checking…</span>}
                        {!checkingSlug && slugAvailable === true  && workspaceSlug.length >= 6 && <span className="su-slug-ok">// available ✓</span>}
                        {!checkingSlug && slugAvailable === false && <span className="su-slug-taken">// taken ✗</span>}
                        {!checkingSlug && workspaceSlug.length > 0 && workspaceSlug.length < 6 && <span className="su-slug-short">// too short</span>}
                      </span>
                    </label>
                    <div className="su-slug-wrap">
                      <input id="workspaceSlug" className="su-input" type="text" placeholder="acme-corp"
                        minLength={6} required
                        value={workspaceSlug}
                        onChange={e => setWorkspaceSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} />
                      <div className="su-slug-preview">
                        {workspaceSlug || 'your-workspace'}<span style={{ color: "var(--text-3)" }}>.flareup.dev</span>
                      </div>
                    </div>
                    <div className="su-field-hint">// lowercase letters, numbers, hyphens · min 6 chars</div>
                  </div>

                  {/* Terms */}
                  <label className="su-terms">
                    <input type="checkbox" checked={agreedToTerms} onChange={e => setAgreedToTerms(e.target.checked)} required />
                    <span>
                      I agree to the{" "}
                      <a href="/terms" target="_blank" rel="noopener noreferrer">Terms of Service</a>
                      {" "}and{" "}
                      <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
                    </span>
                  </label>

                  {result && (
                    <div className={`su-result ${resultType}`}>{result}</div>
                  )}

                  <button type="submit" className="su-submit" disabled={!canSubmit}>
                    {isPending ? "// creating account…" : "Create account →"}
                  </button>
                </form>

                <div className="su-signin">
                  Already have an account? <a href="/user/login">Sign in →</a>
                </div>

              </div>
            </div>
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
    --body: 'Barlow', sans-serif;
  }
  .su-page {
    min-height: 100vh; background: var(--bg); color: var(--text);
    font-family: var(--body); display: flex; align-items: center; justify-content: center;
    padding: 40px 24px;
  }
  .su-page--centered { flex-direction: column; }
  .su-layout {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 60px; max-width: 900px; width: 100%; align-items: start;
  }

  /* Brand */
  .su-brand { padding-top: 40px; }
  .su-brand-logo { font-size: 40px; margin-bottom: 12px; }
  .su-brand-name {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 32px; font-weight: 700;
    letter-spacing: 0.12em; text-transform: uppercase;
    color: var(--orange-l); margin-bottom: 12px;
  }
  .su-brand-tagline {
    font-size: 15px; color: var(--text-2); line-height: 1.6; margin-bottom: 32px;
  }
  .su-brand-features { display: flex; flex-direction: column; gap: 10px; }
  .su-feature { display: flex; align-items: center; gap: 10px; font-family: var(--mono); font-size: 11px; color: var(--text-3); letter-spacing: 0.06em; }
  .su-feature-dot { width: 4px; height: 4px; border-radius: 50%; background: var(--orange); flex-shrink: 0; }

  /* Card */
  .su-card { background: var(--bg-2); border: 1px solid var(--border-o); border-radius: 4px; overflow: hidden; }
  .su-card-top { height: 2px; background: linear-gradient(90deg, #dc2626, #e85d04, #f48c06); }
  .su-card-body { padding: 28px; }

  .su-title {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 22px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase;
    color: var(--text); margin-bottom: 4px;
  }
  .su-hint { font-family: var(--mono); font-size: 11px; color: var(--text-3); margin-bottom: 24px; letter-spacing: 0.06em; }

  .su-section-label {
    font-family: var(--mono); font-size: 9px; letter-spacing: 0.18em; text-transform: uppercase;
    color: var(--text-3); margin-bottom: 12px;
    display: flex; align-items: center; gap: 8px;
  }
  .su-section-label::after { content: ''; flex: 1; height: 1px; background: var(--border); }

  .su-field { display: flex; flex-direction: column; gap: 5px; margin-bottom: 14px; }
  .su-label {
    font-family: var(--mono); font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase;
    color: var(--text-2); display: flex; align-items: center; justify-content: space-between;
  }
  .su-input {
    background: var(--bg-3); border: 1px solid var(--border-o); border-radius: 3px;
    padding: 10px 13px; font-family: var(--mono); font-size: 12px; color: var(--text);
    outline: none; transition: border-color 0.15s, box-shadow 0.15s; width: 100%;
  }
  .su-input::placeholder { color: var(--text-3); }
  .su-input:focus { border-color: var(--orange); box-shadow: 0 0 0 3px rgba(232,93,4,0.08); }
  .su-input--pw { padding-right: 56px; }
  .su-input-wrap { position: relative; }
  .su-pw-toggle {
    position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
    background: none; border: none; color: var(--text-3); cursor: pointer;
    font-family: var(--mono); font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase;
    transition: color 0.15s; padding: 4px;
  }
  .su-pw-toggle:hover { color: var(--text-2); }
  .su-field-hint { font-family: var(--mono); font-size: 10px; color: var(--text-3); letter-spacing: 0.04em; }
  .su-field-error { font-family: var(--mono); font-size: 10px; color: var(--red); letter-spacing: 0.04em; }

  /* Slug */
  .su-slug-status { font-size: 10px; font-weight: 400; letter-spacing: 0.06em; }
  .su-slug-checking { color: var(--orange-l); }
  .su-slug-ok    { color: var(--green); }
  .su-slug-taken { color: var(--red); }
  .su-slug-short { color: var(--orange-l); }
  .su-slug-preview {
    font-family: var(--mono); font-size: 10px; color: var(--text-2);
    padding: 6px 13px; background: var(--bg); border: 1px solid var(--border);
    border-top: none; border-radius: 0 0 3px 3px; letter-spacing: 0.04em;
  }
  .su-slug-wrap { display: flex; flex-direction: column; }
  .su-slug-wrap .su-input { border-radius: 3px 3px 0 0; }

  /* Terms */
  .su-terms {
    display: flex; align-items: flex-start; gap: 10px;
    font-family: var(--mono); font-size: 11px; color: var(--text-3);
    cursor: pointer; margin: 16px 0; line-height: 1.6; letter-spacing: 0.03em;
  }
  .su-terms input { margin-top: 2px; accent-color: var(--orange); cursor: pointer; flex-shrink: 0; }
  .su-terms a { color: var(--orange-l); text-decoration: none; }
  .su-terms a:hover { text-decoration: underline; }

  /* Result */
  .su-result {
    font-family: var(--mono); font-size: 11px; padding: 10px 13px;
    border-radius: 3px; margin-bottom: 12px; letter-spacing: 0.04em;
  }
  .su-result.error   { color: var(--red);   background: rgba(220,38,38,0.06);  border: 1px solid rgba(220,38,38,0.2); }
  .su-result.success { color: var(--green); background: rgba(34,197,94,0.06);  border: 1px solid rgba(34,197,94,0.2); }

  /* Submit */
  .su-submit {
    width: 100%; padding: 13px;
    background: linear-gradient(135deg, #dc2626, #e85d04);
    border: none; border-radius: 3px;
    font-family: 'Barlow Condensed', sans-serif; font-weight: 700;
    font-size: 14px; letter-spacing: 0.14em; text-transform: uppercase;
    color: #fff; cursor: pointer;
    box-shadow: 0 2px 20px rgba(232,93,4,0.2);
    transition: all 0.2s;
  }
  .su-submit:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 32px rgba(232,93,4,0.35); }
  .su-submit:disabled { opacity: 0.35; cursor: not-allowed; transform: none; }

  .su-signin {
    margin-top: 20px; text-align: center;
    font-family: var(--mono); font-size: 11px; color: var(--text-3); letter-spacing: 0.06em;
  }
  .su-signin a { color: var(--orange-l); text-decoration: none; }
  .su-signin a:hover { text-decoration: underline; }

  @media (max-width: 720px) {
    .su-layout { grid-template-columns: 1fr; gap: 32px; }
    .su-brand { padding-top: 0; }
    .su-brand-features { display: none; }
  }
`;