import { route } from "rwsdk/router";
import { LoginPage } from "./BetterAuthLogin";
import BetterAuthSignup from "./BetterAuthSignup";
import RequestPasswordResetPage from "./RequestPasswordReset";
import ResetPasswordPage from "./ResetPassword";
import { authClient } from "@/lib/auth-client";

export const userRoutes = [
  route("/login", LoginPage),
  route("/signin", LoginPage),
  route("/sign-in", LoginPage),
  route("/logout", async function ({ request }) {
    const { auth } = await import("@/lib/auth");
    return auth.handler(request);
  }),

  route("/signout", async function ({ request }) {
    const { auth } = await import("@/lib/auth");
    return auth.handler(request);
  }),
  route("/signup", BetterAuthSignup),
  route("/forgot-password", RequestPasswordResetPage),
  route("/reset-password", ResetPasswordPage),
];