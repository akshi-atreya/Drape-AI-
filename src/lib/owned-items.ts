import { v4 as uuid } from "uuid";
import { comfortRangeFor } from "@/lib/catalog";
import { Category, CATEGORIES, FORMALITY_LEVELS, Formality, Gender, Product } from "@/lib/types";

/**
 * Pieces the shopper already owns — read from a photo they uploaded, or
 * described in chat. They become locked members of every outfit, so each
 * gets a Product-shaped record (flagged by its "owned-" id) with the fields
 * the engine and UI need; nothing about it is for sale or priced.
 */

export const OWNED_PREFIX = "owned-";
export const isOwnedProduct = (p: Product) => p.id.startsWith(OWNED_PREFIX);

export interface OwnedItemInput {
  /** e.g. "gold satin corset top" */
  name: string;
  category: Category;
  /** One of the catalog's piece types if it clearly matches, e.g. "Blouse". */
  subcategory?: string | null;
  color: string;
  material?: string | null;
  fit?: string | null;
  formality?: Formality | null;
  /** 1-based number of the photo (across the conversation) this item was read from. */
  photoIndex?: number | null;
}

const clean = (v: unknown, max: number) =>
  String(v ?? "").replace(/[^\p{L}\p{N}\s,'&()/-]/gu, "").replace(/\s+/g, " ").trim().slice(0, max);

/** Returns null if the model's description isn't usable (so we don't build around nonsense). */
export function makeOwnedProduct(
  input: Record<string, unknown>,
  gender: Gender | null,
  photoIds: string[]
): { product: Product; role: Category } | null {
  const category = input.category as Category;
  const name = clean(input.name, 70);
  const color = clean(input.color, 24).toLowerCase();
  if (!CATEGORIES.includes(category) || !name || !color) return null;

  const photoIndex = typeof input.photoIndex === "number" ? Math.floor(input.photoIndex) : null;
  const photoId = photoIndex != null && photoIndex >= 1 ? photoIds[photoIndex - 1] : undefined;
  const id = `${OWNED_PREFIX}${photoId ?? uuid()}`;

  const subcategory = clean(input.subcategory, 40) || name;
  const formality = FORMALITY_LEVELS.includes(input.formality as Formality) ? (input.formality as Formality) : "Smart Casual";

  const product: Product = {
    id,
    retailer: "Zara", // placeholder: owned pieces have no retailer
    brand: "",
    gender: gender ?? "Unisex",
    name: name.charAt(0).toUpperCase() + name.slice(1),
    category,
    subcategory,
    price: 0,
    salePrice: null,
    currency: "USD",
    imageSeed: id,
    imageUrl: null,
    primaryColor: color,
    productUrl: "",
    availability: true,
    sizes: [],
    colors: [color],
    material: clean(input.material, 30) || "as pictured",
    fit: clean(input.fit, 30) || "as pictured",
    silhouette: "as pictured",
    formality,
    styleTags: [],
    occasionTags: [],
    seasonTags: ["All Season"],
    comfortC: comfortRangeFor(subcategory),
    trendTags: [],
    trendScores: {},
  };
  return { product, role: category };
}
