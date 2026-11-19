"use client";

import { useEffect, useState } from "react";
import { Outfit } from "@/lib/types";
import { useAppStore } from "@/store/useAppStore";
import { requestOutfitImage } from "@/lib/outfit-image-client";
import { PieceThumb } from "@/components/PieceThumb";

/**
 * The single illustrative image at the top of an outfit card: an AI-generated
 * flat-lay of the whole look. While it generates we show a calm placeholder;
 * if it can't be generated we fall back to a color-palette mosaic of the
 * pieces rather than showing anything that might not match.
 */
export function OutfitHero({ outfit, image: savedImage }: { outfit: Outfit; image?: string }) {
  const storedImage = useAppStore((s) => s.outfitImages[outfit.id]);
  const setOutfitImage = useAppStore((s) => s.setOutfitImage);
  const gender = useAppStore((s) => s.profile.gender);
  const photos = useAppStore((s) => s.photos);
  const [failed, setFailed] = useState(false);
  const [reason, setReason] = useState<string | undefined>();
  const [attempt, setAttempt] = useState(0);

  const image = savedImage ?? storedImage;

  useEffect(() => {
    if (image) return;
    let cancelled = false;
    requestOutfitImage(outfit, gender, (productId) => photos[productId.replace(/^owned-/, "")])
      .then((img) => !cancelled && setOutfitImage(outfit.id, img))
      .catch((err) => {
        if (cancelled) return;
        setReason((err as { reason?: string }).reason);
        setFailed(true);
      });
    return () => {
      cancelled = true;
    };
    // `attempt` re-runs this on Retry; the outfit's id identifies the outfit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outfit.id, image, attempt]);

  if (image) {
    return (
      <div className="relative aspect-square bg-beige">
        {/* eslint-disable-next-line @next/next/no-img-element -- generated data: URL */}
        <img src={image} alt={`Illustration of the ${outfit.name} outfit`} className="w-full h-full object-cover" />
        <span className="absolute top-3 left-3 bg-ivory/90 text-charcoal text-[10px] tracking-wide uppercase px-2.5 py-1 rounded-full">
          AI-generated idea
        </span>
      </div>
    );
  }

  if (failed) {
    return (
      <div className="relative">
        <div className="grid grid-cols-2 gap-[2px] aspect-square bg-beige-dark/40">
          {outfit.items.slice(0, 4).map((it, i) => (
            <PieceThumb key={it.product.id + i} product={it.product} className="w-full h-full" />
          ))}
        </div>
        <button
          onClick={() => {
            setFailed(false);
            setAttempt((n) => n + 1);
          }}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3.5 py-1.5 rounded-full bg-ivory/95 text-xs text-charcoal shadow hover:bg-white"
        >
          {reason === "credits"
            ? "Look images are paused right now — try again later"
            : reason === "busy"
              ? "Image service busy — retry"
              : "Couldn&apos;t draw this look — retry"}
        </button>
      </div>
    );
  }

  return (
    <div className="aspect-square bg-beige flex flex-col items-center justify-center gap-3 text-gray" role="status">
      <div className="w-8 h-8 rounded-full border-2 border-beige-dark border-t-charcoal animate-spin" />
      <p className="text-xs">Sketching your look…</p>
    </div>
  );
}
