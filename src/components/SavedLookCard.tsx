"use client";

import { useRouter } from "next/navigation";
import { SavedLook } from "@/lib/types";
import { ProductSwatch } from "@/components/ProductSwatch";
import { useAppStore } from "@/store/useAppStore";
import { getShopUrl } from "@/lib/locale";

export function SavedLookCard({ look }: { look: SavedLook }) {
  const removeSavedLook = useAppStore((s) => s.removeSavedLook);
  const router = useRouter();
  const sendMessage = useAppStore((s) => s.sendMessage);
  const reviveOutfit = useAppStore((s) => s.reviveOutfit);
  const countryCode = useAppStore((s) => s.countryCode);

  if (look.type === "outfit" && look.outfit) {
    const outfit = look.outfit;
    return (
      <article className="animate-in bg-white rounded-2xl overflow-hidden border border-beige-dark/60">
        <div className="grid grid-cols-2 gap-[2px] aspect-[4/3] bg-beige-dark/40">
          {outfit.items.slice(0, 4).map((it, i) => (
            <ProductSwatch key={it.product.id + i} product={it.product} className="w-full h-full" />
          ))}
        </div>
        <div className="p-5 space-y-3">
          <div>
            <h3 className="font-serif text-xl">{outfit.name}</h3>
            <p className="text-xs text-gray mt-0.5">
              {outfit.occasion} · ${outfit.totalPrice.toFixed(0)} · Saved{" "}
              {new Date(look.savedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                reviveOutfit(outfit);
                sendMessage(`Let's revisit my saved "${outfit.name}" look — what would you change?`, outfit.id);
                router.push("/");
              }}
              className="px-3.5 py-1.5 rounded-full border border-beige-dark text-xs hover:border-charcoal"
            >
              Remix
            </button>
            {outfit.items[0] && (
              <a
                href={getShopUrl(outfit.items[0].product, countryCode)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 rounded-full border border-beige-dark text-xs hover:border-charcoal"
              >
                Shop
              </a>
            )}
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
        <ProductSwatch product={p} className="w-full aspect-[4/3]" />
        <div className="p-5 space-y-2">
          <h3 className="text-sm">{p.name}</h3>
          <p className="text-xs text-gray">{p.brand} · ${(p.salePrice ?? p.price).toFixed(0)}</p>
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
