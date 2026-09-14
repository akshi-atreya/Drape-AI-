import { v4 as uuid } from "uuid";
import {
  Category,
  Gender,
  Outfit,
  OutfitItem,
  Product,
  StyleTag,
  TrendTag,
} from "@/lib/types";

/**
 * Deterministic outfit scoring + construction engine.
 *
 * This is intentionally NOT an LLM call. The chat route uses an LLM only to
 * turn free text into the structured `OutfitRequest` below and to phrase the
 * final explanation copy — every decision about *which products go together*
 * happens here, over structured attributes, so results are explainable,
 * budget-safe, and reproducible.
 */

export interface OutfitRequest {
  /** Who to shop for. Null means unknown — callers should ask before generating outfits. */
  gender: Gender | null;
  budget: number | null;
  occasion: string | null;
  locationHint: string | null;
  styleTags: StyleTag[];
  trendLevel: number; // 0 classic .. 1 trendsetter
  colorsLike: string[];
  colorsAvoid: string[];
  brandsLike: string[];
  brandsAvoid: string[];
  season: string | null;
  ownedItemNames: string[];
  count: number;
}

export const defaultOutfitRequest: OutfitRequest = {
  gender: null,
  budget: null,
  occasion: null,
  locationHint: null,
  styleTags: [],
  trendLevel: 0.5,
  colorsLike: [],
  colorsAvoid: [],
  brandsLike: [],
  brandsAvoid: [],
  season: null,
  ownedItemNames: [],
  count: 3,
};

const NEUTRAL_COLORS = new Set([
  "cream", "black", "charcoal", "white", "beige", "ivory", "camel",
]);

interface Recipe {
  name: string;
  roles: Category[];
  shares: Partial<Record<Category, number>>;
}

const RECIPES: Recipe[] = [
  {
    name: "separates-jacket",
    roles: ["Tops", "Bottoms", "Jackets", "Shoes", "Bags"],
    shares: { Tops: 0.16, Bottoms: 0.22, Jackets: 0.32, Shoes: 0.2, Bags: 0.1 },
  },
  {
    name: "separates-light",
    roles: ["Tops", "Bottoms", "Shoes", "Accessories"],
    shares: { Tops: 0.28, Bottoms: 0.32, Shoes: 0.3, Accessories: 0.1 },
  },
  {
    name: "dress-jacket",
    roles: ["Dresses", "Jackets", "Shoes", "Bags"],
    shares: { Dresses: 0.4, Jackets: 0.28, Shoes: 0.22, Bags: 0.1 },
  },
  {
    name: "dress-simple",
    roles: ["Dresses", "Shoes", "Accessories"],
    shares: { Dresses: 0.62, Shoes: 0.28, Accessories: 0.1 },
  },
];

function effectivePrice(p: Product): number {
  return p.salePrice ?? p.price;
}

function trendIntensity(p: Product): number {
  const scores = Object.values(p.trendScores);
  if (scores.length === 0) return 0.15; // quietly-timeless baseline
  return scores.reduce((a, b) => a + (b ?? 0), 0) / scores.length;
}

export interface ScoredProduct {
  product: Product;
  score: number;
  breakdown: {
    style: number;
    color: number;
    occasion: number;
    trend: number;
    brand: number;
  };
}

export function scoreProduct(product: Product, req: OutfitRequest): ScoredProduct {
  // Style compatibility: overlap between requested style tags and the
  // product's tags. Neutral (0.55) when the user hasn't specified a style.
  let style = 0.55;
  if (req.styleTags.length > 0) {
    const overlap = product.styleTags.filter((t) => req.styleTags.includes(t)).length;
    style = overlap > 0 ? Math.min(1, 0.55 + overlap * 0.25) : 0.3;
  }

  // Color harmony: direct like/avoid signals dominate; otherwise neutrals
  // score reasonably well by default since they mix into more outfits.
  let color = 0.55;
  const productColors = [product.primaryColor, ...product.colors];
  if (req.colorsAvoid.some((c) => productColors.includes(c.toLowerCase()))) {
    color = 0.05;
  } else if (req.colorsLike.some((c) => productColors.includes(c.toLowerCase()))) {
    color = 1;
  } else if (NEUTRAL_COLORS.has(product.primaryColor)) {
    color = 0.6;
  }

  // Occasion fit.
  let occasion = 0.5;
  if (req.occasion) {
    const needle = req.occasion.toLowerCase();
    const hit = product.occasionTags.some((t) => t.toLowerCase() === needle || needle.includes(t.toLowerCase()));
    occasion = hit ? 1 : 0.4;
  }

  // Trend relevance: blend the user's trend level with how trend-driven the
  // piece is. A classic user (trendLevel -> 0) scores timeless pieces
  // highest; a trendsetter (trendLevel -> 1) scores trend-heavy pieces
  // highest.
  const intensity = trendIntensity(product);
  const trend = req.trendLevel * intensity + (1 - req.trendLevel) * (1 - intensity);

  // Brand/retailer preference.
  let brand = 0.6;
  const brandNeedle = product.brand.toLowerCase();
  const retailerNeedle = product.retailer.toLowerCase();
  if (req.brandsLike.some((b) => brandNeedle.includes(b.toLowerCase()) || retailerNeedle.includes(b.toLowerCase()))) {
    brand = 1;
  }

  const score =
    style * 0.3 + color * 0.2 + occasion * 0.2 + trend * 0.2 + brand * 0.1;

  return { product, score, breakdown: { style, color, occasion, trend, brand } };
}

