"use client";

import { useEffect, useRef, useState } from "react";
import { Outfit } from "@/lib/types";
import { useAppStore } from "@/store/useAppStore";
import { ChatComposer } from "@/components/ChatComposer";
import { ChatMessageBubble } from "@/components/ChatMessageBubble";
import { TryOnModal } from "@/components/TryOnModal";

export function ChatView() {
  const messages = useAppStore((s) => s.messages);
  const sendMessage = useAppStore((s) => s.sendMessage);
  const loading = useAppStore((s) => s.loading);
  const error = useAppStore((s) => s.error);
  const savedLooks = useAppStore((s) => s.savedLooks);
  const resetChat = useAppStore((s) => s.resetChat);

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
        <p className="text-xs uppercase tracking-wide text-gray">Your AI Stylist</p>
        <button onClick={resetChat} className="text-xs text-gray hover:text-charcoal transition-colors">
          New conversation
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 md:px-0 py-4 space-y-6">
        {messages.map((m) => (
          <ChatMessageBubble key={m.id} message={m} onTryOn={setTryOnOutfit} savedIds={savedOutfitIds} />
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

      <div className="sticky bottom-0 bg-gradient-to-t from-ivory via-ivory to-transparent pt-6 pb-6 px-6 md:px-0">
        <ChatComposer variant="bar" onSubmit={sendMessage} loading={loading} />
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
