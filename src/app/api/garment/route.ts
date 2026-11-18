import { NextRequest, NextResponse } from "next/server";
import { garmentFromLink, GarmentFetchError } from "@/lib/garment-fetch";

export const runtime = "nodejs";

/**
 * Turns a pasted product link into the garment's photo. Behind the same
 * sign-in gate as the rest of the app (see src/proxy.ts).
 */
export async function POST(req: NextRequest) {
  let url: unknown;
  try {
    ({ url } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (typeof url !== "string" || url.length > 2048) {
    return NextResponse.json({ error: "Paste a product link." }, { status: 400 });
  }

  try {
    const garment = await garmentFromLink(url.trim());
    return NextResponse.json(garment);
  } catch (err) {
    if (err instanceof GarmentFetchError) {
      return NextResponse.json({ error: err.message, canUpload: true }, { status: 422 });
    }
    console.error("Garment fetch error:", err);
    return NextResponse.json({ error: "Couldn't read that link.", canUpload: true }, { status: 502 });
  }
}
