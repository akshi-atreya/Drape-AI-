"use client";

import { useState } from "react";
import { WardrobeList } from "@/components/WardrobeList";
import { StyleProfilePanel } from "@/components/StyleProfilePanel";

export default function WardrobePage() {
  const [tab, setTab] = useState<"wardrobe" | "style">("wardrobe");

  return (
    <div className="max-w-4xl mx-auto w-full px-6 md:px-10 py-14">
      <h1 className="font-serif text-4xl md:text-5xl mb-8">My Wardrobe</h1>

      <div className="flex gap-6 border-b border-beige-dark/60 mb-10">
        {(["wardrobe", "style"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-3 text-sm transition-colors border-b-2 -mb-px ${
              tab === t ? "border-charcoal text-charcoal" : "border-transparent text-gray hover:text-charcoal"
            }`}
          >
            {t === "wardrobe" ? "What you own" : "Your style"}
          </button>
        ))}
      </div>

      {tab === "wardrobe" ? <WardrobeList /> : <StyleProfilePanel />}
    </div>
  );
}
