import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Virtual try-on integration abstraction.
 *
 * MVP: no real garment-compositing model is wired up — the UI renders an
 * honest "style preview" (photo + outfit pieces) instead of a fabricated
 * generated image. This endpoint exists as the seam where a real try-on
 * model/API would be called:
 *
 *   const result = await tryOnProvider.generate({ photoDataUrl, productImageUrls });
 *   return NextResponse.json({ resultDataUrl: result.imageUrl, isSimulated: false });
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  if (!body?.outfitId) {
    return NextResponse.json({ error: "outfitId is required" }, { status: 400 });
  }
  return NextResponse.json({ ok: true, isSimulated: true });
}
