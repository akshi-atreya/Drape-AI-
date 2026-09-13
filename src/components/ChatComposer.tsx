"use client";

import { useEffect, useRef, useState } from "react";

const ROTATING_PLACEHOLDERS = [
  "Build me a date-night outfit under $150...",
  "I need 5 outfits for Paris in October...",
  "Find me a wedding guest outfit under $200...",
  "I want something trendy but timeless...",
  "I have these black boots. What can I wear with them?",
  "I need a work wardrobe for fall...",
];

// Minimal typings for the (non-standard) Web Speech API so we can feature-
// detect without `any`.
interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
}

export function ChatComposer({
  variant,
  onSubmit,
  loading,
}: {
  variant: "hero" | "bar";
  onSubmit: (text: string) => void;
  loading?: boolean;
}) {
  const [value, setValue] = useState("");
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    if (variant !== "hero") return;
    const id = setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % ROTATING_PLACEHOLDERS.length);
    }, 3200);
    return () => clearInterval(id);
  }, [variant]);

  useEffect(() => {
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const Impl = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (Impl) {
      // Feature-detecting a browser-only API: this can only run post-mount,
      // so the state update is intentionally inside the effect.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVoiceSupported(true);
      const recognition = new Impl();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";
      recognition.onresult = (event) => {
        const transcript = event.results[0]?.[0]?.transcript;
        if (transcript) setValue((v) => (v ? `${v} ${transcript}` : transcript));
      };
      recognition.onend = () => setListening(false);
      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      recognitionRef.current.start();
      setListening(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || loading) return;
    onSubmit(value.trim());
    setValue("");
  };

  const isHero = variant === "hero";

  return (
    <form
      onSubmit={handleSubmit}
      className={
        isHero
          ? "w-full max-w-2xl mx-auto"
          : "w-full max-w-3xl mx-auto"
      }
    >
      <div
        className={`flex items-center gap-3 bg-white border transition-shadow ${
          isHero
            ? "rounded-2xl px-6 py-5 border-beige-dark shadow-[0_2px_24px_rgba(35,34,32,0.06)] focus-within:shadow-[0_4px_32px_rgba(35,34,32,0.1)]"
            : "rounded-full px-5 py-3 border-beige-dark shadow-[0_1px_8px_rgba(35,34,32,0.06)]"
        }`}
      >
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={isHero ? ROTATING_PLACEHOLDERS[placeholderIdx] : "Tell me what you're looking for..."}
          className={`flex-1 min-w-0 bg-transparent outline-none placeholder:text-gray ${
            isHero ? "text-base md:text-lg" : "text-sm"
          }`}
        />
        {voiceSupported && (
          <button
            type="button"
            onClick={toggleListening}
            aria-label="Voice input"
            className={`shrink-0 rounded-full p-2 transition-colors ${
              listening ? "bg-accent text-white animate-pulse-slow" : "text-gray hover:text-charcoal"
            }`}
          >
            <MicIcon />
          </button>
        )}
        <button
          type="submit"
          disabled={!value.trim() || loading}
          aria-label="Send"
          className="shrink-0 rounded-full bg-charcoal text-ivory p-2.5 disabled:opacity-30 hover:bg-charcoal-soft transition-colors"
        >
          {loading ? <SpinnerIcon /> : <SendIcon />}
        </button>
      </div>
    </form>
  );
}

function MicIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v3" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12 L20 4 L14 20 L11 13 L4 12 Z" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="animate-spin">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
