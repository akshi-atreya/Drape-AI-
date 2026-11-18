// Core domain types shared across the app.
// The product shape mirrors a normalized multi-retailer catalog so a real
// retailer feed/API can be swapped in later without touching the UI or the
// recommendation engine.

export type Category =
  | "Tops"
  | "Bottoms"
  | "Dresses"
  | "Jackets"
  | "Shoes"
  | "Bags"
  | "Accessories";

export type Retailer =
  | "Zara"
  | "H&M"
  | "Mango"
  | "Aritzia"
  | "Nordstrom"
  | "ASOS";

/** Who a product/outfit is designed for. "Unisex" items are shown to either. */
export type Gender = "Women" | "Men" | "Unisex";

export type StyleTag =
  | "Minimal"
  | "Classic"
  | "Feminine"
  | "Streetwear"
  | "Boho"
  | "Sporty"
  | "Romantic"
  | "Edgy"
  | "Preppy"
  | "Quiet Luxury";

export type OccasionTag =
  | "Date Night"
  | "Work"
  | "Wedding Guest"
  | "Vacation"
  | "Weekend"
  | "Everyday"
  | "Party"
  | "Travel";

export type SeasonTag = "Spring" | "Summer" | "Fall" | "Winter" | "All Season";

/** How dressy a piece reads, ordered low -> high. Drives occasion fit. */
export type Formality = "Casual" | "Smart Casual" | "Dressy" | "Formal";
export const FORMALITY_LEVELS: Formality[] = ["Casual", "Smart Casual", "Dressy", "Formal"];
export const FORMALITY_ORDER: Record<Formality, number> = {
  Casual: 0,
  "Smart Casual": 1,
  Dressy: 2,
  Formal: 3,
};

export type TrendTag =
  | "Burgundy"
  | "Suede"
  | "Relaxed Tailoring"
  | "Statement Accessories"
  | "Ballet Flats"
  | "Layering"
  | "Western-Inspired"
  | "Quiet Luxury"
  | "Sheer"
  | "Bold Shoulders";

export const CATEGORIES: Category[] = [
  "Tops", "Bottoms", "Dresses", "Jackets", "Shoes", "Bags", "Accessories",
];

export const RETAILERS: Retailer[] = [
  "Zara", "H&M", "Mango", "Aritzia", "Nordstrom", "ASOS",
];

export const GENDERS: Gender[] = ["Women", "Men", "Unisex"];

export const STYLE_TAGS: StyleTag[] = [
  "Minimal", "Classic", "Feminine", "Streetwear", "Boho", "Sporty",
  "Romantic", "Edgy", "Preppy", "Quiet Luxury",
];

export const OCCASION_TAGS: OccasionTag[] = [
  "Date Night", "Work", "Wedding Guest", "Vacation", "Weekend", "Everyday", "Party", "Travel",
];

export const SEASON_TAGS: SeasonTag[] = ["Spring", "Summer", "Fall", "Winter", "All Season"];

export const TREND_TAGS: TrendTag[] = [
  "Burgundy", "Suede", "Relaxed Tailoring", "Statement Accessories",
  "Ballet Flats", "Layering", "Western-Inspired", "Quiet Luxury", "Sheer", "Bold Shoulders",
];

export interface Product {
  id: string;
  retailer: Retailer;
  brand: string;
  gender: Gender;
  name: string;
  category: Category;
  subcategory: string;
  price: number;
  salePrice: number | null;
  currency: "USD";
  /** Deterministic seed used to render a generated placeholder image (fallback when imageUrl is null). */
  imageSeed: string;
  /** A real, representative stock photo for this color+subcategory (not the exact SKU — see fetch-product-images.mjs). Null until fetched, or if no good match was found. */
  imageUrl: string | null;
  primaryColor: string;
  productUrl: string;
  availability: boolean;
  sizes: string[];
  colors: string[];
  material: string;
  fit: string;
  silhouette: string;
  formality: Formality;
  styleTags: StyleTag[];
  occasionTags: OccasionTag[];
  seasonTags: SeasonTag[];
  trendTags: TrendTag[];
  trendScores: Partial<Record<TrendTag, number>>;
}

