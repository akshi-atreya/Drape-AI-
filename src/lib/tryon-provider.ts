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
  const prompt = `Edit this photo so the person is wearing the following complete outfit: ${outfitDescription}. Keep the person's face, identity, body shape, pose, and the background exactly as they are in the original photo — only change their clothing to match this outfit. Make the result look like a natural, realistic, well-lit fashion photo, not a collage or illustration.`;

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
    return { error: "Something went wrong generating your try-on image. Please try again." };
  }
}
