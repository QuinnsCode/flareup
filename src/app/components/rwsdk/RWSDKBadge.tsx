import { useState } from "react";

// Usage: <RWSDKBadge size="sm" /> | <RWSDKBadge size="md" /> | <RWSDKBadge size="lg" />
// Or:   <RWSDKBadge size={48} /> for custom px logo size

type NamedSize = "sm" | "md" | "lg";

interface SizeConfig {
  logo: number;
  font: number;
  subFont: number;
  padding: string;
  gap: number;
}

interface RWSDKBadgeProps {
  size?: NamedSize | number;
}

const SIZES: Record<NamedSize, SizeConfig> = {
  sm: { logo: 24, font: 11, subFont: 8,  padding: "5px 12px 5px 7px",  gap: 7  },
  md: { logo: 32, font: 13, subFont: 9,  padding: "8px 16px 8px 10px", gap: 9  },
  lg: { logo: 44, font: 16, subFont: 10, padding: "10px 20px 10px 12px", gap: 11 },
};

const LOGO_URL = "https://avatars.githubusercontent.com/u/45050444?s=200&v=4";

interface Link {
  label: string;
  sub: string;
  href: string;
  icon: React.ReactNode;
}

interface ContactInfo {
  name: string;
  email: string;
  github: string;
  githubUrl: string;
}

const contact: ContactInfo = {
  name: "Made by RQ with QNTBR",
  email: "theqntbr@gmail.com",
  github: "QuinnsCode",
  githubUrl: "https://github.com/QuinnsCode",
};

const links: Link[] = [
  {
    label: "GitHub",
    sub: "redwoodjs/sdk",
    href: "https://github.com/redwoodjs/sdk",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
      </svg>
    ),
  },
  {
    label: "rwsdk.com",
    sub: "Official site",
    href: "https://rwsdk.com/",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
      </svg>
    ),
  },
  {
    label: "Docs",
    sub: "docs.rwsdk.com",
    href: "https://docs.rwsdk.com/",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
];

