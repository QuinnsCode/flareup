import { defineApp } from "rwsdk/worker";
import { route, render, prefix } from "rwsdk/router";
import { Document } from "@/app/Document";
import { setCommonHeaders } from "@/app/headers";
import { userRoutes } from "@/app/pages/user/routes";
import { changelogRoute, aboutRoute, termsRoute } from "@/app/pages/staticRoutes";
import { initAuth } from "@/lib/auth";
import { type Organization } from "@/db";
import {
  initializeServices,
  setupOrganizationContext,
  setupSessionContext,
  extractOrgFromSubdomain,
  shouldSkipMiddleware,
} from "@/lib/middlewareFunctions";
import { env } from "cloudflare:workers";
import { verifyTurnstileToken } from "@/lib/turnstile";
import OrgNotFoundPage from "@/app/pages/errors/OrgNotFoundPage";
import NoAccessPage from "@/app/pages/errors/NoAccessPage";
import LandingPage from "@/app/pages/landing/LandingPage";
import SanctumPage from "@/app/pages/sanctum/SanctumPage";

// ── Durable Object exports ────────────────────────────────────────────────────
export { SessionDurableObject } from "./session/durableObject";
export { UserSessionDO } from "./durableObjects/userSessionDO";

// ── App context type ──────────────────────────────────────────────────────────
export type AppContext = {
  session: any | null;
  user: any | null;
  organization: Organization | null;
  userRole: string | null;
  orgError: "ORG_NOT_FOUND" | "NO_ACCESS" | "ERROR" | null;
};

// ── URL normalization ─────────────────────────────────────────────────────────
// Strips www and forces HTTPS in production.
// Set PRIMARY_DOMAIN to your domain — subdomains are used for org scoping.
function normalizeUrl(request: Request): Response | null {
  const url = new URL(request.url);
  const PRIMARY_DOMAIN = (env as any).PRIMARY_DOMAIN || "example.com";
  const isLocalhost = url.hostname.includes("localhost");

  if (isLocalhost) return null;

  let shouldRedirect = false;
  let newHostname = url.hostname;
  let newProtocol = url.protocol;

  if (url.protocol === "http:") {
    newProtocol = "https:";
    shouldRedirect = true;
  }

  if (url.hostname === `www.${PRIMARY_DOMAIN}`) {
    newHostname = PRIMARY_DOMAIN;
    shouldRedirect = true;
  }

  if (shouldRedirect) {
    return new Response(null, {
      status: 301,
      headers: {
        Location: `${newProtocol}//${newHostname}${url.pathname}${url.search}${url.hash}`,
      },
    });
  }

  return null;
}