function filterCatalog(catalog: Product[], req: OutfitRequest): Product[] {
  return catalog.filter((p) => {
    if (!p.availability) return false;
    if (req.gender && p.gender !== req.gender && p.gender !== "Unisex") return false;
    if (req.brandsAvoid.some((b) => p.brand.toLowerCase().includes(b.toLowerCase()) || p.retailer.toLowerCase().includes(b.toLowerCase()))) {
      return false;
    }
    if (req.season && req.season !== "All Season") {
      const seasonMatch = p.seasonTags.some((t) => t === req.season) || p.seasonTags.includes("All Season");
      if (!seasonMatch) return false;
    }
    return true;
  });
}

/** Picks the best-scoring product for a role within a price ceiling. */
export function pickBestForCategory(
  catalog: Product[],
  category: Category,
  req: OutfitRequest,
  opts: { maxPrice?: number; excludeIds?: Set<string>; forceSubcategory?: string; forceMaterial?: string } = {}
): ScoredProduct | null {
  let pool = catalog.filter((p) => p.category === category);
  if (opts.excludeIds) pool = pool.filter((p) => !opts.excludeIds!.has(p.id));
  if (opts.forceSubcategory) pool = pool.filter((p) => p.subcategory === opts.forceSubcategory);
  if (opts.forceMaterial) pool = pool.filter((p) => p.material === opts.forceMaterial);
  if (opts.maxPrice != null) {
    const withinBudget = pool.filter((p) => effectivePrice(p) <= opts.maxPrice!);
    if (withinBudget.length > 0) pool = withinBudget;
  }
  if (pool.length === 0) return null;

  const scored = pool.map((p) => scoreProduct(p, req)).sort((a, b) => b.score - a.score);
  return scored[0];
}

function buildOneOutfit(
  catalog: Product[],
  req: OutfitRequest,
  recipe: Recipe,
  excludeIds: Set<string>
): OutfitItem[] | null {
  const items: OutfitItem[] = [];
  const chosenIds = new Set(excludeIds);
  const budget = req.budget;

  for (const role of recipe.roles) {
    const share = recipe.shares[role] ?? 1 / recipe.roles.length;
    const maxPrice = budget != null ? budget * share * 1.3 : undefined;
    const best = pickBestForCategory(catalog, role, req, { maxPrice, excludeIds: chosenIds });
    if (!best) continue; // role unavailable in filtered catalog; skip gracefully
    items.push({ product: best.product, role });
    chosenIds.add(best.product.id);
  }

  return items.length >= 2 ? items : null;
}

/** If an outfit is over budget, swap the worst price/score item for a cheaper alternative. */
function optimizeToBudget(catalog: Product[], items: OutfitItem[], req: OutfitRequest): OutfitItem[] {
  if (req.budget == null) return items;
  const current = [...items];
  let total = current.reduce((sum, it) => sum + effectivePrice(it.product), 0);
  let guard = 0;

  while (total > req.budget && guard < current.length * 2) {
    guard++;
    // Find the item with the worst score-per-dollar to replace.
    let worstIdx = -1;
    let worstRatio = Infinity;
    current.forEach((it, idx) => {
      const s = scoreProduct(it.product, req).score;
      const ratio = s / Math.max(1, effectivePrice(it.product));
      if (ratio < worstRatio) {
        worstRatio = ratio;
        worstIdx = idx;
      }
    });
    if (worstIdx === -1) break;

    const role = current[worstIdx].role;
    const remainingBudgetForRole = req.budget - (total - effectivePrice(current[worstIdx].product));
    const excludeIds = new Set(current.map((it) => it.product.id));
    const replacement = pickBestForCategory(catalog, role, req, {
      maxPrice: Math.max(1, remainingBudgetForRole),
      excludeIds,
    });
    if (!replacement || effectivePrice(replacement.product) >= effectivePrice(current[worstIdx].product)) {
      break; // no cheaper option found
    }
    current[worstIdx] = { product: replacement.product, role };
    total = current.reduce((sum, it) => sum + effectivePrice(it.product), 0);
  }
  return current;
}

