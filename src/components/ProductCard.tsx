"use client";

import { Product } from "@/lib/types";
import { ProductSwatch } from "@/components/ProductSwatch";
import { useAppStore } from "@/store/useAppStore";
import { getShopUrl } from "@/lib/locale";
import { formatPrice } from "@/lib/currency";

export function ProductCard({ product }: { product: Product }) {
  const countryCode = useAppStore((s) => s.countryCode);
  const fxRates = useAppStore((s) => s.fxRates);
  const price = product.salePrice ?? product.price;
  return (
    <a
      href={getShopUrl(product, countryCode)}
      target="_blank"
      rel="noopener noreferrer"
      className="group block"
    >
      <ProductSwatch
        product={product}
        className="w-full aspect-[3/4] rounded-xl group-hover:opacity-90 transition-opacity"
      />
      <div className="mt-2.5 space-y-0.5">
        <p className="text-sm text-charcoal truncate">{product.name}</p>
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray truncate">{product.brand}</p>
          <p className="text-xs text-charcoal shrink-0">
            {formatPrice(price, countryCode, fxRates)}
            {product.salePrice && (
              <span className="text-gray line-through ml-1">{formatPrice(product.price, countryCode, fxRates)}</span>
            )}
          </p>
        </div>
      </div>
    </a>
  );
}
