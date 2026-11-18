import { NextRequest, NextResponse } from "next/server";
import { createPasswordResetToken } from "@/lib/password-reset";
import { passwordResetEmail, sendEmail } from "@/lib/email";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Where reset links should point. Prefer configuration over the request's Host header. */
function siteUrl(req: NextRequest): string {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return req.nextUrl.origin;
}

/**
 * Always answers the same way for a well-formed email, whether or not an
 * account exists, so this can't be used to find out who has an account.
 */
export async function POST(req: NextRequest) {
  let email = "";
  try {
    email = String((await req.json()).email ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  try {
    const result = await createPasswordResetToken(email);
    if (result) {
      const url = `${siteUrl(req)}/reset-password?token=${encodeURIComponent(result.token)}`;
      await sendEmail({ to: result.email, ...passwordResetEmail(url) });
    }
  } catch (err) {
    // Logged for us; the shopper still sees the neutral message below.
    console.error("Password reset request failed:", err instanceof Error ? err.message : err);
  }
  return NextResponse.json({ ok: true });
}