function outfitName(occasion: string | null, locationHint: string | null, index: number): string {
  const vibe = occasion ?? "Everyday";
  if (locationHint) return `${locationHint} ${vibe}`;
  return index === 0 ? vibe : `${vibe} — Option ${index + 1}`;
}

export function outfitTotal(items: OutfitItem[]): number {
  return Math.round(items.reduce((sum, it) => sum + effectivePrice(it.product), 0) * 100) / 100;
}

export function summarizeNotableTags(items: OutfitItem[]): { colors: string[]; trends: TrendTag[]; materials: string[] } {
  const colors = [...new Set(items.map((it) => it.product.primaryColor))];
  const trends = [...new Set(items.flatMap((it) => it.product.trendTags))];
  const materials = [...new Set(items.map((it) => it.product.material))];
  return { colors, trends, materials };
}

export function generateOutfits(catalog: Product[], req: OutfitRequest): Outfit[] {
  const filtered = filterCatalog(catalog, req);
  // The mock catalog has no menswear dresses — drop dress-based recipes
  // entirely rather than building outfits with a hole where the main piece
  // should be. Otherwise alternate dress/separates recipes for variety,
  // leading with whichever the style profile prefers.
  const preferDress = req.styleTags.includes("Feminine") || req.styleTags.includes("Romantic");
  const orderedRecipes =
    req.gender === "Men"
      ? [RECIPES[0], RECIPES[1]] // separates-jacket, separates-light
      : preferDress
      ? [RECIPES[2], RECIPES[0], RECIPES[3], RECIPES[1]]
      : [RECIPES[0], RECIPES[2], RECIPES[1], RECIPES[3]];

  const outfits: Outfit[] = [];
  const globallyUsed = new Set<string>();
  let recipeIdx = 0;

  while (outfits.length < req.count && recipeIdx < orderedRecipes.length * 2) {
    const recipe = orderedRecipes[recipeIdx % orderedRecipes.length];
    recipeIdx++;

    let items = buildOneOutfit(filtered, req, recipe, globallyUsed);
    if (!items) continue;
    items = optimizeToBudget(filtered, items, req);

    items.forEach((it) => globallyUsed.add(it.product.id));

    outfits.push({
      id: uuid(),
      name: outfitName(req.occasion, req.locationHint, outfits.length),
      occasion: req.occasion ?? "Everyday",
      items,
      totalPrice: outfitTotal(items),
      budget: req.budget,
      explanation: "", // filled in by the chat route using the LLM
    });
  }

  return outfits;
}

// ---------------------------------------------------------------------------
// Remix
// ---------------------------------------------------------------------------

export interface RemixInstruction {
  /** Roles the user explicitly wants kept untouched (e.g. "keep the shoes"). */
  lockRoles: Category[];
  /** Roles to specifically regenerate (e.g. "replace the jacket"). */
  targetRoles: Category[];
  styleShift: Partial<Record<StyleTag, number>>; // additive weight
  trendLevelDelta: number;
  cheaper: boolean;
  warmer: boolean;
  moreColor: boolean;
  forceSubcategory?: { role: Category; subcategory: string };
  brandFocus?: string;
}

