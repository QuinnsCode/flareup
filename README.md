# 🔥 FlareUp

**Cloudflare billing visibility. Before the $8,000 surprise.**

FlareUp monitors your Cloudflare spend in real time — Workers AI, KV, D1, R2, Durable Objects, Queues — and tells you when things are getting expensive before the invoice arrives.

It was built after a $8,247 Workers AI bill showed up with zero warning. There was no monitoring tool. There is now.

---

## What it does

- **Live cost dashboard** — paste a read-only API token, see your burn rate instantly
- **Month-end projection** — extrapolates today's usage across the full billing period
- **Per-model AI tracking** — neurons billed per model, projected cost, share of total
- **Spike detection** — compares current usage against 7-day rolling average (self-hosted)
- **Webhook alerts** — Slack, Discord, or any HTTP endpoint (self-hosted)
- **Zero storage** — your token lives in your browser tab only. close it, it's gone.

---

## Two ways to use it

### Hosted — [flareup.dev](https://flareup.dev)

Paste a read-only token. We verify it rejects write access, auto-detect your account ID, and show you a live dashboard. Token transits our Worker proxy (required — Cloudflare's API blocks browser CORS). We never store it anywhere. Close the tab and it's gone.

Webhook alerts are **self-hosted only** — the hosted dashboard has no server-side token to run background monitoring against your account.

### Self-hosted — your own Cloudflare account

Deploy FlareUp as a Worker in your own account. Your token never leaves your infra. Cron jobs run every 5 minutes for spike detection, hourly for burn rate, and daily for full reports. The alerts config page unlocks automatically when `CLOUDFLARE_API_TOKEN` is set.

---

## Self-hosting setup

### 1. Prerequisites

- [Cloudflare account](https://cloudflare.com) (free tier works)
- Node.js 18+ and pnpm

```bash
npm install -g wrangler
wrangler login
```

### 2. Clone and install

```bash
git clone https://github.com/QuinnsCode/flareup.git
cd flareup
pnpm install
```

### 3. Create Cloudflare resources

#### KV Namespaces (3)

```bash
wrangler kv namespace create flareup-ratelimit-kv
wrangler kv namespace create flareup-auth-kv
wrangler kv namespace create flareup-alerts-kv
```

Each command prints an `id` — save all three.

#### D1 Database (1)

```bash
wrangler d1 create flareup-db
```

Prints a `database_id` — save it.

### 4. Configure wrangler.jsonc

```bash
cp wrangler-copy.jsonc wrangler.jsonc
```

Fill in every `paste-your-id-here` in `wrangler.jsonc`. This file is gitignored — your values never get pushed.

```jsonc
{
  "name": "flareup",
  "routes": ["yourdomain.com/*", "*.yourdomain.com/*"],
  "vars": {
    "BETTER_AUTH_URL": "https://yourdomain.com",
    "PRIMARY_DOMAIN":  "yourdomain.com"
  },
  "d1_databases": [
    {
      "binding":       "DB",
      "database_name": "flareup-db",
      "database_id":   "paste-your-id-here"
    }
  ],
  "kv_namespaces": [
    { "binding": "RATELIMIT_KV",    "id": "paste-your-id-here" },
    { "binding": "AUTH_CACHE_KV",   "id": "paste-your-id-here" },
    { "binding": "ALERT_CONFIG_KV", "id": "paste-your-id-here" }
  ]
}
```

### 5. Set secrets

Set via the Cloudflare dashboard (Workers → flareup → Settings → Variables & Secrets) or CLI.

**Required:**

```bash
wrangler secret put BETTER_AUTH_SECRET
# openssl rand -base64 32

wrangler secret put APP_URL
# yourdomain.com  (no https://)
```

**Required for background cron monitoring and alerts:**

```bash
wrangler secret put CLOUDFLARE_API_TOKEN
# Read-only token scoped to your account
# Create at: https://dash.cloudflare.com/profile/api-tokens/create
# Required permission: Account → Account Analytics → Read

wrangler secret put CF_ACCOUNT_ID
# Your 32-char account ID from the Cloudflare dashboard URL
```

> ⚠️ Do not set `CLOUDFLARE_API_TOKEN` as a shell environment variable — Wrangler uses that name internally for CLI auth. Set it via the CF dashboard UI instead.

> ⚠️ **Deploying locally?** If you have `CLOUDFLARE_API_TOKEN` set in `.dev.vars` (for local cron testing), Wrangler will pick it up during `pnpm deploy` and use it as the CLI auth token — causing an authentication error if it's your read-only monitoring token.
>
> Before running `pnpm deploy` or `pnpm run release`, either comment it out:
> ```bash
> # CLOUDFLARE_API_TOKEN=your_readonly_token   ← comment out before deploying
> ```
> Or pass an empty override inline:
> ```bash
> CLOUDFLARE_API_TOKEN= pnpm run release
> ```
> Uncomment after deploy. The inline override is less error-prone since you can't forget to restore it.

**Optional — password reset emails:**

```bash
wrangler secret put RESEND_API_KEY       # resend.com → API Keys
wrangler secret put RESEND_FROM_EMAIL    # no-reply@yourdomain.com (verified Resend domain)
```

### 6. Run migrations

```bash
wrangler d1 migrations apply flareup-db
```

### 7. Deploy

```bash
pnpm deploy
```

### 8. Wire up your domain

In your Cloudflare dashboard → DNS, add:

| Type  | Name  | Target         |
|-------|-------|----------------|
| CNAME | `*`   | yourdomain.com |
| CNAME | `www` | yourdomain.com |

Then under Workers → flareup → Settings → Domains & Routes:

| Type          | Value                |
|---------------|----------------------|
| Route         | `yourdomain.com/*`   |
| Route         | `*.yourdomain.com/*` |
| Custom domain | `yourdomain.com`     |

### 9. Local dev

> ⚠️ Values in `.dev.vars` are also loaded during deploy — see the token warning in Step 5.

Copy `.dev.vars.example` to `.dev.vars` and fill in the same values as your secrets.

```bash
pnpm dev
```

---

## Token permissions

FlareUp **rejects** tokens with write/edit/admin permissions. Write tokens are refused on connect.

Required minimum: `Account Analytics: Read`

Quick link:
`https://dash.cloudflare.com/profile/api-tokens/create?permissionGroupKeys=analytics_read&name=flareup-readonly`

Recommended full set (all read-only):

| Permission | What it covers |
|---|---|
| Account Analytics | Workers, KV, D1, R2, DO, Queues via GraphQL |
| Billing | Invoice totals |
| Workers AI | Neuron counts per model |
| Workers KV Storage | Read/write op counts |
| Workers R2 Storage | Op counts + storage GB |
| D1 | Row read/write counts |
| Queues | Message operations |
| Workers Scripts | Script names |
| Workers Observability | CPU time, error rates |

None of these expose your actual data — DNS records, code, stored files, database rows. This is your accountant's view, not your admin's.

---

## Security model

- **Browser session** — token lives in your tab only, never written anywhere, gone on close
- **Background cron** — token stored as a CF Worker secret on your own account, never in any DB
- **Read-only enforcement** — write permissions rejected on connect
- **Self-hosted** — your token never leaves your own Cloudflare account

---

## Architecture

```
Browser
  └── flareup.dev / your-worker (Cloudflare Worker)
        ├── /api/cf/*        — proxy to api.cloudflare.com (fixes CORS)
        ├── /api/alerts/*    — alert config read/write (KV)
        ├── /dashboard       — React dashboard (RSC + client)
        ├── /alerts          — alert config UI (self-hosted only)
        ├── /                — landing page
        └── Cron triggers (self-hosted only)
              ├── */5 * * * *  — spike detection
              ├── 0 * * * *    — burn rate + month projection
              └── 0 0 * * *    — daily report webhook
```

---

## Contributing

PRs welcome. Open an issue first for anything major.

---

## License

MIT