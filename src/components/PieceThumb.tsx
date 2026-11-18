"use client";

import { Product } from "@/lib/types";
import { colorHex, textOn } from "@/lib/colors";
import { CategoryIcon } from "@/components/CategoryIcon";

/**
 * A clean chip in the piece's color with its category icon. (Per-piece stock
 * photos were removed: they kept showing the wrong garment or color — the
 * outfit's single illustrative image carries the visual idea instead.)
 */
export function PieceThumb({
  product,
  className = "",
  compact = false,
}: {
  product: Product;
  className?: string;
  compact?: boolean;
}) {
  const hex = colorHex(product.primaryColor);
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden ${className}`}
      style={{ background: `linear-gradient(155deg, ${hex} 0%, ${hex}cc 60%, ${hex}99 100%)` }}
    >
      <span style={{ color: textOn(hex) }} className="opacity-80">
        <CategoryIcon category={product.category} className={compact ? "w-6 h-6" : "w-14 h-14"} />
      </span>
      <span className="sr-only">{product.name}</span>
    </div>
  );
}
