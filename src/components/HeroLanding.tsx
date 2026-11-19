"use client";

import { ChatComposer } from "@/components/ChatComposer";
import { SuggestedChips } from "@/components/SuggestedChips";
import { useAppStore } from "@/store/useAppStore";

export function HeroLanding() {
  const sendMessage = useAppStore((s) => s.sendMessage);
  const loading = useAppStore((s) => s.loading);

  return (
    <div className="relative flex-1 flex flex-col items-center justify-center px-6 py-16 md:py-20 text-center">
      {/* A soft ivory glow behind the content keeps the text crisp over the doodled background. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 55% 60% at 50% 48%, rgba(248,244,238,0.97) 0%, rgba(248,244,238,0.88) 55%, rgba(248,244,238,0) 100%)",
        }}
      />
      <div className="relative animate-in space-y-3 mb-9">
        <h1 className="font-serif text-4xl md:text-6xl leading-[1.05]">
          Your personal shopper,
          <br />
          powered by AI.
        </h1>
        <p className="text-charcoal-soft text-base md:text-lg max-w-lg mx-auto pt-2">
          Tell me the occasion. I&apos;ll design a complete look for the weather and the
          moment, then show you how it looks on you.
        </p>
      </div>

      <div className="relative animate-in w-full max-w-2xl" style={{ animationDelay: "80ms" }}>
        <ChatComposer variant="hero" onSubmit={(text, images) => sendMessage(text, undefined, images)} loading={loading} />
      </div>

      <p className="relative animate-in text-xs text-gray mt-4 max-w-sm mx-auto" style={{ animationDelay: "120ms" }}>
        I check your local weather so looks fit the day. Your location is only used for that and never stored.
      </p>

      <div className="relative animate-in mt-6" style={{ animationDelay: "150ms" }}>
        <SuggestedChips onSelect={sendMessage} />
      </div>

      <p className="relative animate-in text-xs text-gray mt-12 tracking-wide" style={{ animationDelay: "220ms" }}>
        Weather-smart. Trend-aware. See it on you.
      </p>
    </div>
  );
}
