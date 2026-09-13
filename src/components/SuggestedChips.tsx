const CHIPS: { label: string; prompt: string }[] = [
  { label: "Date Night", prompt: "Build me a date-night outfit." },
  { label: "Vacation", prompt: "I need outfits for an upcoming vacation." },
  { label: "Work", prompt: "Help me build a work wardrobe." },
  { label: "Wedding", prompt: "I need a wedding guest outfit." },
  { label: "Weekend", prompt: "Put together a relaxed weekend look." },
  { label: "Trending Now", prompt: "What's trending right now? Build me something on-trend." },
];

export function SuggestedChips({ onSelect }: { onSelect: (prompt: string) => void }) {
  return (
    <div className="flex flex-wrap justify-center gap-2 max-w-xl mx-auto">
      {CHIPS.map((c) => (
        <button
          key={c.label}
          onClick={() => onSelect(c.prompt)}
          className="px-4 py-2 rounded-full border border-beige-dark text-sm text-charcoal-soft hover:border-charcoal hover:text-charcoal transition-colors bg-white/60"
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}
