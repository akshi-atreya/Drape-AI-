import { GoogleGenAI } from "@google/genai";
import { OutfitItem } from "@/lib/types";

/**
 * Real virtual try-on via Gemini's image model (gemini-3.1-flash-image, aka
 * "Nano Banana 2"). Given the mock catalog has no real garment photography,
 * a garment-photo-based try-on model (which needs a picture of the actual
 * item) isn't viable here — instead we hand Gemini the user's photo plus a
 * precise text description of the outfit's colors/materials/silhouette
 * (which we do have from the structured catalog) and ask it to edit the
 * photo to show that outfit on the person, preserving their identity.
 */

const MODEL = "gemini-3.1-flash-image";

export interface TryOnResult {
  imageDataUrl?: string;
  error?: string;
}

function describeItem(item: OutfitItem): string {
  const p = item.product;
  return `${p.primaryColor} ${p.material} ${p.subcategory.toLowerCase()} (${p.fit} fit)`;
}

function parseDataUrl(dataUrl: string): { mimeType: string; data: string } | null {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  return { mimeType: match[1], data: match[2] };
}

export async function generateTryOnImage(
  photoDataUrl: string,
  items: OutfitItem[]
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

  const outfitDescription = items.map(describeItem).join(", ");
  const prompt = `Using the person in the reference photo, generate a NEW full-body fashion photo of them wearing this complete outfit: ${outfitDescription}.

Requirements:
- Keep their face, skin tone, hair, and identity clearly recognizable and consistent with the reference photo.
- Show the ENTIRE outfit from head to toe — full body, feet included, vertical portrait framing, nothing cropped.
- Pose them standing naturally like a fashion model or lookbook photo: relaxed, upright, facing the camera or in a natural three-quarter turn — NOT the pose/crop/angle from the reference photo.
- If the reference photo is only a headshot, close-up, or partial body, invent a plausible, proportionate full body for them and continue the same face/identity onto it.
- Use a clean, neutral studio or softly lit indoor background — not the reference photo's original background.
- The result must look like a single realistic photograph (not a collage, sketch, or illustration), well-lit, in sharp focus.`;

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [
        { inlineData: { mimeType: photo.mimeType, data: photo.data } },
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
