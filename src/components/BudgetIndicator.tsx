export function BudgetIndicator({ total, budget }: { total: number; budget: number | null }) {
  if (budget == null) {
    return (
      <div className="text-xs uppercase tracking-wide text-gray font-medium">
        Total ${total.toFixed(0)}
      </div>
    );
  }
  const pct = Math.min(100, (total / budget) * 100);
  const over = total > budget;

  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between mb-1.5">
        <span className={`text-sm font-medium ${over ? "text-accent" : "text-charcoal"}`}>
          ${total.toFixed(0)} <span className="text-gray font-normal">/ ${budget.toFixed(0)}</span>
        </span>
        {over && (
          <span className="text-xs text-accent font-medium">
            ${(total - budget).toFixed(0)} over
          </span>
        )}
      </div>
      <div className="h-[3px] w-full rounded-full bg-beige-dark overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${pct}%`,
            background: over ? "var(--color-accent)" : "var(--color-charcoal)",
          }}
        />
      </div>
    </div>
  );
}
