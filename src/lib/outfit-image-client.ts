import { Outfit } from "@/lib/types";
import { resizeToJpegDataUrl } from "@/lib/image-utils";
import { pieceDescription } from "@/lib/pieces";

// Cards for a whole set of looks mount together; generate at most two at a
// time so we don't hit the image model's rate limit, and never ask twice for
// the same outfit.
const MAX_CONCURRENT = 2;
let running = 0;
const waiting: (() => void)[] = [];
const inFlight = new Map<string, Promise<string>>();

async function withSlot<T>(task: () => Promise<T>): Promise<T> {
  if (running >= MAX_CONCURRENT) await new Promise<void>((resolve) => waiting.push(resolve));
  running++;
  try {
    return await task();
  } finally {
    running--;
    waiting.shift()?.();
  }
}

/** Resolves to a compressed JPEG data URL of the outfit, or rejects. */
export function requestOutfitImage(
  outfit: Outfit,
  gender: "Women" | "Men" | "Unisex" | null,
  photoFor?: (productId: string) => string | undefined
): Promise<string> {
  const existing = inFlight.get(outfit.id);
  if (existing) return existing;

  const promise = withSlot(async () => {
    const res = await fetch("/api/outfit-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pieces: outfit.items.map((it) => pieceDescription(it.product)),
        photos: outfit.items.map((it) => (it.owned ? photoFor?.(it.product.id) ?? null : null)),
        gender,
        occasion: outfit.occasion,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.imageDataUrl) {
      throw Object.assign(new Error(data.error || "Couldn't generate the look image."), { reason: data.reason as string | undefined });
    }
    // Keep it small enough to store with saved looks.
    return resizeToJpegDataUrl(data.imageDataUrl, 800, 0.82);
  }).finally(() => inFlight.delete(outfit.id));

  inFlight.set(outfit.id, promise);
  return promise;
}
