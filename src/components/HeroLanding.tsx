"use client";

import { useRef, useState } from "react";
import { ChatComposer, ComposerHandle } from "@/components/ChatComposer";
import { SuggestedChips } from "@/components/SuggestedChips";
import { useAppStore } from "@/store/useAppStore";

type Mode = "plan" | "own";

const OWN_STEPS = [
  { title: "Upload a piece", body: "A top, skirt, jeans, jacket, shoes or a bag you already own." },
  { title: "I read it", body: "I spot the color and style, and can ask what else you have to wear with it." },
  { title: "Get full looks", body: "Complete outfits built around it, with links to find the rest." },
];

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
  // Only switches the mode: people read what it does first, then upload in the drop box themselves.
  const chooseOwn = () => setMode("own");

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
        {/* Two ways in: a soft inset track with a raised pill that slides to the chosen option. */}
        <div className="mx-auto mb-3 w-full max-w-md">
          <div
            role="tablist"
            aria-label="What would you like to do?"
            className="relative grid grid-cols-2 rounded-full bg-beige/80 p-1.5 shadow-[inset_0_1px_4px_rgba(35,34,32,0.14)] ring-1 ring-beige-dark/50"
          >
            <span
              aria-hidden
              className="absolute top-1.5 bottom-1.5 left-1.5 w-[calc(50%-0.375rem)] rounded-full bg-white shadow-[0_3px_12px_rgba(35,34,32,0.16),0_0_0_1px_rgba(216,198,168,0.55)] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{ transform: mode === "own" ? "translateX(100%)" : "translateX(0)" }}
            />
            <ModeTab selected={mode === "plan"} onClick={choosePlan} icon={<SparkleIcon />}>
              Plan a look
            </ModeTab>
            <ModeTab selected={mode === "own"} onClick={chooseOwn} icon={<PhotoIcon />} badge="New">
              <span className="sm:hidden">Style my piece</span>
              <span className="hidden sm:inline">Style something I own</span>
            </ModeTab>
          </div>
          <p className="mt-3 text-sm text-charcoal-soft min-h-[1.25rem]" aria-live="polite">
            {mode === "plan"
              ? "For an occasion, a trip, or today's weather."
              : "Upload a piece you own — I'll build looks around it."}
          </p>
        </div>

        {mode === "own" && (
          <ol className="animate-in mb-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-left">
            {OWN_STEPS.map((step, i) => (
              <li key={step.title} className="flex sm:flex-col items-start gap-3 sm:gap-2 rounded-2xl bg-white/80 ring-1 ring-beige-dark/60 px-4 py-3">
                <span className="w-6 h-6 shrink-0 rounded-full bg-beige text-accent text-xs font-medium flex items-center justify-center">
                  {i + 1}
                </span>
                <span>
                  <span className="block text-sm font-medium text-charcoal">{step.title}</span>
                  <span className="block text-xs text-gray leading-relaxed">{step.body}</span>
                </span>
              </li>
            ))}
          </ol>
        )}

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

function ModeTab({
  selected,
  onClick,
  icon,
  badge,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={onClick}
      className={`relative z-10 flex items-center justify-center gap-2 rounded-full px-3 py-3 text-sm font-medium transition-colors duration-200 ${
        selected ? "text-charcoal" : "text-gray hover:text-charcoal-soft"
      }`}
    >
      <span className={`transition-colors duration-200 ${selected ? "text-accent" : ""}`}>{icon}</span>
      <span className="whitespace-nowrap">{children}</span>
      {badge && (
        <span className="hidden sm:inline text-[9px] uppercase tracking-[0.12em] bg-accent text-ivory rounded-full px-1.5 py-0.5 leading-none">
          {badge}
        </span>
      )}
    </button>
  );
}

function SparkleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3C12.4 8 15 10.6 20 11C15 11.4 12.4 14 12 19C11.6 14 9 11.4 4 11C9 10.6 11.6 8 12 3Z" />
      <path d="M19 17v4M17 19h4" />
    </svg>
  );
}

function PhotoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="M21 16l-5-5-8 8" />
    </svg>
  );
}
