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
  photo,
  className = "",
  compact = false,
}: {
  product: Product;
  /** The shopper's own photo of this garment, when they own it. */
  photo?: string;
  className?: string;
  compact?: boolean;
}) {
  if (photo) {
    return (
      <div className={`relative overflow-hidden bg-white ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- the shopper's own photo, a data: URL */}
        <img src={photo} alt={product.name} className="w-full h-full object-cover" />
      </div>
    );
  }
  const hex = colorHex(product.primaryColor);
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden ${className}`}
      style={{ backgroundColor: "#ffffff", backgroundImage: `linear-gradient(155deg, ${hex} 0%, ${hex}cc 60%, ${hex}99 100%)` }}
    >
      <span style={{ color: textOn(hex) }} className="opacity-80">
        <CategoryIcon category={product.category} className={compact ? "w-6 h-6" : "w-14 h-14"} />
      </span>
      <span className="sr-only">{product.name}</span>
    </div>
  );
}
