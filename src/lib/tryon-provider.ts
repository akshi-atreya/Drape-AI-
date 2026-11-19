import { GoogleGenAI } from "@google/genai";

/**
 * Real virtual try-on via Gemini's image model (gemini-3.1-flash-image).
 * The model gets the shopper's photo plus a precise description of each piece
 * in the recommended outfit (color, cut, fit, silhouette) and dresses them in
 * it, keeping their face and identity.
 */

const MODEL = "gemini-3.1-flash-image";

export interface TryOnResult {
  imageDataUrl?: string;
  error?: string;
}

/** Optional shopper hints; any field left out means "match the photo". */
export interface TryOnSubject {
  gender?: "Women" | "Men";
  build?: string;
  height?: string;
}

export interface TryOnPiece {
  /** What the piece is, e.g. "charcoal blouse (cropped fit, flowy silhouette)". */
  description: string;
  /** Photo of the actual garment, when it's one the shopper owns. */
  imageDataUrl?: string;
}

function parseDataUrl(dataUrl: string): { mimeType: string; data: string } | null {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  return { mimeType: match[1], data: match[2] };
}

export async function generateTryOnImage(
  photoDataUrl: string,
  pieces: TryOnPiece[],
  subject: TryOnSubject = {}
): Promise<TryOnResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      error:
        "GEMINI_API_KEY is not set. Add it to .env.local at the project root and restart the dev server to enable real virtual try-on.",
    };
  }

  const photo = parseDataUrl(photoDataUrl);
  if (!photo) {
    return { error: "That photo couldn't be read. Please try a different image." };
  }

  // Owned garments come with a photo: pass it so the model dresses them in that exact piece.
  const garmentImages: { mimeType: string; data: string }[] = [];
  const lines = pieces.map((p) => {
    const parsed = p.imageDataUrl ? parseDataUrl(p.imageDataUrl) : null;
    if (!parsed) return `- ${p.description}`;
    garmentImages.push(parsed);
    return `- ${p.description} — the person's own garment, shown in image ${garmentImages.length + 1}: put exactly that garment on them (same color, fabric, shape and details).`;
  });

  const subjectLines: string[] = [];
  if (subject.gender) subjectLines.push(subject.gender === "Women" ? "- The person is a woman." : "- The person is a man.");
  if (subject.build) {
    subjectLines.push(
      `- Their build is ${subject.build.toLowerCase()}. Use this to shape their body ONLY if Image 1 doesn't show their full body; if it does, keep their body and proportions exactly as they appear in Image 1.`
    );
  }
  if (subject.height) {
    subjectLines.push(`- Their height is about ${subject.height}. Use it for proportions only where Image 1 doesn't show it.`);
  }
  const subjectBlock = subjectLines.length ? `\nAbout the person:\n${subjectLines.join("\n")}\n` : "";

  const prompt = `Image 1 is the person. Generate a NEW full-body fashion photo of that person wearing this complete outfit:
${lines.join("\n")}
${subjectBlock}
Requirements:
- Show every listed piece clearly, in the exact color and cut described. Do not add other garments, and do not change a piece's color.
- Keep the person's face, skin tone, hair, and identity clearly recognizable and consistent with Image 1.
- Show the ENTIRE outfit from head to toe — full body, feet included, vertical portrait framing, nothing cropped.
- Pose them standing naturally like a fashion model or lookbook photo: relaxed, upright, facing the camera or in a natural three-quarter turn — NOT the pose/crop/angle from Image 1.
- If Image 1 is only a headshot, close-up, or partial body, invent a plausible, proportionate full body for them and continue the same face/identity onto it.
- Use a clean, neutral studio or softly lit indoor background — not Image 1's original background.
- The result must look like a single realistic photograph (not a collage, sketch, or illustration), well-lit, in sharp focus.`;

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [
        { inlineData: { mimeType: photo.mimeType, data: photo.data } },
        ...garmentImages.map((g) => ({ inlineData: { mimeType: g.mimeType, data: g.data } })),
        { text: prompt },
      ],
      config: {
        responseModalities: ["TEXT", "IMAGE"],
        imageConfig: { aspectRatio: "3:4" },
      },
    });

    const parts = response.candidates?.[0]?.content?.parts ?? [];
    const imagePart = parts.find((p) => p.inlineData?.data);
    if (imagePart?.inlineData?.data) {
      const mime = imagePart.inlineData.mimeType || "image/png";
      return { imageDataUrl: `data:${mime};base64,${imagePart.inlineData.data}` };
    }

    const textPart = parts.find((p) => p.text)?.text;
    return {
      error: textPart
        ? `The stylist couldn't generate an image: ${textPart}`
        : "The stylist couldn't generate a try-on image for that photo. Try a clearer, front-facing photo.",
    };
  } catch (err) {
    console.error("Try-on generation error:", err);
    const message = err instanceof Error ? err.message : String(err);

    if (/prepayment|credits are depleted|"code":402/i.test(message)) {
      return { error: "Virtual try-on is temporarily unavailable. Please try again later." };
    }
    if (message.includes("RESOURCE_EXHAUSTED") || message.includes('"code":429')) {
      return {
        error:
          "Your Gemini API key doesn't have free-tier quota for the image model (gemini-3.1-flash-image) — it needs billing enabled on the Google AI Studio / Cloud project the key belongs to. Enable billing at aistudio.google.com, then try again.",
      };
    }
    if (message.includes('"code":403') || message.includes("PERMISSION_DENIED")) {
      return { error: "That Gemini API key doesn't have access to the image model. Check the key's permissions in Google AI Studio." };
    }
    if (message.includes('"code":404') || message.includes("NOT_FOUND")) {
      return { error: "The image model isn't available for this API key/region yet." };
    }
    return { error: "Something went wrong generating your try-on image. Please try again." };
  }
}
