"use client";

import { useAppStore } from "@/store/useAppStore";
import { formatPrice } from "@/lib/currency";

export function BudgetIndicator({ total, budget }: { total: number; budget: number | null }) {
  const countryCode = useAppStore((s) => s.countryCode);
  const fxRates = useAppStore((s) => s.fxRates);
  const price = (usd: number) => formatPrice(usd, countryCode, fxRates);

  if (budget == null) {
    return (
      <div className="text-xs uppercase tracking-wide text-gray font-medium">
        Total {price(total)}
      </div>
    );
  }
  const pct = Math.min(100, (total / budget) * 100);
  const over = total > budget;

  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between mb-1.5">
        <span className={`text-sm font-medium ${over ? "text-accent" : "text-charcoal"}`}>
          {price(total)} <span className="text-gray font-normal">/ {price(budget)}</span>
        </span>
        {over && (
          <span className="text-xs text-accent font-medium">
            {price(total - budget)} over
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
