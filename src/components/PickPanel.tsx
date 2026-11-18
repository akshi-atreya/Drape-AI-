"use client";

import { useRef, useState } from "react";
import { GarmentPick } from "@/lib/types";
import { loadImageFile, resizeToJpegDataUrl, UploadProblem, UploadProblemError } from "@/lib/image-utils";
import { UploadErrorDialog } from "@/components/UploadErrorDialog";

/** "llbean.com/llb/shop/504209" — host and path only, so long tracking links stay readable. */
function shortAddress(link: string): string {
  try {
    const u = new URL(link);
    const path = u.pathname.length > 40 ? `${u.pathname.slice(0, 40)}…` : u.pathname;
    return `${u.hostname.replace(/^www\./, "")}${path === "/" ? "" : path}`;
  } catch {
    return link.slice(0, 60);
  }
}

/**
 * Lets the shopper attach the real garment for a recommended piece: paste a
 * product link (we read the photo from the page) or upload an image/
 * screenshot. Many retailers block automated page reads, so upload is always
 * offered as the fallback.
 */
export function PickPanel({
  onPick,
  onClose,
}: {
  onPick: (pick: GarmentPick) => void;
  onClose: () => void;
}) {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<UploadProblem | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const addFromLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const link = url.trim();
    if (!link || busy) return;
    setBusy(true);
    setProblem(null);
    try {
      const res = await fetch("/api/garment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: link }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg: string = data.error ?? "Couldn't read that link.";
        const blocked = /blocked/i.test(msg);
        const noPhoto = /find a product photo/i.test(msg);
        setProblem({
          title: "Couldn't get the photo from that link",
          fileInfo: shortAddress(link),
          reason: blocked
            ? "That store blocked the request. Many retailers (H&M, Zara and L.L.Bean are common ones) don't let apps read their product pages automatically."
            : noPhoto
              ? "That page doesn't include the product photo in a form we can read. Many stores (L.L.Bean is one) load the product details with JavaScript after the page opens, so a link alone isn't enough."
              : msg,
          fix: blocked || noPhoto
            ? "Right-click the product photo and choose \"Copy image address\", then paste that link here instead. Or save the image or take a screenshot, and upload it."
            : "Save the product image or take a screenshot of the item, then upload it instead.",
        });
        return;
      }
      const small = await resizeToJpegDataUrl(data.imageDataUrl);
      onPick({ imageDataUrl: small, sourceUrl: data.sourceUrl, title: data.title });
    } catch {
      setProblem({
        title: "Couldn't reach that link",
        fileInfo: shortAddress(link),
        reason: "The request failed — you may be offline, or the link isn't a valid web address.",
        fix: "Check the link and your connection, or upload a screenshot or photo of the piece instead.",
      });
    } finally {
      setBusy(false);
    }
  };

  const addFromFile = async (file: File) => {
    setBusy(true);
    setProblem(null);
    try {
      const small = await loadImageFile(file, 640, 0.85);
      onPick({ imageDataUrl: small, title: file.name.replace(/\.[^.]+$/, "") });
    } catch (err) {
      setProblem(
        err instanceof UploadProblemError
          ? err.problem
          : { title: "Couldn't use that file", reason: "Something unexpected went wrong while reading it.", fix: "Try a different image." }
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="animate-in rounded-xl bg-beige/60 p-3 space-y-2.5">
      <form onSubmit={addFromLink} className="flex gap-2">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          type="url"
          inputMode="url"
          placeholder="Paste a product link"
          aria-label="Product link"
          className="flex-1 min-w-0 text-base md:text-sm bg-white rounded-full px-4 py-2 outline-none focus:ring-1 focus:ring-charcoal placeholder:text-gray"
        />
        <button
          type="submit"
          disabled={!url.trim() || busy}
          className="shrink-0 px-4 py-2 rounded-full bg-charcoal text-ivory text-sm disabled:opacity-40"
        >
          {busy ? "Adding…" : "Add"}
        </button>
      </form>
      <div className="flex items-center justify-between gap-2 text-xs text-gray">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="underline underline-offset-2 hover:text-charcoal disabled:opacity-40"
        >
          or upload a photo / screenshot
        </button>
        <button type="button" onClick={onClose} className="hover:text-charcoal">
          Cancel
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) addFromFile(f);
          e.target.value = "";
        }}
      />
      {problem && (
        <UploadErrorDialog
          problem={problem}
          onClose={() => setProblem(null)}
          onRetry={() => {
            setProblem(null);
            fileRef.current?.click();
          }}
          retryLabel="Upload a photo instead"
        />
      )}
    </div>
  );
}
