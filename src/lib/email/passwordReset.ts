// @/lib/email/templates/passwordReset.ts

import { env } from "cloudflare:workers";

export function getPasswordResetEmailHTML(resetUrl: string): string {
  const appUrl = (env as any).APP_URL;
  if (!appUrl) throw new Error("APP_URL env var is not set");

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="color-scheme" content="light dark" />
    <meta name="supported-color-schemes" content="light dark" />
    <title>Reset your FlareUp password</title>
    <style type="text/css" rel="stylesheet" media="all">
    @import url("https://fonts.googleapis.com/css?family=Share+Tech+Mono:400&display=swap");

    body {
      width: 100% !important;
      height: 100%;
      margin: 0;
      -webkit-text-size-adjust: none;
      background-color: #060a06;
      color: #e8f0e8;
    }
    body, td, th {
      font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    }
    a { color: #f48c06; }
    a:hover { color: #e85d04; }
    a img { border: none; }
    td { word-break: break-word; }

    .preheader {
      display: none !important;
      visibility: hidden;
      mso-hide: all;
      font-size: 1px;
      line-height: 1px;
      max-height: 0;
      max-width: 0;
      opacity: 0;
      overflow: hidden;
    }

    h1 {
      margin-top: 0;
      color: #e8f0e8;
      font-size: 22px;
      font-weight: bold;
      text-align: left;
    }
    p, ul, ol, blockquote {
      margin: .4em 0 1.1875em;
      font-size: 16px;
      line-height: 1.625;
      color: #8a9e8a;
    }
    p.sub { font-size: 13px; }
    strong { color: #e8f0e8; }

    .mono {
      font-family: "Share Tech Mono", "Courier New", monospace;
      font-size: 13px;
      color: #3a4e3a;
      letter-spacing: 0.06em;
    }

    .button {
      background-color: #e85d04;
      border-top: 10px solid #e85d04;
      border-right: 18px solid #e85d04;
      border-bottom: 10px solid #e85d04;
      border-left: 18px solid #e85d04;
      display: inline-block;
      color: #fff !important;
      text-decoration: none;
      border-radius: 3px;
      box-shadow: 0 2px 16px rgba(232,93,4,0.3);
      -webkit-text-size-adjust: none;
      box-sizing: border-box;
      font-weight: bold;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      font-size: 14px;
    }
    .button:hover {
      background-color: #c94e00;
      border-color: #c94e00;
    }
    @media only screen and (max-width: 500px) {
      .button { width: 100% !important; text-align: center !important; }
    }

    .email-wrapper {
      width: 100%;
      margin: 0;
      padding: 0;
      background-color: #060a06;
    }
    .email-masthead {
      padding: 32px 0 24px;
      text-align: center;
      border-bottom: 1px solid rgba(232,93,4,0.15);
    }
    .email-masthead_name {
      font-size: 18px;
      font-weight: bold;
      color: #f48c06;
      text-decoration: none;
      letter-spacing: 0.2em;
      font-family: "Share Tech Mono", monospace;
    }
    .email-masthead_sub {
      display: block;
      font-family: "Share Tech Mono", monospace;
      font-size: 10px;
      color: #3a4e3a;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      margin-top: 6px;
    }
    .email-body_inner {
      width: 570px;
      margin: 0 auto;
      padding: 0;
      background-color: #0a0f0a;
      border: 1px solid rgba(232,93,4,0.12);
      border-top: 2px solid #e85d04;
    }
    .email-footer {
      width: 570px;
      margin: 0 auto;
      padding: 0;
      text-align: center;
    }
    .email-footer p {
      color: #3a4e3a;
      font-size: 12px;
    }
    .body-action {
      width: 100%;
      margin: 30px auto;
      padding: 0;
      text-align: center;
    }
    .body-sub {
      margin-top: 25px;
      padding-top: 25px;
      border-top: 1px solid rgba(255,255,255,0.05);
    }
    .content-cell { padding: 40px 45px; }

    .alert-bar {
      background: rgba(220,38,38,0.06);
      border: 1px solid rgba(220,38,38,0.15);
      border-radius: 3px;
      padding: 10px 14px;
      margin-bottom: 24px;
      font-family: "Share Tech Mono", monospace;
      font-size: 11px;
      color: #ef4444;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }

    @media only screen and (max-width: 600px) {
      .email-body_inner, .email-footer { width: 100% !important; }
      .content-cell { padding: 24px 20px !important; }
    }
    @media (prefers-color-scheme: dark) {
      h1 { color: #e8f0e8 !important; }
    }
    </style>
  </head>
  <body>
    <span class="preheader">Reset your FlareUp password — link valid for 1 hour.</span>
    <table class="email-wrapper" width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center">
          <table class="email-content" width="100%" cellpadding="0" cellspacing="0" role="presentation">

            <!-- Masthead -->
            <tr>
              <td class="email-masthead">
                <a href="https://${appUrl}" class="email-masthead_name">🔥 FLAREUP</a>
                <span class="email-masthead_sub">// billing visibility before the $8,000 surprise</span>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td class="email-body" width="570" cellpadding="0" cellspacing="0">
                <table class="email-body_inner" align="center" width="570" cellpadding="0" cellspacing="0" role="presentation">
                  <tr>
                    <td class="content-cell">
                      <div class="alert-bar">⚠ password reset requested</div>
                      <h1>Your account is trying to reach you.</h1>
                      <p>
                        Someone requested a password reset for your <strong>${appUrl}</strong> account.
                        If that was you, use the button below.
                        <strong>This link expires in 1 hour.</strong>
                      </p>

                      <table class="body-action" align="center" width="100%" cellpadding="0" cellspacing="0" role="presentation">
                        <tr>
                          <td align="center">
                            <a href="${resetUrl}" class="button" target="_blank">🔑 Reset password</a>
                          </td>
                        </tr>
                      </table>

                      <p>
                        If you didn't request this, ignore this email — your password won't change.
                        No action needed.
                      </p>

                      <p class="mono">// no one from FlareUp will ever ask for your password<br />// this link works once and expires in 60 minutes</p>

                      <table class="body-sub" role="presentation">
                        <tr>
                          <td>
                            <p class="sub">Button not working? Copy and paste this URL into your browser:</p>
                            <p class="sub" style="word-break: break-all; color: #f48c06;">${resetUrl}</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td>
                <table class="email-footer" align="center" width="570" cellpadding="0" cellspacing="0" role="presentation">
                  <tr>
                    <td class="content-cell" align="center">
                      <p class="sub" style="color: #3a4e3a;">
                        FlareUp — <a href="https://${appUrl}" style="color: #3a4e3a;">${appUrl}</a>
                      </p>
                      <p class="sub" style="color: #3a4e3a; font-family: monospace; font-size: 11px;">
                        // billing visibility before the $8,000 surprise
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}