export type TrendLevel = number; // 0 (classic) .. 1 (trendsetter)

export interface StyleProfile {
  /** Who the stylist is shopping for. Null = not yet asked. */
  gender: Gender | null;
  styles: StyleTag[];
  trendLevel: TrendLevel;
  colorsLike: string[];
  colorsAvoid: string[];
  fitPreferences: string[];
  favoriteCategories: Category[];
  avoidedCategories: Category[];
  occasions: OccasionTag[];
}

export const emptyStyleProfile: StyleProfile = {
  gender: null,
  styles: [],
  trendLevel: 0.5,
  colorsLike: [],
  colorsAvoid: [],
  fitPreferences: [],
  favoriteCategories: [],
  avoidedCategories: [],
  occasions: [],
};

/**
 * A real garment the shopper chose themselves — a product photo pulled from
 * a link they pasted, or an image they uploaded. FitCast recommends piece
 * *types*; the shopper supplies the actual item, and try-on uses its photo.
 */
export type BodyBuild = "Slim" | "Average" | "Athletic" | "Curvy" | "Plus-size";
export const BODY_BUILDS: BodyBuild[] = ["Slim", "Average", "Athletic", "Curvy", "Plus-size"];

/**
 * Optional hints that shape the try-on image. null = "match my photo": the
 * model keeps whatever the photo shows instead of being told what to render.
 */
export interface TryOnPrefs {
  gender: "Women" | "Men" | null;
  build: BodyBuild | null;
  /** Free text, e.g. 5'6" or 168 cm. Empty = not provided. */
  height: string;
}

export const emptyTryOnPrefs: TryOnPrefs = { gender: null, build: null, height: "" };

export interface GarmentPick {
  imageDataUrl: string;
  /** Page the garment came from, if it was added by link. */
  sourceUrl?: string;
  title?: string;
}

export interface OutfitItem {
  product: Product;
  role: Category;
}

export interface Outfit {
  id: string;
  name: string;
  occasion: string;
  items: OutfitItem[];
  totalPrice: number;
  budget: number | null;
  explanation: string;
  scoreBreakdown?: {
    styleCompatibility: number;
    colorHarmony: number;
    occasionFit: number;
    trendRelevance: number;
    budgetFit: number;
  };
}

export interface WardrobeItem {
  id: string;
  name: string;
  category: Category;
  color: string;
  addedAt: string;
}

export interface SavedLook {
  id: string;
  type: "outfit" | "product" | "trend";
  outfit?: Outfit;
  /** The shopper's chosen garments for this outfit, keyed by product id. */
  picks?: Record<string, GarmentPick>;
  /** The illustrative image generated for this outfit (JPEG data URL). */
  image?: string;
  product?: Product;
  trendName?: string;
  savedAt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  outfits?: Outfit[];
  /** Tap-to-reply options offered with a question the stylist asked. */
  quickReplies?: string[];
  createdAt: string;
}

/** A published article a trend was drawn from — shown as attribution with a link back. */
export interface TrendSource {
  outlet: string;
  title: string;
  url: string;
}

export interface Trend {
  id: string;
  name: string;
  season: string;
  heroColor: string;
  shortExplanation: string;
  whyTrending: string;
  howToWear: string;
  /** Catalog piece types (subcategories) that express this trend, e.g. "Wool Coat". Drives recommendations. */
  pieceTypes?: string[];
  /** Catalog color names tied to this trend. */
  colors?: string[];
  /** 0–1: how prominent the trend is right now. */
  strength?: number;
  sources?: TrendSource[];
}

export interface NewsArticle {
  id: string;
  headline: string;
  category:
    | "Runway"
    | "Celebrity Style"
    | "Street Style"
    | "Retail"
    | "Designer News"
    | "Beauty"
    | "Emerging Trends";
  source: string;
  date: string;
  summary: string;
  heroColor: string;
  url: string;
}
