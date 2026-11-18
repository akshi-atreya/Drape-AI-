import { Gender } from "@/lib/types";

/**
 * Region support. FitCast no longer carries retailer data: it recommends
 * garment *types* and links out to a neutral, region-aware shopping search
 * where the shopper finds the actual item on whichever store they like,
 * then pastes that product link back to try it on.
 */

export type CountryCode = "US" | "GB" | "CA" | "AU" | "DE" | "FR" | "ES" | "IT" | "NL" | "IN";

const SUPPORTED_COUNTRIES: CountryCode[] = ["US", "GB", "CA", "AU", "DE", "FR", "ES", "IT", "NL", "IN"];

export const COUNTRY_LABELS: Record<CountryCode, string> = {
  US: "United States",
  GB: "United Kingdom",
  CA: "Canada",
  AU: "Australia",
  DE: "Germany",
  FR: "France",
  ES: "Spain",
  IT: "Italy",
  NL: "Netherlands",
  IN: "India",
};

/** Reads the browser's locale (no permission prompt) to guess a region. Falls back to US. */
export function detectCountryFromLocale(): CountryCode {
  const locale = typeof navigator !== "undefined" ? navigator.language : "en-US";
  const region = locale.split("-")[1]?.toUpperCase();
  if (region && (SUPPORTED_COUNTRIES as string[]).includes(region)) {
    return region as CountryCode;
  }
  return "US";
}

/** Google's regional shopping parameter (`gl`) for each supported country. */
const GOOGLE_REGION: Record<CountryCode, string> = {
  US: "us", GB: "uk", CA: "ca", AU: "au", DE: "de", FR: "fr", ES: "es", IT: "it", NL: "nl", IN: "in",
};

function genderPrefix(gender: Gender | null): string {
  if (gender === "Men") return "men's ";
  if (gender === "Women") return "women's ";
  return "";
}

/** A region-aware shopping search for a garment type, e.g. "women's charcoal satin blouse". */
export function getShoppingSearchUrl(
  query: string,
  gender: Gender | null,
  country: CountryCode = "US"
): string {
  const q = encodeURIComponent(`${genderPrefix(gender)}${query}`.trim());
  return `https://www.google.com/search?tbm=shop&q=${q}&gl=${GOOGLE_REGION[country] ?? "us"}`;
}
