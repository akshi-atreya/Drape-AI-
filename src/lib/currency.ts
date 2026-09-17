import { CountryCode, CURRENCY_BY_COUNTRY } from "@/lib/locale";

/**
 * Live currency conversion for display. The catalog itself stays entirely
 * USD-denominated internally (recommendation engine, budgets, storage) —
 * conversion only happens at render time and when interpreting a
 * non-USD budget the user states in chat. Rates come from a free, no-key
 * FX API (see /api/fx) and are cached; if that ever fails, a small static
 * fallback table keeps prices from breaking, just slightly stale.
 */

// Approximate fallback rates (USD -> currency), only used if the live FX
// fetch fails. Not kept perfectly current — the live rate is preferred.
export const FALLBACK_RATES: Record<string, number> = {
  USD: 1,
  GBP: 0.79,
  CAD: 1.38,
  AUD: 1.53,
  EUR: 0.92,
  INR: 88,
};

/** Server-side only: live USD rates, revalidated every 6h, falling back to the static table on failure. */
export async function fetchFxRates(): Promise<{ rates: Record<string, number>; source: "live" | "fallback" }> {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", { next: { revalidate: 21600 } });
    if (!res.ok) throw new Error(`FX API ${res.status}`);
    const data = await res.json();
    if (!data.rates) throw new Error("No rates in FX response");
    return { rates: data.rates, source: "live" };
  } catch (err) {
    console.error("FX rate fetch failed, using fallback:", err);
    return { rates: FALLBACK_RATES, source: "fallback" };
  }
}

export function currencyForCountry(country: CountryCode | null): string {
  return country ? CURRENCY_BY_COUNTRY[country] : "USD";
}

/** Converts a USD amount to the target currency using live (or fallback) rates. */
export function convertUsd(usdAmount: number, currency: string, rates: Record<string, number> | null): number {
  if (currency === "USD") return usdAmount;
  const rate = rates?.[currency] ?? FALLBACK_RATES[currency];
  if (!rate) return usdAmount;
  return usdAmount * rate;
}

/** Formats a USD amount as the shopper's local currency, e.g. $79 -> ₹6,952. */
export function formatPrice(
  usdAmount: number,
  country: CountryCode | null,
  rates: Record<string, number> | null
): string {
  const currency = currencyForCountry(country);
  const converted = convertUsd(usdAmount, currency, rates);
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: converted >= 100 ? 0 : 2,
    }).format(converted);
  } catch {
    return `${currency} ${converted.toFixed(0)}`;
  }
}
