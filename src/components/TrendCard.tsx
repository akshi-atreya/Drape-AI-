"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trend } from "@/lib/types";
import { catalog } from "@/lib/catalog";
import { useAppStore } from "@/store/useAppStore";
import { getShoppingSearchUrl } from "@/lib/locale";

export function TrendCard({ trend }: { trend: Trend }) {
  const [shopOpen, setShopOpen] = useState(false);
  const router = useRouter();
  const sendMessage = useAppStore((s) => s.sendMessage);
  const gender = useAppStore((s) => s.profile.gender);
  const countryCode = useAppStore((s) => s.countryCode);

  // Piece types that express this trend (e.g. "Wool Coat", "Ankle Boots") —
  // search starting points, not specific products. Live trends carry their own
  // list; the hand-written fallback derives it from the catalog's trend tags.
  const pieceTypes = (
    trend.pieceTypes?.length
      ? trend.pieceTypes
      : [...new Set(catalog.filter((p) => (p.trendTags as string[]).includes(trend.name)).map((p) => p.subcategory))]
  ).slice(0, 8);

  const buildLook = () => {
    sendMessage(`Let's build a ${trend.name.toLowerCase()}-forward look.`);
    router.push("/");
  };

  return (
    <article className="animate-in bg-white rounded-2xl overflow-hidden border border-beige-dark/60">
      <div
        className="aspect-[16/9] flex items-end p-6"
        style={{ backgroundColor: "#ffffff", backgroundImage: `linear-gradient(155deg, ${trend.heroColor}, ${trend.heroColor}aa)` }}
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

        {trend.sources && trend.sources.length > 0 && (
          <p className="text-xs text-gray leading-relaxed">
            Seen in{" "}
            {trend.sources.map((src, i) => (
              <span key={src.url}>
                {i > 0 && ", "}
                <a href={src.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-charcoal" title={src.title}>
                  {src.outlet}
                </a>
              </span>
            ))}
          </p>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            onClick={() => setShopOpen((v) => !v)}
            className="px-4 py-2 rounded-full border border-beige-dark text-sm hover:border-charcoal transition-colors"
          >
            Pieces to look for
          </button>
          <button
            onClick={buildLook}
            className="px-4 py-2 rounded-full bg-charcoal text-ivory text-sm hover:bg-charcoal-soft transition-colors"
          >
            Build me a look
          </button>
        </div>

        {shopOpen && (
          <div className="animate-in pt-3 border-t border-beige-dark/60 space-y-3">
            <div className="flex flex-wrap gap-2">
              {pieceTypes.map((type) => (
                <a
                  key={type}
                  href={getShoppingSearchUrl(`${trend.name} ${type}`.toLowerCase(), gender, countryCode)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-full bg-beige text-xs text-charcoal-soft hover:bg-beige-dark transition-colors"
                >
                  {type} ↗
                </a>
              ))}
            </div>
            <p className="text-xs text-gray">
              Tap one to search for it, or ask DrapePal to build a whole look around this trend.
            </p>
          </div>
        )}
      </div>
    </article>
  );
}
