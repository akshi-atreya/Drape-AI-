"use client";

import { useEffect, useRef, useState } from "react";
import { Outfit } from "@/lib/types";
import { useAppStore } from "@/store/useAppStore";
import { ChatComposer } from "@/components/ChatComposer";
import { ChatMessageBubble } from "@/components/ChatMessageBubble";
import { TryOnModal } from "@/components/TryOnModal";
import { fmtTemp } from "@/lib/weather";

export function ChatView() {
  const messages = useAppStore((s) => s.messages);
  const sendMessage = useAppStore((s) => s.sendMessage);
  const loading = useAppStore((s) => s.loading);
  const error = useAppStore((s) => s.error);
  const savedLooks = useAppStore((s) => s.savedLooks);
  const resetChat = useAppStore((s) => s.resetChat);
  const weather = useAppStore((s) => s.weather);
  const ensureWeather = useAppStore((s) => s.ensureWeather);

  const [tryOnOutfit, setTryOnOutfit] = useState<Outfit | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const savedOutfitIds = new Set(
    savedLooks.filter((l) => l.type === "outfit" && l.outfit).map((l) => l.outfit!.id)
  );

  const allOutfitsInThread = messages.flatMap((m) => m.outfits ?? []);

  return (
    <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto">
      <div className="flex items-center justify-between px-6 md:px-0 pt-6 pb-2">
        <div className="flex flex-col gap-0.5 min-w-0">
          <p className="text-xs uppercase tracking-wide text-gray">Your AI Stylist</p>
          {weather && (
            <p className="text-xs text-charcoal-soft truncate">
              {weather.source === "location" ? (weather.city ? `${weather.city} · ` : "") : "You said · "}
              {fmtTemp(weather.effectiveC)}
              {weather.rain ? " · rain" : weather.snow ? " · snow" : ""} · dressing for {weather.season.toLowerCase()}
              {weather.source === "location" && (
                <button onClick={() => ensureWeather(true)} className="ml-2 underline underline-offset-2 text-gray hover:text-charcoal">
                  refresh
                </button>
              )}
            </p>
          )}
        </div>
        <button onClick={resetChat} className="text-xs text-gray hover:text-charcoal transition-colors">
          New conversation
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 md:px-0 py-4 space-y-6">
        {messages.map((m, i) => (
          <ChatMessageBubble
            key={m.id}
            message={m}
            onTryOn={setTryOnOutfit}
            savedIds={savedOutfitIds}
            // Quick-reply buttons are live only on the newest message, and only until the user answers.
            onQuickReply={i === messages.length - 1 && !loading ? sendMessage : undefined}
          />
        ))}

        {loading && (
          <div className="animate-in flex items-center gap-1.5 text-gray text-sm pl-1">
            <Dot delay="0ms" /> <Dot delay="120ms" /> <Dot delay="240ms" />
          </div>
        )}

        {error && (
          <div className="animate-in text-sm text-accent bg-accent/5 border border-accent/20 rounded-xl px-4 py-3">
            {error}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="sticky bottom-[calc(3.5rem+env(safe-area-inset-bottom))] md:bottom-0 bg-gradient-to-t from-ivory via-ivory to-transparent pt-6 pb-6 px-6 md:px-0">
        <ChatComposer variant="bar" onSubmit={(text, images) => sendMessage(text, undefined, images)} loading={loading} />
      </div>

      {tryOnOutfit && (
        <TryOnModal
          outfit={tryOnOutfit}
          outfits={allOutfitsInThread}
          onClose={() => setTryOnOutfit(null)}
          onNavigate={setTryOnOutfit}
        />
      )}
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="w-1.5 h-1.5 rounded-full bg-gray animate-pulse-slow"
      style={{ animationDelay: delay }}
    />
  );
}
