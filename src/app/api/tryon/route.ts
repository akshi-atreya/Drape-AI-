import { NextRequest, NextResponse } from "next/server";
import { generateTryOnImage, TryOnPiece, TryOnSubject } from "@/lib/tryon-provider";
import { BODY_BUILDS } from "@/lib/types";

export const runtime = "nodejs";
// Model calls can take a while; Vercel's default function timeout is shorter.
export const maxDuration = 60;

interface TryOnRequestBody {
  photoDataUrl: string;
  pieces: TryOnPiece[];
  subject?: { gender?: string; build?: string; height?: string };
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

  if (!body?.photoDataUrl || !Array.isArray(body.pieces) || body.pieces.length === 0 || body.pieces.length > 8) {
    return NextResponse.json({ error: "photoDataUrl and pieces are required" }, { status: 400 });
  }

  // Defensive cap even though the client compresses uploads before sending —
  // a ~15MB data URL comfortably covers a 1280px JPEG at max quality.
  if (body.photoDataUrl.length > 15_000_000) {
    return NextResponse.json(
      { error: "That photo is too large. Please try a smaller image." },
      { status: 413 }
    );
  }

  if (body.pieces.some((p) => typeof p.description !== "string" || p.description.length > 300)) {
    return NextResponse.json({ error: "Invalid outfit pieces." }, { status: 400 });
  }

  // Subject hints are free-form from the client, so allow-list them before they reach the prompt.
  const subject: TryOnSubject = {};
  if (body.subject?.gender === "Women" || body.subject?.gender === "Men") subject.gender = body.subject.gender;
  if (BODY_BUILDS.includes(body.subject?.build as never)) subject.build = body.subject!.build;
  const height = typeof body.subject?.height === "string" ? body.subject.height.trim() : "";
  if (/^[0-9a-zA-Z'"’.\s-]{1,20}$/.test(height)) subject.height = height;

  const result = await generateTryOnImage(
    body.photoDataUrl,
    body.pieces.map((p) => ({ description: p.description.slice(0, 200) })),
    subject
  );
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }
  return NextResponse.json({ imageDataUrl: result.imageDataUrl });
}
