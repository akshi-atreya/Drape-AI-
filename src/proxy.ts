import NextAuth from "next-auth";
import type { NextFetchEvent, NextRequest } from "next/server";
import { authConfig } from "@/auth.config";

// Edge-safe: uses only the JWT-based session check (authorized() callback),
// never touches the user store directly.
const authGate = NextAuth(authConfig).auth;

export default async function proxy(req: NextRequest, event: NextFetchEvent) {
  // `auth` has many overloads; as middleware it takes (request, event) and returns a response.
  const res = await (authGate as unknown as (r: NextRequest, e: NextFetchEvent) => Promise<Response | undefined>)(req, event);
  // The gate only needs to READ the session. By default it re-issues the login cookie on every
  // request, which could land after a sign-out and undo it (see the session route). Strip those
  // writes; signing in is the only thing that sets the cookie.
  res?.headers.delete("set-cookie");
  return res;
}

export const config = {
  // Skip the sign-in gate for Next's own assets and for static image files in
  // /public (e.g. the founder photo on the public About page) — without this,
  // signed-out visitors get those images redirected to /sign-in.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:jpg|jpeg|png|gif|webp|avif|svg|ico)$).*)"],
};
