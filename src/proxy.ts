import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Edge-safe: uses only the JWT-based session check (authorized() callback),
// never touches the SQLite user store directly.
export default NextAuth(authConfig).auth;

export const config = {
  // Skip the sign-in gate for Next's own assets and for static image files in
  // /public (e.g. the founder photo on the public About page) — without this,
  // signed-out visitors get those images redirected to /sign-in.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:jpg|jpeg|png|gif|webp|avif|svg|ico)$).*)"],
};
