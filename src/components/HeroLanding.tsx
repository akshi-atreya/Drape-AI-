"use client";

import { useRef, useState } from "react";
import { ChatComposer, ComposerHandle } from "@/components/ChatComposer";
import { SuggestedChips } from "@/components/SuggestedChips";
import { useAppStore } from "@/store/useAppStore";

type Mode = "plan" | "own";

const OWN_HINTS = [
  "How can I style this?",
  "What goes with this for a night out?",
  "Make this work for the office",
  "What shoes should I wear with this?",
];

export function HeroLanding() {
  const sendMessage = useAppStore((s) => s.sendMessage);
  const loading = useAppStore((s) => s.loading);
  const [mode, setMode] = useState<Mode>("plan");
  const composer = useRef<ComposerHandle>(null);

  const choosePlan = () => {
    setMode("plan");
    composer.current?.focus();
  };
  const chooseOwn = () => {
    setMode("own");
    composer.current?.openPicker();
  };

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
        {/* Two ways in. The selected one is dark, and picking one changes what's shown below. */}
        <div role="tablist" aria-label="What would you like to do?" className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-left">
          <ModeCard
            selected={mode === "plan"}
            onClick={choosePlan}
            icon={<SparkleIcon />}
            title="Plan a look"
            subtitle="For an occasion, a trip, or today's weather"
          />
          <ModeCard
            selected={mode === "own"}
            onClick={chooseOwn}
            icon={<PhotoIcon />}
            title="Style something I own"
            subtitle="Upload a photo of a piece — never stored"
            badge="New"
          />
        </div>

        <ChatComposer
          ref={composer}
          mode={mode}
          variant="hero"
          onSubmit={(text, images) => sendMessage(text, undefined, images)}
          loading={loading}
        />
      </div>

      {mode === "plan" ? (
        <>
          <p className="relative animate-in text-xs text-gray mt-4 max-w-sm mx-auto">
            I check your local weather so looks fit the day. Your location is only used for that and never stored.
          </p>
          <div className="relative animate-in mt-6">
            <SuggestedChips onSelect={sendMessage} />
          </div>
        </>
      ) : (
        <div className="relative animate-in mt-5 max-w-xl mx-auto">
          <p className="text-xs text-gray mb-3">Not sure what to ask? Tap one to start your question:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {OWN_HINTS.map((hint) => (
              <button
                key={hint}
                onClick={() => composer.current?.setText(hint)}
                className="px-4 py-2 rounded-full border border-beige-dark text-sm text-charcoal-soft hover:border-charcoal hover:text-charcoal transition-colors bg-white/70"
              >
                {hint}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="relative animate-in text-xs text-gray mt-12 tracking-wide">
        Weather-smart. Trend-aware. See it on you.
      </p>
    </div>
  );
}

function ModeCard({
  selected,
  onClick,
  icon,
  title,
  subtitle,
  badge,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  badge?: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={onClick}
      className={`relative flex items-center gap-3.5 text-left rounded-2xl border px-4 py-3.5 transition-colors ${
        selected
          ? "border-charcoal bg-charcoal text-ivory shadow-[0_6px_24px_rgba(21,19,15,0.18)]"
          : "border-beige-dark bg-white/90 text-charcoal hover:border-charcoal"
      }`}
    >
      <span className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center ${selected ? "bg-ivory/15" : "bg-beige text-charcoal-soft"}`}>
        {icon}
      </span>
      <span>
        <span className="block text-sm font-medium">{title}</span>
        <span className={`block text-xs ${selected ? "text-ivory/70" : "text-gray"}`}>{subtitle}</span>
      </span>
      {badge && (
        <span className="absolute -top-2 right-4 text-[10px] uppercase tracking-wide bg-accent text-ivory rounded-full px-2.5 py-0.5">
          {badge}
        </span>
      )}
    </button>
  );
}

function SparkleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3C12.4 8 15 10.6 20 11C15 11.4 12.4 14 12 19C11.6 14 9 11.4 4 11C9 10.6 11.6 8 12 3Z" />
      <path d="M19 17v4M17 19h4" />
    </svg>
  );
}

function PhotoIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="M21 16l-5-5-8 8" />
    </svg>
  );
}
