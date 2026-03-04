import { route } from "rwsdk/router";
import { LoginPage } from "./BetterAuthLogin";
import BetterAuthSignup from "./BetterAuthSignup";
import RequestPasswordResetPage from "./RequestPasswordReset";
import ResetPasswordPage from "./ResetPassword";

export const userRoutes = [
  route("/login", LoginPage),
  route("/logout", async function ({ request }) {
    const { auth } = await import("@/lib/auth");
    return auth.handler(request);
  }),
  route("/signup", BetterAuthSignup),
  route("/forgot-password", RequestPasswordResetPage),
  route("/reset-password", ResetPasswordPage),
];