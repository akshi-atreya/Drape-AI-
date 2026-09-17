"use client";

import { useEffect, useRef, useState } from "react";
import { Outfit } from "@/lib/types";
import { ProductSwatch } from "@/components/ProductSwatch";
import { useAppStore } from "@/store/useAppStore";

type Stage = "upload" | "camera" | "review" | "loading" | "done" | "error";

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
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("upload");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const saveLook = useAppStore((s) => s.saveLook);

  const idx = outfits.findIndex((o) => o.id === outfit.id);
  const hasPrev = idx > 0;
  const hasNext = idx >= 0 && idx < outfits.length - 1;

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  useEffect(() => () => stopCamera(), []);

  const startCamera = async () => {
    setErrorMessage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      streamRef.current = stream;
      setStage("camera");
      // Wait a tick for the <video> element to mount.
      requestAnimationFrame(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      });
    } catch {
      setErrorMessage("Couldn't access your camera. Check your browser's camera permission, or upload a photo instead.");
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    setPhoto(canvas.toDataURL("image/jpeg", 0.92));
    stopCamera();
    setStage("review");
  };

  // Always re-encode through a canvas into a small, guaranteed-valid JPEG —
  // never send the raw file bytes on. A phone-camera PNG can be 5-10x the
  // size of the same photo as JPEG (PNG is lossless/uncompressed), which
  // was producing multi-MB request bodies that got truncated in transit
  // (surfacing as "Invalid JSON body") and, since the raw untouched bytes
  // were also what got rendered as the preview <img>, could show as a
  // broken/corrupt preview for the same oversized or unusual files.
  const MAX_DIMENSION = 1280;

  const handleFile = (file: File) => {
    setErrorMessage(null);
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setErrorMessage("Couldn't process that photo. Please try a different one.");
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setPhoto(canvas.toDataURL("image/jpeg", 0.88));
        setStage("review");
      };
      img.onerror = () => {
        setErrorMessage("That file doesn't look like a valid image. Please try a different photo.");
      };
      img.src = reader.result as string;
    };
    reader.onerror = () => {
      setErrorMessage("Couldn't read that file. Please try a different photo.");
    };
    reader.readAsDataURL(file);
  };

  const generateFor = async (photoData: string, targetOutfit: Outfit) => {
    setStage("loading");
    setErrorMessage(null);
    try {
      const res = await fetch("/api/tryon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoDataUrl: photoData, items: targetOutfit.items }),
      });
      const data = await res.json();
      if (!res.ok || !data.imageDataUrl) {
        setErrorMessage(data.error || "Couldn't generate a try-on image. Please try again.");
        setStage("error");
        return;
      }
      setResultImage(data.imageDataUrl);
      setStage("done");
    } catch {
      setErrorMessage("Couldn't reach the try-on service. Please try again.");
      setStage("error");
    }
  };

  const generate = () => photo && generateFor(photo, outfit);

  const switchOutfit = (next: Outfit) => {
    onNavigate(next);
    if (photo) generateFor(photo, next);
    else reset();
  };

  const reset = () => {
    setPhoto(null);
    setResultImage(null);
    setErrorMessage(null);
    setStage("upload");
  };

  return (
    <div className="fixed inset-0 z-50 bg-charcoal/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="animate-in bg-ivory w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl relative">
        <button
          onClick={() => {
            stopCamera();
            onClose();
          }}
          aria-label="Close"
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
        >
          ✕
        </button>

        <div className="p-8 md:p-12 text-center">
          <h2 className="font-serif text-3xl md:text-4xl">See it on you.</h2>
          <p className="text-charcoal-soft mt-2 text-sm md:text-base">
            Upload or take a photo — we&apos;ll generate this outfit on you.
          </p>

          <div className="mt-8">
            {stage === "upload" && (
              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-3 w-full max-w-sm aspect-[3/4] rounded-2xl border-2 border-dashed border-beige-dark hover:border-charcoal transition-colors text-gray hover:text-charcoal"
                >
                  <UploadIcon />
                  <span className="text-sm">Upload photo</span>
                </button>
                <div className="flex items-center gap-3 text-xs text-gray w-full max-w-sm">
                  <span className="flex-1 h-px bg-beige-dark" />
                  or
                  <span className="flex-1 h-px bg-beige-dark" />
                </div>
                <button
                  onClick={startCamera}
                  className="px-5 py-2.5 rounded-full border border-beige-dark text-sm hover:border-charcoal transition-colors flex items-center gap-2"
                >
                  <CameraIcon />
                  Take a photo
                </button>
                {errorMessage && <p className="text-xs text-accent max-w-sm">{errorMessage}</p>}
              </div>
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

            {stage === "camera" && (
              <div className="space-y-4">
                <div className="relative mx-auto w-full max-w-sm aspect-[3/4] rounded-2xl overflow-hidden bg-charcoal">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                </div>
                <div className="flex justify-center gap-2">
                  <button
                    onClick={() => {
                      stopCamera();
                      setStage("upload");
                    }}
                    className="px-4 py-2 rounded-full border border-beige-dark text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={capturePhoto}
                    className="px-6 py-2 rounded-full bg-charcoal text-ivory text-sm hover:bg-charcoal-soft transition-colors"
                  >
                    Capture
                  </button>
                </div>
              </div>
            )}

            {stage === "review" && photo && (
              <div className="space-y-4">
                {/* eslint-disable-next-line @next/next/no-img-element -- user-provided data: URL, not a static/remote asset next/image can optimize */}
                <img
                  src={photo}
                  alt="Your photo"
                  className="mx-auto w-full max-w-sm h-[420px] rounded-2xl object-cover"
                />
                <div className="flex justify-center gap-2">
                  <button onClick={reset} className="px-4 py-2 rounded-full border border-beige-dark text-sm">
                    Retake
                  </button>
                  <button
                    onClick={generate}
                    className="px-6 py-3 rounded-full bg-charcoal text-ivory text-sm hover:bg-charcoal-soft transition-colors"
                  >
                    Generate Try-On
                  </button>
                </div>
              </div>
            )}

            {stage === "loading" && (
              <div className="flex flex-col items-center gap-4 py-16">
                <div className="w-10 h-10 rounded-full border-2 border-beige-dark border-t-charcoal animate-spin" />
                <p className="text-sm text-gray">Styling your look...</p>
              </div>
            )}

            {stage === "error" && (
              <div className="space-y-4 py-6">
                <p className="text-sm text-accent max-w-sm mx-auto">{errorMessage}</p>
                <div className="flex justify-center gap-2">
                  {photo && (
                    <button
                      onClick={generate}
                      className="px-4 py-2 rounded-full border border-beige-dark text-sm hover:border-charcoal"
                    >
                      Try again
                    </button>
                  )}
                  <button
                    onClick={reset}
                    className="px-4 py-2 rounded-full bg-charcoal text-ivory text-sm hover:bg-charcoal-soft"
                  >
                    Use a different photo
                  </button>
                </div>
              </div>
            )}

            {stage === "done" && resultImage && (
              <div className="space-y-6">
                <div className="relative mx-auto w-full max-w-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element -- AI-generated data: URL, not a static/remote asset next/image can optimize */}
                  <img
                    src={resultImage}
                    alt="Generated try-on"
                    className="w-full rounded-2xl object-cover"
                  />
                  <span className="absolute top-3 left-3 bg-ivory/90 text-charcoal text-[11px] tracking-wide uppercase px-2.5 py-1 rounded-full">
                    AI Generated
                  </span>
                </div>

                <div className="flex justify-center gap-2">
                  {outfit.items.map((it) => (
                    <ProductSwatch key={it.product.id} product={it.product} className="w-12 h-12 rounded-lg" compact />
                  ))}
                </div>

                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  <button
                    disabled={!hasPrev}
                    onClick={() => hasPrev && switchOutfit(outfits[idx - 1])}
                    className="px-4 py-2 rounded-full border border-beige-dark text-sm disabled:opacity-30"
                  >
                    Previous
                  </button>
                  <button
                    disabled={!hasNext}
                    onClick={() => hasNext && switchOutfit(outfits[idx + 1])}
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

function CameraIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 8h3l2-2h6l2 2h3v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8Z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}
