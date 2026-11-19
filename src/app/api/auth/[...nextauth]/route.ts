import type { NextRequest } from "next/server";
import { handlers } from "@/auth";

export const POST = handlers.POST;

export async function GET(req: NextRequest) {
  const res = await handlers.GET(req);
  // Checking the session must only READ it. By default every check also re-issues the login
  // cookie; one of those arriving after a sign-out (the page fires several at once) put the
  // cookie back, so "Sign out" sometimes didn't sign you out. Only signing in sets it.
  if (new URL(req.url).pathname.endsWith("/session")) res.headers.delete("set-cookie");
  return res;
}
