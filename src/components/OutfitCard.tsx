"use client";

import { useState } from "react";
import { Outfit } from "@/lib/types";
import { PieceThumb } from "@/components/PieceThumb";
import { OutfitHero } from "@/components/OutfitHero";
import { useAppStore } from "@/store/useAppStore";
import { getShoppingSearchUrl } from "@/lib/locale";
import { pieceDetail, pieceSearchQuery, pieceTitle } from "@/lib/pieces";

const REMIX_CHIPS = [
  "Make it more casual",
  "Replace the jacket",
  "Make it warmer",
  "Use more color",
  "Make it less trendy",
];

export function OutfitCard({
  outfit,
  onTryOn,
  savedIds,
}: {
  outfit: Outfit;
  onTryOn: (outfit: Outfit) => void;
  savedIds: Set<string>;
}) {
  const remix = useAppStore((s) => s.remix);
  const saveLook = useAppStore((s) => s.saveLook);
  const loading = useAppStore((s) => s.loading);
  const countryCode = useAppStore((s) => s.countryCode);
  const profileGender = useAppStore((s) => s.profile.gender);
  const [remixOpen, setRemixOpen] = useState(false);
  const [remixText, setRemixText] = useState("");
  const [justSaved, setJustSaved] = useState(false);

  const isSaved = savedIds.has(outfit.id) || justSaved;

  const items = outfit.items;

  const handleRemix = (text: string) => {
    if (!text.trim() || loading) return;
    remix(outfit.id, text.trim());
    setRemixText("");
    setRemixOpen(false);
  };

  const handleSave = () => {
    saveLook({ type: "outfit", outfit });
    setJustSaved(true);
  };

  return (
    <article className="animate-in bg-white rounded-2xl overflow-hidden border border-beige-dark/60 shadow-[0_1px_2px_rgba(35,34,32,0.04)] max-w-[560px] w-full">
      <OutfitHero outfit={outfit} />

      <div className="p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-serif text-2xl leading-tight">{outfit.name}</h3>
            {outfit.name !== outfit.occasion && <p className="text-sm text-gray mt-0.5">{outfit.occasion}</p>}
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-gray">The pieces</p>
          <p className="text-xs text-gray">Tap &ldquo;Find it&rdquo; to shop a piece, or see the whole look on you.</p>
        </div>

        <ul className="divide-y divide-beige-dark/60 -mx-1 -mt-2">
          {items.map((it) => (
            <li key={it.product.id} className="py-2.5 px-1">
              <div className="flex items-center gap-3">
                <PieceThumb product={it.product} compact className="w-11 h-11 rounded-md shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-charcoal truncate">{pieceTitle(it.product)}</p>
                  <p className="text-xs text-gray truncate">{pieceDetail(it.product)}</p>
                </div>
                <a
                  href={getShoppingSearchUrl(pieceSearchQuery(it.product), profileGender, countryCode)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-xs text-accent hover:underline"
                >
                  Find it ↗
                </a>
              </div>
            </li>
          ))}
        </ul>

        {outfit.explanation && (
          <p className="text-sm text-charcoal-soft leading-relaxed border-t border-beige-dark/60 pt-4">
            <span className="font-medium text-charcoal">Why it works — </span>
            {outfit.explanation}
          </p>
        )}

        <div className="grid grid-cols-2 gap-2 pt-1 md:flex md:flex-wrap">
          <button
            onClick={() => onTryOn(outfit)}
            className="col-span-2 md:col-auto px-2 md:px-4 py-2.5 md:py-2 rounded-full bg-charcoal text-ivory text-sm hover:bg-charcoal-soft transition-colors"
          >
            Try it on
          </button>
          <button
            onClick={() => setRemixOpen((v) => !v)}
            className={`px-2 md:px-4 py-2.5 md:py-2 rounded-full text-sm border transition-colors ${
              remixOpen ? "border-charcoal bg-beige" : "border-beige-dark hover:border-charcoal"
            }`}
          >
            Remix
          </button>
          <button
            onClick={handleSave}
            disabled={isSaved}
            className="px-2 md:px-4 py-2.5 md:py-2 rounded-full text-sm border border-beige-dark hover:border-charcoal transition-colors disabled:opacity-50 disabled:hover:border-beige-dark"
          >
            {isSaved ? "Saved ✓" : "Save look"}
          </button>
        </div>

        {remixOpen && (
          <div className="animate-in space-y-2.5 pt-1">
            <div className="flex flex-wrap gap-1.5">
              {REMIX_CHIPS.map((chip) => (
                <button
                  key={chip}
                  onClick={() => handleRemix(chip)}
                  className="px-3 py-1.5 rounded-full bg-beige text-xs text-charcoal-soft hover:bg-beige-dark transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleRemix(remixText);
              }}
              className="flex gap-2"
            >
              <input
                value={remixText}
                onChange={(e) => setRemixText(e.target.value)}
                placeholder="e.g. keep the shoes but make everything else cheaper"
                className="flex-1 text-sm bg-beige/60 rounded-full px-4 py-2 outline-none focus:ring-1 focus:ring-charcoal placeholder:text-gray"
              />
              <button
                type="submit"
                className="col-span-2 md:col-auto px-2 md:px-4 py-2.5 md:py-2 rounded-full bg-charcoal text-ivory text-sm disabled:opacity-40"
                disabled={!remixText.trim() || loading}
              >
                Go
              </button>
            </form>
          </div>
        )}
      </div>
    </article>
  );
}
