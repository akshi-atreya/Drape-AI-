import { NextResponse } from "next/server";
import { fetchFxRates } from "@/lib/currency";

export const runtime = "nodejs";

/**
 * Live USD exchange rates for the client to convert displayed prices with.
 * See src/lib/currency.ts for the shared fetch/cache/fallback logic (also
 * used directly by the chat route to give the model an accurate rate).
 */
export async function GET() {
  const { rates, source } = await fetchFxRates();
  return NextResponse.json({ rates, source });
}
