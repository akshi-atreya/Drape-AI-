"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trend } from "@/lib/types";
import { catalog } from "@/lib/catalog";
import { ProductCard } from "@/components/ProductCard";
import { useAppStore } from "@/store/useAppStore";

export function TrendCard({ trend }: { trend: Trend }) {
  const [shopOpen, setShopOpen] = useState(false);
  const router = useRouter();
  const sendMessage = useAppStore((s) => s.sendMessage);

  const matches = catalog.filter((p) => p.trendTags.includes(trend.name)).slice(0, 6);

  const buildLook = () => {
    sendMessage(`Let's build a ${trend.name.toLowerCase()}-forward look.`);
    router.push("/");
  };

  return (
    <article className="animate-in bg-white rounded-2xl overflow-hidden border border-beige-dark/60">
      <div
        className="aspect-[16/9] flex items-end p-6"
        style={{ background: `linear-gradient(155deg, ${trend.heroColor}, ${trend.heroColor}aa)` }}
      >
        <div>
          <p className="text-white/70 text-xs uppercase tracking-wide">{trend.season}</p>
          <h3 className="font-serif text-3xl text-white mt-1">{trend.name}</h3>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <p className="text-sm text-charcoal-soft leading-relaxed">{trend.shortExplanation}</p>

        <div className="space-y-2 text-sm">
          <p>
            <span className="font-medium text-charcoal">Why it&apos;s trending — </span>
            <span className="text-charcoal-soft">{trend.whyTrending}</span>
          </p>
          <p>
            <span className="font-medium text-charcoal">How to wear it — </span>
            <span className="text-charcoal-soft">{trend.howToWear}</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            onClick={() => setShopOpen((v) => !v)}
            className="px-4 py-2 rounded-full border border-beige-dark text-sm hover:border-charcoal transition-colors"
          >
            Shop this trend
          </button>
          <button
            onClick={buildLook}
            className="px-4 py-2 rounded-full bg-charcoal text-ivory text-sm hover:bg-charcoal-soft transition-colors"
          >
            Build me a look
          </button>
        </div>

        {shopOpen && (
          <div className="animate-in grid grid-cols-2 sm:grid-cols-3 gap-4 pt-3 border-t border-beige-dark/60">
            {matches.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
