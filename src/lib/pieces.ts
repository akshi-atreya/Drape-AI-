import { Product } from "@/lib/types";

/**
 * FitCast AI recommends garment *types* — "a charcoal satin blouse, cropped
 * cut" — never a specific retailer SKU. These helpers turn the internal
 * archetype record the engine ranks into the human description shown in
 * the UI, used for search links, and fed to the try-on model when the
 * shopper hasn't supplied their own photo of the piece.
 */

/** "regular" → "regular fit"; "wide fit" and "one size" stay as written. */
function fitLabel(fit: string): string {
  return /\b(fit|size)$/i.test(fit) ? fit : `${fit} fit`;
}

export function pieceTitle(product: Product): string {
  return product.name;
}

/** e.g. "regular fit · straight". The material field in the mock catalog is not reliable, so it is never shown or sent. */
export function pieceDetail(product: Product): string {
  return `${fitLabel(product.fit)} · ${product.silhouette}`;
}

/** Search phrase for finding this kind of piece, e.g. "charcoal blouse". */
export function pieceSearchQuery(product: Product): string {
  return `${product.primaryColor} ${product.subcategory}`.toLowerCase();
}

/** Plain-language description handed to the try-on model when there is no photo. */
export function pieceDescription(product: Product): string {
  return `${product.primaryColor} ${product.subcategory.toLowerCase()} (${fitLabel(product.fit)}, ${product.silhouette} silhouette)`;
}

/** Key for a shopper's chosen garment within an outfit. */
export function pickKey(outfitId: string, productId: string): string {
  return `${outfitId}:${productId}`;
}
