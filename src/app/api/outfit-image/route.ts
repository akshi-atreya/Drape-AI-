import { NextRequest, NextResponse } from "next/server";
import { generateOutfitImage } from "@/lib/outfit-image-provider";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Generates the single illustrative image shown at the top of an outfit card. */
export async function POST(req: NextRequest) {
  let body: { pieces?: unknown; photos?: unknown; gender?: unknown; occasion?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const pieces = Array.isArray(body.pieces)
    ? body.pieces
        .filter((p): p is string => typeof p === "string")
        .map((p) => p.replace(/[^\p{L}\p{N}\s,'()&.-]/gu, "").trim().slice(0, 120))
        .filter(Boolean)
    : [];
  if (pieces.length < 2 || pieces.length > 8) {
    return NextResponse.json({ error: "Provide 2–8 pieces." }, { status: 400 });
  }
  // Optional reference photos of garments the shopper owns, aligned with `pieces`.
  const photoOk = (v: unknown): string | null =>
    typeof v === "string" && v.length <= 1_600_000 && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(v) ? v : null;
  const photos = pieces.map((_, i) => (Array.isArray(body.photos) ? photoOk(body.photos[i]) : null)).slice(0, pieces.length);
  if (photos.filter(Boolean).length > 3) {
    return NextResponse.json({ error: "Too many photos." }, { status: 400 });
  }
  const gender = body.gender === "Women" || body.gender === "Men" || body.gender === "Unisex" ? body.gender : null;
  const occasion = typeof body.occasion === "string" ? body.occasion.replace(/[^\p{L}\p{N}\s'&-]/gu, "").trim().slice(0, 60) || "everyday" : "everyday";

  const result = await generateOutfitImage({ pieces, photos, gender, occasion });
  if (result.error) return NextResponse.json({ error: result.error, reason: result.reason }, { status: 502 });
  return NextResponse.json({ imageDataUrl: result.imageDataUrl });
}
