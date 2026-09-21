import { CountryCode, CURRENCY_BY_COUNTRY } from "@/lib/locale";

// Explicit locale per country/currency — Intl.NumberFormat(undefined, ...)
// uses the *browser's* locale to decide symbol style, which for USD often
// renders "US$" instead of "$" (many non-US locales disambiguate that way).
// Passing the shopper's own country's locale gives the plain, expected
// symbol for their currency instead.
const LOCALE_BY_COUNTRY: Record<CountryCode, string> = {
  US: "en-US",
  GB: "en-GB",
  CA: "en-CA",
  AU: "en-AU",
  DE: "de-DE",
  FR: "fr-FR",
  ES: "es-ES",
  IT: "it-IT",
  NL: "nl-NL",
  IN: "en-IN",
};

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

/**
 * Formats a USD amount as the shopper's local currency, e.g. $79 -> ~₹6,952.
 * Prefixed with "~" by default — every price in this app is a generated
 * estimate for a mock catalog item, never a live listing (see the "Shop"
 * link, which opens a real search page, not this exact SKU), so the symbol
 * stays on the price itself rather than relying only on a footnote users
 * can scroll past. Pass approx:false for a context that already makes
 * that clear another way (e.g. right next to its own "estimate" label).
 */
export function formatPrice(
  usdAmount: number,
  country: CountryCode | null,
  rates: Record<string, number> | null,
  approx = true
): string {
  const currency = currencyForCountry(country);
  const converted = convertUsd(usdAmount, currency, rates);
  const locale = country ? LOCALE_BY_COUNTRY[country] : "en-US";
  try {
    const formatted = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: converted >= 100 ? 0 : 2,
    }).format(converted);
    return approx ? `~${formatted}` : formatted;
  } catch {
    const fallback = `${currency} ${converted.toFixed(0)}`;
    return approx ? `~${fallback}` : fallback;
  }
}
