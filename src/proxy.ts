import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Edge-safe: uses only the JWT-based session check (authorized() callback),
// never touches the SQLite user store directly.
export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
