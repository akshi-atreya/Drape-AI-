"use client";

import { useEffect } from "react";
import { UploadProblem } from "@/lib/image-utils";

/** A centered dialog explaining exactly why an upload failed and how to fix it. */
export function UploadErrorDialog({
  problem,
  onClose,
  onRetry,
  retryLabel = "Choose another file",
}: {
  problem: UploadProblem;
  onClose: () => void;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[70] bg-charcoal/50 backdrop-blur-sm flex items-center justify-center p-5"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="upload-error-title"
        className="animate-in w-full max-w-md bg-ivory rounded-2xl shadow-[0_8px_40px_rgba(35,34,32,0.25)] p-6 md:p-8 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-10 rounded-full bg-accent/10 text-accent flex items-center justify-center text-lg mb-4" aria-hidden="true">
          !
        </div>
        <h3 id="upload-error-title" className="font-serif text-2xl leading-tight">
          {problem.title}
        </h3>

        {problem.fileInfo && (
          <p className="mt-3 text-xs text-gray bg-beige rounded-lg px-3 py-2 break-all">{problem.fileInfo}</p>
        )}

        <div className="mt-4 space-y-3 text-sm leading-relaxed">
          <p>
            <span className="font-medium text-charcoal">Why — </span>
            <span className="text-charcoal-soft">{problem.reason}</span>
          </p>
          {problem.fix && (
            <p>
              <span className="font-medium text-charcoal">How to fix — </span>
              <span className="text-charcoal-soft">{problem.fix}</span>
            </p>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-full border border-beige-dark text-sm hover:border-charcoal">
            Close
          </button>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-5 py-2 rounded-full bg-charcoal text-ivory text-sm hover:bg-charcoal-soft transition-colors"
            >
              {retryLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
