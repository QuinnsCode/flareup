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
- **Webhook alerts** — Slack, Discord, PagerDuty, or any HTTP endpoint (self-hosted)
- **Zero storage** — your token lives in your browser tab only. close it, it's gone.

---

## Two ways to use it

### Hosted dashboard — [flareup.dev](https://flareup.dev)

Paste a read-only token. We verify it rejects write access, auto-detect your account ID, and show you a live dashboard. Token transits our Worker proxy (required — Cloudflare's API blocks browser CORS). We never store it anywhere.

### Self-hosted — your own Cloudflare account

Deploy FlareUp as a Worker in your own account. Your token never leaves your infra. Cron jobs run every 5 minutes for spike detection, hourly for burn rate, and daily for full reports.

---

## Self-hosting

### 1. Prerequisites

- [Cloudflare account](https://cloudflare.com) (free tier works)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) installed
- Node.js 18+

```bash
npm install -g wrangler
wrangler login
```

---

### 2. Clone the repo

```bash
git clone https://github.com/QuinnsCode/flareup.git
cd flareup
npm install
```

---

### 3. Create your Cloudflare resources

Create these in your Cloudflare dashboard or via Wrangler. We recommend the naming pattern `appname-purpose-type`.

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

---

### 4. Configure wrangler.jsonc

Copy the template and fill in your values:

```bash
cp wrangler-copy.jsonc wrangler.jsonc
```

Then edit `wrangler.jsonc`:

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "flareup",                          // your Worker name
  "main": "src/worker.tsx",
  "compatibility_date": "2025-08-21",
  "compatibility_flags": ["nodejs_compat"],
  "assets": {
    "binding": "ASSETS",
    "directory": "public"
  },
  "routes": [
    "yourdomain.com/*",                       // your domain
    "*.yourdomain.com/*"                      // wildcard for subdomains
  ],
  "observability": { "enabled": true },
  "triggers": {
    // Cron 1: every 5 min  — spike detection
    // Cron 2: every hour   — burn rate + month projection
    // Cron 3: daily 00:00  — full report webhook
    "crons": ["*/5 * * * *", "0 * * * *", "0 0 * * *"]
  },
  "durable_objects": {
    "bindings": [
      { "name": "SESSION_DURABLE_OBJECT", "class_name": "SessionDurableObject" },
      { "name": "USER_SESSION_DO",        "class_name": "UserSessionDO" }
    ]
  },
  "vars": {
    "BETTER_AUTH_URL": "https://yourdomain.com",
    "PRIMARY_DOMAIN":  "yourdomain.com"
  },
  "migrations": [
    { "tag": "v1", "new_sqlite_classes": ["SessionDurableObject"] },
    { "tag": "v2", "new_sqlite_classes": ["UserSessionDO"] }
  ],
  "d1_databases": [
    {
      "binding":       "DB",
      "database_name": "flareup-db",          // name you used above
      "database_id":   "paste-your-id-here"   // from wrangler d1 create output
    }
  ],
  "kv_namespaces": [
    { "binding": "RATELIMIT_KV",    "id": "paste-your-id-here" },  // flareup-ratelimit-kv
    { "binding": "AUTH_CACHE_KV",   "id": "paste-your-id-here" },  // flareup-auth-kv
    { "binding": "ALERT_CONFIG_KV", "id": "paste-your-id-here" }   // flareup-alerts-kv
  ]
}
```

`wrangler.jsonc` is gitignored — it never gets pushed.

---

### 5. Set secrets

```bash
wrangler secret put BETTER_AUTH_SECRET
# paste a long random string — openssl rand -base64 32

wrangler secret put CF_API_TOKEN
# optional — only needed for cron-based background monitoring
# paste a read-only token scoped to your own account

wrangler secret put CF_ACCOUNT_ID
# your Cloudflare account ID
```

---

### 6. Run database migrations

```bash
wrangler d1 migrations apply flareup-db
```

---

### 7. Deploy

```bash
wrangler deploy
```

---

### 8. Wire up your domain

In your Cloudflare dashboard under **DNS** for your domain, add:

| Type  | Name | Target       |
|-------|------|--------------|
| CNAME | `*`  | yourdomain.com |
| CNAME | `www`| yourdomain.com |

The `*` wildcard CNAME is what makes subdomains work automatically — org slugs, user workspaces, etc. all route through the same Worker.

Then under your Worker → **Settings → Domains & Routes**, add:

| Type          | Value                  |
|---------------|------------------------|
| Route         | `yourdomain.com/*`     |
| Route         | `*.yourdomain.com/*`   |
| Custom domain | `yourdomain.com`       |

This matches what you see in the Cloudflare dashboard — routes handle the traffic pattern, custom domain handles the TLS cert.

---

### 9. Local dev

```bash
npm run dev
```

Wrangler will use your `wrangler.jsonc` for local bindings. The app runs at `localhost:5173` by default.

---

## Architecture

```
Browser
  └── flareup.dev (Cloudflare Worker)
        ├── /api/cf/*        — proxy to api.cloudflare.com (fixes CORS)
        ├── /api/alerts/*    — alert config read/write (KV)
        ├── /dashboard       — React dashboard (client)
        ├── /                — landing page
        └── Cron triggers
              ├── */5 * * * *  — spike detection
              ├── 0 * * * *    — burn rate projection
              └── 0 0 * * *    — daily report webhook
```

The Worker proxies all Cloudflare API calls because browsers can't hit `api.cloudflare.com` directly (CORS). Your token transits the Worker in request headers — it's never written to KV, D1, logs, or anywhere else.

---

## Token permissions

FlareUp needs **read-only** access. Write permissions are rejected on connect.

Minimum required: `Account Analytics: Read`

Recommended full set (all read-only):

| Permission | What we read |
|---|---|
| Account Analytics | Workers, KV, D1, R2, DO, Queues via GraphQL |
| Billing | Invoice totals |
| Workers AI | Neuron counts per model |
| Workers KV Storage | Read/write op counts |
| Workers R2 Storage | Op counts + storage GB |
| D1 | Row read/write counts |
| Queues | Message operations |
| Stream | Minutes stored/delivered |
| Cloudflare Images | Images stored + transformations |
| Workers Scripts | Script names |
| Workers Observability | CPU time, error rates |
| Vectorize | Query counts + dimensions |

None of these expose your actual data — DNS records, code, stored files, database rows. This is your accountant's view, not your admin's.

---

## Contributing

PRs welcome. Open an issue first for anything major.

---

## License

MIT