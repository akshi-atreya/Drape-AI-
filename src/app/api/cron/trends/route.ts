import { NextRequest, NextResponse } from "next/server";
import { getLiveTrends } from "@/lib/live-trends";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // a cold rebuild (feeds + model call) takes ~30s; 60s is the Hobby-plan ceiling

/**
 * Keeps the live-trends cache warm so no shopper ever pays for a rebuild.
 * Called by the daily Vercel Cron in vercel.json, which sends
 * `Authorization: Bearer $CRON_SECRET`. Public to the sign-in gate (cron has
 * no session) but useless without the secret.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const data = await getLiveTrends();
  return NextResponse.json({ live: data.live, trends: data.trends.length, updatedAt: data.updatedAt });
}
