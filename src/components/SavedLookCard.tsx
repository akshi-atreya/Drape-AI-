"use client";

import { useRouter } from "next/navigation";
import { SavedLook } from "@/lib/types";
import { PieceThumb } from "@/components/PieceThumb";
import { OutfitHero } from "@/components/OutfitHero";
import { useAppStore } from "@/store/useAppStore";
import { pieceTitle } from "@/lib/pieces";

export function SavedLookCard({ look }: { look: SavedLook }) {
  const removeSavedLook = useAppStore((s) => s.removeSavedLook);
  const router = useRouter();
  const sendMessage = useAppStore((s) => s.sendMessage);
  const reviveOutfit = useAppStore((s) => s.reviveOutfit);

  if (look.type === "outfit" && look.outfit) {
    const outfit = look.outfit;
    return (
      <article className="animate-in bg-white rounded-2xl overflow-hidden border border-beige-dark/60">
        <OutfitHero outfit={outfit} image={look.image} />
        <div className="p-5 space-y-3">
          <div>
            <h3 className="font-serif text-xl">{outfit.name}</h3>
            <p className="text-xs text-gray mt-0.5">
              {outfit.occasion} · Saved{" "}
              {new Date(look.savedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                reviveOutfit(outfit, look.picks, look.image);
                sendMessage(`Let's revisit my saved "${outfit.name}" look — what would you change?`, outfit.id);
                router.push("/");
              }}
              className="px-3.5 py-1.5 rounded-full border border-beige-dark text-xs hover:border-charcoal"
            >
              Remix
            </button>
            <button
              onClick={() => removeSavedLook(look.id)}
              className="px-3.5 py-1.5 rounded-full border border-beige-dark text-xs text-accent hover:border-accent"
            >
              Delete
            </button>
          </div>
        </div>
      </article>
    );
  }

  if (look.type === "product" && look.product) {
    const p = look.product;
    return (
      <article className="animate-in bg-white rounded-2xl overflow-hidden border border-beige-dark/60">
        <PieceThumb product={p} className="w-full aspect-[4/3]" />
        <div className="p-5 space-y-2">
          <h3 className="text-sm">{pieceTitle(p)}</h3>
          <button
            onClick={() => removeSavedLook(look.id)}
            className="text-xs text-accent hover:underline"
          >
            Delete
          </button>
        </div>
      </article>
    );
  }

  return (
    <article className="animate-in bg-white rounded-2xl overflow-hidden border border-beige-dark/60 p-5 space-y-2">
      <h3 className="font-serif text-lg">{look.trendName}</h3>
      <button onClick={() => removeSavedLook(look.id)} className="text-xs text-accent hover:underline">
        Delete
      </button>
    </article>
  );
}
