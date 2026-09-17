import { NextRequest, NextResponse } from "next/server";
import { generateTryOnImage } from "@/lib/tryon-provider";
import { OutfitItem } from "@/lib/types";

export const runtime = "nodejs";

interface TryOnRequestBody {
  photoDataUrl: string;
  items: OutfitItem[];
}

/**
 * Real virtual try-on, backed by Gemini's image model (see
 * src/lib/tryon-provider.ts). Requires GEMINI_API_KEY in .env.local.
 */
export async function POST(req: NextRequest) {
  let body: TryOnRequestBody;
  try {
    body = await req.json();
  } catch {
    // Most commonly an oversized/truncated request body — the client now
    // re-encodes uploads through a canvas to keep these small, but keep
    // this message actionable in case a very large photo still slips through.
    return NextResponse.json(
      { error: "That photo couldn't be uploaded — try a smaller image or a different photo." },
      { status: 400 }
    );
  }

  if (!body?.photoDataUrl || !Array.isArray(body.items)) {
    return NextResponse.json({ error: "photoDataUrl and items are required" }, { status: 400 });
  }

  // Defensive cap even though the client compresses uploads before sending —
  // a ~15MB data URL comfortably covers a 1280px JPEG at max quality.
  if (body.photoDataUrl.length > 15_000_000) {
    return NextResponse.json(
      { error: "That photo is too large. Please try a smaller image." },
      { status: 413 }
    );
  }

  const result = await generateTryOnImage(body.photoDataUrl, body.items);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }
  return NextResponse.json({ imageDataUrl: result.imageDataUrl });
}
