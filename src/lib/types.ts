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
  name: string;
  category: Category;
  subcategory: string;
  price: number;
  salePrice: number | null;
  currency: "USD";
  /** Deterministic seed used to render a generated placeholder image. */
  imageSeed: string;
  primaryColor: string;
  productUrl: string;
  availability: boolean;
  sizes: string[];
  colors: string[];
  material: string;
  fit: string;
  silhouette: string;
  styleTags: StyleTag[];
  occasionTags: OccasionTag[];
  seasonTags: SeasonTag[];
  trendTags: TrendTag[];
  trendScores: Partial<Record<TrendTag, number>>;
}

export type TrendLevel = number; // 0 (classic) .. 1 (trendsetter)

export interface StyleProfile {
  styles: StyleTag[];
  trendLevel: TrendLevel;
  colorsLike: string[];
  colorsAvoid: string[];
  brandsLike: string[];
  brandsAvoid: string[];
  priceRange: [number, number] | null;
  fitPreferences: string[];
  favoriteCategories: Category[];
  avoidedCategories: Category[];
  occasions: OccasionTag[];
}

export const emptyStyleProfile: StyleProfile = {
  styles: [],
  trendLevel: 0.5,
  colorsLike: [],
  colorsAvoid: [],
  brandsLike: [],
  brandsAvoid: [],
  priceRange: null,
  fitPreferences: [],
  favoriteCategories: [],
  avoidedCategories: [],
  occasions: [],
};

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
  product?: Product;
  trendName?: string;
  savedAt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  outfits?: Outfit[];
  createdAt: string;
}

export interface Trend {
  id: string;
  name: TrendTag;
  season: string;
  heroColor: string;
  shortExplanation: string;
  whyTrending: string;
  howToWear: string;
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
