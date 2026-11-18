import { NextRequest, NextResponse } from "next/server";
import { resetPasswordWithToken } from "@/lib/password-reset";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: { token?: unknown; password?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const token = typeof body.token === "string" ? body.token : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!/^[A-Za-z0-9_-]{30,100}$/.test(token)) {
    return NextResponse.json({ error: "This reset link isn't valid. Request a new one." }, { status: 400 });
  }
  if (password.length < 8 || password.length > 200) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  try {
    const ok = await resetPasswordWithToken(token, password);
    if (!ok) {
      return NextResponse.json({ error: "This reset link has expired or was already used. Request a new one." }, { status: 400 });
    }
  } catch (err) {
    console.error("Password reset failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
