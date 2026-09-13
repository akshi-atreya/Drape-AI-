"use client";

import { ChatComposer } from "@/components/ChatComposer";
import { SuggestedChips } from "@/components/SuggestedChips";
import { useAppStore } from "@/store/useAppStore";

export function HeroLanding() {
  const sendMessage = useAppStore((s) => s.sendMessage);
  const loading = useAppStore((s) => s.loading);

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
      <div className="animate-in space-y-3 mb-10">
        <h1 className="font-serif text-4xl md:text-6xl leading-[1.05]">
          Your personal shopper,
          <br />
          powered by AI.
        </h1>
        <p className="text-charcoal-soft text-base md:text-lg max-w-lg mx-auto pt-2">
          Tell me what you&apos;re looking for. I&apos;ll find the pieces, build the look,
          and make it yours.
        </p>
      </div>

      <div className="animate-in w-full" style={{ animationDelay: "80ms" }}>
        <ChatComposer variant="hero" onSubmit={sendMessage} loading={loading} />
      </div>

      <div className="animate-in mt-6" style={{ animationDelay: "150ms" }}>
        <SuggestedChips onSelect={sendMessage} />
      </div>

      <p className="animate-in text-xs text-gray mt-14 tracking-wide" style={{ animationDelay: "220ms" }}>
        Shop across your favorite brands. Discover trends. Try looks on virtually.
      </p>
    </div>
  );
}
