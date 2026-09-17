import { Gender, Product, Retailer } from "@/lib/types";

/**
 * Region support: which countries we know about, which of the 6 mock
 * retailers actually operate (with local pricing) in each, their real
 * search-URL patterns, and local currency.
 *
 * The mock catalog has no real per-product page (no live retailer feed
 * behind it — see README), so linking to a fabricated product-id path like
 * `zara.com/products/p0001` always 404s. Instead we link to each retailer's
 * real, working search-results page for that product's name, scoped to the
 * viewer's region — verified against the live sites rather than guessed
 * where noted below. Swap for real deep links once a live product feed/API
 * is connected.
 *
 * Full global coverage (~195 countries, every retailer hand-verified in
 * each) isn't tractable to maintain by hand. This covers a solid set of
 * major markets; anything outside it falls back to the US storefront in
 * USD, clearly worse but never broken.
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

/** ISO 4217 currency each country shops in. Our catalog is USD-denominated; see currency.ts for live conversion. */
export const CURRENCY_BY_COUNTRY: Record<CountryCode, string> = {
  US: "USD",
  GB: "GBP",
  CA: "CAD",
  AU: "AUD",
  DE: "EUR",
  FR: "EUR",
  ES: "EUR",
  IT: "EUR",
  NL: "EUR",
  IN: "INR",
};

/**
 * Which retailers actually operate a local storefront in each country —
 * this is what makes recommendations themselves country-aware, not just
 * the redirect link. Verified live for US/GB/IN; Aritzia and Nordstrom are
 * confirmed North-America-only (no international sites at all). Mango has
 * no dedicated India storefront (shop.mango.com/in redirects to /gb) so
 * it's excluded there; ASOS ships to India but its currency defaults to
 * GBP with no confirmed local URL path, so it's also left out to avoid
 * showing the wrong currency. EU markets (DE/FR/ES/IT/NL) assume Zara,
 * H&M, Mango, and ASOS's well-documented per-country URL scheme
 * generalizes the same way it does for the countries we did verify live —
 * reasonable, not individually hand-verified.
 */
const RETAILERS_BY_COUNTRY: Record<CountryCode, Retailer[]> = {
  US: ["Zara", "H&M", "Mango", "Aritzia", "Nordstrom", "ASOS"],
  CA: ["Zara", "H&M", "Aritzia", "Nordstrom", "ASOS"],
  GB: ["Zara", "H&M", "Mango", "ASOS"],
  AU: ["Zara", "H&M", "ASOS"],
  DE: ["Zara", "H&M", "Mango", "ASOS"],
  FR: ["Zara", "H&M", "Mango", "ASOS"],
  ES: ["Zara", "H&M", "Mango", "ASOS"],
  IT: ["Zara", "H&M", "Mango", "ASOS"],
  NL: ["Zara", "H&M", "Mango", "ASOS"],
  IN: ["Zara", "H&M", "ASOS"],
};

export function retailersAvailableIn(country: CountryCode | null): Retailer[] | null {
  if (!country) return null;
  return RETAILERS_BY_COUNTRY[country] ?? null;
}

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
  asos: string; // "{country}", or "" for no dedicated country path
}

// Verified live: US (all), GB (Zara/H&M/Mango/ASOS), IN (Zara/H&M). Others
// are the same well-documented per-country pattern extended by inference.
const REGION_PATHS: Record<CountryCode, RegionPaths> = {
  US: { zara: "us/en", hm: "en_us", mango: "us/en", aritzia: "us/en", asos: "us" },
  GB: { zara: "uk/en", hm: "en_gb", mango: "gb/en", aritzia: "us/en", asos: "en" },
  CA: { zara: "ca/en", hm: "en_ca", mango: "us/en", aritzia: "ca/en", asos: "us" },
  AU: { zara: "au/en", hm: "en_us", mango: "us/en", aritzia: "us/en", asos: "au" },
  DE: { zara: "de/de", hm: "de_de", mango: "de/en", aritzia: "us/en", asos: "de" },
  FR: { zara: "fr/fr", hm: "fr_fr", mango: "fr/fr", aritzia: "us/en", asos: "fr" },
  ES: { zara: "es/es", hm: "es_es", mango: "es/es", aritzia: "us/en", asos: "es" },
  IT: { zara: "it/it", hm: "it_it", mango: "it/it", aritzia: "us/en", asos: "it" },
  NL: { zara: "nl/nl", hm: "nl_nl", mango: "nl/en", aritzia: "us/en", asos: "nl" },
  IN: { zara: "in/en", hm: "en_in", mango: "us/en", aritzia: "us/en", asos: "" },
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
    case "ASOS": {
      const prefix = paths.asos ? `${paths.asos}/` : "";
      const refine = gender !== "Women" ? "&refine=floor:1001,2001" : "";
      return `https://www.asos.com/${prefix}search/?q=${term}${refine}`;
    }
    default:
      return product.productUrl;
  }
}
