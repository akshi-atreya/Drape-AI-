import raw from "@/data/products.json";
import { Product, SeasonTag } from "@/lib/types";

// The mock catalog stands in for a normalized multi-retailer product feed.
// Swap this import for a real API/database call later — everything else
// (recommendation engine, chat route, UI) depends only on Product[].

const WARM: SeasonTag[] = ["Spring", "Summer"];
const COOL: SeasonTag[] = ["Fall", "Winter"];
const SHOULDER: SeasonTag[] = ["Spring", "Fall"];
const NOT_WINTER: SeasonTag[] = ["Spring", "Summer", "Fall"];

/**
 * When each kind of piece is actually worn. The generated catalog's season
 * tags were random (summer-only coats, winter sandals), so a "winter trip"
 * request could never be answered sensibly. Real seasonality follows the
 * garment type, so it is derived from the subcategory; anything not listed
 * is wearable year-round.
 */
const SEASONS_BY_SUBCATEGORY: Record<string, SeasonTag[]> = {
  // Cold-weather pieces
  "Wool Coat": COOL,
  "Suede Jacket": [...SHOULDER, "Winter"],
  "Leather Jacket": [...SHOULDER, "Winter"],
  Overshirt: [...SHOULDER, "Winter"],
  Turtleneck: COOL,
  "Knit Top": COOL,
  "Flannel Shirt": COOL,
  "Knit Dress": COOL,
  "Knee-High Boots": COOL,
  "Ankle Boots": COOL,
  "Chelsea Boots": COOL,
  "Chukka Boots": COOL,
  Beanie: COOL,
  "Silk Scarf": [...SHOULDER, "Winter"],
  // Mid-season layers
  "Trench Coat": SHOULDER,
  "Denim Jacket": ["Spring", "Summer", "Fall"],
  "Bomber Jacket": SHOULDER,
  // Warm-weather pieces
  Shorts: WARM,
  "Mini Skirt": NOT_WINTER,
  "Slip Dress": NOT_WINTER,
  // Layered with tights/boots/a coat, these work in winter too.
  "Midi Dress": ["Spring", "Fall", "Winter", "Summer"],
  "Shirt Dress": ["Spring", "Fall", "Winter", "Summer"],
  "Wrap Dress": ["Spring", "Fall", "Winter", "Summer"],
  Sandals: WARM,
  "Heeled Sandals": NOT_WINTER,
  "Ballet Flats": NOT_WINTER,
  "Wide-Brim Hat": WARM,
  Sunglasses: ["Spring", "Summer", "Fall", "Winter"],
  Cap: NOT_WINTER,
  "Polo Shirt": NOT_WINTER,
  "T-Shirt": NOT_WINTER,
  Henley: NOT_WINTER,
};

export const catalog: Product[] = (raw as Product[]).map((p) => ({
  ...p,
  seasonTags: SEASONS_BY_SUBCATEGORY[p.subcategory] ?? ["All Season"],
}));

export function getProductById(id: string): Product | undefined {
  return catalog.find((p) => p.id === id);
}
