import { GoogleGenAI } from "@google/genai";

/**
 * One illustrative image of a whole recommended outfit, generated from the
 * pieces' exact colors and cuts. Replaces per-piece stock photos, which
 * routinely showed the wrong garment or color. It's an *idea* of the look —
 * shoppers still pick the real items themselves.
 */

const MODEL = "gemini-3.1-flash-image";

export interface OutfitImageRequest {
  /** e.g. "charcoal blouse (cropped fit, flowy silhouette)" */
  pieces: string[];
  gender: "Women" | "Men" | "Unisex" | null;
  occasion: string;
}

export async function generateOutfitImage(req: OutfitImageRequest): Promise<{ imageDataUrl?: string; error?: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { error: "GEMINI_API_KEY is not set." };

  const audience = req.gender === "Men" ? "menswear" : req.gender === "Women" ? "womenswear" : "unisex";
  const list = req.pieces.map((p) => `- ${p}`).join("\n");

  const prompt = `Create a single clean, editorial flat-lay photograph of one complete ${audience} outfit for "${req.occasion}", laid out neatly on a warm ivory (#f4efe6) background, shot from directly above in soft natural light.

The outfit consists of exactly these pieces — show each one clearly, once, with the exact color and cut described:
${list}

Rules:
- Arrange the pieces the way they would be worn, top to bottom (outerwear/top, then bottoms, then shoes), with the bag and accessories placed beside them.
- Colors must match the descriptions exactly. Show ONLY the listed pieces: no extra garments, and no jewelry, belts, watches, scarves, hats or other accessories unless they are in the list.
- No people, no mannequins, no hands, no body parts.
- No text, logos, brand names, labels, or watermarks anywhere.
- Photorealistic product photography, sharp focus, generous empty space around the pieces.`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [{ text: prompt }],
      config: { responseModalities: ["TEXT", "IMAGE"], imageConfig: { aspectRatio: "1:1" } },
    });
    const parts = response.candidates?.[0]?.content?.parts ?? [];
    const img = parts.find((p) => p.inlineData?.data);
    if (img?.inlineData?.data) {
      return { imageDataUrl: `data:${img.inlineData.mimeType || "image/png"};base64,${img.inlineData.data}` };
    }
    return { error: "No image was returned." };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Outfit image error:", message.slice(0, 300));
    if (message.includes("RESOURCE_EXHAUSTED") || message.includes('"code":429')) {
      return { error: "Image service is busy or out of quota." };
    }
    return { error: "Couldn't generate the look image." };
  }
}
