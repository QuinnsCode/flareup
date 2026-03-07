import styles from "./styles.css?url";
import { Suspense } from 'react'

const siteUrl = "https://flareup.dev";
const title = "FlareUp — Cloudflare Burn Rate Monitor";
const description = "Stop the meltdown before it starts. Real-time Cloudflare cost monitoring for Workers AI, KV, D1, R2 — tracked live, alerted fast, before the invoice arrives.";
const ogImage = "https://flareup.dev/og-image.png";

export function Document({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={siteUrl} />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={siteUrl} />
        <meta property="og:site_name" content="FlareUp" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        {/* Twitter / X */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={siteUrl} />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={ogImage} />

        <link rel="modulepreload" href="/src/client.tsx" />
        <link rel="stylesheet" href={styles} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Black+Ops+One&family=Share+Tech+Mono&family=Barlow:wght@300;400;500;600&family=Barlow+Condensed:wght@400;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Suspense fallback={<div>Loading...</div>}>
          <div id="root">{children}</div>
        </Suspense>
        <script type="module" src="/src/client.tsx"></script>
        <script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          async
          defer
        />
      </body>
    </html>
  )
}