// ── App ───────────────────────────────────────────────────────────────────────
export default defineApp([
  setCommonHeaders(),

  // 1. URL normalization — always first
  async ({ request }) => {
    const redirect = normalizeUrl(request);
    if (redirect) return redirect;
  },

  /**
   * ⚠️ CRITICAL MIDDLEWARE CHAIN — DO NOT REORDER ⚠️
   *
   * Sets up ctx.user, ctx.organization, ctx.userRole on every request.
   *
   * Order matters:
   *   1. initializeServices()       — DB + auth singleton setup
   *   2. setupSessionContext()      — reads BetterAuth cookie → ctx.user
   *   3. setupOrganizationContext() — reads subdomain → ctx.organization
   *   4. autoCreateOrgMiddleware()  — creates org for new users, redirects
   *
   * Breaking this order causes:
   *   - Login redirect failures
   *   - "No Organization" errors on valid subdomains
   *   - ctx.organization null on org subdomains
   *
   * DO NOT:
   *   ❌ Add shouldRunMiddleware conditionals
   *   ❌ Swap steps 2 and 3
   *   ❌ Remove autoCreateOrgMiddleware
   *   ❌ Add new middleware without testing the full login flow
   *
   * CACHE NOTE:
   *   AUTH_CACHE_KV has 5-10 min TTL. If org appears missing after creation,
   *   wait or flush KV manually.
   */
  async ({ ctx, request }) => {
    try {
      await initializeServices();

      if (shouldSkipMiddleware(request)) return;

      await setupSessionContext(ctx, request);
      await setupOrganizationContext(ctx, request);

      const { autoCreateOrgMiddleware } = await import(
        "@/lib/middleware/autoCreateOrgMiddleware"
      );
      const result = await autoCreateOrgMiddleware(ctx, request);
      if (result) return result;

      // Org error handling — redirect appropriately
      if (
        ctx.orgError &&
        !request.url.includes("/api/") &&
        !request.url.includes("/__") &&
        !request.url.includes("/user/") &&
        !request.url.includes("/orgs/new")
      ) {
        const url = new URL(request.url);
        const mainDomain = url.hostname.includes("localhost")
          ? "localhost:5173"
          : (env as any).PRIMARY_DOMAIN || "example.com";

        if (ctx.orgError === "ORG_NOT_FOUND") {
          const orgSlug = extractOrgFromSubdomain(request);
          return new Response(null, {
            status: 302,
            headers: {
              Location: `${url.protocol}//${mainDomain}/orgs/new?suggested=${orgSlug}`,
            },
          });
        }

        if (ctx.orgError === "NO_ACCESS") {
          return new Response(null, {
            status: 302,
            headers: { Location: "/user/login" },
          });
        }
      }
    } catch (error) {
      console.error("Middleware error:", error);
      ctx.session = null;
      ctx.user = null;
      ctx.organization = null;
      ctx.userRole = null;
      ctx.orgError = null;
    }
  },

  // ── User Session DO — WebSocket + Hibernation API example ──────────────────
  // Connect: ws://your-domain/__user-session?userId=xxx&deviceId=yyy
  // See src/durableObjects/userSessionDO.ts for the full pattern.
  route("/__user-session", async ({ request }) => {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return new Response("Missing userId", { status: 400 });
    }

    const id = env.USER_SESSION_DO.idFromName(userId);
    const stub = env.USER_SESSION_DO.get(id);
    return stub.fetch(request);
  }),

  // ── API routes ──────────────────────────────────────────────────────────────
  prefix("/api", [
    // Stripe checkout
    route("/stripe/create-checkout", async ({ request, ctx }) => {
      const { default: handler } = await import(
        "@/app/api/stripe/create-checkout"
      );
      return handler({ request, ctx } as any);
    }),

    // BetterAuth — Turnstile bot protection on signup
    route("/auth/*", async ({ request }) => {
      try {
        if (request.url.includes("/sign-up") && request.method === "POST") {
          const body = await request.clone().json() as any;
          if (body.turnstileToken) {
            const isValid = await verifyTurnstileToken(body.turnstileToken);
            if (!isValid) {
              return new Response(
                JSON.stringify({ error: "Bot protection verification failed" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
              );
            }
          }
        }

        await initializeServices();
        const authInstance = initAuth();
        return await authInstance.handler(request);
      } catch (error) {
        return new Response(
          JSON.stringify({ error: "Auth failed", message: String(error) }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    }),

    // Webhooks
    route("/webhooks/:service", async ({ request, params, ctx }) => {
      if (params.service === "stripe") {
        const { default: handler } = await import(
          "@/app/api/webhooks/stripe-wh"
        );
        return handler({ request });
      }
      if (params.service === "lemonsqueezy") {
        const { default: handler } = await import(
          "@/app/api/webhooks/lemonsqueezy-wh"
        );
        return handler({ request, ctx });
      }
      return Response.json({ error: "Webhook not supported" }, { status: 404 });
    }),

    // Catch-all dynamic API loader — drop a file in src/app/api/ and it's live
    route("*", async ({ request, params, ctx }) => {
      const apiPath = params.$0;

      if (!apiPath) {
        return new Response(
          JSON.stringify({ error: "API endpoint not specified" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      try {
        const handler = await import(
          /* @vite-ignore */ `@/app/api/${apiPath}`
        );
        return await handler.default({ request, ctx, params, method: request.method });
      } catch (error: any) {
        if (error.message?.includes("Cannot resolve module")) {
          return new Response(
            JSON.stringify({ error: "API endpoint not found", path: `/api/${apiPath}` }),
            { status: 404, headers: { "Content-Type": "application/json" } }
          );
        }
        return new Response(
          JSON.stringify({ error: "Internal server error", message: error.message }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    }),
  ]),

  // ── Frontend routes ─────────────────────────────────────────────────────────
  render(Document, [
    route("/org-not-found", OrgNotFoundPage),
    route("/no-access", NoAccessPage),

    prefix("/user", userRoutes),

    changelogRoute,
    aboutRoute,
    termsRoute,

    // Authenticated home — replace with your app's main page
    route("/sanctum", SanctumPage),

    // Root — landing for main domain, redirect to /sanctum for org subdomains
    route("/", [
      ({ ctx, request }) => {
        const url = new URL(request.url);
        if (url.pathname !== "/") return;

        const orgSlug = extractOrgFromSubdomain(request);
        if (!orgSlug) return; // main domain → fall through to LandingPage

        if (ctx.orgError) return;

        if (ctx.organization && (!ctx.user || !ctx.userRole)) {
          return new Response(null, {
            status: 302,
            headers: { Location: "/user/login" },
          });
        }

        if (ctx.organization && ctx.user && ctx.userRole) {
          return new Response(null, {
            status: 302,
            headers: { Location: "/sanctum" },
          });
        }
      },
      LandingPage,
    ]),

    // Catch-all — redirect unknown paths to home
    route("/*", ({ request }) => {
      const url = new URL(request.url);
      if (
        url.pathname.startsWith("/api/") ||
        url.pathname.startsWith("/__") ||
        url.pathname.startsWith("/webhooks/")
      ) {
        return;
      }
      return new Response(null, {
        status: 301,
        headers: { Location: "/" },
      });
    }),
  ]),
]);

// ── Reference: adding a new DO ────────────────────────────────────────────────
// 1. Create src/durableObjects/myDO.ts (model on userSessionDO.ts)
// 2. Export it here:        export { MyDO } from './durableObjects/myDO'
// 3. Add binding in wrangler.jsonc under [[durable_objects.bindings]]
// 4. Add migration in wrangler.jsonc under [[migrations]]
// 5. Wire a route:          route("/__mydo", async ({ request }) => { ... })

// ── Reference: adding a new API endpoint ─────────────────────────────────────
// Drop a file at src/app/api/my-endpoint.ts with a default export:
//   export default async function({ request, ctx, params }) { ... }
// It's automatically available at /api/my-endpoint — no route registration needed.