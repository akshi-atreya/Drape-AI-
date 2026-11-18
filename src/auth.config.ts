import type { NextAuthConfig } from "next-auth";
import { AUTH_DISABLED } from "@/lib/auth-mode";

/**
 * Edge-safe auth config: no database access here (this runs in
 * middleware/Edge runtime). The Credentials provider itself — which does
 * hit the SQLite user store — is added on top of this in src/auth.ts, which
 * only runs in the Node.js runtime (route handlers).
 */
export const authConfig = {
  pages: {
    signIn: "/sign-in",
  },
  callbacks: {
    authorized({ auth, request }) {
      if (AUTH_DISABLED) return true; // local testing only; never true in production
      const isLoggedIn = !!auth?.user;
      const path = request.nextUrl.pathname;
      const isPublicRoute =
        path.startsWith("/sign-in") ||
        path.startsWith("/sign-up") ||
        path.startsWith("/api/auth") ||
        path.startsWith("/api/stats") ||
        path.startsWith("/api/cron") || // secret-protected; Vercel Cron has no session
        path.startsWith("/about");
      if (isPublicRoute) return true;
      return isLoggedIn;
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  providers: [], // populated in auth.ts
} satisfies NextAuthConfig;
