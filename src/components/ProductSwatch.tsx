"use client";

import { useState } from "react";
import { Product } from "@/lib/types";
import { colorHex, textOn } from "@/lib/colors";
import { CategoryIcon } from "@/components/CategoryIcon";

/**
 * Real product photography in the mock catalog is a representative stock
 * photo (see scripts/fetch-product-images.mjs) — a real photo of "a
 * burgundy midi dress", not the exact SKU, since no such SKU exists. Falls
 * back to a generated color-wash + icon swatch when no photo was found for
 * a product, or if the photo fails to load.
 */
export function ProductSwatch({
  product,
  className = "",
  compact = false,
}: {
  product: Product;
  className?: string;
  compact?: boolean;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const hex = colorHex(product.primaryColor);
  const fg = textOn(hex);

  if (product.imageUrl && !imageFailed) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- external stock-photo URL, not a static/remote asset next/image is configured for */}
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover"
          onError={() => setImageFailed(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden ${className}`}
      style={{
        background: `linear-gradient(155deg, ${hex} 0%, ${hex}cc 60%, ${hex}99 100%)`,
      }}
    >
      <span style={{ color: fg }} className="opacity-80">
        <CategoryIcon category={product.category} className={compact ? "w-8 h-8" : "w-16 h-16"} />
      </span>
      <span className="sr-only">{product.name}</span>
    </div>
  );
}
