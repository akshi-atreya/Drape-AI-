import raw from "@/data/products.json";
import { Product } from "@/lib/types";

// The mock catalog stands in for a normalized multi-retailer product feed.
// Swap this import for a real API/database call later — everything else
// (recommendation engine, chat route, UI) depends only on Product[].
export const catalog: Product[] = raw as Product[];

export function getProductById(id: string): Product | undefined {
  return catalog.find((p) => p.id === id);
}
