"use client";

import { useRef, useState } from "react";
import { Outfit } from "@/lib/types";
import { ProductSwatch } from "@/components/ProductSwatch";
import { useAppStore } from "@/store/useAppStore";

type Stage = "upload" | "loading" | "done";

export function TryOnModal({
  outfit,
  outfits,
  onClose,
  onNavigate,
}: {
  outfit: Outfit;
  outfits: Outfit[];
  onClose: () => void;
  onNavigate: (outfit: Outfit) => void;
}) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("upload");
  const fileRef = useRef<HTMLInputElement>(null);
  const saveLook = useAppStore((s) => s.saveLook);

  const idx = outfits.findIndex((o) => o.id === outfit.id);
  const hasPrev = idx > 0;
  const hasNext = idx >= 0 && idx < outfits.length - 1;

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  const generate = async () => {
    setStage("loading");
    try {
      await fetch("/api/tryon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outfitId: outfit.id }),
      });
    } catch {
      // Non-fatal in the MVP — the abstraction point is what matters here.
    }
    setTimeout(() => setStage("done"), 900);
  };

  const reset = () => {
    setPhoto(null);
    setStage("upload");
  };

  return (
    <div className="fixed inset-0 z-50 bg-charcoal/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="animate-in bg-ivory w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl relative">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
        >
          ✕
        </button>

        <div className="p-8 md:p-12 text-center">
          <h2 className="font-serif text-3xl md:text-4xl">See it on you.</h2>
          <p className="text-charcoal-soft mt-2 text-sm md:text-base">
            Upload a photo and we&apos;ll visualize the outfit on you.
          </p>

          <div className="mt-8">
            {stage === "upload" && !photo && (
              <button
                onClick={() => fileRef.current?.click()}
                className="mx-auto flex flex-col items-center justify-center gap-3 w-full max-w-sm aspect-[3/4] rounded-2xl border-2 border-dashed border-beige-dark hover:border-charcoal transition-colors text-gray hover:text-charcoal"
              >
                <UploadIcon />
                <span className="text-sm">Upload photo</span>
              </button>
            )}

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />

            {photo && stage === "upload" && (
              <div className="space-y-4">
                {/* eslint-disable-next-line @next/next/no-img-element -- user-uploaded data: URL, not a static/remote asset next/image can optimize */}
                <img
                  src={photo}
                  alt="Uploaded"
                  className="mx-auto w-full max-w-sm h-[420px] rounded-2xl object-cover"
                />
                <button
                  onClick={generate}
                  className="px-6 py-3 rounded-full bg-charcoal text-ivory text-sm hover:bg-charcoal-soft transition-colors"
                >
                  Generate Try-On
                </button>
              </div>
            )}

            {stage === "loading" && (
              <div className="flex flex-col items-center gap-4 py-16">
                <div className="w-10 h-10 rounded-full border-2 border-beige-dark border-t-charcoal animate-spin" />
                <p className="text-sm text-gray">Styling your look...</p>
              </div>
            )}

            {stage === "done" && photo && (
              <div className="space-y-6">
                <div className="relative mx-auto w-full max-w-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element -- user-uploaded data: URL, not a static/remote asset next/image can optimize */}
                  <img
                    src={photo}
                    alt="Try-on preview"
                    className="w-full h-[420px] rounded-2xl object-cover"
                  />
                  <span className="absolute top-3 left-3 bg-ivory/90 text-charcoal text-[11px] tracking-wide uppercase px-2.5 py-1 rounded-full">
                    Style Preview
                  </span>
                </div>

                <div className="flex justify-center gap-2">
                  {outfit.items.map((it) => (
                    <ProductSwatch key={it.product.id} product={it.product} className="w-12 h-12 rounded-lg" compact />
                  ))}
                </div>
                <p className="text-xs text-gray max-w-sm mx-auto">
                  This preview pairs your photo with the outfit&apos;s pieces — connect a real virtual try-on
                  model in production to render the garments directly on you.
                </p>

                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  <button
                    disabled={!hasPrev}
                    onClick={() => hasPrev && onNavigate(outfits[idx - 1])}
                    className="px-4 py-2 rounded-full border border-beige-dark text-sm disabled:opacity-30"
                  >
                    Previous
                  </button>
                  <button
                    disabled={!hasNext}
                    onClick={() => hasNext && onNavigate(outfits[idx + 1])}
                    className="px-4 py-2 rounded-full border border-beige-dark text-sm disabled:opacity-30"
                  >
                    Next outfit
                  </button>
                  <button
                    onClick={() => saveLook({ type: "outfit", outfit })}
                    className="px-4 py-2 rounded-full border border-beige-dark text-sm hover:border-charcoal"
                  >
                    Save
                  </button>
                  <button
                    onClick={reset}
                    className="px-4 py-2 rounded-full bg-charcoal text-ivory text-sm hover:bg-charcoal-soft"
                  >
                    Try another look
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function UploadIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 16V4M12 4L7 9M12 4l5 5" />
      <path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}
