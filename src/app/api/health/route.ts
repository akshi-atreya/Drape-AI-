import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { AUTH_DISABLED } from "@/lib/auth-mode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Setup checklist for the site owner: which server settings are present, and
 * whether the Anthropic key actually works. Only reports yes/no — never a
 * value. Behind sign-in (the proxy gate) and re-checked here.
 */
export async function GET() {
  const session = AUTH_DISABLED ? { user: {} } : await auth(); // AUTH_DISABLED is local-testing only, never true in production
  if (!session?.user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const present = (name: string) => Boolean(process.env[name]?.trim());
  const key = process.env.ANTHROPIC_API_KEY ?? "";

  let anthropic: string;
  if (!key) {
    anthropic = "MISSING — ANTHROPIC_API_KEY is not set";
  } else if (key !== key.trim() || /^["']|["']$/.test(key)) {
    anthropic = "BAD FORMAT — the key has extra spaces or quote marks around it; re-paste it without them";
  } else if (!key.startsWith("sk-ant-")) {
    anthropic = "BAD FORMAT — doesn't look like an Anthropic key (should start with sk-ant-)";
  } else {
    try {
      await new Anthropic({ apiKey: key }).messages.create({
        model: "claude-sonnet-5",
        max_tokens: 1,
        messages: [{ role: "user", content: "hi" }],
      });
      anthropic = "OK — key works";
    } catch (err) {
      const status = err instanceof Anthropic.APIError ? err.status : undefined;
      anthropic =
        status === 401 || status === 403
          ? `REJECTED (${status}) — the key is invalid or revoked; create a new one`
          : status === 429
            ? "RATE LIMITED (429) — key is valid but over its limit"
            : status === 400 && err instanceof Error && /credit balance|billing/i.test(err.message)
              ? "NO CREDITS (400) — the Anthropic account needs billing/credits"
              : status === 404
                ? "MODEL NOT FOUND (404) — model name isn't available to this key"
                : `ERROR${status ? ` (${status})` : ""} — see Vercel function logs`;
    }
  }

  return NextResponse.json({
    anthropic,
    gemini_key_set: present("GEMINI_API_KEY"),
    auth_secret_set: present("AUTH_SECRET"),
    database_url_set: ["POSTGRES_URL", "DATABASE_URL", "POSTGRES_PRISMA_URL"].some(present),
    resend_key_set: present("RESEND_API_KEY"),
    email_from_set: present("EMAIL_FROM"),
    cron_secret_set: present("CRON_SECRET"),
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  });
}
