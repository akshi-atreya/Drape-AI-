export function TagToggleGroup<T extends string>({
  options,
  selected,
  onToggle,
}: {
  options: readonly T[];
  selected: T[];
  onToggle: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            className={`px-3.5 py-1.5 rounded-full text-sm border transition-colors ${
              active
                ? "bg-charcoal text-ivory border-charcoal"
                : "border-beige-dark text-charcoal-soft hover:border-charcoal"
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}
