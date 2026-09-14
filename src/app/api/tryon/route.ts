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
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body?.photoDataUrl || !Array.isArray(body.items)) {
    return NextResponse.json({ error: "photoDataUrl and items are required" }, { status: 400 });
  }

  const result = await generateTryOnImage(body.photoDataUrl, body.items);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }
  return NextResponse.json({ imageDataUrl: result.imageDataUrl });
}
