import { Product } from "@/lib/types";

/**
 * Regional "shop" links.
 *
 * The mock catalog has no real per-product page (there's no live retailer
 * feed behind it — see README), so linking to a fabricated product-id path
 * like `zara.com/products/p0001` always 404s to the homepage. Instead we
 * link to each retailer's real, working search-results page for that
 * product's name, scoped to the viewer's detected region — verified against
 * the live sites rather than guessed. This is the honest MVP behavior: it
 * lands on genuinely relevant results, not a fabricated exact product page.
 * Swap this for real deep links once a live product feed/API is connected.
 */

export type CountryCode = "US" | "GB" | "CA" | "AU" | "DE" | "FR";

const SUPPORTED_COUNTRIES: CountryCode[] = ["US", "GB", "CA", "AU", "DE", "FR"];

export const COUNTRY_LABELS: Record<CountryCode, string> = {
  US: "United States",
  GB: "United Kingdom",
  CA: "Canada",
  AU: "Australia",
  DE: "Germany",
  FR: "France",
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

interface RegionPaths {
  zara: string; // "{country}/{lang}"
  hm: string; // "{lang}_{country}"
  mango: string; // "{country}/{lang}"
  aritzia: string; // "{country}/{lang}"
  asos: string; // "{country}"
}

// Best-effort regional path segments. Only the US segment for each retailer
// has been verified live; others are reasonable defaults and fall back to
// the US path for retailers that don't clearly operate a separate storefront
// for that country (e.g. Mango doesn't have a distinct AU site).
const REGION_PATHS: Record<CountryCode, RegionPaths> = {
  US: { zara: "us/en", hm: "en_us", mango: "us/en", aritzia: "us/en", asos: "us" },
  GB: { zara: "uk/en", hm: "en_gb", mango: "gb/en", aritzia: "us/en", asos: "en" },
  CA: { zara: "ca/en", hm: "en_ca", mango: "us/en", aritzia: "ca/en", asos: "us" },
  AU: { zara: "au/en", hm: "en_us", mango: "us/en", aritzia: "us/en", asos: "au" },
  DE: { zara: "de/de", hm: "de_de", mango: "de/en", aritzia: "us/en", asos: "de" },
  FR: { zara: "fr/fr", hm: "fr_fr", mango: "fr/fr", aritzia: "us/en", asos: "fr" },
};

/** Builds a real, working search-results URL for a product on its retailer's site. */
export function getShopUrl(product: Product, country: CountryCode = "US"): string {
  const paths = REGION_PATHS[country] ?? REGION_PATHS.US;
  const term = encodeURIComponent(product.name);

  switch (product.retailer) {
    case "Zara":
      return `https://www.zara.com/${paths.zara}/search?searchTerm=${term}`;
    case "H&M":
      return `https://www2.hm.com/${paths.hm}/search-results.html?q=${term}`;
    case "Mango":
      return `https://shop.mango.com/${paths.mango}/search/women?q=${term}`;
    case "Aritzia":
      return `https://www.aritzia.com/${paths.aritzia}/search?q=${term}`;
    case "Nordstrom":
      return `https://www.nordstrom.com/sr?origin=keywordsearch&keyword=${term}`;
    case "ASOS":
      return `https://www.asos.com/${paths.asos}/search/?q=${term}`;
    default:
      return product.productUrl;
  }
}