export default function RWSDKBadge({ size = "md" }: RWSDKBadgeProps) {
  const [open, setOpen] = useState(false);
  const [bouncing, setBouncing] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);

  // Resolve size: named preset or raw number
  const s: SizeConfig = typeof size === "number"
    ? { logo: size, font: size * 0.4, subFont: size * 0.27, padding: `${size*0.22}px ${size*0.5}px ${size*0.22}px ${size*0.3}px`, gap: size * 0.28 }
    : (SIZES[size] ?? SIZES.md);

  const handleClick = () => {
    if (bouncing) return;
    setBouncing(true);
    setTimeout(() => setBouncing(false), 700);
    if (!open) {
      setOpen(true);
      setTimeout(() => setPopupVisible(true), 50);
    } else {
      setPopupVisible(false);
      setTimeout(() => setOpen(false), 250);
    }
  };

  return (
    <div style={{ position: "fixed", bottom: "24px", left: "24px", zIndex: 9999, display: "flex", alignItems: "flex-end", gap: "10px", fontFamily: "'DM Mono', 'Fira Code', monospace" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap');
        @keyframes bubbly-hop {
          0%   { transform: scale(1) translateY(0); }
          15%  { transform: scale(1.15, 0.88) translateY(4px); }
          30%  { transform: scale(0.9, 1.15) translateY(-14px); }
          45%  { transform: scale(1.08, 0.93) translateY(0px); }
          60%  { transform: scale(0.96, 1.06) translateY(-7px); }
          75%  { transform: scale(1.03, 0.97) translateY(0px); }
          88%  { transform: scale(0.99, 1.01) translateY(-3px); }
          100% { transform: scale(1) translateY(0); }
        }
        .rw-badge {
          display: flex; align-items: center;
          background: #161a26; border: 1px solid rgba(249,115,22,0.35);
          border-radius: 999px;
          cursor: pointer; box-shadow: 0 4px 24px rgba(0,0,0,0.5);
          transition: box-shadow 0.2s, border-color 0.2s, background 0.2s;
          user-select: none; white-space: nowrap; transform-origin: bottom center;
        }
        .rw-badge:hover {
          background: #1c2235; border-color: rgba(249,115,22,0.7);
          box-shadow: 0 0 18px rgba(249,115,22,0.18), 0 4px 24px rgba(0,0,0,0.5);
        }
        .rw-badge.bouncing { animation: bubbly-hop 0.7s cubic-bezier(0.36, 0.07, 0.19, 0.97) both; }
        .rw-badge-text { display: flex; flex-direction: column; line-height: 1.1; }
        .rw-badge-made { font-weight: 400; color: rgba(255,255,255,0.45); text-transform: uppercase; letter-spacing: 0.08em; }
        .rw-badge-name { font-weight: 500; color: #fff; }
        .rw-badge-name span { color: #f97316; }
        .rw-popup {
          background: #161a26; border: 1px solid rgba(249,115,22,0.3);
          border-radius: 16px; padding: 8px;
          box-shadow: 0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset;
          display: flex; flex-direction: column; gap: 2px; min-width: 200px;
          transform-origin: bottom left;
          transition: opacity 0.22s ease, transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
          opacity: 0; transform: scale(0.88) translateY(8px); pointer-events: none;
        }
        .rw-popup.visible { opacity: 1; transform: scale(1) translateY(0); pointer-events: all; }
        .rw-popup-link {
          display: flex; align-items: center; gap: 11px; padding: 10px 12px;
          border-radius: 10px; text-decoration: none; color: #fff; transition: background 0.15s;
        }
        .rw-popup-link:hover { background: rgba(249,115,22,0.12); }
        .rw-popup-link:hover .rw-link-icon { color: #f97316; }
        .rw-link-icon { color: rgba(255,255,255,0.45); transition: color 0.15s; flex-shrink: 0; }
        .rw-link-text { display: flex; flex-direction: column; line-height: 1.2; }
        .rw-link-label { font-size: 13px; font-weight: 500; color: #fff; }
        .rw-link-sub { font-size: 10.5px; color: rgba(255,255,255,0.38); font-weight: 400; }
        .rw-divider { height: 1px; background: rgba(255,255,255,0.06); margin: 2px 4px; }
        .rw-contact { margin: 4px 4px 2px; padding: 8px 12px 6px; border-top: 1px solid rgba(255,255,255,0.06); }
        .rw-contact-name { font-size: 10.5px; font-weight: 500; color: rgba(255,255,255,0.4); margin-bottom: 4px; }
        .rw-contact-row { display: flex; align-items: center; gap: 6px; margin-top: 3px; }
        .rw-contact-link { font-size: 11px; color: rgba(255,255,255,0.3); text-decoration: none; transition: color 0.15s; }
        .rw-contact-link:hover { color: #f97316; }
      `}</style>

      <div
        className={`rw-badge${bouncing ? " bouncing" : ""}`}
        onClick={handleClick}
        role="button"
        aria-label="Made with RedwoodSDK"
        style={{ padding: s.padding, gap: s.gap }}
      >
        <img
          src={LOGO_URL}
          width={s.logo}
          height={s.logo}
          alt="RedwoodSDK"
          style={{ borderRadius: "4px", display: "block", flexShrink: 0 }}
        />
        <div className="rw-badge-text">
          <span className="rw-badge-made" style={{ fontSize: s.subFont }}>Made with</span>
          <span className="rw-badge-name" style={{ fontSize: s.font }}>Redwood<span>SDK</span></span>
        </div>
      </div>

      {open && (
        <div className={`rw-popup${popupVisible ? " visible" : ""}`}>
          {links.map((link, i) => (
            <div key={link.href}>
              {i > 0 && <div className="rw-divider" />}
              <a href={link.href} target="_blank" rel="noopener noreferrer" className="rw-popup-link">
                <span className="rw-link-icon">{link.icon}</span>
                <div className="rw-link-text">
                  <span className="rw-link-label">{link.label}</span>
                  <span className="rw-link-sub">{link.sub}</span>
                </div>
              </a>
            </div>
          ))}
          <div className="rw-contact">
            <div className="rw-contact-name">{contact.name}</div>
            <div className="rw-contact-row">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{opacity:0.4}}>
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
              </svg>
              <a href={`mailto:${contact.email}`} className="rw-contact-link">{contact.email}</a>
            </div>
            <div className="rw-contact-row">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{opacity:0.4}}>
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
              </svg>
              <a href={contact.githubUrl} target="_blank" rel="noopener noreferrer" className="rw-contact-link">{contact.github}</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}