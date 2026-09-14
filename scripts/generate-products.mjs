// Generates a normalized mock product catalog across multiple "retailers",
// covering both women's and men's lines.
// Run with: node scripts/generate-products.mjs
// Output: src/data/products.json
//
// This stands in for a real multi-retailer product feed. The recommendation
// engine and UI only depend on the Product shape (see src/lib/types.ts), so
// swapping this for a live API later requires no changes elsewhere.

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Seeded PRNG so the catalog is stable across regenerations.
function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260913);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const pickN = (arr, n) => {
  const pool = [...arr];
  const out = [];
  for (let i = 0; i < n && pool.length; i++) {
    const idx = Math.floor(rand() * pool.length);
    out.push(pool.splice(idx, 1)[0]);
  }
  return out;
};
const chance = (p) => rand() < p;
const round2 = (n) => Math.round(n * 100) / 100;

const RETAILERS = {
  Zara: { brands: ["Zara"], priceMin: 25, priceMax: 99, tier: "mid" },
  "H&M": { brands: ["H&M", "H&M Studio"], priceMin: 12, priceMax: 69, tier: "value" },
  Mango: { brands: ["Mango"], priceMin: 29, priceMax: 119, tier: "mid" },
  Aritzia: {
    brands: ["Aritzia - Wilfred", "Aritzia - Babaton", "Aritzia - TNA"],
    priceMin: 48,
    priceMax: 228,
    tier: "premium",
  },
  Nordstrom: {
    brands: ["Nordstrom - BP.", "Nordstrom - Treasure & Bond", "Nordstrom - Halogen"],
    priceMin: 39,
    priceMax: 248,
    tier: "premium",
  },
  ASOS: {
    brands: ["ASOS DESIGN", "ASOS - Topshop", "ASOS - Pull&Bear"],
    priceMin: 18,
    priceMax: 89,
    tier: "value",
  },
};

// Category defs are keyed by gender since real subcategory names differ
// (e.g. "Blouse" vs "Flannel Shirt"). Dresses is women's-only.
const CATEGORY_DEFS = {
  Women: {
    Tops: {
      subcategories: ["Knit Top", "Blouse", "T-Shirt", "Button-Down Shirt", "Bodysuit", "Turtleneck"],
      materials: ["cotton", "silk", "linen", "knit", "satin"],
      fits: ["fitted", "relaxed", "oversized", "cropped", "regular"],
      silhouettes: ["straight", "boxy", "fitted", "flowy"],
    },
    Bottoms: {
      subcategories: ["Midi Skirt", "Mini Skirt", "Wide-Leg Trousers", "Straight Jeans", "Tailored Pants", "Pleated Skirt"],
      materials: ["denim", "wool", "cotton", "linen", "satin"],
      fits: ["high-rise", "relaxed", "tailored", "regular", "wide-leg"],
      silhouettes: ["straight", "A-line", "wide-leg", "structured"],
    },
    Dresses: {
      subcategories: ["Slip Dress", "Wrap Dress", "Midi Dress", "Shirt Dress", "Knit Dress"],
      materials: ["silk", "satin", "knit", "cotton", "linen"],
      fits: ["fitted", "relaxed", "regular", "flowy"],
      silhouettes: ["wrap", "A-line", "column", "flowy"],
    },
    Jackets: {
      subcategories: ["Suede Jacket", "Blazer", "Trench Coat", "Leather Jacket", "Denim Jacket", "Wool Coat"],
      materials: ["suede", "wool", "leather", "denim", "cotton"],
      fits: ["relaxed", "tailored", "oversized", "regular"],
      silhouettes: ["structured", "boxy", "straight", "fitted"],
    },
    Shoes: {
      subcategories: ["Loafers", "Ballet Flats", "Ankle Boots", "Heeled Sandals", "Sneakers", "Knee-High Boots"],
      materials: ["leather", "suede", "canvas", "satin"],
      fits: ["true to size", "narrow fit", "wide fit"],
      silhouettes: ["pointed toe", "round toe", "square toe", "almond toe"],
    },
    Bags: {
      subcategories: ["Tote", "Shoulder Bag", "Clutch", "Crossbody Bag"],
      materials: ["leather", "suede", "canvas", "vegan leather"],
      fits: ["one size"],
      silhouettes: ["structured", "slouchy", "boxy"],
    },
    Accessories: {
      subcategories: ["Belt", "Silk Scarf", "Sunglasses", "Jewelry Set", "Wide-Brim Hat"],
      materials: ["leather", "silk", "metal", "acetate"],
      fits: ["one size"],
      silhouettes: ["classic", "statement"],
    },
  },
  Men: {
    Tops: {
      subcategories: ["T-Shirt", "Polo Shirt", "Button-Down Shirt", "Henley", "Turtleneck", "Flannel Shirt"],
      materials: ["cotton", "linen", "knit", "flannel", "jersey"],
      fits: ["slim", "relaxed", "regular", "oversized"],
      silhouettes: ["straight", "boxy", "fitted", "regular"],
    },
    Bottoms: {
      subcategories: ["Chinos", "Straight Jeans", "Tailored Trousers", "Cargo Pants", "Shorts", "Wide-Leg Trousers"],
      materials: ["cotton", "denim", "wool", "linen", "twill"],
      fits: ["slim", "relaxed", "tailored", "regular", "wide-leg"],
      silhouettes: ["straight", "tapered", "wide-leg", "structured"],
    },
    Jackets: {
      subcategories: ["Bomber Jacket", "Blazer", "Overshirt", "Leather Jacket", "Denim Jacket", "Wool Coat"],
      materials: ["suede", "wool", "leather", "denim", "cotton"],
      fits: ["relaxed", "tailored", "oversized", "regular"],
      silhouettes: ["structured", "boxy", "straight", "fitted"],
    },
    Shoes: {
      subcategories: ["Sneakers", "Derby Shoes", "Loafers", "Chelsea Boots", "Sandals", "Chukka Boots"],
      materials: ["leather", "suede", "canvas", "rubber"],
      fits: ["true to size", "narrow fit", "wide fit"],
      silhouettes: ["round toe", "square toe", "low-top", "high-top"],
    },
    Bags: {
      subcategories: ["Backpack", "Messenger Bag", "Tote", "Crossbody Bag"],
      materials: ["leather", "canvas", "nylon", "vegan leather"],
      fits: ["one size"],
      silhouettes: ["structured", "slouchy", "boxy"],
    },
    Accessories: {
      subcategories: ["Belt", "Sunglasses", "Cap", "Watch", "Beanie"],
      materials: ["leather", "metal", "acetate", "wool"],
      fits: ["one size"],
      silhouettes: ["classic", "statement"],
    },
  },
};