export function remixOutfit(
  catalog: Product[],
  outfit: Outfit,
  instruction: RemixInstruction,
  baseReq: OutfitRequest
): Outfit {
  const req: OutfitRequest = {
    ...baseReq,
    trendLevel: Math.max(0, Math.min(1, baseReq.trendLevel + instruction.trendLevelDelta)),
    styleTags: [...new Set([...baseReq.styleTags, ...Object.keys(instruction.styleShift) as StyleTag[]])],
    brandsLike: instruction.brandFocus ? [instruction.brandFocus] : baseReq.brandsLike,
    colorsAvoid: instruction.moreColor
      ? [...baseReq.colorsAvoid, "cream", "black", "charcoal", "white", "beige", "ivory"]
      : baseReq.colorsAvoid,
  };

  const filtered = filterCatalog(catalog, req);
  const currentIds = new Set(outfit.items.map((it) => it.product.id));

  const rolesToChange =
    instruction.targetRoles.length > 0
      ? instruction.targetRoles
      : outfit.items.map((it) => it.role).filter((r) => !instruction.lockRoles.includes(r));

  const newItems: OutfitItem[] = outfit.items.map((it) => {
    if (instruction.lockRoles.includes(it.role)) return it;
    if (!rolesToChange.includes(it.role)) return it;

    const roleTotal = outfit.totalPrice;
    const currentPrice = catalog.find((p) => p.id === it.product.id)?.price ?? 0;
    const share = currentPrice / Math.max(1, roleTotal);
    const budgetCeiling =
      req.budget != null
        ? instruction.cheaper
          ? currentPrice * 0.8
          : req.budget * share * 1.4
        : undefined;

    const forceSub =
      instruction.forceSubcategory && instruction.forceSubcategory.role === it.role
        ? instruction.forceSubcategory.subcategory
        : undefined;
    const forceMaterial = instruction.warmer ? undefined : undefined;

    const best = pickBestForCategory(filtered, it.role, req, {
      maxPrice: instruction.cheaper ? Math.max(1, budgetCeiling ?? currentPrice) : budgetCeiling,
      excludeIds: currentIds,
      forceSubcategory: forceSub,
      forceMaterial,
    });

    return best ? { product: best.product, role: it.role } : it;
  });

  let optimized = newItems;
  if (req.budget != null) {
    optimized = optimizeToBudget(filtered, newItems, req);
  }

  return {
    ...outfit,
    id: uuid(),
    items: optimized,
    totalPrice: outfitTotal(optimized),
    budget: req.budget,
    explanation: "",
  };
}

/** Very small rule-based NLU for remix instructions — keeps the deterministic
 * layer in charge of *what changes*; the LLM is only used for phrasing. */
export function parseRemixInstruction(text: string): RemixInstruction {
  const t = text.toLowerCase();
  const lockRoles: Category[] = [];
  const targetRoles: Category[] = [];

  const roleKeywords: [string, Category][] = [
    ["jacket", "Jackets"], ["coat", "Jackets"], ["blazer", "Jackets"],
    ["shoe", "Shoes"], ["boot", "Shoes"], ["flat", "Shoes"], ["sneaker", "Shoes"], ["loafer", "Shoes"],
    ["top", "Tops"], ["shirt", "Tops"], ["blouse", "Tops"], ["knit", "Tops"],
    ["skirt", "Bottoms"], ["pant", "Bottoms"], ["trouser", "Bottoms"], ["jean", "Bottoms"],
    ["dress", "Dresses"],
    ["bag", "Bags"], ["tote", "Bags"], ["clutch", "Bags"],
    ["accessor", "Accessories"], ["jewelry", "Accessories"], ["belt", "Accessories"],
  ];

  for (const [kw, role] of roleKeywords) {
    if (t.includes(kw)) {
      if (t.includes(`keep the ${kw}`) || t.includes(`keep ${kw}`)) lockRoles.push(role);
      else if (t.includes("replace") || t.includes("swap") || t.includes("change") || t.includes("different") || t.includes("version with") || t.includes("give me a version")) targetRoles.push(role);
    }
  }

  const styleShift: Partial<Record<StyleTag, number>> = {};
  if (t.includes("casual")) styleShift["Streetwear"] = 1;
  if (t.includes("feminine")) styleShift["Feminine"] = 1;
  if (t.includes("romantic")) styleShift["Romantic"] = 1;
  if (t.includes("edgy")) styleShift["Edgy"] = 1;
  if (t.includes("classic")) styleShift["Classic"] = 1;
  if (t.includes("minimal")) styleShift["Minimal"] = 1;

  let trendLevelDelta = 0;
  if (t.includes("less trendy") || t.includes("more classic") || t.includes("more timeless")) trendLevelDelta = -0.35;
  if (t.includes("more trendy") || t.includes("trendier")) trendLevelDelta = 0.35;

  const cheaper = t.includes("cheaper") || t.includes("less expensive") || t.includes("lower budget");
  const warmer = t.includes("warmer") || t.includes("warm");
  const moreColor = t.includes("more color") || t.includes("colorful") || t.includes("add color");

  let forceSubcategory: RemixInstruction["forceSubcategory"];
  if (t.includes("jeans")) forceSubcategory = { role: "Bottoms", subcategory: "Straight Jeans" };

  const brandNames = ["zara", "h&m", "mango", "aritzia", "nordstrom", "asos"];
  const brandFocus = brandNames.find((b) => t.includes(b));

  // A generic "remix"/"something different" with no specifics leaves
  // targetRoles empty, which remixOutfit treats as "all non-locked roles".
  return {
    lockRoles,
    targetRoles,
    styleShift,
    trendLevelDelta,
    cheaper,
    warmer,
    moreColor,
    forceSubcategory,
    brandFocus,
  };
}
