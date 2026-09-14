import type { NextAuthConfig } from "next-auth";

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
      const isLoggedIn = !!auth?.user;
      const path = request.nextUrl.pathname;
      const isPublicRoute =
        path.startsWith("/sign-in") ||
        path.startsWith("/sign-up") ||
        path.startsWith("/api/auth") ||
        path.startsWith("/api/stats");
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