const COLORS = [
  "cream", "black", "charcoal", "brown", "burgundy", "olive", "navy",
  "white", "beige", "camel", "blush", "sage", "rust", "ivory",
];

const STYLE_TAGS = [
  "Minimal", "Classic", "Feminine", "Streetwear", "Boho", "Sporty",
  "Romantic", "Edgy", "Preppy", "Quiet Luxury",
];

const OCCASION_TAGS = [
  "Date Night", "Work", "Wedding Guest", "Vacation", "Weekend", "Everyday", "Party", "Travel",
];

const SEASON_TAGS = ["Spring", "Summer", "Fall", "Winter", "All Season"];

const TREND_TAGS = [
  "Burgundy", "Suede", "Relaxed Tailoring", "Statement Accessories",
  "Ballet Flats", "Layering", "Western-Inspired", "Quiet Luxury", "Sheer", "Bold Shoulders",
];

// Maps a color/subcategory to trend tags it plausibly carries, so trend
// intelligence feels coherent rather than random.
function deriveTrendTags(color, subcategory, material) {
  const tags = [];
  if (color === "burgundy") tags.push("Burgundy");
  if (material === "suede") tags.push("Suede");
  if (["Blazer", "Wide-Leg Trousers", "Tailored Pants", "Tailored Trousers", "Wool Coat"].includes(subcategory)) tags.push("Relaxed Tailoring");
  if (["Jewelry Set", "Wide-Brim Hat", "Belt", "Sunglasses", "Watch", "Cap"].includes(subcategory)) tags.push("Statement Accessories");
  if (subcategory === "Ballet Flats") tags.push("Ballet Flats");
  if (["Turtleneck", "Wool Coat", "Knit Top", "Flannel Shirt"].includes(subcategory)) tags.push("Layering");
  if (["Suede Jacket", "Ankle Boots", "Knee-High Boots", "Chelsea Boots", "Chukka Boots"].includes(subcategory) && chance(0.4)) tags.push("Western-Inspired");
  if (chance(0.15)) tags.push("Quiet Luxury");
  if (material === "silk" && chance(0.3)) tags.push("Sheer");
  if (["Blazer", "Wool Coat"].includes(subcategory) && chance(0.25)) tags.push("Bold Shoulders");
  return [...new Set(tags)];
}

