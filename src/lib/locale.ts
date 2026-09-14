import { Gender, Product } from "@/lib/types";

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

/**
 * Per-retailer gender scoping, verified live against each site:
 * - Zara:      ?section=MAN|WOMAN
 * - H&M:       &department=men_all|ladies_all
 * - Mango:     /search/men|women (path segment, not "women" hardcoded)
 * - Nordstrom: &filterByGenderAge=men|women
 * - ASOS:      &refine=floor:1001,2001 scopes to men+unisex; the plain
 *              (unscoped) search already defaults to women's results, so
 *              no param is added for Women.
 * - Aritzia:   no menswear line at all — excluded from the men's retailer
 *              pool at catalog-generation time, so this case shouldn't be
 *              hit for a Men product, but falls back to the unscoped
 *              search (still correct for Women/Unisex) rather than a
 *              nonexistent men's URL.
 */
// Mango's search requires a department path segment (no bare endpoint), so
// Unisex falls back to "women" rather than breaking the link.
function mangoSection(gender: Gender): string {
  return gender === "Men" ? "men" : "women";
}
// H&M has no distinct "unisex" department facet — leave Unisex unscoped
// (shows the "ALL" tab) rather than mis-filing it under either gender.
function hmDepartment(gender: Gender): string | null {
  if (gender === "Men") return "men_all";
  if (gender === "Women") return "ladies_all";
  return null;
}
// Nordstrom's own gender filter genuinely includes "Unisex" as an option.
function nordstromGenderParam(gender: Gender): string {
  if (gender === "Men") return "men";
  if (gender === "Women") return "women";
  return "unisex";
}

/** Builds a real, working search-results URL for a product on its retailer's site. */
export function getShopUrl(product: Product, country: CountryCode = "US"): string {
  const paths = REGION_PATHS[country] ?? REGION_PATHS.US;
  const term = encodeURIComponent(product.name);
  const gender = product.gender;

  switch (product.retailer) {
    case "Zara": {
      const section = gender === "Men" ? "MAN" : gender === "Women" ? "WOMAN" : null;
      return `https://www.zara.com/${paths.zara}/search?searchTerm=${term}${section ? `&section=${section}` : ""}`;
    }
    case "H&M": {
      const dept = hmDepartment(gender);
      return `https://www2.hm.com/${paths.hm}/search-results.html?q=${term}${dept ? `&department=${dept}` : ""}`;
    }
    case "Mango":
      return `https://shop.mango.com/${paths.mango}/search/${mangoSection(gender)}?q=${term}`;
    case "Aritzia":
      return `https://www.aritzia.com/${paths.aritzia}/search?q=${term}`;
    case "Nordstrom":
      return `https://www.nordstrom.com/sr?origin=keywordsearch&keyword=${term}&filterByGenderAge=${nordstromGenderParam(gender)}`;
    case "ASOS":
      return `https://www.asos.com/${paths.asos}/search/?q=${term}${gender !== "Women" ? "&refine=floor:1001,2001" : ""}`;
    default:
      return product.productUrl;
  }
}