let idCounter = 1;
const products = [];

// Per-gender category targets. Dresses is women's-only. Kept modest so the
// combined catalog (women + men) lands in a realistic MVP range.
const TARGETS = {
  Women: { Tops: 26, Bottoms: 24, Dresses: 30, Jackets: 20, Shoes: 24, Bags: 14, Accessories: 14 },
  Men: { Tops: 26, Bottoms: 24, Jackets: 20, Shoes: 24, Bags: 14, Accessories: 14 },
};

// Aritzia doesn't sell menswear in real life — excluded from the men's pool
// so "Shop" links never point to a nonexistent Aritzia men's section.
const RETAILERS_BY_GENDER = {
  Women: Object.keys(RETAILERS),
  Men: Object.keys(RETAILERS).filter((r) => r !== "Aritzia"),
};

for (const gender of ["Women", "Men"]) {
  const defsForGender = CATEGORY_DEFS[gender];
  for (const [category, count] of Object.entries(TARGETS[gender])) {
    const def = defsForGender[category];
    for (let i = 0; i < count; i++) {
      const retailerName = pick(RETAILERS_BY_GENDER[gender]);
      const retailer = RETAILERS[retailerName];
      const brand = pick(retailer.brands);
      const subcategory = pick(def.subcategories);
      const color = pick(COLORS);
      const material = pick(def.materials);
      const fit = pick(def.fits);
      const silhouette = pick(def.silhouettes);

      const basePrice = retailer.priceMin + rand() * (retailer.priceMax - retailer.priceMin);
      const price = round2(basePrice);
      const onSale = chance(0.25);
      const salePrice = onSale ? round2(price * (1 - (0.15 + rand() * 0.25))) : null;

      const styleTags = pickN(STYLE_TAGS, 1 + Math.floor(rand() * 2));
      const occasionTags = pickN(OCCASION_TAGS, 1 + Math.floor(rand() * 2));
      const seasonTags = chance(0.3) ? ["All Season"] : pickN(SEASON_TAGS.filter((s) => s !== "All Season"), 1 + Math.floor(rand() * 2));
      const trendTags = deriveTrendTags(color, subcategory, material);
      const trendScores = {};
      for (const t of trendTags) {
        trendScores[t] = round2(0.55 + rand() * 0.4);
      }

      const colorLabel = color.charAt(0).toUpperCase() + color.slice(1);
      const name = `${colorLabel} ${subcategory}`;

      const id = `p${String(idCounter).padStart(4, "0")}`;
      idCounter++;

      const sizes =
        category === "Shoes"
          ? gender === "Men"
            ? ["8", "8.5", "9", "9.5", "10", "10.5", "11", "12"]
            : ["6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5", "10"]
          : category === "Bags" || category === "Accessories"
          ? ["One Size"]
          : gender === "Men"
          ? ["XS", "S", "M", "L", "XL", "XXL"]
          : ["XS", "S", "M", "L", "XL"];

      // A handful of accessory/bag subcategories are genuinely unisex.
      const unisexEligible = ["Belt", "Sunglasses", "Tote", "Crossbody Bag", "Backpack"];
      const productGender = unisexEligible.includes(subcategory) && chance(0.4) ? "Unisex" : gender;

      products.push({
        id,
        retailer: retailerName,
        brand,
        gender: productGender,
        name,
        category,
        subcategory,
        price,
        salePrice,
        currency: "USD",
        imageSeed: id,
        primaryColor: color,
        productUrl: `https://www.${retailerName.toLowerCase().replace("&", "and")}.com/products/${id}`,
        availability: chance(0.94),
        sizes,
        colors: chance(0.3) ? [color, pick(COLORS)] : [color],
        material,
        fit,
        silhouette,
        styleTags,
        occasionTags,
        seasonTags,
        trendTags,
        trendScores,
      });
    }
  }
}

writeFileSync(
  join(__dirname, "..", "src", "data", "products.json"),
  JSON.stringify(products, null, 2)
);

const women = products.filter((p) => p.gender === "Women").length;
const men = products.filter((p) => p.gender === "Men").length;
const unisex = products.filter((p) => p.gender === "Unisex").length;
console.log(`Generated ${products.length} products (Women ${women}, Men ${men}, Unisex ${unisex}) -> src/data/products.json`);
